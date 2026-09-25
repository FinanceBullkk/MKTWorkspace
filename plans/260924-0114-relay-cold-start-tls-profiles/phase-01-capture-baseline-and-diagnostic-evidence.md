---
phase: 1
title: Capture baseline and diagnostic evidence
status: in-progress
priority: P1
effort: 3-4h
dependencies: []
---

# Phase 1: Capture baseline and diagnostic evidence

## Overview

Establish a reproducible baseline and capture failures before assertions can discard evidence.
Do this before changing timeouts, trust settings, or profile admission rules.

## Requirements

- Preserve original candidate bytes and immutable receipts; use a fresh evidence directory.
- Record only sanitized structured diagnostics. No tickets, credentials, profile names, proxy
  endpoints, raw environment dumps, full response bodies, or raw exception stacks in receipts.
- Reuse the terminal report and original receipts. Do not rerun passed historical installation
  gates merely to rediscover these failures. A replacement candidate needs its own gates later.

## Related Code Files

- Read: `E:/MKTWorkspace/plans/reports/260923-2257-0324-clean-vm-acceptance-terminal.md`.
- Read: the three failure receipts under the evidence root in `reports/source-analysis.md`.
- Inspect/modify narrowly: `E:/MKTWorkspace/MKTTool/relay/src/main.ts`,
  `relay-antidetect.ts`, `handle-profiles.ts`, and `compatibility-artifact-staging.ts` in the same directory.
- Inspect: `E:/MKTWorkspace/MKTBrowser/apps/desktop/src/main/windows-local-install-inspector.ts`.
- Create if needed: a reusable bounded recorder under `E:/MKTWorkspace/MKTTool/scripts/diagnostics/`;
  discover/reuse existing helpers first. Do not modify original evidence scripts in place.

## Architecture

Capture and classification are separate. Write a sanitized observation even when expected UI
state, JSON parsing, TLS, or status assertions fail; write the verdict afterward. Hash receipts
and include candidate/source identity plus a generated non-secret correlation ID.

## Evidence Checkpoint - 25 September 2026

Historical candidate bytes and receipt hashes remain preserved. Local exact-SEA diagnostics now
exist: the retained v20 failed terminal handoff, while the separate repaired fixture passed its
strict TLS/handoff cases. See Phase 3 for the immutable identities and scope. The original
`/profiles` response body was not retained; its exact cause cannot be reconstructed from a later
reproduction. This records the baseline limitation, not a new gate requiring impossible recovery.

The replacement `0.3.27` / Relay `20` pins and source repairs are committed. Exact rebuild exposed
a script line-ending mismatch in the earlier unpublished ZIP; its BLOCKED receipt and entry hashes
remain preserved. Final source normalizes delivered scripts and selects archive `c66a3935...5526b`.
Clean source freeze, final Tool r2 gates and exact Relay smoke/TLS/provenance pass locally.
The final Browser gate passes 8/8; explicit machine skips are covered by the dedicated 4/4 gate.
Post-quality source binding and owned-environment cleanup also pass, as recorded in the
[current checkpoint ledger](../reports/checkpoint-260925-1335-candidate-backlog.md).
New candidate observations must capture safe code/stage and cold timing. This phase remains
in progress while those practical observations are missing.

## Implementation Steps

1. Read both README/AGENTS files; record HEAD, tree, dirty paths, lock hashes and toolchain IDs.
   Baselines: Browser `81f3014821c471b583a37fae0dd001d0e10f59ce`; current Web
   `43b12a76b37d932b4e3ceb330e2897e4421b3b73`; frozen Relay source
   `450975c0006d6804ea3b0044c25c4db77e8ee3d8`. Recheck rather than assume parity.
2. Verify receipt SHA-256 sidecars. The original fixture was cleaned up; inspect current VM and
   services before restoring anything. Create a new synthetic session/fixture when needed.
3. Add monotonic spans for process start -> listen, request -> complete body, MCP initialize/tool
   discovery/runtime-info, Windows install inspection, compatibility-state secure-store read,
   profile list, and fingerprint-options call. Measure both concurrent page GETs. Log duration,
   outcome, cache hit and in-flight reuse only; do not log secrets or identifying payloads.
4. Review existing protected state/DPAPI access too. The install inspector is a strong suspect,
   not proof that all delay occurs there. Measure completed inspection versus inspection timeout.
5. Prepare `/profiles` recorder with one bounded read of the response, status, content type,
   byte count/truncation, `ok`, Relay version, allowlisted `code`/`stage`, and a safe reason key.
   Only known operator-safe messages may be retained; unknown message text gets a digest and
   local branch correlation. Limit capture to 16 KiB with an explicit body-read deadline.
6. Persist the observation before UI assertions. Record UI state independently; no expected
   `no-capacity` assertion may prevent capture. Non-JSON/oversize/empty/aborted bodies still
   produce receipts. Do not reissue a GET to recover a body-read or assertion failure.
7. First attempt offline recovery from already retained evidence, without a network request.
   If insufficient, conduct one freshly planned read-only diagnostic GET with the recorder ready.
   Preserve the original missing-body result as OPEN even if a later reproduction finds a cause.
8. For TLS capture allowlisted `error.cause.code`, handshake stage, endpoint role, presented
   certificate fingerprints, hostname-match/validity/chain verdicts, runtime version and trust
   configuration presence. Correlate an exact SEA attempt, not just PowerShell or host Node.
9. Publish a hypothesis table with measured spans and rejected alternatives. Stop speculative
   changes if the expected branch is not reproduced; continue independent repair tracks.

## Success Criteria

- [ ] Every failed diagnostic writes a sanitized receipt before any assertion.
- [ ] No new profile create/launch or old compatibility ticket replay occurred during diagnosis.
- [ ] Cold handler delay is separated from process boot and browser permission behavior.
- [ ] TLS trust hypothesis has exact-runtime evidence or is explicitly OPEN.
- [x] `/profiles` baseline capture limitation is documented; original cause remains unknown.

## Risk Assessment

Instrumentation can warm caches and invalidate a cold trial. Start timing on the delivered entry
path and label warm diagnostics separately. Protect recordings from leaked error text; fixed
classification plus internal stage IDs are more useful than a digest alone.
