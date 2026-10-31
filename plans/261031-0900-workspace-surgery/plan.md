# Workspace surgery — cut ceremony, cut scope, simplify (261031)

Owner decision on 31 October 2026: the workspace is overengineered for an internal tool with a
handful of known users and zero onboarded operators. Three cuts were approved: release ceremony,
product scope, and architectural simplification (code cuts only; god-file refactoring and
enrollment/retirement consolidation explicitly deferred to a later pass). Engine of record is
CloakBrowser; old database data is disposable; repositories move to the owner's personal GitHub
(`FinanceBullkk/*`, public).

## What was done

- **Phase 0 — preserve & reconcile.** MKTTool reconciled to `origin/master` (`adcccaa`) after
  `git range-diff` re-confirmed the three local commits patch-equivalent; pre-reset SHA
  `a2f41fe` recorded. Irreplaceable state copied to `D:\MKTRelease\_surgery-archive-261031`
  (relay identity backup with DPAPI-sealed keys, team-readiness-261002 receipts incl. the
  retained installer `2144a3c2…`, licence-seat-260921, receipt JSONs). Branch `surgery/261031`
  in all three repos.
- **Phase 1 — disk.** 51 GB of superseded artifacts (vm-clones 19G, host-disk-recovery 14G,
  u3 4.2G, engine-switch-audit 3.5G, 13 local-release dirs, relay zips, three build generations)
  moved offline to the archive dir; the abandoned 19 Aug blueprint and 15 closed plan folders
  (260813–260902) archived into `plans/archive/`. The MSI-tested `0b733f18…` installer bytes are
  not on this host (noted honestly; they lived on the MSI laptop).
- **Phase 2 — ceremony cut.** Workspace `AGENTS.md` release gate replaced with the internal-tool
  gate (commit → local checks → one smoke → push). MKTBrowser: 44 ceremony scripts, 3 workflows,
  ~11k LOC removed; kept `verify-node-version`, `fingerprint-engine-pin`,
  `critical-coverage-contract`, `verify-packaged-runtime-contract` (+ engine fixture).
  MKTTool: `release-authority/`, `scripts/ci/` except the standalone secret scan, compatibility
  manifest sign/publish, retained-relay TLS harnesses, out-of-scope smoke tests removed.
- **Phase 3 — MKTTool scope cut.** Deleted routes/content/queue/targets/facebook/health pages and
  APIs, libs (rules, queue, content, health, facebook, ops-alerts, schedule, release, AdsPower
  adapter), components, the parked TikTok warmup bot, and 11 Prisma models via migration
  `20261031152046`. Docs rewritten/archived; README 96 KB → lean readme.
- **Phase 4 — MKTBrowser.** Chrome-for-Testing engine path removed (types, settings coercion,
  bootstrap, driver, switch UI, installer scripts); compatibility-smoke diagnostics deleted;
  `compatibility-engine-pin` kept as the production startup pin gate (cloakbrowser-only).
  Untracked build mass (1.8 GB) archived; template leftovers untracked; cdp-driver dead dep
  removed.
- **Phase 5 — relay trim.** The Windows compatibility-update platform (~25 files) removed;
  updates ship by reinstalling from `/setup`. Shared HTTP contract (`relay-endpoints.ts`) keeps
  ticket/health/secret/retirement/enrollment paths only; the min-relay-version floor stays.
- **Repos moved** to `github.com/FinanceBullkk/{MKTTool,MKTBrowser,MKTWorkspace}` (public) after
  a secret scan (MKTTool scanner + pattern grep + history pickaxe) found no key material.
  Old `Techieslab-app` remotes remain as `techieslab`, history-only.

## Incident recorded honestly

`FinanceBullkk/MKTTool` and `FinanceBullkk/MKTBrowser` were rename-redirects to the
`Techieslab-app` org (the repos had been transferred). The first pushes and the first visibility
change therefore landed on the org repos. Fixed within minutes: org repos returned to private,
the accidentally pushed `surgery/261031` branches deleted from the org, real personal repos
created (breaking the redirects), everything re-pushed there.

## Verification

- MKTTool: typecheck 0 errors; `test:no-db` 1625/1625; `test:relay` 430/430; **full DB suite
  1847/1847** (Postgres 17 + `mkttool_test` — the old "full suite permanently blocked on this
  host" journal note is obsolete); lint clean; `next build` 15 routes; secret scan PASS.
- MKTBrowser: typecheck 0 errors; mkb01 67/67, w02 10/10, mkb01e 10/10, mkb02 223/223, mkb03
  99/99, settings-store 11/11, profile-manager archive 25/25, cdp-driver 6/6, mcp-server 38/38,
  script contracts 29/29; lint clean; electron-vite build succeeds. `test:packaging` 106 pass /
  1 skip / 4 fail — those 4 fail identically on HEAD (PowerShell yarn-version fixture inside the
  tokenized-wrapper suite; environment-specific, pre-existing; the packaging quality gate was
  deliberately not weakened to pass).
- Dev smoke: MKTBrowser boots clean (main+preload built, app ran 90 s under a forced kill with no
  fatal startup error, profile DB opened). The one-manual-smoke profile launch on CloakBrowser
  remains the owner's step per the new gate.

## Landing

`surgery/261031` merged (no-ff) into `MKTTool master`, `MKTBrowser main`, and workspace
`master`, pushed to `FinanceBullkk/*`. No auto-deploy exists on the personal remotes; restoring
the Railway service and onboarding the real operator team are explicit follow-ups, unchanged in
priority, and out of this surgery's scope.
