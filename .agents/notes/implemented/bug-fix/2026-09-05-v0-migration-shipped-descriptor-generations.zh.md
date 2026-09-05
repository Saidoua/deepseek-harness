# Agent Note: 格式 v0 迁移接纳 v0 实际发布过的 descriptor 世代

Status: implemented

[English](2026-09-05-v0-migration-shipped-descriptor-generations.md) | 中文

## 问题

`assertReleasedEventPayload` 按 descriptor 版本 3 校验 `subagent/descriptor` 负载，并且在所读工件为 v0 源时，以 `SessionFormatUnsupportedMigrationError` 拒绝其他任何版本。descriptor 3 是在格式 v0 自身生命周期内取代 descriptor 2 的，因此已发布的 v0 日志理应携带版本 2，这一拒绝使得该次提升之前写入的每个会话只要包含一个 subagent 子代理便无法打开——迁移失败，整个会话随之失败。同一函数的 v1 一侧本就原样放行此类负载，正是这种不对称暴露了错误：更老的格式反而更严格。

## 决策

源侧接纳格式 v0 实际发布过的世代——`RELEASED_V0_DESCRIPTOR_VERSIONS` 为 `{2, 3}`——并继续拒绝其余版本。来自比本迁移更新的构建的 descriptor 仍被拒绝而非带入 v1，这正是源侧检查存在的意义。被接纳的旧 descriptor 会像 v1 侧那样原样放行且不被读取：`parseSubagentDescriptor` 对运行时不支持的版本回答 `undefined`，因此受影响的子代理失去冷恢复能力，而其会话仍可迁移并打开。

## 考虑过的替代方案

**在源侧容忍任意 descriptor 版本，与 v1 分支保持一致。** 不予采纳，因为这会丢弃前向兼容守卫：由更新构建写入的日志会被更旧的构建静默迁移。既有的版本 4 用例固定了该拒绝行为。

**在 v0→v1 边界把 descriptor 2 规范化为 3。** 因两点不予采纳。其一，这会改写已提交的会话内容，而[邻接迁移](../architecture/2026-08-31-released-session-format-migrations.zh.md)不允许如此；其二，这会把版本 2 的负载交给版本 3 的解析器，恰恰击穿了 `parseSubagentDescriptor` 处为阻止此事而存在的门禁。两个世代之间若有字段变化，结果将是静默损坏而非缺失 descriptor。

**保留拒绝并把手工编辑写进文档。** 不予采纳，因为该数据对其格式而言是合法的：会话并未损坏，也不应要求任何用户为打开会话而编辑持久日志。

## 后果

包含 subagent 子代理的提升前会话可以迁移并打开。其子代理不可冷恢复，因为运行时不解析版本 2 的 descriptor——这与该会话在本迁移存在之前的处境相同，且表现为可见而非致命。descriptor 已是版本 3 的会话不受影响。

`source/current policy` 测试现固定两个方向：来自未来的版本 4 仍被拒绝，来自过去的版本 2 可以迁移。两条断言在原行为下均失败。报告于讨论 #5753。
