---
title: "Fingerprint isolation solution options for fonts, audio, and WebGL"
status: "research-complete"
captured: "2026-08-28T01:25:37+07:00"
scope: "MKT Browser Windows x64 with CloakBrowser Preview 151.0.7922.108.3"
followUp: "research-260828-0153-vendor-independent-fingerprint-isolation.md"
---

# Fingerprint Isolation Solution Options

## Contents

- Executive Summary
- Research Methodology
- Evidence Update
- Root-Cause Boundary
- Options
- Acceptance Gate For The Next Candidate
- Recommended Execution Order
- References
- Unresolved Questions

## Executive Summary

The defect is not one problem:

1. **Fonts:** Preview `.3` has seed-dependent font buckets, but a small external bucket pool. The
   tested production pair (`79308`/`76948`) collided; vendor-recommended seeds (`47091`/`10035`)
   produced different BrowserScan font hashes.
2. **Audio:** every Preview seed measured to the same BrowserScan and local offline-audio value.
   Removing all MKT Browser overrides did not change it. This is a native engine limitation or
   seed-mapping bug, not a driver flag interaction.
3. **WebGL:** Preview `.3` adds real seed sensitivity, but BrowserScan still collapsed some
   different seeds into one image bucket. A local `readPixels` hash is not sufficient evidence.

**Cloak-specific recommendation:** do not add a JavaScript patch and do not promote Preview `.3`.
Request a vendor native fix for audio and a larger, selectable font population; keep a seed
allocator/quarantine only as a temporary font/WebGL mitigation. The vendor-independent follow-up in
`research-260828-0153-vendor-independent-fingerprint-isolation.md` recommends an MKT-owned
Chromium-compatible engine spike and refines the long-term gate around coherent joint identity rather
than mandatory uniqueness of every individual surface.

## Research Methodology

- Conducted: 28 August 2026 on Windows 11 x64.
- Sources: current MKT Browser driver/types, sanitized Stable/Preview measurements, CloakBrowser
  README and changelog, vendor issue discussions #437/#474/#520, and current Chromium Blink WebAudio
  and font-cache source.
- Search terms: CloakBrowser fingerprint seed, Windows font population, OfflineAudioContext,
  BrowserScan audio/WebGL, native Chromium fingerprint isolation.
- Controls: explicit seed pair, same-seed repeat, auto seed, vendor-recommended seeds, seed-only
  launch, ten-seed local matrix, nine-seed BrowserScan matrix, and two bare stock-CFT launches.
- Boundary: identity surfaces only. No proxy, IP, login, licence, account, or network-isolation claim.

## Evidence Update

### Candidate measurements

| Preview seed | BrowserScan fonts | BrowserScan audio | BrowserScan WebGL image | Local font hash | Local WebGL hash |
|---:|---|---|---|---|---|
| `79308` | `8BA38B6D` | `0B09CAEB` | `2FF52706` | `6111bd29` | `2af51ac2` |
| `76948` | `8BA38B6D` | `0B09CAEB` | `1C093001` | `9c36b395` | `920eecfa` |
| `47091` | `8BA38B6D` | `0B09CAEB` | `2FF52706` | `7d4ce528` | `ff56e49e` |
| `10035` | `6B101CA5` | `0B09CAEB` | `2FF52706` | `4280f759` | `dc708bb2` |
| `34859` | `C0856699` | `0B09CAEB` | `1C093001` | `a5ff2237` | `53fa9eda` |
| `11111` | `8BA38B6D` | `0B09CAEB` | `2FF52706` | `6d43bf51` | `95ea2adc` |
| `22222` | `6B101CA5` | `0B09CAEB` | `2FF52706` | `561fec2b` | `3adcec8c` |

The full evidence is retained under `local-test-artifacts/engine-switch-audit/`. The candidate
archive SHA-256 is `5e03b7abab14d44f2f55368a888378ddca9eefadb08c08b6c28610aec580ab3a` and matches the
official checksum manifest.

### Controls

- **Seed-only A/B:** passing only `--fingerprint=47091` or `--fingerprint=10035` returned the same
  three BrowserScan values as the run with MKT Browser-style screen, CPU, RAM, GPU, and taskbar
  overrides. The audio result is not caused by those overrides.
