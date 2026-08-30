---
phase: 8
title: "canary-and-promotion"
status: pending
priority: P1
effort: "7-day canary + 14-day cold-start observation"
dependencies: [1, 2, 3, 4, 5]
---

# Phase 8: canary-and-promotion

> **Historical predecessor promotion phase.** P4a Web is deployed and qualified separately; Browser
> P4b remains OPEN, while Lane C is CLOSED for the current product shape because there is no
> CloakBrowser channel. No canary or real-account promotion is implied by this retained phase.

## Overview

Promote only the lane whose prerequisites are actually closed, using an unchanged hash-bound
candidate, a named operator roster, measurable stop conditions, and a rehearsed rollback. Lane A
Web/Facebook may be promoted separately after its production/security gates; Browser real-account
promotion (Lane C) would additionally require the full Browser gate set from Phases 6 and 7, including
a `G2-IDENTITY` PASS. For this release Lane C is CLOSED because there is no CloakBrowser channel;
P4b's Browser tuple remains OPEN and no canary is scheduled. A future alternative-vendor product
decision would be required before reopening it.

## Requirements

> **Historical procedure notice (superseded 30 August 2026):** The canary, rollback, notification,
> and Lane C steps below describe a predecessor Browser promotion design. They are retained for
> traceability only. Current P4a Web is independently deployed/qualified; P4b remains OPEN, and
> Lane C is **CLOSED** because no CloakBrowser channel exists. No Browser canary, vendor request, or
> real-account promotion is scheduled by this file.

- Functional: a seven-day manual canary runs on the exact approved artifact with one profile/seat at
  a time and no unapproved automation; perform a cold-start/recovery check during the observation
  window (14 days if the team elects the full Browser lane).
- Functional: metrics, alert thresholds, stop conditions, incident owner, and rollback actions are
  defined before the first canary action.
- Functional: all operator training, setup copy, release notes, support/runbook, and escalation
  paths match the actual candidate and allowed boundary.
- Security: canary uses disposable/low-risk approved accounts only; no credentials/OTP/page content
  enter telemetry or evidence.
- Decision: issue separate Lane A and Lane C GO/NO-GO records; a Browser NO-GO does not get hidden by
  a Web PASS, and a Web PASS does not authorize Browser use.

## Architecture

```text
signed candidate + gate ledger
       -> Day 0 install/hash/network/recovery smoke
       -> Days 1–7 human manual canary + daily health/lease/route checks
       -> Day 7 owner review
       -> optional Days 8–14 cold-start/maintenance observation
       -> promote pointer OR stop/revoke/rollback
```

The release pointer is reversible and hash-bound. Rollback stops new tickets/leases, revokes the
candidate through the signed version manifest/denylist and compatibility floor (not merely by
changing the current R2 alias), restores the previous complete tuple, and communicates the incident
before any profile/account is reused.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `plans/260822-1038-mktbrowser-release-readiness-stabilization/phase-06-run-seven-day-canary-and-promote.md` | Reuse/refresh | Existing canary metrics, evidence, and rollback sequence. |
| `MKTTool/docs/internal-beta-release.md` | Modify | Operator steps, allowed lanes, exact hashes, and stop rules. |
| `MKTTool/docs/deployment-guide.md` | Modify | Deploy/rollback/backup commands and health checks. |
| `MKTTool/docs/development-roadmap.md` and changelog | Modify | Final gate status and deferred scope. |
| `MKTBrowser/README.md` and release notes | Modify | Candidate metadata, unsigned/signing status, one-seat/human boundary. |
| `MKTTool/src/lib/ops-alerts/*` and UI alert tray | Verify/extend | Health, backup, rate-limit, lease, replay, and route alerts. |
| `MKTTool/src/lib/release/*` and publisher/revocation scripts | Run/verify | Promote/revoke/rollback immutable release pointer. |
| `MKTBrowser/apps/desktop/src/main/compatibility-smoke-cli.ts` | Run | Daily managed lifecycle/route smoke where safe. |
| `plans/260829-2125-internal-product-readiness/reports/canary/` | Create | Daily sanitized metrics and decisions. |

## Implementation Steps

1. Before a Lane A canary, verify the signed Phase 4 manifest, Phase 5 production/security gates,
   code-signing/unsigned exception, and owner approvals. Before a Lane C canary, also verify all
   required Phase 6 gates and the Phase 7 identity decision. If Browser identity is OPEN/FAIL, Lane C
   cannot start. A separately approved Lane B technical demo may run only with synthetic/
   disposable data, one profile/seat, human actions, no real-account authorization, a visible
   “demo-only / identity unproven” banner, and no canary or broad distribution. Lane A remains an
   independent decision.
