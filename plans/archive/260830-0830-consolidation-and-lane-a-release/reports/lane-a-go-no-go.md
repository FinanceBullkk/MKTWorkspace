# Lane A GO/NO-GO decision record

Prepared: 2026-09-01 (ICT)
Status: **CONDITIONAL GO — SIGNED BY OWNER**
Prepared by: reviewing agent. Signed by the workspace owner on 2026-09-01 (ICT).

Satisfies P4-09 step 10 ("Record the Lane A decision"). Phase 4 criterion
`A signed Lane A GO/NO-GO exists with residual risks named` is satisfied by the owner signature
below.

## Scope

Lane A = MKTTool web service (`mkttool-web`), internal demo and controlled beta. Synthetic or
disposable data, one profile at a time, human login. **Lane A does not claim identity isolation.**
This record covers P4a only. The Browser five-artifact tuple (P4b) is explicitly out of scope and
remains OPEN.

## Evidence satisfied

| Gate | Evidence |
|---|---|
| Source landed and attestable | Consolidation branch merged; master `6ce28d0f2cc04d606eacb8d52b2e7fdbe5805432`; protected `AGENTS.md`/`AGENTS.md.bak-260828` excluded throughout |
| CI green on master | Run `33297347911`, conclusion `success` |
| Deployed | Current Railway deployment `0a696033-b610-492c-b75a-3e918cca102a`, master commit `2734e2f0ba9c2a2f9c3731a44540c01d263b36e2`, status `SUCCESS` |
| Health route | `/api/healthz` HTTP 200, `ok=true`, `status=ready`; 947/947 in the last 24-hour query |
| Relay route (route-first) | Authorized full GET, HTTP 200, 33,342,752 bytes, sha256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e` — hash comparison, not HEAD |
| Post-incident stability | Last 24-hour query: 947/947 HTTP 200, zero non-2xx and zero server 5xx; fresh burst 24/24 ready, 88-397 ms |
| R2/readiness diagnosis | Direct R2 HEAD 20/20 pass from this host (243-886 ms, median 289 ms); former 450 ms budget was unsafe, serving-region trigger remains unconfirmed |
| Authorized v16 replay after hardening | HTTP 200, 33,342,752 bytes, exact SHA-256, 1.3 s |
| Backup + restore | `db:backup:remote` 22,575 ms; `db:restore:verify` PASS, 101/101 aggregate, `mismatches=[]`, `cleanup=PASS` — run against the current database |
| Rollback rehearsal (P4-09) | Executed in a disposable environment; qualified PASS. See `rollback-drill-p4-09.md` |
| Healthcheck timeout | `null` retained deliberately; inherits Railway's documented 300 s deploy-time bound. See `healthcheck-timeout-decision.md` |
| Better Auth shared-IP warning | Resolved; absent from latest deployment logs |
| P4-08 credentialed/admin smoke | **PASS / bounded** | OAuth/admin role, Facebook token health, destructive confirmation (cancelled), daily scheduler, and R2 backup freshness verified live; queue empty, so no posting was submitted. See `reports/lane-a-credentialed-smoke-20260901.md` |

## Residual risks — named, accepted or open

1. **Immediate rollback target is healthcheck-compatible.** The current target is deployment
   `ed972e5b` / commit `6ce28d0f`; it serves `/api/healthz`. The older `c819e6a8` drill tuple remains
   historical evidence and must not be selected blindly. Any real rollback still requires owner
   approval and a pre-change healthcheck check.
2. **Unsigned installer, 60-day exception, expires 2026-10-28T20:50:00Z.** No named owner is
   assigned. This is not evidence of a signed release.
3. **P4b Browser five-artifact tuple: OPEN.** The CloakBrowser Stable `.2` engine archive does not
   exist on either drive; Preview `.3` is not a substitute. No tuple was fabricated or signed.
4. **Lane C: CLOSED, not pending.** No CloakBrowser channel exists and the custom-engine track is
   closed on measured RAM (8.231 GiB peak against a >12 GiB gate). `G2-IDENTITY` stays FAIL for this
   product shape. No date, no implied future.
5. **Installer reproducibility: OPEN.** 103-byte residual, classified
   `NSIS-RT_DIALOG-order-and-trailer`, `normalized: false`. Recorded, not normalized away.
6. **Browser CI gate is not currently self-sustaining.** Run `33303002259` proved the full Windows
   matrix passes (quality, package, packaged-contract — no skip), but it depended on a temporary
   cross-repository read secret that was deleted after the run. Until a reviewed permanent
   credential exists, the gate is fail-closed and cannot reproduce that result.
7. **No scratch-branch CI red run captured.** Source-level negative tests exist, but no remote
   matrix has proven the contracts fail when they should. A green gate is not a proven gate.
8. **Relay floor stays at 13.** Route-first evidence for `/v16` and one owner-machine reinstall are
   complete, but the second owner machine has not been observed reporting v16. Moving the floor now
   would strand an unverified machine.

## Not exercised

- Google logout/session revocation and Facebook token revocation were not run, per the owner
  instruction not to revoke sessions or tokens.
- No posting execution was available because `/queue` contained zero jobs; no content was created or
  submitted.
- `/setup` current-PC confirmation was not submitted; Browser/fleet setup remains outside Lane A.
- The Reddit parser failure observed in an earlier run is out of Lane A scope; noted, not fixed.

## Recommendation

**Conditional GO for Lane A as an internal demo / controlled beta**, with residual risks 1–8
accepted by the owner. P4-08 is complete as a bounded smoke.

**NO-GO for anything beyond Lane A.** Nothing here supports a cryptographically signed Browser
release, an identity-isolation claim, a floor bump, or promotion of the Browser tuple.

## Owner signature

- Decision (GO / CONDITIONAL GO / NO-GO): **CONDITIONAL GO**
- Conditions accepted: **Residual risks 1–8 accepted**
- Name and date: **Workspace owner — 2026-09-01 (ICT)**

## Unresolved questions

- Can Railway apply rollback deployment selection and the existing `/api/healthz` healthcheck
  setting atomically under the release runbook? Verify immediately before any real rollback.
- Which reviewed credential grants the Browser workflow read access to private MKTTool permanently?
- Who owns the unsigned-installer exception before 2026-10-28?
