# Browser 0.3.18 — local gate and two-build evidence

Date: 2026-09-11. Scope: local gate only. **Acceptance OPEN.** No VM run, no publication.

## Frozen source

| Repo | Commit | Tree |
|---|---|---|
| MKTBrowser | `666e9c5f874e` (merge PR #20) | `b825ce22eef8` |
| MKTTool | `d81463df13c4` (merge PR #78) | `b1b110652bc6` |

Runner recorded identical `before`/`after` snapshots — source unchanged across all seven commands.

## Candidate tuple

```
id             20260911-browser-0.3.18-relay-17-quality-review-repairs-cft
browserVersion 0.3.18
relayVersion   17   (unchanged, sha256 d8bf25dc…6359cf, 34289393 bytes)
engine         cft / chrome-for-testing 152.0.7977.64
               sha256 b0db25de…e18004, 202713690 bytes
```

Relay deliberately stays at 17. The Relay malformed-request-target fix (MKTTool #77) is in
`relay/src/`, not in the published v17 executable this candidate pins, so 0.3.18 does **not**
ship it. Shipping it needs a Relay 18 build and publication — separate decision, not taken.

## Toolchain

```
node  22.23.2  sha256 0d0f5e39f9f3d9587bc19f73eab3c2c9c4903fd02d6dbf9c853dd81b3d95fad4
yarn  4.5.0    sha256 cc00dce5de4f68d11450519a0f69eadf2a1cbe5cc0d8e740bfac817a31d76874
```

## Local quality receipt

`D:\mkt-release-evidence\quality-260911-0936\quality-receipt.json`
runId `20f632aa-5fbb-4f11-93e8-0b238b15ff39`, 02:35:57Z → 02:39:36Z, status `completed`,
failure `none`. All seven commands exit 0:

| # | Command | Exit | Log SHA-256 (16) |
|---|---|---|---|
| 1 | `verify:node` | 0 | `e3b0c44298fc1c14` |
| 2 | `audit:production` | 0 | `45773d08e23cfcd7` |
| 3 | `test:installer` | 0 | `c924a830f635b81b` |
| 4 | `test:critical-coverage` | 0 | `d1c8bb3d2c6213e4` |
| 5 | `typecheck` | 0 | `e3b0c44298fc1c14` |
| 6 | `lint` | 0 | `3624b4e23459977e` |
| 7 | `build` | 0 | `572e0d3c835eca6e` |

`test:installer`: 491 tests, 490 pass, 0 fail, **1 skipped**.

**Skip adjudicated:** `explicit machine integration gate inspects live Windows process, listener,
and startup state` in `windows-installer-ownership-fixtures.test.cjs`. Gated on
`MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION=1`; opt-in by design, not an unexplained skip.
It remains unobserved evidence, not a pass.

Receipt fields `releaseReady:false`, `acceptance:OPEN`, `testSkips:NOT_EVALUATED` are runner
constants. The runner certifies command exits only.

## Two-build equivalence

Two clean detached worktrees at the frozen commit, independent `yarn install` each:

- `D:\mkt-build\b`
- `D:\mkt-build\c`
- `D:\mkt-build\MKTTool` @ `d81463d` — frozen sibling for the cross-repository contract

Both built with `build:win` under Node 22.

```
normalized payload manifest: 129 files
sha256 7b95134d064f0382a08e3d53cc7d6e0b54a10f949f0293345572d98830ff6478
compare: identical, exit 0
```

Per-artifact:

| Artifact | b | c | |
|---|---|---|---|
| `app.asar` | `b1d7e827420cad24…` | same | identical |
| `MKTTool-Relay.zip` | `d8bf25dcb446d779…` | same | identical |
| `windows-control-contract.json` | `91dc398249ad59eb…` | same | identical |
| `MKTBrowser-win-x64.exe` | `e3e50666fc1094a3…` | `0cf3f13826e8fb5e…` | **differs** |

Installer sizes 146049873 / 146049927. This proves normalized payload equivalence, not
byte-identical NSIS installers — same conclusion as the 0.3.17 freeze.

## Retained exact installer

`D:\mkt-release-evidence\candidate-0.3.18\MKTBrowser-20260911-browser-0.3.18-relay-17-quality-review-repairs-cft.exe`

```
size   146049873
sha256 e3e50666fc1094a3ad60d3158061eab25caae02fdfe1523729068415ae0be0fc
```

From build `b`. Must not be rebuilt between acceptance and publication.

## Build inputs requiring explanation

- `MKTTOOL_RELAY_ARCHIVE` → `D:\mkt-ip-observer-fix-20260909\candidate\MKTTool-Relay.zip`.
  The network path returned HTTP 401: `/api/relay/download/v17` needs `MKTTOOL_RELEASE_TOKEN`,
  which was not present. The local archive is hash-pinned — `fetch-pinned-relay.cjs` verifies
  size and SHA-256 of the source **and** of the staged copy against `relay-release.json` before
  use. Verified independently: 34289393 bytes, sha256 `d8bf25dc…6359cf`, exact pin match.
- `MKT_BROWSER_ENGINE_RELEASE_FILE` → in-repo `apps/desktop/windows-engine-release.json`.
  Required by design so packaging can never resolve an engine "latest".

## Side effect already in production

Merging the tuple to MKTTool `master` auto-deployed Railway (`d81463d`, SUCCESS,
`/api/healthz` 200 `ok:true`). `WINDOWS_INSTALLER_R2_KEY` derives from the candidate id, so
production now looks only for the 0.3.18 key, which does not exist in R2 yet. The accepted
0.3.17 installer is therefore no longer downloadable. This is the documented fail-closed
behaviour, accepted by the owner on 2026-09-11 rather than reverted.

## Signed compatibility manifest

`D:\mkt-release-evidence\candidate-0.3.18\manifest.signed.json`

```
sequence 22, channel pilot, 3415 bytes
sha256   f8e10e71d5a5a3b7a9dc327a2e2d93bc8bb54daad10186b321861707ab831af4
signedAt 2026-09-11T03:09:21.302Z
key      6e5d47d894206e69e6464748333eb76c99b18da1f1b42ddafb2e3f265a7b786e
```

`transition` is `fromSequences [0]`, `retainedSequence null` — fresh activation from 0 only, no
migration from an existing nonzero sequence. This follows the documented precedent for sequence 21
and is forced by the validator: `retainedSequence` must equal the client's current sequence exactly,
so one manifest cannot serve both fresh installs and machines already on 21. Anyone running 0.3.17
must reinstall rather than transition.

## Publication

Published 2026-09-11T03:23:52Z to bucket `mkttool-relay-release`, key
`MKTBrowser-20260911-browser-0.3.18-relay-17-quality-review-repairs-cft.exe`.

The publisher's own full byte read-back verified 146049873 bytes, sha256 `e3e50666…be0fc`.
Verified again afterwards by an independent read-only HEAD + full GET: same size, same digest,
and metadata carrying `browser-version 0.3.18`, `candidate-id` as above, `browser-source-sha
666e9c5f…`, `browser-source-tree b825ce22…`, `payload-manifest-sha256 7b95134d…`,
`payload-file-count 129`, `bundled-relay-version 17`.

The accepted 0.3.17 object was untouched: it remains present at its own immutable key,
146047736 bytes, sha256 `6d07fd4e…a4ca8`. The quarantined mutable key `MKTBrowser-win-x64.exe`
still holds the old 0.3.12 build and was not written.

Two failed publish attempts preceded this, both refused before any bucket write:

1. `--file` pointed at the retained installer under its candidate-key name. The publisher requires
   the on-disk filename to be exactly `MKTBrowser-win-x64.exe`; the remote key is derived from the
   candidate id separately. Fixed by staging a byte-identical copy under the required name.
2. `--release-manifest` was given the signed compatibility manifest. That flag wants a different
   document — the frozen release manifest carrying `status`, `mktBrowser`, `buildEvidence`,
   `relay.archiveSha256` and `engine` fields. Authored as
   `candidate-0.3.18/frozen-release-manifest.json` from the 0.3.17 template.

Both refusals were fail-closed guards working correctly, not defects.

## Operator promotion still gated

The application reader reports `available: true` but `metadataComplete: false`, with
`metadataMissing: ["missing-approved-release-tuple"]`. Operator availability needs the deployment
to carry `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` naming this exact tuple. That binding is the
operator-promotion gate and, per policy, follows authenticated candidate-only testing — it has not
been set. The VM run does not need it: it tests the retained exact installer directly.

## OPEN — not done, not waived

- Clean-VM acceptance on a restored Defender-enabled snapshot: first run, signed CFT activation,
  packaged Relay lifecycle, proxy failure/recovery, repair, uninstall, cleanup. Receipts must
  bind installer/Browser/Relay/engine/control-contract hashes.
- Signed candidate metadata.
- Publication to R2 and operator promotion.
- Browser-page network, unfamiliar-operator, second-PC and seven-day canary evidence.
- The opt-in machine integration gate above.

A VM on this host is not independent physical hardware.

## Unresolved questions

1. Which licence seat for CFT activation on the VM? `CLOAKBROWSER_LICENSE_KEY` is live in the
   shell environment and one free seat exists; an unplanned activation burns it.
2. Is `MKTTOOL_RELEASE_TOKEN` meant to exist on this host? Its absence forced the local-archive
   path. Hash-equivalent, but the network path is currently unexercised here.
3. Publication order: does 0.3.18 go to R2 before or after VM acceptance? Policy says
   authenticated candidate-only testing precedes operator promotion, but not whether the upload
   itself precedes the VM run.
