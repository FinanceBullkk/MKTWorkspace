# S4a — Identity early probe and engine pin freeze

> **Superseded closure notice — Q16, 30 August 2026.** This Browser identity record remains valid as
> historical evidence for `G2-IDENTITY=FAIL`, but its `blocked`/vendor-wait language is no longer
> current. There is no CloakBrowser channel; Lane C is **CLOSED** and no request or date exists. Any
> future alternative-vendor work requires a new product decision.

Date: 2026-08-30 (ICT)  |  Candidate: `20260830-browser-0.3.13-relay-16`  |  Status: HISTORICAL / G2 FAIL; LANE C CLOSED

## Stage A decision

**Outcome: `no-chance` for the currently pinned licensed Stable `.2` engine.** The existing
external measurement on that exact native engine already shows a binary failure on the required
named surfaces (fonts, `OfflineAudioContext`, and WebGL) across profiles. The pin is frozen at the
  Stable `.2` record for this release; `G2-IDENTITY` remains `FAIL` and Lane C is **CLOSED** because
  there is no CloakBrowser channel. This is an early classification, not a claim that the formal fresh
  matrix has completed.

The formal P7-01/P7-03/P7-04 matrix is **OPEN**, not passed: the exact Stable `.2` archive is not
available locally and no new licensed-engine launch was performed on this host. Reusing the prior
measurement is sufficient to fail fast, but it cannot be upgraded into fresh 3-profile × 5-run
evidence.

## Approved threshold record (set before measurement)

The owner decision record fixes the following binary rule; no post-result threshold change was made:

| Dimension | Required result |
|---|---|
| Sample | Three disposable profiles × five runs; sequential and interleaved on one host with independent routes where available |
| Repeatability | Each profile reproduces its identical full-surface tuple in at least 4/5 runs; any within-profile drift is a fail |
| Separation | Zero identical full tuples between any profile pair; font list, `OfflineAudioContext` fingerprint, and WebGL parameter hash must each differ across all three profiles |
| Coherence | UA major, screen dimensions, timezone, and locale are mutually consistent and match the assigned proxy country |
| Decision | Any per-surface collision is a binary `FAIL`; there is no percentage/partial credit |

Source: `decisions.md` identity-threshold decision, fixed before this Stage A classification.

## Frozen engine tuple

| Field | Value | Qualification |
|---|---|---|
| Kind/channel | `cloakbrowser` / `licensed-channel` | Metadata record only until a fresh installed-binary inspection |
| Version | `151.0.7922.108.2` | Stable `.2` pin; Preview `.3` is not promoted |
| Expected archive | 537,518,332 bytes | Exact archive is absent from the workspace and local engine caches |
| Expected archive SHA-256 | `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561` | Retained signed/verified pin record |
| Loose runtime references | `chrome.exe` SHA `484AB0...455E5`; `chrome.dll` SHA `A8A51F...31C9D6` | Supporting installed-runtime evidence; not a substitute for the archive |
| Pin status | `FROZEN_FOR_THIS_RELEASE; IDENTITY FAIL` | Any engine change invalidates S3/P4 and requires a new candidate |

The preserved Preview `.3` archive is 538,330,876 bytes with SHA-256
`5e03b7abab14d44f2f55368a888378ddca9eefadb08c08b6c28610aec580ab3a`. It remains a separate
negative/experimental result and is not a replacement for Stable `.2`.

## Existing named-surface measurement (the fail-fast evidence)

Evidence: `local-test-artifacts/phase5/g2-identity-cross-profile-fingerprint-evidence-20260827.json`,
run `P0-G2-IDENTITY-20260827131800`. The run used the packaged native Stable `.2` engine on one
Windows host and two profiles sequentially. No proxy was configured, so it carries no network-
identity claim; it is used here only for cross-profile surface comparison.

