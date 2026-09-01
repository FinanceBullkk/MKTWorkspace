---
title: "MKTBrowser Prebuilt Engine Roadmap and Fresh-Session Orchestrator"
description: "Pivot from a blocked local Chromium source build to an evidence-backed prebuilt engine path, executed as bounded sequential Codex sessions."
status: deferred
priority: P1
effort: "8-12 focused sessions plus unattended runtime measurements"
branch: "codex/prebuilt-engine-session-orchestrator (intended; no branch switch in planning session)"
tags: [mktbrowser, engine, cloakbrowser, cft, orchestration, evidence, windows]
blockedBy: []
blocks: []
created: "2026-08-28"
createdBy: "codex"
source: manual-plan
---

# MKTBrowser Prebuilt Engine Roadmap and Fresh-Session Orchestrator

## Decision

**Scope freeze, 29 August 2026:** deferred by the internal-product-ready decision. The controlled
Windows x64 beta reuses the verified current shell, Relay contract, and published engine pin. Do not
start O0 or any engine session until a concrete beta failure requires it and the owner explicitly
reopens this plan. This prevents the engine track from delaying team use of the already-working
Web/Facebook surface and bounded Browser beta.

The custom Chromium source-build track is parked. The host has 16 GiB installed RAM and the
required Phase 1B build gate failed after the permitted reboot check; `VBoxHeadless` and
`vmmemWSL` consumed most of the available memory. The project will not lower the build gate, rely
on pagefile memory, build inside a VM, or pretend that a measurement run compensates for a failed
build.

This plan's historical engine roadmap is superseded by the 30 August Q16 decision. The custom
engine track is closed, there is no CloakBrowser channel, and Lane C is closed for this product
shape. The successor consolidation plan owns current release status. The sections below are
retained as historical planning context; they do not authorize a request, purchase, launch, or
vendor wait.

This plan used to describe an existing, separately licensed browser engine:

1. **CloakBrowser licensed channel was the historical primary candidate.** It is downloaded unmodified from
   the approved official channel, checked against its published SHA-256, and kept outside the
   application package.
2. **Chrome for Testing (CFT) is a compatibility/reference fallback only.** It is not accepted as
   the operational antidetect engine and cannot close the identity gate by itself.
3. The goal is operational readiness, lifecycle safety, profile/proxy isolation, and measured
   consistency. It is **not** a promise of unique fingerprint scores. Existing evidence already
   shows that some surfaces (for example audio, fonts, and WebGL) can collide across seeds.
4. One profile runs at a time. All tests use disposable profiles and synthetic data. No real
   account login, OTP, CAPTCHA, bot-detection evasion, checkpoint bypass, rate-limit bypass, or
   TikTok automation is in scope.

## Why the work is split across fresh sessions

One large Codex conversation would eventually carry old Chromium-build context, runtime details,
test output, and release history all at once. That makes mistakes and context overflow more likely.
The orchestrator therefore treats each phase as a separate non-interactive `codex exec` process.
This creates a fresh CLI context, not a promise that the current chat UI can open a visible new tab:

```text
manifest + small context packet
        |
        v
fresh session for Phase N
        |
        +--> report + handoff + result.json
                         |
                  mechanical gate
                         |
             PASS ------+------ BLOCKED/FAIL
              |                    |
       launch Phase N+1       stop and preserve evidence
```

The files in this plan are the durable source of truth. Session task IDs, chat history, and model
memory are not relied on across phases. The default chain is strictly serial (`maxActive=1`) so
that a single engine license, profile store, proxy, and host cannot be touched concurrently.

## Current verified starting point

