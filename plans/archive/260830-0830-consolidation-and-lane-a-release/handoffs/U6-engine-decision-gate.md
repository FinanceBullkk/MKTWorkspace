# Handoff U6 — Engine decision gate and Lane C closure
Date: 2026-08-30T10:35:00+07:00 | Phase: 6 | Status: COMPLETE (closure; future work out of scope)

## Done

- Read phase 06 and the existing Chromium engine phase-02a instructions; no redesign or release-tree edit.
- Host preflight (read-only) on `ANHHAO`: total RAM `17,098,756,096` B (15.924 GiB), available RAM `3,151,421,440` B (2.935 GiB), strict required `>12 GiB`: **FAIL/BLOCKED**.
- `D:` free `252,102,029,312` B (234.788 GiB), required `>=200 GiB`: **PASS**.
- `VBoxManage list runningvms` returned no running guests; `wsl --list --running --quiet` returned empty. Registered VMs exist but are stopped. Hyper-V guest inventory is not verified because `Get-VM` is unavailable; no guest was observed.
- No ninja/siso/clang/lld-link/msbuild/devenv/gn/gclient/autoninja workload and no CloakBrowser/antidetect process was running at the final snapshot. Chrome/Code user workloads remained open, so the helper-workload gate is not yet clean.
- No build, CloakBrowser launch, licence-seat use, install, publish, or release-tree mutation occurred.
  One reboot was performed in the owner-authorized post-U1 window; the build gate was then measured
  and correctly refused below the RAM threshold.
- Owner answered Q17 at 09:10: reboot is authorized after U1. U1 is landed and verified; U2 workers were checkpointed with no edits/builds, and both release trees have only the explicitly protected owner paths dirty. Pre-reboot process checks found no compiler/build workload, no running VM process, and no running WSL guest; post-reboot cleanup then stopped the auto-started guests and non-Codex desktop workloads.
- Post-reboot isolation attempt stopped the auto-started `mkt-ci-windows` VM and `MKT-CI-Linux` WSL guest, then closed MKTBrowser/Chrome/Copilot/Phone. Final VBox/WSL listings and VM process checks were empty; best available RAM was 8.231 GiB of 15.924, still below the strict `>12 GiB` gate. The phase-02a build was correctly refused before `autoninja`.
- Toolchain replay evidence is available in `D:\mkt-browser-engine\replays\clean-shell-1.txt` and `clean-shell-2.txt` (identical 908 B; prior handoff hash `ebef5053...`). Required phase-02a command remains `autoninja -C D:\mkt-browser-engine\src\out\Experimental chrome` after RAM gate, in a clean cmd shell, exactly once.
- The custom-engine track is formally closed in `plans/260828-0428-chromium-fingerprint-engine/plan.md`; reopening requires different hardware with more than 16 GiB available RAM (or a funded cloud builder) and a named measurement/rebase owner.
- Alternative vendor ranking and cost screen is in `reports/vendor-shortlist.md`; no candidate was purchased, launched, or measured. It is future scope only.

## Evidence written

- This handoff records the fresh measurements and the exact external command boundary.
- Existing engine plan/handoff remains authoritative; no experimental artifact entered MKTTool or MKTBrowser.

## NOT done / deliberately skipped

- Build is not done: host capacity remains a hard BLOCKED finding after the authorized reboot/isolation attempt. No timing, peak-build RAM, or rebuild-cost value is invented; these remain OPEN until the reopening condition is met.
- Q16 is now decided: there is no channel to CloakBrowser. The prior sanitized request is historical
  context only; no request, deadline, sender, or response wait exists. Lane C is CLOSED, not pending.
- Cost model is recorded in `reports/engine-decision.md`: no build artifact, best available RAM 8.231 GiB, D: 234.788 GiB, rebuild cost N/A.
- No identity PASS is inferred. Any eventual custom engine still needs external 3-profile × 5-run measurement and license/notice/checksum review.

## State the next session must know

- Before any reopened phase-02a attempt: remeasure RAM, D:, VM/WSL, and helper workloads on the qualifying host. Do not invoke `autoninja` below `>12 GiB`.
- Keep the experiment isolated under `D:\mkt-browser-engine`; never copy its binary into a release candidate.
- CloakBrowser seat remains untouched. Exit 76 after CDP would mean seat refusal, not a crash; do not retry.

## Decisions still owed by the owner

- None for this phase. Any future alternative-vendor path requires a new product decision, budget,
  and named owner.

## Next unit

U3 and U7 retain the packaging evidence and cross-link this closure. Reopen U6 only when the stated
hardware/cloud condition is met, then run the existing phase-02a sequence exactly once. Lane C has no
date or “coming soon” promise.
