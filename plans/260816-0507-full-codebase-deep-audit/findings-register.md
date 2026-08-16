# Deep Audit Findings Register

Last reconciled: 2026-08-16

This is the merged status index. Phase reports contain reproduction detail and full evidence. A
closed finding remains listed because its regression test or operational decision is part of the
product's safety case.

## Prior Sweep Findings

| ID | Severity | Status | Current evidence or next owner |
| --- | --- | --- | --- |
| F1 | P2 | Fixed | MKTBrowser CI runs the aggregate installer/runtime suite. |
| F2 | P2 | Partial | Renderer security is structurally tested; safe-CDP and managed-launch guards are now behavioral; H28/H38/H39 remain. |
| F3 | P2 | Partial | MCP auth, dispatch, and proxy containment gained behavioral tests; H28/H38/H39 remain. |
| F4 | P2 | Fixed | `/encrypt-for-vault` enforces the trusted Origin with sabotage-backed tests. |
| F5 | P2 | Fixed | Relay capability enforcement is tested against real handlers and hostile origins. |
| F6 | P3 | Open | Plaintext Browser token behavior is partly legacy/optional; document or redesign deliberately. |
| F7 | P1 | Operational rollback resolved | Production Relay identity was backed up and restored; archive retention remains undecided. |
| F8 | P3 | Fixed | MKTBrowser ESLint is part of `yarn lint`. |
| F9 | P3 | Accepted/deferred | Oversized modules remain; split only at real responsibility boundaries. |
| F10 | P3 | Open | MKTTool branch CI policy still needs a cost/coverage decision. |
| F11 | P3 | Fixed | Unused health helper removed. |
| F12 | P3 | Fixed with correction | Real dead exports removed; earlier false positives were preserved. |
| F13 | P3 | Fixed | `nanoid` advisory removed. |
| F14 | P3 | Fixed | Empty corrupt-name directories removed; origin was external to both repos. |
| F15 | P3 | Open | Documentation language policy needs an explicit legacy-content scope. |

## Deep Audit Findings

| ID | Severity | Status | Retest gate or next owner |
| --- | --- | --- | --- |
| C1 | P3 | Open | Add protocol domain separation through a coordinated wire-format change; Phase 04. |
| C2 | P3 | Open | Define signing-seed quality policy; Phase 04. |
| C3 | P3 | Open | Reject low-order Ed25519 points in both key import implementations; Phase 04. |
| C4 | P2 | Fixed | Non-canonical X25519 device keys rejected; `relay-device-key-point-validation.test.ts`. |
| C5 | P3 | Open | Sealed-box envelope binding folds into C1 remediation. |
| C6 | P3 | Fixed | Migration read-back and post-deletion guards have sabotage-backed tests. |
| C7 | P3 | Fixed | Grant substitution is covered by `operator-key-grant-substitution.test.ts`. |
| C8 | P3 | Fixed | Bootstrap take-and-clear ordering and concurrency are covered. |
| C9 | P3 | Fixed | MCP dispatch deny check is covered by `mcp-tool-authorization.test.ts`. |
| C10 | P3 | Open | Installer suite depends on live machine state; Phase 03 hermeticity work. |
| C11 | P2 | Fixed | SOCKS5 bridge is loadable by the repository's Node test runner. |
| C12 | P2 | Fixed | Invalid HTTP-CONNECT destinations rejected; `socks5-bridge-http-upstream.test.ts`. |
| C13 | P3 | Fixed | WebRTC runtime-identity guard covered by commit `4ebb8d5`. |
| C14 | P3 | Fixed | Packaged verifier retries bounded transient Windows cleanup locks; commit `c63cc36`. |
| C15 | P3 | Fixed | Safe CDP rejects untracked `*.enable` commands; `cdp-safe-mode.test.ts` and MCP safe-mode forwarding test. |
| C16 | P3 | Mitigated/accepted residual | Proxy-geo outage is leak-safe: stale country is cleared, a stable diagnostic is logged, and WebRTC is disabled; launch may still retain a timezone mismatch until the probe recovers. |
| C17 | P3 | Fixed | Removing an existing unmanaged proxy now requires explicit confirmation before autosave; `proxy-removal-safety.test.ts`. |

## Current Phase 02 Coverage

| State | Hypotheses |
| --- | --- |
| Closed | H21-H27, H29-H37, H40 |
| Open, high priority | None in the selected continuation scope |
| Open, lower priority | H28, H38, H39 |

## Next Sequence

1. Close or explicitly defer H28, H38, and H39 with executable evidence.
2. Carry C10/C14/C16 evidence into Phase 03 Windows lifecycle analysis.
3. Complete Phase 04 before any operational release decision.

## Unresolved Questions

1. Should F6 be documented as an accepted local-token boundary, or should both token copies move to
   an OS-backed store together?
2. Should F10 enable CI on every branch, or only on pull requests to control runner cost?
3. Is Phase 06 documentation accuracy part of this audit, or a separate documentation pass?
