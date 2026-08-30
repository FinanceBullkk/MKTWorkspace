---
title: "Fingerprint isolation on CloakBrowser Preview 151.0.7922.108.3"
status: complete
captured: "2026-08-28T01:25:37+07:00"
scope: "Windows x64 local candidate measurement; identity surfaces only"
---

# Fingerprint Isolation on CloakBrowser Preview 151.0.7922.108.3

## Verdict

Preview `151.0.7922.108.3` is a partial native improvement, not a complete G2 fix.

| BrowserScan surface | Stable `.2` controlled pair | Preview `.3` controlled pair | Pair result |
|---|---|---|---|
| Fonts | `08050B16` / `08050B16` | `8BA38B6D` / `8BA38B6D` | Collision; later seeds expose more buckets |
| Audio | `0B09CAEB` / `0B09CAEB` | `0B09CAEB` / `0B09CAEB` | Invariant across every tested seed |
| WebGL image | `BF16CA5C` / `BF16CA5C` | `2FF52706` / `1C093001` | Seed-sensitive, but later pairs can collide |

The same Preview seed was repeated in a fresh user-data directory. Fonts, audio, WebGL image,
client rects, WebGPU, and visitor hash all reproduced exactly. The WebGL change is therefore stable
per seed rather than per-launch randomness.

The expanded nine-seed external sample exposed three font buckets, one audio bucket, and two WebGL
image buckets. `G2-IDENTITY` remains `FAIL`: the scanner-visible pool has high collision and audio
never separates. Do not promote `.3` into the signed Windows engine contract from this evidence.

## Candidate Identity

| Item | Value |
|---|---|
| Channel | CloakBrowser Pro Preview |
| Version | `151.0.7922.108.3` |
| Archive | `cloakbrowser-windows-x64.zip` |
| Size | `538330876` bytes |
| SHA-256 | `5e03b7abab14d44f2f55368a888378ddca9eefadb08c08b6c28610aec580ab3a` |
| Official checksum | Exact match from `chromium-v151.0.7922.108.3/SHA256SUMS` |
| Local archive | `local-test-artifacts/cloakbrowser-preview-151.0.7922.108.3/cloakbrowser-windows-x64.zip` |

The installed runtime and `apps/desktop/windows-engine-release.json` remain Stable
`151.0.7922.108.2`. The Preview archive was extracted and launched separately; no installed runtime
was replaced.

## Method

- Same Windows host, same browser arguments, same GPU string, locale, timezone, screen, cores, and
  memory.
- Only the deterministic `--fingerprint` seed changed: `79308` versus `76948`.
- Fresh user-data directory per launch; runs were sequential because the licence plan permits one
  active session.
- BrowserScan `https://browserscan.net/fingerprint` measured the externally visible hashes.
- A local native probe also measured font enumeration/metrics, offline audio render bytes, and WebGL
  shader `readPixels` output.
- Browser shutdown used CDP `Browser.close` so the licence session was released cleanly.
- No proxy, licence value, cookie, observed IP, profile secret, or full BrowserScan page text was
  written to evidence. These runs carry no network-identity claim.

The probe initially waited on a caller-selected DevTools port. Preview opens an OS-assigned port and
writes it to the profile-owned `DevToolsActivePort` file. The harness was corrected to discover that
owned endpoint, matching MKT Browser's current driver contract, before any candidate conclusion was
drawn.

## Results

### Controlled explicit seeds

| Engine | Seed | BrowserScan fonts | Audio | WebGL image | Local font hash | Local WebGL hash | Local audio hash |
|---|---:|---|---|---|---|---|---|
| Stable `.2` | `79308` | `08050B16` | `0B09CAEB` | `BF16CA5C` | `37add91e` | `2af51ac2` | `dc700148` |
| Stable `.2` | `76948` | `08050B16` | `0B09CAEB` | `BF16CA5C` | `4626c58d` | `920eecfa` | `dc700148` |
| Preview `.3` | `79308` | `8BA38B6D` | `0B09CAEB` | `2FF52706` | `6111bd29` | `2af51ac2` | `dc700148` |
| Preview `.3` | `76948` | `8BA38B6D` | `0B09CAEB` | `1C093001` | `9c36b395` | `920eecfa` | `dc700148` |

The local WebGL and font-metric probes were already seed-sensitive on Stable `.2`, while BrowserScan
still joined those profiles. A custom render hash is not a substitute for the scanner surface the
gate names. Preview `.3` changes the BrowserScan WebGL surface itself; it does not do the same for
fonts or audio for the two seeds in this controlled pair.

Preview exposed 58 fonts to the local canvas-enumeration probe versus 55 on Stable. The additions
were `Ink Free`, `Sitka Banner`, and `Symbol`. Both initial seeds exposed the same 58-font list, while
their metrics differed. Later seeds proved that the external font result is seed-bucketed despite
the equal list count.

### Auto-seed control

Two Preview launches without an explicit `--fingerprint` value produced different local rendering
noise and different BrowserScan WebGL hashes, but still returned the same BrowserScan fonts and
audio hashes:

| Surface | Auto launch 1 | Auto launch 2 |
|---|---|---|
| Fonts | `6B101CA5` | `6B101CA5` |
| Audio | `0B09CAEB` | `0B09CAEB` |
| WebGL image | `2FF52706` | `1C093001` |

The auto pair collided on fonts; the larger explicit matrix later disproved a universal font join.
It still rules out an explicit-seed-only failure for audio on Windows Preview `.3`.

### Switch controls

