# Phase 00 — Fix Re-Verification (executed as: remediate, then verify)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Source findings: [`audit-260816-0452`](./audit-260816-0452-mktworkspace-quality-and-security.md)
Repos: MKTTool @ `feat/mkt-browser-clean-break`, MKTBrowser @ `feat/mkb-03-compatibility-set`. Both clean at start.

**Depth achieved: D2**, as planned. Phase file assumed F1–F15 were already fixed; none were, so this
phase was executed as remediate-then-verify per instruction.

## Gate results

| Gate | Baseline (before) | After |
| --- | --- | --- |
| MKTTool `tsc --noEmit` | PASS | PASS |
| MKTTool `eslint .` | PASS, 0 | PASS, 0 |
| MKTTool `vitest run` | PASS 172 files / 1484 tests | PASS 173 files / **1526** tests |
| MKTBrowser `typecheck` (6 projects) | PASS | PASS |
| MKTBrowser `lint` | PASS (tsc-only) | PASS, **now includes ESLint**, 0 errors / 3 warnings |
| MKTBrowser `test:installer` | PASS | PASS |
| MKTTool `npm audit` | 1 high | **0 vulnerabilities** |

No regressions. Test count +42 (4 F4 Origin tests, 37 F5 capability tests less 1 replaced, plus F2 restructure net +2 cases).

## Finding-by-finding

| F | Status | Evidence |
| --- | --- | --- |
| F1 | **FIXED** | `release.yml` now runs one `yarn test:installer` step |
| F2 | **PARTIAL** | Electron half fixed structurally; driver half **OPEN** → Phase 02 |
| F3 | **OPEN** | Out of Phase 00 scope per instruction → Phase 02 |
| F4 | **FIXED** | Origin check added, red-then-green verified |
| F5 | **FIXED** | Behavioral capability-enforcement test, red-then-green verified |
| F6 | **ESCALATED** | Confirmed live, not just archived — see below |
| F7 | **ESCALATED — severity raised to P1** | Restore never ran; see below |
| F8 | **FIXED** | ESLint 9-flat/v10 wired into `yarn lint`, 0 errors |
| F9 | **ESCALATED** | Unchanged; +1 new file (89 lines) |
| F10 | **ESCALATED** | `ci.yml` still `branches: [master, main]` |
| F11 | **FIXED** | `getHerdHealthCheckStatus` deleted |
| F12 | **FIXED, with correction** | 5 of 13 listed symbols were **false positives** — see below |
| F13 | **FIXED** | `nanoid` 3.3.16 → 3.3.18, lockfile only |
| F14 | **FIXED** | Both mojibake dirs deleted; source ruled external |
| F15 | **ESCALATED** | Now has a concrete instance — see below |

---

## Fixed

### F1 — CI gap closed
`MKTBrowser/.github/workflows/release.yml`: five per-suite steps replaced with one `yarn test:installer`.

Verified `test:installer` is genuinely complete: `test:mkb03` nests `profile-manager test:deletion`,
`test:mkb01` nests `test:legacy`, `test:mkb02` nests `profile-manager test:managed` and
`mcp-server test:managed`. Every test script in every workspace is reachable from the aggregate.
CI was missing exactly three: `mkb03`, `settings-store test`, `workspace-quality-contract.test.cjs`.

Correction to prior report: it claimed the root aggregate "already composes the right set" — true, but
it also implied `profile-manager test:deletion` was separately uncovered. It is not; it is nested.

### F4 — `/encrypt-for-vault` Origin check (P2 → closed)
`relay/src/handle-encrypt-for-vault.ts`. Signature now `(request, body, deps)`; `deps.allowedOrigin`
bound to `state.webOrigin` at `relay/src/main.ts:297` (web app is the caller, not the relay status page).
Check ordered **before** the `vaultKeyOperator` check so the reply cannot be used by an untrusted
origin to probe whether this machine holds a key.

The doc comment that argued the check was unnecessary ("CORS khai đúng một nguồn") was replaced with
one stating why that reasoning is wrong. This mattered: the comment was the reason the gap existed.

Tests: 4 added to `handle-encrypt-for-vault.test.ts`.
**Red-then-green verified** — with `if (false && ...)` on the origin comparison, 3 go red; with both
that and the `!allowedOrigin` branch disabled, all 4 go red. Restored, all 14 green.

