---
phase: 1
title: "land-the-work"
status: completed
priority: P0
effort: "1–2 hours"
dependencies: []
---

# Phase 1: land-the-work

## Overview

At the U1 start boundary, 105 files from the 2026-08-30 autonomous run were uncommitted across two
repositories. That historical risk is now resolved: owned work is committed on the release branches,
and `emit-release-provenance.cjs` accepts the Browser source after Q14.

This phase lands the work without touching anything the user owns.

## Key constraint: three files were not yours at the U1 boundary

These were dirty **before** the autonomous run started and represent the user's own in-progress work:

```
MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts
MKTBrowser/packages/mcp-server/src/server.ts
MKTBrowser/packages/types/src/index.ts
```

At the U1 boundary, do not commit, stash, revert, or reformat them. If a file you must commit has
changes from both sources interleaved, stop and report it rather than guessing which hunk belongs to
whom. **Supersession:** Q14 was answered at 09:20 after the analysis report; the owner then authorized
one dedicated commit containing exactly these three paths. That later exception is recorded in the
handoff and does not weaken the MKTTool protected-file rule below.

`MKTTool/AGENTS.md` and `MKTTool/AGENTS.md.bak-260828` are likewise the user's.

## Requirements

- Functional: every file the run created or modified is committed on a branch, with a message that
  says what it does and why.
- Functional: both working trees end clean except the user's own files.
- Functional: commits are grouped by concern, not dumped as one blob.
- Non-functional: no secrets, no `node_modules.bak-*`, no build outputs, no evidence files
  containing credentials.
- Safety: no force-push, no commit to a default branch, no rebase of existing history.

## Implementation Steps

1. **Inventory and classify.** For each changed path in both repos, label it: `run-work`,
   `user-owned`, `build-output`, or `junk`. Write the classification to
   `reports/commit-classification.md` before touching git. Anything ambiguous goes to the user, not
   into a commit.

2. **Handle the junk first.** `MKTTool/node_modules.bak-20260830-023658/` is 0.79 GB and **not
   gitignored** — `git add .` would stage it. The `deepmerge-ts` override is settled and verified
   (`npm audit` clean), so the rollback copy has served its purpose: delete it. Add
   `node_modules.bak-*` to `MKTTool/.gitignore` in the same commit so it cannot recur.

3. **Create branches (completed).** `release/consolidation-20260830` was branched from the then-current
   HEADs (`1ade2c4` / `3f37653`). Never commit onto the historical source branches directly.

4. **Commit MKTTool in coherent groups**, using `git add <explicit paths>` — never `git add .` or
   `-A`:
   - `fix(relay): make the spent-ticket journal fail closed` — journal, replay guard, ticket
     verifier, relay identity/config/main, and their tests
   - `feat(relay): bump protocol to v16` — endpoints, release metadata, build/publish/harness scripts
   - `feat(db): add restore verification` — `restore-database-verify.ts`,
     `restore-database-verification.ts`, package script
   - `feat(auth): trusted proxy config and database-backed rate limiting` — auth-server,
     trusted-proxy config + tests, Prisma schema, the rate-limit migration, verify script
   - `feat(api): add unauthenticated readiness endpoint` — `api/healthz/`
   - `fix(deps): override deepmerge-ts to 8.0.2` — package.json, lockfile
   - `docs: correct release claims and version references` — docs/, README, setup UI, onboarding

5. **Commit MKTBrowser** the run-work the same way, excluding the three user-owned files at the U1
   boundary. After Q14, land those three paths only in the separate dedicated safety commit with the
   exact owner-provided message; never mix them into a grouped U1 commit:
   - `feat(desktop): enforce the one-seat license boundary` — license-key-pool, AdditionalLicenceKeys,
     Settings, main/index, settings-store, the new contract test
   - `feat(release): pin Relay v16 and align version to 0.3.13` — relay-release.json, both
     package.json, version-coherence contract test
   - `fix(ui): remove fingerprint isolation and TikTok claims` — FingerprintForm, FirstRun,
     ChromiumBootstrapModal
   - `chore(release): strengthen provenance emitter` — emit-release-provenance and its test

6. **Verify the trees (completed).** `git status --short` in both repos must show only the user's
   protected files. Run
   `npm run typecheck && npm test` in MKTTool and `yarn typecheck` in MKTBrowser from the committed
   state to prove the commits are coherent, not just syntactically staged.

7. **Historical push gate:** publication was deferred until the owner answered Q13. Q13 then
   authorized the release-branch pushes and PR #40 was merged under the recorded preconditions. No
   default-branch or force push was used.

8. **Re-run the provenance emitter (completed).** It was rerun after the Q14 dedicated commit and accepted
   `source.clean=true`; retain that receipt as Browser/P4b evidence. Never bypass a refusal for any
   other dirty path.

## Test Scenario Matrix

| ID | Scenario | Method | Expected |
|---|---|---|---|
| P1-01 | Protected MKTTool files remain uncommitted | `git log -p` for `MKTTool/AGENTS.md` and `AGENTS.md.bak-260828` | Zero commits touch them; the three Q14 Browser paths are explicitly covered by their separate owner-authorized commit |
| P1-02 | No junk committed | `git log --stat` scan for `node_modules`, `release/`, `dist/` | Absent |
| P1-03 | No secrets committed | Secret scan over the full diff | Zero hits |
| P1-04 | Trees clean | `git status --short` both repos | Only user-owned paths remain |
| P1-05 | Commits are coherent | typecheck + tests from committed state | Pass |
| P1-06 | Provenance status known | Run `emit-release-provenance.cjs` | Either clean, or a precise statement of what still blocks it |

## Success Criteria

- [x] `reports/commit-classification.md` exists and every changed path is classified.
- [x] `node_modules.bak-*` was absent and the pattern is gitignored.
- [x] Branch `release/consolidation-20260830` exists in both repos with grouped, conventional commits.
- [x] Protected paths were preserved until Q14's later dedicated MKTBrowser commit; MKTTool
  `AGENTS.md` and `AGENTS.md.bak-260828` remain untouched and uncommitted.
- [x] Typecheck and tests pass from the committed state.
- [x] Branch publication was deferred until Q13, then approved and pushed; no default-branch or
  force push occurred.

The original “three MKTBrowser files remain uncommitted” condition was superseded by the owner's
Q14 decision. They are now in one dedicated commit, `1decde437cf6495652b9d7bdbb76290ab2130411`.

## Risk Assessment

- **Committing the user's work by accident.** Mitigate with explicit-path staging only, the
  classification file as a pre-commit gate, and P1-01 as a hard check.
- **Interleaved hunks in a shared file.** If run-work and user-work touch the same file, do not
  split it by guesswork — report and leave it uncommitted.
- **Losing the rollback path by deleting `node_modules.bak` too early.** The override is already
  verified by a clean `npm audit` and a passing build; deletion is safe. If any doubt remains, keep
  it but gitignore it and say so.
- **A commit that typechecks but breaks at runtime.** Step 6 runs the real suites, not just tsc.
