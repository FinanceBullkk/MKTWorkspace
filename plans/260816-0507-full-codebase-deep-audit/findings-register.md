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
| C23 | P3 | Fixed; **incomplete — reopened and closed again 17 Aug** | Ceremony public evidence moved to `src/lib/release/release-authority-public-evidence/`; the trust root no longer sits behind a `plans/` path. `release-root-trust.test.ts` passes unchanged. **It moved four of five files.** `release-authority-delegation-revocations.json` stayed under `plans/`, still imported by `relay-compatibility-manifest-file.ts:3` — and it is the most security-relevant of the set, since it names which delegations are revoked, sitting in the "records area, reorganised freely and reviewed as documentation" that C23's own rationale says is the wrong home. Discovered the hard way: merging #24 into `master` broke the production deployment, because `plans/` is not copied into the Docker image. **Every check the project runs was green** — `tsc --noEmit`, the full suite, CI, and even a local production compile — because `plans/` exists on a developer machine; only the Docker build fails, which is to say only after a merge. Fixed in PR #25 by moving the fifth file and repointing the import. Guarded as a class rather than an instance: `src-imports-stay-inside-the-image.test.ts` refuses any non-test file under `src/` that imports outside the directories the Dockerfile copies, and it is proven to catch by restoring the old import. Test files are excluded deliberately — they are not on the trace path from a route and legitimately reach into `relay/`. |
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

| C36 | P3 | **Fixed 17 Aug — and proven by taking a real backup** | **Closed by the one-time install the row below prescribes.** PostgreSQL 18.4 client binaries extracted to `E:\tools\pgsql-18` — the EDB binaries zip, so no installer, no service, no registry, no administrator, and reversible by deleting the directory; it also matches the `E:\tools\node-v22.23.1` convention already on that machine. `PG_DUMP_PATH` appended to `.env` (the file was never read, only appended to). Wiring verified end to end: Node's `--env-file` strips the quotes, `PG_DUMP_COMMAND` resolves to the new binary, and it reports `pg_dump (PostgreSQL) 18.4` — the exact major of the Railway server that refused 17.10. **Then the backup itself was taken, deliberately, rather than declared possible:** `mkttool-prod-20260817-211051.sql`, 71 KB, 120 rows across 14 tables, which sits sensibly against the 03:00 nightly R2 dump of 66 KB / 111 rows. Running it was the point — this register's own rule is that a check not proven to run does not exist, and installing the client while leaving the step unexercised would have reproduced C36 one layer up. `pg_dump` is a read-only consistent snapshot, so the production database was read and never written. Original finding below. **The project's own pre-deploy safety step cannot run on the admin machine.** `deployment-guide.md:536` states the rule categorically: *"run `npm run db:backup:remote` immediately before every deploy that changes database structure — `prisma migrate deploy` does not back up, and that is exactly the riskiest moment."* On 17 August, merging #24 applied three migrations to production and **that backup could not be taken**: local `pg_dump` is 17.10, Railway's Postgres is 18.4, and `pg_dump` refuses a server with a higher major. Both documented workarounds were unavailable — Docker was not running, and no Postgres 18 client is installed. The deploy proceeded on two pieces of evidence instead: all three migrations are **additive only** (`ADD COLUMN`, one `CREATE UNIQUE INDEX` on a new nullable column — no `DROP`, no type change, no data write), and the server-side nightly R2 backup is **unaffected** by the client version gap and had run successfully at 03:00 that morning (`mkttool-prod-20260817-030007.sql`, 66 KB, 111 rows across 14 tables), giving a ~15-hour-old restore point. That reasoning was sound for these migrations and will not be sound for the first destructive one. **Fix is a one-time install**, already written down at `deployment-guide.md:565`: install a Postgres 18 client and set `PG_DUMP_PATH` in `.env`. Until then the rule is documented but unenforceable, which is worse than either honest state — the guide even names the date it first bit, 08/08/2026, so this is the second occurrence. |

