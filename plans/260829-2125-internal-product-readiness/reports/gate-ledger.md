# Gate Ledger — `20260830-browser-0.3.13-relay-16`

> **Superseded by `260830-0830-consolidation-and-lane-a-release` (30 August 2026).** Rows below
> preserve the Browser pre-deploy snapshot. Q16 is now decisive: there is no CloakBrowser channel
> and Lane C is **CLOSED**, not blocked or pending. P4a MKTTool Web deployment is recorded separately
> in the successor plan; do not use the historical pre-deploy rows as current production state.

Last updated: 2026-08-30 (S4b)
Status vocabulary: `PASS`, `FAIL`, `OPEN`, `BLOCKED`, `DEFERRED`, `NOT_APPLICABLE`.

## Current reconciliation (successor plan)

| Area | Current state |
|---|---|
| P4a MKTTool Web | Deployed from `master`; healthz, full `/v16` GET/hash, trusted-header, and service-instance healthcheck verified |
| P4b Browser tuple | OPEN; exact Stable `.2` engine archive absent; it does not gate P4a |
| Q15 fleet | Both active v15 devices belong to the owner; self-serve reinstall, no notification channel; floor remains 13 pending observations |
| Q16/Lane C | **CLOSED**; no CloakBrowser channel, no request, no date, no waiting state |

The tables below are a retained **historical S4b pre-deploy snapshot**. Their pending owners, old
Railway state, and vendor-wait statuses are not current assignments or release gates.

## Authority and candidate

| Field | Value |
|---|---|
| Release owner | `WORKSPACE_OWNER` |
| Technical approver | `CODEX_REVIEWING_AGENT_DELEGATED` |
| Security approver | `WORKSPACE_OWNER` |
| Operator lead | `PENDING_OPERATOR_LEAD` |
| Rollback approver | `WORKSPACE_OWNER_ONLY` |
| Candidate manifest | `reports/release-manifest.json` |
| Candidate ID | `20260830-browser-0.3.13-relay-16` |
| Browser join key | `3f3765360eae6de83fd617bf8e19949fb70719af` — HEAD; post-audit commit is docs-only |
| Relay decision | New immutable v16; floor `MIN_RELAY_VERSION` `13 -> 16` in one jump |
| Browser decision | `0.3.13` |
| Rate-limit decision | Better Auth database-backed storage; exact trusted header/CIDR still OPEN |
| Dependency decision | Try locked `deepmerge-ts >=8`; fallback is time-bounded owner acceptance |
| Build decision | Node 22 exactly; current shell is v24.14.1 and is not a build result |

## Historical S4b gate status (retained, not current)

| Gate | Status | Evidence / exact blocker | Primary owner | Evidence reviewer | Due / expiry | Status authority |
|---|---|---|---|---|---|---|
| G0 source/artifact provenance | `OPEN` | Exact Relay v16 bytes are hash-bound and published; Browser run 4 payload is hash-bound, but source remains dirty and the candidate is not frozen/attested until P4 | `WORKSPACE_OWNER` | `CODEX_REVIEWING_AGENT` | S3/P4 | Release Owner |
| G0 disposable pairs | `BLOCKED` | No approved pair set supplied; external resource gate | `WORKSPACE_OWNER` | `PENDING_NETWORK_OWNER` | External | Release Owner |
| G1 human input/login | `OPEN` | Human first-login/typing evidence remains external and intentionally unautomated | `PENDING_OPERATOR_LEAD` | `WORKSPACE_OWNER` | External | Operator + Release |
| G2 network | `OPEN` | Real proxy/DNS/WebRTC candidate evidence absent | `PENDING_NETWORK_OWNER` | `PENDING_SECURITY_APPROVER` | External | Network + Release |
| G2 identity | `FAIL` | 27 Aug licensed `.2` measurement has cross-profile font/audio/WebGL collisions; fixed thresholds are now in `decisions.md`, and vendor remediation is still absent | `PENDING_IDENTITY_VENDOR_OWNER` | `WORKSPACE_OWNER` | No date | Product Owner |
| G2 concurrency | `DEFERRED` | One-seat policy; one profile at a time | `PENDING_RELAY_OWNER` | Security | Policy expiry to fill | Release Owner |
| G3 license/vendor | `OPEN` | Live vendor schema/sidecar entitlement not evidenced; one-seat UI is conservatively disabled | `PENDING_VENDOR_OWNER` | `WORKSPACE_OWNER` | External | Relay + Vendor |
| G3 recovery | `OPEN` | Exact local v16 archive and installer-extracted archive pass crash/restart matrix; physical power-cycle and clean-VM final installer remain external/open | `PENDING_RELAY_OWNER` | `PENDING_SECURITY_APPROVER` | P2/S5 | Relay + Security |
| G4 operator/second PC | `OPEN` | Clean second PC and unfamiliar-operator run not supplied | `PENDING_OPERATIONS_OWNER` | `WORKSPACE_OWNER` | External | Operations |
| G5 canary | `OPEN` | No roster/window; dates intentionally wait for S4a | `PENDING_OPERATIONS_OWNER` | `WORKSPACE_OWNER` | No date yet | Product Owner |
| G5 decision | `OPEN` | No lane-specific signed GO/NO-GO | `PENDING_RELEASE_OWNER` | Security | After gates | Product Owner |
| Distribution signing | `OPEN` | Lane A/B unsigned internal exception is decided with 60-day expiry from S3 build; Lane C still requires Authenticode and vendor evidence | `WORKSPACE_OWNER` | `WORKSPACE_OWNER` | S3 build + 60d | Product Owner |
| Lane A production alignment | `HISTORICAL / SUPERSEDED` | Old pre-deploy Railway snapshot; current P4a deployment is in the successor report | `PENDING_WEB_SRE_OWNER` | Release Owner | P5/P4 | Release Owner |
| Lane B controlled demo | `BLOCKED` | Exact Relay replay, installer truth, and real-environment gates pending | Desktop Owner | Security | P3/P6 | Release Owner |
| Lane C real-account production | `CLOSED` | `G2-IDENTITY FAIL` and no CloakBrowser channel; no request or date exists | Historical | Product/Security | None | Product Owner |

