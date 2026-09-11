# MKT Browser Full-Codebase Review (read-only)

> Historical review snapshot: findings below were recorded against older checked-out branches, not the accepted installer or the current default branches. See [repair closure](review-260910-quality-repair-closure.md) for reconciliation, verification and delivery status.

Date: 2026-09-10. Scope: source at HEAD `5ff43b2`; apps/desktop main + renderer, packages/profile-manager, settings-store, cdp-driver, mcp-server. This is a targeted production-readiness audit of high-risk data, lifecycle, IPC/MCP, proxy and archive paths; it is not a line-by-line proof of every module. Existing narrow findings about the updater marker/Relay startup and missing Startup directory are intentionally omitted.

## Findings

### P1 — `closeAll()` can return while a launch is still in progress
- Evidence: `apps/desktop/src/main/ChromiumBrowserDriver.ts:277-301` records an in-flight profile in `launching`; `:1552-1554` builds its shutdown set from `running` and `launchingProcesses` only.
- Trigger: call `launch(profileId)` and immediately quit (or invoke `closeAll`) while engine resolution, proxy bridge startup, or CDP readiness is awaiting, before `launchingProcesses` is inserted.
- Impact: `closeAll()` resolves with the profile absent from its set; `shutdownDesktop()` then closes HTTP/DB and calls `app.exit(0)` while the launch continuation can still spawn Chromium, leave a bridge/lease behind, or access closed resources. This is an orphaned-browser/seat and shutdown race.
- Fix: track launch promises per profile and have `closeAll()` await/cancel both `launching` and `launchingProcesses`; gate spawn against `shutdownStarted`; add a quit-during-each-launch-stage test. Confidence: high (source trace; no heavy runtime launch performed).

### P1 — Import can overwrite an existing Windows profile through case aliasing
- Evidence: `packages/profile-manager/src/archive.ts:202-211` validates the archive ID and calls `idTaken(original)` before using `join(destProfilesRoot, targetId)`; `apps/desktop/src/main/index.ts:1040` implements `idTaken` as exact-case `profileManager.get(id)`. Profile IDs are persisted as strings while Windows paths are case-insensitive.
- Reproduction: an existing directory/profile ID `aabb...eeff`; import an authenticated archive whose profile ID is the same UUID uppercased. The callback reports “free”, `targetId` remains uppercase, and extraction writes into the existing lowercase directory. I ran this against the real archive functions; the existing `Cookies` file changed from `existing-profile-session` to `imported-profile-session`.
- Impact: silent overwrite/data loss before the new DB row is inserted; if the DB ID comparison is case-sensitive, the row may point at the same physical directory as the original profile.
- Fix: reserve/check IDs using canonical case-folded path identity (`realpath`/directory existence) and refuse any existing target directory; create a unique target directory atomically before extraction. Confidence: high, reproduced on this Windows workspace.

### P1 — Archive manifest is trusted after GCM authentication but never schema-validated
- Evidence: `packages/profile-manager/src/archive.ts:190-205` casts `JSON.parse(...)` directly to `ArchiveManifest`; `:211-239` then trusts `manifest.profile`, `manifest.files`, and numeric lengths. `insertImported` persists the resulting fields without validating required arrays/objects.
- Trigger: construct an authenticated archive with `profile.tags: null`, `profile.fingerprint: null`, or non-array `files` (a damaged/incompatible archive can also produce this).
- Impact: import reports success and inserts corrupt state; subsequent `ProfileManager.list()` does `JSON.parse(r.tags)` and reads `fingerprint.timezone`, throwing and taking down profile listing/renderer/MCP. I ran the real archive functions with `fingerprint: null`; import accepted it and returned `fingerprint: null`.
- Fix: validate manifest version, profile ID/name, tags/fingerprint/extensions shapes, file path/size/hash limits, and complete cursor bounds before creating any destination; reject with a stable invalid-archive error. Confidence: high, reproduced for malformed fingerprint.

