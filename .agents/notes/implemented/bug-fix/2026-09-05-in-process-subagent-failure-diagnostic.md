# Agent Note: In-process subagent runs carry the child's failure detail

Status: implemented

English | [中文](2026-09-05-in-process-subagent-failure-diagnostic.zh.md)

## Problem

`SubagentResult.diagnostic` is the seam's field for provider-authored failure detail, and `tool-subagent` renders it under `Diagnostic:` beside the headline. Out-of-process providers fill it through `collectDiagnostic`; the in-process driver never did. Its `readResult` folded the child's `turn/end` reason through `toStopReason`, which keeps only the terminal vocabulary — `'error'` — and discarded the `LlmFailure` beside it. A delegating tool therefore rendered `subagent run failed` and nothing else, while the actual cause (a quota ceiling, an auth rejection, an invalid request) survived only inside the child's own session log. The reporter lost days to a `429` spending cap that was recorded the whole time.

## Decision

`readResult` reads the same `turn/end` reason it already folds and, when that reason is an error, carries `reason.error.message` into the result as `diagnostic`. `limitSubagentDiagnostic` — previously private to the out-of-process module and now exported from the seam — applies the documented byte limit, so both providers bound the field with one implementation rather than two. The message is the loop's own recorded failure text; the driver adds no wording of its own.

## Alternatives considered

**Return the whole `LlmFailure` — code and status included — rather than its message.** Rejected because `diagnostic` is documented as presentation text a consumer shows beside the output, not a routing surface; `stopReason` already carries the machine-readable outcome.

**Have the tool layer read the child's session log when a run fails.** Rejected because it inverts the seam: the provider owns the account of its own failure, and a remote provider has no child session for the tool to read.

**Duplicate the byte-limit helper in the driver.** Rejected because the limit is a seam-wide contract on one documented field; two copies drift.

## Consequences

An in-process child that fails at the model-call level now reports why, in the delegating tool's result, without the operator opening the child's log. Out-of-process behavior is untouched. The field stays absent for a run that ends any other way, so a completed or cancelled result reads exactly as before.

A test asserts the result's diagnostic equals the failure the child's own `turn/end` recorded, rather than a literal string, so the wording continues to belong to the loop. It fails on the previous behavior. Reported in discussion #5754.
