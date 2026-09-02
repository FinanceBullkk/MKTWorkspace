# O0 worker kickoff

You are a fresh, bounded Codex worker session. Do not use the previous chat transcript and do not
spawn another agent or Codex session.

## Environment

- Work context: `E:\MKTWorkspace`
- Product repo: `E:\MKTWorkspace\MKTBrowser`
- Secondary repo: `E:\MKTWorkspace\MKTTool`
- OS: Windows (`win32`), timezone: Asia/Saigon
- Session date: 2026-08-28
- Host budget: 16 GiB installed RAM; custom Chromium source-build gate is already BLOCKED

## Read only these references first

1. `E:\MKTWorkspace\MKTBrowser\README.md`
2. `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\plan.md`
3. `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\orchestrator\README.md`
4. `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\orchestrator\phase-manifest.json`
5. `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\orchestrator\result.schema.json`
6. `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\orchestrator\context-packet.schema.json`
7. `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\phases\phase-o0-orchestrator-foundation.md`
8. `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\handoffs\planning-session-to-o0.md`

## Task

Implement and syntax-check only the O0 fresh-session orchestrator. It must use the explicit Codex
CLI path configured on this host, launch one new `codex exec` process at a time, pass a bounded
context packet, capture run state/logs, validate child result/report/handoff, enforce immutable
inputs and write allowlists, and stop on non-PASS. Use `--ephemeral` by default and a controller
run ID; treat a CLI thread ID as optional. Add a read-only reviewer invocation or a clearly tested
review hook as required by the manifest.

Write only inside:

- `E:\MKTWorkspace\plans\260828-1655-prebuilt-engine-session-orchestrator\orchestrator\`
- its `reports\`, `handoffs\`, `prompts\`, `logs\`, and `results\` children

Do not modify any MKTBrowser/MKTTool source, the old Chromium plan, or any pre-existing dirty file.
Do not download an engine, launch a browser, run baseline measurements, publish, commit, or push.
Do not inherit or print license keys, MCP tokens, proxy credentials, cookies, or session secrets.

## Required run correlation

Use this controller run ID in every generated result/report/handoff:

`{{RUN_ID}}`

The worker result must match `orchestrator/result.schema.json`. Record the current CLI version and
whether a harmless `codex exec --ephemeral --json` probe can start. If the probe reproduces the
known app-server `Access is denied` failure, write a truthful BLOCKED result and preserve the manual
fallback; do not fake a PASS.

At completion write a sanitized worker report, handoff, and result JSON. End the response with the
local protocol:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: <1-2 sentences>
Blockers: <none or exact blocker>
```
