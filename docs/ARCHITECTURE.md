# Architecture

> Status: design draft. Decisions here are **pinned** — change with intent, not
> drift. Update this file when a decision changes.
>
> See [DIFFERENTIATORS.md](./DIFFERENTIATORS.md) for the *why*. This file is
> the *how*.

## 1. Goals & non-goals

### Thesis (one sentence)
`@arakendo/xslt` is a **TypeScript-native XSLT compiler** that emits
inspectable, typed, debuggable transform modules. An interpreter backend
exists for conformance testing and dynamic features; the codegen backend
is the product.

### Goals
- **XSLT 3.0** basic-conformance engine in TypeScript
- **XPath 3.1** engine written from scratch (no external XPath dependency)
- **Two backends**: interpreter (reference) and codegen (product), sharing
  one IR
- **Debuggability first**: every IR + AST node carries source locations;
  every error names the file, line, column, and stylesheet context; the
  codegen emits human-readable TS with source maps
- **Compile-time diagnostics** over runtime surprises wherever possible
- **Typed integration**: typed params, typed extension functions, typed
  result shapes when feasible
- Works in **Node 20+** and modern browsers (no Node-only APIs in core)
- Usable as a library (`@arakendo/xslt`) and as a build step
  (`npx arakendo-xslt compile stylesheet.xsl`)

### Non-goals (for now)
- Streaming (XSLT 3.0 streamability) — design should not *preclude* it, but
  we will not build it in the first milestone. A practical streaming
  *subset* (forward-only, explicit opt-in) is in scope later.
- Schema-aware processing (XSD-typed data)
- XQuery 3.1
- XSLT 1.0 bug-compat mode
- Extension instructions / vendor extensions
- `xsl:evaluate` under the codegen backend (supported under interpreter only)
- Saxon-compatibility as a marketing promise

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
 │ 2. Stylesheet       │  DOM → StylesheetIR  (plain data, source-located)
 │    Compiler         │
 └─────────────────────┘
           │
           │  ── XPath lives *inside* instructions ──
           ▼
 ============== IR is the contract ==============
           │                 │
   ┌────────────────────┴────────────────┐
   ▼                                         ▼
 ┌─────────────────────┐                 ┌──────────────────────┐
 │ 3a. Interpreter     │                 │ 3b. Codegen backend    │
 │     backend         │                 │     IR → TypeScript     │
 │   (reference impl)  │                 │   (product output)     │
 └─────────────────────┘                 └──────────────────────┘
           │                                         │
   both call into XPath engine                  generated code calls
           │                                  shared runtime helpers
           ▼                                         │
 ┌─────────────────────┐                                    │
 │ XPath 3.1 Engine    │  ◄───────────────────────────────────────┘
 │ (lex → parse → eval)│
 └─────────────────────┘
           │
           ▼
 ┌─────────────────────┐
 │ 4. Result Builder   │  XDM → DOM / string (shared by both backends)
 │    + Serializer     │
 └─────────────────────┘
           │
           ▼
    Primary + secondary result documents
```

**Conformance tests run against both backends** to guarantee semantic
parity. A feature is not "done" until both pass.

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

### DEC-005 — Intermediate Representation (the contract)
Stylesheet compilation produces a `StylesheetIR`: a plain-data tree of
**instruction objects** keyed by `kind` (`'literal-result-element'`,
`'apply-templates'`, `'value-of'`, `'choose'`, `'for-each'`, …).

The IR is the contract between the compiler and **all backends**
(interpreter, codegen, future optimizers, debugger tooling).
It must be:

1. **Pure, JSON-serializable data.** No DOM refs, no closures, no cycles.
2. **Source-located exhaustively.** Every node carries
   `{ source, line, column, length }`. Non-negotiable — see DEC-013.
3. **Semantically annotated** by a static-analysis pass: `purity`,
   `streamability`, `mayThrow`, `refersToContext`, `referencedNames`.
   Backends query these rather than recomputing them.
4. **Versioned.** Adding a node kind = minor bump. Changing a shape =
   major bump. External tools may consume the IR.

If the codegen backend can't be written as a (mostly) pure function
`IR → string`, the IR is doing too little. Fix the IR, not the backend.

XPath expressions inside instructions are **pre-parsed once at compile
time** into XPath ASTs and embedded in the IR. No re-parsing per call.

### DEC-006 — Sequences: lazy iterators
Sequences are represented as `Iterable<XdmItem>` internally, not arrays.
A materialized `Sequence` class is provided for cases that need count /
indexed access. Rationale: `1 to 1_000_000` must not allocate 1M ints.

### DEC-007 — Error model: `XdmError` with codes *and context*
One error class hierarchy:

```
XdmError (base)
 ├─ XPathError     (XPST*/XPDY*/XPTY* codes)
 ├─ XsltError      (XTSE*/XTDE* codes)
 └─ SerializationError (SE* codes)
