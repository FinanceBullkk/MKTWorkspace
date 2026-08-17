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
| F7 | P1 | Closed by decision | Production Relay identity was backed up and restored. **Retention decided 17 August 2026: keep everything, delete nothing.** ~1.6 GB is not a real constraint on this machine, and the archives hold DPAPI operator-key material whose exact contents are not fully inventoried — deleting what you have not enumerated is how a recovery path is lost quietly. The decision that matters is not disk: it is that these must never be bulk-deleted to reclaim space, which is now written down rather than remembered. Revisit only if a restore is ever rehearsed successfully from a specific archive, at which point older ones become droppable with evidence rather than by assumption. |
| F8 | P3 | Fixed | MKTBrowser ESLint is part of `yarn lint`. |
| F9 | P3 | Accepted/deferred | Oversized modules remain; split only at real responsibility boundaries. |
| F10 | P3 | Closed by decision | Keep the existing triggers: push on `master`/`main` plus every pull request. Per-branch push CI is not worth the runner cost. Operating rule instead: a branch that lives beyond a day gets a draft PR so its commits are covered. |
| F11 | P3 | Fixed | Unused health helper removed. |
| F12 | P3 | Fixed with correction | Real dead exports removed; earlier false positives were preserved. |
| F13 | P3 | Fixed | `nanoid` advisory removed. |
| F14 | P3 | Fixed | Empty corrupt-name directories removed; origin was external to both repos. |
| F15 | P3 | Closed | `AGENTS.md:25` already states the policy and its legacy scope: English for all new artifacts, no new Vietnamese, translate actively maintained sections on material revision. The real residual is narrower — the user-facing surface is mixed-language inside a single view (`relay-status-page.ts` renders "Cấu hình đang dùng" next to "Setup is incomplete"). Scoped to Phase 06 as a bounded strings-only pass, and closed there on 17 August 2026 (commit `869cb1e`, H107): the status page, the configuration problems rendered into it, and the operator key form now read as one language. Direction was English, per `AGENTS.md:25` — the earlier "~4 strings" count had measured the English half, the part already compliant. Source comments untouched, as decided. |

## Deep Audit Findings

