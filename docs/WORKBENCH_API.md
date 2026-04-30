# Workbench API — engine boundary for external editor tooling

> This document defines the Weaver-side API shape needed by a live XSLT
> workbench or playground. It is intentionally about the **engine boundary**,
> not the UI or product implementation.

It complements [ARCHITECTURE.md](./ARCHITECTURE.md), especially the public API
boundary and source-map guidance, [DIFFERENTIATORS.md](./DIFFERENTIATORS.md)
for why this matters to the product thesis, [ROADMAP.md](./ROADMAP.md) for
where the workbench lands, [ERRORS.md](./ERRORS.md) for the diagnostic
contract, and [URI_RESOLUTION.md](./URI_RESOLUTION.md) for host-owned resource
loading and identity.

## Why this doc exists

The live workbench idea is good, but the implementation will live in a
different closed repository and fold into a different product surface.
Weaver should therefore contribute the **engine contract** that such a host
needs, not absorb the product's UI concerns into this repository.

That means this doc is deliberately narrower than the original note:

- it defines what Weaver should expose
- it defines what the host/workbench must own
- it does **not** design the final UI
- it does **not** require this repository to ship the workbench product

## Core rule

Weaver may expose a workbench-friendly API.
Weaver does **not** become the workbench product.

Corollaries:

- The engine returns structured artifacts: diagnostics, generated TS,
  source-map data, IR handles, output.
- The host application owns panes, debouncing policy, editor widgets,
  persistence, sharing, and browser sandbox UX.
- The same compile/run semantics must serve CLI, watch mode, tests, and the
  external workbench. No UI-only compiler path is allowed.

## Goals

- Support an in-memory XML + XSLT editing loop without filesystem-only
  assumptions.
- Return first-class structured artifacts suitable for editor tooling.
- Preserve the existing diagnostic contract rather than inventing a second
  UI-specific error shape.
- Keep the generated TypeScript inspectable and read-only in the first slice.
- Leave enough room for later linked-highlighting, trace, and output mapping.

## Non-goals

- Building the actual four-pane UI in this repository.
- Choosing Monaco versus another editor surface.
- Defining the closed-repo product architecture, routing, auth, persistence,
  examples gallery, or sharing model.
- Allowing edited generated TS to flow back into XSLT semantics.
- Requiring browser execution of generated TS in Weaver itself.

## Placement in the roadmap

This contract exists to support [ROADMAP.md](./ROADMAP.md) MVP+6.5.

It depends on earlier increments providing:

- readable codegen output
- stable source maps
- watch-mode correctness
- structured compile-time and runtime diagnostics

Without those, a workbench API is just a thin wrapper over unstable internals.

## Design principles

### 1. In-memory first

Workbench callers must be able to supply XML and XSLT as `uri + text` pairs.
No core loop should require local files.

### 2. Structured artifacts, not scraped strings

The host should never parse formatted diagnostic text or generated output logs
to recover semantics. Weaver returns structure; renderers are separate.

### 3. Same engine path everywhere

Workbench compile/run calls must reuse the same compiler/runtime machinery as
other entry points. If CLI/watch/tests and workbench disagree, the workbench
API is wrong.

### 4. Read-only generated TS in v1

Generated TS is an inspectable artifact. It is not an editable round-trip
surface in the first workbench slice.

### 5. Host-owned execution and sandbox policy

If a host executes generated TS in the browser, sandboxing and runtime policy
belong to the host boundary. Weaver must not assume ambient `eval()`, network,
filesystem, or DOM access.

## Terminology

Use these terms consistently:

- **source document**: a `uri + text` input supplied by the host
- **compiled stylesheet**: Weaver-owned compiled form suitable for repeated
  transform runs
- **generated TS**: emitted TypeScript artifact for inspection or execution
- **source map**: mapping between XSLT spans and generated TS spans
- **workbench host**: the external application or product embedding Weaver

## Recommended contract shape

The exact exported function names can still evolve. What matters is the shape
and separation of concerns.

### Source documents

```ts
export interface SourceDocument {
  uri: string;
  text: string;
}
```

The `uri` is for diagnostics, source maps, caching, and host identity. It is
not permission to perform I/O.

### Compile surface

```ts
export interface CompileRequest {
  stylesheet: SourceDocument;
  options?: {
    emitGeneratedTs?: boolean;
    emitSourceMap?: boolean;
    emitIr?: boolean;
  };
}

export interface CompileResult {
  ok: boolean;
  diagnostics: DiagnosticReport[];
  stylesheet?: CompiledStylesheet;
  generatedTs?: string;
  sourceMap?: WeaverSourceMap;
  ir?: StylesheetIR;
}
```

