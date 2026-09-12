# Browser 0.3.22 — local gate, two-build equivalence, clean-VM acceptance

Date: 2026-09-13. **All targeted gates PASS. The upgrade-cache regression is fixed and proved on a
restored fixture.** Not published, not promoted.

Cut specifically to prove MKTBrowser#27 on a clean VM: the 0.3.21 run showed the defect, and only a
build carrying the guard could show the correction.

## Frozen source

| Repo | Commit | Tree |
|---|---|---|
| MKTBrowser | `3e63daa9451ba989dcb8fe724675de9f64492dbd` (squash #28) | `61c2d3012d71b653ffa931993159ec0b9e04a674` |
| MKTTool | `b11f32f8385ccdb79812d9ab22a4d5042431ceb0` (squash #82) | `4abd8d153725c9447805ae99a7fe664dd9e14813` |

Merged PRs this candidate: MKTBrowser #27 (guard fix), #28 (version cut); MKTTool #82 (tuple).

## Candidate tuple

```
id             20260913-browser-0.3.22-relay-17-upgrade-cache-guard-cft
browserVersion 0.3.22
relayVersion   17   (unchanged, sha256 d8bf25dc…6359cf)
engine         cft / chrome-for-testing 152.0.7977.64 (unchanged)
```

## Local quality receipt

`D:\mkt-release-evidence\quality-0322-frozen-260913-0440\`, status `completed`, failure `none`.
Node 22.23.2 / Yarn 4.5.0. All seven commands exit 0.

`test:installer`: **527 tests, 526 pass, 0 fail, 1 skipped**. The skip is the opt-in
`MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION` gate — unobserved evidence, not a pass, now four
consecutive releases.

## Two-build equivalence — PASS

```
normalized payload manifest: 129 files
sha256 068469a9a98b39fd306c9583310a54eb9d63eeee5e911bece7d906fb222c69f3
compare: identical, exit 0
```

`app.asar` byte-identical between builds: `7825e8605d49143c2c9cdcd2d4c5031b128956d50717f53266691f8dc167239a`.
NSIS wrapper differs as always (b `a3d42474…1cd82d`, c `bad85633…e23ba2`).

`release-candidate-contract.cjs` on build b's packaged tree: passed, Relay v17, engine pinned.

Relay again supplied from the hash-verified cached v17 archive — the release download token still
returns **HTTP 401**. Unchanged from 0.3.21 and still open.

## Retained exact installer

```
D:\mkt-release-evidence\candidate-0.3.22\
  MKTBrowser-20260913-browser-0.3.22-relay-17-upgrade-cache-guard-cft.exe
size   146056615
sha256 a3d42474c64b4325bc2d36173092e1e693b02d8d1b3bbd38fa1b77d3a91cd82d
```

Control contract v4 (`3c9bd74a…2978b9`), appVersion 0.3.22.

## Clean-VM acceptance — PASS

VM `mkt-phase5-nvme-20260908` @ `nvme-stable-clean-20260908`, restored explicitly. Never-installed
baseline confirmed. Installer re-hashed in-guest: `a3d42474…1cd82d`, 146056615 bytes — **matched**.
Nothing rebuilt for this run.

### Fresh install — PASS

One UAC, approved by scancode. Browser `v0.3.22`; **Relay v17 installed and running**; both firewall
rules; Startup shortcut; `RelayOwned=1`, `StartupManaged=1`.

Relay reaching v17-installed-and-running is again the end-to-end proof of the payload pin (F1) and
the escape-checked extractor (F2): either rejecting would have aborted the install.

### Upgrade over the install — PASS, and this is the point of the candidate

Engine cache staged at the real path and shape, then 0.3.22 installed over 0.3.22. Two UAC prompts.

| after upgrade | |
|---|---|
| **engine cache** | **survived, 6291474 bytes, `bbd05cf6…f621e5` — byte-identical** |
| `profiles.db` | `b2b71f32…f719baf` — identical |
| `settings.json` | `b8e68c02…29cd57` — identical |
| `active-engine.json` | `51f2a68f…2c8315` — identical |
| Relay | v17, running again after a brief stop mid-upgrade |
| firewall / Startup / registry | 2 rules, shortcut intact, `RelayOwned=1 StartupManaged=1`, v0.3.22 |

Under 0.3.21 this exact step destroyed the cache. Under 0.3.22 it survives untouched. The
`isUpdated` guard does what it was added to do.

The Relay process was observed stopped (`relay=0`) in one sample mid-upgrade and running again at
completion. **Diagnosed 2026-09-13: expected behaviour, and not a difference from 0.3.21.** See
"Relay transient — diagnosed, no defect" below.

### Uninstall — PASS

| | |
|---|---|
| install directory | removed |
| **engine cache** | **removed** |
| `profiles.db` / `settings.json` / `active-engine.json` | **all three identical to pre-upgrade** |
| Relay executable | removed (owned) |
| Startup shortcut | removed |
| uninstall registry key | removed |
| firewall rules | 0 |

Both halves now hold on one build: upgrade keeps the cache, uninstall removes it, operator data
survives either way.

## Relay transient — diagnosed, no defect

The 0.3.22 upgrade sampled `relay=0` once; the 0.3.21 upgrade never did. That was written up as a
difference worth tracing. It is not one, and the premise was wrong.

**Mechanism.** `relay/install-relay.ps1` (MKTTool) stops the running Relay on purpose before
copying, with the reason stated in the source: the running instance holds `MKTTool-Relay.exe`, so
the copy would fail, and the upgrade path has no graceful alternative. It force-stops, sleeps 2
seconds for Windows to release the lock, copies, then restarts at step 5. The outage is a few
seconds by construction.

**Why it cannot differ between the two candidates.** That script ships inside the Relay v17 archive,
and both candidates carry the identical archive — `d8bf25dc…6359cf`, 34289393 bytes, recorded in
both compatibility-artifact files, and both builds consumed the same file on disk via
`MKTTOOL_RELAY_ARCHIVE`. The bytes that stop and start the Relay are the same bytes in both runs.

**Why only one run saw it.** Both monitors polled every 10 seconds and emitted only on change, so
each run sampled the Relay roughly 15-20 times across a window of a few seconds. Catching it once
and missing it once is ordinary sampling luck. Nothing observed 0.3.21 keeping the Relay up; the run
simply never sampled the window, which is not the same claim.

No product change. The end state was verified correct in both runs: v17, running, `RelayOwned=1`.

**Method lesson for the next session.** A change-emitting poll cannot distinguish "did not happen"
from "was not sampled". Any transient shorter than the poll interval needs either a sub-second poll
or an event source that cannot miss (process-creation ETW, an installer log), and an unobserved
transient must not be written up as an observed difference. This report did exactly that.

## Fixture disclosure

The pinned engine still cannot be provisioned, so the engine cache was **synthetic** — real path and
shape (`chromium\{cft,cloakbrowser}\runtime\` with dummy `chrome.exe` and `locales\`), 6.3 MB.
`profiles.db`, `settings.json` and `active-engine.json` were also staged rather than produced by a
real session, unlike the 0.3.21 run where `profiles.db` was genuine first-run data.

Directory shape, location, survival and removal behaviour are real; the bytes are not a real engine.
Removal and survival of an actually provisioned engine remain unverified.

## OPEN — not done, not waived

- **Steps 3-5 of the standard matrix unrun.** The pinned engine cannot be provisioned
  (compatibility set unpublished), so first-run engine behaviour and proxy failure/recovery stay
  BLOCKED. Nothing in 0.3.21 or 0.3.22 touches that path.
- **Pinned CFT engine** still never exercised on any machine.
- **Relay release token** still 401. Both candidates were built from a cached archive.
- **Signed compatibility manifest, publication, operator promotion.** None done.
  `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` unchanged on Railway.
- **Machine-integration gate** skipped for a fourth consecutive release.
- **Browser-page network, unfamiliar-operator, second-PC, seven-day canary.** A VM on this host is
  not independent physical hardware. All remain OPEN.

## Unresolved questions

1. ~~The Relay stopping mid-upgrade on 0.3.22 but not on 0.3.21.~~ **Closed 2026-09-13** — no
   defect, no difference; see "Relay transient — diagnosed, no defect".
2. Should the engine cache survive an uninstall too, when a reinstall is likely? The guard now
   separates upgrade from uninstall; whether "uninstall" should discard a large re-downloadable
   asset is still a product decision, not a technical one.
3. The Relay download token has now blocked two builds. Restore it, or document the cached-archive
   path as the supported route?
4. Four consecutive skips of the machine-integration gate. Move it to the VM fixture, where closing
   the product costs nothing?
