# Internal Product Readiness Audit

> **Historical snapshot — pre-Q14 and pre-P4a (29 August 2026).** This audit's Browser 0.3.12,
> old branch, deployment, and owner-question references are retained as historical evidence. Current
> status is in `plans/260830-0830-consolidation-and-lane-a-release/reports/lane-a-deploy.md` and its
> fleet/provenance reports: P4a Web is deployed, P4b remains OPEN, Q15 is owner-machine self-serve,
> and Lane C is **CLOSED** because no CloakBrowser channel exists.

**Date:** 29 August 2026 (ICT)
**Scope:** MKTTool Web/Relay and the published MKTBrowser Windows candidate 0.3.12
**Mode:** Read-only audit; no source, deployment, release, or credential changes

## Verdict

**NO-GO** for the statement "stable and accurate/product-ready" across Browser + Relay or for
real-account rollout.

**CONDITIONAL-GO:** MKTTool Web/Facebook may continue as a low-risk, admin-led internal pilot for
authorized operators who understand that the deployed version is older than the current branch.

**NO-GO:** Do not onboard real Reddit/TikTok/browser accounts with the published Windows installer.
It is suitable only for a disposable technical demonstration until the bundled Relay is rebuilt and
the operator-facing copy is corrected.

## What was freshly verified

| Area | Evidence | Result |
|---|---|---|
| MKTTool local branch `ci/self-hosted-runners` (`1ade2c4`) | `npm test` | 210 files / 1,922 tests passed |
| MKTTool critical coverage | `npm run test:critical-coverage` | Statements 79.84%, branches 75.42%, functions 80.41%, lines 82.52%; configured floors pass |
| MKTTool static/build checks | `npm run typecheck`, `npm run lint`, `npm run build` | PASS |
| MKTBrowser clean candidate tree (`6d1b0a2`) | `yarn verify:node`, typecheck, lint | PASS |
| MKTBrowser managed contracts | `test:mkb02` / `test:mkb03` | 135 / 135 and 31 / 31 passed |
| MKTBrowser packaging contracts | `test:packaging` | 34 passed, 1 explicit live-Windows test skipped |
| MKTBrowser production dependency audit | `yarn audit:production` | No audit suggestions |
| Published candidate | 146,023,745 bytes; SHA-256 `D570CCC3326B5A046D91B7B677F4232AB76908F2FB034C60799E31695F43FC4B` | Hash matches provenance; Authenticode `NotSigned` |
| Production availability | Railway status + unauthenticated probes on 29 Aug | Web online; `/login` 200, protected pages redirect 307, protected download/API routes return 401 |

These are meaningful engineering passes. They do not close the real-engine identity, real-proxy,
human-operator, vendor, or canary gates.

## Findings

### P0 - Published installer bundles the Relay binary with the known restart replay failure

The candidate provenance binds Relay v15 archive SHA
`cfeefc7f1284492a64f5cf8b29603b3e9a36e5d488ac676d2d109b2c4364b261`
(34,285,450 bytes), containing EXE SHA
`eb37eb544ef87b772185272aa2de4cf23000f2e2fbd92f6bde99a20e47b210d1`. The archived restart test
using that exact EXE is **FAIL**:
`spentTicketRejectedAfterRestart=false`, with blocker `RELAY-RESTART-FORGETS-SPENT-TICKET`.
See `local-test-artifacts/phase5/relay-restart-recovery-evidence.json`.

The later **PASS** replay test uses a different EXE
(`a1efb909d5f90b6c6fa2475a2be19ab93611cfebdbbf8d6a35733610aac48c77`) built from MKTTool fix commit
`57e14fa` ("keep spent tickets across a restart"). The current local Relay metadata is also a
different archive (`c51ca311161b19da6846d2b131eda8bc516fccf1f10eb9159349f0016266a6f5`,
34,287,423 bytes). That fixed binary is not the one inside the
published installer.

Impact: after a Relay restart, an unexpired already-consumed ticket may be accepted again. Replay
protection is therefore not guaranteed for the distributed artifact, even though the current source
test is green. This is a release/security-boundary blocker, not a cosmetic mismatch.

### P0/P1 - Setup UI makes materially inaccurate operational claims

The rendered MKTTool setup component hard-codes "MKT Browser 0.3.2" while the candidate is 0.3.12
(`MKTTool/src/components/setup/onboarding-stepper.tsx:127`). It also describes an isolated-
fingerprint Chromium integration (`:130`) and finishes with "everything is ready" plus TikTok
profile operation guidance (`:205-206`). The controlled-beta policy explicitly keeps Reddit/TikTok
real-account work paused and does not claim unique fingerprint identity.

An operator can therefore download 0.3.12 under a 0.3.2 label and infer that TikTok/identity work
is approved. Correct the version/hash and boundary copy, or gate this onboarding screen, before
team-wide use.

