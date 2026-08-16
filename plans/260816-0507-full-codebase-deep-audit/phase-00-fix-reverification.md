# Phase 00 — Fix Re-Verification

Depth: **D2** · Priority: P2 · Status: Completed · Effort: ~1 short session

Execution result: completed as remediate-then-verify. Detailed evidence is in
[`audit-260816-0803-fix-reverification.md`](../reports/audit-260816-0803-fix-reverification.md);
carried items are tracked in [`findings-register.md`](./findings-register.md).

## Context

- Findings source: [`audit-260816-0452`](../../reports/audit-260816-0452-mktworkspace-quality-and-security.md)

## Why first

Later phases build on the assumption that the 16 Aug findings are closed or knowingly accepted. If
F1 (CI gap) is still open when Phase 01 lands new tests, those tests do not run in CI either — the
new work inherits the old hole.

Cheap phase. Its outputs are not audit evidence; it only establishes a known starting state.

## Scope

Confirm each of F1–F15 is fixed, deliberately accepted, or still open. No new investigation.

## Checks

| Finding | Verification |
| --- | --- |
| F1 CI misses `test:mkb03` | `release.yml` runs `test:installer` or the two missing steps |
| F2 regex-based security contract | Electron assertions moved to structural; test still red on a removed option |
| F3 no behavioral tests on core modules | At minimum `HttpTransport` auth tests exist and go red on a wrong token |
| F4 `/encrypt-for-vault` Origin | Origin check present, matching sibling handlers |
| F5 route policy unenforced | Capability-enforcement test exists and fails when a handler drops its check |
| F6 `mktBrowserToken` plaintext | Either moved to secure store, or decision recorded in code comment + docs |
| F7 `local-test-artifacts/` 1.7 GB | Restore scripts run, directory reclaimed or moved to `evidence/` with retention date |
| F8 MKTBrowser no linter | ESLint configured, `yarn lint` runs it, clean |
| F9 oversized files | Deferred is fine — confirm it was a decision |
| F10 MKTTool CI branch filter | Active branch covered, or accepted |
| F11 `getHerdHealthCheckStatus` | Removed or wired |
| F12 dead exports (7) | Removed |
| F13 `nanoid` advisory | `npm audit` clean or accepted with reason |
| F14 mojibake dirs | Removed; source of the corrupt path identified or ruled out as external |
| F15 doc language rule | Rule scoped or policy recorded |

## Steps

1. Re-run every gate from the 16 Aug table. Any new red is a regression, not a finding of this phase.
2. Walk the table above. Record fixed / accepted / open.
3. For each "accepted", require a written reason in the code or docs — an undocumented acceptance is
   indistinguishable from an oversight six weeks later.
4. Re-run the unused-export scan (`scratchpad/find-unused-exports.mjs`); diff against the 16 Aug list.

## Todo

- [x] Re-run all MKTTool gates
- [x] Re-run all MKTBrowser gates
- [x] Walk F1-F15, classify each
- [x] Re-run unused-export scan, diff
- [x] Write `plans/reports/audit-260816-0803-fix-reverification.md`

## Success criteria

Every F1–F15 has one of: verified fix (with evidence), documented acceptance, or explicit open status
carried into the findings register.

## Risks

- **Fix regression.** A fix for F2 that keeps the string assertion alongside a structural one leaves
  the brittle test in place. Check the old assertion is gone, not just that a new one arrived.
- **F7 data loss.** `local-test-artifacts/` holds three archived relay homes with DPAPI secrets. Run
  the restore scripts before deleting; confirm nothing is still referenced as MKB-03 evidence.

## Next

Phase 01 begins only once the starting state is written down. It does not require every finding fixed
— it requires each one classified.
