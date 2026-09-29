---
phase: 5
title: "Delivery and rollback"
status: in_progress
priority: P1
dependencies: [4]
effort: ""
---

# Phase 5: Delivery and rollback

## Overview

Deliver reviewed source and an auditable candidate without confusing local success with rollout.

**Status boundary:** Source delivery and candidate preparation have started. Browser
`81f3014821c471b583a37fae0dd001d0e10f59ce` and MKTTool
`450975c0006d6804ea3b0044c25c4db77e8ee3d8` are clean and match their upstream refs. Two isolated
Browser builds have byte-identical normalized 129-file payload manifests; one exact installer is
retained with Relay 18 and the pinned CFT archive. Host-only candidate preflight is PASS, but clean
VM runtime, real proxy recovery, repair, uninstall, human/second-PC and canary gates remain OPEN.
No operator promotion is recorded.

## Current delivery evidence - 22 September 2026

- Candidate: `20260922-browser-0.3.24-relay-18-fast-profile-reuse-cft`.
- Installer SHA-256: `ba66883a6b9ce9dc75a93781cc9c7573927e7fb1b3f73c6e14069ace55e9cd45`.
- Relay 18 SHA-256: `fabb6ebbe4ec166662689487cd60114be5baefd88d93f65b4e7faf802fac44f4`.
- CFT SHA-256: `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`.
- Independent payloads: PASS, 129 files, zero differences, normalized manifest
  `a39e7879e96819e51c23a72f49ddfca53fb314431474e755e51a25362113225f`.
- Host candidate preflight r2: PASS, including an explicit versioned handoff requirement for the
  host-side guest Edge controller. Receipt
  `local-test-artifacts/local-release-20260922/pilot-0324-r2/guest-gate-r1/host-candidate-preflight-r2.json`,
  SHA-256 `ab1ce22e10a3444ca6b4c84b6dde6556bed1ad7dc3ddc1980ff52425bb491b7f`.
- Real proxy host preflight: PASS for 10/10 entries with distinct egress from the direct baseline;
  redaction verification found no source host, username or password. Receipt
  `local-test-artifacts/local-release-20260922/pilot-0324-r2/guest-gate-r1/real-proxy-preflight-r1-20260922-065840.json`,
  SHA-256 `6ef9562a3220a51a03b73a9000082024d36b373c951b5a9620d769936f6e5eb7`.
- Host candidate preflight r3: PASS for unchanged source/bundle bindings, redacted real-proxy
  evidence, the isolated signed-path fixture and guest UI controller r2. Receipt
  `local-test-artifacts/local-release-20260922/pilot-0324-r2/guest-gate-r1/host-candidate-preflight-r3.json`,
  SHA-256 `79514d08e50088d47888c5e2f65c68158d22135d92cdab9f7ae4a5459a3ce864`.
- Production ObserverProxy: FAIL (`unreachable`) through a production read-only check. This remains
  separate from the isolated clean-VM fixture and is not promotion evidence.
- Runtime boundary: VM interaction is false in this receipt; clean/repair/uninstall stay OPEN.

## Related Code Files
- Existing Browser/Tool architecture, operations and changelog documents.
- Existing local validation runners and candidate metadata tooling.
- New evidence and decision records under this plan directory.

## Implementation Steps
1. Review final changes against state transitions, race cases, crash recovery, secret handling and
   native fingerprint/proxy preservation. Re-run only affected checks after corrective changes.
2. Update operational documentation: healthy sequential reuse, explicit availability check,
   unknown/refusal fallback, one-profile local policy and separately observed vendor entitlement.
   Mark older causal claims as superseded through links; preserve historical negative receipts.
3. Stage only owned files. Commit reviewed source and record exact commits/trees, lockfiles and
   toolchain. Keep disposable profiles, dependency caches and secrets out of Git.
4. For an installer candidate follow workspace release rules: two isolated builds, normalized
   payload comparison, one retained exact installer, restored Defender-enabled clean VM and
   packaged Relay/profile lifecycle, proxy failure/recovery, repair/uninstall/cleanup receipts.
   Do not run heavy builds while the VM runs. Missing gates block promotion.
5. Rollback fast admission to conservative behavior using a tested internal switch/configuration,
   without changing engine or deleting profiles/journal. Prove older readers reject unsupported
   journal versions safely; do not roll back binaries over incompatible state.
6. Record whether commits were pushed, deployment occurred or a candidate was published.
   Source integration may deploy Web via Railway: verify exact SHA if pushing that repository.
   Public promotion requires the existing exact-tuple acceptance process; this plan is no bypass.

## Success Criteria
- [x] Source, live lifecycle, native fingerprint, proxy and packaged gates have independent verdicts.
- [ ] Delivery receipt names exact commits/artifact hashes and all skipped or blocked gates.
- [x] Source rollback preserves profile data and conservative capacity/recovery behavior.
- [x] Second-PC, human acceptance and elapsed canary remain OPEN until actually observed.

## Risk Assessment
Do not infer installer acceptance from a source build or SDK run. If lifecycle passes but native
fingerprint acceptance fails, deliver the finding and keep identity/rollout claims blocked.
