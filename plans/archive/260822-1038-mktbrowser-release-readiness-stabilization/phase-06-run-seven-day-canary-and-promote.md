---
phase: 6
title: "Run Seven Day Canary and Promote"
status: pending
priority: P1
effort: "7 calendar days plus 1 day review"
dependencies: [5]
---

# Phase 6: Run Seven Day Canary and Promote

## Overview

Run a controlled seven-day canary with the exact verified artifact that passed Phase 5, then issue an
explicit GO or NO-GO. The canary is manual operator use, not automation expansion. A new build, config
change, dependency update, or Relay update resets the canary unless the owner
accepts a narrowly documented exception.

## Requirements

- Start with one owner/operator and at most one additional operator on the proven two-PC topology.
- Use disposable/low-risk profiles first. Real-account use requires separate explicit owner approval.
- No silent auto-update. Artifact hash remains constant for all seven days.
- Daily health review covers launches, proxy identity, input, lease recovery, crashes, reboots, and
  operator friction.
- Stop immediately on identity cross-wire, direct egress, secret exposure, an installer hash that
  does not match the published value,
  unrecoverable profile damage, or vendor seat state that cannot be reconciled.
- Promotion updates compatibility/release pointers only after a recorded GO and explicit publish approval.

## Canary Metrics

| Metric | Target |
|---|---|
| Managed launch success | >= 99% across at least 50 attempts, excluding intentional fail-closed blocks |
| Identity/proxy cross-wire | 0 |
| Direct egress or DNS/WebRTC leak | 0 |
| Unrecovered vendor seat beyond defined recovery window | 0 |
| Browser/Relay crash requiring profile recreation | 0 |
| Installer warning beyond the SmartScreen notice onboarding already described | 0 |
| Manual config/key/token handling by operator | 0 |
| Critical operator-blocking issue | 0 open at end |

Measure success from operation records, not self-reported memory. A blocked unsafe launch is a safety
success and must be classified separately from an unexpected launch failure.

## Evidence Inventory

| Action | Path | Purpose |
|---|---|---|
| Update | `E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\phase-06-run-canary-pilot-and-issue-go-no-go.md` | Authoritative daily log and verdict |
| Create | P0 plan-scoped daily sanitized canary records | Operations, incidents, recovery, operator notes |
| Update | `E:\MKTWorkspace\MKTTool\docs\development-roadmap.md` | Current rollout status |
| Update | `E:\MKTWorkspace\MKTTool\docs\project-changelog.md` | Candidate/promotion or NO-GO result |
| Update | `E:\MKTWorkspace\MKTBrowser\README.md` | Distribution status and verified artifact metadata |
| Conditional | Compatibility manifest/release pointer sources | Promote only after explicit authorization |

## Interface Checklist

- [ ] Daily record binds Browser/installer/Relay hashes and operator/PC labels.
- [ ] Incident codes distinguish unsafe block, expected vendor refusal, product defect, and environment fault.
- [ ] Rollback can withdraw the candidate without deleting profiles or operator data.
- [ ] Compatibility manifest refuses older/vulnerable Browser or Relay artifacts after promotion.
- [ ] Promotion script verifies the exact canary hash and cannot accept a rebuilt look-alike.

## Implementation Steps

1. Freeze canary roster, artifact hashes, compatible Relay floor, start/end time, daily operating
   scenarios, metrics, stop conditions, rollback pointer, and incident owner.
2. Day 0: install/upgrade on canary PCs, verify the artifact hash against the published value, run baseline network,
   launch, close, recovery, and reboot smoke.
3. Days 1-7: perform representative manual browsing work. Include cold launch, warm reopen, concurrent
   profile use within measured capacity, normal close, at least one reboot, and one controlled recovery.
4. Review sanitized operational records daily. Investigate every unexpected failure before further use;
   do not rerun until green without classifying root cause.
5. If a stop condition fires, freeze use, preserve bounded evidence, withdraw/disable promotion paths,
   execute rollback, and issue NO-GO with exact remediation.
6. At the end, reconcile metrics and open incidents. Require zero unresolved critical/high identity,
   network, lease, recovery, signing, or data-integrity issue.
7. Issue a GO/NO-GO record. GO names exact installer SHA-256, source/tree, Relay hash,
   supported topology, known limitations, and rollback procedure.
8. Only after explicit owner authorization: publish/promote the retained artifact, update the signed
   compatibility manifest/download pointer, and verify retrieval hash from the operator path.

## Test Scenario Matrix

| Priority | Scenario | Expected result |
|---|---|---|
| Critical | Identity/proxy mismatch detected | Immediate stop and NO-GO; no further account use |
| Critical | Candidate withdrawal/rollback | Operators return to approved prior state; profiles preserved |
| Critical | Published download differs from canary hash | Promotion fails and pointer remains unchanged |
| High | Daily cold/warm/concurrent launch | Metrics recorded; no unexplained failure or seat leak |
| High | Reboot and controlled recovery during canary | Same deterministic recovery proven in Phase 5 |
| Medium | Operator encounters setup/readiness block | Message gives correct action; incident classified |

## Success Criteria

- [ ] Seven full calendar days complete on one unchanged verified candidate.
- [ ] All canary metrics meet targets and no stop condition occurs.
- [ ] Rollback/withdrawal path is rehearsed against the exact candidate.
- [ ] GO/NO-GO record names exact hashes, supported scope, limitations, and unresolved defects.
- [ ] Broad promotion occurs only after explicit owner authorization and post-publish hash verification.

## Risk Assessment

- Low activity can produce a misleading pass. Mitigation: predefined daily scenario minimums.
- Operators may normalize intermittent failures. Mitigation: every unexpected failure is an incident;
  green rerun does not erase it.
- A post-canary rebuild invalidates evidence. Mitigation: promote only the exact retained hash.

## Security Considerations

Canary logs must not contain credentials, cookies, content, proxy endpoints, raw IPs, tickets, or
license keys. Release promotion rests on the existing signed compatibility-manifest authority and on
the published installer SHA-256. V1 ships unsigned by owner decision, so nothing in the file itself
identifies the publisher, and the promotion record must say which artifact hash was promoted rather
than which publisher signed it.

## Next Step

After GO, continue Phase 7 in small PRs while preserving all release gates.
