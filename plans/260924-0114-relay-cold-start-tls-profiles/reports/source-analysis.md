---
title: "Relay clean-VM blocker source analysis"
date: 2026-09-24
status: complete
scope: "Read-only source and retained-evidence analysis; no new runtime acceptance"
---

# Relay Clean-VM Blocker Source Analysis

## Verified Baseline

Inspected live worktrees: MKTBrowser HEAD `81f3014821c471b583a37fae0dd001d0e10f59ce`;
MKTTool HEAD `43b12a76b37d932b4e3ceb330e2897e4421b3b73`. Both were clean at inspection.
Workspace root has pre-existing dirty documentation and untracked plans/logs; preserve them.
Frozen Relay source is `450975c0006d6804ea3b0044c25c4db77e8ee3d8`, different from current Web.

Authoritative terminal report:
`E:/MKTWorkspace/plans/reports/260923-2257-0324-clean-vm-acceptance-terminal.md`.
Candidate: `20260922-browser-0.3.24-relay-18-fast-profile-reuse-cft`.
Evidence root:
`E:/MKTWorkspace/local-test-artifacts/local-release-20260922/pilot-0324-r3/guest-gate-r1`.

| Original receipt | SHA-256 |
|---|---|
| `guest-ui-health-timeout-contract-failure-r1.json` | `d85e364284e6b49d4e9c1cb5e98fbc4bf646b34b5a3c7814dd349ad7dd60bfe3` |
| `guest-ui-compatibility-artifact-fetch-failure-r1.json` | `6c877745f1e8139394eb833fe9961bfb6550c9c828621e7fa4078d8b4e9a4bf3` |
| `guest-ui-relay-profiles-probe-recovered-r1.json` | `fc0077acb65959528688a7d9bfbc9f092c5c4133a8ac375e994ee4b379f28544` |

The receipt hashes match the terminal report and all three receipt sidecars. Original installer SHA-256:
`ba66883a6b9ce9dc75a93781cc9c7573927e7fb1b3f73c6e14069ace55e9cd45`.
Original Relay archive SHA-256 (35,113,380 bytes):
`fabb6ebbe4ec166662689487cd60114be5baefd88d93f65b4e7faf802fac44f4`.
Original Relay executable SHA-256 (94,577,664 bytes):
`c47ea5f44b61365ea4509e5254fa6fba73a2559414b20d8bba8ce7b1869f267e`.
Both were rehashed from `MKTTool/relay/dist` and match metadata plus the Browser Relay pin.

## 1. Cold Health And Incorrect Permission Classification

**Observed:** first health response 200 in 5,064.978 ms; warm response 1,950.684 ms.
Web deadline is 4,000 ms. Permission was simulated as granted; a human permission prompt remains OPEN.
This proves a cold HTTP contract failure, not yet that Relay process boot itself took five seconds.

**Confirmed source behavior:**

- `MKTTool/src/lib/relay/relay-endpoints.ts:203`: global default is `4_000`.
- `MKTTool/src/lib/relay/relay-browser-client.ts:116`: fetch uses that deadline; lines 133-137
  convert any DOM `TimeoutError` into `no-permission`. The timer cannot prove permission denial.
- `MKTTool/src/lib/relay/profile-setup-readiness.ts:97`: `no-permission` becomes `relay-permission`.
- `MKTTool/relay/src/main.ts:238`: health serially awaits `isReady()` and `describeRuntime()`
  before reading compatibility state. Relay liveness is coupled to downstream readiness work.
- `MKTTool/relay/src/relay-antidetect.ts:118`: runtime description calls Browser MCP; fallback
  can call cached availability. The runtime report itself is not cached.
- `MKTTool/src/lib/antidetect/mkt-browser-mcp-client.ts:11`: MCP per-request timeout is 30,000 ms,
  much larger than the parent Web budget. Initialization/rehandshake can involve multiple requests.
- `MKTBrowser/packages/mcp-server/src/server.ts:567`: runtime info awaits runtime capabilities.
- `MKTBrowser/apps/desktop/src/main/index.ts:393`: capabilities await local install inspection.
- `MKTBrowser/apps/desktop/src/main/windows-local-install-inspector.ts:38`: callers await the
  coalesced asynchronous inspection; success/failure cached for 5,000 ms. Child timeout at line 93
  is 5,000 ms. It uses asynchronous execFile; it is not a synchronous event-loop block.
- `MKTBrowser/apps/desktop/build/windows-install-conflict-detection.ps1:45`: native process-path
  Add-Type plus process/port/shortcut ownership checks are done by the PowerShell helper.

**Leading hypothesis:** cold PowerShell inspection plus MCP/secure-store overhead exceeds the Web
budget. Measure spans before claiming it explains the exact 5,064.978 ms. The five-second cache
means expiry can expose this slow path again, not only on first launch.

**Recommended repair:** bounded fast health with explicit downstream checking; retain owned-install
verification and action gates. Independently fix timeout classification. A global 10/15-second
timeout alone hides the contract mismatch and still mislabels slow work as permission denial.

