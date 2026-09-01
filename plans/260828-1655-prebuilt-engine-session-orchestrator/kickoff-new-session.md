# How to start the execution session

Open a **new Codex session** in `E:\MKTWorkspace`. Do not paste the old conversation. Point the new
session at this file and the plan root only.

## First message to the new session

```text
Execute the next phase of the prebuilt-engine roadmap through the manifest-driven orchestrator.
Read:
- E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\plan.md
- E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\orchestrator\README.md
- E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\orchestrator\phase-manifest.json

Start with O0. The runner is intentionally a first-session deliverable, so create it from the O0
phase instructions before invoking it. Do not touch MKTBrowser source, download an engine, or run
a measurement. If the CLI probe is healthy, implement and test only the O0 runner, write its
report, handoff, and result, then stop at the O0 gate.
```

## Commands

```powershell
$planRoot = 'E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator'
$runner = "$planRoot\orchestrator\run-prebuilt-engine-phases.ps1"

# O0 implementation session: create the runner first, then inspect only.
# Do not run this line until O0 has created and syntax-checked the file:
# & $runner -PlanRoot $planRoot -Phase O0 -DryRun

# After the runner's own O0 tests pass, continue one phase at a time
& $runner -PlanRoot $planRoot -Phase P0
& $runner -PlanRoot $planRoot -Phase P1
```

The runner is intentionally not present as a finished product in this planning session; O0 is the
first fresh session's implementation task. If the CLI cannot start from a normal terminal, use the
manual prompt template and keep the next phase locked.
