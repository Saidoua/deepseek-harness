import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { createUserMessage, LlmAdapter, MessageId, type LlmResolvedModelInfo } from '@deepseek-ai/dsh-llm'
import { SessionProjectionRegistry } from '@deepseek-ai/dsh-session-projection'
import { TokenMeter } from '@deepseek-ai/dsh-token-meter'
import { Session, SessionId, SessionStore } from '@deepseek-ai/dsh-session'
import type { Agent } from '@deepseek-ai/dsh-agent'

import { PrefixSlideCompactionEngine, prefixSlideMarker } from '../src/index.ts'

const MODEL = 'test-model'
const SIGNAL = new AbortController().signal

class ContextAdapter extends LlmAdapter {
  constructor(private readonly contextWindow: number) {
    super()
  }

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({
      provider,
      id: model,
      name: model,
      context: { contextWindow: this.contextWindow },
    })
  }

  override async *stream(): AsyncGenerator<never> {
    throw new Error('prefix-slide must never call the LLM')
  }
}

function createContext(contextWindow = 4_000): Context {
  const ctx = new Context()
  void new LlmRuntime(ctx)
  void new SessionStore(ctx)
  new SessionProjectionRegistry(ctx)
  void new TokenMeter(ctx)
  ctx.llm.registerAdapter([MODEL], new ContextAdapter(contextWindow))
  // The manual path flushes a durability checkpoint; there is no real store
  // entry for these synthetic sessions.
  vi.spyOn(ctx.sessions, 'flush').mockImplementation(() => Promise.resolve(false))
  return ctx
}

function agent(session: Session): Agent {
  return {
    session,
    options: {},
    status: 'idle',
    reserveTurnAdmission: () => () => undefined,
    runMaintenance: (task: (signal: AbortSignal) => unknown) => task(new AbortController().signal),
  } as unknown as Agent
}

function conversation(turns = 3, text = 'fixture '.repeat(100)): Session {
  const session = Session.create(SessionId(`prefix-slide-${turns}`))
  for (let turn = 1; turn <= turns; turn += 1) {
    session.append('turn/start', { turn })
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: `${text} user ${turn}` }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    session.append('step/start', { turn, step: 1 })
    if (turn === 1) {
      session.append('request/header', {
        header: { config: { provider: MODEL, model: MODEL } },
        reason: 'initial',
      })
    }
    session.append('assistant/message', {
      turn,
      step: 1,
      stream: [],
      message: {
        role: 'assistant',
        id: MessageId(`a${String(turn)}`),
        content: [{ type: 'text', text: `${text} assistant ${turn}` }],
        source: { kind: 'model', provider: MODEL, model: MODEL },
      },
    }, { surfaceOp: 'append' })
    session.append('step/end', { turn, step: 1 })
    session.append('turn/end', { turn, reason: { kind: 'completed' } })
  }
  // The trailing open turn mirrors a live session mid-work: the automatic
  // open-turn compaction path requires one.
  session.append('turn/start', { turn: turns + 1 })
  return session
}

describe('dsh-compaction-prefix-slide', () => {
  it('compacts pressure without any LLM stream call, evicting the middle behind the marker', async () => {
    const ctx = createContext(4_000)
    const streamSpy = vi.spyOn(ctx.llm, 'stream')
    const compact = new PrefixSlideCompactionEngine(ctx, {
      auto: false,
      thresholdRatio: 0.5,
      retainTokens: 120,
    })
    const session = conversation(3, 'fixture '.repeat(300))

    const result = await compact.compactIfNeeded(agent(session), 'pressure', SIGNAL)
    expect(result).not.toBeNull()
    expect(streamSpy).not.toHaveBeenCalled()

    const summary = session.snapshotEvents().findLast(
      event => event.type === 'compaction/summary',
    )
    expect(summary).toBeDefined()
    if (summary?.type !== 'compaction/summary') throw new Error('expected a compaction/summary event')
    expect(summary.data.summary.some(block => block.type === 'text' && block.text.includes('prefix slide'))).toBe(true)
    expect(summary.data.shadowedSeqs.length).toBeGreaterThan(0)

    const visible = session.deriveMessages().map(message => JSON.stringify(message.content)).join('\n')
    expect(visible).toContain('prefix slide')
    expect(visible).not.toContain('user 2')
  })

  it('keeps the seed user turn and the retained tail verbatim', async () => {
    const ctx = createContext(4_000)
    const compact = new PrefixSlideCompactionEngine(ctx, {
      auto: false,
      thresholdRatio: 0.5,
      retainTokens: 200,
    })
    const session = conversation(3, 'fixture '.repeat(300))
    const seedText = 'user 1'

    await compact.compactIfNeeded(agent(session), 'pressure', SIGNAL)

    const visible = session.deriveMessages().map(message => JSON.stringify(message.content)).join('\n')
    expect(visible).toContain(seedText)
    expect(visible).toContain('assistant 3')
    // The pairing invariant survives the eviction.
    const calls = new Set<string>()
    for (const message of session.deriveMessages()) {
      for (const block of message.content) {
        if (block.type === 'tool-call') calls.add(block.id)
        if (block.type === 'tool-result') expect(calls.has(block.toolCallId)).toBe(true)
      }
    }
  })

  it('serves manual /compact through the same marker path', async () => {
    const ctx = createContext(4_000)
    const compact = new PrefixSlideCompactionEngine(ctx, {
      auto: false,
      thresholdRatio: 0.9,
      retainTokens: 50,
    })
    const session = conversation(2, 'fixture '.repeat(300))
    // Close the trailing open turn for the manual idle path.
    session.append('turn/end', { turn: 3, reason: { kind: 'completed' } })

    const result = await compact.compactNow(agent(session), SIGNAL)
    expect(result).not.toBeNull()

    const visible = session.deriveMessages().map(message => JSON.stringify(message.content)).join('\n')
    expect(visible).toContain('prefix slide')
    // Manual spares nothing: even the seed user message is reclaimed. Only
    // the retained tail stays verbatim.
    expect(visible).not.toContain('user 1')
    expect(visible).toContain('assistant 2')
  })

  it('exposes the marker as a pure function of the evicted count', () => {
    expect(prefixSlideMarker(3)).toContain('3 earlier messages')
    expect(prefixSlideMarker(0)).toContain('0 earlier messages')
  })
})
