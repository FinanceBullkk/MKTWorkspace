---
phase: 3
title: "Enforce PR Merge and Critical Coverage Gates"
status: complete
priority: P1
effort: "2-3 working days"
dependencies: [1, 2]
---

# Phase 3: Enforce PR Merge and Critical Coverage Gates

## Overview

Turn the corrected security, packaged, and coverage checks into non-bypassable merge gates. Browser
changes merge only when the current PR merge tree is green; a green feature-branch push cannot
satisfy or substitute for the required check.

Add measured coverage floors for critical paths in both repositories before large-module extraction
begins. Avoid a vanity whole-repository percentage: protect the authorization, proxy, profile,
release, extraction, CDP, lease, and recovery modules whose regression can cross identity boundaries.

## Requirements

- Required Browser check runs on `pull_request` merge trees and has a unique stable name.
- Branch protection requires PR, current base, all required checks, and no administrator bypass for
  ordinary merges. Direct pushes to `main` are blocked except documented break-glass recovery.
- Push workflows may provide telemetry/post-merge verification but never report the required PR name.
- MKTBrowser uses Node 22 built-in coverage for critical Node tests where practical.
- MKTTool uses Vitest V8 coverage for a named critical include set.
- Thresholds start from a measured baseline and may only move upward without an approved rationale.

## Architecture

```text
PR merge tree
  -> dependency security gate
  -> lint/typecheck/unit/integration
  -> critical coverage gate
  -> package once
  -> packaged contract repeat gate
  -> required status: mktbrowser-pr-release-gate
  -> merge allowed

feature push -> optional fast feedback only -> cannot satisfy required status
```

Coverage policy:

1. Define explicit critical include lists in each repository.
2. Measure baseline on clean CI.
3. Set initial thresholds to the measured result rounded down by at most one point, with minimum
   floors of 70% lines, 70% functions, and 60% branches for the aggregate critical slice.
4. Add missing tests before accepting a lower baseline. Never exclude hard-to-test code merely to
   improve the number.
5. Raise toward 85/80/75 as Phase 7 extracts testable seams.

## Implementation Evidence - 22 August 2026

### A skipped required check counts as passed

The first version of this gate put the required job in the push workflow behind
`if: github.event_name == 'pull_request'`. It ran green, and the check runs on the head commit then
showed the name twice:

```
mktbrowser-pr-release-gate    success    (pull_request run)
mktbrowser-pr-release-gate    skipped    (push run)
```

A condition stops a job from running but not from publishing a check run under its name, and GitHub
treats a skipped required check as satisfied. Enabling branch protection at that moment would have
produced a gate that protected nothing: a push carrying a failing pipeline would still have
published the required name, in a state that satisfies the requirement.

This is the same shape as the finding already in the register - the check that would have caught the
problem was not the check that runs - with a new variant worth naming separately: **a check that
runs, reports, and protects nothing.**

The fix is structural rather than conditional. The pipeline is now a reusable workflow with two
callers, so the required name cannot exist outside pull requests:

| Workflow | Trigger | Carries the gate name |
|---|---|---|
| `windows-pipeline.yml` | `workflow_call` | No |
| `release.yml` | push, schedule, dispatch | No |
| `pr-release-gate.yml` | `pull_request` | Yes |

Verified after the split: the required name appears exactly once on the head commit, `success`.

The contract test forbids the name and the merge-request trigger from appearing anywhere in the push
workflow, comments included. Its first run failed on the comment that explained the rule, and the
comment was reworded rather than the check loosened, because a substring rule with a carve-out for
comments is one someone can talk their way around.

### Measured coverage floors

Both floors are the measured baseline rounded down by one point, per the policy above.

| Repository | Lines | Branches | Functions | Statements | Protected slice |
|---|---:|---:|---:|---:|---|
| MKTBrowser | 87.38 | 81.65 | 86.75 | - | 11 modules in `apps/desktop/src/main` |
| MKTTool | 82.47 | 75.38 | 80.23 | 79.78 | auth, crypto, tickets, relay, release, proxies, enrollment, antidetect |

