# Differentiators — the "why bother" document

> **Thesis:** `@arakendo/xslt` is not another XSLT interpreter. It is a
> **TypeScript-native XSLT compiler** that emits inspectable, typed,
> debuggable transform modules. The interpreter exists for conformance
> testing and dynamic features; the codegen backend is the product.
>
> If we are not clearly better than Saxon-JS at **(a) error messages,
> (b) integration with TS build pipelines, and (c) being debuggable with
> normal JS tools**, we have failed. Performance, conformance percentage,
> and spec coverage are necessary but not sufficient.

This document is pinned design intent. [ARCHITECTURE.md](./ARCHITECTURE.md)
describes *how* we build the engine. This describes *why anyone would use
it over Saxon-JS*. Update together.

---

## The things we will be the best at

Five product commitments, in descending order of importance. See the
per-item detail below.

| # | Commitment | One-line test |
|---|------------|---------------|
| D1 | Error messages that point at the XSLT | A user looking at a stack trace can find the exact `.xsl` line and column without guessing |
| D2 | Compile to inspectable TypeScript | The generated `.xsl.ts` is reviewable in a PR and debuggable in Chrome DevTools |
| D3 | Typed params, typed extension functions, typed results | Calling the compiled transform is a type-checked TypeScript call, not a dynamic one |
| D4 | Escape hatches that aren't `xsl:script` | `<ts:eval>` exists, is typed, is gated, and does not metastasize |
| D5 | Watch mode + bundler plugin, first-class | `edit \u2192 save \u2192 see diagnostic + compiled TS` is sub-second with no separate tool |

### D1. **Error messages that point at the XSLT**