```

Every throw sets a W3C error code. Static/parse-time errors include
source location; dynamic errors include XPath location **and** a call
stack of IR nodes (template, instruction) that led to the failure.

An error message is not considered acceptable unless it identifies:
- the W3C code
- a human-friendly description
- the stylesheet file, line, and column
- the containing template (and its source location)
- where possible, the caller chain (which `apply-templates` invoked this)
- where possible, a "did you mean" suggestion

See DEC-013 and [DIFFERENTIATORS.md](./DIFFERENTIATORS.md) D1.

### DEC-013 — Diagnostics-first, always
This project's reason to exist is better XSLT ergonomics. Therefore:

1. **Source locations propagate everywhere.** XML parser → stylesheet
   AST → IR → codegen output → runtime errors. Losing locations is a
   bug, not a simplification.
2. **Compile-time > runtime** for diagnostics. Static analysis passes
   catch typos, unreachable templates, priority conflicts, obvious
   type mismatches, unused variables before the user runs anything.
3. **Codegen emits source maps** (`.xsl.map`) so browser debuggers
   step through the user's XSLT, not the generated JS.
4. **No feature is done with poor errors.** A feature that passes its
   happy-path tests but produces `XPTY0004: type mismatch` at runtime
   for simple misuse is incomplete.

### DEC-014 — Codegen backend: TypeScript source, not bytecode
The codegen backend emits **plain TypeScript source** (`.xsl.ts`) plus a
`.d.ts`. Rejected alternatives:

- **Bytecode / SEF-style binary** — opaque, unreviewable in PRs, needs
  a VM. Good for Saxon-JS's use case (hide the IR). Bad for ours.
- **`new Function(...)` only** — forfeits bundlers, typing, debugging.
  Will be supported as a secondary mode for dynamic compilation, not
  as the primary output.
- **Emitting via TypeScript Compiler API `ts.factory.*`** — considered
  for phase 2 once the string-templated emitter stabilizes. First
  emitter is a string-based template for simplicity and readability
  of the output.

Generated code imports from `@arakendo/xslt/runtime` for shared helpers
(writer, XPath primitives, template dispatcher, XDM operations). The
runtime is a separate subpath export so projects can bundle *only* the
runtime without the compiler.

### DEC-015 — Extension functions: typed bindings
Users register extension functions with TypeScript signatures:

```ts
defineXsltFunctions('app', {
  formatCurrency(amount: number, locale: string): string { … }
});
```

The compiler type-checks XPath calls to `app:formatCurrency(...)` at
compile time. Runtime invocations bypass XDM coercion when static types
match. A `<ts:eval>` escape hatch is planned (DIFFERENTIATORS D4) but
deferred until the core codegen is stable.

### DEC-008 — Regex: **Schema regex translator**
XPath regex is XML-Schema flavor (with XPath extensions). We will
translate to ECMAScript regex at parse time. Module: `src/xpath/regex/`.
Not a user-facing API.

### DEC-009 — Collations: Unicode codepoint only for M1
Default collation is `http://www.w3.org/2005/xpath-functions/collation/codepoint`.
`Intl.Collator`-backed locale collations are a later milestone.

### DEC-010 — Testing strategy (three tiers, two backends)
1. **Unit tests** next to implementation (`foo.test.ts`)
2. **Golden tests** — `test/golden/<name>/{input.xml, stylesheet.xsl, expected.xml}` with one generic runner; **runs each case under both backends** and asserts equal output
3. **Conformance** — git submodules `w3c/xslt30-test` and `w3c/qt3tests`;
   reports pass/fail percentage for each suite under each backend.
   Initially all expected to fail; number should only ever go up.

The rule: a feature is considered landed only when it passes the same
tests under both the interpreter and the codegen backends. This keeps
the two implementations honest and catches IR gaps early.

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
      analyze.ts           # static-analysis passes (purity, streamability, diagnostics)
    eval/                  # interpreter backend (DEC-014)
      transform.ts
      rule-matcher.ts      # template match priority
      modes.ts
    codegen/               # codegen backend (DEC-014)
      emit.ts              # IR → TypeScript string
      emit-types.ts        # IR → .d.ts for typed params
      sourcemap.ts
    fn/                    # XSLT-specific fns (current-group, etc.)

  runtime/                 # imported by generated code; also a public subpath
    index.ts               # @arakendo/xslt/runtime entry
    writer.ts              # output tree writer used by generated code
    dispatcher.ts          # template rule dispatcher
    ext.ts                 # defineXsltFunctions (DEC-015)

  diagnostics/             # DEC-013
    format.ts              # pretty-print error with source snippet + caret
    suggest.ts             # "did you mean" heuristics

  processor/               # public orchestration
    XsltProcessor.ts       # high-level interpreter entry
    compile.ts             # high-level codegen entry (returns TS source)
    types.ts

  util/
    qname.ts
    uri.ts
