---
description: "从插件管理页为 Web 配置加入 Standard + 智能体预设、技能使用统计与阿拉伯语。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-extras-web

[English](README.md) | 中文

## 概述

此可选 Bundle 将本 fork 的插件带入 Web 组合，而无需修改 `dsh-base` 或 `dsh-web-app`。它加入 `Standard +` 智能体预设并将其设为新会话的默认预设，插入 `skill-stats` 投影与 `locale-ar` 阿拉伯语包，随包预设保持可选且不变。随包配置默认禁用。

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

打开 Web 侧栏的插件管理页并启用 Standard +。此后新会话使用 `Standard +` 预设，即随包的 `standard` 预设，另加用于 `glob` 与 `grep` 的进程内搜索后端、固定的常设规则（`/rule` 与 `rule_pin`）以及类型化工作状态（`state_write`）。语言菜单提供阿拉伯语，技能使用情况按会话投影。已在运行的会话保留其预设；预设选择器仍列出 `standard`、`ptc`、`minimal` 与 `cordis`。禁用此 Bundle 会恢复随包组合。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>维护者细节——点击展开</summary>

补丁既不能更改条目的包，也不能深入预设的 `config.plugins`，因此本 fork 的智能体条目以完整预设交付，而不是修改随包预设。`presets/standard-plus.patch.yml` 由 `src/gen-standard-plus.ts` 从 `packages/bundle/web-app/presets/standard.patch.yml` 生成，其每处修改替换一个必须恰好出现一次的锚点；当提交的文件与推导结果不同时，`tests/patch.spec.ts` 会失败，因此上游对 `standard` 的修改会在下一次测试运行时暴露。用 `pnpm exec tsx packages/bundle/extras-web/src/gen-standard-plus.ts` 重新生成。

`packages/boot/app-boot/src/profile.ts` 中的 `OPTIONAL_BUNDLES` 列出此包，且 `apps/cli` 依赖它，因此插件管理器以禁用状态提供它。选中后，此 Bundle 追加在 `dsh.profile.bundles` 中的 `dsh-web-app` 之后。此包仅含配置、不拥有可变运行时状态，因此不发布运行时不变量配套。

| 文件 | 作用 |
|---|---|
| [`cordis.patch.yml`](cordis.patch.yml) | 插入 `skill-stats` 与 `locale-ar`；将预设注册表默认值设为 `standard-plus` |
| [`presets/standard-plus.patch.yml`](presets/standard-plus.patch.yml) | 生成的 `Standard +` 预设 |
| [`src/gen-standard-plus.ts`](src/gen-standard-plus.ts) | 从随包 `standard` 预设推导该预设 |
| [`package.json`](package.json) | 条目所引用的每个包，作为依赖 |
| [`locale/en.json`](locale/en.json)、[`locale/zh.json`](locale/zh.json) | 插件管理页的标题与说明 |
| [`icon.svg`](icon.svg) | 插件管理页图标 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [终端附加 Bundle](../extras/README.zh.md)——为终端配置提供相同插件。
- [Web Bundle](../web-app/README.zh.md)——此 Bundle 叠加其上的组合。
- [阿拉伯语语言包](../../client/locale-ar/README.zh.md)——此 Bundle 加入的语言。

-----

<a id="model-experience"></a>
## 模型体验

### 预设工具

#### 模型看到什么

使用 `Standard +` 的会话获得 `standard` 的工具目录，另加 `rule_pin` 与 `state_write`；`glob` 与 `grep` 的模式不变。固定规则以一条 `<pinned_rules>` 消息到达模型，每次压缩后重新发布；工作状态以一条可替换的 `<task_state>` 消息到达。

#### Token 影响

`Standard +` 会话的每个请求增加两个工具模式。每条固定规则与每个状态键将其文本加入重新发布的消息，受 `maxRules`/`maxRuleChars` 与 `maxKeys`/`maxStateChars` 限制。

#### KV Cache 影响

工具模式从会话第一个请求起就属于请求前缀。重新发布的 `<pinned_rules>` 或 `<task_state>` 消息出现在压缩之后，而压缩已经重写了前缀。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- `Standard +` 复制自 `standard`。上游对 `standard` 的修改只有在重新生成预设后才会带入；在此之前 Bundle 测试会失败。
- `ptc`、`minimal` 与 `cordis` 预设不含本 fork 的工具。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者细节——点击展开</summary>

无。

</details>
