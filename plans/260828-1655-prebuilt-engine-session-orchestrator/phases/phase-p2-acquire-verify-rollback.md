---
phase: P2
title: "Acquire, verify, activate, and roll back the unmodified runtime"
status: pending
priority: P1
dependencies: [P1]
owner: "one Codex session"
---

# Phase P2: Acquire, verify, activate, and roll back

## Objective

Put the approved prebuilt runtime at the existing external engine path and prove that integrity or
interruption failures cannot publish a partial or mixed version.

The current cache is not assumed clean: pre-existing `ttk-*` profile-like directories were observed
under the runtime path. Before any launch, verify that no browser process owns them, record metadata without
opening profile databases, and quarantine/rename it to an owned evidence location or use a fresh
verified extraction. Do not delete it without a recoverable backup and an explicit owner decision.
Any cookies, login databases, keys, or profile contents are sensitive and must never enter reports,
prompts, or logs.

If the original archive is absent, the existing `current.json` is not enough to re-derive or prove
the archive hash. Re-resolve and download the approved artifact, or leave P2 `BLOCKED` with
provenance marked unverifiable.

The existing bootstrap does not necessarily rehash the cached tree on every launch. Record that
residual tamper-detection gap and, if needed, add a separate on-demand integrity check; do not imply
continuous hash verification from a one-time acquisition result.

## Constraints

- Stop `VBoxHeadless`, active WSL/Vmmem, and other disposable VM workloads first.
- Use a disposable download/cache and no real account data.
- Keep the engine outside the application package at the existing per-engine runtime path.
- Use an internal mirror/cache only if the current binary license explicitly permits it; otherwise
  use the official download and record that limitation.
- Reuse the existing bootstrap/safe extraction/atomic replacement code where possible; add code only
  for a demonstrated gap.
- Do not silently fall back from CloakBrowser to CFT. A CFT run requires an explicit operator
  selection, a new `engineKind` pin, and a separately labelled result; it cannot be reported as a
  CloakBrowser PASS.

The licensed channel may return an expiring URL. The current active-pin schema stores that URL for
the immediate convergence fetch, while the release record intentionally omits it. Do not create
additional copies in reports or manifests; test expiry/refresh and bind activation to version plus
the **archive** hash/size. Record the extracted tree manifest (file list/count and a deterministic tree hash) and,
optionally, component hashes such as `chrome.exe` and `chrome.dll`. An archive hash must never be
compared directly with an executable hash.

## Test matrix

| Case | Expected result |
|---|---|
| Valid archive and published hash | Extract and activate atomically |
| Wrong hash | Reject before activation; old runtime unchanged |
| Truncated/interrupted archive | Reject and clean staging; old runtime unchanged |
| Missing executable/incorrect architecture | Reject before activation |
| Restart during replacement | Resolve to either old or complete new version, never a mixed tree |
| Offline start with a valid cached pin | Start if policy allows; otherwise fail with a clear readiness state |
| Pre-existing profile-like cache content | Isolate/quarantine or declare `BLOCKED`; never treat it as a clean runtime |

## Exit gate

The `engineKind`, archive hash/size, extracted-tree manifest/hash, component binary hashes, version,
path, and active pin are each recorded and internally consistent; a bad-input rollback test passes;
the app package contains no engine binary; and no distribution/publish action occurred.
