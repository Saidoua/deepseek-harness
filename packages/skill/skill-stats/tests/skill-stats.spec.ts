import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { createUserMessage, MessageId, ToolCallId } from '@deepseek-ai/dsh-llm'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'

import * as skillStats from '../src/index.ts'

const APPEND = { surfaceOp: 'append' } as const

async function setup(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(skillStats)
  return ctx
}

function statsOf(ctx: Context, session: Session) {
  return ctx.sessionProjections.stateOf(session, 'skillStats')
}

function viewOf(ctx: Context, session: Session) {
  const snapshot = ctx.sessionProjections.snapshot(session, ['skillStats'])
  return (snapshot.values as { skillStats: unknown }).skillStats
}

/** Append one settled `skill` tool call + result pair (or error via `error`). */
function appendSkillToolCall(
  session: Session,
  call: string,
  skillName: string,
  options: { error?: boolean; name?: string } = {},
): void {
  const toolName = options.name ?? 'skill'
  session.append('tool/call', {
    turn: 1, step: 1, callId: ToolCallId(call), name: toolName,
    arguments: toolName === 'skill' ? JSON.stringify({ name: skillName }) : '{}',
  })
  session.append('tool/result', {
    turn: 1, step: 1,
    message: {
      role: 'user', id: MessageId(`m-${call}`),
      content: [{ type: 'tool-result', toolCallId: ToolCallId(call), content: [{ type: 'text', text: 'x' }], isError: options.error === true }],
      source: { kind: 'tool', callId: ToolCallId(call) },
    },
    ...options.error === true ? { error: { name: 'Error', code: 'unknown' } } : {},
  }, APPEND)
}

function appendGesture(session: Session, name: string): void {
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: `injected ${name}` }],
    source: { kind: 'skill-invocation', name, form: 'instructions' },
  }), APPEND)
}

describe('dsh-skill-stats projection', () => {
  it('pairs a skill tool/call with its result and counts one tool invocation', async () => {
    const ctx = await setup()
    const session = Session.create(SessionId('s1'))
    appendSkillToolCall(session, 'c1', 'pdf-report')

    const state = statsOf(ctx, session)
    expect(state?.pending).toEqual({})
    expect(state?.skills['pdf-report']).toMatchObject({ invocations: 1, errors: 0, lastVia: 'tool' })
  })

  it('counts an errored skill load as an error', async () => {
    const ctx = await setup()
    const session = Session.create(SessionId('s2'))
    appendSkillToolCall(session, 'c2', 'missing-skill', { error: true })

    expect(statsOf(ctx, session)?.skills['missing-skill']).toMatchObject({ invocations: 1, errors: 1 })
  })

  it('attributes a malformed-arguments call to the unknown bucket', async () => {
    const ctx = await setup()
    const session = Session.create(SessionId('s3'))
    session.append('tool/call', { turn: 1, step: 1, callId: ToolCallId('c3'), name: 'skill', arguments: 'not-json' })
    session.append('tool/result', {
      turn: 1, step: 1,
      message: {
        role: 'user', id: MessageId('m3'),
        content: [{ type: 'tool-result', toolCallId: ToolCallId('c3'), content: [{ type: 'text', text: 'x' }] }],
        source: { kind: 'tool', callId: ToolCallId('c3') },
      },
    }, APPEND)

    expect(statsOf(ctx, session)?.skills.unknown).toMatchObject({ invocations: 1 })
  })

  it('ignores non-skill tool calls entirely', async () => {
    const ctx = await setup()
    const session = Session.create(SessionId('s4'))
    appendSkillToolCall(session, 'c4', 'whatever', { name: 'bash' })

    const state = statsOf(ctx, session)
    expect(state?.skills).toEqual({})
    expect(state?.pending).toEqual({})
  })

  it('counts a /name gesture invocation without a tool pairing', async () => {
    const ctx = await setup()
    const session = Session.create(SessionId('s5'))
    appendGesture(session, 'deploy-docs')

    const state = statsOf(ctx, session)
    expect(state?.skills['deploy-docs']).toMatchObject({ invocations: 1, errors: 0, lastVia: 'gesture' })
    expect(state?.pending).toEqual({})
  })

  it('aggregates repeated invocations with latest-wins lastSeq/lastTime/lastVia', async () => {
    const ctx = await setup()
    const session = Session.create(SessionId('s6'))
    appendGesture(session, 'deploy-docs')
    appendSkillToolCall(session, 'c6', 'deploy-docs')

    const state = statsOf(ctx, session)
    expect(state?.skills['deploy-docs']?.invocations).toBe(2)
    expect(state?.skills['deploy-docs']?.lastVia).toBe('tool')
  })

  it('exposes a wire view of per-skill rows sorted by invocations, without pending state', async () => {
    const ctx = await setup()
    const session = Session.create(SessionId('s7'))
    appendSkillToolCall(session, 'c7', 'b-skill')
    appendGesture(session, 'a-skill')
    appendGesture(session, 'a-skill')

    // `expect.any` is typed `any`; naming it once keeps the assertion typed.
    const anyNumber = expect.any(Number) as number
    expect(viewOf(ctx, session)).toEqual([
      { name: 'a-skill', invocations: 2, errors: 0, lastSeq: anyNumber, lastTime: anyNumber, lastVia: 'gesture' },
      { name: 'b-skill', invocations: 1, errors: 0, lastSeq: anyNumber, lastTime: anyNumber, lastVia: 'tool' },
    ])
  })
})
