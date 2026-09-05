# Agent Note: 进程内搜索插件是可选的注册表依赖

Status: implemented

[English](2026-09-05-optional-in-process-search-addon-dependency.md) | 中文

## 问题

`dsh-tool-fs-search` 将其进程内 ripgrep 后端 `@saidoua/dsh-native` 声明为硬依赖，且使用指向仓库之外路径的 `link:` 范围（`link:../../../../dsh-rs/npm`）。`link:` 范围是工作站路径而非注册表说明符：`verify-npm-install-layout` 与 `verify-packed-install` 失败，因为 npm 无法在合成的双版本注册表中解析它，而任何已发布的 `dsh-tool-fs-search` 清单都会携带同样无法解析的路径。该包未发布到 npm，且工具本已把插件视为可缺失——`native.ts` 在首次使用时通过 `createRequire` 加载它，并保留 ripgrep 子进程作为回退。

## 决策

`@saidoua/dsh-native` 是 `optionalDependencies` 条目，注册表范围为 `^0.1.0`。本地开发通过 `pnpm-workspace.yaml` 中工作区级别的 `overrides` 条目（`link:../dsh-rs/npm`）保持插件链接，这与链接 vendored 的 `@deepseek-ai/cosmokit` 和 `@deepseek-ai/schemastery` 是同一机制。因此已发布的清单携带干净的注册表范围，包不可用时 npm 会跳过它，而锁文件把该覆盖记录为 pnpm 自身的解析结果。

## 考虑过的替代方案

**在 `optionalDependencies` 下保留 `link:` 范围。** 不予采纳，因为 pnpm pack 会把 `link:` 范围原样复制进已发布的清单，消费方仍会收到一个无处可解析的路径。

**在依赖它之前先发布插件。** 推迟而非否决：发布会让消费方能够解析该可选范围，但无论如何清单契约都是正确的，且发布是 `dsh-rs` 仓库单独的发布决策。

**把插件内联为工作区包。** 不予采纳，因为插件是带有自身构建的 Rust 源码，而 `native/` 保留给本仓库拥有的唯一插件 `@deepseek-ai/node-addon-landlock-run`。

**为通知生成器添加 `OVERRIDES` 条目。** 不予采纳，因为那会继续为一个本就不该出现在通知文件中的包固定许可证字符串；`FIRST_PARTY` 才陈述了它无需条目的真正原因。

## 后果

`verify-npm-install-layout` 对每个合成版本验证 223 个包，插件位于 npm 忽略的可选名称之中，`pnpm install --frozen-lockfile` 在记录覆盖后通过。从 npm 安装的消费方在插件发布之前使用子进程后端；工作站链接使进程内后端及其集成套件在开发中保持可用。`verify-optional-dependency-imports` 确认不存在对插件的静态导入。

该插件是 `scripts/gen-third-party-notices.ts` 中的 `FIRST_PARTY` 名称，与 `node-addon-landlock-run` 系列并列，因此 `THIRD_PARTY_NOTICES.md` 不再列出它：它是本仓库所有者自己的原生包而非第三方软件，且干净安装下生成器无清单可读。没有该条目，通知规格会在任何缺少同级检出的机器上失败——也就是除作者之外的每一台机器。
