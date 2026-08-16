# Phase 02 — Local Control Surface: Tool Authorization (PARTIAL)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-1015-phase-01-complete.md`](./audit-260816-1015-phase-01-complete.md)
Repo: MKTBrowser @ `feat/mkb-03-compatibility-set`, 5 commits, **nothing pushed**.

**Status: Phase 02 INCOMPLETE. 3 of 19 hypotheses closed (H21–H23).**
**Depth achieved: D4** on those three. Phase file estimates 2 sessions; this is part of the first.

Stopping at a clean boundary — the MCP client fixture is built and the tool-authorization invariant is
closed, which is the natural seam before the proxy harness.

## Gates

`yarn typecheck` PASS (6 projects) · `yarn lint` PASS 0 errors / 3 known warnings ·
`packages/mcp-server test:managed` **17 pass** (was 10; +7).

`yarn test:installer` — **1 failure, pre-existing and environment-caused, not a regression**. See below.

## Hypothesis status

| H | Verdict | How |
| --- | --- | --- |
| H21 denied tool dispatches anyway | **CLOSED-CLEAN — gap in coverage found and fixed** | 7 tests, red-then-green |
| H22 name matching case/whitespace-tolerant | **CLOSED-CLEAN** | 8 variants, all refused |
| H23 unclassified tool defaults to allowed | **CLOSED-CLEAN** | default-deny proven under both policies |
| H24–H39 | **NOT EXAMINED** | see below |

## C9 (P3, test-coverage) — the dispatch-time deny check was untested

**Boundary:** MCP local control surface. **Not a vulnerability — the guard is correct today.**
This is the invariant the phase file ranks first: *only profile management is reachable with the
Relay token*, where `evaluate_js` and `cdp_send` alone are arbitrary code in the page.

`packages/mcp-server/src/server.ts:477`

Two enforcement points exist and they are not equivalent:

| Point | What it protects |
| --- | --- |
| `:466` `tools/list` filter | a well-behaved client |
| `:477` `tools/call` check | **an attacker, who does not call `tools/list` first** |

**Discovered by sabotage:** removing the dispatch-time policy check — leaving the listing filter fully
intact — left **all 10** existing tests green. `tool-exposure-policy.test.ts` tests `isMcpToolAllowed`
as a pure function; `security-contract.test.ts` asserts the *string* `isMcpToolAllowed(...)` appears in
`server.ts`. Neither observes whether dispatch consults it.

**Impact had it regressed:** any client holding the Relay token could call `evaluate_js` or `cdp_send`
by name and obtain arbitrary code execution in any page — full identity compromise, the exact failure
the product exists to prevent.

**Fixed:** `packages/mcp-server/src/mcp-tool-authorization.test.ts`, wired into `test:managed`.

The fixture drives the **real** `createMktBrowserMcpServer` over the **real** MCP protocol (SDK
in-memory transport, real `Client`), with a real `ProfileManager` on a temp SQLite DB and the shipped
`MockBrowserDriver` — the same driver `standalone.ts` uses in production standalone mode — wrapped in
a recording Proxy.

**The decisive assertion is not the error.** A denied tool can error for a dozen unrelated reasons
(missing profile, schema failure). The assertion is that **the driver was never touched**: reaching
the driver at all is the breach, whatever the response says. This is the direct answer to the
`result.ok === false` false-pass that cost the Phase 00 session.

Red-then-green: with the dispatch check removed, exactly one test goes red — *"a denied tool called
directly by name is refused and never reaches the driver"* — while the existing 10 stay green.
Restored; `git diff --stat` empty; guard confirmed present at `:477`.

### What the tests assert

- **H21** — all 24 tools: listed ⇔ allowed by policy; every one of the 16 denied tools refused at
  dispatch; driver untouched. Plus a **differential control** under `FULL_LOCAL_ACCESS_POLICY`: same
  server, same call, only the policy differs, and the driver *is* reached — so the refusals above are
  attributable to policy and not to the fixture.
