---
phase: 3
title: Repair compatibility artifact TLS trust
status: in-progress
priority: P1
effort: 3-5h
dependencies:
  - 1
---

# Phase 3: Repair compatibility artifact TLS trust

## Overview

Make the intended compatibility artifact path work in the exact packaged Relay runtime while
retaining normal certificate, hostname, authorization, signature, size and hash verification.

## Requirements

- The failure was pilot TLS. Production public TLS is OPEN, not proven broken.
- Never use `NODE_TLS_REJECT_UNAUTHORIZED=0`, `rejectUnauthorized:false`, an insecure global
  dispatcher, HTTP fallback, or bypassed hostname checks. No pilot CA embedded in release bytes.
- Trust configuration must work before the first download in the real installed launch context.
- Released companion, updater-helper, restart, and installer launches must scrub inherited
  `NODE_OPTIONS`, `NODE_EXTRA_CA_CERTS`, `NODE_USE_SYSTEM_CA`, and
  `NODE_TLS_REJECT_UNAUTHORIZED`. A disposable TLS fixture may pass scoped trust only to its
  explicitly launched test process; it must not become a released environment policy.

## Related Code Files

- Inspect/modify if proven necessary: `E:/MKTWorkspace/MKTTool/relay/src/compatibility-artifact-staging.ts`.
- Inspect: `E:/MKTWorkspace/MKTTool/relay/src/handle-compatibility-update.ts`,
  `compatibility-update-helper.ts`, and `local-updater.test.ts`.
- Inspect: `E:/MKTWorkspace/MKTTool/scripts/build-relay-executable.ts`,
  `relay-executable-harness.ts`, `smoke-test-relay-executable.ts`.
- If child environment changes are necessary: Browser
  `E:/MKTWorkspace/MKTBrowser/apps/desktop/src/main/windows-relay-companion.ts` and matching launcher script/tests.
- Prefer a corrected disposable pilot host/launch helper when the defect is only pilot trust.
  Keep reusable helpers in source; receipts/binaries under a fresh untracked evidence root.

## Architecture And Decision

`stageCompatibilitySet` uses built-in Node `fetch`; the Relay is a Node SEA executable. The frozen
artifact metadata reports Node v24.21.0. Windows root-store success is not an attestation about
Node's selected CA set or the process environment at startup.

Preferred order after evidence:

1. Correct pilot server chain/SAN/clock configuration if invalid.
2. Prefer a disposable endpoint with a normally trusted public certificate when it can preserve
   the candidate's signed origin/path authorization and isolated fixture routing.
3. Otherwise use narrowly scoped pilot CA trust for only the disposable Relay process. Validate
   actual SEA support for startup CA settings such as `NODE_EXTRA_CA_CERTS` or system-CA opt-in;
   do not assume flags/environment work because the host Node supports them. Avoid adding a
   permanent OS root or broad global dispatcher just to pass a pilot.
4. Change shipped trust behavior only if the supported production/private-CA policy requires it
   or public TLS reproduces a runtime defect. Document the scope and regression tests first.

## Implementation Steps

1. Confirm exact runtime/executable identity and TLS cause from Phase 1. Test trust stores,
   missing intermediates, SAN mismatch and clock without logging artifact auth headers or URLs
   containing tokens. A PowerShell 200 and host-only Node test cannot close this step.
2. Test supported trust settings at process launch. Loading `.env` after Node startup or setting
   parent environment after Relay is already running cannot establish this contract. Verify
   propagation through Browser companion and update-helper restarts where applicable.
3. Implement only the evidence-supported branch above. Keep normal CA roots alongside any
   required additional test trust; maintain authorization headers only on their exact signed
   managed origin/path set and keep redirects rejected.
4. Add sanitized downloader failure classification: TLS trust, network/timeout, HTTP refusal,
   invalid size/hash. Preserve the cause internally using fixed codes, never stringify raw causes
   into UI/logs. This avoids a generic `fetch failed` making the next incident opaque.
   Add a typed error boundary through the compatibility handler and generic Relay HTTP fallback so
   URL query tokens, local paths, raw headers, and provider stacks cannot escape through any error
   response, UI, receipt, or log.
5. Bound download header/body stalls with an explicit download policy suitable for the signed
   artifact sizes, distinct from the four-second local health budget. Cancel body/writer work
   and remove partial staging on failure. Do not add transparent download/ticket retries.
6. Exercise the real packaged downloader against controlled TLS fixtures: trusted success,
   unknown CA, incomplete chain, expired certificate, wrong hostname, redirect, HTTP refusal,
   truncated/oversize bytes and hash mismatch. Mocked fetch cannot prove TLS behavior.
   Add positive and negative environment propagation checks for companion, update helper, restart,
   and installer launch paths. The test fixture owns any extra CA value and verifies it is absent
   from normal released children.
7. Before a new compatibility attempt, capture current/highestAccepted/rollbackFloor/pending and
   smoke-profile inventory. A download failure can occur AFTER ADMIN repair-state initialization,
   ticket consumption and smoke-profile provisioning; `transitionStarted=false` does not mean
   zero mutation. Reconcile those states; obtain a fresh signed authorization when repeating a
   planned attempt. Never lower sequence floors or replay the historical ticket.

## Success Criteria