| Fact | Current reading | Consequence |
|---|---|---|
| Host memory | 16 GiB installed; post-reboot available memory remained below the custom `>12 GiB` build gate | No local Chromium source build |
| VM/WSL pressure | `VBoxHeadless` and `vmmemWSL` were the dominant consumers; registered VMs were powered off but orphan/ambiguous host processes remained | Stop VM/WSL before runtime measurements; record process state |
| D: free space | About 235 GiB | Enough for prebuilt download/cache; still measure before/after |
| Custom build artifact | None produced | Phase 1B and the old custom baseline remain blocked/not-run |
| MKTBrowser source | Existing dirty files are unrelated and must be preserved (`ChromiumBrowserDriver.ts`, `packages/mcp-server/src/server.ts`, `packages/types/src/index.ts`) | No blanket reset or broad staging |
| MKTTool/workspace | Existing `AGENTS.md`/plan evidence changes are unrelated and must be preserved | Orchestrator snapshots both repositories before every child |
| Existing runtime contract | External engine path, pin validation, bootstrap, firewall checks, and compatibility smoke runner already exist | Reuse before adding code |
| Observed engine pin | `apps/desktop/windows-engine-release.json` records stable archive facts; the local `compatibility-updater/active-engine.json` also carries the current implementation's short-lived URL for immediate convergence | Treat as a starting record only; revalidate version, license, URL, archive size, and archive hash in Phase 1; redact the URL from evidence |
| Cached runtime hygiene | Pre-existing `ttk-*` directories under the CloakBrowser runtime resemble Chromium profile stores | Treat the cache as contaminated until audited; do not use it as clean evidence or delete it blindly |

Historical evidence is useful context, not a current approval. Any engine version, host, flag,
license, or profile-schema change invalidates the affected measurements and requires a new result.

## Scope and non-goals

### In scope

- A persistent phase manifest, context-packet format, state machine, and PowerShell runner for
  fresh Codex CLI sessions.
- Current CloakBrowser/CFT inventory, license/provenance review, pinning, safe acquisition, and
  rollback proof.
- Disposable launch/close/restart/crash cleanup tests.
- Sequential profile, static-proxy, egress, DNS/WebRTC, storage, and cross-profile isolation tests.
- A staged 10 → 30 → 100 launch measurement run after the runtime is proven usable.
- Narrow managed MKTTool → Relay → MKTBrowser compatibility checks that reuse existing contracts.
- Read-only packaging, firewall, update, rollback, and internal-demo readiness review.

### Explicitly out of scope

- Building or modifying Chromium/Brave source on this 16 GiB host.
- JavaScript fingerprint patches, undocumented engine switches, detector-score optimisation, or
  claims of “undetectable”/unique identities.
- Bundling, redistributing, publishing, signing, or shipping a separately licensed engine.
- Real credentials, cookies, OTPs, customer accounts, CAPTCHA/checkpoint/rate-limit work, or
  automation against social platforms.
- Parallel phase execution against the same checkout or runtime.

## Phase map

| ID | Phase | Deliverable | Entry gate | Exit gate | Default session |
|---|---|---|---|---|---|
| O0 | Orchestrator foundation | Runner, manifest, schemas, dry-run/recovery evidence | This plan exists | Fresh-session runner can launch a harmless probe and reject malformed results | **BLOCKED**: Codex CLI app-server ACL |
| P0 | Park custom build and freeze scope | Decision record and clean baseline snapshot | Phase 1B BLOCKED evidence | Old build path is explicitly parked; no MKTBrowser source changes | 1 |
| P1 | Engine inventory and approval | Current engine decision, license/provenance record, candidate pin | P0 PASS | Exactly one primary candidate has current URL/hash/size/arch/license facts | 1 |
| P2 | Acquire, verify, activate, rollback | Unmodified runtime plus hash-bound activation/rollback evidence | P1 PASS + no active VM/WSL | Good archive activates atomically; bad/truncated archive leaves prior state intact | 1 |
| P3 | Standalone lifecycle smoke | Disposable launch/health/close/restart/crash report | P2 PASS | Three serial clean cycles, no orphan process, no mixed engine | 1 |
| P4 | Profile and proxy isolation | Two-profile sequential isolation matrix | P3 PASS | No storage leakage; proxy is applied before launch; egress checks fail closed | 1 |
| P5 | Staged measurement | Sanitized 10/30/100 launch datasets and analysis | P4 PASS | Each stage passes its declared consistency/health criteria before next stage | 3 worker sessions, each with a separate reviewer |
| P6 | Managed integration | Contract v4, Relay ticket/lease/readiness evidence | P5-100 PASS | Existing managed path remains green without direct-launch bypass | 1 |
| P7 | Install/update/rollback and demo gate | Readiness report and go/no-go record | P6 PASS | Internal disposable demo only; no distribution approval implied | 1 |
| FUT | Re-enter custom build | New plan on a host meeting the original gate | 32 GiB+ host and owner decision | Separate build plan; this plan is not weakened | Later |

