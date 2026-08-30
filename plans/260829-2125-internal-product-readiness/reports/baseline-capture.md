# S0 Baseline Capture — Internal Product Readiness

> **Historical pre-Q14/pre-P4a snapshot (30 August 2026).** This read-only baseline preserves the
> start-state evidence, including old OPEN deployment/vendor fields. Current P4a Web, P4b Browser,
> Q15, and Q16 status is in the successor consolidation reports; P4a is deployed independently and
> Lane C is **CLOSED** because no CloakBrowser channel exists.

Date: 2026-08-30T01:20:19+07:00
Phase: P1 / S0
Status: PARTIAL — machine baseline captured; owner names/signatures and external bookings remain OPEN.

## Capture rules

- Read-only capture. No source file, artifact, R2 object, Railway deployment, or deployed floor was changed.
- Evidence is sanitized. No credentials, cookies, OTPs, tickets, proxy values/URLs, page content, or private keys are retained.
- Committed source tuples are authoritative for this snapshot. Working-tree changes are recorded separately and are not release evidence.
- Later evidence must bind to the manifest candidate ID and is invalidated by any source, artifact, engine, host, proxy, firewall, schema, or test-order change.

## Repository identity

| Repository | Branch | HEAD / source SHA | Committed tree SHA | Dirty-diff digest | Dirty paths / interpretation |
|---|---|---|---|---|---|
| Workspace root | `codex/fingerprint-engine-phase0` | `a98a30f722d1d0adf9b748add03803676d09aa7e` | `de5b573e0e00103378a84e062b070e42b7452800` | `a37b38608d5f428662af1483f2097816750019d74891b210846ea588f09d5031` | Pre-existing engine-lab/orchestration/plan work; this plan is the only owned scope for this run. |
| MKTTool | `ci/self-hosted-runners` | `1ade2c4a921507fac9e10c30843b67b5944197dd` | `2eb0f14174c794625ca799d961adcb30c1774bbc` | `8bbacc7dcb5add0d20380cc18de4601b9478427e33fe2ec5f1622c95912823e8` | `AGENTS.md` modified and `AGENTS.md.bak-260828` untracked; unrelated/user-owned. |
| MKTBrowser | `feat/installed-contract-on-clean-runner` | `3f3765360eae6de83fd617bf8e19949fb70719af` | `cf28f24c5373b9a9c65c82b256accab0d9023c1a` | `1db72a2ae4a004a1c1f0763350a0f65ccc158352c58de343738ac70c60ae3fab` | `ChromiumBrowserDriver.ts`, MCP server, and types modified; unrelated/user-owned. Release builds must use a clean commit/worktree. |

Commands executed:

```text
git -C E:\MKTWorkspace status --short --branch
git -C E:\MKTWorkspace\MKTTool status --short --branch
git -C E:\MKTWorkspace\MKTBrowser status --short --branch
git -C <repo> rev-parse HEAD / HEAD^{tree}; git -C <repo> remote -v
```

Nested repositories have independent remotes. MKTTool `origin` is `Techieslab-app/MKTTool`; MKTBrowser `origin` is `Techieslab-app/MKTBrowser` and `upstream` is fetch-only `multizenteam/multizen-browser`. No branch named `multi-repo-release-candidate` exists; the real per-repo branches above are used.

The required Relay fix commit `57e14fac8e4aed69f30a9fdab95b3a087f04a4e7` is an ancestor of MKTTool HEAD (`merge-base --is-ancestor` exit 0). MKTBrowser `3f37653` is one docs-only commit after audit baseline `6d1b0a2`; `git diff --name-status 6d1b0a2..3f37653` reports only `README.md`.

## Toolchain/host snapshot (not a build result)

| Field | Observed value |
|---|---|
| OS / architecture | Windows `10.0.26200.0`, AMD64 |
| Node / Corepack | Node `v24.14.1`, Corepack `0.34.6` |
| `ELECTRON_RUN_AS_NODE` | not present |
| `CLOAKBROWSER_LICENSE_KEY` | present (value deliberately not read or recorded) |
| Build implication | Node 22 is required before S1a/S3; no build was run in S0. |

## Reconciled inherited baseline