| ID | Severity | Status | Retest gate or next owner |
| --- | --- | --- | --- |
| C1 | P3 | Half fixed 17 Aug; the wire-format half still deferred | **The deferral rationale below was incomplete, and re-reading the code found a reachable gap it had missed.** It argued that separation holds because a base64url envelope cannot contain the space and newline that every release domain prefix begins with. True — but that only covers tickets versus the two *release* authorizations. The server key signs **six** protocols, and three of them (tickets, grant authorizations in both `delivery` and `bootstrap` kinds, and device retirement) sign `base64url(JSON(envelope))` with **no prefix at all**, sharing one byte space. Among those three, grant and retirement each check `kind` with an explicit equality; `verifyTicket` checked only `typeof kind === "string"`. So tickets were held apart from the other two by **field naming alone** — `completionEphemeralPublicKey`/`completionSealed` versus `epk`/`sealed`. `sealForDevice` returns `{ ephemeralPublicKey, sealed }`, so the short names are the natural abbreviation, and a fourth protocol sealing to a device could pick them without a second thought; its authorization would then verify as a ticket and have its body unsealed, its declared `kind` never read. Closed by checking `kind` against `TICKET_KINDS` (`6eb16f9`) — **no byte on the wire changes and no relay needs updating**, because every ticket ever issued already carries a kind from that set. Placed after the two version gates on purpose: a new kind always ships with a higher `minRelayVersion`, so the first relay to meet one is an old relay and must hear "update the relay", not "unrecognised kind". Sabotage-proven: without the check, a genuine ticket re-signed with `kind: "bootstrap"` is accepted and unsealed; four matrix cases go red. **Still deferred:** real domain prefixes across all six protocols. That remains a coordinated wire-format break, and it is now materially less urgent, because all three protocols in the shared byte space check an explicit disjoint `kind` — separation is spelled as an authenticated in-payload field rather than a prefix, which is cryptographically equivalent so long as every verifier keeps checking it. The trigger below stands, with the count corrected: it already fired long ago. Original deferral, 17 August 2026 — Not this quarter. It is a coordinated wire-format change across server and relay, and cross-protocol confusion is presently unreachable — a base64url ticket envelope cannot contain the space and newline every release domain prefix begins with. That separation is incidental to the encoding rather than designed, which is C1's whole point, so this is a deferral and not a dismissal. **Trigger for revisiting, so it is not simply carried again:** the next time the ticket wire format changes for any other reason, or before a third protocol signs with the server key. Either event makes the change nearly free; without one it is a project with a rollout, and it wants its own plan directory. Decided 17 August 2026. |
| C2 | P3 | Fixed | `parseSigningSeed` now rejects placeholder seeds: fewer than 8 distinct byte values, a repeating block up to 8 bytes, or a counter run in either direction. Pattern rules only — a statistical entropy score would be both easier to slip past and able to reject a genuine key, and a false rejection is worse than the gap. The message names the rule that fired and points at `keys:server-keygen`. **The four `it.fails` gates are now ordinary assertions, so the suite has no expected failures left for the first time in this audit.** Sabotage-proven: with the check returning `null`, five tests go red. Three unrelated test files had used seeds like `"11".repeat(32)` as fixtures and now use fixed high-entropy seeds — they assert what they always asserted. Commit `0f0abc1`; fixture sweep `a63932c` after CI caught six more placeholder seeds in database tests that cannot run locally. CI-verified green: run `32003277917`, 1739 passed, zero expected failures. |
| C3 | P3 | Fixed | Both `publicKeyFromHex` implementations reject small-order and non-canonical Ed25519 public keys via `src/lib/crypto/ed25519-point-validation.mjs`. Blocked coordinates are derived from the curve equation, not copied, and each was confirmed forgeable against Node (identity 200/200, weakest order-8 point 19/200; 64 real keys 0/64). `ed25519-point-validation.test.ts` re-derives the table every run. The Phase 01 `it.fails` gates flipped red on contact and are now plain assertions. |
| C4 | P2 | Fixed | Non-canonical X25519 device keys rejected; `relay-device-key-point-validation.test.ts`. |
| C5 | P3 | Deferred by decision | Folds into C1 remediation and moves with it, under the same trigger. |
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
| C26 | P2 | Fixed | `/configure` now refuses to change an existing `serverPublicKey`; re-sending the key already on disk still succeeds so re-enrollment stays ordinary. Sabotage-proven: with the guard removed the attacker payload is accepted and the trust root is replaced. No rotation flow breaks, because none exists — `configureRelay` is called once, from enrollment; a future rotation must travel as a statement signed by the outgoing key, which this check forces. Original finding, recovered from a dropped handoff: `/configure` wrote `serverPublicKey` with no check that a trust root already exists (`handle-configure.ts:94`, always registered in `main.ts:251` except during pending retirement), so a live enrolled Relay's trust root can be replaced by any request from the allowed web origin. The Relay keeps `VAULT_KEY_OPERATOR` and becomes a decryption oracle for whoever re-points it. Phase 01 raised this as an unowned observation and ranked it low on the framing that the precondition — being the allowed origin — is already fatal. That framing holds for a compromised *server*, which already has the signing key. It does not hold for a compromised *web app*: an XSS there converts a transient browser-side compromise into persistent trust-root replacement on every operator device, which is why this is ranked P2 here. `handle-set-operator-key` already implements the missing pattern one line below the `/configure` registration (`main.ts:265`). |