For every phase marked `reviewRequired`, the worker is followed by a separate read-only reviewer
session with its own result and report. The orchestrator may run documentation-only O0/P0 even when the custom build is blocked. It must
stop before a dependent phase whose result is missing or non-PASS. A `DONE_WITH_CONCERNS` result is
not an automatic PASS: the controller reads the concern and either records an explicit waiver or
stops.

### Live execution status — 28 August 2026

O0 was attempted four times with fresh `codex exec --ephemeral --json` processes. The first could
not resolve the Codex home; three explicit-home attempts reached startup but failed with an
app-server `Access is denied (os error 5)` error before model work. Supplying either CLI
full-access flag did not change the error, which indicates an outer managed-shell ACL rather than
the child sandbox mode. O0 is therefore **BLOCKED** and all product phases remain locked. See
`reports/phase-o0-result.md`; do not repeat the same managed-shell launch unchanged.

## Shared acceptance rules

Every phase must:

- read only the README, its phase file, named context files, and the previous handoff;
- declare the exact files it may modify before editing;
- preserve unrelated dirty work and never use a broad reset/checkout/stage operation;
- write a sanitized Markdown report, a handoff for the next session, and a machine-readable result;
- correlate every result/report/handoff with the controller-generated `runId` and phase ID;
- list commands, exit codes, durations, host/resource observations, changed paths, and unresolved
  questions;
- distinguish the result verdicts `PASS`/`DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `FAIL`,
  `NOT_RUN`, `NEEDS_CONTEXT`, and `NEEDS_OWNER` honestly; the child response also follows the
  local `DONE`/`DONE_WITH_CONCERNS`/`BLOCKED`/`NEEDS_CONTEXT` protocol;
- avoid secrets in prompts, logs, reports, filenames, and committed files;
- launch children with a phase-specific environment allowlist; clear license keys, MCP tokens,
  proxy credentials, and session cookies unless a narrowly scoped P1/P2 operation requires an
  in-memory secret from the existing secure store;
- leave the runtime/profile store in a known state and prove clean shutdown when a browser was run.
- keep every disposable `--user-data-dir` outside `chromium\\{engine}\\runtime`; scan the runtime
  tree after a run and reject profile-like directories there;

The runner stops on `BLOCKED`, `FAIL`, `NEEDS_CONTEXT`, missing evidence, malformed JSON, a
non-zero child exit, an unexpected changed path, or an ambiguous process/engine state. It does not
retry a blocked phase unchanged. A runner-only failure may be retried once only when no phase
result or partial product change was written.

## Resource policy for the prebuilt path

The original `>12 GiB` physical-RAM rule remains mandatory for a future Chromium source build; it
does not need to be met for a prebuilt runtime smoke test. The prebuilt path still uses a safety
preflight:

- stop `VBoxHeadless`, active WSL/Vmmem, and other disposable VM workloads before a launch or
  measurement;
- record installed/available RAM, D: free space, process list, engine version, and profile count;
- refuse a run when the machine is visibly under memory pressure (recommended floor: 4 GiB
  available for a single disposable profile) or when VM/WSL ownership is unclear;
- never treat pagefile capacity as physical-RAM evidence;
- run one profile at a time and clean up before the next iteration.

If the recommended floor is not met, mark the phase `BLOCKED` and wait for cleanup/idle time; do
not silently lower it inside a child session.

## Evidence and invalidation

All evidence belongs under this plan's `reports/` and all handoffs under `handoffs/`. Large raw
logs stay local and are referenced by sanitized hashes/paths. A result becomes stale when any of
the following changes: engine archive/version/hash, engine flags, Electron/Node version, Windows
host, proxy, profile schema, measurement script, or relevant runtime source. The next session must
say what was invalidated and why.

Existing release-readiness and proxy plans remain authoritative for already-proven Relay, lease,
firewall, installer, and VM facts. This plan links to them; it does not copy or silently reopen
their closed gates.

## Explicit CFT fallback branch

If P1 cannot revalidate a current CloakBrowser entitlement, the controller stops. An owner may then
approve a separate manifest branch (`P2-CFT`/`P3-CFT`) for shell compatibility, launch/close, and
packaging-path tests only. That branch must carry `engineKind: cft` in every result, cannot unlock P4
or P5 identity measurements, cannot close the operational antidetect gate, and cannot be silently
treated as a CloakBrowser result. For CFT, record the exact availability-manifest retrieval time,
URL/version/revision, local archive SHA-256/size, and lower supply-chain confidence; never enable an
unpinned manifest in a packaged flow. Returning to the primary path requires a new Cloak pin and a
new result set.

## Fresh-session start procedure

This planning session does not launch product work. After the user starts a new Codex session, that
session first implements and syntax-checks the O0 runner. Only then is the first command a dry run
of the orchestrator:

```powershell
$plan = 'E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator'
& "$plan\orchestrator\run-prebuilt-engine-phases.ps1" `
  -PlanRoot $plan `
  -Phase O0 `
  -DryRun
```