- [ ] Intended artifact downloads in the exact SEA process with strict certificate verification.
- [ ] Invalid certificates and unauthorized/redirected paths are rejected before activation.
- [ ] Signed size/hash/control contract checks, staging cleanup and sequence protections pass.
- [ ] Pilot trust and production public-TLS verdicts are reported separately.
- [ ] Pilot trust changes are scoped, reversible and absent from the release artifact/environment.

## Historical Source-only Checkpoint - 24 September 2026

This earlier snapshot predates the exact-runtime diagnostics below.

PASS (committed source): Relay source validation includes TLS regressions 12/12 and the 514/514
Relay suite; Browser release-path tests pass separately under Node 22.23.2/Yarn 4.5. OPEN: no exact
packaged SEA process has exercised the intended chain or invalid-chain matrix, and public TLS is
unmeasured. The historical pilot TLS failure remains retained evidence. Source freeze is MKTTool
`b9dda844a6ab1cc4f355799486bdda40782af5b5` and MKTBrowser
`a56d8b6e22c1cc1e65419d72557bca7c7d869db5`; it does not close TLS acceptance. Browser
`7df85768f1e9ec6e23da39c9d87aed09acdc098d` subsequently repairs cached Relay handoff receipt
creation with focused 25/25 PASS evidence; its full source-freeze refresh remains in progress.

## Retained v20 Exact-Runtime Diagnostic - 25 September 2026

FAIL (retained bytes only): the immutable Relay v20 archive SHA-256
`9cc71eba405c8ea5ff9f288491ea0b827c7403b3c43541d1fa18c48a87126d69` and extracted executable
SHA-256 `dd05b68d97dc2e8689bb6966e34911a38297331742d29fb229366040d5d4199a` reached the real
compatibility-update handler. A normal bootstrap-parent launch correctly strips the disposable
`NODE_EXTRA_CA_CERTS` value and therefore rejects the private fixture CA; that protected launch is
not a scoped-trust acceptance path. The test-owned direct child accepts the scoped CA, stages the
trusted set, then fails because the old v20 `onPrepared` callback never sends the terminal handoff
or exits after helper-lock suppression (`null !== 0`). No TLS verification, hostname, redirect,
authorization, size, hash, or activation check was bypassed.

The subsequently committed source repairs that lifecycle defect with an explicit close -> coordinate -> handoff ->
exit boundary. A locally built, fixture-bound Relay v20 SEA archive
`cb2cf850d391c5bbc07730d4c67be284944ad760374c2f7237d10609eee3cc1c` (executable
`9b1e252255f28f2c6befb4a203bfb51104487ec70b399e13e2fdb403238a48b6`) passed the direct-child
trusted, missing-intermediate, and wrong-hostname sequence 3/3. The disposable current-source
matrix also passed `npm run relay:verify-tls` 12/12, and the normal packaged smoke passed. These
are local source diagnostics; the repair is committed locally as MKTTool
`b2e0707219c080045d9406518ee3ad65358cada1`, but the archive is not a replacement candidate or
public-TLS result.

Fixture cleanup PASS: a Global Windows kernel mutex, namespaced by current-user SID, serializes
CurrentUser certificate-store cleanup across Windows sessions and releases through every creation
failure path. Retained-case cleanup now runs all process, fixture, filesystem, and signing-key legs
even when the Relay cannot stop. After the expected retained-v20 failure, no legacy fixture lock,
tagged CurrentUser certificate, fixture or retained-case directory, or Relay process remained.
Noninteractive system-store trust remains BLOCKED; do not substitute a global root-store change for
scoped diagnostics. Public TLS and exact replacement-candidate acceptance remain OPEN. Normal-parent launch intentionally
scrubs scoped trust overrides; a direct-child fixture does not establish installed launch behavior.

## Replacement Source Checkpoint - 25 September 2026

Browser `0.3.27` / Relay `20` now pins production-origin archive
`c66a39353252ffa7b6ad9b936f5aad02634c729560f3b49793f4cbfe5b55526b` and executable
`630c134f879b253fa4174905604042d0b1f7089624cf045c57e883c744666b88`.
Archive size is 35,123,164 bytes; the executable is unchanged. The earlier unpublished
`e749be84...7439ff` ZIP depended on mixed LF/CRLF script bytes. The exact-artifact gate caught the
mismatch and its immutable receipt remains BLOCKED. Tool `a32c293` now normalizes `setup.bat`,
`install-relay.ps1` and `start-mkttool-relay.cmd` to CRLF with BOM preserved; Browser `605e54b`
binds that normalization helper as an input. The failed retained v20 terminal-handoff archive stays
forbidden. Final r2 Relay rebuild records exact Tool `a32c293` and matches the ZIP/executable pins.
Packaged smoke and direct-child strict TLS/handoff pass 3/3; the Relay runner passes 5/5, including
532 tests and the separate TLS fixture 12/12. Source binding now records Browser `67e8f16`.
The official Browser gate passes 8/8; machine skips are covered, post-quality binding and cleanup
pass. Exact evidence is owned by the
[current checkpoint ledger](../reports/checkpoint-260925-1335-candidate-backlog.md).
Do not reuse a diagnostic-origin archive or transfer the historical fixture PASS to public TLS,
normal installed launch, or clean-VM acceptance.

## Risk Assessment

A pilot trust fix may require no shipped TLS code change. Do not turn a test-environment issue
into a new production trust policy. Preserve existing production readiness status until measured.
