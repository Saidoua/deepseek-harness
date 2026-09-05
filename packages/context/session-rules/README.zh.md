---
description: "会话内钉立的常设规则：`/rule` 命令与 `rule_pin` 工具，其逐字 `<pinned_rules>` 消息在每次压缩后重新注入。"
kind: "package-reference"
---

# @deepseek-ai/dsh-session-rules

[English](README.md) | 中文

## 概述

`dsh-session-rules` 允许用户与模型钉入跨压缩逐字存活的会话常设规则。摘要式压缩会把规则改写得无法执行，因此被钉规则绝不进入摘要流：当可见副本被遮蔽或列表变化时，精确列表会整体重新注入。

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

挂载插件后，用 `/rule <text>` 钉入、`/rule list` 列出、`/rule remove <n>` 移除。模型可通过 `rule_pin` 工具钉入但不能移除规则。列表由持久的 `rule/pin`/`rule/unpin` 事件流承载，由 `sessionRules` 投影折叠；一条经摘要校验的持久消息把逐字列表带给模型。

### 配置

`maxRules`（默认 20）限制列表长度；`maxRuleChars`（默认 500）限制单条规则的长度。违规在钉入时被拒绝，绝不截断。

-----

<a id="understand-the-implementation"></a>
## 理解实现

注册内容为一个投影、一个命令和一个工具；重新注入监听器镜像技能目录对持久日志的摘要扫描，并原位替换其发布消息。

### 源码地图

| 源码 | 职责 |
|---|---|
| — | 本包不发布运行时不变量伴生文档：持久规则列表是 `rule/pin` / `rule/unpin` 之上的投影，重新注入是该列表摘要与可见表面的纯函数——两者都由本包测试覆盖，无需单独的观测流。 |

-----

<a id="further-exploration"></a>
## 进一步探索

- [Agent Note: session resilience plugins](../../../.agents/notes/implemented/feature/2026-09-04-session-resilience-and-loop-control.zh.md) —— 本包实现的决策记录。
- [Architecture overview](../../../docs/architecture.zh.md) —— 周边的 harness 架构。

-----

<a id="model-experience"></a>
## 模型体验

### Pinned rules message

#### 模型看到什么

模型看到一条 `<system-reminder>`，其 `<pinned_rules>` 块按编号逐字列出规则，并附带"严格遵循、冲突时说明"的指令。列表变化时以替换声明重新发布；清空列表则发布墓碑。该消息是持久的，并在压缩后重新注入。

#### Token 影响

一条消息，大小约为每条规则 47 token 加固定框架；它替换其前身而不是累积。

#### KV Cache 影响

列表不变时消息内容保持稳定，因此其 token 在各步骤间保持前缀缓存友好。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 只有用户能移除已钉规则；模型的钉入工具在设计上仅能钉入。
- 规则是会话级的；没有跨会话的规则存储。
- 超过 `maxRuleChars` 的规则会被拒绝；harness 绝不截断规则文本。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作背景 —— 点击展开</summary>

与其他会话韧性插件一同引入；决策记录见仓库的 Agent Note。

</details>
