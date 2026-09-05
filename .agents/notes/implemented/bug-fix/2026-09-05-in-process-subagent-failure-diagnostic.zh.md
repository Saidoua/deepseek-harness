# Agent Note: 进程内 subagent 运行携带子代理的失败详情

Status: implemented

[English](2026-09-05-in-process-subagent-failure-diagnostic.md) | 中文

## 问题

`SubagentResult.diagnostic` 是该 seam 用于承载提供方所撰失败详情的字段，`tool-subagent` 会在标题旁以 `Diagnostic:` 呈现它。进程外提供方通过 `collectDiagnostic` 填充该字段；进程内驱动从未填充。其 `readResult` 把子代理的 `turn/end` reason 经 `toStopReason` 折叠，而后者只保留终态词汇——`'error'`——并丢弃与之并列的 `LlmFailure`。因此委派工具只渲染 `subagent run failed` 而别无其他，真正的原因（额度上限、鉴权拒绝、无效请求）仅存活在子代理自己的会话日志中。报告者为一个自始至终都被记录着的 `429` 消费上限耗费了数天。

## 决策

`readResult` 读取它本就折叠的同一个 `turn/end` reason，并在该 reason 为错误时，把 `reason.error.message` 作为 `diagnostic` 带入结果。`limitSubagentDiagnostic`——此前为进程外模块私有，现由该 seam 导出——施加所记录的字节上限，因此两个提供方以同一份实现而非两份来约束该字段。该消息是循环自身记录的失败文本；驱动不添加自己的措辞。

## 考虑过的替代方案

**返回整个 `LlmFailure`，包含 code 与 status，而非其 message。** 不予采纳，因为 `diagnostic` 被定义为消费方在输出旁展示的呈现文本，而非路由面；`stopReason` 已承载机器可读的结果。

**让工具层在运行失败时读取子代理的会话日志。** 不予采纳，因为这颠倒了 seam：提供方拥有对自身失败的陈述，而远程提供方根本没有可供工具读取的子会话。

**在驱动中复制该字节上限辅助函数。** 不予采纳，因为该上限是围绕一个既定字段的 seam 级契约；两份副本会漂移。

## 后果

在模型调用层失败的进程内子代理，现在会在委派工具的结果中报告原因，操作者无需打开子代理日志。进程外行为不受影响。以其他方式结束的运行该字段仍然缺席，因此已完成或已取消的结果读起来与此前完全一致。

一项测试断言结果的 diagnostic 等于子代理自身 `turn/end` 所记录的失败，而非某个字面字符串，使措辞继续归属于循环。该测试在原行为下失败。报告于讨论 #5754。