### P2 — Failed/aborted import leaves extracted data behind
- Evidence: `packages/profile-manager/src/archive.ts:211` creates destination before writing files; writes proceed at `:214-238`; there is no cleanup transaction on checksum, parse, bounds, or filesystem failure. DB insertion occurs later in `apps/desktop/src/main/index.ts:1050`.
- Trigger: checksum mismatch, truncated authenticated payload, disk-full error, or a crash during extraction. Repeat imports or attacker-controlled archives can allocate many orphan profile directories.
- Impact: disk exhaustion and ambiguous restore state; orphaned user data remains despite the UI saying import failed. This is particularly bad for large browser profiles.
- Fix: extract into a randomized staging directory under profiles root, enforce total file/count/manifest limits, fsync/rename into final target only after all checks, and recursively remove staging on every failure.

### P2 — Settings updates lose concurrent fields
- Evidence: `packages/settings-store/src/index.ts:135-138` performs `load()` then merges and synchronously overwrites the file; separate calls can both read the same cache and last writer wins. `apps/desktop/src/main/index.ts:736-761` exposes multiple async IPC callers to this path.
- Reproduction: `Promise.all([store.update({mcpHttpEnabled:false}), store.update({startupOrphanSweep:false})])` returned `mcpHttpEnabled:true, startupOrphanSweep:false`; one patch vanished.
- Impact: UI toggles and activation/fallback operations can silently undo each other, leaving MCP or startup policy different from what the operator chose.
- Fix: serialize updates with a process-local mutex/queue and use atomic temp-file+rename; for multi-process instances use lock/version compare-and-retry. Confidence: high, reproduced with the real store.

### P2 — Renderer swallows close failures and can show false idle state
- Evidence: `apps/desktop/src/renderer/src/App.tsx:238-247` catches every close rejection, displays no error, then refreshes. Driver failure path can retain `closing`/running state (`ChromiumBrowserDriver.ts:1424-1451`), but a refresh race or missed event can leave the operator believing Stop completed.
- Trigger: process survives shutdown escalation or durable lease release fails.
- Impact: operator may relaunch/retry while Chromium/bridge/seat remains active; no actionable recovery is shown. The comment assumes an event is always emitted, but the error path is precisely where that guarantee is weakest.
- Fix: return a typed close result/error, surface “close incomplete—retry” with current state, and make refresh authoritative from `isRunning` plus close operation status. Confidence: medium-high (source trace; UI failure injection not run).

## Positive observations

- IPC registration wraps every handler with trusted-sender validation and asserts inventory completeness (`apps/desktop/src/main/ipc-runtime-registration.ts`).
- MCP schemas, capability inventory, managed-profile lock, idempotent create, and profile launch lock are unusually explicit; page/cookie/raw-CDP capabilities are separated and sensitive methods are denylisted.
- Proxy bridge rejects unsafe destination hosts and uses loopback binding; proxied launches fail closed on firewall/egress verification.
- Profile deletion uses root containment, quarantine rename, pending state, and retry semantics. Archive path writes reject traversal and extension IDs/versions are constrained.
- Main-window sandbox/context isolation/navigation hardening is centralized and directly contract-tested.

## Coverage and limits

- Read: README, AGENTS/development rules, high-risk runtime and renderer modules listed in scope, plus related tests and package manifests.
- Executed: real archive import/export reproduction, malformed-manifest acceptance reproduction, and concurrent settings lost-update reproduction. No source edits, heavy build, installer, VM, or production operation.
- Existing tests are broad around contracts but do not cover the Windows case-fold collision, quit-during-launch race, malformed archive schema, staging cleanup, or settings concurrent update.

## Unresolved questions

- Is cross-process/multi-instance settings editing supported? If yes, a process-local queue alone is insufficient.
- Should imported profiles preserve IDs across machines, or always receive fresh IDs to avoid filesystem/DB identity collisions?
- What maximum archive byte count, file count, and per-file size are acceptable for the operator workflow?
