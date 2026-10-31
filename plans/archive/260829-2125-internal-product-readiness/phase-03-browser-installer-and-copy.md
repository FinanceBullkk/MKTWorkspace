---
phase: 3
title: "browser-installer-and-copy"
status: partial
priority: P0
effort: "3–4 days (Windows packaging + UI/doc contract)"
dependencies: [1, 2, 5]
---

# Phase 3: browser-installer-and-copy

> **Historical Browser packaging phase — superseded by U3.** Its earlier 78-byte installer snapshot
> is retained as history; the current controlled U3 experiment records a 103-byte residual. P4a Web
> deployment is independent; P4b Browser provenance/tuple remains OPEN.

## Overview

Build one Browser installer from a clean, frozen tree with the verified Relay artifact from Phase 2,
then make every version, hash, engine label, and onboarding statement derive from that release
manifest. The existing 0.3.12 installer is a quarantined negative artifact; do not patch it in place
or reuse its evidence.

## Requirements

- Functional: installer payload contains the exact Phase 2 Relay archive and manifest and launches
  the managed Browser/Relay loopback contract.
- Functional: root package, desktop package, release metadata, setup UI, and operator docs resolve
  one candidate version. Recommend `0.3.13` for the changed payload; lock the number in Phase 1.
- Functional: setup and FirstRun copy describes profile-local state and controlled beta boundaries,
  not guaranteed fingerprint uniqueness, TikTok readiness, or unlimited concurrency.
- Functional: release metadata exposes installer SHA/size, Relay version/archive SHA, Browser source
  SHA, engine version/SHA/channel, and signed/unsigned status; missing or stale metadata fails closed.
- Non-functional: Windows x64 per-user installer remains the only supported v1 packaging target;
  macOS, updater, and custom engine work stay deferred.

## Architecture

```text
frozen MKTBrowser tree + relay-release.json(v16)
        -> fetch-pinned-relay (size + SHA + HTTPS + immutable version)
        -> electron-builder NSIS staging
        -> app.asar + embedded relay manifest/payload + engine pin
        -> normalized payload/provenance manifest
        -> installer SHA/size + R2 metadata/full read-back
        -> setup page renders the same manifest
```

The licensed CloakBrowser pin remains the measured stable `.2` candidate until Phase 7 says
otherwise. The system Chrome/CFT fixture is a compatibility verifier only, never identity evidence.

## Related Code Files

| Repository/path | Action | Purpose |
|---|---|---|
| `MKTBrowser/apps/desktop/relay-release.json` | Modify | Pin Phase 2 Relay version, URL, size, and SHA. |
| `MKTBrowser/package.json` and `MKTBrowser/apps/desktop/package.json` | Modify + test | Align candidate product version (recommend 0.3.13) and add coherence checks. |
| `MKTBrowser/apps/desktop/windows-engine-release.json` | Verify/modify only with approval | Preserve stable licensed engine version/SHA/channel; never silently switch to CFT. |
| `MKTBrowser/apps/desktop/scripts/fetch-pinned-relay.cjs` | Verify/extend | Exact size/SHA validation and atomic staging. |
| `MKTBrowser/apps/desktop/scripts/package-windows.cjs` | Verify/extend | Clean build, verified Relay staging, and payload checks. |
| `MKTBrowser/apps/desktop/scripts/package-windows-installer.cjs` | Run | Produce per-user NSIS installer. |
| `MKTBrowser/apps/desktop/electron-builder-installer.yml` | Verify/modify | Embed Relay payload/manifest and installer metadata. |
| `MKTBrowser/scripts/emit-release-provenance.cjs` and `normalized-payload-manifest.cjs` | Run/extend | Build-once provenance and normalized comparison. |
| `MKTBrowser/scripts/verify-packaged-runtime-contract.cjs` | Run/label | Managed lifecycle/CFT compatibility evidence, explicitly not G2 identity. |
| `MKTBrowser/apps/desktop/src/renderer/src/components/onboarding/FirstRun.tsx` | Modify | Remove absolute isolation/agent-driving claims. |
| `MKTBrowser/apps/desktop/src/renderer/src/components/onboarding/ChromiumBootstrapModal.tsx` | Modify | Platform-specific integrity wording and CFT fallback label. |
| `MKTBrowser/apps/desktop/src/renderer/src/components/screens/AdditionalLicenceKeys.tsx` | Modify | Enforce/document one-seat policy; remove N-key promise without silently deleting stored keys. |
| `MKTBrowser/apps/desktop/src/renderer/src/components/profile/FingerprintForm.tsx` | Modify | Replace uniqueness/anti-bot guarantee with experimental consistency wording. |
| `MKTTool/src/components/setup/onboarding-stepper.tsx` | Modify | Dynamic metadata and truthful internal-pilot boundaries. |
| `MKTTool/src/app/setup/page.tsx` and `src/app/api/setup/windows-installer/route.ts` | Modify | Pass/render immutable release metadata and fail closed when absent. |
| `MKTTool/src/lib/setup/windows-installer-release.ts` | Modify/test | Read full metadata, including Relay/archive/engine/source hashes. |
| `MKTTool/docs/internal-beta-release.md`, `MKTTool/docs/development-roadmap.md`, `MKTBrowser/README.md` | Modify | Replace old hashes/claims; preserve history in changelog. |

