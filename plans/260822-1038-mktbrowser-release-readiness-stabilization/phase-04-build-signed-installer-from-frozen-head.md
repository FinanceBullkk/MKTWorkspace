---
phase: 4
title: "Build Attested Installer from Frozen HEAD"
status: in-progress
priority: P1
effort: "2-4 working days"
dependencies: [1, 2, 3]
---

# Phase 4: Build Attested Installer from Frozen HEAD

## Overview

Produce one Windows installer from the exact frozen MKTBrowser merge-tree artifact and record enough
provenance to prove what operators receive. The current installer predates the latest P0 hardening
and must remain quarantined.

## Signing Decision - Reaffirmed 22 August 2026

The 12 August decision to ship v1 unsigned stands. This plan reopened it on 22 August and required
Authenticode; the owner reaffirmed unsigned the same day, so certificate lead time leaves the
critical path entirely and this phase no longer waits on a signing identity.

That decision is not free, and the cost is stated here rather than discovered by an operator:

- SmartScreen warns on every newly built installer. Onboarding must announce the warning before the
  operator meets it, or the warning teaches people to click through warnings.
- Windows publisher verification is unavailable, so nothing about the file proves who produced it.
  The distribution channel and the published SHA-256 become the only origin evidence there is.
- The existing Ed25519 release-authority ceremony signs compatibility manifests. It is not
  Authenticode and never satisfies publisher verification, but it does authenticate what the
  installer is allowed to deliver, and it remains the mechanism of record.

Reversing this later costs one certificate purchase plus a re-signed rebuild. Nothing here is
designed to make signing harder to add: the ordering below is the ordering a future signing step
would slot into.

## Requirements

- Freeze exact MKTBrowser commit/tree SHA, version, Relay version/hash, dependency lock, and workflow.
- Build twice on clean Windows runners and compare a normalized unsigned payload manifest.
- Differences are allowed only for documented PE/NSIS timestamp fields; `app.asar`, resources,
  packaged dependencies, Relay archive, scripts, and config must match.
- Publish the installer SHA-256 through the operator channel, and verify it on the receiving machine
  before the first install. Unsigned distribution makes this the origin check, not a formality.
- Never rebuild between verification and distribution. The verified artifact is the shipped artifact.
- Announce the SmartScreen warning in the onboarding journey before the operator encounters it.

## Architecture

```text
frozen PR merge tree
  -> clean build A + clean build B
  -> normalized unsigned payload manifests match
  -> choose one verified artifact
  -> produce the final NSIS installer
  -> verify install and uninstall plus the packaged contract on a clean machine
  -> emit provenance, SBOM, hashes, frozen tree SHA, Relay version and hash
  -> retain as canary candidate; do not publish broadly
```

There is no code-signing key to hold. The secret that still matters is the release token that fetches
the licensed engine, which must stay out of logs and artifacts exactly as before.

## File Inventory

| Action | File | Purpose |
|---|---|---|
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\scripts\package-windows.cjs` | Emit the payload manifest and refuse a rebuild after verification |
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\scripts\emit-release-provenance.cjs` | Source/build/artifact/SBOM manifest |
| Modify | `E:\MKTWorkspace\MKTBrowser\.github\workflows\release.yml` | Protected manual release candidate job |
| Modify | `E:\MKTWorkspace\MKTBrowser\README.md` | State that v1 ships unsigned and name the hash to check |
| Modify | `E:\MKTWorkspace\MKTTool\docs\development-roadmap.md` | Record the candidate and the open rollout gates |
| Modify | `E:\MKTWorkspace\MKTTool\docs\project-changelog.md` | Record release-control change |

## Function And Interface Checklist

- [ ] Payload manifest excludes only documented NSIS/PE timestamp regions, and names each exclusion.
- [ ] Provenance binds source commit/tree, workflow run, Node/Yarn/Electron, Relay artifact, dependency
  audit, payload manifest, installer SHA-256, and SBOM.
- [ ] The published installer hash is reproducible from the retained artifact by a second person.
- [ ] Release job is manual/protected and cannot publish or promote without owner authorization.
- [ ] Installer artifact name/version cannot overwrite an older retained candidate silently.

## Implementation Steps

1. Owner freezes the merge tree SHA and records the version, Relay version and hash, dependency lock,
   and the workflow revision that produced the artifact.
2. Add a normalized payload-manifest tool that hashes extracted installer contents while excluding
   only documented NSIS/PE timestamp regions.
