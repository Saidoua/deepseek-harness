import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { createUserMessage, ToolCallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import AgentRegistry, { agentEvents, Inbox, type Agent } from '@deepseek-ai/dsh-agent'
import { Session, SessionId, SessionLogOffset, type SessionEvent, type UserMessage } from '@deepseek-ai/dsh-session'

import * as toolState from '../src/index.ts'

const testToolSignal = new AbortController().signal

async function setup(config: toolState.Config = {}): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(toolState, config)
  return ctx
}

function openSession(id = 'state'): { agent: Agent; session: Session } {
  const session = Session.create(SessionId(id))
  session.append('turn/start', { turn: 1 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'turn 1' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  const agent = {
    id: SessionId(id),
    options: {},
    session,
    inbox: new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} }),
    status: 'running',
    ctx: new Context(),
    send: () => {},
    followup: () => {},
    steer: () => {},
    inject: () => {},
    cancel() {},
    runMaintenance: (task: (signal: AbortSignal) => unknown) => task(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  } as unknown as Agent
  return { agent, session }
}

let callCounter = 0
function callState(ctx: Context, args: unknown, agent?: Agent) {
  return ctx.tools.execute({
    signal: testToolSignal,
    callId: ToolCallId(`call-${++callCounter}`),
    name: 'state_write',
    arguments: args,
    ...agent !== undefined ? { agent } : {},
  })
}

function text(block: { type: string; text?: string } | undefined): string {
  return block?.type === 'text' ? block.text ?? '' : ''
}

/** Drive the step-boundary waterfall and commit its injections, like the loop does. */
async function fireStep(ctx: Context, agent: Agent, turn = 1, step = 1): Promise<UserMessage[]> {
  const decision = await agentEvents(ctx, agent).waterfall(
    'agent/pre-step',
    { messages: [], turn, step, signal: new AbortController().signal },
    () => Promise.resolve({ kind: 'enter' as const, messages: [] as UserMessage[] }),
  )
  if (decision.kind === 'enter') {
    for (const message of decision.messages) {
      agent.session.append('user/message', message, { surfaceOp: 'append' })
    }
    return decision.messages
  }
  throw new Error(`unexpected pre-step rejection: ${JSON.stringify(decision)}`)
}

function publications(session: Session): Extract<SessionEvent, { type: 'user/message' }>[] {
  return session.snapshotEvents().filter((event): event is Extract<SessionEvent, { type: 'user/message' }> =>
    event.type === 'user/message' && event.data.source.kind === 'task-state')
}

function textOf(message: UserMessage): string {
  return text(message.content[0])
}

describe('dsh-tool-state state_write', () => {
  it('registers a state_write tool with a free-form patch object', async () => {
    const ctx = await setup()
    const schema = ctx.tools.schemas().find(s => s.name === 'state_write')
    expect(schema).toBeDefined()
    const props = (schema!.parameters as { properties?: Record<string, unknown> }).properties ?? {}
    expect(Object.keys(props)).toEqual(['patch'])
    expect(props.patch).toMatchObject({ type: 'object', additionalProperties: true })
  })

  it('merges a patch: strings set, arrays set, null deletes', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('merge')
    await callState(ctx, { patch: {
      goal: '  Migrate auth to OAuth2  ',
      files_touched: ['src/auth.ts', 'src/token.ts'],
      blockers: 'waiting on staging',
    } }, agent)
    const first = session.snapshotEvents().findLast(event => event.type === 'state/write')
    expect(first?.type === 'state/write' && first.data.state).toEqual({
      goal: 'Migrate auth to OAuth2',
      files_touched: ['src/auth.ts', 'src/token.ts'],
      blockers: 'waiting on staging',
    })

    await callState(ctx, { patch: { blockers: null, next_steps: 'write tests' } }, agent)
    const second = session.snapshotEvents().findLast(event => event.type === 'state/write')
    expect(second?.type === 'state/write' && second.data.state).toEqual({
      goal: 'Migrate auth to OAuth2',
      files_touched: ['src/auth.ts', 'src/token.ts'],
      next_steps: 'write tests',
    })
  })

  it('writes state null once the last key is deleted', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('empty')
    await callState(ctx, { patch: { goal: 'x' } }, agent)
    const result = await callState(ctx, { patch: { goal: null } }, agent)
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected state_write success')
    expect((result.value as { state: unknown }).state).toBeNull()
    expect(session.snapshotEvents().findLast(event => event.type === 'state/write')?.type === 'state/write'
      && session.snapshotEvents().findLast(event => event.type === 'state/write')!.data.state).toBeNull()
  })

  it.each([
    { label: 'non-object patch', args: { patch: 'nope' }, fragment: 'must be an object' },
    { label: 'empty patch', args: { patch: {} }, fragment: 'at least one key' },
    { label: 'empty string value', args: { patch: { goal: '   ' } }, fragment: 'use null to delete' },
    { label: 'nested object value', args: { patch: { goal: { deep: true } } }, fragment: 'must be null, a string' },
    { label: 'mixed array value', args: { patch: { files: ['a', 3] } }, fragment: 'must be null, a string' },
  ])('rejects $label without appending', async ({ args, fragment }) => {
    const ctx = await setup()
    const { agent, session } = openSession('reject')
    const result = await callState(ctx, args, agent)
    expect(result.isError).toBe(true)
    expect(text(result.content[0])).toContain(fragment)
    expect(session.snapshotEvents().some(event => event.type === 'state/write')).toBe(false)
  })

  it('rejects a patch whose merged state exceeds the render budget', async () => {
    const ctx = await setup({ maxStateChars: 500 })
    const { agent, session } = openSession('budget')
    const ok = await callState(ctx, { patch: { goal: 'x'.repeat(100) } }, agent)
    expect(ok.isError).toBe(false)
    const over = await callState(ctx, { patch: { files: Array.from({ length: 10 }, (_, i) => `file-${String(i)}-${'y'.repeat(40)}`) } }, agent)
    expect(over.isError).toBe(true)
    expect(text(over.content[0])).toContain('budget')
    expect(session.snapshotEvents().filter(event => event.type === 'state/write')).toHaveLength(1)
  })

  it('rejects a non-agent caller (state has no owning session)', async () => {
    const ctx = await setup()
    const result = await callState(ctx, { patch: { goal: 'x' } })
    expect(result.isError).toBe(true)
    expect(text(result.content[0])).toContain('owning agent session')
  })

  it('round-trips a seeded replay identically (last-write-wins fold)', async () => {
    const session = Session.create(SessionId('replay'))
    session.append('turn/start', { turn: 1 })
    session.append('state/write', { state: { goal: 'first' } })
    session.append('state/write', { state: { goal: 'second', files: ['a'] } })
    const replay = Session.create(SessionId('replay-2'), session.snapshotEvents())
    expect(replay.snapshotEvents(SessionLogOffset(0), session.seq)).toEqual(session.snapshotEvents())
  })
})

