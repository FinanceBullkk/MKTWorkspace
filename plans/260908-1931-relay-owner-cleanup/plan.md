# Owner Self-Service Relay Cleanup

## Scope

Allow a signed-in owner to finish cleanup of their own already-revoked Relay PC.
Keep active-device retirement, unpinning, and other-owner administration admin-only.
Preserve signed recipient proof, revocation, durable receipts, and exact local identity checks.
Web-only change, compatible with the unchanged Relay v16 installer. No production data reset.

## Phases

- [x] Diagnose: revoked local identity is retained and recovery actions are admin-only.
- [x] Implement server authorization, owner recovery controls, and Setup guidance.
- [x] Verify regression RED/GREEN, permission boundaries, typecheck, lint, and independent review.
- [x] Update documentation, commit/push/deploy scoped Web changes, verify exact deployment.
- [x] Confirm second-PC cleanup: owner reported success; production registry shows local cleanup confirmed.
- [x] Verify owner-reported fresh registration against the new active server record and ready operator key.

## Verification Rules

- Destructive database tests only on validated loopback `mkttool_test`, one process at a time.
- Avoid heavy builds while the disposable VM runs; do not close user applications.
- Local, hosted CI, deployment, and real-PC acceptance are separate evidence.
- Do not retire the developer host or identify a target by machine name alone.

## Local Evidence

- RED: backend 9 FAIL / 5 PASS; Setup state 2 FAIL / 29 PASS.
- GREEN: 226/226 tests across 23 files; validated localhost:5432/mkttool_test.
- Full-project typecheck and lint PASS; scoped 20-file secret scan and diff check PASS.
- Independent backend spec/quality and adversarial review: no findings.
- UI adversarial review found a P2: RSC row replacement can erase success-only next-step guidance.
  Added persistent conditional guidance on the completed row, with the named target PC; UI 17/17
  passed after the final correction. Full typecheck/lint rerun and reviewer confirmation PASS.
- Local full build deferred while the VM runs; Railway build is separate evidence.

## Delivery

- Code/tests: `52bda231f6747b0187a24fc98d2d3df50912698a`.
- Documentation / pushed HEAD: `5d059cd819f15f1793eaaea8e3124c48a697f09a`.
- Pushed `codex/relay-owner-cleanup`, then fast-forwarded `origin/master` from `8eb16f4`.
  Exact remote parity and clean MKTTool index/worktree verified; 20 intended files only.
- Prior production: `fe79312c-f1b0-4157-84ee-786690272eb1`, source `8eb16f4`, health ready.
- Railway `be16fbb6-1d02-4260-9290-8e2a90966976` is SUCCESS and active at exact pushed HEAD.
  External health: HTTP 200, ok/ready, database/releaseMetadata/R2 checks ok, Relay 16.
- CI `34228922771` SUCCESS: check, contracts, dependency-audit, deploy-verification PASS;
  relay-executable policy SKIPPED, not a binary pass. Secret scan `34228922665` PASS.
- Authenticated Setup and Relay PCs render after deployment. Cross-PC cleanup remains blocked.
- Owner reported successful cleanup on MSI; root reloaded the exact matched old record and observed
  Local cleanup confirmed while it remains revoked. No retirement action was clicked on the host.
  The owner subsequently reported fresh registration. Root verified a new active MSI record with
  a different device ID/public key, Relay v16 responded recently, operator key Ready, registered
  8 September 2026 at 20:01. No nicks are assigned yet; no automatic assignment was performed.
- End-to-end owner cleanup and fresh registration are confirmed by owner report plus live registry.
  Protected receipt deletion was not inspected on the physical disk; fresh identity creation is
  consistent with the existing fail-closed finalization protocol, not a direct filesystem audit.
- Hosted check suite and critical-coverage runs each report 2,097 PASS / 17 SKIP tests across
  226 PASS / 3 SKIP files. Skips remain recorded, never promoted to test or binary passes.
