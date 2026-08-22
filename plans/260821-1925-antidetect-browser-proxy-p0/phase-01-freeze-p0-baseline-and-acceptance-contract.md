---
phase: 1
title: "Freeze P0 Baseline and Acceptance Contract"
status: in-progress
priority: P1
effort: "0.5-1 day"
dependencies: []
---

# Phase 1: Freeze P0 Baseline and Acceptance Contract

## Overview

Freeze the exact source, runtime, installed artifacts, proxies, and acceptance measurements before
more Browser code changes invalidate existing evidence. Establish a repeatable Node 22 toolchain
and a sanitized evidence schema that every later phase must use.

## Context Links

- E:\MKTWorkspace\MKTTool\AGENTS.md
- E:\MKTWorkspace\MKTTool\README.md
- E:\MKTWorkspace\MKTBrowser\README.md
- E:\MKTWorkspace\plans\260816-0507-full-codebase-deep-audit\plan.md
- E:\MKTWorkspace\plans\reports\review-260821-1019-nghiem-thu-d1-ep-occlusion.md

## Requirements

- Functional: record root, MKTTool, and MKTBrowser branch and commit identity; inventory untracked
  reports without absorbing unrelated work; identify installed Relay and Browser versions and hashes.
- Functional: install or select a supported Node 22 plus Corepack runtime capable of the full Browser
  build and prepackage gates.
- Functional: define disposable profile IDs, assigned proxy labels, test order, rollback artifact,
  and which actions require owner presence.
- Non-functional: evidence contains boolean matches, timings, country/ASN labels, hashes, and stable
  error codes; never raw secrets, full keys, proxy URLs, observed IP addresses, tickets, or cookies.
- Non-functional: no network capture against unrelated applications or accounts.

## Architecture

This phase changes no production behavior. It creates the measurement contract for later phases:
source SHA -> build commands -> installed artifact SHA -> profile/proxy assignment -> run identifier
-> sanitized observations -> verdict. Evidence from a different SHA or package is invalid.

## File Inventory

| Action | Path | Purpose |
|---|---|---|
| Create during execution | E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\reports\baseline-report.md | Frozen SHAs, commands, artifact hashes, and open blockers |
| Create during execution | E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\reports\acceptance-matrix.md | Gate IDs, run IDs, metrics, and evidence links |
| Inspect | E:\MKTWorkspace\MKTTool\package.json | Web, Relay, test, and build commands |
| Inspect | E:\MKTWorkspace\MKTBrowser\package.json | Node, Yarn, test, and packaging contract |
| Inspect | E:\MKTWorkspace\MKTBrowser\apps\desktop\package.json | Desktop release version and Windows build path |
| Delete | None | Baseline work must preserve all existing evidence |

## Tests Before

1. MKTTool: npm test, npm run typecheck, npm run lint, npm run build.
2. MKTBrowser under Node 22: corepack yarn verify:node, typecheck, lint, test:installer.
3. MKTBrowser: workspace desktop build and packaged runtime-contract verification.
4. Record skipped human/machine integration tests separately; do not count them as passes.

## Implementation Steps

1. Capture git status, branches, remotes, SHAs, tags, and ahead/behind state for all three repositories.
2. Assign ownership for the existing 18 root untracked reports; do not stage, rename, or delete them.
3. Stop only disposable test processes after recording their owners; never terminate operational Relay
   or Browser processes by name.
4. Establish Node 22 with adjacent Corepack so package-windows preflight uses ABI 127 end to end.
5. Run the baseline checks and record exact pass, fail, skip, and warning counts.
6. Hash the local Browser directory/installer candidate and Relay archive; record version numbers.
7. Confirm ports 47821 and 47822 belong to the expected installed binaries.
8. Select two disposable profile/proxy pairs. Store only internal IDs and labels in the matrix.
9. Define run naming, sanitization, evidence retention, and invalidation rules.
10. Freeze rollback inputs before any later phase changes production launch behavior.

## Test Scenario Matrix

| Scenario | Expected |
|---|---|
| Wrong Node version | verify:node and packaging fail before artifact creation |
| Dirty source or changed artifact | baseline marked invalid; no downstream verdict |
| Port owned by foreign process | setup/readiness reports exact conflict; no process killed |
| Secret appears in captured output | evidence rejected and redacted before retention |
| Skipped machine gate | recorded as open, never converted to pass |

## Dependency Map

- Starts immediately.
- Blocks phases 2-6.
- Blocks completion of the pre-MKB-04 audit because P0 changes invalidate its frozen artifacts.

## Tests After

- Re-run the same baseline commands from a fresh shell using the recorded Node 22 activation steps.
- Verify hashes and pass counts reproduce.
- Run a redaction review over all baseline evidence.

## Regression Gate

- MKTTool: 100% current tests, typecheck, lint, and build pass.
- MKTBrowser: verify:node, typecheck, lint with zero errors, test:installer, desktop build, and
  packaged contract pass under Node 22.
- No tracked worktree changes are introduced by verification commands.

## Success Criteria

- [x] Source SHAs, installed versions, artifact hashes, and port owners recorded.
- [x] Node 22 plus Corepack reproduces the complete Browser packaging preflight.
- [ ] Two disposable profile/proxy assignments approved for testing.
- [x] Evidence schema and secret-redaction checklist approved.
- [x] Rollback artifact identified and verified.
- [x] Every open human gate remains visibly open.

## Risk Assessment

- Existing local test processes may make the baseline unstable. Mitigation: require five minutes of
  file stability and explicit process ownership before freezing.
- Packaging may mutate native modules between Electron and Node ABIs. Mitigation: use the repository
  packaging path and verify the finally-block restores development binaries.
- Old installed Relay or Browser builds may answer the correct ports. Mitigation: verify executable
  path, version, and hash, not only health responses.

## Security Considerations

- Never read or record environment secrets, full license keys, proxy credentials, or decrypted tickets.
- Hashes identify artifacts, not secret configuration.
- Disposable data roots must not overlap operational profile roots.
