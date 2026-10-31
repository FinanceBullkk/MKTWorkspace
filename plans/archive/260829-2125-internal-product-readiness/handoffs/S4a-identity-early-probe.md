# Handoff S4a — Identity early probe and engine pin freeze

Date: 2026-08-30T04:20:00+07:00  |  Phase: 7 Stage A  |  Status: PARTIAL / BLOCKED

> **Historical S4a identity snapshot — superseded by Q16 closure.** It remains valid evidence for
> `G2-IDENTITY=FAIL`, but vendor dispatch/owner-channel language below is not current: no CloakBrowser
> channel exists, no request or date exists, and Lane C is CLOSED.

## Done

- Read the fixed owner threshold record before classifying the engine: three disposable profiles ×
  five runs, repeatability at least 4/5, zero full-tuple collisions, and per-surface font/audio/
  WebGL separation with coherent UA/screen/timezone/locale.
- Reconciled the sanitized 27 August native Stable `.2` measurement. Fonts (`08050B16`), audio
  (`0B09CAEB`), and WebGL (`BF16CA5C`) collide across profiles, so the early outcome is
  `no-chance`; `G2-IDENTITY` remains `FAIL`.
- Froze the Stable `.2` pin (`151.0.7922.108.2`, expected archive SHA
  `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561`) for this release. Preview
  `.3` remains separate negative evidence and is not promoted.
- Performed a read-only process/port safety check. The existing installed Browser shell was left
  running; no CloakBrowser engine launch or vendor-seat consumption occurred.

## Evidence written

- `reports/identity-measurement.md` — threshold record, exact pin, collision result, process safety,
  gate dispositions, and vendor request boundary.
- `local-test-artifacts/phase5/g2-identity-cross-profile-fingerprint-evidence-20260827.json` —
  prior sanitized named-surface measurement used for fail-fast classification.
- `reports/release-manifest.json` — engine is now recorded as
  `FROZEN_NO_CHANCE_G2_IDENTITY_FAIL` for this candidate; no engine bytes were changed.

## NOT done / deliberately skipped

- Fresh formal P7-01/P7-03/P7-04 3×5 measurement — **OPEN** because the exact Stable `.2` archive is
  absent and no vendor channel/entitlement is available. Prior evidence cannot be relabeled as a
  fresh candidate matrix.
- Vendor request dispatch — **OPEN / external**; no named owner or channel was supplied.
- P6 vendor lease, disposable proxies, second PC, human login, and physical power-cycle — not
  booked or simulated; Stage A no-chance means only Lane A/B preparation may proceed.
- Custom engine build — held out of scope; no host-gate bypass attempted.

## State the next session must know

- Preserve all dirty work in MKTTool, MKTBrowser, and the root. Do not commit or push.
- Any engine/source/artifact/host/flag change invalidates S3 and this pin; rebuild and re-freeze from
  S3 before any expensive real-environment work.
- The user-restored `MKTTool/relay/src/spent-ticket-journal.ts` currently contains the fail-closed
  rewrite and `ensureSpentTicketJournal()`; focused journal tests are 18/18 PASS.
- Do not kill or relaunch the existing installed MKTBrowser process while collecting evidence.

## Decisions still owed by the release owner

- CloakBrowser channel/contact, identity owner, and response SLA.
- Disposable proxy pairs, vendor entitlement, clean second PC, operator roster, and canary dates.
- Final signed tuple and Railway deployment approval remain subject to S4b preconditions; rollback
  stays owner-only.

## Next unit

S4b — final freeze and publication/deployment preflight. First action: read
`reports/release-run.md` and reconcile the refreshed run 3 Browser tuple with the frozen pin and all
S2/S3 evidence. Keep Browser publication and Railway deployment OPEN while the signed tuple, clean
VM, exact engine archive, and healthcheck preconditions are absent.
