# Agent Note：已安装包从当前运行的安装解析 harness peer

Status: implemented

[English](2026-09-22-installed-package-peer-interception.md) | 中文

## 问题

已发布的插件可以作为随包 bundle 的依赖进入进程，而不经由 profile 安装：本 fork 在 `packages/bundle/base` 中挂载 `@saidouahdachi/dsh-tool-fs-search-native`，pnpm 因此把它解包到 checkout 自身的 `node_modules` 下，并把它的 `@deepseek-ai/dsh-tools` peer 链接到 workspace 包。

在源码启动下，workspace 包通过 `exports` 回答这条链接，而 `exports` 指向构建产物 `lib/`；仓库内的模块则通过 tsx 的 tsconfig paths 到达同一个包，拿到 `src/`。于是一个进程里存在两份 `ToolRuntime` 模块：两个 `TOOL_RUNTIME_SCHEDULER` symbol、两个类标识，以及模块级状态的两份副本。工具注册之所以仍然可用，是因为两份副本都通过 context 到达同一个服务实例；但 `apps/cli/tests/source-launch.compat.spec.ts` 会因第二份副本失败，而它所守护的故障形态——scheduler symbol 与持有它的 runtime 不再匹配——正是该守护出现之前 loader 遇到过的那一种。

`findInterceptionLayer` 只接纳 profile 树与 linked root，并排除全部 installation 作用域包目录，因此这个已发布插件自身的查询从未被路由，改由 Node 的“最近副本”规则决定它看到哪一份 `dsh-tools`。

## 决策

目录位于 `node_modules` 之下的 installation 作用域包，纳入 linked 拦截。它声明的 peer 于是在每个祖先位置从该安装自身的条目解析，与 linked profile root 完全一致，从而让每个 peer 在进程中只有一份模块实例。

位于 `node_modules` 之外的第一方安装目录保持原生查询。那是源码 checkout 自身的 workspace 树：tsconfig paths 已经选定唯一副本，路由只会为每一次内部 import 增加一跳解析，而不改变答案。

该规则以目录形态而非包的来源为判据，因为 resolver 没有可靠的来源信号：已发布依赖与 workspace 包同为 installation 作用域条目。区别在于前者被解包进 `node_modules` 目录——而这恰好也是它自身查询可能到达一份该安装并未运行的副本的条件。

该规则只在安装同时具备两种形态时生效。若安装的每个包都位于 `node_modules` 之下——打包的单可执行文件、产品的 npm 安装——则整体排除：那里两种查询本就到达同一副本，路由只会增加工作量。链接进 `node_modules` 的 workspace 包按链接目标而非链接路径判定，因此源码 checkout 仍被判为混合形态。

这条排除是必需的，而非优化。若对打包运行时应用该规则，每个 harness 包的祖先位置都会被路由，而每个位置都会探测物理候选。单可执行文件的文件系统在这些探测上抛出 `ENOENT` 而不是报告“不存在”，于是 91 个插件导入失败、运行时拒绝启动（`scripts/smoke-python-runtime.py --scenario all`：在未设门限的构建上复现，加上门限后转为通过）。

## 备选方案

**源码启动挂载 in-box 的 `tool-fs-search` 行，构建启动保留原生行。** 这不需要改动 resolver，也能让 compat 泳道通过；但两个包给出的模型可见输出并不相同：in-box 行会对无法调用这些工具的 scope 抑制其 `glob` 与 `grep` 说明，而已发布的原生包仍然输出。录制会话经由源码启动重放，于是它们证明的将是替代组合，而发行版交付的是另一套。

**保留第二份副本。** 今天工具调用仍然可用，因为两份副本都通过 context 到达同一个服务实例。真正破裂的是标识：在有人跨边界比较 symbol 或类之前它都不可见，而那正是该守护测试存在的原因；组合本身也无法告诉读者某个模块到达的是哪一份副本。

**发布原生包时内联其 harness peer。** 这会移除解析到 `lib/` 的那条链接，代价是把这些 peer 复制进已发布产物，等于把同样的双实例问题搬进包内，并对每个使用方永久固化。

## 影响

`packages/boot/app-boot/tests/profile-resolution.spec.ts` 覆盖两侧：持有所声明 peer 私有副本的已安装包，在 ESM 与 CommonJS 下都解析到安装副本；持有同样私有副本的第一方目录则保留该副本。源码启动的 compat 泳道在挂载原生搜索插件的情况下通过，因此录制会话继续证明产品实际交付的组合，而不是替代组合。

本 fork 先于上游携带该改动。上游的 linked peer 解析（[2026-09-19 查询顺序](2026-09-19-profile-resolution-lookup-order.zh.md)）覆盖安装进 profile 的插件；bundle 依赖是它未触及的情形。
