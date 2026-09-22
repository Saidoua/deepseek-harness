# Agent Note: Installed packages resolve harness peers from the running installation

Status: implemented

English | [中文](2026-09-22-installed-package-peer-interception.zh.md)

## Problem

A published plugin can reach the process as a dependency of a shipped bundle rather than through a profile install: this fork mounts `@saidouahdachi/dsh-tool-fs-search-native` from `packages/bundle/base`, so pnpm unpacks it under the checkout's own `node_modules` and links its `@deepseek-ai/dsh-tools` peer to the workspace package.

Under the source launcher the workspace package answers that link through its `exports`, which name the built `lib/` output, while every repo module reaches the same package through tsx's tsconfig paths and gets `src/`. One process then holds two `ToolRuntime` modules: two `TOOL_RUNTIME_SCHEDULER` symbols, two class identities, and two copies of any module-level state. Tool registration happened to keep working because both copies reach the one service instance through the context, but `apps/cli/tests/source-launch.compat.spec.ts` fails on the second copy, and the failure mode it guards against — a scheduler symbol that no longer matches the runtime holding it — is the one the loader hit before that guard existed.

`findInterceptionLayer` admitted profile trees and linked roots and excluded every installation-scope package directory, so the published plugin's own lookup was never routed and Node's nearest-copy rule decided which `dsh-tools` it saw.

## Decision

An installation-scope package whose directory sits under a `node_modules` directory is admitted to linked interception. Its declared peers are then resolved at each ancestor position from the installation's own entry, exactly as for a linked profile root, so one module instance of each peer serves the process.

A first-party installation directory outside `node_modules` keeps its native lookup. That is the source checkout's own workspace tree, where tsconfig paths already select one copy, and where routing would add a resolution hop for every internal import without changing its answer.

The rule keys on the directory's shape rather than on the package's origin because the resolver has no reliable origin signal: a published dependency and a workspace package are both installation-scope entries. What distinguishes them is that the published one is unpacked into a `node_modules` directory, which is also exactly the condition under which its own lookup can reach a copy the installation does not run.

A packaged installation keeps its behavior: its harness packages also sit under `node_modules`, so they route through the same entries, but every entry names the one physical copy already installed there, and the route answers with the file the native lookup would have selected.

## Alternatives considered

**Mount the in-box `tool-fs-search` row under a source launch and keep the native row for built launches.** It needs no resolver change and makes the compat lane pass, but the two packages do not produce the same model-visible output: the in-box row suppresses its `glob` and `grep` guidance for a scope that cannot call those tools, and the published native package still emits it. Recorded sessions replay through the source launcher, so they would have proven the substitute composition while releases shipped the other one.

**Leave the second copy in place.** Tool calls work today because both copies reach the one service instance through the context. The identity that breaks is invisible until something compares a symbol or a class across the boundary, which is the failure the guard test exists to catch, and nothing in the composition tells a reader which copy a given module reached.

**Publish the native package with its harness peers bundled.** It removes the link that resolves to `lib/`, at the cost of duplicating the peers inside the published artifact, which is the same two-instance problem moved into the package and made permanent for every consumer.

## Consequences

`packages/boot/app-boot/tests/profile-resolution.spec.ts` covers both halves: an installed package with a private copy of a declared peer resolves the installation copy through ESM and CommonJS, and a first-party directory with the same private copy keeps it. The source-launch compat lane passes with the native search plugin mounted, so recorded sessions keep proving the composition the product ships rather than a substitute.

The fork carries this change ahead of upstream. Upstream's linked-peer resolution ([2026-09-19 lookup order](2026-09-19-profile-resolution-lookup-order.md)) covers plugins installed into a profile; a bundle dependency is the case it does not reach.
