# Consolidation Review — 20 Commits, Phases 00–02

Date: 2026-08-16
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Scope: everything committed since the audit baseline, across both repos. **Nothing pushed.**

**Verdict: safe to continue. Both trees clean, all gates green, no residue, no secrets.**
One finding upgraded from diagnosis to demonstrated (C10). One item needs a decision before merge (C12
disclosure).

## Gate results at HEAD

| Repo | Gate | Result |
| --- | --- | --- |
| MKTTool | `tsc --noEmit` | **0** |
| MKTTool | `eslint .` | **0** |
| MKTTool | `vitest run` | **1690 passed + 6 expected-fail / 186 files** |
| MKTBrowser | `yarn typecheck` (6 projects) | **0** |
| MKTBrowser | `yarn lint` | **0 errors**, 3 known warnings |
| MKTBrowser | `yarn test:installer` | **exit 0, zero failures** |

Both working trees clean. Baseline at Phase 00 exit was 1526 tests / 173 files → **+170 tests, +13
files**, and the file arithmetic reconciles exactly against the 13 test files added.

## Production code actually changed — three edits, all deliberate

Across 20 commits, my phases changed **three** things in shipping code. Everything else is tests.

| Finding | File | Change |
| --- | --- | --- |
| **C4** (P2) | `MKTTool src/lib/tickets/relay-device-key.ts` | reject non-canonical X25519 encoding (+20) |
| **C11** (P2) | `MKTBrowser apps/desktop/src/main/socks5Bridge.ts` | parameter property → field, so the module is loadable by its own test runner |
| **C12** (P2) | same file | `isForwardableHost` allowlist before both upstream paths |

Each diff was re-read line by line during this review. No unintended edits.

The remaining production diffs in the range belong to **Phase 00** and were reviewed then: the
`/encrypt-for-vault` Origin check, dead-export deletions, the nanoid bump, ESLint introduction, the
renderer sandboxing module, and two stale `eslint-disable` removals.

## Residue checks — all clean

- **`server.ts` sabotage residue: none.** This mattered most: I sabotaged the MCP dispatch check and
  restored it with `git checkout`. Diff versus baseline is exactly the Phase 00 eslint comment, and
  the guard is present at `server.ts:477`.
- **`grep "if (false"` across both repos: clean.**
- **No `.skip(`, `.only(`, or `todo` in any new test.**
- **No AI references** in any commit message (checked both repos).
- **No `.env`, `.dpapi`, `.pem`, `.key`, or credential files** in any commit.
- **No secret-shaped strings** added by any diff.

## `it.fails` inventory — 6, each mapped to a declared open finding

| Count | Finding | Meaning |
| --- | --- | --- |
| 4 | **C2** (P3) placeholder signing seeds | green while the gap is open; **red the moment a guard lands** |
| 2 | **C3** (P3) low-order Ed25519 keys | same |

C4's `it.fails` was converted to a plain assertion when the fix landed, exactly as designed. No
`it.fails` exists without a corresponding open finding in a report.

## CI wiring verified

Every new test file is reachable from the aggregate suites, not merely present on disk:

| File | Wired into |
| --- | --- |
| `mcp-tool-authorization.test.ts` | `mcp-server test:managed` |
| `http-transport-auth.test.ts` | `mcp-server test:managed` |
| `socks5-bridge-containment.test.ts` | `desktop test:mkb01` |
| `socks5-bridge-http-upstream.test.ts` | `desktop test:mkb01` |
| 12 MKTTool files | picked up by `vitest.config.mts` include globs — confirmed by an explicit 12-file run: **12 files, 135 passed + 6 expected-fail** |

## C10 upgraded: diagnosis → demonstrated

Last session `yarn test:installer` had one failure —
`windows-installer-ownership-fixtures.test.cjs`, *"A different MKT Browser installation is running"* —
which I attributed to live machine state rather than code.

This run it **passes**, exit 0. MKT Browser is no longer running on the machine (it stopped on its
own; I did not stop it, and stopping it was never within audit authority).

**Same commit, same code, different machine state, different result.** That is direct proof of C10:
the installer suite is not hermetic. CI green does not imply developer green, and the check cannot
distinguish its own fixture from a real installation. Still assigned to Phase 03, now with
empirical evidence rather than a hypothesis.

