---
phase: 6
title: "Run Canary Pilot and Issue GO-NO-GO"
status: pending
priority: P1
effort: "2 active days plus 7 calendar days soak"
dependencies: [5]
---

# Phase 6: Run Canary Pilot and Issue GO-NO-GO

## Overview

Run the supported package on a second Windows PC with disposable profiles and real static proxies,
then complete a bounded human-operated canary. Produce a GO only when network identity, input,
lifecycle, recovery, and operator gates remain green over time. Otherwise issue an exact NO-GO with
reproduction and rollback state.

## Context Links

- E:\MKTWorkspace\plans\260818-0915-first-operator-pilot-onboarding\plan.md
- E:\MKTWorkspace\plans\260816-0507-full-codebase-deep-audit\windows-release-gates-runbook.md
- E:\MKTWorkspace\MKTBrowser\README.md
- E:\MKTWorkspace\MKTTool\docs\development-roadmap.md

## Requirements

- Functional: use the signed compatible installer and documented setup path on the second PC.
- Functional: complete one real unit of manual browser work: open assigned profile, verify sanitized
  proxy match, log in under human control when approved, browse manually, close, and record outcome.
- Functional: exercise dead proxy, hard browser kill, Electron restart, Relay restart, Windows reboot,
  and one controlled power-loss/update gate where safe.
- Functional: run a seven-day soak with repeated launch/use/close cycles and no automated TikTok actions.
- Non-functional: disposable profiles and test account first. A real-account canary requires separate
  owner approval after technical GO.
- Non-functional: observer must record every hesitation and intervention; owner assistance cannot be
  hidden from the result.

## Architecture

This is an evidence phase, not a feature phase. It installs the frozen compatible set, executes the
same operator journey the product claims to support, injects bounded failures, and records only
sanitized metrics. The rollback artifact and revocation path stay ready throughout.

## File Inventory

| Action | Path | Purpose |
|---|---|---|
| Create during execution | E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\reports\canary-runbook.md | Exact ordered human and fault steps |
| Create during execution | E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\reports\canary-evidence.md | Run matrix, interventions, and sanitized metrics |
| Create during execution | E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\reports\p0-go-no-go.md | Signed verdict, blockers, rollback, residual risks |
| Modify after verdict | E:\MKTWorkspace\MKTTool\docs\development-roadmap.md | Current P0 status and open gates |
| Modify after verdict | E:\MKTWorkspace\MKTTool\docs\project-changelog.md | Verified milestone or blocker |
| Modify after verdict | E:\MKTWorkspace\MKTBrowser\README.md | Current supported package and approval boundary |
| Delete | None | Evidence remains append-only and sanitized |

## Tests Before

1. Verify every phase 1-5 checkbox and linked report.
2. Re-run all source, package, installer, and packaged-contract gates on frozen SHAs.
3. Verify rollback artifact hash, installer withdrawal behavior, Relay retirement path, and backups.
4. Confirm operator, device, profile, and proxy assignments before any secret is delivered.

## Implementation Steps

1. Write the canary runbook with stop conditions, owner interventions, evidence fields, and rollback.
2. On the second PC, remove only disposable prior test state owned by the canary after explicit target
   verification; never touch operational identities or profiles.
3. Install the frozen compatible package from the supported authenticated path.
4. Complete self-enrollment and recipient-sealed operator-key delivery without manual config.
5. Create or assign two disposable profiles, each with its own static proxy and deterministic fingerprint.
6. Run the complete MKTTool -> Relay -> Browser launch path and verify proxy, DNS, WebRTC, fingerprint,
   input, and close evidence.
7. Complete one manual login only when the owner is present. Human enters credentials, OTP, consent,
   and handles any checkpoint. Stop on CAPTCHA or unexpected security challenge.
8. Execute fault matrix: dead proxy, wrong active proxy, Browser hard kill, Electron restart, Relay
   restart, Windows reboot, and bounded recovery retry.
9. Run at least one controlled power-loss or update interruption exercise using disposable state and
   the existing Windows release-gate runbook.
10. Begin seven-day soak: at least two manual launch/use/close sessions per profile per day.
11. Record success rate, proxy-match result, input timeout count, unexplained exit count, recovery time,
    pending-lease age, interventions, and operator friction after every session.
12. A real-account canary may begin only after the disposable technical gate is green and the owner
    explicitly approves the account, proxy, machine, and rollback.
13. At day seven, issue GO or NO-GO. No partial or conditional GO hides an unclosed P0 gate.
14. Update living documentation to match the verdict; do not rewrite historical reports.

## Test Scenario Matrix

| Scenario | Expected |
|---|---|
| Clean second-PC setup | Ready without developer commands or config edits |
| Disposable manual login | Human-controlled, responsive, no credential capture |
| Normal daily close/reopen | Same profile identity and assigned proxy |
| Dead/wrong proxy | Launch blocked before usable session |
| Hard browser kill | Pending lease visible; deterministic recovery |
| Electron restart | Orphan/process/lease state reconciled |
| Relay restart | Reconnect and fresh ticket; no replay |
| Windows reboot | Installed ownership, identity, profile, proxy, and recovery survive |
| Update/power interruption | Rollback or convergence follows runbook |
| CAPTCHA/checkpoint | Stop and human handoff; no automated bypass |
| Operator hesitation | Recorded as friction, not silently assisted away |
| Real-account gate | Requires separate explicit owner approval |

## Dependency Map

- Requires every phase 1-5 gate.
- Completes remaining steps 5-6 of the first-operator pilot plan.
- A GO unblocks a fresh pre-MKB-04 baseline and later team-rollout planning.
- A NO-GO creates only blocker-specific follow-up work; automation remains parked.

## Tests After

- Final full source and package gates on the exact installed SHAs.
- Verify all retained evidence passes secret-redaction review.
- Verify rollback and device revocation once after the canary.
- Verify documentation claims match evidence and distinguish technical GO from real-account approval.

## Regression Gate

- Seven days, minimum 28 total manual sessions across two disposable profiles.
- 100% accepted sessions use the expected proxy route.
- Zero DNS/WebRTC bypass, proxy cross-wire, fingerprint cross-wire, or credential exposure.
- Zero unexplained input stalls or browser exits.
- Every injected lifecycle failure reaches a deterministic visible state and recovery path.
- Any failed metric produces NO-GO.

## Success Criteria

- [ ] Second operator completes setup and one real unit of manual browser work.
- [ ] Two profiles remain isolated across seven days and at least 28 sessions.
- [ ] All proxy, input, and lifecycle metrics meet the regression gate.
- [ ] Fault matrix and one interruption gate complete with rollback available.
- [ ] Operator friction and every owner intervention are recorded.
- [ ] GO or exact NO-GO report is issued.
- [ ] Real-account use remains separately approved and bounded.

## Risk Assessment

- A seven-day soak can be falsely green if the owner performs every action. Mitigation: second operator
  follows the guide; observer records interventions.
- Real proxies and accounts can incur reputation risk. Mitigation: disposable profiles first, manual
  browsing only, no posting/automation, explicit real-account approval.
- Installed state can drift from source. Mitigation: hash exact installer, Relay, Browser executable,
  and compatibility manifest before and after the canary.
- Power-loss testing can damage operational state. Mitigation: disposable roots, backup, verified
  target paths, and rollback rehearsal first.

## Security Considerations

- Never retain passwords, OTP, cookies, screenshots of sensitive pages, proxy credentials, raw IPs,
  license keys, tickets, or decrypted payloads.
- Revoke the canary device and rotate the operator key if the machine will not remain trusted.
- Do not expand allowed users, production accounts, or release distribution beyond the approved canary.
