import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { createUserMessage, ToolCallId } from '@deepseek-ai/dsh-llm'
import { Session, SessionId, SessionLogOffset, type SessionEvent, type UserMessage } from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import AgentRegistry, { agentEvents, Inbox, type Agent } from '@deepseek-ai/dsh-agent'

import * as sessionRules from '../src/index.ts'

const testToolSignal = new AbortController().signal

async function setup(config: sessionRules.Config = {}): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(sessionRules, config)
  return ctx
}

function sessionAgent(session: Session, id = 'session-rules-agent'): Agent {
  return {
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
}

function openSession(id = 'rules'): { agent: Agent; session: Session } {
  const session = Session.create(SessionId(id))
  session.append('turn/start', { turn: 1 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'turn 1' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  return { agent: sessionAgent(session, id), session }
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
    event.type === 'user/message' && event.data.source.kind === 'session-rules')
}

function textOf(event: Extract<SessionEvent, { type: 'user/message' }>): string {
  const [block] = event.data.content
  return block?.type === 'text' ? block.text : ''
}

async function runCommand(
  ctx: Context,
  agent: Agent,
  line: string,
): Promise<{ kind: string; text?: string } | undefined> {
  const execution = await ctx.commands.execute(agent, line, [], new AbortController().signal)
  return execution?.result
}

describe('dsh-session-rules /rule command', () => {
  it('pins a rule durably and reports the position', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('cmd-pin')
    const result = await runCommand(ctx, agent, '/rule Never push directly to main.')
    expect(result?.kind).toBe('success')
    expect(result?.text).toContain('Pinned 1/20: Never push directly to main.')

    const pin = session.snapshotEvents().findLast(event => event.type === 'rule/pin')
    expect(pin).toBeDefined()
    expect(pin?.type === 'rule/pin' && pin.data).toEqual({
      text: 'Never push directly to main.',
      origin: 'user',
    })
  })

  it('lists pinned rules numbered by pin order', async () => {
    const ctx = await setup()
    const { agent } = openSession('cmd-list')
    await runCommand(ctx, agent, '/rule first rule')
    await runCommand(ctx, agent, '/rule second rule')
    const result = await runCommand(ctx, agent, '/rule list')
    expect(result?.kind).toBe('success')
    expect(result?.text).toBe('1. first rule\n2. second rule')
  })

  it('removes a rule by position with a durable rule/unpin event', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('cmd-remove')
    await runCommand(ctx, agent, '/rule keep me')
    // Starts with "remove" yet is not the removal form: it pins.
    await runCommand(ctx, agent, '/rule remove me too')
    expect(session.snapshotEvents().filter(event => event.type === 'rule/pin')).toHaveLength(2)

    const result = await runCommand(ctx, agent, '/rule remove 2')
    expect(result?.kind).toBe('success')
    expect(result?.text).toContain('Removed pinned rule: remove me too')

    const unpin = session.snapshotEvents().findLast(event => event.type === 'rule/unpin')
    expect(unpin?.type === 'rule/unpin' && unpin.data.text).toBe('remove me too')
  })

  it('rejects an out-of-range removal and an empty invocation with usage', async () => {
    const ctx = await setup()
    const { agent } = openSession('cmd-usage')
    expect((await runCommand(ctx, agent, '/rule'))?.kind).toBe('error')
    expect((await runCommand(ctx, agent, '/rule remove 3'))?.kind).toBe('error')
  })

  it('rejects an oversized rule text instead of truncating it', async () => {
    const ctx = await setup({ maxRuleChars: 32 })
    const { agent, session } = openSession('cmd-size')
    const result = await runCommand(ctx, agent, `/rule ${'x'.repeat(40)}`)
    expect(result?.kind).toBe('error')
    expect(result?.text).toContain('at most 32 characters')
    expect(session.snapshotEvents().some(event => event.type === 'rule/pin')).toBe(false)
  })

  it('rejects a pin beyond maxRules and treats a duplicate pin as a no-op', async () => {
    const ctx = await setup({ maxRules: 2 })
    const { agent, session } = openSession('cmd-max')
    await runCommand(ctx, agent, '/rule one')
    await runCommand(ctx, agent, '/rule two')
    const third = await runCommand(ctx, agent, '/rule three')
    expect(third?.kind).toBe('error')
    expect(third?.text).toContain('remove one first')

    const duplicate = await runCommand(ctx, agent, '/rule one')
    expect(duplicate?.kind).toBe('success')
    expect(duplicate?.text).toContain('Already pinned')
    expect(session.snapshotEvents().filter(event => event.type === 'rule/pin')).toHaveLength(2)
  })
})

describe('dsh-session-rules rule_pin tool', () => {
  let callCounter = 0
  async function callPin(ctx: Context, args: unknown, agent?: Agent) {
    return await ctx.tools.execute({
      signal: testToolSignal,
      callId: ToolCallId(`call-${++callCounter}`),
      name: 'rule_pin',
      arguments: args,
      ...agent !== undefined ? { agent } : {},
    })
  }

  it('pins with model origin and returns the current list', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('tool-pin')
    const result = await callPin(ctx, { text: '  Use conventional commits.  ' }, agent)
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected rule_pin success')
    const value = result.value as { pinned: string; rules: string[]; count: number }
    expect(value.pinned).toBe('Use conventional commits.')
    expect(value.rules).toEqual(['Use conventional commits.'])

    const pin = session.snapshotEvents().findLast(event => event.type === 'rule/pin')
    expect(pin?.type === 'rule/pin' && pin.data.origin).toBe('model')
  })

  it('rejects a non-agent caller (rules have no owning session)', async () => {
    const ctx = await setup()
    const result = await callPin(ctx, { text: 'x' })
    expect(result.isError).toBe(true)
  })
})

