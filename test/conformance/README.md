# W3C conformance

This directory hosts conformance harnesses for the official W3C suites
that matter to `@arakendo/xslt`.

Current structure:

- `qt3/` holds QT3 (XPath/XQuery 3.1) suite runners and slices
- top-level shared files hold harness code that applies across suites
- future `xslt30/` files should hold XSLT 3.0-specific runners once that
	harness grows beyond the current smoke checks

## Setup (not done yet)

The suites are separate repositories. Add them as git submodules:

```bash
git submodule add https://github.com/w3c/xslt30-test vendor/xslt30-test
git submodule add https://github.com/w3c/qt3tests vendor/qt3tests
git submodule update --init --recursive
```

It's a few hundred MB, so it's **not** included in `npm ci` or the CI
workflow by default. The conformance harness skips itself when the
submodule is absent.

## Running

```bash
npm run test:conformance   # once implemented
```

## Goal

Report a single number: `passed / required`. It starts at 0 and only
ever goes up. Regressions in that number should fail CI once we pick a
floor to defend.

## MVP+3 XSLT strategy

For MVP+3, XSLT testing should be staged rather than broad from day one.

1. Goldens are the first gate.
	Start with byte-exact fixtures under `test/golden/` for the literal-result,
	`xsl:value-of`, and early `xsl:apply-templates` slices. These are the
	fastest signal while the interpreter surface is still small.
2. Add a curated `xslt30/` slice next.
	The first XSLT conformance runner should mirror the QT3 approach: run only a
	small, explicit set of `xslt30-test` cases that fit the current MVP+3
	surface instead of trying to execute the whole suite.
3. Filter by supported feature set, not by optimism.
	Cases should be included only when their required XSLT instructions,
	invocation mode, and output expectations are inside the current increment.
	Unsupported instructions should be excluded deliberately rather than counted
	as noise.
4. Graduate to broader baselines later.
	A broad XSLT baseline only becomes useful once template dispatch, built-in
	rules, and the minimal serializer are stable enough that failures are mostly
	semantic rather than harness churn.

Working rule: for MVP+3, use goldens to prove the vertical slice and a curated
`xslt30-test` subset to measure honest early conformance. Do not import a
mountain of XSLT failures before the engine can classify them.

## References

- XSLT 3.0 test suite: https://github.com/w3c/xslt30-test
- QT3 test suite: https://github.com/w3c/qt3tests
- Catalog format: `catalog.xml` in the suite root
- XSLT 3.0 conformance chapter: https://www.w3.org/TR/xslt-30/#conformance