One test defect found and fixed during this: `request(undefined)` triggered the default parameter and
silently sent the *trusted* origin, so the missing-header test never exercised its branch. Switched to
a `null` sentinel. This was caught only because the red step was run.

### F5 — capability enforcement (P2 → closed)
New file `relay/src/relay-route-capability-enforcement.test.ts`, 37 tests.

Binds each of the 15 capability classes to a required enforcement kind (`caller-origin` /
`signed-ticket` / `local-read-only`), then for all 11 `caller-origin` capabilities invokes the **real
handler** with a hostile Origin.

Chose behavioral over the structural/source-text approach the plan offered as fallback, because a
regex over handler source has exactly the weakness F2 documents.

**Red-then-green verified, and the first version failed the red step** — worth recording:

- v1 asserted `result.ok === false` for a hostile origin. With the origin check in
  `handle-seal-operator-key.ts` disabled, **all 27 tests still passed**: the handler rejected the
  request anyway because `vaultKeyOperator` was `null`. The assertion proved nothing.
- v2 uses a **differential** assertion: same body, same deps, only the caller origin differs, so the
  outcomes must differ. Rejection reason is compared, not just the boolean. With the same sabotage,
  2 tests go red. Restored → 37 green.
- Also verified: adding an unclassified capability to `RELAY_ROUTE_CAPABILITIES` fails both at
  compile time (TS2741) and at runtime.

This is the concrete answer to the phase's "a test that never went red proves nothing" rule.

### F8 — ESLint for MKTBrowser (P3 → closed)
`eslint.config.mjs` at MKTBrowser root; `eslint .` added to the root `lint` script.
ESLint 10.8.1 + typescript-eslint 8.67.0 + eslint-plugin-react-hooks.

Started at `js.recommended` + `tseslint.recommended`, no type-aware rules (they need a program per
workspace and multiply lint time — worth adding once the base set is held clean).

First run: 31 problems. Final: **0 errors, 3 warnings**. Real defects fixed, not suppressed:

- 3 × `preserve-caught-error` — `ChromiumBootstrap.ts:249`, `compatibility-engine-pin.ts:63`,
  `compatibility-smoke-authorization.ts:57` rethrew with the message inlined but **no `cause`**,
  discarding the stack. These are Windows bootstrap/engine-activation error paths — precisely where
  losing the root cause makes a field failure undiagnosable. Added `{ cause }`.
- 2 × `no-useless-assignment` in `extensionStore.ts` — dead `= []` initializers.
- 1 × `no-empty` — silent `catch {}` in the DevTools poll loop.
- 1 × unused caught binding in the injected content script.
- 2 × **stale `eslint-disable no-constant-condition` directives** in `socks5Bridge.ts`, referencing a
  rule that no longer fires. Evidence the codebase was written expecting a linter that was never wired up.
  Same signal: `react-hooks/exhaustive-deps` disable comments already existed with no plugin installed.

3 findings inline-disabled **with written justification**, not silenced globally:
`no-explicit-any` at `index.ts:112` (`any[]` rest is load-bearing — `unknown[]` would reject every
typed IPC handler) and `preload/index.ts:71`; `no-control-regex` at `server.ts:69` (the `\x00` match
is deliberate GURL-normalization anti-bypass logic).

**3 warnings deliberately left visible** rather than suppressed — genuine findings, reported below.

Scope decision: the react-hooks *recommended* set pulls in React-Compiler-era advisories
(`set-state-in-effect`, 5 sites) that would require reworking renderer components. Enabled only
`rules-of-hooks` + `exhaustive-deps`. The rest is a deliberate refactor, not lint-introduction work.

### F11 / F12 — dead code, **with a material correction to the prior report**

The prior report listed ~13 symbols under "Genuinely unreferenced anywhere, **verified by grep**".
Re-grepping: **6 of them are used inside their own file.** Deleting them as listed would have broken
compilation.

