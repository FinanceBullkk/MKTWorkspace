---
phase: 7
title: "identity-engine-decision"
status: closed
priority: P0
effort: "Closed 30 August 2026; future alternative-vendor work requires a new product decision"
dependencies: [1, 3]
---

# Phase 7: identity-engine-decision

> **Historical identity phase — superseded by Q16 closure.** The recorded collisions remain
> `G2-IDENTITY=FAIL`; however, no CloakBrowser channel exists, so Lane C is CLOSED and no vendor
> request, owner/SLA, or date is pending. Alternative vendors require a new product decision.

## Overview

Resolve `G2-IDENTITY` as an independent product gate. The current stable CloakBrowser
151.0.7922.108.2 evidence shows cross-profile collisions in fonts/audio/WebGL, while Preview `.3`
was only a partial improvement and was not promoted. A local hash, JavaScript masking, CFT fixture,
or managed-lifecycle PASS cannot close this gate.

### Two stages, deliberately split

This phase runs in two stages because the measurement is cheap and the environment work around it is
not. Step 6 below invalidates P3, P4, P5-deployment, and P6 whenever the engine pin changes; running
the full P6 gate set first would mean burning 5–10 days of vendor lease, disposable proxies, operator
time, power-cycle hosts, and a second PC only to re-run them after a repin.

| Stage | Runs when | Needs | Question it answers |
|---|---|---|---|
| **A — early probe** | Immediately after P3, in parallel with P4 | The P3 installer, 2–3 disposable profiles, one host, an external measurement harness | Is the engine pin final? Does identity have any chance of PASS? |
| **B — decision** | After P6, once the operational baseline is clean | Stage A result, P6 evidence, vendor confirmation, owner thresholds | Is `G2-IDENTITY` PASS, and may Lane C be promoted? |

**Stage A needs no vendor lease, no second PC, no power-cycle host, and no real accounts.** P6 must
not begin until Stage A has reported, because Stage A is what tells the team whether the candidate
about to be tested is the candidate that will ship.

Stage A cannot by itself close `G2-IDENTITY` — a one-host probe does not remove host/route
confounders. It exists to fail fast and to freeze the engine pin. Stage B is the gate of record.

### The vendor is the only lever (historical design)

`G2-IDENTITY` is FAIL on the licensed engine. The custom Chromium engine is out of scope (HOLD).
Preview `.3` was measured and not promoted. Therefore **no task in Phases 1–8 can change the identity
outcome** — this phase could only have re-measured what the vendor already ships. The old
"blocked/waiting on vendor" wording is historical; Q16 closes Lane C because no channel exists.

## Requirements

> **Historical procedure notice (superseded 30 August 2026):** The vendor-request, SLA, and
> measurement procedures below are retained as the predecessor design and evidence vocabulary.
> Q16 is the final current decision: there is **no CloakBrowser channel**, no request is sent, and
> Lane C is **CLOSED** for this product shape. Do not execute step 0, schedule a vendor response, or
> describe the lane as waiting/blocked. A future alternative-vendor proposal requires a new product
> decision; the current state is recorded in the successor P6/P7 handoffs.

- Functional: externally measure the exact licensed native engine installed by the candidate across
  the identity surfaces the product claims to isolate (at minimum fonts, audio, WebGL, screen/UA
  coherence, and repeatability).
- Functional: use multiple disposable profiles and independent routes on the same host, then repeat
  enough runs to distinguish stable per-profile behavior from random noise or host-wide collisions.
- Functional: record engine version, binary SHA, license/channel, flags, host, profile labels, and
  measurement tool/version; no raw account/cookie/content data.
- Decision: either approve a native engine/pin that meets owner-approved thresholds, or explicitly
  keep Browser real-account Lane C closed and maintain truthful controlled-beta copy.
- Vendor (historical requirement): an open, owned request to CloakBrowser for a build that isolates
  the failing surfaces would have been a tracked deliverable. Q16 supersedes this: no channel exists,
  no request/owner/SLA/date is pending, and Lane C is CLOSED.
- Boundary: custom Chromium builds remain isolated experiments subject to RAM/disk/VM/toolchain
  gates; they cannot be promoted or used to bypass vendor/license review in this plan.

## Architecture

```text
licensed native engine pin + exact installer
       -> external measurement harness (no JS masking)
       -> profile A/B/C repeated surfaces
       -> collision/coherence/repeatability analysis
       -> owner threshold decision
          ├─ PASS: repin/rebuild candidate, invalidate downstream evidence, rerun P3/P6
          └─ FAIL/OPEN (historical): Browser demo/controlled beta only; the old plan called Lane C
            blocked. Q16 supersedes that wording: Lane C is **CLOSED** because no CloakBrowser
            channel exists.
```

