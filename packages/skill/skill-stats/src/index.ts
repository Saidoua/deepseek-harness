/**
 * Skill usage projection over the DeepSeek Harness event-sourced session log.
 *
 * Folds, without touching the skill packages: model loads (a `skill`
 * `tool/call` paired with its `tool/result`, attributed to the requested
 * skill name from the call arguments) and user gestures (a `user/message`
 * whose source is `skill-invocation`). The wire view exposes per-skill rows
 * for UIs and offline evaluation; paired with/without measurement, not
 * static scans, is the only trustworthy skill-quality signal.
 *
 * @module @deepseek-ai/dsh-skill-stats
 */

import type { Context } from '@deepseek-ai/cordis'
import { z as zod } from 'zod'
import type { ToolCallId } from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-session-projection'
// Type-only: folds events this package observes — the `skill` tool's
// tool/call|result pairing and tool-skill's `skill-invocation` message source
// (whose MessageSourceMap merge must be in scope to narrow source.kind).
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-tool-skill'
export type * from './types.ts'
import type { SkillStatsState, SkillUsage, SkillUsageRecord } from './types.ts'

export const name = 'skill-stats'
export const inject = ['sessionProjections']

const usageSchema = zod.object({
  invocations: zod.number(),
  errors: zod.number(),
  lastSeq: zod.number().nullable(),
  lastTime: zod.number().nullable(),
  lastVia: zod.union([zod.literal('tool'), zod.literal('gesture'), zod.null()]),
})

const skillStatsStateSchema = zod.object({
  pending: zod.record(zod.string(), zod.string()),
  skills: zod.record(zod.string(), usageSchema),
})

const emptyUsage: SkillUsage = { invocations: 0, errors: 0, lastSeq: null, lastTime: null, lastVia: null }

/** Attribution from one `skill` tool-call arguments payload; tolerant of malformed JSON. */
function requestedSkillName(argumentsJson: string): string | undefined {
  try {
    const parsed = JSON.parse(argumentsJson) as { name?: unknown }
    return typeof parsed.name === 'string' && parsed.name !== '' ? parsed.name : undefined
  } catch {
    return undefined
  }
}

function recordFor(state: SkillStatsState, skill: string): SkillUsage {
  return state.skills[skill] ?? emptyUsage
}

/**
 * Register the `skillStats` projection unit.
 * @param ctx - registrant context carrying the session-projection registry.
 */
export function apply(ctx: Context): void {
  ctx.sessionProjections.register<'skillStats', SkillStatsState>({
    key: 'skillStats',
    stateSchema: skillStatsStateSchema,
    init: () => ({ pending: {}, skills: {} }),
    apply: (state, event) => {
      if (event.type === 'tool/call' && event.data.name === 'skill') {
        const skill = requestedSkillName(event.data.arguments) ?? 'unknown'
        return {
          pending: { ...state.pending, [event.data.callId]: skill },
          skills: state.skills,
        }
      }
      if (event.type === 'tool/result') {
        const callId = (event.data.message.source as { callId?: ToolCallId }).callId
        const skill = callId === undefined ? undefined : state.pending[callId]
        if (skill === undefined) return state
        // Rebuilt rather than deleted (dynamic deletes push objects into
        // dictionary mode): the settled call simply leaves the pairing map.
        const pending: Record<string, string> = {}
        for (const [id, pendingSkill] of Object.entries(state.pending)) {
          if (id !== callId) pending[id] = pendingSkill
        }
        const previous = recordFor(state, skill)
        return {
          pending,
          skills: {
            ...state.skills,
            [skill]: {
              invocations: previous.invocations + 1,
              errors: previous.errors + (event.data.error === undefined ? 0 : 1),
              lastSeq: event.seq,
              lastTime: event.time,
              lastVia: 'tool',
            },
          },
        }
      }
      if (event.type === 'user/message' && event.data.source.kind === 'skill-invocation') {
        const skill = event.data.source.name
        const previous = recordFor(state, skill)
        return {
          pending: state.pending,
          skills: {
            ...state.skills,
            [skill]: {
              invocations: previous.invocations + 1,
              errors: previous.errors,
              lastSeq: event.seq,
              lastTime: event.time,
              lastVia: 'gesture',
            },
          },
        }
      }
      return state
    },
    wire: {
      viewSchema: zod.array(zod.object({
        name: zod.string(),
        invocations: zod.number(),
        errors: zod.number(),
        lastSeq: zod.number().nullable(),
        lastTime: zod.number().nullable(),
        lastVia: zod.union([zod.literal('tool'), zod.literal('gesture'), zod.null()]),
      })),
      view: (state): SkillUsageRecord[] => Object.entries(state.skills)
        .map(([name, usage]) => ({ name, ...usage }))
        .sort((a, b) => b.invocations - a.invocations || a.name.localeCompare(b.name)),
    },
    stateVersion: 1,
  })
}
