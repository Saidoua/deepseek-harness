# Agent Note: 会话韧性插件

Status: implemented

[English](2026-09-04-session-resilience-and-loop-control.md) | 中文

## Problem

LLM 摘要式压缩会破坏 harness 依赖的三类内容：会话中段陈述的常设规则与约束（实测一轮压缩后精确保留率 53%，五轮后 10% —— The Compaction Cliff, arXiv:2608.22752）、用户的原始任务锚点，以及只存在于滚动正文中的持久任务事实（SKILL.state, arXiv:2608.26263：在相同 token 预算下，显式结构化状态得 0.94，滑动窗口 0.18，摘要 0.52，完整历史 0.84；Recuris, arXiv:2608.24876：仅工作记忆即带来 +23.9 分）。此外，技能层没有运行时使用信号（静态技能扫描与运行时价值的相关性仅 ρ = 0.14 —— arXiv:2608.20614），没有来源标记（Daydreaming, arXiv:2608.26733：约 32 次普通黑盒任务交互即可功能性地重建一个隐藏的多文件技能），循环控制也只有静态目标重述——其效果与完全没有控制完全相同（LoopArena, arXiv:2608.28281）。

## Decision

四个包全部构建在已文档化的扩展点上，不修改 `agent-loop`：

- `packages/context/session-rules` —— `/rule` 与 `rule_pin` 工具追加 `rule/pin`/`rule/unpin` 事件；一条经摘要校验的持久 `<pinned_rules>` 消息在压缩遮蔽它或列表变化时按原文重新注入。只有用户能移除规则；模型只能钉入。
- `packages/todo/tool-state` —— `state_write` 维护一个替换式 `<task_state>` 快照（字符串设置键，`null` 删除键；值为扁平的 `string | string[]`），由最后写入者胜出的 `state/write` 事件承载，并按技能目录的方式重新注入。
- 技能层 —— `SkillSummary.trusted`（`custom` 与 `user-agents` 根目录默认不可信；`untrustedSources` 可替换该集合；不可信正文在位于 `<skill_content>` 包裹之前的警示后渲染）、`skill-stats` 使用投影（从日志折叠每个技能的调用数、错误数、tool 与 gesture 区分）。
- `compaction-basic` seed 保留 —— 自动压力压缩的跨度从第一条真实用户消息之后开始；只包含历史检查点的跨度会被拒绝（重新 framed 后永远无法通过收缩守卫）；上下文溢出恢复与 `compactNow` 仍然回收全部内容，因为只有在压力压缩已保留 seed 而请求仍然放不下时才会到达溢出（保留 seed 的溢出跨度可能只剩一条运行时上下文消息，它永远无法收缩，提供方错误随之保持且无路可退）；孤立的 `compaction/start` 在选择之前报告 `busy`。
- `packages/compaction/compaction-prefix-slide` —— 一个 `compaction-basic` 子类，其 summarizer 返回固定的逐出标记；只能通过在 overlay 中替换 `compaction-basic` 行的 name 来挂载。

## Alternatives considered

**在 summarizer 指令中要求逐字保留规则。** 已拒绝：实测的漂移正是发生在摘要过程内部；一个改写式的流水线无法保证逐字存活。

**经验 wiki，无论运行时还是离线。** 已拒绝。运行时：WikiSkill 实测运行时访问 wiki 是一种退化（63.7 → 60.9）；知识应在维护阶段编译进技能。离线（一个把带日期的行追加到项目 markdown 文件的 `/lesson` 命令）：不面向模型，也没有任何可测量的收益——人类不需要命令就能向 markdown 文件追加内容。

**运行时控制器检查点。** 已拒绝：每 N 步一次辅助模型调用，审阅证据包并发出 advance/verify/stop，实测每次检查点阻塞步骤延迟 1.13 秒、消耗约 510 token（N = 8 时 40 步的一轮合计 5.7 秒、约 2 500 token），而此处没有任何评测能证明其收益；且其最强指令 `stop` 只能注入一句话——无法真正终止循环——这正是 LoopArena 实测等同于无控制的形态。

**只读工具的结果重放缓存。** 已拒绝：已文档化的接缝无法重放结果（`tools/pre-execute` 只允许 allow/deny/ask；`tools/execute` 环绕瀑布契约只允许修改 `exec.signal`），且重放的 `read` 会跳过 read-before-edit 观察。强行实现意味着核心注册表变更及新的取消不变量。

**把 prefix-slide 作为默认压缩引擎。** 已拒绝：无摘要的逐出只在持久事实存于替换式快照时才正确；LLM 摘要仍是随附的默认值，overlay 切换只需一行。

**技能发现时的惰性正文 IO。** 已拒绝：发现阶段读取的文件与只读 frontmatter 是同一个文件，而提示层的渐进披露（name+description 目录、正文经 `ctx.skills.get()`）已经约束了上下文。

## Consequences

- 两个面向模型的插件（session-rules、tool-state）在 dsh-base bundle 中以**启用态**随附，recorded-session 语料已按它们新增的两个工具 schema 重新钉定。在由 preset 组装 agent 平面的场景中，它们与 `tool-todo` 一样属于 agent 平面行——在 web 宿主组合中禁用，由 `standard`、`ptc` 与 `cordis` preset 挂载——因此 `minimal` 保持其精确的两工具面，宿主工具层保持为空；没有 preset 的 profile 仍将它们留在宿主侧。实测成本是挂载它们的 agent 每次请求都携带的工具 schema：`rule_pin` 140 token，`state_write` 243 token；在已钉规则或已设状态时，注入消息另计 116 / 62 token。该 schema 是压缩无法逐出的下限，在 `acp/image-compaction` 中它移动了压缩边界。`skill-stats` 仅写日志，不注册任何面向模型的内容。
- 钉入的规则与工作状态在每一次压缩后都逐字存活，包括跨多轮；移除规则或清空状态都会发布墓碑消息，避免过期指引残留。
- `compaction-prefix-slide` 以未挂载状态随附；overlay 切换只需一行，并继承全部事务机制。挂载后的实测节省：每次压缩省下一次 summarizer 调用，在 60 轮跨度上为 5.3 秒与约 13 000 个 prompt token。
- 技能作者不能再依赖不可信根目录的技能被静默执行：不可信正文被框定为需验证的数据，且 `skill-stats` 投影会记录它们是否真的被调用以及是否出错。
