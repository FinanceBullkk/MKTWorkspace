---
type: researcher
date: 2026-08-28
status: complete
scope: "Vendor-independent Windows x64 fingerprint isolation for MKT Browser"
---

# Research Report: Vendor-Independent Fingerprint Isolation

## Executive Summary

CloakBrowser may never provide the isolation contract MKT Browser needs. The current Preview
measurement is sufficient to stop waiting for a flag-only fix: nine seeds expose only three
BrowserScan font buckets, one invariant audio bucket, and two WebGL image buckets. Removing all MKT
Browser CPU, RAM, screen, and GPU overrides produces the same result. The missing behavior is inside
the native engine.

There is no reliable wrapper-level fix. A preload, extension, virtual audio device, Windows user,
or VM cannot coherently control Blink font matching, `OfflineAudioContext`, WebGL capabilities, and
GPU readback together. MKT Browser has two honest choices:

1. redefine short-term isolation around a plausible, scanner-visible **joint fingerprint cohort**,
   not uniqueness of every individual surface; or
2. own a Chromium-compatible native engine patch set.

Recommended path: start an **engine-sovereignty spike using Brave's open native farbling code as a
patch reference**, while preserving MKT Browser's Chromium/CDP architecture. Do not adopt Brave's
runtime behavior blindly and do not fork raw Chromium from an empty patch set. Brave already has
native, tested implementations for WebAudio, WebGL/WebGPU, deterministic farbling, and font
whitelisting. MKT must add a persisted profile identity contract, reference-device cohorts, and its
own scanner acceptance tests. Use Camoufox only as a bounded fallback spike because switching from
Chromium/CDP to Firefox/Juggler/Playwright is a product migration, not an engine swap.

## Research Scope

- Current evidence: CloakBrowser Stable `151.0.7922.108.2` and Preview
  `151.0.7922.108.3` on Windows x64.
- Product constraints: persistent profiles, Windows x64, Chromium extensions, proxy boundary,
  `DevToolsActivePort`, CDP, `Browser.close`, checksummed runtime, and no server-held operator
  secrets.
- Evaluation: native surface quality, MKT integration cost, deterministic identity, scanner
  plausibility, security-update burden, packaging, and redistribution obligations.
- Sources checked: current MKT evidence and code, Brave source/tests and license, Camoufox source,
  interface documentation, project status, and license.
- Research date: 2026-08-28.

## What The Evidence Proves

| Surface | Preview `.3` observation | Product implication |
|---|---|---|
| Fonts | 3 BrowserScan buckets across 9 seeds | Seed affects native behavior, but the exposed pool is small and collision-prone |
| Audio | One BrowserScan value and one local render hash across every seed | No MKT-side allocator or launch argument can create isolation |
| WebGL | 2 BrowserScan image buckets; 10 local hashes across 10 seeds | Local entropy does not guarantee external scanner separation |
| Same seed | Exact repeat in a fresh data directory | Current seed transport is deterministic |
| Seed-only control | Same result without MKT hardware/screen overrides | `ChromiumBrowserDriver` is not causing the invariant audio result |
| Stock CFT control | Stable, different audio hash | Cloak audio is likely an engine/build cohort mark, not physical audio hardware |

The current engine pin must remain Stable `.2`, Preview `.3` must not be promoted, and
`G2-IDENTITY` remains `FAIL` under the existing per-surface uniqueness gate.

## Correct Product Objective

The old requirement, "every profile must have a unique font, audio, and WebGL hash," is not a safe
anti-fingerprinting objective. Real devices naturally share many component values. Artificially
unique noise increases entropy and can become a stronger detector.

The target should be:

```text
same profile + same first-party site + same engine revision
    -> deterministic, coherent result across restarts and contexts

different profiles on the same site
    -> no unintended exact joint-identity collision within the assigned pool

each individual component
    -> belongs to a measured common Windows/Chromium cohort
```

Fonts should usually be standardized to a realistic allowlist. Audio and rendering noise may be
derived from a profile and first-party key, but must stay bounded and internally consistent. WebGL
vendor, renderer, extensions, limits, shader precision, WebGPU, and rendered pixels must describe
one possible device; changing only a hash is insufficient.