## Implementation Steps

1. Lock the Browser candidate version in the Phase 1 manifest. Because Relay bytes and UI contract
   change, increment the published candidate (recommended 0.3.13); never reuse 0.3.12 metadata.
   Add a test that root package, desktop package, release manifest, installer metadata, and UI data
   all resolve the same version.
2. Replace `apps/desktop/relay-release.json` with the Phase 2 v16 URL, exact archive size, and
   lowercase SHA. Run `fetch-pinned-relay` with both network and `MKTTOOL_RELAY_ARCHIVE` local
   paths; both paths must reject wrong size/SHA, wrong URL/version, and partial downloads.
3. Build from a clean Windows checkout of the frozen MKTBrowser source. Run `corepack yarn install
   --immutable`, `yarn verify:node`, typecheck, lint, the managed suites, and packaging tests before
   invoking `package:windows-installer`.
4. Inspect the unpacked candidate and installer: `app.asar`, `resources/relay/MKTTool-Relay.zip`,
   `relay/relay-release.json`, engine `current.json`/license metadata, firewall installer, and
   product version. Assert embedded Relay archive hash equals Phase 2 and the installed EXE hash
   equals the archive manifest.
5. Emit normalized payload and provenance manifests containing source/tree SHAs, package versions,
   Relay archive/EXE hashes, engine version/SHA/channel, installer hash/size, build toolchain, and
   timestamp. Build twice from clean inputs. Require exact equality for app.asar, embedded Relay,
   engine, manifests, and meaningful resources; allow only a documented outer-NSIS variance (for
   example, a timestamp/signature field) that is removed by the normalizer. The exact promoted
   installer's own SHA is still recorded and immutable; any unexplained variance blocks promotion.
6. Design the installer publication contract before publishing. The current fixed key
   `MKTBrowser-win-x64.exe` is mutable and has no existing revocation pointer. Prefer a versioned
   immutable object/manifest plus an authenticated stable-channel pointer; if backward compatibility
   requires the fixed key, add a signed version manifest, denylist/revocation response, cache-control
   and full-byte GET/read-back, and document migration for existing `/api/setup/windows-installer`
   clients. A metadata-only HEAD check is insufficient. Keep the old 0.3.12 object quarantined and
   retain a separately verified rollback artifact.
7. Make MKTTool setup server-render the same metadata. The disk/development path must not invent a
   version or checksum; production should fail closed or show “unpublished” when required metadata
   is missing. Show exact installer SHA, bundled Relay version/SHA, Browser source SHA, engine
   channel/pin, unsigned status, and a link to the sanitized evidence.
