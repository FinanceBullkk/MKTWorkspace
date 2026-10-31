# Phase 03 - Brave lifecycle and integration spike

- **Measured:** 2 September 2026
- **Host:** current Windows x64 development machine
- **Scope:** official prebuilt Brave only; disposable profile data; no product integration changes

## Decision

**MKT's existing lifecycle, CDP, and proxy components can drive official Brave. The current product
cannot select Brave end to end yet.** Two checks fail: Brave is not yet covered by an
installer-managed Windows UDP firewall boundary in the product, and the companion content script
does not run on the Chrome Web Store. Both are MKT-side application/installer work; neither requires
Chromium/Blink C++, a source build, sandbox bypass, or CSP weakening.

The six required checks close at **4 PASS / 2 FAIL**.

Phase 03 therefore does **not** trigger the early stop for an engine that cannot be made compatible
within a few days. Phase 04 is technically reachable with the same disposable harness. This report
does not start Phase 04, approve an engine change, change `G2-IDENTITY`, or authorize real accounts.

## Artifact provenance

| Item | Verified value |
|---|---|
| Official release | Brave `v1.94.117`, published 26 August 2026 |
| Chromium reported over CDP | `152.0.7977.64` |
| Windows asset | `brave-v1.94.117-win32-x64.zip` |
| Official URL | `https://github.com/brave/brave-browser/releases/download/v1.94.117/brave-v1.94.117-win32-x64.zip` |
| Asset size | `247,889,486` bytes |
| Archive SHA-256 | `c3f29329933e007997290956f82203aad82224addd79ef26a22ed726bad08b4b` |
| Extracted executable | `brave.exe`, version `152.1.94.117` |
| Executable SHA-256 | `a5b6dcfdcf6ad316ae0fa334012ac05ded56fd7989a63ae1ad4f3947b10365ab` |
| Authenticode | valid; signer `Brave Software, Inc.` |

The archive hash matched all three checked sources: the downloaded official `.sha256` sidecar,
GitHub's release-asset digest, and a fresh local SHA-256 calculation. The ZIP was extracted under a
disposable `%TEMP%` root. Brave was not installed, copied into MKT Browser, distributed, or assigned
as the product engine.

## Procedure

The spike imported and exercised the current MKT components directly:

- `waitForOwnedDevToolsEndpoint` for bounded `DevToolsActivePort` and process/listener ownership;
- `CdpSession` for CDP navigation, evaluation, and `Browser.close`;
- `startBridgeForProfile` for the current SOCKS5-to-HTTP CONNECT proxy path;
- the current network-privacy arguments and unpacked companion extension;
- the existing fingerprint probe as a compatibility smoke check only.

The successful proxy target, fail-closed target, persistence state, and WebRTC observer were local
synthetic fixtures. The WebRTC observer counted UDP datagrams to a non-loopback local adapter but did
not retain the adapter address, candidate address, proxy value, or observed IP. No real account,
credential, extension install, or external browsing state was used.

## Six required checks

| # | Check | Verdict | Measured evidence |
|---|---|---|---|
| 1 | `DevToolsActivePort` discovery and CDP | **PASS** | The current ownership-aware discovery completed in `1,306 ms`. It found seven processes for the exact disposable data root and one owner for the DevTools listener. CDP connected, returned `Chrome/152.0.7977.64`, and used the expected `/devtools/browser/...` endpoint. Netstat showed five loopback rows and zero wildcard rows. |
| 2 | `Browser.close`, ownership, restart | **PASS** | `Browser.close` removed every process owned by the first data root. A second launch using the same root succeeded on a fresh OS-assigned port, and the second close also left no owned process. |
| 3 | Proxy fail-closed, DNS, WebRTC | **FAIL** | Proxy and DNS passed in the direct-component spike harness: the current bridge loaded the synthetic target, the upstream CONNECT proxy received the destination hostname, and stopping the bridge produced `net::ERR_PROXY_CONNECTION_FAILED` with no direct HTTP fallback. That harness bypassed the product's pre-launch firewall gate and observed one direct STUN datagram even with `disable_non_proxied_udp`. The proxied product path itself fails closed before browser spawn: its verifier requires exact `chrome.exe` naming plus the selected engine's stable runtime suffix, so Brave's `brave.exe` is rejected as `unexpected-runtime`. The verdict remains FAIL because Brave still lacks its own installer rule and verifier coverage. |
| 4 | Companion extension and required APIs | **FAIL** | Brave recorded the exact unpacked MV3 companion path in `Default/Secure Preferences` with command-line load location `8`, so the loader accepted it. On a fully loaded real Chrome Web Store detail page, however, the companion created no `#mkt-browser-add-extension` button and no `data-mkt-browser-add-ext` DOM signal. Its required operations are ordinary content-script DOM APIs; the failure is execution on that protected page, not a missing privileged `chrome.*` API. |
| 5 | Same-root profile persistence | **PASS** | A synthetic `localStorage` value and a Max-Age cookie written before `Browser.close` were both present after restarting with the identical `--user-data-dir`. This proves storage persistence, not Phase 04 identity-seed semantics. |
| 6 | Existing security boundaries | **PASS** | Process inspection found no `--no-sandbox`, `--disable-web-security`, or in-process Network Service bypass. No MKT source, renderer CSP, engine pin, installer rule, or packaged payload changed. CDP remained loopback-only. The WebRTC failure above is an uncovered Brave boundary that must be added; no existing CFT/Cloak boundary was weakened. |

## Check 3 clarification - product path is fail-closed

A post-spike source review changes the security interpretation of check 3, not its verdict:

