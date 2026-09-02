---
phase: P7
title: "Install/update/rollback review and owner-led demo gate"
status: pending
priority: P1
dependencies: [P6]
owner: "one Codex session plus owner decision"
---

# Phase P7: Release and demo gate

## Objective

Close only the internal-demo readiness questions. This phase must not turn an external engine
dependency into a distributable installer.

## Checks

- engine remains an external unmodified download, never bundled in the app package;
- current license, notices, source URL, checksum, size, and architecture are recorded;
- update replacement is atomic and rollback is proven;
- firewall rules cover the exact engine path and are rechecked after update;
- repair/uninstall leave the intended profile and Relay data boundaries intact;
- clean-VM or fresh-install checks are labelled as VM evidence; an unavailable VM is OPEN;
- unsigned/SmartScreen and one-seat limitations are visible to the owner.

## Decisions

Produce one of:

- `INTERNAL_DEMO_ONLY`: disposable profiles, owner-led, no distribution;
- `HOLD`: evidence or license/VM gate remains open;
- `ABANDON`: candidate is unsuitable and no fallback is approved.

No binary publish, installer distribution, customer access, or real-account pilot follows from a
green local measurement alone.