If the dry run is valid, execute only O0. O0 itself verifies the configured Codex CLI path with a
harmless child prompt and records the CLI version/JSON event shape. It does not touch MKTBrowser
source or download an engine. Then the controller may continue to P0/P1 one phase at a time.

The configured CLI is currently at:

```text
C:\Users\anhha\AppData\Local\OpenAI\Codex\bin\8e8bf206e63ac436\codex.exe
codex-cli 0.147.0-alpha.6.6
```

The runner must resolve this path explicitly because no `codex` shim is on the current PATH. If a
normal-user terminal still reports the app-server `Access is denied` probe failure, O0 is
`BLOCKED`; use the manual fallback: generate the phase prompt file, open one new Codex session by
hand, and place its result/handoff in the prescribed paths. Do not claim that the automatic chain
ran.

## Definition of done

This plan is complete only when:

1. The orchestrator has run fresh, bounded sessions with a durable runner `runId`, an optional
   Codex thread ID, state, logs, and handoffs, and has stopped correctly on at least one synthetic
   failure in its own tests.
2. A current CloakBrowser licensed archive pin is verified and the extracted binary runs unmodified
   outside the app package, or
   the plan records a dated, evidence-backed blocker.
3. Disposable lifecycle and sequential profile/proxy isolation are evidenced without real data.
4. The staged measurement result clearly reports what is deterministic, what collides, and what is
   unknown; no detector score is used as a pass substitute.
5. Managed integration and release/demo gates are either PASS with evidence or explicitly OPEN/
   BLOCKED. No binary is distributed from this plan.

## Unresolved questions

- Can the configured `codex.exe` complete a non-interactive JSON run from a normal user terminal,
  or does the local app-server permission issue require the manual fallback?
- Which exact CloakBrowser version/license subscription is current on the execution date? The
  existing JSON pin is an input, not a re-approval.
- Does the current active-pin URL lifetime remain acceptable, or is a narrowly scoped schema/refresh
  change needed? The existing writer intentionally stores the URL for the next immediate fetch;
  this plan must not claim that behavior has already been removed.
- Is the existing one-seat license still the active capacity constraint? Confirm before P3/P5.
- Which release-readiness VM checks can run after VM/WSL memory is reclaimed? An unavailable clean
  VM remains `OPEN`, never an inferred PASS.
