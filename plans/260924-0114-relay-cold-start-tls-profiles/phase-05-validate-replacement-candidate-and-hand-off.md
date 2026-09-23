---
phase: 5
title: Validate replacement candidate and hand off
status: in-progress
acceptance: OPEN
releaseVerdict: NO-GO
blockedBy:
  - exact packaged SEA TLS evidence
  - replacement candidate identity, pins, and two-build equivalence
  - clean-VM lifecycle and cold-page acceptance
  - public TLS, human, second-PC, and canary observations
priority: P1
effort: 4-6h plus VM/build elapsed time
dependencies:
  - 2
  - 3
  - 4
---

# Phase 5: Validate replacement candidate and hand off

## Overview

Validate all repairs locally, then prove the combined behavior on a new exact candidate in the
restored Defender-enabled VM. Keep source, package, VM and promotion decisions separate.

## Requirements

Use the final committed source and exact retained bytes for each gate. Preserve old evidence;
every missing or skipped required observation remains OPEN/BLOCKED, never a release PASS.

## Architecture

Focused regressions -> committed source freeze -> isolated local gates and two builds -> signed
candidate metadata -> authenticated clean-VM acceptance -> separate exact-tuple promotion decision.
Use existing release runners and receipts; no parallel release framework is needed.

## Related Code Files And Runners

- `E:/MKTWorkspace/MKTTool/scripts/ci/local-release-runner.cjs` and `local-release-config.cjs`.
- `E:/MKTWorkspace/MKTBrowser/scripts/local-release-quality.cjs` and
  `local-release-quality-contract.cjs`; existing normalized-payload/provenance tools.
- `E:/MKTWorkspace/plans/260908-0740-local-vm-product-release/phase-04-exact-vm-verification-and-delivery.md`.
- Candidate/version/pin files in both repositories; enumerate using existing release-contract tools.
- Update relevant living architecture/roadmap docs only after actual implementation evidence exists.

## Implementation Steps

1. Run narrow regressions first using the commands below, plus new handler/TLS tests. Add new
   runtime pending-state tests to the existing suite rather than relying only on old tests.
2. Run Web/client/readiness and adapter tests with the existing full test configuration only when
   `TEST_DATABASE_URL` points to a disposable `_test` database. Its global setup is destructive
   even with a file filter. The Relay-only config excludes Web tests; do not count that as Web coverage.
3. Complete Tool quality, security, contracts and Relay runner stages from isolated clean inputs.
   `local-release-config.cjs` currently requires Node 24 for quality/Relay and Node 22 for
   contracts/security. Browser uses its pinned Node 22.23.2 and Yarn 4.5.0. Record exact executable,
   npm/Yarn CLI and lock hashes. Do not globally switch all repos to one Node version.
4. Use each committed runner's parser/runbook for absolute `--source`, `--output`, `--node22`,
   `--node24` and `--psql` arguments. Output must be outside source; never run install stages
   over the shared existing node_modules. The runner's ci.invalid Relay is diagnostic, not the
   deliverable with the real signed origin/floor/pins. Run full Browser quality, relevant MCP
   contracts, packaging/ownership tests and required machine-integration gates.
5. Review modified code and security-sensitive error/cancellation/trust boundaries. Commit scoped
   implementation before source freeze. Preserve unrelated workspace changes. Record exact source
   trees/commits; no amend, broad staging or rewriting historical failure evidence is necessary.
   Do not push MKTTool `master` during this source-freeze step: it deploys Railway. Push only after
   the new candidate has the required local/VM result and record the exact deployed SHA separately.
6. Allocate a new Browser/Relay/sequence candidate identity as payload changes require. Pin the
   replacement Relay checksum and coordinate manifest/control-contract/version metadata. Build
   twice from independent clean inputs; compare normalized delivered payloads. Retain raw hashes
   and choose one exact installer for acceptance. Never overwrite 0.3.24/18 evidence or rebuild
   the chosen installer between acceptance and publication.
7. Measure RAM; keep the VM off during heavy builds. Restore the known clean snapshot after
   confirming the VM identity and ownership. Provision fresh synthetic fixture/session and scoped
   TLS setup; verify hashes and Defender enabled. Do not close user apps to create capacity.