Keep three evidence classes separate:

1. Packaged contract/CFT evidence proves app/MCP/profile lifecycle.
2. Licensed engine evidence proves the binary is the intended vendor build and is externally
   measured.
3. Identity evidence proves the approved cross-profile thresholds. Only class 3 can close G2.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `MKTBrowser/apps/desktop/windows-engine-release.json` | Verify/modify after PASS | Stable licensed engine version/SHA/channel and verification date. |
| `MKTBrowser/apps/desktop/src/main/ChromiumBootstrap.ts` | Verify/modify | Pinned checksum, atomic install, license and fallback behavior. |
| `MKTBrowser/apps/desktop/src/main/index.ts` | Verify | Packaged pin enforcement; unpinned/CFT fallback must remain dev/compatibility-only. |
| `MKTBrowser/scripts/system-chrome-engine-fixture.cjs` | Run/label | CFT compatibility fixture; never identity evidence. |
| `MKTBrowser/scripts/verify-packaged-runtime-contract.cjs` | Run/label | Package lifecycle and provenance only. |
| `MKTBrowser/apps/desktop/src/main/compatibility-smoke-cli.ts` | Run | Controlled proxy/launch smoke, not uniqueness proof. |
| `MKTBrowser/packages/profile-manager/src/fingerprint.ts` | Verify/limit claims | Coherent profile generation; do not treat it as native surface isolation. |
| `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md` | Update from evidence | G2-IDENTITY status and invalidation record. |
| `plans/260821-1925-antidetect-browser-proxy-p0/reports/fingerprint-isolation-preview-151-0-7922-108-3-20260828.md` | Reference | Preview partial result; not a promotion certificate. |
| `plans/260828-0428-chromium-fingerprint-engine/*` | Keep isolated | Experimental engine feasibility/build gates; no production shortcut. |
| `plans/260829-2125-internal-product-readiness/reports/identity-measurement.md` | Create | Sanitized measurements and decision record. |

## Implementation Steps

0. **(Historical; do not execute under Q16.)** The predecessor plan said to open the vendor track and
   send CloakBrowser the sanitized
   27 August collision evidence and ask a specific question: does or will a licensed build isolate
   fonts, `OfflineAudioContext`, and WebGL per profile on one host, and on what channel/date? Record
   owner, request date, response SLA, and answer in the gate ledger. If the answer is "no" or "no
   date", Lane C is closed for this release and the plan must say so instead of estimating it. This
   step has the longest lead time in the whole plan and gates nothing else. Q16 records that no such
   channel exists, so no request is sent and Lane C is CLOSED.

**Stage A — early probe (after P3, parallel with P4; no vendor lease, no second PC, no real accounts).**

1. Freeze the exact Phase 3 installer and extract/verify the licensed engine binary, `current.json`,
   version, SHA, channel, license evidence, and launch flags. Fail the run if it silently switches to
   system Chrome/CFT or permits an unpinned packaged engine.
2. Obtain owner approval for quantitative thresholds before measuring. At minimum require stable
   per-profile results across repeated runs, no identical full-surface tuple across approved
   profiles, coherent UA/screen/locale relationships, and no unacceptable cross-profile collision.
   Document sample size, tolerances, and what constitutes a statistical/operational fail; do not
   invent a “90% local score” as a release criterion.
3. Prepare at least two (preferably three) disposable profiles with distinct static proxy labels,
   fixed host conditions, and no real accounts. Run sequential and interleaved sessions using an
   external measurement service/harness. Collect fonts, `OfflineAudioContext`, WebGL, screen/UA,
   timezone/locale, TLS/network context where available, and repeatability across close/reopen.
4. Measure the stable `.2` candidate without experimental flags, then measure any vendor-approved
   Preview/native candidate as a separate tuple. Keep CFT runs in a compatibility section. Never use
   JavaScript masking or post-processing to manufacture separation.

   **Stage A exit.** Report one of three outcomes to the release owner before P6 is scheduled:
   - **No-chance** — collisions match or exceed the 27 August baseline. Freeze the pin, mark
     `G2-IDENTITY=FAIL`, and run P6 only for the Lane A/B scope that still needs it. Do not spend the
     vendor lease, second PC, or power-cycle host on a Lane C candidate that cannot ship.
   - **Repin-needed** — a different licensed build looks materially better. Repin, rebuild via P3,
     re-freeze via P4, and only then start P6. Stage A repeats on the new pin.
   - **Pin-final** — the current pin is the one that will ship regardless of outcome. Release P6 to
     start; Stage B judges it.

   The pin is frozen at the end of Stage A whichever outcome lands. Any later engine change
   re-triggers step 6 in full.

