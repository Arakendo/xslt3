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
  index.ts                 Public entry point
  version.ts
  processor/
    XsltProcessor.ts       Top-level API
    types.ts
test/
  smoke.test.ts
```

## Roadmap

- [ ] XML parser integration (`@xmldom/xmldom`)
- [ ] XPath 3.1 lexer / parser
- [ ] XPath 3.1 evaluator
- [ ] XSLT 3.0 stylesheet compiler
- [ ] Core instruction library (`xsl:template`, `xsl:apply-templates`, `xsl:for-each`, ...)
- [ ] Serialization & result documents
- [ ] Streaming mode (XSLT 3.0 streamability)

## License

MIT