This revised objective does not excuse CloakBrowser's current invariant audio mark. It changes how
MKT should validate a future owned engine: optimize for coherent joint identity and anonymity-set
size, not maximum entropy on each row.

## Option Comparison

| Option | Chromium/CDP fit | Native quality potential | Initial effort | Ongoing burden | Decision |
|---|---:|---:|---:|---:|---|
| Cohort allocator on current Cloak | Excellent | Low; cannot alter audio | Small | Small | Temporary risk control only |
| MKT Chromium patch set, using Brave as reference | Excellent | High | Very high | Very high | **Recommended strategic path** |
| Adopt/fork Brave runtime | High | Medium-high | Medium-high | High | First technical spike, not automatic production choice |
| Switch to Camoufox | Low | High in intended Firefox model | High | High | Fallback if Chromium path fails |
| Per-profile Windows user/VM | Medium | Low-medium | High | Very high | Does not fix build-invariant audio |
| JS preload, extension, DLL/API hooking | Superficial | Low | Medium | Extreme brittleness | Reject |

## Recommended Architecture

### 1. Keep MKT Browser's Chromium contract

The current product expects a Chromium-shaped executable and lifecycle:

- persistent `--user-data-dir` profiles;
- an owned `DevToolsActivePort` endpoint;
- CDP domains and `Browser.close`;
- Chromium extension loading;
- the stable runtime path used by installer firewall rules;
- atomic, checksummed engine installation and rollback.

An owned Chromium-compatible binary preserves this boundary. Camoufox does not: Firefox automation
uses Juggler through Playwright, so MKT would need a new browser driver, control safety policy,
extension compatibility layer, lifecycle verifier, and packaging contract.

### 2. Use Brave as patch donor, not as the fingerprint specification

Current Brave source provides concrete native implementation evidence:

- a seeded PRNG explicitly used to derive deterministic farbling values for an origin;
- a Blink `BraveAudioFarblingHelper` covering audio buffers and analyser output;
- native WebGL handling for parameters, extensions, vendor/renderer, and related tests;
- WebGPU and offscreen-canvas browser tests;
- a font whitelist that blocks local-font probing, including `src: local(...)` bypasses.

This removes substantial discovery risk. It does **not** make stock Brave an antidetect engine.
Brave's threat model is tracker resistance, its seed/session semantics are not MKT's persisted
profile contract, and its exposed browser identity may form its own cohort. MKT must measure the
unmodified runtime before deciding whether to fork Brave or port selected patches onto Chromium.

### 3. Add one native identity manifest

Persist an immutable identity manifest beside each profile:

```json
{
  "schemaVersion": 1,
  "engineRevision": "pinned-source-revision",
  "profileSeed": "opaque-256-bit-value",
  "cohortId": "win11-chromium-common-01",
  "fontPolicyId": "win11-core-fonts-01",
  "audioPolicyId": "chromium-audio-common-01",
  "graphicsPolicyId": "win11-angle-d3d11-common-01"
}
```

The browser process validates the manifest and delivers a typed, read-only `FingerprintContext` to
renderer and GPU processes through native IPC. Derive surface keys with domain separation, for
example `HKDF(profileSeed, engineRevision, surfaceName, topLevelSite)`. Never expose the master seed
to page JavaScript, logs, CDP results, or crash reports.

The manifest must never rotate silently. Engine upgrades either reproduce the existing identity or
perform an explicit, audited identity migration.

### 4. Surface policies

#### Fonts

- Prefer reduction/standardization over unique synthetic font populations.
- Enforce a process-level allowlist in Blink font matching, CSS `local()`, `FontFaceSet`, canvas,
  frames, workers, and offscreen canvas.
- Build reference cohorts from legitimately available fonts. Windows and Office font redistribution
  rights are separate from Chromium/Brave source licenses.
- Do not claim unavailable families or substitute renamed free fonts without scanner validation.
- If bounded metric farbling is used, derive it consistently from the native context and test all
  measurement APIs.

#### Audio

- Start from Brave's native AudioBuffer/analyser coverage rather than a WebAudio preload.
- Apply deterministic, bounded perturbation after rendering and before every page-visible read path.
- Keep `AudioBuffer.getChannelData`, `copyFromChannel`, analyser byte/float methods, offline render,
  sample rate, channel count, and latency coherent.
