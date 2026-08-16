# Phase 02 - Local Control Surface and Proxy Containment Complete

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-1344-phase-02-high-risk-continuation.md`](./audit-260816-1344-phase-02-high-risk-continuation.md)
Repo: MKTBrowser @ `feat/mkb-03-compatibility-set`
Status: **COMPLETE - 20 of 20 hypotheses H21-H40 closed at D4. Nothing pushed.**

## Summary

The final three open hypotheses produced three fixed findings:

| Hypothesis | Finding | Result |
| --- | --- | --- |
| H28 | C18 P2 | A second legacy SSE connection can no longer replace the active stream. |
| H38 | C19 P2 | CRX identity and every extension-owned path now fail closed. |
| H39 | C20 P3 | Executable preload and main-process runtime registration must match the classified IPC inventory. |

Phase 02 now has executable evidence for all 24 MCP tool decisions, transport authentication,
legacy SSE ownership, safe CDP forwarding, managed-launch invariants, proxy containment and identity
transitions, extension installation, and renderer/main IPC parity. The D2 read also covered the
remaining extension pipeline and Relay handlers listed in the phase scope; no additional finding was
raised from those handler reads.

## H28 - deterministic legacy SSE ownership

### Finding C18 (P2, fixed)

`HttpTransport` stored the current legacy SSE transport in one slot. A second authenticated
`GET /sse` replaced that slot without closing the first client, so later `/messages`, health state,
and shutdown ownership could refer to a different stream than the one still connected.

The transport now accepts one legacy SSE stream at a time. A second connection receives `409` and
cannot change the active slot. Closing the active socket clears the slot, after which a replacement
connection succeeds. The fixture owns and closes every socket, with no retry or forced-exit path.
Removing the exclusivity guard made the regression test red.

Evidence: `packages/mcp-server/src/http-transport-auth.test.ts` and commit `4d85925`.

## H38 - CRX identity and path containment

### Finding C19 (P2, fixed)

The prior pipeline treated CRX key recovery as optional. A CRX whose publisher identity could not be
verified could degrade to a content-hash identity and continue installing. Store paths also depended
on extension-controlled or persisted version/path values without one consistent owned-root check.

The pipeline now:

1. verifies CRX2 and CRX3 publisher signatures before trusting the embedded key;
2. derives the extension ID from the verified publisher key;
3. requires a Web Store download to match the requested extension ID;
4. rejects ZIP traversal and unsafe manifest versions; and
5. refuses persisted profile/shared-store references that resolve outside their owned roots.

The synthetic suite passes 6/6 and covers valid CRX2/CRX3 packages, tampered signatures, requested-ID
mismatch, ZIP traversal, manifest-version escape, and persisted-path escape. A real CRX downloaded
from Google's endpoint also passed signature verification, matched its requested ID, and reported
version `2026.812.1211`. The 9 MB verification artifact was moved outside the repository to
`E:\MKTWorkspace\local-test-artifacts\h38-real-crx-verification-20260816` and was not committed.

Evidence: `apps/desktop/src/main/extensions/crx-pipeline.test.ts` and commit `f0c45c6`.

## H39 - executable IPC parity

### Finding C20 (P3, fixed)

The prior contract extracted IPC names from source text. That could stay green while a refactor,
wrapper, typo, or stale renderer type changed what the executable preload or main process actually
registered.

The preload API is now constructed through an executable factory. Its test invokes every exposed
method and subscribes to every event, proving coverage of all 33 invoke channels and 5 event
channels. Main-process registration uses one guarded registry and fails startup when a classified
handler is missing, registered twice, or replaced by an unclassified channel. Mapping
`system.info` to the wrong channel made the parity test red.

The same work corrected type drift for `mcpAuthToken` and the `closing` profile lifecycle state.
The packaged application reached the new runtime completeness assertion successfully.

Evidence: `apps/desktop/src/main/ipc-runtime-parity.test.ts` and commit `28ff2e4`.

## Phase 02 commits

| Commit | Scope |
| --- | --- |
| `0d3efa2` | Safe CDP domain lifecycle (H24/C15). |
| `7d9f6f0` | Proxy geo and proxy-removal identity transitions (H36/H37/C16/C17). |
| `4d85925` | Single-owner legacy SSE lifecycle (H28/C18). |
| `f0c45c6` | CRX signature, identity, and path containment (H38/C19). |
| `28ff2e4` | Executable preload/main IPC runtime parity (H39/C20). |

The MKTBrowser branch is five commits ahead of its remote. No push was performed.
`packages/mcp-server/src/server.ts` remains reported as modified only because of line-ending state;
its content diff is empty and it was not staged.

## Final gates

All required commands used Node `E:\tools\node-v22.23.1`.

| Gate | Result |
| --- | --- |
| `yarn test:installer` | PASS |
| `yarn typecheck` | PASS |
| `yarn lint` | PASS, 0 errors and 3 pre-existing React hook warnings |
| Windows directory package build | PASS |
| `yarn verify:packaged-contract` | PASS |
| Packaged runtime IPC completeness assertion | PASS |

The packaged-contract verdict came from the command result and runtime output, not from
`gh run watch --exit-status`. No CI watch exit code is treated as authoritative.

## Recommendations

1. Begin Phase 03 with C10, C14, and C16 as explicit lifecycle inputs.
2. Resolve the hypothesis-ID collision before Phase 03 execution: Phase 02 now owns H40, while the
   Phase 03 draft also starts at H40.
3. Keep the five MKTBrowser commits and this audit checkpoint unpushed until the user explicitly
   authorizes a push.

## Unresolved questions

None for Phase 02.
