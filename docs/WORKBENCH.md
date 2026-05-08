# Workbench

This is the stable public entry point for the Weaver live workbench on
`weaverxslt.org`.

The intent is simple:

- the front page should link here directly
- the public workbench should keep a stable URL even as the implementation
  underneath it evolves
- the current live embed and the durable engine notes should coexist on the
  same page

## Current public shape

The first public workbench is the MVP+6.5 embed described in
[WORKBENCH_EMBED.md](./WORKBENCH_EMBED.md).

The live page currently provides:

- editable XML pane
- editable XSLT pane
- read-only generated TypeScript pane
- output and diagnostics pane
- a small preset selector with editable starter examples

## Status

Current state:

- the engine-side workbench boundary exists and is tested
- the in-memory compile path is now browser-bundle-friendly
- the public embed behavior and preset set are documented
- a worker-backed static-site workbench now lives on this page

## Prototype

<div id="weaver-workbench-root"></div>

<noscript>
  <p>The live workbench prototype requires JavaScript. The current host and engine notes remain available below.</p>
</noscript>

## Why this route stays stable

This page is the live public workbench surface and remains the stable launch
point for the hosted demo.

That means the front-page CTA can stay stable even while the implementation
beneath it changes.

## Source of truth

Use these pages as the current source of truth:

- [WORKBENCH_EMBED.md](./WORKBENCH_EMBED.md) for the public host behavior
- [WORKBENCH_CHECKLIST.md](./WORKBENCH_CHECKLIST.md) for the completed M6.5 work record
- [WORKBENCH_EVIDENCE.md](./WORKBENCH_EVIDENCE.md) for the live-page and supporting-media capture procedure
- [WORKBENCH_API.md](./WORKBENCH_API.md) for the engine boundary