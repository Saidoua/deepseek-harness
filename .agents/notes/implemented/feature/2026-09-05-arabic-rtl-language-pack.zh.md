# Agent Note: 阿拉伯语语言包与按区域的从右到左文本

Status: implemented

[English](2026-09-05-arabic-rtl-language-pack.md) | 中文

## 问题

Web GUI 内置 `zh` 与 `en`，[`dsh-client-locale`](../../../../packages/client/locale/README.zh.md) 已允许外部客户端插件通过 `addLanguage` 加上按命名空间的 `register(ns, locale, dict)` 添加语言。该接缝仅由测试 fixture 使用；不存在真实的语言包，且 locale README 明确把双向布局列为注册表之外的事项。阿拉伯语需要 21 个命名空间中约 580 个文案键以及文本的从右到左阅读顺序，同时应用框架必须保持现有位置：侧边栏仍在左侧，面板与工具栏保持顺序，只有内容区域内的文本靠右对齐。客户端当时无法表达这一点：没有任何代码携带方向，没有组件标记区域，各包样式表在 85 个文件中含有 388 条物理行内轴声明而逻辑声明仅 10 条，15 个 TSX 文件设置物理行内样式，因此方向翻转的区域会错置自身的内边距、外边距与圆角。两条社区讨论请求从右到左渲染：[讨论 4009](https://github.com/deepseek-ai/deepseek-harness/discussions/4009) 以 ZIP 与 Windows 批处理安装脚本分发一份 `dir="auto"` 补丁，并请求维护者采纳；[讨论 696](https://github.com/deepseek-ai/deepseek-harness/discussions/696) 报告以英文单词开头的句子渲染后不可读，并提议用主导方向检测取代浏览器的首个强方向字符规则。两者都不涉及阿拉伯语文案，且上游没有任何分支、提交或 PR 实现其中任何一项。

## 决定

阿拉伯语以一个树内客户端插件包 [`@deepseek-ai/dsh-client-locale-ar`](../../../../packages/client/locale-ar/README.zh.md) 交付，其下是每种未来从右到左语言都复用的按区域方向机制。该包是 TypeScript、ESM，并与其他客户端包一样是动态 `dsh.client` web 行；它注册语言、每个命名空间一份词典，不做其他事。它挂载在 `web-app` bundle 名册中，使阿拉伯语默认可选；`dsh plugin --profile web add` 路径仍供树外语言包使用。

### 方向是语言的属性，按区域应用

`LanguageRegistration` 与 `LocaleDefinition` 带有 `direction?: 'ltr' | 'rtl'`，默认 `ltr`；内置定义保持隐式。locale 插件的文档同步在每次快照时写入 `html[lang]` 与根元素上的 `data-dsh-text-direction` 属性，绝不写入 `html[dir]`，因此文档、网格与所有外框元素保持从左到右布局；卸载时收回方向属性，而 `html[lang]` 继续描述最后生效的语言。[`ui-theme`](../../../../packages/client/ui-theme/README.zh.md) 拥有唯一的对齐规则：`:root[data-dsh-text-direction='rtl']` 之下标记了 `data-dsh-text-zone` 的元素取 `text-align: right`，符合 [Web 样式](../../../../docs/web-styling.zh.md)中主题选择器不进入功能 CSS 的规则。该样式表从不设置 `direction` 属性，因为 `direction` 会反转 flex 与 grid 子元素的次序，从而移动设置导航、行内控件以及标签旁的每一个图标。双语读者在任何语言下都见到同一套布局，认出他们已经熟悉的设计；只有文本移向阅读起始边。分布在 11 个包中的 18 个标记覆盖会话记录、输入框、设置面板、侧边栏列表，计划、目标、审批、命令与提问界面，以及模态框、toast、tooltip 与菜单的正文。由于只有对齐发生变化，图标镜像、方向键重映射与锚定定位改动都不在范围内，也没有任何元素发生移动。

### 区域内的逻辑布局，并设门禁

在标记区域内渲染的组件，其样式表使用逻辑行内轴属性而非物理属性：以 `margin-inline-start` 取代 `margin-left`，以 `inset-inline-start` 取代 `left`，以 `text-align: start` 取代 `left`，圆角使用 `border-start-start-radius` 及其同族。区域之外的外框样式表保留物理属性。[`text-direction-styles.client.spec.ts`](../../../../packages/client/ui-theme/tests/text-direction-styles.client.spec.ts) 基于既有[样式表扫描器](../../../../packages/client/ui-theme/tests/stylesheet-scan.ts)、与 corner-shape 和 elevation 规范同类，将区域规则钉死为恰好 `text-align: right`，在所有包样式表中拒绝 `direction` 属性，并拒绝区域包中豁免清单之外的物理行内轴声明。逻辑属性在从左到右下渲染结果完全一致，因此 `en-US` 回放基准就是该迁移的回归证据。

### 文本基础组件

代码、终端、diff、JSON 树与读取块即使在区域内也以 `dir="ltr"` 渲染：源码文本、命令与标识符在任何语言下都保持列序。撰写文本——Markdown 文档根、输入框、触发菜单条目与目标描述——在 `data-dsh-text-auto` 标记下采用 `dir="auto"` 加 `unicode-bidi: plaintext`，使每个段落按自身的首个强方向字符解析，因此阿拉伯语界面中的英文回复仍保持从左到右。区域内的 Markdown 列表、引用与表格通过逻辑属性继承区域对齐。

### 阿拉伯语语言包

该包在 `src/client/locales/` 下有 34 份词典文件、约 1060 个键，各自声明 `satisfies Record<XxxKey, string>`，键联合类型从所属包的 `./src/*` 导出以仅类型方式导入。向 `zh` 添加键而缺少阿拉伯语对应项会使该包类型检查失败，这比运行时的一致性扫描保证更强。插件体以自有效果注册 `addLanguage({ id: 'ar', label: 'العربية', fallback: 'en', direction: 'rtl' })` 与每个命名空间，因此未解析的键显示英语，绝不显示中文。一份术语表文件固定产品术语（会话、工作区、工具、插件、代理、模型、审批、计划）。模板围绕 `{count}`、`{n}` 与 `{total}` 保持西方数字与不依赖数量的措辞，因为运行时的插值不带复数类别。系统阿拉伯语字体族追加到 `--dsw-font-family`；不随附 Web 字体。

## 考虑过的替代方案

**用 `html[dir=rtl]` 镜像整个文档。** 否决：产品要求框架在各语言间保持稳定，侧边栏、面板与工具栏不得移动。完整镜像还会触及全部 85 个物理样式表文件，需要图标镜像与方向键重映射，并改变每一张外框截图；按区域限定把迁移局限在承载文本的包内。

**让语言包自行从 `locale/change` 设置方向属性。** 否决：方向是语言的属性而非插件行为；每个从右到左语言包都要重复该效果，并可能与注册表对当前语言的判断不一致。

**通过 props 传递的值在区域根上设置 `dir`。** 否决：对于 CSS 可从一个根属性解析的事实，方向却必须经由 store 或 inject 面到达每个区域所有者；主题拥有的规则让组件保持静态且与方向无关。

**用 PostCSS 插件生成 `[dir=rtl]` 覆盖样式表。** 否决：它使交付的 CSS 翻倍，增加构建依赖，且物理属性仍是撰写形式，每个新组件在生成器捕获之前都会倒退。逻辑属性没有运行时开销，并在源码层面强制执行。

**现在就给运行时加入复数类别。** 推迟：阿拉伯语有六种类别，但运行时对扁平模板插值，把约 140 个带数量的键改写为不依赖数量的措辞可让首个版本留在既有查找之内。`Intl.PluralRules` 之后可扩展运行时而无需改动词典文件。

**仅以树外方式交付语言包。** 否决：未挂载的语言包无法被选择，而对于产品支持的语言，profile 安装路径比一条 bundle 行更重。

## 测试

该包的单元规范覆盖注册与回退；[`text-direction-styles.client.spec.ts`](../../../../packages/client/ui-theme/tests/text-direction-styles.client.spec.ts) 钉住对齐规则、缺席的 `direction` 属性与逻辑属性迁移；[`arabic-language-pack.e2e.ts`](../../../../apps/web/tests/arabic-language-pack.e2e.ts) 在浏览器中驱动语言切换，紧邻既有的[设置语言切换](../../../../apps/web/tests/settings-chrome.e2e.ts)。既有 `en-US` 回放基准与浏览器场景原样通过，这正是该迁移在从左到右下未移动任何元素的证明。

## 后果

- 在设置中选择阿拉伯语后渲染 `html[lang=ar]` 且根元素文本方向属性为 `rtl`、侧边栏仍在左侧、会话记录与输入框文本靠右对齐、每个命名空间均为阿拉伯语文案、代码块保持从左到右；切回后无需刷新即恢复从左到右文本。
- 未来每种从右到左语言只需声明 `direction: 'rtl'` 即可复用该机制；语言包只贡献翻译与阅读顺序，不做其他事。
- 撰写文本按其首个强方向字符解析方向，而 [讨论 696](https://github.com/deepseek-ai/deepseek-harness/discussions/696) 报告该规则会让以英文单词开头的句子不可读。改为统计整串的强方向字符将按段落判定方向，代价是段落在输入过程中可能翻转；该检测位于 `data-dsh-text-auto` 标记之后，因此替换只改动一个辅助函数，不触及任何组件。
- 在区域内渲染但所属包不在门禁清单中的组件会保留物理属性并在阿拉伯语下错位；审查发现一例即扩展清单。
- 在 slot 渲染路径之外于注册时捕获的文案保留注册时的语言；语言包继承这一 locale 限制。
- 不依赖数量的措辞对每种复数都可接受但并非全部地道；在 `Intl.PluralRules` 扩展运行时之前，该限制记录于语言包 README。
- 语言包在启动时增加约 20 到 25 KB 词典，且每个命名空间一次修订号递增。
- 这项工作以 [讨论 5804](https://github.com/deepseek-ai/deepseek-harness/discussions/5804) 提交上游，回应 [讨论 4009](https://github.com/deepseek-ai/deepseek-harness/discussions/4009) 与 [讨论 696](https://github.com/deepseek-ai/deepseek-harness/discussions/696)；尚未合入上游，也未发布到 npm。
