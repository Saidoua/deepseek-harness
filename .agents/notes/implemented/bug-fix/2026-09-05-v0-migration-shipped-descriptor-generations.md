# Agent Note: Format v0 migration admits the descriptor generations v0 shipped

Status: implemented

English | [中文](2026-09-05-v0-migration-shipped-descriptor-generations.zh.md)

## Problem

`assertReleasedEventPayload` validates a `subagent/descriptor` payload against descriptor version 3 and, when the artifact being read is the v0 source, refused every other version with `SessionFormatUnsupportedMigrationError`. Descriptor 3 replaced descriptor 2 inside format v0's own life, so released v0 logs legitimately carry version 2, and the refusal made every session written before that bump unopenable as soon as it held one subagent child — the migration failed, so the whole session did. The v1 side of the same function already passed such a payload through unread, which is the asymmetry that exposed the mistake: the older format was the strict one.

## Decision

The source side admits the generations format v0 actually shipped — `RELEASED_V0_DESCRIPTOR_VERSIONS` is `{2, 3}` — and keeps refusing everything else. A descriptor from a build newer than this migration is still rejected rather than carried into v1, which is what the source-side check exists to do. An admitted older descriptor is passed through unread exactly as the v1 side passes it: `parseSubagentDescriptor` answers `undefined` for a version this runtime does not support, so the affected child loses cold resume while its session migrates and opens.

## Alternatives considered

**Tolerate every descriptor version on the source side, mirroring the v1 branch.** Rejected because it discards the forward-compatibility guard: a log written by a newer build would be silently migrated by an older one. The existing version-4 case pins that refusal.

**Normalize descriptor 2 into 3 during the v0→v1 edge.** Rejected on two counts. It rewrites committed session content, which [adjacent migration](../architecture/2026-08-31-released-session-format-migrations.md) does not permit; and it would feed a version-2 payload to the version-3 parser, defeating the very gate at `parseSubagentDescriptor` that exists to stop that. A field that changed between the two generations would become silent corruption rather than a missing descriptor.

**Leave the refusal and document the hand-edit.** Rejected because the data is valid for its format: the session is not corrupt, and no user should edit a durable log to open it.

## Consequences

A pre-bump session containing a subagent child migrates and opens. Its child is not cold-resumable, because the runtime does not parse a version-2 descriptor — the same outcome that session already had before this migration existed, and visible rather than fatal. Sessions whose descriptors are already version 3 are unaffected.

The `source/current policy` test now pins both directions: version 4 from the future is still refused, and version 2 from the past migrates. Both assertions fail on the previous behavior. Reported in discussion #5753.
