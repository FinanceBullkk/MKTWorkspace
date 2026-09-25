---
title: "Cold-start, TLS, and profiles implementation gate status"
date: 2026-09-24
updated: 2026-09-25
status: no-go
scope: "Committed source repairs and local validation only; no replacement candidate acceptance"
---

# Cold-Start, TLS, and Profiles Gate Status

## Verdict

**NO-GO for release or operator rollout.** The source repairs and replacement candidate pins are
committed; clean source freeze, final Tool local validation and exact Relay provenance pass in
scope. Final Browser validation, skip adjudication, post-quality source binding and cleanup also
pass. Current results and immutable receipts are owned by the
[current checkpoint ledger](../../reports/checkpoint-260925-1335-candidate-backlog.md).
Historical receipts below remain unchanged and are not final-source acceptance.

## Current Source Freeze - 25 September 2026

| Repository | Frozen local commit | Tree |
| --- | --- | --- |
| MKTTool | `a32c293fc9a25c3d17873a31e9a5a62d711e2f3e` | `fd4b7a04d90b0aecb240bd846004de8a61335f01` |
| MKTBrowser | `67e8f16b35a3b8427cf5d5d98aebdc413eee2447` | `8820784941a838f5ca26387fde2608e396460e7e` |

Both product worktrees are clean. Tool `a32c293` normalizes all three delivered Windows scripts to
CRLF with BOM preserved; Browser `605e54b` includes the helper in source binding and updates the
unpublished archive pin. The development `js-yaml` 4.3.2 advisory fix, bootstrap readiness, terminal
update handoff, per-invocation receipts, known-folder cleanup and version-floor alignment remain
included. Focused Tool 25/25 and Browser 23/23, lint and diff checks pass. Browser `67e8f16` changes
only packaging test-file scheduling and README; the final official Browser rerun passes 8/8.
Tool, Relay bytes, dependency locks and mirrored runtime contracts are unchanged by that scheduling
repair. No push, Railway deployment, candidate upload or operator promotion is part of this checkpoint.

## Implemented Source Boundaries

Source review found these scoped repairs in the frozen commits:

- A local request timeout remains a timeout/pending condition; it is no longer presented as a
  confirmed permission denial.
- Browser profile inventory, create, and launch remain fail-closed on missing, stale, malformed, or
  failed local-install/readiness evidence. Profile and options failures retain safe code/stage data
  instead of becoming an invented empty success.
- Compatibility staging classifies writer I/O failures, cancels bounded work, and removes partial
  output. The Browser side verifies the owned wrapper and Relay executable, and starts Relay without
  inherited Node or TLS override variables.
- A staged compatibility update or rollback now closes its listener, awaits helper coordination,
  acknowledges the bootstrap parent, and exits. A coordination failure notifies startup failure and
  exits fail-closed instead of leaving a protected child alive.

These are source-level findings only. They do not prove a delivered SEA process, a live TLS chain,
or an installed Windows lifecycle.

## Current r2 Local Evidence

Tool `a32c293` passes quality 10/10 with 2,457 tests, zero skips and all coverage thresholds,
security 2/2, contracts 3/3, and Relay 5/5 (532 tests plus TLS fixture 12/12). The exact
production-origin rebuild matches archive/executable pins and commit metadata; packaged smoke and
direct-child TLS/handoff pass 3/3. These are local results, not installed/public-TLS acceptance.

The first Browser r2 gate fails the concurrent-wrapper fixture's unchanged 15-second watchdog
under cross-file PowerShell contention. Its receipt remains FAIL. The unchanged isolated pair
passes in about 9 seconds; the serial full packaging diagnostic passes 109 tests with one explicit
machine-test deferral, and the pair completes in 8.142 seconds. Browser `67e8f16` adds only
`--test-concurrency=1` to packaging test-file scheduling and updates README. Both wrappers still
run concurrently within their test; assertions and deadlines are unchanged. The official eight-stage
rerun at `r2/browser-quality-serial` passes 8/8 (receipt SHA-256
`e8d3281ce42550cd511d3b2a8db449303ed999c83c62f8437a7d1559d5775f24`). Its installer suite has
719 PASS and one opt-in machine skip; the dedicated machine gate passes 4/4 with zero skips.
`r2/browser-skip-adjudication-final.json` checks all eight command logs and covers both occurrences
of the same skip, including the build repeat, with zero unexplained skips (SHA-256
`d6e91fd1cd95440c3faa1125fa1e11f391d6d2c5a146c27db0173925ab1f7807`). The technical directory
package uses `includeRelay=false`; it is not a Windows installer or accepted replacement candidate.

Cross-repository binding `r2/source-binding-serial.json` passes for the final IDs (SHA-256
`077e2e8078a9dc2537c17e99b9de9ad6b416bef472548c2295a149aafe0de95f`). Post-quality verification
passes in `r2/source-binding-after-quality.json`; the original receipt is retained.

