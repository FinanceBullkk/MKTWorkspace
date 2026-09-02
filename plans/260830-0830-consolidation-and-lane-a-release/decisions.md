# Decisions — read this instead of asking

> **Current-authority precedence (latest owner corrections, 30 August 2026):** The dated sections
> below supersede the initial table wherever they conflict. In particular: Q13 merge to `master` is
> approved after its five preconditions; Q14's three Browser files are committed in one dedicated
> commit; Q15 makes both v15 devices owner machines (self-serve, no notification); Q16 says there is
> no CloakBrowser channel and Lane C is **CLOSED** (no request/date); and the 10:20 correction makes
> P4a Web independent of the Browser five-artifact tuple. The old vendor/deadline, blocked-lane,
> notification, owner-only, reboot-for-build, and “never commit these three files” rows are retained
> history only and must not be followed.

**Authority record:** the workspace owner delegated full decision authority, including R2 and Railway,
to the reviewing agent on 2026-08-30. That delegation carries into this plan. The owner remains the
accountable human and the sole rollback approver.

Three tiers. Obey the tier.

- **DECIDED / AUTHORIZED** — settled, proceed. Listed preconditions are hard gates; the authorization
  is void until every one is evidenced.
- **PROPOSED** — build around it, do not close the gate until confirmed.
- **OWNER-ONLY** — needs a human's hands or authority. Each has a "keep working by" instruction.

---

## DECIDED — proceed now

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Commit strategy | Branch `release/consolidation-20260830` in each repo, off current HEAD. Grouped conventional commits by concern. Explicit-path staging only. | 105 uncommitted files is the largest risk in the workspace. Branching keeps it reversible. |
| 2 | `node_modules.bak-20260830-023658` | **Delete it**, and add `node_modules.bak-*` to `MKTTool/.gitignore` in the same commit. | 0.79 GB, not gitignored, and its purpose is served — the `deepmerge-ts` override is verified by a clean `npm audit` and a passing build. |
| 3 | Priority order | Land (U1) → enforce (U2) and package (U3) and ship (U4) → floor (U5) → docs (U7). U6 interleaved from the start. | Ordered by risk of loss, then by what unblocks the most. |
| 4 | Engine question | ~~Run the build gate~~ → **SUPERSEDED 2026-08-30 by owner decision: do NOT build a custom Chromium engine.** The track is closed. Phase 6 is now closure + vendor decision. **No reboot for build purposes. No `autoninja`. No build.** | Preflight measured 2.935 GiB available RAM against a >12 GiB gate on a 15.924 GiB machine. A reboot would clear roughly 12 GiB — at the threshold, not above it. Multi-day gamble on marginal hardware, with measurement still to follow. Owner closed it. |
| 5 | Vendor track | Send the request **with a deadline**. Silence past the deadline is recorded as "no". | Lane C cannot stay "in progress" indefinitely on an unanswered email. |
| 6 | Node version | 22 exactly for MKTBrowser and Relay builds. | `verify-node-version.cjs` throws otherwise; machine default is v24.14.1. |
| 7 | Reproducibility standard | Eliminate variance at the source first; normalize only what is provably content-independent, structurally identified. An honest `OPEN` beats a normalizer that lies. | A normalizer that cannot catch a planted byte is worse than no normalizer. |
| 8 | Lane C status language | Stays blocked. No date until Phase 6 produces a decision. | `G2-IDENTITY=FAIL` on fonts `08050B16`, audio `0B09CAEB`, WebGL `BF16CA5C`. |

Ordinary engineering choices — file layout, script structure, test naming, commit granularity within
a group, runbook shape — are **yours**. Make them and move on. Do not ask.

---

## AUTHORIZED — you may execute; preconditions are hard gates

