# Agent Note: The Python runtime manifest declares `dsh-base` on the fork

Status: implemented

English | [中文](2026-09-09-runtime-manifest-declares-dsh-base.zh.md)

## Problem

`CI master` failed on every fork push in the three `python runtime` jobs at `Run installed-wheel keyless black-box tests`: the packaged runtime exited at boot with `dsh: cannot resolve profile bundle "@deepseek-ai/dsh-base"`. Reproducing the build locally showed the staged `node_modules` held every bundle the CLI depends on except `dsh-base`. `scripts/build-exe-for-python-sdk.ts` deploys the `dsh-python-runtime-closure` manifest with pnpm's legacy hoisted linker, copies back only the manifest's direct dependencies that the hoister parked beside the source, and omits package-local `node_modules` trees. Upstream's `dsh-base` hoists into the target; the fork's `dsh-base` depends on the published `@saidouahdachi/dsh-tool-fs-search-native`, whose optional peer dependencies change how pnpm places its dependents, and the bundle did not reach the top level. `verify-runtime-closure` did not flag it because it checks preset plugins and required workspace peers, not the bundles the CLI resolves.

## Decision

`python/sdk-runtime/package.json` declares `@deepseek-ai/dsh-base` as a direct dependency, together with the six required workspace peers the verifier then demands (`dsh-command-feedback`, `dsh-message-feedback`, `dsh-session-title-llm`, `dsh-storage`, `dsh-storage-domain`, `dsh-typert-registry`). As a direct dependency the bundle is either hoisted into the target or restored by `restoreLegacyHoists`. The `scripts/snapshots/python-sdk-single-exe` fixtures are refreshed with `--update-snapshots`; the only recorded difference is the fork's `rule_pin` and `state_write` tools in the request header.

## Alternatives considered

**Restore every hoisted package, not only direct dependencies.** A change to the upstream build script that the fork would carry through every sync; the manifest already exists to enumerate the closure, and the verifier enforces its peers.

**Remove the peer dependencies from the published native package.** Plugins legitimately declare the harness packages they load against as peers; changing the published package would not remove the manifest's obligation to name what the runtime resolves.

## Consequences

Every fork sync must keep the runtime manifest closed over `dsh-base`'s graph: `pnpm run verify-runtime-closure` names missing peers, and the keyless smoke (`scripts/smoke-python-runtime.py --scenario all`) is the executed check that the packaged runtime boots. The fixtures under `scripts/snapshots/python-sdk-single-exe` carry the fork's tool set and must be refreshed whenever a fork tool changes its schema.

## Testing

Local `node24-macos-arm64` build: the staged tree lists `dsh-base` beside the other bundles, the executable boots `--profile sdk`, and `smoke-python-runtime.py --scenario all --exe <runtime>` passes after the fixture refresh. `verify-runtime-closure` reports a closed graph; hygiene and translation pairing pass.