- **Same-seed repeat:** Preview `79308` reproduced the same fonts, audio, WebGL image, and local
  probe values in a fresh data directory.
- **Stock CFT control:** two bare stock-Chromium launches were stable and returned a different,
  build-specific audio value (`74447E8F`). This indicates the CloakBrowser audio value is a stable
  engine/build mark, not evidence of unique physical-host audio hardware.
- **Local probe entropy:** ten Preview seeds produced ten local font-metric hashes and ten local
  WebGL readback hashes, but one local audio hash. BrowserScan exposed only three font buckets and
  two WebGL image buckets in the nine-seed external sample.

## Root-Cause Boundary

### MKT Browser is not the missing layer

`ChromiumBrowserDriver` derives one stable numeric seed from the persisted profile seed and passes it
to CloakBrowser. CloakBrowser profiles skip the product's JavaScript fingerprint preload. This is the
correct boundary: the product owns identity selection and lifecycle; the engine owns native rendering
surfaces.

The product can make the seed deterministic, but it cannot make a closed-source native patch honor
that seed for APIs that the binary does not actually vary.

### Native engine work required

**Fonts** need a deterministic virtual population, not only metric noise:

- choose a realistic Windows font population from reference-machine data;
- key the selected population by seed with enough distinct buckets for the target profile count;
- keep `document.fonts.check`, CSS font matching, canvas metrics, `FontFaceSet`, frames, and workers
  coherent;
- never answer “installed” for impossible families such as Helvetica or Google Sans on a Windows
  host unless the selected reference population genuinely contains them;
- make the same seed reproduce exactly across fresh launches.

**Audio** needs the seed wired into the native render path:

- apply bounded deterministic variation to the offline-audio output at the Chromium/WebAudio layer;
- cover `OfflineAudioContext`, `AudioContext`, workers where the API exists, and all sample-rate/
  channel-count paths used by scanners;
- keep same-seed output stable and different-seed output distinct;
- preserve plausible numerical ranges and avoid exceptions, clipping, discontinuities, or a fixed
  magic sum that BrowserScan can cluster;
- test against CreepJS and BrowserScan for cross-API consistency and tampering detection.

**WebGL** needs a regression contract, not another flag:

- preserve Preview `.3`'s seed-dependent rendering;
- validate the external BrowserScan image hash, not only local `readPixels`;
- keep vendor/renderer strings, capabilities, WebGPU, canvas, and readback behavior coherent;
- ensure the approved seed pool has enough distinct scanner-visible WebGL buckets.

## Options

| Option | What it solves | Cost/risk | Decision |
|---|---|---|---|
| Vendor native patch/binary | Fonts, audio, WebGL at the correct C++ boundary | Vendor dependency; candidate regressions | **Recommended** |
| Seed allocator + local quarantine | Avoids observed font/WebGL collisions when choosing seeds | Cannot fix audio; local hashes overstate BrowserScan; launch probes consume licence seat | Temporary mitigation only |
| Own Chromium fork | Full control of font catalog, WebAudio, GPU/readback | Very high engineering/rebase cost; engine licence and redistribution review | Fallback if vendor cannot commit |
| One OS user/VM/container per profile | Physically separates host resources | Expensive, VM signals, GPU/audio realism still difficult | Not suitable for desktop v1 |
| JavaScript preload monkey-patch | Superficially changes page APIs | Detectable; incomplete across frames/workers; creates cross-API contradictions | Reject |

### Option 1: vendor-native fix

Send the vendor the exact reproduction and ask for a Windows binary or documented arguments with this
contract:

```text
For one Windows x64 host and one fixed environment:

- seed A and seed B: BrowserScan fonts, audio, and WebGL image hashes differ;
- repeat seed A in a fresh data directory: all three hashes are identical to the first A run;
- same-seed values remain coherent across BrowserScan, canvas/font metrics, WebAudio, WebGL, and
  WebGPU;
- no BrowserScan/CreepJS tampering or exception deduction;
- at least N distinct triplets exist for N assigned profiles (target N must be stated before testing);
- no impossible Windows font families or implausible font counts.
```

Ask whether the current Windows `.3` implementation intentionally uses a finite font bucket table,
and whether audio seed wiring is missing specifically from the Windows build. Ask for release notes or
an engine-level test proving the behavior; a README claim alone is not acceptance evidence.

### Option 2: seed allocator/quarantine

