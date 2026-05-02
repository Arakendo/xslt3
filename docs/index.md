# Weaver

Weaver is a TypeScript-native XSLT compiler that aims to make XSLT readable,
debuggable, and workable in normal TypeScript toolchains.

The engine has two backends:

- an interpreter backend used as the semantic reference implementation
- a codegen backend that emits inspectable TypeScript and is the product target

## What makes it different

Weaver is built around a few explicit priorities:

- diagnostics that point back to the stylesheet, not just opaque runtime failures
- generated TypeScript that can be reviewed and debugged like normal application code
- a shared IR contract between compiler, interpreter, codegen, and future tooling
- host integration that stays explicit instead of hiding engine behavior behind magic

## Current status

The project is pre-stability and currently centered on the interpreter MVP and the
codegen architecture that follows it.

- the XPath core is in place
- the MVP+3 XSLT interpreter slice runs real transforms
- the codegen backend remains the next major product milestone

## Start here

- [Differentiators](DIFFERENTIATORS.md) for the product thesis
- [Architecture](ARCHITECTURE.md) for the pinned design decisions
- [Roadmap](ROADMAP.md) for milestone scope and exit criteria
- [Errors](ERRORS.md) for the diagnostic model

## Source of truth

This site is the public guide for the project. The repository remains the source of
truth for implementation and planning details.

- `README.md` is the quick orientation surface
- `docs/ARCHITECTURE.md` is the pinned engine design
- `docs/ROADMAP.md` is the active milestone plan
- `docs/ERRORS.md` defines the error-reporting model