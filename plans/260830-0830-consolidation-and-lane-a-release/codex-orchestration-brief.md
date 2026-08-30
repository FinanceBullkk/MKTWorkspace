# Codex Orchestration Brief — Consolidation and Lane A Release

> **Current-state override — read before the historical run instructions below (30 August 2026).**
> The later owner decisions in `decisions.md` supersede the original start-state language: U1 is
> landed; Q14's three Browser files were committed in dedicated commit `1decde437cf6495652b9d7bdbb76290ab2130411`;
> Q13 merge/deploy is complete; P4a Web does not require the Browser five-artifact tuple; U3's
> current residual is 103 bytes; Q15 is owner-only self-serve with no notification channel; Q16
> records no CloakBrowser channel and Lane C **CLOSED**; U6 custom-engine build is closed; and the
> floor remains 13 pending observed owner-machine reinstalls. Use `plan.md` and the latest handoffs
> as the operational source of truth. Do not repeat superseded push/commit/vendor/build instructions.

## Current execution override — 30 August 2026 (latest owner decisions)

The start-of-run instructions below are retained for audit history. The run is now at the following
state and must not be restarted from U1:

| Unit | Current result | Next action |
|---|---|---|
| U1 | COMPLETE; both release branches landed and pushed | none |
| U2 | MKTTool PR/master CI green (`33296599912`, `33297347911`); Windows Node 22 setup/pin pass in `33301446012`, but private MKTTool sibling checkout fails and package jobs skip | retain OPEN; grant read access and rerun; do not call skipped jobs PASS |
| U3 | Payload/provenance manifests PASS; outer NSIS variance is **103 bytes**, full installer OPEN; P3-06 comparison is wired | retain residual; no lying normalizer |
| U4 / P4a | MKTTool Web deployed from `master` at `6ce28d0f…`, final deployment `ed972e5b…`; healthz and authorized v16 full GET/hash PASS; disposable P4-09 drill qualified PASS | retain prior-image healthcheck prerequisite, P4-08 smoke, and P4b tuple as OPEN |
| U5 | Route-first PASS; floor remains 13 pending observed owner-machine reinstalls | do not bump floor or claim device PASS |
| U6 / Lane C | Custom-engine build closed; no CloakBrowser channel; Lane C **CLOSED** | no reboot/build/vendor request |
| U7 | Reconciliation, runbooks, P3/U2/P4-09/healthcheck evidence, and final handoff complete | preserve owner-only boundaries; no further autonomous release action |

Q13 authorizes the already-completed merge and any docs-only follow-up PR after CI; Q15 requires no
notification channel; Q16 requires the Lane C closure to be stated plainly. The historical sections
below are not a second task list.

Same operating model as the 2026-08-30 run, which worked. Read this, then work continuously.

## Read first

1. `E:\MKTWorkspace\AGENTS.md` — mandatory.
2. `plan.md` in this directory — the seven phases and why they are ordered this way.
3. `decisions.md` in this directory — authority, tiers, and the landmines. **Read it before asking
   anything.**
4. `../reports/verification-260830-0430-codex-autonomous-run.md` — what the previous run actually
   proved, independently verified. It is the factual baseline; do not re-derive it.
5. The phase file for the unit you are running. **Not all seven.**

## The one rule: keep going until you hit a real boundary

Finish a unit, write its handoff, start the next. Do not stop to ask permission to continue, do not
stop to summarise, do not stop because a unit finished.

Stop for exactly four reasons:

| # | Condition | Action |
|---|---|---|
| 1 | Context exhausted | PARTIAL handoff naming the exact step, then stop. A correct outcome. |
| 2 | An owner decision is genuinely required | Only the five in `plan.md`. Ask once, keep working meanwhile. |
| 3 | An action needs authorization you were not given | Ask, continue elsewhere. |
| 4 | An external dependency is unavailable | Record OPEN, do everything else, report. |

A failing test, a surprising finding, a phase boundary — none of these are stops.

## Historical work unit map — start-of-run (retained, do not restart)

