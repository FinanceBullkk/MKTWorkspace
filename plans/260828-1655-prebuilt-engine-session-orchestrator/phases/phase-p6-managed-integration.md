---
phase: P6
title: "Managed MKTTool to Relay to MKTBrowser integration"
status: pending
priority: P1
dependencies: [P5]
owner: "one Codex session"
---

# Phase P6: Managed integration

## Objective

Confirm that the prebuilt engine fits the existing managed contract without opening a new direct
browser-control surface or changing unrelated dirty files.

## Reuse and verify

- Browser contract v4 and `launch_managed_profile` path;
- signed Relay ticket, replay protection, and local readiness;
- engine pin/readiness and per-engine firewall rule checks;
- one-profile license lease, close, hard-kill cooling, and restart recovery;
- direct-launch and deletion denials;
- existing targeted unit, packaged, and Relay evidence.

This phase is verification-only. If a concrete compatibility gap is reproduced, stop with
`NEEDS_CONTEXT` and create a separately approved P6-FIX phase/plan with an explicit file allowlist;
do not widen this phase's write roots from inside the child session. Existing dirty files remain
protected. A later fix session must run focused tests plus the closest packaged verification.

## Exit gate

The managed path launches the pinned engine only after readiness/proxy checks, returns correlated
diagnostics, releases or recovers the one seat, and preserves the restricted tool inventory. No
real accounts, broad rollout, or new engine adapter is approved by this phase alone.
