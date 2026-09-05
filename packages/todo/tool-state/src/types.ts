/**
 * Pure types of the task-state domain: the ONE home of the `taskState`
 * projection-key declaration plus the durable event vocabulary and the
 * model-facing message source, free of this package's host-side value
 * imports (cordis, dsh-tools, zod).
 *
 * @module @deepseek-ai/dsh-tool-state/types
 */

/**
 * One typed working-state value: a free text line or a list of short lines.
 * Deliberately no deeper nesting — flat scalar values keep the patch
 * deterministic to validate and render (deep structures invite the schema
 * coercion failures that dominate state-patch errors). Mutable arrays: the
 * value crosses JSON boundaries (tool output, durable event, zod view).
 */
export type StateValue = string | string[]

/** The session's current working state; keys are free-form, values typed. */
export type TaskState = Record<string, StateValue>

/**
 * Folded task-state projection: the latest merged snapshot or `null` before
 * the first write and after the state is emptied.
 */
export type TaskStateProjection = TaskState | null

/**
 * Producer record for one published task-state message (the `user/message`
 * event's source slot). The `state` field mirrors exactly the key/value
 * content this message published, so a consumer presenting the state never
 * re-parses the `<task_state>` block, whose framing exists for the model.
 */
export interface TaskStateSource {
  readonly kind: 'task-state'
  readonly form: 'instructions'
  /** Marks a replacement snapshot rather than this session's first publication. */
  readonly update?: true
  /** Exactly the key/value content this message published, keys sorted. */
  readonly state: TaskState
}

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'task-state': TaskStateSource
  }
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /**
     * Whole-state snapshot; latest write wins on replay. Log-only; model
     * visibility rides the published `task-state` message, which is
     * re-injected as one replacing snapshot.
     */
    'state/write': { state: TaskState | null }
  }
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionStateMap {
    taskState: TaskStateProjection
  }
  interface SessionProjectionMap {
    /**
     * The agent's current working state (the latest merged `state/write`
     * snapshot), or `null` before the first write and after the state is
     * emptied. Whole-value rule: every `state/write` carries the complete
     * merged state, so the fold is last-wins.
     */
    taskState: TaskStateProjection
  }
}
