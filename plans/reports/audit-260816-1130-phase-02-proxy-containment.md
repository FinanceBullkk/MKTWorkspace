# Phase 02 — Proxy Containment (H31–H34)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-1105-phase-02-transport-auth.md`](./audit-260816-1105-phase-02-transport-auth.md)
Repo: MKTBrowser @ `feat/mkb-03-compatibility-set`, 9 commits, **nothing pushed**.

**Status: Phase 02 — 12 of 19 hypotheses closed** (H21–H23, H26, H27, H29–H34; H28 open with reason).
**Depth achieved: D4.** The proxy harness — the phase file's "single most valuable artifact" — exists
and is wired into CI.

## Gates

`yarn typecheck` PASS · `yarn lint` PASS 0 errors / 3 known warnings ·
`desktop test:mkb01` **20 pass** (was 15; +5) · `mcp-server test:managed` 27 pass.

## C11 (P2) — the bridge could not be tested at all, and that is why it never was

**Boundary:** proxy containment. **Not an exploitable defect — a testability defect on the module
that carries the product's primary security promise.**

`apps/desktop/src/main/socks5Bridge.ts:301`

The desktop test scripts load main-process modules with `node --experimental-strip-types`. That mode
cannot parse **TypeScript parameter properties**, and `socks5Bridge.ts` contained the only one in the
whole of `apps/desktop/src/main/`:

```
constructor(private readonly sock: Socket) {
```

So the module was **unloadable by its own repo's test runner**. This is the mechanical reason F3
listed it as untested: not oversight, a hard blocker nobody had named.

**Fixed** by declaring the field explicitly and assigning in the constructor body — behaviour
identical, no call-site change, and it unblocks any future test of this file, not only mine.

Ranked P2 rather than P3 because of what it was blocking: the SOCKS5 bridge is the mechanism
preventing identity disclosure, and it had zero executable coverage as a direct consequence.

## The harness

`apps/desktop/src/main/socks5-bridge-containment.test.ts` — a **test-controlled SOCKS5 upstream that
records the destination it is asked for**, plus an echo server standing in for the destination and
counting connections. Hand-rolled SOCKS5 rather than a library, so the bytes on the wire are read
directly; a library would normalise exactly the field under test.

Everything is loopback: no provider proxy, no real account, no external network, no observed IPs —
per the phase's security note, and per the local-only scope decided last session.

### H32 — remote DNS: CLOSED-CLEAN. This is the bridge's whole reason to exist.

The upstream receives **ATYP=DOMAINNAME** with the hostname intact. Two destinations:

- **`localhost`**, chosen deliberately. It resolves on every machine, so a bridge doing local
  resolution would still produce a *working* connection — the failure would be invisible except in
  the recording. This is the silent-failure shape the phase exists to catch.
- **`no-such-host.test`** (RFC 6761 reserved, never resolves). A bridge doing local DNS could not
  even form the request, so its arrival upstream is independent evidence for the same property.

### H33 — bind scope: CLOSED-CLEAN
Bridge URL is `127.0.0.1`, and where the machine has a non-loopback IPv4 interface the test confirms
the port is unreachable on it. A bridge on `0.0.0.0` would let any process on the LAN relay through
the user's proxy.

### H34 — auth ordering: CLOSED-CLEAN
With an upstream that rejects authentication, the connection fails **and the destination receives
nothing**. Asserted as traffic rather than status: if the bridge relayed anything before the upstream
accepted it, that traffic left the machine unproxied.

### H31 — upstream death: CLOSED-CLEAN. The highest-value assertion in the phase.

Control first: while the upstream is alive the path works and the destination is reached. The upstream
is then killed mid-session, and a new connection through the bridge **fails**, with the echo server's
connection count **unchanged** — proving no direct-egress fallback.

Observation at the destination is what makes this meaningful. A status code would only say the call
failed; the connection count says nothing reached the destination by another route.

## Red-then-green

| Sabotage | Result |
| --- | --- |
| bind `0.0.0.0` instead of loopback | H33 red |
| resolve the hostname locally before handing it upstream | H32 red, H31 red |
| fall back to a direct TCP connection when the upstream fails | **H34 red, H31 red** |

The third is the one that matters: the direct-egress fallback — *the* failure the product exists to
prevent — is caught by two independent tests. All sabotages restored; `git diff --stat` empty; sweep
clean.

## Process failures on my side, both self-caught

1. **I committed with a red typecheck.** My verification chain ended `yarn typecheck | tail -3 && …`,
   and `tail` returns 0, so a failing typecheck reported success. Caught on the next run, fixed in
   `6841d01`. The lesson is concrete: never read an exit status through a pipe. Subsequent checks use
   `$?` on the command itself.
2. **`git checkout` silently reverted an uncommitted production fix** while restoring a sabotage —
   the same trap as the C4 fix in Phase 01, and I walked into it again. Now committing the fix before
   running any sabotage cycle that touches the same file.

Neither reached the committed state, but both would have if the next step had not re-run the gate.

## Not examined

- **H24** `cdp_send` versus `CdpSession` safe mode; **H25** `launch_managed_profile` spec enforcement.
- **H28** second `/sse` stream — still open; withdrawn test explained in the prior report and
  documented in the test file itself.
- **H35** WebRTC firewall rule absent/stale/user-removable. `windows-webrtc-firewall.test.ts` exists
  and covers part of this; I did **not** sabotage-verify it, so I make no claim about it.
- **H36** `proxyGeo` probe-failure path; **H37** profile edited proxy → no-proxy retaining a warmed
  identity. `proxyGeo.ts` is Electron-free and testable, so both are tractable next.
- **H38–H39** extensions and IPC.
- The bridge's **HTTP-CONNECT** upstream path (`connectViaHttpConnect`) is untested — my harness
  exercises only the `socks5` upstream type. A profile configured with `type: "http"` takes a
  different code path with its own `Proxy-Authorization` handling. **This is the most important
  remaining gap in the proxy block.**

## Phase 02 tally so far

| Closed clean | Findings | Open |
| --- | --- | --- |
| H21, H22, H23, H26, H27, H29, H30, H31, H32, H33, H34 | **C9** P3 *(fixed)*, **C10** P3, **C11** P2 *(fixed)* | H24, H25, H28, H35–H39 |

## Unresolved questions

1. **Next: the HTTP-CONNECT upstream path**, then H36/H37. The harness generalises — the same
   recording upstream idea applies, with an HTTP CONNECT parser instead of SOCKS5. I recommend this
   over H38/H39, matching the phase file's instruction to protect proxy budget over extension work.
2. **H35** — worth a sabotage pass on the existing WebRTC firewall tests, given six of these have now
   found real gaps. Cheap.
3. **C10 hermeticity** (`test:installer` fails while MKT Browser runs) — still assigned to Phase 03.
4. **19 commits unpushed** across both repos (10 MKTTool, 9 MKTBrowser).
5. Carried: **C1** domain separation, **C2/C3** to Phase 04, **F6**, **F10**, **F15**,
   `local-test-artifacts/` retention.
