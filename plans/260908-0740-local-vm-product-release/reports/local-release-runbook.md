# Local release validation runbook

## Scope and prerequisites

Windows x64 profile/proxy manager, one profile at a time, manual account input. Local and clean-VM
evidence replace the hosted-only gate by owner decision; no antidetect or account-safety claim.
This is a procedure, not evidence that its steps have passed. Current checkpoint:
[implementation status](implementation-status.md).

- Freeze committed clean MKTBrowser and MKTTool checkouts. Record full commit/tree and lockfile
  hashes; any payload-affecting change restarts downstream artifact validation.
- Use isolated directories, not the shared development checkout. MKTTool install stages refuse
  existing `node_modules`; all MKTTool stages refuse local `.env` files. Never copy production data.
- Install exact Node 22 and Node 24 runtimes. Browser requires Node 22 and Yarn `4.5.0`; each runner
  records selected executable identity. Do not rely on the shell's default Node.
- Provision separate disposable PostgreSQL 17 and 16 services. Supply database URLs only through
  the task-specific environment variables below, never command arguments or committed files.
- Create an evidence parent outside both product repositories. Every runner output directory must
  be new; preserve earlier logs/receipts instead of overwriting them.
- Run heavy work serially. Stop builds/tests before starting the 6 GB VM; remeasure available RAM,
  use one guest, never close user applications automatically.

## MKTTool stages

Run the runner located inside the selected frozen MKTTool checkout. Its flags use `--name=value`.
Replace example paths with the actual isolated paths; evidence parent must already exist.

```powershell
$node22 = 'C:\toolchains\node22\node.exe'
$node24 = 'C:\toolchains\node24\node.exe'
$mktSource = 'E:\isolated\mkttool-quality'
$evidenceParent = 'E:\MKTWorkspace\local-test-artifacts\local-release-20260908'
& $node24 "$mktSource\scripts\ci\local-release-runner.cjs" --stage=quality "--source=$mktSource" "--output=$evidenceParent\mkttool-quality-01" "--node24=$node24"
```

Quality requires `MKT_LOCAL_BUILD_DATABASE_URL` and `MKT_LOCAL_TEST_DATABASE_URL`: distinct,
loopback, empty PostgreSQL 17 databases with names ending `_test`. Preflight refuses existing
non-system schema relations before migrations or test schema resets.

| Stage | Runtime / required input | Fixed commands, in order |
|---|---|---|
| `quality` | Node 24; PostgreSQL 17 build/test URLs | `npm ci`; read-only DB preflight; `npm run db:generate`; local Prisma `migrate deploy`; `npm run lint`; `npm run typecheck`; `npm run test:local-validation`; `npm test`; `npm run test:critical-coverage`; `npm run build` |
| `contracts` | Node 22; PostgreSQL 16; `MKT_LOCAL_CONTRACTS_DATABASE_URL`; absolute `--psql` | `npm ci`; read-only DB preflight; `node scripts/ci/run-postgres-contracts.cjs` |
| `relay` | Windows Node 24; separate fresh checkout | `npm ci`; `npm run test:relay`; exact synthetic-origin Relay build; explicit archive/metadata verification |
| `security` | Node 22; no dependency install | Six-root secret scan; `npm run audit:production` |

Contracts may target the empty disposable service's `postgres` administrative database or a
dedicated `_test` database. Its role needs CREATE/DROP DATABASE for the existing isolated restore
and rate-limit contracts. Native `psql` must be available at the explicit path. No remote target,
mock DB or different major substitutes for this lane.

```powershell
$mktContracts = 'E:\isolated\mkttool-contracts'
$psql16 = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
& $node22 "$mktContracts\scripts\ci\local-release-runner.cjs" --stage=contracts "--source=$mktContracts" "--output=$evidenceParent\mkttool-contracts-01" "--node22=$node22" "--psql=$psql16"
$mktRelay = 'E:\isolated\mkttool-relay'
& $node24 "$mktRelay\scripts\ci\local-release-runner.cjs" --stage=relay "--source=$mktRelay" "--output=$evidenceParent\mkttool-relay-01" "--node24=$node24"
& $node22 "$mktSource\scripts\ci\local-release-runner.cjs" --stage=security "--source=$mktSource" "--output=$evidenceParent\mkttool-security-01" "--node22=$node22"
```

The Relay lane builds only a technical fixture:

```text
npm run relay:build -- --web-origin=https://ci.invalid --compatibility-floor=1
npm run relay:verify -- --archive=relay/dist/MKTTool-Relay.zip --metadata=relay/dist/MKTTool-Relay.metadata.json
```

Never distribute that `ci.invalid` artifact or substitute it for the pinned production Relay v16.
The verifier uses synthetic keys and an isolated Relay home; application DB tests remain separate.

The security scanner retains all roots:

```text
node scripts/ci/secret-scan.cjs --root=plans --root=docs --root=src --root=relay --root=scripts --root=.github
```

Missing roots produce OPEN/nonzero. High/critical production advisories FAIL; an unavailable audit
endpoint is BLOCKED, not PASS. Keep the existing scanner rules and coverage floors intact.

Each stage writes `receipt.json`, `receipt.sha256` and hashed, bounded, credential-redacted logs.
Only complete successful fixed command sequences can pass. Source/toolchain/log changes block
the receipt. `releaseApproved=false` always; `cleanupConfirmed=null` means descendant cleanup was
not observed. Timeout termination is best effort, blocks the stage and requires inspection.
Review test skips separately; command exit zero is not acceptance of an unobserved required test.

## Browser quality and exact builds

