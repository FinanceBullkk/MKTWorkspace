# S2b production/security hardening closeout

> **Historical pre-P4a snapshot — superseded by the successor post-deploy report.** P4a deployment
> is now complete/qualified independently of the Browser tuple. P4b remains OPEN and Lane C is
> CLOSED because no CloakBrowser channel exists; the old “blocked” wording below is historical.

**Captured:** 2026-08-30 (ICT)
**Candidate:** `20260830-browser-0.3.13-relay-16`
**Result:** `LOCAL_CONTROLS_PASS_WITH_LIVE_AND_EXTERNAL_GATES_OPEN`

## One-seat boundary

- `MKTBrowser/apps/desktop/src/renderer/src/components/screens/AdditionalLicenceKeys.tsx` now
  defaults `additionalKeysEnabled` to `false`. Add/remove controls are disabled and guarded until
  an explicit, separately verified vendor entitlement is supplied. Stored extra keys are displayed
  only by a short tail, remain in settings, and are explicitly described as preserved/inactive;
  no unsupported “up to N profiles” claim remains.
- `apps/desktop/src/renderer/src/components/screens/Settings.tsx` passes `false` deliberately.
  Replacing the primary key still preserves stored extras, so the migration path never silently
  deletes credentials.
- `apps/desktop/src/main/index.ts` uses the same conservative capability boundary at startup:
  when the code-controlled `ADDITIONAL_LICENSE_KEYS_ENABLED` is false, only the trimmed primary
  key is handed to `LicenseKeyPool`; persisted extras cannot activate additional local sessions.
  A future entitlement-enabled branch can opt in explicitly without changing the settings format.
- `apps/desktop/src/main/one-seat-license-ui-contract.test.ts` covers the renderer and runtime
  gates. The Browser pool/journal/recorder/recovery subset passed 46/46, runtime/managed/bootstrap
  contracts passed 33/33, desktop lint and root typecheck passed under Node `v22.23.2`.

## Browser regression and lifecycle

- `node <Corepack> yarn test:installer` passed all executed suites, including workspace quality,
  packaged/runtime contracts, MKB-01/01E/02/03, packaging, and settings-store checks. The only
  skipped case was the explicitly machine-integration test that requires a live installed process;
  it remains OPEN and is not rolled into a green Browser release claim.
- The command ran through the Node 22 Corepack entrypoint (`node.exe .../corepack.js`); invoking the
  system `corepack.cmd` would select Node 24 and is not valid evidence.
- Existing Browser disposable smoke could not run because no `MKT_BROWSER_MCP_TOKEN` was supplied;
  this is recorded as an OPEN runtime/artifact gate, not simulated with a fake token.

## Lane A bounded smoke

- `npm run rules:smoke` passed against the local `mkttool_dev` database. It created only TEST-NET
  fixture rows and cleaned them up; duplicate content, ratio, thread collision, and latency checks
  passed.
- `npm run facebook:smoke` passed without a Meta network call: encrypted token storage, idempotent
  Page connection, invalid-token refusal, and manual-group reminder checks passed using synthetic
  values; fixture rows were cleaned up.
- `npm run auth:check` passed the configured Google start/redirect check. No credential value is
  included here; human first-login/session-revocation evidence remains OPEN.
- `npm run health:smoke` passed its local state-transition checks but its live Reddit HTML parser
  checks failed (`u/spez` returned an unparseable page and the nonexistent-name probe returned HTTP
  200). This is external/parser evidence, not a reason to relabel Lane A green; the parser/network
  gate remains OPEN for a separately bounded fix.

## Rollback drill

- `npx vitest run --no-cache src/lib/release/rollback-authorization.test.ts
  src/lib/release/compatibility-rollback-actions.database.test.ts
  src/lib/release/compatibility-update-actions.database.test.ts
  src/lib/accounts/account-profile-actions.database.test.ts
  src/lib/accounts/account-cluster-assignment.database.test.ts` passed 5 files / 25 tests.
- The drill exercises signed, 60-second, single-use rollback authorization, device/sequence/floor
  matching, tamper/replay rejection, revoked-device refusal, and transactional account/device
  assignment. It uses disposable test data; no production rollback was requested or executed.
- The final runbook must stop ticket issuance, revoke the candidate compatibility set, restore the
  database from the verified dump when required, and have the workspace owner approve the Railway
  revert. The owner is the sole rollback approver; the agent will not execute that action silently.

## Open gates

- Live Railway proxy-chain observation and exact CIDR/header selection, healthcheck configuration,
  deployment provenance, and a production Web/Facebook smoke await the final signed P4 tuple.
- Exact Browser 0.3.13 installer/app.asar and Stable CloakBrowser `.2` archive are still absent;
  the existing `.3` preview is non-promotable. Therefore the compatibility bundle, Browser Lane B,
  and Lane C remain blocked.
- Vendor channel/entitlement, disposable proxy pairs, human login, real power-cycle, clean second
  PC, and canary calendar are external gates for S5+.
