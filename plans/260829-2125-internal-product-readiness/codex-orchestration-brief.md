# Codex Orchestration Brief — Internal Product Readiness

> **HISTORICAL / SUPERSEDED.** Do not execute this predecessor prompt. The 30 August consolidation
> brief and its `decisions.md` supersede its owner questions, push/commit restrictions, vendor track,
> and S0→S7 sequence. Current P4a/P5/P6 truth is in
> `../260830-0830-consolidation-and-lane-a-release/plan.md`; Q13–Q17 are answered, P4a is deployed,
> and Lane C is CLOSED because no CloakBrowser channel exists.

Paste this whole file as the opening prompt of the **first** Codex session. Every later session
starts by re-reading this file plus the latest handoff.

---

## Your role

You are the **orchestrator** for the plan at
`E:\MKTWorkspace\plans\260829-2125-internal-product-readiness\` (plan.md + 8 phase files).
You own sequencing, delegation, evidence, and the handoff chain. You do **not** own the go/no-go
decisions — those belong to the release owner (the user).

Read first, in this order:
1. `E:\MKTWorkspace\AGENTS.md` — mandatory. CI/CD discipline, git safety, repository-context rules.
2. `plans/260829-2125-internal-product-readiness/plan.md` — lanes, gate ledger, execution graph.
3. `plans/reports/review-260830-0021-internal-product-readiness-plan.md` — the review whose findings
   are already applied; it explains *why* several constraints exist.
4. The phase file for the session you are actually running. **Not all eight.**

---

## THE ONE RULE: keep going until you hit a real boundary

**Work continuously.** Finish a work unit, write its handoff, and immediately start the next one.
Do not stop to ask "shall I continue?", do not stop to summarise progress, do not stop because a
unit finished. The user does not want to be asked for permission to proceed.

You stop for exactly **four** reasons, and nothing else:

| # | Stop condition | What you do |
|---|---|---|
| **1** | **Context exhausted** | Write a PARTIAL handoff naming the exact step reached, list the next action, and tell the user to open a fresh session. This is a correct outcome, not a failure. |
| **2** | **An owner decision is genuinely required** | Only if proceeding under any assumption would be unsafe or would waste the work. See "Ask everything once" below — most of these are collected upfront so they never stop you. |
| **3** | **An action needs authorization you were not given** | Publishing to R2, `railway up`, changing a deployed floor, promoting a pointer. Ask, then continue with everything else meanwhile. |
| **4** | **An external dependency is not available** | Vendor answer, disposable proxies, second PC, human operator, a 7-day clock. Record OPEN, do every other thing that is not blocked, then report. |

Anything else — a unit completing, a test failing, a phase boundary, a long build, an unexpected
finding — is **not** a stop. Fix it or record it and keep moving.

When you finish a unit, the next message you send should already be work on the next unit.

### What can and cannot run unattended

Be honest with yourself about this, because pretending otherwise is how fake evidence gets written.

- **S0 → S4b can run continuously.** Baseline, Relay durability and build, production hardening,
  installer, identity probe, freeze. This is machine work. Chain it.
- **S5 → S7 cannot.** P6 requires a human performing first login and typing (G1 explicitly forbids
  credential/OTP automation), two disposable proxy pairs, a live vendor entitlement, a clean second
  PC, and a real power-off/power-on. P7 Stage B waits on the vendor. P8 is a seven-day canary of
  manual human actions. No prompt removes these. When you reach S5, prepare everything that can be
  prepared — runbooks, harnesses, checklists, probe scripts, evidence templates — then hand over.

So: run hard to the end of S4b, then hand a fully-prepared S5 to the humans.

### Work unit map

| Session | Scope | Phase | Blocked by | Ends when |
|---|---|---|---|---|
| **S0** | Baseline, manifest, gate ledger, owners; open vendor request + book P6 resources | P1 | — | Baseline signed; ledger exists; both long-lead tracks have owner+SLA |
| **S1a** | Relay journal fail-closed durability + focused tests + clean Windows build | P2 steps 1–7 | S0 | Exact archive/EXE passes restart replay + corruption matrix |
| **S1b** | Publish `/v16`, floor `13→16`, fleet migration, signed compatibility bundle | P2 steps 8–12 | S1a | Immutable read-back OK; v13/v14/v15 migration proven; floor decision signed |
| **S2a** | Restore script, `api/healthz`, trusted-proxy config, rate-limit storage | P5 steps 1–6 | S0 (parallel with S1) | Restore verified; per-IP limits proven; shared-IP warning gone |
| **S2b** | Prisma/deepmerge, one-seat boundary, Lane A smoke, rollback drill | P5 steps 7–12 | S2a | Change set frozen and handed to P4 |
| **S3** | Browser installer, version coherence, payload/provenance, onboarding copy | P3 | S1b + S2b | Draft candidate built twice, copy truthful, lifecycle passes |
| **S4a** | **Identity early probe** — freeze the engine pin | P7 Stage A | S3 | Outcome recorded: no-chance / repin-needed / pin-final |
| **S4b** | Final freeze, signature, publication, Railway alignment | P4 | S3 (parallel with S4a) | One signed tuple published + deployed; rollback tuple recorded |
| **S5** | Real-environment gates | P6 | **S4a pin frozen** + S4b | G1/G2-network/G3/G4 each independently evidenced |
| **S6** | Identity decision | P7 Stage B | S5 | `G2-IDENTITY` PASS, or FAIL/OPEN with owner and next action |
| **S7** | Canary and promotion | P8 | Lane-specific | Signed lane GO/NO-GO |

S1 and S2 are independent after S0. Run them in whichever order suits you, or interleave if that
keeps you unblocked — just keep their evidence and handoffs separate.

The map exists so the user can track progress and so handoffs have clean boundaries. It is **not** a
list of places to stop.

---

## Handoff protocol (this is what makes multi-session work)

Handoffs are **checkpoints, not stopping points**. You write one at the end of each unit and then
keep working. Their purpose is that when context does run out — mid-unit, unpredictably — the next
session can resume in minutes instead of re-deriving everything.

**Every work unit ends by writing** `plans/260829-2125-internal-product-readiness/handoffs/S<id>-<slug>.md`:

```markdown
# Handoff S<id> — <scope>
Date: <ISO>  |  Phase: <n>  |  Status: COMPLETE | PARTIAL | BLOCKED