## S3 Browser candidate evidence

| Check | Status | Evidence / qualification |
|---|---|---|
| Candidate/version coherence | `PASS` | Browser `0.3.13`, Relay v16, proxy UA, control contract, and setup metadata contract agree; see `reports/browser-installer-s3.md`. |
| Embedded Relay tuple | `PASS` | Installer-extracted archive 33,342,752 bytes / SHA-256 `5c98cf...1842e`; embedded EXE 87,987,200 bytes / SHA-256 `300646...b60e`. |
| Normalized payload reproducibility | `PASS` | Final host runs 3/4 produced equal full 130-entry manifests; normalized SHA-256 `517272...5d03566`. |
| Outer NSIS reproducibility | `OPEN` | Final host runs 3/4 differ by 78 bytes; no unexplained variance is waived. |
| Packaged runtime | `PASS (host)` | `verify:packaged-contract --repeat 1` 1/1; CFT compatibility only, never G2 identity. |
| Exact extracted Relay replay | `PASS (host)` | Restart/forced termination/corruption/expiry matrix pass with explicit sidecar. |
| Clean VM lifecycle | `OPEN/SKIPPED` | No disposable VM run in S3; skip cannot satisfy Browser promotion. |
| Installer metadata | `PASS (local)` | Canonical parser/API/UI fail closed on missing/malformed tuple; live R2 object is old/incomplete and is not served. |
| Browser publication/revocation | `OPEN` | No installer publication; fixed stable key still mutable and lacks authenticated version/revocation pointer. |
| Source provenance | `OPEN` | Emitter refused dirty source; no fake clean attestation. |
| Authenticode | `OPEN` | Candidate is `NotSigned`; 60-day Lane A/B exception metadata/SOP prepared, operator names and clean-VM SmartScreen evidence remain open. |

## S1a journal restoration check

The current working copy of `MKTTool/relay/src/spent-ticket-journal.ts` contains the fail-closed
`ensureSpentTicketJournal()` implementation restored over the HEAD version after the 01:35 restore
incident. `relay-identity.ts` imports and invokes it at startup. The focused Relay/replay suite
passed 18/18 tests, MKTTool typecheck passed, and targeted ESLint passed. Missing, corrupt,
unreadable, duplicate, partial-write, and durability-fault paths remain blocking errors; no
fail-open fallback was added.

## S2a/S4b release-authority hardening

The Windows installer metadata reader now requires a complete approved tuple and a future
`signing-exception-expires-at` for unsigned Lane A/B distribution, rechecks the tuple immediately
before serving bytes, and spools/hash-verifies the response before exposing it. The publisher's
negative draft preflight refused the dirty/unsigned manifest before any R2 write. These are local
control proofs only; they do not constitute a signed publication or deployment.

## S0 evidence index

