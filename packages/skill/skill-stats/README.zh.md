---
description: "会话投影：从持久日志折叠每个技能的调用与错误计数，并区分模型加载与用户手势。"
kind: "package-reference"
---

# @deepseek-ai/dsh-skill-stats

[English](README.md) | 中文

## 概述

`dsh-skill-stats` 把会话日志折叠为每个技能的使用行：调用数、错误数、最近调用的位置与时间，以及它是模型的 `skill` 工具加载还是 `/name` 手势。运行时结果才是可信的技能质量信号；静态扫描无法预测它。

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

挂载插件后，`skillStats` 投影可通过会话投影注册表供 UI 与离线评估使用。没有任何面向模型的表面。

### 配置

无 —— 该投影没有可调项。

-----

<a id="understand-the-implementation"></a>
## 理解实现

一个纯投影：`skill` 的 `tool/call` 按调用 id 与其 `tool/result` 配对（技能名从调用参数读取；畸形调用进入 `unknown` 桶），来源为 `skill-invocation` 的消息按手势计数。

### 源码地图

| 源码 | 职责 |
|---|---|
| — | 本包不发布运行时不变量伴生文档：该投影只折叠既有的 `tool/call`、`tool/result` 与技能调用事件，自身不产生任何事件。 |

-----

<a id="further-exploration"></a>
## 进一步探索

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.zh.md) —— 本包实现的决策记录。
- [Architecture overview](../../../docs/architecture.zh.md) —— 周边的 harness 架构。

-----

<a id="model-experience"></a>
## 模型体验

无：该单元把已记录的工具与消息事件折叠为面向客户端的读模型，不注册任何面向模型的内容。

#### KV Cache 影响

无；本包从不组装或发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 仅观察：该投影记录调用，不为质量评分。有成/无对照试验仍是评估协议。
- `unknown` 桶吸收参数不是合法 JSON 的 `skill` 调用。
- 仅在组合了投影注册表的地方挂载。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作背景 —— 点击展开</summary>

与其他会话韧性插件一同引入；决策记录见仓库的 Agent Note。

</details>
