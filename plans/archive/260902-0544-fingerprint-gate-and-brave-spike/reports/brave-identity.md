# Phase 04 - Brave identity and cohort verdict

- **Measured:** 2 September 2026
- **Status:** `COMPLETE`
- **Decision:** Brave fails criteria A, B, and C at the declared pool of five

## Executive decision

Brave does **not** satisfy the experimental fingerprint acceptance gate:

| Criterion | Verdict | Decisive evidence |
|---|---|---|
| A - consistency | `FAIL` | `65` restart mismatches and `20` cross-context mismatches; `0` coverage gaps |
| B - no stable-tuple collision | `FAIL` | Stable subset contained `62` components in run 1 and `63` in run 2; all `10/10` profile pairs collided in both runs |
| C - cohort plausibility | `FAIL` | Audio and canvas drifted across restarts; UA-CH and available screen height contained invariant values different from exact-revision stock CFT |

The decisive audio answer is: **Brave audio is not an invariant "this is Brave" vendor mark, but it
is also not a persistent profile identity.** Seven audio components matched stock CFT. The other five
rendered-audio hashes differed from stock. Four were distinct across all five profiles in both runs;
`analyserByteTimeHash` had five distinct values in run 1 and four in run 2, where `P1` and `P5`
collided. Every profile changed after restart on all five hashes. That is session drift, so audio
fails A and C even though it avoids Cloak's historical invariant-audio pattern.

This result does not open rollout, change an engine pin, retire `G2-IDENTITY`, or permit real
accounts.

## Artifact provenance

