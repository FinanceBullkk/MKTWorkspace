---
phase: P3
title: "Standalone lifecycle smoke on disposable profiles"
status: pending
priority: P1
dependencies: [P2]
owner: "one Codex session"
---

# Phase P3: Standalone lifecycle smoke

## Objective

Prove that the selected prebuilt engine can launch and close safely before measuring identity or
integrating it with real product workflows.

## Procedure

Run three serial cycles with a fresh empty profile directory each time:

1. Record resource/process preflight and engine hash.
2. Launch through the existing compatibility path and wait for health/DevTools readiness.
3. Record PID ownership, startup time, peak working set, and clean exit.
4. Exercise a controlled restart and one simulated crash/abandoned-process recovery.
5. Verify no orphan browser, helper, lock, or stale activation marker remains.

Record `engineKind` and runtime path on every cycle and verify they match the selected pin. A
CloakBrowser failure must remain an engine-unavailable result unless the operator explicitly starts
a separately pinned CFT compatibility run.

The lifecycle portion can run without an external proxy. Use the existing compatibility smoke
runner for synthetic cookie round-trip and proxy checks only where its authorization contract
permits; the network-dependent part is intentionally deferred to P4. Do not navigate to account
sites or store sensitive data.

## Exit gate

Three serial cycles pass with no orphan process, no mixed engine version, bounded memory, and a
known cleanup result. Any crash or license-seat ambiguity is `BLOCKED`, not a soft warning.
