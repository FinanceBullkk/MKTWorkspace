---
phase: 2
title: "Complete setup and Browser distribution"
status: pending
priority: P1
effort: "3-4h"
dependencies: [1]
---

# Phase 2: Complete setup and Browser distribution

## Overview

Turn `/setup` into the complete operator journey: download the combined Browser installer, install,
register the local PC, retrieve the team key from Vaultwarden, paste it only into Relay, and verify
Ready without waiting for an administrator.

## Requirements

- Browser installer route is visible only to authenticated allowlisted users and reports exact
  version, size, checksum, and product boundary.
- Standalone Relay download remains available for repair/support, not the primary new-PC path.
- Pending state gives one explicit self-service action; admin-only copy disappears from the normal
  journey while admin sealed grant remains available on Relay PCs.
- Setup never claims fingerprint isolation, antidetect safety, or real-account approval.

## Related Code Files

- Create: focused Browser download/setup component if needed.
- Modify: `onboarding-stepper.tsx`, `relay-enroll-card.tsx`, setup state/types, setup source-contract
  tests, installer release presentation, team rollout docs and changelog.

## Implementation Steps

1. Render the approved combined installer and exact metadata on setup step 1; retain standalone
   Relay under repair/advanced disclosure.
2. Replace “waiting for administrator approval” with “enter team operator key” and drive the local
   authorization/paste/completion flow for every owner.
3. Add Vaultwarden retrieval guidance without embedding the key, collection secrets, or a public
   password-manager link that bypasses team access controls.
4. Update source-contract, state-machine, component, accessibility, empty/error, and retry tests.
5. Update living operator docs from the stale 0.3.23/17 HOLD wording to the actual release boundary.

## Success Criteria

- [ ] A newly signed-in operator sees every required action on `/setup` in order.
- [ ] Browser download exists and serves only an exact approved tuple.
- [ ] No normal-path state tells the operator to wait for admin key delivery.
- [ ] Mobile/desktop rendering, keyboard labels, and error recovery pass focused tests.

## Risk Assessment

The main UX risk is presenting an unavailable draft installer as released. Read only the existing
fail-closed release contract and clearly separate combined installer from standalone Relay repair.
