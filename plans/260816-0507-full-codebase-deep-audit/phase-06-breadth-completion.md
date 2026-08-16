# Phase 06 — Breadth Completion

Depth: **D2**, D3 on redaction only · Priority: P3 · Status: Not started · Effort: 1 session

## Context

- Closes items 9–13 of the [16 Aug limitations table](../../reports/audit-260816-0452-mktworkspace-quality-and-security.md#coverage-and-limitations).

## Why D2

None of these carry the blast radius of Phases 01–04. The goal is to retire the coverage gap so the
final statement reads "examined" rather than "not examined" — and to catch anything obvious. Redaction
gets D3 because a leak there is a credential exposure and it spans every module, so it needs tracing
rather than reading.

## Scope and hypotheses

### 6.1 Frontend (D2)

MKTTool `src/app/**` + `src/components/**`; MKTBrowser `apps/desktop/src/renderer/**`
(largest: `ProfileTile.tsx` 542, `App.tsx` 474, `McpPanel.tsx` 445, `ProfileRow.tsx` 434).

- H91 `dangerouslySetInnerHTML` or equivalent on user/remote content.
- H92 A secret reaches the browser as props or client state — the architecture says secrets never
  enter the hosted page; verify no server component passes one down.
- H93 A client component calls a server action with attacker-controllable arguments the action assumes
  are UI-constrained (dropdown values, ids).
- H94 MKTBrowser renderer trusts main-process data unsanitised (profile names, proxy labels, extension
  names) into a DOM sink.

### 6.2 Global redaction (D3)

- H95 Proxy password, token, or credential reaches a thrown error, a provider error body, or a Next.js
  error boundary. `redactTokens` exists in `facebook-graph-client.ts`; find every path that *should*
  use it and does not.
- H96 A secret is written to disk in a log, crash dump, or Electron `ActivityLog`.
  (`activity-log-redaction.test.ts` exists for the MCP side — confirm the relay/web side has an equivalent.)
- H97 An error message echoes a decrypted value, ciphertext, or key material back to the UI.

Method: enumerate every secret-typed value from the schema and registry, then trace each one outward
to every sink (throw, log, response body, file write). Table of value × sink.

### 6.3 Dependency and supply-chain hygiene (D2)

- H98 `yarn npm audit` on MKTBrowser (never run) surfaces advisories in Electron-adjacent packages.
- H99 A dependency is unpinned where reproducibility matters (Electron is exact-pinned; check
  `electron-builder`, `@electron/rebuild`, native modules).
- H100 `postinstall` scripts in the dependency tree execute at install time on build machines.

### 6.4 Concurrency (D2)

- H101 `health-check-lock` expiry allows two holders at a boundary (tests exist; read the expiry path).
- H102 `daily-backup-scheduler` and `daily-health-check-scheduler` can double-fire across restarts.
- H103 `cleanStaleSingletonLocks` deletes a live lock, killing a running browser.

### 6.5 Documentation accuracy (D2)

Cross-check `docs/` against implementation: `system-architecture.md`, `codebase-summary.md`,
`development-roadmap.md`, `project-changelog.md`, `code-standards.md`, `domain-glossary.md`.

- H104 Docs claim a verification or gate that never ran.
- H105 Roadmap phase status disagrees with code reality.
- H106 `codebase-summary.md` references modules that moved or no longer exist.

Scope decided 17 August 2026: documentation accuracy is audit work only where a doc asserts a
security or lifecycle property the code does not have. Prose quality, comment translation, and
`docs/archive/` are out of scope for this phase and are not deferred to another pass either.

- H107 The user-facing surface mixes languages inside one rendered view (`relay-status-page.ts`
  renders "Cấu hình đang dùng" beside "Setup is incomplete"). Bounded strings-only pass over
  user-facing labels and error messages; legacy source comments stay as they are. This is the whole
  of what survives from F15 — the policy half closed at `AGENTS.md:25`.
- ~~H108 The status page's `config-override` branch of `describeMktBrowserToken` has no test.~~
  Closed 17 August 2026 ahead of this phase: both branches asserted, sabotage-proven.

## Method

1. Read frontend for sinks; grep-assisted but read the hits.
2. Build the secret × sink table for 6.2 — the one artifact worth keeping from this phase.
3. Run `yarn npm audit`; review `postinstall` scripts.
4. Read the three concurrency paths.
5. Diff docs against code; list every inaccuracy with a pointer.

## Todo

- [ ] Frontend sink review (both apps)
- [ ] Secret × sink table
- [ ] `yarn npm audit` MKTBrowser + pinning review
- [ ] Concurrency read (3 paths)
- [ ] Docs accuracy diff (safety-case claims only)
- [ ] H107 user-facing string language pass; H108 `config-override` status-page assertion
- [ ] `plans/reports/audit-{date}-breadth-completion.md`

## Success criteria

- Zero unreviewed areas remain from the 16 Aug limitations table.
- Secret × sink table complete; every unredacted path is a finding.
- Updated coverage statement replaces "not examined" with a real result for items 9–13.

## Risks

- **Lowest-yield phase; easiest to skip.** That is fine as a scheduling choice — but if skipped, the
  coverage statement must keep saying "not examined". Do not let a skipped phase quietly become an
  implied clean bill.
- **Docs drift is unbounded.** Time-box 6.5; list inaccuracies, do not fix them here (that is
  `docs-manager` work).

## Next

Merge all phase findings into `findings-register.md`. Hand to pre-MKB-04 Phase 02 as its static-audit
input, with the coverage statement attached.
