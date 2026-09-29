---
phase: 1
title: "Lifecycle diagnosis"
status: completed
priority: P1
dependencies: []
effort: ""
---

# Phase 1: Lifecycle diagnosis

## Overview

Compare the working SDK path with the app and choose the smallest supported lifecycle change.
Do not assume Browser.close, exit code 0, or capacity 0 proves release of a specific vendor lease.

## Related Code Files
- MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts
- MKTBrowser/apps/desktop/src/main/browser-shutdown-sequence.ts
- MKTBrowser/apps/desktop/src/main/license-seat-exit-verdict.ts
- MKTBrowser/apps/desktop/src/main/startup-license-lease-reconciliation.ts
- plans/260921-1314-cloak-free-seat-reuse/verify-official-sdk-reuse.cjs

## Implementation Steps
1. [x] Read repository instructions and current lifecycle tests. Record baseline commits, runtime pin,
   executable hash, Node and dependency versions. Keep the successful SDK receipt immutable.
2. [x] Compare spawn arguments, environment, fingerprint/proxy flags, persistent directory ownership,
   CDP versus pipe transport, process handoff, close order and forced-kill deadlines.
3. [x] Trace normal window close, UI close, launch cancellation, partial startup and shutdown
   escalation. Preserve correlated diagnostics and sanitized lifecycle logs; capacity uses fixed
   reason codes and monotonic freshness. Never log credentials, raw command lines, proxy passwords,
   signed queries or account data.
4. [x] Record an explicit decision: repair existing launcher if supported by evidence; otherwise use
   a narrow official SDK lifecycle adapter. Avoid adding Playwright to production solely because
   the diagnostic used it. If selected, assess package size, Electron compatibility, dependency
   pinning, auto-download/update disabling, proxy fidelity and shutdown ownership.
5. [x] Write failing regression cases for identified differences before changing lifecycle semantics.
   Record unknown causes honestly; a successful alternative is not a causal diagnosis.

## Success Criteria
- [x] A comparison and adapter decision identify exact changed responsibilities.
- [x] Existing fingerprint flags, persistent storage and managed proxy setup are preserved.
- [x] No speculative session/start or session/end probe is introduced.
- [x] No live launch was used for this analysis; further experiments remain under Phase 4 budgets.

Decision record: [lifecycle comparison and adapter decision](./phase-01-lifecycle-comparison-and-decision.md).

## Risk Assessment
Transport changes may alter launch security or proxy behavior. Keep the public driver interface
and verify process/data-directory ownership rather than trusting the immediate spawned PID.
