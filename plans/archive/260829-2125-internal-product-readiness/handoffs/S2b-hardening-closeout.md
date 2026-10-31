# Handoff S2b — one-seat, Lane A smoke, and rollback
Date: 2026-08-30T03:18:00+07:00  |  Phase: 5  |  Status: PARTIAL

> **Historical S2b snapshot — superseded by the successor P4a deployment record.** The former
> “eventual owner GO” and Browser tuple language is retained as a pre-deploy checkpoint; Q13 is now
> executed, P4b is separate OPEN, and Lane C is CLOSED with no CloakBrowser channel.

## Done
- Closed the local one-seat boundary in both MKTBrowser renderer and main process. Additional keys are preserved but inactive; only an explicit code-controlled entitlement can hand them to the pool. Added source-contract tests and clarified settings/pool comments.
- Ran the Node 22 Browser installer regression and targeted lease/runtime suites. All executed tests passed; one intentionally skipped machine-integration test remains OPEN.
- Ran bounded Lane A local smoke: content safety rules and synthetic Facebook Pages flows passed; Google auth configuration/redirect check passed. The live Reddit parser portion of the health smoke failed on changed external HTML and remains OPEN.
- Ran the disposable rollback authorization/account-device test drill: 5 files / 25 tests passed. No production rollback or deployment was executed.

## Evidence written
- `reports/production-hardening-s2b.md` — one-seat, Browser regression, Lane A smoke, and rollback results.
- `reports/production-hardening-s2a.md` — restore/rate-limit/health/provenance/dependency evidence.
- local-only `reports/restore-verify-20260830-r4.json` — salted aggregate restore PASS; raw receipt
  is withheld from Git per `reports/restore-verify-receipt-redaction.md`.

## NOT done / deliberately skipped
- The exact Browser 0.3.13 package and pinned Stable `.2` engine archive are unavailable, so S3 compatibility signing/publication cannot be truthfully completed yet. Preview `.3` was not substituted.
- Live Railway proxy observation, healthcheck setting, final signed tuple, deployment, floor bump, and production smoke remain P3/P4 gates. Human/vendor/proxy/second-PC/power-cycle/canary work remains external.

## State the next session must know
- MKTBrowser branch `feat/installed-contract-on-clean-runner` has unrelated dirty edits plus the owned one-seat changes in `index.ts`, `AdditionalLicenceKeys.tsx`, `Settings.tsx`, `packages/settings-store/src/index.ts`, `license-key-pool.ts`, and the new contract test. Do not reset or stage unrelated paths.
- Use the Node 22 binary directly and invoke Corepack as `node.exe C:\Program Files\nodejs\node_modules\corepack\dist\corepack.js`; `corepack.cmd` selects Node 24 and fails the Browser version gate.
- MKTTool remains dirty on `ci/self-hosted-runners`; its full regression is 214 files / 1,939 tests PASS. The restored fail-closed spent-ticket journal is present and build/typecheck verified.

## Decisions still owed by the release owner
- None for settled engineering choices. External vendor/proxy/human/second-PC/canary inputs and the eventual Lane A owner GO remain open by design.

## Next unit
S3 — Browser installer, version coherence, payload/provenance, and truthful onboarding copy. First action: read `phase-03-browser-installer-and-copy.md`, inspect all package/version/release-pin inputs, and update them to `0.3.13` + exact Relay v16 without substituting the missing engine archive.
