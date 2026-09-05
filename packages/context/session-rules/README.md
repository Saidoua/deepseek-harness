---
description: "Session-pinned standing rules: a /rule command and a rule_pin tool whose verbatim <pinned_rules> message is republished after every compaction."
kind: "package-reference"
---

# @deepseek-ai/dsh-session-rules

English | [中文](README.zh.md)

## Summary

`dsh-session-rules` lets the user and the model pin standing session rules that survive context compaction verbatim. Summarizing compaction paraphrases rules into unenforceability, so pinned rules never enter the summary stream: the exact list is re-injected whenever the visible copy is shadowed or the list changes.

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

Mount the plugin and use `/rule <text>` to pin, `/rule list` to list, `/rule remove <n>` to remove. The model pins through the `rule_pin` tool but cannot remove rules. The list rides a durable `rule/pin`/`rule/unpin` event stream folded by the `sessionRules` projection, and one digest-checked durable message carries the verbatim list to the model.

### Configuration

`maxRules` (default 20) caps the list; `maxRuleChars` (default 500) caps one rule's length. Violations are rejected at pin time, never truncated.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

Registration is one projection plus one command plus one tool; the republish listener mirrors the skill catalog's digest scan over the durable log and replaces its publication message in place.

### Source map

| Source | Responsibility |
|---|---|
| — | No runtime invariant companion is published: the durable rule list is a projection over `rule/pin` / `rule/unpin`, and the republish is a pure function of that list's digest against the visible surface — both are covered by the package suite without a separate observation stream. |

-----

<a id="further-exploration"></a>
## Further Exploration

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.md) — the decision record this package implements.
- [Architecture overview](../../../docs/architecture.md) — the surrounding harness architecture.

-----

<a id="model-experience"></a>
## Model Experience

### Pinned rules message

#### What the model sees

The model sees one `<system-reminder>` whose `<pinned_rules>` block lists the rules numbered verbatim, plus instructions to follow them exactly and to say so when a request conflicts. A changed list republishes with a replacement declaration; an emptied list publishes a tombstone. The message is durable and re-injected after compaction.

#### Token effect

One message sized at roughly 47 tokens per rule plus fixed framing; it replaces its predecessor rather than accumulating.

#### KV Cache effect

The message content is stable while the list is unchanged, so its tokens stay prefix-cache eligible across steps.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Only the user can remove a pinned rule; the model's pin tool is pin-only by design.
- Rules are per-session; there is no cross-session rule store.
- A rule longer than `maxRuleChars` is rejected; the harness never truncates rule text.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Introduced alongside the other session-resilience plugins; the decision record lives in the repository's Agent Note.

</details>