## 2. Compatibility Artifact TLS

**Observed:** signed authorization audit succeeded; Relay rejected pilot TLS; no update transition
began. Windows HTTPS returned 200. Only an empty staging directory remained. Public TLS is OPEN.

**Confirmed source behavior:**

- `MKTTool/relay/src/compatibility-artifact-staging.ts:87`: downloads use built-in `fetch` with
  redirects rejected, followed by signed size/hash validation and partial staging cleanup.
- `MKTTool/scripts/build-relay-executable.ts:224`: Node SEA blob generation; line 227 copies
  `process.execPath` into the executable. This is a Node process, not Edge's TLS stack.
- `MKTTool/relay/dist/MKTTool-Relay.metadata.json` identifies Node `v24.21.0`, frozen source
  `450975c0006d6804ea3b0044c25c4db77e8ee3d8`, and the verified archive/executable hashes above.
  Do not apply the Browser's Node 22 toolchain assumption to this executable.
- `MKTTool/relay/src/handle-compatibility-update.ts`: authorization, missing-state ADMIN repair
  initialization and smoke-profile setup occur before staging. No transition does not imply no
  protected-state change, no ticket consumption or no smoke-profile record.

**Leading hypothesis:** Node's effective trust set differs from the Windows store that received
the pilot CA. Exact cause/chain remains OPEN; missing intermediate, hostname, validity, clock or
launch environment must be distinguished. Signed tickets authenticate authorization, not TLS peers.

**Recommended repair:** validate the pilot chain and actual SEA trust settings first. Prefer a
normal public certificate or scoped disposable-process CA trust. Add production trust behavior only
if supported policy or a reproduced production defect requires it. No TLS bypasses.

## 3. Profiles HTTP 400 And Lost Diagnostics

**Observed:** initial page request status 0 after 4,729.6 ms; exactly one diagnostic GET returned
400 after 3,449.4 ms. The recorder rejected a false expected `no-capacity` state before writing the
body. Recovery made no network requests. UI hash maps to `relay-permission`.

**Confirmed source behavior:**

- `MKTTool/relay/src/relay-http-server.ts:242`: handler results become 200 for `ok:true`, otherwise
  400. Thus 400 can be a valid runtime refusal, not necessarily malformed request input.
- `MKTTool/relay/src/handle-profiles.ts:31`: `requireOperationalRuntime()` gates inventory.
  Not-configured/not-ready catches return `message` only, discarding the available typed error code.
- `MKTTool/relay/src/relay-antidetect.ts:156`: runtime-not-ready error already includes a typed code.
- `MKTTool/relay/src/handle-profiles.ts:46`: list and fingerprint options execute together; the
  shared catch invalidates the probe but emits no stable branch code/stage and can include raw errors.
- `MKTTool/src/components/vault/antidetect-profile-card.tsx:127`: page calls health and profiles in
  parallel. `profileSetupReadiness` checks transport failures first, so a timeout can mask a more
  specific rejected response from the other endpoint.
- The Web client already retains rejected JSON as `data`. The lost historical body was a recorder
  failure, not evidence that the client always discards 400 bodies.

**Unknown:** the exact original rejection branch. Missing engine activation after TLS failure is
plausible; so are Browser/token/contract/list/options failures. None is established by status alone.

**Recommended repair:** persist safe structured evidence first; preserve code/stage end to end;
fix the measured cause. Do not remove runtime/capacity guards, change all 400s to 200, or invent a
licence fix. A correct engine-not-ready rejection can close through successful activation.

## Scope Decisions And Validation Limits

- Reuse current inspector/coalescing, error helpers, release runners and candidate verification.
  No new background service, broad HTTP status migration or database migration is required.
- Treat ACPI failure separately. Retain the failed receipt and successful guest OS fallback receipt.
- This planning session made no new live request to Relay/production, launched no VM, ran no
  product tests, changed no product source, and made no commit/push/deploy/release.
- Source observations are current; historical timing/TLS/VM outcomes come from hash-checked receipts.
  The proposed fixes and replacement-candidate acceptance have not been executed.
- Git comparison found no changes in the inspected Relay health/antidetect/profiles/staging files
  between frozen Relay source and current Tool HEAD. The build-a reproduction metadata names a
  different source commit; use content hashes and the matching metadata above, not directory names.

## Unresolved Questions

Plan review checked CLI status (five pending phases), dependency resolution, nine local Markdown
links, ASCII content, and scoped diff whitespace. Product worktrees remain clean. The active-plan
helper found no `CK_SESSION_ID`; use the absolute handoff command, which does not rely on session state.

1. What is the measured cold delay distribution across inspector, MCP and secure-store work?
2. What exact TLS error/chain did the packaged process observe, and does public TLS succeed?
3. Can the original 400 branch be recovered offline; otherwise what does a fresh bounded capture show?
