# Handoff S4b — final freeze and publication/deployment preflight

Date: 2026-08-30T05:15:00+07:00  |  Phase: 4  |  Status: PARTIAL / BLOCKED

> **Historical S4b Browser freeze — superseded for P4a.** P4a MKTTool Web later deployed through
> `master`; P4b's five-artifact tuple remains OPEN. Q16 closed Lane C because no CloakBrowser channel
> exists. Old route/dirty-tree/vendor statements below are pre-deploy history.

## Done

- Re-checked the current MKTTool Relay source after the 01:35 restore incident. The fail-closed
  `ensureSpentTicketJournal()` implementation is present in `relay/src/spent-ticket-journal.ts`,
  and `relay/src/relay-identity.ts` imports/calls it. Focused replay/journal tests passed 18/18;
  MKTTool typecheck and targeted ESLint passed.
- Rebuilt the MKTBrowser `0.3.13` Windows installer with Node 22 after the metadata/publisher
  hardening. The prepackage quality gate passed 34 tests with one explicit machine-integration skip.
  A preserved run 3 and final run 4 were compared from the same prepared inputs.
- Completed the subsequent Node 22/Corepack `yarn build` (exit 0) and rechecked the final installer,
  `app.asar`, embedded Relay archive, and compatibility-evidence hashes against the draft manifest;
  all four matched.
- Confirmed `app.asar`, embedded Relay v16, and the 130-entry normalized payload manifest are equal
  across the final runs; fresh full-payload manifests are equal at `517272ad...5d03566`. The outer
  NSIS installers differ by 78 bytes and remain OPEN for provenance.
- Confirmed the final installer is `NotSigned`; the Lane A/B unsigned exception is documented with
  a fixed expiry and SmartScreen procedure. Lane C remains signing-gated.
- Exercised the Browser publisher's negative draft preflight; it refused before any R2 mutation.
  Railway was inspected read-only; no `railway up`, Browser publication, pointer promotion, or
  Relay floor bump ran.
- Prepared the S5 real-environment runbook and sanitized evidence envelope.

## Evidence written

- `reports/release-run.md` — final host command/results and exact run 3/run 4 tuple.
- `reports/final-freeze-s4b.md` — freeze decision, Railway preflight, preconditions, and rollback tuple.
- `reports/release-manifest.json` — draft candidate refreshed to the run 4 installer/app.asar hashes
  and final dirty-path digests (80 MKTTool paths, 26 MKTBrowser paths); the S0 digests remain
  historical in `reports/baseline-capture.md`.
- `reports/gate-ledger.md` — S1a journal restoration check, S3/S4a/S4b statuses, and re-run history.
- `reports/browser-installer-s3.md` — refreshed final payload and 78-byte outer variance.
- `reports/unsigned-internal-exception.md` — Lane A/B exception scope, expiry, allowlist, and SOP.
- `reports/s5-handoff-runbook.md` — exact human/external gate sequence and sanitized evidence schema.
- `reports/identity-measurement.md` — Stage A `no-chance` classification and frozen Stable `.2` pin.
- `reports/relay-v16-evidence.json` — immutable Relay v16 archive/EXE and full R2 read-back.

## NOT done / deliberately skipped

- Browser installer publication, compatibility/revocation publication, and stable pointer promotion —
  no signed five-artifact tuple or exact licensed engine archive; the publisher correctly refuses draft input.
- Railway deployment and `MIN_RELAY_VERSION` floor change — old deployment does not expose `/api/healthz`
  or an authenticated v16 route; route-first and remote backup/restore preconditions are absent.
- Clean VM install/repair/uninstall, physical power-cycle, human first login, disposable proxies,
  vendor entitlement, clean second PC, and canary — external S5 resources and human actions.
- Formal fresh 3-profile × 5-run identity matrix — exact Stable `.2` archive/vendor channel unavailable;
  existing native evidence already fails the required fonts/audio/WebGL separation surfaces.
- Authenticode signing — no signing material was available; the explicit Lane A/B exception does not
  authorize Lane C or real-account use.

## State the next session must know

- MKTTool HEAD `1ade2c4a921507fac9e10c30843b67b5944197dd`, MKTBrowser HEAD
  `3f3765360eae6de83fd617bf8e19949fb70719af`; both working trees are intentionally dirty. Do not
  revert unrelated edits and do not commit/push without a new explicit request.
- Final Browser run 4 installer: 145,140,593 bytes, SHA-256
  `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc`; app.asar SHA
  `579b634d29ff0ddfff74cafcf37a79f2cd1b3646ecb3f56642888bc56458e063`; Relay v16 archive SHA
  `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`.
- Normalized payload manifest: 130 entries, SHA-256
  `517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566`; outer run 3/run 4 variance
  is 78 bytes. Do not mark P3-05 fully passed.
- Relay v16 is published/read back immutably; v15 remains immutable negative evidence. The live
  Railway deployment is `3621f603-1c51-4246-824c-55cc0e6b5764` at commit `c819e6a8...` with healthcheck unset.
- `ELECTRON_RUN_AS_NODE` must be cleared and Node 22/Corepack used for any further Browser package run.
- Temporary extraction/build directories may remain locked by Windows handles; do not delete broad paths.

## Decisions still owed by the release owner

- Name the vendor identity contact/channel and SLA; supply vendor entitlement, disposable proxy pairs,
  clean second PC, and a physical power-cycle host before S5.
- Name Lane A/B pilot operators and on-call; approve any future signed tuple/exception renewal.
- The workspace owner remains the sole rollback approver. No rollback was executed.

## Next unit

S5 — real-environment gates, **prepared but not started**. First action: obtain the frozen/signed
candidate and external resources, then reset PC-A and run the sanitized entry checklist in
`reports/s5-handoff-runbook.md`; if those resources are unavailable, keep each gate OPEN and do not
substitute host evidence.
