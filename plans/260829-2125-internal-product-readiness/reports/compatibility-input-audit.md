# S1b compatibility input audit

> **Historical pre-P4a/P4b input audit.** This report preserves the earlier Browser 0.3.12/dirty-tree
> checks. Current Browser provenance is accepted from the successor source boundary, while the
> five-artifact tuple remains P4b OPEN; P4a Web route/deployment evidence is in the successor report.

**Captured:** 2026-08-30 (ICT)
**Scope:** read-only inspection of the five-artifact compatibility bundle inputs, release-authority
evidence, and the selected MKT Browser/Relay trees. No source, R2, Railway, or vendor state was
changed by this audit.

## Conclusion

A truthful signed **v16** compatibility bundle cannot be generated from the files currently on disk.
The delegated signing key and public ceremony chain are present and structurally identified, and
the fixed Relay v16 archive is available. The Browser-side inputs are still the quarantined **0.3.12**
candidate, while the pinned CloakBrowser record identifies a vendor archive whose bytes are not
present locally. Signing a manifest with substituted or invented bytes would make the tuple false;
the current compatibility gate therefore remains **OPEN**.

The correct next build must produce Browser `0.3.13` and a new same-build five-artifact evidence
record, obtain the exact pinned engine archive (or a newly approved pin), then sign and publish only
after every hash/size check passes.

## Required inputs and current state

`MKTTool/scripts/publish-compatibility-manifest.ts` requires these exact flags:

```text
--manifest <signed manifest JSON>
--revocations <root-signed revocation JSON>
--installer <Windows installer executable>
--relay <Relay ZIP>
--browser <packaged resources/app.asar>
--control-contract <windows-control-contract.json>
--engine <engine archive>
```

