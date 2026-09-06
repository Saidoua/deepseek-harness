# Agent Note: base bundle 改挂已发布的搜索插件

Status: implemented

[English](2026-09-06-published-search-plugin-in-base-bundle.md) | 中文

## Problem

进程内搜索后端此前是以源码补丁的形式进入工具的：`@deepseek-ai/dsh-tool-fs-search` 里一个通过 `createRequire` 加载 addon 的 `native.ts` 模块、一条 `optionalDependencies`、一条工作区 override、一项 third-party-notices 豁免，以及按后端分别接线的测试。这让本仓库跟随的一个包为了某项能力而偏离上游，而该能力如今已经独立发布并有自己的版本；每一次与上游合并都要手工消化这份偏离。

## Decision

`packages/fs/tool-fs-search` 完全回到上游内容。base bundle 的 `tool-fs-search` 条目改为挂载 `@saidouahdachi/dsh-tool-fs-search-native`，固定在 `0.1.1`，配置为 `sampleOverCapGlobResults: false` 与 `whenAddonMissing: spawn`。

该插件把 `glob` 与 `grep` 注册到 `@saidouahdachi/dsh-native` addon 上，并复用内置包导出的解析器、格式化器、展示器与 spill 恢复，因此工具名称、JSON schema、系统提示词引导、渲染文本与搜索卡片都保持不变 —— 只有 `execute` 不同。在没有可用 addon 时，插件会自行注册内置的 spawn 版工具，因此没有预编译二进制的平台以及 `DSH_NATIVE=0` 的部署，行为与未打补丁的 profile 完全一致。

条目 id 保持 `tool-fs-search`。id 是组合中的位置名，不是包名，而 [web bundle](../../../../packages/bundle/web-app/cordis.patch.yml) 正是按这个 id 在客户端平面禁用搜索工具的。

## Alternatives considered

- **保留源码补丁。** 它重复了一份已经发布并有版本的实现，也让每次与上游合并都要去消化一个本仓库并不拥有的包。插件这条 seam 用组合表达了同样的运行时行为。
- **给插件换一个新的条目 id。** 那样 web bundle 里的 `- id: tool-fs-search / disabled: true` 就会指向一个不存在的条目 —— 启动时打印一条 stderr 警告 —— 而搜索工具会挂在客户端平面上，而那一行的存在正是为了把它们挡在外面。
- **用版本范围而不是精确固定。** addon 的预编译包家族与插件是一起演进的；精确固定让已发布的组合可复现，也把升级变成一次显式、可审阅的改动。
