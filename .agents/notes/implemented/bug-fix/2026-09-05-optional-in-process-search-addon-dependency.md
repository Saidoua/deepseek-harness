# Agent Note: The in-process search addon is an optional registry dependency

Status: implemented

English | [中文](2026-09-05-optional-in-process-search-addon-dependency.zh.md)

## Problem

`dsh-tool-fs-search` declared its in-process ripgrep backend, `@saidoua/dsh-native`, as a hard dependency with a `link:` range pointing outside the repository (`link:../../../../dsh-rs/npm`). A `link:` range is a workstation path, not a registry specifier: `verify-npm-install-layout` and `verify-packed-install` failed because npm could not resolve it in the synthetic two-release registry, and any published `dsh-tool-fs-search` manifest would have carried the same unresolvable path. The package is not published on npm, and the tool already treats the addon as absent-safe — `native.ts` loads it through `createRequire` at first use and keeps the ripgrep spawn as the fallback.

## Decision

`@saidoua/dsh-native` is an `optionalDependencies` entry with the registry range `^0.1.0`. Local development keeps the addon linked through the workspace-level `overrides` entry in `pnpm-workspace.yaml` (`link:../dsh-rs/npm`), the same mechanism that links the vendored `@deepseek-ai/cosmokit` and `@deepseek-ai/schemastery`. Published manifests therefore carry a clean registry range that npm skips when the package is unavailable, and the lockfile records the override as pnpm's own resolution.

## Alternatives considered

**Keep the `link:` range under `optionalDependencies`.** Rejected because pnpm pack copies a `link:` range verbatim into the published manifest, so consumers would still receive a path that resolves nowhere.

**Publish the addon before depending on it.** Deferred, not rejected: publication makes the optional range resolvable for consumers, but the manifest contract is correct either way, and publishing is a separate release decision for the `dsh-rs` repository.

**Inline the addon as a workspace package.** Rejected because the addon is Rust source with its own build, and `native/` is reserved for `@deepseek-ai/node-addon-landlock-run`, the one addon this repository owns.

**Give the addon an `OVERRIDES` entry in the notices generator.** Rejected because it would keep pinning a license string for a package the notices file should not list at all; `FIRST_PARTY` states the actual reason it needs no entry.

## Consequences

`verify-npm-install-layout` verifies 223 packages per synthetic release with the addon among the optional names npm ignores, and `pnpm install --frozen-lockfile` passes with the override recorded. Consumers installing from npm get the spawn backend until the addon is published; the workstation link keeps the in-process backend available for development and its integration suite. `verify-optional-dependency-imports` confirms no static import of the addon exists.

The addon is a `FIRST_PARTY` name in `scripts/gen-third-party-notices.ts`, beside the `node-addon-landlock-run` family, so `THIRD_PARTY_NOTICES.md` does not list it: it is this repository owner's own native package, not third-party software, and a clean install has no manifest for the generator to read. Without that entry the notices spec fails wherever the sibling checkout is absent — which is every machine but the author's.
