# Decisions — read this instead of asking

> **Historical predecessor authority — superseded 30 August 2026.** The rows and pending actions in
> this file predate Q13/Q14/Q15/Q16 and the P4a correction. Current authority is the successor
> `plans/260830-0830-consolidation-and-lane-a-release/decisions.md`: P4a Web is independent of the
> Browser tuple, both v15 devices are owner machines with self-serve migration, Q14's files are
> committed, and Lane C is **CLOSED** because no CloakBrowser channel exists. Retain this file for
> historical evidence; do not execute its old vendor, notification, deploy, or owner-gate steps.

**Authority record (2026-08-30):** the workspace owner has delegated full decision authority,
including R2 publication and Railway deployment, to the reviewing agent. Decisions below marked
AUTHORIZED carry that delegation. The workspace owner remains the accountable human and the sole
rollback approver; the delegation covers technical judgment and execution authorization, not
accountability.

Answers to the question batch in `codex-orchestration-brief.md`. Three tiers. Obey the tier.

- **DECIDED / AUTHORIZED** — settled. Proceed. Do not re-ask. Where preconditions are listed, they
  are hard gates: the authorization is void until every one is satisfied and evidenced.
- **PROPOSED** — work on it, build everything around it, but do **not** close the gate until
  confirmed in writing. Record the gate as OPEN meanwhile.
- **EXTERNALLY BLOCKED** — not an authority problem. These need a human's hands, a vendor's reply,
  or physical hardware; no signature unblocks them. The "keep working by" column says what to do.

---

## DECIDED — proceed on these now

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | MKTBrowser join key | **`3f37653`** (branch `feat/installed-contract-on-clean-runner`) | It is HEAD; the only gap to the audit's `6d1b0a2` is `3f37653 docs(release): record internal beta candidate`, docs-only. Freezing at HEAD avoids explaining a one-commit gap in every later manifest. Record the reasoning in the ledger. |
| 2 | `MIN_RELAY_VERSION` 13→16, single jump or staged? | **Single jump `13 → 16`.** | A staged `13 → 15` buys nothing: v15 is itself the vulnerable version. One coordinated migration, one probe matrix. |
| 3 | Does the floor bump happen at all in this release? | **Yes — it is a required P2 deliverable.** | Leaving the floor at 13 means vulnerable v15 relays keep receiving tickets and the entire replay fix ships inert. If the bump cannot be executed, that is a P2 FAIL, not a silent deferral. |
| 4 | Rate-limit storage: memory or durable? | **Database-backed (Better Auth DB storage).** | P5 already touches Prisma schema and migrations, so the marginal cost is small, and it removes the expiring-exception bookkeeping entirely. Memory resets on every Railway restart. |
| 5 | Prisma / `deepmerge-ts` HIGH | **Try a locked npm override to `deepmerge-ts >=8` first.** Exercise `prisma generate`, migrations, build, startup, and normal API traffic. If the CLI breaks, fall back to a time-bounded risk acceptance with reachability analysis, compensating controls, owner, and expiry. | The call path is developer-controlled config parsing, not request JSON — but the advisory is real and "not exploitable" is not yours to declare. Do not report the system as secure while it is open. |
| 6 | Browser candidate version | **`0.3.13`.** | Relay bytes and the UI contract both change. Never reuse `0.3.12` metadata. Add the version-coherence test across root / desktop / release manifest / UI. |
| 7 | Node version for builds | **Node 22 exactly.** Machine default is v24.14.1 — switch before any build. | `MKTBrowser/scripts/verify-node-version.cjs` throws unless major === 22. Package manager is `yarn@4.5.0` via corepack. |
| 8 | Where evidence goes | `plans/260829-2125-internal-product-readiness/reports/` for evidence, `handoffs/` for handoffs. Sanitized always. | Matches the plan's Related Code Files entries. |

Ordinary engineering choices — file layout, script structure, test naming, harness shape, how to
organise a runbook — are **yours**. Make them and move on. Do not ask.

---

## AUTHORIZED — you may execute these; preconditions are hard gates

