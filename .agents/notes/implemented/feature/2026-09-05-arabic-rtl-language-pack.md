# Agent Note: Arabic language pack and zone-scoped right-to-left text

Status: implemented

English | [中文](2026-09-05-arabic-rtl-language-pack.zh.md)

## Problem

The web GUI ships `zh` and `en`, and [`dsh-client-locale`](../../../../packages/client/locale/README.md) already lets an external client plugin add a language through `addLanguage` plus per-namespace `register(ns, locale, dict)`. That seam is exercised only by test fixtures; no real language pack exists, and the locale README names bidirectional layout as outside the registry. Arabic needs about 580 copy keys across 21 namespaces and right-to-left reading order for its text, while the application frame must keep its current placement: the sidebar stays on the left, panels and toolbars keep their order, and only the text inside content zones aligns to the right. The client cannot express that today: nothing carries a direction, no component marks a zone, package stylesheets carry 388 physical inline-axis declarations across 85 files against 10 logical ones, and 15 TSX files set physical inline styles, so a zone whose direction flips would misplace its own padding, margins, and radii. Two community discussions ask for right-to-left rendering: [discussion 4009](https://github.com/deepseek-ai/deepseek-harness/discussions/4009) distributes a `dir="auto"` patch as a ZIP and a Windows batch installer and asks the maintainers to adopt it, and [discussion 696](https://github.com/deepseek-ai/deepseek-harness/discussions/696) reports that a sentence opening with an English word renders unreadably and proposes a dominant-direction detector in place of the browser first-strong rule. Neither asks for Arabic copy, and no upstream branch, commit, or pull request implements either.

## Decision

Arabic ships as one in-tree client plugin package, [`@deepseek-ai/dsh-client-locale-ar`](../../../../packages/client/locale-ar/README.md), on top of a zone-scoped direction mechanism every future right-to-left language reuses. The pack is TypeScript, ESM, and a dynamic `dsh.client` web row like every other client package; it registers the language, one dictionary per namespace, and nothing else. It mounts in the `web-app` bundle roster, so Arabic is selectable by default; the `dsh plugin --profile web add` path stays available for out-of-tree packs.

### Direction is a language fact applied per zone

`LanguageRegistration` and `LocaleDefinition` carry `direction?: 'ltr' | 'rtl'`, defaulting to `ltr`; the built-in definitions stay implicit. The locale plugin's document synchronization writes `html[lang]` and a `data-dsh-text-direction` attribute on the root on every snapshot, and never `html[dir]`, so the document, the grid, and every chrome element keep left-to-right layout; unloading retracts the direction attribute while `html[lang]` keeps describing the last active language. [`ui-theme`](../../../../packages/client/ui-theme/README.md) owns the only alignment rule: elements marked `data-dsh-text-zone` under `:root[data-dsh-text-direction='rtl']` take `text-align: right`, matching the rule in [web styling](../../../../docs/web-styling.md) that theme selectors stay out of feature CSS. The sheet never sets the `direction` property, because `direction` reverses flex and grid children and would move the settings navigation, the row controls, and every icon beside a label. A bilingual reader meets one layout in every language and recognizes the design they already know; only the text moves to the reading edge. Eighteen markers across eleven packages cover the transcript, the composer, the settings panel, the sidebar lists, the plan, goal, approval, command, and question surfaces, and the modal, toast, tooltip, and menu bodies. Because only alignment changes, icon mirroring, arrow-key remapping, and anchored-position changes are all out of scope, and no element moves.

### Logical layout inside zones, gated

Stylesheets of components that render inside a marked zone use logical inline-axis properties rather than physical ones: `margin-inline-start` over `margin-left`, `inset-inline-start` over `left`, `text-align: start` over `left`, and `border-start-start-radius` and siblings for corners. Chrome stylesheets outside zones keep their physical properties. [`text-direction-styles.client.spec.ts`](../../../../packages/client/ui-theme/tests/text-direction-styles.client.spec.ts), built on the existing [stylesheet scanner](../../../../packages/client/ui-theme/tests/stylesheet-scan.ts) like the corner-shape and elevation specs, pins the zone rule to exactly `text-align: right`, rejects the `direction` property in every package stylesheet, and rejects a physical inline-axis declaration in a zone package outside its allowlist. Logical properties render identically left-to-right, so the `en-US` replay goldens are the regression proof for the migration.

### Text primitives

Code, terminal, diff, JSON tree, and read blocks render with `dir="ltr"` even inside a zone: source text, commands, and identifiers keep column order in every language. Authored text — the markdown document root, the composer, trigger-menu entries, and the goal objective — carries `dir="auto"` with `unicode-bidi: plaintext` under a `data-dsh-text-auto` marker, so each paragraph resolves from its own first strong character and an English reply inside an Arabic interface stays left-to-right. Markdown lists, blockquotes, and tables inside a zone inherit the zone alignment through logical properties.

### The Arabic pack

The package holds 34 dictionary files under `src/client/locales/`, about 1060 keys, each declared `satisfies Record<XxxKey, string>` with the key union imported type-only from the owning package's `./src/*` export. A key added to `zh` without an Arabic counterpart fails the pack's typecheck, which is a stronger guarantee than a runtime parity sweep. The plugin body registers `addLanguage({ id: 'ar', label: 'العربية', fallback: 'en', direction: 'rtl' })` and every namespace as owned effects, so an unresolved key shows English, never Chinese. A glossary file fixes product terms (session, workspace, tool, plugin, agent, model, approval, plan). Templates keep Western digits and count-neutral phrasing around `{count}`, `{n}`, and `{total}`, because the runtime interpolates without plural categories. System Arabic families are appended to `--dsw-font-family`; no web font ships.

## Alternatives considered

**Mirror the whole document with `html[dir=rtl]`.** Rejected: the product requirement keeps the frame stable across languages, so the sidebar, panels, and toolbars must not move. Full mirroring would also touch all 85 physical stylesheets, require icon mirroring and arrow-key remapping, and change every chrome screenshot; zone scoping confines the migration to text-bearing packages.

**Let the pack set the direction attribute itself from `locale/change`.** Rejected: direction is a property of the language, not plugin behavior; every right-to-left pack would repeat the effect and could disagree with the registry on the active language.

**Set `dir` on zone roots from a value threaded through props.** Rejected: the direction would have to reach every zone owner through stores or inject faces for a fact that CSS resolves from one root attribute; the theme-owned rule keeps components static and direction-agnostic.

**Generate a `[dir=rtl]` override stylesheet with a PostCSS plugin.** Rejected: it doubles the shipped CSS, adds a build dependency, and keeps physical properties as the authored form, so every new component regresses until the generator catches it. Logical properties cost nothing at runtime and are enforced at source.

**Add plural categories to the runtime now.** Deferred: Arabic has six categories, but the runtime interpolates flat templates, and rewording the roughly 140 count-bearing keys to count-neutral phrasing keeps the first release inside the existing lookup. `Intl.PluralRules` can extend the runtime later without changing dictionary files.

**Ship the pack out of tree only.** Rejected: a pack that is not mounted cannot be selected, and the profile install path is heavier than a bundle row for a language the product supports.

## Testing

The pack's unit spec covers registration and fallback; [`text-direction-styles.client.spec.ts`](../../../../packages/client/ui-theme/tests/text-direction-styles.client.spec.ts) pins the alignment rule, the absent `direction` property, and the logical-property migration; [`arabic-language-pack.e2e.ts`](../../../../apps/web/tests/arabic-language-pack.e2e.ts) drives the language switch in a browser beside the existing [settings language switch](../../../../apps/web/tests/settings-chrome.e2e.ts). Existing `en-US` replay goldens and browser scenarios pass unchanged, which is what proves the migration moved nothing left-to-right.

## Consequences

- Selecting Arabic in Settings renders `html[lang=ar]` with the root text-direction attribute set to `rtl`, the sidebar still on the left, transcript and composer text aligned to the right, Arabic copy in every namespace, and code blocks that stay left-to-right; switching back restores left-to-right text without a reload.
- Every future right-to-left language reuses the mechanism by declaring `direction: 'rtl'`; a pack contributes translations and a reading order and nothing else.
- Authored text resolves its direction from its first strong character, the rule [discussion 696](https://github.com/deepseek-ai/deepseek-harness/discussions/696) reports as unreadable for a sentence that opens with an English word. Counting strong characters across the whole string would decide per paragraph instead, at the cost of flipping a paragraph while it is typed; the detector sits behind the `data-dsh-text-auto` marker, so the swap changes one helper and no component.
- A component that renders inside a zone but lives in a package outside the gate's list keeps physical properties and misaligns in Arabic; the list is extended when a review pass finds one.
- Copy captured at registration time outside the slot render path keeps the language it was registered under; the pack inherits that locale limitation.
- Count-neutral phrasing reads acceptably but not natively for every plural; the limitation is documented in the pack README until `Intl.PluralRules` extends the runtime.
- The pack adds roughly 20 to 25 KB of dictionaries and one revision bump per namespace at boot.
- The work is offered upstream as [discussion 5804](https://github.com/deepseek-ai/deepseek-harness/discussions/5804), which answers [discussion 4009](https://github.com/deepseek-ai/deepseek-harness/discussions/4009) and [discussion 696](https://github.com/deepseek-ai/deepseek-harness/discussions/696); it is not merged upstream and not published to npm.
