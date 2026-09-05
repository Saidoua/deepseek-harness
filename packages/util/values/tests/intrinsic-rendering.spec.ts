/**
 * Engine tolerance for the realm-owned intrinsic test.
 *
 * ECMAScript leaves the NativeFunction string implementation-defined. V8 renders
 * `function Object() { [native code] }` on one line; SpiderMonkey renders it across
 * lines. An exact string comparison therefore rejected every plain object on
 * Firefox-engine browsers, so `snapshotJsonValue` returned `undefined` for ordinary
 * JSON and the web UI's assistant-stream validation threw before history rendered.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { snapshotJsonValue } from '@deepseek-ai/dsh-util-values/src/index.ts'

const NATIVE_TO_STRING: (this: unknown) => string = Reflect.get(Function.prototype, 'toString')

/** Render intrinsic constructors the way a given engine formats native source. */
function stubEngineRendering(render: (name: string) => string): void {
  Function.prototype.toString = function stub(this: unknown): string {
    if (this === Object) return render('Object')
    if (this === Array) return render('Array')
    return Reflect.apply(NATIVE_TO_STRING, this, [])
  }
}

afterEach(() => {
  Function.prototype.toString = NATIVE_TO_STRING
})

describe('intrinsic constructor rendering across engines', () => {
  it('accepts SpiderMonkey multi-line native rendering', () => {
    stubEngineRendering(name => `function ${name}() {\n    [native code]\n}`)
    // The exact payload from the field report (discussions #5677 / #5709).
    const chunk = { type: 'block-start', index: 0, blockType: 'reasoning' }
    expect(snapshotJsonValue(chunk)).toEqual(chunk)
    expect(snapshotJsonValue({ items: [1, 'two', null], nested: { ok: true } }))
      .toEqual({ items: [1, 'two', null], nested: { ok: true } })
  })

  it('accepts V8 single-line native rendering', () => {
    stubEngineRendering(name => `function ${name}() { [native code] }`)
    expect(snapshotJsonValue({ a: 1 })).toEqual({ a: 1 })
    expect(snapshotJsonValue([1, 2])).toEqual([1, 2])
  })

  it('accepts tab- and carriage-return-separated native rendering', () => {
    stubEngineRendering(name => `function ${name}()\t{\r\n[native code]\r\n}`)
    expect(snapshotJsonValue({ a: 1 })).toEqual({ a: 1 })
  })

  it('works unstubbed on the host engine', () => {
    expect(snapshotJsonValue({ a: 1, b: [null, false] })).toEqual({ a: 1, b: [null, false] })
  })

  it('still rejects a constructor whose source is not native', () => {
    stubEngineRendering(() => 'function Object() {}')
    expect(snapshotJsonValue({ a: 1 })).toBeUndefined()
  })

  it('still rejects `[native code]` hidden in a comment or string literal', () => {
    stubEngineRendering(name => `function ${name}() { /* [native code] */ }`)
    expect(snapshotJsonValue({ a: 1 })).toBeUndefined()
    stubEngineRendering(name => `function ${name}() { "[native code]" }`)
    expect(snapshotJsonValue({ a: 1 })).toBeUndefined()
  })

  it('still rejects a differently-named native constructor', () => {
    stubEngineRendering(() => 'function Forged() {\n    [native code]\n}')
    expect(snapshotJsonValue({ a: 1 })).toBeUndefined()
  })
})