| Symbol | Prior claim | Actual |
| --- | --- | --- |
| `HEALTH_VERDICTS` | dead | used at `health-verdict.ts:26,85` |
| `VERDICT_PRESENTATION` | dead | used at `health-verdict.ts:89` |
| `isHealthVerdict` | dead | used at `health-verdict.ts:89` |
| `redditPermalinkUrl` | dead | used at `reddit-profile-parser.ts:177` |
| `JOB_STATUS_PRESENTATION` | dead | used at `content-types.ts:53` |
| `readRelayCompatibilityReleaseFromDisk` | dead | used at `relay-compatibility-manifest-file.ts:54,69` |

These are over-exported, not dead — the exact category the prior report itself said was "not worth a
sweep". Left untouched; changing export visibility is cosmetic and carries regression risk for no
security benefit.

**Actually deleted** (each re-verified as appearing exactly once, its own definition):
`getHerdHealthCheckStatus` (F11), `hasFacebookTokenWarnings`, `isManualPostPlatform`,
`headRelayCompatibilityManifest`, `headRelayCompatibilityRevocations`,
`openRelayCompatibilityRevocations`, `readRelayCompatibilityManifestFromDisk`,
`RELAY_COMPATIBILITY_REVOCATIONS_NAME`, `relayCompatibilityRevocationsPath`.

Two stale code comments went with them: `isManualPostPlatform` claimed "Dùng ở bộ nhắc việc và ở bảng
hàng đợi" while having no callers, and `getHerdHealthCheckStatus`'s comment argued for keeping an
endpoint nobody calls. Deleting the endpoint is strictly better than guarding one with no consumer.

### F13 — `nanoid`
`npm audit fix`. Diff is `package-lock.json` only, 3 lines: 3.3.16 → 3.3.18. `package.json` untouched.
`npm audit` now reports 0 vulnerabilities. Full suite re-run after.

### F14 — mojibake directories
Both deleted. Both were completely empty (0 files) — only `Microsoft/Spelling/neutral` skeletons.

**Source identified as external to both repos**, with evidence:
- Name bytes are `248,53,232,87,127,1` and `248,66,156,30,170,1` as UTF-16LE. That is not
  mis-decoded text; it is the shape of **uninitialized memory read as wide characters**
  (truncated-pointer values).
- A whole-workspace grep for `APPDATA`/`LOCALAPPDATA` assignment returns exactly **one** hit
  (`windows-installer-ownership-fixtures.test.cjs:166`), which sets `LOCALAPPDATA` to a proper temp
  root. No script in either repo constructs an `APPDATA` value.
- `%APPDATA%\Microsoft\Spelling\neutral` is the Windows platform-spellchecker path Chromium/Electron
  touches at startup. Creation stamps 14 Aug 22:14 and 15 Aug 00:12 — dev launches, not the 13 Aug
  MKB-03 test window.

Answers prior unresolved question #4: **external launcher with a corrupt environment block**, not a
repo path-construction bug. Caveat: this cannot be proven negative for a compiled binary.

### F2 — Electron half fixed, driver half open

New module `apps/desktop/src/main/main-window-security.ts` exports `mainWindowOptions()` and
`applyNavigationHardening()`. No runtime `electron` import (types only), so the contract test imports
it in a plain Node process. `createWindow()` in `index.ts` now calls both.

