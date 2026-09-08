# Agent Note：首个用户回合的保留成为 compaction-basic 的设置项

状态：已实现

[English](2026-09-09-configurable-seed-turn-sparing.md) | 中文

## 问题

`compaction-basic` 的自动压力压缩会把首个用户回合留在表面上，使任务起点逐字留存。这一选择原本固定在引擎里：`compactIfNeeded` 无条件向 `selectCompactableRange` 传入 `spareSeedUserTurn: true`。部署无法更改它，这违反了仓库禁止硬编码可调参数的规则；同时 `acp/image-compaction` 快照场景不再压缩：它唯一的重量内容是起点提示中的图片，在 `retainTokens: 100` 预算下保留起点后没有可压缩区间，压力检查返回 `null`。快照刷新把这种静默记录为预期输出，该场景因此不再证明按路由计价的图片 token 驱动了压力判定。

## 决定

`spareSeedUserTurn` 成为 `BasicCompactionConfig` 中经校验的布尔字段，在 `resolveConfig` 中解析，默认值为 `true`，仅由自动压力路径读取。手动压缩与上下文溢出恢复一如既往不传入保留选项。`acp/image-compaction` 场景在其组合与无密钥回放覆盖层中都设置 `spareSeedUserTurn: false`，其固件重新在第 2 回合记录 `compaction/start`、`compaction/summary` 与 `compaction/end`。

## 备选方案

**当保留后的区间为空时放宽保留。** 只要其他内容装不下就退而压缩起点，会让产品行为取决于读者无法在日志中看到的预算算术，并且恰恰会在最需要起点的小窗口场景中悄悄丢弃它。设置项按部署明确表达意图。

**给场景增加更多回合。** 更长的手工固件会留出非起点区间，但压力将同时来自文本与图片，削弱该场景所证明的内容。

**按模型策略的字段。** 目前没有消费者需要按路由模型区分保留行为；在出现之前该字段保持在顶层。

## 后果

部署默认保留起点。起点本身就是可压缩内容的组合需显式选择退出，理由与设置一起写在其 `cordis.yml` 中。`compactIfNeeded` 中关于溢出恢复的注释现在说明压力路径默认保留起点。

## 测试

`compaction-basic.spec.ts` 覆盖 `spareSeedUserTurn: false` 在自动压力下压缩起点、默认值保留起点，以及非布尔值在加载时被拒绝。`acp/image-compaction` 回放记录一次压缩，其被遮蔽区间从起点开始。`verify-config-catalog` 与 README 表格以两种语言承载该字段。
