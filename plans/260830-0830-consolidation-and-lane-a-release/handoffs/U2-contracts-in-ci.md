# Handoff U2 — Contracts in CI
Date: 2026-08-30T16:05:00+07:00 | Phase: 2 | Status: COMPLETE (MKTTool + Browser)

## Superseding closure update — 2026-08-30 16:05 +07:00

The Browser runner permission boundary was resolved for this release branch and the complete
matrix was rerun. Run `33303002259` (rerun attempt 2, source `b9f9477`) passed all three jobs with
no skip: `windows / quality` (`99236866638`, 4m33s), `windows / package` (`99236871618`, 6m17s),
and `windows / packaged-contract` (`99236855958`, 4m01s). The packaged contract completed five
cold launches; timings were 8592/6987/6980/6902/6909 ms. Node `v22.23.2` was invoked through the
absolute pinned executable and the sibling MKTTool checkout succeeded.

The first attempt on the same source had one transient 90-second MCP timeout after two successful
iterations; it is retained as failure evidence. The retry passed without weakening or skipping the
verifier. Full hashes, job IDs, and the timeout signature are in
`../reports/u2-browser-run-33303002259.md`.

U2 is therefore closed for this release branch. A temporary repository-read secret used for the
retry was deleted immediately afterward; future runs without an equivalent reviewed credential
remain fail-closed.

## Done

- MKTTool's new safety contracts are wired into CI: PostgreSQL restore/rate-limit contracts, secret
  scan, Relay executable/replay verification, lint/typecheck/test/build, and deploy verification.
- Consolidation branch run `33292005382` passed the required MKTTool jobs. PR #42 run `33296599912`
  and final post-merge `master` run `33297347911` also passed all applicable required MKTTool jobs;
  skipped conditional jobs remain skipped, not passes.
- Source-level negative tests cover malformed/under-floor tuples, one-seat limits, trusted-proxy
  handling, and version coherence. The earlier `33291209847` failure is retained as diagnostic
  history and was fixed by the later CI commits.

## Evidence written

- `../phase-02-enforce-contracts-in-ci.md` — gate matrix and exact run IDs.
- `../reports/p4a-postdeploy-evidence.json` — sanitized branch/master CI evidence used by P4a.
- `../reports/u2-browser-run-33303002259.md` — complete Windows Browser matrix, hashes, timings,
  and retained transient-failure signature.
- MKTTool commits `5c6c3af`, `25af07f`, `9863fe2`, and `35b977b` — explicit CI contract changes.

## NOT done / deliberately skipped (historical baseline; superseded where noted above)

- The original MKTBrowser runs `33296202751` and `33291356306` failed before quality tests because
  the self-hosted Windows PowerShell shell could not resolve `node` after setup; package/
  packaged-contract jobs were skipped. The repair is proven by the setup/pin steps in
  `33301446012`, but that run fails closed at the private MKTTool sibling checkout and the package
  jobs remained skipped in those historical runs. The permission contract was closed by the
  successful rerun above; those runs remain failure history, not promotion evidence.
- A separate scratch-branch negative matrix for every contract has not been run; this is a Phase 2
  bookkeeping item, not a runner-resolution blocker.

## State the next session must know

- MKTTool release branch `release/consolidation-20260830` is at
  `e6a55ee402d86f9c8528734c5232d4f02210008a`; `master` contains merge
  `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`.
- MKTBrowser release branch is `release/consolidation-20260830` at
  `b9f9477`; the complete Windows matrix is recorded by run `33303002259` (attempt 2).

## Decisions still owed by the owner

- None. Q13–Q17 are answered. Any runner repair/retry must preserve the explicit OPEN qualification.

## Next unit

U3 — retain the measured 103-byte outer-installer variance as OPEN; then reconcile U7 documentation.

## U2 runner repair — 2026-08-30 15:20 +07:00 (historical; closure update above controls)

The retained Browser runs `33296202751` and `33291356306` both failed in the first quality job at
`Record MKTTool checkout status`: the self-hosted Windows PowerShell process reported that `node`
was not recognized. `Setup Node.js 22` was ordered after that step, so package and
`packaged-contract` were skipped. These runs remain FAIL/OPEN evidence, not promotion evidence.

The repair is committed and pushed on the MKTBrowser branch (`ceafe30`, followed by the explicit
cross-repository ref fix `6d737f8`). It is limited to the Windows pipeline and its native-dependency
helper:

- `.github/workflows/windows-pipeline.yml` now provisions Node 22 before any status step, captures a
  verified absolute executable, invokes all direct Node/Corepack calls through that path, and
  persists its directory through `GITHUB_PATH` for Yarn/native child processes.
- `.github/scripts/prepare-windows-node22.ps1` validates major 22, prefers the setup-node toolcache
  (with a fallback for a lost action-managed PATH), records `MKT_BROWSER_NODE22_EXE`/`NODE22_BIN`
  and the bundled Corepack entrypoint in `GITHUB_ENV`, and logs the executable SHA-256.
- `.github/scripts/prepare-windows-native-dependencies.ps1` reads ABI/platform/architecture from
  `MKT_BROWSER_NODE22_EXE`, refusing an unpinned or missing runtime.

Local validation: PowerShell parser PASS; helper exercised with downloaded Node `v22.14.0` both on
PATH and via toolcache fallback, including bundled Corepack `4.5.0`; the full
`runtime-contract.test.ts` passed `23/23` under Node 22. The host's default Node `v24.14.1` was
deliberately not used for Browser tests because its ABI `137` conflicts with the reviewed
`better-sqlite3` ABI `127`.

The first post-repair remote rerun was `33301294829` (commit `b543d7c`) and exposed a separate
cross-repository permission failure before the contract jobs could run. The follow-up with an
explicit `ref: master` was `33301446012` (commit `6d737f8`): `Setup Node.js 22` and `Pin Node.js 22
executable` both passed, proving the original Node-resolution defect is repaired. The MKTTool sibling
checkout still returned `repository not found` for the private repository under the MKTBrowser
workflow token; its required `mkttool-sibling-checkout` gate emitted `OPEN`, so the quality job
failed closed and package/packaged-contract remained skipped. No release token was repurposed as a
GitHub credential. At that time Browser U2 therefore remained OPEN at the external repository-read
permission boundary; the run is real failure evidence, not a promotion pass. The superseding closure
update above records the later successful matrix.

Exact remote signatures:

- `33301446012` / `windows / quality` — `Checkout MKTTool sibling...` was marked `success` only
  because the step is `continue-on-error`; its outcome was `failure` after `fatal: repository
  'https://github.com/Techieslab-app/MKTTool/' not found`. The required status helper then emitted
  `{"gate":"mkttool-sibling-checkout","status":"OPEN",...}` and exited 1.
- `33301446012` — `package` and `packaged-contract` were `skipped` by their existing required
  dependency on the failed quality job. This is intentionally retained as OPEN, not relabelled.

Owner action to close U2: grant the workflow a read-only GitHub credential for the private MKTTool
repository (or provide an equivalent reviewed checkout/artifact), then rerun the same branch matrix.
The existing `MKTTOOL_RELEASE_TOKEN` is scoped to the release download route and was not used as a
GitHub credential.

> **Superseded by the closure update above.** That owner action was the pre-rerun state. The
> temporary read credential was supplied for run `33303002259`, the matrix passed, and the temporary
> secret was deleted. The standing future-run requirement remains fail-closed reviewed access.
