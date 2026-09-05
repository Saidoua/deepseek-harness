/**
 * Session-pinned standing rules: durable `rule/pin`/`rule/unpin` events, a
 * `/rule` command, a model-facing `rule_pin` tool, and a visibility-matched
 * durable `<pinned_rules>` message republished verbatim after compaction.
 *
 * Why: LLM-summarizing compaction destroys rule wording (the Compaction
 * Cliff: 53% rule retention after one round, 10% after five), and rules lose
 * enforceability once paraphrased. Pinned rules therefore never enter the
 * summarization stream — the message is replaced whole, exact text intact,
 * whenever the visible copy is gone or the list changed.
 *
 * @module @deepseek-ai/dsh-session-rules
 */

import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { z as zod } from 'zod'
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionSeq, type UserMessage } from '@deepseek-ai/dsh-session'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-session-projection'
// The `sessionRules` projection-key declaration lives in src/types.ts (its
// one home); this re-export projects the type face onto the package root AND
// keeps the module edge in the emitted index.d.ts, so aggregate programs
// consuming the declarations still receive the map merges.
export type * from './types.ts'

export const name = 'session-rules'
export const inject = ['agents', 'commands', 'tools', 'sessionProjections']

const DEFAULT_MAX_RULES = 20
const DEFAULT_MAX_RULE_CHARS = 500

/** Session-pinned standing rules configuration. */
export interface Config {
  /** Maximum simultaneous pinned rules; a further pin is rejected. Minimum 1. */
  maxRules?: number
  /** Maximum trimmed text length of one rule; a longer pin is rejected. Minimum 16. */
  maxRuleChars?: number
}

/** Schemastery configuration for the session-rules consumer. */
export const Config: z<Config> = z.object({
  maxRules: z.number().default(DEFAULT_MAX_RULES),
  maxRuleChars: z.number().default(DEFAULT_MAX_RULE_CHARS),
})

const USAGE = 'Usage: /rule <text> | /rule list | /rule remove <n>'

/** The exact removal form; any other input (including text starting with "remove") is a pin. */
const REMOVE_RE = /^remove\s+(\d+)$/

/** Wire payload schema of the `sessionRules` projection (the folded rule list). */
const sessionRulesStateSchema = zod.object({
  rules: zod.array(zod.string()),
})

/** Pseudo-XML framing escape, mirroring the skill catalog's escapeText. */
function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/**
 * Read the session's current pinned-rule list from the projection. The cast
 * records the zod schema's guarantee (string array); an unreadable cell falls
 * back to empty rather than throwing inside a step listener.
 */
function rulesOf(ctx: Context, agent: Agent): readonly string[] {
  return ctx.sessionProjections.stateOf(agent.session, 'sessionRules')?.rules ?? []
}

