# Extension Functions — staged scope and boundary rules

> How Weaver should think about non-standard function surface without turning
> the engine into accidental XSLT++.

This document exists because "just add a helper function" is one of the easiest
ways to smuggle late-tier semantics, hidden I/O, or product-specific behavior
into the core surface.

It complements [ARCHITECTURE.md](./ARCHITECTURE.md),
[DIFFERENTIATORS.md](./DIFFERENTIATORS.md), [XPATH.md](./XPATH.md),
[ERRORS.md](./ERRORS.md), and [SEMANTIC_BOUNDARIES.md](./SEMANTIC_BOUNDARIES.md).

## Goals

- Make non-standard function surface explicit and clearly out-of-spec.
- Prioritize helpers that improve diagnostics and ergonomics without hiding
  semantics.
- Keep roadmap tiers intact instead of backdooring M7 features into earlier
  increments.
- Keep host-boundary and I/O rules consistent with the rest of the engine.

## Non-goals

- Extending the `fn:` namespace.
- Building a second path language out of helper functions.
- Hiding resource access behind convenient helper names.
- Shipping domain-specific packs before the base extension-function model is
  stable.

## Namespace rule

Extension functions must live in a clearly non-spec namespace.

Suggested generic namespace:

```xml
xmlns:wx="urn:weaver"
```

Domain packs, if they exist later, should use their own namespace rather than
accumulating everything under one generic prefix.

Examples:

```xml
xmlns:wx="urn:weaver"
xmlns:s1="urn:weaver:s1000d"
```

Do not put extension functions in `fn:`.

## Core rules

### 1. Pure helpers first

Near-term candidates should be pure functions over existing XDM values.

Good examples:

- `wx:type-of($value)`
- `wx:first-or($sequence, $fallback)`
- `wx:empty-to($sequence, $fallback)`
- `wx:class-list($items)`
- `wx:path($node)`

### 2. No hidden I/O

Do not introduce helpers like `wx:load()` that quietly read resources. URI
resolution, resource loading, and host policy remain separate boundaries.

Pure URI computation helpers may be acceptable later if they stay consistent
with [URI_RESOLUTION.md](./URI_RESOLUTION.md).

### 3. Diagnostics should stay structured

If Weaver adds assertion or diagnostic helpers, they should integrate with the
structured diagnostic model rather than invent ad hoc text-only side effects.

Potential examples:

- `wx:fail($code, $message, $details?)`
- `wx:expect-one($seq, $message)`
- `wx:expect-non-empty($seq, $message)`
- `wx:expect-type($value, $type, $message)`

These are attractive because they align with the diagnostics-first product
direction, but they should land only when their runtime and reporting behavior
is explicit.

### 4. Do not collapse roadmap tiers

Helpers that require maps, arrays, or higher-order functions belong no earlier
than the roadmap tier where those semantics exist as stable primitives.

That means helpers like these are explicitly deferred until the M7 class of
features exists:

- `wx:group-by($seq, $key-fn)`
- `wx:index-by($seq, $key-fn)`
- `wx:unique-by($seq, $key-fn)`
- graph helpers that depend on function-valued edge definitions

If a helper is only elegant because it assumes later-tier semantics, it is a
later-tier helper.

## Staged candidates

### Stage A — near-term ergonomic helpers

These fit the current direction best because they do not require maps, arrays,
or higher-order functions and they do not weaken existing boundaries.

Recommended first batch:

- `wx:type-of($value)`
- `wx:first-or($sequence, $fallback)`
- `wx:empty-to($sequence, $fallback)`
- `wx:class-list($items)`
- `wx:path($node)`

Why these first:

- they are easy to explain
- they are useful in everyday stylesheets
- they improve readability without hiding semantics
- they do not require new data-model commitments

### Stage B — diagnostic and assertion helpers

These become attractive once runtime diagnostic plumbing is stable enough to
make their behavior explicit and testable.

Candidates:

- `wx:fail($code, $message, $details?)`
- `wx:expect-one($seq, $message)`
- `wx:expect-non-empty($seq, $message)`
- `wx:expect-type($value, $type, $message)`
- `wx:warn-at($node, $message, $details?)`

Requirements before landing them:

- structured diagnostic integration
- deterministic runtime behavior
- clear testing strategy for emitted codes/details

### Stage C — map/array and higher-order helpers

These are explicitly deferred until the corresponding base semantics are in
scope.

Examples:

- `wx:get($map, $key, $fallback)`
- `wx:pick($map, $keys)`
- `wx:group-by($seq, $key-fn)`
- `wx:index-by($seq, $key-fn)`
- `wx:sort-by($seq, $key-fn)`

These may be valuable later, but they should not be used to pull M7 semantics
forward piecemeal.

### Stage D — graph helpers

Graph helpers are plausible, but only after higher-order functions and related
data structures are stable. Until then they are backlog material, not near-term
product scope.

If they ever land, keep them disciplined:

- treat graphs as derived views over existing XML/map data
- do not invent a separate graph data model in core
- do not invent graph DSL strings
- do not go beyond a small utility surface unless real use demands it

Plausible later candidates:

- `wx:neighbors()`
- `wx:walk-unique()`
- `wx:reachable()`
- `wx:has-cycle()`
- `wx:topo-sort()`

## Domain-specific packs

Domain-specific helpers, such as S1000D-oriented functions, should not land in
the generic `wx:` namespace by default.

If they exist later:

- keep them in a separate domain namespace
- keep them out of the core engine until the extension mechanism is stable
- avoid turning one customer/problem domain into assumed global product policy

That means S1000D helpers are a later domain package discussion, not a near-term
core-function decision.

## Testing guidance

Every extension function that lands should have:

- focused behavioral tests
- diagnostic tests when failures are part of the contract
- documentation that states whether it is pure, diagnostic, or host-sensitive
- explicit namespace examples

## Working rule

Extension functions should make Weaver clearer, not more magical. If a helper
obscures semantics, hides I/O, or quietly drags in a later feature tier, it is
not ready.