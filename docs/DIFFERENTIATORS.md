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

## The four things we will be the best at

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
| 6 | Conformance push (both backends) | Credibility |
| 7 | Incremental / practical streaming | Power-user differentiator |
| 8 | `<ts:eval>` escape hatch | Nice-to-have, after everything else works |

The rule: **we do not add features that make the diagnostic story
worse.** A feature with poor error messages is not done.

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
