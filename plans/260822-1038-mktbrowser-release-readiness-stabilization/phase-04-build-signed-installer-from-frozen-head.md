---
phase: 4
title: "Build Signed Installer from Frozen HEAD"
status: pending
priority: P1
effort: "2-4 working days after code-signing identity is available"
dependencies: [1, 2, 3]
---

# Phase 4: Build Signed Installer from Frozen HEAD

## Overview

Produce one Windows installer from the exact frozen MKTBrowser merge-tree artifact, verify it before
and after signing, and record enough provenance to prove what operators receive. The current unsigned
installer predates the latest P0 hardening and must remain quarantined.

This phase changes the 12 August decision to ship unsigned. The existing Ed25519 release-authority
ceremony signs compatibility manifests; it is not an Authenticode certificate and cannot satisfy
Windows publisher verification. A separate Windows code-signing identity is required.

## Requirements

- Freeze exact MKTBrowser commit/tree SHA, version, Relay version/hash, dependency lock, and workflow.
- Build twice on clean Windows runners and compare a normalized unsigned payload manifest.
- Differences are allowed only for documented PE/NSIS timestamp fields; `app.asar`, resources,
  packaged dependencies, Relay archive, scripts, and config must match.
- Use hardware/cloud-backed Authenticode signing. Do not store a long-lived exportable PFX in the repo.
- RFC 3161 timestamp signatures and verify trust after network-disconnected install validation.
- Sign application/Relay executable payloads before NSIS packaging, then sign the final installer.
- Never rebuild between verification and signing.

## Architecture

```text
frozen PR merge tree
  -> clean build A + clean build B
  -> normalized unsigned payload manifests match
  -> choose one verified unsigned artifact
  -> sign inner PE payloads
  -> build/sign final NSIS installer
  -> verify Authenticode + install/uninstall + packaged contract
  -> emit provenance, SBOM, hashes, certificate identity, timestamp
  -> retain as canary candidate; do not publish broadly
```

Preferred key custody is GitHub OIDC to a cloud signing service or a hardware-backed certificate on a
controlled release machine. If a PFX is temporarily unavoidable, it must be encrypted, access-scoped,
rotatable, absent from logs/artifacts, and treated as an interim exception with an expiry.

## File Inventory

| Action | File | Purpose |
|---|---|---|
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\electron-builder.yml` | Enable/customize signing after PE identity edits |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\electron-builder-installer.yml` | Installer signing hooks and publisher metadata |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\scripts\edit-windows-executable.cjs` | Preserve edit-before-sign ordering |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\scripts\package-windows.cjs` | Build manifest and no-rebuild signing handoff |
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\scripts\sign-windows-artifacts.cjs` | Authenticode provider boundary |
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\scripts\verify-windows-artifact-signatures.ps1` | Signature, chain, timestamp, publisher checks |
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\scripts\emit-release-provenance.cjs` | Source/build/artifact/SBOM manifest |
| Modify | `E:\MKTWorkspace\MKTBrowser\.github\workflows\release.yml` | Protected manual release candidate job |
| Modify | `E:\MKTWorkspace\MKTBrowser\README.md` | Replace unsigned artifact claims after proof |
| Modify | `E:\MKTWorkspace\MKTTool\docs\development-roadmap.md` | Record signed candidate and open rollout gates |
| Modify | `E:\MKTWorkspace\MKTTool\docs\project-changelog.md` | Record release-control change |

## Function And Interface Checklist

- [ ] Signing provider receives file path and immutable expected SHA-256.
- [ ] PE resource editing always completes before signing.
- [ ] Signature verifier checks status, subject/publisher, thumbprint/key ID, timestamp, and file hash.
- [ ] Provenance binds source commit/tree, workflow run, Node/Yarn/Electron, Relay artifact, dependency
  audit, unsigned manifest, signed hashes, and SBOM.
- [ ] Release job is manual/protected and cannot publish or promote without owner authorization.
- [ ] Installer artifact name/version cannot overwrite an older retained candidate silently.

## Implementation Steps

1. Owner selects Authenticode provider and legal publisher name. Complete certificate/service setup and
   document custody, rotation, revocation, and emergency-stop ownership.
2. Add a normalized payload-manifest tool that hashes extracted installer contents while excluding
   only documented signature/timestamp regions.
3. Build the frozen tree twice on separate clean Windows runners. Compare file inventory, `app.asar`,
   resources, Relay ZIP, scripts, package metadata, and normalized PE payload hashes.
4. Fail on any unexplained difference. Fix nondeterministic build inputs before proceeding.
5. Implement signing after `rcedit`: sign Browser/helper/native/Relay PE files required by policy,
   package NSIS, then sign the installer. Use RFC 3161 timestamping with a pinned approved URL.
6. Verify the signed installer and installed files with Windows APIs/PowerShell. Validate clean install,
   launch, packaged contract, repair/upgrade behavior, uninstall ownership, and no profile deletion.
7. Generate SBOM and release provenance. Record pre-sign and post-sign hashes because signatures make
   final bytes intentionally differ from unsigned inputs.
8. Store the candidate in restricted release artifacts with retention. Do not update public/internal
   download pointers until Phase 6 GO.

## Test Scenario Matrix

| Priority | Scenario | Expected result |
|---|---|---|
| Critical | Two clean unsigned builds from same tree | Normalized payload manifests match |
| Critical | Inner executable modified after signing | Signature verification fails |
| Critical | Wrong/expired/revoked publisher certificate | Candidate rejected |
| Critical | Installer built from SHA different from attestation | Provenance check fails |
| High | Timestamp service temporarily unavailable | Bounded retry; no untimestamped release candidate |
| High | Clean second Windows account install/launch/uninstall | Valid publisher, owned files removed, profiles preserved |
| High | Existing older Browser/Relay installation | Upgrade/ownership behavior matches installer contract |
| Medium | Offline signature inspection after timestamp | Signature remains valid and identifies expected publisher |

## Regression Gate

```powershell
corepack yarn install --immutable
corepack yarn npm audit --all --recursive --environment production --severity high
corepack yarn test:installer
corepack yarn typecheck
corepack yarn lint
corepack yarn workspace @mktbrowser/desktop build:win
powershell.exe -NoProfile -File apps/desktop/scripts/verify-windows-artifact-signatures.ps1
```

Run packaged contract against the installed signed candidate, not only `win-unpacked`.

## Success Criteria

- [ ] Two clean builds have matching normalized unsigned payload manifests.
- [ ] Candidate source/tree SHA equals the successful required PR gate evidence.
- [ ] Installer and required installed PE files show `Valid` Authenticode status, expected publisher,
  and trusted timestamp.
- [ ] Provenance includes all component hashes, dependency audit, SBOM, and signing identity.
- [ ] Clean install/launch/repair/uninstall passes; user profiles remain intact.
- [ ] Candidate is retained but not distributed beyond approved Phase 5/6 operators.

## Risk Assessment

- Certificate procurement may dominate calendar time. Mitigation: start provider selection in parallel
  with Phases 1-3; no unsigned rollout fallback.
- Signing destroys byte-for-byte reproducibility. Mitigation: compare normalized unsigned payloads and
  record both pre/post-sign hashes.
- `signAndEditExecutable` was disabled due Windows symlink privilege issues. Mitigation: use a custom
  post-edit signing boundary or cloud signer; test on non-admin clean runners.

## Security Considerations

Code-signing keys are release authority. Use least privilege, protected environments, approval gates,
short-lived credentials where possible, audit logs, revocation procedure, and no secret output.

## Next Step

The exact signed candidate becomes the only artifact eligible for Phase 5 real-environment tests.
