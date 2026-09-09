---
phase: 2
title: Local release gate
status: completed
effort: ''
---

# Phase 2: Local release gate

## Overview

A reusable local runner invokes existing quality, security, build and packaged contracts, records
honest provenance and blocks release until exact-artifact clean-VM evidence is present.

## Implementation Steps

1. Add fail-closed gate/receipt modules in MKTBrowser/scripts using existing commands.
2. Pin source commit/tree, sibling commit/tree, Node22/Yarn and measured engine archive metadata.
   Replace the old Cloak-only release-candidate assertion with the exact reviewed CFT tuple,
   including negative wrong-kind/source/version/hash/size/URL cases; arbitrary engines still fail.
3. Freeze clean source and isolate build inputs; compare two fresh normalized payloads.
4. Keep command logs and hashes outside source; any required failure/skip stops promotion.
5. Add tamper, wrong-source/artifact, missing-check and failure-path tests.
6. Document equivalent commands for MKTTool and switch workflows to optional manual diagnostics
   only after the replacement local checks exist; no skipped check becomes a success.

## Success Criteria

- [x] Runner and receipt validation pass focused negative/positive tests and lint.
- [x] Policy and workflow triggers match the runnable replacement checks.
- [x] Exact candidate has two-build payload comparison and clean-source local evidence.

Evidence: Browser b quality PASS, independent b/c normalized manifests match all 128 entries;
MKTTool security/quality-r2/contracts/Relay final receipts PASS. Frozen commits, artifact hashes,
command counts and limits: [implementation checkpoint](reports/implementation-status.md).
Completion is the local gate only. Skipped live-host integration, failed packaged host fixture,
supported activation and exact VM acceptance remain explicit Phase 3/4 work, not waived.

## Architecture

Local quality/build receipts and VM receipts are separate inputs to a final release decision.
Receipts bind command exit status, times, commit/tree, artifact SHA256 and snapshot identity.
An unobserved required gate is OPEN; it cannot be satisfied by a generic caller-supplied PASS.
Use fixed version-controlled command lists, bounded subprocesses, log hashes and lockfile hashes.
Commit implementation before freezing/building; post-VM changes are evidence/docs only. Any
payload-affecting change restarts the exact-artifact validation chain.

## Related Code Files

- E:/MKTWorkspace/MKTBrowser/scripts/local-release-*.cjs (new)
- E:/MKTWorkspace/MKTBrowser/package.json
- E:/MKTWorkspace/MKTBrowser/.github/workflows/*.yml
- E:/MKTWorkspace/MKTTool/.github/workflows/*.yml
- E:/MKTWorkspace/AGENTS.md

## Risks

Serial heavy work only; never package alongside tests or a running 6 GB VM. Use subprocess exit
codes, not output matching. This host/VM does not prove hardware independence or elapsed canary.
