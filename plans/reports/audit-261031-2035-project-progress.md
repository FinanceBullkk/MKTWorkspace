# Repository progress audit — 31 October 2026

Measured at approximately 20:35–20:40 Asia/Saigon. Scope: workspace, MKTTool, MKTBrowser, GitHub refs/deployments, targeted code/tests, retained release receipts, and public production reachability.

## Outcome

Core management and self-enrollment code exists. Browser 0.3.30 / Relay 22 remains candidate-only, with operator rollout HOLD. The documented production URL currently fails at Railway routing. Restore or identify the active production service before continuing operator onboarding.

## Fresh observations

| Area | Result | Evidence |
|---|---|---|
| Production URL | FAIL | Both `/` and `/api/healthz` at `https://mkttool-web-production.up.railway.app` returned HTTP 404, server `railway-hikari`, body `Application not found`. This does not identify whether the service was stopped, removed, or moved. |
| GitHub deployment | INACTIVE | Latest listed deployment `6812889662`, SHA `adcccaab692cd8b7abc9e9a21c8641fd5d78f11b`, succeeded on 2 October and changed to `inactive` at 2026-10-22T09:25:36Z. This is historical deployment metadata, not current runtime proof. |
| Railway inspection | BLOCKED | `railway deployment list --json` rejected the saved login: `Your saved login is no longer valid (grant request is invalid)`. No current Railway service configuration or logs obtained. |
| MKTTool targeted tests | PASS | Six files, 43 tests: operator-key self-enrollment contract/completion, local key handler, startup bootstrap, installer R2 selection, compatibility manifest handling. |
| MKTTool typecheck | PASS | `npm run typecheck`, exit 0. |
| Browser targeted contracts | PASS | Three files, 23 tests: version coherence, release candidate, and source-binding contracts. |
| Whitespace checks | PASS | `git diff --check` in all three repositories. |
| Full build, DB suite, VM acceptance | OPEN | Not rerun in this audit. Free RAM measured about 1.38 GiB; no heavy build or VM started. Targeted tests do not refresh full release acceptance. |

## Repository state after fetching origin

| Repository | Local | Remote | State |
|---|---|---|---|
| Workspace | `master`, `8c6dcc6` | Same | Existing untracked physical-acceptance report preserved. This audit adds one report. Latest commit: 3 October. |
| MKTTool | `master`, `a2f41fe` | `origin/master`, `adcccaa` | Ahead 3 / behind 5. Two existing modified files: `package.json`, `package-lock.json`. Latest remote commit: 2 October. |
| MKTBrowser | `main`, `8771449` | Same | Clean. Version 0.3.30. Latest commit: 3 October. |

MKTTool divergence is partly rewritten history: `git range-diff c4fe80a..HEAD 34354b9..origin/master` identifies the three local commits as patch-equivalent to remote commits `2b31f5b`, `d161bcd`, and `2d17c32`. Do not merge blindly as if all three were new unpublished changes.

The dirty dependency files exactly match `origin/master`; they specify Next.js 16.3.6. Installed `node_modules` still resolves Next.js 16.3.3. Local passing tests/typecheck therefore do not establish a clean installation of the locked dependency set.

GitHub open items: MKTTool has no open PRs or issues; MKTBrowser has no open issues and one old PR, #17, `Stop storing a same-run handoff for a week`, last updated 6 September. Empty issue lists are not completion evidence.

## Code findings

- Shared nick/proxy/Relay management and self-enrollment are implemented. Reviewed self-enrollment code keeps plaintext operator-key entry local to Relay, validates local Origin and key shape, stores through protected storage, checks signed-in PC ownership, and verifies the configured key fingerprint on completion.
- Local MKTTool lacks the remote `adcccaa` fix. That fix preserves the exact approved Browser 0.3.29 / Relay 21 installer while 0.3.30 is piloted, and selects Relay v18 for compatibility sequences through 31, v20 for 32, and v22 from 33. Preview and ticket issuance use that mapping. Local source still uses the current Relay version for those reads.
- Browser requires a verified engine activation pin. Installer/control-port success alone cannot establish readiness to create or launch managed profiles.
- Product scope remains profile management with proxy binding. Reddit/Facebook posting is outside team rollout; TikTok posting automation remains parked. Historical identity-isolation failure does not become a pass under this narrower product scope.

## Retained release evidence — not new machine runs

Retained installer was rehashed locally: 148,993,705 bytes, SHA-256 `2144a3c2472a7ac746561200cd7d172f2937e00f1207491a0dabc86c0615c34f`.

Parsed receipts under `local-test-artifacts/team-readiness-261002` still record:

| Exact-candidate evidence | Recorded result |
|---|---|
| Clean install | 9/9 PASS |
| Installed-state repair | 13/13 PASS |
| Final uninstall rerun | 15/15 PASS |
| Earlier failed repair/uninstall attempts | Retained separately; not overwritten by later PASS |
| Signed sequence 33 CFT activation | OPEN |
| Managed profile/proxy rejection and recovery | OPEN |
| Browser-page IP/DNS/WebRTC containment | OPEN |
| Non-admin Google/Vaultwarden onboarding and full physical second-PC journey | OPEN |
| Unfamiliar operator and seven elapsed canary days | OPEN |
| Native identity isolation | Historical FAIL |

The latest October report records VM clock drift of roughly 30–40 seconds under VirtualBox NEM, no signed CFT activation attempt, and physical MSI Relay health `configured=false`. These are retained observations, not live MSI measurements today.

## Tracking drift

- Local roadmap is dated 25 September; remote roadmap is dated 2 October. Even remote text says candidate Web was not deployed, while GitHub records `adcccaa` successfully deployed later on 2 October and inactive from 22 October.
- Self-service plan shows phases 1 and 2 Pending and all 16 success checkboxes unchecked, despite implemented self-enrollment and later publication/installer receipts. Checkbox totals cannot support a meaningful overall completion percentage.
- Browser README says source candidate `5232579`; current main is `8771449`, whose later commit updates release documentation. Candidate source and current repository HEAD must remain distinct.
- Existing untracked physical report describes installer `0b733f18...`; final retained candidate here is `2144a3c2...`. Evidence for those different EXEs must not be combined as one exact-installer acceptance run.

## Recommended order

1. Identify why the documented production URL is unavailable; regain Railway inspection and confirm intended domain/service, deployed SHA, and health.
2. Reconcile the local MKTTool checkout with remote history while preserving dirty files, then install/validate the locked dependency set. Reconcile living status documentation against actual receipts.
3. Complete supported local Relay enrollment and signed sequence 33 activation on a stable clean machine; verify managed profile/proxy recovery.
4. Complete non-admin/unfamiliar-operator and full second-PC acceptance, then seven actual canary days before operator promotion.

No source code changed, dependencies installed, commits created, pushes, deployments, publications, licensing actions, or machine acceptance runs performed in this audit. Read-only fetches updated remote-tracking refs; tests/typecheck ran locally; this report was added.

## Unresolved questions

- Was production intentionally retired, stopped, or moved to another domain/service after 22 October?
- Which authenticated Railway session can establish current service state and logs?
- Which stable clean Windows environment and pilot operator can close activation and onboarding acceptance?
