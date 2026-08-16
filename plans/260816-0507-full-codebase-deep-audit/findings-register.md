# Deep Audit Findings Register

Last reconciled: 2026-08-17

This is the merged status index. Phase reports contain reproduction detail and full evidence. A
closed finding remains listed because its regression test or operational decision is part of the
product's safety case.

## Prior Sweep Findings

| ID | Severity | Status | Current evidence or next owner |
| --- | --- | --- | --- |
| F1 | P2 | Fixed | MKTBrowser CI runs the aggregate installer/runtime suite. |
| F2 | P2 | Fixed | Renderer security, safe-CDP, managed launch, executable preload API, and runtime IPC registration have behavioral parity guards. |
| F3 | P2 | Fixed | MCP auth/dispatch, SSE lifecycle, proxy containment, and extension install boundaries have behavioral tests. |
| F4 | P2 | Fixed | `/encrypt-for-vault` enforces the trusted Origin with sabotage-backed tests. |
| F5 | P2 | Fixed | Relay capability enforcement is tested against real handlers and hostile origins. |
| F6 | P3 | Closed by decision | `mktBrowserToken` stays plaintext deliberately. Normal operation discovers it from the MKT Browser data root and never writes it to `relay-config.json`; the config field is an explicit development override that the status page labels as such. DPAPI CurrentUser would add nothing against the only remaining reader — a same-user process — which is already outside the supported boundary per H53. See Decisions, 17 August 2026. |
| F7 | P1 | Operational rollback resolved | Production Relay identity was backed up and restored; archive retention remains undecided. |
| F8 | P3 | Fixed | MKTBrowser ESLint is part of `yarn lint`. |
| F9 | P3 | Accepted/deferred | Oversized modules remain; split only at real responsibility boundaries. |
| F10 | P3 | Closed by decision | Keep the existing triggers: push on `master`/`main` plus every pull request. Per-branch push CI is not worth the runner cost. Operating rule instead: a branch that lives beyond a day gets a draft PR so its commits are covered. |
| F11 | P3 | Fixed | Unused health helper removed. |
| F12 | P3 | Fixed with correction | Real dead exports removed; earlier false positives were preserved. |
| F13 | P3 | Fixed | `nanoid` advisory removed. |
| F14 | P3 | Fixed | Empty corrupt-name directories removed; origin was external to both repos. |
| F15 | P3 | Split; policy half closed | `AGENTS.md:25` already states the policy and its legacy scope: English for all new artifacts, no new Vietnamese, translate actively maintained sections on material revision. The real residual is narrower — the user-facing surface is mixed-language inside a single view (`relay-status-page.ts` renders "Cấu hình đang dùng" next to "Setup is incomplete"). Scoped to Phase 06 as a bounded strings-only pass. |

## Deep Audit Findings