| C27 | P3 | Fixed (first half); second half handed to Phase 06 | `redd.it/<id>` now resolves to the same `reddit:<id>` key as the full permalink, matched on exact host so `notredd.it` and `redd.it.evil.com` do not qualify. Sabotage-proven: guard removed → red on `'redd.it/1a2b3c'` vs `'reddit:1a2b3c'`, restored → green. The `/r/<sub>/s/<opaque>` half is not locally resolvable and is registered as a Phase 06 handoff. Original finding: `normalizeThreadUrl` canonicalised a Reddit thread only through `/comments/<id>`. Proven against the real function: `redd.it/1veg99o` → `redd.it/1veg99o` and `/r/Trove/s/AbCdEfGh12` → `reddit.com/r/trove/s/abcdefgh12`, neither equal to `reddit:1veg99o`. Rule 8 — the one non-overridable rule — silently misses the collision; the same key feeds `duplicate-posted-url-check`, `health-check-recorder` matching, and the `post-job-revert` trace lookup. Two halves: `redd.it` is locally fixable (the id is in the path); `/r/<sub>/s/<opaque>` is not resolvable without an HTTP redirect and is handed to Phase 06 as input-time rejection. `reddit-title-slug-match.ts:38` already names `redd.it` as a slug-less link, so this is two modules disagreeing, not an unknown format. Phase 05. |
| C28 | P3 | Fixed | **Not a future trap — one live instance.** `HEALTH_VERDICTS` has six members; rule 10 enumerated five, so `UNTRACKED_POSTS` ("outsiders see posts the ledger does not have") already fell through to ALLOW, and it is the verdict that means rules 4/5/6 are undercounting. Rule 10 now keeps its own explicit list of judgeable verdicts and **blocks** anything outside it, deliberately not importing `HEALTH_VERDICTS` — importing it would auto-accept a new verdict and reinstate the bug. `UNTRACKED_POSTS` handled as WARN, matching `statusForcedBy`'s decision not to quarantine for a bookkeeping fault. The unknown-verdict check sits **before** the staleness check: sabotage showed an unknown-and-stale verdict otherwise returns WARN and still posts. Sabotage-proven: guard removed → 3 tests red (`ALLOW`≠`WARN`, `ALLOW`≠`BLOCK`, `WARN`≠`BLOCK`), restored → 63 green. A companion test asserts every member of `HEALTH_VERDICTS` is judgeable, so the next added verdict is a red test locally rather than a herd-wide block in production. |
| C29 | P3 | Fixed; CI-verified, not sabotage-proven | New nullable `heartbeatAt` column (additive migration `20260817100000_health_check_lock_heartbeat`, reversible by one `DROP COLUMN`); the run renews it after every nick, including nicks that errored, and staleness now measures liveness instead of elapsed time. `startedAt` is kept untouched so the operator-facing "holding for N minutes" line stays true — that split is why a column was added rather than reusing `startedAt`. Renewal is token-scoped, so a run that already lost the lock cannot heartbeat into the new holder's row. Four regression tests added; they need Postgres, so CI is the only place they run — verified green in run `31992649178` (commit `4dda1f9`), with the migration applied on real Postgres. **Not sabotage-proven**: proven to pass, not proven to fail on the vulnerable path. Original finding: `STALE_AFTER_MS` was a fixed 30 minutes while health-check run duration scales with herd size (30–90 s sleep per nick). At ~20 nicks a second run declares the first orphaned and probes concurrently through the single observer proxy — the exact failure the lock exists to prevent, presenting as `ERROR` verdicts. `startedAt` is never renewed, so staleness measures elapsed time, not liveness. Trigger is the product's own growth. Phase 05. |
| C30 | P3 | Fixed; CI-verified, rollback not fault-injected | Job create and `RULE_OVERRIDDEN` audit row now share one interactive `$transaction` (interactive rather than array because the audit `detail` needs the new job's id), matching `relay-device-retirement-actions.ts:143,233`. Two regression tests added on the user-visible invariant — an overridden job always carries an audit row pointing at its id, an ordinary job produces none — verified green on CI in run `31992649178`. **Honest limit:** the rollback itself is not sabotage-proven, because `AuditLog` carries no constraint that can be made to fail on demand, so no fault can be injected between the two writes. The tests guard the invariant; the transaction is what makes it survive a crash. Original finding: the audit row was written after the job create, outside its transaction, while the file header states an override "always leaves an AuditLog". |
| C31 | P3 | Fixed | Deletion now goes through `requireNickOwner` — the same check that guards that nick's secrets — rather than `adminAction`, because deleting the row destroys exactly what that check protects. Unassigned nicks stay ADMIN-only. Visibility is unchanged; only the destroy path closed. A separate test file was required: every existing deletion test runs as ADMIN, and ADMIN passes on the check's first line, so the old tests could not observe whether the guard exists. Commit `6b5005f`. Original finding: | Any signed-in operator can delete another person's nick, while deleting a **proxy** requires ADMIN (`vault-delete-actions.ts:30` is `adminAction`, `:59` is `guardedAction`). The asymmetry runs against the schema's own words — "Nick là tài sản, đăng ký máy là quyền" — and the object guarded less is the more valuable one. Blast radius is bounded and that is why this is P3: deletion is refused for any nick carrying jobs, interactions, Facebook connections or admin roles, both in application code and by RESTRICT foreign keys, so only a nick with no history can go. But that is exactly a freshly entered one, and its row holds the only copy of the operator-domain password, email password and TOTP secret — deleting it destroys them. Recovery is re-entering from the purchase record. Reachability: a signed-in team member or a stolen session, not an outsider. Phase 06. |
| C32 | P3 | Fixed | The stale block is replaced by the closing statement the file had already promised at `:64`, including an explicit paragraph on what the audit did **not** do. Commit `df94910`. Original finding: | `docs/development-roadmap.md:42-45` still states that phases 05 and 06 "have not started, so nothing should be read as clean there". Phase 05 is complete and 06 is largely done, so the block now understates the audit — the opposite direction from the usual documentation risk, but wrong either way, and it is a safety-case claim, which is the only documentation this audit scopes in. The file already plans its own replacement at `:64` ("this line will be replaced by a final statement when the audit closes"), so the fix belongs with the closing coverage statement rather than as a separate edit. Phase 06 (H105). |
| C33 | P3 | Fixed | The three C2 pattern rules moved out of `server-signing-key.ts` into `src/lib/crypto/placeholder-secret-detection.ts` — moved, not copied, so the two parsers cannot drift — and `parseVaultKey` now calls them. Rules unchanged from C2 on purpose: no fourth rule, no entropy score, and the period ceiling stays at 8, because widening it would re-open a verified guard's behaviour to catch a shape nobody has typed. The ceiling's blind spot (a 16-byte block repeated twice, which is what the CI and database-test fixtures happen to be) is documented in the module rather than left to be rediscovered. **Escape hatch added, and it is the part worth reading:** anyone who already ran with `00…00` can only get out through `vault:rekey`, and that script parses the *old* key — guarding it too would trap them with data they can neither use nor recover. So `parseVaultKey` takes `allowPlaceholder`, default false, set true only on the two retirement-path reads in `scripts/rekey-vault-key.ts`; a test pins the default and pins that the flag relaxes only the pattern rule, never length or charset. The rejection message names both exits (keygen for a fresh machine, rekey for a live one) because the wrong one destroys data. Fixture sweep run repo-wide before writing the guard, per the C2 lesson — **and it missed two files, so CI went red anyway** (run `32012451177`, 6 failed / 1759 passed). The sweep regex matched hex written out in full; `relay-device-retirement-actions.database.test.ts` and `compatibility-update-actions.database.test.ts` write `"21".repeat(32)`. Same root cause as C2 both times: those tests need Postgres, so their fixtures are only ever exercised on CI, after a push. Fixed with real keys, and the lesson is now mechanical rather than remembered — see C35. Sabotage-proven by stashing the three source files and keeping the tests: 14 red across the two new suites, green on restore, `git status` clean. Local suite 159 files / 1504 tests green; database tests still cannot run on this machine, so CI is the only proof for those. Original finding: **Same gap as C2, on the vault keys, and not chased when it was noticed.** `parseVaultKey` (`encryption-key-loader.ts:65-73`) validates length and hex charset only — no content check — so `VAULT_KEY_SERVER` and `VAULT_KEY_OPERATOR` accept `00…00`, `ff…ff` or a counter exactly as the signing seed did before `0f0abc1`. Arguably worse than C2: the signing seed forges authority, but `VAULT_KEY_OPERATOR` decrypts every nick password, email password and TOTP secret, so a guessable one turns any leaked backup into plaintext. Same reachability as C2 — deliberate operator error, not an attacker, since nobody else fills in these variables. Remediation is small and already written: `describePlaceholderSeed` in `server-signing-key.ts` is the shape to reuse, and it should move somewhere both parsers can call it rather than being copied. **Note before starting:** `.github/workflows/ci.yml:47-48` sets both keys to patterned test values, and other fixtures will too — enumerate them repo-wide first, because fixing only what turns red locally is exactly what sent CI red on C2 (see the coverage statement, §6). Found 17 August 2026 while writing the closing handoff. |
| C34 | P3 | Fixed | **The same gap again, one layer over, and on the path that actually matters.** Found 17 August 2026 while remediating C33, not by a scan. `handleSetOperatorKey` (`relay/src/handle-set-operator-key.ts:75`) validated length and hex charset only — its own copy of the check, not `parseVaultKey`'s — so the Relay's paste box accepted `00…00` for `VAULT_KEY_OPERATOR`. This is worse placed than C33 itself: once GĐ3 is finished the server does not hold that key at all, so the paste box **is** where it lives, and a guard on `parseVaultKey` alone would have hardened the path being retired while leaving the path being kept open. The form made it inviting rather than merely possible — the input's placeholder attribute was literally `"0".repeat(64)`, so the easiest thing to paste was also the worst; it now reads `64 hex characters (0-9, a-f)`. Handler now calls the same shared detector. Its message deliberately does **not** mention `vault:keygen`: the person at that screen is an employee pasting a key an administrator issued, and pointing them at a generator sends them to the wrong door — it tells them to re-copy, and to report the key as needing replacement if it really is what they were given. Sabotage-proven with C33 in the same stash run. Fixtures swept: `handle-set-operator-key.test.ts` used `"c4".repeat(32)`, a value the guard rejects, replaced with a fixed realistic key (fixed, not `randomBytes` — a key drawn per run turns one red into something nobody can reproduce). `relay-route-capability-enforcement.test.ts` posts `"{}"` and `Buffer.alloc(32,7)` reaches only the *sealing* deps, so neither needed changing. **Deliberately not guarded:** `handle-receive-operator-key.ts`, which opens a key sealed from an already-enrolled device. That key is a transfer of what another machine already holds, not a human decision point, and rejecting it there would strand a second PC mid-enrollment with no way forward — the false-rejection cost that shapes this whole guard. |

| C35 | P3 | Fixed; widened 17 Aug after self-review | **Self-review found the backstop had the same blind spot it was built to remove.** The scan matched the three env-var *names*, so `process.env[SERVER_SIGNING_KEY_ENV] = …` — the constant-alias spelling, used by three relay tests — was invisible to it. A name-based regex only catches the spellings its author thought of, which is precisely the defect that produced C35 in the first place. Aliases are now scanned (`SERVER_SIGNING_KEY_ENV`, `VAULT_KEY_ENV.server`, `VAULT_KEY_ENV.operator`), and proven: setting one relay fixture to `"ab".repeat(32)` turns the scan red and names the file. No live defect was hiding there — all three values were genuine seeds. Widening also surfaced two more resolver bugs, both fixed: a bare identifier lost its terminator to the statement cut and failed to resolve, and vector-table lookups (`RFC_8032[0].seed`) had no rule. Vector tables are **skipped by an explicit, documented exception** rather than resolved: extracting every 64-hex literal from such a table would drag in public keys and signature halves, and a correct Ed25519 vector table legitimately contains `00…00` as the order-4 point, so a key-placeholder policy applied there would reject values that must be present. The exception is safe because vector tables live in unit tests that run on every `npm test`, whereas this scan exists for `*.database.test.ts`, which cannot run without Postgres. **The scan is an approximation and now says so in its own header** — a fixture set through some fourth spelling still slips past. Original finding: **A process defect, recorded as a finding because it has now cost two CI reds.** Twice — C2, then C33 — a guard landed, the author ran a hand-written regex sweep for fixtures that would violate it, and the sweep missed a spelling it had not anticipated (`"21".repeat(32)` where it looked for hex in full). The reason it keeps happening is structural, not carelessness: `*.database.test.ts` needs Postgres, so on a development machine those fixtures are never evaluated at all, and the first evaluation is CI, three minutes after a push. `src/lib/crypto/key-fixtures-pass-the-guard.test.ts` replaces the ritual with a test — it enumerates every fixture assigned to `VAULT_KEY_SERVER`, `VAULT_KEY_OPERATOR` or `TICKET_SIGNING_KEY` across `src/`, `relay/`, `scripts/` and `.github/`, resolves the four spellings in use (hex literal, `.repeat()`, same-file `const`, runtime value), and runs each through the real detector. It needs no database, so a bad fixture is red locally in under a second. An unrecognised spelling fails the suite and names the file instead of being skipped, and a floor on the fixture count stops a broken scan from passing as an empty one. **Proven to catch**, and that check earned its keep immediately: reverting one fixture to `"21".repeat(32)` left the test *green*, which exposed a bug in the scan itself — the 120-character capture window spilled into the next statement, so a neighbouring `process.env` made the value look runtime-computed and the fixture was skipped in silence. Fixed by cutting the right-hand side to one statement; the revert then turned it red and named the file. |

## Handoff Audit — 17 August 2026

Phase 04 was closed having forgotten C3, which Phase 01 had explicitly assigned to it. That prompted
a check of every other cross-phase handoff, and it found a second one.

| Handoff | Assigned to | Outcome |
| --- | --- | --- |
| C2, C3 (Phase 01) | Phase 04 | C3 dropped, recovered and fixed 17 Aug. C2 still open by decision. |
| `handle-configure.ts:94` trust-root replacement (Phase 01) | Phase 02 | **Dropped.** Never mentioned in any Phase 02 report, never became a finding, never entered this register. Recovered as C26. |
| C10 test hermeticity (Phase 02) | Phase 03 | Honored; C10 fixed. |
| Driver half of F2 (Phase 01) | Phase 02 | Honored; F2 fixed. |
| C27 second half — reject `/r/<sub>/s/<opaque>` share links at input (`interaction-form.tsx`, mark-posted field) (Phase 05) | Phase 06 | **Honored, 17 Aug — commit `c607115`.** Registered at the moment of handoff, and Phase 06 opened by reconciling against this table, which is how it was noticed that the item sat in the register but not in the phase's own scope or todo. Became H109, fixed, sabotage-proven at three points. First handoff in this audit caught by the receiving phase instead of by someone going looking later. |

Phase 05 opened by reconciling against this table on 17 August 2026 and found **no inbound
handoff** — every handoff phrase in every phase file and report resolves to Phase 02, 03, or 04,
and each already has a register row. The table above is complete as written. Cost about five
minutes; the two dropped handoffs cost days. Keep it as the phase-opening ritual.

Two of four original handoffs were dropped. Both were recovered only because someone went looking, which is
not a control. The fix is procedural: an item handed from one phase to another belongs in this
register when it is handed over, not when the receiving phase remembers it. Phase 05 and 06 should
open by reconciling against this table.

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

## Current Phase 05 Coverage

| State | Hypotheses |
| --- | --- |
| Closed — control found and traced | H73, H74, H75, H76, H77, H84, H85, H87, H88 (scheduler half), H89, H90 |
| Closed by remediation-worthy finding | H79 (C28), H82 (C27), H86 (C27, predicted coupling confirmed) |
| Closed with observation, not ranked | H78, H80, H81, H83 |
| Open, scale-triggered | H88 (lock half) → C29 |

C30 was not hypothesised. Registry ↔ schema drift is zero; the 1-nick-1-proxy-1-profile invariant is
DB-enforced by two `@unique` columns plus the structural `ObserverProxy` split, with the one
cross-table leg (`deviceId ⇒ device.userId == ownerId`) declared in the schema as not expressible
in Postgres. All 12 migrations classified; none irreversible-and-unrehearsed. Detail:
[`audit-260817-0958-data-and-business-logic.md`](../reports/audit-260817-0958-data-and-business-logic.md).

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

4. **`UNTRACKED_POSTS` warns, it does not block** (decided 17 August 2026, during C28 remediation).
   The owner's decision covered *unrecognised* verdicts, which now block. This one is recognised, so
   it needed its own answer. It warns, for three reasons, the third being decisive:
   - `statusForcedBy` already decided the same question the same way, in writing: the nick is
     healthy and the fault is in our own ledger, so quarantining the nick punishes the wrong thing.
     Blocking here would contradict a considered decision one file away.
   - Rule 10 is overridable, so "block" here is a speed bump with an audit entry, not a stop.
   - The verdict is the **residue after auto-linking** — posts the prober could not attach to a job.
     It does not clear itself, and it may be legitimately unresolvable (a post made outside the
     tool). Blocking would demand an override on every scheduling attempt, for a condition that may
     never lift. Routine overrides are what destroys the meaning of the override audit trail that
     C30 was just fixed to protect.

   Residual, stated plainly: while this verdict stands, rules 4, 5 and 6 count low and the operator
   is told so rather than stopped. The remedy is recording the posts at `/queue`, which the warning
   names.

**Phase 06 scope, decided:** documentation accuracy stays inside this audit, restricted to claims
that carry the safety case — a doc asserting a security or lifecycle property the code does not have
is an audit finding. Prose quality, comment translation, and `docs/archive/` are out of scope and do
not belong to a separate pass either.

## Next Sequence

1. Phase 05 — completed at D3 on 17 August 2026 with opportunistic D4 on H82. Four P3 findings
   (C27-C30), no P0/P1/P2. Remediation was authorized the same day and all four are fixed and
   pushed (`1773ea5`, `238f0ec`, `4dda1f9`); CI run `31992649178` is green with exactly +12 tests
   against the parent commit's run. Only C27's share-link half remains, and it is a Phase 06
   handoff by design, not a leftover.
2. Phase 06 — breadth completion, including H107, H108, the C23/C24 decisions, and the C27 share-link
   handoff now recorded in the Handoff Audit table.
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

## Decisions — 17 August 2026, second pass

Taken on the owner's instruction to decide the three questions left open by the closing handoff.

**1. The placeholder period ceiling is now `length / 2`, not 8.** Reversing the position taken
earlier the same day. Two things changed. First, the reason for keeping 8 was that widening forces a
fixture sweep and fixture sweeps are where CI goes red — and C35 removed exactly that risk, so the
premise expired. Second, 8 was never principled: for a 32-byte secret nothing longer than 16 can
repeat at all, so `length / 2` is the complete form of the rule rather than a chosen bound. What
settled it was that the shape the old ceiling missed — a 16-byte block written twice — was the
vault-key fixture in `ci.yml` and eleven test files in this repository. A guard meant to catch what
people type by hand was missing the most common thing anyone here had typed by hand. Twelve files
swept, enumerated by C35 rather than by eye; pinned in all three hardening suites.

**2. Both draft PRs go ready — but merging MKTTool #24 has a precondition nobody had written down.**
Ready is right: both branches are finished, CI is green on each, there is no second reviewer to wait
for, and 278 files of divergence from `master` gets more expensive every day it sits. The gates are
release gates, not merge gates, and conflating them freezes finished work behind a manual test.
**The precondition, found while deciding this:** `docs/deployment-guide.md:19` — Railway deploys from
`master`, so merging #24 deploys. If Railway's `VAULT_KEY_SERVER` or `TICKET_SIGNING_KEY` is a
placeholder pattern, the guard will refuse it. Check both values against the guard **before** merging.

**Correction, 17 August 2026 (self-review).** An earlier version of this paragraph said the app would
"fail to boot after deploy". That is wrong, and the truth is more awkward: `loadVaultKey` is lazy and
`src/instrumentation.ts` validates no keys at startup, so the deploy would **succeed**, the site would
come up, and the first operation touching the vault — adding a nick, launching a profile, reading a
credential — would throw instead. A boot crash is loud and instantly attributable to the deploy; this
looks like a feature breaking at random. So the precondition matters more than first written, not
less. The nightly backup is unaffected: it dumps ciphertext and never loads a key.

Eager validation at startup was considered and **not** done. It would turn any key misconfiguration —
including a merely *absent* key, which is much more common than a placeholder — into a boot
crash-loop on Railway, and that is an operational decision about failure behaviour, not a cleanup to
slip into a review pass. It is worth deciding deliberately; it is not decided here.

**3. The three Windows gates are blocked on prerequisites, not on scheduling — and the owner is the
only person who can run them.** Stating it plainly so the question stops being re-asked as though it
were a staffing choice. Authenticode verification cannot be scheduled at all: it needs a
code-signing certificate, which does not exist yet, so it is a **procurement** item, not a testing
item. Power loss during an update and a withdrawn installer on a clean machine both need a **clean
Windows VM** — the development machine cannot stand in, because "on a clean machine" is the property
under test, and hard-cutting power to the working box is not a test anyone should run. So the real
next action for gates 2 and 3 is half a day setting up a VM, and for gate 1 it is buying a
certificate. Until then the roadmap's wording stands and must not soften: unrun, and code cannot
close them.

**4. C1 — split it, and close the half that does not need a rollout.** Reading the code rather than
the register's summary of it changed the answer. The recorded rationale covered only tickets versus
the two release authorizations; three protocols actually share one byte space with no prefix, and
`verifyTicket` was the one that never checked `kind`. That half was reachable by a plausible naming
choice in a future protocol, cost nothing on the wire, and is now closed and sabotage-proven. The
other half — real prefixes across all six — stays deferred, but on an honest rationale this time:
every protocol in the shared byte space now performs an explicit disjoint `kind` check, so the
separation is *checked* rather than coincidental. Note the old trigger ("before a third protocol
signs with the server key") had already fired unnoticed — there are six. A trigger nobody counts
against is not a trigger, so the count is now written down.

## Unresolved Questions

1. C1's remaining half and C5 — real domain prefixes on all six protocols, a coordinated
   server-and-relay wire-format break. Trigger: the next time the ticket wire format changes for any
   other reason. **Do not re-derive the safety argument from this row alone** — it was wrong once.
   Re-read `server-key-cross-protocol-matrix.test.ts`, which pins the actual property and enumerates
   every artifact-verifier pair.

Questions 2 through 5 of the previous list — C2's seed policy, authorizing Phase 05 remediation,
C28's block-or-warn, and C29's heartbeat — were all answered and implemented on 17 August 2026. They
are removed rather than left standing, because a list of open questions that is mostly closed
questions stops being read.