8. Rewrite onboarding copy in English for new/materially revised text: “controlled Windows internal
   pilot, one profile at a time, human login/input; profile-local storage/proxy controls; identity
   isolation is not yet proven.” Remove TikTok/Reddit readiness, unattended operation, and
   “isolated-fingerprint Chromium” guarantees. Keep Google credentials/OTP human-controlled.
9. Apply the same boundary to Browser FirstRun, engine bootstrap, additional-license-key settings,
   and fingerprint form. Hide/disable extra-key/concurrency affordances unless entitlement is
   positively verified; never advertise capacity the vendor plan does not provide.
10. Run clean-VM install, repair, uninstall, first launch, ports 47821/47822, firewall, and exact
    Relay restart replay against the installer-extracted binary. Record all hashes in the Phase 1
    manifest and hand the draft candidate to Phase 4. Any byte, server-config, or engine change
    restarts the final freeze and all downstream gates.
11. Make unsigned distribution an explicit gate: obtain Authenticode signing and verification, or
    record a named, time-bounded internal-only exception with SmartScreen instructions, distribution
    allowlist, expiry, incident owner, and no real-account authorization. A signed manifest does not
    make an unsigned EXE trusted.

## Test Scenario Matrix

| ID | Scenario | Method | Expected result | Evidence |
|---|---|---|---|---|
| P3-01 | Version coherence | Contract test across root/desktop/UI/metadata | One candidate version; no 0.3.2/0.3.12 drift | Test log |
| P3-02 | Relay pin validation | Valid, wrong-size, wrong-SHA, wrong-version, HTTP/redirect fixtures | Only exact HTTPS v16 payload stages | Fetch test |
| P3-03 | Clean build | Windows clean checkout + immutable install | Deterministic inputs recorded; meaningful payload is reproducible | Build log |
| P3-04 | Embedded payload | Inspect installer/app.asar/resources | Relay archive/manifest and engine pin match manifest | Payload manifest |
| P3-05 | Installer byte provenance | Two clean builds + normalized comparison | app.asar/Relay/engine/resources equal; only documented outer-NSIS variance allowed | Provenance report |
| P3-06 | Lifecycle | Clean VM install/repair/uninstall/first run | 9/13/15 lifecycle scenarios pass on new artifact | VM evidence |
| P3-07 | Exact restart replay | Extract installer Relay, run P2 harness | Spent ticket rejects after restart; fresh ticket succeeds | Replay evidence |
| P3-08 | Setup metadata | R2 available/missing/stale/disk fixtures | UI shows exact metadata or fails closed; never fabricates | MKTTool tests |
| P3-09 | Boundary copy | Render/setup and Browser UI review | No TikTok/uniqueness/unattended/N-key claims | Screenshot/review |
| P3-10 | Unsigned handling | SmartScreen on clean VM | Warning is truthful and SOP is explicit; signing decision remains visible | VM capture |
| P3-11 | Publication/revocation | Versioned object or fixed-key manifest/denylist, cache and full GET tests | Old candidate is rejected/marked revoked; served bytes match approved tuple | Publication report |
| P3-12 | Stored-key migration | Upgrade/downgrade with existing extra keys | No silent secret deletion; one-seat UI/pool migration is explicit and reversible | Migration test |

## Function / Interface Checklist

| Contract | Required check |
|---|---|
| `relay-release.json` | HTTPS immutable `/vN`, positive version/size, lowercase SHA, source/provenance fields. |
| `fetchPinnedRelay()` | Rejects mismatch, redirects, partial files, and cache poisoning; atomically renames only verified bytes. |
| Installer payload | `resources/relay/MKTTool-Relay.zip` and manifest are hash-bound to Phase 2. |
| Engine release manifest | Stable licensed channel/version/SHA is explicit; CFT is labeled compatibility-only. |
| Product identity | Root/desktop/UI/release metadata version equality test exists. |
| Setup release reader | R2 and disk behavior never invents version/hash; required production metadata is fail-closed. |
| Setup API | Streams only the hash-verified object and exposes no secrets. |
| FirstRun/settings | Managed launch, one-seat, human-input, and identity limitations are accurately stated. |
| Publisher | Full artifact read-back, versioned/manifest-backed revocation, cache behavior, and rollback path are enforced. |
| Signing gate | EXE signature is verified separately from manifest signature; unsigned exception has owner/expiry/controls. |