describe('dsh-tool-state step-boundary injection', () => {
  it('publishes the state sorted by key on the next step', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-first')
    await callState(ctx, { patch: {
      goal: 'Migrate auth',
      files_touched: ['src/auth.ts'],
      blockers: 'staging',
    } }, agent)

    const injected = await fireStep(ctx, agent)
    expect(injected).toHaveLength(1)
    const body = textOf(injected[0]!)
    expect(body).toContain('<task_state>')
    expect(body).toContain('blockers: staging')
    expect(body).toContain('files_touched:\n  - src/auth.ts')
    expect(body).toContain('goal: Migrate auth')
    // Sorted: blockers before files_touched before goal.
    expect(body.indexOf('blockers:')).toBeLessThan(body.indexOf('goal:'))
    expect(body).not.toContain('This snapshot replaces')

    const source = publications(session).at(-1)!.data.source
    expect(source.kind === 'task-state' && source.update).toBeUndefined()
  })

  it('does not duplicate when the state is unchanged', async () => {
    const ctx = await setup()
    const { agent } = openSession('inject-stable')
    await callState(ctx, { patch: { goal: 'stable' } }, agent)
    await fireStep(ctx, agent)
    const again = await fireStep(ctx, agent, 1, 2)
    expect(again).toHaveLength(0)
  })

  it('replaces the snapshot in place when the state changes (no accumulation)', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-replace')
    await callState(ctx, { patch: { goal: 'v1', step: 'one' } }, agent)
    await fireStep(ctx, agent)
    await callState(ctx, { patch: { step: 'two' } }, agent)
    await fireStep(ctx, agent, 1, 2)

    const all = publications(session)
    expect(all).toHaveLength(2)
    const latest = all.at(-1)!
    const body = textOf({ content: latest.data.content } as UserMessage)
    expect(body).toContain('This snapshot replaces')
    expect(body).toContain('step: two')
    // Exactly one publication is visible after the replacement step.
    const visible = new Set(session.surface.nodes)
    expect(visible.has(all[0]!.seq)).toBe(true)
    expect(visible.has(latest.seq)).toBe(true)
  })

  it('republishes verbatim after compaction-style shadowing, three rounds in a row', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-shadow')
    await callState(ctx, { patch: { goal: 'Ship the release', blockers: 'waiting on review' } }, agent)
    await fireStep(ctx, agent)
    const first = publications(session).at(-1)!

    let shadowed = first.seq
    for (let round = 0; round < 3; round += 1) {
      session.append('user/message', createUserMessage({
        content: [{ type: 'text', text: `compaction ${String(round)}` }],
        source: { kind: 'plugin', plugin: 'test-compaction' },
      }), {
        surfaceOp: { op: 'replace', start: shadowed, end: shadowed },
        sourceEventSeqs: [shadowed],
      })
      const restored = await fireStep(ctx, agent, 1, round + 2)
      expect(restored).toHaveLength(1)
      const body = textOf(restored[0]!)
      expect(body).toContain('Ship the release')
      expect(body).toContain('waiting on review')
      expect(body).toContain('This snapshot replaces')
      shadowed = publications(session).at(-1)!.seq
    }
  })

  it('publishes a cleared tombstone once the state is emptied', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-clear')
    await callState(ctx, { patch: { goal: 'temporary' } }, agent)
    await fireStep(ctx, agent)

    await callState(ctx, { patch: { goal: null } }, agent)
    const cleared = await fireStep(ctx, agent, 1, 2)
    expect(cleared).toHaveLength(1)
    expect(textOf(cleared[0]!)).toContain('working state is now empty')
    expect(publications(session).at(-1)!.data.source).toMatchObject({
      kind: 'task-state',
      update: true,
      state: {},
    })
  })

  it('injects nothing before the first write', async () => {
    const ctx = await setup()
    const { agent } = openSession('inject-empty')
    const injected = await fireStep(ctx, agent)
    expect(injected).toHaveLength(0)
  })
})
