---
phase: 5
logicalPhase: 4
title: "Graphics and Context Consistency"
status: pending
priority: P1
effort: "2h policy/test slice; measurement wall time recorded separately"
dependencies: [phase-04]
---

# Phase 4: Graphics and Context Consistency (CLI phase 5)

> **Parked by U6 closure — 30 August 2026.** This phase is retained as historical/reopen-only
> procedure. No custom-engine build, graphics measurement, or identity claim is scheduled for this
> release; do not execute until a new owner decision explicitly reopens the parent engine plan.

## Context Links

- Plan: [plan.md](./plan.md)
- Native seam: [audio and fonts](./phase-04-native-audio-and-fonts.md)
- Existing evidence: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md:128-167,247-283`
- MKT Browser network boundary (read-only reference): `MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts:629-738`

## Overview

Add a bounded native graphics/context policy slice. It measures WebGL, canvas, WebGPU, locale,
timezone, and WebRTC together so no surface claims a device or environment that the others contradict.
The slice is experimental and does not alter the existing MKT Browser network path.

## Key Insights

- Local `readPixels` entropy can collapse into one external scanner bucket; both views must be retained.
- WebGL vendor/renderer, ANGLE backend, extensions, limits, shader precision, WebGPU adapter, and
  pixels form one graphics policy, not independent strings.
- Locale and timezone must agree across Intl, Date, JS language arrays, and request headers. WebRTC
  observations are network evidence, not a browser-score target.

## Requirements

### Functional

- Propagate one immutable graphics/context policy per profile to WebGL 1/2, offscreen canvas, workers,
  WebGPU, canvas text, Intl, timezone, and supported WebRTC paths.
- Measure vendor/renderer/capabilities/precision/readback, canvas, WebGPU, language stack, timezone,
  and candidate routes from the same fixture.
- Keep proxy and DNS/WebRTC controls fail-closed when a route is unavailable or ambiguous.

### Non-functional

- No page-level patch, CDP spoof, or edits to the existing proxy/Relay/MCP implementation.
- Every unsupported API/context is explicitly `NOT-RUN`.
- BrowserScan/CreepJS results are observations only; no score threshold is accepted as success.

## Architecture

```text
profile manifest
  -> graphics + locale/timezone policy
  -> renderer/GPU/WebRTC contexts
  -> coherent probe tuple
  -> external/local evidence with route status
```

The engine's context is read-only after startup. A policy change requires a new manifest version and
an explicit identity migration; no silent rotation.

## Related Code Files

- **Create/modify (engine checkout only):** graphics/context policy and focused browser tests.
- **Reference only:** existing ChromiumBrowserDriver proxy/WebRTC boundary and baseline harness.
- **Do not modify:** MKTBrowser shell, SOCKS bridge, Relay, MCP, or profile data roots.

## Implementation Steps

1. Write a four-context matrix (main, iframe, worker, offscreen) and a graphics/locale/WebRTC fixture.
2. Implement WebGL/canvas/WebGPU consistency assertions for one seed.
3. Add locale/timezone/header and WebRTC candidate/DNS assertions without changing proxy code.
4. Run three profiles × three launches and compare local versus scanner-visible tuples.
5. Record collisions, contradictions, `NOT-RUN` cases, cleanup, and verdict.

## Success Criteria

- [ ] `9/9` launches produce a complete graphics/context record; unsupported fields are labeled rather
  than omitted.
- [ ] Same seed reproduces canvas, WebGL, WebGPU, locale, and timezone values `3/3` across fresh roots.
- [ ] Graphics policy has `100%` agreement among vendor/renderer, capabilities, precision, extensions,
  WebGPU adapter, canvas, and readback for each measured profile.
- [ ] Locale/timezone agreement is `100%` across Intl, Date, JS language arrays, and `Accept-Language`.
- [ ] Controlled WebRTC checks show `0` unapproved public candidates and `0` host-DNS leaks; an
  unavailable/ambiguous route is `FAIL`, not silently accepted.
- [ ] At least `3` distinct full identity tuples are reported for three distinct seeds, or verdict is
  `FAIL`; local-only hashes cannot close the gate.

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| GPU driver/ANGLE variation | Non-reproducible pixels | Pin host/driver metadata and compare same revision only |
| WebGPU availability differs by host | Missing surface evidence | Explicit `NOT-RUN`; do not infer from WebGL |
| WebRTC route probe changes network state | Confounded result | Use disposable fixture and independent route labels |
| Context propagation gap | Cross-context contradiction | Matrix every supported context; fail on first mismatch |

## Security Considerations

- Do not retain public IPs, proxy endpoints, candidate strings, or page content; store booleans and
  redacted labels only.
- Do not expose policy seed material through WebGL, WebRTC, CDP, logs, or crash reports.
- Keep the engine experimental and isolated from production profile storage.

## Next Steps

A passing graphics/context slice unlocks persistence and rollback tests. Any contradiction leaves the
candidate unpromoted and the affected surface `FAIL`.

## Unresolved Questions

- Which Windows GPU cohort and WebGPU backend are acceptable reference baselines?
- What controlled WebRTC test endpoint is available without retaining network identity data?
