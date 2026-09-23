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

## Risk Assessment

A pilot trust fix may require no shipped TLS code change. Do not turn a test-environment issue
into a new production trust policy. Preserve existing production readiness status until measured.
