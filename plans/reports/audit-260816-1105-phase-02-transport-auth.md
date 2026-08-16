# Phase 02 — Local Control Surface: Transport Auth (PARTIAL)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-1050-phase-02-tool-authorization.md`](./audit-260816-1050-phase-02-tool-authorization.md)
Repo: MKTBrowser @ `feat/mkb-03-compatibility-set`, 6 commits, **nothing pushed**.

**Status: Phase 02 INCOMPLETE. 8 of 19 hypotheses closed** (H21–H23, H26, H27, H29, H30; H28 explicitly
open with reason). **Depth achieved: D4** on those closed.

## Decisions taken (delegated)

1. **Proxy harness scope: local-only.** Not a compromise — the better option. The phase's own security
   note forbids a real provider proxy, and its risk section says a flaky containment test is worse
   than none. A loopback harness proves H32/H33/H34 and the fallback half of H31 deterministically.
   Observing a real egress IP would trade determinism for something inferable another way.
2. **Order: HTTP fixture → H26–H30 → proxy harness.** Done as far as the transport block.
3. **Not pushed.** 16 commits are audit work-in-progress; pushing is outward-facing and unrequested.

## Gates

`yarn typecheck` PASS (6 projects) · `yarn lint` PASS 0 errors / 3 known warnings ·
`mcp-server test:managed` **27 pass** (was 10 at phase start; **+17**).

`yarn test:installer` — the one pre-existing failure from the prior report persists, unchanged and
unrelated (see C10 there): MKT Browser is genuinely running on this machine.

## Hypothesis status

| H | Verdict | How |
| --- | --- | --- |
| H26 wrong/missing token not 401 | **CLOSED-CLEAN** | 5 tests, 6 red on sabotage |
| H27 Host allowlist case handling | **CLOSED-CLEAN** | 2 tests, 1 red on sabotage |
| H28 second `/sse` hijacks the first | **NOT CLOSED — test withdrawn, see below** | read-level only |
| H29 `/healthz` leaks pre-auth | **CLOSED-CLEAN** | ordering confirmed behaviorally |
| H30 token discoverable from output | **CLOSED-CLEAN** | body + all headers checked |
| H24, H25, H31–H39 | **NOT EXAMINED** | |

### What is now proven about the control port

- Missing, wrong, prefix, over-long, wrong-scheme (`bearer`, `Basic`, bare token) and empty
  `Authorization` all yield **401**. Correct token yields 200 — asserted as a differential so no 401
  can be attributed to an unrelated failure.
- The token is **not** accepted from `?token=`, `?access_token=`, or a `Cookie`. Both matter: query
  strings land in logs and Referer headers; cookies would make the port CSRF-reachable.
- `/healthz` sits **behind** the auth check. Its response fields are absent from the 401 body,
  compared as parsed JSON keys rather than substrings.
- The configured token appears in **no** rejection body and **no** response header, while the 401
  still tells an operator how to authenticate.
- The Host allowlist returns **403** for a foreign Host on both `/messages` and `/sse`, and is
  case-insensitive for the loopback names it accepts.
- **Both fail-open branches are pinned**: an unset token *and* an empty-string token leave the port
  open to any local caller. This is documented behavior at `HttpTransport.ts:83`; it is now a
  *decision* rather than something that could quietly become an accident.

Red-then-green: disabling `authOk` turns **6** tests red; neutering `hostAllowed` turns **1** red.
Restored, `git diff --stat` empty.

## Two of my own tests were wrong, and both mattered

Recorded because each would have produced a false result.

1. **The Host allowlist test proved nothing through `fetch`.** `Host` is a forbidden header name in
   the Fetch spec — undici drops it silently, so the request carried the *real* Host, sailed through
   `hostAllowed`, and failed later with **409** ("no SSE stream open"). I only noticed because 409 is
   not a plausible host-rejection status. Rewritten against `node:http`, which permits the override;
   it now returns the expected 403, with a legitimate-Host differential showing the 409 path is what
   the guard is being compared against.
