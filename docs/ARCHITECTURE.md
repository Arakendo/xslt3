# Architecture

> Status: design draft. Decisions here are **pinned** — change with intent, not
> drift. Update this file when a decision changes.

## 1. Goals & non-goals

### Goals
- **XSLT 3.0** basic-conformance engine in TypeScript
- **XPath 3.1** engine written from scratch (no external XPath dependency)
- Works in **Node 20+** and modern browsers (no Node-only APIs in core)
- Deterministic, testable, well-typed
- Usable as a library (`@arakendo/xslt`) — not a CLI-first tool

### Non-goals (for now)
- Streaming (XSLT 3.0 streamability) — design should not *preclude* it, but
  we will not build it in the first milestone
- Schema-aware processing (XSD-typed data)
- XQuery 3.1
- XSLT 1.0 bug-compat mode
- Extension instructions / vendor extensions

## 2. High-level layers

```
 Source XML + Stylesheet XML
           │
           ▼
 ┌─────────────────────┐
 │ 1. XML Parser       │  @xmldom/xmldom  →  DOM
 └─────────────────────┘
           │
           ▼
 ┌─────────────────────┐
 │ 2. Stylesheet       │  DOM → StylesheetIR
 │    Compiler         │  (templates, modes, variables, keys, …)
 └─────────────────────┘
           │
           │  ── XPath lives *inside* instructions ──
           ▼
 ┌─────────────────────┐      ┌───────────────────────┐
 │ 3. Transform        │ ───► │  XPath 3.1 Engine     │
 │    Evaluator        │ ◄─── │  (lex → parse → eval) │
 └─────────────────────┘      └───────────────────────┘
           │
           ▼
 ┌─────────────────────┐
 │ 4. Result Builder   │  XDM → DOM / string
 │    + Serializer     │
 └─────────────────────┘
           │
           ▼
    Primary + secondary result documents
```

## 3. Pinned decisions

### DEC-001 — XML parser: `@xmldom/xmldom`
W3C-DOM compatible, pure-JS, works in Node & browser. Alternative was
`sax`/`saxes` (streaming) — rejected for M1 since we're not streaming yet.
Wrapped in a thin `parseXml(source): Document` helper so we can swap later.

### DEC-002 — Node model: **wrap DOM, do not copy**
XSLT operates on the XDM (XPath Data Model). XDM is *not* DOM:

- DOM has adjacent text nodes; XDM text nodes are merged
- DOM exposes namespace nodes differently
- XDM has typed values; DOM does not
- Attribute order, namespace axis, id-ness — all differ

We will implement a **`XdmNode` adapter** layer over DOM nodes (lazy,
non-copying). Internal methods in the engine talk to `XdmNode`, never raw
DOM. Conversion happens at the boundary.

Rationale: copying a large input document doubles memory and is slow.
Adapter layer preserves the option to swap in a native tree later.

### DEC-003 — XPath engine: **hand-rolled, owned in-tree**
Rejected: `fontoxpath` (MIT, mature). Chosen: build our own under
`src/xpath/`. Reasons:

- Full control over evaluation model (needed for future streaming)
- No runtime dependency on a 2 MB library
- Learning goal of the project

Accepts the cost: ~17–24 focused weeks of XPath work before XSLT layer
benefits. Documented in README as a scope risk.

### DEC-004 — Parser style: **recursive descent + Pratt for expressions**
- Statement/path structure → recursive descent
- Binary/unary operator precedence → Pratt parser
- Hand-written, no parser generator
- AST nodes are plain, discriminated unions keyed on `kind`

### DEC-005 — Intermediate Representation
Stylesheet compilation produces a `StylesheetIR`: a plain-data tree of
**instruction objects** keyed by `kind` (`'literal-result-element'`,
`'apply-templates'`, `'value-of'`, `'choose'`, `'for-each'`, …).

Evaluator walks the IR, **never the DOM** of the stylesheet. This makes
the engine testable, serializable, and streamable later.

XPath expressions inside instructions are **pre-parsed once at compile
time** into XPath ASTs and embedded in the IR. No re-parsing per call.

### DEC-006 — Sequences: lazy iterators
Sequences are represented as `Iterable<XdmItem>` internally, not arrays.
A materialized `Sequence` class is provided for cases that need count /
indexed access. Rationale: `1 to 1_000_000` must not allocate 1M ints.

### DEC-007 — Error model: `XdmError` with codes
One error class hierarchy:

```
XdmError (base)
 ├─ XPathError     (XPST*/XPDY*/XPTY* codes)
 ├─ XsltError      (XTSE*/XTDE* codes)
 └─ SerializationError (SE* codes)
```

Every throw sets a W3C error code. Static/parse-time errors include
source location; dynamic errors include XPath location when available.

