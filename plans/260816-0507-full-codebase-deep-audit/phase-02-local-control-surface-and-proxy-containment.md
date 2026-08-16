# Phase 02 — Local Control Surface & Proxy Containment

Depth: **D4 (executable proof)** · Priority: P0-risk area · Status: Completed · Effort: 2 full sessions

Execution snapshot: all 20 hypotheses H21-H40 are closed. H28, H38, and H39 completed the
phase with deterministic SSE lifecycle, signed/path-contained CRX handling, and runtime IPC parity
evidence. C10 was carried into Phase 03 and fixed by separating deterministic inventory fixtures from
the opt-in live-machine integration gate.

## Context

- 16 Aug findings F3 (no behavioral tests on these modules), F2 (security contract is regex-based).
  Both are now fixed: Relay authorization, proxy containment, SSE lifecycle, extension identity and
  path containment, and IPC registration all have executable coverage.

## Why D4

Two invariants meet here, and both are absolute for the product:

1. **Only profile management is reachable with the Relay token.** The other 19 MCP tools are full
   browser control — `cdp_send` and `evaluate_js` alone are arbitrary code in the page.
2. **A proxied profile never egresses on the host IP.** A leak here is identity disclosure, which is
   the one failure the product exists to prevent.

The original `security-contract.test.ts` only asserted the *strings*; the real HTTP/MCP fixture and
local proxy harness now exercise authorization and containment.

## Scope — file inventory

| File | Lines | Current test coverage |
| --- | --- | --- |
| `packages/mcp-server/src/server.ts` | 1326 | behavioral MCP fixture + structural guards |
| `packages/mcp-server/src/HttpTransport.ts` | 303 | real HTTP auth and deterministic multi-SSE lifecycle tests |
| `packages/mcp-server/src/tool-exposure-policy.ts` | — | real unit tests |
| `apps/desktop/src/main/socks5Bridge.ts` | — | controlled SOCKS5/HTTP harness |
| `packages/cdp-driver/src/CdpSession.ts` | 624 | safe-mode regression tests |
| `apps/desktop/src/main/proxyGeo.ts` | — | launch fallback seam; network probe itself remains external |
| `apps/desktop/src/main/extensions/*` (5 files) | — | signed CRX2/CRX3 identity and path-containment tests |
| `apps/desktop/src/preload/index.ts` | — | executable preload API plus runtime main-registration parity tests |
| Relay handlers unread on 16 Aug: `handle-profiles`, `handle-compatibility-update/rollback`, `handle-read-bootstrap-completion`, `launch-profile`, `create-profile`, `relay-antidetect` | — | mixed |

**24 MCP tools.** Profile management (expected allowed): `list_profiles`, `create_profile`,
`update_profile`, `launch_profile`, `launch_managed_profile`, `close_profile`, `get_runtime_info`,
`list_fingerprint_options`. Browser control (expected denied to the Relay token): `navigate`,
`extract`, `click`, `type`, `screenshot`, `evaluate_js`, `cdp_send`, `get_cookies`, `set_cookies`,
`new_tab`, `close_tab`, `list_tabs`, `activate_tab`, `wait_for_load`, `wait_for_navigation`,
`wait_for_selector`.

## Key insights carried in

- `HttpTransport.authOk()` returns `true` when no token is configured — fail-open with a stderr
  warning (line 121). Deliberate and documented, but untested in either direction.
- Stateless `/mcp` uses the SDK's `enableDnsRebindingProtection`; legacy `/sse` and `/messages` enforce
  a hand-rolled Host allowlist. Two mechanisms, one of them hand-rolled, neither tested.
- `this.sseTransport` is deliberately a single slot; a second `GET /sse` now returns `409` without
  replacing the active stream, and a new stream can open after deterministic close.
- Proxy handling is genuinely thoughtful — the SOCKS5 bridge exists precisely because Chromium's
  `--proxy-server=` leaks DNS. That reasoning is sound; what is untested is the failure path.
- `ChromiumBrowserDriver` fails closed if WebRTC containment cannot be verified, and the H35 test
  now proves the exact runtime firewall identity. A proxy-geo outage still launches, but the
  fallback disables WebRTC, clears stale proxy-country state, and emits `PROXY_GEO_UNAVAILABLE`.
- CRX installs now require a valid CRX2/CRX3 publisher signature, verify the requested Web Store ID,
  and reject ZIP, manifest-version, and persisted-path escapes.
- IPC parity is asserted against the executable preload API and the actual main registration path:
  33 invoke channels and 5 event channels are classified, reachable, and complete at startup.

## Attack hypotheses — written before reading

**Tool authorization**
- H21 A denied tool is rejected at `tools/list` but **dispatches anyway** if called directly by name.
  Two enforcement points exist; prove both, not one.
- H22 Tool-name matching is case-insensitive, whitespace-tolerant, or prefix-based, so `Navigate` or
  `navigate ` bypasses the deny list.
