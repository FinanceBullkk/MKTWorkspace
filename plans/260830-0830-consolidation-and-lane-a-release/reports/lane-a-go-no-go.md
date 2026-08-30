# Lane A GO/NO-GO decision record

Prepared: 2026-08-30 (ICT)
Status: **DECISION-READY — UNSIGNED. Owner signature required.**
Prepared by: reviewing agent. Not signed; the owner is the accountable human.

Satisfies P4-09 step 10 ("Record the Lane A decision"). Phase 4 criterion
`A signed Lane A GO/NO-GO exists with residual risks named` stays unticked until the owner signs
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
| Deployed | Railway deployment `ed972e5b-7597-4c6d-8066-24bc11c4ea0b`, created `2026-08-30T06:38:14.156Z`, status `SUCCESS` |
| Health route | `/api/healthz` HTTP 200, `ok=true`, `status=ready`, checked `2026-08-30T06:48:21Z` |
| Relay route (route-first) | Full GET, HTTP 200, 33,342,752 bytes, sha256 `5c98cf46…` — hash comparison, not HEAD |
| Backup + restore | `db:backup:remote` 22,575 ms; `db:restore:verify` PASS, 101/101 aggregate, `mismatches=[]`, `cleanup=PASS` — run against the current database |
| Rollback rehearsal (P4-09) | Executed in a disposable environment; qualified PASS. See `rollback-drill-p4-09.md` |
| Healthcheck timeout | `null` retained deliberately; inherits Railway's documented 300 s deploy-time bound. See `healthcheck-timeout-decision.md` |
| Better Auth shared-IP warning | Resolved; absent from latest deployment logs |

## Residual risks — named, accepted or open

1. **Rollback is not currently executable without an owner decision.** The recorded prior image
   `c819e6a8` does not serve `/api/healthz` (404 measured in the drill), while the live service
   healthcheck targets that path, and Railway does not restore healthcheck settings from an image.
   A real rollback fails promotion until a prior-compatible path is selected or the healthcheck is
   temporarily disabled. **This is the most consequential residual risk: production is live with a
   recovery path that requires one human decision before it will work.**
   Mitigation recorded in `MKTTool/docs/runbooks/release-rollback.md`.
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
8. **Relay floor stays at 13.** Route-first evidence for `/v16` is complete, but the owner's two v15
   machines have not been observed reporting v16. Moving the floor now would strand them.

## Not exercised

- **P4-08 bounded credentialed/admin smoke has not been run.** Admin-led flows, posting-safety
  confirmation on destructive actions, scheduled job health, and backup freshness are unverified
  against the live deployment by a credentialed operator.
- The Reddit parser failure observed in an earlier run is out of Lane A scope; noted, not fixed.

## Recommendation

**Conditional GO for Lane A as an internal demo / controlled beta**, with risks 1–8 accepted, on two
conditions:

- **C1.** The owner records a prior-compatible healthcheck path (or an approved temporary disable
  procedure) so the recovery path is executable. Until then production is live without a working
  rollback, which is the single largest exposure.
- **C2.** P4-08 is run and recorded, or Lane A is explicitly scoped to exclude credentialed admin
  flows until it is.

**NO-GO for anything beyond Lane A.** Nothing here supports a signed release, an identity-isolation
claim, a floor bump, or promotion of the Browser tuple.

## Owner signature

- Decision (GO / CONDITIONAL GO / NO-GO): ______________________
- Conditions accepted (C1, C2): ______________________
- Name and date: ______________________

## Unresolved questions

- Which prior-compatible unauthenticated 200 route is approved for rollback, and can Railway apply
  the healthcheck setting atomically with historical deployment selection?
- Which reviewed credential grants the Browser workflow read access to private MKTTool permanently?
- Who owns the unsigned-installer exception before 2026-10-28?
