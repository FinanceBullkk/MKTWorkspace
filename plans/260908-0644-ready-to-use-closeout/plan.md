---
title: Profile-manager ready-to-use closeout
description: Finish measured Windows profile-manager delivery without bypassing release gates.
status: in-progress
priority: P1
effort: large
branch: codex/profile-manager-scope
tags: [browser, windows, profile-manager, release]
created: 2026-09-08
blockedBy: [260908-0740-local-vm-product-release]
---

# Profile-manager ready-to-use closeout

## Follow-on decision - 8 September 2026

Owner selected local build/validation plus a clean disposable VM as replacement release gate.
The [local VM release plan](../260908-0740-local-vm-product-release/plan.md) owns that implementation
and the supported CFT activation blocker. Hosted-only requirements below describe the prior
closeout; they are superseded prospectively after replacement checks exist. Historical failures,
technical evidence and human/second-PC/canary requirements remain unchanged.

## Authority and outcome

Owner explicitly authorizes implementation, commit, push and merge to complete usable delivery.
Scope stays proxy/profile management with manual input, not antidetect or posting research.
Previous VM repair is verified; do not repeat it without changed code or a distinct acceptance case.

## Phases

| Phase | Status | Completed checklist items |
|---|---|---:|
| 1. Inspect gates and acceptance | Complete | 1/1 |
| 2. Review and supported first run | Partial; first run BLOCKED | 3/4 |
| 3. Exact installer and actual-use verification | Partial; installed activation BLOCKED | 6/11 |
| 4. Gated integration and delivery | Partial; Browser release BLOCKED | 4/6 |

Checklist: 14/22 complete; 1/4 complete phases. Counts track tasks, not product readiness.
All phase tasks live in this file; there are no separate phase files to reconcile.

### 1. Inspect gates and acceptance

- [x] Inspect live release/CI/installation gates; establish concrete owner-use acceptance.

### 2. Review and supported first run

- [x] Independently review the startup worker and settings changes; no findings.
- [x] Default fresh/missing/unsupported settings to CFT while preserving saved selections and data.
- [x] Validate focused changes, installer suite, typecheck, lint and unchanged coverage floors.
- [ ] Activate the reviewed signed compatibility set through the supported path and prove normal
  clean installed launch without cache/runtime overrides or manual pin edits. BLOCKED: no active pin.

### 3. Exact installer and actual-use verification

- [x] Build the combined installer and record exact Browser/Relay/control/CFT identities.
- [x] Verify the exact installer-directory runtime contract: 1/1 PASS with explicit CFT fixture.
- [x] Verify clean VM install: 9/9 PASS, restored clean snapshot and Defender enabled.
- [x] Verify initial uninstall: 15/15 PASS, retained profiles/token and unrelated Relay state.
- [x] Finish fresh-snapshot repair and check its final receipt: 13/13 PASS.
- [x] Verify post-repair uninstall: 15/15 PASS, exact process/task/firewall cleanup, data preserved.
- [ ] Verify the exact normally installed managed lifecycle through packaged Relay HTTP transport,
  including reopen, broken-proxy rejection and recovery. BLOCKED on supported engine activation.
- [ ] Observe browser-page IP/DNS/WebRTC containment on the exact installed candidate. OPEN.
- [ ] Complete unfamiliar-operator acceptance with manual input. OPEN.
- [ ] Complete second-PC acceptance on the same supported release tuple. OPEN.
- [ ] Complete seven actual elapsed days of bounded manual canary after prerequisite gates. OPEN.

### 4. Gated integration and delivery

- [x] Commit and push focused Browser changes; verify clean tree and remote parity 0/0.
- [x] Merge MKTTool PR 68 on its exact green-tested tree.
- [x] Observe MKTTool postmerge CI, secret scan, deploy verification and Railway production PASS.
- [x] Record verified delivery and explicit remaining blockers in the report and owner handoff.
- [ ] Obtain successful exact Browser hosted package/contract evidence, then integrate with valid
  gates. BLOCKED on organization artifact storage/access; no blind rerun or red-gate merge.
- [ ] Sign/publish the reviewed release tuple through the supported release-authority path only
  after required gates pass. BLOCKED; current installer remains unsigned and unpublished.

## Acceptance and boundaries

- Supported fresh setup must not default to an unavailable licensed engine.
- Existing profiles/settings are retained; proxy fail-closed, signed tickets, exact process ownership,
  15-second readiness and user-controlled account input remain unchanged.
- No secrets or raw proxy/IP/account data enter Git. Keep unrelated dirty root report intact.
- No blind Actions reruns. Current failure is artifact storage, not proven exhausted execution minutes.
  Investigate read-only first; CI is the merge/release gate, local/VM PASS cannot replace it.
- Owner authorization is not evidence for seven elapsed canary days, second-PC or human acceptance.
- Do not change billing, disable checks, publish private source, or substitute a fake CI result.
- One VM at a time; no heavy local build/test while guest is running. No automatic closure of user apps.

## Current evidence

- Browser startup and fresh-default changes are committed and pushed through `36939cdd`; clean
  tree `35a1dc6d91b6680dad02eb20b6e5849b4991e38d`, remote parity 0/0. Local installer suite:
  391 PASS / 1 explicit SKIP; build/typecheck/lint/coverage PASS. Earlier repaired-directory VM
  signed lifecycles: 2/2 PASS including reboot, separate from the new installer's first-run gate.
