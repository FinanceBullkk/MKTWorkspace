---
phase: P4
title: "Profile, proxy, and storage isolation"
status: pending
priority: P1
dependencies: [P3]
owner: "one Codex session"
---

# Phase P4: Profile and proxy isolation

## Objective

Verify the product's operational identity boundary with two disposable profiles run sequentially.
The test asks whether state stays separate and the configured proxy is enforced; it does not ask
whether a detector awards a unique score.

An owner-provided disposable static proxy (or a documented sanctioned test fixture) is required for
the network portion. Never substitute the host IP or a guessed proxy. If no safe proxy is available,
complete the storage-only checks and return `BLOCKED` for the network gate.

## Procedure

- Create two managed disposable profiles with distinct owned directories and deterministic test
  seeds.
- Place each disposable `--user-data-dir` in a dedicated temporary/evidence root outside the engine
  runtime directory; assert this relationship before launch and remove/quarantine it afterward.
- Apply one static proxy before each launch and verify in-browser egress through the existing
  sanitized probe.
- Check cookie, local storage, service worker, cache, permission, and session separation after
  close/reopen.
- Check DNS/WebRTC exposure using the existing safe network matrix where available.
- Attempt direct launch or an invalid proxy state and verify fail-closed behavior.
- Keep one profile active at a time because the current license capacity is one seat.

## Exit gate

No cross-profile state is observed; proxy-before-launch and egress checks agree; direct/uncertain
launch is refused; logs contain no proxy credentials or observed IP values. A collision in a
fingerprint surface is recorded as a measurement finding, not hidden as a failure or “fixed” with
JS patches.
