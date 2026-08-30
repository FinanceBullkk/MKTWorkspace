# Handoff S0 — Baseline, manifest, gate ledger, owners

Date: 2026-08-30T01:24:00+07:00  |  Phase: 1  |  Status: PARTIAL

> **Historical start snapshot — superseded by the 30 August consolidation.** P4a is now deployed and
> verified; Q14 is committed, Q15 is self-serve owner-machine work, and Q16 records no CloakBrowser
> channel with Lane C CLOSED. The pending/owner-only language below describes the state at S0 only.

## Done

- Read `AGENTS.md`, both repository READMEs, `plan.md`, the applied plan review, `phase-01-baseline-and-scope.md`, and `decisions.md`.
- Captured root/MKTTool/MKTBrowser branches, HEAD/tree SHAs, remotes, dirty paths, and sanitized dirty-diff digests. No unrelated changes were touched.
- Reconciled the selected MKTBrowser join key to `3f3765360eae6de83fd617bf8e19949fb70719af` (HEAD; only post-audit change is docs-only).
- Verified `57e14fa` is an ancestor of MKTTool `1ade2c4`; recorded the current floor `13`, Relay protocol `15`, target immutable Relay `16`, and Browser target `0.3.13`.
- Reconciled the acceptance-matrix `G3-RECOVERY` contradiction: historical/subset PASS does not close the exact published v15 installer whose restart replay failed.
- Ran read-only `railway status --json`; recorded active rollback commit `c819e6a8`, deployment ID, one replica, and missing healthcheck path. No deployment command ran.
- Created a sanitized external-track request/booking register. It is ready but cannot be sent/booked without a named external channel/owner.
- Ran a forbidden-secret pattern scan over all four new report files: `filesScanned=4`, `forbiddenPatternHits=0`.

## Evidence written

- `reports/baseline-capture.md` — immutable baseline, dirty-tree notes, audit reconciliation — SHA-256 `cbc19fa94822c6ff6a61880762e06117659f58e6654d17fe63d1d28b90607b78`.
- `reports/release-manifest.json` — draft candidate join key and negative tuple — SHA-256 `6945faa7d4eb0b3d02f2ef65bc3f7dca125bab0c67955d3097b1a479144a22ec`.
- `reports/gate-ledger.md` — gate statuses, owners, HOLD scope, invalidation rules — SHA-256 `0e4f6a759cfe73f259f37fbdddf44aedeb0c2021d04128ae6a90a216bce6cf41`.
- `reports/external-track-register.md` — sanitized vendor/P6 request and booking drafts — SHA-256 `4957d4732295e24ee04e7f6b09fe380de851973ed15951ee6f307aa5b347b6d7`.

## NOT done / deliberately skipped

- Release-owner, technical/security approver, operator, rollback, vendor, network, and operations names are blank: OWNER-ONLY.
- Vendor identity request and P6 resources are not externally sent/booked: no channel or named external owner is available. Lane C and S5 remain OPEN/BLOCKED with no date.
- R2 publication, deployed floor change, Railway deploy, artifact build, and source edits were not performed in S0 by design.
- Quantitative G2-IDENTITY thresholds remain PROPOSED; no identity gate measurement was run.

## State the next session must know

- Root branch `codex/fingerprint-engine-phase0` is dirty with pre-existing engine/orchestration work; MKTTool has unrelated `AGENTS.md` edits; MKTBrowser has three unrelated tracked source edits. Preserve all of them.
- Manifest candidate ID is `20260830-browser-0.3.13-relay-16`; Relay/installer hashes are null until P2/P3. Current engine pin is provisional until S4a.
- Published v15 object/hash tuple is negative evidence only and immutable. Fixed local v15 output is source-fix evidence only.
- Current shell is Node `v24.14.1`; switch to Node 22 before any MKTBrowser/Relay build. `ELECTRON_RUN_AS_NODE` is absent. License-key presence was observed without reading its value.
- `MIN_RELAY_VERSION` is required to move `13 -> 16`; do not leave it at 13 by omission.

## Decisions still owed by the release owner

- Names/authority for all ledger roles and vendor channel/SLA.
- Authorization to publish `/v16` to R2 after exact replay/corruption gates (separate from Railway).
- Authorization to run `railway up` after final signed tuple (separate from R2).
- Approval of proposed G2-IDENTITY thresholds before S4a measurement.
- P6 resource suppliers and S7 canary roster/dates (dates wait for S4a).

## Next unit

S1a — Relay journal fail-closed durability, focused tests, and clean Windows build. First action: read `phase-02-relay-artifact-rebuild.md`, verify the `57e14fa` journal/replay diff, then run the focused Relay tests on a clean Node 22 worktree without changing the dirty source trees.
