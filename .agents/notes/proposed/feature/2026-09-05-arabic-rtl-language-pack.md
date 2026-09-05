# Agent Note: Arabic language pack and zone-scoped right-to-left text

Status: proposed

English | [中文](2026-09-05-arabic-rtl-language-pack.zh.md)

## Problem

The web GUI ships `zh` and `en`, and [`dsh-client-locale`](../../../../packages/client/locale/README.md) already lets an external client plugin add a language through `addLanguage` plus per-namespace `register(ns, locale, dict)`. That seam is exercised only by test fixtures; no real language pack exists, and the locale README names bidirectional layout as outside the registry. Arabic needs about 580 copy keys across 21 namespaces and right-to-left reading order for its text, while the application frame must keep its current placement: the sidebar stays on the left, panels and toolbars keep their order, and only the text inside content zones aligns to the right. The client cannot express that today: nothing carries a direction, no component marks a zone, package stylesheets carry 388 physical inline-axis declarations across 85 files against 10 logical ones, and 15 TSX files set physical inline styles, so a zone whose direction flips would misplace its own padding, margins, and radii. No branch, commit, PR, or Agent Note has started this work.

## Proposal

Ship Arabic as one in-tree client plugin package, `@deepseek-ai/dsh-client-locale-ar`, on top of a zone-scoped direction mechanism that every future right-to-left language reuses. The pack is TypeScript, ESM, and a dynamic `dsh.client` web row like every other client package; it registers the language, one dictionary per namespace, and nothing else. It mounts in the `web-app` bundle roster so Arabic is selectable by default; the `dsh plugin --profile web add` path stays available for out-of-tree packs.

### Direction is a language fact applied per zone

`LanguageRegistration` and `LocaleDefinition` gain `direction?: 'ltr' | 'rtl'`, defaulting to `ltr`; the built-in definitions stay implicit. The locale plugin's existing document synchronization writes `html[lang]` and a `data-dsh-text-direction` attribute on the root on every snapshot; it never writes `html[dir]`, so the document, the grid, and every chrome element keep left-to-right layout. `ui-theme` owns the only direction selector: one global rule gives elements marked `data-dsh-text-zone` under `:root[data-dsh-text-direction=rtl]` `direction: rtl`, `unicode-bidi: isolate`, and `text-align: start`, matching the rule in [web styling](../../../../docs/web-styling.md) that theme selectors stay out of feature CSS. Zone owners add the static marker to their roots: the conversation transcript, the composer, the settings panel content, and modal, toast, and tooltip bodies. Everything outside a marked zone (the app frame, sidebar column, headers, toolbars, icon buttons, menus, and popover placement) is untouched, so icon mirroring, arrow-key remapping, and anchored-position changes are out of scope. The locale README limitation on bidirectional layout is revised in the same change.

### Logical layout inside zones, gated

Stylesheets of components that render inside a marked zone migrate mechanically from physical inline-axis properties to logical ones: `margin-left` to `margin-inline-start`, `left` to `inset-inline-start`, `text-align: left` to `start`, and corner radii to `border-start-start-radius` and siblings. Chrome stylesheets outside zones keep their physical properties. A stylesheet spec in `ui-theme/tests`, built on the existing [stylesheet scanner](../../../../packages/client/ui-theme/tests/stylesheet-scan.ts) like the corner-shape and elevation specs, names the zone packages (ui-conversation, ui-chat, ui-tool, the ui-primitives markdown and block sheets, the settings packages, and the modal, toast, and tooltip primitives) and rejects physical inline-axis declarations in them outside a justified allowlist, so the migration cannot regress. Logical properties render identically left-to-right, so the current `en-US` replay goldens are the regression proof for this step.

### Text primitives

Code, terminal, diff, JSON tree, read, and path or URL chrome render with `dir="ltr"` even inside a zone: source text, commands, and identifiers keep column order in every language. User and model authored text, session titles, and the composer textarea take `dir="auto"` with `unicode-bidi: plaintext`, so mixed Arabic and English content follows the browser's first-strong heuristic rather than the zone direction. Markdown lists, blockquotes, and tables inside a zone inherit the zone direction through logical properties.

### The Arabic pack

