# Browser 0.3.30 / Relay 22 checkpoint - 30 September 2026

## Frozen source and artifacts

- MKTTool: `a2f41fe11d8703657be1554ccf6391cf8b869b92`.
- MKTBrowser: `52325793fc564ffcfffe7bfb10c8139363eb56b2` after the candidate freeze and patched
  Undici lock update.
- Candidate: `20260930-browser-0.3.30-relay-22-self-service-onboarding-cft`.
- Relay archive: 35,123,331 bytes, SHA-256
  `43a494110cf9d3004b26079c521b8579ad97fdaaa3ed71deb5932d0d0e4b494c`.
- Relay executable: 94,621,184 bytes, SHA-256
  `55cc1b51cd559e73fcead09a8dd38954ab787f1ef8035d3b31524cc6bf40d78d`.
- Relay Build A and Build B matched exactly. The final sidecar binds the same bytes to MKTTool
  commit `a2f41fe11d8703657be1554ccf6391cf8b869b92`, Node `24.21.0`, production Web origin, and
  compatibility floor `26`.
- Immutable R2 object `MKTTool-Relay-v22.zip` passed full byte read-back. The production download
  route does not expose v22 until the matching MKTTool source is deployed.

## PASS

- MKTTool quality runner: 10/10 required commands; 258 files, 2,479 tests passed, one explained
  isolated-checkout sibling comparison skipped, critical coverage and production build passed.
- MKTTool Relay runner: 5/5 required commands; 60 files / 537 tests, SEA TLS fixture, CI-origin
  build, and packaged executable verification passed.
- MKTTool security runner: secret scan and production dependency audit passed.
- Relay production-origin packaged smoke passed against the exact retained archive.
- Browser typecheck, lint, candidate/source-binding tests, full installer suite, explicit Windows
  machine integration 4/4, and critical coverage passed. Coverage was 89.76% lines, 84.50%
  branches, and 89.77% functions.
- Browser production dependency audit passed after moving transitive Undici from 6.28.0 to 6.29.0
  and 7.29.0 to 7.30.0.

## FAIL

- MKTTool PostgreSQL contracts runner failed its read-only preflight because this host provides
  PostgreSQL 17 while the contract stage explicitly requires PostgreSQL 16. No migration, schema
  reset, or contract test ran against the wrong major.

## BLOCKED

- Available physical RAM was 4.36 GiB and commit headroom was 5.40 GiB. Both are below the 6 GiB
  gate, so no heavy Browser build/package and no 4 GiB VM start were attempted. No user app was
  closed to manufacture headroom.

## OPEN

- Official Browser local-quality receipt, two isolated installer builds, normalized payload
  comparison, exact installer retention, candidate metadata/signing, and installer publication.
- Clean-VM install, first run, CFT activation, packaged Relay lifecycle, proxy recovery, repair,
  uninstall, and cleanup.
- Unfamiliar-operator, second-PC, public route/deployed SHA, and elapsed canary evidence.

## Delivery boundary

- No repository was pushed.
- MKTTool was not deployed, so Railway and the live download route remain on the prior source.
- No Browser installer was published or promoted.
- Browser remains a profile manager with proxy binding; this checkpoint makes no fingerprint,
  identity-isolation, or real-account-safety claim.
