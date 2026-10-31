# Codex Handoff Prompt

Copy everything below the line into Codex as the opening message.

---

You are executing a multi-phase security and quality audit of the MKTWorkspace codebase. Work inline.
Do not spawn sub-agents or autonomous workflows.

## Read first, in this order

1. `E:\MKTWorkspace\plans\reports\audit-260816-0452-mktworkspace-quality-and-security.md` — the prior
   audit pass. Findings F1–F15 and, at the end, a **Coverage and limitations** section listing what was
   never examined. This plan exists to close those gaps.
2. `E:\MKTWorkspace\plans\260816-0507-full-codebase-deep-audit\plan.md` — the plan overview and the
   D1–D4 depth model.
3. The phase file for the phase you are currently on. **Only that one.** Do not read ahead; later
   phases depend on earlier results and reading ahead biases your hypotheses.
4. `E:\MKTWorkspace\MKTTool\AGENTS.md` — applies to all work in that repo.

`E:\MKTWorkspace\MKTBrowser` has **no** AGENTS.md. Apply the same conventions there: English artifacts,
descriptive kebab-case filenames, no secrets in output, real implementations only.

## The one rule that governs everything

**Stop after each phase. Report. Wait for explicit approval before starting the next.**

When a phase's todo list is complete:

1. Write the phase report to `E:\MKTWorkspace\plans\reports\audit-260816-{HHMM}-{phase-slug}.md`.
2. Post a summary in chat: what you found, what you changed, what you could not close and why.
3. **Stop.** Say clearly which phase is next and that you are waiting for approval.

Do not start the next phase because the current one went well. Do not chain phases. Approval to start
one phase is never approval for the next one.

If a phase turns out larger than expected, stop mid-phase, report progress, and ask — do not silently
extend the session.

## Phase order

00 → 01 → 02 → 03 → 04 → 05 → 06, as listed in `plan.md`.

**Phase 00 adaptation.** The phase file is written as "re-verification", assuming F1–F15 were already
fixed. None have been. So Phase 00 for you is: **remediate, then verify.**

- Fix the mechanical findings: F1 (CI missing `test:mkb03`), F4 (`/encrypt-for-vault` Origin check),
  F8 (no ESLint in MKTBrowser), F11 (dead server action), F12 (7 dead exports), F13 (`npm audit fix`),
  F14 (delete the two mojibake directories in the MKTBrowser repo root).
- Fix if scoped cleanly, otherwise report as open: F2 (convert the Electron/driver source-text
  assertions in `security-contract.test.ts` to structural assertions), F5 (capability-enforcement test
  for the relay route policy).
- **Do not decide alone — escalate with a recommendation:** F6 (`mktBrowserToken` plaintext vs DPAPI),
  F7 (delete 1.7 GB `local-test-artifacts/` — this holds three archived relay homes with DPAPI secrets;
  run the restore scripts before deleting anything, and confirm nothing is still needed as MKB-03
  evidence), F9 (oversized files), F10 (MKTTool CI branch filter), F15 (doc language policy).
- Then run the full verification table from the phase file.

The original audit execution is read-only against production source outside Phase 00. On 16 Aug the
owner explicitly authorized a Phase 03 remediation follow-up for C21, C22, and C10; preserve those
source changes and their regression tests. Future audit phases remain read-only unless separately
authorized.

## Audit discipline — non-negotiable

These are the difference between an audit and a reading exercise.

1. **Write attack hypotheses before reading the implementation.** Each phase file lists numbered
   hypotheses (H01–H106). Write them as tests or as a written trace *first*. If you read the code first
   you will produce a list of what the code already handles, which is the exact failure this plan was
   designed to avoid.
2. **Red-then-green is mandatory in D4 phases.** Every new test must be shown to fail on a deliberately
   broken copy of the code, then pass on the real code. A test that was never red proves nothing —
   rewrite it. State in the report which tests you verified this way.
3. **Never weaken, skip, or rewrite a test to get green.** A legitimate red is a finding. Report it.
4. **No mocks, fake data, or shortcuts** to make an audit check pass. If something cannot be tested
   without real credentials or a real Windows install, say so and hand it to the human gate.
5. **Absence of a finding is a claim.** If you did not examine something in the phase's scope, say so
   explicitly rather than letting silence imply it is clean.
6. **Rank honestly.** If a defect is only reachable in theory, say that. Do not inflate to look
   thorough, do not downplay to look clean.

## Environment

- Windows 11, PowerShell. Working dir `E:\MKTWorkspace`. Two separate git repos: `MKTTool` (branch
  `feat/mkt-browser-clean-break`), `MKTBrowser` (branch `feat/mkb-03-compatibility-set`). Both clean as
  of 16 Aug — keep them clean, commit only what you intend.
- **MKTTool**: npm. `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`. Database tests need Postgres
  and `TEST_DATABASE_URL` from `.env`; the name must end in `_test`.
- **MKTBrowser**: needs **Node 22** — `$env:PATH="E:\tools\node-v22.23.1;"+$env:PATH`. Default Node 24
  breaks `better-sqlite3` on ABI.
- **`yarn` is not on PATH.** Either enable corepack, or call binaries directly. Because
  `nmHoistingLimits: workspaces` is set, `tsx` is **not** hoisted to root — use the per-workspace binary,
  e.g. `.\packages\mcp-server\node_modules\.bin\tsx.cmd`.
- `npx eslint . -f compact` fails — the compact formatter was removed from core ESLint. Use the default.
- Do not run migrations, publish/deploy commands, or anything touching real accounts, real proxies, or
  production R2.
- Do not commit or push unless asked.

## Already covered — do not redo

The 16 Aug pass ran every gate (MKTTool 1484 tests, MKTBrowser ~100, both typecheck, MKTTool lint) and
swept the whole tree for: `exec`/`child_process` usage, Electron `nodeIntegration`/`contextIsolation`/
`webSecurity`, TLS-bypass patterns, `console.*` with secret-shaped arguments, `TODO`/`as any`/
`@ts-ignore`, unused exports across 548 files, git/gitignore secret coverage, file-size census, and
MKTTool `npm audit`.

Re-run gates to confirm a green baseline, but do not re-derive those sweeps. Read the prior report's
"What is genuinely strong" section — those areas were verified and are not open questions.

## Report format, per phase

Concise. Sacrifice grammar for concision.

- Phase, depth tier actually achieved (if you planned D4 and reached D3, say D3).
- Per hypothesis: closed-clean / finding / could-not-close-statically. Never leave one unmentioned.
- Findings: severity (P0/P1/P2/P3 per `plan.md`), boundary, file:line, reproduction, impact,
  remediation, retest gate.
- Tests added, and which were verified red-then-green.
- What you did not examine within the phase scope, and why.
- Unresolved questions at the end.

## Start

Begin with Phase 00. Read the two source documents and `phase-00-fix-reverification.md`, then tell me
your plan for Phase 00 before you change any file.
