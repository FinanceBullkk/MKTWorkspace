# Phase 02 — Local Control Surface & Proxy Containment

Depth: **D4 (executable proof)** · Priority: P0-risk area · Status: Not started · Effort: 2 full sessions

## Context

- 16 Aug findings F3 (no behavioral tests on these modules), F2 (security contract is regex-based).

## Why D4

Two invariants meet here, and both are absolute for the product:

1. **Only profile management is reachable with the Relay token.** The other 19 MCP tools are full
   browser control — `cdp_send` and `evaluate_js` alone are arbitrary code in the page.
2. **A proxied profile never egresses on the host IP.** A leak here is identity disclosure, which is
   the one failure the product exists to prevent.

Neither invariant currently has a behavioral test. `security-contract.test.ts` asserts the *strings*
`isMcpToolAllowed(tool.name, accessPolicy)` and `!isMcpToolAllowed(name, accessPolicy)` appear in
`server.ts` — it proves the source contains that text, not that a denied tool is denied.

## Scope — file inventory

| File | Lines | Current test coverage |
| --- | --- | --- |
| `packages/mcp-server/src/server.ts` | 1326 | string assertions only |
| `packages/mcp-server/src/HttpTransport.ts` | 303 | **none** |
| `packages/mcp-server/src/tool-exposure-policy.ts` | — | real unit tests |
| `apps/desktop/src/main/socks5Bridge.ts` | — | **none** |
| `packages/cdp-driver/src/CdpSession.ts` | 624 | **none** |
| `apps/desktop/src/main/proxyGeo.ts` | — | **none** |
| `apps/desktop/src/main/extensions/*` (5 files) | — | **none** |
| `apps/desktop/src/preload/index.ts` | — | string assertions only |
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
- `this.sseTransport` is a single slot; a second `GET /sse` overwrites without closing the first.
- Proxy handling is genuinely thoughtful — the SOCKS5 bridge exists precisely because Chromium's
  `--proxy-server=` leaks DNS. That reasoning is sound; what is untested is the failure path.
- `ChromiumBrowserDriver` fails closed if WebRTC containment cannot be verified (line 193). Verified by
  reading. Not verified by test.

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

- [ ] MCP client fixture over real HTTP
- [ ] H21–H25 tool authorization tests
- [ ] H26–H30 transport auth tests
- [ ] Proxy harness (controlled upstream + egress echo)
- [ ] H31–H37 containment tests
- [ ] D2 read `server.ts`, `socks5Bridge.ts`, `CdpSession.ts`
- [ ] D2 read extensions pipeline + unread relay handlers
- [ ] H38–H39 tests
- [ ] `plans/reports/audit-{date}-local-control-surface.md`

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
