---
phase: P1
title: "Inventory and approve a prebuilt engine candidate"
status: pending
priority: P1
dependencies: [P0]
owner: "one Codex session"
---

# Phase P1: Inventory and approval

## Objective

Revalidate the exact engine facts on the execution date and choose one candidate without treating
an old JSON pin or a wrapper repository license as current approval.

## Read

- `MKTBrowser/README.md` (engine paths and distribution boundary)
- `MKTBrowser/docs/mkb-00-source-license-engine-inventory.md`
- `MKTBrowser/apps/desktop/windows-engine-release.json`
- `%LOCALAPPDATA%/MKTTool/compatibility-updater/active-engine.json` (inspect shape and redact URL)
- `MKTBrowser/apps/desktop/src/main/ChromiumBootstrap.ts`
- `MKTBrowser/apps/desktop/src/main/resolve-licensed-engine-descriptor.ts`
- `MKTBrowser/apps/desktop/src/main/compatibility-engine-pin.ts`
- current vendor terms and official release/checksum page (record URL and retrieval date only)

The binary-license review must include the current official
[`BINARY-LICENSE.md`](https://github.com/CloakHQ/CloakBrowser/blob/main/BINARY-LICENSE.md) and the
version-specific subscription/entitlement terms. A historical wrapper MIT license is not enough.

## Decisions to record

- Primary: CloakBrowser licensed Windows x64 binary, unmodified, only when the owner confirms the
  current Pro entitlement/seat.
- Compatibility option: an officially available keyless CloakBrowser build, if still offered, may
  be tested for lifecycle/shell compatibility only; it does not inherit the licensed operational
  gate.
- Fallback: CFT only for compatibility/reference tests, clearly labelled and never promoted to
  operational antidetect status.
- Current one-seat limit and subscription entitlement.
- Whether the exact build may be stored in an internal mirror while remaining undistributed.

## Required evidence

For the selected version: official channel URL, retrieval timestamp, version, architecture, archive
size, published archive SHA-256, license/version/subscription statement, and a redacted provenance
record. The extracted binary hash is measured later and stored as a separate fact.
Never copy the license key or a short-lived signed download URL into reports, prompts, or logs. The
release record keeps stable version/hash/size facts. The current active-pin writer also stores a
short-lived URL for the immediate next fetch; P1 must test its expiry/refresh behavior and either
accept that bounded use or open a narrowly scoped schema/refresh fix. If any fact is unavailable,
return `BLOCKED`.

## Exit gate

Exactly one primary candidate has all required facts and an explicit internal-use-only disposition.
Do not infer entitlement from the mere presence of `CLOAKBROWSER_LICENSE_KEY`. If a live probe is
needed, pass the key in memory through the existing secure settings path and scrub all child output;
never place it in the context packet. No download or source modification is performed in P1.
