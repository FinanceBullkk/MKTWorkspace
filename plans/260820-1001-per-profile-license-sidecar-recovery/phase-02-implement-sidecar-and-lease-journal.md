---
phase: 2
title: "Implement Sidecar and Lease Journal"
status: pending
priority: P1
effort: "1-1.5 days"
dependencies: [1]
---

# Phase 02: Implement Sidecar and Lease Journal

## Context Links

- `E:\MKTWorkspace\plans\260820-1001-per-profile-license-sidecar-recovery\research\verified-license-protocol.md`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\socks5Bridge.ts`
- `E:\MKTWorkspace\MKTBrowser\packages\profile-manager\src\ProfileManager.ts`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\package.json`

## Overview

Build the tested primitives only: a strict loopback forwarding server and a crash-safe lease
journal. Keep orchestration out of `ChromiumBrowserDriver.ts`; Phase 03 adds the controller seam.

## Requirements

- Functional:
  - One sidecar instance belongs to exactly one profile launch and one reserved key hash.
  - Forward only the measured license endpoints and methods.
  - Route proxied profiles through the existing local SOCKS5 bridge.
  - Capture measured start/heartbeat/end state and persist minimal lease fields.
  - Preserve vendor response status and body without fabricating success.
- Non-functional:
  - Bind to `127.0.0.1` on an OS-assigned port.
  - Cap request and response bodies at a documented safe limit, default 64 KiB.
  - Use short explicit timeouts. Do not retry start/heartbeat unless Phase 01 proves safety.
  - Fail closed for a proxied profile if the bridge or proxy route fails. No direct fallback.
  - Keep each new source file near 200 lines; split protocol, server, and store concerns.

## Architecture

```text
license-protocol-contract.ts
  measured paths, schemas, redaction, state transitions

license-sidecar-server.ts
  loopback HTTP server -> strict validation -> proxy-aware HTTPS request -> exact response relay

license-lease-store.ts
  dedicated SQLite WAL journal -> pending/active/ending/released/expired/failed
```

Suggested durable columns; adjust only to match Phase 01 evidence:

```text
id, profile_id, key_hash, lease_id, install_id, instance_id,
state, started_at, heartbeat_at, ended_at, updated_at, last_error_code
```

Do not store `license_key`, proxy configuration, proxy credentials, or raw request/response bodies.
Use SHA-256 of the normalized key only to resolve the current key from settings during recovery.

## Related Code Files

- Create:
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-protocol-contract.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-protocol-contract.test.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-sidecar-server.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-sidecar-server.test.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-lease-store.ts`
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\license-lease-store.test.ts`
- Modify:
  - `E:\MKTWorkspace\MKTBrowser\apps\desktop\package.json`

## Tests Before

Write failing tests for:

1. Reject non-POST methods, unknown paths, non-JSON bodies, oversized bodies, and invalid measured
   schemas without contacting upstream.
2. Preserve upstream status/body for successful and rejected vendor responses.
3. Use the supplied SOCKS5 proxy route for proxied profiles; a proxy failure never retries direct.
4. Prevent profile A from writing profile B's key hash or lease record.
5. Redact full keys and proxy credentials from errors and logs, including overlapping secret values.
6. Reopen SQLite after simulated process death and recover the last committed state.
7. Enforce legal state transitions and tolerate duplicate measured events according to Phase 01.

## Implementation Steps

1. Encode only the endpoints, fields, and transitions confirmed in Phase 01.
2. Implement pure parsing/redaction helpers in `license-protocol-contract.ts`.
3. Implement `startLicenseSidecar(options)` returning `{ baseUrl, close, releaseObservation }`.
   Buffer the raw request once, parse a copy for observation, and forward the original bytes. Hash
   the body key and compare it to the launch's reserved key hash before forwarding; reject mismatch.
4. Use `node:http` for loopback and `node:https` plus `SocksProxyAgent` for proxied upstream calls.
   Tests may inject upstream origin and request transport; production origin stays vendor-fixed.
5. For direct profiles, preserve current direct license egress. For proxied profiles, require the
   existing local SOCKS5 bridge URL.
6. Implement the SQLite store at `<product-user-data>/data/license-leases.db` with WAL enabled,
   prepared statements, schema versioning, and bounded history cleanup.
7. Commit a state transition before acknowledging a relevant vendor response to the engine.
8. Add `@types/better-sqlite3` to the desktop workspace if TypeScript cannot resolve the existing
   runtime dependency. Do not add another database library.
9. Add the three test files to the explicit `test:mkb02` command.

## Tests After

- Parallel sidecars with different profile IDs, keys, proxy routes, and lease responses.
- Upstream timeout, connection reset, malformed JSON, 4xx, 5xx, and oversized response.
- Sidecar close with live sockets; shutdown must resolve within a bounded time.
- Store corruption/open failure surfaces a typed launch blocker instead of silently running without
  recovery state.

## Success Criteria

- [ ] Protocol contract contains measured fields only.
- [ ] Per-profile sidecar tests prove routing and state isolation.
- [ ] Proxied forwarding fails closed with no direct retry.
- [ ] SQLite WAL journal survives close/reopen and simulated interrupted transitions.
- [ ] No test snapshot, log, IPC value, or database row contains a full key or proxy credential.
- [ ] Desktop `test:mkb02` includes and passes the new unit tests.

## Risk Assessment

- Response rewriting can break engine validation. Mitigation: preserve status/body; observe only.
- SQLite failure can create unrecoverable ambiguity. Mitigation: block licensed launch if journal
  cannot durably record the start transition.
- A shared server can cross-wire profiles. Mitigation: one server instance per launch context; never
  infer profile identity from source port or request contents alone.

## Security Considerations

- Loopback bind only. Do not expose on `0.0.0.0` or a fixed LAN port.
- Reject redirects away from the approved HTTPS vendor origin unless Phase 01 proves one is required.
- Keep normal TLS certificate and hostname verification enabled in production.
- Redact secrets longest-first using existing project conventions.
