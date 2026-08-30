---
phase: 2
title: "enforce-contracts-in-ci"
status: partial
priority: P1
effort: "2–3 days"
dependencies: [1]
---

# Phase 2: enforce-contracts-in-ci

## Overview

At the phase-start boundary, the autonomous run had built a genuine safety net — fail-closed journal,
restore verification, trusted-proxy resolution, durable rate limiting, one-seat enforcement, version
coherence, and payload reproducibility — but **CI ran none of it**. The current overlay below records
the contracts now wired into MKTTool CI; Browser remote runner gaps remain explicitly OPEN.

This phase makes the machine remember instead.

## What exists today

`MKTTool/.github/workflows/ci.yml` already runs `npm ci`, `db:generate`, `prisma migrate deploy`,
`lint`, `typecheck`, `test`, `test:critical-coverage`, `build`, then `relay:build` and `relay:verify`
in a second job. That is a real baseline — extend it, do not replace it.

`MKTBrowser` has `pr-release-gate.yml`, `windows-pipeline.yml`, `release-candidate.yml`,
`release.yml`.

## Requirements

- Functional: every contract built on 2026-08-30 runs automatically and **fails the build** when
  violated.
- Functional: each gate emits a machine-readable status from the set
  `PASS | FAIL | OPEN | BLOCKED | SKIPPED`. A `SKIPPED` or `OPEN` result can never satisfy a
  required check — this is the "skipped ≠ pass" rule from the predecessor plan, enforced in code.
- Functional: contracts that need a database run against a real ephemeral Postgres service, not a
  mock.
- Non-functional: total CI wall time stays bounded; expensive Windows packaging stays on its
  existing trigger rather than every push.
- Security: no secrets in logs or artifacts; the secret scan is itself a required check.

## Contracts to enforce

| Contract | Where it lives now | CI job |
|---|---|---|
| Relay journal fail-closed + restart replay | `relay/src/spent-ticket-journal.test.ts`, `relay-executable-harness.ts` | Existing relay job — add the harness run with an explicit `--archive` |
| Database restore verification | `scripts/restore-database-verify.ts` | New job with a Postgres service; salted checksums only |
| Trusted proxy resolution | `src/lib/auth/trusted-proxy-*.test.ts` | Main test job (already covered once committed) |
| Rate-limit durability and concurrency | `scripts/verify-better-auth-rate-limit.ts` | New job, real Postgres, two workers racing one key |
| One-seat license boundary | `apps/desktop/src/main/one-seat-license-ui-contract.test.ts` | MKTBrowser `pr-release-gate.yml` |
| Version coherence | `scripts/version-coherence-contract.test.cjs` | MKTBrowser `pr-release-gate.yml` |
| Relay pin ↔ published hash binding | `relay-release.json` vs release metadata | New assertion — reject v15/`cfeefc7f…`/`0.3.12` hashes outright |
| Payload reproducibility | `normalized-payload-manifest.cjs` | `release-candidate.yml` — build twice, compare |
| Secret scan over evidence | ad hoc during the run | New required check across `plans/**` and both source trees |

## Implementation Steps

1. **Define the status contract first.** Create a tiny shared helper that writes
   `{gate, status, reason, owner}` as JSON to the step summary and sets an output. Every gate below
   uses it. Without this, "skipped ≠ pass" is a slogan rather than a mechanism.

2. **Extend MKTTool `ci.yml`.** Add a `postgres:16` service to a new `contracts` job. Run
   `db:restore:verify` against a dump fixture and `verify-better-auth-rate-limit` with two parallel
   workers. Assert the rate limiter produces the expected pass/throttle split and that restart
   persistence holds. Fail on any mismatch.

3. **Bind the relay pin.** Add an assertion that `MKTBrowser/apps/desktop/relay-release.json` version
   and SHA match the published metadata, and that the known-bad tuple can never reappear: reject
   `cfeefc7f1284492a64f5cf8b29603b3e9a36e5d488ac676d2d109b2c4364b261`,
   `eb37eb544ef87b772185272aa2de4cf23000f2e2fbd92f6bde99a20e47b210d1`, and installer version
   `0.3.12` in any candidate.

4. **Reject unpinned engines in a production candidate.** Fail if `MKT_BROWSER_ALLOW_UNPINNED_ENGINE`
   or a CFT fallback path is reachable in a packaged build. CFT stays available for compatibility
   fixtures and must be labelled as such — never as identity evidence.

5. **Wire the MKTBrowser gates.** Add version coherence and the one-seat contract to
   `pr-release-gate.yml`. Add the twice-build normalized-payload comparison to
   `release-candidate.yml`, consuming Phase 3's determinism work.

6. **Make skips visible.** Audit every existing `continue-on-error`, `if:` guard, and conditional
   skip in all five workflows. Each one must emit `OPEN` with a reason and an owner. The
   Windows-live test that has been silently skipping is the reference case — after this step it is
   visible in the summary and blocks Browser promotion.

7. **Add the secret scan** as a required check over `plans/**` and both source trees: tokens,
   cookies, proxy URLs, private keys, OTPs, connection strings. It must have caught the low-severity
   unsalted-checksum issue from the run; verify it does.