describe('dsh-session-rules projection fold', () => {
  it('deduplicates pins by text and removes by text', () => {
    const session = Session.create(SessionId('fold'))
    session.append('rule/pin', { text: 'a', origin: 'user' })
    session.append('rule/pin', { text: 'a', origin: 'model' })
    session.append('rule/pin', { text: 'b', origin: 'user' })
    session.append('rule/unpin', { text: 'a' })
    session.append('rule/unpin', { text: 'missing' })

    const pins = session.snapshotEvents().filter(event => event.type === 'rule/pin')
    expect(pins).toHaveLength(3) // every event stays durable, duplicates included
    // Replay-stability: identical event sequences replay equal (the replay
    // adds only its terminal session/end-seed marker, outside the range).
    const replay = Session.create(SessionId('fold-replay'), session.snapshotEvents())
    expect(replay.snapshotEvents(SessionLogOffset(0), session.seq)).toEqual(session.snapshotEvents())
  })
})

describe('dsh-session-rules step-boundary injection', () => {
  it('publishes the pinned rules verbatim on the next step', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-first')
    await runCommand(ctx, agent, '/rule Never push directly to main.')

    const injected = await fireStep(ctx, agent)
    expect(injected).toHaveLength(1)
    const text = injected[0]!.content[0]!.type === 'text' ? injected[0]!.content[0]!.text : ''
    expect(text).toContain('<pinned_rules>')
    expect(text).toContain('1. Never push directly to main.')
    expect(text).not.toContain('This complete list replaces')

    const source = publications(session).at(-1)!.data.source
    expect(source.kind === 'session-rules' && source.rules).toEqual(['Never push directly to main.'])
  })

  it('does not duplicate when nothing changed', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-stable')
    await runCommand(ctx, agent, '/rule stable rule')
    await fireStep(ctx, agent)
    const visibleBefore = session.deriveMessages().length

    const again = await fireStep(ctx, agent, 1, 2)
    expect(again).toHaveLength(0)
    expect(session.deriveMessages()).toHaveLength(visibleBefore)
  })

  it('republishes verbatim after compaction-style shadowing, five rounds in a row', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-shadow')
    await runCommand(ctx, agent, '/rule Safety rules survive compaction.')
    await fireStep(ctx, agent)
    const first = publications(session).at(-1)!

    // Simulate five compaction rounds: each one shadows the currently
    // visible publication; the next step must restore the exact rule text.
    let shadowed = first.seq
    for (let round = 0; round < 5; round += 1) {
      session.append('user/message', createUserMessage({
        content: [{ type: 'text', text: `compaction ${String(round)}` }],
        source: { kind: 'plugin', plugin: 'test-compaction' },
      }), {
        surfaceOp: { op: 'replace', start: shadowed, end: shadowed },
        sourceEventSeqs: [shadowed],
      })
      const restored = await fireStep(ctx, agent, 1, round + 2)
      expect(restored).toHaveLength(1)
      const text = restored[0]!.content[0]!.type === 'text' ? restored[0]!.content[0]!.text : ''
      expect(text).toContain('Safety rules survive compaction.')
      expect(text).toContain('This complete list replaces')
      shadowed = publications(session).at(-1)!.seq
    }

    // The exact wording survived every round verbatim.
    expect(textOf(publications(session).at(-1)!)).toContain('<pinned_rules>\n1. Safety rules survive compaction.\n</pinned_rules>')
  })

  it('publishes a replacement when the list changes, in place of the proposed copy', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-change')
    await runCommand(ctx, agent, '/rule first')
    await fireStep(ctx, agent)

    await runCommand(ctx, agent, '/rule second')
    await fireStep(ctx, agent, 1, 2)
    const latest = publications(session).at(-1)!
    expect(textOf(latest)).toContain('This complete list replaces')
    expect(textOf(latest)).toContain('1. first')
    expect(textOf(latest)).toContain('2. second')
  })

  it('publishes a cleared tombstone when the last rule is removed', async () => {
    const ctx = await setup()
    const { agent, session } = openSession('inject-clear')
    await runCommand(ctx, agent, '/rule temporary')
    await fireStep(ctx, agent)

    await runCommand(ctx, agent, '/rule remove 1')
    const cleared = await fireStep(ctx, agent, 1, 2)
    expect(cleared).toHaveLength(1)
    const text = cleared[0]!.content[0]!.type === 'text' ? cleared[0]!.content[0]!.text : ''
    expect(text).toContain('All pinned rules were removed')
    expect(publications(session).at(-1)!.data.source).toMatchObject({
      kind: 'session-rules',
      update: true,
      rules: [],
    })
  })

  it('injects nothing before the first pin', async () => {
    const ctx = await setup()
    const { agent } = openSession('inject-empty')
    const injected = await fireStep(ctx, agent)
    expect(injected).toHaveLength(0)
  })
})
