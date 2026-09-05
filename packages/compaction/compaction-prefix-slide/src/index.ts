/**
 * Prefix-sliding compaction: a drop-in `compaction-basic` replacement whose
 * "summarizer" is a fixed eviction marker — the middle of the conversation is
 * evicted without any LLM call.
 *
 * Why: Prefix Sliding (arXiv:2608.26070) shows a pinned head plus a recent
 * verbatim window beats summarizing the middle on both fidelity and cost, and
 * E-Commerce Bench (arXiv:2608.30730) ran 18 frontier models for simulated
 * years on pure group-granular eviction. The regime works when durable facts
 * live in replacing snapshots (the `state_write` working state, pinned rules,
 * this checkpoint) rather than in scrolling prose.
 *
 * Mount it instead of `compaction-basic` in a later patch layer (last write
 * wins per row id):
 *
 *   - id: compaction-basic
 *     name: '@deepseek-ai/dsh-compaction-prefix-slide'
 *
 * Everything else — thresholds, retention, pairing-balanced spans, the seed
 * turn sparing, `/compact`, the durable checkpoint bracket — is inherited
 * unchanged; only the summarizer call disappears.
 *
 * @module @deepseek-ai/dsh-compaction-prefix-slide
 */

import BasicCompactionEngine from '@deepseek-ai/dsh-compaction-basic'
import type { SummarizationInput, SummaryResult } from '@deepseek-ai/dsh-compaction-basic/src/summarizer.ts'
import type { Agent } from '@deepseek-ai/dsh-agent'

export const name = 'compaction-prefix-slide'

/** Framed replacement written in place of every evicted span.
 * @param evictedMessages - count of messages the span removed from the visible surface.
 * @returns the marker text recorded as the span's replacement summary.
 */
export function prefixSlideMarker(evictedMessages: number): string {
  return `[prefix slide] ${String(evictedMessages)} earlier messages were evicted without summarization. `
    + 'Durable facts live in the working state snapshot, pinned rules, and this checkpoint; '
    + 'the evicted prose is intentionally gone. Re-derive anything else from the workspace.'
}

/**
 * The inherited threshold, retention, pairing, seed-sparing, retry, and
 * checkpoint-bracket machinery with the summarizer call replaced by the
 * fixed marker: compaction becomes instant, deterministic, and free.
 */
export class PrefixSlideCompactionEngine extends BasicCompactionEngine {
  static override inject = ['llm', 'tokenMeter', 'sessions']

  protected override summarize(
    input: SummarizationInput,
    _agent: Agent,
    _signal?: AbortSignal,
  ): Promise<SummaryResult> {
    // Not `async`: there is nothing to await — that is the entire point of
    // this engine. The Promise keeps the inherited signature.
    return Promise.resolve({
      summary: [{ type: 'text', text: prefixSlideMarker(input.messages.length) }],
      provider: 'prefix-slide',
      model: 'none',
    })
  }
}

export default PrefixSlideCompactionEngine
