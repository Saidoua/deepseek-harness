---
description: "Add pinned rules, typed working state, skill usage stats, and the in-process search backend to terminal profiles."
kind: "package-bundle"
---

# @deepseek-ai/dsh-extras

English | [中文](README.zh.md)

## Summary

This bundle carries the fork's plugins into the terminal profiles (`headless`, `sdk`, `acp`) without editing `dsh-base`. It replaces the in-box `tool-fs-search` row with the in-process search backend and inserts `session-rules`, `skill-stats`, and `tool-state`. Every inserted row is switched off while `dsh-web-app` runs, where [`dsh-extras-web`](../extras-web/README.md) carries the same plugins.

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

Append `@deepseek-ai/dsh-extras` to `dsh.profile.bundles` in `$DSH_HOME/profiles/<name>/package.json`, after the profile's existing bundles. The installation depends on this package, so the bundle resolves without a package install. The next start registers `glob` and `grep` from the dsh-rs addon (or the in-box spawn-backed tools where no prebuilt binary exists or under `DSH_NATIVE=0`), `rule_pin` and the `/rule` command, `state_write`, and the skill usage projection. Removing the name restores the shipped composition.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Maintainer details — click to expand</summary>

A patch cannot change a row's package, so the in-box `tool-fs-search` row is disabled by id and the search backend is inserted as `tool-fs-search-native`. Each inserted row carries `disabled: !!js` over `profileContext.startedBundles`, so selecting this bundle in a Web profile adds nothing to the host plane, where agent rows would reach every session. `apps/cli` depends on this package so the bundle resolves from the installation. No runtime invariant companion is published because this configuration-only package owns no mutable runtime state.

| File | Role |
|---|---|
| [`cordis.patch.yml`](cordis.patch.yml) | Disables `tool-fs-search`; inserts the four rows |
| [`package.json`](package.json) | The row packages as dependencies |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Web extras bundle](../extras-web/README.md) — the same plugins for the Web profile, through a preset.
- [Base bundle](../base/README.md) — the composition this bundle layers over.
- [Session rules](../../context/session-rules/README.md) and [tool state](../../todo/tool-state/README.md) — the two plugins that add model-visible messages.

-----

<a id="model-experience"></a>
## Model Experience

### Added tools

#### What the model sees

The catalog gains `rule_pin` and `state_write`; `glob` and `grep` keep their schemas. Pinned rules reach the model as one `<pinned_rules>` message republished after every compaction, and the working state as one replacing `<task_state>` message.

#### Token effect

Two tool schemas are added to every request. Each pinned rule and each state key adds its text to the republished message, bounded by `maxRules`/`maxRuleChars` and `maxKeys`/`maxStateChars`.

#### KV Cache effect

The tool schemas are part of the request prefix from the first request. A republished `<pinned_rules>` or `<task_state>` message follows a compaction, which has already rewritten the prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The plugin manager page does not list this bundle; it is selected by editing the profile manifest.
- A profile patch that targets `tool-fs-search` by id changes the disabled in-box row, not the search backend; target `tool-fs-search-native` instead.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer details — click to expand</summary>

None.

</details>
