# Source-free Local Candidate Pilot Helpers

External helpers for the frozen MKTTool server, authenticated synthetic ADMIN session and exact
candidate activation. No product source changes. HTTPS transport is a local fixture, not evidence
for the production route. A real-session fixture is not a Google OAuth or human-walkthrough pass.

## Prerequisites

- Explicit Node 24 executable. Its path must match `nodeExecutable` in the private configuration.
- Clean frozen MKTTool checkout, matching `expectedSourceCommit`, locked dependencies and completed
  `.next` build. Use the exact `D:\mkt-local-release-20260908\a\MKTTool` checkout that ran quality r2.
  No `.env`/`.env.*` in the source root except `.env.example`.
- Final quality r2 `receipt.json` PASS, exact owner-verified SHA-256, all ten required commands and
  log hashes intact. Create the prospective runtime binding after quality and before auth/server.
  It recursively hashes every file and directory in `.next` and `node_modules`, twice, without
  exclusions. Next-generated junctions under `.next/node_modules` may target only package
  directories under the same source `node_modules`; link text and resolved target are recorded,
  target contents independently hashed. Links inside `node_modules`, external redirects, cycles,
  concurrent changes and stale build timestamps fail closed.
- New migrated PostgreSQL database ending `_test`, host `127.0.0.1`, explicit port other than 5432.
  Every public application table must be empty. No migration runs inside these helpers.
- Private configuration, output directory and server PEM key: ACL grants only current Windows user,
  SYSTEM and Administrators. On non-Windows, private paths require no group/other permissions.
- Parent provides TLS certificate directly signed by the provided test CA, valid for
  `mkttool-web-production.up.railway.app`, and the exact signed artifacts/revocations.
- Parent owns guest-only hosts mapping, guest CA trust, Relay `NODE_EXTRA_CA_CERTS`, actual VM
  install/pair/bootstrap/repair, secret transfer, server shutdown and cleanup verification.

## Private Configuration

Use the [config template](../../../local-test-artifacts/local-release-20260908/pilot-helpers/pilot-config.template.json)
as the field contract; replace placeholders in a separately ACL-restricted JSON file outside both
frozen repositories. Never put real values in plan reports or the helper source directory.

Required review-fix fields: `qualityReceiptFile`, `expectedQualityReceiptSha256`,
`runtimeBindingFile` (new file in `privateDirectory`), `acknowledgeFixtureSessionCleanup=true`.
The quality receipt is `mkttool-quality-r2/receipt.json` under the evidence root; verified SHA-256:
`c40685f35c1a340cc88b026f395fb4432c2418bb36db7f9b07a421920015cdda`.
Freeze private configuration before auth. Its exact file bytes are SHA-256-bound to the fixture;
even a whitespace edit invalidates the marker. Never dump the private config to diagnose this.

The server environment is an allowlist, not an inherited operational environment. R2, installer
approval, operator-vault key, scheduler, cloud and vendor credentials are not passed through.

`observerProxy` can be `null` to create no observer. To create the dedicated no-login observer, set
`authorizedDedicatedNoLogin=true` only for the already-authorized disposable proxy source. Supported
source formats: `webshare-lines` (`host:port:username:password`, exact one-based physical line) or
`json` (`host`, numeric `port`, `username`, `password`, `protocol:"http"`). The source file must also
pass private ACL checks. Set the observed two-letter uppercase `country`; it is not auto-detected.
Only label `compatibility-pilot` is created. Proxy credentials are never printed or used to log in.

`https.bindHost` must be loopback or an exact RFC1918 address on a local interface; never a wildcard
listener. `allowedClientAddresses` is an exact IPv4 allowlist. For VirtualBox NAT, confirm the
actual peer address before choosing the allowlist. Port is fixed 443; upstream fixed 127.0.0.1:38117.

## Exact Artifact Layout

```text
relayReleaseDirectory/
  MKTTool-Relay.zip
  MKTTool-Relay.metadata.json
artifactDirectory/
  MKTTool-Compatibility-v16-installer.artifact       <- exact installer EXE
  MKTTool-Compatibility-v16-relay.artifact           <- exact pinned Relay ZIP
  MKTTool-Compatibility-v16-browser.artifact         <- exact selected app.asar, not ZIP
  MKTTool-Compatibility-v16-control-contract.artifact
  MKTTool-Compatibility-v16-engine.artifact          <- exact CFT ZIP
```

Relay metadata requires measured `version`, `sizeBytes`, `sha256`. Do not invent provenance fields.
Manifest file must already exist and use the exact production-bound HTTPS URLs. No helper signs,
publishes, approves an installer or edits an engine pin.

## Commands

Helper entry points: [auth session](../../../local-test-artifacts/local-release-20260908/pilot-helpers/pilot-auth-session.cjs),
[runtime binding](../../../local-test-artifacts/local-release-20260908/pilot-helpers/pilot-runtime-binding.cjs),
[Next server](../../../local-test-artifacts/local-release-20260908/pilot-helpers/pilot-next-server.cjs),
[HTTPS proxy](../../../local-test-artifacts/local-release-20260908/pilot-helpers/pilot-https-proxy.cjs).

After quality PASS, bind the untouched generated runtime. Then run the one-shot auth fixture before
starting Next, to keep its empty-database preflight honest:

```powershell
$pilotNode = 'C:\Program Files\nodejs\node.exe'
$pilotHelpers = 'E:\MKTWorkspace\local-test-artifacts\local-release-20260908\pilot-helpers'
$pilotConfig = 'D:\mkt-local-release-20260908\pilot-private\pilot-config.json'
# Create once for a new binding path only; already completed for the current run.
# & $pilotNode "$pilotHelpers\pilot-runtime-binding.cjs" --config $pilotConfig
# One-shot auth is already PASS on r2 for this run; do not replay against its populated DB.
# & $pilotNode "$pilotHelpers\pilot-auth-session.cjs" --config $pilotConfig
& $pilotNode "$pilotHelpers\pilot-next-server.cjs" --config $pilotConfig
& $pilotNode "$pilotHelpers\pilot-https-proxy.cjs" --config $pilotConfig
```

The final two commands are foreground lifetime owners: start them in separate hidden helpers or
terminals and keep their PIDs. The Next launcher reports `readiness=OPEN`; process launch is not a
healthy-server result. Neither helper redirects requests to the real production service.

Current binding, measured by main owner: PASS, 42,782 entries. Snapshot SHA-256:
`2a69054811ba6b531a1e8684de0abe128acd9bef513070db26e90e80ad8b9710`.
Binding-file SHA-256: `d076dec85d2ab2fc457e8aaab8727bdba853b249a37c9b8c36742882ff8117e3`.
The initial two complete scans took approximately four minutes on this disk. Windows entry
resolution now uses native `realpath` with unchanged redirect checks; normalized-content continuity
must be checked against this existing manifest, not by generating a replacement. No speedup is
claimed until measured. Auth verifies once before spawning and once inside its worker; the worker
has a bounded 300-second deadline including its scan and real auth work. The initial launcher scan
precedes that deadline. A timeout remains FAIL with cleanup unverified, never a successful retry.

The auth helper imports the frozen `getAuth`, uses `internalAdapter.createUser/createSession`, signs
the real cookie through `better-call`, and validates it through real `getSession` and `checkActor`.
Its private output contains `cookies` suitable for `browserContext.addCookies`, plus explicit false
OAuth/human claims. Transfer it privately into the guest browser. The real server session uses the
unchanged product default (seven days, refreshable), not a one-hour server TTL. Private output reads
`serverSessionExpiresAtObserved` from PostgreSQL after both auth validations. The initial imported
cookie separately expires after one hour (`initialClientCookieExpiresAt`); later product responses
may refresh cookies or session expiry. Cookie expiry does not revoke the database session.
Do not call the worker file directly; the launcher suppresses raw library/Prisma diagnostics.

Current main-owner execution: PostgreSQL 17.10 pilot setup PASS on port 55418; auth r2 PASS for real
user/session validation, ADMIN authorization and dedicated observer creation. Safe summary:
`pilot-auth-r2.log` in the evidence root. OAuth and human gates remain false; cleanup OPEN. The
first auth attempt failed before writes because `inet_server_addr()::text` rendered `127.0.0.1/32`;
both external DB identity guards now use `host(inet_server_addr())`, verified by a direct parent
read. Next startup remains pending; the live loopback HTTPS listener alone is not route readiness.

An exclusive `pilot-fixture-attempt.json` records partial creation. A failed or repeated attempt does
not delete rows, replace an existing session file, or pretend to clean up. Inspect the attempt and
dispose only the owned test DB/private runtime when appropriate; no automatic retry against a
populated database. Completion and timeout output report no secrets.

Before spawning Next, the launcher verifies the full runtime binding and the private successful
fixture marker. It checks the exact configuration digest, database name/port/OID/server start time,
synthetic ADMIN ID/email/role, session ID/user/token hash and unexpired DB session. Only the exact
owned User/Session and optional ObserverProxy rows may exist; all other application tables must
still be empty. This is a first-start guard, not permission to reuse arbitrary populated `_test`
databases. Changes after application actions require deliberate owner triage, never rebind/retry
automatically. The snapshot records prospective continuity, not retroactive generated-tree coverage
inside the quality receipt.

Mandatory parent cleanup after pilot: stop only owned server/guest processes; revoke the exact
fixture-owned `Session` ID for its recorded `userId` on the marker-bound database (or dispose the
entire verified exclusively owned pilot database); verify it no longer authenticates; remove the
private cookie handoff and guest cookies. Retain a nonsecret cleanup receipt. Session cleanup stays
`OPEN` until observed; the acknowledgement, cookie expiry and server stop do not count as cleanup.

## Verification And Remaining Hooks

Helper-author verification: syntax and filesystem-only regression tests; no server, DB or signing
command executed. Main owner separately ran the actual binding and auth r2 above. Parent must run HTTPS trust,
authenticated app actions, exact Relay activation,
negative-proxy behavior and owned-process cleanup before closing the implementation plan gates.

HTTPS proxy logs only numeric response status and fixed lifecycle/error events, never request URLs,
headers or cookies. Next stdout/stderr is consumed but not forwarded or persisted, because raw
application diagnostics can contain submitted values. Auth outputs only allowlisted summary fields.
For failure triage use the safe auth `stage`/`failureCode` and HTTP response; never dump private files.

## Unresolved Questions

None. Runtime verification, guest TLS/hosts configuration and release acceptance remain with parent.

Related: [implementation checkpoint](implementation-status.md), [local release runbook](local-release-runbook.md).