Owned-environment cleanup passes: task databases dropped, both disposable clusters stopped, no
fixture processes/listeners or tagged TLS certificates remain. Old fixture directories are moved
intact into evidence retention. `r2/cleanup-verification.json` SHA-256 is
`c36dbb5edbbbd8e2abca6d50e483570b3df0459cfce39ece2c8dcc600e3f44f6`.
The final `r2/verified-ledger.json` is PASS, SHA-256
`7d29ad9bbd124ac073085b8e66c1821342959c844675365570682c9bb13466b7`.
The [checkpoint ledger](../../reports/checkpoint-260925-1335-candidate-backlog.md) records command
hashes, historical failures and the complete diagnosis. This closes the source/local backlog only.

## Superseded Final-Source Attempt

At Tool `38b5ed0`, quality 10/10, security 2/2, contracts 3/3 and Relay 5/5 stages passed. The exact
production-origin rebuild retained the expected executable but produced a different ZIP because the
earlier `e749be84...7439ff` archive contained mixed LF/CRLF script bytes. Its immutable exact-artifact
receipt remains BLOCKED; entry-level diagnosis is linked in the checkpoint ledger. The normalization
repair changes frozen source, so those PASS receipts remain historical. The final r2 results above
now close local validation for the new source; no historical result is rewritten.

## Historical Local Evidence

| Gate | Verdict | Evidence |
| --- | --- | --- |
| Historical MKTTool Relay source runner | PASS (predecessor source only) | `D:\MKTWorkspace-local-artifacts\260924-relay-source-014c77d\receipt.json`: dependencies, Relay tests, Relay build, and Relay verification all passed (4/4) on `014c77d`; it is not a refreshed receipt for `b9dda84`. |
| Historical MKTTool isolated quality | PASS (predecessor source only) | `D:\MKTWorkspace-local-artifacts\260924-quality-source-014c77d\receipt.json`: all 10 required stages passed, including migrations, lint, typecheck, tests, critical coverage, and build; it is not a refreshed receipt for `b9dda84`. |
| Historical MKTTool source security | PASS (predecessor source only) | `D:\MKTWorkspace-local-artifacts\260924-security-source-014c77d\receipt.json`: secret scan and production dependency audit passed (2/2); it is not a refreshed receipt for `b9dda84`. |
| Historical MKTBrowser isolated quality | PASS for predecessor command execution; OPEN for acceptance | `D:\MKTWorkspace-local-artifacts\260924-browser-quality-6d13e8d\quality-receipt.json`: eight stages exited 0, including installer, machine-integration, typecheck, lint, and build. It applies only to `6d13e8d`; its receipt records `acceptance: OPEN` and `releaseReady: false`. |
| Historical focused regressions/review | PASS (predecessor source only) | Earlier current-session focused Relay/Browser tests and 9.7/10 review apply to `014c77d` / `6d13e8d`; they do not refresh the current Browser full suite. |
| MKTTool PostgreSQL contracts | PASS (local contract scope) | Fresh detached `b9dda84` checkout, Node `22.23.2`, PostgreSQL `16.12`, and the official runner passed dependencies, empty-database preflight, and restore/rate-limit contracts (3/3). Receipt: `D:\MKTWorkspace-local-validation\260924-b9dda-pg16-contracts-pg16-r1\receipt.json`; SHA-256 `c097a49e41636e3ff24f7980fab190cacd601552b55dbb705239cdf19757fc12`. The loopback disposable cluster was empty after cleanup and then stopped. |
| Historical repaired MKTTool SEA TLS and handoff | PASS (local diagnostic only) | Fixture-bound Relay v20 archive `cb2cf850d391c5bbc07730d4c67be284944ad760374c2f7237d10609eee3cc1c` and executable `9b1e252255f28f2c6befb4a203bfb51104487ec70b399e13e2fdb403238a48b6`: direct-child trusted/missing-intermediate/wrong-hostname flow 3/3, disposable SEA matrix 12/12, and packaged Relay smoke passed. A Global per-user-SID mutex serializes CurrentUser certificate fixture cleanup across Windows sessions. This is not a frozen or replacement artifact. |

## Retained Relay v20 TLS Diagnostic - 25 September 2026

The immutable v20 archive SHA-256
`9cc71eba405c8ea5ff9f288491ea0b827c7403b3c43541d1fa18c48a87126d69` and extracted executable
SHA-256 `dd05b68d97dc2e8689bb6966e34911a38297331742d29fb229366040d5d4199a` reaches the packaged
compatibility-update path. Its normal bootstrap parent correctly scrubs scoped TLS overrides, while
the direct test child accepts the scoped CA and stages the trusted set. The old byte set then fails
the terminal helper-lock handoff because it does not exit (`null !== 0`).

