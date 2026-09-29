---
phase: 4
title: "Validate unfamiliar-operator onboarding"
status: pending
priority: P1
effort: "1-3h plus human checkpoints"
dependencies: [3]
---

# Phase 4: Validate unfamiliar-operator onboarding

## Overview

Run the exact production journey on the spare Dell or another clean Windows account with an
allowlisted non-admin identity. Source tests and owner-machine checks are not substitutes.

## Requirements

- Use exact production downloads and record hashes before execution.
- Exercise sign-in, combined install, first run, PC registration, Vaultwarden key retrieval, local
  paste, Ready confirmation, empty profile inventory, one disposable profile/proxy launch if safe,
  repair, and uninstall/cleanup.
- Preserve Defender, user apps, Tailscale/SSH boundaries, and existing data; no key/password output.
- Report human sign-in/key-paste, second-PC, and elapsed canary separately from automated evidence.

## Related Code Files

- Update: living roadmap/team rollout guide/changelog with exact acceptance result.
- Evidence: external release evidence directory only; do not commit production data or secrets.

## Implementation Steps

1. Reset only the disposable test installation/identity after verifying exact targets and backup need.
2. Have the allowlisted non-admin sign in and retrieve/paste the Vaultwarden item locally; Codex does
   not request, display, or log either credential.
3. Verify server device ownership/Ready state and local Relay configuration agree.
4. Exercise Browser/Relay lifecycle, network failure/recovery, repair, uninstall, and cleanup against
   the exact released installer.
5. Record `PASS`, `OPEN`, `FAIL`, and `BLOCKED` gates separately; close the plan only when the full
   onboarding journey is observed.

## Success Criteria

- [ ] A non-admin allowlisted teammate finishes without an administrator action.
- [ ] Wrong-key retry is understandable and cannot produce false Ready state.
- [ ] Exact installer, Relay, Browser, and deployed SHA are bound in the acceptance receipt.
- [ ] Cleanup leaves no unintended app, firewall, startup, key, or profile residue.

## Risk Assessment

The last gate may require human Google/Vaultwarden interaction. If unavailable, mark it OPEN rather
than promoting synthetic or owner-driven automation as unfamiliar-operator proof.
