---
phase: 6
title: "engine-path-closure-and-vendor-decision"
status: complete
priority: P1
effort: "1 day of closure work"
dependencies: []
---

# Phase 6: engine-path-closure-and-vendor-decision

## Overview

**Owner decision, 2026-08-30: do not build a custom Chromium engine.** The custom-engine track is
closed for this product. This phase records that closure properly and redirects the remaining effort
to the only paths left.

The preflight that informed the decision:

| Gate | Required | Measured |
|---|---|---|
| `D:` free | ≥ 200 GiB | 234.788 GiB — pass |
| Available RAM | > 12 GiB | **2.935 GiB of 15.924** — fail |

After a reboot this machine would clear roughly 12 GiB — *at* the threshold, not above it. Building
Chromium there would have been a multi-day gamble on marginal hardware, with the measurement work
still to come afterwards. Closing it is a defensible call, and it is now made rather than deferred.

## What this means for Lane C

Lane C requires `G2-IDENTITY` to pass. It currently fails: fonts `08050B16`, audio `0B09CAEB`, and
WebGL `BF16CA5C` collide across profiles on the licensed CloakBrowser Stable `.2`.

There is no channel to CloakBrowser (owner decision, 10:15). Therefore **Lane C is CLOSED for this
product shape**, not pending or waiting for a reply. No request will be sent, and there is no date or
“coming soon” promise. MKTBrowser remains a controlled Lane A/B tool that does not claim identity
isolation; the UI copy says so honestly. The ranked alternative-vendor screen is retained only as a
future, separately funded product decision, not as an active release lever.

## Requirements

- Functional: the custom-engine track is formally closed with a written rationale, not left `BLOCKED`.
- Functional: the absence of a CloakBrowser channel and the resulting Lane C closure are recorded.
- Functional: alternative engine vendors are screened on paper as future options, without implying
  an active request, date, or commitment.
- Functional: the roadmap states Lane C's real status and stops implying a date.
- Boundary: no build, no reboot for build purposes, no CloakBrowser seat consumption.

## Implementation Steps

1. **Close the engine track formally.** In
   `plans/260828-0428-chromium-fingerprint-engine/plan.md`, set the status to closed with the date,
   the owner decision, and the measured reason (RAM 2.935 GiB available against a >12 GiB gate on a
   15.924 GiB machine). Preserve every completed phase and its evidence — phases 1 and 2 produced
   real toolchain and source work that would be expensive to redo if the decision is ever revisited.
   **Close it, do not delete it.**

2. **State the reopening condition.** A closed track that nobody can reopen is a dead end; one that
   reopens on a whim is not closed at all. Write the condition explicitly: different hardware with
   >16 GiB available RAM, or a funded cloud builder, plus an owner willing to carry the measurement
   work afterwards. Anything less does not reopen it.

3. **Record the channel absence and close Lane C.** The prior sanitized request draft is retained as
   historical context only. There is no reachable CloakBrowser channel, so do not send it, invent a
   deadline, or imply that silence is being awaited. The absence is the decision: `G2-IDENTITY` stays
   FAIL and Lane C stays CLOSED.

4. **Evaluate alternative vendors on paper.** Using the existing research report as a base, assess
   each candidate against the same thresholds that CloakBrowser failed: per-profile separation of
   fonts, `OfflineAudioContext`, and WebGL on one host, with coherent UA/screen/timezone/locale.
   For each: licensing model, seat economics, whether they publish or will attest to per-profile
   isolation, and what a future evaluation would cost. This is desk research — no purchases, no
   trials, no seat consumption. Output a ranked shortlist with costs, explicitly marked future scope.

5. **Do not measure anything in this phase.** Any engine, from any vendor, faces the same external
   measurement before it can close `G2-IDENTITY`: 3 profiles × 5 runs, no per-surface collision on
   any pair, coherent surfaces. A vendor's marketing claim is not evidence. Measurement belongs to
   whatever phase actually acquires a candidate engine.

6. **Write the decision record.** One page: the engine track is closed and why; the absent vendor
   channel and resulting Lane C closure; the future alternative shortlist with costs; and the
   resulting product boundary. This is the artifact that ends the ambiguity.

7. **Update the roadmap.** Lane C's entry becomes its true status — CLOSED for this product shape,
   with no date or implied schedule. Link the future alternative screen without making it a promise.

## Test Scenario Matrix

| ID | Scenario | Method | Expected |
|---|---|---|---|
| P6-01 | Engine track closed | Read the engine plan | Status closed, dated, reasoned; completed phases and evidence preserved |
| P6-02 | Reopening condition | Read the closure note | Specific and testable, not "if we feel like it" |
| P6-03 | Vendor channel decision | Review owner answer | No channel recorded; Lane C CLOSED; no request sent |
| P6-04 | No implied wait | Review roadmap/record | No deadline, date, or “coming soon” language |
| P6-05 | Alternatives assessed | Read the shortlist | Ranked, costed, judged against the same thresholds |
| P6-06 | No measurement claimed | Review | No engine measured; no seat consumed; no vendor claim treated as evidence |
| P6-07 | Roadmap honest | Read Lane C's entry | Real status, no implied date, named next action |

## Success Criteria

- [x] Custom-engine track formally closed with date, decision, and measured rationale; prior phases
  and evidence preserved intact.
- [x] A specific, testable reopening condition is written down.
- [x] CloakBrowser channel absence recorded; no request or invented deadline exists.
- [x] Alternative vendors ranked and costed against the same thresholds as future scope.
- [x] A one-page decision record exists.
- [x] Roadmap states Lane C is CLOSED with no implied date.
- [x] No build, no reboot for build purposes, no seat consumed.

## Bookkeeping verification — 30 August 2026

The first two Success Criteria above are already checked: the custom-engine track was formally
closed with the measured RAM result and the plan contains the explicit `>16 GiB`/funded-cloud plus
named-owner reopening condition. No criterion is missing from this current successor phase.

The similarly named `plans/260829-2125-internal-product-readiness/phase-06-real-environment-gates.md`
is a **historical, reopen-only predecessor**. Its first two historical criteria remain unticked on
purpose because no new Browser real-environment gate was run and Q16 closed Lane C; ticking them
would falsely claim vendor, operator, network, and second-PC evidence. That file's header and
historical-success-criteria label are the explanation, not an outstanding bookkeeping defect.

## Risk Assessment

- **Closure read as "identity does not matter".** It does — the product simply will not solve it by
  building a browser. Say that plainly in the roadmap so the constraint stays visible.
- **Losing the completed engine work.** Phases 1 and 2 produced real toolchain, source, and GN replay
  evidence. Close the plan, preserve the artifacts; deleting them makes any future reversal expensive.
- **Trading one vendor lock-in for another.** Step 4 must record what each alternative will actually
  attest to, not what its marketing claims. The threshold is unchanged and measurement still applies.
- **Lane C quietly reappearing in a roadmap as "coming soon".** Step 7 plus the honest UI copy
  already shipped are the guard. Any future Lane C claim needs a measured PASS, not an intention.
