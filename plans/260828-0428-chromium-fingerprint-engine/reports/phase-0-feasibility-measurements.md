---
type: researcher
date: 2026-08-28
status: complete
scope: "Read-only Chromium/Brave engine feasibility on the MKTWorkspace host"
---

# Phase 0 Feasibility Measurements

## Summary

The workspace volume E: cannot host a Chromium checkout or build (`27.73 GiB` free). D: has
`162.24 GiB` free and is the only plausible host location, but it is conditional: the lower-bound
pilot budget fits only with `--no-history`, one component/debug output, no concurrent VM, and a
continuous `>=20 GiB` reserve. A full/release/test build needs a volume with roughly `200–220 GiB`
free. No checkout, build, engine launch, install, or source change was performed.

## Methodology

- Timestamp: `2026-08-28T04:40:02+07:00` (Windows host).
- Read-only PowerShell/CIM volume, CPU, RAM, physical-disk, path, tool, Git, and VirtualBox probes.
- MKTBrowser and workspace Git status inspected; existing dirty work preserved.
- Current maintainer documentation checked after `docs-seeker` Context7 returned no matching llms.txt;
  WebSearch/open fallback used for the official Chromium and Brave pages.
- No secrets, profiles, proxy values, license keys, tokens, or page content read or retained.

## Host Findings

| Field | Evidence |
|---|---|
| OS | Windows 11 Home x64, build `26200` |
| CPU | AMD Ryzen 5 5600, `6` cores / `12` logical processors, 3.5 GHz max |
| RAM | `16,698,004 KiB` total (~15.92 GiB); `1,872,676 KiB` free (~1.79 GiB) while VM runs |
| E: | NTFS, WD_BLACK SN750 SE NVMe, `29,769,564,160` bytes free (~27.73 GiB) |
| D: | NTFS, WD Blue SA510 SATA SSD, `174,204,719,104` bytes free (~162.24 GiB) |
| C: | `56,200,683,520` bytes free (~52.35 GiB) |
| Toolchain | `gclient`, `gn`, `ninja`, `cl`, `vswhere` not found; VS/SDK directories not found |
| Current root | `E:\MKTWorkspace`, branch `codex/fingerprint-engine-phase0`; prior dirty files retained |
| Nested MKTBrowser | Separate branch `feat/installed-contract-on-clean-runner`; intentional dirty fingerprint-contract files retained |

## VirtualBox Findings

`mkt-ci-windows` is running with `4` vCPU and `6144 MiB`, backed by a dynamic `80 GiB` VDI under
`D:\mkt-vm`. Other registered gate VMs are powered off. Read-only directory measurements:

| VM path | Current files |
|---|---:|
| `D:\VMs\mkt-windows-gate` | `16.06 GiB` |
| `D:\mkt-vm\mkt-ci-windows` | `71.15 GiB` |
| `C:\mkt-vm\mkt-phase5-clean` | `36.52 GiB` |

No VM was stopped, reset, compacted, or deleted. A future compile must run host-only because the
running VM leaves less than 2 GiB free RAM and dynamic VDI growth consumes D: headroom.

## Official Requirements and Estimates

Chromium's current Windows guide states: x86-64, at least 8 GiB RAM (more than 16 GiB highly
recommended), at least 100 GB free NTFS, current Visual Studio/SDK components, and depot_tools.
It also says `fetch` can take over an hour on a fast connection and many hours on a slow one; a
shared Git cache is about 30 GB. Its build guidance calls 20+ cores and 64 GB RAM reasonable for
speed, recommends SSD, and suggests component/symbol reductions for development.

Local estimates (not upstream promises):

| Work | Estimate | Confidence |
|---|---:|---|
| VS/SDK/depot_tools setup | 1–3 h | low; download/installer dependent |
| `fetch --no-history` | 1–4 h | low; network dependent |
| First minimal component/debug `chrome` build | 4–12 h | low; paging/Defender/link risk |
| Full/release/test build | 8–24+ h or incomplete | very low |
| Incremental rebuild | 5–60 min | hypothesis; must measure |

## Budget Decision

- **E:** `REJECT` — below the official 100 GB floor.
- **D:** `CONDITIONAL` — viable only for a minimal, no-history, one-output pilot after VM shutdown;
  require `>=150 GiB` before fetch and `>=20 GiB` after the run.
- **Full/release/VM coexistence:** `BLOCKED` on current D:; use a volume with `>=200–220 GiB`
  free or free/relocate at least `40–60 GiB` without deleting existing evidence.
- Proposed path (not created): `D:\mkt-browser-engine\`, short and space-free.
- Under `workspace-write`, D: is outside the allowed root; a future build session needs an explicit
  writable-root grant. The current read-only audit needed no such grant.

## Sources

- Chromium Windows build instructions (current):
  https://chromium.googlesource.com/chromium/src/+/main/docs/windows_build_instructions.md
- Chromium depot_tools README:
  https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/README.md
- Brave Windows development environment:
  https://github.com/brave/brave-browser/wiki/Windows-Development-Environment
- MKTBrowser engine/license boundary: `MKTBrowser/README.md:217-225,245-254`
- Existing identity evidence: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md:104-135,247-283`

## Unresolved Questions

- Approve conditional D: pilot, provide another volume, or defer?
- If approved, should the first candidate be upstream Chromium or a pinned Brave revision?
- Is the owner willing to stop the running CI VM for the entire compile window?