This is a **FAIL for the retained v20 diagnostic**, not a public-TLS or replacement-candidate result.
The separate repaired-source direct-child fixture passed trusted, missing-intermediate, and
wrong-hostname cases 3/3 after the handoff repair; it does not repair or replace the retained bytes.
Cleanup passed with no legacy fixture lock, tagged certificate, fixture or retained-case directory,
or Relay process left. The Global per-user-SID mutex release is attempted on every fixture creation
and cleanup failure path; a release failure is reported. Noninteractive system-store trust remains
BLOCKED; public TLS remains OPEN.

## Historical Installer Log Versus Newer Quality Evidence

`browser-test-installer-node22.log` is retained as an earlier negative installer log. Its recorded
88-test installer subrun ended **86 pass, 1 fail, 1 skipped**; the failed case was the standard-user
conflict inspection/owned-shortcut repair test. It is not erased, reclassified, or used as a current
PASS.

The later Browser quality receipt above is tied to `6d13e8d`, has eight exit-zero stages, and its
corresponding 88-test installer segment records **87 pass, 0 fail, 1 skipped**. That receipt still
sets `testSkips: NOT_EVALUATED`, `acceptance: OPEN`, and `releaseReady: false`. It supersedes neither
the historical failure nor the remaining product gates. The separate current focused 31/31 result
also does not adjudicate the full installer suite's intentional skip.

## Candidate And Release State

Historical Browser `0.3.24` / Relay `18` remains immutable and rejected for operator promotion.
The later `0.3.26` / Relay `20` candidate did pass eight local Browser quality stages and two
isolated builds with 129 matching normalized payload files. Its archive `9cc71eba...26d69`
failed terminal handoff; the retained installer and unpublished signed sequence-26 metadata are
historical evidence only, never inputs or approval for the replacement.

Current candidate `20260925-browser-0.3.27-relay-20-cold-start-tls-profiles-cft` pins repaired Relay
archive `c66a39353252ffa7b6ad9b936f5aad02634c729560f3b49793f4cbfe5b55526b` and executable
`630c134f879b253fa4174905604042d0b1f7089624cf045c57e883c744666b88`. The new ZIP is 35,123,164
bytes and the executable is unchanged. Final-source rebuild metadata, exact smoke/TLS and source
binding now pass for these retained inputs. The current checkpoint does not
start Browser installer packaging or VM acceptance.

| Replacement-candidate gate | Verdict | Reason |
| --- | --- | --- |
| Candidate identity and exact source pins | PASS (source selection only) | `0.3.27` / Relay `20` committed; failed archive explicitly forbidden. |
| Final Tool r2 quality, security, contracts and Relay gates | PASS (local scope) | Quality 10/10; security 2/2; contracts 3/3; Relay 5/5. |
| Final Browser eight-stage gate | PASS (local scope) | 8/8 at `67e8f16`; machine skips covered by dedicated 4/4; first r2 FAIL retained. |
| Commit-bound Relay rebuild, smoke and direct-child strict TLS | PASS (local scope) | Exact pins/commit match; TLS/handoff 3/3. Installed/public TLS remains separate. |
| Cross-repository source binding and cleanup | PASS (local scope) | Final IDs and post-quality read-back verified; owned fixture/database cleanup complete. |
| Public TLS behavior | OPEN | No independent replacement-candidate measurement. |
| Two isolated `0.3.27` Browser builds and payload equivalence | OPEN | Historical `0.3.26` comparison cannot validate replacement bytes. |
| Exact `0.3.27` installer and signed candidate metadata | OPEN | Not produced or accepted in this checkpoint. |
| Clean Defender-enabled VM cold path and lifecycle | OPEN | Exact replacement installer still requires the frozen matrix. |
| Real profile lifecycle and proxy failure/recovery | OPEN | New inventory/create/launch and controlled failure/recovery observations required. |
| Human permission, unfamiliar operator, second PC, seven-day canary | OPEN | Unobserved. |
| `G2-IDENTITY` | FAIL | Unchanged; profile-manager scope does not imply identity isolation. |

## Required Next Gates

1. Recheck host resources, then build Browser `0.3.27` twice from isolated inputs, compare payloads,
   retain one exact installer and sign metadata for those bytes.
2. Measure exact installed SEA/public TLS separately and run the cold-page/profile/lifecycle matrix
   in the clean Defender-enabled VM.
3. Preserve exact-tuple promotion approval and the separate human, second-PC and canary gates.

The original `/profiles` body is irrecoverable from later reproductions, so its original cause
remains unknown. This is a recorded baseline limit; capture the new candidate's safe code/stage
before asserting a new result.

## Unresolved Questions

1. What exact chain/cause does the packaged replacement SEA process report, and does public TLS
   behave independently as intended?
2. Does a replacement candidate meet every cold health deadline and preserve truthful pending
   behavior without test-harness prewarming?
3. Does the real installed profile lifecycle pass on the clean VM, then on an unfamiliar operator's
   second PC and the required canary interval?
