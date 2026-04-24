# @arakendo/xslt

A TypeScript implementation of an **XSLT 3.0** engine.

<sub>repo: `xslt3` · internal codename: *Weaver*</sub>

> Status: **scaffold** — project structure is in place, engine is not yet implemented.

> **Open source, closed contributions.** This project is MIT licensed — fork
> and use it however you like. External pull requests and issues are not
> accepted. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Requirements

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
npm test
```

## Scripts

| Script              | Description                               |
| ------------------- | ----------------------------------------- |
| `npm run build`     | Compile TypeScript to `dist/`             |
| `npm run dev`       | Run `src/index.ts` in watch mode via tsx  |
| `npm test`          | Run the Vitest test suite once            |
| `npm run test:watch`| Run Vitest in watch mode                  |
| `npm run typecheck` | Type-check without emitting               |
| `npm run lint`      | Lint sources with ESLint                  |
| `npm run format`    | Format sources with Prettier              |

## Project layout

```
src/
  index.ts                  Public entry point
  version.ts
  errors/                   W3C-coded error classes
  xml/                      DOM parse/serialize boundary
  xdm/                      XPath Data Model (atomics, nodes, sequences, maps, arrays)
  xpath/
    lex/                    XPath 3.1 lexer
    parse/                  XPath 3.1 parser (recursive descent + Pratt)
    eval/                   XPath 3.1 evaluator + context
    fn/                     fn:* function library
    regex/                  Schema-regex → JS-regex translator
    types/                  SequenceType / casting / promotion
  xslt/
    compile/                Stylesheet → IR compiler
    eval/                   Transform evaluator
    fn/                     XSLT-specific functions
  processor/                Public orchestration (XsltProcessor)
  util/

test/
  smoke.test.ts             Basic API smoke tests
  golden.test.ts            Generic runner for test/golden/*/
  golden/                   File-based transform cases
  conformance/              W3C XSLT 3.0 suite runner (skipped by default)

docs/
  ARCHITECTURE.md           Pinned design decisions
```

## Scope

**Will support** (eventually): XSLT 3.0 basic conformance, DOM/string input
and output, synchronous evaluation, XPath 3.1 with ~220 built-in functions,
maps & arrays, higher-order functions.

**Not yet**: streaming (XSLT 3.0 streamability), schema-aware processing,
packages, extension instructions.

**Never**: XSLT 1.0 bug-compat mode, XQuery.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full design
and the pinned decisions behind each layer.

## Roadmap

- [x] M0 — Project scaffold
- [ ] M1 — XPath vertical slice (lex/parse/eval, hand-picked cases)
- [ ] M2 — XPath core (all axes, predicates, comparisons, ~40 fn:* functions)
- [ ] M3 — XSLT MVP (templates, apply-templates, value-of, for-each, choose, variables)
- [ ] M4 — XPath type system + maps/arrays + higher-order functions
- [ ] M5 — XSLT 3.0 feature-complete (non-streaming)
- [ ] M6 — Conformance push (≥70% of W3C XSLT 3.0 required tests)
- [ ] M7 — Streaming (maybe)

## License

MIT
