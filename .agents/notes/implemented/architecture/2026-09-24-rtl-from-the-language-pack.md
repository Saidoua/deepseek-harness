# Agent Note: The Arabic pack owns its reading order and styles shipped markup

Status: implemented

English | [中文](2026-09-24-rtl-from-the-language-pack.zh.md)

## Problem

The [Arabic pack decision](../feature/2026-09-05-arabic-rtl-language-pack.md) put the reading order into shared packages: a `direction` field on the locale definition and a root attribute written by the locale plugin, a stylesheet and its spec in `ui-theme`, and markers inside the components that render text. This repository is a fork that merges upstream every few days, and those edits lived in 105 upstream client files. Measured on the 2026-09-24 merge: 85 of them were right-to-left markup alone (50 `dir="auto"`, 53 `data-dsh-text-auto`, 27 `dir="ltr"`, 14 `data-dsh-text-zone`), plus 46 physical-to-logical property rewrites across 21 CSS modules. Upstream keeps reworking exactly these components, so every merge re-resolved the same conflicts by hand.

Most of that surface did no work. The design never sets `direction`, so a logical property resolves the same as its physical original everywhere except under a `dir="auto"` element that computes right-to-left; 18 of the 21 rewritten modules never sit under one. Two defects also sat in the marked version: `unicode-bidi: plaintext` was applied only to the Markdown root, and since the property does not inherit, a reply that opened in English stayed left-to-right in its later Arabic paragraphs; and the messages the reader writes carried no marker at all.

## Decision

The pack owns its reading order, and styles the markup the shipped components already render instead of marking it.

[`text-direction.ts`](../../../../packages/client/locale-ar/src/client/text-direction.ts) writes `data-dsh-text-direction="rtl"` on the root while the locale service reports Arabic active, removes it on any other language and on unload, and mounts [`text-direction.css`](../../../../packages/client/locale-ar/src/client/text-direction.css) as an owned effect. The earlier objection to this — every right-to-left pack repeats the effect, and could disagree with the registry about the active language — no longer holds: the pack reads the active language from the registry's own snapshot and subscription rather than tracking it, and it writes the attribute only for its own language, so a second pack cannot be overridden by it.

The sheet keeps the original rules — only `text-align` moves, `direction` is never set — and every selector names something the components render today: a `data-*` attribute (`data-chat-flow`, `data-approval-key`, `data-trigger-menu`, `data-diff`, `data-terminal`, …), an ARIA role (`menu`, `dialog`, `tooltip`, `alert`), the global `md-code-block` class, or a CSS-module local name. Module class names are spelled `<hash>_<local>` by the client bundler and `_<local>_<hash>` by Vite under test, so each is matched as a whole token in both forms (`[class$='_markdown']`, `[class*='_markdown ']`, `[class*='_markdown_']`); the first attempt matched only the Vite form and every production zone silently lost its alignment. Authored text gets `unicode-bidi: plaintext` with `text-align: start` on each block that holds a paragraph, which fixes both defects above. All 105 upstream client files return to upstream's content, and the shared-package edits (`direction` on the definition, the locale plugin's root attribute, the `ui-theme` sheet, spec, and README paragraph) are removed.

## Alternatives considered

**Keep the markers.** Correct as far as it went, but it cost a hand-resolved conflict in every component upstream touched, and it carried two defects that the markup's shape made easy to miss.

**Propose the markers upstream.** The cleanest end state, and still worth doing for `dir="auto"` on authored text, which helps any right-to-left reader. It does not help until merged, and upstream's review cadence is outside this fork's control.

**Mark elements at runtime from the pack.** A mutation observer adding `dir="auto"` would reach elements without a stable hook, but it runs on every render, races streaming content, and still depends on selectors to find its targets — the same coupling as the stylesheet, with a runtime cost added.

## Testing

[`pack.client.spec.ts`](../../../../packages/client/locale-ar/tests/pack.client.spec.ts) pins that the attribute appears only while Arabic is active and that the sheet and attribute leave with the plugin; [`text-direction-sheet.client.spec.ts`](../../../../packages/client/locale-ar/tests/text-direction-sheet.client.spec.ts) reads the sheet from disk and rejects `direction` and any right alignment not keyed on the attribute. Each check was shown to fail against a deliberately broken sheet or module. In a real browser over the shipped bundles, [`text-direction-zones.e2e.ts`](../../../../apps/web/tests/text-direction-zones.e2e.ts) pins a production-named zone, and a reply whose English and Arabic paragraphs each land on their own side, a user message, and a code block that stays left; the same case fails with the pack's sheet removed from the page. [`arabic-language-pack.e2e.ts`](../../../../apps/web/tests/arabic-language-pack.e2e.ts) drives the language switch through Settings.

## Consequences

- The fork edits no upstream client file for right-to-left support; an upstream merge no longer conflicts on it.
- The coupling moves from merge time to render time: a component that renames a selected attribute or module class stops receiving Arabic alignment without a build or type error. The end-to-end suite above is the tripwire for the surfaces it pins, and the [pack README](../../../../packages/client/locale-ar/README.md#known-limitations-and-deferred-work) records the limit.
- Authored text follows its own words in every interface language, since mixed-script replies are not specific to Arabic.
- The plan-mode chip is no longer aligned; it is sized to its label, so the alignment it carried changed nothing visible.
