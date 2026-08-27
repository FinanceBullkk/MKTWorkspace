---
phase: 7
logicalPhase: 6
title: "Compatibility and VM Review (No Integration Changes)"
status: pending
priority: P1
effort: "90m compatibility review; VM/review wall time scheduled separately"
dependencies: [phase-06]
---

# Phase 6: Compatibility and VM Review (CLI phase 7)

## Context Links

- Plan: [plan.md](./plan.md)
- Persistence gate: [profile persistence and rollback](./phase-06-profile-persistence-and-rollback.md)
- MKT Browser contract: `MKTBrowser/README.md:3-10,109-156,217-225`
- W02 contract: `MKTBrowser/docs/mkb-w02-windows-internal-clean-break.md:10-19,21-62`
- Acceptance baseline: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md:14-28,40-67`

## Overview

Verify that a passing experimental artifact remains outside MKT Browser and can be measured on the
disposable VirtualBox VM without changing any shell, profile, proxy, Relay, or MCP contract. This is
a compatibility review only: it does not connect an adapter or authorize a runtime descriptor.
Any future integration proposal requires a new plan and explicit owner approval. Implementation and
review run in different sessions.

## Key Insights

- MKT Browser currently owns `com.mkttool.browser`, `%LOCALAPPDATA%\MKTTool\MKTBrowser`,
  `@mktbrowser/*`, `window.mktBrowser`, `mkt-browser-mcp`, and loopback port `47822`; these are frozen.
- Existing engine bootstrap has checksum, firewall, and rollback boundaries per engine kind. Those
  paths are reference-only and remain untouched in this plan.
- A host pass is not a clean-VM pass. The VM gate must retain its own artifact/source hashes and verdict.

## Requirements

### Functional

- Snapshot and compare the existing MKT Browser/MKTTool contracts; do not add an engine descriptor or
  adapter in this plan.
- Exercise the experimental artifact only through its own disposable harness; use existing MKT
  Browser/Relay/MCP behavior as a read-only compatibility reference, not a launch path.
- Run a separate reviewer session against sanitized VM evidence and the declared matrix.

### Non-functional

- No contract version bump, tool rename, port change, profile schema migration, or shell refactor in
  this phase unless a new plan explicitly approves it.
- No real account, production profile, distribution, publish, or deployment.
- License/checksum/notice/approval review must pass before any binary leaves the experiment directory.

## Architecture

```text
MKTTool -> Relay -> existing MCP contract (unchanged, reference only)

experimental worktree/runtime -> profile-bound probe + rollback
```

No adapter edge is created here. Existing proxy, profile, lease, firewall, and MCP code stays the
source of truth and is checked only for unintended changes.

## Related Code Files

- **Create/modify:** none in MKTBrowser or MKTTool; VM evidence and review notes only.
- **Reference:** `ChromiumBootstrap.ts`, `ChromiumBrowserDriver.ts`, Relay and MCP contracts.
- **Must remain unchanged by default:** current MKTBrowser dirty files, `windows-engine-release.json`,
  port/identity constants, profile schema, Relay ticket flow, and production data.

## Implementation Steps

1. Snapshot current MKTBrowser/MKTTool SHAs, dirty digests, test counts, and engine pin.
2. Run sequential disposable launch/close/restart cycles through the experimental harness; retain
   sanitized evidence.
3. Reset a clean VM snapshot and run standalone artifact install/launch/update/rollback/uninstall
   checks; never reuse host results as VM evidence.
4. In a new session, review evidence against every criterion and issue `PASS`, `FAIL`, `BLOCKED`, or
   `NOT-RUN`; do not self-approve.

## Success Criteria

- [ ] Existing MKTBrowser/MKTTool contract constants, tool inventory, and tracked-file hashes are
  unchanged (`0` unintended diffs); baseline tests/typecheck/lint remain at or above pre-change counts.
- [ ] `10/10` sequential standalone experimental launches discover their own DevTools endpoint,
  close cleanly, and preserve the measured profile identity; no Relay/MCP path is modified.
- [ ] `10/10` standalone restart cycles and `2/2` update/rollback repetitions return the expected
  checksum and leave `0` orphaned processes or cross-profile reads.
- [ ] Clean VM evidence separately records install, launch, rollback, and uninstall verdicts with
  `0` secret-bearing fields; host evidence is not substituted.
- [ ] Independent review session confirms `0` open critical findings and explicitly lists every
  `NOT-RUN`/`BLOCKED` gate; no distribution occurs unless license/approval is `PASS`.

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Accidental integration into stable contract | Shell/Relay regression | Read-only diff guard; require a new plan for any adapter |
| VM resource contention | Invalid lifecycle evidence | Reset snapshot; run one VM gate at a time; retain VM hashes |
| License/notice gap | Unauthorized binary distribution | Keep non-production and block handoff until review |
| Self-review bias | False release claim | Separate implementation and review sessions with independent evidence |

## Security Considerations

- Preserve fail-closed proxy, DNS, WebRTC, lease, and path ownership controls; do not alter them.
- Redact tickets, tokens, credentials, IPs, cookies, and page content from all evidence.
- Never automate credentials or human-controlled account actions.

## Next Steps

If any integration or VM criterion fails, stop the phase and record the exact blocker. A pass is only
for the tested source/artifact/VM tuple and does not authorize general release.

## Unresolved Questions

- If a later plan is proposed, what capability boundary can be reviewed without changing the stable
  contract version?
- Which license/notice reviewer and artifact storage path will own the pre-distribution gate?
