---
phase: 1
title: "Verify License Protocol"
status: pending
priority: P1
effort: "0.5-1 day"
dependencies: []
---

# Phase 01: Verify License Protocol

## Context Links

- `E:\MKTWorkspace\MKTBrowser\README.md`
- `E:\MKTWorkspace\MKTBrowser\docs\mkb-00-source-license-engine-inventory.md`
- `E:\MKTWorkspace\plans\reports\research-260820-0858-giao-thuc-license-cloakbrowser.md`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts`

## Overview

Replace inferred protocol fields with measured evidence from one controlled run using a valid key,
a disposable profile, and a dedicated test proxy. This phase is a hard gate: later phases must not
invent response fields or assume `session/end` behavior.

## Requirements

- Functional:
  - Capture successful `session/start`, at least one `session/heartbeat`, and `session/end`.
  - Confirm request method, path, content type, body fields, response status, response body fields,
    and required headers for each endpoint.
  - Confirm whether `session/end` is idempotent and what a repeated/expired release returns.
  - Confirm whether `session/end` requires the license key or only lease/install/instance identifiers.
  - Measure whether a successful release makes the same key reusable immediately.
- Non-functional:
  - Use only loopback interception plus transparent forwarding to the real vendor endpoint.
  - Keep raw requests/responses transient. Persist sanitized shapes only.
  - Never record a full key, proxy credential, observed IP, or reusable bearer value.

## Architecture

Use a temporary loopback forwarder outside production code. Point only the disposable engine
process at it through `CLOAKBROWSER_LICENSE_API`. The forwarder forwards byte-for-byte to the real
vendor endpoint, captures in memory, redacts values, and writes only a field/type/status summary.

Do not use `--license-through-proxy` during this measurement. Explicitly route the temporary
forwarder's upstream connection through the profile's proxy so the measured topology matches the
planned production path.

## Related Files

- Create:
  - `E:\MKTWorkspace\plans\260820-1001-per-profile-license-sidecar-recovery\research\verified-license-protocol.md`
- Temporary only, delete after measurement:
  - `E:\MKTWorkspace\local-test-artifacts\license-protocol-probe\`
- Do not modify production source in this phase.

## Tests Before

1. Confirm `git status --short --branch` in both workspace and MKTBrowser repositories.
2. Confirm the disposable profile contains no real social account or browser session.
3. Confirm the test proxy is dedicated and working before a license request is sent.
4. Confirm the capture sink redacts `license_key`, proxy credentials, and raw identifiers before
   any disk write.

## Implementation Steps

1. Read the context files above. Treat the existing research report as evidence for the start
   request only, not for a successful response or release semantics.
2. Build a temporary loopback forwarder with:
   - bind host `127.0.0.1`;
   - allowed paths limited to `/api/license/session/start`, `/heartbeat`, and `/end`;
   - upstream fixed to `https://cloakbrowser.dev`;
   - explicit SOCKS5/HTTPS proxy agent;
   - no request replay and no fabricated response.
3. Launch one disposable CloakBrowser profile with one valid key and the test proxy.
4. Wait for a successful start and heartbeat. Close through `Browser.close` so the engine emits its
   normal end request.
5. Sanitize the captured shapes. Hash or replace every value while preserving JSON field names,
   types, optionality, status codes, and timing.
6. If safe after the first release, repeat the exact measured `session/end` once to learn its
   idempotency response. Do not guess or mutate fields.
7. Relaunch with the same key to measure immediate reuse after confirmed release.
8. Write `verified-license-protocol.md` with evidence, exact conclusions, and remaining unknowns.
9. Delete the raw capture and temporary forwarder artifacts.

## Decision Gate

- Proceed only if a successful start exposes enough state to construct the vendor's real end call.
- If the response is encrypted, signed in an unforwardable way, or lacks the required identifiers,
  mark the plan blocked. Do not build a synthetic license service.
- If repeated `session/end` is not safe, recovery may issue it once per durable state transition;
  document that constraint for Phase 02.

## Success Criteria

- [ ] Successful start, heartbeat, and end shapes documented from a real valid session.
- [ ] Required release fields and key requirement confirmed.
- [ ] Repeated/expired end behavior measured or explicitly marked untested with reason.
- [ ] Immediate key reuse after confirmed release measured.
- [ ] Sanitized research file contains no reusable secret or endpoint credential.
- [ ] Raw capture and temporary probe removed.

## Risks

- A malformed probe can consume a seat. Mitigation: transparent forward only; never synthesize start.
- A raw capture can leak the key. Mitigation: memory-first capture, value redaction, immediate deletion.
- Vendor behavior may change by version. Mitigation: record engine version and date in evidence.

## Unresolved Questions

- Exact successful response schema remains unknown until this phase runs.
- `session/end` retry/idempotency semantics remain unknown until measured.

