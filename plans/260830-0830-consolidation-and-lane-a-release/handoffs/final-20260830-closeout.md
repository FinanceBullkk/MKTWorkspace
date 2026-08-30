# Final closeout handoff — consolidation and Lane A release

Date: 2026-08-30 (ICT)
Status: **CLOSEABLE WORK COMPLETE; STOPPED AT EXTERNAL/HUMAN BOUNDARIES**

This handoff follows the dated decisions in `decisions.md`. It records what was closed in the
requested order and does not convert a skipped job, a missing artifact, or a synthetic check into a
promotion pass.

## Closed

### 1. P4-09 disposable rollback rehearsal

The drill was executed against the recorded tuple:

- prior deployment: `3621f603-1c51-4246-824c-55cc0e6b5764`
- prior commit: `c819e6a8dff5cac027d24b4a9d488ec241e2ccaa`
- migration action: `npx prisma migrate deploy`

The current production database was backed up (22,575 ms), restored into disposable PostgreSQL
(7,897 ms), the candidate migration was applied (12,053 ms), the exact prior source was rebuilt
(19,651 ms) and started against pre- and post-migration schemas, and the disposable databases were
dropped (`CLEANUP_REMAINING=0`). The prior migration command returned no pending migrations. No
Railway deploy, rollback, migration, setting change, or production data mutation occurred.

The rehearsal also reproduced the important operational stop condition: the prior source returns
404 for `/api/healthz`, while the live service healthcheck targets `/api/healthz`. Therefore the
drill is qualified PASS, but a real rollback remains gated on an owner-approved prior-compatible
healthcheck choice. Full timings, hashes, commands, and failure signatures are in
`../reports/rollback-drill-p4-09.md`.

### 2. U2 Windows Browser runner repair

The deterministic Node 22 helper and workflow changes are committed on the MKTBrowser release
branch (`ceafe30`, with the sibling-checkout ref correction `6d737f8`). Local PowerShell parsing,
Node 22/toolcache fallback, Corepack, and the 23/23 runtime contract passed. Remote run
`33301446012` proves `Setup Node.js 22` and `Pin Node.js 22 executable` now pass and report the
absolute Node 22 toolcache executable.

The original defect is closed. The overall Browser matrix is intentionally still **OPEN**: the
required private `Techieslab-app/MKTTool` checkout returns `repository not found` under the workflow
token, so quality fails closed and `windows / package` plus `windows / packaged-contract` are
skipped. This is real failure evidence, not promotion evidence. The exact signatures are in
`U2-contracts-in-ci.md`.

### 3. P3-06 twice-build comparison and manifest disposition

`MKTBrowser/.github/workflows/release-candidate.yml` now retains two independent builds, always
runs the comparison/status job, emits a machine-readable result, uploads both manifests and logs,
and fails closed when a build or manifest is missing. The static release-contract and normalized
payload tests pass 11/11; the retained payload pair compares equal (128 files, digest
`dd4d2d3718c6aea0c33b819b65eb13478bab431016fa0a658e92d3fbf5850f53`).

The release manifest now records:

```json
{
  "installerReproducibility": "OPEN",
  "residualBytes": 103,
  "classification": "NSIS-RT_DIALOG-order-and-trailer",
  "normalized": false
}
```

The 103-byte outer-installer residual is preserved; no bytes were normalized and no installer was
promoted or signed. Source-level P3-06 is closed. A remote candidate artifact receipt remains OPEN
until the exact candidate/archive and sibling-repository access are available.

### 4. Phase 6 bookkeeping

The active consolidation Phase 6 already has its first two criteria checked: the custom-engine track
is closed with the measured resource rationale, and the `>16 GiB`/funded-cloud plus named-owner
reopening condition is explicit. The unticked first two boxes in the predecessor Phase 6 are
historical, reopen-only criteria; leaving them unticked is correct because no new vendor/operator/
network/second-PC gate ran. See `../reports/phase-06-bookkeeping.md`.