## Dependency Map

| Dependency | Direction | Reason |
|---|---|---|
| Phase 1 candidate manifest | P1 to P3 | Candidate version and lane are locked. |
| Phase 2 Relay tuple | P2 to P3 | Installer must embed exact verified bytes. |
| Phase 5 hardened MKTTool copy/config | P5 to P3 | Draft installer must include final server/UI contract; later changes force rebuild. |
| CloakBrowser license/pin | External to P3/P7 | Engine cannot be claimed or measured without valid licensed artifact. |
| Windows build VM | External to P3 | NSIS/SEA packaging and clean lifecycle are Windows gates. |
| P3 installer tuple | P3 to P4/P6/P7/P8 | All later gates must use the same installer. |

## Historical S3/S4b artifact refresh (pre-U3/P4a; retained for evidence)

The final host package run produced Browser `0.3.13` with the exact Relay v16 archive embedded.
Runs 3 and 4 have equal `app.asar`, Relay, and full normalized 130-entry payload manifests
(`517272ad...5d03566`); this historical comparison differed by 78 bytes. The successor U3 controlled
pair records a 103-byte outer NSIS residual, so P3-05 remains OPEN. The source trees were dirty, the exact
licensed Stable `.2` archive is absent, one Windows-live test is skipped, and the installer is
`NotSigned`. Metadata/publisher checks now fail closed on missing/stale/expired tuples, but no
Browser publication or clean-VM lifecycle was run. See `reports/release-run.md`.

## Success Criteria

- [x] New candidate version is chosen and consistent across root, desktop, UI, manifest, and docs
  (`0.3.13`; host contract evidence in `reports/browser-installer-s3.md`).
- [x] Installer embeds Phase 2 Relay archive/EXE with matching hashes and immutable metadata
  (v16 exact tuple in `reports/browser-installer-s3.md`).
- [ ] Two clean builds/provenance comparison and full-byte publication read-back pass.
- [ ] New artifact passes clean install/repair/uninstall and exact restart replay.
- [x] Setup and Browser copy no longer overclaims fingerprint isolation, TikTok readiness, or
  concurrency; unsigned status is explicit (static/source review; clean-VM SmartScreen review is
  still open).
- [ ] EXE signing is verified, or a named/expiring internal-only exception and distribution controls
  are approved separately from manifest signing.
- [x] Candidate tuple is marked draft until Phase 4 final freeze; stale 0.3.12 output is quarantined
  and the remaining open evidence is listed in `reports/browser-installer-s3.md`.

## Risk Assessment

- **Mutable installer object:** a URL can serve different bytes while metadata looks unchanged.
  Mitigate with versioned manifests, full GET/hash read-back, retention, and revocation.
- **Version drift:** root 0.3.2, desktop 0.3.12, and UI copy can disagree. Mitigate with one release
  manifest and contract tests.
- **False identity claim:** CFT verifier or local fingerprint generator is mistaken for native
  isolation. Mitigate with explicit labels and Phase 7 external measurement.
- **Unsigned distribution:** SmartScreen causes unsafe operator behavior. Mitigate with signing if
  possible; otherwise make the exception a hard promotion gate with named operators, expiry,
  allowlisted distribution, and no real-account authorization.
- **Revocation gap:** already downloaded EXEs cannot be recalled by changing an R2 pointer. Mitigate
  with signed compatibility/floor revocation, fleet notification/quarantine, and a documented
  profile/device recovery procedure.
- **Payload contamination:** stale `.relay-payload` or `release/` survives a build. Mitigate with
  clean VM/output, hash assertions, and no path-based fallback.