**Stage B — decision (after P6; needs a clean operational baseline to remove confounders).**

5. Analyze collisions, bucket counts, stability, coherence, and host/proxy confounders. Have the
   vendor confirm which surfaces are contractually supported and whether the license permits the
   measured channel. A partial improvement is not a PASS.
6. If thresholds pass, update the engine manifest/pin, release provenance, and truthful UI copy;
   rebuild the installer and invalidate/re-run every downstream artifact, final release freeze,
   Railway deployment, and environment gate that includes the engine (P3, P4, P5 deployment
   evidence, P6, and then P8). Do not hot-swap an engine into an already-tested installer. The new
   candidate needs a new signed tuple, not a metadata-only edit.
7. If thresholds fail, remain on stable `.2` or the last approved demo pin, mark `G2-IDENTITY=FAIL`,
   and (historically) keep Lane C blocked. **Current Q16 disposition:** Lane C is **CLOSED** because
   there is no CloakBrowser channel; no vendor issue/request, date, or waiting state exists. Allow
   only Lane A and explicitly bounded Browser demonstration with no real/high-value accounts. A
   future alternative-vendor issue requires a new product decision, owner, budget, and exit criteria;
   do not change this release scope to hide the failure.
8. Update the acceptance matrix, roadmap, README, setup/FirstRun copy, and release manifest with the
   exact result and date. Obtain security/product-owner signoff on the PASS or the continued NO-GO.

9. If a custom Chromium/native-engine experiment is proposed after a FAIL, first measure the host
   gates required by the engine-lab policy (available RAM >12 GiB, D: free space >=200 GiB, and zero
   VM/WSL interference). Stop before source/build work when any gate fails; keep the experiment in
   its isolated worktree and never substitute it for a vendor/license or identity PASS.

## Test Scenario Matrix

| ID | Scenario | Method | Expected result | Evidence |
|---|---|---|---|---|
| P7-01 | Installed binary provenance | Hash/version/license/flag inspection | Exact licensed engine tuple matches candidate | Engine manifest |
| P7-02 | No CFT substitution | Force packaged verifier and inspect channel | CFT is labeled compatibility-only; cannot satisfy identity | Verifier log |
| P7-03 | Profile repeatability | Same profile, close/reopen, repeated measurements | Surfaces are stable within approved tolerance | Measurement table |
| P7-04 | Cross-profile separation | A/B/C profiles, same host, interleaved runs | Meets owner-approved collision/bucket thresholds | Measurement table |
| P7-05 | Surface coherence | UA/screen/locale/timezone/WebGL/audio consistency checks | No contradictory device identity | Analysis report |
| P7-06 | Proxy confounder | Repeat with independent disposable routes | Results are not an artifact of one proxy/host | Network labels |
| P7-07 | Preview candidate | Vendor-approved preview measured separately | Partial improvement cannot auto-promote; explicit decision | Preview report |
| P7-08 | Flag abuse | Run with unpinned/masking flags | Production candidate rejects/labels unsupported flags | Negative test |
| P7-09 | Engine change invalidation | Change engine pin/hash and compare ledger | P3/P4/P5 deployment/P6 evidence becomes OPEN; new signed freeze/deploy is scheduled | Ledger entry |
| P7-10 | Decision review | Product/security/vendor review | G2 status is PASS or explicitly FAIL/OPEN with owner | Signoff |
| P7-11 | Engine-lab resource gate | Measure RAM/D: space/VM-WSL before any custom build | Build starts only if all hard host gates pass; otherwise experiment remains blocked | Lab gate record |
| P7-12 | Stage A gates P6 | Check P6 start date against Stage A report date | P6 never starts before the pin is frozen; a repin restarts P3/P4 then P6 | Schedule record |
| P7-13 | Vendor request tracked (historical) | Review step 0 ledger entry | Historical design expected a request; **current Q16: no channel exists, no request/SLA/date is created, and Lane C is CLOSED** | Closure record |

### Identity decision ownership

