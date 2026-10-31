---
phase: 6
title: "real-environment-gates"
status: closed
priority: P0
effort: "5–10 days plus vendor/network scheduling"
dependencies: [1, 3, 4, 5]
---

# Phase 6: real-environment-gates

> **Historical predecessor phase — not an active vendor wait.** The successor U6 decision closed the
> custom-engine track and Lane C because no CloakBrowser channel exists. Preserve the evidence below,
> but do not schedule a vendor run or infer a pending date.

## Current disposition — CLOSED (30 August 2026)

P4a Lane A Web is independent and deployed; P4b's Browser five-artifact tuple remains **OPEN**. Q16
confirms there is no CloakBrowser channel, so **Lane C is CLOSED**: no vendor request, entitlement,
proxy booking, second-PC booking, power-cycle run, date, or waiting state exists for this release.
The implementation, matrix, and success-criteria sections below are retained as historical
reopen-only procedure and must not be executed without a new product decision.

## Overview

**Historical entry gate (reopen-only): do not start this phase until Phase 7 Stage A has reported and
the engine pin is frozen.** This was the most expensive phase in the predecessor plan (vendor lease, two disposable proxy pairs,
operator time, power-cycle host, clean second PC), and Phase 7 step 6 invalidates every result here
whenever the engine pin changes. Stage A needs only the P3 installer and one host, so it always runs
first. If Stage A returns *repin-needed*, rebuild through P3/P4 and re-run Stage A before booking any
resource for this phase. If Stage A returns *no-chance*, run only the subset of gates that Lane A/B
still needed in that predecessor design; do not spend a vendor lease or second PC on a Lane C
candidate that cannot ship.

The predecessor design sought to close gates that software tests cannot prove: packaged Windows
behavior on disposable machines, human-controlled first input/login, independent static-proxy
egress/DNS/WebRTC containment, live vendor/license lifecycle, crash/reboot/power-loss recovery, and a
clean second PC. If a future decision reopens the phase, it would use the exact Phase 4 candidate;
only an explicitly approved disposable/sandbox account may be used for G1, and all production/high-
value Browser accounts remain out of scope until the reopened phase and Phase 7 pass.

## Requirements

- Functional: prove the invariant `1 account = 1 static proxy = 1 managed profile = 1 assigned Relay
  device` through setup, launch, recovery, and teardown.
- Functional: prove the packaged candidate, not a source tree or CFT fixture, survives install,
  repair, uninstall, close, crash, restart, reboot, and real power-cycle scenarios.
- Functional: demonstrate proxy egress, DNS path, WebRTC/UDP containment, and firewall fail-closed
  behavior with at least two disposable static proxy/profile pairs.
- Human/vendor: first login, focus, typing, Google/OTP/CAPTCHA handling, and vendor lease truth are
  performed/attested by the responsible human/vendor using an approved disposable/sandbox test
  account owned by the team. Production/high-value accounts are prohibited; no credential or OTP
  automation. If no disposable account is available, run focus/typing only and leave the login gate
  OPEN rather than weakening this requirement.
- Operational: repeat setup on a clean second Windows PC/VM with no Node install, manual JSON/key
  copying, or hidden host state.
- Evidence: sanitized labels and hashes only; skipped or unavailable external gates remain OPEN.

## Architecture

```text
Candidate manifest
   -> PC A / clean snapshot: install -> enroll -> proxy/DNS/WebRTC -> human smoke
   -> vendor lease/heartbeat/end/refusal -> close/crash/restart/reboot/power-cycle
   -> reset PC B: install -> device assignment -> managed launch -> repeat smoke
   -> compare evidence, revoke disposable resources, owner decision
```

