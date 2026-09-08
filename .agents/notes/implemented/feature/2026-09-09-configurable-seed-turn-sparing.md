# Agent Note: Seed user turn sparing is a compaction-basic setting

Status: implemented

English | [中文](2026-09-09-configurable-seed-turn-sparing.zh.md)

## Problem

Automatic pressure compaction in `compaction-basic` keeps the first user turn on the surface so the task's seed survives verbatim. That choice was fixed in the engine: `compactIfNeeded` passed `spareSeedUserTurn: true` to `selectCompactableRange` unconditionally. A deployment could not change it, which the repository's rule against hardcoded tunables forbids, and the `acp/image-compaction` snapshot scenario stopped compacting: its only heavy content is the seed prompt's images, so sparing the seed under a `retainTokens: 100` budget leaves no span and the pressure check returns `null`. Snapshot refresh recorded that silence as the expected output, so the scenario no longer proved that route-priced image tokens drive the pressure decision.

## Decision

`spareSeedUserTurn` is a validated boolean field of `BasicCompactionConfig`, resolved in `resolveConfig` with the default `true`, and read by the automatic pressure path only. Manual compaction and context-overflow recovery keep passing no sparing, as before. The `acp/image-compaction` scenario sets `spareSeedUserTurn: false` in both its composition and its keyless replay overlay, and its fixtures again record `compaction/start`, `compaction/summary`, and `compaction/end` at turn 2.

## Alternatives considered

**Relax sparing when the spared span is empty.** Falling back to condensing the seed whenever nothing else fits would make the product behavior depend on budget arithmetic that a reader cannot see in the log, and would silently discard the seed in exactly the small-window cases where it matters most. A setting states the intent per deployment.

**Give the scenario more turns.** A longer authored fixture would leave a non-seed span, but the pressure would then come from text as well as images, weakening what the scenario proves.

**A per-model policy field.** No consumer needs sparing to differ by routed model; the field stays top-level until one does.

## Consequences

Deployments keep the seed by default. A composition whose seed is the compactable content opts out explicitly, and the reason sits beside the setting in its `cordis.yml`. The overflow-recovery comment in `compactIfNeeded` now says the pressure path spares the seed by default.

## Testing

`compaction-basic.spec.ts` covers `spareSeedUserTurn: false` condensing the seed under automatic pressure, the default sparing it, and load rejection of a non-boolean value. The `acp/image-compaction` replay records one compaction whose shadowed span begins at the seed. `verify-config-catalog` and the README table carry the field in both languages.
