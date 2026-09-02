# Independent verification — consolidation run, 2026-08-30 08:49–13:20

**Role:** external verifier. Claims below were checked against git, the live service, and GitHub
Actions — not taken from Codex's self-reported evidence.
**Verdict:** **no fabricated evidence found.** Lane A shipped to production. Four gates remain
honestly OPEN.

Companion to [the first run's verification](./verification-260830-0430-codex-autonomous-run.md).

---

## 1. Independently verified

| Claim | Method | Result |
|---|---|---|
| 105 uncommitted files landed | `git log`, `git status` | 16+ commits across two repos; both trees clean but the owner's files |
| Owner's 4 protected files untouched | `git log` on each path, across the whole branch | **Zero commits touched them** until Q14 authorized one dedicated commit |
| Q14 commit done correctly | `git show 1decde4` | Exactly 3 files, verbatim message, attribution line intact |
| `AGENTS.md` never committed | `git log` guard, ran every 5 min for 4.5 h | Never fired |
| Commits are coherent, not just staged | Codex ran `npm test` | 215 files, **1,958 tests**, 0 failed, 0 skipped (baseline was 1,922) |
| CI genuinely gates | GH Actions | Run `33291209847` **failed** on two new jobs, then `33292005382` passed. A gate that has failed is a real gate. |
| Master deployed | `git rev-parse origin/master`, live GET | `6ce28d0`, three successive successful deployments recorded |
| Production healthy | Live `GET /api/healthz` | `200 {"ok":true,"status":"ready","database":"ok","releaseMetadata":"ok","r2":"ok","relayVersion":16}` |
| `/v16` serves the right bytes | Codex's authorized full GET | 33,342,752 B, SHA `5c98cf46…1842e` — **identical to the hash I computed at 01:52 the previous night** |
| Floor not moved | `grep MIN_RELAY_VERSION` | Still **13**, correctly, pending owner-machine observation |
| Engine track closed on evidence | Read the closure record | Post-reboot RAM peaked at **8.231 GiB of 15.924**, against a >12 GiB gate — not marginal, genuinely short |
| Temp script left no secret | `grep` for embedded credentials | Token read from env, never inlined; script deleted, never committed |

**The artifact chain now runs end to end in production:** built 01:52 → published to R2 → pinned →
embedded in the installer → served live by the deployed service. Same SHA at every link.

---

## 2. What shipped

Lane A — MKTTool Web/Facebook — is deployed and healthy. Concretely:

- Fail-closed spent-ticket journal (fsync + atomic rename + typed errors), Relay v16
- Database-backed rate limiting, proven in production: 101 requests → 100×200 + 1×429, client B in
  its own bucket, **zero shared-IP warnings** in the deployment logs
- Trusted-proxy resolution via `TRUSTED_PROXY_IP_HEADERS=x-real-ip`
- Unauthenticated `api/healthz`, wired to Railway's `healthcheckPath`
- `deepmerge-ts` HIGH resolved by locked override to 8.0.2; `npm audit` clean
- Backup + a restore verifier that did not previously exist, proven against production data
- CI enforcing every one of the above, with machine-readable `PASS/FAIL/OPEN/BLOCKED/SKIPPED`

---

## 3. Judgment calls Codex got right

- **Refused to fabricate the five-artifact tuple** when the engine archive was missing. That refusal
  exposed a flaw in my plan, not in its execution.
- **Refused to move the floor** — `/v16` was unreachable pre-deploy, and after deploy the owner's two
  machines still have not been observed on v16. Route-first held both times.
- **Recorded a partial download honestly.** The authorized `/v16` GET took two attempts; the first
  transferred 27,286,912 of 33,342,752 bytes and ended early. Both attempts are in the evidence.
- **Did not round 103 bytes up to "reproducible."** Installer reproducibility stays OPEN.
- **Proved its own normalizer honest** — planted one byte in `app.asar`; the comparison failed with
  exactly one reported difference and no widened exclusion.
- **Labelled rather than deleted.** Superseded S3 manifests, the predecessor plan, the old brief, and
  both of my verification reports carry banners; none had its findings altered.
- **Qualified its own rate-limit evidence**: *"proves the configured header resolves separate
  buckets… not two physical networks."*
- **Fixed my document, not just its own.** My `decisions.md` had become self-contradictory through
  incremental edits; Codex added a precedence banner naming the five conflicts rather than acting on
  a stale row.

---

## 4. Verifier errors (mine)

- **Reported the packaging delta as 130,560 bytes.** That was the *span* of the mismatch region; the
  actual differing bytes are **103**. Corrected the same session.
- **Wrote a Phase 4 that coupled Lane A to the Browser five-artifact tuple.** The web service never
  needed the engine archive, and `railway up` was never the deploy path — `ci.yml:235` says
  *"Railway deploys from master, so merging is deploying."* Codex hit the wall; I removed it.
- **Let `decisions.md` accumulate contradictions** by appending dated sections without retiring stale
  rows. Codex resolved it with a precedence banner.
- **Monitors die on session restart.** Twice the watch was silently down. Ask before assuming
  something is being watched.

---

## 5. Open gates — honestly recorded, not hidden

| Gate | State | Who clears it |
|---|---|---|
| **P4-09 rollback rehearsal** | Never executed. Tuple recorded, backup and restore proven, but the procedure has never been run. | Codex, unblocked — **the most valuable remaining task** |
| **P5-03 floor `13→16`** | Blocked on observing the owner's two v15 machines report v16 | **Owner** — reinstall 0.3.13 on both |
| **P4b Browser five-artifact tuple** | OPEN — Stable `.2` engine archive absent from both drives | Vendor; no channel exists |
| **Lane C** | **CLOSED.** No CloakBrowser channel, custom-engine track closed on measured RAM. | Reopens only on new hardware >16 GiB or a different vendor |
| U2 Browser runner, U3 outer installer | OPEN, documented | Codex |

An untested rollback on a live production service is the sharpest of these. It is cheap to close
now and expensive to discover during an incident.

---

## Follow-up items (not blockers to the verified merge)

1. **Resolved:** the docs-only consolidation branch was merged under Q13. PR #42 landed on `master`
   at `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`; the post-merge CI run `33297347911` passed its
   required jobs and Railway deployed `ed972e5b-7597-4c6d-8066-24bc11c4ea0b` successfully.
2. The 60-day unsigned-installer exception (expiring ~29 October 2026) still needs a named owner;
   this is an owner follow-up, not evidence of a signed release.
3. **Resolved/documented:** `healthcheckTimeout: null` intentionally inherits Railway's bounded
   300-second deploy-time default; `healthcheckPath=/api/healthz` is set and the endpoint returned
   200 in the final verification. See the dated timeout decision in the consolidation plan.

---

## Reconciliation after this snapshot — 30 August 2026, 15:30 ICT

This report's open-gate table is a point-in-time snapshot, not the latest status. Since its capture:

- P4-09 was executed as a disposable rollback rehearsal and is now qualified PASS; the prior-image
  `/api/healthz` mismatch is recorded as an owner prerequisite. No production rollback occurred.
- The Windows Node 22 runner repair was proven remotely in `33301446012`; the remaining U2 failure is
  the private MKTTool sibling checkout, with package jobs correctly skipped.
- P3-06 twice-build comparison enforcement was wired and the manifest was set to OPEN with the
  measured 103-byte `NSIS-RT_DIALOG-order-and-trailer` residual.

The current source of truth is
`plans/260830-0830-consolidation-and-lane-a-release/handoffs/final-20260830-closeout.md`.