Run gates in this order so a failed cheap gate stops expensive or risky work. PC A and PC B must be
identified by disposable labels, not personal identifiers. The CFT packaged verifier may support
contract/lifecycle checks but cannot close the licensed-engine identity gate.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md` | Read/use | G1/G2/G3/G4 definitions, evidence schema, and invalidation rules. |
| `plans/260822-1038-mktbrowser-release-readiness-stabilization/phase-05-complete-real-environment-and-recovery-gates.md` | Reuse/repair | Detailed sequence and historical caveats; old contradictory checkboxes must not be copied. |
| `plans/260822-1038-mktbrowser-release-readiness-stabilization/phase-06-run-seven-day-canary-and-promote.md` | Reuse | Canary metrics and rollback expectations. |
| `MKTBrowser/apps/desktop/scripts/package-windows-quality-gates.test.cjs` | Run | Automated package/lifecycle prerequisites. |
| `MKTBrowser/apps/desktop/scripts/windows-firewall-installer.test.cjs` | Run/live | Firewall install/remove and fail-closed behavior. |
| `MKTBrowser/apps/desktop/scripts/windows-installer-ownership-fixtures.test.cjs` | Run/live | Ownership/race fixtures on Windows machine. |
| `MKTBrowser/apps/desktop/src/main/compatibility-smoke-cli.ts` | Run/extend | Managed launch, cookie, proxy egress, and close smoke. |
| `MKTBrowser/apps/desktop/src/main/ChromiumBootstrap.ts` and `src/main/index.ts` | Verify | Engine pin, managed launch, and direct/unpinned fallback boundaries. |
| `MKTTool/src/app/api/accounts/[id]/launch/route.ts` and `src/lib/relay/*` | Run/verify | Server ticket, recipient, readiness, and device ownership checks. |
| `MKTTool/scripts/smoke-test-mkt-browser-correct-proxy.ts` | Run/extend | Correct-proxy and fail-closed probes. |
| `MKTTool/relay/src/*` and Phase 2 restart harness | Run | Replay/recovery on the exact extracted Relay. |
| `plans/260829-2125-internal-product-readiness/reports/real-environment-evidence/` | Create | Sanitized per-machine/per-gate evidence bundle. |

## Historical implementation steps (only if a new product decision reopens Browser gates)

1. Provision two disposable static proxy/profile pairs and one vendor test entitlement. Record only
   labels, country/ASN, route ownership, bounded timing, and cleanup plan. Confirm the vendor permits
   one active seat/profile for the test; do not use real team accounts.
2. Verify the Phase 4 candidate manifest and hashes on PC A before install. Reset to a clean snapshot,
   verify Windows x64 prerequisites, capture installer hash, and ensure no prior MKT Browser/Relay
   process, profile, key, or Node environment can affect the run.
3. Execute G0/G1 setup: install, launch, enroll the Relay device, assign one profile/proxy, and have
   a human operator perform first focus/typing/navigation/login. Google credentials, OTP, CAPTCHA,
   and recovery prompts remain human-controlled. Capture only event types/outcomes, not values.
4. Execute G2 network checks for each disposable pair with predeclared quantitative acceptance:
   at least three consecutive external and in-browser egress probes per profile must match the
   assigned static IP/country/ASN (0 mismatches); at least three DNS/DoH probes must use the approved
   resolver/path (0 local or unapproved leaks); and at least three WebRTC/UDP probes must expose zero
   disallowed host/public candidates. A proxy/firewall fault, direct launch, wrong proxy, stale
   profile, or route mismatch must block launch and produce a fail-closed result. Record the exact
   probe tools, timeout bounds, resolver policy, and owner-approved tolerances before running.
5. Execute G3 vendor lifecycle: lease start, heartbeat, normal end, duplicate/refused second seat,
   cooldown, network interruption, process termination, and re-enrollment. Compare local status to
   vendor truth; no “healthy” result is inferred from a local timer.
6. Execute recovery on the exact same candidate: close, crash/forced termination, Relay restart,
   machine reboot, and a real disposable VM/host power-off/power-on. The real power-cycle is a hard
   G3-RECOVERY requirement for Lane C; if the environment cannot provide durable power-off/on
   evidence, mark the gate OPEN/BLOCKED and do not promote Browser real-account use. Re-run the
   spent-ticket replay scenario and assert journal/lease state is durable and bounded. A previous
   v15 or different EXE result cannot be reused.
7. Reset clean PC B (or the approved second disposable Windows machine). Install from the published
   installer only; do not install Node, copy `.env`, paste JSON/keys, or borrow profile directories.
   Have an unfamiliar operator repeat enrollment, assignment, managed launch, one human smoke, and
   teardown.
8. Perform repair/uninstall and residue checks on both machines: expected files/registry/firewall
   state, no orphan Relay/Browser process, no cross-profile data, and no secrets in logs/temp/R2.
9. Reconcile all evidence against the candidate manifest. Mark G0-PAIRS, G1, G2-network, G3-license, G3-
   recovery, and G4 individually. Any missing vendor/network/human/second-PC proof stays OPEN and
   blocks Browser real-account use; do not collapse them into one “smoke passed” checkbox.
10. Revoke disposable vendor leases/profiles/proxies, archive sanitized evidence, and obtain the
    operator, network, vendor, and security signoffs. Hand the exact tuple and remaining identity
    decision to Phase 7.

## Historical test scenario matrix (reopen-only)

| ID | Scenario | Owner/method | Expected result | Evidence |
|---|---|---|---|---|
| P6-01 | Candidate integrity | Automated on PC A/B | Installer/EXE/archive/app.asar/engine hashes match manifest | Hash sheet |
| P6-02 | Clean install/first run | VM snapshot + operator | Install and enrollment complete with no manual secrets/Node | Install record |
| P6-03 | Human input/login | Human operator using approved disposable/sandbox account | Focus/typing/Google/OTP flow completes with no automation; otherwise OPEN | Human attestation |
| P6-04 | Proxy egress | Network provider + 3 consecutive probes/profile | 0 IP/country/ASN mismatches between browser and assigned route | Network record |
| P6-05 | DNS/DoH path | Network provider + 3 resolver probes/profile | 0 local/unapproved DNS or DoH leaks; route matches policy | DNS record |
| P6-06 | WebRTC/UDP | Browser/network probes + firewall fault, 3 runs/profile | 0 disallowed host/public candidates; any leak blocks | WebRTC/firewall record |
| P6-07 | Fail-closed mismatch | Automated fixtures | Wrong/direct/stale proxy cannot launch successfully | Test log |
| P6-08 | Vendor lease | Vendor + operator | Start/heartbeat/end/refusal/cooldown match vendor truth | Vendor attestation |
| P6-09 | Relay restart replay | Exact candidate harness | Spent ticket rejects after restart; fresh ticket succeeds | Replay JSON |
| P6-10 | Crash/reboot/power-cycle | Disposable VM/host + operator | State recovers within bounded contract; real power-cycle evidence is mandatory for Lane C | Recovery report |
| P6-11 | Second PC | Unfamiliar operator on clean PC B | No Node/manual key/config copy; same managed contract | PC B report |
| P6-12 | Repair/uninstall | Clean VM | No orphan process, secret, profile, or firewall residue | Lifecycle report |
| P6-13 | Evidence sanitization | Security review | No credentials/tickets/cookies/proxy URLs/page content | Secret scan |

### Gate owner/deadline record

| Gate | Primary owner | Network/vendor/operator dependency | Evidence reviewer | Due/SLA | Escalation |
|---|---|---|---|---|---|
| G0-PAIRS | Release Owner | Two disposable pairs | Security Owner | Fill in | Fill in |
| G1 human input | Operator Lead | Named human + disposable account | Security Owner | Fill in | Fill in |
| G2 network | Network Owner | Provider/probe availability | Security Owner | Fill in | Fill in |
| G3 license/recovery | Relay/Vendor Owner | Live vendor entitlement + power-cycle host | Security Owner | Fill in | Fill in |
| G4 second PC | Operations Owner | Independent clean PC/VM | Release Owner | Fill in | Fill in |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| Enrollment/device ownership | Admin grant, recipient binding, and one-device invariant are enforced. |
| Managed launch | Only MKTTool-issued ticket through Relay can launch; direct/raw CDP/page paths remain blocked. |
| Proxy binding | Profile cannot launch with missing, changed, or mismatched static proxy. |
| Firewall containment | Installer owns required elevation; removal/failure blocks proxied launch. |
| Vendor lease | Local state reflects start/heartbeat/end/refusal/cooldown and handles interruption. |
| Replay guard | Exact candidate persists spent tickets through restart/power loss. |
| Human boundary | No credential/OTP/CAPTCHA automation; operator attestation is recorded. |
| Clean-PC setup | No Node, `.env`, manual JSON/key, or hidden host state required. |
| Evidence contract | Labels/hashes/timing only; redaction and cleanup are verified. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| Phase 3 installer | P3 → P6 | The test must use the exact published candidate. |
| Phase 4 signed manifest | P4 → P6 | Hash/provenance and skipped-gate semantics are fixed. |
| Phase 5 production | P5 → P6 | Ticket/auth/entitlement behavior must match production policy. |
| Phase 7 Stage A | P7a → P6 | Engine pin must be frozen before expensive environment resources are booked; a repin invalidates every gate here. Stage B still runs after P6. |
| Disposable proxies/vendor entitlement | External → P6 | Unit tests cannot prove real network or vendor gates. |
| PC A/PC B clean environments | External → P6 | Second-PC and power-cycle evidence require independent state. |
| P6 evidence | P6 → P7/P8 | Identity and canary cannot start from an untrusted operational baseline. |

## Historical success criteria (not current release)

- [ ] Phase 7 Stage A reported before any resource here was booked, and the engine pin is frozen.
- [ ] Two disposable static proxy/profile pairs and vendor entitlement are identified and cleaned up.
- [ ] Exact candidate passes clean install, human first input, egress/DNS/WebRTC, firewall, vendor,
  restart/crash/reboot/power-cycle, repair/uninstall, and second-PC checks.
- [ ] G0-PAIRS, G1, G2-network, G3-license, G3-recovery, and G4 statuses have independent owner evidence;
  skipped/open gates remain open.
- [ ] Only an approved disposable/sandbox test account was used for human login (or login remains
  OPEN); no production/high-value account, credential capture, OTP automation, or unattended action.
- [ ] Lane C has real power-off/power-on evidence; lack of it is OPEN/BLOCKED, never a waived reboot.
- [ ] Sanitized evidence is hash-bound to the Phase 4 manifest and accepted by operator/network/
  vendor/security owners.

## Risk Assessment

- **False network confidence:** server-side proxy probe differs from in-browser route. Mitigate with
  independent egress/DNS/WebRTC checks and provider attestation.
- **Human evidence contamination:** credentials or OTPs enter logs/screenshots. Mitigate with human
  attestation, event-only records, and immediate redaction/retention review.
- **Vendor simulation:** local cooldown/state is mistaken for vendor truth. Mitigate with live vendor
  lease/refusal evidence and one-seat test entitlement.
- **Host residue:** second-PC run inherits profiles/keys/processes. Mitigate with reset snapshots,
  residue checks, and no manual copy.
- **Recovery gap:** VM reboot passes but real power loss does not. Mitigate with the declared real
  power-cycle gate and keep G3-RECOVERY OPEN when unavailable.
- **Evidence invalidation:** a later engine/payload/config change makes results stale. Mitigate with
  tuple comparison and automatic downstream re-run requirement.