- `windows-webrtc-firewall.ts` computes the required suffix as
  `chromium\<engine>\runtime\chrome.exe`. It rejects any other basename or suffix with
  `unexpected-runtime` before PowerShell runs. Brave's executable is `brave.exe`, so it cannot pass
  this guard. For an accepted runtime, the PowerShell verifier also throws on `rule-count` unless
  exactly one named rule exists, and on `rule-invalid` unless the program, UDP protocol, all Windows
  firewall profiles, outbound block action, enabled state, and firewall state all match.
- `ChromiumBrowserDriver` awaits this verifier before its later `spawn(chromiumPath, ...)` call and
  converts rejection to `proxyRejected` with the explicit result that the proxied profile was not
  launched. If the current product path is pointed at Brave, it declines to start Brave; it does not
  launch Brave and then leak WebRTC.
- The spike imported and drove MKT lifecycle, proxy, and network-privacy components directly. That
  path bypassed the product's pre-launch firewall gate, so the observed STUN datagram came from a
  path the product does not take.

Check 3 stays **FAIL** because product selection of Brave still requires its own installer-managed
outbound-UDP block plus rule-name/path mapping and verifier tests for
`chromium\brave\runtime\brave.exe`. The `0.5-1 day` firewall estimate stands. The failure is missing
Brave integration coverage, not a hole in the existing fail-closed CFT/Cloak boundary. Reading only
the original verdict row as "the current product launches Brave and leaks" would be incorrect.

## Additional compatibility evidence

The existing fingerprint probe executed without adaptation and returned schema `1`, all four
contexts (`document`, `iframe`, `worker`, and `offscreenCanvas`), and all ten document surface groups.
This is only proof that the Phase 04 measurement APIs run under Brave. It is **not** identity,
uniqueness, consistency, cohort, or rollout evidence.

## MKT-side changes and cost

No changes below were made in this phase.

| Gap | Required MKT-side change | Estimate |
|---|---|---|
| Product cannot select Brave | Add `brave` to `BrowserEngine`; add a pinned official manifest/checksum path; resolve `brave.exe`; give Brave its own stable runtime and per-profile data-root namespace; map runtime/contract status; cover selection, download, atomic replacement, launch, close, and restart tests. | `2-3 engineering days`, including the firewall work below |
| Brave firewall rule/verifier coverage is absent | Add an installer-managed outbound-UDP block for the exact stable Brave executable and all Windows firewall profiles. Extend the fail-closed verifier and rule-name/path mapping for `chromium\brave\runtime\brave.exe`; repeat the observed UDP test before accepting the integration. | Included above; approximately `0.5-1 day` of the total |
| Web Store companion does not execute | For the smallest safe integration, stop offering the nonfunctional Brave companion shortcut and use the existing in-app Web Store URL/ID flow backed by `ExtensionsService.installFromWebStore`. If identical on-page convenience is required, provide a host-side CDP UI/channel with explicit page scoping and tests. | `0.5-1 day` minimal; `1-2 days` for on-page parity |

The minimal internal integration is therefore roughly **3-4 engineering days** if it uses the
existing in-app extension flow. Preserving the companion's on-page convenience could take the total
to roughly **4-5 days**. These estimates cover normal TypeScript/renderer/installer work and tests;
they do not include Phase 04 identity measurement or a later engine-migration/release plan.

## Measured versus inferred

### Measured

- Official release metadata, archive size and digest, local archive hash, executable version/hash,
  and Authenticode signer all matched the values above.
- The current MKT endpoint discovery, CDP session, ownership enumeration, `Browser.close`, restart,
  storage persistence, proxy bridge, remote-hostname forwarding, and fail-closed navigation worked.
- The local WebRTC observer saw one direct STUN datagram in the uncontained control and one in the
  direct-component Brave launch with the containment flag; that harness bypassed the product's
  pre-launch firewall gate, and the flag alone did not remove the direct UDP route.
- Source review confirmed that the normal proxied product path verifies the exact engine runtime and
  Windows firewall rule before browser spawn, so Brave's `brave.exe` is refused rather than launched
  without containment.
- Brave persisted the companion record but produced neither its Web Store button nor its DOM signal.
- No forbidden security switch or non-loopback DevTools listener was observed.

### Inferred

- Brave or the protected Chrome Web Store prevents this unpacked content script from executing on
  the store page. The persisted record plus absent DOM effect supports that explanation, but this
  spike did not instrument Brave internals and does not claim the precise upstream enforcement path.
- Existing lifecycle/CDP compatibility means an MKT integration is ordinary application plumbing,
  not a native-engine project. The cost estimate is engineering judgement, not elapsed measurement.
- The storage persistence result makes a stable profile possible; whether Brave's fingerprint seed
  and audio/font/WebGL values satisfy MKT's identity contract remains unanswered until Phase 04.

## Boundary and cleanup

- Product source, engine pins, installer rules, CSP, and packaged artifacts were unchanged.
- The official ZIP, extracted runtime, disposable profile roots, and temporary spike helpers were
  removed after verification. They were never installed or distributed.
- Raw fingerprint values, proxy details, IP addresses, cookies, credentials, tokens, and Web Store
  page content are not retained in this report.

Local regression checks after the measurement passed `41/41` lifecycle, discovery, proxy, DNS, and
firewall tests plus `11/11` fingerprint-analysis/probe tests. Both repository diff checks passed.
These are local checks, not GitHub Actions or release evidence.

## Unresolved questions

- Whether Phase 04 finds Brave's audio value to be a same-machine Windows cohort value or an
  invariant Brave vendor mark.
- Whether a future integration should omit the Web Store companion for Brave or fund full on-page
  parity; the existing in-app URL/ID path is already the smaller safe option.
