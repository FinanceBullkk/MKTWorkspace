# S3 — Browser installer, provenance, and truthful copy

> **Historical S3 Browser snapshot — superseded by U3/P4a.** Its 78-byte figure and pre-deploy
> statements are retained for provenance; the current controlled U3 residual is 103 bytes, P4a Web
> is deployed, P4b remains OPEN, and Lane C is CLOSED.

Date: 2026-08-30  |  Candidate: `20260830-browser-0.3.13-relay-16`  |  Status: PARTIAL / OPEN

## Scope and source state

- MKTBrowser join key: `feat/installed-contract-on-clean-runner@3f3765360eae6de83fd617bf8e19949fb70719af`.
- The source tree was intentionally dirty because unrelated user work had to be preserved. The
  candidate is therefore a draft and cannot receive committed-source provenance until a clean
  freeze is made.
- Node `v22.23.2` was used for Yarn, packaging, and Browser checks. The machine default Node 24
  path was not used for Browser build evidence.
- The old `0.3.12` output was moved to
  `MKTBrowser/apps/desktop/release/quarantine-20260830-v0312/` and remains negative evidence. It
  was not patched in place and is not used by the current contract tests.

## Commands and results

The following commands were run from `E:/MKTWorkspace/MKTBrowser` with the Node 22 executable and
Corepack JavaScript entrypoint:

| Command | Result | Qualification |
|---|---|---|
| `node corepack.js yarn install --immutable` | PASS | React peer warnings only. |
| `node corepack.js yarn verify:node` | PASS | Exact Node 22 gate. |
| `node corepack.js yarn test:installer` | PASS | All executed suites passed; one explicit Windows machine-integration test is SKIPPED and remains OPEN. |
| `node corepack.js yarn typecheck` | PASS | Host result. |
| `node corepack.js yarn lint` | PASS | Host result. |
| `node corepack.js yarn build` | PASS | Node 22/Corepack build completed after the final installer pair; the installer tuple remained unchanged. |
| `node corepack.js yarn audit:production` | PASS | No audit suggestions. |
| `node --test scripts/emit-release-provenance.test.cjs scripts/version-coherence-contract.test.cjs` | PASS | 6 tests. |
| `node corepack.js yarn workspace @mktbrowser/desktop package:windows-installer` | PASS ×4 total; final comparison uses runs 3 and 4 | A preserved copy of run 3 and final run 4 were compared after metadata/publisher hardening; one intentionally malformed workspace invocation did not build. |
| `node corepack.js yarn verify:packaged-contract --repeat 1` | PASS 1/1 | Packaged lifecycle/CFT compatibility only; not identity evidence. |
| `npm run relay:verify -- --archive=<installer-extracted Relay zip> --metadata=<Relay sidecar>` | PASS | Exact Relay v16 replay/corruption/expiry matrix; sidecar supplied externally because it is not embedded in the installer. |

The release-provenance emitter was also run as a negative check. It refused to attest the current
dirty tree (`source.clean=false`), as required. No fabricated clean SHA or provenance file was
created.

## Candidate payload tuple

Current final draft output (the exact run 4 bytes retained locally):

| Artifact | Size | SHA-256 |
|---|---:|---|
| `MKTBrowser-win-x64.exe` | 145,140,593 | `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc` |
| `resources/app.asar` | 51,723,396 | `579b634d29ff0ddfff74cafcf37a79f2cd1b3646ecb3f56642888bc56458e063` |
| embedded `MKTTool-Relay.zip` | 33,342,752 | `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` |
| embedded Relay EXE | 87,987,200 | `300646e1ea35aa47ece1b0d608d9b9681ee5bde82dd084bcdc5145345d07b60e` |

Embedded Relay metadata is v16 and matches the immutable Phase 2/R2 tuple. The extracted Relay
harness verified same-run and restart replay rejection, fresh-ticket acceptance, forced-termination
recovery, journal corruption fail-closed behavior, expiry, secret round-trip, and retirement.

The final two normalized payload manifests are byte-identical:

- `reports/s4b-payload-manifest-run3.json`
- `reports/s4b-payload-manifest-run4.json`
- normalized manifest SHA-256: `517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566`
- 130 entries; all meaningful payload/resource hashes equal.

