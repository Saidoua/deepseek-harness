# Agent Note: The base bundle mounts the published search plugin

Status: implemented

English | [中文](2026-09-06-published-search-plugin-in-base-bundle.zh.md)

## Problem

The in-process search backend reached the tools as a source patch inside `@deepseek-ai/dsh-tool-fs-search`: a `native.ts` module loading the addon through `createRequire`, an `optionalDependencies` entry, a workspace override, a third-party-notices exemption, and per-backend test wiring. That diverges a package this repository tracks from upstream for a capability that is now published and versioned on its own, and every upstream merge has to reconcile the divergence by hand.

## Decision

`packages/fs/tool-fs-search` returns to its upstream contents exactly. The base bundle's `tool-fs-search` entry instead mounts `@saidouahdachi/dsh-tool-fs-search-native`, pinned to `0.1.1`, with `sampleOverCapGlobResults: false` and `whenAddonMissing: spawn`.

The plugin registers `glob` and `grep` against the `@saidouahdachi/dsh-native` addon and reuses the in-box package's exported parsers, formatters, presenters, and spill recovery, so tool names, JSON schemas, system-prompt guidance, render text, and search cards are unchanged — only `execute` differs. With no usable addon, the plugin registers the in-box spawn-backed tools itself, so a platform without a prebuilt binary and a `DSH_NATIVE=0` deployment behave exactly as an unpatched profile.

The entry id stays `tool-fs-search`. Ids are composition slots, not package names, and [the web bundle](../../../../packages/bundle/web-app/cordis.patch.yml) disables the search tools in the client plane by that id.

## Alternatives considered

- **Keep the source patch.** It duplicates an implementation that is published and versioned, and it makes every upstream merge reconcile a package this repository does not own. The plugin seam expresses the same runtime behavior as composition.
- **Give the plugin a new entry id.** The web bundle's `- id: tool-fs-search / disabled: true` row would then name an entry that does not exist — a stderr warning at boot — and the search tools would mount in the client plane where that row exists to keep them out.
- **A version range instead of an exact pin.** The addon's prebuilt family and the plugin move together; an exact pin keeps the shipped composition reproducible and makes an upgrade an explicit, reviewable edit.

## Consequences

`packages/fs/tool-fs-search` matches upstream again: `native.ts`, the `optionalDependencies` entry, the `pnpm-workspace.yaml` override, the notices-generator exemption, and the per-backend test wiring are gone, so an upstream merge of that package reconciles nothing local.

The base bundle now resolves a runtime dependency outside the `@deepseek-ai` scope, so installing the shipped composition reaches the public registry and `THIRD_PARTY_NOTICES.md` lists the plugin. Upgrading the addon is an edit to the entry's pin, reviewable in the composition diff, rather than a workspace override that never reaches a published manifest. [`apps/cli/composition.md`](../../../../apps/cli/composition.md) and the [shipped-composition test](../../../../apps/web/tests/shipped-composition.e2e.ts) name the published package, so a rename or a withdrawn version fails there rather than at a user's boot.

Tool names, JSON schemas, system-prompt guidance, render text, and search cards are unchanged, so no session event, snapshot, or SDK expectation moves. A platform without a prebuilt binary, and a `DSH_NATIVE=0` deployment, register the in-box spawn-backed tools — the unpatched profile's behavior.

The base bundle can no longer be built from workspace sources alone, and a plugin version that breaks the registration seam surfaces at boot or in the composition test, not in this repository's typecheck.

The predecessor note on the addon as an optional registry dependency was deleted with the patch it described: `dsh-tool-fs-search` declares no addon dependency, so its manifest rationale has no subject. Its notices rationale does not carry forward either: the generator's first-party set covers packages this repository builds and licenses, not every package its owner wrote, so the addon's exemption is gone and the plugin is listed under its own terms.
