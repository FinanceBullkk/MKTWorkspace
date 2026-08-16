# Phase 02 - High-Risk Continuation (H24, H25, H35-H37)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Repo: MKTBrowser @ `feat/mkb-03-compatibility-set`
Status: selected high-risk continuation complete; H28, H38, and H39 remain open.

## Verification discipline

All required commands were run with Node 22.23.1. A first `test:mkb02` attempt under Node 24
failed before the tests because `better-sqlite3` was compiled for Node 22. This was an environment
mismatch, not a product result. The same suite passed under the pinned Node 22 runtime.

The new H36/H37 tests were run failing-first. Sabotaging the geo fallback to return a spoof IP made
H36 red; sabotaging proxy-removal confirmation to always return false made H37 red. Both sabotages
were restored before the gates below.

## H24 - safe CDP domain tracking

### Finding

`CdpSession.cdpSend(..., { safe: true })` previously allowed an unknown `*.enable` method to pass
through. The safe allowlist only controlled whether a matching disable was sent, so a domain such as
`Debugger.enable` could remain enabled without a reviewed paired cleanup.

Raw CDP is not available to the Relay token and remains an explicit full-local capability. The
impact is therefore P3 hardening, not a Relay authorization bypass.

### Fix and proof

- Safe mode now rejects every `*.enable` domain that was not already enabled at connect and is not
  in the reviewed paired-enable/disable set.
- `packages/cdp-driver/src/cdp-safe-mode.test.ts` proves unknown enables reject before transport,
  approved domains are paired, and CloakBrowser-sensitive domains remain blocked.
- `packages/mcp-server/src/mcp-tool-authorization.test.ts` proves the `cdp_send` dispatch path
  always forwards `{ safe: true }` to the driver.

## H25 - managed launch invariants

No production defect was found. The managed launch contract already requires a proxy, persists it,
and keeps the stored fingerprint authoritative. The test passes hostile-looking inputs
(`fingerprint: null`, `disable_proxy: true`, `disable_fingerprint: true`) and proves they cannot
replace those invariants. Missing/null proxy is rejected before driver launch.

## H35 - WebRTC runtime identity

The existing firewall guard was sabotage-tested in the previous continuation. The exact engine
binary identity is checked before proxied launch, and the regression guard goes red when that
identity check is weakened. The test coverage is recorded as C13 and remains fixed by `4ebb8d5`.

## H36 - proxy geo probe failure

The probe failure path is intentionally not a hard launch dependency: an external geo service or a
proxy can be temporarily unavailable. The security boundary is still leak-safe because a missing
egress IP selects the WebRTC blocking script rather than a direct fallback.

The path now:

1. clears a cached `proxyCountry` so the UI cannot display a stale route;
2. keeps the profile's configured timezone rather than inventing a new one;
3. emits the stable `PROXY_GEO_UNAVAILABLE` diagnostic; and
4. launches with WebRTC disabled until a later probe succeeds.

The residual risk is explicit: the configured timezone may not match the actual proxy geography
while the probe is unavailable. This is a P3 detection risk, not an IP leak, and is recorded as C16.
`proxy-geo-launch.test.ts` locks both the unavailable and resolved decisions.

## H37 - removing a warmed profile proxy

The profile editor previously autosaved `proxy: null` with no confirmation while retaining the
profile's cookies, data directory, and fingerprint. A future launch would therefore use the host IP
with the old identity.

The proxy toggle now asks for explicit confirmation before removing an existing proxy. The warning
states that cookies and fingerprint remain and that future launches use the host IP. Cancelling
leaves the form unchanged; direct profiles and proxy edits do not prompt. The pure safety boundary
is covered by `proxy-removal-safety.test.ts` and is wired into the installer suite.

## Gates

| Gate | Result |
| --- | --- |
| H24/H36/H37 targeted tests | PASS; sabotage runs were RED and restored |
| `yarn workspace @mktbrowser/desktop test:mkb02` | PASS (10 desktop tests; managed, CDP, MCP, H36, H37) |
| `yarn typecheck` | PASS |
| `yarn lint` | PASS, 0 errors, 3 pre-existing React hook warnings |
| `yarn test:installer` | PASS |
| Windows directory build | PASS after clearing stale test-runner native-module locks |
| `yarn verify:packaged-contract` | PASS |

The first build attempt failed with `EPERM/EBUSY` while replacing
`better_sqlite3.node`; inspection found stale MKTBrowser MCP test runners still alive. Only those
identified test PIDs were stopped, and the build passed on the next run. This is retained as C10
evidence for Phase 03 rather than treated as a green-on-first-run claim.

## Remaining Phase 02 work

- H28: deterministic second `/sse` stream behavior.
- H38: signed/path-safe extension pipeline.
- H39: runtime IPC/preload registration parity.

No commit or push was performed in this continuation.

## Unresolved questions

1. Should H36 eventually block launch after a bounded retry budget, or is the current leak-safe,
   visibly diagnosed fallback the intended operator policy?
2. Should H28/H38/H39 be completed in Phase 02 or carried as explicit inputs to Phase 06?
