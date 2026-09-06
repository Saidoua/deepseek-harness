# Agent Note: Session.append writes the ignorable marker

Status: implemented

English | [中文](2026-09-06-session-append-ignorable-writer.zh.md)

## Problem

The session event envelope carries `ignorable?: true` so a reader that meets an unrecognized event type can skip that event instead of refusing the whole log, and the [external-plugin retention decision](../architecture/2026-08-30-retain-ignorable-external-session-events.md) keeps the field for an out-of-repository plugin that depends on it. Every representation preserved it — seed validation, JSONL, API transport, generated catalogs, and test fixtures — except the writer.

`Session.append` built its envelope from a fixed literal with no `ignorable` in it, and its only optional argument was a `SurfaceIntent`, which the compiler rejects on a non-surface type. A plugin that declaration-merges its own event type could therefore append the event and see it accepted, while `validateStoredEvents` refused the entire session on the next cold load: the event type is outside the generated `KNOWN_SESSION_EVENT_TYPES` and nothing marked it skippable. The cost fell on the whole session rather than the one event, and the harness refused a log it had itself accepted.

## Decision

`Session.append` takes a `LogIntent` on every event type outside `SurfaceEventType`, and its `ignorable: true` sets the envelope field. The marker is omitted from the envelope when unset, so an unmarked event stays byte-identical to what the previous writer produced and remains required-on-read.

A `SurfaceEventType` event cannot be marked. It produces derived model history, so a reader skipping it would change the reconstruction the marker exists to leave intact; those types keep taking `SurfaceIntent` and nothing else. The two intents are disjoint at the call site, which is what makes "marked" and "joins the surface" impossible to state together.

Validation stays where it already was. `append` is a typed same-process boundary, so the option carries no runtime check; seed validation and the persistence seam continue to own the durable-boundary checks that pin the value to `true`.

## Testing

`packages/core/session/tests/session.spec.ts` covers the marked and unmarked envelopes, the durable snapshot, and the compiler rejecting each intent on the other event class. `packages/session/session-persistence/tests/storage-contract.spec.ts` closes the writer-to-reader loop that the defect lived in: a plugin-typed event appended with the marker survives `validateStoredEvents`, and the same event without it refuses the log.

## Alternatives considered

**A registration surface for out-of-tree event types.** Proposed repeatedly upstream, and a larger answer to the same problem: a plugin would register its vocabulary so its types become known rather than skippable. It decides ownership, versioning, and what happens when the registering plugin is uninstalled — none of which this defect requires, and all of which would sit unused while sessions keep breaking. The marker already exists and is already honoured on read; only the writer was missing.

**Accepting `ignorable` on surface events too.** The envelope permits the field on any type, so allowing it everywhere would have been one less conditional. Rejected: it would let a caller mark an event whose loss silently rewrites derived history, and the read-side guard never consults the marker for a known type anyway, so the permission would buy nothing and mislead.

**Marking at the persistence seam instead.** A backend could add the marker for types it does not know. Rejected: the writer is the only layer that knows whether losing the event is safe, which is the judgment the field records.

## Consequences

An out-of-repository plugin can write its own informational session events without costing the user the session, which is what the retention decision promised and could not deliver. The [session log version mechanism](../architecture/2026-08-10-session-log-version-mechanism.md) keeps owning the default-required rule: absent still means required, and this only gives a writer the way to say otherwise.

First-party events remain unmarked. A first-party type is in `KNOWN_SESSION_EVENT_TYPES` by construction, so the marker would never be consulted; the option exists for vocabularies this build cannot know.
