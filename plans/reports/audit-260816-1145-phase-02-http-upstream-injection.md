# Phase 02 — HTTP-CONNECT Upstream and Request Injection (H40)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-1130-phase-02-proxy-containment.md`](./audit-260816-1130-phase-02-proxy-containment.md)
Repo: MKTBrowser @ `feat/mkb-03-compatibility-set`, 10 commits, **nothing pushed**.

**Status: Phase 02 — 13 of 20 hypotheses closed** (H21–H23, H26, H27, H29–H34, **H40 new**; H28 open).
**Depth achieved: D4.** One new finding, ranked P2, **fixed**.

## Gates

`yarn typecheck` PASS · `yarn lint` PASS 0 errors / 3 known warnings ·
`desktop test:mkb01` **26 pass** (was 20; +6) · `mcp-server test:managed` 27 pass.

## C12 (P2) — CRLF injection into the upstream proxy request. Found, demonstrated, fixed.

**Boundary:** SOCKS5 bridge → operator's real proxy. **New hypothesis, not in the phase file.**

`apps/desktop/src/main/socks5Bridge.ts`

The HTTP-CONNECT upstream path builds its request by string concatenation:

```
CONNECT ${targetHost}:${targetPort} HTTP/1.1
Host: ${targetHost}:${targetPort}
```

joined with CRLF. `targetHost` comes from the SOCKS5 request and is parsed with
`nameBuf.toString("ascii")`, so CR and LF bytes pass through intact. There was no validation between
the two.

**Demonstrated, not theorised.** A destination of `evil.test\r\nX-Injected: yes\r\nX-Second: 1`
produced this at the upstream proxy:

```
CONNECT evil.test
X-Injected: yes
X-Second: 1:58229 HTTP/1.1
Host: evil.test
X-Injected: yes
X-Second: 1:58229
Proxy-Connection: keep-alive
```

Attacker-chosen headers arrive as real headers on the hop between MKT Browser and the operator's
proxy provider.

**Reachability, stated plainly.** `targetHost` originates in the SOCKS5 CONNECT that Chromium sends
to the bridge, and Chromium never emits such a name. The attacker must be a **local process**. That
is not a get-out: the bridge binds loopback and **accepts unauthenticated SOCKS5 by design** (its own
comment: *"accepts no-auth handshakes — it's localhost-only"*), while this very phase exists because
the product's threat model already treats a local process as an adversary — that is why the MCP port
carries a bearer token at all.

**Ranked P2, not higher.** A local attacker has other paths (the `mcp-token` file is plaintext by
design, per F6), so the incremental gain is bounded. It is not P3 because the bridge has *no*
authentication of its own, the injection is unauthenticated, and it manipulates traffic that carries
the operator's proxy identity — the thing the product exists to protect.

**Fixed.** An allowlist on the destination applied **before either upstream path**, so the socks5 path
is covered too:

```ts
function isForwardableHost(host: string): boolean
```

Allowlist rather than a CR/LF denylist deliberately: the value crosses into an HTTP request head, and
an allowlist excludes every future separator by default. Bracketed IPv6 literals stay permitted
because the module emits them itself for ATYP 0x04. A rejected destination gets SOCKS5 reply 0x08.

**Not over-broad, and that is asserted.** The test pins both directions — `sub.domain-1.example`,
`example.test`, `127.0.0.1` and `a` still connect; CR, LF, CR+LF, space, NUL, TAB and empty are
refused. An over-strict guard would be its own outage.

**Retest gate:** `apps/desktop/src/main/socks5-bridge-http-upstream.test.ts`. Disabling the guard
turns both H40 tests red.

## The HTTP upstream path — the gap the prior report named

The prior harness covered `type: "socks5"` only. `type: "http"` is a separate code path with its own
`Proxy-Authorization` handling and had no coverage at all. Now closed:

| Property | Result |
| --- | --- |
| CONNECT carries the **hostname**, not a locally resolved address | CLOSED-CLEAN |
| `Proxy-Authorization` present **only** when credentials are configured | CLOSED-CLEAN |
| A 407 reaches **no** destination | CLOSED-CLEAN |
| Upstream death → fails closed, no direct fallback | CLOSED-CLEAN |

`localhost` is again the deliberate destination on the remote-DNS test: it resolves everywhere, so a
bridge doing local resolution would still *work* and only the recorded request line reveals it.

The credentials test is differential — same call shape, only the configured credentials differ — and
asserts the Basic payload encodes what was configured, so a silently-empty header cannot pass.

## Test-construction note

`SocksClient` validates hostnames and would have rejected the injection payload before it reached the
bridge — the library would have been testing itself. The injection tests therefore use a hand-written
SOCKS5 client. Payloads are built from `String.fromCharCode` rather than escape sequences, after the
literal escapes were mangled twice in the editing pipeline and produced two syntax errors; the bytes
are the entire point of the test, so they are now constructed unambiguously.

## Phase 02 tally

| Closed clean | Findings | Open |
| --- | --- | --- |
| H21–H23, H26, H27, H29–H34, H40 | **C9** P3 *(fixed)*, **C10** P3, **C11** P2 *(fixed)*, **C12** P2 *(fixed)* | H24, H25, H28, H35–H39 |

Two P2 defects found and fixed in this phase, both on the proxy/containment surface, both invisible
to every pre-existing test.

## Not examined

- **H24** `cdp_send` versus `CdpSession` safe mode; **H25** `launch_managed_profile` spec enforcement.
- **H28** second `/sse` stream — open, withdrawn test documented in place.
- **H35** WebRTC firewall — `windows-webrtc-firewall.test.ts` exists; I have **not** sabotage-verified
  it, so I claim nothing about it.
- **H36** `proxyGeo` probe-failure path; **H37** profile edited proxy → no-proxy retaining a warmed
  identity. Both tractable — `proxyGeo.ts` is Electron-free.
- **H38–H39** extensions and IPC.
- The bridge's IPv6 (`ATYP 0x04`) path is permitted by the new allowlist but not otherwise exercised.
- No D2 read of `server.ts` tool bodies or `CdpSession.ts`.

## Unresolved questions

1. **Next: H35 sabotage pass** (cheap, and six of these have found real gaps), then H36/H37 on
   `proxyGeo`. H24/H25 need `CdpSession` and the managed-launch spec, which is a larger read.
2. **C12 disclosure** — it is fixed on this branch but the branch is unpushed and unreleased. If any
   build already ships the bridge, this wants a note in the changelog rather than a silent fix.
   Recommend recording it in `docs/project-changelog.md` when the audit lands.
3. **C10 hermeticity** — still Phase 03.
4. **20 commits unpushed** (10 MKTTool, 10 MKTBrowser).
5. Carried: **C1**, **C2/C3** to Phase 04, **F6**, **F10**, **F15**, `local-test-artifacts/`.