Rules:

- `diagnostics` is always present.
- `generatedTs` may be present even when a later transform would fail.
- `ir` is optional and should remain clearly versioned if exposed.

### Transform surface

```ts
export interface TransformRequest {
  stylesheet: CompiledStylesheet | SourceDocument;
  sourceXml: SourceDocument;
  options?: TransformOptions;
}

export interface TransformResult {
  ok: boolean;
  diagnostics: DiagnosticReport[];
  output?: string;
}
```

Rules:

- Passing a `SourceDocument` stylesheet is convenience-only; it must still
  flow through the same compile path as explicit compilation.
- Runtime failures still use `DiagnosticReport`; no special workbench-only
  exception shape is introduced.

### Convenience surface

For the external workbench host, one-shot compile-and-run is useful:

```ts
export interface CompileAndTransformRequest {
  stylesheet: SourceDocument;
  sourceXml: SourceDocument;
  options?: {
    emitGeneratedTs?: boolean;
    emitSourceMap?: boolean;
  } & TransformOptions;
}

export interface CompileAndTransformResult {
  ok: boolean;
  diagnostics: DiagnosticReport[];
  output?: string;
  generatedTs?: string;
  sourceMap?: WeaverSourceMap;
  stylesheet?: CompiledStylesheet;
}
```

This is a boundary convenience, not a new semantic engine.

### Generated TS inspection

If generated TS is exposed directly, the contract should stay minimal:

```ts
export interface EmitResult {
  code: string;
  sourceMap?: WeaverSourceMap;
  diagnostics: DiagnosticReport[];
}
```

The host may show this text in a pane. The host must not treat local symbol
names or helper names as a stable imported API.

## Mapping surfaces

The workbench's first useful linked-highlighting features depend on mappings,
not on reparsing generated code.

Recommended shape:

```ts
export interface SourceSpanMap {
  mapSourceToGenerated(span: SourceSpan): readonly GeneratedSpan[];
  mapGeneratedToSource(span: GeneratedSpan): readonly SourceSpan[];
}
```

Rules:

- Empty results are acceptable; fake precision is not.
- Mapping APIs should consume the same span model used by diagnostics.
- Output-to-source mapping is explicitly later work and not required for the
  first public contract.

## Diagnostics

The workbench consumes the same `DiagnosticReport` contract defined in
[ERRORS.md](./ERRORS.md).

That means:

- code, phase, category, severity, `primary`, `related`, `frames`, `details`,
  `suggestions`, and `causes` remain first-class data
- formatted text is optional convenience, not the semantic contract
- the workbench host should render structure directly where practical

No new workbench-specific diagnostic schema should be introduced.

## Resource loading and identity

Any future workbench-facing compile or transform entry points must honor the
resolver split from [URI_RESOLUTION.md](./URI_RESOLUTION.md):

- Weaver owns URI resolution semantics.
- The host owns resource access and policy.

That includes in-memory providers for `playground:/...`, `untitled:...`, or
other virtual URIs.

## Deferred surfaces

The following are real future needs, but they should not be required for the
first workbench-friendly API boundary.

### Trace events

Useful later for step/trace UI:

```ts
export interface TraceOptions {
  enabled: boolean;
  includeValues?: boolean;
  includeTemplateFrames?: boolean;
  includeGeneratedLocations?: boolean;
}
```

This should land only after the compile/run surfaces are already stable.

### Session / incremental editing API

An incremental session object may be valuable later, but it is an optimization
surface and should not be the first contract.

Stateless compile + transform calls are enough to prove the loop first.

### Output mapping

`mapOutputToSource(...)` is high-value but should be treated as a later layer.
Do not block the first workbench contract on output provenance.

## Minimal Weaver-side surface for MVP+6.5

For the roadmap slice in this repository, the minimal useful contract is:

- source documents with `uri + text`
- compile result returning `DiagnosticReport[]`
- optional generated TS artifact
- optional source-map artifact
- transform result returning output + `DiagnosticReport[]`
- convenience compile-and-transform entry point

That is enough for an external workbench product to build:

- XML pane
- XSLT pane
- read-only generated TS pane
- output pane
- diagnostics panel

without requiring this repository to ship the actual workbench.

## Product boundary reminder

This repository should stop at the engine contract.

The closed-repo product may build:

- panes and editor chrome
- sharing
- examples gallery
- authentication and persistence
- browser worker orchestration
- execution policy and sandbox UX

Weaver's job is to make that possible without leaking semantics through prose,
deep imports, or UI-only hacks.