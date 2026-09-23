---
title: "Cold-start, TLS, and profiles implementation gate status"
date: 2026-09-24
status: no-go
scope: "Committed source repairs and local validation only; no replacement candidate acceptance"
---

# Cold-Start, TLS, and Profiles Gate Status

## Verdict

**NO-GO for a replacement candidate, publication, or operator rollout.** The source repairs and
their local validation pass. They do not prove the exact packaged Relay TLS path, a fresh candidate,
or the required VM and rollout behavior.

## Source Freeze

| Repository | Frozen local commit | Source status | Remote status at inspection |
| --- | --- | --- | --- |
| MKTTool | `014c77d7cd2ae4fb1630e53c94012bca013be316` - `fix(relay): harden cold-start profile contracts` | PASS | `master` is one commit ahead of `origin/master`; not pushed |
| MKTBrowser | `6d13e8db4502bf68fe4d21e229d270e5eb81878c` - `fix(installer): harden relay cold-start ownership` | PASS | `main` is one commit ahead of `origin/main`; not pushed |

No push, deployment, publication, new candidate allocation, or candidate upload occurred in this
Cook run. In particular, MKTTool `master` was not pushed, so no Railway deployment is attributed
to these commits.

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

These are source-level findings only. They do not prove a delivered SEA process, a live TLS chain,
or an installed Windows lifecycle.

## Local Evidence

| Gate | Verdict | Evidence |
| --- | --- | --- |
| MKTTool Relay source runner | PASS | `D:\MKTWorkspace-local-artifacts\260924-relay-source-014c77d\receipt.json`: dependencies, Relay tests, Relay build, and Relay verification all passed (4/4) on `014c77d`. |
| MKTTool isolated quality | PASS | `D:\MKTWorkspace-local-artifacts\260924-quality-source-014c77d\receipt.json`: all 10 required stages passed, including migrations, lint, typecheck, tests, critical coverage, and build. |
| MKTTool source security | PASS | `D:\MKTWorkspace-local-artifacts\260924-security-source-014c77d\receipt.json`: secret scan and production dependency audit passed (2/2). |
| MKTBrowser isolated quality | PASS for command execution; OPEN for acceptance | `D:\MKTWorkspace-local-artifacts\260924-browser-quality-6d13e8d\quality-receipt.json`: eight stages exited 0, including installer, machine-integration, typecheck, lint, and build. The receipt explicitly records `acceptance: OPEN` and `releaseReady: false`. |
| Current Cook focused Relay regression | PASS | Current-session tester result at `014c77d`: `npm run test:relay -- handle-profiles relay-antidetect relay-http-server local-updater` passed 67/67 in 2.85s. This is session evidence, not a receipt artifact. |
| Current Cook focused Browser regression | PASS | Current-session tester result under Node `22.23.2`: `node --experimental-strip-types --test src/main/windows-local-install-inspector.test.ts src/main/runtime-contract.test.ts` passed 31/31, 0 skipped, in 203.8ms. This is session evidence, not a receipt artifact. |
| Current Cook source review | PASS - source-only approve | Current-session review: 9.7/10, no confirmed blockers. It did not review a new installer, SEA launch, VM, public TLS, or rollout. |
| MKTTool PostgreSQL contracts | BLOCKED | The required disposable PostgreSQL 16 service is unavailable: the host `psql` is 17.10 and the Docker daemon is not running. No mock or substitute result is counted. |

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

The historical Browser `0.3.24` / Relay `18` candidate remains immutable, rejected for operator
promotion, and not reused. The repairs changed source, so its prior installer/artifact evidence
cannot stand in for a replacement. No new Browser/Relay/sequence identity, version metadata, exact
checksum/size pins, signed candidate metadata, retained installer, or publication record exists.

| Replacement-candidate gate | Verdict | Reason |
| --- | --- | --- |
| Fresh tuple, version, sequence, and exact pins | OPEN | Not allocated; historical `0.3.24` / Relay `18` bytes are preserved rather than reused. |
| Exact packaged SEA TLS acceptance and strict invalid-chain refusal | OPEN | No replacement SEA process or scoped chain test was run. Historical pilot TLS failure remains retained evidence. |
| Public TLS behavior | OPEN | Not measured independently for a replacement candidate. |
| Two isolated builds and normalized payload equivalence | OPEN | No replacement payload has been built twice or compared. |
| Retained exact installer and signed candidate metadata | OPEN | No replacement installer or candidate metadata exists. |
| Clean Defender-enabled VM cold path | OPEN | No fresh-install cold matrix, activation, restart, repair, uninstall, or cleanup run was performed. |
| Real profile lifecycle and proxy failure/recovery | OPEN | No replacement-candidate inventory/create/launch and controlled failure/recovery acceptance was run. |
| Human permission, unfamiliar operator, second PC, and seven-day canary | OPEN | Unobserved. |
| `G2-IDENTITY` | FAIL | Unchanged by this scope; no identity-isolation acceptance evidence was produced. |

## Required Next Gates

1. Provision a fresh, versioned Browser/Relay/sequence candidate with exact pins and retained bytes.
2. Build it twice from isolated inputs, compare normalized payloads, and sign metadata only for the
   accepted bytes.
3. Test exact SEA TLS and public TLS separately, then run the frozen cold-start/profile lifecycle
   matrix in the clean Defender-enabled VM.
4. Keep publication and deployment blocked until exact-tuple approval and the separate human,
   second-PC, and canary evidence exist.

## Unresolved Questions

1. What exact chain/cause does the packaged replacement SEA process report, and does public TLS
   behave independently as intended?
2. Does a replacement candidate meet every cold health deadline and preserve truthful pending
   behavior without test-harness prewarming?
3. Does the real installed profile lifecycle pass on the clean VM, then on an unfamiliar operator's
   second PC and the required canary interval?
