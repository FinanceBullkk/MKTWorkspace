---
phase: 7
title: "Decompose Browser Hotspots Incrementally"
status: pending
priority: P2
effort: "2-4 weeks across small PRs"
dependencies: [3]
---

# Phase 7: Decompose Browser Hotspots Incrementally

## Overview

Reduce the highest-risk MKTBrowser modules through behavior-locked responsibility seams. This is not
a rewrite and must not delay the signed candidate/canary path. Start after critical coverage gates
exist; merge one hotspot slice at a time, with packaged verification green on every PR.

Current measured hotspots:

| File | Lines | Initial responsibility seams |
|---|---:|---|
| `apps/desktop/src/main/ChromiumBrowserDriver.ts` | 2,581 | launch/process, proxy/network, CDP bootstrap, close/recovery, fingerprint application |
| `packages/profile-manager/src/fingerprint.ts` | 1,574 | deterministic entropy, UA/client hints, locale/timezone/geo, screen/hardware, validation |
| `packages/mcp-server/src/server.ts` | 1,364 | server composition, tool registry, lifecycle handlers, error mapping, transport adapters |
| `apps/desktop/src/main/ChromiumBootstrap.ts` | 973 | manifest resolution, download/resume/hash, extraction/install/rollback, engine locators |
| `apps/desktop/src/main/index.ts` | 959 | app startup, service composition, IPC registration, windows, shutdown |

## Requirements

- Write characterization tests before moving each responsibility.
- Reuse existing modules (`cdpReadiness`, process discovery, proxy bridge, lease journal, policies)
  before creating a new abstraction.
- No behavior change, schema change, tool exposure change, or error-code change in a pure extraction PR.
- New files use descriptive kebab-case names and stay under roughly 300-400 lines; coordinators should
  trend below 500 lines. Do not split a coherent algorithm merely to hit 200 lines.
- One PR owns one responsibility boundary. Avoid concurrent edits to the same hotspot.
- Critical coverage floors never decrease; packaged contract remains required.

## Architecture

Target dependency direction:

```text
Electron composition root
  -> profile launch coordinator
       -> engine bootstrap
       -> proxy/network preparation
       -> process + DevTools lifecycle
       -> fingerprint/CDP bootstrap
       -> lease lifecycle
  -> MCP server composition
       -> authorization/tool registry
       -> focused lifecycle handlers
       -> stable error mapping
```

Domain modules return typed outcomes and avoid importing Electron globals. I/O adapters depend on
pure policies, not the reverse.

## Wave Plan And File Inventory

| Wave | Source | Create/extract | Exit target |
|---|---|---|---|
| 1 | `ChromiumBrowserDriver.ts` | `browser-launch-coordinator.ts`, `browser-process-lifecycle.ts`, `browser-cdp-bootstrap.ts`, `browser-close-recovery.ts` | Coordinator <500 lines; extracted modules <400 |
| 2 | `fingerprint.ts` | `fingerprint-seeded-random.ts`, `fingerprint-user-agent.ts`, `fingerprint-locale-geo.ts`, `fingerprint-hardware-screen.ts`, `fingerprint-validation.ts` | No module >400; deterministic snapshot unchanged |
| 3 | `server.ts` | `mcp-tool-registry.ts`, `mcp-profile-lifecycle-handlers.ts`, `mcp-runtime-handlers.ts`, `mcp-error-mapping.ts` | Composition <400; tool inventory unchanged |
| 4 | `ChromiumBootstrap.ts` | `engine-release-resolver.ts`, `engine-download.ts`, `engine-installation.ts`, reuse safe extraction | Coordinator <350; rollback tests unchanged |
| 5 | `index.ts` | `desktop-service-composition.ts`, `desktop-ipc-registration.ts`, `desktop-window-lifecycle.ts` | Composition root <350; startup/shutdown contract unchanged |

Exact names may adjust to existing seams discovered during implementation. Do not create duplicate
helpers if equivalent modules already exist.

