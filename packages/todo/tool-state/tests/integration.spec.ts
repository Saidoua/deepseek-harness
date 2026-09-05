import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SessionId, type SessionEvent } from '@deepseek-ai/dsh-session'
import type { Agent } from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import * as ToolState from '../src/index.ts'
import { MockAdapter, textResponse, toolCallResponse } from '../../../core/agent-loop/tests/mock-adapter.ts'

/**
 * Full-loop integration: a scripted mock model drives the REAL state_write
 * tool through the agent loop, and each later model request is inspected for
 * the injected <task_state> snapshot — the property the tool exists for is
 * that the state is model-visible on the request AFTER the write, regardless
 * of where in history the write happened. Only the model is mocked; the tool,
 * the projection, the step-boundary injection, and the session log are real.
 */
async function harness(adapter: MockAdapter): Promise<Context> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(ToolState)
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

describe('state_write through the agent loop', () => {
  it('the request after the write sees the <task_state> snapshot', async () => {
    const adapter = new MockAdapter([
      toolCallResponse('call-1', 'state_write', {
        patch: { goal: 'Migrate auth to OAuth2', files_touched: ['src/auth.ts'] },
      }, 'Recording the working state.'),
      textResponse('State recorded.'),
    ])
    const ctx = await harness(adapter)
    const agent = await ctx.agentLoop.create(SessionId('it-state'), { provider: 'mock', model: 'mock' })

    agent.followup(createUserMessage({ content: [{ type: 'text', text: 'start the migration' }], source: { kind: 'user' } }))
    await waitForIdle(ctx, agent)

    // The write is durable and non-error.
    expect(findEvent(agent.session.snapshotEvents(), 'tool/call').data.name).toBe('state_write')
    expect(findEvent(agent.session.snapshotEvents(), 'tool/result').data.message.content[0].isError).toBe(false)
    expect(findEvent(agent.session.snapshotEvents(), 'state/write').data.state).toEqual({
      goal: 'Migrate auth to OAuth2',
      files_touched: ['src/auth.ts'],
    })

    // Request 0 (before any write) carries no snapshot; request 1 (after it) does.
    expect(requestText(adapter, 0)).not.toContain('<task_state>')
    const second = requestText(adapter, 1)
    expect(second).toContain('<task_state>')
    expect(second).toContain('goal: Migrate auth to OAuth2')
    expect(second).toContain('files_touched:\n  - src/auth.ts')
  })

  it('a changed state reaches the next request as a declared replacement', async () => {
    const adapter = new MockAdapter([
      toolCallResponse('call-1', 'state_write', { patch: { goal: 'Ship the release', step: 'one' } }),
      toolCallResponse('call-2', 'state_write', { patch: { step: 'two' } }),
      textResponse('Done.'),
    ])
    const ctx = await harness(adapter)
    const agent = await ctx.agentLoop.create(SessionId('it-state-replace'), { provider: 'mock', model: 'mock' })

    agent.followup(createUserMessage({ content: [{ type: 'text', text: 'work the steps' }], source: { kind: 'user' } }))
    await waitForIdle(ctx, agent)

    // Request 1 sees the first snapshot without a replacement marker.
    const second = requestText(adapter, 1)
    expect(second).toContain('step: one')
    expect(second).not.toContain('This snapshot replaces')

    // Request 2 sees the updated snapshot with the replacement declaration,
    // and the untouched key persisted through the merge.
    const third = requestText(adapter, 2)
    expect(third).toContain('This snapshot replaces')
    expect(third).toContain('step: two')
    expect(third).toContain('goal: Ship the release')
  })

  it('an oversized write is rejected end to end and nothing durable lands', async () => {
    const adapter = new MockAdapter([
      toolCallResponse('call-1', 'state_write', { goal: 'x'.repeat(4001) }),
      textResponse('Understood, retrying smaller.'),
    ])
    const ctx = await harness(adapter)
    const agent = await ctx.agentLoop.create(SessionId('it-state-budget'), { provider: 'mock', model: 'mock' })

    agent.followup(createUserMessage({ content: [{ type: 'text', text: 'record this' }], source: { kind: 'user' } }))
    await waitForIdle(ctx, agent)

    expect(findEvent(agent.session.snapshotEvents(), 'tool/result').data.message.content[0].isError).toBe(true)
    expect(agent.session.snapshotEvents().some(event => event.type === 'state/write')).toBe(false)
    expect(requestText(adapter, 1)).not.toContain('<task_state>')
  })
})
