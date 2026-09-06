---
description: "Arabic language pack for the web GUI: the ar language definition, its right-to-left reading order, and a dictionary for every shipped namespace, for users and language-pack authors."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-locale-ar

English | [中文](README.zh.md)

## Summary

`dsh-client-locale-ar` adds Arabic to the web GUI. It registers the `ar` language with English as its fallback and a right-to-left reading order, then registers one dictionary for each namespace the shipped client packages declare. Users select it in Settings → General; the interface copy switches immediately and the marked text zones read right-to-left while the application frame keeps its placement. The pack contributes translations and a reading order and nothing else — it mounts no UI, reads no settings, and holds no state.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The pack ships in the `web` profile, so Arabic appears in Settings → General beside Chinese and English with nothing to configure. Selecting it switches every translated surface at once and stores the choice like any other language preference.

### What changes when Arabic is active

Product copy follows the language: buttons, labels, descriptions, placeholders, accessibility names, and status text read in Arabic and align to the reading edge inside each marked text zone. The application frame does not move — the sidebar keeps its side and width, and toolbars and controls keep their positions.

Text that is not product copy keeps its own direction. Messages you and the model write carry `dir="auto"`, so an English reply inside an Arabic interface still reads left-to-right and a mixed conversation reads correctly line by line. Code, terminal output, diffs, file content, and structured data always render left-to-right, because their column order is part of their meaning.

### Reading a key that has no Arabic text

The language declares English as its fallback, so a key this pack has not translated shows the English text rather than a bare key. That case is a build error for every namespace whose owner exports a key union: this package's typecheck fails when an upstream package adds a key without an Arabic counterpart. The one namespace outside that guarantee is `directory-browser`, whose owner declares its dictionaries inline.

### Adding a language of your own

This pack is the worked example of the language-pack contract described in [the locale package](../locale/README.md#use-this-package): register the definition and each namespace as owned effects, name a fallback that terminates at English, and declare the reading order on the definition rather than touching the document.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

### Design concept

The plugin body is a loop. It adds the language first, so a later dictionary failure leaves a selectable language falling back to English rather than dictionaries nothing can select, then registers each namespace from one frozen table. Every registration is a `ctx.effect`, so unloading the plugin removes the language and its copy together and returns an active Arabic selection to an available language.

Each dictionary file declares `satisfies Record<XxxKey, string>` against the key union its owning package exports through the `./src/*` subpath, imported type-only. Completeness is therefore a compile-time property of this package, not a runtime sweep. What types cannot check is the namespace *id* a dictionary registers under, because a typo produces a valid registration nothing reads; the package spec pins those ids by translating one key per namespace family.

### Translation decisions

[`locales/glossary.ts`](src/client/locales/glossary.ts) fixes the recurring product terms so one concept never appears under two names. Identifiers stay in their original form: model ids, provider names, tool names, package names, slash commands, file formats, protocol names, key names printed on a keyboard, and literal example values. Translating them would make them unsearchable and, for a command, untypable.

Counts are wording-neutral. Arabic distinguishes six plural categories while the locale runtime interpolates flat templates with no plural selection, so a namespace's `.one` and `.other` keys carry the same Arabic sentence, phrased to read correctly at every count. Digits stay Western, matching the numbers the runtime interpolates.

### Source map

| File | Role |
|---|---|
| [`src/client/index.ts`](src/client/index.ts) | The language definition, the namespace table, and the registration loop |
| [`src/client/locales/`](src/client/locales/) | One dictionary per namespace, each typed against its owner's key union |
| [`src/client/locales/glossary.ts`](src/client/locales/glossary.ts) | The fixed renderings the dictionaries share |
| [`src/index.ts`](src/index.ts) | Node half; the pack is browser-only and registers nothing here |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Client locale service](../locale/README.md) — the catalog, the fallback chain, and the text-direction attribute this pack drives.
- [ui-theme](../ui-theme/README.md) — the single rule that applies the reading order to marked text zones.
- [Arabic pack decision](../../../.agents/notes/implemented/feature/2026-09-05-arabic-rtl-language-pack.md) — why direction is a language property and why the frame does not mirror.
- [Client group map](../README.md) — the browser half this package belongs to.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side dictionary registry that registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define where the Arabic surface is incomplete. They are current package constraints, not a task backlog.

- **No plural agreement** — the runtime selects no plural category, so a count-bearing sentence is phrased to read acceptably at every count rather than agreeing with its number. Adding plural rules is a locale-runtime change, not a dictionary one.
- **`directory-browser` has no compile-time completeness check** — its owner declares dictionaries inline instead of exporting a key union, so a key added there falls back to English silently.
- **Copy captured at registration time keeps its language** — the locale service's [registry-held text limitation](../locale/README.md#known-limitations-and-deferred-work) applies to this pack unchanged.
- **Slash-command names and descriptions stay English** — the command registry holds them Host-side, outside every locale namespace, so the palette lists them verbatim. They carry `dir="auto"` and keep their own reading order rather than being aligned as product copy. Translating them is a change to the registry, not to a language pack.
- **No Arabic web font ships** — the pack appends nothing to the font stack and relies on the system Arabic families the platform provides.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

When an upstream package adds a copy key, this package's typecheck is the thing that fails. Translate the key here in the same change rather than relaxing the `satisfies` clause.

</details>

**Runtime invariant:** No companion is published. The pack owns no independent runtime relationship to compare against: registration, disposal, and fallback are the locale service's behavior, and this package's spec asserts its own namespace ids and language definition directly.
