# Agent Note: HTTP 403 背后的配额耗尽归类为 QUOTA 而非 AUTH

Status: implemented

[English](2026-09-05-quota-before-forbidden-error-classification.md) | 中文

## 问题

`dsh-llm-deepseek` 中的 `httpErrorCode` 与 `dsh-llm-pi-ai` 中的 `classifyPiAiError` 在用 `isQuotaExceededError` 检查错误体之前就把 401 和 403 解析为 `AUTH`，因此余额或免费额度耗尽的有效密钥（带 `insufficient_quota` 的 `403`）被报告为认证失败，而同样的错误体在 429 下早已解析为 `QUOTA`。`AUTH` 在下游有损：Chat 与 Trajectory 的 `displayFailure` 投影会清空消息，以免提供方回显把凭证保留在 UI 状态中，而 `MessageItem` 渲染固定的 `message.failure.auth` 文案。用户看到的是 `API key is invalid`，而从未看到提供方要求充值的说明（上游讨论 [#5715](https://github.com/deepseek-ai/deepseek-harness/discussions/5715)）。

## 决策

两个分类器按以下顺序检查：401 解析为 `AUTH`；指明配额、余额或额度已耗尽的错误体解析为 `QUOTA`；403 解析为 `AUTH`；其余状态码不变。RFC 9110 将 401 定义为未认证，将 403 定义为已认证但被拒绝，后者正是提供方在余额耗尽时返回的。投影与 UI 文案均不改动：code 为 `QUOTA` 时，投影保留消息，UI 予以显示。`dsh-llm-deepseek` README 的稳定 code 列表以两种语言陈述相同顺序。

## 考虑过的替代方案

**按报告的建议，对每个 `AUTH` 失败在 UI 中显示原始消息。** 不予采纳，因为 `failureMessage` 根本收不到文本——投影已把它替换为空字符串——而放宽投影会重新引入其本要防止的凭证回显。

**在客户端解析消息中的配额标记。** 不予采纳，因为这会在客户端重复宿主的分类逻辑，且针对的是提供方随时改写的散文，而宿主持有状态码与结构化错误体。

**也在 401 之前检查配额。** 不予采纳，因为 401 意味着未认证；401 错误体中的配额措辞不会让密钥变得有效，`AUTH` 仍是可据以行动的 code。

**为带原因的拒绝响应引入新 code。** 不予采纳，因为 `QUOTA` 已存在并带有终止性重试语义与消费方；新 code 会把同一条件拆成两个名称。

## 后果

配额耗尽的用户会在 `QUOTA` 下看到提供方的消息。不含配额措辞的 403 仍为 `AUTH`，401 处理不变。错误体提到配额但实为权限拒绝的 403 现在读作 `QUOTA`；实践中未观察到这类错误体，且无论如何消息都按原文显示。

`packages/llm/llm-deepseek/tests/adapter.spec.ts` 与 `packages/llm/llm-pi-ai/tests/convert.spec.ts` 固定三种情形：含配额措辞的 403 解析为 `QUOTA`，普通 403 为 `AUTH`，含配额措辞的 401 为 `AUTH`。两个测试在原先的顺序下均失败。`quota-finish` 录制会话通过 headless 配置重放一次 `QUOTA` 结束，且提供方消息保持完整。