| Item | Verified value |
|---|---|
| Brave release | `v1.94.117`; Chromium `152.0.7977.64` |
| Brave archive | Official GitHub asset; SHA-256 `c3f29329933e007997290956f82203aad82224addd79ef26a22ed726bad08b4b` |
| Brave executable | `brave.exe` `152.1.94.117`; SHA-256 `a5b6dcfdcf6ad316ae0fa334012ac05ded56fd7989a63ae1ad4f3947b10365ab`; valid Brave Software signature |
| Exact-revision stock control | Chrome for Testing `152.0.7977.64`, revision `1669021` |
| CFT source | `https://storage.googleapis.com/chrome-for-testing-public/152.0.7977.64/win64/chrome-win64.zip` from Google's known-good catalog |
| CFT archive | SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004` |
| CFT executable | SHA-256 `79832d1e60cbad9323c07339f9608bc0ce93cb9242b9b5481c04a0c536720980` |
| Authoritative raw evidence | Temporary-only SHA-256 `0fc238b28df77105def8a33c5a22115f408ed7c7f52affe77a852975ca4c17e6` |
| Redacted analysis | Temporary-only SHA-256 `26545e25ab55d42c61d048cb30268540a8c8a34a4b1561aac12f435b1624628b` |

The exact-revision CFT control avoids treating normal Chromium 151-to-152 changes as Brave vendor
differences. An independent sensitivity run against installed Chrome `151.0.7922.174` produced the
same A result (`65` restart and `20` context mismatches), the same B result (`62`/`63` stable
components and `10/10` collisions), and the same overall C `FAIL`. The exact CFT run governs this
report.

## Procedure

- Used the Phase 02 probe source, CDP measurement module, analysis module, surface list, and coverage
  rules unchanged from MKTBrowser commit `76d74bf`.
- Measured five fresh Brave `--user-data-dir` roots, one active at a time, with two launches per
  root and one unchanged first-party probe origin for all ten readings.
- Cleared stale `DevToolsActivePort` before each restart, matching the product driver's existing
  pre-spawn ownership procedure.
- Closed every launch through CDP `Browser.close`: `10/10` completed, `0` signal escalations, and no
  owned Brave process survived.
- Covered every context/surface combination the harness declares mandatory. Unsupported combinations
  such as worker audio and offscreen WebGPU are outside the declared context matrix, not gaps.

The first incomplete helper attempt was discarded before analysis. Its restart read a stale
`DevToolsActivePort`, a condition the product driver already prevents. A fresh diagnostic reproduced
the fault, the helper was corrected to require a fresh endpoint, and a new five-profile dataset was
recorded from empty roots under one probe origin. No result below comes from the discarded attempt.

## Criterion A - consistency

**Verdict: `FAIL`.** Coverage was complete, but every profile showed the same instability pattern.

### Restart comparison

| Surface | Mismatches | Pattern |
|---|---:|---|
| Audio | `10` | Document and iframe changed for all five profiles |
| Canvas | `20` | Document, iframe, worker, and offscreen canvas changed for all five profiles |
| UA / client hints | `15` | Document, iframe, and worker changed for all five profiles |
| Aggregate | `20` | All four contexts changed for all five profiles |
| **Total** | **`65`** | Same profile + same origin + same engine revision did not repeat |

The drifting components were the aggregate hash; five rendered-audio hashes; canvas image hash;
and device memory, hardware concurrency, MIME-type hash, and plugin hash.

### Cross-context comparison

| Difference | Count |
|---|---:|
| Iframe client rects differed from document | `10` (`5 profiles x 2 runs`) |
| Worker UA/client-hint readings differed from document | `10` (`5 profiles x 2 runs`) |
| **Total** | **`20`** |

There were `0` coverage gaps. This is a measured inconsistency, not a missing-data verdict.

## Criterion B - stable-subset collision

**Verdict: `FAIL`.** The stable subset is computed from the data, not selected after seeing the
result.

| Run | Stable components | Stable-subset pair collisions | Full-tuple pair collisions |
|---|---:|---:|---:|
| 1 | `62` | `10/10` | `0/10` |
| 2 | `63` | `10/10` | `0/10` |

The weaker full-tuple check would pass because rotating audio, canvas, aggregate, and UA fields make
each profile look different. The governing stable-subset check fails because a large invariant join
still links every profile to every sibling.

### Published stable subset

The following `62` components were stable across all five profiles in both runs:

- **Audio (7):** `analyserByteFrequencyHash`, `channels`, `duration`, `latency.base`,
  `latency.output`, `length`, `sampleRate`.
- **Canvas (5):** all five text-metric readings; only `imageHash` rotated.
- **Client rects (2):** `bounding`, `clientRectsHash`.
- **Fonts (6):** `detectedCount`, `detectedHash`, `fontFaceSetHash`, `fontFaceSetStatus`,
  `localLoadHash`, `metricsHash`.
- **Screen/locale (14):** calendar, date sample, device-pixel ratio, language stack, number sample,
  numbering system, screen width/height/available width/available height/colour depth/pixel depth,
  and timezone.
- **UA/client hints (4):** `highEntropyHash`, `platform`, `userAgent`, `webdriver`.
- **WebGL 1 (9):** extensions, shader precision, image, limits, masked/unmasked vendor and renderer.
- **WebGL 2 (9):** extensions, shader precision, image, limits, masked/unmasked vendor and renderer.
- **WebGPU (6):** feature count/hash, adapter-info hash/presence, limit count/hash.

Run 2 added one more stable component: `uaClientHints.mimeTypesHash`.

## Criterion C - cohort plausibility

**Verdict: `FAIL`.** The table uses the exact Chromium `152.0.7977.64` CFT control on this physical
machine. Cloak Stable `.2` has no valid Phase 02 dataset, so its column stays `BLOCKED`; historical
Preview or two-profile readings are not substituted.

| Surface | Cloak Stable `.2` | Brave | Exact-revision stock CFT |
|---|---|---|---|
| Fonts | `BLOCKED` (`0/10`) | `PASS`: `6/6` components match stock | Reference cohort |
| Audio | `BLOCKED` (`0/10`) | `FAIL`: `7` match stock; `5` rendered hashes drift across restarts; no invariant Brave audio mark | Reference cohort |
| WebGL 1 | `BLOCKED` (`0/10`) | `PASS`: `9/9` match stock | Reference cohort |
| WebGL 2 | `BLOCKED` (`0/10`) | `PASS`: `9/9` match stock | Reference cohort |
| WebGPU | `BLOCKED` (`0/10`) | `PASS`: `6/6` match stock | Reference cohort |
| Canvas | `BLOCKED` (`0/10`) | `FAIL`: five text metrics match; image hash drifts across restarts | Reference cohort |
| Client rects | `BLOCKED` (`0/10`) | Document values match stock, but iframe differs from document under A | Reference cohort |
| UA / client hints | `BLOCKED` (`0/10`) | `FAIL`: three match, four drift, invariant high-entropy hash differs from stock | Reference cohort |
| Screen / locale | `BLOCKED` (`0/10`) | `FAIL`: `13` match; available-height value is invariant and differs from stock | Reference cohort |
| Aggregate | `BLOCKED` (`0/10`) | `FAIL`: aggregate hash drifts across restarts | Reference cohort |

### Audio decision

All five rendered-audio hashes differed from stock. Four were unique across all five profiles in
both runs; `analyserByteTimeHash` was unique across five profiles in run 1 and four profiles in run
2. Every profile received a different value after restart for all five hashes. Therefore:

- **Not a vendor mark:** no audio component was invariant across every Brave profile while differing
  from stock.
- **Not a valid cohort identity:** the rendered identity is session-randomized rather than stable for
  the profile.
- **Formal outcome:** audio fails A and C. Avoiding Cloak's historical invariant mark does not make
  the Brave result acceptable.

## Brave versus Cloak

The plan requested better/equal/worse on each criterion. A formal rank cannot be produced without
inventing a Cloak Stable `.2` result:

| Criterion | Cloak Stable `.2` | Brave | Honest comparison |
|---|---|---|---|
| A | `BLOCKED` | `FAIL` | Not comparable |
| B | `BLOCKED` | `FAIL` | Not comparable |
| C | `BLOCKED` | `FAIL` | Not comparable; Brave audio avoids the historical invariant-mark pattern but fails by restart drift |

Brave is therefore **not proven better, equal, or worse than Stable `.2` under the formal gate**. It
independently fails all three criteria, which is sufficient for the Phase 05 decision without
misstating the unavailable Cloak evidence.

## Measured versus inferred

### Measured

- Five Brave profiles, two runs each, one at a time, same origin and engine revision.
- Exact CFT same-machine control and complete declared context/surface coverage.
- `10/10` graceful closes, no signal escalation, and no surviving owned Brave process.
- A/B/C verdicts and every count reported above were independently recomputed from the temporary raw
  dataset and matched the redacted analysis byte-for-byte.

### Inferred

- The drift pattern is consistent with Brave session farbling rather than MKT's persistent profile
  contract. The measurement observes behaviour; it does not claim the exact upstream seed lifecycle.
- The invariant UA-CH and available-height differences are engine-level marks under this control.
  No claim is made that those two fields alone determine field detection.

## Boundary and cleanup

- No MKTBrowser source, engine pin, installer rule, profile database, or product data changed.
- No account, proxy, credential, cookie, token, observed IP, or external page content was used.
- After hash verification, independent analysis recomputation, syntax/tests, and a zero-owned-process
  check, the complete disposable Phase 04 root was removed from `%TEMP%` to Windows Recycle Bin.
  Only digests, aliases, counts, and equality classifications are retained in the repository.

## Unresolved questions

- Cloak Stable `.2` remains formally unrankable because Phase 02 obtained `0/10` valid readings.
- The exact Brave seed/session mechanism was not instrumented; the gate needs the observed stability
  result, not an upstream implementation claim.
