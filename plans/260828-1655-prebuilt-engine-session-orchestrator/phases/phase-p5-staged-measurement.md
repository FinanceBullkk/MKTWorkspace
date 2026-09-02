---
phase: P5
title: "Staged prebuilt-engine measurement"
status: pending
priority: P1
dependencies: [P4]
owner: "three worker sessions plus three read-only reviewers, serially"
---

# Phase P5: Staged measurement

## Objective

Collect reproducible, sanitized runtime data in small batches so a long measurement cannot fill a
single context window or consume all host resources.

The production MCP contract does not expose page-control, `evaluate_js`, or raw-CDP tools. Any
surface collection must therefore run through an explicitly authorized disposable test harness
outside the production tool inventory. If that authorization/path is not available, measure only
the allowed runtime signals and mark unavailable surfaces `NOT_RUN`; never weaken the managed
contract to collect a fingerprint field.

## Stages

| Stage | Runs | Promotion rule |
|---|---:|---|
| Pilot | 10 launches | All launches accounted for; no lifecycle/seat/integrity failure |
| Extended | 30 launches | Pilot remains reproducible; no new failure class |
| Full | 100 launches | Only after explicit PASS for 10 and 30; one profile at a time |

Each stage may be a new Codex session. The raw runner writes JSON/CSV locally; the session reads
summaries and hashes, not the entire raw log.

## Measurements

- engine version, archive hash/size, extracted-tree hash (plus component hashes where available),
  host/runtime versions, flags, and profile seed;
- startup/ready/close duration, exit code, peak working set, and process cleanup;
- same-profile repeated tuple stability;
- cross-profile tuple separation for user-agent/client hints, locale/timezone, screen, WebGL,
  canvas, audio, fonts, WebRTC, storage, and related named surfaces;
- missing/unknown values and collisions, with the reason and sample count.

Use the existing acceptance matrix and prior reports for interpretation. BrowserScan/CreepJS are
diagnostic instruments only; never turn a detector score into a pass criterion. Do not add
undocumented switches or page scripts to improve a score.

## Exit gate

The report states exactly how many launches ran, what failed, what was deterministic, what collided,
and what remains unknown. A failed stage locks the next stage and invalidates only the affected
engine/host/config combination.
