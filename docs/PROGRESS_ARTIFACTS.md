# Progress Artifacts

This page is the public index for milestone evidence published on
`weaverxslt.org`.

Use it for small, curated public proof of milestone status or debugging claims.
That proof may be either:

- a live page or embedded demo published on `weaverxslt.org`
- a supporting asset such as a screenshot, GIF, `webm`, or `mp4`

Do not use it as a dumping ground for raw working files.

## Storage convention

Live pages do not need files under `docs/assets/progress/`; they can be linked
directly from this index.

- Put assets under `docs/assets/progress/`
- Prefer `webm` or `mp4` for screen recordings when practical
- Use `gif` only when a simple animated image is enough
- Use stable names like `mvp6-devtools-breakpoint.gif`

Published asset URLs will be under:

```text
https://weaverxslt.org/assets/progress/<file>
```

When the proof is a live page instead of a stored asset, link the page URL
directly from this document.

## Planned evidence

### MVP+6.5 Workbench embed

When the public workbench page or supporting media exists, record it here.

Preferred proof:

- live public page on `weaverxslt.org`

Fallback proof:

- short `webm`, `mp4`, GIF, or screenshot stored under `docs/assets/progress/`

Checklist reference:

- [WORKBENCH_EVIDENCE.md](./WORKBENCH_EVIDENCE.md)

## Current artifacts

### MVP+6 DevTools source-map verification

This GIF shows the full manual acceptance flow from
[DEVTOOLS_CHECKLIST.md](./DEVTOOLS_CHECKLIST.md):

- `demo.xsl` visible in DevTools `Sources`
- breakpoint set on `xsl:value-of`
- render button clicked
- execution pausing on the authored stylesheet line

Asset path in repo:

```text
docs/assets/progress/weaver break point working.gif
```

Published URL:

```text
https://weaverxslt.org/assets/progress/weaver%20break%20point%20working.gif
```

Direct link:

- [MVP+6 DevTools verification GIF](./assets/progress/weaver%20break%20point%20working.gif)

Preview:

![MVP+6 DevTools verification GIF](./assets/progress/weaver%20break%20point%20working.gif)

Checklist reference:

- [DEVTOOLS_CHECKLIST.md](./DEVTOOLS_CHECKLIST.md)