/** List identity over the durable rule texts, not the rendered prose. */
function digestRules(rules: readonly string[]): string {
  // JSON per rule rather than a separator character: every separator is
  // itself a legal rule character, so only quoting makes the boundary exact.
  const canonical = rules.map(text => JSON.stringify(text)).join('\n')
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Entries of one durable pinned-rules message, or undefined when the record
 * is not a usable rules list. Seed validation only guarantees a non-empty
 * source kind, so an unreadable record is "not this plugin's message" rather
 * than a throw inside the step listener.
 */
function readSourceRules(source: unknown): readonly string[] | undefined {
  const rules = (source as { rules?: unknown }).rules
  if (!Array.isArray(rules)) return undefined
  const readable: string[] = []
  for (const rule of rules as readonly unknown[]) {
    if (typeof rule !== 'string' || rule === '') return undefined
    readable.push(rule)
  }
  return readable
}

/**
 * Scan the durable log for this session's latest readable pinned-rules
 * publication and whether it is still on the visible surface. Mirrors the
 * skill catalog's history scan: shadowed (compacted) publications lose
 * `visibleDigest`, which is exactly what drives the verbatim republish.
 */
function rulesHistory(agent: Agent): { visibleDigest?: string; published: boolean } {
  const visible = new Set(agent.session.surface.nodes)
  let published = false
  for (let index = agent.session.seq - 1; index >= 0; index -= 1) {
    const event = agent.session.eventAt(SessionSeq(index))
    if (event === undefined) {
      throw new Error(`session rules cannot read seq ${String(index)} below the current Session length`)
    }
    if (event.type !== 'user/message' || event.data.source.kind !== 'session-rules') continue
    const rules = readSourceRules(event.data.source)
    if (rules === undefined) continue
    published = true
    if (visible.has(event.seq)) return { visibleDigest: digestRules(rules), published }
  }
  return { published }
}

/** This plugin's publication already proposed for the entering step, if any. */
function proposedRulesMessage(
  messages: readonly UserMessage[],
): { message: UserMessage; rules: readonly string[] } | undefined {
  for (const message of messages) {
    if (message.source.kind !== 'session-rules') continue
    const rules = readSourceRules(message.source)
    if (rules !== undefined) return { message, rules }
  }
  return undefined
}

/**
 * One line per rule. The rendered list carries no authorship: `rule/pin`
 * records a durable `origin`, but the projection folds only the texts, so the
 * message must not assert who pinned a rule. Saying "the user pinned" would
 * let the model — or content it read — manufacture user authority for a rule
 * the model pinned itself through `rule_pin`.
 */
function renderRuleLines(rules: readonly string[]): string[] {
  return rules.map((text, index) => `${index + 1}. ${escapeText(text)}`)
}

function renderRulesMessage(rules: readonly string[], update: boolean): UserMessage {
  const head = update
    ? 'The pinned rules changed. This complete list replaces every earlier pinned-rules list in this session:'
    : 'Standing rules are pinned for this session. They remain in force until the user removes them:'
  const body = rules.length === 0
    ? [
      'All pinned rules were removed. Earlier pinned-rules lists no longer apply.',
    ]
    : [
      head,
      '',
      '<pinned_rules>',
      ...renderRuleLines(rules),
      '</pinned_rules>',
      '',
      'Follow every pinned rule exactly as written. If a request conflicts with a pinned rule, follow the rule and say so.',
    ]
  return createUserMessage({
    content: [{
      type: 'text',
      text: ['<system-reminder>', ...body, '</system-reminder>'].join('\n'),
    }],
    source: update
      ? { kind: 'session-rules', form: 'instructions', update: true, rules: [...rules] }
      : { kind: 'session-rules', form: 'instructions', rules: [...rules] },
  })
}

/**
 * Validate one pin against the configured bounds. Shared by the `/rule`
 * command and the `rule_pin` tool so both paths reject identically before
 * anything reaches the durable log.
 */
function validatePin(text: string, current: readonly string[], config: { maxRules: number; maxRuleChars: number }): string {
  const trimmed = text.trim()
  if (trimmed.length === 0) throw new Error('a pinned rule must be a non-empty text')
  if (trimmed.length > config.maxRuleChars) {
    throw new Error(`a pinned rule is at most ${String(config.maxRuleChars)} characters (got ${String(trimmed.length)})`)
  }
  if (current.some(rule => rule === trimmed)) return trimmed
  if (current.length >= config.maxRules) {
    throw new Error(`at most ${String(config.maxRules)} pinned rules are allowed; remove one first (/rule remove <n>)`)
  }
  return trimmed
}

/** Resolve `/rule remove <n>` positionally against the current list. */
function resolveRemoval(match: RegExpMatchArray, current: readonly string[]): string {
  const index = Number(match[1])
  const text = index >= 1 && index <= current.length ? current[index - 1] : undefined
  if (text === undefined) throw new Error(`rule number must be between 1 and ${String(current.length)}`)
  return text
}

function renderList(rules: readonly string[]): string {
  if (rules.length === 0) return 'No pinned rules.'
  return rules.map((text, index) => `${index + 1}. ${text}`).join('\n')
}

/** Execute one `/rule` invocation against the invocating agent's session. */
function executeRuleCommand(
  ctx: Context,
  invocation: CommandInvocation,
  config: { maxRules: number; maxRuleChars: number },
): CommandResult {
  const agent = invocation.agent
  const rawInput = invocation.rawInput.trim()
  if (rawInput === 'list' || rawInput === '') {
    const rules = rulesOf(ctx, agent)
    return { kind: rawInput === 'list' ? 'success' : 'error', text: rawInput === 'list' ? renderList(rules) : USAGE }
  }
  const current = rulesOf(ctx, agent)
  const removal = REMOVE_RE.exec(rawInput)
  try {
    if (removal !== null) {
      const text = resolveRemoval(removal, current)
      agent.session.append('rule/unpin', { text })
      return {
        kind: 'success',
        text: `Removed pinned rule: ${text}`,
        sourceEventSeq: SessionSeq(agent.session.seq - 1),
      }
    }
    const text = validatePin(rawInput, current, config)
    if (current.some(rule => rule === text)) {
      return { kind: 'success', text: 'Already pinned.' }
    }
    agent.session.append('rule/pin', { text, origin: 'user' })
    return {
      kind: 'success',
      text: `Pinned ${String(current.length + 1)}/${String(config.maxRules)}: ${text}`,
      sourceEventSeq: SessionSeq(agent.session.seq - 1),
    }
  } catch (error: unknown) {
    return { kind: 'error', text: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Register the `/rule` command, the model-facing `rule_pin` tool, the
 * `sessionRules` projection, and the step-boundary republish listener.
 * @param ctx - registrant context carrying the command, tool, and projection registries.
 * @param config - deployment's pinned-rule bounds.
 */
export function apply(ctx: Context, config: Config = {}): void {
  const maxRules = config.maxRules ?? DEFAULT_MAX_RULES
  const maxRuleChars = config.maxRuleChars ?? DEFAULT_MAX_RULE_CHARS
  const bounds = { maxRules, maxRuleChars }

  ctx.sessionProjections.register<'sessionRules', { rules: string[] }>({
    key: 'sessionRules',
    stateSchema: sessionRulesStateSchema,
    init: () => ({ rules: [] }),
    apply: (state, event) => {
      if (event.type === 'rule/pin') {
        if (state.rules.includes(event.data.text)) return state
        return { rules: [...state.rules, event.data.text] }
      }
      if (event.type === 'rule/unpin') {
        if (!state.rules.includes(event.data.text)) return state
        return { rules: state.rules.filter(rule => rule !== event.data.text) }
      }
      return state
    },
    wire: { viewSchema: sessionRulesStateSchema, view: state => state },
    stateVersion: 1,
  })

  ctx.commands.register({
    name: 'rule',
    description: 'Pin a standing session rule (survives compaction verbatim)',
    handler: (invocation: CommandInvocation): CommandResult =>
      executeRuleCommand(ctx, invocation, bounds),
  })

  ctx.tools.register(defineTool({
    name: 'rule_pin',
    description: 'Pin one standing rule the user stated in this conversation (a constraint, standard, or '
      + 'preference that must hold for the rest of the session), so it survives context compaction verbatim. '
      + 'Pin the rule exactly as the user worded it — do not paraphrase. Only the user can remove a pinned '
      + 'rule (/rule remove); this tool cannot unpin.',
    parameters: {
      text: {
        type: 'string',
        required: true,
        description: 'The rule text, exactly as the user stated it (trimmed, non-empty).',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          pinned: { type: 'string', required: true },
          rules: { type: 'array', required: true, items: { type: 'string' } },
          count: { type: 'integer', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.pinned === ''
          ? 'Rule already pinned.'
          : `Pinned rule ${String(value.count)}/${String(maxRules)}: ${value.pinned}`,
      }],
    },
    execute(args, exec) {
      if (!exec.agent) {
        // Pinned rules are per-agent-session state; a non-agent caller has
        // nowhere to write them. Reject rather than silently no-op.
        throw new Error('rule_pin requires an owning agent session')
      }
      const current = rulesOf(ctx, exec.agent)
      const text = validatePin(args.text, current, bounds)
      if (current.includes(text)) {
        return Promise.resolve({ pinned: '', rules: [...current], count: current.length })
      }
      exec.agent.session.append('rule/pin', { text, origin: 'model' })
      const rules = rulesOf(ctx, exec.agent)
      return Promise.resolve({ pinned: text, rules: [...rules], count: rules.length })
    },
    presentCall: args => ({ card: 'generic', title: 'Pin session rule', kind: 'other', rawInput: args.text }),
  }))

  // Step-boundary republish: mirror of the skill-catalog listener. The rules
  // ride a durable message whose identity is the rule list digest; when the
  // visible copy is gone (compaction shadowed it) or the list changed, the
  // next step re-injects the exact current list — never summarized, never
  // duplicated. Registration sits after the tool so reverse teardown removes
  // the schema first.
  ctx.on('agent/pre-step', async (
    { agent, signal },
    next,
  ): Promise<PreStepDecision> => {
    const decision = await next()
    if (decision.kind === 'reject' || signal.aborted) return decision
    const rules = rulesOf(ctx, agent)
    const digest = digestRules(rules)
    const history = rulesHistory(agent)
    const existing = proposedRulesMessage(decision.messages)
    if (history.visibleDigest === digest) {
      return existing === undefined
        ? decision
        : { ...decision, messages: decision.messages.filter(message => message.id !== existing.message.id) }
    }
    if (existing !== undefined && digestRules(existing.rules) === digest) return decision
    if (!history.published && rules.length === 0) {
      return existing === undefined
        ? decision
        : { ...decision, messages: decision.messages.filter(message => message.id !== existing.message.id) }
    }
    const publication = renderRulesMessage(rules, history.published)
    return {
      ...decision,
      messages: existing === undefined
        ? [...decision.messages, publication]
        : decision.messages.map(message => message.id === existing.message.id ? publication : message),
    }
  })
}
