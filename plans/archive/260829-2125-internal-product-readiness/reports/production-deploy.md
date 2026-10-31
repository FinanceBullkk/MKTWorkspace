# S4b production deployment record

> **Historical pre-merge snapshot — superseded by the P4a post-deploy record.** The 404/401 probes
> and `NOT RUN` result below describe the old deployment only. PR #40 subsequently deployed through
> the master/Railway integration; see `plans/260830-0830-consolidation-and-lane-a-release/reports/
> lane-a-deploy.md`. The Browser tuple remains P4b OPEN and Lane C is CLOSED with no CloakBrowser
> channel.

Date: 2026-08-30 (ICT)  |  Service: `mkttool-web`  |  Result: NOT DEPLOYED / PRECONDITIONS OPEN

## Commands executed

| Command | Result |
|---|---|
| `railway status --json` | Read-only baseline captured; deployment `3621f603-1c51-4246-824c-55cc0e6b5764`, commit `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`, one running replica, healthcheck unset |
| Authenticated/unauthenticated route probes | `/api/healthz` 404; `/api/relay/download/v16` 401; `/api/relay/download/v15` 401; `/login` 200; `/setup` 307 |
| `railway up --service mkttool-web` | **NOT RUN** — signed P4 tuple, exact engine archive, clean-VM lifecycle, and live route preconditions are absent |

The deployment command was intentionally not substituted with a bare `railway up`. No remote
database migration, environment-variable change, healthcheck change, floor bump, or rollback was
performed.

## Preconditions review

- Remote backup plus disposable restore verification: local evidence PASS in
  local-only `restore-verify-20260830-r4.json`; its raw output is withheld from Git per
  `reports/restore-verify-receipt-redaction.md`; no remote migration applied.
- Rollback tuple: recorded in `final-freeze-s4b.md`; workspace owner remains the sole rollback
  approver.
- Healthcheck: target path is `api/healthz`, but Railway currently reports `healthcheckPath: null`.
- Signed P4 tuple: not available; release manifest remains `draft`.
- Browser/engine/compatibility publication: OPEN; no Browser bytes or pointer were published.
- Relay route/floor: `/v16` real authenticated GET is not reachable from the old deployment; the
  `13 -> 16` floor was not raised.

## Safe next sequence after external gates close

1. Re-run `railway status --json` and capture the deployment ID/commit immediately before any
   authorized deploy.
2. Verify the signed manifest, remote backup/restore receipt, exact healthcheck configuration, and
   immutable artifact GET/hash tuple.
3. Run exactly `railway up --service mkttool-web` from the frozen MKTTool source. Capture the new
   deployment ID, commit, healthcheck result, `/api/healthz` 200 response, and authenticated release
   provenance tuple.
4. Re-run `railway status --json` immediately after and compare the deployed commit and service
   configuration to the signed manifest.
5. Only after a real `/v16` GET, complete fleet migration/revocation receipts, and owner review may
   the server floor move from 13 to 16. The route must be reachable before the floor changes.

Any mismatch is a stop-the-line event. Do not overwrite immutable objects or execute rollback without
the workspace owner's explicit approval.