| # | Action | Authorization | Preconditions — ALL must be evidenced first |
|---|---|---|---|
| 9 | **Publish `/v16` to R2** | **GRANTED.** | P2-03 archive/EXE hash binding PASS; P2-05 restart replay `spentTicketRejectedAfterRestart=true`; P2-06 fresh ticket PASS; P2-07 crash recovery PASS; P2-08 journal corruption matrix fail-closed; P2-13 durable-write PASS. Publish with `If-None-Match: *` and perform full byte/hash read-back. If read-back mismatches, stop — do not retry with different bytes under the same key. |
| 10 | **Raise `MIN_RELAY_VERSION` 13→16 on the deployed server** | **GRANTED.** | `/v16` published and reachable (verified by real GET, not HEAD); P2-11 fleet inventory of v13/v14/v15 devices complete; update path tested; revocation of vulnerable bytes in place. Route first, floor second — never the reverse. |
| 11 | **`railway up --service mkttool-web`** | **GRANTED.** | `db:backup:remote` run AND `db:restore:verify` passed against a disposable Postgres (P5-01, P5-02); rollback tuple recorded in the manifest — source SHA, migration state, deployment ID `3621f603-1c51-4246-824c-55cc0e6b5764`, rollback commit `c819e6a8`; `healthcheckPath` configured to the new `api/healthz`; signed P4 tuple exists. Run `railway status` immediately before and after; never a bare `railway up`. |
| 12 | **G2-IDENTITY thresholds** | **SET — these are the numbers. Measure against them; do not renegotiate after seeing results.** | Sample: **3 disposable profiles × 5 runs each**, sequential and interleaved, one host, independent routes. **Repeatability:** a profile must reproduce its identical full-surface tuple in ≥4 of its 5 runs; a surface that drifts within one profile is a FAIL, not noise. **Separation:** zero identical full-surface tuples across any profile pair, AND per-surface — font list, `OfflineAudioContext` fingerprint, and WebGL parameter hash must each differ across all three profiles. A shared WebGL renderer string across profiles is itself the failure mode already observed on 27 Aug; it does not get a same-GPU exemption. **Coherence:** UA major, screen dimensions, timezone, and locale mutually consistent and consistent with the assigned proxy country. **Decision rule: any per-surface collision on any profile pair = FAIL.** Binary. No percentage score, no partial credit. |
| 13 | Signing posture | **DECIDED.** Unsigned internal-only exception for Lane A/B, expiry **60 days from the S3 build date**. Authenticode remains a hard prerequisite for Lane C. | Write the exception document with distribution allowlist, SmartScreen SOP, and incident owner. Operator names come from the owner; leave those rows blank. |
| 14 | Release authority roles | **DECIDED.** The workspace owner is release owner, security approver, and sole rollback approver. The reviewing agent holds delegated technical approval. | Record both in the ledger. Rollback is the one action that always returns to the human — never execute a rollback autonomously, escalate it. |

---

## EXTERNALLY BLOCKED — no signature unblocks these

Full authority has been granted and these are still blocked. That is not caution; it is that each
one needs a human's hands, a vendor's reply, or hardware that does not exist on this machine. Do not
wait on them and do not simulate them.

| # | Blocked item | Why authority does not help | Keep working by |
|---|---|---|---|
| 15 | **Vendor channel to CloakBrowser** | No one here can send a vendor email or know whether a commercial relationship exists. This is the only lever that can move `G2-IDENTITY`, and it is unavailable. | Draft the request fully — sanitized 27 Aug collision evidence, the precise question about per-profile isolation of fonts / audio / WebGL, channel, date. Leave it ready to send. **Lane C stays blocked with no date.** |
| 16 | **Two disposable proxy/profile pairs, vendor test entitlement, clean second PC** | Physical hardware and paid services. Cannot be conjured. | Prepare everything S5 needs — probe scripts, runbooks, evidence templates, exact command sequences, and a checklist of what a person must physically do. Hand over ready-to-run. |
| 17 | **Human first login / typing (G1)** | The plan explicitly forbids credential, OTP, and CAPTCHA automation. A human must be at the keyboard. Automating it would violate the gate it is meant to prove. | Prepare the operator script and attestation template. Leave G1 OPEN. |
| 18 | **Real power-off/power-on (G3-RECOVERY)** | Requires physically cutting power to a machine. | Prepare the harness and the checkpoint assertions. Leave the gate OPEN. |
| 19 | **7-day canary with human operators (P8)** | Needs people and a calendar. | Prepare metrics schema, daily checklist, stop-condition runbook, and rollback drill. Do not fix dates until S4a reports. |

---

## Absolute prohibitions — these override the authority grant

