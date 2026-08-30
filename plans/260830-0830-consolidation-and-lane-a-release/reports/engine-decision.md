# U6 Engine decision record

Date: 2026-08-30 | Decision status: CLOSED (custom-engine track) / host gate BLOCKED | Owner: reviewing agent

The owner decision is to close the local custom-engine build track. The host result below explains
why the authorized gate could not run; it is not a compiler failure and is not being rounded into a
PASS. The owner then confirmed there is **no channel to CloakBrowser**. Lane C is therefore **CLOSED**
for this product shape, with no request, deadline, date, or identity-isolation claim. The alternative
screen in `vendor-shortlist.md` is retained only as future product scope.

## Question

Can this host run the existing Chromium phase-02a minimal build gate without weakening the gate or consuming the CloakBrowser seat?

## What was tried

- U1 was landed first; both release branches were committed and protected WIP remained untouched.
- The machine was rebooted in the owner-authorized window. Auto-started `mkt-ci-windows` and `MKT-CI-Linux` were stopped; `VBoxManage list runningvms` and `wsl --list --running --quiet` were empty at the final check.
- MKTBrowser, Chrome, Copilot, and Phone background apps were closed/stopped for an isolated attempt. Codex/ChatGPT and required Windows services were left running so this session remained observable and safe.
- No `ninja`, `siso`, `clang`, `lld-link`, `msbuild`, `devenv`, `gn`, `gclient`, or `autoninja` process was started. No CloakBrowser process or license-key request occurred.

## Host gate evidence

| Gate | Required | Best post-cleanup result | Status |
|---|---:|---:|---|
| Available RAM | `>12 GiB` | `8.231 GiB` of `15.924 GiB` (best post-cleanup observation; instantaneous bytes varied) | **FAIL/BLOCKED** |
| D: free space | `>=200 GiB` | `234.788 GiB` (`252,102,049,792` B) | **PASS** |
| VM/WSL guest | none | zero running VM processes, empty VBox/WSL listings | **PASS** |
| Build workload | none before gate | zero compiler/build processes | **PASS** |

The RAM threshold remains unmet after reboot and removal of guest/user workloads. Running phase-02a below the threshold would invalidate the experiment, so no build timing, peak-build RAM, peak disk, or rebuild-cost number can be honestly produced. Those cost fields are `OPEN`, not zero.

## Decision

The custom-engine path is **closed for this product and this host**. The post-reboot isolation result is
an explicit hardware/resource finding, not a build PASS or a compiler failure. The isolated engine
tree and its existing GN/toolchain replay remain intact; no artifact can enter a release candidate.
Lane C is **CLOSED** (`G2-IDENTITY` remains FAIL on the licensed engine and no vendor channel exists).
Reopening the custom build is allowed only on different hardware proving more than 16 GiB available
RAM, or a funded cloud builder, with a named owner for the subsequent measurement and security-rebase
work. A future alternative-vendor acquisition would require a new product decision and is outside
this release.

## Cost model

- Reboot/isolation attempt: completed; exact wall-clock build cost: **N/A (gate refused before build)**.
- Peak available RAM observed after cleanup: `8.231 GiB`; required margin missing: `>3.769 GiB`.
- D: capacity consumed by this attempt: no Chromium build artifact; free space remained `234.788 GiB`.
- Incremental rebuild cost: **OPEN/N/A** until a host passes the RAM gate.

## Safety and next action

- CloakBrowser seat: untouched; do not retry by launching a licensed engine.
- Keep `D:\mkt-browser-engine` isolated and do not copy/substitute its output.
- Revisit U6 only if the reopening condition is met; then prove the existing `>12 GiB` gate with no VM/WSL guest and execute phase-02a exactly once, capturing wall time/peak metrics.

## Unresolved questions

- None for this phase. Any future engine/vendor work requires a new owner decision and qualifying
  hardware or funding.
