# Handoff: planning session -> O0

**Status:** READY_FOR_NEW_SESSION
**Date:** 2026-08-28

## Decision

The local custom Chromium source build is parked. Phase 1B failed on the 16 GiB host after the
permitted reboot check; the original `>12 GiB` physical-RAM gate remains unchanged. Use the
prebuilt-engine roadmap in the sibling `plan.md`.

## What is prepared

- `plan.md` — decision, phases, gates, resource policy, and definition of done.
- `orchestrator/phase-manifest.json` — serial dependency graph (`maxConcurrent=1`).
- `orchestrator/result.schema.json` and `context-packet.schema.json` — worker/reviewer contract.
- `orchestrator/README.md` — runner behavior, retry/stop rules, and CLI limitations.
- `prompts/phase-session-template.md` — bounded prompt; no transcript injection.
- `kickoff-new-session.md` — exact first prompt and commands.
- `phases/phase-*.md` — per-phase instructions.

## Protected state

- Do not reset or overwrite the dirty MKTBrowser files:
  `apps/desktop/src/main/ChromiumBrowserDriver.ts`,
  `packages/mcp-server/src/server.ts`, and `packages/types/src/index.ts`.
- Preserve existing root/MKTTool plan and `AGENTS.md` changes.
- The cached CloakBrowser runtime contains pre-existing `ttk-*` profile-like directories. Treat
  them as sensitive/contaminated; do not open, log, or delete them. P2 must quarantine or use a fresh
  verified extraction after confirming no process owns the path.
- Existing `windows-engine-release.json` and the local compatibility updater pin are archive pins;
  archive hash/size and extracted-tree hashes are separate facts. Never copy the updater's
  expiring URL into evidence.

## Next action in a new session

Implement and syntax-check only O0's PowerShell runner. First probe the explicit Codex CLI path:

`C:\Users\anhha\AppData\Local\OpenAI\Codex\bin\8e8bf206e63ac436\codex.exe`

Use a fresh `codex exec` process per phase, with a controller-generated `runId`. The current
managed shell previously saw an app-server `Access is denied` initialization failure; if a normal
terminal reproduces it, mark O0 `BLOCKED` and use the manual prompt fallback. Do not download an
engine, run baseline measurements, or edit product source in O0.