- H23 A new tool added to the dispatch switch without a `MCP_TOOL_EXPOSURE` entry defaults to allowed.
  (`assertMcpToolInventory` suggests this is handled — prove the default is deny, not allow.)
- H24 `cdp_send` reaches CDP domains that `CdpSession` safe mode refuses via its own path, i.e. safe
  mode is bypassable through the generic escape hatch.
- H25 `launch_managed_profile` accepts a profile spec that disables proxy or fingerprint enforcement.

**Transport auth**
- H26 Wrong token → not 401. Missing token → not 401. Token as query param or cookie accepted.
- H27 Host allowlist is case-sensitive against a lowercased header, so `LOCALHOST:port` is rejected
  while an attacker-controlled variant is accepted — or the reverse.
- H28 A second `GET /sse` hijacks or leaks the first stream (single `sseTransport` slot).
- H29 `/healthz` leaks state pre-auth. (Currently after the auth check — confirm it stays there.)
- H30 Token is discoverable from a log line, error body, or the `mcp-token` file's permissions.

**Proxy containment — highest value in this phase**
- H31 Upstream proxy dies mid-session and Chromium falls back to **direct**, egressing on host IP.
- H32 SOCKS5 bridge resolves DNS locally rather than passing the hostname upstream (the exact leak the
  bridge exists to prevent).
- H33 Bridge binds beyond loopback, letting another local process relay through the user's proxy.
- H34 Bridge accepts a connection before upstream auth succeeds, so early requests egress unproxied.
- H35 WebRTC firewall rule is absent, stale, or user-removable, and launch still proceeds.
- H36 `proxyGeo` probe failure path (currently a `console.warn` and continue) allows launch with a
  timezone/geo mismatched to the egress IP — a fingerprint tell, not a leak, but a detection failure.
- H37 A profile edited from proxy → no-proxy retains a warmed identity now egressing on host IP with
  no warning.

**Extensions and IPC**
- H38 `webstoreDownload` / `crxPipeline` accept an unsigned or path-traversing CRX.
- H39 An IPC channel exists in main but not in the preload inventory, or vice versa — the current test
  compares source-extracted names, not runtime registrations.

**Additional hypothesis introduced during execution**
- H40 A SOCKS5 destination hostname containing CR/LF is interpolated into the HTTP-CONNECT request,
  injecting attacker-controlled headers into the upstream proxy hop.

## Method

1. Write H21–H39 as failing-first tests.
2. Build a real in-process MCP client fixture: start `HttpTransport` on an ephemeral port with a known
   token, drive it over HTTP. This one fixture retires most of F2's string assertions.
3. Proxy containment gets a live harness: a local upstream SOCKS5/HTTP proxy under test control, plus
   an egress-IP echo. Kill the upstream mid-session and observe (H31). This is the single most
   valuable artifact in the phase — it turns "we believe it fails closed" into a repeatable check.
4. D2 read of `server.ts` tool bodies, `socks5Bridge.ts`, `CdpSession.ts`, remaining relay handlers.
5. Red-then-green verification on every test.

## Todo

- [x] MCP client fixture over real HTTP
- [x] H21-H23 tool authorization tests
- [x] H24-H25 tool authorization tests
- [x] H26, H27, H29, H30 transport auth tests
- [x] H28 deterministic multi-SSE fixture
- [x] Proxy harness (controlled upstream + egress echo)
- [x] H31-H35 containment tests
- [x] H36-H37 containment tests
- [x] D2 read `server.ts`, `socks5Bridge.ts`, `CdpSession.ts`
- [x] D2 read extensions pipeline + unread relay handlers
- [x] H38–H39 tests
- [x] `plans/reports/audit-260816-1344-phase-02-high-risk-continuation.md`
- [x] `plans/reports/audit-260816-1438-phase-02-complete.md`

## Success criteria

- Every one of the 24 tools has an explicit allow/deny assertion under the Relay token policy,
  asserted at **both** listing and dispatch.
- Wrong/missing token → 401, proven over real HTTP.
- Upstream-proxy-death is proven not to egress on host IP, by observed exit IP.
- Default for an unclassified tool is proven to be deny.

## Security considerations

Proxy tests use a locally controlled upstream and a disposable egress endpoint — never a real provider
proxy, never a real account. No observed IPs in reports. Extension tests use synthetic CRX fixtures.

## Risks

- **Harness complexity.** The proxy harness is the expensive part. If it slips, H31/H32 stay open —
  they are the phase's whole point, so protect that budget over the extension work (H38 can defer).
- **Flakiness.** Network-shaped tests invite retry-until-green. Any test that needs a retry is
  rewritten or dropped; a flaky containment test is worse than none, because it teaches people to
  re-run.
- **Electron dependency.** Some paths need a real Electron main process. Prefer extracting pure logic
  over spinning up Electron in CI.

## Next

Phase 03 — the packaged installer wires this same token and firewall state, so findings here change
what Phase 03 must check.

## Unresolved questions

None for Phase 02. Phase 03 starts at H41 after preserving the execution-time H40 assignment here.
