# Phase 06 — Breadth Completion

D2, D3 on redaction. 17 August 2026. Run in two passes: the first covered redaction, dependencies and
concurrency; the owner then asked for the remainder, and the second pass closed H92, H93, H94, H100
and 6.5. **Every hypothesis in this phase now has a result.** Two P3 findings, both from the second
pass. Rows in §7 marked *(2nd pass)* say how each was reached and where the limits are.

## 1. Opening reconciliation

Phase 06 opened against the Handoff Audit table, as Phase 05 did. One inbound handoff existed —
C27's second half — and it was **in the register but absent from this phase's scope and todo**. That
is the same failure the table exists to catch, caught one step earlier this time: by the receiving
phase at open, rather than by someone going looking months later. Recorded as H109 before any of the
form code was read, then fixed (§2).

## 2. H109 — fixed. Inbound handoff closed.

`reddit.com/r/<sub>/s/<id>` carries an opaque id that only an HTTP redirect resolves, so
`normalizeThreadUrl` cannot reduce it to the permalink's key and rule 8 — the only non-overridable
rule — sees a different thread.

The guard is at the two surfaces that accept a hand-typed link (`recordInteraction`,
`markJobPosted`), not in `normalizeThreadUrl`. Two reasons, both already stated by the code it sits
next to: the prober feeds that function permalinks Reddit itself returned, which need no checking
(`post-job-status-actions.ts:31`); and resolving a redirect inside a function the rules engine calls
dozens of times per evaluation would trade a silent gap for a hang. Rejection runs before any query,
so a link that cannot be compared never becomes a trace rule 8 cannot read.

Host matched exactly — `reddit.com.evil.test` and `notreddit.com` do not qualify, and a subreddit
named `s` keeps working. `redd.it` (Phase 05) still resolves.

Sabotage-proven at three points, each red in the right test, then restored green:

| Sabotage | Red test |
| --- | --- |
| predicate returns `false` | "bắt link share /s/ của Reddit ở mọi biến thể host" |
| host check dropped, path only | "không nhận nhầm tên miền giả" |
| `.refine` removed from each action | the matching rejection test, one per action |

The action-level tests need no Postgres, because rejection happens before the first query — which is
itself the property worth guarding. Commit `c607115`.

## 3. Findings

**Two, both P3, both found in the second pass** (§7b) after the remaining items were worked.

- **C31 — any operator can delete another person's nick, while deleting a proxy needs ADMIN.**
  `vault-delete-actions.ts:30` is `adminAction`; `:59` is `guardedAction`. The schema states the
  hierarchy the other way round — *"Nick là tài sản, đăng ký máy là quyền"* — so the object guarded
  less is the one the project calls the asset. Bounded, and that is why it is P3: deletion is
  refused for any nick with jobs, interactions, Facebook links or admin roles, enforced twice (in
  the action and by RESTRICT foreign keys). What remains deletable is a nick with no history — i.e.
  a freshly entered one, whose row holds the only copy of its operator-domain password, email
  password and TOTP secret. Insider or stolen session, not an outsider.
- **C32 — the roadmap's audit-status block is now wrong.** `development-roadmap.md:42-45` still says
  phases 05 and 06 "have not started, so nothing should be read as clean there". It understates the
  audit rather than overstating it, which is the safer direction, but it is a safety-case claim and
  those are the only documentation this audit scopes in. Per this phase's own instruction — *list
  inaccuracies, do not fix them here* — it is recorded, not edited. Its replacement is already
  designed at `:64`, so it belongs with the closing coverage statement.

## 4. Secret × sink (6.2, D3)

Secrets enumerated from the registry and traced outward to every sink reached.

| Secret | Sink reached | Result |
| --- | --- | --- |
| `Proxy.passwordEnc` | liveness probe → `lastCheckDetail` (DB, UI) | **Safe.** Transport is a raw socket with a `Proxy-Authorization: Basic` header (`proxy-http-transport.ts:52,131`), never a `user:pass@host` URL, so network errors carry host/port only. Host, port and username are plaintext columns by design, not secrets. |
| `Proxy.passwordEnc` | bandwidth probe → `lastSpeedDetail` | Same transport, same result. |
| `Proxy.passwordEnc` | decrypt failure | Fixed message naming `VAULT_KEY_SERVER`; no cause attached, no write to the DB — "ghi tức là khai rằng đã đo, mà thật ra chưa gửi đi byte nào". |
| `ObserverProxy.passwordEnc` | observer session | Same code path as `Proxy`. |
| `Account.passwordEnc` / `emailPasswordEnc` / `totpSecretEnc` | relay `handle-secret.ts` | **Safe.** Decrypt failure returns one fixed sentence with the original error deliberately dropped, because AES-GCM cannot distinguish wrong key from corrupt data. The TOTP branch that decrypts successfully but cannot generate a code says so **without echoing the secret** (`:184`). |
| `FacebookConnection` / `FacebookPage.accessTokenEnc` | Graph API errors | **Safe.** `redactTokens` runs inside the `FacebookGraphError` constructor (`:26`), so redaction cannot be forgotten at a call site — the file says exactly that. Token travels in a header, never a query string. |
| `RelayDevice.retirementFinalizationKeyEnc` | retirement flow | Decrypted to a seed; not reached by any message sink found. |
| All | `console.*` | **Safe.** 15 `console.*` in `src`, 10 in `relay/src`. Exactly one interpolates anything key-shaped: `main.ts:436` prints a **public** key. |
| All | DOM | No sink exists — see H91 below. |

