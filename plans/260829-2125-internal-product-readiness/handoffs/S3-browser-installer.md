# Handoff S3 — Browser installer, provenance, and truthful copy

Date: 2026-08-30T03:50:00+07:00  |  Phase: 3  |  Status: PARTIAL

> **Historical S3 Browser snapshot — superseded by U3/P4a reconciliation.** The controlled U3 pair
> currently has a 103-byte outer-installer residual (not the earlier 78-byte snapshot); P4a Web is
> deployed independently, P4b remains OPEN, and Lane C is CLOSED.

## Done

- Locked candidate `0.3.13` on MKTBrowser join key `3f3765360eae6de83fd617bf8e19949fb70719af` and
  Relay v16 (`5c98cf...1842e` archive; `300646...b60e` EXE).
- Installed dependencies and ran Node 22 version, installer regression, typecheck, lint, and
  production audit. All executed suites passed; the explicit Windows machine-integration skip is
  recorded as OPEN.
- Built the Windows installer repeatedly with the final comparison taken from preserved run 2 and
  run 3 after metadata/publisher hardening. The normalized 130-entry payload manifests are
  identical; app.asar and embedded Relay bytes are identical. The outer NSIS installer differs by
  74 bytes, so full reproducibility/promotion remained OPEN at the S3 checkpoint; this observation
  was superseded by the complete S4b run 3/run 4 comparison (78-byte outer variance).
- Extracted the candidate and ran the exact Relay harness with the external build sidecar. Replay,
  crash, corruption, expiry, and retirement checks passed. Packaged runtime contract passed 1/1 and
  is labeled CFT compatibility evidence only.
- Added fail-closed MKTTool installer metadata parsing/API/UI and hardened the future publisher to
  require a candidate ID, explicit signing exception metadata, and full GET/hash read-back.
- Rewrote Browser and MKTTool onboarding/docs copy to state the one-profile/human-input,
  profile-local, identity-unproven controlled-beta boundary. Preserved old 0.3.12/v15 as quarantine
  negative evidence. Additional keys remain inactive by default.

## Evidence written

- `reports/browser-installer-s3.md` — commands, hashes, payload comparison, copy, and open gates.
- `reports/s3-payload-manifest-run1.json` and `reports/s3-payload-manifest-run2.json` — equal
  normalized payload manifests from the earlier snapshot; superseded for final freeze by
  `reports/s4b-payload-manifest-run3.json` and `reports/s4b-payload-manifest-run4.json`.
- `reports/s4b-payload-manifest-run3.json` and `reports/s4b-payload-manifest-run4.json` — complete
  final 130-entry payload manifests; SHA-256 `517272ad...5d03566`.
- `reports/release-manifest.json` — draft candidate installer tuple and build qualifications.
- `MKTBrowser/apps/desktop/release/quarantine-20260830-v0312/` — retained old negative output.

## NOT done / deliberately skipped

- No clean frozen-source attestation: MKTBrowser working tree is dirty and the provenance emitter
  correctly refuses `source.clean=false`.
- No clean disposable-VM lifecycle or live machine-integration run; skipped remains OPEN.
- No Browser R2 publication, compatibility/revocation bundle, Railway deployment, or floor change.
  The fixed installer key remains a mutable-pointer contract awaiting Phase 4 design/approval.
- No exact Stable `.2` engine archive is present, so no truthful five-artifact compatibility bundle
  or fresh 3-profile × 5-run identity matrix can be claimed.
- Authenticode is `NotSigned`; the 60-day Lane A/B exception is explicit, while Lane C remains
  signing-gated.

## State the next session must know

- Preserve unrelated dirty work in both repositories; do not stage or commit it.
- The current packaged output is the run 3 tuple in `reports/browser-installer-s3.md` and
  `reports/release-run.md`: installer SHA `1f8d04d440800216bffe82d00e19bdbfcc4e4d47b604022cff9066ff4d141044`,
  app.asar SHA `579b634d29ff0ddfff74cafcf37a79f2cd1b3646ecb3f56642888bc56458e063`. Any source,
  engine, config, or host change invalidates it and requires a rebuild.
- The user-restored `MKTTool/relay/src/spent-ticket-journal.ts` has the fail-closed rewrite again;
  `ensureSpentTicketJournal()` is present and imported by `relay-identity.ts`.
- Do not consume the live CloakBrowser seat. Stage A can classify the already-measured Stable `.2`
  collision evidence without launching the engine.

## Decisions still owed by the release owner

- External vendor channel/identity owner and SLA.
- P6 disposable proxy pairs, vendor entitlement, human operator, power-cycle host, and clean
  second PC.
- Operator names for the unsigned exception and Lane A/B canary; rollback remains owner-only.

## Next unit

S4b — final freeze and publication/deployment preflight. First action: read
`handoffs/S4a-identity-early-probe.md` and `reports/release-run.md`, then keep the draft tuple
OPEN until signing, clean-VM, immutable Browser publication, and Railway preconditions are evidenced.
