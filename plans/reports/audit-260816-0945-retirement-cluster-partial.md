# Phase 01 (cont.) — Retirement Cluster, H13 and H15 (PARTIAL)

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Prior: [`audit-260816-0928-crypto-primitive-layer.md`](./audit-260816-0928-crypto-primitive-layer.md)
Repo: MKTTool @ `feat/mkt-browser-clean-break`, 6 commits, **nothing pushed**.

**Status: Phase 01 INCOMPLETE. 10 of 20 hypotheses closed** (H01–H05, H13, H15, H18–H20).
**Depth achieved: D4** on H13 and H15. **No findings this block** — both closed clean.

## Gates

`tsc` PASS · `eslint` PASS 0 · `vitest` **1623 passed + 6 expected-fail / 179 files** (was 1600+6/177).
+23 tests. No regressions.

## Committed

| Commit | Contents |
| --- | --- |
| `d32f0fd` | `fix(tickets): reject non-canonical relay device public keys` — the C4 fix + its regression test |
| `edde2a2` | `test(tickets): cover signing seed and sealed box against adversarial input` |

Two commits, each self-consistent and green on its own.

## Hypothesis status

| H | Verdict | How |
| --- | --- | --- |
| H13 finalize idempotence / replay | **CLOSED-CLEAN** | 12 tests, red-then-green (5 red on sabotage) |
| H15 clock-skew symmetry | **CLOSED-CLEAN** + 1 corrected hypothesis | 10 tests, red-then-green (6 red on sabotage) |
| H14 authorization accepted by wrong device | **NOT CLOSED** — needs the fs-backed fixture harness |
| H16 receipt written before revocation durable | **NOT EXAMINED** |
| H17 secret-migration partial state fails open | **NOT EXAMINED** |
| H06–H12 | **NOT EXAMINED**; H09/H12 still PARTIAL from two sessions ago |

## H13 — retirement finalization: closed clean

`relay/src/device-retirement-receipt.ts:63` (`finalizeLocalDeviceRetirement`)

**Idempotence holds and is the designed behavior.** First call returns `true` and removes the
receipt; retries return `false` without throwing. That is the right shape — cleanup retry is the
*normal* case here (operator reruns because the reply was lost), so a throw would strand a machine
mid-retirement. Replay does not resurrect the receipt.

**Replay across retirements is blocked on all four bound fields.** `retirementId`, `deviceId`,
`recipientPublicKey`, `completionHash` are each compared against the stored receipt. Verified
differentially — one field changed at a time, everything else identical — so each rejection is
attributable to the field under test, not to some unrelated precondition.

**Stage gating holds.** A receipt still at `stage: "prepared"` cannot be finalized, so finalization
cannot retire a receipt while credentials still exist.

**Separation by key confirmed, and it is the good design in this protocol family.** Each retirement
mints its own one-use signing key (`device-retirement-finalization-key.ts:24`), so a finalization
signed by the **server** key is rejected, as is one signed by another retirement's key. This is the
property finding C1 records as *absent* from the other three protocols — asserted here so a future
refactor toward the shared server key is caught.

Red-then-green: disabling the field-binding condition and the stage gate turns exactly **5 tests
red**. Restored byte-exact.

## H15 — clock skew: closed clean, symmetric

`src/lib/relay/retirement/device-retirement-authorization.ts:50`

`DEVICE_RETIREMENT_CLOCK_SKEW_MS = 60_000` is applied **symmetrically and correctly on both bounds**.
The hypothesis was that it might be applied only to `exp`, leaving future-dated authorizations
acceptable arbitrarily far ahead of `iat`. It is not:

| Presented at | Outcome |
| --- | --- |
| inside lifetime | accepted |
| expiry + skew − 1 ms | accepted (deliberate grace) |
| expiry + skew + 1 ms | rejected |
| issue − skew + 1 ms | accepted |
| issue − skew − 1 ms | rejected |
| a year before issue | rejected |

Asserted as a differential: same magnitude either side of the window, outcomes must match. A
negative lifetime (`exp <= iat`) is also rejected.

