---
description: "Add the Standard + agent preset, skill usage stats, and the Arabic language to the Web profile from the plugin manager."
kind: "package-bundle"
---

# @deepseek-ai/dsh-extras-web

English | [中文](README.zh.md)

## Summary

This optional bundle carries the fork's plugins into the Web composition without editing `dsh-base` or `dsh-web-app`. It adds the `Standard +` agent preset and makes it the default for new sessions, inserts the `skill-stats` projection and the `locale-ar` Arabic pack, and leaves the shipped presets selectable and unchanged. Shipped profiles leave it switched off.

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

Open Plugins in the Web sidebar and enable Standard +. New sessions then use the `Standard +` preset, which is the shipped `standard` preset with the in-process search backend for `glob` and `grep`, pinned standing rules (`/rule` and `rule_pin`), and typed working state (`state_write`). The language menu offers Arabic, and skill usage is projected per session. Sessions already running keep their preset; the preset picker still lists `standard`, `ptc`, `minimal`, and `cordis`. Disabling the bundle restores the shipped composition.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Maintainer details — click to expand</summary>

A patch can neither change a row's package nor reach inside a preset's `config.plugins`, so the fork's agent rows ship as a whole preset instead of edits to the shipped ones. `presets/standard-plus.patch.yml` is generated from `packages/bundle/web-app/presets/standard.patch.yml` by `src/gen-standard-plus.ts`, whose edits each replace one anchor that must occur exactly once; `tests/patch.spec.ts` fails when the committed file differs from the derivation, so an upstream change to `standard` surfaces at the next test run. Regenerate with `pnpm exec tsx packages/bundle/extras-web/src/gen-standard-plus.ts`.

`OPTIONAL_BUNDLES` in `packages/boot/app-boot/src/profile.ts` names this package and `apps/cli` depends on it, so the plugin manager offers it switched off. Selecting it appends the bundle after `dsh-web-app` in `dsh.profile.bundles`. No runtime invariant companion is published because this configuration-only package owns no mutable runtime state.

| File | Role |
|---|---|
| [`cordis.patch.yml`](cordis.patch.yml) | Inserts `skill-stats` and `locale-ar`; sets the preset registry default to `standard-plus` |
| [`presets/standard-plus.patch.yml`](presets/standard-plus.patch.yml) | The generated `Standard +` preset |
| [`src/gen-standard-plus.ts`](src/gen-standard-plus.ts) | Derives the preset from the shipped `standard` preset |
| [`package.json`](package.json) | Every package the rows name, as dependencies |
| [`locale/en.json`](locale/en.json), [`locale/zh.json`](locale/zh.json) | Plugin-manager title and description |
| [`icon.svg`](icon.svg) | Plugin-manager icon |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Terminal extras bundle](../extras/README.md) — the same plugins for terminal profiles.
- [Web bundle](../web-app/README.md) — the composition this bundle layers over.
- [Arabic language pack](../../client/locale-ar/README.md) — the language this bundle adds.

-----

<a id="model-experience"></a>
## Model Experience

### Preset tools

#### What the model sees

A session on `Standard +` gets the `standard` catalog plus `rule_pin` and `state_write`; `glob` and `grep` keep their schemas. Pinned rules reach the model as one `<pinned_rules>` message republished after every compaction, and the working state as one replacing `<task_state>` message.

#### Token effect

Two tool schemas are added to every request of a `Standard +` session. Each pinned rule and each state key adds its text to the republished message, bounded by `maxRules`/`maxRuleChars` and `maxKeys`/`maxStateChars`.

#### KV Cache effect

The tool schemas are part of the request prefix from the session's first request. A republished `<pinned_rules>` or `<task_state>` message follows a compaction, which has already rewritten the prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- `Standard +` copies `standard`. An upstream change to `standard` is picked up only when the preset is regenerated; the bundle test fails until then.
- The `ptc`, `minimal`, and `cordis` presets do not carry the fork's tools.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer details — click to expand</summary>

None.

</details>