### 5. `healthcheckTimeout: null`

The value is intentionally retained. Railway's current documentation defines the inherited
deploy-time healthcheck timeout as 300 seconds; `null` is bounded, not infinite. Live service
metadata reports `healthcheckPath=/api/healthz`, `healthcheckTimeout=null`, and no explicit timeout
variable. The decision and recheck conditions are in `../reports/healthcheck-timeout-decision.md`.

## Remains OPEN (or explicitly closed outside this run)

- **U2 Browser remote matrix:** private MKTTool sibling read access is missing. Until that is fixed,
  the required quality/package/packaged-contract chain cannot produce a complete result.
- **P3 outer installer:** 103-byte `NSIS-RT_DIALOG-order-and-trailer` variance remains OPEN. A
  supported source/toolchain fix or a structurally justified future decision is required; do not
  widen a normalizer.
- **P4a Lane A:** P4-08 bounded credentialed/admin smoke and a signed GO/NO-GO remain OPEN. The
  disposable rollback rehearsal is complete, but the prior-image healthcheck mismatch must be
  resolved by the owner before any real rollback. Production rollback was not executed.
- **P4b Browser tuple:** OPEN because the exact Stable `.2` engine archive is absent on both drives.
  Preview `.3` is not a substitute. No five-artifact tuple was fabricated or signed.
- **P5 fleet floor:** `MIN_RELAY_VERSION` remains **13**. Route-first `/v16` evidence is complete,
  but both owner machines still need observed self-serve 0.3.13 reinstalls and v16 health responses
  before a floor bump/revocation procedure can run.
- **G2/Lane C:** **CLOSED**, not waiting: there is no CloakBrowser channel and the custom-engine
  track is closed at the measured RAM gate. Any alternative-vendor path is a new product decision.
- **Unsigned installer exception:** the existing 60-day exception still needs a named owner; it is
  not evidence of a signed release.

## Exact remaining owner actions

1. Add a reviewed read-only GitHub Actions credential (or an equivalent reviewed MKTTool checkout
   artifact) to the MKTBrowser workflow, then rerun the Browser matrix from the repaired branch.
   Require the quality, package, and packaged-contract jobs to complete; a skip is not closure.
2. For a valid release candidate, dispatch the manual P3 workflow and retain
   `payload-reproducibility-evidence`; separately decide whether a supported NSIS/electron-builder
   source fix can remove the 103-byte residual. Do not normalize or sign around it.
3. Choose and document a healthcheck route/settings combination served by the prior commit with
   HTTP 200 (and whether Railway can apply it atomically with a rollback). Only then may the sole
   rollback approver execute a production rollback, if one is actually needed.
4. Run the bounded credentialed Lane A smoke and sign the resulting GO/NO-GO with the residual risks
   above.
5. On both owner machines, self-serve reinstall 0.3.13 and return observed v16 health evidence.
   After full route/hash and version probes pass, revoke the v15 tuple and raise the floor 13→16;
   until then leave the floor at 13.
6. If Browser identity work is ever reconsidered, obtain an exact licensed Stable artifact and a new
   owner/budget decision; do not reopen Lane C or consume a CloakBrowser seat under this release.
7. Assign an owner to the unsigned-installer exception before its expiry.

## Explicit non-actions

No production rollback, production migration, Railway setting mutation, Relay-floor bump, v15
revocation, custom-engine build, CloakBrowser-seat consumption, Browser tuple fabrication, or
Preview-as-Stable substitution was performed.

## Unresolved questions

- Which prior-compatible unauthenticated 200 route is approved for a real rollback, and can the
  healthcheck setting be changed atomically with deployment selection?
- Which reviewed credential/artifact will grant the Browser workflow read access to private MKTTool?
- Who owns the unsigned-installer exception and the future alternative-vendor decision?