2. **A trailing space after the token is not a near-miss.** It is stripped by the HTTP parser as
   optional whitespace (RFC 7230 §3.2) and never reaches `authOk`, so it is genuinely the same
   credential. My hypothesis was wrong; converted to a pinned observation rather than reported as a
   finding.

A third, smaller correction: comparing the 401 body against `/healthz` field names by substring
fails spuriously, because the word **token** contains **ok**. Now compares parsed keys.

## H28 — withdrawn deliberately, not overlooked

`HttpTransport.ts:184-186` assigns `this.sseTransport = transport` for every `GET /sse` **without
closing the previous one**, so two authenticated local clients contend for one slot. That is
read-level evidence and I am not claiming it as closure.

I wrote an executable test and **withdrew it**: holding two live SSE connections kept the runner's
event loop alive and the suite **hung for six minutes** instead of failing. The phase's own rule
decides this — a test needing a retry or a forced exit is worse than none, because it teaches people
to re-run. Closing H28 needs a fixture that owns socket teardown deterministically, which is fixture
work, not test work.

The gap is documented **in the test file itself**, at the place someone would look for it.

## Proxy harness feasibility — settled, and better than expected

The phase file flags harness complexity as the main risk and warns that Electron dependence could
force ugly workarounds. Checked directly:

**`socks5Bridge.ts` (381 lines) and `proxyGeo.ts` (115 lines) import no Electron at all** — only
`node:net`, `socks`, `https-proxy-agent`, `socks-proxy-agent` and workspace types. They are ordinary
Node modules and run under `node:test`/tsx with no Electron process.

Also read at signature level, which pre-answers part of the block:

- `startBridgeForProfile(profileId, upstream: ProxyConfig) → "socks5://127.0.0.1:<port>"` — a clean
  seam to drive.
- `server.listen(0, "127.0.0.1", …)` — **binds loopback with an ephemeral port**, which is H33's
  answer at read level. It still needs a test; a bind-scope assertion is cheap.

**Plan for the harness** (one artifact, three hypotheses): a test-controlled SOCKS5 upstream that
**records the destination it is asked for**. If the bridge passes a hostname, remote DNS is working —
that is H32, and it is the entire reason the bridge exists. The same upstream proves H34 (no
connection accepted before upstream auth) and, by being killed mid-session, the fallback-to-direct
half of H31.

## Not examined

- **H24** `cdp_send` versus `CdpSession` safe mode; **H25** `launch_managed_profile` spec enforcement.
- **H31–H37 proxy containment** — the phase's highest-value block, untouched beyond the feasibility
  read above.
- **H38–H39** extensions and IPC.
- `server.ts` tool bodies, `CdpSession.ts`, and the unread relay handlers — no D2 read done.
- The `/mcp` route's SDK-provided DNS-rebinding protection is asserted only through auth; I did not
  test rebinding on that path separately from the legacy routes.

## Running note — sabotage verification

No new instance of the untested-guard pattern this block: `HttpTransport` had **no** tests at all
rather than misleading ones, so there was nothing to falsify. The technique's tally stands at six.

## Unresolved questions

1. **Proxy harness next** — my recommendation and the obvious next step now that feasibility is
   settled. Confirm, or redirect to H24/H25 first.
2. **H28** — accept as open until a deterministic socket-teardown fixture exists, or prioritise that
   fixture? It is a local-client contention issue, both parties authenticated; I rank it low.
3. **C10 hermeticity** (`test:installer` depends on whether MKT Browser is running) — still open,
   assigned to Phase 03. It makes the installer suite unreliable on any developer machine.
4. **16 commits unpushed** across both repos (10 MKTTool, 6 MKTBrowser). Held by decision above.
5. Carried, unchanged: **C1** domain separation, **C2/C3** to Phase 04, **F6**, **F10**, **F15**,
   `local-test-artifacts/` retention.
