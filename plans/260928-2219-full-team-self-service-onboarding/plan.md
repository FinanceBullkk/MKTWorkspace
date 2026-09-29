---
title: "Full team self-service onboarding"
description: "Let every allowlisted teammate install the approved Windows client, register their own PC, and prove the locally entered operator key without administrator intervention."
status: in-progress
priority: P1
effort: "12-20h plus Windows acceptance"
branch: "master"
tags: [feature, security, onboarding, release]
blockedBy: []
blocks: [260908-0740-local-vm-product-release, 260908-0644-ready-to-use-closeout]
created: "2026-09-28T15:19:58.053Z"
createdBy: "ck:plan"
source: skill
---

# Full team self-service onboarding

## Overview

Deliver a zero-admin onboarding path for allowlisted users while preserving the two-vault-domain
boundary. The operator key is copied from the team password manager directly into local Relay; it
never enters MKTTool Web. Relay sends only a domain-separated SHA-256 fingerprint inside the
recipient-bound completion ceremony. The server compares it with
`VAULT_KEY_OPERATOR_FINGERPRINT`, then marks only that signed-in owner's PC ready.

Reuse existing PC enrollment, signed five-minute authorization, DPAPI storage, installer route,
allowlist, and immutable R2 release channels. Keep admin sealed grants as recovery. Do not mutate
Relay v20 or Browser 0.3.27 bytes: release a new Relay/Browser tuple. Browser remains a profile
manager with proxy binding; this work makes no identity-isolation or real-account-safety claim.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Secure operator-key self-enrollment](./phase-01-secure-operator-key-self-enrollment.md) | Pending |
| 2 | [Complete setup and Browser distribution](./phase-02-complete-setup-and-browser-distribution.md) | Pending |
| 3 | [Build and publish replacement tuple](./phase-03-build-and-publish-replacement-tuple.md) | Pending |
| 4 | [Validate unfamiliar-operator onboarding](./phase-04-validate-unfamiliar-operator-onboarding.md) | Pending |

## Dependencies

- Production allowlist and Google OAuth remain the admission boundary.
- Team Vaultwarden must expose the existing operator key to the intended collection; app code does
  not administer Vaultwarden or receive that secret.
- Exact release bytes require a new Relay version, Browser version, candidate ID, metadata binding,
  and independent acceptance receipts.
- Human Google sign-in and key paste may require the owner/operator at the final Windows gate.