Debugging XSLT in the wild today is nightmarish. Errors point at
stylesheet line numbers (if you're lucky) with W3C error codes that
mean nothing to humans. Stack traces are internal to the processor.

We will do better:

- **Every** IR node carries `{ source, line, column }` from the source
  stylesheet. Non-negotiable.
- **Every** XPath AST node carries the same from the expression text,
  *plus* a pointer back to the IR node that contained the expression.
- Runtime errors produce messages like:

  ```
  XPTY0004: expected xs:string, got xs:integer (1)

    at  invoice.xsl:42:18
           <xsl:value-of select="amount + ' USD'"/>
                                        ^^^^^^^^^
    in template match="invoice/total"  (invoice.xsl:39)
    called from apply-templates select="total"  (invoice.xsl:24)

  did you mean:  concat(string(amount), ' USD')
  ```

- **Compile-time diagnostics**, not runtime surprises, for:
  - Unknown element/attribute names in `select=` when a sample doc is
    supplied: `'prodcut' (did you mean 'product'?)`
  - Unused variables / templates / modes
  - Templates that cannot possibly match
  - Patterns with priority conflicts
  - Typos in function names
  - Obvious type errors (`string + string`)
- **Source maps** (`.xsl.map`) so browser debuggers step through XSLT,
  not generated JS.

If a user sees a red squiggle in their XSLT file before running it,
we have succeeded. If they see "XPTY0004 at line 42" with no context,
we have failed.

### D2. **Compile to inspectable TypeScript**

Primary backend is a **codegen** that emits plain, readable TS:

```ts
// invoice.xsl.ts — generated, do not edit
import { Xdm, Writer, templates, type Ctx } from '@arakendo/xslt/runtime';

/** match="invoice" (invoice.xsl:12) */
function tmpl_invoice(ctx: Ctx, out: Writer): void {
  out.element('article', { class: 'invoice' }, () => {
    out.element('h1', {}, () => out.text(Xdm.str(ctx.select('title'))));
    templates.applyTemplates(ctx.select('line-item'), out, 'default');
  });
}

export const stylesheet = templates.compile({
  mode_default: [
    { match: 'invoice', priority: 0.5, fn: tmpl_invoice },
    // ...
  ],
});
```

Consequences:
- Bundler-friendly (Vite, esbuild, Webpack all just work)
- Tree-shakeable when only some templates are used
- Debuggable with the same tools the user already has
- Reviewable in PRs as a TS file, not a binary SEF blob
- Publishable as a standalone package — consumer doesn't need our engine

The interpreter backend remains for:
- Dynamic XSLT features (`xsl:evaluate`, dynamic mode names)
- Development / REPL usage
- Running conformance tests without rebuilding every time

Both backends share the same IR. Conformance tests run against **both**,
guaranteeing semantic parity.

### D3. **Typed params, typed extension functions, typed results**

#### Typed params
```ts
import { transformInvoice } from './invoice.xsl';

const html = transformInvoice(xml, {
  locale: 'en-US',   // typed: the stylesheet declared xsl:param name="locale" as xs:string
  showTax: true,     //        xs:boolean
});
```

The codegen emits a `.d.ts` next to every `.xsl.ts` with the param
signature derived from `<xsl:param>` declarations and their `as="..."`
attributes.

#### Typed extension functions
No more "register a callback that takes any and returns any":

```ts
defineXsltFunctions('app', {
  formatCurrency(amount: number, locale: string): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })
      .format(amount);
  },
});
```

At compile time, `app:formatCurrency(price, $locale)` in the stylesheet
type-checks against this signature. Mismatched arg types → compile-time
error, not runtime surprise.

#### Typed result shapes (stretch goal)
When a sample input or a schema is provided, we can infer the result's
element structure and emit it as a TS type. Best-effort, not perfect.

### D4. **Escape hatches that aren't `xsl:script`**

Let users inline TypeScript where XSLT is a bad tool for the job:

```xml
<xsl:template match="Price">
  <formatted>
    <ts:eval><![CDATA[
      new Intl.NumberFormat(ctx.params.locale, {
        style: 'currency',
        currency: ctx.select('@currency').string()
      }).format(ctx.selectNumber('.'))
    ]]></ts:eval>
  </formatted>
</xsl:template>
```

The `<ts:eval>` body is parsed as TypeScript at compile time (via the
TS compiler API), type-checked against a provided `ctx`, and inlined
into the generated code. No `eval`, no `new Function`. Source map
preserved. Type errors surface with stylesheet location.

#### D4 discipline (the gravity problem)

This feature's natural trajectory is to become *the* way users write
"XSLT" — at which point we ship a weird templating wrapper around
inline TypeScript and the XSLT layer is vestigial. To prevent that:

- `<ts:eval>` lands **last** (after M10). No shortcuts, no "just a
  prototype." If we have it before codegen is polished, users will
  bypass the hard parts of the compiler and we'll never build them.
- **Opt-in per compilation** with a `features: { tsEval: true }` flag.
  Off by default in v1.
- **Lint-level warnings** when a stylesheet's ratio of `<ts:eval>`
  content to native XSLT crosses a threshold. "This stylesheet is
  63% TypeScript by volume. Consider writing a TS module."
- **No XSLT features emulated in `<ts:eval>`.** If someone writes
  `<ts:eval>ctx.applyTemplates(...)</ts:eval>`, that's a smell. The
  runtime API we expose inside `<ts:eval>` is deliberately narrow:
  context access, params, output writer, extension functions. Not
  template dispatch, not XPath compilation, not accumulator state.

The test: if the answer to "why are you using `<ts:eval>` here?" is
"because XSLT can't do X easily," that's fine. If the answer is
"because I don't want to learn XSLT," our tool is the wrong choice
and our docs should say so.

### D5. **Watch mode, first-class**

```bash
npx arakendo-xslt watch src/stylesheets/
```

A modern dev-experience pitch loses its point the moment the user's
feedback loop is `edit → CLI → reload → guess`. Watch mode is part of
the core product, not a separate tool:

- Recompiles on stylesheet change (sub-second target)
- Writes generated `.xsl.ts` + `.d.ts` + `.xsl.map` atomically
- **Streams diagnostics to stdout in real time** with the D1 format
- Integrates with Vite / esbuild via a plugin so HMR "just works"
- Exits non-zero on diagnostic errors — usable in `npm run dev`
  pipelines without wrapping scripts
- Keeps a persistent IR cache so only changed stylesheets recompile

This lands in M6 alongside the CLI, not after. The pitch is
"XSLT with a modern dev loop"; without watch mode we're lying.

---

## Scope boundaries (intentional)

Things we will **explicitly not** compete on:

- **Full XSLT 3.0 conformance, day one.** We will follow the
  milestones in `ARCHITECTURE.md`. We will publish our conformance
  percentage honestly. We will *not* claim compatibility we don't
  have.
- **Schema-aware processing.** Optional, later, maybe never. The
  standard is enormous and few people use it.
- **Formal XSLT 3.0 streamability analysis.** A practical streaming
  subset (forward-only, single-pass, explicit opt-in) is in scope.
  The full spec chapter is a multi-year project on its own.
- **XQuery.** Different language, different scope.
- **`xsl:evaluate` dynamic compilation.** Supported via interpreter
  backend only; disabled in pure-codegen mode. The codegen has a
  deterministic output; `xsl:evaluate` destroys that.
- **Saxon compatibility as a marketing promise.** We pass W3C tests,
  not Saxon's private quirks.

---

## What shapes the IR (and therefore all backends)

To make the above real, the IR (`src/xslt/compile/ir.ts` and the
XPath AST) must be:

1. **Pure, JSON-serializable data.** No DOM references, no closures,
   no cyclic pointers. Serializable IR → cacheable IR → inspectable IR.
2. **Source-located, exhaustively.** Every node has `{ source, line,
   column, length }`. Lose this at your peril.
3. **Semantically rich.** Explicit `purity`, `streamability`,
   `mayThrow`, `refersToContext` flags set during a static-analysis
   pass. Backends query these rather than recomputing them.
4. **Versioned.** Adding an IR node kind is a minor version bump;
   changing the shape of an existing kind is major. External tools
   (editor plugins, debugger UIs) may consume the IR.

Concretely: if the codegen backend can't be written as a pure function
`IR → string`, the IR is doing too little. Fix the IR, not the backend.

---

## Priority order for features, revised

This supersedes the milestones in `ARCHITECTURE.md` for *ordering*,
not for *scope* — see that doc for the feature list per M:

| # | Goal | Why first |
|---|------|-----------|
| 1 | IR + interpreter backend | Shortest path to running *anything* end-to-end |
| 2 | **Diagnostic quality** (source locations, error contexts, good messages) | Establishes the debugging-first culture before it's impossible to retrofit |
| 3 | XPath core + XSLT MVP on the interpreter | Conformance foundation |
| 4 | **Codegen backend** producing readable TS | The product differentiator |
| 5 | Typed params, typed extension functions | The integration differentiator |
| 6 | **Watch mode + CLI + bundler plugin** (D5) | Feedback loop — the pitch doesn't work without it |
| 7 | Conformance push (both backends) | Credibility |
| 8 | Incremental / practical streaming | Power-user differentiator |
| 9 | `<ts:eval>` escape hatch (D4, gated) | Only after everything above works; see D4 discipline |

The rule: **we do not add features that make the diagnostic story
worse.** A feature with poor error messages is not done.

---

## Known hazards (pre-documented so future-us can't pretend to be surprised)

### H1. The IR is the whole game

If the IR leaks runtime assumptions, lacks source-location fidelity,
or fails to encode semantic properties (purity, context dependence,
streamability), every layer above it breaks:

- codegen produces tangled, un-optimizable output
- diagnostics can't reference source positions they never recorded
- streaming becomes architecturally impossible
- optimization passes have nothing to analyze

And we slowly become an interpreter with extra steps.

**Mitigation:** DEC-005 (IR as contract) and DEC-013 (diagnostics-first)
in ARCHITECTURE.md. The mantra is **"IR → string, or fix the IR."**
Say it out loud before every codegen-adjacent commit.

### H2. We are secretly building an XPath engine

The XSLT layer is the visible surface. The XPath 3.1 evaluator is
where most of the bugs, most of the spec nuance, and most of the
actual code will live:

- sequences vs. singletons (and the atomization rules between them)
- value comparison (`eq`/`ne`) vs. general (`=`/`!=`) vs. node (`is`) —
  three different semantics sharing overlapping syntax
- implicit numeric promotion across `xs:integer`/`xs:decimal`/`xs:double`
- function overloading by arity and by SequenceType
- context sensitivity: `.`, `position()`, `last()` — every step
  reshapes the focus
- 220+ built-in functions, each with a spec-defined signature

If this layer is *slightly* off, every XSLT feature built on top is
cursed in hard-to-diagnose ways.

**Mitigation:** run QT3 conformance tests from the moment the lexer
produces output. Treat the XPath suite as the daily scoreboard
separately from the XSLT suite. Budget accordingly.

### H3. Codegen will expose every IR mistake at maximum volume

Interpreter bugs are "fix it later" lines of code. Codegen bugs are
**printed into 4,000 lines of generated TypeScript**, visible in PRs,
visible to users. The first codegen backend will almost certainly
require at least one IR revision to accommodate it. The *second*
backend (e.g. the streaming codegen) will probably require another.

**Mitigation:**
- Accept that the IR version will tick forward during M4–M5
- Check generated output into a fixtures folder under version control
  so IR changes surface as reviewable diffs
- Do not ship the codegen as `1.0` until after the first real-world
  stylesheet compiles cleanly ("real-world" = not one we wrote)

### H4. The "step through in DevTools" success criterion is load-bearing

Everything else in this document is in service of that experience.
A feature that passes conformance tests but breaks source-map
step-through is a regression. A feature that extends the language
but isn't visible in the generated TS is suspect.

When weighing tradeoffs, optimize for the developer who has just
set a breakpoint on `invoice.xsl:42` and wants to see the right
thing in the debugger. That person is the customer.

---

## What success looks like

If a developer can:

1. `npm install @arakendo/xslt`
2. `npx arakendo-xslt compile invoice.xsl`
3. Get a typed `invoice.xsl.ts` they can import in a React app
4. See a red squiggle in VS Code when they mistype an element name in
   their XSLT
5. Step through the transform in Chrome DevTools
6. Watch their compile-time error message literally say *"did you mean
   `product`? (invoice.xsl:42)"*

…then this project is worth having built. Everything in this document
serves that outcome.