8. **Decide the runner question (completed).** The configured self-hosted Linux/Windows runners are
   authoritative, with fail-closed provisioning checks. The Windows Node-resolution repair is now
   proven by the remote setup/pin steps, but the Browser matrix remains OPEN when its required
   private MKTTool sibling checkout lacks a read credential; that boundary is not silently treated
   as a pass.

9. **Prove the net catches things.** For each contract, introduce a deliberate violation on a scratch
   branch and confirm CI goes red. A gate that has never failed is a gate nobody has tested.

## Test Scenario Matrix

| ID | Scenario | Method | Expected |
|---|---|---|---|
| P2-01 | Status contract | Force one gate to skip | Summary shows `OPEN` + reason; required check fails |
| P2-02 | Restore verification | Run against a real Postgres service | Row/checksum comparison passes; salted, no plaintext |
| P2-03 | Rate-limit concurrency | Two workers, one key | Deterministic pass/throttle split; survives restart |
| P2-04 | Bad-tuple rejection | Plant `cfeefc7f…` / `0.3.12` in a candidate | CI fails with a clear message |
| P2-05 | Unpinned engine rejection | Enable the unpinned flag | Packaged candidate rejected |
| P2-06 | Version drift | Set desktop and root to different versions | Coherence check fails |
| P2-07 | One-seat bypass | Attempt a second active key | Contract test fails |
| P2-08 | Secret scan | Plant a fake token in a plan file | Scan fails the build |
| P2-09 | Negative testing | Deliberate violation per contract | Every gate proven to go red |

## Success Criteria

- [x] A shared status helper exists and the MKTTool/MKTBrowser contract steps route results through
  it; non-PASS statuses return non-zero for required checks.
- [x] Restore verification and rate-limit concurrency run against a real disposable PostgreSQL in
  the green MKTTool contracts jobs (`33292005382`, `33292350436`).
- [x] The known-bad v15/0.3.12 tuple is rejected by an executable assertion and source-level test.
- [ ] Version coherence, one-seat, and payload reproducibility are wired as required Browser checks;
  the Node 22 setup/pin now passes remotely (`33301446012`), but quality fails closed at the
  private MKTTool sibling checkout and package/packaged-contract jobs remain skipped. The original
  Node-resolution failures `33296202751` and `33291356306` remain historical evidence.
- [ ] Every conditional skip in the Browser workflows has a completed remote proof; current skipped
  package jobs are recorded as OPEN/FAIL, never PASS.
- [x] Secret scan is required in MKTTool CI and its planted-token test is covered by
  `scripts/ci/secret-scan.test.cjs`.
- [x] The runner-authority question is answered: the configured self-hosted Linux/Windows runners are
  authoritative, with fail-closed provisioning checks.
- [ ] A separate scratch-branch CI red run has been captured for every contract. Source-level
  negative tests exist, but a remote scratch-branch matrix was not run in this release window.

## Current checkpoint — 30 August 2026, post-merge reconciliation

The first MKTTool run (`33291209847`) correctly caught two runner defects: the Linux contracts
runner had no host `psql`, and the secret-scan job had no Node runtime. Commit `35b977b` adds a
deterministic Docker PostgreSQL client wrapper (mode 100755), pins the selected Node 22 executable
for the contract step, records an explicit BLOCKED result when provisioning/install fails, and
provisions Node 22 for secret scanning. The follow-up branch run `33292005382` completed `success`
for `check`, `contracts`, `secret-scan`, and `relay-executable`; its conditional deploy-verification
job is correctly skipped on a branch push. The post-merge master run `33292350436` also completed
`success` for `check`, `contracts`, `secret-scan`, and deploy-verification; its Windows Relay job is
not scheduled on a master push.

The Browser-side contract wiring is present and its source-level negative tests cover status,
known-bad tuple, unpinned engine, version drift, one-seat, payload, and planted-secret cases. The
Windows runner repair is recorded in the U2 handoff and was exercised remotely in `33301446012`:
`Setup Node.js 22` and `Pin Node.js 22 executable` both passed, including the absolute toolcache
path. The quality job then failed closed at the private MKTTool sibling checkout (`repository not
found` under the workflow token); package and packaged-contract were skipped by that required
dependency. The original `33296202751` and `33291356306` Node-resolution failures remain retained
as historical evidence. Keep this as a separate Browser/P4b runner/permission gate; it does not
gate the independent P4a MKTTool deployment.
The later PR #42 run `33296599912` and final master run `33297347911` both completed successfully
for all applicable MKTTool jobs; the final master `deploy-verification` job also passed. The
Windows Relay job is intentionally skipped on a master push by workflow condition.
The Docker wrapper was tested against disposable PostgreSQL 16 and forwards connection environment
names without printing values.

## Risk Assessment

- **CI time balloons and people start skipping it.** Keep Windows packaging on its existing trigger;
  put the fast contracts on every push and the expensive ones on release candidates.
- **Gates that never fail.** Step 9 exists precisely because an untested gate is decorative.
- **Flaky Postgres services causing false reds.** Pin the service image, add a readiness wait, and
  allow exactly one automatic retry for infrastructure failure — never for an assertion failure.
- **Secret scan false positives blocking work.** Tune with an allowlist of known-safe fixtures rather
  than by weakening the patterns.