MKTTool's floor is proven to fail rather than assumed to: forcing the line threshold to 99 exits 1
with `Coverage for lines (82.47%) does not meet global threshold (99%)`. A configured number nobody
has watched fail is indistinguishable from a comment.

Both contracts fail closed when a protected module is renamed out of the include list, because
coverage of whatever remains would otherwise keep looking healthy.

### Open - branch protection not yet applied

The required check now exists and is unique, so protection can be applied. It has not been, because
applying it is a repository configuration change and needs the owner. Intended settings are recorded
in `Branch Protection Settings` below so the applied state can be compared against an intent that
was written down first.

## Applied and Verified - 22 August 2026

Read back from the API after configuration rather than trusted because the write returned success:

```
required_check      = mktbrowser-pr-release-gate
strict_base         = true
enforce_admins      = true
requires_PR         = true
required_approvals  = 0
force_pushes        = false
deletions           = false
conversation_res    = true
```

The rule proved itself on the first pull request it met. After the branch was updated onto the
current base, PR #5 reported `BLOCKED` until the required check completed on the new head. Before
today those forty-one commits could have reached the default branch at any moment with no check at
all.

PR #5 merged as `627db23`. That merge is both the delivery of the P0 work to the default branch and
the first exercise of the gate that now guards it. The push workflow was still running on the same
commit at merge time and was correctly not waited on: it is informational, and the release rule says
the pull-request check is the merge authority.

MKTTool CI run `32575269324` passed with its coverage floor in place.

## Branch Protection Settings

| Setting | Value | Why |
|---|---|---|
| Required check | `mktbrowser-pr-release-gate` | The only name a push cannot publish |
| Strict (base up to date) | true | A stale base is a different merge tree than the one tested |
| Enforce for admins | true | Ordinary merges have no bypass; disabling is the documented break-glass |
| Required approving reviews | 0 | The team is one person, and GitHub forbids approving your own pull request. Requiring one approval would block every merge, and a rule that cannot be followed gets switched off entirely |
| Require conversation resolution | true | Cheap, and stops an unanswered review comment from being merged past |
| Force pushes | denied | History on the default branch is evidence |
| Deletions | denied | - |

## File Inventory

| Repository | Action | File | Test impact |
|---|---|---|---|
| MKTBrowser | Modify | `E:\MKTWorkspace\MKTBrowser\.github\workflows\release.yml` | Required PR job names and dependencies |
| MKTBrowser | Modify | `E:\MKTWorkspace\MKTBrowser\package.json` | `test:critical-coverage` script |
| MKTBrowser | Create | `E:\MKTWorkspace\MKTBrowser\scripts\critical-coverage-contract.cjs` | Include list and threshold validation |
| MKTBrowser | Modify | Critical package test scripts | Enable Node coverage on protected modules |
| MKTTool | Modify | `E:\MKTWorkspace\MKTTool\package.json` | Add `@vitest/coverage-v8` and coverage script |
| MKTTool | Modify | `E:\MKTWorkspace\MKTTool\package-lock.json` | Lock coverage provider |
| MKTTool | Modify | `E:\MKTWorkspace\MKTTool\vitest.config.mts` | Named critical include set and thresholds |
| MKTTool | Modify | `E:\MKTWorkspace\MKTTool\.github\workflows\ci.yml` | Required coverage step |
| Both | Modify | Relevant README/standards docs | Document merge and coverage policy |

## Initial Critical Include Set

MKTBrowser:

- Safe archive extraction and CRX pipeline.
- `cdpReadiness.ts`, DevTools port discovery, process discovery, orphan sweep.
- Managed profile create/update/launch/close authorization paths.
- Proxy application/egress verification and WebRTC firewall checks.
- License pool, lease journal, recovery, and stable error mapping.

MKTTool:

