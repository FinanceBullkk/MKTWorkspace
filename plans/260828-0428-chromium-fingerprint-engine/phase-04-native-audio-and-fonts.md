---
phase: 4
logicalPhase: 3
title: "Native Audio and Fonts"
status: pending
priority: P1
effort: "2h native seam slice; follow-up sessions only if evidence passes"
dependencies: [phase-03]
---

# Phase 3: Native Audio and Fonts (CLI phase 4)

## Context Links

- Plan: [plan.md](./plan.md)
- Baseline: [baseline measurement harness](./phase-03-baseline-measurement-harness.md)
- Historical failure evidence: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md:113-126,193-283`
- Brave native references (donor only):
  `https://github.com/brave/brave-core/blob/master/third_party/blink/renderer/platform/brave_audio_farbling_helper.cc`
  and `https://github.com/brave/brave-core/tree/master/browser/farbling`

## Overview

Prove one native policy seam for audio and font surfaces without a JavaScript preload or a MKT Browser
driver change. This is a bounded proof slice, not a production promotion; split any follow-up that
would exceed one focused session.

## Key Insights

- The current Cloak Preview produced one scanner-visible audio bucket across tested seeds and only a
  small, collision-prone font bucket set. This is an engine-layer gap, not a TypeScript seed problem.
- Fonts require a plausible virtual population; audio requires coherent native output across all read
  paths. A single altered hash is not sufficient.
- Brave code is a technical reference. Its MPL-2.0 obligations and any Chromium third-party notices
  must be recorded before copying or distributing covered code.

## Requirements

### Functional

- Carry an opaque profile identity context into native audio/font code without exposing the master seed
  to page JavaScript, CDP results, logs, or crash reports.
- Cover offline render, live `AudioContext`, `AudioBuffer` reads, analyser reads, CSS/local font
  matching, `FontFaceSet`, canvas text metrics, frames, and workers where supported.
- Keep values bounded and coherent with one declared Windows/Chromium reference cohort.

### Non-functional

- No JS monkey-patch, extension shim, API hook, or shell/Relay/MCP edit.
- Preserve exact same-seed behavior; any failed native test stops the slice.
- Record donor file paths, licenses, revision, and patch hashes.

## Architecture

```text
persisted profile manifest (opaque seed)
  -> native FingerprintContext (browser/renderer/audio/font)
  -> coherent page-visible APIs
  -> local + scanner measurement harness
```

Use domain-separated surface keys (`audio`, `fonts`) and never reuse the master value directly as a
page-visible identifier.

## Related Code Files

- **Create/modify (engine checkout only):** native policy seam, focused unit/browser tests, patch notes.
- **Reference:** Brave native farbling/font implementation; Chromium Blink/WebAudio/font code.
- **Do not modify:** MKTBrowser driver, profile manager, settings, Relay, MCP, or engine pin.

## Implementation Steps

1. Write tests for the native seam before changing behavior; include fresh data roots and fixed seeds.
2. Implement the smallest audio policy slice and four read-path assertions.
3. Implement the smallest font-policy slice and four matching/metrics assertions; reject impossible
   families rather than inventing them.
4. Run three disposable profiles × three fresh launches, then run the baseline harness and sanitizer.
5. Capture patch provenance, license/notice obligations, hashes, and an explicit verdict.

## Success Criteria

- [ ] `9/9` disposable launches complete with `0` audio API exceptions, clipping, NaN/Inf values, or
  sample-rate/channel-count mismatches.
- [ ] Same seed reproduces audio and font outputs `3/3` in fresh data roots; first divergence is `FAIL`.
- [ ] Three distinct seeds produce at least `3` distinct scanner-visible audio/font joint values; if
  the engine exposes fewer, verdict is `FAIL` and no allocator claim is made.
- [ ] Font population has `0` impossible families against the declared reference cohort and `100%`
  agreement across CSS matching, `FontFaceSet`, canvas metrics, and supported child contexts.
- [ ] Master seed is absent from page-visible output, logs, and crash/test artifacts (`0` occurrences).
- [ ] No JavaScript preload or MKT Browser source file changes (`0` files).

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Cross-API audio disagreement | Detectable/incorrect identity | Test every read path and context before broader runs |
| Synthetic font population implausible | Invalid measurement and maintenance burden | Use measured reference cohort; reject unknown families |
| Brave patch license mismatch | Distribution block | Preserve notices and obtain review before binary use |
| Native seam exceeds session budget | Unbounded scope | Stop at seam; create a continuation phase with new acceptance |

## Security Considerations

- Treat the identity manifest as sensitive; do not expose or log its master material.
- Keep all profiles disposable and all binaries non-production.
- BrowserScan/CreepJS observations remain diagnostic; no detector-evasion objective is introduced.

## Next Steps

Only a passing seam test permits the graphics/context slice. A fail keeps the engine candidate
unpromoted and records the exact native gap.

## Unresolved Questions

- Which reference font cohort and allowed metric tolerance will the owner approve?
- Is the selected engine source license compatible with retaining modified native files internally?
