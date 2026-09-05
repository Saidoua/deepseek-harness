import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SessionId, type SessionEvent } from '@deepseek-ai/dsh-session'
import type { Agent } from '@deepseek-ai/dsh-agent'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import * as SessionRules from '../src/index.ts'
import { MockAdapter, textResponse, toolCallResponse } from '../../../core/agent-loop/tests/mock-adapter.ts'

/**
 * Full-loop integration: a scripted mock model drives the REAL rule_pin tool
 * through the agent loop, and the next model request is inspected for the
 * injected <pinned_rules> block carrying the rule verbatim — the property the
 * plugin exists for. Only the model is mocked; the tool, the projection, the
 * step-boundary injection, and the session log are real.
 */
async function harness(adapter: MockAdapter): Promise<Context> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(SessionProjectionRegistry)
  // The plugin injects `commands` (the /rule registration); without the
  // runtime mounted the plugin stays PENDING and no tool ever registers.
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(SessionRules)
  ctx.llm.registerAdapter(['mock'], adapter)
  return ctx
}

function waitForIdle(ctx: Context, agent: Agent): Promise<void> {
  return new Promise((resolve) => {
    const dispose = ctx.on('agent/status', ({ agent: subject, status }) => {
      if (subject === agent && status === 'idle') {
        dispose()
        resolve()
      }
    })
  })
}

function findEvent<T extends SessionEvent['type']>(
  log: readonly SessionEvent[],
  type: T,
): Extract<SessionEvent, { type: T }> {
  const found = log.findLast(event => event.type === type)
  if (!found) throw new Error(`no ${type} event in the session log`)
  return found as Extract<SessionEvent, { type: T }>
}

/** Every text block of one recorded model request, joined (no JSON escaping). */
function requestText(adapter: MockAdapter, index: number): string {
  const request = adapter.requests[index]
  if (request === undefined) throw new Error(`no model request ${String(index)}`)
  return request.messages
    .flatMap(message => message.content)
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('\n')
}

describe('rule_pin through the agent loop', () => {
  it('the request after the pin sees the <pinned_rules> block verbatim', async () => {
    const adapter = new MockAdapter([
      toolCallResponse('call-1', 'rule_pin', { text: 'Never push directly to main.' }, 'Pinning your rule.'),
      textResponse('Rule pinned.'),
    ])
    const ctx = await harness(adapter)
    const agent = await ctx.agentLoop.create(SessionId('it-rules'), { provider: 'mock', model: 'mock' })

    agent.followup(createUserMessage({ content: [{ type: 'text', text: 'noted, never push to main' }], source: { kind: 'user' } }))
    await waitForIdle(ctx, agent)

    expect(findEvent(agent.session.snapshotEvents(), 'tool/result').data.message.content[0].isError).toBe(false)
    expect(findEvent(agent.session.snapshotEvents(), 'rule/pin').data).toEqual({
      text: 'Never push directly to main.',
      origin: 'model',
    })

    // Request 0 (before the pin) carries no block; request 1 does, verbatim.
    expect(requestText(adapter, 0)).not.toContain('<pinned_rules>')
    const second = requestText(adapter, 1)
    expect(second).toContain('<pinned_rules>')
    expect(second).toContain('1. Never push directly to main.')
  })

  it('the model cannot remove a rule, even by calling rule_pin with a duplicate', async () => {
    // Session starts with one user-pinned rule; the model pins a second.
    const adapter = new MockAdapter([
      toolCallResponse('call-1', 'rule_pin', { text: 'model-added rule' }),
      textResponse('Done.'),
    ])
    const ctx = await harness(adapter)
    const agent = await ctx.agentLoop.create(SessionId('it-rules-two'), { provider: 'mock', model: 'mock' })
    agent.session.append('rule/pin', { text: 'user rule', origin: 'user' })

    agent.followup(createUserMessage({ content: [{ type: 'text', text: 'add your own rule' }], source: { kind: 'user' } }))
    await waitForIdle(ctx, agent)

    const request = requestText(adapter, 1)
    expect(request).toContain('1. user rule')
    expect(request).toContain('2. model-added rule')
    expect(request).toContain('This complete list replaces')
  })
})
