# Phase 03 — Windows Lifecycle: Installer, Update, Rollback, Uninstall

Depth: **D3 (adversarial trace)** · Priority: P1 · Status: Not started · Effort: 1–2 sessions

## Context

- Lifecycle architecture decision (14 Aug): [`pre-mkb04 plan`](../260813-1546-pre-mkb04-system-quality-audit/plan.md#lifecycle-architecture-decision---14-august-2026)
- 16 Aug: packaging tests run and pass (27); **no packaging code was read**.

## Why D3 not D4

The failure mode is crash-consistency across process boundaries — half-applied updates, orphaned
markers, partially-activated engine sets. Those are traceable by reading state transitions. Genuine
D4 proof needs real Windows install/uninstall cycles, which belongs to the human gate (pre-MKB-04
Phase 04), not here. This phase makes that human rehearsal cheaper by naming exactly what to watch.

## Scope

**Relay side** (`relay/src/`): `local-updater.ts` · `compatibility-transition-runner.ts` ·
`compatibility-transition-preparation-lock.ts` · `compatibility-artifact-staging.ts` ·
`compatibility-rollback-preparation.ts` · `compatibility-set-integrity.ts` ·
`compatibility-update-marker.ts` · `compatibility-update-health.ts` · `compatibility-installer-floor.ts` ·
`active-engine-pin.ts` · `windows-compatibility-installation.ts` · `windows-compatibility-startup.ts` ·
`windows-compatibility-update-platform.ts` · `windows-engine-artifact-activation.ts` ·
`windows-owned-process-control.ts` · `windows-secure-store.ts` · `update-state.ts` ·
`post-activation-smoke.ts` · `relay-security-state.ts`

**Browser side** (`apps/desktop/scripts/`): `package-windows.cjs` 197 ·
`verify-packaged-runtime-contract.cjs` 403 · `fetch-pinned-relay.cjs` 103 ·
`generate-windows-firewall-commands.cjs` 57 · `edit-windows-executable.cjs` 60 ·
`system-chrome-engine-fixture.cjs` 80 · `package-windows-installer.cjs` 28 ·
`package-windows-directory.cjs` 15 · `strip-workspace-symlinks.cjs` 27

**MKTTool side**: `windows-installer-file.ts` · `app/api/setup/windows-installer/route.ts` ·
`scripts/build-relay-executable.ts` · `scripts/publish-relay-release.ts`

## Key insights carried in

- Marker/pin modules are internally cohesive (`compatibility-update-marker` ← 8 importers) — the
  16 Aug scan flagged them dead, wrongly. They are the crash-consistency substrate.
- The lifecycle decision is explicit: **uninstall must not delete identity-bearing data.** Repair,
  uninstall, and retire are three different operations with three different destruction scopes. That
  is the invariant to trace.
- `compatibility-transition-preparation-lock.ts` exists, so concurrent transitions were considered.
  Trace whether the lock survives process death.

## Failure hypotheses

**Crash consistency**
- H40 Power loss mid-transition leaves an engine pin pointing at a partially-staged set; next start
  activates it.
- H41 Marker written before artifacts are durable (no fsync / no atomic rename), so a crash yields a
  marker for a set that does not exist.
- H42 Preparation lock is a plain file with no owner-liveness check — a killed process leaves a lock
  that blocks all future updates with no recovery path.
- H43 Rollback after a failed update restores binaries but not `update-state.ts`, leaving version
  bookkeeping disagreeing with what is on disk.
- H44 `post-activation-smoke` failure does not trigger rollback, leaving a known-bad engine active.

**Destruction scope — the 14 Aug invariant**
- H45 Uninstall removes Browser profiles, the MCP token, Relay config, device identity, or operator
  credentials. Any single one is a P0 against the stated decision.
- H46 Repair/reinstall is not idempotent — running twice loses warmed profiles.
- H47 Browser installer claims ownership of a pre-existing Relay installation, so uninstalling the
  Browser removes a Relay it did not install.
- H48 Retire leaves a recovery receipt that is unreadable or absent after the one-use seed is erased
  (couples to H13).

**Installer integrity**
- H49 `fetch-pinned-relay.cjs` accepts an artifact whose hash is unverified, or falls back to "latest"
  when the pin is unset. (Workflow comment says this must never happen — prove the code enforces it,
  not the comment.)
- H50 Firewall rules are added but never removed on uninstall, or are scoped broadly enough to affect
  unrelated traffic.
- H51 `edit-windows-executable.cjs` / `rcedit` breaks a signature or leaves the binary writable by
  non-admins.
- H52 Install path is user-writable, so a non-admin local user can replace the engine binary between
  the protected-path check and launch (TOCTOU against `ChromiumBrowserDriver.ts:186`).
- H53 `compatibility-installer-floor` can be satisfied by a downgraded installer, enabling rollback to
  a revoked version.

## Method

1. Write H40–H53 before reading.
2. D2 read of relay lifecycle modules in transition order: prepare → stage → lock → activate → smoke →
   rollback → uninstall.
3. Build a state-transition table: every state × every interruption point → resulting on-disk state →
   what the next start does. Interruptions: kill during stage, during activate, during rollback,
   between marker write and artifact durability.
4. Trace destruction scope: for each of repair / uninstall / retire, list every path touched. Diff
   against the 14 Aug decision. Any deletion of identity-bearing data is a finding.
5. Read packaging scripts for integrity gaps (H49–H53).
6. Produce a **watch list** for the human Windows gate: the exact observable for each hypothesis that
   static reading cannot close.

## Todo

- [ ] Write H40–H53
- [ ] D2 read relay lifecycle modules
- [ ] State-transition × interruption table
- [ ] Destruction-scope trace for repair / uninstall / retire
- [ ] D2 read packaging scripts
- [ ] Watch list for the human gate
- [ ] `plans/reports/audit-{date}-windows-lifecycle.md`

## Success criteria

- Transition table complete; every interruption point has a stated recovery outcome.
- Destruction scope for all three operations documented and diffed against the 14 Aug decision.
- Every hypothesis closed statically or handed to the human gate with a named observable.

## Risks

- **Static limits.** Crash consistency is genuinely hard to prove by reading. Where a claim cannot be
  closed, say "requires human gate" rather than asserting it holds.
- **No real installs.** Plan forbids operational-machine installation. Use disposable VMs only, and
  only in the human gate phase — not here.

## Next

Phase 04 — the installer consumes signed manifests, so H49/H53 depend on the delegation chain result.