Red-then-green: disabling the time assertion and the lifetime sanity check turns **6 tests red**.

### Corrected hypothesis — no verifier-side lifetime cap (observation, not a finding)

My test initially asserted that a ten-year authorization should be rejected. It is accepted, and on
inspection that is correct behavior, not a defect:

- `lifetimeMs` is not attacker-reachable. There is exactly **one** issue path,
  `relay-device-retirement-actions.ts:101`, and it passes a hardcoded
  `RETIREMENT_LIFETIME_MS = 30_000` — matching the ticket lifetime.
- A caller able to choose the lifetime is the server, which already holds the signing key and needs
  no long-lived token to cause harm.

Ranking this as a finding would have been inflation. Converted to a pinned observation, so that if a
second issue path with a caller-supplied lifetime ever appears, adding a verifier-side cap becomes a
deliberate decision rather than an omission. This is the second hypothesis of mine this phase that
was wrong on contact (the first was Ed25519/X25519 discrimination in H19).

## Tests added

| File | Tests | Red-then-green |
| --- | --- | --- |
| `relay/src/device-retirement-finalization-replay.test.ts` | 12 (new) | **Yes** — 5 red on disabled field binding + stage gate |
| `src/lib/relay/retirement/device-retirement-authorization-window.test.ts` | 10 (new) | **Yes** — 6 red on disabled time window |

Real `InMemorySecureStore` and real temp directories; no mocks, no fakes. All sabotage replaced whole
conditions; all restored via `git checkout`; `git diff --stat` empty; sweep clean.

## Not examined in this block

- **H14** — retirement authorization accepted by the wrong device. Started, not finished. Closing it
  means driving `retireLocalRelayDevice`, which needs a valid sealed completion proof (the
  authorization carries `completionEphemeralPublicKey` / `completionSealed`, so the fixture must seal
  a real payload to the device key). That is a fixture harness, not a test change — deferred rather
  than faked. **This is the highest-value item still open in the retirement set**: it is the
  cross-device destruction case.
- **H16** — receipt-before-revocation durability. `DeviceRetirementFaultPoint`
  (`"after-receipt" | "after-secrets" | "after-files"`) already exists as a crash-injection seam, so
  this is tractable once the H14 harness exists; it is the same fixture.
- **H17** — `secret-migration.ts`. `MigrationFaultPoint` likewise exists. Existing
  `secret-migration.test.ts` was **not read**, so I cannot say whether it already encodes the
  adversary.
- **H06–H12.** Unchanged. H09 and H12 remain PARTIAL on read-level evidence from two sessions ago.
- No concurrency testing anywhere in this phase.

## Phase 01 running tally

| Closed clean | Findings | Open |
| --- | --- | --- |
| H01, H03, H04, H05, H13, H15, H19 (small-order), H20 (reuse/integrity) | **C1** P3, **C2** P3, **C3** P3, **C4** P2 *(fixed)*, **C5** P3 | H06–H12, H14, H16, H17 |

H02 not applicable (subsumed by C1). Four findings, one fixed, none above P2. The primitive and
retirement layers are in better shape than the hypothesis list assumed — worth stating plainly, since
"no finding" is only meaningful when the tests were capable of producing one, and each was shown red.

## Unresolved questions

1. **Continue to H14/H16/H17?** They share one fixture harness (sealed completion proof + fault
   injection). Building it once closes three hypotheses; it is the main remaining cost in the
   retirement set. Estimate: most of a session.
2. **Then H06–H12** (ticket lifecycle + grant generations, including properly closing H09/H12) —
   roughly a further session. That would complete Phase 01.
3. Should the two new test files be committed now, or held until the block is complete? Currently
   uncommitted.
4. Carried, unchanged: **C1** domain-separation appetite, **C2/C3** deferred to Phase 04 per the last
   report, **F6**, **F10**, **F15**, `local-test-artifacts/` retention, and the
   `handle-configure.ts:94` trust-root-replacement observation assigned to Phase 02.