- Use a common reference cohort plus low-amplitude profile/first-party derivation; do not generate an
  arbitrary unique magic sum.

#### WebGL and WebGPU

- Treat vendor, renderer, ANGLE backend, extensions, limits, shader precision, WebGPU adapter, and
  rendered pixels as one graphics policy.
- Prefer truthful hardware family plus bounded farbling over pretending that one GPU is another.
- Cover WebGL 1/2, offscreen canvas, workers, readback, debug renderer info, and WebGPU.
- Validate BrowserScan/CreepJS output; local `readPixels` hashes alone are not an acceptance gate.

## Executable Phased Plan

### Phase 0: Correct the gate - 2 to 3 engineering days

1. Keep the existing `G2-IDENTITY=FAIL` result as historical evidence.
2. Add a second experimental gate for joint identity; do not weaken the current release gate yet.
3. Define intended pool size, initially 10 profiles per physical machine.
4. Record scanner-visible component tuple, full visitor hash, cross-context consistency, and cohort
   plausibility separately.
5. Require no exact joint tuple collision, while allowing common component values when backed by a
   reference cohort.

Deliverable: an English acceptance specification, no engine promotion.

### Phase 1: Brave compatibility and fingerprint spike - 5 to 7 engineering days

Launch a checksum-verified, unmodified Brave Windows runtime only in disposable data roots. Do not
install or distribute it as MKT Browser.

Test:

1. existing `DevToolsActivePort` discovery and CDP connection;
2. `Browser.close`, process ownership, and restart behavior;
3. proxy fail-closed path and DNS/WebRTC checks;
4. companion extension loading and required APIs;
5. five fresh profiles, each repeated after restart, on BrowserScan and CreepJS;
6. fonts, WebAudio, WebGL, WebGPU, canvas, client rects, UA/client hints, and visitor hash;
7. whether results are stable per profile/site and coherent across frames/workers;
8. whether Brave identity or automation produces an unacceptable detector.

Go only if lifecycle and extension integration work without weakening the current security boundary,
and scanner-visible identity is materially better than Cloak `.3`.

### Phase 2: Seed-plumbing proof of concept - 2 to 4 engineering weeks

On a separate experimental engine branch:

1. build the selected Chromium/Brave revision reproducibly on Windows;
2. add the validated native identity manifest and renderer/GPU propagation;
3. adapt audio farbling first because it is the current hard blocker;
4. add font allowlisting and cross-API tests;
5. adapt WebGL/WebGPU policy and tests;
6. expose only one MKT-owned launch argument: manifest path or profile identity handle;
7. produce checksummed, non-production binaries and scanner evidence.

PoC success: same-profile repeat is exact; ten profiles have no joint tuple collision on the named
scanner; each component matches an approved reference cohort; no tampering or exception deduction.

### Phase 3: Productization - 4 to 8 additional engineering weeks minimum

- Rebase onto the currently supported Chromium security branch.
- Add source provenance, SBOM, license notices, reproducible build documentation, and binary signing.
- Extend MKT engine bootstrap, rollback, firewall, packaged verifier, and crash recovery to the new
  engine kind.
- Run disposable-VM lifecycle gates, physical-host fingerprint gates, and a bounded canary.
- Establish a critical-CVE update SLA and funded patch-rebase ownership.

This estimate assumes an engineer already comfortable with Chromium/Blink C++. A first-time Chromium
fork can take materially longer. The permanent cost is not the first patch; it is rebasing and
revalidating every security update.

## Camoufox Fallback

Camoufox is the strongest inspected ready-made native alternative. Its source and documentation show:

- Windows builds and bundled platform font sets;
- C++-level fingerprint interception without page JavaScript injection;
- WebGL parameter/extension/precision spoofing;
- font spoofing and metric protection;
- AudioContext property spoofing;
- BrowserForge-based statistically coherent fingerprint generation;
- Playwright compatibility through patched Firefox/Juggler.

However, it is not a Chromium fingerprint and not CDP-compatible. Its own 2026 README states that a
maintenance gap reduced performance, newly found inconsistencies remain, and active work is ongoing.
It also warns that Chromium fingerprints cannot be fully injected because sites can detect
SpiderMonkey behavior. Therefore:

- run Camoufox only if the Brave/Chromium spike fails;
- scope it as a new `FirefoxBrowserDriver`, not another `engineKind` string added to the existing
  driver;
- inventory every MCP CDP call and companion extension API before estimating migration;
- independently audit all bundled font redistribution rights.

## Legal And Distribution Gates

- Brave Core and Camoufox declare MPL-2.0. Distributed modifications to covered files carry source
  availability and notice obligations. A larger proprietary work may remain separately licensed,
  but covered-file obligations still apply.
- Chromium and all third-party components retain their own notices and licenses.
- Browser names, logos, update services, codecs, API keys, and bundled fonts require separate review;
  source-code licensing does not grant trademark or font redistribution rights.
- Treat this section as an engineering gate, not legal advice. Obtain a formal license review before
  distributing any owned engine binary.

## Rejected Workarounds

| Workaround | Why it fails |
|---|---|
| JavaScript preload/extension | Detectable, misses workers/isolated worlds, and creates native/JS contradictions |
| Virtual audio device | `OfflineAudioContext` fingerprint is engine math, not physical capture hardware |
| Per-profile Windows user | Separates storage and some fonts, but not engine-level audio or necessarily GPU behavior |
| VM per profile | Expensive; often exposes a common virtual GPU/software renderer; audio constant remains possible |
| DLL injection/API hooking | Chromium internals are not stable exported APIs; security and update brittleness approach a fork with worse provenance |
| Seed allocator alone | Can avoid known font/WebGL collisions, but cannot create audio entropy or prove external scanner behavior |
| Another closed commercial engine | Recreates the same vendor, license, redistribution, and acceptance dependency unless source and build rights are contractual |

## Decision

Proceed with **Phase 0 and Phase 1 only** before funding a native fork.

The likely production direction is an MKT-owned Chromium-compatible engine patch set derived from
reviewed open implementations, with Brave as the primary technical reference. This preserves the
current product architecture and addresses fonts/audio/WebGL at the only layer capable of coherent
control.

Do not implement native patches directly in the current MKT Browser feature branch. Create a
separate engine repository or isolated worktree, keep all binaries non-production, and leave
`windows-engine-release.json` pinned to Cloak Stable `.2` until the complete scanner and lifecycle
gate passes.

## Sources

### Local evidence

- `plans/260821-1925-antidetect-browser-proxy-p0/reports/fingerprint-isolation-preview-151-0-7922-108-3-20260828.md`
- `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md`
- `plans/reports/research-260828-0109-fingerprint-isolation-solution-options.md`
- `MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts`
- `MKTBrowser/packages/cdp-driver/src/CdpSession.ts`
- `MKTBrowser/apps/desktop/windows-engine-release.json`

### External source and license evidence

- Brave Core source and MPL-2.0 license: `https://github.com/brave/brave-core`
- Brave deterministic farbling PRNG:
  `https://github.com/brave/brave-core/blob/master/components/brave_shields/core/common/farbling_prng.h`
- Brave native audio helper:
  `https://github.com/brave/brave-core/blob/master/third_party/blink/renderer/platform/brave_audio_farbling_helper.cc`
- Brave WebAudio integration:
  `https://github.com/brave/brave-core/tree/master/chromium_src/third_party/blink/renderer/modules/webaudio`
- Brave WebGL integration:
  `https://github.com/brave/brave-core/blob/master/chromium_src/third_party/blink/renderer/modules/webgl/webgl_rendering_context_base.cc`
- Brave native fingerprint browser tests:
  `https://github.com/brave/brave-core/tree/master/browser/farbling`
- Camoufox source, features, architecture caveats, and MPL-2.0 license:
  `https://github.com/daijro/camoufox`
- Camoufox Python/Playwright interface:
  `https://github.com/daijro/camoufox/tree/main/pythonlib`

## Unresolved Questions

- What exact pool size must one physical machine support: 10, 20, or more profiles?
- Is MKT willing to fund one ongoing Chromium/Blink C++ owner for security rebases?
- May an internally distributed MPL engine expose the required modified-source repository to every
  recipient under the intended company policy?
- Does the companion extension depend on Chromium-only Manifest V3 APIs that block a Camoufox
  fallback?
- What reference Windows/Chromium fingerprint dataset is approved for cohort construction?