8. Freeze the trial matrix before execution: three independent normal cold starts including a
   fresh install start, then five labeled warm health requests. No diagnostic prewarming before
   the cold GET; include production startup work in timing. Record raw durations and maximum,
   not a statistically unsupported p95. Require every cold health GET below 4,000 ms and the
   intended handler budget; pending inspection must remain responsive and reach an honest final
   state. Start-to-listen/start-to-ready timings are separate measurements, not this HTTP budget.
9. Test the real page -> Relay -> compatibility ticket -> artifact download -> staging -> signed
   activation/smoke -> restart -> health -> profiles sequence. Verify fresh authorization, exact
   artifact hashes, version/contract convergence and protected update state. Do not mark this PASS
   at ticket issuance or download alone. Apply predefined deadlines for readiness convergence.
10. Run healthy empty/nonempty inventory and controlled failures. Verify Browser unavailable,
    install conflict, timeout, strict TLS refusal and correct profile error mapping. Separate
    fixture permission overrides from a human local-network prompt. Complete the required managed
    profile/proxy failure-recovery, repair, uninstall and cleanup gates under the existing runbook.
11. Record production public-TLS behavior independently if available. If not measured, mark OPEN.
    Record exact Web deployed SHA if source is pushed to MKTTool master: Railway deploys it
    automatically. A source push is not just Git bookkeeping. Candidate upload/promotion follows
    existing immutable-storage, full GET/hash, sequence/revocation and exact-tuple approval policy.
12. Retain the failed ACPI receipt. Use the verified bounded guest SYSTEM `shutdown.exe` fallback
    for cleanup; record final VM poweroff, ports/processes and trust/hosts cleanup. Do not repeat
    a three-minute ACPI loop or force power off to close these product gates. ACPI root cause is
    a separate follow-up and cannot be relabeled PASS by successful fallback.

## Focused Commands

From `E:/MKTWorkspace/MKTTool` with the applicable pinned toolchain:

```powershell
npm run test:relay -- handle-profiles relay-antidetect relay-http-server local-updater
```

From `E:/MKTWorkspace/MKTBrowser/apps/desktop` with the pinned Browser Node:

```powershell
node --experimental-strip-types --test src/main/windows-local-install-inspector.test.ts src/main/runtime-contract.test.ts
```

These commands cover existing tests only; include every new regression and the final runners.

## Acceptance Matrix

| Gate | PASS evidence | Not sufficient |
|---|---|---|
| Cold health | Unwarmed real-page requests in frozen matrix below deadline; truthful pending | Warm response or raised global timeout |
| Profile diagnostic | Safe code/stage and observed branch correlation | HTTP 400 alone or guessed no-capacity |
| Profiles repaired | Normal post-activation inventory + failure/recovery mapping | Unit test only / bypassed guard |
| TLS repair | Exact SEA normal launch downloads; invalid chains fail | Windows HTTPS, mocked fetch or disabled TLS |
| Compatibility | Signed transition, smoke, restart/convergence on exact tuple | Ticket or staging success alone |
| Clean VM | Exact retained installer + required lifecycle receipts | Historical 9/9 for the old candidate |
| Publication | Separate exact-tuple approval and read-back | Local runner exit 0 |

## Success Criteria

- [ ] Relevant local tests/typecheck/lint/build/security/contracts pass on final frozen source.
- [ ] New exact candidate passes the three product gates with immutable receipts and hashes.
- [ ] Required VM lifecycle/cleanup evidence recorded; unresolved environment/human gates explicit.
- [ ] Final report lists changed files, cause per issue, commands/results, commits and exact artifacts.
- [ ] Final report lists pushed/deployed/published status separately; no unsupported release claim.
- [ ] No MKTTool production deployment occurred before candidate acceptance, unless an intentional
  separately recorded deployment gate says otherwise.

## Risk Assessment

Do not spend repeated expensive builds/VM cycles on speculative fixes. If cold timing, trust or
profile cause remains unresolved, keep the candidate NO-GO with a specific failing/open gate.
These repairs do not close fingerprint, physical second-PC or seven-day canary requirements.
