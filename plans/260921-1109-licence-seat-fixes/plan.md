# Licence seat and engine integrity fixes

Status: SOURCE COMPLETE; local validation and independent review PASS. The sole real
seat-availability attempt FAILED; successful real launch/close remains OPEN and identity BLOCKED.
Source: [worklist](../reports/worklist-260921-1105-licence-seat-fixes.md).

## Decisions

- Browser.close, exit code 0 and orphan cleanup are not vendor release proof.
- Use a 25-minute local close cooldown and 30-minute refusal cooldown. These are
  conservative retry policies, not a measured vendor TTL or a release guarantee.
- One operator launch request makes at most one engine launch attempt. No automatic
  retries after refusal. Unstarted reservations may still be released immediately.
- Publish optional aggregate `retryAt` (ISO timestamp), without key/profile identity.
  Enforce valid capacity in Web even without the unadvertised capability flag.
- Engine downloads fail closed without a valid SHA-256. Record this security choice.
- Preserve existing measurement-script edits and historical pin defaults. Detect drift
  before any launch and record sanitized local pin provenance without signed URL queries.
- Identity criteria remain BLOCKED; retain five profiles and ten complete readings.

## Work

- [x] Read instructions, repository context, worklist, audit, and existing dirty changes.
- [x] Review implementation paths, including clean exit and startup orphan recovery.
- [x] Fix Browser cooldown, durable recovery, manual retry, capacity and message tests.
- [x] Fix Web capacity parsing/readiness, operator guidance and regression tests.
- [x] Fix harness drift detection and fail-closed checksum validation with tests.
- [x] Record sanitized .6 pin provenance and update current operational documentation.
- [x] Run relevant local tests, typechecks, lint and independent code review.
- [x] After at least 25 quiet minutes, make one disposable real-engine launch attempt;
  record the outcome and stop without retrying. Do not probe vendor session endpoints.
- [x] Record final changes, verification and remaining release/identity gates.

## Ownership and boundaries

Parent owns Browser seat lifecycle/pool/contracts, integration and live validation.
Web worker owns MKTTool capacity code/tests. Engine worker owns harness/checksum code/tests.
Do not close user apps, mutate production pins or release manifests, publish secrets,
reduce the fingerprint pool, or present source checks as installer/identity acceptance.
Existing audit/worklist and two modified measurement scripts are preserved.

## Validation

Baseline targeted seat tests: 42/42 PASS before changes (including incorrect release
assumptions that the new regressions must replace). Supported Node: 22.23.2; Yarn: 4.5.0.
Final Browser `test:installer`: 623 executions, 622 PASS, 0 FAIL, 1 explicit live-Windows
machine integration SKIPPED. Browser typecheck, full lint and source build PASS.
Final MKTTool focused tests: 13 suites, 170/170 PASS; full lint PASS. Earlier full TypeScript
check PASS. Focused unit tests disable database global setup and do not establish DB acceptance.
Independent review found no remaining issues after the durability/deadline corrections.
Live quiet interval started no later than 2026-09-21T04:12:04Z; earliest allowed attempt
2026-09-21T04:37:04Z, subject to checking for intervening engine activity.
Clean-VM, packaged-installation, second-PC, human acceptance and elapsed canary evidence
remain separate. No release promotion is part of these fixes.

## Local delivery

- MKTBrowser: `06fe257c7ee615b156d776cfd10d415a933c23b2` (30 task paths).
- MKTTool: `3461b58f5e0e6e30221354e1b29b945e84c5fdf8` (13 task paths).
- Both application worktrees clean; secret scans and committed diff checks PASS.
- No push, deployment or release. Final details: [report](../reports/fix-260921-1109-licence-seat-fixes.md).

## Unresolved evidence

- The vendor timer-reset hypothesis is based on three observations, not a confirmed rule.
- One successful quiet launch cannot establish the five-profile identity gate or a TTL.
- The sole real attempt at 04:43:20Z, after 31.25 locally quiet minutes, failed with exit 76.
  Correct runtime response: free 0, cooling 1, retryAt 05:13:23.817Z; no automatic retry.
  Successful real launch/close remains OPEN, identity remains BLOCKED, no release promotion.
- Review additionally fixed transient/repeated journal-write failures and moving future-clock
  deadlines. Fresh focused driver/journal/restart tests: 43/43 PASS.
