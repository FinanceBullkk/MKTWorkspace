---
phase: 4
title: "Validate and Handoff Capacity Model"
status: pending
priority: P1
effort: "0.5-1 day plus human Windows scenarios"
dependencies: [3]
---

# Phase 04: Validate and Handoff Capacity Model

## Context Links

- `E:\MKTWorkspace\MKTBrowser\package.json`
- `E:\MKTWorkspace\MKTBrowser\README.md`
- `E:\MKTWorkspace\MKTTool\docs\project-changelog.md`
- `E:\MKTWorkspace\plans\260820-0803-gioi-han-profile-chay-cung-luc\plan.md`
- `E:\MKTWorkspace\plans\260813-1546-pre-mkb04-system-quality-audit\plan.md`

## Overview

Prove automated contracts and controlled Windows behavior, update accurate documentation, then hand
the new release-state model to the existing capacity/UI plan. No production, real-account, or
distribution claim is allowed from unit tests alone.

## Automated Test Matrix

| Scenario | Expected result |
| --- | --- |
| Start/heartbeat/end happy path | Exact forwarding; durable state reaches released |
| Invalid key / vendor 4xx | Response preserved; no secret logged; no false active lease |
| Vendor timeout after start | Lease remains pending; key does not become idle |
| Proxy bridge unavailable | Licensed launch fails before browser spawn; no direct egress |
| Two profiles/two keys/two proxies | Unique ports, routes, hashes, and lease rows |
| Browser SIGKILL | Explicit release attempted through retained bridge before cleanup |
| Electron crash fixture | Journal survives; next startup sweeps orphan then releases |
| Power-loss fixture | Pending row survives; next boot releases without browser memory |
| Duplicate end | Behavior matches Phase 01 idempotency evidence |
| CFT profile | No sidecar, journal, key, or license API dependency |
| Store unavailable/corrupt | CloakBrowser launch blocked with typed sanitized error |

## Human Windows Gate

Use disposable profiles, valid test keys, and dedicated static proxies only.

1. Normal launch and Stop: verify the same key relaunches immediately and journal shows released.
2. Kill only Electron while Chromium is detached: restart app, close orphan, recover lease, relaunch.
3. Kill Chromium externally: verify explicit release and immediate reuse when vendor confirms it.
4. Simulate power loss by terminating app and browser without graceful shutdown, then restart and
   verify recovery from disk-only state.
5. Disable the profile proxy before recovery: verify no direct vendor request and pending state remains.
6. Restore the same proxy: verify recovery retries and releases.
7. Run two profiles with two valid keys and distinct test proxies: verify no cross-profile mix-up.
8. Capture sanitized timings for start, heartbeat, normal end, crash recovery, and failed recovery.

Do not claim actual vendor-observed source IP unless independently measured. Unit tests against an
injected HTTPS echo upstream may prove proxy-agent routing; vendor production behavior requires
separate evidence.

## Related Code And Documentation Files

- Modify as required by validation fixes:
  - Files owned by Phases 02-03 only; do not introduce a second implementation path.
- Modify documentation:
  - `E:\MKTWorkspace\MKTBrowser\README.md`
  - `E:\MKTWorkspace\MKTTool\docs\project-changelog.md`
  - `E:\MKTWorkspace\plans\260820-0803-gioi-han-profile-chay-cung-luc\plan.md`
- Create evidence report:
  - `E:\MKTWorkspace\plans\260820-1001-per-profile-license-sidecar-recovery\reports\validation-report.md`

## Implementation Steps

1. Run targeted tests first and fix failures without weakening assertions.
2. Run the full command gate from Node.js 22:

```powershell
corepack yarn verify:node
corepack yarn workspace @mktbrowser/desktop test:mkb02
corepack yarn workspace @mktbrowser/desktop test:mkb03
corepack yarn typecheck
corepack yarn lint
corepack yarn workspace @mktbrowser/desktop build
corepack yarn verify:packaged-contract
```

3. Run the human Windows gate. Record exact engine version, app commit, date, scenario, expected,
   observed, PASS/FAIL, and sanitized timing.
4. Update README local-data layout with `data/license-leases.db`, recovery semantics, and the fact
   that proxied license egress is owned by the local sidecar.
5. Add an English changelog entry describing behavior, limits, evidence, and rollback scope.
6. Update the capacity plan:
   - replace timer-only cooldown with `confirmed released`, `pending recovery`, and `cooling unknown`;
   - preserve its UI/copy phases as separate work;
   - do not mark those phases complete from this backend implementation.
7. If the pre-MKB-04 audit has frozen Phase 01 by execution time, stop and request explicit baseline
   re-entry instead of silently changing audited source.
8. Write `validation-report.md`. List every skipped/human-blocked gate as open.

## Success Criteria

- [ ] Targeted, MKB-02, MKB-03, typecheck, lint, build, and packaged-contract gates pass.
- [ ] Normal close, external kill, Electron crash, and power-loss recovery pass on Windows.
- [ ] Proxy failure proves fail-closed behavior with no direct fallback.
- [ ] Concurrent valid sessions remain profile/key/proxy isolated.
- [ ] README, project changelog, and capacity plan match measured behavior.
- [ ] Validation report contains no secrets, proxy values, observed IPs, or raw vendor payloads.
- [ ] No commit, push, publish, install, or rollout performed without explicit authorization.

## Rollback

- Revert controller injection and env assignment as one focused change.
- Leave existing detached-browser orphan sweep and timer-based key cooldown intact until replacement
  evidence is green.
- Do not delete `license-leases.db` during rollback; preserve it for diagnosis/retry unless an
  explicit migration proves records obsolete.

## Unresolved Questions

- Vendor release idempotency and expired-lease semantics depend on Phase 01 evidence.
- Human gate scheduling and valid test-key availability require owner coordination.
- Whether this slice enters the pre-MKB-04 baseline is an owner release-scope decision.

