---
description: "Session projection of skill invocations: per-skill usage and error counts folded from the durable log, split by model loads and user gestures."
kind: "package-reference"
---

# @deepseek-ai/dsh-skill-stats

English | [中文](README.zh.md)

## Summary

`dsh-skill-stats` folds the session log into per-skill usage rows: invocations, errors, the last invocation's position and time, and whether it was a model `skill`-tool load or a `/name` gesture. Runtime outcomes are the trustworthy skill-quality signal; static scans do not predict it.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)


-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin; the `skillStats` projection is available to UIs and offline evaluation through the session-projection registry. There is no model-facing surface.

### Configuration

None — the projection has no tunables.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

One pure projection: a `skill` `tool/call` is paired with its `tool/result` by call id (the skill name is read from the call arguments; malformed calls land in an `unknown` bucket), and `skill-invocation`-sourced messages count as gestures.

### Source map

| Source | Responsibility |
|---|---|
| — | No runtime invariant companion is published: the projection folds existing `tool/call`, `tool/result`, and skill-invocation events and emits none of its own. |

-----

<a id="further-exploration"></a>
## Further Exploration

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.md) — the decision record this package implements.
- [Architecture overview](../../../docs/architecture.md) — the surrounding harness architecture.

-----

<a id="model-experience"></a>
## Model Experience

None, as the unit folds already-logged tool and message events into a client-facing read model and registers nothing model-facing.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Observation only: the projection records invocations; it does not score quality. Paired with/without trials remain the evaluation protocol.
- The `unknown` bucket absorbs `skill` calls whose arguments are not valid JSON.
- Mounted only where the projection registry is composed.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Introduced alongside the other session-resilience plugins; the decision record lives in the repository's Agent Note.

</details>
