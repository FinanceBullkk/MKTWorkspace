# Independent verification — Codex autonomous run, 2026-08-30 01:14–04:30

> **Historical pre-Q14 / pre-P4a snapshot.** This report records the state before the owner-authorized
> Browser commit and subsequent master/Railway deployment. Its old 401/404, dirty-tree, unknown-
> ownership, and unresolved-question statements are not current. Use
> `plans/260830-0830-consolidation-and-lane-a-release/reports/lane-a-deploy.md` and
> `reports/p4a-postdeploy-evidence.json` for current P4a truth; Q15/Q16 are answered and Lane C is
> CLOSED with no CloakBrowser channel.

**Role:** external verifier. Every claim below was checked against the filesystem, git, the
production database's own reports, or the live service — not taken from Codex's self-reported
evidence.
**Verdict:** **no fabricated evidence found.** Every independently checkable number matched.

---

## 1. What was verified, and how

| Codex claim | Verification method | Result |
|---|---|---|
| Relay v16 archive SHA `5c98cf46…1842e`, 33,342,752 B | `Get-FileHash` on the built artifact | **exact match** |
| Sidecar records v16 / Node v22.23.2 / `1ade2c4` | read sidecar directly | match |
| Node 22 was actually used (machine default is v24.14.1) | sidecar `nodeVersion` | confirmed — the landmine was respected |
| `relay-release.json` pinned to v16 | read file | version 16, same SHA |
| Packaged payload embeds the v16 archive | parsed `s3-payload-manifest-run1.json` | `resources/relay/MKTTool-Relay.zip` — **same SHA, same size** |
| Two payload runs reproducible | `diff` run1 vs run2 | **IDENTICAL**, 130 files |
| No engine substituted into the payload | grep for cloakbrowser/chrome.exe entries | **absent** — no substitution |
| Installer 0.3.13 (S3 draft), SHA `51e7a2bb…607b` | `Get-FileHash` | match, 145,140,312 B, 03:37 — later superseded |
| Installer 0.3.13 (**final candidate**), SHA `e5623b8a…76cc` | `Get-FileHash` on `release/installer/MKTBrowser-win-x64.exe` | **exact match** with manifest, 145,140,593 B, 04:57 |
| Payload reproducible within each session | compared 4 manifests | run1=run2 (`5a8385a2…`, S3); run3=run4 (`517272ad…`, S4b); all 130 files |
| S3 draft cleanly superseded | grep for `51e7a2bb` across all reports; disk listing | **zero stale references**; only the final artifact remains on disk |
| Version coherence 0.3.13 | read both package.json | root and desktop both 0.3.13 |
| Overclaim copy removed | grep TikTok / `0.3.2` / uniqueness | removed; replaced with an explicit negation |
| `deepmerge-ts` HIGH resolved | package.json overrides + lockfile | override `8.0.2`, lockfile resolves 8.0.2 |
| `/v16` route not reachable on prod | live HEAD requests | `v16` → 401, `v15` → 401, `healthz` → 404 |
| Engine archive genuinely missing | exact-size sweep of E: and D: for 537,518,332 B | **no such file** — Codex's blocker is real |
| Nothing was deployed | live `/api/healthz` | still **404** → production untouched |

**Artifact chain, unbroken and independently confirmed at every link:**
built 01:52 → published to R2 `/v16` → pinned in `relay-release.json` → embedded in packaged payload.
All four carry SHA `5c98cf46…1842e`. This is precisely what was broken in 0.3.12, whose embedded
`cfeefc7f…` failed the restart replay.

---

## 2. Audit findings — status

| Original finding | Closed by | Evidence |
|---|---|---|
| Exact restart replay FAIL | Fail-closed journal rewrite (`ensureSpentTicketJournal`, fsync + atomic rename, typed errors) | `restartDuplicateRejected: true`, 11/12 failure-matrix cases pass |
| Version drift 0.3.2 / 0.3.12 | Unified to 0.3.13 with a coherence contract test | verified in both package.json |
| Copy overclaims (TikTok, fingerprint isolation) | Rewritten as explicit negation | *"they do not prove fingerprint uniqueness or identity isolation"* |
| `deepmerge-ts` HIGH | Locked override to 8.0.2 | `npm audit` zero vulnerabilities |

All four closed with real artifacts, not checkboxes.

Additionally closed — gaps found in the plan review, not in the original audit:
restore tooling (`db:restore:verify`, 99 rows, salted checksums), unauthenticated `api/healthz`,
DB-backed rate limiting (120 requests → 100 pass + 20 throttle across two workers), trusted-proxy
config, one-seat license boundary.