| # | Action | Authorization | Preconditions |
|---|---|---|---|
| 9a | **Lane A web deployment via merge to master** | **GRANTED once CI is green** — but the merge/push itself is owner-gated (Q13). Railway deploys from master automatically (`ci.yml:235`); `railway up` is not the normal path and is not required. **The five-artifact tuple and the engine archive do NOT gate this.** | CI green on the consolidation branch including U2's new gates; `db:backup:remote` + `db:restore:verify` re-run against the **current** database; rollback tuple recorded (deployment `3621f603-1c51-4246-824c-55cc0e6b5764`, commit `c819e6a8`); `healthcheckPath` planned for `/api/healthz`. After deploy: verify `/api/healthz` = 200 and `/v16` served by full GET. |
| 9b | ~~`railway up --service mkttool-web`~~ | **Superseded by 9a.** Keep it only as a manual fallback if the GitHub integration fails. | Same as 9a. |
| 9 | *(historical)* `railway up --service mkttool-web` | **GRANTED.** | Clean-source provenance accepted; signed tuple exists; `db:backup:remote` + `db:restore:verify` both pass against the **current** database (not inherited from the run); rollback tuple recorded with deployment ID `3621f603-1c51-4246-824c-55cc0e6b5764` and commit `c819e6a8`; `healthcheckPath` set to `/api/healthz`. Run `railway status` immediately before and after. |
| 10 | **Raise `MIN_RELAY_VERSION` 13→16 and deploy it** | **GRANTED.** | `/api/relay/download/v16` verified reachable by **full GET with hash comparison** against `5c98cf46…1842e` — HEAD is insufficient; fresh fleet inventory taken after the Phase 4 deploy; upgrade path tested on a real v15 device; if other operators are affected (owner question 3), they were notified and acknowledged first. |
| 11 | **Delete `node_modules.bak-*`** | **GRANTED.** | None — the override is verified. |
| 12 | **Reboot the machine to free RAM for the engine gate** | **GRANTED once the owner confirms timing** (owner question 5). | Nothing mid-flight: no build running, no uncommitted work (U1 done first), no active deploy. |

---

## OWNER-ONLY — keep working around these

| # | Question | Keep working by |
|---|---|---|
| 13 | **Push the branches to origin, or keep them local?** | Commit everything locally. Report branch names and commit counts. Do not push. |
| 14 | ~~Disposition of the three pre-existing dirty MKTBrowser files~~ → **now an analysis task, see below** | Analyze and report; the reviewing agent decides from your analysis. Do not commit, stash, or revert them. |
| 15 | **Are the two v15 devices yours or another operator's?** | Build the upgrade path either way; it is cheap. Test it on a real device. Do not move the floor until answered — a wrong guess strands someone. |
| 16 | **Vendor deadline date, and who sends the CloakBrowser request** | The request is already drafted in the previous run's `external-track-register.md`. Leave it ready. Proceed with U6's build gate regardless. |
| 17 | ~~When may the machine be rebooted?~~ → **ANSWERED: after U1 lands** | Reboot is authorized once the 105 files are committed and nothing is mid-flight. Do U1 first, always. |

---

---

## Owner answers, 2026-08-30 08:49 — two questions closed, one converted

### Q14 → **DECIDED 2026-08-30 09:20: commit all three, in one dedicated commit**

The analysis is done and the decision is made. **Commit the three protected MKTBrowser files** in a
single, separate, clearly-attributed commit.

**Commit message:**

```
fix(safety): correct MCP and driver capability language

Narrow the fingerprint seed comment to a stable engine-supported value requiring
native support and external measurement. Reword MCP tool descriptions so raw CDP
is session restoration rather than stealth evidence, and fingerprint
reconciliation is internal coherence rather than identity isolation. Add the
explicit MKT_BROWSER_MCP_PROTOCOL_VERSION constant with the previous name kept as
a backward-compatible alias.

Owner work, predating the consolidation run; landed separately for attribution.
```