| Switch | Measured effect on Preview `.3` | Decision |
|---|---|---|
| `--fingerprint-windows-font-metrics` | No BrowserScan font-hash or local font-set change on this real Windows host | Do not add; vendor documents it for Linux hosts spoofing Windows |
| `--fingerprint-noise=false` | Local font metrics and raw WebGL render became seed-identical; BrowserScan fonts/audio stayed identical and Preview WebGL remained seed-separated | Do not add globally; it is an authenticity/isolation tradeoff, not the missing fix |
| bare `--fingerprint-noise` | Prior Stable experiment had no effect | Do not retry; documented syntax uses `=false` only |

### Follow-up: maintainer-recommended seeds and seed-only control

The vendor later supplied `47091` and `10035` as Windows Preview seeds that passed its own
Fingerprint Pro baseline. Running those seeds with the same candidate binary produced a different
BrowserScan font bucket, but audio remained identical. BrowserScan's WebGL image bucket collided for
this pair even though the local WebGL readback hashes differed:

| Seed | BrowserScan fonts | BrowserScan audio | BrowserScan WebGL image | Local font hash | Local WebGL hash |
|---:|---|---|---|---|---|
| `47091` | `8BA38B6D` | `0B09CAEB` | `2FF52706` | `7d4ce528` | `ff56e49e` |
| `10035` | `6B101CA5` | `0B09CAEB` | `2FF52706` | `4280f759` | `dc708bb2` |

This refines, but does not reverse, the earlier conclusion:

- Fonts are **seed-bucketed**, not universally joined. The tested `79308`/`76948` pair collided;
  a larger allocator must measure and avoid bucket collisions rather than assume every seed is unique.
- Audio is still a build-level constant across every Preview seed measured (`0B09CAEB`).
- WebGL is seed-sensitive, but BrowserScan can still collapse distinct local readbacks into one image
  bucket. The acceptance gate must use the named external surface, not only a custom local hash.

Repeating the two seeds with only `--fingerprint=<seed>` (all MKT Browser-style screen, CPU, RAM,
GPU, and taskbar overrides removed) returned the same three BrowserScan values. The remaining audio
join is therefore not caused by MKT Browser's explicit overrides.

Preview `chrome.dll` contains `fingerprint-noise` and
`fingerprint-windows-font-metrics`. It contains no `fingerprint-fonts-dir`, dedicated
`fingerprint-audio`, or dedicated `fingerprint-webgl` switch string.

## Root Cause Boundary

MKT Browser already sends one stable numeric seed per profile and skips its JS fingerprint preload
for CloakBrowser. That boundary is correct. CloakBrowser's public contract says a fixed seed spoofs
GPU, screen, canvas, WebGL, audio, and fonts. Windows Preview honors the seed only partially on the
named BrowserScan surfaces: fonts and WebGL use small collision-prone buckets, while audio is fixed.

The remaining defect is inside the licensed native engine or its undocumented seed mapping. MKT
Browser cannot safely repair it with a page preload:

- JS overrides are detectable and conflict with the vendor's C++ patch boundary.
- Audio and font surfaces have several independent APIs; patching one creates cross-API disagreement.
- Synthetic per-profile font lists need a plausible population model and real font files, not random
  hide/show decisions. Preview has several seed buckets but no documented way to select or guarantee
  a distinct bucket.
- The current engine exposes no measured per-seed audio control; every tested seed maps to one audio
  surface.

## Product Decision

- Keep `apps/desktop/windows-engine-release.json` on Stable `.2`.
- Keep `G2-IDENTITY=FAIL`; Preview provides partial font and WebGL entropy but no guaranteed pairwise
  separation and no audio separation.
- Do not add JS audio/WebGL/font patches.
- Do not add `--fingerprint-noise=false` or `--fingerprint-windows-font-metrics` globally.
- Keep machine profile count low as an operational mitigation until native fonts/audio isolation is
  proven.
- Re-run the same controlled matrix on the next vendor candidate before changing the engine pin.

## Vendor Reproduction

Expected from the public fingerprint contract: two distinct seeds produce distinct, deterministic
BrowserScan hashes for fonts, audio, and WebGL while a repeated seed reproduces exactly.

Observed on Windows x64 Preview `151.0.7922.108.3`:

```text
seed 79308: fonts 8BA38B6D, audio 0B09CAEB, WebGL 2FF52706
seed 76948: fonts 8BA38B6D, audio 0B09CAEB, WebGL 1C093001
repeat 79308: exact same values as the first 79308 run
seed 47091: fonts 8BA38B6D, audio 0B09CAEB, WebGL 2FF52706
seed 10035: fonts 6B101CA5, audio 0B09CAEB, WebGL 2FF52706
```

Auto-generated seeds also keep audio identical. Request a Windows binary or documented native
argument that makes the BrowserScan font population and offline-audio surface deterministic and
pairwise distinct per seed without triggering tampering detection. Also require enough distinct
buckets for the intended profile count.

## References

- CloakBrowser README, Fingerprint Management and supported flags:
  `https://github.com/CloakHQ/CloakBrowser#fingerprint-management`
- CloakBrowser Preview channel documentation:
  `https://github.com/CloakHQ/CloakBrowser#preview-release-channel`
- Official Preview checksum manifest:
  `https://cloakbrowser.dev/releases/pro/chromium-v151.0.7922.108.3/SHA256SUMS`
- Stable failure evidence:
  `local-test-artifacts/phase5/g2-identity-cross-profile-fingerprint-evidence-20260827.json`
- Local candidate probe outputs:
  `local-test-artifacts/engine-switch-audit/probe-candidate-*-scan-*.json`

## Unresolved Questions

- Does the vendor have a not-yet-documented per-seed font-population or audio argument?
- Is audio isolation fixed on another platform but missing specifically from Windows x64 `.3`?
- Does the next Preview preserve the WebGL improvement while adding fonts/audio separation?