---

## 3. Judgment calls Codex got right

- **Refused to deploy despite holding authorization.** The grant was conditional; preconditions were
  unmet, so it honored the conditions over the permission. Production is untouched.
- **Refused to raise the floor.** `/v16` is in R2 but the route is unreachable on the live
  deployment, so raising it would have stranded 2 real v15 devices with no download path. Route-first
  held.
- **Did not spend the vendor seat.** Recorded `G2-IDENTITY=FAIL` by applying the approved thresholds
  to existing 27 Aug data rather than faking a measurement it could not run. Noted that a running
  shell is not evidence a seat is free.
- **Did not substitute Preview `.3`** for the missing Stable `.2` archive, though the file was on disk.
- **Reported failures**: TLS restore failure (4 attempts), Reddit parser failure, skipped live test —
  all left visible and OPEN.
- **S4b marked `OPEN / NOT PROMOTED`**, with the explicit line *"This is an explicit S4b OPEN result,
  not a skipped PASS."*
- **Did not claim full installer reproducibility.** Run 3 and run 4 produce identical normalized
  payloads but the outer NSIS wrapper differs by 78 bytes, so it recorded reproducibility as OPEN
  rather than rounding it to PASS. It also superseded its own earlier S3 draft installer cleanly —
  no stale hash survives in any report.

## 4. Verifier errors (mine)

- **01:35 — restored `spent-ticket-journal.ts` over an in-flight rewrite.** A 60-second monitor poll
  sampled a delete-then-write mid-operation; I read it as an accidental deletion and `git checkout`-ed
  the HEAD version, clobbering Codex's new file and leaving a dangling import. Codex recovered on its
  own by 01:38. Monitor was re-tuned to 5-minute polling on evidence files only.
  **Lesson: verify outcomes, never in-progress states; never repair a tree another agent is writing to.**
- **03:40 — reported "no installer was built."** My glob matched only `MKTBrowser-Setup-win-x64.exe`;
  the new artifact is `MKTBrowser-win-x64.exe`. Corrected at 04:12. This also corrected a larger
  misunderstanding: the installer does not embed the engine (145 MB vs 512 MB), so the missing engine
  archive never blocked the installer build.

---

## 5. What is blocked, and by whom

| Blocker | Blocks | Who can clear it |
|---|---|---|
| CloakBrowser Stable `.2` engine archive absent | compatibility bundle, identity measurement, Lane C | **Vendor** — verified absent from both drives; cannot be reconstructed (zip is not byte-reproducible from extracted files) |
| MKTBrowser working tree dirty | clean-source attestation → signed tuple → Railway deploy → floor bump | **Workspace owner** — 3 files are pre-existing uncommitted work: `ChromiumBrowserDriver.ts`, `mcp-server/src/server.ts`, `types/src/index.ts` |
| 2 active v15 devices, 2 distinct owners | floor bump 13→16 | **Workspace owner** — are these your machines or other people's? |
| Human login, power-cycle, second PC, 7-day canary | S5/P6, P8 | **Physical reality** — no authorization unblocks these |

The dirty-tree blocker is the only one the owner can clear tonight, and it unlocks the longest chain:
clean tree → attestation → signed tuple → deploy → live `/v16` route → legal floor bump.

---

## 6. Outcome

**Lane A (MKTTool Web/Facebook):** hardening complete and tested; awaiting a clean-source attestation
and deployment. Reachable.

**Lane C (Browser real accounts):** **closed for this release.** `G2-IDENTITY=FAIL` — fonts
`08050B16`, audio `0B09CAEB`, WebGL `BF16CA5C` all collide across profiles on the licensed Stable `.2`
engine. No task in Phases 1–8 can change this; only a vendor build can. Closed honestly, on evidence.

**Deliverable produced:** a 0.3.13 installer embedding a Relay v16 that provably fixes the replay
defect, with truthful onboarding copy and a clean dependency audit — unsigned, unattested, and
correctly not promoted.

The Stage A/B split introduced during plan review did its job: `no-chance` was known before any
vendor lease, proxy pair, second PC, or power-cycle host was spent.

---

## Unresolved questions

1. Is there an open commercial channel to CloakBrowser? This single answer decides whether Lane C is
   deferred or permanently dead for this product shape.
2. Are the two active v15 devices owned by the workspace owner, or by other operators who need
   notification before the floor moves?
3. What is the disposition of the three pre-existing dirty MKTBrowser files — commit, stash, or
   discard?