**Rationale — why this overrides the "leave untouched" recommendation.** The analysis weighed the
risk of committing the owner's work but not the risk of *not* committing it. The committed
`mcp-server/src/server.ts` still tells an AI agent that raw CDP handling is stealth evidence and that
fingerprint reconciliation is identity isolation. MCP tool descriptions are read by agents to decide
behaviour, so that wording is arguably more consequential than the UI copy U1 already corrected.
Leaving it uncommitted preserves the exact misrepresentation this plan exists to remove, and it
blocks Lane A entirely.

**Verified before deciding:** +26/−19 lines total across the three files. The only non-string change
is `types/src/index.ts` adding `MKT_BROWSER_MCP_PROTOCOL_VERSION` with the old name aliased —
additive and backward compatible. `yarn typecheck` passes; `git diff --check` passes; no TODO,
conflict marker, or dangling import. Complete work, not a half-thought.

**Constraints:**
- **One commit containing exactly these three paths.** Do not fold them into any U1 commit and do not
  mix in anything else — attribution and revertability both depend on this.
- `MKTTool/AGENTS.md` and `AGENTS.md.bak-260828` stay untouched. They are not part of this decision.
- Do not push. The commit stays local and is trivially reversible with `git reset --soft HEAD~1`.
- After committing, re-run `emit-release-provenance.cjs`. If it now accepts the tree, U4 is unblocked
  and should proceed. If it still refuses, report the exact reason — do not disable the check.

### Original analysis brief (completed — kept for context)

The owner asked for the three files to be **analyzed**, then the reviewing agent decides. Do this
early in U1 — it is cheap and it unblocks U4.

Write `reports/user-dirty-files-analysis.md` covering, for each of
`apps/desktop/src/main/ChromiumBrowserDriver.ts`, `packages/mcp-server/src/server.ts`, and
`packages/types/src/index.ts`:

1. **What the diff does** — functional summary, not a restatement of the patch.
2. **Is it complete or mid-thought?** Does it compile? Does it typecheck? Are there half-written
   functions, unreferenced symbols, `TODO`s, or dangling imports?
3. **Does it interact with the run's work?** These three sit near `license-key-pool`, the MCP server,
   and shared types — all of which U1 touches. Say whether they overlap, conflict, or are inert.
4. **Is it needed for anything in this plan?** Specifically: would committing it help or hurt U4's
   provenance attestation?
5. **Your recommendation**, with reasoning.

Then **stop and report**. Do not commit, stash, or revert them. The reviewing agent decides from your
analysis and records the decision here.

`MKTTool/AGENTS.md` is separate: leave it alone entirely, no analysis needed.

### **Engine decision, 2026-08-30 — the build track is CLOSED**

The owner decided: **do not build a custom Chromium engine.** Phase 6 has been rewritten from a build
gate into a closure-and-vendor-decision phase. Concretely:

- **Do not run `autoninja`, do not reboot for build purposes, do not touch `D:\mkt-browser-engine`
  except to read replay evidence.** The RAM gate is moot; stop measuring it.
- **Close** `plans/260828-0428-chromium-fingerprint-engine/plan.md` with the date, the decision, and
  the measured rationale. **Preserve** every completed phase and its evidence — phases 1 and 2 did
  real toolchain and source work. Close, do not delete.
- **Write the reopening condition** explicitly: different hardware with >16 GiB available RAM, or a
  funded cloud builder, plus an owner for the measurement work that follows.
- **Lane C now has exactly two levers**: CloakBrowser ships an isolating build, or a different vendor
  does. Step 4 of Phase 6 evaluates alternatives on paper against the same thresholds, using
  `plans/reports/research-260828-0153-vendor-independent-fingerprint-isolation.md` as the base.
- **No measurement, no trials, no purchases, no seat consumption** in this phase. A vendor's claim is
  not evidence; any candidate engine still faces 3 profiles × 5 runs with zero per-surface collisions.

If neither vendor lever lands, Lane C does not open for this product shape. MKTBrowser remains a
Lane A/B tool that does not claim identity isolation — which the shipped UI copy already states
honestly. Say that in the roadmap rather than carrying Lane C as in-progress.

