# Agent Note：Python 运行时清单在 fork 上声明 `dsh-base`

状态：已实现

[English](2026-09-09-runtime-manifest-declares-dsh-base.md) | 中文

## 问题

fork 的每次推送都会让 `CI master` 的三个 `python runtime` 作业在 `Run installed-wheel keyless black-box tests` 步骤失败：打包后的运行时在启动时以 `dsh: cannot resolve profile bundle "@deepseek-ai/dsh-base"` 退出。本地复现构建后发现，暂存的 `node_modules` 含有 CLI 依赖的所有 bundle，唯独缺少 `dsh-base`。`scripts/build-exe-for-python-sdk.ts` 用 pnpm 的传统提升链接器部署 `dsh-python-runtime-closure` 清单，只把被提升到源码旁的清单直接依赖复制回去，并省略包内的 `node_modules` 树。上游的 `dsh-base` 会被提升进目标；fork 的 `dsh-base` 依赖已发布的 `@saidouahdachi/dsh-tool-fs-search-native`，其可选的 peer 依赖改变了 pnpm 放置其依赖方的方式，该 bundle 未到达顶层。`verify-runtime-closure` 未能标记此问题，因为它检查的是预设插件与必需的工作区 peer，而不是 CLI 解析的 bundle。

## 决定

`python/sdk-runtime/package.json` 将 `@deepseek-ai/dsh-base` 声明为直接依赖，并一并声明校验器随之要求的六个必需工作区 peer（`dsh-command-feedback`、`dsh-message-feedback`、`dsh-session-title-llm`、`dsh-storage`、`dsh-storage-domain`、`dsh-typert-registry`）。作为直接依赖，该 bundle 要么被提升进目标，要么由 `restoreLegacyHoists` 复制回来。`scripts/snapshots/python-sdk-single-exe` 固件用 `--update-snapshots` 刷新；记录中唯一的差异是请求头中 fork 的 `rule_pin` 与 `state_write` 工具。

## 备选方案

**复制回所有被提升的包，而不只是直接依赖。** 这是对上游构建脚本的改动，fork 每次同步都要携带；清单本就用于枚举闭包，校验器也在强制其 peer。

**从已发布的原生包中移除 peer 依赖。** 插件把它所加载的 harness 包声明为 peer 是正当的；改动已发布的包并不会免除清单命名运行时所解析内容的义务。

## 后果

每次 fork 同步都必须让运行时清单对 `dsh-base` 的依赖图保持闭合：`pnpm run verify-runtime-closure` 会指出缺失的 peer，而无密钥冒烟测试（`scripts/smoke-python-runtime.py --scenario all`）是验证打包运行时能够启动的执行检查。`scripts/snapshots/python-sdk-single-exe` 下的固件携带 fork 的工具集，fork 工具的 schema 变化时必须刷新。

## 测试

本地 `node24-macos-arm64` 构建：暂存树中 `dsh-base` 与其他 bundle 并列，可执行文件能以 `--profile sdk` 启动，刷新固件后 `smoke-python-runtime.py --scenario all --exe <runtime>` 通过。`verify-runtime-closure` 报告闭合的依赖图；hygiene 与翻译配对检查通过。
