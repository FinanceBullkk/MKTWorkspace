# Browser 0.3.21 — local gate, two-build equivalence, retained installer

Date: 2026-09-13. **Clean-VM acceptance OPEN. Not published. Not promoted to operators.**

Cut to carry the installer audit fixes (MKTBrowser#24): the Relay payload is re-verified against
its pin on the operator's machine, extraction refuses entries escaping the staging directory, and
uninstall clears the downloaded engine cache. Audit:
`plans/reports/audit-260913-0105-package-installer.md`. 0.3.20 stays under its own immutable key.

## Frozen source

| Repo | Commit | Tree |
|---|---|---|
| MKTBrowser | `9151f0e7a0ef3e2d88db5a9b95287a7b3461db93` (squash #25) | `009525d6986b95cbfd28df7def368aa6e1fd1975` |
| MKTTool | `e4aa56ce00f4a1293584162fb4de1a0346237976` (squash #81) | `ec37595a49e04a09fdfb1d8b93f8e71be7a6f844` |

Both clean at freeze. Merged PRs: MKTBrowser #24 (fix), #25 (version cut); MKTTool #81 (tuple).
Squash preserved content exactly — the merged trees equal the pre-merge branch trees.

`main` has since moved to `4a812ec` (#26, README current-state block). That commit is
**documentation only and lands after the freeze**: both build worktrees are checked out at
`9151f0e`, so it is not in the packaged payload and does not affect any hash below.

## Candidate tuple

```
id             20260913-browser-0.3.21-relay-17-payload-pin-engine-cache-cft
browserVersion 0.3.21
relayVersion   17   (unchanged, sha256 d8bf25dc…6359cf, 34289393 bytes)
engine         cft / chrome-for-testing 152.0.7977.64 (unchanged)
```

Only the Browser version, the proxy-probe user agent and the candidate id moved. Relay and engine
pins are byte-identical to 0.3.20.

## Local quality receipt

`D:\mkt-release-evidence\quality-0321-frozen-260913-0210\`, runId `2bab1bcc`, status `completed`,
failure `none`. Node 22.23.2 / Yarn 4.5.0. All seven commands exit 0: `verify:node`,
`audit:production`, `test:installer`, `test:critical-coverage`, `typecheck`, `lint`, `build`.

`test:installer`: **526 tests, 525 pass, 0 fail, 1 skipped** — 24 more than 0.3.20, which is the
new `windows-install-relay-payload` suite (8 cases × 2 PowerShell hosts), the new
`windows-engine-cache-cleanup` suite (3 × 2), the uninstall-ordering guard, and the provenance
semantics test.

**Skip adjudicated:** the opt-in `explicit machine integration gate`, requiring
`MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION=1`. Needs MKT Browser, Relay and MultiZen closed on
the machine running it. Same adjudication as 0.3.19 and 0.3.20 — **unobserved evidence, not a
pass**. This is now three consecutive releases; moving it to the VM fixture is still open.

An earlier receipt exists for the pre-merge branch commits
(`quality-0321-260913-0203`, runId `f8a1c6f9`, same 526/525/0/1). The frozen receipt above is the
binding one.

## Two-build equivalence — PASS

Clean detached worktrees at the frozen commits, independent `yarn install --immutable` each:
`D:\mkt-build-0321\b`, `D:\mkt-build-0321\c`, plus `D:\mkt-build-0321\MKTTool` @ `e4aa56c` as the
frozen sibling.

```
normalized payload manifest: 129 files
sha256 76a4a0cd857cb7f5684c45ac4c3aef192ec7b2b722b8b098ff713d4f1d8217a6
compare: identical, exit 0
```

`app.asar` byte-identical between builds: `8cf9b82959917ff5332a30f993af3a04312a320aa9f08274a30d4e7db383a99c`
(51770195 bytes). The NSIS wrapper differs, as for every prior candidate:

| build | installer sha256 |
|---|---|
| b | `9a5832f470d98069435fb3a2a5cc318e1d1f8c033b6e6ab292e8a8f0a3c791a2` |
| c | `df4ec2104d20163ad5bf2ee177e6bb546dfb098cb50b9802dbd303b603ef7a21` |

`release-candidate-contract.cjs` against build b's packaged tree: **passed**, Relay v17, packaged
engine checked. Packaged `resources/relay/MKTTool-Relay.zip` re-hashed = `d8bf25dc…6359cf` = pin.

## Retained exact installer

```
D:\mkt-release-evidence\candidate-0.3.21\
  MKTBrowser-20260913-browser-0.3.21-relay-17-payload-pin-engine-cache-cft.exe
size   146056522
sha256 9a5832f470d98069435fb3a2a5cc318e1d1f8c033b6e6ab292e8a8f0a3c791a2
```

From build `b`. Must not be rebuilt between acceptance and publication. A byte-identical copy is
staged as `publish-staging-MKTBrowser-win-x64.exe`. Compatibility artifacts and control contract
copied alongside.

Bound artifacts: control contract v4 (`c46214d9…847d59`, appVersion 0.3.21), Relay v17
(`d8bf25dc…6359cf`), engine CFT `152.0.7977.64` (`b0db25de…8004`).

## Deviation to record — Relay came from cache, not the network

`fetch-pinned-relay.cjs` **failed closed with HTTP 401** against
`https://mkttool-web-production.up.railway.app/api/relay/download/v17`.

`MKTTOOL_RELEASE_TOKEN` is present locally (64 chars, User scope, visible to the child process), so
this is not an environment-plumbing fault: the deployed `RELAY_RELEASE_DOWNLOAD_TOKEN` no longer
matches, or is not set on Railway. By design that token does not expire, so a 401 means the value
diverged.

Both builds therefore used `MKTTOOL_RELAY_ARCHIVE` pointed at the v17 archive retained from the
0.3.20 build (`D:\mkt-build-0320\{b,c}\apps\desktop\.relay-payload\MKTTool-Relay-v17.zip`). Its
size and SHA-256 were checked against the pin before use, and `fetch-pinned-relay.cjs` re-verifies
both independently and re-hashes the copied bytes, so the payload is provably the pinned v17.

**What this costs:** the build is not currently reproducible from network inputs alone. Anyone
building on a machine without that cached archive is blocked until the token is restored. This is
an infrastructure finding, not an artifact defect.

## The engine-cache script inside the installer

`windows-engine-cache-cleanup.ps1` is embedded in the NSIS executable via `File`, not staged in
`win-unpacked`, so it cannot be observed in the packaged tree. Not directly verified: 7-Zip is not
installed on this host and NSIS uses solid LZMA, so the embedded block is not searchable.

The inference, stated as inference: `makensis` aborts compilation when a `File` directive cannot
open its source, and both builds exited 0 and produced an executable. The installer also grew
+3204 bytes over 0.3.20, consistent with the added script and macro. `productIdentity.test.ts` and
`windows-firewall-installer.test.cjs` assert the reference and the invocation in `installer.nsh`.

Direct confirmation belongs to the clean-VM run, where the uninstall step either finds the script
or fails.

## OPEN — not done, not waived

- **Clean-VM acceptance of 0.3.21.** Not run. All three functional changes sit on the
  install/uninstall path and nothing here exercises them on a restored fixture. The engine-cache
  step modifies uninstall specifically — the path that PASSED the 0.3.19 clean-VM run — so steps
  2, 6, 7 and 8 need re-running at minimum.
- **Relay release token.** Returns 401. Restore or rotate before a build on a clean machine.
- **Signed compatibility manifest for 0.3.21.** Not created.
- **Publication.** Nothing uploaded. The 0.3.21 object does not exist in the bucket.
- **Operator promotion.** `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` unchanged on Railway.
- **Pinned CFT engine.** Still never exercised on any machine.
- **Browser-page network, unfamiliar-operator, second-PC, seven-day canary.** Unchanged, all OPEN.

## Unresolved questions

1. Clean-VM for 0.3.21 — full matrix, or only install/uninstall plus repair? The changed code is
   confined to the Relay payload install and the uninstall cleanup.
2. Is the Relay download token rotation deliberate? If the build machine is meant to stop fetching
   from production, the pinned-archive path should be documented as the supported route rather than
   a fallback discovered during a build.
3. The machine-integration gate has now been skipped on three consecutive releases for the same
   reason. Move it to the VM fixture?
4. README current-state pointer — owner approved adding one; not written yet, pending this
   candidate's facts.
