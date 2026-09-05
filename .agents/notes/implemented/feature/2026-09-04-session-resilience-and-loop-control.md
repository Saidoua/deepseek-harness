# Agent Note: Session resilience plugins

Status: implemented

English | [中文](2026-09-04-session-resilience-and-loop-control.zh.md)

## Problem

LLM-summarizing compaction paraphrases three things the harness needs intact: standing rules and constraints stated mid-session (measured 53% exact retention after one compaction round and 10% after five — The Compaction Cliff, arXiv:2608.22752), the user's original task anchor, and durable task facts that otherwise exist only in scrolling prose (SKILL.state, arXiv:2608.26263: at matched token budgets an explicit state scores 0.94 against 0.18 for a sliding window, 0.52 for summary, 0.84 for full history; Recuris, arXiv:2608.24876: working memory alone carries +23.9 points). Separately, the skill layer had no runtime usage signal (static skill scans correlate ρ = 0.14 with runtime value — arXiv:2608.20614), no provenance marking (Daydreaming, arXiv:2608.26733: ~32 ordinary black-box tasks functionally reconstruct a hidden multi-file skill), and no loop control beyond static goal restatement, which performs exactly like no control (LoopArena, arXiv:2608.28281).

## Decision

Four packages on documented seams, no `agent-loop` changes:

- `packages/context/session-rules` — `/rule` and the `rule_pin` tool append `rule/pin`/`rule/unpin` events; a digest-checked durable `<pinned_rules>` message is republished verbatim whenever compaction shadows it or the list changes. Only the user removes rules; the model can pin.
- `packages/todo/tool-state` — `state_write` maintains one replacing `<task_state>` snapshot (a string sets a key, `null` deletes it; values are flat `string | string[]`), carried by a last-wins `state/write` event and republished like the skill catalog.
- Skill layer — `SkillSummary.trusted` (the `custom` and `user-agents` roots are untrusted by default; `untrustedSources` replaces the set; untrusted bodies render behind a caution that precedes the `<skill_content>` wrapper) and the `skill-stats` usage projection (invocations, errors, tool-vs-gesture per skill, folded from the log).
- `compaction-basic` seed sparing — automatic pressure spans start after the first genuine user message; a span holding only previous checkpoints is declined (re-framing it can never pass the shrink guard); context-overflow recovery and `compactNow` still reclaim everything, because an overflow is reached only after pressure compaction spared the seed and the request still did not fit (a spared overflow span can be one runtime-context message, which never shrinks, and the provider error then stands with no way back); an orphaned `compaction/start` reports `busy` before selection.
- `packages/compaction/compaction-prefix-slide` — a `compaction-basic` subclass whose summarizer returns a fixed eviction marker; mounted only by swapping the `compaction-basic` row's name in an overlay.

## Alternatives considered

**Summarizer instructions that preserve rules verbatim.** Rejected: the measured drift happens under summarization itself; a paraphrasing pipeline cannot guarantee verbatim survival.

**A lessons wiki, runtime or offline.** Rejected. Runtime: WikiSkill measures runtime wiki access as a regression (63.7 → 60.9); knowledge compiles into skills at maintenance time. Offline (a `/lesson` command appending dated lines to a project markdown file): nothing model-facing and nothing measurable — a human appends to a markdown file without a command.

**A runtime controller checkpoint.** Rejected: an auxiliary model call every N steps reviewing an evidence packet and issuing advance/verify/stop costs a measured 1.13 s of blocking step latency and ~510 tokens per checkpoint (5.7 s and ~2 500 tokens over a 40-step turn at N = 8), with no eval here able to show a benefit against it; and its strongest directive, `stop`, can only inject a sentence — it cannot stop the loop — which is the shape LoopArena measures as equivalent to no control.

**Result-replay memoization of read-only tools.** Rejected: the documented seams cannot replay a result (`tools/pre-execute` is allow/deny/ask; the `tools/execute` around-waterfall contract allows changing only `exec.signal`), and a replayed `read` would skip the read-before-edit observation. Doing it anyway means core registry changes with new cancellation invariants.

**Prefix-slide as the default compaction engine.** Rejected: eviction without summary is correct only where durable facts live in replacing snapshots; LLM summarization stays the shipped default, and the overlay swap is one row.

**Lazy body IO during skill discovery.** Rejected: discovery reads the same file it would read for frontmatter alone, and prompt-level progressive disclosure (name+description catalog, bodies on `ctx.skills.get()`) already bounds context.

## Consequences

- The two model-visible plugins (session-rules, tool-state) ship **enabled** in the dsh-base bundle, and the recorded-session corpus is pinned with the two tool schemas they add. Where presets compose the agent plane they are agent-plane rows like `tool-todo` — disabled in the web host composition and mounted by the `standard`, `ptc`, and `cordis` presets — so `minimal` keeps its exact two-tool surface and the host tool layer stays empty; profiles without presets keep them host-side. Their measured cost is the tool schema on every request of an agent that mounts them: 140 tokens for `rule_pin`, 243 for `state_write`, plus 116 / 62 tokens for the injected message while rules are pinned or state is set. That schema is a floor compaction cannot evict, and in `acp/image-compaction` it moves the compaction boundary. `skill-stats` is log-only and registers nothing model-facing.
- Pinned rules and the working state survive every compaction verbatim, including across repeated rounds; removal of a rule or clearing of the state publishes tombstones so stale guidance cannot persist.
- `compaction-prefix-slide` is shipped unmounted; the overlay swap is one row and inherits the entire transaction machinery. Measured saving when mounted: one summarizer call per compaction, 5.3 s and ~13 000 prompt tokens on a 60-turn span.
- Skill authors can no longer rely on untrusted-root skills being followed silently: untrusted bodies are framed as data to verify, and the `skill-stats` projection records whether they are actually invoked and whether they errored.