- Ticket issue/verification, Relay device ownership, replay/expiry/revocation.
- Profile launch readiness, Browser contract adapter, stable outcome mapping.
- Vault domain separation and encrypted-field registry.
- Compatibility manifest/signature/rollback verification.
- Server-action authorization guards on Browser/Relay setup and launch paths.

## Function And Interface Checklist

- [x] Required check name exists only on PR merge-tree execution.
- [x] Tree matches the packaged artifact manifest; the contract job refuses an artifact whose
  `sourceSha` differs from the checked-out merge tree. It enforces rather than prints, and the
  manifest is uploaded as evidence, so the SHA is recoverable from any run.
- [x] Coverage scripts fail below lines/functions/branches thresholds.
- [x] Coverage includes production modules without counting tests/fixtures/generated output.
- [x] Threshold changes are visible in code review and cannot be overridden by environment input.
- [x] Branch protection is verified through GitHub API evidence after configuration.

## Implementation Steps

1. Rename workflow jobs/checks so push and PR results cannot collide visually. Keep one required name:
   `mktbrowser-pr-release-gate`.
2. Print `git rev-parse HEAD`, tree SHA, event type, base SHA, head SHA, and artifact SHA in the PR job.
3. Configure repository ruleset/branch protection: PR required, branch up to date, required check,
   conversation resolution, no force push/delete, no ordinary direct push.
4. Add MKTBrowser critical coverage script using Node 22 coverage flags and explicit include/exclude
   patterns. Record baseline JSON/text as a CI artifact.
5. Add Vitest V8 coverage to MKTTool with a separate critical config or named project so database
   setup and existing serial execution remain unchanged.
6. Add missing tests until both baselines meet the minimum floors. Set thresholds at the measured
   level; do not guess a percentage before measurement.
7. Add a contract test or script that parses workflow YAML and fails if the packaged or coverage
   step is removed from the required job.
8. Verify through GitHub API that PR #5 cannot merge while the PR check is red even though the push
   check is green. Re-run only after a code or infrastructure fix, never to hunt for green.

## Test Scenario Matrix

| Priority | Scenario | Expected result |
|---|---|---|
| Critical | Push check green, PR merge check red | Merge blocked |
| Critical | Base branch advances after green PR run | PR becomes stale; required merge-tree check reruns |
| Critical | Coverage drops below any critical threshold | CI fails with module/category summary |
| High | Workflow step is renamed/removed | Workflow contract test fails |
| High | Direct push attempt to `main` | Ruleset rejects except break-glass identity |
| Medium | Dev-only file changes | Fast checks may run; required semantics remain unchanged |

## Regression Gate

```powershell
# MKTBrowser
corepack yarn test:critical-coverage
corepack yarn test:installer
corepack yarn typecheck
corepack yarn lint

# MKTTool
npm run test:critical-coverage
npm run lint
npm run typecheck
npm test
npm run build
```

## Success Criteria

- [x] GitHub refuses merge when `mktbrowser-pr-release-gate` is not successful for current base.
- [x] Green push CI cannot satisfy the required PR check.
- [x] Both repositories enforce measured critical line/function/branch floors.
- [x] Workflow contract tests prevent silent removal of audit, coverage, package, or packaged checks.
- [x] Branch rules and current required checks are captured in sanitized evidence.

## Risk Assessment

- Coverage can incentivize shallow tests. Mitigation: protect scenario matrices and packaged behavior,
  not only percentages.
- GitHub rulesets can lock maintainers out during incidents. Mitigation: one audited break-glass path,
  never normal daily use.
- Windows minutes increase. Mitigation: deduplicate push/PR packaged jobs; make the PR run authoritative.

## Security Considerations

Branch protection is a security boundary for this private release repository. Administrative bypass,
renamed checks, and duplicate green push statuses must be treated as release-control defects.

## Next Step

Phase 4 consumes only an exact merge-tree artifact that passed this gate.
