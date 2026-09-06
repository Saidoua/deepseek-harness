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