The package holds one dictionary file per namespace under `src/locales/`, each declared `satisfies Record<XxxKey, string>` with the key union imported type-only from the owning package's `./src/*` export. A key added to `zh` without an Arabic counterpart then fails the pack's typecheck, which is a stronger guarantee than a runtime parity sweep. The plugin body registers `addLanguage({ id: 'ar', label: 'العربية', fallback: 'en', direction: 'rtl' })` and every namespace as owned effects, so an unresolved key shows English, never Chinese. A glossary file fixes product terms (session, workspace, tool, plugin, agent, model, approval, plan) before translation begins, and a native reviewer signs off on the dictionaries. Templates keep Western digits and count-neutral phrasing around `{count}`, `{n}`, and `{total}`, because the runtime interpolates without plural categories. System Arabic families are appended to `--dsw-font-family`; no web font ships.

### Delivery order

1. Core readiness: `direction` on the definitions, the root text-direction attribute, the ui-theme zone rule and its spec, the modal, toast, and tooltip zone markers, and the revised locale README. Marking those three primitives first proves the mechanism end to end, because their sheets already carry no physical inline-axis declarations.
2. The remaining zones, one package at a time: the logical-property migration of that package's sheets, its zone markers, and its addition to the stylesheet gate's zone list. Each part is pixel-identical left-to-right.
3. Text primitives: forced `ltr` blocks and `auto` authored text.
4. The pack, its glossary and specs, an Arabic Playwright scenario beside the existing [settings language switch](../../../../apps/web/tests/settings-chrome.e2e.ts), the `web-app` roster row, and the GIF the [recording skill](../../../../.agents/skills/record-browser-gif/SKILL.md) requires.

## Alternatives considered

**Mirror the whole document with `html[dir=rtl]`.** Rejected: the product requirement keeps the frame stable across languages, so the sidebar, panels, and toolbars must not move. Full mirroring would also touch all 85 physical stylesheets, require icon mirroring and arrow-key remapping, and change every chrome screenshot; zone scoping confines the migration to text-bearing packages.

**Let the pack set the direction attribute itself from `locale/change`.** Rejected: direction is a property of the language, not plugin behavior; every right-to-left pack would repeat the effect and could disagree with the registry on the active language.

**Set `dir` on zone roots from a value threaded through props.** Rejected: the direction would have to reach every zone owner through stores or inject faces for a fact that CSS resolves from one root attribute; the theme-owned rule keeps components static and direction-agnostic.

**Generate a `[dir=rtl]` override stylesheet with a PostCSS plugin.** Rejected: it doubles the shipped CSS, adds a build dependency, and keeps physical properties as the authored form, so every new component regresses until the generator catches it. Logical properties cost nothing at runtime and are enforced at source.

**Add plural categories to the runtime now.** Deferred: Arabic has six categories, but the runtime interpolates flat templates, and rewording the roughly 140 count-bearing keys to count-neutral phrasing keeps the first release inside the existing lookup. `Intl.PluralRules` can extend the runtime later without changing dictionary files.

**Ship the pack out of tree only.** Rejected: a pack that is not mounted cannot be selected, and the profile install path is heavier than a bundle row for a language the product supports.

## Acceptance criteria

- Selecting Arabic in Settings renders `html[lang=ar]` with the root text-direction attribute set to `rtl`, the sidebar still on the left, transcript and composer text aligned to the right in Arabic, Arabic copy in every namespace, and a code block that stays left-to-right; switching back restores left-to-right text without a reload.
- The stylesheet gate rejects a physical inline-axis declaration added to a zone package stylesheet outside its allowlist, and the pack's typecheck fails when a `zh` key lacks an Arabic entry.
- Existing `en-US` replay goldens and browser e2e scenarios pass unchanged after the logical-property migration.
- An Arabic replay scenario and a recorded GIF from the real server accompany the pack PR, per [testing policy](../../../../docs/testing.md).
- Every settings page and tool card has been reviewed in Arabic for clipped diacritics, misaligned text, and untranslated product chrome.

## Risks

- A component that renders inside a zone but lives in a package outside the gate's list keeps physical properties and misaligns in Arabic; the list is extended when the review pass finds one.
- Copy captured at registration time outside the slot render path keeps the language it was registered under; the pack inherits that locale limitation.
- The dictionary-parity gate discovers `zh`/`en` exports; it must tolerate an `ar` export and is extended to include the pack rather than skipped.
- The pack adds roughly 20 to 25 KB of dictionaries and 21 revision bumps at boot; if profiling shows subscriber churn, the runtime gains a batched registration, otherwise nothing changes.
- Count-neutral phrasing reads acceptably but not natively for every plural; the limitation is documented in the pack README until plural rules land.
