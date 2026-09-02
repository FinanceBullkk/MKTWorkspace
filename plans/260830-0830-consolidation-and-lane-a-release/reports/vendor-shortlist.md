# Lane C vendor shortlist and cost screen

Date: 2026-08-30 | Decision status: **Lane C CLOSED**; future alternatives only; no candidate acquired or measured

This is a desk screen, not an identity result. The acceptance bar is unchanged for every candidate:
three fresh profiles, five runs each, no pairwise collision on external fonts, `OfflineAudioContext`,
or WebGL image values, coherent UA/screen/timezone/locale, and no tampering/exception deduction.
Marketing claims and local hashes do not count. No trial, purchase, engine launch, or licence-seat
consumption occurred in this phase.

## Ranked options

| Rank | Candidate / lever | Product fit | Licensing / direct cost | Engineering cost to a measured candidate | Decision |
|---:|---|---|---|---|---|
| 1 | CloakBrowser vendor-native build | Excellent Chromium/CDP fit; preserves the current shell | Existing commercial entitlement; incremental price and terms unknown; no purchase authorized | Smallest integration path: roughly 2–5 engineering days for intake, checksum/provenance, lifecycle, and the full identity matrix if a future channel appears | **Unavailable: no vendor channel. No request or date exists.** |
| 2 | MKT-owned Chromium patch set, using Brave native farbling as a reference | Excellent long-term Chromium/CDP fit | Chromium/Brave source obligations (MPL/third-party notices); binary distribution and fonts require separate legal review; no seat price, legal review cost **unknown** | Brave compatibility spike 5–7 days; seed/manifest PoC 2–4 weeks; productization 4–8+ additional weeks; ongoing security-rebase owner | **Strategic fallback**, not funded or started here |
| 3 | Camoufox / Firefox-native runtime | Native surface controls are plausible, but not Chromium/CDP-compatible | MPL-2.0 source obligations; bundled fonts and binary terms require review; direct cost **unknown/quote-free source** | High migration cost: new Firefox/Juggler driver, MCP/API inventory, extension and lifecycle rewrite; at least several engineering weeks before a comparable gate | **Bounded fallback only** if Chromium paths fail |
| 4 | Unmodified Brave runtime | Better native reference material, but not an MKT identity solution | Source is available under MPL obligations; bundled binary/trademark/codec terms and redistribution **not cleared** | 5–7 day disposable compatibility and scanner spike, then the same 3×5 gate | **Research spike only**; no production promotion |
| 5 | Chrome for Testing / stock CFT | Chromium compatibility, but current evidence is compatibility-only and does not isolate identity | Download terms and redistribution review required; direct cost not the blocker | Low integration cost, but native identity gap remains; no credible path to the acceptance bar without an engine change | **Reject as Lane C candidate**; retain only as a compatibility fixture |

## Evidence and ranking rationale

- CloakBrowser is the only option that preserves the current licensed runtime boundary, but the
  current Stable `.2` evidence fails `G2-IDENTITY` (fonts `08050B16`, audio `0B09CAEB`, WebGL
  `BF16CA5C`). The vendor must provide a checksum-bound build and let the external matrix decide.
- The vendor-independent research report recommends a Brave-informed native Chromium path because
  fonts, WebAudio, WebGL, and WebGPU need one coherent native context. It also estimates the spike,
  PoC, and productization ranges above; those are engineering estimates, not a schedule commitment.
- Camoufox has native controls but changes the automation model from Chromium/CDP to
  Firefox/Juggler. That is a product migration, not a drop-in engine replacement.
- CFT and unmodified Brave can prove lifecycle/compatibility behavior only. Neither is evidence of
  per-profile identity isolation, so neither can close Lane C.

## Vendor channel decision

The prior sanitized request draft in
`plans/260829-2125-internal-product-readiness/reports/external-track-register.md` is historical
context only. The owner confirmed at 10:15 that there is **no channel to CloakBrowser**. It was not
sent, no sender or deadline will be invented, and no response is being awaited. This absence closes
Lane C for the current product shape; there is no date or “coming soon” statement.

## Reopening / measurement condition

The closed custom-engine track may reopen only on hardware proving more than 16 GiB available RAM,
or on a funded cloud builder, with a named owner for the subsequent measurement and security-rebase
work. Any candidate acquired later still faces the same external 3-profile × 5-run matrix and the
license, provenance, lifecycle, and legal gates. This is future scope, not an active release path.