3. Build the frozen tree twice on separate clean Windows runners. Compare file inventory, `app.asar`,
   resources, Relay ZIP, scripts, package metadata, and normalized PE payload hashes.
4. Fail on any unexplained difference. Fix nondeterministic build inputs before proceeding.
5. Produce the final NSIS installer from the verified tree, then never rebuild it. The artifact that
   is verified is the artifact that is distributed.
6. Verify the installer and installed files against the published SHA-256. Validate clean install,
   launch, packaged contract, repair/upgrade behavior, uninstall ownership, and no profile deletion.
7. Generate SBOM and release provenance, including the frozen tree SHA, installer SHA-256, Relay
   version and hash, and dependency audit result.
8. Store the candidate in restricted release artifacts with retention. Do not update public or
   internal download pointers before Phase 6 promotes it.

## Test Scenario Matrix

| Priority | Scenario | Expected result |
|---|---|---|
| Critical | Two clean builds from same tree | Normalized payload manifests match |
| Critical | Installer SHA-256 differs from the published value | Candidate rejected |
| Critical | Installer built from SHA different from attestation | Provenance check fails |
| Critical | Installer bytes altered after verification | SHA-256 comparison fails on the receiving machine |
| High | Clean second Windows account install/launch/uninstall | Owned files removed, profiles preserved |
| High | Existing older Browser/Relay installation | Upgrade/ownership behavior matches installer contract |
| Medium | Operator meets SmartScreen on first install | Onboarding already named the warning and the expected hash |

## Regression Gate

```powershell
corepack yarn install --immutable
corepack yarn npm audit --all --recursive --environment production --severity high
corepack yarn test:installer
corepack yarn typecheck
corepack yarn lint
corepack yarn workspace @mktbrowser/desktop build:win
Get-FileHash -Algorithm SHA256 apps/desktop/release/installer/*.exe
```

Run the packaged contract against the installed candidate, not only `win-unpacked`.

## Success Criteria

- [x] Two clean builds have matching normalized payload manifests.
- [x] Candidate source/tree SHA equals the successful required PR gate evidence.
- [ ] Installer SHA-256 is published through the operator channel and matches on the receiving machine.
- [ ] Onboarding states the SmartScreen warning and the expected hash before the operator installs.
- [x] Provenance includes all component hashes, dependency audit, component inventory, and the
  frozen tree SHA. Called an inventory rather than an SBOM because that is what it is.
- [ ] Clean install/launch/repair/uninstall passes; user profiles remain intact.
- [x] Candidate is retained but not distributed beyond approved Phase 5/6 operators.

## First Attested Candidate - 23 August 2026

Run `32616608981`, frozen from commit `eac77f8fd72707cbb5ad867bb69da4358e8cb6f8`.

| Field | Value |
|---|---|
| Frozen tree | `cce7b897233467e457b9cd5c190b6bb4f7201c45` |
| Payload | 128 files, manifest `be9f2c324ea8bdf8ea4aa1ce77ef46ae861f8be48e9ddc02da12149c6ffb503b` |
| Installer | `MKTBrowser-win-x64.exe`, 146,020,764 bytes |
| Installer SHA-256 | `d18c8d79fc6a6f77e1783044e2e9fae4ac28f73b152992bee0a0bcbc6a4e3490` |
| Relay | v15, `cfeefc7f...` |
| Engine | CloakBrowser `151.0.7922.108.2` |
| Component inventory | 11 packaged dependencies, all resolved, none null |
| Authenticode | false, by owner decision |

**The build is reproducible.** This was an open question, not a formality: two clean Windows runners
produced byte-identical payloads after normalizing only the COFF `TimeDateStamp` and the
optional-header `CheckSum`. The same payload manifest hash also appeared on the earlier
`44923854` run, whose commits did not touch the packaged tree, so reproducibility holds across runs
and across commits that leave the payload alone.

The frozen tree was checked against the gated tree rather than assumed equal: PR #8's head tree is
`cce7b897233467e457b9cd5c190b6bb4f7201c45`, identical to the frozen tree above.

## Three Infrastructure Failures, and Why They Are Recorded

Reaching this record took three runs. None of the failures were in the product; all three were in
the measuring apparatus, which is exactly where a failure is most likely to be misread.