| Required surface | Profile A | Profile B | Result |
|---|---|---|---|
| Font list | `08050B16` (72 entries) | `08050B16` (72 entries) | **Collision** |
| `OfflineAudioContext` | `0B09CAEB` | `0B09CAEB` | **Collision** |
| WebGL parameter/image surface | `BF16CA5C` | `BF16CA5C` | **Collision** |

The same run observed rotation in canvas, client rects, WebGPU report, visitor ID, hardware
concurrency, renderer label, timezone, locale, and language stack. Those rotating fields do not
offset a collision on any required surface. It also found a host-DPI screen-scaling defect; the
later local screen-scale fix is not identity evidence and does not repair the three joins.

The separate 27 August switch experiment found that `--fingerprint-noise` had no observed effect
on audio/WebGL and `--fingerprint-windows-font-metrics` changed fonts identically on both profiles
to implausible values. The switches were reverted. The 28 August Preview `.3` experiment showed
some seed-sensitive font/WebGL buckets but one invariant audio bucket and repeated collisions, so
it was explicitly not promoted.

## Host/process and seat safety check

Read-only process/port inspection was run before Stage A classification. The existing installed
`MKTBrowser.exe` shell owned loopback `127.0.0.1:47822`; no packaged CloakBrowser `chrome.exe`
process was launched for this probe. System Chrome processes were present but are not the licensed
engine and are excluded from the evidence. No CloakBrowser seat was consumed, and the installed
shell is not evidence that a vendor seat is free. The running user application was left untouched.

The exact archive absence, lack of a vendor test channel, and the one-seat boundary therefore remain
external blockers. No attempt was made to retry a license refusal or to measure CFT/system Chrome as
identity evidence.

## Gate disposition

| Gate | Status | Reason / next action |
|---|---|---|
| P7-01 installed licensed binary provenance | `OPEN` | Stable metadata and prior loose-runtime references exist; exact `.2` archive and fresh candidate inspection are absent |
| P7-02 no CFT substitution | `PASS (labeling only)` | CFT verifier is explicitly compatibility-only; no CFT result is used for identity |
| P7-03 profile repeatability | `OPEN` | No fresh 3×5 matrix on the frozen candidate |
| P7-04 cross-profile separation | `FAIL (early probe)` | Required fonts/audio/WebGL surfaces collided in the existing native `.2` evidence |
| P7-05 coherence | `OPEN` | Prior two-profile coherence was observed, but the approved proxy-linked matrix was not run |
| P7-06 proxy confounder | `OPEN` | No disposable proxy pairs supplied |
| P7-07 Preview candidate | `FAIL / NOT PROMOTED` | Preview `.3` retained as separate experimental evidence; audio collisions remain |
| P7-08 flag abuse | `OPEN` | Full packaged negative-flag matrix was not run in this unit |
| P7-09 engine-change invalidation | `PASS (policy)` | Ledger and manifest require a new candidate/re-run after any pin change |
| P7-10 decision review | `CLOSED (for this release)` | Owner decision records no CloakBrowser channel; no vendor answer/request exists |
| P7-11 engine-lab resource gate | `NOT STARTED` | Custom engine remains HOLD; no build started |
| P7-12 Stage A gates P6 | `PASS (ordering)` | This report freezes the pin before any P6 resource booking; Lane C resources remain unbooked |
| P7-13 vendor request | `CLOSED / NO_CHANNEL` | No CloakBrowser channel exists; no request or deadline is possible |

## Vendor track — closed, no channel

The former request draft is retained as historical text only. The owner confirmed there is **no
CloakBrowser channel**, so no request, sender, deadline, response wait, or vendor-resource booking
exists. Lane C is **CLOSED** for this product shape. The alternative-vendor shortlist is a future
product decision; S5 resources must not be spent under this release plan.

## Invalidation

Any change to the engine archive/version/SHA/channel, package source, installer bytes, host image,
flags, proxy assignment, or test order invalidates this classification's downstream evidence and
requires a new S3/P4 freeze. The frozen pin is a release boundary, not an identity PASS.