`security-contract.test.ts`: the old regex assertions are **deleted, not kept alongside** (the phase
file's stated risk). Replaced with:
- assertions on the real `webPreferences` object, plus four side-door flags the original never checked
  (`nodeIntegrationInWorker`, `nodeIntegrationInSubFrames`, `allowRunningInsecureContent`,
  `experimentalFeatures`);
- a behavioral test driving `applyNavigationHardening` with a recording stub, asserting the
  window-open handler returns `{action:"deny"}` and `will-navigate` is actually cancelled;
- a guard that exactly one `BrowserWindow` is constructed and `index.ts` contains no inline
  `webPreferences:`.

**Red-then-green verified, including the specific weakness F2 named.** Injecting a second
`new BrowserWindow({ webPreferences: { nodeIntegration: true, contextIsolation: false } })` into
`index.ts` — which the old regex test would have passed, since the original string still appears —
turns the new test **red**. Setting `contextIsolation: false` and flipping the open handler to
`allow` each go red too. All restored; 10/10 green.

**Driver half OPEN.** `ChromiumBrowserDriver.ts` argv construction spans lines 323–538 *inside* the
async `launch()` method, interleaved with `detectChromiumVersion`, proxy-bridge setup, geo probing and
extension staging. Extracting a pure builder is a real refactor of a 1950-line file, not a test change.
These assertions remain source-text:
`security-contract.test.ts:126` (`--no-sandbox` triple), `:127` (`if (profile.proxy) {`), `:131`
(`stableWindowsRuntime(...)`). Carried to **Phase 02**, which is D4 and already owns proxy containment.

---

## Escalations — recommendation given, decision yours

### F7 — severity raised P3 → **P1**. Do not delete anything yet.

The prior report framed this as "1.7 GB of clutter; run the restore scripts and reclaim". That is
wrong in a way that matters.

Measured: **~1.59 GB** across 9 directories. But the substance is this:

- `local-test-artifacts/installed-relay-production-disabled-for-local-test/` holds
  `protected-secrets/operator-domain-key.dpapi` **and** `device-private-key.dpapi`.
- The **live** relay home `%LOCALAPPDATA%\MKTTool-Relay` exists, is dated 13 Aug 05:18, and its
  `relay-security-state.json` lists `protectedSecrets: ["device-private-key"]` — **no operator domain key**.
- `restore-after-local-test.ps1:24` is what moves the parked production home back into place.

**Conclusion: the restore script was never run.** The machine has been running on the local-test relay
identity since 13 Aug, and the production relay identity — including the operator domain key — is
parked in an unmanaged workspace directory outside both repos.

Consequences:
1. Deleting `local-test-artifacts/` now would **destroy the only copy of the operator domain key**.
   DPAPI-sealed means unreadable by another user, not backed up. Per the relay's own comments, the
   first machine obtains this key by hand-paste and later machines get it sealed from an existing one
   — so with no second relay, loss is unrecoverable without a re-issue ceremony.
2. This is an **incomplete operational rollback**, not cleanup debt.

Also corroborates F6: the live `relay-config.json` right now contains `mktBrowserToken` and
`mktBrowserUrl` in plaintext.

**Recommendation:** do not delete. Run `restore-after-local-test.ps1` as a deliberate, supervised
operation (it stops `MKTTool-Relay` and `MKTBrowser` processes and swaps the live relay home), confirm
the restored relay starts and holds the operator domain key, and only then decide retention for the
result archives. I did not run it — it mutates live operator state and is outside audit authority.

Answers prior unresolved question #3: the archives are **not** disposable.

#### RESOLVED — 16 Aug 2026, 08:22, with operator authorization

Identity-only backup taken first (19 files, executables excluded) to
`E:\MKTWorkspace\relay-identity-backup-20260816-0820`. Confirmed neither `MKTTool-Relay` nor
`MKTBrowser` was running, so the script's `Stop-Process` calls were no-ops. Operator ran
`restore-after-local-test.ps1` (the agent was blocked from executing it and did not work around the
block). Verified end to end:

| Check | Result |
| --- | --- |
| `protected-secrets/` | now holds `operator-domain-key.dpapi` |
| `relay-security-state.json` | `protectedSecrets: [operator-domain-key, device-private-key]` |
| `relay-config.json` | production keys only — the plaintext `mktBrowserToken` instance is gone |
| `/health` | `ok: true`, `configured: true`, `webOrigin` = production Railway |
| CORS | `access-control-allow-origin` matches production; wrong origin gets no CORS headers |
| Relay ↔ Browser | `antidetectReady: true`, contract v3 compatible, CloakBrowser 146 ready |
| Browser → Relay | Chrome observed holding an `Established` connection to 47821 |
| Server registry | web app `/setup` reports Step 1 **Xong · 1 máy đang dùng** |

**New consequence to track:** the restored production relay is **version 9**; code is at
`RELAY_VERSION = 12`. Day-to-day paths (credential, OTP, launch/create profile — floor 1–7) work.
Device retirement (floor 11) and compatibility update (floor 12) will not until the relay is updated.

**F6 weakened by this.** The handshake succeeded with `relay-config.json` holding only
`deviceId`/`serverPublicKey`/`webOrigin` — no `mktBrowserToken` was written, yet `browser.ready`
became true. So the relay locates MKT Browser by another route (likely reading the browser's own
`mcp-token` file). The plaintext token seen in the test relay's config is therefore probably a legacy
or optional override rather than the primary path. Mechanism unverified — do not close F6 on this.

Retention still undecided for `installed-relay-before-local-test-20260813-0430` (holds a second
`operator-domain-key` copy), `revoked-local-relay-20260813-051218`, and the two
`*-local-test-result-20260816-082237` archives created by the restore.

### F6 — `mktBrowserToken` plaintext: confirmed live
`relay-config.ts:110-113` routes `vaultKeyOperator` into the DPAPI store and deletes it from JSON;
`mktBrowserToken` falls through the generic loop at :115 into plaintext. Confirmed on the live config,
not only the archived one.

**Recommendation: document, do not encrypt.** MKT Browser stores the same token in a plaintext
`mcp-token` file by design (per `HttpTransport.ts:140`), so DPAPI-sealing the relay's copy raises cost
without changing the attacker's reachable set — any local process that can read one can read the other.
The real defect is the *claim*: the lifecycle doc says uninstall "preserves every identity-bearing local
datum" under protection. Fix the claim and add a comment at `relay-config.ts:115` stating the token is
deliberately unprotected and why. If you want it sealed anyway, that is a one-line addition to the
`vaultKeyOperator` branch — say so and I will do it in Phase 01.

Answers prior unresolved question #2: **missed by the migration, but defensibly so.**

### F9 — oversized files
Unchanged: 12 MKTBrowser files >400 lines, 2 MKTTool. I added one file (`main-window-security.ts`, 89
lines) which slightly *reduces* `index.ts`. **Recommendation: accept and defer**, but record it as a
decision — F9 compounds F3 (the untested modules and the oversized modules are the same list), and
Phase 02 will have to read `ChromiumBrowserDriver.ts` and `server.ts` regardless. Deferring is fine;
leaving it unstated is not.

### F10 — MKTTool CI branch filter
`ci.yml:5` still `branches: [master, main]`. Active branch `feat/mkt-browser-clean-break` gets no CI
until a PR exists. **Recommendation: change to bare `on: push`**, matching MKTBrowser's workflow.
One line. I did not change it because it alters CI cost/behavior for every future branch — your call.
Note this compounds with F1: the F1 fix only protects branches CI actually runs on.

### F15 — doc language policy, now with a live instance
AGENTS.md:25 forbids new Vietnamese content and requires translating materially-revised sections;
AGENTS.md:50 requires English user-facing messages. Every existing relay message is Vietnamese.

I followed AGENTS.md for F4 — the new Origin rejection messages and the rewritten doc comment are in
English — so `handle-encrypt-for-vault.ts` is now the **first relay handler with mixed-language user
output**. Deciding factor: these strings are only reachable on an attack path (a legitimate web app
always sends the correct Origin), so real-user impact is ~nil, and a written repo rule outranks a
consistency preference.

**Recommendation: scope the rule explicitly** — e.g. "English for MKTBrowser, all new modules, and any
materially revised section; existing Vietnamese relay/web copy is frozen legacy until deliberately
translated." As written the rule gives no signal about when it starts applying, and Phase 01+ will hit
this on every relay file it touches.

---

## Unused-export scan, diffed

Re-ran the scanner from the prior session. **None** of the F12 symbols still appear — deletions
confirmed, and the refined scanner correctly no longer reports the 6 false positives.

**10 new hits not in the 16 Aug list.** Five are types (`GrantCompletionProof`, `AntidetectProvider`,
`MktBrowserErrorCode`, `TargetPlatform`, `EncryptForVaultRequest`) — over-exposure, out of scope by the
prior report's own standard. Five are **genuinely dead code**, each verified as appearing exactly once:

- `relay/src/compatibility-installer-floor.ts` → `COMPATIBILITY_INSTALLER_FLOOR_ENV`
- `src/components/queue/post-job-fields.tsx` → `toLocalInputValue`
- `src/components/ui/form-controls.tsx` → `TextareaField`
- `src/lib/antidetect/antidetect-adapter-factory.ts` → `getAntidetectAdapter`
- `src/lib/tickets/relay-device-key.ts` → `SPKI_X25519_PREFIX`

Not deleted — outside F12's stated scope. Recommend folding into the findings register as **F16 (P3)**.
`getAntidetectAdapter` is worth a second look: a dead adapter *factory* may indicate an abandoned
code path rather than a stray helper.

## Open quality findings introduced by the new linter (P3)

Left visible rather than suppressed:

- `App.tsx:167` — `closingTimers.current` read in an effect **cleanup**. This is the genuine-bug shape
  of this rule: the ref will likely have changed by cleanup time, so timers may not be cleared.
- `App.tsx:211` — effect missing `setDrawerOpen`, `setSection`.
- `ProfileEditSheet.tsx:174` — effect missing `profile.managed`.

## Tests added

| File | Tests | Red-then-green |
| --- | --- | --- |
| `relay/src/handle-encrypt-for-vault.test.ts` | +4 | **Yes** — 3 red on disabled origin compare, 4 red with both branches off |
| `relay/src/relay-route-capability-enforcement.test.ts` | 37 (new) | **Yes** — v1 failed the red step and was rewritten; v2 red on sabotage, and red on unclassified capability at both compile and runtime |
| `apps/desktop/src/main/security-contract.test.ts` | restructured, 8 → 10 | **Yes** — red on `contextIsolation:false`, on `allow` handler, and on an injected second BrowserWindow |

## Not examined in this phase

Stated explicitly so silence is not read as clearance:

- **F3 in full.** No behavioral tests written for `HttpTransport` auth, `socks5Bridge`, `fingerprint.ts`,
  `CdpSession`, or `server.ts` tool bodies. Out of scope by instruction → Phase 02.
- **Driver half of F2**, as above.
- MKTBrowser dependency audit (`yarn npm audit`) — still not run; not in F1–F15.
- Whether the 3 `preserve-caught-error` sites had any *other* callers relying on the previous
  (cause-less) error shape. Typecheck and full suite pass; not traced further.
- The `local-test-artifacts` archives were inventoried (sizes, secret files, config keys) but **no
  archived relay was started or otherwise exercised**.
- I did not verify that `restore-after-local-test.ps1` succeeds — running it is the escalation.

## Files changed

**MKTTool** — `relay/src/handle-encrypt-for-vault.{ts,test.ts}`, `relay/src/main.ts`,
`relay/src/relay-route-capability-enforcement.test.ts` (new), `src/lib/facebook/facebook-token-warnings.ts`,
`src/lib/health/health-check-run-actions.ts`, `src/lib/platforms/platform-family.ts`,
`src/lib/relay/relay-compatibility-manifest-file.ts`, `src/lib/relay/relay-release-r2.ts`, `package-lock.json`.

**MKTBrowser** — `.github/workflows/release.yml`, `eslint.config.mjs` (new),
`apps/desktop/src/main/main-window-security.ts` (new), `apps/desktop/src/main/index.ts`,
`apps/desktop/src/main/security-contract.test.ts`, `apps/desktop/src/main/ChromiumBootstrap.ts`,
`apps/desktop/src/main/compatibility-engine-pin.ts`, `apps/desktop/src/main/compatibility-smoke-authorization.ts`,
`apps/desktop/src/main/extensions/extensionStore.ts`, `apps/desktop/src/main/socks5Bridge.ts`,
`apps/desktop/src/preload/index.ts`, `apps/desktop/resources/companion/cs.js`,
`packages/mcp-server/src/server.ts`, `scripts/capture-mkb01-visual-baselines.cjs`, `package.json`, `yarn.lock`.

Nothing committed or pushed. No sabotage edits remain (verified by grep for `if (false &&`).

## Unresolved questions

1. **F7 — do I run `restore-after-local-test.ps1`?** It stops the Relay and Browser processes and swaps
   the live relay home. Until it runs, the production relay identity (with the operator domain key)
   exists only inside `local-test-artifacts/`. This is the highest-value open item in the phase.
2. **F6** — seal `mktBrowserToken` with DPAPI, or document it as deliberately clear? My recommendation
   is document; one line either way.
3. **F10** — change `ci.yml` to bare `on: push`?
4. **F15** — how should the language rule be scoped? Phase 01 will hit this on every relay file it touches.
5. Should the 5 newly-found dead exports be filed as F16 and swept, or left?
6. Was `test:mkb03` omitted from CI deliberately (runtime cost, Windows fixtures) or by oversight?
   Carried unanswered from the 16 Aug report; the fix assumes oversight. If deliberate, the F1 fix
   lengthens CI and you may want it split.