For the final reproducibility comparison, run 3 was 145,140,515 bytes with SHA-256
`1f8d04d440800216bffe82d00e19bdbfcc4e4d47b604022cff9066ff4d141044`; run 4 is the tuple above.
The 78-byte outer NSIS variance is not silently waived as full installer reproducibility. It is an
OPEN promotion issue until a clean frozen build explains/normalizes the outer variance and the
promoted installer is independently selected. `app.asar` and the embedded Relay archive were
byte-identical across those two runs, and the full normalized directory comparison returned zero
differences.

The current `windows-compatibility-artifacts.json` (1,283 bytes; SHA-256
`ed9118cf5a96b856796d4d1003477da7355abf73ec88f870a40a017c18cf450a`) records the same
installer/app.asar/Relay tuple and the pinned Stable `.2` engine expectation. It is metadata
evidence only: the exact licensed engine archive is not present in this workspace.

## Metadata, copy, and boundary checks

- MKTTool now parses the canonical installer metadata tuple (candidate, Browser version, installer
  SHA, Relay version/SHA, Browser source commit/tree, engine kind/channel/version/SHA, and signing
  status). Missing or malformed metadata makes the setup route unavailable; disk bytes do not invent
  a version or checksum.
- The setup UI renders exact metadata when complete and otherwise disables the download with an
  explicit unpublished/incomplete message.
- The Browser FirstRun, bootstrap, profile empty state, fingerprint form, settings, MCP server,
  and MKTTool setup/docs use the controlled-beta boundary: one profile at a time, profile-local
  state/proxy controls, human login/OTP/CAPTCHA/typing, and no claim of identity uniqueness.
- Additional licence keys are preserved but inactive under the one-seat default. No concurrency
  capacity is promised without a verified vendor entitlement.
- The old 0.3.12/v15 tuple remains quarantined and is never positive evidence.

## Publication and signing status

- Browser installer publication was deliberately not run. The current stable R2 key is mutable and
  has no authenticated version/revocation pointer. The publisher now requires a candidate ID and
  complete provenance, and performs a full GET/hash read-back after any future write; this is a
  contract hardening step, not a publication result.
- No Browser compatibility manifest/revocation bundle was published. The exact Stable `.2` engine
  archive is absent from the workspace, so a truthful five-artifact bundle cannot be generated.
- Authenticode inspection of the candidate returned `NotSigned`. The owner-decided Lane A/B
  unsigned internal exception is explicit with a 60-day expiry from the S3 provenance build and
  SmartScreen/distribution controls; Lane C remains signing-gated. No real-account authorization is
  implied.
- No Railway deployment or floor change was run. The current service does not yet serve the new
  healthcheck/provenance tuple.

## Gate roll-up

| Gate | Result | Why it stays open, if applicable |
|---|---|---|
| P3-01 version coherence | PASS (host) | Candidate metadata is 0.3.13 + Relay v16. |
| P3-02 Relay pin/payload | PASS | Exact v16 archive/EXE hashes match. |
| P3-03 build/toolchain | PASS (host) | Clean frozen checkout not available; source remains dirty. |
| P3-04 embedded payload | PASS | Installer extraction and Relay binding verified. |
| P3-05 provenance/reproducibility | OPEN | Full normalized 130-entry payload, `app.asar`, and Relay equal across final runs; outer NSIS variance is 78 bytes and source is dirty. |
| P3-06 clean VM lifecycle | OPEN/SKIPPED | No disposable clean-VM run in this unit. |
| P3-07 exact restart replay | PASS (host extracted payload) | Physical power-cycle is still external. |
| P3-08 setup metadata | PASS (local tests) | Live R2 object is incomplete/old and therefore intentionally not served. |
| P3-09 boundary copy | PASS (static review) | Screenshot/live operator review remains outside this host run. |
| P3-10 unsigned handling | OPEN | Authenticode absent; exception controls are documented but operator names/clean-VM SmartScreen capture are open. |
| P3-11 publication/revocation | OPEN | No Browser publication or signed revocation pointer. |
| P3-12 stored-key migration | PASS (source/tests) | One-seat controls preserve inactive keys; live entitlement remains external. |

## Next unit

S4a/S4b closeout — the Stage A identity classification is recorded in
`reports/identity-measurement.md`; consume this refreshed tuple in the final-freeze ledger while
leaving signing, clean-VM, publication, and Railway gates explicitly OPEN.
