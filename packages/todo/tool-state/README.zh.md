---
description: "面向模型的 state_write 工具：类型化的工作状态快照（字符串设置键，null 删除键），在每次压缩后作为一个替换块重新注入。"
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-state

[English](README.md) | 中文

## 概述

`dsh-tool-state` 维护会话的类型化工作状态：任务持久事实的小型键值记录。状态是一个替换式快照——更新它重写可见块而非增长历史——并且在压缩后逐字重新注入，因此长程工作不依赖于存活的正文。

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

挂载插件后，代理用补丁对象调用 `state_write`。字符串或字符串数组设置键；`null` 删除键。建议键（`goal`、`decisions`、`files_touched`、`blockers`、`next_steps`）只是约定；接受任何扁平键。状态由最后写入者胜出的 `state/write` 事件承载，由 `taskState` 投影折叠。

### 配置

`maxStateChars`（默认 4000）限制渲染后的快照；`maxKeys`（默认 50）限制键数。预算在写入时按注入所用的同一渲染器执行。

-----

<a id="understand-the-implementation"></a>
## 理解实现

注册内容为一个投影和一个工具；重新注入监听器镜像技能目录的摘要扫描并原位替换其快照消息，状态清空时包括墓碑。

### 源码地图

| 源码 | 职责 |
|---|---|
| — | 本包不发布运行时不变量伴生文档：工作状态是一条最后写入者胜出的 `state/write` 快照，除本包测试已断言的内容外，没有需要观测的跨事件顺序不变量。 |

-----

<a id="further-exploration"></a>
## 进一步探索

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.zh.md) —— 本包实现的决策记录。
- [Architecture overview](../../../docs/architecture.zh.md) —— 周边的 harness 架构。

-----

<a id="model-experience"></a>
## 模型体验

### Working state snapshot

#### 模型看到什么

模型看到一条 `<system-reminder>`，其 `<task_state>` 块按键排序渲染合并后的状态，附带更新语义（字符串设置键，`null` 删除）与权威性声明。该消息是持久的，并在压缩后重新注入；清空状态则发布墓碑。

#### Token 影响

一条消息，写入时以 `maxStateChars` 为界；它替换其前身而不是累积。

#### KV Cache 影响

对给定状态，渲染文本是确定的，因此状态不变时其 token 保持前缀缓存友好。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 值是扁平的：字符串或字符串数组。嵌套对象会被拒绝而非被静默改形。
- 状态是会话级的；除会话日志外没有跨会话持久化。
- `state_write` 记录持久事实；步骤级进度属于 `todo_write`，目标生命周期属于 goal 工具。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作背景 —— 点击展开</summary>

与其他会话韧性插件一同引入；决策记录见仓库的 Agent Note。

</details>
