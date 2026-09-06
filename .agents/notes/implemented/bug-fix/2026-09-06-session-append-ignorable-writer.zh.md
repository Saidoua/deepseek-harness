# Agent Note: Session.append 写入 ignorable 标记

Status: implemented

[English](2026-09-06-session-append-ignorable-writer.md) | 中文

## Problem

会话事件信封带有 `ignorable?: true`，使读取方遇到无法识别的事件类型时可以跳过该事件，而不是拒绝整条日志；[外部插件保留决策](../architecture/2026-08-30-retain-ignorable-external-session-events.zh.md)为一个依赖该字段的仓库外插件保留了它。除写入方以外，每一种表示都保留了这个字段——seed 校验、JSONL、API 传输、生成目录和测试夹具。

`Session.append` 用一个固定字面量构造信封，其中没有 `ignorable`；它唯一的可选参数是 `SurfaceIntent`，而编译器在非 surface 类型上会拒绝该参数。因此，一个通过声明合并引入自有事件类型的插件可以成功追加事件并看到它被接受，但在下一次冷加载时 `validateStoredEvents` 会拒绝整个会话：该事件类型不在生成的 `KNOWN_SESSION_EVENT_TYPES` 中，且没有任何东西把它标记为可跳过。代价落在整个会话上而非那一个事件上，harness 拒绝的是它自己曾经接受过的日志。

## Decision

`Session.append` 在 `SurfaceEventType` 之外的每一种事件类型上接受 `LogIntent`，其 `ignorable: true` 设置信封字段。未设置时该标记不写入信封，因此未标记事件与此前写入方产出的字节完全一致，并继续保持读取时必需。

`SurfaceEventType` 事件不可被标记。它产出派生的模型历史，读取方跳过它会改变该标记本应保持不变的重建结果；这些类型继续只接受 `SurfaceIntent`。两种 intent 在调用点互斥，这正是「已标记」与「加入 surface」无法同时成立的原因。

校验保持原位。`append` 是同进程内的类型化边界，因此该选项不带运行时检查；seed 校验与持久化接缝继续负责把值固定为 `true` 的持久边界检查。

## Testing

`packages/core/session/tests/session.spec.ts` 覆盖已标记与未标记信封、持久快照，以及编译器在另一事件类别上拒绝对应 intent。`packages/session/session-persistence/tests/storage-contract.spec.ts` 闭合了缺陷所在的「写入到读取」回路：带标记追加的插件类型事件通过 `validateStoredEvents`，同一事件不带标记则使日志被拒。

## Alternatives considered

**为树外事件类型提供注册面。** 上游多次提出，是同一问题的更大答案：插件注册自己的词汇表，使其类型成为已知而非可跳过。它需要决定归属、版本化，以及注册插件被卸载后如何处理——这些都不是本缺陷所必需的，而在它们悬而未决期间会话会持续损坏。标记已经存在，读取侧也已遵守，缺的只有写入方。

**在 surface 事件上也接受 `ignorable`。** 信封允许该字段出现在任何类型上，全面放开可以少一个条件分支。已否决：那会允许调用方标记一个丢失后会静默改写派生历史的事件，而读取侧的守卫对已知类型从不查阅该标记，因此这项许可毫无收益且具有误导性。

**改为在持久化接缝处标记。** 后端可以为自己不认识的类型补上标记。已否决：只有写入方知道丢失该事件是否安全，而这正是该字段所记录的判断。

## Consequences

仓库外插件可以写入自己的信息性会话事件而不必让用户付出整个会话的代价，这正是保留决策承诺却无法兑现的部分。[会话日志版本机制](../architecture/2026-08-10-session-log-version-mechanism.zh.md)继续拥有默认必需规则：缺省仍然意味着必需，本次改动只是给写入方一条说出相反意思的途径。

第一方事件仍然不带标记。第一方类型按构造就在 `KNOWN_SESSION_EVENT_TYPES` 中，标记永远不会被查阅；该选项存在是为了本次构建无法知晓的词汇表。
