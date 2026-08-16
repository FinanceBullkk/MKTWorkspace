# MKTWorkspace Audit — Quality, Security, Dead Code

Date: 2026-08-16
Scope: `MKTTool` (@ `feat/mkt-browser-clean-break`, clean tree), `MKTBrowser` (@ `feat/mkb-03-compatibility-set`, clean tree), workspace root.
Method: inline static review + full automated gate run. No source modified.

**This is a breadth-first sweep with depth on the auth/crypto entry points and build/test hygiene. It is not a complete audit.** Read [Coverage and limitations](#coverage-and-limitations) before treating any subsystem as cleared. Absence of a finding for a subsystem listed there means it was not examined, not that it is clean.

## Verified gate results

| Gate | Result |
| --- | --- |
| MKTTool `tsc --noEmit` | PASS |
| MKTTool `eslint .` | PASS, 0 findings |
| MKTTool `vitest run` | PASS — 172 files, 1484 tests |
| MKTBrowser typecheck (6 projects) | PASS |
| MKTBrowser `verify:workspace-quality` | PASS |
| MKTBrowser `check-javascript-syntax` | PASS, 27 files |
| MKTBrowser desktop main tests | PASS, 51 |
| MKTBrowser packaging tests | PASS, 27 |
| MKTBrowser profile-manager tests | PASS, 11 |
| MKTBrowser mcp-server tests | PASS, 10 |
| MKTBrowser settings-store test | PASS, 1 |
| `npm audit --omit=dev` (MKTTool) | 1 high (transitive, build-only) |

Nothing is red. Findings below are gaps the green gates do not cover.

## What is genuinely strong

Not padding — these change the severity of everything else.

- **Entry-point guarding is shape-enforced, not convention.** `src/lib/auth/guarded-entry-points.test.ts` scans every `"use server"` file and every `route.ts`, and requires the guard to sit in the *signature* (`export const X = guardedAction(...)`). A body-level `await requireActor()` fails the test on purpose. `NOT_YET_GUARDED` is asserted empty, so the easy escape hatch is closed.
- **Role is recomputed per request** from `ALLOWED_EMAILS`, not read from `User.role` — removing someone from the env list revokes them immediately (`src/lib/auth/require-actor.ts:66`).
- **Ticket verification order is correct**: signature → format version → min relay version → expiry → device binding → replay consume → unseal (`src/lib/tickets/ticket-verifier.ts:85`). Signature is checked against the raw received bytes, not a re-serialized object.
- **Crypto is unexceptional in the good way**: AES-256-GCM, 96-bit random IV per call, versioned envelope, no default key parameter (`src/lib/crypto/credential-encryption.ts`).
- **Constant-time bearer comparison** in both `release-download-token.ts:60` and `HttpTransport.ts:119`, with length check first.
- **Electron hardening is real**: `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, `sandbox: true`, `setWindowOpenHandler` denying, single `ipcMain.handle` wrapper. Electron pinned exactly at 42.8.1.
- **`--no-sandbox` is not shipped to normal launches** — gated behind the packaged-contract fixture triple check (`ChromiumBrowserDriver.ts:178`).
- **Proxied profiles fail closed** if WebRTC firewall containment cannot be verified (`ChromiumBrowserDriver.ts:193`).
- **No shell injection surface**: every child-process call uses `execFile`/`spawn`, never `exec` with a string.
- No secrets tracked in git (`.env`, `dev.db`, `*.db` all ignored, verified via `git check-ignore`).

## Findings

### F1 — MKB-03 test suite never runs in CI (P1)

`MKTBrowser/.github/workflows/release.yml` runs: `verify:node`, `verify:workspace-quality`, `lint`, `test:w02`, `test:mkb01`, `test:mkb01e`, `test:mkb02`, `test:packaging`, `typecheck`, `build`, `verify:packaged-contract`.

It never runs `test:mkb03` and never runs the root `test:installer` aggregate. So these are unprotected by CI:

- `profile-deletion-lifecycle.test.ts` — permanent profile deletion
- `compatibility-engine-pin.test.ts` — engine pinning
- `compatibility-smoke-authorization.test.ts`, `compatibility-smoke-runner.test.ts`
- `windows-local-install-inspector.test.ts`
- `@mktbrowser/profile-manager test:deletion`
- `@mktbrowser/settings-store test`

This is exactly the newest and most destructive-capable work (profile deletion, engine activation gating). It passes locally today; nothing stops it regressing on the next push. The root `test:installer` script already composes the right set — CI just doesn't call it.

Fix: replace the individual `test:w02/mkb01/mkb01e/mkb02/packaging` steps with one `yarn test:installer` step, or add the two missing steps.

### F2 — MKTBrowser's security guarantees are asserted by regex over source text, not by behavior (P1)

`apps/desktop/src/main/security-contract.test.ts` reads source files as strings and pattern-matches them. 171 `readFileSync`/`assert.match` occurrences across 10 MKTBrowser test files; `security-contract.test.ts` alone has 32.

Concretely, the Electron hardening test asserts `/contextIsolation:\s*true/` appears somewhere in `index.ts` (line 34). That passes if the option sits in dead code, if it is overridden later, or if a second `BrowserWindow` is created without it. And `assert.match(driver, /"--disable-gpu", "--disable-software-rasterizer", "--no-sandbox"/)` (line 126) breaks on a Prettier reflow while proving nothing about the launched process.

The settings are in fact correct today — I read `index.ts:174-176`. The finding is that the *test* does not establish that, so it will not catch the regression it exists to catch.

Contrast with MKTTool, which solved the same class of problem properly: `guarded-entry-points.test.ts` enforces a *structural* property that cannot be satisfied by an unenforced string.

Fix: for the Electron surface, assert on the actual `webPreferences` object passed to `BrowserWindow` (export the options builder and test it). For the MCP tool inventory, the existing `tool-exposure-policy.ts` import-based assertions are already the right shape — extend that pattern.

### F3 — Core MKTBrowser modules have zero behavioral tests (P1)

No test imports and exercises:

| Module | Lines | Why it matters |
| --- | --- | --- |
| `apps/desktop/src/main/ChromiumBrowserDriver.ts` | 1950 | proxy application, fingerprint reconciliation, launch fail-closed |
| `packages/profile-manager/src/fingerprint.ts` | 1574 | the antidetect fingerprint generator — the product's core value |
| `packages/mcp-server/src/server.ts` | 1326 | the whole MCP tool surface |
| `packages/mcp-server/src/HttpTransport.ts` | 303 | **the bearer-token auth boundary** |
| `apps/desktop/src/main/socks5Bridge.ts` | — | proxy bridge; a bug here is an identity leak |
| `packages/cdp-driver/src/CdpSession.ts` | 624 | CDP safe-mode enforcement |

`HttpTransport.ts` is the one I would fix first: it is the authentication check for a port that drives the browser, and there is no test proving a wrong token gets 401, a missing token gets 401, or the Host allowlist rejects a rebinding host.

Ratio for context: MKTTool has 1484 tests over 59.5k lines; MKTBrowser has ~100 over 25.8k, and a large share of those 100 are the F2 string assertions.

### F4 — `/encrypt-for-vault` skips the Origin check its sibling handlers document as mandatory (P2)

`relay/src/handle-encrypt-for-vault.ts:15` justifies having no Origin check with: *"Cửa vào vẫn hẹp: CORS khai đúng một nguồn."*

Its two siblings state the opposite, correctly. `handle-configure.ts:9-19` and `handle-set-operator-key.ts:12-17` both spell out that CORS blocks *reading the response*, not the request arriving — a `content-type: text/plain` simple POST reaches the handler with no preflight. Every other POST route enforces `request.headers.origin` or requires a signed ticket. This one does neither.

Direct impact is low: an attacker page can make the relay encrypt attacker-chosen plaintext with `VAULT_KEY_OPERATOR` but cannot read the ciphertext back. It is a blind oracle. The reason to fix it is that the endpoint's stated rationale is the one the codebase elsewhere identifies as wrong, so it will be reasoned from again.

Fix: add the same `origin !== allowedOrigin` check. One `if`, matching the established pattern.

### F5 — `RELAY_ROUTE_POLICIES` classifies capabilities but nothing enforces them (P2)

`relay/src/relay-route-policy.ts` assigns each route a `capability` (`local-secret-reveal`, `device-retirement`, `operator-key-seal`…) and the comment at `relay-http-server.ts:47` says *"Security classification is mandatory even when enforcement lives inside the handler."*

`relay-route-policy.test.ts` only checks that every path is classified once and that the method/capability strings are from the allowed sets. It never checks that a route classified as, say, `operator-key-seal` actually verifies anything. The table is documentation wearing a test's clothes — and F4 is precisely the gap it would have caught.

Fix: assert per capability class that the handler module contains an origin check or a ticket/authorization verification, in the structural style of `guarded-entry-points.test.ts`.

### F6 — `mktBrowserToken` is written to plaintext `relay-config.json` while its peers moved to DPAPI (P2)

`relay-config.ts:110-113` routes `vaultKeyOperator` into the DPAPI secure store and deletes it from the JSON. `mktBrowserToken` falls through to the generic loop at line 115 and lands in plaintext.

Confirmed on disk: `local-test-artifacts/revoked-local-relay-20260813-051218/relay-config.json` contains `mktBrowserToken` and `mktBrowserUrl` in the clear. (The archived `relay-config.json` files contain no `vaultKeyOperator`, and the archived `relay-device-key.json` files are 93-byte tombstones with no `privateKey` field — the protected-secret migration did work for those two.)

That token is the bearer credential for the MCP port that drives the browser. Mitigating: MKT Browser itself already stores the same token in a plaintext `mcp-token` file by design (per the 401 message in `HttpTransport.ts:140`), so the marginal exposure is small. But the audit plan's lifecycle section claims uninstall *"preserves every identity-bearing local datum"* under protection, and this one is not protected. Either protect it or state explicitly that it is deliberately unprotected because the Browser holds it in the clear anyway.

### F7 — `local-test-artifacts/` is 1.7 GB of unmanaged state including three archived relay identities (P3)

Workspace root, outside both repos, no cleanup policy, no expiry:

- `MKTBrowser-Local-Test-Relay-v10.exe` — 146 MB
- `mktbrowser-data-disabled-for-local-test/` — a full Chromium build
- three archived relay homes: `installed-relay-before-local-test-20260813-0430`, `installed-relay-production-disabled-for-local-test`, `revoked-local-relay-20260813-051218`

Each archived home carries `protected-secrets/*.dpapi`. DPAPI is bound to the Windows user account, so these are not readable by another user — but they are indefinitely-retained copies of device identity material with no owner and no deletion date, and they also slow every repo-wide grep. The restore scripts (`restore-after-local-test.ps1`, `reset-revoked-local-relay.ps1`) are present, so the "temporary" framing was real; the cleanup just never ran.

Fix: run the restore scripts, then delete. If any archive is still needed as audit evidence, move it under the audit plan's `evidence/` directory with a stated retention date.

### F8 — MKTBrowser has no linter (P3)

Root `lint` = `verify:workspace-quality && workspaces foreach run lint && check-javascript-syntax`. Each workspace's `lint` is `tsc --noEmit --noUnusedLocals --noUnusedParameters --noFallthroughCasesInSwitch`.

That is a type check with three extra flags, not linting. No ESLint, no rule set. MKTTool runs ESLint 9 with `eslint-config-next` and is clean. The two halves of the same product are held to different standards, and the half with the 1950-line files is the unlinted one.

### F9 — Oversized files concentrated in MKTBrowser (P3)

Against the project's ~200-line guidance, files over 400 lines:

- MKTBrowser: 12 files — `ChromiumBrowserDriver.ts` 1950, `fingerprint.ts` 1574, `server.ts` 1326, `ChromiumBootstrap.ts` 910, `index.ts` 878, `CdpSession.ts` 624, `test-cdp.ts` 551, `ProfileTile.tsx` 542, `ProfileManager.ts` 503, `App.tsx` 474, `McpPanel.tsx` 445, `ProfileRow.tsx` 434
- MKTTool: 2 files — `relay/src/main.ts` 429, `mkt-browser-adapter.ts` 418

MKTTool holds the line well. MKTBrowser inherited these from MultiZen. Note this compounds F3: the untested modules and the oversized modules are the same list.

### F10 — MKTTool CI does not run on the active branch (P3)

`ci.yml` triggers on `push: branches: [master, main]` and on `pull_request`. Active development is `feat/mkt-browser-clean-break`. Pushes to it get no CI until a PR exists. MKTBrowser's workflow uses bare `on: push` and does not have this gap.

### F11 — `getHerdHealthCheckStatus` is a live but uncalled server action (P3)

`src/lib/health/health-check-run-actions.ts:69` exports it via `guardedAction`; nothing calls it. In a `"use server"` file every export is its own POST endpoint, so this is a reachable, authenticated-but-unused endpoint. It is guarded, so not a vulnerability — just surface with no consumer. Delete it or wire it up.

### F12 — Dead / over-exported symbols (P3)

A full unused-export scan (548 files) returned 339 hits. Most are false positives in the sense that matters: exported `interface`/`type` used only within their own file, or helpers exported solely for their own `.test.ts`. Those are over-exposure, not dead code, and not worth a sweep.

Genuinely unreferenced anywhere, verified by grep:

- `src/lib/facebook/facebook-token-warnings.ts:73` — `hasFacebookTokenWarnings`
- `src/lib/platforms/platform-family.ts:44` — `isManualPostPlatform`
- `src/lib/health/health-verdict.ts` — `HEALTH_VERDICTS`, `VERDICT_PRESENTATION`, `isHealthVerdict`
- `src/lib/relay/relay-release-r2.ts` — `headRelayCompatibilityManifest`, `headRelayCompatibilityRevocations`, `openRelayCompatibilityRevocations`
- `src/lib/relay/relay-compatibility-manifest-file.ts` — `readRelayCompatibilityManifestFromDisk`, `readRelayCompatibilityReleaseFromDisk`, and four path constants
- `src/lib/health/reddit-profile-parser.ts` — `redditPermalinkUrl`
- `src/lib/content/content-types.ts` — `JOB_STATUS_PRESENTATION`

Checked and *not* dead (used inside their own file — scanner artifact): `measureProxyLiveness`, `connectTcp`, `buildPlaywrightProxy`, `saveScreenshot`, `backupNotConfiguredAlert`, and the whole `compatibility-update-marker` / `active-engine-pin` pair.

Scanner kept at `scratchpad/find-unused-exports.mjs` if you want to re-run it.

### F13 — `nanoid@3.3.16` high advisory, build-path only (P3)

GHSA-2v37-7h3g-55p8. Chain: `next@16.3.0 → postcss@8.5.23 → nanoid`, and the same via `better-auth → vitest → vite → postcss`. PostCSS is build-time; nanoid is not on any request path. `npm audit fix` resolves it. Low urgency, trivial cost.

### F14 — Two empty garbage directories in the MKTBrowser repo root (P3)

`MKTBrowser/㗸埨ſ/Microsoft/Spelling/neutral` and `MKTBrowser/䋸ẜƪ/Microsoft/Spelling/neutral` — empty directory trees, no files, so git does not see them and the tree still reports clean.

These are Chromium spellcheck directories created under a mojibake path, i.e. some launch passed a corrupted `APPDATA`/user-data-dir. Harmless as they stand. Worth one look at whether a dev/test launch path builds that env var unsafely, since the same bug pointed at a real path would scatter profile data.

### F15 — Documentation language contradicts the stated convention (P3)

`AGENTS.md:50` requires user-facing labels and error messages in English. Live user-facing strings are Vietnamese throughout — `require-actor.ts:70` `"Chưa đăng nhập."`, `guarded-action.ts:56` `"Tải lại trang để đăng nhập."`, every relay handler message, the relay status page. Source comments are Vietnamese in MKTTool/relay and English in MKTBrowser and newer MKTTool files.

AGENTS.md does grandfather existing Vietnamese artifacts as legacy, so this is not a violation. But "legacy" now covers most of the user-visible surface, and the rule as written gives no signal about when it starts applying. Either scope the rule (e.g. "MKTBrowser and all new modules") or record the actual policy.

## Priority order

1. F1 — add `test:mkb03` / `test:installer` to MKTBrowser CI. One-line fix, closes the largest live gap.
2. F3 — behavioral tests for `HttpTransport.ts` auth first, then `socks5Bridge`, then `fingerprint.ts`.
3. F2 — convert `security-contract.test.ts` Electron and driver assertions from source-text to structural.
4. F4 + F5 — Origin check on `/encrypt-for-vault`, then a capability-enforcement test so the class stays closed.
5. F6 — decide and document: protect `mktBrowserToken` or state why it is deliberately clear.
6. F7 — run the restore scripts and reclaim 1.7 GB.
7. F8, F13 — add ESLint to MKTBrowser; `npm audit fix`.
8. F9, F10, F11, F12, F14, F15 — backlog.

Against the audit plan's gate model: **no P0**. F1–F3 are P1 by the plan's own definition ("broken rollback, unsafe installer/update, unrecoverable failure" — F1 leaves the deletion and engine-activation gates unguarded in CI). They do not change the existing NO-GO verdict for MKB-04; they add to what Phase 03 must close.

## Coverage and limitations

Roughly 25 of ~700 source files were read in depth. Coverage is deliberately uneven, not uniformly shallow — the whole-tree passes below are exhaustive, the file-level reading is not.

### Exhaustive (whole tree)

- All automated gates executed, both repos.
- Pattern sweeps: `exec`/`child_process`, `nodeIntegration`/`contextIsolation`/`webSecurity`, `rejectUnauthorized`/TLS bypass, `console.*` with secret-shaped arguments, `TODO`/`FIXME`/`as any`/`@ts-ignore`.
- Unused-export scan across 548 files, with grep verification of every suspicious hit.
- Git state, `.gitignore` coverage of secrets, CI workflow contents, file-size census.
- `npm audit` (MKTTool production dependencies).

### Read in depth

Auth guards and entry-point enforcement; `require-actor` / `guarded-action` / `guarded-route`; relay HTTP server and its route policy; four relay handlers (`secret`, `configure`, `set-operator-key`, `encrypt-for-vault`); `credential-encryption`; `ticket-verifier` and `ticket-replay-guard`; `HttpTransport`; `security-contract.test.ts`; `release-download-token`; two excerpts of `ChromiumBrowserDriver`; both CI workflows.

### NOT examined — no conclusion should be drawn about these

Ordered by the risk the gap carries.

| # | Area | Why the gap matters |
| --- | --- | --- |
| 1 | Enrollment/retirement crypto protocol (~15 files: `grant-authorization`, `device-retirement-finalization`, `grant-completion-proof`, `operator-grant-state`, `device-retirement-recovery-server`) | Bespoke multi-generation protocol. Cross-generation replay, key confusion, and missing context binding live here. The ticket path was reviewed; this one was not. |
| 2 | `packages/mcp-server/src/server.ts` tool implementations (1326 lines) | Only the auth wrapper and the exposure-policy table were checked. No tool body was read — `cdp_send`, `set_cookies`, `extract` are the largest attack surface in MKTBrowser. |
| 3 | `apps/desktop/src/main/socks5Bridge.ts` | Flagged as untested in F3 but never read. A defect here is a proxy leak, i.e. identity disclosure — the product's core invariant. |
| 4 | Installer, packaging, update, rollback, uninstall scripts | Their tests were run and pass; no code was read. The audit plan classifies this area P0. |
| 5 | Release authority (offline root ceremony, delegated keys, manifest signing, revocation) | Entire trust-root establishment path unreviewed. |
| 6 | `prisma/schema.prisma` and migrations | Never opened. No review of indexes, N+1 query patterns, transaction boundaries, cascade/referential integrity, or migration reversibility. |
| 7 | `packages/profile-manager/src/fingerprint.ts` (1574 lines) | Core antidetect logic. Not read. |
| 8 | Rules engine, queue, schedulers, duplicate/collision detection | Business-logic correctness unreviewed. Per the project's own CI comment, "silently passing instead of flagging" is the dangerous failure mode here. |
| 9 | React frontend (both apps) | Filenames only. No XSS review, no `dangerouslySetInnerHTML` audit, no client state handling. |
| 10 | Global error/redaction paths | Only `console.*` was grepped. Whether proxy passwords or tokens reach provider/network error messages was not traced. |
| 11 | MKTBrowser dependency audit | `yarn npm audit` not run (MKTTool's `npm audit` was). |
| 12 | Concurrency and races | Health-check lock, daily schedulers, singleton locks — not analysed beyond observing expected test-path noise. |
| 13 | `docs/` accuracy vs implementation | Roadmap, changelog, architecture docs not verified against code. |

### Method limits

- **Static only.** Nothing was executed end-to-end; no dynamic or adversarial testing, no packaged installer run, no live Windows scenario.
- **No P0 was found, but no P0 can be excluded** for areas 1–5 above, which are precisely where the plan expects P0s to live.
- Severity ratings are the reviewer's judgement against the plan's gate model, not the outcome of a formal threat model.

### To reach Phase 02 completeness

In priority order: areas 1 → 3 → 2 → 4 → 5, then 6 and 8. Areas 1 and 4 alone are comparable in effort to this entire pass.

## Unresolved questions

1. Was `test:mkb03` omitted from CI deliberately (runtime cost, Windows-only fixtures) or is it an oversight from when the root `test:installer` aggregate was introduced?
2. Is `mktBrowserToken` in plaintext an accepted decision — given MKT Browser stores the same token in a plaintext `mcp-token` file — or was it missed by the DPAPI migration that moved `vaultKeyOperator`?
3. Are the three archived relay homes in `local-test-artifacts/` still needed as MKB-03 evidence, or can they be deleted after the restore scripts run?
4. Does the F14 mojibake path come from a repo script, or from an external launch (VS Code shell, Codex sandbox) outside this codebase?