| Evidence | Result | Qualification |
|---|---|---|
| `reports/baseline-capture.md` | Captured | Host and dirty-tree snapshot; no source/build/CD changes. |
| `reports/release-manifest.json` | Draft | Exact Relay and final Browser draft tuples are filled; freeze/signature/publication fields remain open. |
| `reports/external-track-register.md` | Ready, not sent/booked | No named vendor/network/operations owner or channel supplied. |
| MKTTool `1ade2c4` / tree `2eb0f141...` | Recorded | Dirty `AGENTS.md` is unrelated; relay fix `57e14fa` ancestor. |
| MKTBrowser `3f37653` / tree `cf28f24c...` | Selected join key | One docs-only commit after audit `6d1b0a2`; working tree has unrelated tracked edits. |
| Published v15 tuple | Negative evidence | Installer `d570...fc4b`; Relay archive `cfe...4b261`; EXE `eb37...10d1`; exact replay FAIL. |
| Fixed local v15 tuple | Source-fix evidence only | Archive `c51...a6f5`; EXE `a1ef...8c77`; not published/embedded. |
| Railway read-only status | Current rollback reference | Deployment `c819e6a8`, ID `3621f603-1c51-4246-824c-55cc0e6b5764`, healthcheck unset; no deploy run. |

## G3-RECOVERY reconciliation

Acceptance matrix line 64 reports `PASS`, lines 434–437 describe the final bounded power-cycle subset, and lines 540–541 preserve the earlier `OPEN` real-power-cycle/licence-key/reboot result. The ledger treats the PASS as hash-bound historical/subset evidence only. The exact published installer has a different Relay payload and failed restart replay, so candidate `G3-RECOVERY` remains `OPEN` until the exact v16 archive/EXE passes. Historical rows stay visible and are not rewritten.

## HOLD and invalidation rules

- No custom engine promotion, TikTok/Reddit posting automation, CAPTCHA/OTP/credential automation, page/raw-CDP tools, macOS, updater, multi-profile concurrency, or identity guarantee.
- Preserve `1 account = 1 static proxy = 1 managed profile = 1 assigned Relay device` and human-controlled first login.
- Any source/artifact/engine/host/proxy/firewall/schema/test-order change invalidates downstream evidence; re-run from the first affected gate.
- A skipped, not-observed, local-only, unsigned, or dirty-source result remains OPEN/negative as labelled.
- Published v15 object is immutable and must never be overwritten.

## Historical owner-decisions ledger (superseded by Q13–Q16)

1. **Superseded:** Q16 records no CloakBrowser channel; Lane C is CLOSED and no request/SLA exists.
2. **Historical/out of scope:** no P6 vendor entitlement or Browser resource booking is active.
3. **Residual evidence:** owner-machine observations, P4-08 smoke, and P4-09 rollback rehearsal remain
   OPEN in the successor plan; the owner remains the sole rollback approver.
4. **Executed:** Q13 preconditions were met and P4a deployed through the master/Railway integration.

## Re-run history

| Timestamp | Unit | Change | Invalidation |
|---|---|---|---|
| 2026-08-30T01:20+07:00 | S0 | Initial baseline and draft manifest | No downstream candidate evidence yet. |
| 2026-08-30T03:50+07:00 | S3 | Built Browser `0.3.13` twice, normalized payload equal; outer NSIS variance and clean/provenance/publication gates remain open | S4a may classify the existing Stable `.2` identity collision evidence; any engine change invalidates this tuple. |
| 2026-08-30T04:42+07:00 | S4b | Rebuilt the final Browser draft (run 3) after metadata/publisher hardening; preserved run 2 for comparison. `app.asar` and Relay are equal; outer NSIS variance is 74 bytes. | Superseded by the full run 3/4 payload comparison below; candidate remains draft. |
| 2026-08-30T05:05+07:00 | S4b | Snapshot run 3, rebuilt run 4, generated fresh 130-entry manifests, and compared the entire unpacked payload: zero differences. Run 3/run 4 outer installers differ by 78 bytes. | Candidate remains draft; signing, clean VM, Browser publication/revocation, and Railway alignment stay OPEN. |

## S4a identity decision

Stage A is recorded as `no-chance` for the pinned licensed Stable `.2` engine because the existing
native evidence collides on fonts, `OfflineAudioContext`, and WebGL. The pin is frozen for this
candidate, but the formal fresh 3-profile × 5-run matrix and vendor answer remain OPEN. See
`reports/identity-measurement.md` and `handoffs/S4a-identity-early-probe.md`.

## S4b final-freeze decision

The final Browser tuple is not promotable: the source trees are dirty, the outer NSIS installers
differ by 78 bytes, the exact engine archive is absent, Authenticode is `NotSigned`, and no signed
compatibility/revocation bundle exists. The Relay-only v16 object is the sole published artifact and
has independent full byte/hash read-back. The Browser publisher's frozen-manifest and approved-tuple
checks were exercised with a negative draft and refused publication before any R2 mutation. Railway
was inspected read-only; no `railway up`, floor bump, or stable-pointer promotion ran. The older
`s3-payload-manifest-run1/2.json` files retain an earlier stale package snapshot and are superseded
by `s4b-payload-manifest-run3/4.json`; only the latter pair is used for the final comparison.
