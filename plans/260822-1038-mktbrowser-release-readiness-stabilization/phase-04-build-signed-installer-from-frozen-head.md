---
phase: 4
title: "Build Attested Installer from Frozen HEAD"
status: pending
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

- [ ] Two clean builds have matching normalized payload manifests.
- [ ] Candidate source/tree SHA equals the successful required PR gate evidence.
- [ ] Installer SHA-256 is published through the operator channel and matches on the receiving machine.
- [ ] Onboarding states the SmartScreen warning and the expected hash before the operator installs.
- [ ] Provenance includes all component hashes, dependency audit, SBOM, and the frozen tree SHA.
- [ ] Clean install/launch/repair/uninstall passes; user profiles remain intact.
- [ ] Candidate is retained but not distributed beyond approved Phase 5/6 operators.

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

The exact verified candidate becomes the only artifact eligible for Phase 5 real-environment tests.
