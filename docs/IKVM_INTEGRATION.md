# IKVM Integration Plan

> Planning document for a future .NET/NuGet host around Weaver using an
> embedded JS runtime or equivalent IKVM-backed integration strategy.

This is a planning doc, not a near-term implementation commitment.

It exists because cross-language hosting stops being speculative once the
engine boundaries are explicit enough. If Weaver eventually ships as a
NuGet package, that host should inherit the same semantics, diagnostics,
and resource contracts as the TypeScript engine rather than reimplementing
them in C#.

This document complements [ARCHITECTURE.md](./ARCHITECTURE.md),
[URI_RESOLUTION.md](./URI_RESOLUTION.md), [ERRORS.md](./ERRORS.md), and
[SEMANTIC_BOUNDARIES.md](./SEMANTIC_BOUNDARIES.md).

## Reviewed project patterns

This plan is informed by three existing .NET projects:

- `XSLTTools`
- `IkvmFopWrapper`
- `FopTools`

The reusable patterns from those projects are concrete and worth keeping.

### Pattern 1 — Dumb dependency wrapper project

`IkvmFopWrapper` is intentionally a packaging-only project:

- it owns the heavy IKVM/Maven dependency graph
- it contains no behavior
- dependent projects reference it via `ProjectReference`

This is the right pattern for Weaver too. The wrapper that hosts a JS
runtime or precompiled assets should not also own transform semantics,
diagnostics formatting, or host policy logic.

### Pattern 2 — Host-facing façade project owns real behavior

`FopTools` references the dumb wrapper and exposes the usable .NET API.

That separation matters:

- packaging concerns stay isolated
- public host API stays coherent
- runtime semantics do not get hidden in build plumbing

For Weaver, this implies:

- one packaging/runtime carrier project
- one .NET-facing façade project that exposes transformation, compile,
  diagnostics, resolver, and output APIs

### Pattern 3 — Resource bridge at engine boundary

`SaxonResourceBridge` and FOP memory resolvers are the most important host
pattern in the reviewed code. They bridge engine resource requests into a
host-owned store or resolver instead of letting the engine perform ambient
I/O.

Weaver should preserve exactly that idea:

- JS engine asks through a resolver boundary
- .NET host fulfills the request according to host policy
- no hidden filesystem/network fallback in core semantics

### Pattern 4 — Shared settings and diagnostics objects

`XSLTTools` and `FopTools` both push toward the same shape:

- settings are explicit objects, not long parameter lists
- diagnostics are richer than plain exception strings
- multiple engines share the same host-level configuration surface

For Weaver, that pattern maps directly to:

- transform options
- resolver contracts
- structured diagnostics
- result-document publication behavior

## Core decision

If Weaver gets a .NET host, the TypeScript engine remains the semantic
source of truth.

The .NET/NuGet layer is a host façade, not a second implementation.

That means:

- no port of XPath/XSLT semantics to C#
- no second diagnostics system in C#
- no second URI-resolution model in C#
- no codegen/runtime behavior that exists only in the .NET host

The host may adapt data shapes and lifecycle, but not the meaning.

## Goals

- Make Weaver usable from C#/.NET through a first-class NuGet package.
- Preserve the exact host contracts already being designed for TS users.
- Keep diagnostics, resolver behavior, and generated-runtime semantics
  equivalent between JS and .NET hosts.
- Avoid Node-specific assumptions in the core so the embedded runtime can
  be hosted in-process later.

## Non-goals

- A full C# rewrite of Weaver.
- Freezing the final NuGet API now.
- Shipping IKVM hosting in early MVP milestones.
- Supporting every possible .NET runtime environment in v1.

## Recommended project shape

If/when this starts, prefer a three-layer structure.

### 1. Engine of truth

Weaver itself:

- parser
- XPath engine
- XSLT compiler/interpreter
- runtime helpers
- structured diagnostics
- resolver contracts

This remains the single semantic engine.

### 2. Packaging/runtime carrier

A .NET project analogous to `IkvmFopWrapper` that owns:

- embedded JS runtime packaging
- Weaver JS bundle/assets
- any host-runtime bootstrapping artifacts
- version pinning for the embedded runtime stack

This layer should contain little or no transform logic.

### 3. Host-facing .NET façade

A `.NET` library analogous to `FopTools`/`XSLTTools` that exposes:

- transform methods
- compile methods
- settings/options objects
- resolver interfaces/delegates
- diagnostic projection types
- result-document handling

This is the package application developers actually use.

## Host boundary rules that must survive

These are non-negotiable if the NuGet host is to stay credible.

### Resolver contract survives unchanged

The .NET host must obey [URI_RESOLUTION.md](./URI_RESOLUTION.md):

- resolution semantics stay in Weaver
- resource access stays with the host
- `baseUri` is not I/O permission
- generated code and interpreter use the same runtime resolver surface

### Diagnostics stay structured

The .NET host must project `DiagnosticReport`, not flatten it into string
messages and call that equivalent.

That means the wrapper should preserve:

- code
- phase/category/severity
- primary and related spans
- frames
- details
- suggestions
- causes

C# convenience exceptions may exist, but they should wrap the structured
report rather than replacing it.

### Settings stay explicit

The C# host should mirror the existing TS direction:

- transform options object
- resolver hooks
- feature flags
- output publication hooks

Do not let the NuGet surface degrade into a forest of overloads that hide
meaningful configuration boundaries.