| C37 | P3 | Fixed (PR #27) | **A P2 remediation silently broke the tool that verifies releases, and it stayed broken because that tool is not in CI.** F4 made `/encrypt-for-vault` require the trusted `Origin` — without it any page the operator has open is a blind encryption oracle against `VAULT_KEY_OPERATOR`. `scripts/smoke-test-relay-executable.ts` was never updated to send one, so its two sealing calls have failed since F4 landed. It went unseen because the suite needs a Windows-built `.exe` and therefore never ran in CI; it surfaced only because Relay 13 was verified before publishing, showing three red checks all reading *"the last call came from an unnamed origin"*. Fixed by passing `{ origin: bakedOrigin }`, which every other call in the file already did; the suite is then fully green against the real executable. **Fourth instance of one shape in a single day** — with C23, C35 and C36: the check that would have caught the problem was not the check that runs.

**Correction, 17 August 2026 — the un-automatable claim was wrong, and it was the most costly kind of wrong.** This row originally concluded that this instance "cannot be" closed by moving the check into the automated gate, "because the gate has no Windows runner and no built `.exe`", and it demoted `relay:verify` to a release-checklist item. Neither half survived ten minutes of reading. **The Windows runner already exists and is already proven** — `MKTBrowser/.github/workflows/release.yml:17` runs `windows-latest` with Node 22 on every push and pull request; the capability was in the sibling repository the whole time. **The `.exe` needs no secrets to build** — `build-relay-executable.ts:130` takes the baked origin from a flag, and the suite mints a throwaway `TICKET_SIGNING_KEY` and a per-run operator vault key at `smoke-test-relay-executable.ts:68,82`, reading the origin to trust back out of the executable's own `/health`. Measured rather than argued: built with `--web-origin=https://ci.invalid --compatibility-floor=1`, the suite is **27/27 green**, and the Relay never calls that origin because `relay/src` contains no outbound `fetch` at all. Closed by the `relay-executable` job in `.github/workflows/ci.yml`, deliberately with **no `paths:` filter** — the suite imports from `src/lib/crypto`, `src/lib/tickets` and `src/lib/relay`, so a change outside `relay/` breaks it, which is exactly what F4 did; narrowing the trigger would rebuild the blind spot. One supporting change: `relay:build` used `--env-file=.env`, which hard-fails when the file is absent, so it is now `--env-file-if-exists=.env` (verified: the strict flag exits with `.env…: not found`, the tolerant one continues).

**The lesson is not about Windows runners.** This row asserted an infrastructure limit in one sentence and closed on it, while every claim about *code* in this register is required to be sabotage-proven. That asymmetry is how a mechanizable check gets written down as a permanent human ritual — which is precisely C36's failure mode, one level up. Sabotage-proofing establishes that a check **catches**; only a runner establishes that it **runs**, and "it cannot run here" is a claim that needs evidence like any other. See the rule recorded below. |

| C38 | P3 | **Fixed 18 Aug (PR #29)** — the gap is closed by a check, not by a reminder | **A production deploy failed and nothing was watching, so Relay 13 was published but undistributable for nine hours.** Found 18 August 2026, only because merging #28 prompted a check of whether the *previous* merge had actually deployed. It had not. PR #27 merged 17 Aug 20:34 local; Railway deployment `ddc2b301` at 20:37:52 is **FAILED**, and production went on serving the image from #26 until #28 deployed successfully at 05:24 the next morning. **Why it mattered rather than being cosmetic:** `RELAY_VERSION = 12 → 13` was in #27, not in #26 where the version's name suggests it lived. That constant drives two live paths — `relay-browser-client.ts:184` decides "your Relay is outdated" by `outcome.relayVersion < RELAY_VERSION`, and both `api/relay/download/route.ts:34` and `relay-download/page.tsx:40` resolve the download through `readRelayRelease(RELAY_VERSION)`. With the server still believing 12 was current, an operator on Relay 12 was told nothing, and the download page served **Relay 12**. So the changelog's own sentence — *"Relay 13 is published, and you have to update to get any of the Relay-side changes above"* — was false in production for nine hours, for a release whose whole point was Relay-side security fixes. Actual harm is plausibly zero: the window was 20:37–05:24 local, overnight for an internal fleet, and #28 carried the same commits so the state repaired itself. That is luck, not a control. **Cause not established:** the build log for `ddc2b301` contains one line, `scheduling build on Metal builder`, so this may be a Railway-side scheduling failure rather than anything in the code — which makes monitoring *more* necessary, not less, because a deploy can fail for reasons no amount of test coverage will catch. **Fifth instance of the shape**, after C23, C35, C36 and C37, and the one with the largest reach: the check that would have caught it — *did the merge actually deploy?* — does not exist at all. Nothing in CI, nothing in the runbook, no Railway notification. Note C23 is the same system failing the same way: it too was found by a human noticing production was broken. **Closed by the `deploy-verification` job in `.github/workflows/ci.yml` (PR #29), 18 August 2026.** The first recommendation here was a Railway notification and a human habit — a checklist item, which this register has now watched fail four times. It turned out to be mechanizable after all, for the same reason C37 was: **the signal already existed and nobody was reading it.** Railway's GitHub integration has been publishing deployment status to `repos/.../deployments` all along, so the check needs no Railway token and no secrets, only `deployments: read` on the default token. **The trap it had to avoid is worth reading**, because the obvious implementation would have been useless: Railway posted `in_progress` for `ddc2b301` and then never posted again — no failure state was ever recorded, so a check looking for `failure` would have passed the exact deploy that prompted the finding. The job therefore treats **only `success` as success**; silence, a stuck `in_progress`, and no deployment at all are all failures. Proven in both directions against real history before it was committed — `141cde3` passes, `6bf3985` fails and names the stuck-`in_progress` signature — which also caught a bug in the check itself: GitHub's `sha` filter needs the full 40-character SHA, and a short one matches nothing and reads as "never deployed". Ten-minute timeout against observed deploys of 1m28s–1m55s. |

| C39 | P2 | Fixed 18 Aug (PR #30) — the mechanism; the **policy question it exposes is open and is the owner's** | **The only lever for forcing a fleet off a vulnerable Relay was broken, and it was broken in a way that would only have shown up on the day it was pulled.** Found 18 August while checking whether gate 3 had anything to test. `ticket-issuer.ts` stamped `minRelayVersion: MIN_RELAY_VERSION_BY_KIND[kind] ?? MIN_RELAY_VERSION`. That reads as a fallback and is an **override**: the per-kind entry replaces the global floor rather than raising it. Every ticket kind is present in the table — a property `ticket-min-version-by-kind.test.ts:92` pins *deliberately* — so the `??` branch was unreachable and **`MIN_RELAY_VERSION` was dead code**, which is why nothing ever caught it. Harmless at a global floor of 1. The moment anyone raised it, which is the single thing it exists for, four of the five kinds would have kept their lower table value — **profile launch among them, at 7** — while the operator believed the fleet floor had moved. Fixed with `Math.max(MIN_RELAY_VERSION, byKind ?? 0)`, which preserves the design rationale the sibling test's header argues for (raising one kind must not drag the others up) while making the global value an actual floor. Sabotage-proven: reverting to `??` turns four of five cases red. A companion assertion guards the table itself, so an entry below the global floor is now a failing test rather than a silent lie about intent. Ranked P2 rather than P3 because it disables incident response: it is not a defect that hurts today, it is a defect that removes the ability to react. **Confirmed by history — `MIN_RELAY_VERSION` has never changed since the commit that introduced it (`d7f5acd`), across thirteen Relay releases.** A control never once exercised in the life of the product had quietly stopped working, exactly as this audit's own rule predicts. |

| C40 | P3 | **Fixed 18 Aug (PR #32)** | **Nobody can see which Relay version any machine is running, and raising the floor to 13 made that expensive the same hour.** `RelayDevice` carries `name`, `userId`, `publicKey`, `createdAt` and `revokedAt` — **no version, no last-seen**. So immediately after C39 blocked every Relay below 13, there is no way to answer *who did we just block*, *has the fleet migrated*, or *is anyone still stuck*. The operator finds out by being refused; the owner finds out by being told. **The data already flows past on every single interaction.** The Relay stamps `relayVersion` into *every* response including rejections — a property `relay-http-server.ts:20` documents on purpose — and `relay-browser-client.ts:157,161` reads it, uses it to render the outdated notice, and then discards it. It is never sent to the server and never stored. **Third instance in this session of the same shape:** the signal exists and nobody reads it, after C37 (a Windows runner already existed in the sibling repository) and C38 (Railway had been publishing deploy status into GitHub all along). Recorded as P3 because nothing is broken and no secret is at risk; it is an observability gap, and its cost is measured in the fleet migration being invisible rather than in exposure. Cheap to close and worth doing before the next floor move, not after: one nullable column plus one write on any authenticated relay interaction. Noted separately in the C1/C5 plan for a different reason — a rollout across the fleet is a blind switch without it — which is the second time this absence has been the thing standing in the way. **Closed by PR #32**: two nullable columns on `RelayDevice` (`relayVersion`, `lastSeenAt`), additive migration reversible with two `DROP COLUMN`s, written by a `guardedAction` the browser fires after each `pingRelay`. `null` means *not yet reported*, never *old*. Deliberately **observation and not control** — the value is client-asserted, so it gates nothing; what stops an old Relay is `minRelayVersion` inside each signed ticket, checked by the Relay itself. It therefore fails silently, because it sits on the user's click path and a failed write must never break the thing they were doing. Ownership lives in the `where` clause rather than a read-then-write, so a foreign `deviceId` is a no-op instead of an exception mid-click; revoked devices are excluded so a blocked row cannot keep refreshing `lastSeenAt` and look alive. Sabotage-proven: dropping `userId` from the `where` turns the ownership test red. A production backup was taken first, per C36. |

| C41 | — | Not a finding — evidence recorded against the C39 decision | **A real Relay v12 binary was made to refuse the raised floor, rather than the refusal being argued from source.** Raising `MIN_RELAY_VERSION` to 13 blocked the whole fleet on the assumption that already-shipped binaries refuse cleanly and say why. The unit tests exercise the verifier in the *current tree*; what runs on operator machines is a binary compiled weeks ago carrying its own copy. Source showed the check has been present since `d7f5acd`, which is not the same as knowing. Driven against the retained v12 from `.relay-payload`: the binary reports 12, the ticket carries 13, and the operator sees *"Bản cầu nối này quá cũ (12); máy chủ đang phát vé cần bản 13 trở lên. Tải lại cầu nối từ web app."* — refused, and naming both versions, which is exactly the standard gate 3 sets for an actionable refusal. Kept as `scripts/probe-old-relay-refuses-the-floor.ts` because it should be re-run whenever the floor moves. **Its own first run is the reason it is worth keeping**: it reported a successful refusal while the Relay was merely *unconfigured* — the configuration check fires before the version check, so it was measuring a different rejection entirely and would have confirmed the wrong thing. It now drives the Relay to ready before measuring and bails loudly rather than reporting if it cannot. |

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

**RETIRED, 17 August 2026 — checked against production.** Project `renewed-benevolence`, service
`mkttool-web`, environment `production`, read through the Railway CLI and piped straight into a
checker so no value ever reached stdout, a log, or a file. Result: `VAULT_KEY_SERVER` **ok**,
`TICKET_SIGNING_KEY` **ok**, `VAULT_KEY_OPERATOR` **absent**. Nothing blocks merging #24 on this
account.

The absence is the part worth recording: it means production posture is **`separated`** — the server
does not hold the key that opens nick secrets. That is GĐ3's stated goal, and this is the first time
it has been *verified in production* rather than asserted from the roadmap. It also means the C33
guard has no live exposure on the operator key server-side, because there is no operator key there
to guard.

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
item.

> **Corrected 17 August 2026, evening — gate 1 is not pending, it is out of scope for v1.** Reading
> this row alone makes buying a certificate look like outstanding work; it is not.
> `development-roadmap.md:39` records an owner decision of **12 August**: v1 ships **unsigned** for
> the internal fleet, so SmartScreen appears once and the setup journey announces it in advance. That
> decision is defensible on its own terms — the operators are employees receiving the binary
> internally, not the public downloading it — and it means gate 1 (H41/H42) is **not applicable to
> v1** rather than blocked on money. It becomes live again only if distribution ever widens beyond
> the internal fleet, which is the trigger to write against. This row's original wording caused a
> recommendation to start certificate procurement to be made in ignorance of the decision; the two
> documents now agree. Gates 2 and 3 are unaffected — they still need the clean VM. Power loss during an update and a withdrawn installer on a clean machine both need a **clean
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

## Decisions — 17 August 2026, third pass

**5. No eager key validation, on either side. The principle behind it is worth more than the answer.**

Asked because C33's guard fires lazily: nothing validates keys at startup, so a bad key on Railway
lets the deploy succeed and breaks the first vault operation instead. Both plausible places to add a
check were examined and both were rejected, and — this is the useful part — for the *same* reason.

*Server, at boot.* The project already answered this for the structurally identical case.
`collect-ops-alerts.ts:36` records that `no-server-key` deliberately raises no tray warning, because
`loadVaultKey` "already throws loudly at the first encryption" and adding a line for something
already failing noisily just dilutes the tray. C33 moved placeholder keys into exactly that
category: before the guard they were silent and dangerous, after it they fail like a missing key,
with a message that names the variable and both recovery paths. Overturning a recorded decision
needs new information, and there is none — only the same information. Two further costs: a boot
check would turn every config error, including a merely *absent* key, into a crash-loop that takes
the whole site down over something that today only disables vault operations; and `VAULT_KEY_OPERATOR`
is **supposed** to be absent on the server in the finished GĐ3 posture, with a test asserting the app
runs fully without it, so a naive "validate the keys at startup" would break the architecture's own
goal.

*Relay, at config load.* Tempting, because a placeholder pasted before the guard existed stays in
protected storage and keeps working, silently weak, and the intake guard never sees it again.
`reviewRelayConfig` already validates that key's length and charset, so the check would cost one
line. It was rejected on evidence: `main.ts:102-103` sets `config = null` whenever the review reports
a problem, and every real operation is gated on `problems.length === 0`. Adding the check would take
a relay that is working today and turn it into an unconfigured one that refuses all work — the
catastrophic form of the false rejection this guard was shaped to avoid, inflicted on a machine whose
key is weak but functioning. The population at risk is plausibly zero; the cost of being wrong is a
bricked operator machine.

**The rule both answers come from, stated so the next instance is mechanical:** *check a secret at the
moment it is **adopted**, never at the moment it is **used**.* Adoption is where a human chooses a
value and where rejecting costs nothing but a re-paste. Use is where rejecting costs someone their
working machine or their data. Every decision this session follows it — `parseVaultKey` guards the
env-to-process adoption while `allowPlaceholder` exempts the retirement read; the Relay guards the
paste box but not the sealed device-to-device transfer, and not the stored key at load; and boot is
use, not adoption.

## Decisions — 17 August 2026, fourth pass

**6. Coverage boundaries are a finding class, not four coincidences. Audit the checking apparatus, not only the code.**

Asked after C37, because four findings in one day shared a shape and that started to read as an audit
failure rather than an audit result. It is not a failure — six of the seven recent findings (C26, C33,
C34, C35, C36, C37) were caught internally, and only C23 reached production. But the *discovery
mechanism* was luck in every case: C33 while writing a handoff, C34 while remediating C33, C35 by
self-review, C36 while attempting a deploy, C37 because a human happened to run the pre-publish step.
Recovery by someone going looking is not a control — the same sentence this register already wrote
about dropped handoffs.

The four are not one bug repeated. They are one invariant violated at four different edges:

| Finding | Boundary crossed |
| --- | --- |
| C23 | developer filesystem ⊃ Docker image filesystem |
| C35 (also C2, C33) | suite runs without Postgres; `*.database.test.ts` needs it |
| C36 | `pg_dump` 17.10 client < Postgres 18.4 server |
| C37 | CI is Linux with no built `.exe`; the artifact is Windows |

The invariant: **CI's environment is a strict subset of the production and release environments, and
everything in the difference set is unverified.** Each finding is a discovered element of a set nobody
had enumerated.

**The rule, stated so the next instance is mechanical:** *a check not proven to **run** in the
environment its artifact lives in does not exist.* Sabotage-proofing proves a check **catches**; only
a runner proves it **runs**. This project has a rigorous ritual for the first question and had none
for the second, and all four findings are failures of the second.

**This was already learned once, in the other repository, and not carried across.**
`MKTBrowser/.github/workflows/release.yml:45-50` records the identical lesson — MKB-03, the
settings-store suite and the workspace-quality contract "all existed and passed locally while never
running on any push" — and fixes it with a single aggregate registration point (`test:installer`), so
a new suite is covered by CI the moment it is added. MKTTool has no equivalent. That is the
generalisation still owed; the C37 job closes one instance, not the class.

**Known checks with no machine behind them** — the inventory that did not exist until now, which is
the part that *is* mechanizable even when the check is not:

| Check | State |
| --- | --- |
| `npm run relay:verify` before publish | **Closed** — now the `relay-executable` CI job (C37), green on its first run in MKTTool #28 (2m22s). |
| Confirming a merge actually deployed | **Closed (C38, PR #29)** — the `deploy-verification` job. It was never a human step that got forgotten; it was a step nobody had defined, and the signal to check it already existed unread in GitHub. |
| `npm run db:backup:remote` before a structural deploy | **Possible again, still human (C36).** The Postgres 18 client is installed and a real backup was taken to prove it. Remains a human step: it must run *immediately before* a structural deploy, and no CI job can know when the operator is about to press merge. This is the honest residual — the tool is fixed, the remembering is not. |
| `test:packaging:windows-machine` (C10) | Opt-in by design — live machine inspection cannot be hermetic. Stays human, deliberately. |
| Authenticode verification (H41/H42) | Blocked on procurement of a signing certificate. |
| Power-loss and withdrawn-installer gates (H52, H54) | Blocked on a clean Windows VM. |

An item belongs in this table the moment it is identified as human-only, for the same reason handoffs
belong in the Handoff Audit table at the moment of handoff rather than when someone remembers.

**Addendum, 18 August 2026 — "this one has to stay human" has now been wrong twice, for the same
reason both times.** C37 was recorded as un-automatable because CI had no Windows runner; one
already existed in the sibling repository. C38 was recorded as needing a Railway notification plus a
habit; Railway had been publishing deployment status into GitHub the whole time and nobody was
reading it. Neither needed a new capability built. In both cases **the signal already existed and
was simply unwatched**, and in both cases the entry that declared it human-only was written in one
sentence without checking. So the inventory above earns its keep in a second way: it is not only a
list of things people must remember, it is the list of the best remaining automation candidates.
Before adding a row to it, spend ten minutes looking for a signal that already exists — that is
roughly what it cost to overturn each of these, against nine hours and several days of silent
failure respectively.

**7. The Windows job runs on pull requests only, and the reasoning is a cost trade rather than a
safety one.** `Techieslab-app/MKTTool` is private, so Windows minutes bill at **2x**; measured
locally, build is ~90 s and the suite ~40 s, which lands near 12 billed minutes per run once a cold
`npm ci` on Windows is included. At the recent rate of work that is most of a monthly allowance. The
saving is nearly free because a `pull_request` event builds the **merge commit** — the head already
merged into the base — so the PR run verifies the exact tree master is about to become, and the
post-merge `push` run re-verifies identical content. Residuals written into the workflow next to the
condition: a commit pushed directly to master skips the job, and a PR whose base moved after its last
run tested a stale merge commit. Every change since #23 arrived by pull request, so neither is
reachable in the current way of working; if that changes, deleting one `if:` line restores full
coverage. F10 governs `check` and is untouched.

**8. MKTTool does not have MKTBrowser's suite-registration gap. Closing the item rather than carrying
it as debt.** The generalisation owed after C37 looked like "MKTTool needs its own `test:installer`".
Checked instead of assumed, and the premise is false: `vitest.config.mts:52` discovers tests by glob
across `src/**`, `relay/**` and `scripts/**`, so there is no hand-maintained list of suites that can
silently lag the repository — which is exactly the failure MKTBrowser's aggregate step exists to
prevent, and it needed one because it registered suites individually. Verified there is no
`*.test.ts` anywhere outside those three directories, and the only other top-level directories are
`prisma`, `data`, `docs` and `plans`. No guard test was added: the risk it would cover is a test file
placed somewhere no test file has ever been placed, and a guard against that buys less than the line
it costs. **What the class actually is, restated correctly:** MKTTool's blind spot was never test
*discovery*, it was checks that are not test files at all — build scripts, acceptance harnesses,
operational tooling. Of those, `relay:verify` is now in CI and `db:backup:remote` is C36. The table
above is the register of that class; keep it, not a second aggregate script.

## Observations from the 17 August deploy — recorded, not ranked

Neither is a defect worth a finding row, but both were seen for the first time during the deploy and
would otherwise be rediscovered from scratch.

- **Turbopack traces the whole project into the output.** Two warnings, at `database-backup.ts:156`
  (`spawn(PG_DUMP_COMMAND, …)`) and `relay-compatibility-manifest-file.ts:56`
  (`readFileSync(relayCompatibilityManifestPath(), …)`). Next's own message: *"leads to all source
  files (including the public folder) to be deployed as part of the server code … can slow down
  deployments or lead to failures when size limits are exceeded."* Not the cause of any failure so
  far. The documented fixes are a statically-scoped path or a `turbopackIgnore` comment.
- **Two test files fail on Windows and pass on Linux CI.**
  `scripts/release-authority/offline-root-ceremony.test.ts` and
  `release-authority-ceremony-verifier.test.ts` both fail locally with `SyntaxError: Invalid or
  unexpected token`. Confirmed **pre-existing** by stashing all local changes and re-running. CI is
  green on them, so a local full-suite run on this machine reads as `2 failed | 190 passed` even on
  a clean tree — know that before treating it as a regression you just caused.

  **The stated cause was wrong. Corrected 17 August 2026, evening.** This entry said "almost
  certainly a character-encoding difference", and it is not: every file in the import chain —
  both `.test.ts` files and all five `.mjs` modules under `scripts/release-authority/` — is **pure
  ASCII, no BOM, no control characters**, checked byte by byte. "Almost certainly" was a guess
  written as a finding, which is the same habit that produced C37's un-automatable claim; a guess
  belongs in the entry labelled as one.

  **Investigating it did surface a real defect, now fixed.** `offline-root-ceremony.mjs:189` guarded
  its direct-run branch with `import.meta.url === pathToFileURL(process.argv[1]).href`. When the
  module is *imported* rather than run, `process.argv[1]` can be undefined and `pathToFileURL`
  throws `TypeError`, so the module could not be loaded by anything that imports it — proven with a
  bare `node` import, which failed before the fix and succeeds after. Guarded with
  `process.argv[1] &&`; direct invocation still prints usage, import is now silent. The pattern
  appears exactly once in the repository. **It was not the cause of the two red suites** — they stay
  red after the fix — so this is a latent bug found on the way past, not the answer.

  **The actual cause is still unknown**, and is recorded that way rather than guessed at twice.
  Vitest reports the failure at *transform* time with no file, line, or stack. One lead worth
  following next: `package.json` declares no `"type": "module"`, so `.ts` under `scripts/` is CJS
  while these `.mjs` modules are ESM, and the two failing suites are the only ones that cross that
  boundary. Low priority — CI is green, so the release-authority ceremony code is genuinely covered;
  the cost is local-only friction. **But it should not stay open indefinitely:** two permanently red
  files on the developer's machine re-teaches the habit that C2's `it.fails` cleanup removed, which
  is that red is normal. The suite has zero expected failures **on CI**; locally it does not.

## The open policy question behind C39 — 18 August 2026

Stated separately from the C39 row because the code defect is fixed and this is not a code question.
It is the owner's, and it should be answered deliberately rather than drifting.

**`MIN_RELAY_VERSION` is still 1, and the fleet is still on Relay 12 or earlier.** Relay 13 is the
first build carrying the C26 fix — an enrolled Relay's trust root could be replaced over
`/configure`, ranked **P2**, which converts an XSS in the web app into persistent trust-root
replacement on every operator device and leaves the Relay a decryption oracle for whoever re-points
it. It also carries C34. So the audit's headline, *no P0, P1 or P2 findings remain*, is true of the
repository and **not true of the machines**. A fix that is not enforced is not deployed. The only
pressure to update today is an advisory notice, and C38 has just demonstrated that the notice can
silently stop working for nine hours.

**The recommendation is to raise the floor to 13, and the argument is about timing more than
principle.** The cost of enforcing is at its historical minimum right now: pre-pilot, no real
accounts, an internal fleet, and a download page that serves 13. Every week that passes raises it.
The refusal is already actionable — `ticket-verifier.ts:167` tells the operator the version they
have, the version required, and where to get it — which is precisely the standard gate 3 asks for.
And the mechanism has never been exercised in thirteen releases; pulling the lever while a mistake
costs an afternoon is worth something on its own.

**The argument against, which is real:** this is a rejection at *use*, not at adoption, and this
register's own rule warns about exactly that. The mitigating difference is that the operator is not
stranded — the message names the way out and the way out works. Pre-pilot, "mid-work" barely exists.

**Approved by the owner and done, 18 August 2026 — MKTTool #30, shipped with the C39 fix in one PR
so the order cannot be got wrong.** Raising the floor before the lever was repaired would have moved
nothing for four of five kinds while reporting that it had.

**"One constant and one deploy" was wrong, and the correction is the useful part.** Raising the floor
broke five suites, in two distinct ways. Two tests encoded the *old policy* as their premise — that a
Relay at 9 still gets credential tickets while being refused compatibility updates — which the
security floor deliberately overrides; the per-kind mechanism is now **dormant** rather than gone,
since 13 exceeds every capability entry. Those were rewritten with the reasoning kept, not deleted.
Three more carried **hard-coded relay versions in fixtures** and expired the moment the floor moved:
the C35 lesson one layer up, and two of the three need Postgres, so on a machine without one they
would have surfaced on CI after a push rather than locally. All now derive from `MIN_RELAY_VERSION`.
The estimate was wrong because it counted the constant and not the assumptions built on its value.

**Note the ordering, because it matters.** Raising the floor also gives gate 3 a real subject: v9–v12
become genuinely refused, and the gate becomes runnable as literally worded rather than scoped down
to the compatibility-update path. That is a **byproduct and not the reason**. Withdrawing a version
to give a test something to chew on would be the tail wagging the dog; enforcing a floor because a
P2 is sitting unpatched on every operator machine is just the right thing, and the gate happens to
benefit.

**The recovery path was confirmed live before the floor landed**, which was the one thing that had to
be true before blocking anyone. The download page serves **Relay 13, 32.7 MB, packaged 17 August
20:23** — matching the retained artifact byte for byte at 34,284,121 bytes. This had been carried as
an open question since 17 August precisely because it could not be checked from outside: every
relevant endpoint returns 401 before it resolves a version, which is correct behaviour and also why
it needed a signed-in human. Blocking a fleet whose only exit is a download page nobody had opened
would have been the wrong order to do this in.

## Unresolved Questions

1. C1's remaining half and C5 — real domain prefixes on all six protocols, a coordinated
   server-and-relay wire-format break. Trigger: the next time the ticket wire format changes for any
   other reason. **Do not re-derive the safety argument from this row alone** — it was wrong once.
   Re-read `server-key-cross-protocol-matrix.test.ts`, which pins the actual property and enumerates
   every artifact-verifier pair. **Now designed and waiting**:
   `../260817-1802-c1-c5-protocol-domain-separation/`. Writing it surfaced a hard dependency nobody
   had noticed — `RelayDevice` carries no version column, so there is no way to know when a rollout
   has reached every machine, and the phase where the server switches signing format is a blind
   switch until that exists. The plan does **not** authorise starting; the trigger has not fired.

The three Windows gates have a runbook: [windows-release-gates-runbook.md](windows-release-gates-runbook.md).
It tests H52, H41/H42 and H54 as originally worded rather than the looser paraphrases in
circulation.

**Status, 18 August 2026.** Two of the three blockers this list used to carry are gone. Gate 1 is
**out of scope for v1** — the owner decided on 12 August that v1 ships unsigned to the internal
fleet, so it is not a purchase waiting to be made; only its non-signature half is worth running, and
that runs on the same VM as the others. The warning about keeping a withdrawn installer *before the
next release* is **satisfied and no longer urgent**: v9–v12 are retained in
`MKTBrowser/apps/desktop/.relay-payload/`. And gate 3 has a real subject for the first time — raising
`MIN_RELAY_VERSION` to 13 means those versions are genuinely refused rather than merely old. The
clean Windows VM exists (`mkt-windows-gate`, snapshot `clean`, Secure Boot enrolled), so **gates 2
and 3 are now blocked on nothing but someone running them.**

Questions 2 through 5 of the previous list — C2's seed policy, authorizing Phase 05 remediation,
C28's block-or-warn, and C29's heartbeat — were all answered and implemented on 17 August 2026. They
are removed rather than left standing, because a list of open questions that is mostly closed
questions stops being read.