- **H22** — `Navigate`, `NAVIGATE`, `navigate `, ` navigate`, `navigate\t`, `navigate\n`, `nav igate`
  all refused, driver untouched. Matching is exact.
- **H23** — `future_unclassified_tool`, `delete_profile`, `__proto__`, `constructor` all refused.
  Default-deny holds **under `FULL_LOCAL_ACCESS_POLICY` too**, so it comes from classification rather
  than from the capability list — the stronger property.
- An inventory guard asserts 24 tools and that the five most dangerous are in the denied set, so no
  assertion can pass vacuously if the table is emptied.

## Pre-existing installer test failure — environment, not code

`apps/desktop/scripts/windows-installer-ownership-fixtures.test.cjs`
→ *"A different MKT Browser installation is running"*, exit 20 ≠ 0.

**Confirmed not mine:** fails identically with my changes stashed on a clean tree.

**Cause:** MKT Browser is genuinely running on this machine — 4 processes — because the Phase 00 F7
restore brought the production relay and browser up at 08:22. Phase 00 recorded `test:installer` PASS
at ~08:03, *before* that restore. The test is doing the right thing operationally: it refuses to touch
installer state while a real installation is live.

**But it is a test-quality finding (C10, P3, hermeticity):** the suite consults real machine state, so
its result depends on whether the developer has the app open. CI green ≠ developer green, and the
check cannot distinguish its own fixture from the user's real installation. Belongs to **Phase 03**,
which owns Windows lifecycle.

**I did not close MKT Browser to make it pass** — that is live operator state and outside audit
authority. To reproduce a green run, close MKT Browser first.

## Not examined — no conclusion should be drawn

- **H24** `cdp_send` reaching CDP domains that `CdpSession` safe mode refuses.
- **H25** `launch_managed_profile` accepting a spec that disables proxy/fingerprint enforcement.
- **H26–H30** transport auth entirely: `HttpTransport.authOk()` fail-open when no token is set, Host
  allowlist, the single `sseTransport` slot, `/healthz` ordering, token discoverability.
  **Note:** my fixture uses the in-memory transport, so it does **not** exercise `HttpTransport` at
  all. H26–H30 still need the real-HTTP fixture the phase file calls for.
- **H31–H37 proxy containment** — the phase file's highest-value block and its most expensive
  artifact. Untouched. The controlled-upstream + egress-echo harness does not exist yet.
- **H38–H39** extensions and IPC.
- No file in `apps/desktop/src/main/` was read this session.

## Running note — the sabotage-verification technique

This is the **sixth** guard found untested by sabotaging it and watching the existing suite stay green
(five in Phase 01, one here). The technique transferred to a different repo, a different test runner
(`node:test` rather than vitest), and a different failure shape on the first attempt.

Phase 01's recommendation stands and is now better evidenced: apply it to existing suites in every
remaining phase, not only to new tests.

## Unresolved questions

1. **Continue Phase 02 next session?** Order I would take: real-HTTP fixture → H26–H30, then the proxy
   harness → H31–H37. The phase file warns to protect the proxy budget over extension work (H38 defers);
   I agree, but H26–H30 is cheap once the HTTP fixture exists and shares that fixture.
2. **Proxy harness feasibility** needs an early decision. It wants a controlled upstream proxy plus an
   egress-IP echo. A fully local harness (loopback upstream + local echo server) can prove H32/H33/H34
   and the *fallback-to-direct* half of H31. Proving a real egress IP would need outbound network,
   which I have not assumed. Confirm the local-only scope is acceptable, or authorize network egress.
3. **C10 hermeticity** — accept as a Phase 03 item, or fix sooner? It currently makes `test:installer`
   unreliable on any developer machine running the app.
4. Carried, unchanged: **C1** domain separation, **C2/C3** deferred to Phase 04, **F6**, **F10**,
   **F15**, `local-test-artifacts/` retention.
5. **15 commits now unpushed** across the two repos (10 MKTTool, 5 MKTBrowser). Push, or hold?
