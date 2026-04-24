# W3C XSLT 3.0 conformance

This directory hosts the harness that runs the official **W3C XSLT 3.0
test suite** against `@arakendo/xslt` and reports a pass/fail score.

## Setup (not done yet)

The test suite is a separate repository. Add it as a git submodule:

```bash
git submodule add https://github.com/w3c/xslt30-test vendor/xslt30-test
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

## References

- Test suite: https://github.com/w3c/xslt30-test
- Catalog format: `catalog.xml` in the suite root
- XSLT 3.0 conformance chapter: https://www.w3.org/TR/xslt-30/#conformance
