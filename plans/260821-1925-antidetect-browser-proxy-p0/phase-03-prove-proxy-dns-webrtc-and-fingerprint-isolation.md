---
phase: 3
title: "Prove Proxy DNS WebRTC and Fingerprint Isolation"
status: in-progress
priority: P1
effort: "1-2 days"
dependencies: [1, 2]
---

# Phase 3: Prove Proxy DNS WebRTC and Fingerprint Isolation

## Overview

Prove the full MKTTool-to-Browser path uses the assigned static proxy without DNS or WebRTC bypass,
keeps the same fingerprint for the same profile, produces different identities for different
profiles, and fails closed for dead, wrong, or unverifiable proxy state.

## Context Links

- E:\MKTWorkspace\MKTTool\scripts\smoke-test-mkt-browser-correct-proxy.ts
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\socks5Bridge.ts
- E:\MKTWorkspace\MKTBrowser\packages\mcp-server\src\managed-profile-launch.ts
- E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\chromium-network-privacy-flags.ts
- E:\MKTWorkspace\MKTBrowser\packages\profile-manager\src\fingerprint.ts

## Requirements

- Functional: launch through MKTTool signed ticket and Relay, not by directly invoking Browser MCP.
- Functional: atomically persist and read back the exact proxy before engine launch.
- Functional: verify in-browser egress matches an independent proxy probe without retaining either IP.
- Functional: test DNS, WebRTC, timezone/locale coherence, fingerprint persistence, and profile data
  isolation using two disposable profile/proxy pairs.
- Functional: dead proxy, wrong active proxy, bridge failure, firewall uncertainty, and verification
  failure must block launch.
- Non-functional: no public CDP endpoint, no proxy credential in logs, no direct license/network fallback.

## Architecture

MKTTool validates the account, assigned device, and server-side proxy liveness, then issues a signed
ticket. Relay decrypts the proxy locally and calls atomic managed launch. MKT Browser serializes the
profile, persists and reads back proxy state, verifies WebRTC containment, starts a loopback-only
SOCKS bridge, applies DNS/privacy flags, reconciles fingerprint geo, launches, and records only a
sanitized diagnostic.

## File Inventory

| Action | Path | Purpose |
|---|---|---|
| Modify if gaps found | E:\MKTWorkspace\MKTBrowser\packages\mcp-server\src\managed-profile-launch.ts | Preserve atomic persist-readback-launch contract |
| Modify if gaps found | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\socks5Bridge.ts | Fail-closed upstream routing and remote DNS |
| Modify if gaps found | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBrowserDriver.ts | Launch-time proxy, geo, WebRTC, and diagnostics |
| Modify if gaps found | E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\windows-webrtc-firewall.ts | Exact-engine outbound UDP containment |
| Modify | E:\MKTWorkspace\MKTTool\scripts\smoke-test-mkt-browser-correct-proxy.ts | Full-ticket sanitized attestation and negative cases |
| Modify if needed | E:\MKTWorkspace\MKTTool\relay\src\launch-profile.ts | Preserve stable failure codes and proxy remedies |
| Create during execution | E:\MKTWorkspace\plans\260821-1925-antidetect-browser-proxy-p0\reports\proxy-isolation-verdict.md | Real proxy and isolation evidence |
| Delete | None | Existing containment tests remain authoritative |

## Tests Before

1. Lock current managed-launch tests: persist/readback, active-proxy match, mismatch refusal, and
   concurrent serialization.
2. Lock SOCKS and HTTP upstream hostname-forwarding, auth refusal, and no-direct-fallback tests.
3. Lock unconditional DNS/privacy switch and Windows WebRTC firewall tests.
4. Record current fingerprint hashes for two disposable seeds without recording raw fingerprint payloads.

## Implementation Steps

1. Confirm the full ticket path selects the account owner device and assigned proxy/profile pair.
2. Add a sanitized run correlation ID from MKTTool audit entry through Relay and Browser diagnostic.
3. Extend the correct-proxy smoke to compare independent and in-browser egress in memory, emitting
   match, country, ASN family, elapsed time, and redacted failure only.
4. Run ten launch/close cycles for profile A through proxy A and ten for profile B through proxy B.
5. On each cycle verify bridge address is loopback, browser egress matches the assigned proxy probe,
   DNS does not use the operator/home resolver, and WebRTC exposes no non-proxied public route.
6. Verify profile A retains fingerprint hashes, timezone, locale, storage, and cookies across restart.
7. Verify profile B differs from A where seeded identity should differ and cannot read A storage.
8. Attempt active proxy replacement while A is running; require atomic refusal without storage change.
9. Test dead credentials, rejected CONNECT/SOCKS auth, silent upstream, wrong proxy, missing firewall
   rule, and bridge crash. Every case must stop before a usable browser session.
10. Reboot or restart Browser once and repeat the two-profile mapping to detect stale proxy/fingerprint state.
11. Add only the smallest code fixes exposed by these runs; no new proxy abstraction if existing
    managed launch and bridge contracts can own the behavior.

