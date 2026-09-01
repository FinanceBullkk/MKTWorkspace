# Phase O0 result — fresh-session orchestrator foundation

**Status:** BLOCKED
**Run IDs:** `1aca7e80-5a16-4b8c-bc0f-4dc4a4edf80b`, `0a2217b6-2217-40af-a3bb-91a304adb005`, `1a3c1068-4e29-4518-97ed-d09b5e9fb172`, `425d4d29-37b4-44a0-b779-3892f32314d5`
**Date:** 2026-08-28

## What was attempted

Four bounded, non-interactive `codex exec --ephemeral --json` worker starts were attempted for O0.
The first attempt did not resolve the home directory. The next three explicitly supplied
`CODEX_HOME=C:\Users\anhha\.codex` and preserved the workspace/product roots. The third and fourth
also varied only the CLI sandbox/approval flags (`-s danger-full-access` and
`--dangerously-bypass-approvals-and-sandbox`). Every process exited before model work, produced no
stdout, and wrote no product files.

## Evidence

| Attempt | Exit | Invocation change | Result |
|---|---:|---|
| `1aca7e80-5a16-4b8c-bc0f-4dc4a4edf80b` | 1 | default environment | `Error finding codex home: Could not find home directory` |
| `0a2217b6-2217-40af-a3bb-91a304adb005` | 1 | explicit `CODEX_HOME` | `failed to initialize in-process app-server client: Access is denied. (os error 5)` |
| `1a3c1068-4e29-4518-97ed-d09b5e9fb172` | 1 | `CODEX_HOME` + `-s danger-full-access` | same app-server `Access is denied` error |
| `425d4d29-37b4-44a0-b779-3892f32314d5` | 1 | `CODEX_HOME` + `--dangerously-bypass-approvals-and-sandbox` | same app-server `Access is denied` error |

Logs:

- `orchestrator/logs/1aca7e80-5a16-4b8c-bc0f-4dc4a4edf80b/O0-worker/stderr.log`
- `orchestrator/logs/0a2217b6-2217-40af-a3bb-91a304adb005/O0-worker/stderr.log`
- `orchestrator/logs/1a3c1068-4e29-4518-97ed-d09b5e9fb172/O0-worker/stderr.log`
- `orchestrator/logs/425d4d29-37b4-44a0-b779-3892f32314d5/O0-worker/stderr.log`

Both stdout files are empty and no `last-message.txt` was created. Existing Codex desktop
processes were observed, but no child worker remained from either attempt.

## Gate accounting

- Worker implementation: **NOT RUN**
- CLI JSON probe: **BLOCKED**
- Reviewer: **NOT RUN** (no worker result to review)
- Engine download/launch: **NOT RUN**
- Baseline measurement: **NOT RUN**
- MKTBrowser source changes: **0**
- Binary distribution/publish: **0**

## Required next action

Do not retry this exact launch from the managed shell. Run the CLI probe once from a normal user
PowerShell/Windows Terminal with the same explicit home path and inspect the ACL on
`C:\Users\anhha\.codex\tmp`. If it succeeds, run the O0 runner and review it. If the same
app-server permission error persists, retain the manual prompt fallback; automatic orchestration
must remain marked blocked. No ACL mutation, process termination, or stale-directory deletion was
performed by this run.

## Unresolved questions

- Is the app-server/sqlite temp directory writable by the normal user outside this managed shell?
- Does the installed Codex build require a different local state directory or an update?
