---
phase: 3
title: CFT supported provisioning
status: in-progress
effort: ''
---

# Phase 3: CFT supported provisioning

## Overview

Fresh installed Browser gets a verified CFT release pin through a supported provisioning path.

## Implementation Steps

1. Reuse signed compatibility verification, trust root, expiry/revocation and rollback controls.
2. Coordinate reviewed CFT tuple, candidate identifier and immutable storage keys without overwrites.
3. Use existing install -> pair -> ADMIN repairMissingState update. No new Browser trust code.
   Preflight all local artifacts, control contract, signatures, revocations and ALL remote keys
   before the first PUT. Resume only for byte-identical objects. Live HEAD found v16 keys absent.
   Sign only after frozen installer exists. Make candidate bytes available to isolated VM via
   a bounded authenticated test distribution before operator promotion; retain the exact bytes.
4. Validate wrong signature/hash/kind/version, expiry, interrupted download and existing pin behavior.
5. Preserve saved engine settings and never enable packaged unpinned/system-Chrome overrides.

## Success Criteria

- [ ] Supported CFT provisioning implemented with negative tests and independent security review.
- [ ] Legitimate CFT contract accepted; old quarantined tuples remain rejected.
- [ ] Signed candidate metadata prepared with valid authority without premature public promotion.

## Architecture and Files

Reuse MKTTool compatibility updater and signing authority. Existing ADMIN repair initializes
missing state and creates active-engine.json after verified activation. Keep installer hash
external to its own payload. Change release metadata, old Cloak-only contract, and publisher
preflight; do not duplicate Browser trust parsing. Initial activation failure/retry must be measured.

## Risks

Signing candidate metadata for an isolated test is not public release. No manual active-engine.json
edits, fake signatures, licence activation, or production account use is needed for this phase.
