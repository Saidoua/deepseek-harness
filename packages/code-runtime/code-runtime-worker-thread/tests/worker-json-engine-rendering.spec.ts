/**
 * Engine tolerance for the worker's captured-intrinsic realm test.
 *
 * The worker captures `Function.prototype.toString` at module load, so the engine
 * rendering is stubbed before the dynamic import below — after import a stub would
 * be invisible, which is the tamper resistance the capture exists for.
 */
import { describe, expect, it } from 'vitest'

const NATIVE_TO_STRING: (this: unknown) => string = Reflect.get(Function.prototype, 'toString')

describe('snapshotCodeJsonValue under SpiderMonkey native rendering', () => {
  it('accepts plain records and arrays and still rejects a forged constructor', async () => {
    Function.prototype.toString = function stub(this: unknown): string {
      if (this === Object) return 'function Object() {\n    [native code]\n}'
      if (this === Array) return 'function Array() {\n    [native code]\n}'
      return Reflect.apply(NATIVE_TO_STRING, this, [])
    }
    try {
      const { snapshotCodeJsonValue } = await import('../src/worker-json.ts')
      const chunk = { type: 'block-start', index: 0, blockType: 'reasoning', items: [1, 'two', null] }
      expect(snapshotCodeJsonValue(chunk)).toEqual(chunk)

      const prototype = Object.create(null) as object
      const Spoofed = function Object(): void {}
      Spoofed.prototype = prototype
      Object.defineProperty(prototype, 'constructor', { value: Spoofed })
      const forged = Object.assign(Object.create(prototype) as Record<string, unknown>, { value: 1 })
      expect(snapshotCodeJsonValue(forged)).toBeUndefined()
    } finally {
      Function.prototype.toString = NATIVE_TO_STRING
    }
  })
})
