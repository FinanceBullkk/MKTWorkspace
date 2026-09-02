---
phase: O0
title: "Fresh-session orchestrator foundation"
status: blocked
priority: P1
dependencies: []
owner: "one Codex session"
---

# Phase O0: Fresh-session orchestrator foundation

## Objective

Build and verify the small controller that starts exactly one fresh `codex exec` process per
phase, gives it a bounded context packet, waits for its result, and gates the next phase on an
explicit PASS. This phase is orchestration work only; it must not download an engine or modify
MKTBrowser source.

## Files owned by this phase

- `orchestrator/run-prebuilt-engine-phases.ps1`
- `orchestrator/phase-manifest.json`
- `orchestrator/result.schema.json`
- `orchestrator/context-packet.schema.json`
- `orchestrator/README.md`
- `prompts/*.md`
- `reports/phase-o0-*.md`
- `handoffs/phase-o0-*.md`

Do not touch `MKTBrowser/apps/desktop/src/**` or any pre-existing dirty file.

## Required runner behavior

1. Resolve `codex.exe` from the explicit configured path; fail closed if it is missing or not the
   expected CLI.
2. Read the manifest and reject duplicate phase IDs, missing dependencies, paths outside the plan
   root/workspace, and more than one runnable child.
3. Create a context packet containing only the phase objective, allowed paths, named references,
   previous handoff, constraints, and result contract. Never inject full chat history or secrets.
4. Invoke a new non-interactive process with `codex exec`, `-C E:\MKTWorkspace`, the optional
   MKTBrowser `--add-dir`, `--json`, and `--output-last-message`. Do not use `resume` or `fork` for
   normal progression. Support `-DryRun`, `-Phase`, `-ResumeState`, and a bounded timeout.
5. Capture stdout/stderr, exit code, wall time, process ID, CLI version, and a sanitized command
   record. Parse a thread/session ID when the CLI emits one, but do not make it the only evidence.
6. Require a result JSON plus report and handoff paths. Validate schema, phase ID, timestamps,
   changed-path allowlist, and one of the result verdicts in `result.schema.json` (`PASS`, `DONE`,
   `DONE_WITH_CONCERNS`, `BLOCKED`, `FAIL`, `NOT_RUN`, `NEEDS_CONTEXT`, or `NEEDS_OWNER`).
7. Advance only on `PASS` (or `DONE` after mechanical normalization). Stop on all other statuses, non-zero exit, timeout, missing evidence,
   malformed output, unexpected changes, or active VM/WSL ambiguity.
8. Permit one retry only for a runner failure that occurred before the child wrote any result or
   product change. Never retry a blocked phase unchanged.

## Verification scenarios

- Dry run prints the exact next phase and prompt without spawning a child.
- Harmless probe returns a valid result and records a fresh session ID.
- Synthetic `BLOCKED` result stops the chain and leaves state recoverable.
- Missing result, malformed JSON, non-zero exit, timeout, and unexpected path each stop cleanly.
- Re-running with the same state does not repeat a PASS phase or launch two children.
- Logs contain no license keys, proxy passwords, MCP tokens, profile cookies, or raw URLs with
  credentials.

## Exit gate

O0 PASS means the runner itself is tested and a later session can execute P0 with a bounded prompt.
It does not mean any browser engine is approved or installed.
