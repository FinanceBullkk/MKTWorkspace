# Restore-verification receipt handling

Date: 2026-08-30 | Status: historical receipt retained outside Git

The predecessor run produced `restore-verify-20260830-r3.json` and
`restore-verify-20260830-r4.json`. Those raw receipts include production-schema field names and
encrypted/token-bearing record structures, so they are intentionally **not committed** to the
workspace plan repository. The files remain on the local evidence volume for the owner’s audit and
are not deleted or rewritten.

The current, sanitized receipt for the release is
`plans/260830-0830-consolidation-and-lane-a-release/reports/p4a-postdeploy-evidence.json`, and the
fresh SQL dump remains outside Git under `MKTTool/data/backups/`. No raw production backup or
credential-bearing restore output belongs in this repository.
