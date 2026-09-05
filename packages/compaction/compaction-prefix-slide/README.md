---
description: "Drop-in compaction-basic replacement: evicts the pairing-balanced middle without any summarizer call, keeping the seed turn and the retained tail verbatim."
kind: "package-reference"
---

# @deepseek-ai/dsh-compaction-prefix-slide

English | [中文](README.zh.md)

## Summary

`dsh-compaction-prefix-slide` replaces LLM-summarizing compaction with pure eviction: the middle of the conversation is shadowed behind a fixed marker while the spared seed turn and the retained tail survive verbatim. Compaction becomes instant, deterministic, and free of model calls. The regime assumes durable facts live in replacing snapshots (working state, pinned rules, this checkpoint) rather than in scrolling prose.

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

Mount it instead of `compaction-basic` by swapping that row's `name` in a later patch layer; thresholds, retention, retries, `/compact`, and the checkpoint bracket are inherited unchanged.

### Configuration

Same configuration surface as `compaction-basic` (`thresholdRatio`, `retainRatio`/`retainTokens`, retries, model policies). The summarizer fields are unused.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

One subclass overriding the base engine's summarizer hook; the region selection, pairing balance, seed sparing, transaction bracket, and durability checkpoints are the shipped compaction-basic code.

### Source map

| Source | Responsibility |
|---|---|
| — | No runtime invariant companion is published: this engine overrides one method of `compaction-basic` and inherits its transaction, threshold, and checkpoint invariants unchanged. |

-----

<a id="further-exploration"></a>
## Further Exploration

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.md) — the decision record this package implements.
- [Architecture overview](../../../docs/architecture.md) — the surrounding harness architecture.

-----

<a id="model-experience"></a>
## Model Experience

### Eviction marker

#### What the model sees

The model sees one checkpoint message starting with the inline `[prefix slide]` marker and stating how many earlier messages were evicted without summarization and where durable facts live (the working state snapshot, pinned rules, and the checkpoint itself). The evicted prose is intentionally absent from the request.

#### Token effect

One small message per compaction, replacing a span that is typically orders of magnitude larger; no summarizer call is spent.

#### KV Cache effect

The marker text is fixed for a given evicted count, and evictions are infrequent relative to steps, so prefix-cache invalidation is rare.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Evicted prose is gone without a summary: deployments without a replacing state snapshot lose that content on purpose.
- A span smaller than the framed marker cannot be compacted (the shrink guard rejects it); micro-spans decline instead of thrashing.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Introduced alongside the other session-resilience plugins; the decision record lives in the repository's Agent Note.

</details>