- Browser latest technical run `34165090202`: quality/build PASS, package upload FAIL;
  packaged-contract SKIPPED. Existing PR 17 remains red; no historical gate is upgraded.
  This closeout created no Browser PR/merge/release or technical CI rerun.
- MKTTool PR 68 merged as `46a99f2bc3c209fd3bc0b8943f60d217505b5295`; exact merge tree matched
  green PR checks. Postmerge CI `34171586969`, secret scan `34171586987`, deploy verification and
  Railway production PASS. Postmerge Relay executable policy-SKIPPED; exact PR check separately PASS.
- Fresh Browser settings now select CFT, but normal installed runtime reports engine error, no
  version, no active pin and no CFT runtime. Supported first run remains BLOCKED.
- Current GitHub session is an organization member without `admin:org`; billing usage access is
  unavailable. About 56 KB of unexpired Browser artifacts were observed; expired archives are not
  live storage evidence. Organization owner must resolve shared Actions/Packages storage/access.

## Review approach

Use bounded independent review per implementation skill while local packaging work proceeds.
No agent mutates source without explicit file ownership. Final report separates PASS/OPEN/BLOCKED.

## Closeout implementation

- Reviewed plan under the owner's explicit autonomous completion authorization.
- Changed only the fresh/missing/unsupported settings default to CFT; retained either explicit
  stored engine, preserved files on load, and retained the failed-persistence cache guard.
- Independent startup-worker and settings reviews completed alongside focused validation.
- Startup and settings reviews: no findings (9/10 each). Local typecheck/lint PASS; installer suite
  391 PASS / 1 intentional host-machine SKIP; critical coverage 121 PASS, 91.48/84.23/91.39 percent.
- First-run release dependency discovered: packaged bootstrap requires an activated signed
  compatibility-set engine pin. The installer itself does not create that pin. Changing defaults
  does not close this gate; do not hand-edit installed activation state or enable unpinned downloads.
- Official CFT 152.0.7977.64 archive downloaded through full HTTPS GET: 202713690 bytes,
  SHA-256 b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004.
  Extracted chrome.exe matches the already measured fixture hash. This prepares a candidate tuple,
  not a signed release or installed engine activation.
- MKTTool PR 68 merged as 46a99f2bc3c209fd3bc0b8943f60d217505b5295; exact merge tree matched green CI.
  Postmerge run 34171586969 and Railway deployment independently observed PASS.
- Owner freed RAM; pre-VM measurement 7.31 GiB. Heavy local build/test work finished before VM startup.
- Browser commits c7e17429 (startup) and 36939cdd (fresh CFT), clean tree
  35a1dc6d91b6680dad02eb20b6e5849b4991e38d, pushed to `codex/profile-manager-scope`; remote parity 0/0.
  Feature push has no technical-workflow trigger; main unchanged, no PR/merge/release or CI rerun.
- New combined installer built with the measured CFT archive metadata, not the old Cloak tuple:
  145149536 bytes; SHA-256 50e4866055572651e7557d47eb11c0ada7557871eb75618499376f4c6dd7d615;
  app.asar b36f3626a71c3514faae27533366ea9e95171588fef34327ed0be12f46acf828.
  Exact installer-directory packaged compatibility verifier 1/1 PASS (6.395 seconds, explicit fixture).
- Saved prior powered-off VM state as recoverable snapshot 687672aa-4669-43ac-b48e-4aede79c3ead.
  Restored clean Defender snapshot 326357d7; clean install 9/9 PASS, initial uninstall 15/15 PASS.
  Fresh-snapshot repair 13/13 PASS; post-repair uninstall 15/15 PASS, no remaining product/query
  processes, control listeners, product firewall rules or gate tasks. Data retained; VM shut down normally.
- Normal installed runtime observed through authenticated read-only MCP: CFT, engine status error,
  version null, no active-engine pin and no CFT runtime. First-run gate is confirmed BLOCKED.
- MKTTool postmerge CI 34171586969 SUCCESS and Railway deployment PASS; postmerge Relay executable
  intentionally SKIPPED, separately green on the exact PR merge tree.

## Scope changes and risks

- Fresh-default correction added to startup closeout: prevents selection of an unavailable licensed
  engine, preserves existing selections; does not provision a runtime or reopen identity research.
- Checklist granularity now exposes pre-existing release/network/operator/canary acceptance rather
  than treating compound implementation phases as complete. No acceptance requirement waived.
- Startup readiness defect CLOSED for the tested repaired-directory tuple; supported installed
  first-run dependency remains BLOCKED. Historical VM repair plan stays completed in its own scope.
- Storage blocker persists across sessions. Owner: organization owner. Unblock path: resolve shared
  storage/billing access, then verify the exact Browser hosted package and contract gates.
- Installed activation blocker owner: release implementation. Done: gated tuple signed/published,
  activated through supported update/repair, clean installed launch observed without overrides.
- Outstanding verification owner: main agent/test operator. Done: final repair/cleanup receipts,
  installed packaged-Relay lifecycle and page containment, operator/second-PC acceptance, actual
  seven-day canary. Prior fixture, proxy-probe, or skipped results cannot satisfy these tasks.

## Handoff

Main agent must finish the remaining implementation and acceptance checklist before closing this
plan. [Current report](report.md) and [owner handoff](owner-handoff.md) distinguish delivered
MKTTool Web/Relay surfaces from the blocked Browser technical candidate.

Unresolved owner action: obtain organization-owner storage/billing access or resolve its storage
limit. No additional owner choice is needed to finish independent local verification.