## Measured 23 August 2026 - PC A

Evidence: [`ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md`](../reports/ket-qua-260823-1910-gate-cach-ly-va-loi-khong-xoay-khoa.md)

Two disposable profiles, two assigned proxies, measured against an independent out-of-browser probe
of the same proxies. Addresses are recorded because both proxies are disposable test endpoints the
owner has confirmed are not operational identities.

| Check | Profile A | Profile B |
|---|---|---|
| Independent proxy probe | `82.29.239.125` | `82.25.225.8` |
| In-browser egress | `82.29.239.125` | `82.25.225.8` |
| Match to own proxy only | yes | yes |
| DNS resolver seen by an authoritative server | `82.29.239.125` | `82.25.225.8` |
| Operator ISP resolver reached | no | no |
| WebRTC ICE candidates | none gathered | none gathered |
| Operator real address `14.169.109.47` | absent | absent |

DNS resolves remotely through each profile's own proxy, which is what the SOCKS5 bridge is for. No
probe saw the other profile's exit.

**This does not close the gate.** A and B were measured sequentially, not concurrently: only one
licence seat was reliably free during the run. Cross-wiring between two live profiles - shared
process, shared resolver, shared storage partition, a socket reused across profiles - is exactly
what a sequential run cannot exclude, and it is the reason this phase stays open.

Two observations recorded rather than acted on. The total absence of ICE candidates is good for leak
containment but is itself unusual enough to be a signal; real Chrome gathers at least one. And
profile B was issued `locale: da-DK` with `timezone: Europe/Copenhagen` while its proxy exits in
Singapore, which is a geography mismatch a scanner can read directly.

## Test Scenario Matrix

| Scenario | Expected |
|---|---|
| Profile A / proxy A | Browser and independent probe match; no raw IP retained |
| Profile B / proxy B | Separate egress and separate identity; no shared storage |
| Same profile reopen | Stable seed-derived fingerprint and assigned proxy |
| Running profile with proxy mismatch | Atomic rejection; stored and active proxy unchanged |
| Dead or silent upstream | Bounded timeout; no direct fallback; no launched session |
| DNS bypass attempt | Browser resolver evidence stays at proxy path |
| WebRTC STUN attempt | No operator/home public route exposed |
| Firewall rule absent or foreign | Launch blocked before engine start |
| Concurrent launch requests | One serialized result; no proxy cross-wire |
| Browser restart | Mapping survives; no legacy/fallback adapter |

## Dependency Map

- Requires phase 1 baseline and phase 2 final launch-argument decision.
- Blocks phase 4 because license sidecar traffic must reuse the proven profile proxy path.
- Blocks phase 5 readiness and phase 6 canary.

## Tests After

- Unit and integration suites for managed launch, bridge containment, privacy flags, firewall, geo,
  fingerprint reconciliation, Relay error mapping, and secret redaction.
- Packaged two-profile real-proxy run from the installed Browser.
- Negative tests must run before positive acceptance is signed.

## Regression Gate

- Zero proxy bypass, credential leak, or cross-profile state in automated and packaged evidence.
- Twenty total successful launch/close cycles with 100% expected proxy match.
- Every negative proxy case fails before a usable session.

## Success Criteria

### Automated checkpoint - 22 August 2026

- Proxied launch now stops before bridge or engine startup when the egress probe is unavailable,
  empty, or malformed; provider details are mapped to the stable `PROXY_REJECTED` contract.
- The disposable smoke now waits for the MCP listener, then creates and launches only through signed
  tickets handled by Relay. It does not request page-control, raw CDP, cookies, or page content.
- Atomic proxy persistence/readback, active-proxy mismatch, concurrent launch serialization, remote
  DNS forwarding, upstream-auth refusal, and no-direct-fallback regressions pass.
- The live two-profile/two-proxy egress, DNS, WebRTC, fingerprint, and storage evidence below remains
  open and cannot be replaced by these automated checks.

- [ ] Two disposable profiles remain pinned to two assigned static proxies.
- [ ] Independent and in-browser egress match on every accepted run.
- [ ] DNS and WebRTC checks expose no operator/home route.
- [ ] Same-profile fingerprint is stable; cross-profile identity and storage remain distinct.
- [ ] Dead, wrong, concurrent, or unverifiable proxy state fails closed.
- [ ] Evidence contains no proxy credentials or observed IP addresses.

## Risk Assessment

- Public leak-check sites can change behavior. Mitigation: use at least two independent measurement
  methods and retain only sanitized comparisons.
- Proxy geo providers can disagree. Mitigation: treat geo as coherence evidence, not the routing source
  of truth; exact egress match remains authoritative.
- Current Browser process may hold stale profile state. Mitigation: use disposable roots and verify
  process/data-dir ownership before each run.

## Security Considerations

- Proxy secrets remain encrypted on the server and decrypted only on the assigned Relay.
- Browser activity logs and errors must redact overlapping host, username, and password values longest-first.
- Do not expose raw CDP, cookies, page content, or browser egress through server responses.
