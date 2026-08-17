# Phase 06 — Breadth Completion (partial)

D2, D3 on redaction. 17 August 2026. **Not complete** — see §7 for what was not done. The phase's own
risk section says a skipped part must keep saying "not examined" rather than become an implied clean
bill, so the coverage statement below is written that way.

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

**None.** Every hypothesis reached in this session closed clean or produced an observation ranked
below the finding line. That is a real result for 6.2 and 6.3, and a thin one for 6.1 — see §7.

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
- **H100 — partially closed.** Own install scripts are benign: MKTTool runs `prisma generate`,
  MKTBrowser declares none. Yarn Berry runs dependency lifecycle scripts by default and
  `.yarnrc.yml` does not disable them, so third-party `postinstall` execution on build machines is
  possible in principle. The dependency tree was **not enumerated** for postinstall scripts.

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

## 7. Coverage statement — what was NOT examined

Stated plainly so this does not read as a clean bill.

| Item | Status |
| --- | --- |
| H91 DOM sinks | **Examined, definitive.** Zero hits for `dangerouslySetInnerHTML`, `.innerHTML`, `.outerHTML`, `insertAdjacentHTML`, `document.write` across MKTTool `src/**` and MKTBrowser `apps/desktop/src/**`. |
| H92 secret reaching the browser | **Partly examined.** No page or layout reads `VAULT_KEY*`, a signing seed, or `process.env` — clean at that level. The six client components that mention credential words were **not individually read**; they are input forms, but that is inference, not verification. |
| H93 server action arguments | **Not examined.** |
| H94 renderer trusting main-process data | **Partly, by implication only.** H91 found no DOM sink in the renderer, so an injection route would have to be something else. Not traced. |
| H100 dependency-tree postinstall | **Not enumerated.** |
| 6.5 docs accuracy (H104–H106) | **Not started.** |
| H107 string count | **Counted, see §8. Not fixed.** |

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