Use a clean Browser checkout and clean MKTTool sibling. Install locked Browser dependencies in the
isolated checkout first with Node 22 and Yarn 4.5.0 (`yarn install --immutable`); retain install logs.
The quality runner does not install dependencies and disables Corepack network fallback.

```powershell
$browserSource = 'E:\isolated\browser-build-a'
$yarnCli = 'C:\toolchains\corepack\dist\yarn.js'
& $node22 "$browserSource\scripts\local-release-quality.cjs" --output "$evidenceParent\browser-quality-a" --sibling $mktSource --yarn-cli $yarnCli
```

Browser flags use separate name/value arguments. The fixed Yarn commands are `verify:node`,
`audit:production`, `test:installer`, `test:critical-coverage`, `typecheck`, `lint`, `build`.
Receipt: `quality-receipt.json`; `acceptance=OPEN`, `releaseReady=false`,
`testSkips=NOT_EVALUATED`, including when all command exits succeed. This Windows desktop build
does not make a Linux Web execution claim or an independent-hardware claim.

Build the combined installer twice from fresh isolated copies of the same frozen inputs, serially:

```text
yarn workspace @mktbrowser/desktop package:windows-installer
node scripts/normalized-payload-manifest.cjs --directory <absolute-unpacked-directory> --output <absolute-manifest.json>
node scripts/normalized-payload-manifest.cjs --compare <first-manifest.json> <second-manifest.json>
```

Invoke Yarn through the explicit Node 22/Yarn CLI in each checkout. Installer output lives in
`apps/desktop/release/installer/`; normalized directory is its `win-unpacked` child. Preserve exact
installer, ASAR, Relay, engine, control-contract and provenance hashes. Do not expand normalization
exclusions to hide differences. Select one exact installer after comparison; never rebuild it
between VM verification and publication.

The packaged runtime verifier is a separate compatibility check, not normal installed first run:

```text
node scripts/verify-packaged-runtime-contract.cjs --repeat 1 --timings-output <absolute-output.json>
```

Set `MKT_BROWSER_EXECUTABLE` to the chosen installer's absolute
`win-unpacked/MKTBrowser.exe` path; the verifier's default points to a different directory build.
Supply its explicit measured fixture through `MKT_BROWSER_SYSTEM_CHROME` and
`MKT_BROWSER_EXPECTED_ENGINE_VERSION=152.0.7977.64` only for that verifier. Never carry those
overrides, developer cache state or unpinned-engine allowances into installed activation testing.

## Signed provisioning and immutable candidate

Candidate: `20260908-browser-0.3.13-relay-16-cft`; Browser `0.3.13`, Relay v16, official CFT
`152.0.7977.64`. CFT archive: `202713690` bytes, SHA-256
`b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`.
Changing any reviewed tuple field requires another freeze, not an arbitrary engine override.

The setup object key is `MKTBrowser-20260908-browser-0.3.13-relay-16-cft.exe`. The old fixed
installer object remains quarantined: never overwrite it, never use it as fallback. The download
filename/route can remain stable while object identity is immutable.

1. Finish source freeze, clean local checks and two-build comparison. Bind the selected exact
   artifacts, control contract and provenance in the candidate manifest.
2. Sign through the existing release-authority tools; verify delegation, expiry, revocations and
   rollback constraints. Manifest signing is not executable Authenticode signing.
3. Candidate-only authenticated distribution may precede VM tests. Run full publisher preflight
   across all local inputs and every remote key before any PUT. Use conditional creation, permit
   only byte-identical resume, full GET/hash read-back, and publish the compatibility manifest last.
4. On restored clean VM, use install -> pair -> ADMIN `repairMissingState`. Only the supported
   verified activation creates the engine pin. Never hand-edit `active-engine.json`.
5. Verify normal installed CFT version/hash, signed managed lifecycle through packaged Relay HTTP,
   failed-proxy refusal/recovery, repair/uninstall and exact cleanup; collect bounded page-network
   observations without widening production MCP permissions.
6. Operator promotion is a separate decision after required acceptance. Creating an R2 object does
   not approve it; deployment-owned `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` must bind the exact
   approved object. Never publish or expose a draft as a usable release merely because it exists.

The existing compatibility publisher accepts the full signed input set:

```text
npm run release:manifest:publish -- --manifest <signed.json> --revocations <revocations.json> --installer <exact.exe> --relay <exact.zip> --browser <exact.zip> --control-contract <contract.json> --engine <exact-engine.zip>
```

This command writes remote immutable objects; it is not a dry-run quality command. Use it only at
the reviewed candidate-distribution/publication step with valid authority and unchanged artifacts.

## Optional GitHub diagnostics and final acceptance

Technical workflow entry points are manual `workflow_dispatch`; reusable workflows retain their
call interface. Dispatch is optional diagnostics, not a replacement receipt or automatic release.
MKTTool manual Relay validation must actually run on Windows. Production verification remains
limited to `master`; otherwise it skips. Validate real deployment success for the exact full SHA
separately after integration, not merely the absence of a failed status.

Main agent owns final gate reconciliation. A PASS from either local runner is command evidence
only. Clean VM, installed activation, packaged Relay transport, page IP/DNS/WebRTC, unfamiliar
operator, second PC and seven elapsed manual canary days require their own receipts. Same-host VM
does not satisfy independent physical hardware. Stop the guest normally after exact cleanup.

## Unresolved questions

No new owner decision needed to run independent checks. Actual frozen-stage, two-build, signing,
VM and operator results must still be recorded; this runbook supplies no implied PASS.
