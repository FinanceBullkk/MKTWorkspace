# Phase 05 - Fingerprint engine Go/No-Go decision

- **Prepared:** 2 September 2026
- **Status:** `SIGNED - OWNER APPROVED`
- **Final decision:** `NO-GO` for Brave integration and for any identity-isolation claim

## Decision

No currently reachable engine path satisfies the experimental fingerprint gate. CloakBrowser
Stable `.2` could not produce a valid dataset, and official Brave failed criteria A, B, and C at the
declared pool of five. Do not integrate Brave, do not retire `G2-IDENTITY`, and do not authorize real
accounts.

MKTBrowser remains useful and accurately scoped as a profile, proxy, lifecycle, and ownership
manager. It is not an identity-isolation tool. A future engine attempt requires a new owner-approved
product plan and new evidence; it is not follow-on work inside this spike.

## Five decisive answers

1. **Cloak Stable `.2`:** `BLOCKED` on A, B, and C at pool five; Phase 02 obtained `0/10` valid readings, so no PASS/FAIL verdict or comparison rank is fabricated.
2. **Brave lifecycle:** MKT can drive Brave, but product selection needs roughly `3-5 engineering days` of TypeScript/renderer/installer work; Phase 03 closed `4 PASS / 2 FAIL` and the existing proxied product boundary remains fail-closed.
3. **Brave identity:** A=`FAIL`, B=`FAIL`, C=`FAIL`; audio is not an invariant Brave vendor mark, but its five rendered hashes change after restart, so it is session-drifting rather than a persistent cohort identity.
4. **`G2-IDENTITY`:** no, there is not enough evidence to retire it; the current pinned engine lacks a valid A/B/C dataset, Brave fails A/B/C, and the signed owner decision explicitly retains the gate. `G2-IDENTITY=FAIL` stands.
5. **Next action and owner:** the workspace owner approved this NO-GO; MKTBrowser maintainers do no Brave integration work, release owners keep Browser real-account use closed, and any future engine path requires a separate owner-approved plan.

## Consolidated evidence

| Phase | Result | What it proves |
|---|---|---|
| 01 - gate specification | `COMPLETE` | Defines independent A consistency, B stable-subset collision, and C same-machine cohort criteria at pool five; preserves `G2-IDENTITY` |
| 02 - Cloak Stable `.2` | `CLOSED-BLOCKED` | Harness coverage closed, but the licensed engine produced `0/10` valid readings after bounded attempts; A/B/C remain `BLOCKED` |
| 03 - Brave lifecycle | `COMPLETE`, `4 PASS / 2 FAIL` | Current components can drive Brave; missing firewall/verifier coverage and Web Store companion execution are ordinary `3-5 day` application/installer gaps |
| 04 - Brave identity | `COMPLETE`, A/B/C `FAIL` | Five profiles x two runs with exact-revision CFT show restart/context drift, all-pair stable-subset collision, and cohort failures |

## Engine verdict table

| Question | Cloak Stable `.2` | Brave `v1.94.117` | Decision effect |
|---|---|---|---|
| A - same profile repeats across restart and context | `BLOCKED` | `FAIL`: `65` restart + `20` context mismatches | No consistent identity evidence |
| B - no pair shares the stable tuple | `BLOCKED` | `FAIL`: `62`/`63` stable components; `10/10` pair collisions in both runs | Full-tuple rotation does not hide the stable join |
| C - components fit stock cohort | `BLOCKED` | `FAIL`: audio/canvas drift; invariant UA-CH and available-height differences | No cohort-plausible engine result |
| Product can launch safely | Current product path exists, but availability blocked measurement | `4/6` lifecycle checks pass; unsupported proxied selection refuses launch | Compatibility is not identity acceptance |
| Integration decision | No available corrective channel | `NO-GO` | Do not open an engine-migration plan |

## Why the decision is outcome 3

The plan allowed three outcomes. This is the third:

- Cloak is not proven acceptable and is operationally unavailable for the required measurement.
- Brave is measurable and controllable, but independently fails every identity criterion.
- Native Chromium work remains closed by the no-C++ and no-build-host constraints; paid vendor work
  remains closed by the no-budget constraint.

Therefore the product description, release boundary, and operator instructions must not imply
identity isolation. Existing profile ownership, static-proxy assignment, fail-closed launch checks,
and lifecycle recovery remain valuable controls; none is proof that two browser identities are
unlinkable or cohort-plausible.

## Measured

- Cloak Phase 02 produced `0/10` valid profile readings and no A/B/C dataset.
- Brave Phase 03 completed six lifecycle checks with `4 PASS / 2 FAIL`; source review confirmed the
  unsupported proxied product path refuses launch before browser spawn.
- Brave Phase 04 completed `5 profiles x 2 runs`, `10/10` graceful closes, exact Chromium
  `152.0.7977.64` same-machine CFT control, and complete declared coverage.
- The authoritative Brave analysis independently recomputed to A=`FAIL`, B=`FAIL`, C=`FAIL`.

## Inferred

- Brave's profile/session seed lifecycle does not satisfy MKT's persistent profile contract. The
  measurement establishes drift; it does not claim the exact upstream implementation mechanism.
- Investing `3-5 days` in lifecycle integration cannot correct the measured identity failures; those
  gaps are separate from A/B/C.
- With no passing engine, real-account use would ask operators to accept an identity risk the product
  cannot quantify or contain. Keeping that path closed is the smallest safe product decision.

## Documentation impact

The decision is reflected in:

- `MKTBrowser/README.md`
- `MKTBrowser/docs/fingerprint-acceptance-gate.md`
- `MKTTool/docs/development-roadmap.md`
- `MKTTool/docs/internal-beta-release.md`
- `MKTTool/docs/project-changelog.md`

These updates preserve Lane A separation, keep `G2-IDENTITY=FAIL`, and make the no-identity-
isolation product description explicit. No source, engine pin, installer, deployment, release, or
rollout state changes.

## Owner sign-off

Signed decision: **NO-GO for Brave integration; retain `G2-IDENTITY=FAIL`; keep MKTBrowser scoped as
a profile/proxy/ownership manager without an identity-isolation claim.**

- Owner name: `anhha` (workspace owner)
- Decision: `[x] APPROVE`  `[ ] REJECT / REVISE`
- Date: 2 September 2026
- Confirmation: `APPROVE` received in this Codex task at
  `2026-09-02 16:56 Asia/Saigon`

## Unresolved questions

- None.