### Q17 → **Reboot authorized, sequenced after U1** (now largely moot)

"Do the work on this machine; use a VM if another machine is needed."

- **Reboot is authorized** once U1 has landed the 105 files and nothing is mid-flight. Never before —
  a reboot with uncommitted work is exactly the loss scenario U1 exists to prevent.
- A reboot ends your session. That is expected: write the U1 handoff first, and the next session
  resumes from it. This is what the handoff protocol is for.

### **RAM conflict — U6 and a G4 VM cannot run at the same time**

This machine has 15.9 GB total. The Chromium build gate needs **> 12 GB available**. A clean Windows
VM needs 4–8 GB. They do not fit together.

Sequence them, never overlap:

1. U1 lands the work.
2. Reboot to free RAM.
3. **U6 build gate runs alone** — no VM, no Browser, no heavy applications. This is the only window
   where >12 GB is achievable.
4. After U6 reports, the VM may be created for any second-machine work.

If a VM is running when you attempt the build gate, the preflight will fail on RAM and you will
misread a resource conflict as a build failure. Check for running VMs and WSL instances as part of
the preflight and say so explicitly in the evidence.

---

---

## Correction, 2026-08-30 10:20 — U4 was blocked by a coupling that should not exist

U4 returned BLOCKED because the ceremony wanted a five-artifact compatibility tuple
(`--installer --relay --browser --control-contract --engine`) and the CloakBrowser Stable `.2`
archive is missing. **Refusing to fabricate one was correct.** The mistake was in the plan, not the
execution: it treated the Browser fleet contract and the MKTTool web deployment as one artifact.

They are not the same thing:

- The **web service** is a Next.js app. It does not contain the engine and never needed it.
- `MKTTool/.github/workflows/ci.yml:235` — *"Railway deploys from master, so merging is deploying"*.
  Railway's GitHub integration is the deployment path; `ci.yml` already has a `deploy-verification`
  job that fails on a missing or failed deployment.
- The **five-artifact tuple** is the Browser/Relay/engine fleet contract. Genuinely vendor-blocked,
  and it belongs to Lane B/C.

**So resume U4 as P4a:** get CI green on the consolidation branch, re-run backup and
`db:restore:verify` against the current database, record the rollback tuple, and prepare the merge to
master. **Do not sign or fabricate a Browser tuple to get there.** The merge itself waits on the
owner (Q13), which was always true.

Keep P4b — the Browser five-artifact tuple — as an explicit OPEN item blocked on the vendor. Do not
let it block Lane A again.

---

## Owner answers, 2026-08-30 10:15 — all three remaining questions closed

### Q13 → **Merge to master is APPROVED**

Push the branches and merge to master. **Merging is deploying** (`ci.yml:235`) — treat it as a
production deployment, not a routine push.

**Preconditions, all required before the merge:**

1. **Commit the outstanding work first.** `MKTTool/eslint.config.mjs` is modified and uncommitted as
   of 10:14. Anything not committed does not reach master. Land it in an appropriate commit; leave
   `AGENTS.md` and `AGENTS.md.bak-260828` untouched as always.
2. **CI green on the consolidation branch** — including U2's own new gates. They must pass on
   themselves before they guard anything.
3. **`db:backup:remote` + `db:restore:verify` re-run against the current database.** Not inherited
   from the earlier run.
4. **Rollback tuple recorded**: source SHA, migration state, deployment `3621f603-1c51-4246-824c-55cc0e6b5764`,
   rollback commit `c819e6a8`, schema state.
5. **After the merge**: confirm Railway created a deployment and it succeeded; verify `/api/healthz`
   returns 200; verify `/api/relay/download/v16` serves the published bytes by full GET and hash;
   confirm the Better Auth shared-IP warning is gone. Then set `healthcheckPath` to `/api/healthz`.

If CI is red, do not merge. Report and fix.

**Pushing the branch and merging to master are two different actions. Do not conflate them.**

