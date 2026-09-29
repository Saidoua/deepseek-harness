---
description: "为终端配置加入固定规则、类型化工作状态、技能使用统计与进程内搜索后端。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-extras

[English](README.md) | 中文

## 概述

此 Bundle 将本 fork 的插件带入终端配置（`headless`、`sdk`、`acp`），而无需修改 `dsh-base`。它以进程内搜索后端替换内置的 `tool-fs-search` 条目，并插入 `session-rules`、`skill-stats` 与 `tool-state`。`dsh-web-app` 运行时，每个插入的条目都会关闭，在那里由 [`dsh-extras-web`](../extras-web/README.zh.md) 提供相同插件。

## 目录

- [使用此包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

在 `$DSH_HOME/profiles/<name>/package.json` 的 `dsh.profile.bundles` 中，于该配置现有 Bundle 之后追加 `@deepseek-ai/dsh-extras`。安装本身依赖此包，因此无需安装软件包即可解析此 Bundle。下一次启动会注册来自 dsh-rs 插件的 `glob` 与 `grep`（在没有预编译二进制的平台或 `DSH_NATIVE=0` 时注册内置的基于子进程的工具）、`rule_pin` 与 `/rule` 命令、`state_write`，以及技能使用投影。移除该名称即恢复随包组合。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>维护者细节——点击展开</summary>

补丁不能更改条目的包，因此内置的 `tool-fs-search` 条目按 id 禁用，搜索后端以 `tool-fs-search-native` 插入。每个插入的条目都带有基于 `profileContext.startedBundles` 的 `disabled: !!js`，因此在 Web 配置中选中此 Bundle 不会向宿主平面添加任何内容——在那里，智能体条目会影响每个会话。`apps/cli` 依赖此包，使该 Bundle 可从安装中解析。此包仅含配置、不拥有可变运行时状态，因此不发布运行时不变量配套。

| 文件 | 作用 |
|---|---|
| [`cordis.patch.yml`](cordis.patch.yml) | 禁用 `tool-fs-search`；插入四个条目 |
| [`package.json`](package.json) | 条目的包，作为依赖 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [Web 附加 Bundle](../extras-web/README.zh.md)——通过预设为 Web 配置提供相同插件。
- [基础 Bundle](../base/README.zh.md)——此 Bundle 叠加其上的组合。
- [会话规则](../../context/session-rules/README.zh.md)与[工具状态](../../todo/tool-state/README.zh.md)——两个添加模型可见消息的插件。

-----

<a id="model-experience"></a>
## 模型体验

### 新增工具

#### 模型看到什么

工具目录增加 `rule_pin` 与 `state_write`；`glob` 与 `grep` 的模式不变。固定规则以一条 `<pinned_rules>` 消息到达模型，每次压缩后重新发布；工作状态以一条可替换的 `<task_state>` 消息到达。

#### Token 影响

每个请求增加两个工具模式。每条固定规则与每个状态键将其文本加入重新发布的消息，受 `maxRules`/`maxRuleChars` 与 `maxKeys`/`maxStateChars` 限制。

#### KV Cache 影响

工具模式从第一个请求起就属于请求前缀。重新发布的 `<pinned_rules>` 或 `<task_state>` 消息出现在压缩之后，而压缩已经重写了前缀。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 插件管理页不列出此 Bundle；需编辑配置清单来选中它。
- 按 id 指向 `tool-fs-search` 的配置补丁修改的是已禁用的内置条目，而非搜索后端；请改为指向 `tool-fs-search-native`。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者细节——点击展开</summary>

无。

</details>