| ID | Severity | Status | Retest gate or next owner |
| --- | --- | --- | --- |
| C1 | P3 | Open | Add protocol domain separation through a coordinated wire-format change; Phase 04. |
| C2 | P3 | Open | Define signing-seed quality policy; Phase 04. |
| C3 | P3 | Fixed | Both `publicKeyFromHex` implementations reject small-order and non-canonical Ed25519 public keys via `src/lib/crypto/ed25519-point-validation.mjs`. Blocked coordinates are derived from the curve equation, not copied, and each was confirmed forgeable against Node (identity 200/200, weakest order-8 point 19/200; 64 real keys 0/64). `ed25519-point-validation.test.ts` re-derives the table every run. The Phase 01 `it.fails` gates flipped red on contact and are now plain assertions. |
| C4 | P2 | Fixed | Non-canonical X25519 device keys rejected; `relay-device-key-point-validation.test.ts`. |
| C5 | P3 | Open | Sealed-box envelope binding folds into C1 remediation. |
| C6 | P3 | Fixed | Migration read-back and post-deletion guards have sabotage-backed tests. |
| C7 | P3 | Fixed | Grant substitution is covered by `operator-key-grant-substitution.test.ts`. |
| C8 | P3 | Fixed | Bootstrap take-and-clear ordering and concurrency are covered. |
| C9 | P3 | Fixed | MCP dispatch deny check is covered by `mcp-tool-authorization.test.ts`. |
| C10 | P3 | Fixed | Packaging ownership classification uses injected process/listener/shortcut inventory. Live machine inspection is an explicit opt-in gate: `test:packaging:windows-machine`. |
| C11 | P2 | Fixed | SOCKS5 bridge is loadable by the repository's Node test runner. |
| C12 | P2 | Fixed | Invalid HTTP-CONNECT destinations rejected; `socks5-bridge-http-upstream.test.ts`. |
| C13 | P3 | Fixed | WebRTC runtime-identity guard covered by commit `4ebb8d5`. |
| C14 | P3 | Fixed | Packaged verifier retries bounded transient Windows cleanup locks; commit `c63cc36`. |
| C15 | P3 | Fixed | Safe CDP rejects untracked `*.enable` commands; `cdp-safe-mode.test.ts` and MCP safe-mode forwarding test. |
| C16 | P3 | Mitigated/accepted residual | Proxy-geo outage is leak-safe: stale country is cleared, a stable diagnostic is logged, and WebRTC is disabled; launch may still retain a timezone mismatch until the probe recovers. |
| C17 | P3 | Fixed | Removing an existing unmanaged proxy now requires explicit confirmation before autosave; `proxy-removal-safety.test.ts`. |
| C18 | P2 | Fixed | A second legacy SSE connection could replace the active transport slot; it now receives `409`, preserves the first stream, and permits replacement only after deterministic close. |
| C19 | P2 | Fixed | CRX installs accepted unverifiable identity and path-derived escape risk; CRX2/CRX3 signatures, Web Store ID matching, and owned-root containment are enforced. |
| C20 | P3 | Fixed | Source-regex IPC checks could miss runtime preload/main drift; the executable preload covers 33 invoke and 5 event channels, and main startup fails on missing, duplicate, or foreign registrations. |
| C21 | P1 | Fixed | Rollback activation failure restores the newer current tuple and engine pin, clears pending, restarts owned processes, consumes the failed authorization id, and requires fresh ADMIN approval. Covered by `local-updater.test.ts`. |
| C22 | P2 | Closed for supported topology | Installer preflight and elevated install/uninstall reject firewall rules owned by another per-user engine path before mutation. Deterministic regression passes. The product supports one Windows user per PC; the owner waived the unsupported two-account VM exercise on 17 August 2026. |
| C23 | P3 | Fixed | Ceremony public evidence moved to `src/lib/release/release-authority-public-evidence/`; the trust root no longer sits behind a `plans/` path. `release-root-trust.test.ts` passes unchanged. |
| C24 | P3 | Closed by decision | The metadata comparison is a publication sanity check, not an integrity control: whoever can replace the bytes in the bucket holds the credentials that also set the metadata, so hashing on the way out would stop nobody while costing a full re-read of a 280 MB engine per request. The integrity control is the device-side hash. Recorded in `relay-compatibility-artifact-source.ts` so it stops reading as an oversight. |
| C25 | P3 | Accepted residual | Hand-rolled SigV4 has no known-answer vector and none is obtainable — no independent SigV4 implementation exists in the dependency tree, and adding one defeats the module's purpose. Hand-traced clean for the single-PUT/no-query shape in use. Cannot fail silently: a canonicalization error is an HTTP 403 on first upload, recorded as a failed job. Revisit if this ever signs query strings, presigned URLs, or streaming uploads. |

## Current Phase 03 Coverage

| State | Hypotheses |
| --- | --- |
| Closed statically | H41, H43, H44, H46-H50 |
| Closed by remediation | H45 (C21) |
| Closed by remediation and scope decision | H51 (C22) |
| Accepted by supported-topology decision | H53 |
| Human gate, carried past Phase 04 | H42, H52, H54 |

## Current Phase 04 Coverage

| State | Hypotheses |
| --- | --- |
| Closed statically | H58, H59, H60, H61, H62, H63, H64, H65, H66, H67, H68, H69, H70 |
| Closed by new executable proof | H55, H56, H57 |
| Accepted residual | H71 (C25) |
| Partly closed; contained by client verification | H72 (C24) |