| Action | Effect | Approved? |
|---|---|---|
| `git push -u origin release/consolidation-20260830` | Runs CI on the branch. **Deploys nothing** — Railway only deploys `master`, currently at `c819e6a`. | **Yes, do it now.** It is the only way to get the CI-green evidence the merge requires. |
| Merge that branch into `master` | **This is the production deployment.** | Yes, but only after CI is green and the other four preconditions are evidenced. |

So the order is: commit everything → **push the branch** → CI runs → read the result → fix anything
red → then merge. Holding back the push because the merge is gated leaves you unable to ever satisfy
the gate.

Push both repos' branches. Never force-push, never push directly to `master`.

### Q15 → **Both v15 devices are the owner's own machines**

No third party is stranded by the floor bump. U5 simplifies:

- **No notification channel is needed.** No external operator to warn, no acknowledgement to collect.
- The upgrade path is a **self-serve reinstall** of the 0.3.13 installer on the owner's machines.
- **Route-first still applies in full.** Verify `/api/relay/download/v16` by full GET with hash
  comparison *after* the merge deploys, before moving `MIN_RELAY_VERSION` 13 → 16. The rule exists so
  the owner does not strand themselves either.
- Still probe v13/v14/v15/v16/unknown/too-new after the bump, and still revoke the v15 tuple.

### Q16 → **There is NO vendor channel to CloakBrowser. Lane C is CLOSED.**

This is the decisive answer, and it should be recorded as a conclusion rather than a pending item.

With the custom-engine track already closed by the owner and no channel to the licensed vendor,
**nothing can move `G2-IDENTITY` from FAIL for this product shape.** Therefore:

- **Lane C is closed for this release and for this product as currently constituted.** Not "blocked",
  not "pending", not "waiting on vendor" — closed, with a reason.
- **MKTBrowser is a Lane A/B tool**: internal demo and controlled beta, synthetic or disposable data,
  one profile at a time, human login. It does not claim identity isolation, and the shipped UI copy
  already says so honestly.
- **Do not send a vendor request** — there is no channel to send it to. Record that fact instead of
  leaving an unsent draft implying one exists.
- The alternative-vendor shortlist in `reports/vendor-shortlist.md` becomes the **only** future path
  to Lane C. It is a future product decision with its own budget and owner, explicitly out of scope
  for this release.

**P6 and P7 must state this plainly.** The roadmap gets a closed Lane C with the reason and the named
future option. No date, no "coming soon", no implication that waiting will change it. This product
has repeatedly failed by promising what evidence denied; do not reintroduce that here at the very
last step.

## Absolute prohibitions

1. **Never commit the user's files.** MKTBrowser: `ChromiumBrowserDriver.ts`, `mcp-server/src/server.ts`,
   `types/src/index.ts`. MKTTool: `AGENTS.md`, `AGENTS.md.bak-260828`. Explicit-path staging only —
   never `git add .` or `-A`. If a file contains both run-work and user-work hunks, **stop and report**;
   do not split by guesswork.
2. **Never force-push, commit to a default branch, or rebase existing history.**
3. **Never disable a check to get past it.** A refusing provenance emitter is the system working.
4. **Never consume the CloakBrowser seat.** Seat refusal presents as **exit 76 after CDP is already
   serving** — do not misread it as a crash and retry, which burns it again.
5. **Route before floor**, always. Full GET, never HEAD.
6. **Never execute a rollback autonomously.** Escalate.
7. **Never overwrite an immutable object.** v15 and v16 in R2 keep their bytes forever.
8. **Never report a gate closed without the evidence its row demands.** Authority to act is not
   authority to declare.

---

## Note on observers

An external verifier watches this workspace on a 5-minute poll and checks claims independently. During
the previous run it twice misread an in-flight edit as a problem and once "repaired" a tree mid-write,
breaking it. If a file you are writing is disturbed, say so in the handoff and re-apply your change —
do not assume you made the error. Verification happens on outcomes, not on work in progress.