| Item | Recorded result | Evidence / qualification |
|---|---|---|
| MKTTool quality | `1,922/1,922` tests; critical coverage floors, typecheck, lint, build PASS | Audit `audit-260829-1607-internal-product-readiness.md`; source tuple is `ci/self-hosted-runners@1ade2c4`. |
| MKTBrowser managed suites | `135/135` and `31/31` PASS | Audit; the old candidate tree was `6d1b0a2`, not current dirty worktree. |
| Packaging suite | `34` PASS, one explicit live-Windows test skipped | Skip remains OPEN, never a pass. |
| Published installer | `0.3.12`, `146023745` bytes, SHA `d570ccc3326b5a046d91b7b677f4232ab76908f2fb034c60799e31695f43fc4b`, unsigned | Negative/stale tuple only. |
| Published Relay payload | v15 archive `34285450` bytes, SHA `cfeefc7f1284492a64f5cf8b29603b3e9a36e5d488ac676d2d109b2c4364b261`; embedded EXE SHA `eb37eb544ef87b772185272aa2de4cf23000f2e2fbd92f6bde99a20e47b210d1` | Exact restart replay evidence has `spentTicketRejectedAfterRestart=false`, blocker `RELAY-RESTART-FORGETS-SPENT-TICKET`; quarantined negative evidence. |
| Fixed local Relay source result | v15 archive `c51ca311161b19da6846d2b131eda8bc516fccf1f10eb9159349f0016266a6f5`; EXE `a1efb909d5f90b6c6fa2475a2be19ab93611cfebdbbf8d6a35733610aac48c77` | Source-fix evidence only; not embedded in published installer. |
| Licensed engine pin | CloakBrowser `151.0.7922.108.2`, SHA `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561` | Provisional inherited pin; S4a must freeze or repin. CFT compatibility runs do not prove identity. |
| Current local outputs | Installer `ad1af433cea4070b5860a3c841d170bb1ef91ec3df33e2c11309acd0ba5d945c` (`146103681` bytes); v15 Relay archive `c51ca...`; fixed Relay EXE `a1ef...` | Dirty/unattested outputs; not candidate evidence. |
| Prisma advisory | HIGH chain `prisma@7.9.1 -> @prisma/config@7.9.1 -> deepmerge-ts@7.1.5` | P5 must test locked override or record expiring acceptance. |
| One-seat policy | Vendor result indicates one shared seat; local policy remains one profile/seat at a time | P5/P6 must not infer multi-seat capacity. |

## Railway read-only reconciliation

`railway status --json` was run from `MKTTool` (no mutation). Current service is `mkttool-web`, Online, Southeast Asia, deployment ID `3621f603-1c51-4246-824c-55cc0e6b5764`, active commit `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`, one replica, pre-deploy `npx prisma migrate deploy`, and `healthcheckPath: null`. The target source is not deployed; this tuple is retained as rollback/reference only. No `railway up` was run.

## G3-RECOVERY contradiction reconciliation

The acceptance matrix has three relevant records: line 64 says `G3-RECOVERY PASS`; lines 434–437 explain that this is the final bounded real power-cycle subset on a tested artifact; lines 540–541 retain the earlier `OPEN` result for the real power-cycle/licence-key/reboot issue. The safe candidate reading is:

1. Historical/subset evidence is retained and useful (`real-power-cycle-recovery-evidence-20260827-ownership-fix-r2.json` has sanitized PASS fields).
2. It does **not** close the exact published installer, whose bundled v15 Relay failed restart replay.
3. Candidate `G3-RECOVERY` therefore remains `OPEN` until the exact v16 archive/EXE passes restart, crash, and recovery checks. Earlier OPEN/FAIL entries remain visible as superseded history; none is silently promoted.

## HOLD scope

This release does not add or promote a custom Chromium engine, TikTok/Reddit posting automation, CAPTCHA/OTP/credential automation, page-driving/raw-CDP tools, macOS support, an updater, multi-profile concurrency, or a fingerprint/identity guarantee. The invariant remains `1 account = 1 static proxy = 1 managed profile = 1 assigned Relay device`; Browser actions remain human-controlled.

## Authority and unresolved owner fields

The plan's `decisions.md` settles the engineering defaults: MKTBrowser join key `3f37653`, Relay floor `13 -> 16` in one jump, Browser `0.3.13`, DB-backed rate limiting, locked `deepmerge-ts >=8` attempt, and Node 22 for builds. The following are intentionally blank/OPEN because they require a release owner or external human channel: release/technical/security/operator/rollback names, vendor contact and SLA, R2 publication authorization, Railway deployment authorization, G2-IDENTITY numeric thresholds, proxy/profile pairs, vendor entitlement, clean second PC, signing exception approval, and canary roster/dates.

## S0 result

Machine baseline and sanitized draft inputs are captured. S0 cannot be marked fully signed until the owner-only fields above are supplied; this is an OPEN authority/external dependency, not a reason to alter source or invent approval.