2. Define the canary cohort: named operators, one low-risk disposable/approved account per profile,
   one static proxy, one managed profile, one Relay device, allowed Web/Facebook/Browser actions,
   observation dates, support channel, and emergency contacts. Explicitly prohibit TikTok/Reddit
   automation, CAPTCHA/OTP automation, unattended posting, and credential sharing.
3. Day 0: install the exact candidate on the declared clean machine, verify installer/EXE/archive/
   app.asar/engine hashes, enroll/assign, run proxy/DNS/WebRTC and firewall checks, perform one
   human smoke, exercise close/restart and ticket replay, and confirm monitoring/rollback pointers.
4. Days 1–7: operators perform only documented human actions. Record daily counts/outcomes and
   bounded timings: managed launches, cross-wiring, proxy mismatch/direct egress/DNS/WebRTC leaks,
   lease/replay failures, crashes/recoveries, rate-limit warnings, backup freshness, healthcheck
   status, SmartScreen/signature prompts, and support incidents. Store aggregates, not page content
   or secrets.
5. Apply stop-the-line rules immediately for any cross-account/profile wire, direct egress or DNS/
   WebRTC leak, spent-ticket acceptance, unrecovered lease, secret/log leak, unauthorized action,
   identity regression, repeated health failure, or unexplained artifact/hash drift. Freeze new
   launches, preserve sanitized evidence, notify owners, and follow rollback.
6. Run a controlled cold-start/recovery check during the window: shutdown/restart, machine reboot,
   and the real disposable VM/host power-off/power-on plus second-PC check required by Lane C,
   without changing artifact or engine. Power-cycle evidence is mandatory for Lane C; if unavailable,
   stop/leave Browser C OPEN. Any change invalidates the canary and restarts the observation window.
7. Day 7 (and Day 14 when required), calculate metrics against approved thresholds. Recommended
   minimums from the predecessor plan: managed launch success ≥99% over at least 50 attempts,
   cross-wire = 0, direct egress/DNS/WebRTC leak = 0, unrecovered vendor lease = 0, replay acceptance
   = 0, profile recreation/secret leak = 0. The owner must approve exact denominators/thresholds
   before Day 0; do not retrofit them to a favorable result.
8. Hold a separate Lane A and Lane C review. Record PASS/FAIL/OPEN/BLOCKED, residual risks, support
   readiness, and signatories. Promote an immutable versioned pointer only for a lane whose full exit
   criteria pass; keep the other pointer/denylist state revoked or demo-only. A manifest signature,
   by itself, is not an EXE signature or a Browser identity PASS.
9. If promoting, publish release notes/training, update roadmap/changelog/README/setup copy with
   exact hashes and gate dates, enable alerts/on-call, and schedule periodic revalidation (engine,
   proxy, vendor, dependency, backup, and rate-limit).
10. If stopping or rolling back: stop issuing tickets/leases, revoke candidate downloads, redeploy
    the prior Railway tuple with `railway status` then `railway up --service mkttool-web`, restore DB
    only under the approved runbook, quarantine affected profiles/accounts, notify operators, and
    open a post-incident action. Never overwrite an immutable Relay object.

## Test Scenario Matrix

| ID | Scenario | Method | Expected result | Evidence |
|---|---|---|---|---|
| P8-01 | Day-0 exact candidate | Hash/clean install/recovery smoke | All inputs equal signed manifest | Day-0 record |
| P8-02 | Human manual operation | Named operators, documented actions | No unapproved automation or secret capture | Attestation/aggregates |
| P8-03 | Managed launch reliability | ≥50 attempts over canary | Meets approved success threshold (recommended ≥99%) | Daily metrics |
| P8-04 | Isolation safety | Cross-profile/account/proxy checks | Cross-wire = 0; invariant holds | Daily metrics |
| P8-05 | Network containment | At least 3 egress/DNS/WebRTC probes/profile, as defined in P6 | 0 IP/country/ASN mismatches, 0 unapproved DNS/DoH leaks, 0 disallowed WebRTC candidates; any leak stops canary | Network metrics |
| P8-06 | Ticket/lease durability | Replay/restart/crash/cold-start checks | Spent replay = 0; unrecovered lease = 0 | Recovery metrics |
| P8-07 | Production health | Railway health, backups, rate-limit/alerts | No unexplained failures; alerts actionable | Ops dashboard |
| P8-08 | Artifact drift | Daily manifest/hash check | Any drift stops promotion and invalidates window | Hash log |
| P8-09 | Rollback drill/incident | Disposable rollback or stop simulation | Tickets stop, pointer revokes, prior tuple restores | Drill report |
| P8-10 | Final decision | Separate Lane A/C review | Signed lane-specific GO/NO-GO; open gates remain visible | Decision record |

