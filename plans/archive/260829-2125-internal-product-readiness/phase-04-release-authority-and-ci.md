---
phase: 4
title: "release-authority-and-ci"
status: partial
priority: P1
effort: "2–3 days"
dependencies: [1, 2, 3, 5]
---

# Phase 4: release-authority-and-ci

> **Historical predecessor release phase — superseded by the successor P4a/P4b split.** P4a MKTTool
> Web merged to `master` and deployed successfully; Browser signing/five-artifact work remains P4b
> OPEN. Do not read the pre-deploy Railway statements below as current production state.

## Overview

Prepare and then execute a build-once, verify-once, promote-by-hash release ceremony. CI scaffolding
may start early, but the phase is not complete until it consumes the final P2/P3/P5 tuple, signs it,
publishes immutable objects, aligns Railway, and records a rollback pointer. Preserve the local
disposable VM as the primary clean-environment gate, and ensure a skipped live test is visible as
OPEN rather than silently counted as PASS.

## Requirements

- Functional: one final frozen source commit produces the installer and all evidence consumed by
  later phases; no rebuild occurs between final verification and publication. Earlier draft builds
  are explicitly superseded.
- Functional: CI validates version coherence, Relay pin/hash, package contract, dependency audit,
  clean install lifecycle, and provenance before release promotion.
- Functional: release authority can revoke the bad 0.3.12/v15 tuple, publish the new tuple, align
  Railway to it, and execute a documented rollback without overwriting immutable objects.
- Functional: the release manifest joins independent MKTTool, MKTBrowser, Relay, and engine
  SHAs/tags; it never assumes one Git branch/commit covers all repositories.
- Functional: already-downloaded vulnerable installers are handled through compatibility-floor/
  revocation checks, fleet notification, and profile/device quarantine; changing an R2 pointer alone
  is not considered recall.
- Non-functional: secrets stay in CI/host secret stores and never in logs, manifests, or Git.
- Operational: local VM results, host results, and optional GitHub results are reported separately.

## Architecture

```text
frozen commit/tag
   -> CI build + independent reproducibility build
   -> compare normalized payload/provenance
   -> clean disposable VM install/recovery
   -> release-authority verification/signature
   -> publish immutable manifest/artifact
   -> promote pointer + monitor + revocation/rollback
```

The release manifest is the authority boundary, not a mutable filename. It must reference the exact
P2/P3 tuple, test run IDs, engine/license evidence, and deployment target. The release channel may
point to only an approved manifest; revocation removes the pointer without deleting forensic hashes.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `MKTBrowser/.github/workflows/release-candidate.yml` | Modify/verify | Frozen commit, independent builds, CFT compatibility, installer lifecycle. |
| `MKTBrowser/.github/workflows/windows-pipeline.yml` and `pr-release-gate.yml` | Modify/verify | Required Windows quality and package checks; make skips explicit. |
| `MKTBrowser/.github/workflows/release.yml` | Modify/verify | Promotion, provenance, and release channel controls. |
| `MKTBrowser/scripts/emit-release-provenance.cjs` | Modify/verify | Source/artifact/engine provenance. |
| `MKTBrowser/scripts/normalized-payload-manifest.cjs` | Modify/verify | Deterministic payload comparison. |
| `MKTBrowser/scripts/verify-packaged-runtime-contract.cjs` | Modify/verify | Label CFT compatibility proof separately from identity proof. |
| `MKTTool/scripts/publish-relay-release.ts` | Verify | Immutable Relay upload/read-back. |
| `MKTTool/scripts/publish-windows-installer.ts` | Modify | Full-byte read-back, versioned metadata, and revocation/rollback pointer. |
| `MKTTool/scripts/sign-compatibility-manifest.ts` and `scripts/release-authority/*` | Verify/extend | Owner authorization and signatures without committing keys. |
| `MKTTool/src/lib/release/*` | Verify/extend | Compatibility manifest, rollback authorization, and artifact paths. |
| `MKTBrowser/apps/desktop/scripts/package-windows-quality-gates.test.cjs` | Extend | Exact payload/installer assertions. |
| `plans/260829-2125-internal-product-readiness/reports/release-run.md` | Create | Candidate build/promotion audit trail. |

## Implementation Steps

