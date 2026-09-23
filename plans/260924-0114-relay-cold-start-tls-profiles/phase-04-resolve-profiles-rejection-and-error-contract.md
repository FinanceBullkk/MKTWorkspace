---
phase: 4
title: Resolve profiles rejection and error contract
status: in-progress
priority: P1
effort: 3-4h
dependencies:
  - 1
  - 2
---

# Phase 4: Resolve profiles rejection and error contract

## Overview

Resolve the captured `/profiles` rejection and preserve stable, sanitized errors from Relay through
Web. HTTP 400 alone does not identify malformed input or licence capacity.

## Requirements

- Determine which guard/tool failed before changing business behavior.
- Retain legitimate refusal when Browser/engine/contract/capacity is not ready.
- Preserve valid empty inventory as 200 with options; never turn a failed read into an empty list.

## Related Code Files

- Modify: `E:/MKTWorkspace/MKTTool/relay/src/handle-profiles.ts`, `handle-profiles.test.ts`.
- Inspect/modify as necessary: `E:/MKTWorkspace/MKTTool/relay/src/relay-antidetect.ts` and
  `E:/MKTWorkspace/MKTTool/src/lib/antidetect/mkt-browser-adapter.ts`.
- Coordinate: `E:/MKTWorkspace/MKTTool/src/lib/relay/relay-endpoints.ts`, `relay-failure-code.ts`,
  `profile-setup-readiness.ts`, and `profile-setup-readiness.test.ts`.
- Inspect: `E:/MKTWorkspace/MKTTool/relay/src/relay-http-server.ts`,
  `E:/MKTWorkspace/MKTTool/src/components/vault/antidetect-profile-card.tsx` and its browser check.

## Architecture

Current route policy maps every `ok:false` response to HTTP 400. Retain this compatibility for this
fix unless evidence demands otherwise; do not migrate status codes across all Relay endpoints.
Add an allowlisted top-level read-failure `stage` alongside the existing optional `code`; do not
misuse operation diagnostics, which require an operation identifier. Forward the already typed
`AntidetectRuntimeNotReadyError.code`, which the handler currently discards. Provide safe codes
for not configured, list failure and options failure using existing vocabulary where possible.

The UI runs health and profiles concurrently. A ready health result cannot erase a profile-read
failure; an older response cannot overwrite a newer check. During simultaneous failures, show
the most specific current verified reason with conservative action gating, never text heuristics.

## Implementation Steps

1. Link the Phase 1 response/branch evidence. Classify: not configured/token, Browser offline,
   contract mismatch, engine not ready, capability missing, capacity/recovery refusal, list tool,
   options tool, adapter handshake, or response-shape problem. Keep alternatives unproven.
2. Add a regression for the observed branch. If no reproducible cause exists, ship diagnostic
   hardening with the cause gate OPEN rather than claim a speculative repair.
3. Preserve `code` and stable stage (`browser-health`, `profile-list`, `fingerprint-options`, or
   equivalent existing contract) in each failure. Catch failures at the responsible stage while
   retaining independent list/options execution if useful. Do not echo arbitrary adapter errors.
   Test the direct HTTP response, client parser, and rendered guidance with error strings that
   contain proxy-like values, tokens, URLs, and local paths; none may escape the fixed contract.
4. If compatibility never activated the engine and the measured guard is `ENGINE_NOT_READY`,
   the dependency is Phase 3 activation; complete it before retest. Do not remove the readiness
   check to force 200. Do not label a CFT fixture `NO_CAPACITY` without actual evidence.
5. Repair only the proven source defect or fixture condition. For token/handshake/contract failures,
   preserve same-device authorization and matching versions. For genuine capacity refusal retain
   the seat policy; this task does not change licence admission or profile concurrency.
6. Map known failure codes to fixed operator-safe guidance and one manual next action. Unknown
   older responses stay conservative. Do not infer causes by parsing localized message strings.
7. Verify snapshot consistency in the profile card and precedence with Phase 2: old timeout plus
   a later independent diagnostic is not evidence that the original UI saw that diagnostic.
8. Extend real-page tests: health pending, permission unknown/denied, profile 400 with code,
   legacy code-less 400, invalid JSON, valid empty inventory, nonempty inventory and recovery
   after one deliberate Check again. No profile launch is needed to prove an inventory read.

## Test Matrix

| Case | Required result |
|---|---|
| Each runtime readiness error | Stable code + stage; no adapter inventory call; no empty success |
| List fails / options fails | Correct stage; safe message; readiness cache invalidated as needed |
| Engine activated and all checks pass | 200; valid profiles/options; UI can offer next action |
| Health says ready but profiles rejects | UI remains blocked with profile error |
| Unknown code, malformed body or conflicting versions | Conservative fallback, no invented outdated/permission/capacity cause |
| Error embeds proxy secret, token or local path | None appears in UI, logs or receipt |

## Success Criteria

- [ ] A real captured code/stage explains the reproduced 400, or unresolved cause is explicitly OPEN.
- [ ] Known failures retain meaningful safe code/stage through server and Web mapping.
- [ ] Valid empty/nonempty inventory succeeds; all required guards remain enforced.
- [ ] No raw exceptions, repeated diagnostics, automatic profile creation or launch retries.

## Risk Assessment

HTTP 400 may be a correct rejection caused by failed compatibility activation, not a third
independent implementation bug. Closure must identify that dependency from evidence.
