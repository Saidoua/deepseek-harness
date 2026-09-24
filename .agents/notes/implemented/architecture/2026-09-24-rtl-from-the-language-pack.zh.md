# Agent Note：阿拉伯语语言包自行持有阅读顺序，并为已发布的标记设置样式

Status: implemented

[English](2026-09-24-rtl-from-the-language-pack.md) | 中文

## 问题

[阿拉伯语语言包决策](../feature/2026-09-05-arabic-rtl-language-pack.zh.md)把阅读顺序放进了共享包：语言定义上的 `direction` 字段与由 locale 插件写入的根属性，`ui-theme` 中的样式表及其规范，以及渲染文本的组件内部的标记。本仓库是一个每隔几天就合并上游的 fork，而这些改动分布在 105 个上游客户端文件中。以 2026-09-24 的合并为准：其中 85 个仅为从右到左标记（50 个 `dir="auto"`、53 个 `data-dsh-text-auto`、27 个 `dir="ltr"`、14 个 `data-dsh-text-zone`），另有 21 个 CSS 模块中的 46 处物理属性到逻辑属性的改写。上游持续重做的恰恰是这些组件，因此每次合并都要手工重新解决同样的冲突。

这部分改动大多不起作用。该设计从不设置 `direction`，所以逻辑属性与其物理原型的解析结果处处相同，只有位于计算为从右到左的 `dir="auto"` 元素之下时例外；被改写的 21 个模块中有 18 个从不位于这样的元素之下。带标记的版本还存在两处缺陷：`unicode-bidi: plaintext` 只作用于 Markdown 根元素，而该属性不继承，所以以英文开头的回复在后续阿拉伯语段落中仍保持从左到右；读者自己撰写的消息则完全没有标记。

## 决策

语言包自行持有阅读顺序，并为已发布组件本就渲染的标记设置样式，而不是为其添加标记。

[`text-direction.ts`](../../../../packages/client/locale-ar/src/client/text-direction.ts) 在 locale 服务报告阿拉伯语生效时于根元素写入 `data-dsh-text-direction="rtl"`，在切换到其他语言或卸载时将其移除，并把 [`text-direction.css`](../../../../packages/client/locale-ar/src/client/text-direction.css) 挂载为自身拥有的 effect。此前对此方案的反对理由——每个从右到左语言包都要重复这一 effect，且可能与注册表对当前语言的判断不一致——已不再成立：语言包从注册表自身的快照与订阅读取当前语言，而不是自行追踪；并且它只为自己的语言写入该属性，因此不会覆盖另一个语言包。

样式表保留原有规则——只移动 `text-align`，从不设置 `direction`——且每个选择器都指向组件当前渲染的内容：`data-*` 属性（`data-chat-flow`、`data-approval-key`、`data-trigger-menu`、`data-diff`、`data-terminal` 等）、ARIA 角色（`menu`、`dialog`、`tooltip`、`alert`）、全局类名 `md-code-block`，或 CSS 模块的本地名。模块类名由客户端打包器拼写为 `<hash>_<local>`，在测试中由 Vite 拼写为 `_<local>_<hash>`，因此每个类名都以完整词元同时匹配两种形式（`[class$='_markdown']`、`[class*='_markdown ']`、`[class*='_markdown_']`）；第一次尝试只匹配了 Vite 形式，结果所有生产环境中的区域都悄无声息地失去了对齐。作者撰写的文本在每个承载段落的块上获得 `unicode-bidi: plaintext` 与 `text-align: start`，从而修复上述两处缺陷。全部 105 个上游客户端文件恢复为上游内容，共享包中的改动（语言定义上的 `direction`、locale 插件写入的根属性、`ui-theme` 的样式表、规范与 README 段落）一并移除。

## 备选方案

**保留标记。** 就其覆盖范围而言是正确的，但上游每改动一个组件就要手工解决一次冲突，而且标记这种形态让其中的两处缺陷很容易被忽略。

**把标记提交到上游。** 这是最干净的终态，对作者文本加 `dir="auto"` 仍然值得提交，因为它对任何从右到左的读者都有帮助。但在合并之前毫无作用，而上游的评审节奏不受本 fork 控制。

**由语言包在运行时标记元素。** 用 mutation observer 添加 `dir="auto"` 可以覆盖没有稳定挂钩的元素，但它在每次渲染时运行，会与流式内容产生竞争，而且仍然依赖选择器来找到目标——与样式表的耦合相同，还额外增加了运行时开销。

## 测试

[`pack.client.spec.ts`](../../../../packages/client/locale-ar/tests/pack.client.spec.ts) 固定：该属性只在阿拉伯语生效时出现，样式表与属性随插件一同移除；[`text-direction-sheet.client.spec.ts`](../../../../packages/client/locale-ar/tests/text-direction-sheet.client.spec.ts) 从磁盘读取样式表，拒绝 `direction` 以及任何未以该属性为前提的右对齐。每项检查都在故意破坏的样式表或模块上验证过会失败。在基于已发布包的真实浏览器中，[`text-direction-zones.e2e.ts`](../../../../apps/web/tests/text-direction-zones.e2e.ts) 固定了一个生产命名的区域，以及一条英文段落与阿拉伯语段落各居其侧的回复、一条用户消息和一个保持靠左的代码块；从页面移除语言包的样式表后，同一用例会失败。[`arabic-language-pack.e2e.ts`](../../../../apps/web/tests/arabic-language-pack.e2e.ts) 通过设置界面驱动语言切换。

## 影响

- fork 不再为从右到左支持修改任何上游客户端文件；上游合并不会再在这方面产生冲突。
- 耦合从合并时转移到渲染时：组件若重命名被选中的属性或模块类，就会在没有构建或类型错误的情况下不再获得阿拉伯语对齐。上述端到端测试是其所固定界面的报警线，[语言包 README](../../../../packages/client/locale-ar/README.zh.md#known-limitations-and-deferred-work) 记录了这一限制。
- 作者撰写的文本在任何界面语言下都跟随其自身文字，因为混合书写的回复并非阿拉伯语所特有。
- 计划模式标签不再对齐；它的宽度按标签内容确定，所以它原先携带的对齐没有产生任何可见变化。
