# S4b release-run audit trail

> **Historical pre-deploy record — superseded 30 August 2026.** This Browser ceremony intentionally
> stopped before publication. P4a later deployed independently through the master/Railway path;
> P4b remains OPEN and Lane C is CLOSED because there is no CloakBrowser channel.

Date: 2026-08-30 (ICT)  |  Candidate: `20260830-browser-0.3.13-relay-16`  |  Result: OPEN / NOT PROMOTED

This record joins the final host checks without claiming a clean checkout, clean VM, signature,
publication, or deployment. It contains no credentials, tokens, cookies, tickets, proxy endpoints,
vendor lease values, or page content.

## Source and toolchain

| Input | Observed value |
|---|---|
| MKTTool | `ci/self-hosted-runners@1ade2c4a921507fac9e10c30843b67b5944197dd`; dirty working tree |
| MKTBrowser | `feat/installed-contract-on-clean-runner@3f3765360eae6de83fd617bf8e19949fb70719af`; dirty working tree |
| Browser runtime | Node `22.23.2`, Yarn `4.5.0` through Corepack |
| Candidate | Browser `0.3.13`, Relay `v16`, ID `20260830-browser-0.3.13-relay-16` |
| Engine record | CloakBrowser Stable `.2`, `151.0.7922.108.2`; expected archive SHA `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561` |

The exact Stable `.2` archive is not available locally. The engine entry emitted into the Browser
compatibility JSON is therefore an expectation/pin record, not proof that the licensed binary was
bundled or freshly measured.

The manifest's final dirty-state digests were refreshed after S4b from the sorted tracked/untracked
path inventory: MKTTool `9284ca32...d8f8b39` (80 paths) and MKTBrowser
`856761f6...db3e4e63` (26 paths). The original S0 digests remain historical in
`reports/baseline-capture.md`. These digests inventory dirty paths; they are not clean-source
provenance, so the freeze gate remains OPEN.

## Commands and results

| Command/work unit | Result | Qualification |
|---|---|---|
| Relay journal/replay focused Vitest files | **PASS — 18/18** | Includes the current restored `spent-ticket-journal.ts` and `relay-identity.ts` startup path. |
| MKTTool `npm run typecheck` | **PASS** | Host result. |
| MKTTool `npm run build` | **PASS** | Next.js production build; route list includes `/api/healthz` and `/api/release/provenance`. |
| MKTTool targeted ESLint | **PASS** | Journal, replay, metadata, provenance, and publisher files. |
| MKTTool full `npm test -- --no-cache` | **PASS — 215 files / 1,958 tests** | Final S4b rerun; the earlier S2a snapshot was 214 files / 1,939 tests. |
| MKTBrowser `yarn test:installer` (prepackage gate) | **PASS — 34 passed, 1 skipped** | The explicit Windows machine-integration test is skipped and remains OPEN. |
| MKTBrowser `yarn typecheck` | **PASS** | Host result. |
| MKTBrowser `yarn lint` | **PASS** | Host result. |
| MKTBrowser `yarn build` | **PASS** | Node 22/Corepack build completed after the final installer pair; the installer tuple remained unchanged. |
| MKTBrowser `yarn verify:packaged-contract --repeat 1` | **PASS 1/1** | Packaged lifecycle/CFT compatibility only; reported engine `151.0.7922.174`, not identity evidence. |
| `package:windows-installer` | **PASS** | Final comparison uses preserved run 3 and completed run 4 from the same prepared inputs. |
| Browser publisher negative preflight | **PASS as refusal** | Draft/unsigned manifest rejected before any R2 mutation. |
| Railway preflight | **READ-ONLY** | Old deployment observed; `railway up` was not run. |

## Final artifact tuple

| Artifact | Size | SHA-256 | Status |
|---|---:|---|---|
| `MKTBrowser-win-x64.exe` (run 4) | 145,140,593 | `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc` | Local draft |
| `resources/app.asar` | 51,723,396 | `579b634d29ff0ddfff74cafcf37a79f2cd1b3646ecb3f56642888bc56458e063` | Equal to preserved run 3 |
| Embedded `MKTTool-Relay.zip` | 33,342,752 | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` | Equal to immutable R2 v16 |
| Embedded Relay executable | 87,987,200 | `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e` | Equal to Relay sidecar |
| Windows compatibility evidence JSON | 1,283 | `ed9118cf5a96b856796d4d1003477da7355abf73ec88f870a40a017c18cf450a` | Metadata-only pin/tuple record; not a signed bundle |
| Normalized payload manifest | 130 entries | `517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566` | Equal across runs 3/4 (`s4b-payload-manifest-run3/4.json`) |

The preserved run 3 installer was 145,140,515 bytes with SHA-256
`1f8d04d440800216bffe82d00e19bdbfcc4e4d47b604022cff9066ff4d141044`. The 78-byte outer NSIS
variance is unexplained and remains an OPEN provenance gate; it is not silently normalized away.
The Authenticode status of run 4 is `NotSigned`.

## Release-authority and deployment disposition

- `reports/release-manifest.json` remains `status: draft`; it contains the run 4 tuple and the
  Lane A/B unsigned exception expiry `2026-10-28T20:50:00.000Z`.
- The metadata reader requires a future expiry and an explicit approved tuple, rechecks both before
  serving, and hash-verifies a spooled response. The publisher refuses draft/unsigned publication.
- Relay v16 is the only published object: immutable R2 write and full GET/hash read-back passed.
  No Browser installer, compatibility manifest, revocation pointer, or stable pointer was written.
- Railway remains on deployment `3621f603-1c51-4246-824c-55cc0e6b5764`, commit
  `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`; `/api/healthz` is 404 and the healthcheck is unset.
  No floor bump and no deployment were performed.

## Open gates at handoff

Dirty-source attestation, unexplained 78-byte outer variance, exact engine archive/vendor channel,
formal 3-profile × 5-run identity evidence (`G2-IDENTITY` early result is FAIL), clean-VM lifecycle,
Authenticode or named operator/SmartScreen evidence, Browser immutable publication/revocation,
Railway backup/provenance/healthcheck alignment, real proxy/network tests, human login, physical
power-cycle, second-PC, and canary evidence all remain OPEN or BLOCKED. The S5 runbook is prepared;
no real-account or unattended Browser authorization is implied.
