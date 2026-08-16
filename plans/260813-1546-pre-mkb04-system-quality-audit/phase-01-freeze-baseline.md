---
phase: 1
title: "Freeze Baseline"
status: pending
priority: P1
effort: "0.5-1 day"
dependencies: [0]
---

# Phase 01: Freeze Baseline

## Overview

Create a reproducible, immutable audit identity for source, dependencies, configuration, and artifacts.

## Requirements

- Zero tracked or untracked source changes before and after every evidence gate.
- Record both repository branches, commits, remotes, lock hashes, tool versions, and changed-file history.
- Build artifacts from the committed baseline only.
- Define reproducibility as byte-for-byte where supported; otherwise document nondeterministic fields and
  require semantic content equivalence plus indexed hashes.
- No fix is allowed after freeze. Return to Phase 00 on any required change.

## Baseline Manifest

Record:

- MKTTool/MKTBrowser commit IDs, branches, upstream relationship, and commit timestamps.
- `git status --porcelain=v1 --untracked-files=all` output.
- Changed-file list from the last accepted baseline and untracked-file disposition.
- `package-lock.json` and `yarn.lock` SHA-256.
- Node, npm, Corepack, Yarn, Prisma, Electron, electron-builder, NSIS, and PowerShell versions.
- Synthetic configuration fingerprint with secret values excluded.
- Installer, unpacked executable, `app.asar`, Relay archive/sidecar, and engine metadata hashes.
- Build start/end timestamps and build machine description.

## Database Isolation

Use three separate PostgreSQL 17 databases:

| Purpose | Required name | Variable use |
| --- | --- | --- |
| Migration/build | `mkttool_audit_migrate` | `DATABASE_URL` for generate/migrate/build |
| Destructive tests | `mkttool_audit_test` | `TEST_DATABASE_URL`; must end `_test` |
| Production-shaped restore | `mkttool_audit_restore` | Explicitly injected only for restore/migration rehearsal |

Use synthetic keys only. Never point any audit command at the live Railway database.

## Reproducibility Check

1. Build twice from separate clean working directories using identical inputs.
2. Compare file hashes and unpacked artifact inventories.
3. If hashes differ, identify timestamp/signature/container metadata differences.
4. Accept only documented deterministic equivalence; unexplained differences remain an open gate.

## Success Criteria

- [ ] Both repositories clean, including untracked files.
- [ ] Complete baseline manifest written to `audit-scope-and-baseline.md`.
- [ ] All required artifacts built and hash-indexed.
- [ ] Reproducibility result recorded without unexplained drift.
- [ ] Pre/post-freeze source-state checks match.

## Risk Assessment

- Generated release directories can hide stale bytes. Build from clean isolated directories.
- Environment variables can alter Next.js and installer output. Hash a redacted configuration schema and
  list every build-affecting variable name.

## Unresolved Questions

None.