| Unit | Scope | Phase | Blocked by |
|---|---|---|---|
| **U1** | Land 105 uncommitted files on branches | P1 | — **do this first, it is the risk** |
| **U2** | Enforce every contract in CI | P2 | U1 |
| **U3** | ~~Solve the 78-byte NSIS delta~~ → document the measured **103-byte** residual; full installer reproducibility OPEN | P3 | U1 |
| **U4** | ~~Attest/sign the Browser tuple~~ → P4a Web deploy/verify; P4b Browser tuple remains separate OPEN | P4 | U1 |
| **U5** | Fleet migration preparation; floor remains 13 pending owner-machine observations | P5 | U4 |
| **U6** | Closure decision: no custom engine, no build/reboot/vendor request; Lane C CLOSED | P6 | — |
| **U7** | Docs and runbooks | P7 | U2, U4, U5, U6 |

U2 and U3 are independent. U6 is deliberately off the critical path — start its RAM preflight early
because the build is long, then interleave.

## Handoff protocol

Every unit ends by writing `handoffs/U<id>-<slug>.md`:

```markdown
# Handoff U<id> — <scope>
Date: <ISO> | Phase: <n> | Status: COMPLETE | PARTIAL | BLOCKED

## Done
- <what ran, the command, the result>

## Evidence written
- <path> — <what it proves> — <hash if applicable>

## NOT done / deliberately skipped
- <item> — <why> — <what unblocks it>

## State the next session must know
- <SHAs, branches, uncommitted work, env changes>

## Decisions still owed by the owner
- <question> — <what is blocked>

## Next unit
U<id+1> — <scope>. First action: <exact step>.
```

Handoffs are checkpoints, not stopping points. Write one, then keep working. A fresh session reads
this brief + the latest handoff + its own phase file — never the whole directory.

## Historical hard guardrails — current exceptions are in the override above

1. **Never commit the user's files.** `ChromiumBrowserDriver.ts`, `mcp-server/src/server.ts`,
   `types/src/index.ts` in MKTBrowser, and `AGENTS.md` + `AGENTS.md.bak-260828` in MKTTool. Stage by
   explicit path only — never `git add .` or `-A`.
2. **Never force-push, never commit to a default branch, never rebase existing history.**
3. **Historical push gate:** push was deferred until the relevant owner question was answered;
   Q13 later authorized the release-branch pushes and merge. Do not apply this old gate to the
   current committed state.
4. **Never disable a check to get past it.** If `emit-release-provenance.cjs` refuses a dirty tree,
   that is the system working. Report it.
5. **Skipped ≠ passed.** Ever.
6. **Never consume the CloakBrowser seat.** `CLOAKBROWSER_LICENSE_KEY` is live. Seat refusal looks
   like **exit 76 after CDP is already serving** — do not misread it as a crash and retry.
7. **Route before floor.** Never reject an old Relay version before `/v16` is verifiably reachable by
   full GET.
8. **Rollback always returns to the human.** Never execute one autonomously.

## Historical environment landmines — no engine build is scheduled

- **Node 22 exactly** for MKTBrowser and Relay builds. Machine default is v24.14.1;
  `verify-node-version.cjs` throws on anything but major 22. Package manager `yarn@4.5.0` via corepack.
- **`ELECTRON_RUN_AS_NODE`** is set in some shells here and makes the Browser exit instantly on
  launch — it mimics a broken build. Clear it before lifecycle work.
- **PowerShell `Set-Content -Encoding utf8` writes a BOM**, which makes `JSON.parse` throw and the
  Relay refuse to start.
- **`local-test-artifacts/`** holds DPAPI operator-key archives. Never bulk-delete it.
- **`electron .` never works in the dev tree.** Swap the bundle into a copy of the packaged build.
- **RAM was the engine build's binding constraint** — 3.6 GB free of 15.9, gate needs >12. U6 is
  closed, so do not reboot or start a custom-engine build for this release. `D:` had 234.8 GB free.

## Definition of done for a unit

- Success Criteria ticked only where real evidence exists, with command and result recorded.
- Evidence sanitized and hash-bound.
- Handoff written.
- You have already started the next unit.

Report faithfully. The previous run's value came from refusing to round 78 bytes up to "reproducible"
and refusing to call a synthetic smoke a production smoke. Hold that standard.

## Historical start instructions — already executed; do not restart

1. **First message:** ask only the five owner questions in `plan.md`, as one batch, with your
   recommendation for each. Do not wait for the reply.
2. **Then run U1 immediately.** 105 files are one crash from gone; landing them is the highest-value
   thing you can do in the next hour.
3. **Chain onward** U2/U3/U4 → U5 → U7, with U6 interleaved, stopping only for the four boundaries.
4. **Target for this run:** both trees clean and committed, every contract enforced in CI, Lane A
   deployed and verified, the floor moved safely, and a written engine decision.