Phase 04 closed H42/H52/H54 as far as code can: Authenticode and clean-machine withdrawal are
release-rehearsal observables, not code defects. They stay open as human gates and do not block
Phase 05.

## Decisions - 17 August 2026

Three questions carried since Phase 00 are now settled. Each was carried because it is a policy
choice, not a defect; leaving them open was costing a line in every report.

1. **F6 — plaintext `mktBrowserToken` is deliberate.** The token is discovered at runtime from the
   MKT Browser data root (`mktBrowserTokenSource: mkt-browser-data`); the config field exists only as
   a development override and `describeMktBrowserToken` labels it "development override configured".
   Moving it to DPAPI CurrentUser protects against nobody: the surviving reader is a same-user
   process, and DPAPI unprotect runs as that same user. `vaultKeyOperator` is in DPAPI for a
   different reason — it is the system's only copy and must survive config-file exfiltration, whereas
   the Browser token has a second copy in the Browser data root and is rotatable. Consistent with the
   H53/C22 one-Windows-user-per-PC boundary.
   Residual closed 17 August 2026: `relay-status-page.test.ts` now asserts both branches and was
   proven red by sabotage. The F6 argument has a test behind it.
2. **F10 — CI triggers stay as they are.** `push: [master, main]` plus `pull_request` already covers
   every merge path at minimum runner cost. Per-branch push CI would pay for every intermediate
   commit on branches that are rewritten anyway. Residual: commits on a long-lived branch are
   unverified until a PR exists, so any branch living beyond a day opens a draft PR.
3. **F15 — the policy half is closed; the strings half moves to Phase 06.** `AGENTS.md:25` already
   scopes legacy content explicitly. What remains is a real defect the language rule only implies: a
   single rendered view mixes Vietnamese and English. Phase 06 takes a bounded pass over user-facing
   labels and error messages only. Source comments in legacy modules stay untouched — translating
   them is churn against the audit baseline and buys no user-visible correctness.

**Phase 06 scope, decided:** documentation accuracy stays inside this audit, restricted to claims
that carry the safety case — a doc asserting a security or lifecycle property the code does not have
is an audit finding. Prose quality, comment translation, and `docs/archive/` are out of scope and do
not belong to a separate pass either.

## Next Sequence

1. Phase 05 — data layer and business logic. Unrelated risk area; nothing blocks it.
2. Phase 06 — breadth completion, including H107, H108, and the C23/C24 decisions.
3. C3 was closed on 17 August 2026 in the debt pass after Phase 04 — see the register row. Phase 01
   had asked whether `compatibility-manifest-crypto.ts:37` was "a more reachable instance of C3"
   because it feeds `publicKeyFromHex` a key taken from data. It is not: root endorsement is proved
   before that key is ever imported, so an attacker cannot choose it. The reachable site was the
   relay's `serverPublicKey`, and it now rejects.
4. C1, C2, C5 did not fold into Phase 04 the way the plan expected, and the reason is worth
   recording. The server Ed25519 key **is** reused across protocols: it signs tickets, compatibility
   update authorizations, and rollback authorizations. The two authorization protocols carry explicit
   domain prefixes; the ticket protocol does not — it signs the base64url envelope string directly
   (`ticket-verifier.ts:98-103`). Cross-protocol confusion is nevertheless unreachable, because a
   base64url string cannot contain the space and newline characters that every release domain prefix
   begins with, so the two byte-spaces are disjoint. That separation is incidental to the encoding,
   not designed, which is precisely C1's point. C1, C2, and C5 now have no phase left to inherit
   them — schedule the coordinated wire-format decision deliberately rather than deferring it again.
   C2 is independent of that decision and is cheap: it is a seed-content policy, and its four
   `it.fails` gates in `server-signing-key-seed-hardening.test.ts` are now the only expected-fail
   tests left in the suite.

## Unresolved Questions

1. C1 and C5 — the wire-format break. The only structural finding still without a decision, carried
   since Phase 01.
2. C2 — reject placeholder signing seeds, or record acceptance? A one-line policy either way.
