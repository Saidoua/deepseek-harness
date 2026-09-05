---
description: "compaction-basic 的直接替代品：无需任何 summarizer 调用即逐出配对平衡的中段，逐字保留种子回合与保留尾部。"
kind: "package-reference"
---

# @deepseek-ai/dsh-compaction-prefix-slide

[English](README.md) | 中文

## 概述

`dsh-compaction-prefix-slide` 用纯逐出取代 LLM 摘要式压缩：会话中段被遮蔽在固定标记之后，而被豁免的种子回合与保留尾部逐字存活。压缩变得即时、确定且无模型调用。该机制假设持久事实存于替换式快照（工作状态、已钉规则、本检查点）而非滚动正文中。

## 目录

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)


-----

<a id="use-this-package"></a>
## 使用本包

在后续 patch 层替换 `compaction-basic` 行的 `name` 来挂载；阈值、保留、重试、`/compact` 与检查点括号全部原样继承。

### 配置

与 `compaction-basic` 相同的配置面（`thresholdRatio`、`retainRatio`/`retainTokens`、重试、模型策略）。summarizer 字段未被使用。

-----

<a id="understand-the-implementation"></a>
## 理解实现

一个子类，覆写基础引擎的 summarizer 钩子；区域选择、配对平衡、seed 保留、事务括号与持久性检查点都是随附的 compaction-basic 代码。

### 源码地图

| 源码 | 职责 |
|---|---|
| — | 本包不发布运行时不变量伴生文档：该引擎只覆写 `compaction-basic` 的一个方法，并原样继承其事务、阈值与检查点不变量。 |

-----

<a id="further-exploration"></a>
## 进一步探索

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.zh.md) —— 本包实现的决策记录。
- [Architecture overview](../../../docs/architecture.zh.md) —— 周边的 harness 架构。

-----

<a id="model-experience"></a>
## 模型体验

### Eviction marker

#### 模型看到什么

模型看到一条以行内 `[prefix slide]` 标记开头、说明有多少较早的消息被无摘要逐出的检查点消息，以及持久事实所在之处（工作状态快照、已钉规则与本检查点）。被逐出的正文有意不在请求中。

#### Token 影响

每次压缩一条小消息，替换一个通常大几个数量级的跨度；不花费任何 summarizer 调用。

#### KV Cache 影响

标记文本对给定的逐出计数是固定的，且逐出相对步骤而言很少发生，因此前缀缓存失效很少见。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 被逐出的正文没有摘要即消失：没有替换式状态快照的部署是有意损失这些内容的。
- 小于 framed 标记的跨度无法被压缩（收缩守卫会拒绝）；微小跨度选择拒绝而非空转。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作背景 —— 点击展开</summary>

与其他会话韧性插件一同引入；决策记录见仓库的 Agent Note。

</details>