1. **Never remove a tracked source file without a replacement in the same edit.** Rewriting a file
   in place is normal and expected — including delete-then-write. What is forbidden is leaving a
   tracked file absent while something still imports it.

   *Incident, 2026-08-30 01:34–01:36:* external monitoring sampled the tree during an in-flight
   rewrite of `MKTTool/relay/src/spent-ticket-journal.ts`, misread the transient deletion as an
   accident, and restored the HEAD version over it. The HEAD version lacks
   `ensureSpentTicketJournal()`, which `relay-identity.ts:23,54` had already been updated to call,
   leaving a dangling import. The restore was the error, not the rewrite. **Already resolved** —
   the rewrite was re-applied at 01:38 (`ensureSpentTicketJournal` at line 255, typed
   `SpentTicketJournalError`, marker file, atomic write path). No action needed; do not redo it.

   Lesson for observers: verify outcomes, not in-progress states. A file missing for a few seconds
   during an edit is not a deletion.
2. **Never touch the one free vendor seat carelessly.** `CLOAKBROWSER_LICENSE_KEY` is live in the
   shell. Prove the seat is free before engine work; never run two engine-touching processes at
   once. Seat refusal looks like **exit 76 after CDP is already serving** — do not misread it as a
   crash and retry, which burns the seat again.
3. **Never execute a rollback autonomously.** Escalate to the human. Rolling back is the action
   where being wrong is least recoverable.
4. **Never overwrite an immutable object.** v15 in R2 keeps its bytes forever.
5. **Never report a gate as closed without the evidence its row demands.** Authority to act is not
   authority to declare. An honest OPEN is always acceptable; a false PASS never is.

---

## Correction — restore-verify checksum sanitization (LOW, fix on next run)

The local-only `reports/restore-verify-20260830-r4.json` receipt is otherwise excellent work and the
gate PASSES; see `reports/restore-verify-receipt-redaction.md` for why that raw file is not committed.
One fix:
per-column MD5 at low row counts is a per-value hash, not an aggregate. At `rowCount = 1` the
checksum for `Account.username`, `Account.emailAddress`, `Proxy.username`, `ObserverProxy.username`,
and `User.email` (2 rows) is a confirm-the-guess oracle for low-entropy identifiers. Encrypted and
token columns are high-entropy and fine.

Fix: salt the checksum per run — `md5(runSalt || value)` with a random `runSalt` that is generated
in memory, used for both source and target, and **never written to the evidence file**. Comparison
still works (same salt both sides); the oracle disappears. Alternatively suppress column-level
checksums when `rowCount < 5` and compare only row counts for those tables.

Regenerate the evidence with the fix; the old file may be replaced in place.

## Housekeeping — `node_modules.bak-20260830-023658` (LOW)

Backing up `node_modules` before the `deepmerge-ts` override attempt was sensible. Two notes:

- It is **0.79 GB and not gitignored** — `git add .` would stage it. Either add
  `node_modules.bak-*` to `MKTTool/.gitignore`, or delete the backup once the override outcome is
  decided. Do not commit it.
- E: has ~25.8 GB free. Fine for now; keep it in mind before S3 packaging.

Keep the backup until the Prisma/deepmerge decision is settled — it is the rollback path.

## Manifest drift — fix now (MEDIUM)

`reports/release-manifest.json` still reads `relay.publishStatus: "NOT_AUTHORIZED"` while
`reports/relay-v16-evidence.json` reads `r2Version16Published: true` and `/v16` is in fact published
with a verified full-GET read-back. The manifest is the join key of record; it must never contradict
the evidence it joins.

Update the manifest to reflect reality: `publishStatus: "PUBLISHED_READBACK_VERIFIED"`, and fill
`relay.archiveSha256` = `5c98cf46…1842e`, `archiveSizeBytes` = 33342752,
`exeSha256` = `300646e1…b60e`, `exeSizeBytes` = 87987200. Keep `deployStatus: "NOT_AUTHORIZED"` —
that one is still true until the S4b preconditions are met.

Route-first status verified independently at 02:57: `/api/relay/download/v16` → 401,
`/api/relay/download/v15` → 401 (protected-route behaviour, not a missing object),
`/api/healthz` → 404 (old deployment). Refusing the floor bump was correct.

---

## Hard boundary, restated

`CLOAKBROWSER_LICENSE_KEY` is live in this machine's shell environment and there is **one free
seat**. Any script that reads it hits the real vendor. A seat refusal appears as **exit 76 after CDP
is already serving** — indistinguishable from a crash at a glance. Before any engine work: prove the
seat is free, and never run two things that touch the engine at once.

If you are ever unsure whether an action is DECIDED or OWNER-ONLY: if it changes something outside
this machine — R2, Railway, the vendor, a real account — it is OWNER-ONLY.