## Findings register at this point

| ID | Sev | Status |
| --- | --- | --- |
| C1 domain separation across 4 protocols | P3 | open — wire-format break, decision pending |
| C2 no entropy policy on signing seed | P3 | open — deferred, `it.fails` gate in place |
| C3 low-order Ed25519 keys accepted | P3 | open — deferred to Phase 04 to fix both implementations at once |
| C4 X25519 encoding aliasing defeats revocation | **P2** | **fixed** |
| C5 sealed box has no envelope binding | P3 | open — folds into C1's remediation |
| C6 migration read-back guards untested | P3 | **fixed** |
| C7 grant substitution guard untested | P3 | **fixed** |
| C8 bootstrap take-and-clear ordering untested | P3 | **fixed** |
| C9 MCP dispatch deny check untested | P3 | **fixed** |
| C10 installer suite not hermetic | P3 | open — Phase 03, now demonstrated |
| C11 bridge untestable by its own runner | **P2** | **fixed** |
| C12 CRLF injection into upstream proxy | **P2** | **fixed** |

**Three P2 defects found and fixed. Nothing above P2. Six coverage gaps closed.**

## One thing to decide before this merges

**C12 disclosure.** The CRLF injection is fixed on an unpushed branch. If any already-released build
contains the bridge, a silent fix is the wrong shape — it belongs in `docs/project-changelog.md` with
its severity, per `AGENTS.md`'s documentation rule. I have not written that entry, because whether a
shipped build is affected is your knowledge, not mine.

The same question applies more weakly to C4: a revocation that did not fully revoke is worth a
changelog line even though exploitation needed enrollment access.

## What this review did not do

- **Did not verify each commit builds independently.** Only HEAD is proven green. If the branch is
  rebased or commits are cherry-picked, that assumption breaks.
- **Did not review Phase 00's production diffs afresh** — they were reviewed in their own phase and
  are unchanged since.
- **Did not run the MKTBrowser packaging or release workflows**, only the test aggregates.
- **Did not push anything.**

## Resolved after this review (16 Aug, 11:45)

- **C12/C4 disclosure — answered from the repository, not deferred.** The SOCKS5 bridge landed
  13 May 2026 and **16 tags contain it, `v0.2.0` through `v0.3.1`**, so the unfixed bridge has
  shipped. The changelog records both fixes with that build range stated, and the roadmap carries the
  operationally actionable line: machines on an older build stay affected until they update. The
  audience is the internal fleet, not the public — the project publishes no versions of MKTTool.
- **Audit evidence is now version-controlled.** Moving it into either repository would have broken
  its cross-references — `MKTTool/plans/` has no copy of the `pre-mkb04` plan the severity model
  inherits from — and would have deepened a split that already exists. The workspace root became a
  git repository instead, with a **deny-by-default** ignore rule: 34 files tracked, all markdown,
  zero secrets, with `MKTTool/`, `MKTBrowser/`, `local-test-artifacts/` and
  `relay-identity-backup-*/` each verified ignored. Local only; no remote.
- **MKTBrowser changelog — deliberately not created.** It is tagged and released but has no
  changelog, and starting one at `v0.3.1` would imply coverage of sixteen undocumented releases. Its
  README now points at the product-wide changelog and notes that build ranges name *its* tags.
- **A broken link I introduced, caught and fixed.** The roadmap reference resolved to
  `MKTTool/plans/reports/` — a real directory holding unrelated material — rather than the audit's.

## Unresolved questions
1. **Push now, or hold to the end of the audit?** Twenty commits is a large unpushed surface, and the
   two P2 fixes are the kind of thing worth having in the remote's history sooner. My recommendation
   is to push once you have decided the changelog question, so the disclosure and the fix land
   together.
3. **Resume Phase 02** at H35 (sabotage pass on the existing WebRTC firewall tests), then H36/H37 on
   `proxyGeo`. H24/H25 remain the larger read.
4. Carried unchanged: **C1** remediation appetite, **F6**, **F10**, **F15**,
   `local-test-artifacts/` retention.