```

### DEC-012 — Public API surface
Keep tiny and stable. Two entry points:

```ts
// Runtime / interpreter usage
import { XsltProcessor } from '@arakendo/xslt';

const proc = new XsltProcessor(stylesheetXml);
const { output } = proc.transform(sourceXml, { parameters: { foo: 1 } });

// Compile-to-TS usage (programmatic; CLI wraps this)
import { compileStylesheetToTs } from '@arakendo/xslt/compile';

const { code, declarations, sourceMap, diagnostics } =
  compileStylesheetToTs(stylesheetXml, { path: 'invoice.xsl' });

// Runtime helpers imported by generated code (and by power users)
import { defineXsltFunctions, Writer, Ctx } from '@arakendo/xslt/runtime';
```

Everything else is internal. No deep imports from consumers.

## 4. Milestones

Ordering reflects the thesis (DIFFERENTIATORS): interpreter backend
first (fastest path to working code + reference semantics), then
diagnostics polish, then the codegen backend which is the product.

| M | Goal | Exit criteria |
|---|------|---------------|
| **M0** | Scaffold (this commit) | Typecheck + smoke tests pass; W3C suites cataloged (14.6k + 31.8k cases discovered) |
| **M1** | XPath vertical slice + diagnostic bones | Parse & evaluate `1 + 2`, `//foo`, `foo/bar[1]`; all AST nodes source-located; errors print file:line:col with source snippet + caret |
| **M2** | XPath core on interpreter | All axes, predicates, value/general/node comparisons, `if/for/let/some/every`, ~40 fn:* functions. Target: 20% of QT3 passing. |
| **M3** | XSLT MVP on interpreter | `xsl:template`, `xsl:apply-templates`, `xsl:value-of`, `xsl:for-each`, `xsl:choose`, `xsl:variable`, `xsl:param`, literal result elements. First golden test green. |
| **M4** | **Codegen backend (v1)** | IR → readable TypeScript for M3 features; all golden + M3 conformance tests pass under codegen; generated output committed to a fixtures folder for review |
| **M5** | Typed params + typed extension functions | `.d.ts` emission; `defineXsltFunctions` with compile-time signature checking; CLI `arakendo-xslt compile` |
| **M6** | Watch mode + source maps + diagnostics v2 | `arakendo-xslt watch`; Vite/esbuild plugin; `.xsl.map` output; static-analysis pass for unreachable templates, unused vars, priority conflicts, "did you mean" suggestions |
| **M7** | XPath type system + maps/arrays + higher-order | `cast as`, `instance of`, SequenceTypes, maps, arrays, function items |
| **M8** | XSLT 3.0 feature-complete (non-streaming) | `xsl:accumulator`, `xsl:iterate`, `xsl:merge`, packages, modes, keys |
| **M9** | Conformance push | ≥70% of XSLT 3.0 required tests passing under **both** backends |
| **M10+** | Practical streaming subset + gated `<ts:eval>` | forward-only opt-in streaming (DIFFERENTIATORS D2e); `<ts:eval>` escape hatch behind `features: { tsEval: true }` (D4 discipline) |

Time estimates intentionally omitted.

## 5. Open questions

- Do we expose the parsed IR as a public API? (Leaning yes for debugger
  tooling; behind `@arakendo/xslt/ir` subpath with its own version contract.)
- How do we handle `xsl:result-document` in the browser? (Return a map;
  let the caller decide what to do with it.)
- BigInt for `xs:integer`? (Spec says arbitrary precision. Probably yes
  eventually; `number` for M1.)
- Worker-based parallel evaluation? (Deferred indefinitely.)
- String-templated codegen vs. `ts.factory.*` — first pass is string
  templates; migrate if/when emission complexity demands it.
- How aggressive can compile-time diagnostics be without a sample input?
  (Without a sample: structural only. With a sample doc or schema:
  element/attribute name validation, basic type inference.)

## 6. References

- XSLT 3.0: https://www.w3.org/TR/xslt-30/
- XPath 3.1: https://www.w3.org/TR/xpath-31/
- XPath/XQuery Functions & Operators 3.1: https://www.w3.org/TR/xpath-functions-31/
- XDM 3.1: https://www.w3.org/TR/xpath-datamodel-31/
- XSLT 3.0 test suite: https://github.com/w3c/xslt30-test
- QT3 test suite: https://github.com/w3c/qt3tests