### Canary ownership and escalation

| Work item | Primary owner | Evidence reviewer | Due/expiry | Stop/escalation SLA |
|---|---|---|---|---|
| Day-0 install/recovery | Operations Owner | Release Owner | Fill in | Immediate stop on mismatch |
| Human actions | Operator Lead | Security Owner | Fill in | Immediate stop on bypass/secret event |
| Network/route checks | Network Owner | Security Owner | Daily | Stop on any leak/mismatch |
| Vendor/lease/replay | Relay/Vendor Owner | Security Owner | Daily | Stop on one unrecovered lease/replay |
| Railway/backup/auth alerts | Web/SRE Owner | Release Owner | Daily | Stop on health/backup/auth regression |
| Final GO/NO-GO | Product Owner | Security + Release | Day 7/14 | No silent extension; document new expiry |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| Canary manifest | Immutable candidate ID, cohort, dates, thresholds, owner, and rollback tuple. |
| Metrics schema | Aggregates only; counts/timings/statuses; no secrets, tickets, cookies, URLs, or page content. |
| Alerting | Health, backup, rate-limit/IP, lease, replay, route, and artifact-drift alerts have owners. |
| Stop procedure | One command/runbook path freezes launches and preserves safe evidence. |
| Promotion pointer | Points only to signed, hash-verified candidate; revocation is observable. |
| Rollback | Restores complete source/DB/Relay/Browser/engine/deployment tuple without overwrite. |
| Operator boundary | Human login/input; no CAPTCHA/OTP/credential automation or unattended posting. |
| Documentation | Setup, README, roadmap, changelog, release notes, and training agree with gate status. |
| Decision record | Lane A and Lane C have independent approvers and residual-risk statements. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| Phases 1–5 | P1–P5 → P8-A/P8-C | Candidate/provenance/production controls must be stable. |
| Phase 6 | P6 → P8-C | Real network/vendor/human/recovery/second-PC evidence is required for Browser Lane C. |
| Phase 7 | P7 → P8-C | Browser real-account lane requires identity PASS. |
| Named operators/accounts/proxies | External → P8 | Canary cannot be inferred from automated tests. |
| Monitoring/on-call/rollback | External → P8 | Safe promotion needs response capability. |
| P8 decision | P8 → roadmap/release | Only signed lane-specific GO changes rollout status. |

## Success Criteria

- [ ] Day-0 exact candidate smoke and monitoring checks pass.
- [ ] Seven-day unchanged manual canary (and required cold-start/14-day window) meets predeclared
  thresholds with zero stop-condition events.
- [ ] No secret, credential, ticket, cookie, page-content, cross-wire, direct-network, or replay
  incident occurred.
- [ ] Rollback/stop procedure is exercised and owner/on-call roster is ready.
- [ ] Lane A and Lane C receive separate signed GO/NO-GO decisions; Browser C remains blocked if any
  identity/vendor/network/human/power-cycle gate is open, while any Lane B demo is visibly demo-only.
- [ ] EXE Authenticode or the named/expiring internal-only unsigned exception is approved; a signed
  manifest is not accepted as a substitute.
- [ ] Release notes, setup copy, README, roadmap, changelog, alerts, and training match the exact
  promoted tuple and retained deferred scope.

## Risk Assessment

- **Canary hides rare failures:** seven days or 50 attempts may not expose tail behavior. Mitigate
  with cold-start/power-cycle checks, daily aggregates, and a 14-day observation when Browser risk
  warrants it.
- **Operator bypass:** pressure leads to direct launch, shared credentials, or unattended actions.
  Mitigate with one-seat controls, training, audit alerts, and immediate stop rules.
- **Artifact drift:** updater/manual replacement changes bytes mid-canary. Mitigate with daily hash
  attestation and no updater/engine changes during the window.
- **Rollback data mismatch:** prior binary cannot read migrated schema or profile state. Mitigate with
  the Phase 5 backup/restore and Phase 4 rollback drill.
- **Lane confusion:** Web PASS is reported as whole-product PASS. Mitigate with separate pointers,
  signoffs, and explicit lane names in every report.
- **Identity regression after promotion:** vendor/engine updates alter surfaces. Mitigate with a
  scheduled external identity remeasurement and automatic Browser stop on regression.