1. Decide the required-check source of truth: restore the self-hosted runner and PR #39 path if it
   is available, or document the local disposable VM as the authoritative gate with a clearly named
   optional GitHub confirmation. Do not wait on an offline runner while leaving the gate ambiguous.
2. Update workflows to build from a frozen commit and upload one immutable candidate bundle. A
   second independent job downloads/rebuilds and compares normalized payloads, source SHA, Relay
   archive/EXE SHA, app.asar SHA, engine pin, and installer hash.
3. Add explicit status outputs for every gate. A skipped Windows-live/human/vendor/network test
   must emit `OPEN` with a reason and owner; it must fail promotion if the lane requires it.
4. Add CI assertions that root/desktop/product version, `relay-release.json`, embedded Relay
   metadata, engine manifest, and release manifest agree. Reject old v15/0.3.12 hashes and any
   unpinned CFT or `MKT_BROWSER_ALLOW_UNPINNED_ENGINE` path in a production candidate.
5. Run the complete MKTBrowser suite: `yarn test:installer` (which already chains the W02, MKB01,
   MKB01E, MKB02, MKB03, packaging, settings-store, and cdp-driver suites plus the provenance and
   payload-manifest contracts — do not invoke those separately and double-run them), then `yarn
   typecheck`, `yarn lint`, `yarn build`, and `yarn verify:packaged-contract`. Run the MKTTool
   quality suite (tests, critical coverage, typecheck, lint, build). Store command output with
   candidate ID.
6. Run the clean disposable Windows VM gate from a reset snapshot: install, first run, ports,
   firewall, repair, uninstall, reboot/power-cycle recovery, and exact P2 replay. Report this
   separately from the host and CI runner.
7. Use the release-authority ceremony to sign/approve the manifest. Keep signing material in the
   approved offline/DPAPI mechanism; never place private keys, bearer tokens, or receipts containing
   secrets in Git or plan evidence.
8. Publish Relay, compatibility artifacts/revocations, installer, and release pointer in dependency
   order. Verify every object by full GET/hash and metadata, then record URLs and immutable versions.
   Quarantine/revoke the known-bad 0.3.12 pointer without deleting its negative evidence. Ensure
   downloaded v15 devices are denied new tickets/leases by the compatibility floor, notified, and
   given a tested upgrade/quarantine path; an R2 pointer change cannot recall an EXE already on disk.
9. Align Railway only after the signed bundle exists: run the Phase 5 backup/migration preflight,
   `railway status`, and `railway up --service mkttool-web`; verify the deployed commit/provenance,
   healthcheck, and rollback pointer. A deployment from an unsigned or draft tuple is a hard fail.
10. Write a rollback runbook with a complete tuple (source SHA, DB migration state, Relay version,
   Browser installer hash, engine pin, release pointer, Railway deployment) and a stop-the-line
   decision tree. Exercise it in a disposable environment before promotion.
11. Obtain release-owner, security, and operations signoff; hand the signed, deployed candidate and
    ledger to Phase 6/7. If any required check is skipped or non-reproducible, leave the candidate
    OPEN. Any source/config/engine change after this point requires a new freeze, signature, deploy,
    and downstream evidence run.

## Test Scenario Matrix

