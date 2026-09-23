---
title: "Claude implementation handoff: Relay clean-VM blockers"
date: 2026-09-24
status: ready-for-implementation
---

# Claude Implementation Handoff

Implement the linked plan in `E:/MKTWorkspace`. Read `plan.md`, `reports/source-analysis.md`, and
each phase before editing. This is a repair task across MKTTool Web/Relay and MKTBrowser; do not
stop at another analysis-only report. Follow current workspace/repository instructions.

## Initial State

- OS: Windows, PowerShell, Asia/Saigon. Host has roughly 16 GB RAM; measure before heavy work.
- MKTBrowser: `81f3014821c471b583a37fae0dd001d0e10f59ce`, clean at planning inspection.
- MKTTool Web: `43b12a76b37d932b4e3ceb330e2897e4421b3b73`, clean at planning inspection.
- Frozen Relay: source `450975c0006d6804ea3b0044c25c4db77e8ee3d8`, Relay 18, Node v24.21.0.
- Rejected candidate: `20260922-browser-0.3.24-relay-18-fast-profile-reuse-cft`.
- Root dirty work includes `docs/licence-seat-retry-policy.md`, earlier plans/reports and logs.
  Preserve everything unrelated; recheck status before touching any file.
- Historical cleanup completed; old pilot fixtures/sessions are not reusable by assumption.
  VM was powered off in the terminal report; inspect current state before acting.

## Execute In Order

1. Prepare sanitized, bounded diagnostics and verify baseline hashes. Capture before asserting.
2. Repair cold health and timeout classification. Keep expensive install checks from holding the
   HTTP response; unknown/checking remains fail-closed. A timeout is not proof of missing permission.
3. Prove and repair TLS in the exact SEA process. Distinguish pilot trust from production TLS;
   correct fixture trust where sufficient. Never disable verification or bake pilot CA into a release.
4. Capture `/profiles` code/stage and repair the demonstrated cause. Preserve already available
   typed errors. Do not assume `no-capacity`, malformed input, or that every 400 is a server bug.
5. Run focused regressions, then final local release gates; freeze a new candidate and verify it
   through the normal page path on the restored clean VM. Keep all acceptance categories separate.

The full file map, tests, proposed budgets, decision branches and success checklists are in the
phase files. Update phase status through `ck plan check` / `uncheck`; do not mark a repair done
because only a mock/source test passes. Record causes/commands/artifacts in this plan's reports.

## Important Constraints

- A larger global Web timeout alone is not an accepted fix. Preserve existing 4,000 ms default
  while making health responsive and giving pending/timeout states correct meaning.
- GET diagnostics/readiness may be coalesced; state-changing ticket/engine/profile calls must not
  acquire automatic retries. Existing mutation reconciliation behavior must survive client changes.
- Do not replay the failed update ticket. A fresh attempt needs fresh authorization and current
  protected-state/smoke-profile reconciliation, even though the prior transition never started.
- No logged secrets, raw bodies, auth headers, signed URLs, proxy values or raw engine errors.
- Do not weaken local install ownership, CORS, same-device binding, TLS, signature/hash, revocation,
  sequence/floor or licence checks. No schema migration, engine migration or fingerprint research.
- Keep historical candidate/receipts intact. Independent build comparison and new exact-installer
  acceptance apply to any replacement payload; old PASS results do not certify new bytes.
- MKTTool master push deploys Railway automatically. Follow standing authorization and required
  quality/deployed-SHA checks; report deployment separately. Operator promotion retains the
  explicit exact-tuple approval gate. Do not add redundant approval checkpoints for ordinary fixes.
- ACPI is separate cleanup work. Use the bounded guest SYSTEM shutdown fallback; do not spend
  the product repair loop repeatedly retrying ACPI or hard-powering-off the VM.
- Human prompt, second-PC, browser-page proxy/DNS/WebRTC and canary evidence remain OPEN when
  unobserved. `G2-IDENTITY=FAIL` and the profile-manager-with-proxy-binding boundary remain intact.

## Completion Report

For each issue give: reproduced cause, files changed, regression result, packaged/VM result and
receipt paths. Then give exact commits, push/deploy status, candidate hashes and any publication
actions. End with remaining OPEN/FAIL/BLOCKED gates and the concrete next step for each.

## Start Command

```text
/ck:cook --auto E:/MKTWorkspace/plans/260924-0114-relay-cold-start-tls-profiles/plan.md
```

If the Claude session lacks ClaudeKit, implement the same phases directly; the files are the
handoff contract. Do not run two agents editing the same readiness/contracts files concurrently.
