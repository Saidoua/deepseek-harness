/**
 * Pure types of the skill-stats domain: the ONE home of the `skillStats`
 * projection-key declaration and its payload vocabulary, free of host-side
 * value imports.
 *
 * Why: static skill scans do not predict runtime value (Evaluating Skills,
 * Not Just Agents: structural scores vs LLM-judge correlate at Spearman
 * ρ = 0.14) — only usage and outcomes do. This domain records what the
 * session actually invoked and whether it errored, from the durable log.
 *
 * @module @deepseek-ai/dsh-skill-stats/types
 */

/** One skill's observed usage inside one session. */
export interface SkillUsage {
  /** Model `skill`-tool loads plus direct `/<name>` gesture invocations. */
  readonly invocations: number
  /** How many of those loads settled as tool errors (gestures cannot error). */
  readonly errors: number
  /** Durable sequence of the latest invocation, or null before one exists. */
  readonly lastSeq: number | null
  /** Wall-clock epoch ms of the latest invocation, or null. */
  readonly lastTime: number | null
  /** How the latest invocation arrived: `tool` (model) or `gesture` (user). */
  readonly lastVia: 'tool' | 'gesture' | null
}

/**
 * Folded skill-stats projection: per-skill usage keyed by skill name, plus
 * the transient tool-call pairing state that folds a `skill` `tool/call` to
 * its `tool/result`. `pending` is replay-deterministic and never exposed in
 * the wire view.
 */
export interface SkillStatsState {
  readonly pending: Readonly<Record<string, string>>
  readonly skills: Readonly<Record<string, SkillUsage>>
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionStateMap {
    skillStats: SkillStatsState
  }
  interface SessionProjectionMap {
    /**
     * Per-skill invocation usage folded from the session log: `skill` tool
     * calls paired with their results, and `/<name>` gesture invocations.
     */
    skillStats: SkillUsageRecord[]
  }
}

/** Wire view row: one skill's usage, name attached. */
export interface SkillUsageRecord extends SkillUsage {
  readonly name: string
}
