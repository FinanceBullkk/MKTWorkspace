# Phase 02 - Cloak Stable `.2` baseline remeasurement

**Date:** 2 September 2026
**Status:** `BLOCKED` - no valid Cloak profile dataset was obtained
**Decision:** do not start Phase 03 from this result

## Scope

The extended harness was prepared for the declared pool of five disposable profiles, one active at a
time, with two runs per profile. It measures fonts, audio, WebGL 1/2, WebGPU, canvas, client rects,
UA/client hints/plugins, screen/locale, and aggregate values in document, iframe, worker, and
offscreen-canvas contexts. Stable-subset analysis and cohort classification operate on individual
reading components, so a rotating field cannot hide an invariant vendor mark in the same surface.

The recording table was created before the first seat attempt:

| Profile | Run 1 | Browser.close | Run 2 | Browser.close |
|---|---|---|---|---|
| P1 | blocked before launch | not applicable | not run | not applicable |
| P2 | not run | not applicable | not run | not applicable |
| P3 | not run | not applicable | not run | not applicable |
| P4 | not run | not applicable | not run | not applicable |
| P5 | not run | not applicable | not run | not applicable |

## Prepared and measured evidence

| Item | Evidence |
|---|---|
| Cloak pin | Stable `.2`, version `151.0.7922.108.2` |
| Cloak archive | SHA-256 `7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561` |
| Copied runtime | SHA-256 `484ab0e66600a3b0a8c4848ccaef38ce65b69e87687a68a3b2b68d5db1f0455e` |
| Packaged MKT Browser | version `0.3.13`, SHA-256 `ec868fd36501d5d127757e0bf593281ca2271665d0e1598d0f25b73b5dc2ec55` |
| Same-machine stock control | Chrome `151.0.7922.174`, SHA-256 `b6d40f55e48e61760335d18f46abcec929e1a11b8330e7f2b501037584af4aa4` |
| Local preflight before the final attempt | `1 free / 0 active / 0 pendingRecovery / 0 cooling`, and `0` Cloak processes |
| Valid Cloak readings | `0/10` profile runs |

The stock control was run by the harness in each final attempt and stored only in disposable
temporary evidence. Because no paired Cloak profile run succeeded, the stock readings cannot be used
to close criterion C. No fingerprint values, license key, token, proxy, IP, cookie, page content, or
profile identifier are retained in this report.

## Separate verdicts

| Criterion | Verdict | Evidence and boundary |
|---|---|---|
| A - consistency | `BLOCKED` | The required five profiles and two runs were never measured. There is no restart or cross-context comparison. |
| B - stable-subset collision | `BLOCKED` | The stable subset is computed from profile readings; with `0/10` readings it is not computable. No collision claim is made. |
| C - cohort plausibility | `BLOCKED` | A same-machine stock control exists, but there is no valid Cloak value to compare against it. No vendor-mark or cohort claim is made. |

There is no combined score and no alias matrix for this run. A missing dataset is not a pass.

## Attempt history and discarded pre-data

The following attempts were intentionally excluded from the result because they produced no valid
profile reading:

1. Bootstrap stopped before profile creation when the pinned artifact endpoint returned HTTP 403.
2. A P1 launch was closed after discovering that the required page-navigation capability was not
   exposed by the profile-management-only MCP surface.
3. A P1 launch reached the engine and was refused with exit 76 (`terminal-refused`) at
   `2026-09-02 07:43:28` local time.
4. After the conservative 17-minute cooldown, a fresh run was refused at P1 at
   `2026-09-02 08:01:25` local time.
5. After another cooldown and a fresh local preflight showing a free seat and no Cloak process, a
   fresh run was refused at P1 at `2026-09-02 08:25:30` local time.
6. A single documented API diagnostic then received `session/start` HTTP 200 and `session/end`
   HTTP 200 without opening a profile. After the release propagation window, the packaged engine
   was tried once more and was refused at P1 at approximately `2026-09-02 08:43` local time.

The last three packaged attempts created only disposable recording/profile setup state, then
received the vendor response `your plan's session limit is reached`; none opened a measurable Cloak
profile. Their raw files, temporary data roots, and temporary app processes were removed after
verifying that no Cloak process remained. The installed MKT Browser app and its user data were not
removed or modified.

## Measured versus inferred

### Measured

- The pinned Stable `.2` metadata and runtime bytes matched the expected hashes.
- The extended harness passed its targeted regression tests, lint, typecheck, and the full Node 22
  installer suite (exit `0`; one pre-existing live machine integration test remained explicitly
  skipped).
- Local capacity was free immediately before the final attempt, while the vendor refused the first
  profile launch three times after cooldown. A separate API-only start/end diagnostic returned HTTP
  200 for both operations but did not make the packaged engine launch succeed.
- No local Cloak process was present after each refusal.

### Inferred

- The refusal indicates either a seat held outside the local process table, a vendor-side
  session-state mismatch, or a difference between the API diagnostic identity and the packaged
  engine launch identity. The evidence does not identify which external session, machine, or server
  record holds it.
- The blocker cannot be cleared locally because the available `session/end` path requires the lease
  and instance identifiers belonging to the holder; those identifiers are not available from the
  refused launch.

## Unblock and next action

An owner/vendor action is required to clear or reassign the server-side session for the licensed key,
or to provide a confirmed free seat. After that action, rerun this exact harness once at pool five;
do not lower the pool, change the engine pin, or substitute Preview `.3`. Until a valid five-profile
dataset exists, Phase 02 remains `BLOCKED`, `G2-IDENTITY` remains unchanged, and Phase 03 must not
start automatically.

## Unresolved questions

- Which external Cloak session or vendor record is consuming the single licensed seat?