This can be implemented without changing the browser surface, but it should remain explicitly
best-effort:

1. Generate a candidate seed from the profile's persisted seed.
2. Check it against a local, disposable native probe for duplicate font and WebGL hashes already
   assigned on that machine.
3. Reject a collision and try the next deterministic candidate from a bounded list.
4. Persist the chosen seed; never silently rotate an existing profile identity.
5. Record “native audio is shared” and keep the machine profile cap low.

Do **not** use BrowserScan calls as an online seed optimizer. Do not claim `G2-IDENTITY=PASS` from
local hashes: the current data proves that local entropy can collapse differently at the external
scanner.

### Option 3: own Chromium fork

Only pursue after legal review confirms that the selected Chromium base, patches, and engine assets
may be built and distributed for this internal product. The minimum architecture is a seeded native
`FingerprintContext` shared by browser, renderer, WebAudio, Blink font matching, GPU/WebGL, and
WebGPU code. This is a separate product-engineering project, not a TypeScript change in
`ChromiumBrowserDriver`.

## Acceptance Gate For The Next Candidate

1. Verify archive checksum and exact engine version.
2. Run two or more fresh profiles sequentially with identical host controls and distinct persisted
   seeds.
3. Run a same-seed repeat in a fresh data directory.
4. Measure BrowserScan fonts, audio, WebGL image, canvas, WebGL report, WebGPU, client rects, and
   visitor hash; retain only sanitized evidence.
5. Run the local native probe for font list/metrics, offline audio, WebGL readback, and cross-frame
   consistency.
6. Require pairwise-distinct external font/audio/WebGL values for every profile in the intended
   pool. For a ten-profile target, require at least ten distinct scanner-visible triplets, not merely
   ten local hashes.
7. Reject candidates with BrowserScan/CreepJS tampering, audio/WebGL exceptions, impossible font
   populations, or same-seed drift.
8. Promote the engine pin only after all three surfaces pass; otherwise keep Stable `.2` and mark
   `G2-IDENTITY` `FAIL`.

## Recommended Execution Order

1. **Now:** keep Stable `.2`; do not add `--fingerprint-noise=false`,
   `--fingerprint-windows-font-metrics`, or JavaScript surface patches; keep the low machine profile
   cap.
2. **Vendor ticket:** send the reproduction above, including the `47091`/`10035` bucket result and
   the stock CFT audio control.
3. **Next candidate:** run the acceptance gate before changing
   `apps/desktop/windows-engine-release.json`.
4. **If vendor delivers fonts but not audio:** optionally implement the seed allocator as a bounded
   mitigation, but keep `G2-IDENTITY=FAIL` because audio remains shared.
5. **If vendor cannot deliver native audio:** decide explicitly between the low-profile-cap
   operational model and a funded Chromium fork; do not hide the gap behind preload code.

## References

- Existing candidate report: `plans/260821-1925-antidetect-browser-proxy-p0/reports/fingerprint-isolation-preview-151-0-7922-108-3-20260828.md`
- Existing acceptance record: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md`
- Vendor-independent engine strategy:
  `plans/reports/research-260828-0153-vendor-independent-fingerprint-isolation.md`
- CloakBrowser Fingerprint Management: `https://github.com/CloakHQ/CloakBrowser#fingerprint-management`
- CloakBrowser issue #437, BrowserScan WebGL/audio exceptions: `https://github.com/CloakHQ/CloakBrowser/issues/437`
- CloakBrowser issue #474, Windows font divergence: `https://github.com/CloakHQ/CloakBrowser/issues/474`
- CloakBrowser issue #520, Windows anti-detect and seed/Office-font guidance: `https://github.com/CloakHQ/CloakBrowser/issues/520`
- CloakBrowser v0.5.9 changelog, Windows fidelity and font handling: `https://github.com/CloakHQ/CloakBrowser/blob/main/CHANGELOG.md`

## Unresolved Questions

- Will the vendor expose enough distinct Windows font buckets for the intended number of profiles?
- Is the fixed Preview audio value a deliberate “real Chrome” baseline or an unfinished Windows seed
  path?
- Can the vendor provide a scanner-visible WebGL uniqueness guarantee rather than only local
  readback entropy?
- If a vendor candidate passes, what exact profile count should the G2 gate require on one physical
  machine?
