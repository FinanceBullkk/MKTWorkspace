---
phase: 3
logicalPhase: 2
title: "Baseline Measurement Harness"
status: pending
priority: P1
effort: "<=2h active harness slice; 2–6h unattended measurement wall time"
dependencies: [phase-02]
---

# Phase 2: Baseline Measurement Harness (CLI phase 3)

## Context Links

- Plan: [plan.md](./plan.md)
- Source gate: [isolated source and toolchain](./phase-02-isolated-source-and-toolchain.md)
- Existing acceptance vocabulary: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md:7-28,104-135,628-636`
- Existing harness concept (coverage gap): `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs`
- Diagnostic tools: BrowserScan and CreepJS (measurement only; no score target)

## Overview

Build a standalone, repeatable probe against the unmodified experimental runtime before any native
patch. The harness separates measurement completeness from identity quality, so a baseline collision
is recorded as evidence rather than hidden by a score.

## Key Insights

- Existing MKT probes cover data-model determinism and only a subset of browser surfaces; they do not
  prove native audio, font enumeration, canvas, or WebRTC behavior.
- The current acceptance matrix records Fonts/Audio/WebGL joins as `G2-IDENTITY=FAIL`; this phase
  keeps that historical result and adds no weaker replacement gate.
- Local hashes can disagree with scanner-visible hashes; retain both and never substitute one for the
  other.

## Requirements

### Functional

- Launch disposable profiles with a fixed engine revision, explicit persisted seed, fresh data root,
  and a bounded DevTools endpoint owned by that profile.
- Measure audio, fonts, WebGL, canvas, locale/languages/Accept-Language, timezone/Intl, WebRTC route,
  client hints, and storage identity in main frame plus supported child contexts.
- Record only run ID, source/artifact hash, profile label, seed digest, surface hashes, booleans,
  timings, and verdict; redact all sensitive values.

### Non-functional

- BrowserScan/CreepJS are external observations, not optimization targets or acceptance scores.
- A failed probe, missing context, or network ambiguity is `FAIL`/`NOT-RUN`, never an inferred pass.
- Harness files live in the engine experiment or a dedicated test tree; no MKTBrowser driver refactor.

## Architecture

```text
profile fixture + seed
  -> standalone launcher
  -> CDP/native probe (main/frame/worker/offscreen where supported)
  -> local hashes + sanitized scanner observations
  -> JSON evidence + collision/context report
```

The harness records a control/treatment label and invalidation tuple (revision, artifact, profile,
test order, host) for every run.

## Related Code Files

- **Create (engine/test tree):** launcher, surface probes, schema, sanitizer, collision summarizer.
- **Reuse concept only:** `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs`.
- **Modify:** none in MKTBrowser, MKTTool, Relay, or MCP.

## Implementation Steps

1. Define a versioned evidence schema and deterministic fixture generator for 10 disposable profiles.
2. Implement one cold-start and one warm-restart path; verify the profile-owned DevTools endpoint.
3. Add probes for the named surfaces and context matrix; mark unsupported contexts explicitly.
4. Run 10 profiles × 10 launches sequentially (100 records), then repeat one seed in a fresh data root.
5. Summarize per-surface collisions, exact repeats, context disagreement, and cleanup; do not tune output.

## Success Criteria

- [ ] `100/100` launches emit schema-valid, sanitized records with source/artifact/run identifiers.
- [ ] The repeated seed in a fresh data root reproduces every measured surface `10/10` times, or the
  phase verdict is `FAIL` with the first divergent record retained.
- [ ] Main frame, iframe, worker, and offscreen-canvas coverage is reported `4/4` where supported;
  unsupported APIs are `NOT-RUN` with a reason.
- [ ] Collision counts are reported for every surface and for the full joint tuple; no BrowserScan or
  CreepJS score is used as a pass criterion.
- [ ] Cleanup leaves `0` owned browser processes and `0` fixture data roots; no MKTBrowser file changes.

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Scanner/network variability | False identity conclusion | Interleave controls, record host/revision, label network-dependent fields |
| Local hash overstates separation | Unsafe promotion | Require external surface and joint-tuple evidence separately |
| Context probe silently skipped | Blind spot | Emit one explicit status per context/API; `NOT-RUN` blocks claims |
| Sensitive output capture | Data leak | Hash/redact before persistence; secret scan evidence files |

## Security Considerations

- Use disposable profiles and no real accounts, credentials, cookies, or production proxies.
- Never retain page content, IP addresses, proxy URLs, tokens, or raw vendor responses.
- Keep the engine binary outside the installed MKTBrowser runtime.

## Next Steps

Use this baseline to choose one bounded native surface slice. If baseline determinism fails, stop and
fix the harness or mark the engine `FAIL` before native work.

## Unresolved Questions

- Which contexts are available in the selected Chromium/Brave revision without enabling privileged APIs?
- What reference Windows/Chromium cohort defines plausible font and graphics values?
