# Workbench

This is the stable public entry point for the Weaver live workbench on
`weaverxslt.org`.

The intent is simple:

- the front page should link here directly
- the first public live embed can later live on this page without changing the
  public URL
- until the live shell lands, this page points to the current host and engine
  design notes

## Planned public shape

The first public workbench is the MVP+6.5 embed described in
[WORKBENCH_EMBED.md](./WORKBENCH_EMBED.md).

That embed is planned to provide:

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
- a first worker-backed static-site prototype now lives on this page

## Prototype

<div id="weaver-workbench-root"></div>

<noscript>
  <p>The live workbench prototype requires JavaScript. The current host and engine notes remain available below.</p>
</noscript>

## When the live page lands

This page should become the live public workbench surface or the direct launch
page for it.

That means the eventual front-page CTA can stay stable even while the
implementation beneath it changes.

## Until then

Use these pages as the current source of truth:

- [WORKBENCH_EMBED.md](./WORKBENCH_EMBED.md) for the public host behavior
- [WORKBENCH_CHECKLIST.md](./WORKBENCH_CHECKLIST.md) for the concrete M6.5 work order
- [WORKBENCH_EVIDENCE.md](./WORKBENCH_EVIDENCE.md) for the future live-page or GIF capture procedure
- [WORKBENCH_API.md](./WORKBENCH_API.md) for the engine boundary