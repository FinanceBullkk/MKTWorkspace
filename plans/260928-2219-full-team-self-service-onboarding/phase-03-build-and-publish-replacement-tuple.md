---
phase: 3
title: "Build and publish replacement tuple"
status: in-progress
priority: P1
effort: "4-7h"
dependencies: [1, 2]
---

# Phase 3: Build and publish replacement tuple

## Overview

Freeze, build, verify, publish, approve, and deploy a new immutable Relay/Browser tuple carrying the
self-enrollment protocol. Preserve v20/0.3.27 as historical accepted bytes.

## Requirements

- Increment Relay and Browser versions and create a fresh candidate ID.
- Build Relay from clean committed source, full-GET/hash verify R2, then pin its exact archive in
  Browser before packaging.
- Build Browser twice from isolated clean inputs, compare normalized payloads, retain one exact
  installer, and generate metadata only for those bytes.
- Set only the non-reversible fingerprint and exact approved tuple on Railway; never set
  `VAULT_KEY_OPERATOR` there.

## Related Code Files

- Modify: MKTTool relay/version/candidate/release docs and tests.
- Modify: MKTBrowser package versions, Relay pin, candidate contract, coherence tests and current
  README state.
- Create: release receipts under the existing external/local evidence roots, not git-tracked secrets.

## Implementation Steps

1. Run focused tests, full MKTTool quality/security/database/Relay gates, and Browser quality gates.
2. Commit source before freeze; record commits, trees, toolchain and dependency locks.
3. Build/publish Relay, verify exact public/authenticated GET and hash, then bind Browser candidate.
4. Produce two isolated Browser builds, compare normalized payloads, retain exact accepted installer,
   publish immutable object, and set its exact Railway approval tuple.
5. Push MKTTool production release, verify deployed SHA, health, release metadata, installer and
   Relay full GET/hash; retain rollback to the prior exact tuple.

## Success Criteria

- [ ] Required local gates pass with zero unexplained skips.
- [ ] Relay and installer bytes are immutable, full-read verified, and metadata-bound.
- [ ] Production health is ready on the exact pushed SHA with the new Relay version.
- [ ] No secret or write-capable R2 credential enters git or Railway output.

## Risk Assessment

Pushing MKTTool deploys production. Do not push before local gates and exact artifact freeze. Do not
run heavy Browser builds while a VM is active or host RAM is below the existing release threshold.

## Current Checkpoint

See [30 September candidate checkpoint](./checkpoint-20260930-browser-0330-relay22.md). The Relay
artifact is frozen and published, but PostgreSQL 16 contracts, Browser build/package, VM, deploy,
and operator acceptance gates are not closed.
