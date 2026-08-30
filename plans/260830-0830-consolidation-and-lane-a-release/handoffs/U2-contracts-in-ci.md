# Handoff U2 — Contracts in CI
Date: 2026-08-30T11:20:00+07:00 | Phase: 2 | Status: PARTIAL (MKTTool PASS; Browser runner OPEN)

## Done

- MKTTool's new safety contracts are wired into CI: PostgreSQL restore/rate-limit contracts, secret
  scan, Relay executable/replay verification, lint/typecheck/test/build, and deploy verification.
- Consolidation branch run `33292005382` passed the required MKTTool jobs. PR #42 run `33296599912`
  and final post-merge `master` run `33297347911` also passed all applicable required MKTTool jobs;
  skipped conditional jobs remain skipped, not passes.
- Source-level negative tests cover malformed/under-floor tuples, one-seat limits, trusted-proxy
  handling, and version coherence. The earlier `33291209847` failure is retained as diagnostic
  history and was fixed by the later CI commits.

## Evidence written

- `../phase-02-enforce-contracts-in-ci.md` — gate matrix and exact run IDs.
- `../reports/p4a-postdeploy-evidence.json` — sanitized branch/master CI evidence used by P4a.
- MKTTool commits `5c6c3af`, `25af07f`, `9863fe2`, and `35b977b` — explicit CI contract changes.

## NOT done / deliberately skipped

- Latest MKTBrowser run `33296202751` failed before quality tests because the self-hosted Windows
  PowerShell shell could not resolve `node` after setup; package/packaged-contract jobs were skipped.
  The earlier `33291356306` run showed the same failure mode. This is an OPEN Browser/P4b runner
  contract, not a MKTTool or P4a failure.
- A remote scratch-branch Browser matrix has not been rerun. Skipped jobs are not promotion evidence.

## State the next session must know

- MKTTool release branch `release/consolidation-20260830` is at
  `e6a55ee402d86f9c8528734c5232d4f02210008a`; `master` contains merge
  `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`.
- MKTBrowser release branch is `release/consolidation-20260830` at
  `7c9b7cf`; its Browser CI runner issue remains open.

## Decisions still owed by the owner

- None. Q13–Q17 are answered. Any runner repair/retry must preserve the explicit OPEN qualification.

## Next unit

U3 — retain the measured 103-byte outer-installer variance as OPEN; then reconcile U7 documentation.