| Kind | Required bytes / path for v16 | Current observation | Gate |
|---|---|---|---|
| installer | `MKTBrowser/apps/desktop/release/installer/MKTBrowser-win-x64.exe` from the `0.3.13` build | Exists, 146,103,681 bytes, SHA-256 `ad1af433cea4070b5860a3c841d170bb1ef91ec3df33e2c11309acd0ba5d945c`; generated evidence says Browser `0.3.12` | **REJECT** as positive evidence; quarantined old candidate |
| relay | `MKTTool/relay/dist/MKTTool-Relay.zip` | 33,342,752 bytes, SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`; sidecar binds Relay v16 and EXE SHA-256 `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e` | **AVAILABLE** (local exact S1a gate passed; R2 publication is parent-unit work) |
| browser | `.../release/installer/win-unpacked/resources/app.asar` from the same `0.3.13` package | Exists, 51,706,547 bytes, SHA-256 `1097ab0ff18cd8d5b8be6ec185522c1ff70a64efa44cbcb6065a366df069388c`; belongs to `0.3.12` package | **REJECT**; must be regenerated with `0.3.13` |
| control-contract | `.../release/installer/windows-control-contract.json` from that package | `appVersion` is `0.3.12`, contract `4`, profile schema `3`; 153 bytes, SHA-256 `a6b55ac1108f4c0573e8b0676fc19686282c57b82fb2549633e28d0c4a4d9c01` | **REJECT** until regenerated for `0.3.13` (contract/profile numbers may remain 4/3) |
| engine | The exact pinned `cloakbrowser-windows-x64.zip` bytes whose signed record says version `151.0.7922.108.2`, size `537,518,332`, SHA-256 `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561` | Only `MKTBrowser/apps/desktop/windows-engine-release.json` (metadata) and an installed `.2` runtime directory are present; no matching `.2` archive was found in workspace, Downloads, local MKTTool cache, or `D:\mkt-browser-engine`. A different local Preview `.3` archive exists (538,330,876 bytes, SHA-256 `5e03b7abab14d44f2f55368a888378ddca9eefadb08c08b6c28610aec580ab3a`) but the recorded identity evidence explicitly forbids promoting it. | **BLOCKED**; publisher stages the exact pinned archive and engine activation requires `chrome.exe` inside it; metadata JSON, loose `chrome.exe`, or Preview `.3` is not a valid substitute |

The current generated packaging evidence confirms the mismatch: it records Browser `0.3.12`, Relay
v15, and the old installer/app.asar hashes. It must not be edited into a v16 claim. The Browser
repository is at join commit `3f3765360eae6de83fd617bf8e19949fb70719af` (tree
`cf28f24c5373b9a9c65c82b256accab0d9023c1a`); its package version and release pin have not yet been
advanced to `0.3.13`/Relay v16.

## R2 object preflight (read-only)

The configured release bucket was queried by `HEAD` only. Immutable Relay objects v12, v13, v14,
v15, and v16 are present; v16 metadata matches the local tuple above. No v12–v16 compatibility
manifest, revocation-list, or five-artifact compatibility objects were present at audit time. This
confirms that there is no existing v16 compatibility bundle to reuse or accidentally treat as
current.

The local compatibility contract tests remain green under Node `v22.23.2`: 5 files / 41 tests
passed (`compatibility-manifest`, artifact paths, Relay R2 keys, publisher argument contract, and
release-root trust). These are code-contract checks only; they do not substitute for the missing
Browser/engine bytes.

## Why the engine metadata is not enough

The packaging helper deliberately accepts a licensed-channel engine *identity* without a URL, but
the compatibility publisher's `--engine` input is an artifact body. The Relay updater downloads
that body, checks the signed size/SHA-256, and passes it to Windows archive extraction; activation
fails unless the archive contains `chrome.exe`. The signed metadata record (329 bytes) and the
installed runtime executable are therefore evidence of an installed pin, not the five-artifact
engine payload.

The preserved Preview `151.0.7922.108.3` ZIP is also not a recovery source for this bundle. It is
different bytes from the Stable `.2` pin, and its prior scanner evidence says “do not promote.” A
repin would create a different compatibility tuple and invalidate downstream Browser/identity
evidence; it cannot be smuggled into the `.2` manifest under the shared Chromium major version.

## Signing authority preflight

The verified public ceremony files are present under
`MKTTool/src/lib/release/release-authority-public-evidence/`:

- root key id `a6d3237649c2586e48b6e4fa744f7a089160fd80250fd29360513f5f625b146c`;
- delegated key id `6e5d47d894206e69e6464748333eb76c99b18da1f1b42ddafb2e3f265a7b786e`;
- delegation expiry `2027-08-14T00:00:00.000Z`;
- revocation list is currently the empty signed-list input (`[]`).

The Windows CurrentUser DPAPI store exists at
`%LOCALAPPDATA%\MKTTool\release-signing-authority\delegated-manifest-key.dpapi`, with schema/type
metadata and the same delegated key id. No protected seed or credential material is included in
this report. This is sufficient signer *availability* evidence, not a release approval: the signer
will only be used after the manifest's five bytes are real and independently hashed.

## Exact next commands (after S3 produces the new Browser package)

Run from `E:\MKTWorkspace\MKTTool` with Node 22 and a clean, explicitly selected artifact
directory. Do not point any flag at the quarantined `0.3.12` installer or its embedded Relay.

1. Build/package Browser `0.3.13` with `apps/desktop/relay-release.json` pinned to v16 and a
   valid `MKT_BROWSER_ENGINE_RELEASE_FILE`; retain the emitted
   `windows-compatibility-artifacts.json` as the source-of-truth hash record.
2. Resolve the exact engine archive matching the pinned size/SHA-256 (vendor channel or an approved
   replacement pin). Keep the archive immutable and record its acquisition evidence without any
   presigned URL or credential.
3. Create a new manifest (next monotonic sequence; transition from the current retained sequence)
   whose artifact URLs are the immutable `/api/relay/download/v16/artifact/{kind}` paths and whose
   sizes/hashes are read from the five files, not typed by hand.
4. Sign locally with the existing delegation and DPAPI store:

   ```powershell
   npm run release:manifest:sign -- --manifest <unsigned-v16-manifest.json> `
     --delegation src/lib/release/release-authority-public-evidence/signed-delegation.json `
     --output <signed-v16-manifest.json>
   ```

5. Before publication, run the manifest/schema/control-contract/tuple tests and the publisher's
   immutable preflight. Publish only with the existing `release:compatibility:publish` command,
   which uses `If-None-Match: *` and now performs full byte/hash read-back for every object. A
   mismatch is a stop condition; never overwrite an existing v16 object.

## OPEN blockers

- Browser `0.3.13` package, app.asar, and control contract are not built.
- Exact pinned engine archive is absent; vendor entitlement/channel is externally blocked.
- Compatibility manifest sequence, revocations object, and five artifact objects have not been
  generated or published.
- The server route/floor sequence and v13/v14/v15 fleet migration remain parent S1b/S2 work;
  this audit does not close those gates.

**Unresolved questions:** none for this audit; the remaining items are explicit build or external
dependencies, not owner-tier decisions.
