# Fresh-session orchestrator

## Purpose

This controller keeps each work item in a new Codex CLI process. It is a sequential state machine,
not a parallel agent team and not a replacement for product acceptance. Persistent plan files,
reports, handoffs, and `state.json` are the only bridge between sessions.

Native desktop thread APIs are not assumed. The supported execution path is the installed
`codex.exe` plus `codex exec`; an interactive UI thread is not created by this repository script.

## Files

```text
orchestrator/
  README.md
  phase-manifest.json       # immutable phase order and write allowlists
  context-packet.schema.json
  result.schema.json
  state.json                 # generated, never hand-edited while a child runs
  locks/                     # one-run lock
  logs/<run>/<phase>.*       # stdout, stderr, final response, command record
```

`state.json`, logs, and locks are local evidence. Do not commit secrets or raw profile/network
data. The runner may retain a redacted command record and hashes only.

## Child invocation

The runner starts a new process for every worker and (when enabled) every read-only reviewer:

```text
codex.exe exec [--ephemeral] --json \
  --output-last-message <last-message-file> \
  -C E:\MKTWorkspace \
  --add-dir E:\MKTWorkspace\MKTBrowser \
  --add-dir E:\MKTWorkspace\MKTTool
```

The phase prompt is sent through stdin. `--ephemeral` is the default so a child cannot accumulate
old Codex conversation state. In that mode the runner records its own UUID `runId`; a CLI-emitted
thread ID is optional evidence, not the identity of the run. `-PersistCodexSession` may be offered
for debugging, but normal progression never uses `resume` or `fork`.

The runner sets the child environment's known Codex home explicitly when needed:
`C:\Users\anhha\.codex`. It should construct a per-phase environment allowlist rather than inherit
the whole parent environment: clear `CLOAKBROWSER_LICENSE_KEY`, MCP tokens, proxy credentials, and
cookie/session variables for O0, documentation phases, and all reviewers. P1/P2 may use an existing
secure local secret store only when the phase explicitly requires it; the key never enters a prompt,
result, report, or log. If the CLI still fails with an app-server permission error, O0 is BLOCKED and
the manual new-session fallback in `kickoff-new-session.md` is used.

## State machine

```text
PENDING -> RUNNING -> EVIDENCE_CHECK -> REVIEWING -> PASS -> next PENDING
                         |                 |
                         +-> BLOCKED/FAIL <-+
```

Allowed result verdicts are `PASS`, `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `FAIL`, `NOT_RUN`,
`NEEDS_CONTEXT`, and `NEEDS_OWNER`. `DONE` is accepted as a successful worker result only after
the mechanical checks pass; the controller normalizes it to `PASS` in state. Only normalized
`PASS` unlocks a dependent phase. A reviewer may downgrade a worker PASS/DONE to
`DONE_WITH_CONCERNS` or `BLOCKED`; the controller never upgrades a concern automatically.

## Mechanical checks after each child

1. Process exit code is zero.
2. Result JSON exists, parses, matches the phase and run ID, and satisfies `result.schema.json`.
3. Report and handoff exist at the manifest paths and contain the same verdict.
4. `changedPaths` is contained by the phase write allowlist; unexpected paths stop the chain.
5. Git diff before/after is captured for the workspace and nested product repos.
6. No VM/WSL ambiguity exists for phases that launch or measure an engine.
7. Required tests/evidence named by the phase are present; a prose claim is not evidence.
8. A reviewer session (read-only sandbox) passes when `reviewRequired=true`.

The plan, manifest, schemas, phase instructions, kickoff file, and prior evidence are immutable
inputs during a run. The worker allowlist is for new result/report/handoff files (plus the O0 runner
files); an existing input file may not be edited to manufacture a dependency PASS. Runtime scopes
are expanded from known environment variables to canonical absolute paths and checked as
case-insensitive descendants, never accepted as arbitrary wildcard text.

The runner takes a lock before starting, refuses a second active run, and writes state atomically.
It records PID and timeout. On timeout it terminates only the owned child process tree, records the
reason, and stops; it does not kill unrelated VirtualBox/WSL processes.

## Retry and recovery

- One retry is allowed only for a controller/transport failure before any result or product change.
- A phase verdict of `BLOCKED`, `FAIL`, `NOT_RUN`, `NEEDS_CONTEXT`, or `NEEDS_OWNER` is never
  retried unchanged.
- Resume means reading `state.json` and continuing from the last verified PASS; it does not mean
  resuming a Codex conversation.
- After three failures of the same phase, leave the run stopped and escalate with the exact
  blocker. Do not loop.

## Manual fallback

If `codex exec` cannot run in the current terminal, the runner emits the exact prompt packet and
command. Open one new Codex session manually, paste only that packet, and save the requested result,
report, and handoff. The next phase remains locked until the same mechanical checks pass.
