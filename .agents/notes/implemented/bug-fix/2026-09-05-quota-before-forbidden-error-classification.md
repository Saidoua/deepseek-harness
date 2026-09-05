# Agent Note: Quota exhaustion behind HTTP 403 classifies as QUOTA, not AUTH

Status: implemented

English | [中文](2026-09-05-quota-before-forbidden-error-classification.zh.md)

## Problem

`httpErrorCode` in `dsh-llm-deepseek` and `classifyPiAiError` in `dsh-llm-pi-ai` resolved 401 and 403 to `AUTH` before testing the error body with `isQuotaExceededError`, so a valid key whose balance or free tier was exhausted (`403` with `insufficient_quota`) was reported as an authentication failure, while the same body at 429 already resolved to `QUOTA`. `AUTH` is lossy downstream: the Chat and Trajectory `displayFailure` projections blank the message so a provider echo cannot retain a credential in UI state, and `MessageItem` renders the fixed `message.failure.auth` copy. The user saw `API key is invalid` and never the provider's instruction to add funds (upstream discussion [#5715](https://github.com/deepseek-ai/deepseek-harness/discussions/5715)).

## Decision

Both classifiers test in this order: 401 resolves to `AUTH`; a body naming an exhausted quota, balance, or credit resolves to `QUOTA`; 403 resolves to `AUTH`; the remaining statuses are unchanged. RFC 9110 defines 401 as unauthenticated and 403 as authenticated but refused, which is what providers return for an exhausted balance. Neither projection nor UI copy changes: with the code `QUOTA`, the projection retains the message and the UI shows it. The `dsh-llm-deepseek` README stable-code list states the same order in both languages.

## Alternatives considered

**Show the raw message in the UI for every `AUTH` failure, as the report proposed.** Rejected because `failureMessage` never receives the text — the projection has already replaced it with an empty string — and relaxing the projection would reintroduce the credential echo it exists to prevent.

**Parse the message in the client for quota tokens.** Rejected because it duplicates host classification in the client, on prose that providers reword, while the host holds the status and the structured body.

**Test quota before 401 as well.** Rejected because 401 means unauthenticated; a quota phrase in a 401 body does not make the key valid, and `AUTH` remains the actionable code.

**Introduce a new code for forbidden-with-reason responses.** Rejected because `QUOTA` already exists with terminal retry semantics and consumers; a new code would split one condition across two names.

## Consequences

A user with an exhausted quota sees the provider's message under `QUOTA`. A 403 without quota wording is still `AUTH`, and 401 handling is unchanged. A 403 whose body names a quota but is actually a permission refusal now reads `QUOTA`; that body is not observed in practice, and the message is shown verbatim either way.

`packages/llm/llm-deepseek/tests/adapter.spec.ts` and `packages/llm/llm-pi-ai/tests/convert.spec.ts` pin the three cases: 403 with quota wording resolves to `QUOTA`, plain 403 to `AUTH`, and 401 with quota wording to `AUTH`. Both tests fail on the previous ordering. The `quota-finish` recorded session replays a `QUOTA` finish through the headless profile with its provider message intact.