### DEC-008 — Regex: **Schema regex translator**
XPath regex is XML-Schema flavor (with XPath extensions). We will
translate to ECMAScript regex at parse time. Module: `src/xpath/regex/`.
Not a user-facing API.

### DEC-009 — Collations: Unicode codepoint only for M1
Default collation is `http://www.w3.org/2005/xpath-functions/collation/codepoint`.
`Intl.Collator`-backed locale collations are a later milestone.

### DEC-010 — Testing strategy (three tiers)
1. **Unit tests** next to implementation (`foo.test.ts`)
2. **Golden tests** — `test/golden/<name>/{input.xml, stylesheet.xsl, expected.xml}` with one generic runner
3. **Conformance** — git submodule `w3c/xslt30-test`, reporting pass/fail
   percentage. Initially all expected to fail; number should only ever
   go up.

### DEC-011 — Module layout
ESM only. Everything under `src/`:

```
src/
  index.ts                 # public API only
  version.ts

  errors/                  # DEC-007
    XdmError.ts
    XPathError.ts
    XsltError.ts
    codes.ts               # all W3C codes as consts

  xml/
    parse.ts               # parseXml(source, baseUri?) → Document
    serialize.ts

  xdm/                     # DEC-002, DEC-006
    types.ts               # XdmItem | XdmAtomic | XdmNode | XdmFunction
    atomic/                # xs:string, xs:integer, xs:date, ...
    node/                  # XdmNode adapter over DOM
    sequence.ts            # lazy sequence helpers
    map.ts                 # XDM map
    array.ts               # XDM array

  xpath/                   # DEC-003
    lex/
      lexer.ts
      tokens.ts
    parse/                 # DEC-004
      parser.ts
      ast.ts
      pratt.ts
    eval/
      evaluator.ts
      context.ts           # static + dynamic context
      focus.ts
    fn/                    # DEC-005 function library
      string.ts
      numeric.ts
      sequence.ts
      node.ts
      datetime.ts
      map.ts
      array.ts
      higher-order.ts
      registry.ts
    regex/                 # DEC-008
      translate.ts
    types/
      sequence-type.ts
      promote.ts
      cast.ts

  xslt/
    compile/               # DEC-005 stylesheet → IR
      compiler.ts
      ir.ts                # all instruction kinds
    eval/
      transform.ts
      rule-matcher.ts      # template match priority
      modes.ts
    fn/                    # XSLT-specific fns (current-group, etc.)

  processor/               # public orchestration
    XsltProcessor.ts
    types.ts

  util/
    qname.ts
    uri.ts
```

### DEC-012 — Public API surface
Keep tiny and stable:

```ts
import { XsltProcessor } from '@arakendo/xslt';

const proc = new XsltProcessor(stylesheetXml);
const { output } = proc.transform(sourceXml, { parameters: { foo: 1 } });
```

Everything else is internal. No deep imports from consumers.

## 4. Milestones

| M | Goal | Exit criteria |
|---|------|---------------|
| **M0** | Scaffold (this commit) | Typecheck + 3 smoke tests pass |
| **M1** | XPath vertical slice | Parse & evaluate `1 + 2`, `//foo`, `foo/bar[1]` — 20 hand-picked tests pass |
| **M2** | XPath core | All axes, predicates, value/general/node comparisons, `if/for/let/some/every`, ~40 fn:* functions. Target: 20% of XPath conformance. |
| **M3** | XSLT MVP | `xsl:template`, `xsl:apply-templates`, `xsl:value-of`, `xsl:for-each`, `xsl:choose`, `xsl:variable`, literal result elements. First real stylesheet renders. |
| **M4** | XPath type system + maps/arrays | `cast as`, `instance of`, SequenceTypes, maps, arrays, higher-order functions |
| **M5** | XSLT 3.0 feature-complete (non-streaming) | `xsl:accumulator`, `xsl:iterate`, `xsl:merge`, packages, modes, keys |
| **M6** | Conformance push | ≥70% of XSLT 3.0 required tests passing |
| **M7+** | Streaming (if ever) | — |

Time estimates intentionally omitted.

## 5. Open questions

- Do we expose the parsed IR as a public API? (Probably not — keeps us free.)
- How do we handle `xsl:result-document` in the browser? (Return a map; let the caller decide what to do with it.)
- BigInt for `xs:integer`? (Spec says arbitrary precision. Probably yes eventually; `number` for M1.)
- Worker-based parallel evaluation? (Deferred indefinitely.)

## 6. References

- XSLT 3.0: https://www.w3.org/TR/xslt-30/
- XPath 3.1: https://www.w3.org/TR/xpath-31/
- XPath/XQuery Functions & Operators 3.1: https://www.w3.org/TR/xpath-functions-31/
- XDM 3.1: https://www.w3.org/TR/xpath-datamodel-31/
- XSLT 3.0 test suite: https://github.com/w3c/xslt30-test
- QT3 test suite: https://github.com/w3c/qt3tests