### P1 - Production and candidate are not version-aligned

Railway's active `mkttool-web` deployment is successful but still commit `c819e6a8` from 22 August.
The current branch is `1ade2c4`; the replay fix is `57e14fa`; neither is deployed. PR #39 remains
open with queued checks, and the self-hosted runners are offline. Railway reports no configured
healthcheck path. "Online" therefore proves basic routing, not that the current release contract is
running or continuously healthy.

### P1 - Accuracy/identity gates remain open or failed

The acceptance matrix still records:

- `G1-INPUT` OPEN (only one manual interaction, not the required three plus cover/A/B evidence);
- `G2-NETWORK` OPEN;
- `G2-IDENTITY` **FAIL** (cross-profile font/audio/WebGL collisions);
- `G3-LICENSE`, `G4-OPERATOR`, and `G5-CANARY` OPEN;
- only `G3-RECOVERY` PASS.

That matrix PASS is historical subset evidence on hash-bound test artifacts; it must not be read as
a pass for the published candidate's replay behavior because the candidate embeds the older Relay
listed in the P0 finding above.

The packaged runtime verifier is a compatibility/lifecycle smoke: it installs and runs system
Chrome CFT `151.0.7922.174` with `MKT_BROWSER_ALLOW_UNPINNED_ENGINE=1`. It is not proof that the
bundled CloakBrowser pin `151.0.7922.108.2` has the required identity or network behavior.

### P1/P2 - MKTTool production dependency audit is not clean

Fresh `npm audit --omit=dev` exits 1 with three HIGH findings in the production dependency chain
`prisma@7.9.1 -> @prisma/config@7.9.1 -> deepmerge-ts@7.1.5`, advisory
[GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). The vulnerable merge path is
used by Prisma CLI/config loading (`prisma.config.ts`), not normal request data, so this is a
contextual/config-time risk rather than evidence of an exposed request endpoint. It is still an
unresolved release finding; the [Prisma tracking issue](https://github.com/prisma/orm/issues/30052)
describes the current pin and workaround discussion. Record an explicit risk acceptance or isolate/
patch it before calling the product fully secure.

### P2 - One-seat policy is not enforced by the UI

The pool and settings screen support multiple configured keys and describe capacity as one profile
per key. The measured vendor result says both keys on the free plan still share one session limit:
the second launch waits about 18 seconds, is refused, and can enter a 17-minute cooldown. For this
beta, configure one key/profile only and state that SOP explicitly; otherwise the UI invites a
configuration the vendor does not support.

### P2 - Operational warnings need a small owner decision

Recent Railway logs show Better Auth cannot determine the client IP and falls back to one shared
per-path rate-limit bucket. The same log window retains a historical `ScheduledJobRun` database
`ETIMEDOUT` during health/backup work; later runs recovered. Neither is a current outage, but both
mean "stable under team use" is not yet demonstrated. Add trusted-proxy IP configuration and a
small alert/owner runbook, or explicitly accept the risk for the pilot.

## Minimal path to a safe internal beta

1. Rebuild/publish the Relay from the replay-persistence fix and package a new installer; verify the
   exact bundled archive/EXE hashes and rerun the restart replay test on that exact artifact.
2. Correct setup copy to 0.3.12, show the verified SHA, remove the "TikTok ready/isolated identity"
   implication, and link the controlled-beta boundary.
3. Make production/version ownership explicit: deploy the intended MKTTool commit (or label the
   pilot as old production), restore CI runner checks, and add a healthcheck decision.
4. Put the Prisma advisory and one-seat rule in an explicit risk/SOP record; fix the trusted-proxy
   rate-limit warning before expanding beyond a small pilot.
5. Run one clean candidate-equivalent install plus one human smoke after steps 1-2. Do not wait for
   custom Chromium work, updater/macOS work, or automation expansion; those are outside this gate.

## Safe-use boundary today

- **Web/Facebook:** conditional internal use for authorized operators, manual actions, low-risk data,
  and active monitoring. This is based on basic availability and local quality checks, not a claim
  that every authenticated business workflow was freshly exercised.
- **Browser/Relay:** disposable demo only. No real Reddit/TikTok/browser account, OTP, CAPTCHA,
  unattended automation, or identity guarantee should be attached to the published installer.

## Unresolved questions

1. Is the immediate team handoff Web/Facebook only, or does it require real browser accounts? The
   latter remains blocked by the P0 artifact mismatch and failed identity gate.
2. Who owns rebuilding/publishing the corrected Relay and approving the exact candidate hash?
3. Will the team risk-accept the Prisma advisory temporarily, or require an isolated/updated chain?
4. Should extra licence-key entry be removed/disabled for the one-seat beta, or is multi-seat vendor
   capacity actually available under a different plan?