| Decision | Primary owner | Evidence reviewer | Due/expiry | Escalation |
|---|---|---|---|---|
| Threshold/sample approval | Product Owner | Security + Vendor | Before measurement | Release Owner |
| Licensed binary/provenance | Vendor/Identity Owner | Security Owner | Per candidate | Release Owner |
| External measurements | Identity Owner | Independent reviewer | Fill in | Product Owner |
| PASS/FAIL promotion | Product Owner | Security + Release | Candidate freeze | Executive/owner decision |
| Failed-engine follow-up | Identity/Vendor Owner | Product Owner | Fill in | Budget/roadmap review |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| Engine manifest | Version, binary SHA, size, channel, license evidence, verification date, and source candidate. |
| `ChromiumBootstrap` | Atomic download/checksum, license validation, and no silent fallback in packaged mode. |
| Packaged runtime verifier | CFT/system Chrome is explicitly compatibility-only. |
| Profile fingerprint config | Consistency controls are not advertised as uniqueness/isolation guarantees. |
| Measurement harness | External surfaces, repeated runs, sanitized labels, and reproducible tool version. |
| Threshold record | Owner-approved sample size/tolerances/collision/coherence rules. |
| Promotion decision | PASS triggers rebuild/retest; FAIL keeps Lane C blocked. |
| Evidence invalidation | Engine/pin/flag change invalidates downstream artifacts. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| Phase 1 scope/threshold owner | P1 → P7 | Defines what the product may claim and how PASS is judged. |
| Phase 3 exact installer | P3 → P7 Stage A | Identity must be measured on the installed candidate. Stage A needs nothing else. |
| P7 Stage A result | P7a → P6 | P6 must not start until the engine pin is frozen; otherwise a repin invalidates the whole P6 evidence set. |
| Phase 6 network/human baseline | P6 → P7 Stage B | Removes proxy/host/setup confounders before the gate of record. Stage B only. |
| Vendor identity response (step 0) | Historical external input | No CloakBrowser channel exists; Q16 closes Lane C and no request is sent. A future alternative vendor requires a new product decision. |
| Licensed vendor engine | External → P7 | Binary/channel/license cannot be inferred from CFT or source. |
| External measurement service/harness | External → P7 | Local unit tests cannot close identity uniqueness. |
| P7 result | P7 → P8 | Determines whether Browser real-account promotion is even eligible. |

## Success Criteria

- [ ] Stage A ran after P3 and before P6, and its outcome (no-chance / repin-needed / pin-final) is
  recorded with the frozen engine pin. The current `no-chance` classification is an early fail-fast
  result from the existing Stable `.2` evidence; the fresh formal matrix remains OPEN (see
  `reports/identity-measurement.md`).
- [x] Q16 closure is recorded: no CloakBrowser channel exists, no request/sender/SLA/date exists, and
  Lane C is CLOSED for this product shape.
- [ ] Exact installed licensed engine version/SHA/channel/flags are verified and recorded.
- [x] Owner-approved identity thresholds, sample size, and analysis method are documented before runs
  (`decisions.md`, `reports/identity-measurement.md`).
- [ ] External repeated cross-profile measurements are complete, sanitized, and independently reviewed.
- [x] Stable `.2`, Preview `.3`, and CFT compatibility results are kept as separate evidence
  classes; Preview is not promoted and CFT is compatibility-only.
- [x] `G2-IDENTITY` is honestly marked `FAIL` for the observed named-surface collisions; Lane C is
  explicitly CLOSED, with any alternative-vendor path requiring a new product decision.
- [x] Any engine change triggers a new installer and downstream gate rerun (ledger invalidation rule).

## Current Stage A record

The 2026-08-30 orchestration run froze Stable `.2` for this release and classified the existing
native collision evidence as `no-chance`. It did not launch the licensed engine or consume the
single vendor seat. The exact archive is absent, so P7-01/P7-03/P7-04 remain OPEN rather than being
represented as fresh 3-profile × 5-run PASS evidence. Lane C is CLOSED because there is no CloakBrowser
channel; no candidate request or date is pending.

## Risk Assessment

- **Collision remains hidden:** local generator looks diverse while native surfaces collide. Mitigate
  with external measurement across fonts/audio/WebGL and repeatability, not local hashes.
- **CFT false confidence:** system Chrome verifier is mislabeled as CloakBrowser proof. Mitigate with
  separate evidence classes and production flag rejection.
- **Vendor contract gap (historical):** an engine surface is not supported/licensed. The current
  mitigation is the Q16 closure: no CloakBrowser channel exists, so no request or waiting date is
  implied; a different vendor requires a new product decision.
- **Host/proxy confounder:** one machine or route biases results. Mitigate with interleaved profiles,
  independent routes, repeated runs, and second-PC evidence.
- **Scope pressure:** a partial Preview result is promoted to meet a date. Mitigate with explicit
  FAIL/OPEN decision and a separate engine-lab track.
- **Wasted environment spend:** P6's vendor lease, disposable proxies, operator time, power-cycle
  host, and second PC are consumed on a candidate that is later repinned. Mitigate with the Stage A
  probe gating P6 (P7-12).
- **Vendor channel absent (current):** no CloakBrowser contact exists. Lane C is CLOSED rather than
  "in progress"; do not invent an SLA or date. A future alternative-vendor decision is separate.
- **Evidence invalidation:** pin changes after tests. Mitigate with hash-bound manifest and automatic
  P3/P4/P6 rerun requirement.
