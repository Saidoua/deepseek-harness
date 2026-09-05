# Agent Note: Engine-tolerant native-function rendering in the realm-owned intrinsic test

Status: implemented

English | [中文](2026-09-05-engine-tolerant-intrinsic-rendering.zh.md)

## Problem

`hasIntrinsicConstructor` in `dsh-util-values`, mirrored in `dsh-tools` (`json-schema.ts`), `dsh-cordis-host-runner` (`guard.ts`), and `dsh-code-runtime-worker-thread` (`worker-json.ts`), decided whether a prototype is a realm-owned intrinsic by comparing `Function.prototype.toString.call(constructor)` with the exact text `function Object() { [native code] }`. ECMAScript leaves the NativeFunction string implementation-defined: V8 renders it on one line, SpiderMonkey renders it across three. On Firefox-engine browsers every plain object therefore failed the test, `snapshotJsonValue` returned `undefined` for ordinary JSON, and the client assistant-stream chunk validator threw `Assistant stream raw chunk must be a lossless JSON object` before any history rendered (upstream discussions [#5677](https://github.com/deepseek-ai/deepseek-harness/discussions/5677) and [#5709](https://github.com/deepseek-ai/deepseek-harness/discussions/5709)).

## Decision

Each site collapses whitespace runs in the rendered source to single spaces before comparing. The three host and client sites use `.replace(/\s+/gu, ' ').trim()`. The worker-thread site uses `collapseIntrinsicWhitespace`, an indexed loop that treats any character sorting at or below U+0020 as whitespace, because that module captures its intrinsics at load so model code cannot redirect them; `String.prototype.replace` and `RegExp.prototype[Symbol.replace]` are consulted live and would reopen that vector.

The collapse does not widen the check. `function Object() { [native code] }` is not parseable JavaScript, so no user-authored function renders to that text under any whitespace; only a native constructor, or a tampered `toString`, can — and the worker site's captured intrinsic defeats the tampered case.

## Alternatives considered

**Anchor a regular expression such as `/^function \w+\(\) \{\s*\[native code\]\s*\}$/`.** Rejected because acceptance is equivalent, regex evaluation consults `RegExp.prototype` at the worker site, and one predicate shared verbatim by four mirrored sites is simpler to keep aligned.

**Drop the source-text test and rely on `constructor.name` and `constructor.prototype === prototype`.** Rejected because a forged constructor named `Object` whose `prototype` is a null-prototype object passes both; the rendered source is the only observable a user function cannot forge, and the worker runtime's tampering test pins that rejection.

**Share one helper package across the four sites.** Rejected because `worker-json.ts` is deliberately dependency-free and the other mirrors are duplication-exempt on purpose: each sits on a realm or VM boundary that must not import workspace runtime code.

## Consequences

Firefox and Zen load history and render replies; V8 behavior is byte-identical because its rendering already contains no whitespace runs. The cost is one whitespace collapse per intrinsic test and a fifteen-line helper in the worker module.

`packages/util/values/tests/intrinsic-rendering.spec.ts` pins the SpiderMonkey, V8, and tab-and-carriage-return renderings and the rejection of a non-native source, of `[native code]` inside a comment or string literal, and of a differently named native. `worker-json-engine-rendering.spec.ts` stubs the engine rendering before the worker module captures `Function.prototype.toString`, which is the only way to exercise that path against a tamper-resistant module. No test lane runs SpiderMonkey; the multiline rendering is taken from the reporters' measurements and MDN.