## Done
- <what was actually executed, with the command and its result>

## Evidence written
- <path> — <what it proves> — <artifact hash if applicable>

## NOT done / deliberately skipped
- <item> — <why> — <what unblocks it>

## State the next session must know
- <repo SHAs touched, files modified, uncommitted work, env changes>

## Decisions still owed by the release owner
- <question> — <who must answer> — <what is blocked until then>

## Next unit
S<id+1> — <scope>. First action: <exact first step>.
```

**A fresh session starts by** reading this brief + the most recent handoff + only the phase file it
needs. Do not re-read the whole plan directory; that wastes the context you need for the work.

Keep your own context lean as you chain units: you do not need P2's full evidence in memory while
working P3 — the handoff and the manifest hold it. Read what the current unit needs, not everything
that came before.

---

## Delegation inside a session

Use subagents for work that is genuinely independent and read-heavy:
- searching both repos for hard-coded version constants (P2 step 2)
- auditing onboarding/UI copy against the claim list (P3 step 8–9)
- reviewing a diff you just wrote

Do **not** delegate: artifact hashing, publication, floor changes, deployment, or anything that
writes to R2/Railway. Those stay in the orchestrator session where the evidence chain lives.

Give every subagent: the work context path, the specific phase file section, the files to read, and
the acceptance criteria. Never "continue from where we left off" — subagents start cold.

---

## Hard guardrails

1. **No CD without explicit authorization.** Never publish to R2, never `railway up`, never change
   `MIN_RELAY_VERSION` in a deployed service, never promote a release pointer, without the user
   saying so *in that session*. Approval given in S1 does not carry into S4b.
2. **CI is the final gate, not the debug loop.** Debug locally, including the disposable VM. Do not
   push repeatedly to watch Actions. Do not re-trigger an expensive workflow more than once more in
   a session without asking.
3. **Never overwrite an immutable object.** v15 in R2 keeps its bytes forever. New version, always.
4. **Skipped ≠ passed.** A skipped Windows-live test is `OPEN` and it blocks Browser promotion. Say
   so plainly; never let a skip roll up into a green summary.
5. **No secrets in evidence.** No cookies, OTPs, tickets, proxy URLs, credentials, page content, or
   decrypted vault material — in any file you write, ever.
6. **Preserve unrelated dirty work.** Both repos and the root are dirty with other people's work.
   Touch only what your phase owns.
7. **Do not commit or push unless asked.** If asked, branch first — never commit onto a default
   branch.

---

## Ordering constraints that must not be violated

- **S4a (identity probe) gates S5 (real environment).** P6 costs a vendor lease, two disposable
  proxy pairs, operator time, a power-cycle host, and a clean second PC — and any engine repin
  invalidates all of it. Freeze the pin first. If you find yourself booking P6 resources before
  S4a has reported, stop.
- **`/v16` must be reachable before the floor rejects anything.** Route first, floor second.
- **P3 waits for both P2 and P5.** A later server/copy change invalidates the installer.
- **Any engine, artifact, config, or host change invalidates downstream evidence.** Re-run from the
  first affected gate; do not patch the ledger.

---

## Ask everything once, at the very start

**Most of this is already answered.** Read `decisions.md` in this directory before asking anything.
It settles every engineering decision (tier DECIDED), marks two as needing owner confirmation before
a specific gate closes (tier PROPOSED), and lists the six that only a human can answer (tier
OWNER-ONLY) — each with an explicit "keep working by" instruction so none of them stops you.

Ask the user **only** the OWNER-ONLY items, once, as a single batch in your first message. Then start
work immediately without waiting for the reply. Do not re-ask anything `decisions.md` already
settles.

The table below is the full list for reference; `decisions.md` is the authority.

| Needed by | Question | Your recommendation to offer |
|---|---|---|
| S0 | MKTBrowser join key: `6d1b0a2` or `3f37653`? | `3f37653` (HEAD; the gap is one docs-only commit) |
| S0 | Who owns the vendor identity request, and is there an open channel to CloakBrowser? | Needs a name; no default possible |
| S1b | `MIN_RELAY_VERSION` 13→16 as a single jump, and does the bump happen at all? | Single jump, yes — leaving it at 13 makes the fix inert |
| S1b | **Authorization to publish `/v16` to R2** once the restart gate passes | Pre-authorize, conditional on the gate |
| S2a | Railway trusted proxy header/CIDR; memory vs DB rate-limit storage | DB-backed — P5 already touches migrations |
| S2b | Prisma/deepmerge: patch, override, isolate, or expiring risk acceptance? | Try locked override to `>=8` first, fall back to expiring acceptance |
| S3 | Browser version `0.3.13`? Authenticode sign, or named expiring exception? | `0.3.13`; unsigned exception for Lane A/B, signing required for Lane C |
| S4a | Approved G2-IDENTITY thresholds — **before** measuring | Propose concrete numbers for approval; do not invent them after seeing results |
| S4b | **Authorization to `railway up`** once the tuple is signed | Ask separately; do not bundle with the R2 authorization |
| S5 | Who supplies proxy pairs, vendor entitlement, clean second PC? | External; needed before S5 can start at all |
| S7 | Canary operators, on-call, rollback approver, observation dates | Fix only after S4a reports |

Rules while waiting for answers:
- **Never block on an answer if other work exists.** Do the unblocked work; come back.
- **Never pick a default on a gate decision** (floor bump, identity threshold, signing, publish,
  deploy). Record OPEN and move on.
- **Do** pick sensible defaults on ordinary engineering choices — file layout, test naming, script
  structure, how to shape a harness. Those are yours to make; do not ask.
- If an answer never arrives, the affected gate stays OPEN in the ledger. That is a valid end state.

---

## Known landmines in this environment

These have burned time before. None are in the plan files.

- **Node 22 is required for MKTBrowser builds.** `scripts/verify-node-version.cjs` throws unless
  major === 22; the machine currently runs **v24.14.1**. Switch Node before any S1a/S3 build, or
  `better-sqlite3` rebuilds against the wrong ABI and the error points in the wrong direction.
  Package manager is `yarn@4.5.0` via corepack.
- **`CLOAKBROWSER_LICENSE_KEY` is live in the shell environment and there is one free seat.** Any
  script that reads it hits the real vendor. A seat refusal surfaces as **exit 76 after CDP is
  already serving** — it looks exactly like a crash. Prove the seat is free before any S4a/S5/S6
  measurement, and never run two sessions that touch the engine at once.
- **`ELECTRON_RUN_AS_NODE`** leaks in from some shells and makes the Browser exit instantly on
  launch. Clear it before lifecycle tests; it mimics a broken build.
- **PowerShell `Set-Content -Encoding utf8` writes a BOM**, which makes `JSON.parse` throw and the
  Relay refuse to start. Write JSON config without a BOM.
- **`local-test-artifacts/` (~1.6 GB) holds DPAPI operator-key archives and relay identity.** Never
  bulk-delete it to reclaim space.
- **`electron .` never works in the dev tree.** To run fixed code in the packaged app, swap the
  bundle into a copy of the packaged build.

---

## Definition of done for a work unit

- The phase file's Success Criteria checkboxes you touched are ticked **only** where real evidence
  exists, with the command and result recorded.
- Evidence files are sanitized and hash-bound to the candidate manifest.
- The handoff file is written.
- You have already started the next unit.

Report outcomes faithfully. If a test fails, show the output. If a gate could not be closed, say it
is OPEN and say why. This plan exists specifically because green unit tests were being reported as
product readiness — do not reproduce that failure from the inside.

**Under continuous execution the temptation to fake completion is much stronger**, because nobody is
checking each unit as it lands. Resist it. An honest PARTIAL or OPEN costs an hour; a fabricated
PASS costs a real account, or the one vendor seat, or a bad release.

---

## Start now

1. **First message:** ask the whole question batch above, with your recommendations. Do not wait for
   the reply before continuing.
2. **Then run S0 immediately.** Read `AGENTS.md`, `plan.md`, `phase-01-baseline-and-scope.md`.
   Execute P1 steps 1–8: capture repo identity (the phase file lists the verified 2026-08-30 state to
   reconcile against), build the release manifest and gate ledger under
   `plans/260829-2125-internal-product-readiness/reports/`, reconcile the `G3-RECOVERY` contradiction
   in the acceptance matrix, record the HOLD scope. No source edits, no build, no publish, no deploy
   in S0.
3. **Write `handoffs/S0-baseline.md`, then go straight into S1a.** Do not ask whether to continue.
4. **Keep chaining** S1a → S1b → S2a → S2b → S3 → S4a → S4b, stopping only for one of the four
   boundary conditions.
5. **At S5**, prepare every artefact the humans will need — runbooks, probe scripts, evidence
   templates, checklists, the exact command sequence — then hand over with a clear list of what each
   person must physically do.

Your target for this run is: **everything through S4b closed or explicitly OPEN, with S5 fully
prepared.** Work until you reach it or until context runs out.
