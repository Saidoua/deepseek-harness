---
description: "Model-facing state_write tool: a typed working-state snapshot (string sets a key, null deletes) that is re-injected as one replacing block after every compaction."
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-state

English | [中文](README.zh.md)

## Summary

`dsh-tool-state` maintains the session's typed working state: a small key/value record of the task's durable facts. The state is one replacing snapshot — updating it rewrites the visible block instead of growing history — and it is re-injected verbatim after compaction, so long-horizon work does not depend on surviving prose.

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

Mount the plugin; the agent calls `state_write` with a patch object. A string or array of strings sets a key; `null` deletes it. Suggested keys (`goal`, `decisions`, `files_touched`, `blockers`, `next_steps`) are conventions; any flat key is accepted. The state rides a last-wins `state/write` event folded by the `taskState` projection.

### Configuration

`maxStateChars` (default 4000) bounds the rendered snapshot; `maxKeys` (default 50) bounds the key count. The budget is enforced at write time against the same renderer the injection uses.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

Registration is one projection plus one tool; the republish listener mirrors the skill catalog's digest scan and replaces its snapshot message in place, including a tombstone when the state empties.

### Source map

| Source | Responsibility |
|---|---|
| — | No runtime invariant companion is published: the working state is one last-wins `state/write` snapshot, so there is no cross-event ordering invariant to observe beyond what the package suite asserts. |

-----

<a id="further-exploration"></a>
## Further Exploration

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.md) — the decision record this package implements.
- [Architecture overview](../../../docs/architecture.md) — the surrounding harness architecture.

-----

<a id="model-experience"></a>
## Model Experience

### Working state snapshot

#### What the model sees

The model sees one `<system-reminder>` whose `<task_state>` block renders the merged state with sorted keys, plus update semantics (a string sets a key, `null` deletes) and an authority statement. The message is durable and re-injected after compaction; an emptied state publishes a tombstone.

#### Token effect

One message bounded by `maxStateChars` at write time; it replaces its predecessor rather than accumulating.

#### KV Cache effect

The rendered text is deterministic for a given state, so its tokens stay prefix-cache eligible while the state is unchanged.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Values are flat: a string or an array of strings. Nested objects are rejected rather than silently reshaped.
- The state is per-session; there is no cross-session persistence beyond the session log.
- `state_write` records durable facts; step-level progress belongs to `todo_write` and objective lifecycle to the goal tools.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Introduced alongside the other session-resilience plugins; the decision record lives in the repository's Agent Note.

</details>
