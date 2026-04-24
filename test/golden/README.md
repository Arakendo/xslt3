# Golden tests

Each subdirectory is one test case containing:

- `stylesheet.xsl` — the XSLT 3.0 stylesheet to run
- `input.xml` — the source document
- `expected.xml` — the expected serialized output
- `options.json` *(optional)* — `{ "initialTemplate"?: string, "initialMode"?: string, "parameters"?: {...} }`

The runner in `test/golden.test.ts` discovers every directory here and
executes one Vitest test per case. To add a new case, just drop a new
folder in — no code changes required.

Use these for anything that's easier to read as three files than as
inline strings in a `.test.ts`. Anything that's smaller than ~10 lines of
XSLT is probably fine as a unit test next to the code it exercises.