| ID | Scenario | Method | Expected result | Evidence |
|---|---|---|---|---|
| P4-01 | Frozen source | CI checks commit/tree against manifest | All jobs use one source SHA | CI manifest |
| P4-02 | Independent rebuild | Two clean jobs compare normalized payload | Equal or documented deterministic differences; unexplained drift blocks | Compare report |
| P4-03 | Version/pin contract | Static + packaged tests | No root/desktop/Relay/engine drift | Test log |
| P4-04 | Skipped gate handling | Force live-test skip | Status is OPEN and promotion is blocked for Browser lane | CI summary |
| P4-05 | Full quality suite | MKTTool + MKTBrowser commands | Existing green baseline remains green on candidate | Logs/coverage |
| P4-06 | Clean VM | Reset snapshot lifecycle/recovery | New exact installer passes; host result separated | VM bundle |
| P4-07 | Signature/authorization | Verify signed manifest with public material | Tampering or wrong tuple is rejected | Ceremony receipt |
| P4-08 | Publish read-back | Full GET and SHA for each object | Served bytes equal signed manifest | R2 report |
| P4-09 | Revocation | Revoke bad pointer, request download | Bad candidate is unavailable/marked revoked; hashes retained | Revocation log |
| P4-10 | Rollback drill | Restore previous known-good tuple in disposable env | Bounded, documented recovery with no immutable overwrite | Drill report |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| Release manifest | Signed/approved, immutable candidate ID, complete hashes and test statuses. |
| Multi-repo tuple | Independent MKTTool/MKTBrowser/Relay/engine source SHAs/tags and clean-worktree policy are explicit. |
| CI status contract | `PASS/FAIL/OPEN/BLOCKED/SKIPPED` is machine-readable; skipped cannot satisfy required gate. |
| Provenance emitter | Includes source/tree/app.asar/Relay/engine/installer hashes and toolchain. |
| Payload normalizer | Ignores only documented nondeterministic fields; reports all meaningful drift. |
| Publisher | Uses immutable versioned objects, full-byte read-back, and revocation pointer. |
| Downloaded-artifact revocation | Server compatibility floor/revocation denies vulnerable local binaries and records fleet notification/quarantine. |
| EXE signing | Authenticode verification is a separate gate from manifest signing; an unsigned exception has owner/expiry/controls. |
| Release authority | Verifies signer, approver, candidate tuple, and key custody. |
| Rollback authorization | Requires a complete prior tuple and records reason/approver/time. |
| CI secret handling | Secret values are masked and excluded from artifacts/logs. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| P1 manifest | P1 → P4 | Authority and lane definitions. |
| P2 Relay tuple | P2 → P4 final bundle | CI/publisher verifies the fixed artifact before promotion; CI scaffolding can start after P1. |
| P3 installer tuple | P3 → P4 final bundle | Build-once release bundle; any draft is rebuilt/rehash-checked after P5. |
| P5 production/security tuple | P5 → P4 final bundle | Auth, health, rate-limit, one-seat, dependency, and docs changes must be in the final freeze. |
| Runner/VM capacity | External → P4 | Windows packaging and clean gate. |
| Release signing key custody | External → P4 | Authorization cannot be simulated by a local hash. |
| P4 signed bundle | P4 → P6/P8 | Deployment and real-environment tests consume exactly this final bundle; P5 feeds into the freeze and is not downstream of it. |

## Historical S4b record (pre-P4a; retained for evidence)

The release-authority controls and preflight are implemented locally, but the Browser candidate was not
promotable. The Browser draft (`0.3.13` + Relay v16) passed host quality checks; normalized payload,
`app.asar`, and embedded Relay bytes match across the final build pair. The outer NSIS installers
differed by 78 bytes, the source trees were dirty, and the exact licensed Stable `.2` archive was absent.
The release manifest remains `status: draft`; the publisher refuses it before R2 mutation until a
complete approved/signed tuple exists. Relay v16 alone was published with full byte/hash read-back.
Railway was read-only inspected and no deployment or floor change ran at that checkpoint. The
successor independently deployed P4a Web through `master`; P4b remains OPEN and Lane C is CLOSED.
See `reports/release-run.md`, `reports/final-freeze-s4b.md`, and the successor deployment report.

## Success Criteria

- [ ] Frozen-source, independent-build, quality, and clean-VM checks are machine-readable and hash-bound.
- [ ] Skipped live tests remain OPEN and block Browser promotion.
- [ ] Signed release manifest, immutable objects, revocation pointer, and rollback tuple exist.
- [ ] Full-byte read-back proves served artifacts equal the signed manifest.
- [ ] Compatibility manifest/revocations handle already-downloaded v15 devices; pointer changes are
  not treated as recall.
- [ ] EXE Authenticode is verified, or a named/expiring internal-only exception with distribution
  controls is approved separately from manifest signing.
- [ ] Release authority and operations owners approve the candidate; no secrets enter evidence.

## Risk Assessment

- **Runner outage:** CI appears green only because a job was skipped. Mitigate with local VM as
  primary gate and explicit OPEN status.
- **Nondeterministic builds:** two installers differ while hashes are accidentally overwritten.
  Mitigate with normalized comparison, immutable keys, and stop-the-line review.
- **Key compromise:** signing/private credentials leak through logs or artifacts. Mitigate with
  offline/DPAPI custody, masking, least privilege, and secret scans.
- **Rollback illusion:** old source cannot read new schema/artifact. Mitigate with DB migration
  compatibility checks, complete rollback tuple, and a disposable drill.
