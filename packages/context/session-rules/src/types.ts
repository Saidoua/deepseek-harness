/**
 * Pure types of the session-rules domain: the ONE home of the `sessionRules`
 * projection-key declaration plus the durable event vocabulary and the
 * model-facing message source, free of this package's host-side value
 * imports (cordis, dsh-tools, zod).
 *
 * @module @deepseek-ai/dsh-session-rules/types
 */

/** Folded pinned-rule list: exact rule texts in pin order, replay-stable. */
export interface SessionRulesProjection {
  readonly rules: readonly string[]
}

/**
 * Producer record for one published pinned-rules message (the `user/message`
 * event's source slot). The `rules` field mirrors exactly the texts this
 * message published, so a consumer presenting the list never re-parses the
 * `<pinned_rules>` block, whose framing exists for the model.
 */
export interface SessionRulesSource {
  readonly kind: 'session-rules'
  readonly form: 'instructions'
  /** Marks a replacement list rather than this session's first publication. */
  readonly update?: true
  /** Exactly the rule texts this message published, in pin order. */
  readonly rules: readonly string[]
}

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'session-rules': SessionRulesSource
  }
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /**
     * One standing rule entered the pinned list. Replay-stable by text: a
     * pin whose trimmed text is already present is a fold no-op, so replay
     * never duplicates. Log-only; model visibility rides the published
     * `session-rules` message, which is re-injected verbatim.
     */
    'rule/pin': { text: string; origin: 'user' | 'model' }
    /**
     * One standing rule left the pinned list, identified by its exact text
     * (resolved from the position at command time), so replay needs no
     * positional state. Unpinning an absent text is a fold no-op.
     */
    'rule/unpin': { text: string }
  }
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionStateMap {
    sessionRules: SessionRulesProjection
  }
  interface SessionProjectionMap {
    /**
     * The session's current pinned-rule texts in pin order. The fold is
     * text-deduplicating on `rule/pin` and text-removing on `rule/unpin`.
     */
    sessionRules: SessionRulesProjection
  }
}
