# Agent Note: 领域自有内建对象判定对引擎原生函数渲染的容错

Status: implemented

[English](2026-09-05-engine-tolerant-intrinsic-rendering.md) | 中文

## 问题

`dsh-util-values` 中的 `hasIntrinsicConstructor`，以及在 `dsh-tools`（`json-schema.ts`）、`dsh-cordis-host-runner`（`guard.ts`）和 `dsh-code-runtime-worker-thread`（`worker-json.ts`）中的镜像实现，通过把 `Function.prototype.toString.call(constructor)` 与文本 `function Object() { [native code] }` 逐字比较来判定某个原型是否为领域自有内建对象。ECMAScript 将 NativeFunction 字符串留给实现定义：V8 渲染为单行，SpiderMonkey 渲染为三行。因此在 Firefox 内核浏览器上，每个普通对象都无法通过判定，`snapshotJsonValue` 对普通 JSON 返回 `undefined`，客户端助手流分块校验在任何历史渲染之前就抛出 `Assistant stream raw chunk must be a lossless JSON object`（上游讨论 [#5677](https://github.com/deepseek-ai/deepseek-harness/discussions/5677) 与 [#5709](https://github.com/deepseek-ai/deepseek-harness/discussions/5709)）。

## 决策

每个站点在比较前把渲染源码中的空白序列折叠为单个空格。三个宿主与客户端站点使用 `.replace(/\s+/gu, ' ').trim()`。worker 线程站点使用 `collapseIntrinsicWhitespace`，即按索引遍历并把排序在 U+0020 及以下的任何字符视为空白的循环，因为该模块在加载时捕获其内建函数以使模型代码无法重定向它们；`String.prototype.replace` 和 `RegExp.prototype[Symbol.replace]` 是实时查询的，会重新打开这一攻击面。

折叠不会放宽判定。`function Object() { [native code] }` 不是可解析的 JavaScript，因此用户编写的函数在任何空白形式下都不会渲染为该文本；只有原生构造函数或被篡改的 `toString` 才能——而 worker 站点捕获的内建函数使篡改情形失效。

## 考虑过的替代方案

**锚定一个正则表达式，例如 `/^function \w+\(\) \{\s*\[native code\]\s*\}$/`。** 不予采纳，因为接受范围等价，正则求值在 worker 站点会查询 `RegExp.prototype`，而由四个镜像站点逐字共享的单一谓词更易保持一致。

**放弃源码文本判定，只依赖 `constructor.name` 和 `constructor.prototype === prototype`。** 不予采纳，因为名为 `Object` 且 `prototype` 为空原型对象的伪造构造函数能同时通过两者；渲染源码是用户函数唯一无法伪造的可观测量，worker 运行时的篡改测试固定了这一拒绝。

**在四个站点间共享一个辅助包。** 不予采纳，因为 `worker-json.ts` 刻意不依赖任何包，其他镜像也有意豁免于重复检测：每个站点都位于不得导入工作区运行时代码的领域或 VM 边界上。

## 后果

Firefox 与 Zen 能加载历史并渲染回复；V8 行为逐字节相同，因为其渲染本就不含空白序列。代价是每次内建判定多一次空白折叠，以及 worker 模块中十五行的辅助函数。

`packages/util/values/tests/intrinsic-rendering.spec.ts` 固定 SpiderMonkey、V8 以及制表符加回车的渲染，并固定对非原生源码、注释或字符串字面量中的 `[native code]`、以及不同名称原生函数的拒绝。`worker-json-engine-rendering.spec.ts` 在 worker 模块捕获 `Function.prototype.toString` 之前打桩引擎渲染，这是针对防篡改模块覆盖该路径的唯一方式。没有测试通道运行 SpiderMonkey；多行渲染取自报告者的实测与 MDN。