### Interpreter and codegen stay aligned

If the .NET host can run both interpreted and compiled/generated forms,
they must still share:

- resolver behavior
- diagnostic shapes
- URI semantics
- base-URI choice
- result-document publication rules

## Public API direction for .NET

The final API can change, but the shape should likely resemble:

```csharp
public sealed class WeaverProcessor
{
    public TransformResult Transform(
        string stylesheetText,
        string sourceXml,
        WeaverTransformOptions options);

    public CompileResult Compile(
        string stylesheetText,
        WeaverCompileOptions options);
}

public sealed class WeaverTransformOptions
{
    public string? StylesheetUri { get; init; }
    public string? SourceDocumentUri { get; init; }
    public IReadOnlyDictionary<string, object?> Parameters { get; init; }
    public IWeaverResourceResolver? Resolver { get; init; }
    public IWeaverResultPublisher? ResultPublisher { get; init; }
}
```

The key point is not these exact names. The key point is that the public
surface should mirror the engine's real semantic boundaries rather than
smearing them together.

## Bridge types to preserve

### Resource bridge

The reviewed projects strongly suggest that a bridge object is the right
place for host interop.

For Weaver, that likely means a runtime bridge responsible for:

- forwarding URI resolution requests into .NET
- loading XML/text resources through host callbacks
- publishing secondary results through host callbacks
- converting host failures into structured diagnostics

That bridge should be the only place where JS-runtime calls are translated
into .NET delegates.

### Diagnostics bridge

The .NET host should have a projection layer that turns JS diagnostics into
stable .NET records/classes without inventing new meaning.

Examples:

- `DiagnosticReport` JSON/object -> `WeaverDiagnostic`
- structured suggestions -> `WeaverSuggestion`
- source spans -> immutable .NET value types/records

### Settings/options bridge

The wrapper should translate .NET option objects into Weaver input objects,
but not reinterpret them semantically.

Example: a .NET `Resolver` delegate should map to Weaver's resolver
contract, not to ad hoc file-system behavior in the bridge.

## Packaging strategy

The reviewed IKVM wrapper suggests a practical packaging rule:

- pin the embedded runtime/tooling versions in one place
- keep the façade package free of heavy dependency definition noise
- let application projects depend on the façade, not the carrier layer

For Weaver, that likely means:

- `Weaver.IkvmRuntime` or similar: packaging/runtime carrier
- `Weaver.Net` or similar: public NuGet façade

Even if the names change, the split is valuable.

## Milestone guidance

This should not start immediately. The right entry gate is later, once a
few engine contracts stop moving weekly.

Reasonable prerequisites:

1. `DiagnosticReport` shape is implemented and stable enough to project.
2. URI resolver contract exists in code, not only in docs.
3. Runtime helpers for generated code are explicit and hostable.
4. Generated/interpreted parity exists for a meaningful feature slice.
5. Core logic is cleanly free of ambient Node-only assumptions.

That likely puts serious IKVM work after the runtime and host contracts
stabilize, not during early XPath bring-up.

## Risks

### Risk 1 — Host starts reinterpreting semantics

If the .NET wrapper begins "helping" by resolving URIs, normalizing
diagnostics, or coercing values differently than the JS engine, parity is
gone.

Mitigation: keep all semantic decisions in Weaver, all host policy in the
wrapper, and the bridge thin.

### Risk 2 — Node assumptions leak into core

If core/runtime code quietly depends on Node globals or file APIs, the
embedded host becomes fragile.

Mitigation: keep [URI_RESOLUTION.md](./URI_RESOLUTION.md) and
[SEMANTIC_BOUNDARIES.md](./SEMANTIC_BOUNDARIES.md) discipline strict.

### Risk 3 — Diagnostics degrade across the bridge

It is easy to convert structured diagnostics into plain .NET exceptions and
lose the product surface.

Mitigation: make structured diagnostics the primary host-facing error data;
exceptions are wrappers, not replacements.

### Risk 4 — Public API follows implementation accidents

If the NuGet API mirrors internal bootstrapping quirks instead of the real
host contract, it will be hard to stabilize.

Mitigation: design the .NET API around resolver/output/diagnostics/options
contracts, not around the JS engine's startup plumbing.

## Immediate design implications for Weaver now

Even before any IKVM work starts, this plan implies a few current rules:

1. Keep the runtime boundary narrow and explicit.
2. Keep diagnostics language-neutral and JSON-safe.
3. Keep resolver contracts injectable and side-effect disciplined.
4. Keep generated code depending only on a hostable runtime surface.
5. Avoid letting Node-specific conveniences into core semantics.

## Open questions

1. What embedded JS runtime will be used under the .NET layer, and what
   packaging/runtime constraints does it impose?
2. Do we want synchronous-only, asynchronous-only, or dual-mode host APIs
   on the .NET side for resolver and transform operations?
3. Should the first NuGet surface expose both compile and transform APIs,
   or only transform first?
4. How much of the generated-runtime surface should be directly available
   to .NET hosts versus kept internal?

## Planning verdict

The reviewed projects make one thing clear: Weaver should not treat .NET
hosting as "someday magic." The pattern already exists.

The right adaptation is:

- dumb runtime/dependency carrier
- thin host-facing façade
- explicit resource bridge
- shared settings/diagnostics contracts
- one semantic engine underneath all of it

That is the path most likely to produce a NuGet package that feels native
without silently becoming a second implementation.