Two independent redaction mechanisms exist and are correctly matched to their problem:
pattern-based `redactTokens` for Facebook, where the secret's *shape* is known and its value is not
at hand; value-based `redact`/`redactProxyDetails` (`mkt-browser-adapter.ts:166`) for proxies, where
the actual values are in scope and can be substituted out longest-first.

**H95, H96, H97: closed, no unredacted path found on any traced route.**

## 5. Dependencies (6.3, D2)

- **H98 — closed. `yarn npm audit --recursive` on MKTBrowser: `YN0001: No audit suggestions`.** Zero
  advisories. This had never been run before.
- **H99 — confirmed as hypothesised, ranked as an observation.** `electron` is exact-pinned
  (`42.8.1`); `@electron/rebuild ^4.2.0`, `electron-builder ^26.15.3`, `electron-vite ^5.0.0` and
  `better-sqlite3 ^12.11.1` all float. Two of those build the artifact that later gets
  Authenticode-signed, and `better-sqlite3` is a native module compiled against Electron's ABI. It
  is **not** a finding because `yarn.lock` is committed and pins resolutions, so installs are
  reproducible and the carets only move on a deliberate upgrade. Worth knowing that the pinning
  discipline applied to the runtime was not applied to the toolchain that builds the signed artifact.
- **H100 — closed in the second pass; see §7 for the enumeration and its one stated limit.** Own
  install scripts are benign. `enableScripts` is on in MKTBrowser, so any transitive dependency may
  run code at install time on a build machine. That is normal for this stack and not ranked, but it
  is the supply-chain surface Phase 04 did not cover, and yarn offers `enableScripts: false` with an
  explicit `dependenciesMeta.built` allowlist if the owner ever wants that surface closed.

## 6. Concurrency (6.4, D2)

- **H101 — read, with the conflict of interest declared.** The expiry path was rewritten by C29
  earlier the same day, so this hypothesis examines fresh work by the hand that wrote it. Stated
  rather than glossed. Staleness now measures heartbeat, not elapsed time; renewal is token-scoped
  so a run that already lost the lock cannot write into the new holder's row; boundary cases are
  covered by the four CI tests. An independent reading by someone else would be worth more than this
  paragraph, and that is the honest limit.
- **H102 — closed.** Both schedulers use the same `claimScheduledRun` under **distinct keys**
  (`DAILY_BACKUP_JOB_KEY`, `DAILY_HEALTH_CHECK_JOB_KEY`), and that claim is a conditional
  `updateMany` falling back to a primary-key `create` — proven atomic in Phase 05. Two replicas
  ticking together cannot both win, and the two schedulers cannot collide with each other.
- **H103 — closed.** `cleanStaleSingletonLocks` deletes only when the PID encoded in the symlink
  target fails a `process.kill(pid, 0)` liveness probe. The failure direction is safe: PID reuse
  makes a dead process look alive, which **keeps** a stale lock rather than killing a live browser.
  The reverse — a live browser whose PID probes dead — cannot occur. Residual, narrow: when
  `SingletonLock` is judged dead all three files are removed together, so a second instance starting
  inside that window could lose a freshly created socket.

## 7. Coverage statement

Stated plainly so this does not read as a clean bill. Rows marked **(2nd pass)** were completed after
the owner asked for the remaining items to be finished.