## Function And Interface Checklist

- [ ] Public `BrowserDriver` behavior and stable error codes remain unchanged after each extraction.
- [ ] Fingerprint generation stays deterministic for existing seeds and schema versions.
- [ ] MCP `tools/list` inventory, authorization policy, request/operation diagnostics, and schemas match.
- [ ] Engine download/install remains atomic with checksum, rollback, and safe extraction.
- [ ] Electron startup/shutdown preserves token, data root, Relay, window, and orphan-sweep ordering.
- [ ] Every new module has focused tests and no cyclic dependency.

## Implementation Steps

1. Generate an import/dependency map for the five hotspots and identify already-existing extraction
   seams. Record cycles and shared mutable state before moving code.
2. For each wave, add characterization tests for public behavior, stable error codes, side-effect
   ordering, logs/redaction, and cleanup.
3. Define the smallest typed interface for one responsibility. Move code without rewriting logic.
4. Keep old coordinator method signatures as adapters until all callers move; remove adapters only in
   a later PR after call sites and tests are stable.
5. Run narrow tests, critical coverage, complete installer suite, typecheck/lint, build, and packaged
   repeat gate for every wave.
6. Review diff for behavior changes. If extraction reveals a bug, fix it in a separate PR so the
   structural change remains reviewable and reversible.
7. Update MKTTool `docs/codebase-summary.md` and MKTBrowser README engineering records when module
   ownership materially changes.
8. After each wave, measure line counts, coverage, dependency cycles, and packaged timing. Stop if the
   split increases coupling or creates pass-through files with no clear responsibility.

## Test Scenario Matrix

| Priority | Scenario | Expected result |
|---|---|---|
| Critical | Managed launch/close before and after driver extraction | Identical outcome codes, state, cleanup, and logs |
| Critical | Fixed-seed fingerprint before and after split | Byte/field-for-field identical output |
| Critical | MCP `tools/list` and forbidden tool calls | Inventory and denial behavior identical |
| Critical | Engine interrupted install/rollback | Same atomic recovery and no partial publish |
| High | Electron crash/startup orphan sweep | Same process/profile/lease convergence |
| High | Coverage after each wave | Thresholds do not drop; new seams gain focused tests |
| Medium | Import graph | No new cycles; fewer cross-domain imports from coordinators |

## Regression Gate

```powershell
corepack yarn test:critical-coverage
corepack yarn test:installer
corepack yarn typecheck
corepack yarn lint
corepack yarn workspace @mktbrowser/desktop build
node scripts/verify-packaged-runtime-contract.cjs --repeat 5
```

## Success Criteria

- [ ] Top three hotspots are reduced to focused coordinators below 500 lines with no extracted module
  above 400 lines, unless a documented cohesive algorithm justifies an exception.
- [ ] Bootstrap and Electron composition roots are below 350 lines after their waves.
- [ ] No critical coverage threshold decreases; focused test count increases for each extracted seam.
- [ ] Public contracts, tool inventory, fingerprint determinism, error codes, and packaged behavior stay
  unchanged in structural PRs.
- [ ] Import graph has no new cycle and materially fewer cross-responsibility imports.

## Risk Assessment

- Large moves can hide behavior changes. Mitigation: one seam per PR, characterization tests first,
  no mixed bug fix/refactor.
- Excessive fragmentation can worsen navigation. Mitigation: split only at stable domain boundaries and
  keep cohesive algorithms together.
- Phase 7 can distract from rollout gates. Mitigation: one owner/PR stream, lower priority than any
  Phase 4-6 blocker, and pause during canary incidents.

## Security Considerations

Authorization, proxy application, lease recovery, tool denial, and redaction are security boundaries.
They require before/after contract tests and focused review whenever moved between modules.

## Next Step

Continue raising critical coverage thresholds after each successful wave; do not launch a second
architecture rewrite until canary and operational metrics show the first split reduced change risk.