1. **A test that passed for the wrong reason.** New workflow assertions used bare newlines against
   files the Windows runner checks out with CRLF. The positive assertion failed loudly. Its negative
   twin - asserting the release-candidate workflow does not trigger on push - passed everywhere,
   because the string it searched for could never appear. It would have kept passing after someone
   added a push trigger. `source()` now normalizes line endings, and the negative assertion was
   proven to bite by temporarily adding the trigger it forbids.

2. **A red run that meant the tool never started.** Both Linux jobs died inside `setup-node`, which
   probes for a package-manager cache using Yarn 1 and refuses a project pinned to yarn@4.5.0. The
   run presented as a reproducibility failure with nothing compared. The real answer was recovered
   by downloading both manifests and comparing them by hand. A red run that means *the tool did not
   start* is dangerous precisely because it looks like a red run that means *the artifact is wrong*.

3. **A correct guard firing on a false alarm.** Attestation refuses a dirty working tree. Both
   artifacts were being unpacked into the checkout, so git reported untracked files and a valid
   candidate was rejected. The obvious repair - relax the cleanliness check until the run goes green
   - would have removed the only thing standing between a dirty tree and a released artifact. The
   downloads moved instead.

Each now has a contract test, and each test was proven to fail before being trusted.

## Clean-Machine Evidence Reconciled - 24 August 2026

Evidence:
`local-test-artifacts/vm/clean-install-evidence.json` and
`local-test-artifacts/vm/clean-install-evidence-reconciliation.json`.

The receiving-machine hash gate is valid. The candidate was pulled from run `32616608981` and hashed
inside a restored Windows 11 Home guest that had no product path and no Node before transfer. The
guest hash equals the published
`d18c8d79fc6a6f77e1783044e2e9fae4ac28f73b152992bee0a0bcbc6a4e3490`.

The combined-install claim is not valid. The first harness treated `MKTBrowser.exe` appearance as
installer completion, but electron-builder copies Browser files before the mandatory `customInstall`
sequence finishes WebRTC firewall setup, pinned Relay installation, the startup shortcut, Publisher,
and Relay ownership metadata. A fresh repair attempt reproduced that partial state: 129 Browser files
and the desktop shortcut existed, while Relay was absent, firewall-rule count was zero, the startup
shortcut was absent, Publisher was unset, and Relay ownership metadata was absent.

| Item | Reconciled result |
|---|---|
| Published SHA-256 matches on the receiving machine | PASS |
| Clean guest and no Node preflight | PASS |
| Browser payload copied | Observed component evidence only |
| Browser first-run provisioning | Observed on the copied Browser component; not supported combined-install proof |
| Supported Browser + Relay install | OPEN; mandatory custom-install work did not complete |
| Repair | FAIL in this environment; Defender remediated installer-spawned PowerShell behavior |
| Combined uninstall ownership | OPEN; the prerequisite combined installed state never existed |
| Browser data preservation | Observed component evidence only |

Microsoft Defender reported `Behavior:Win32/PShellCobStager.A` twice and successfully remediated it.
Defender was not disabled or allow-listed. The installer remains unsigned by owner decision. The
candidate therefore stays retained but cannot close the clean install/repair/uninstall criterion.

## Risk Assessment

- An unsigned installer trains operators to dismiss SmartScreen, and a habit of dismissing warnings
  is worth more to an attacker than any single unsigned file. Mitigation: onboarding names the exact
  warning, the exact publisher-unknown text, and the hash to check, so the operator is verifying
  rather than clicking through.
- Without publisher verification, a substituted installer is indistinguishable by inspection.
  Mitigation: the published SHA-256 and a controlled distribution channel are treated as the origin
  check, and an unverified hash blocks the install rather than warning about it.
- `signAndEditExecutable` remains disabled because of Windows symlink privilege issues. It stays
  disabled; nothing in this phase depends on it.

## Security Considerations

There is no code-signing key to protect, which removes a release-authority secret rather than
securing one. What remains is the release token that fetches the licensed engine, plus the integrity
of the channel that publishes the installer hash. Neither may appear in logs or artifacts.

The Ed25519 release-authority ceremony is unchanged and still authorizes what the installer may
deliver. It is not a substitute for Authenticode and is not described as one.

## Next Step

Keep this older candidate quarantined. Change the installer implementation so mandatory firewall and
Relay work completes without the current Defender detection, rebuild once from the current frozen
source, then require that exact attested artifact to pass combined install and repair before it can
enter the remaining Phase 5 real-environment tests.