| Item | Status |
| --- | --- |
| H91 DOM sinks | **Examined, definitive.** Zero hits for `dangerouslySetInnerHTML`, `.innerHTML`, `.outerHTML`, `insertAdjacentHTML`, `document.write` across MKTTool `src/**` and MKTBrowser `apps/desktop/src/**`. |
| H92 secret reaching the browser | **Examined (2nd pass). Closed.** No page or layout reads `VAULT_KEY*`, a signing seed, or `process.env`. No client component receives a secret as a prop. `vault-secret-field.tsx` turned out to be the opposite of a leak: it is an input that stays `disabled` until hydration, because a `disabled` field is absent from `FormData`, so a pre-hydration Enter cannot post a plaintext secret. The component exists to close the very direction H92 asks about. |
| H93 server action arguments | **Examined (2nd pass). One finding.** 25 files carry a real `"use server"` directive — the first grep over-counted by matching the string inside comments. Every exported symbol across all 25 goes through `guardedAction` or `adminAction`; there is no unguarded export. The three actions without zod take only opaque ids used as Prisma primary keys, so there is nothing to inject. The residual is authorization, not argument shape: **C31**. |
| H94 renderer trusting main-process data | **Closed by H91, reasoning stated.** With zero DOM sinks in the renderer and React escaping by default, untrusted main-process strings have no injection route into the DOM. That closes the hypothesis as written; it does not claim the renderer was read line by line. |
| H100 dependency-tree postinstall | **Enumerated (2nd pass). Closed.** MKTTool: 7 third-party packages declare install scripts, read from `package-lock.json` `hasInstallScript` rather than by walking `node_modules` — `@prisma/engines`, `prisma`, `esbuild`, `unrs-resolver`, and `fsevents` ×3 (optional, macOS). All are build tooling that legitimately fetches or compiles a binary; none is a surprise. MKTBrowser: `enableScripts` is **true**, read from the yarn CLI rather than inferred from the file, and the native surface is `electron`, `better-sqlite3`, `node-gyp`, `prebuild-install`, `esbuild`. Limit worth stating: `yarn.lock` does not record which packages declare install scripts, so the MKTBrowser side is the known native set, not an exhaustive enumeration. |
| 6.5 docs accuracy (H104–H106) | **Examined (2nd pass), time-boxed.** H106 clean: every `src/**` path referenced by `codebase-summary.md` still exists. H104: the one candidate — `project-changelog.md:772` describing an "Authenticode-signed, secretless installer" — reads as a false claim in isolation but is inside a passage introduced by "The plan now defines one normal journey", and the roadmap separately lists Authenticode as an open human gate. Ambiguous only out of context; not ranked. H105 is real: **C32**. |
| H107 string count | **Counted and fixed (2nd pass).** See §8 and §8b. |

## 8. H107 — the count, which was the deliverable

The decision was to count first, then choose. The count splits the problem in two, and that split is
the answer:

- **The defect as scoped — one rendered view mixing languages — is about 4 strings** in
  `relay-status-page.ts`, e.g. "Cannot connect to MKT Browser. Open MKT Browser and make sure its
  MCP HTTP service is enabled." beside Vietnamese labels. Small, bounded, fixable in an hour.
- **The relay surface as a whole is roughly 60–80 candidate strings across 12+ files**
  (`handle-receive-operator-key.ts` 9, `update-state.ts` 6, `launch-profile.ts` 6,
  `handle-compatibility-update.ts` 6, `compatibility-transition-runner.ts` 6, and so on). Those are
  **not** all user-facing — the relay is a local bridge and much of that text goes to logs or to
  HTTP responses the web app consumes — so translating them wholesale is neither bounded nor clearly
  correct.

### 8b. Correction — the count measured the wrong direction, then the fix

The owner chose to fix on the strength of "~4 strings". Before touching anything, `AGENTS.md:25` was
re-read, and it settles the direction the count had assumed away: *"write all project artifacts in
English: source comments, UI copy, errors… do not add new Vietnamese content, and translate actively
maintained sections when they are materially revised."*

So the direction is **Vietnamese → English**. The 4 strings counted were the *English* ones — the
half already complying. The real work was the Vietnamese half, and it was measured properly before
starting: 8 sites in the status page, ~10 more in the configuration problems rendered into it.

It also reached one file further than the count. Three modules feed one screen, and all three had to
move together or the screen would still mix:

| File | What it contributes to the view |
| --- | --- |
| `relay-status-page.ts` | headings, status badges, public-key section |
| `relay-config.ts` | the `ConfigProblem` messages rendered into the problem list |
| `relay-operator-key-form.ts` | the form appended at the bottom, including its inline script's status text |

Out of scope and deliberately left: `handle-configure.ts` messages are HTTP responses the web app
consumes, not text on this page; and source comments, which the F15 decision already scoped out as
churn against the audit baseline.

Four test assertions were retargeted to the English text with their meaning unchanged — `INCOMPLETE`
for `CHƯA ĐỦ`, `/signed-in Windows account/` for `/tài khoản Windows/`, and so on. None was loosened,
and the suite count is unchanged at 1472 + 4 expected fail, so no assertion was lost in the move.

Commit `869cb1e`. `tsc` and `eslint` clean; a final sweep of both rendering files finds no Vietnamese
display string left. **H107 closed, and with it the last item surviving from F15.**

## 9. Environment note worth keeping

`yarn npm audit` was first run through the background task runner and produced
`yarn: command not found` — while the task wrapper reported **exit code 0**. That is exactly the
failure mode the plan's verification rules name: reading the wrapper's status instead of the
command's. Yarn 4 is only reachable here via `corepack yarn`. The real result was obtained that way.

## 10. Unresolved questions

1. **Continue Phase 06, or close it partial?** Four items in §7 are unexamined. Closing now means
   the coverage statement keeps saying "not examined" for them — legitimate, but it must be said out
   loud in the final audit statement rather than implied away.
2. **H107 — fix the ~4 status-page strings now?** The count came in small for the scoped defect.
3. **H100 — enumerate dependency postinstall scripts?** Needs a tree walk; cheap to script, and it
   is the one supply-chain question Phase 04 did not already answer.
