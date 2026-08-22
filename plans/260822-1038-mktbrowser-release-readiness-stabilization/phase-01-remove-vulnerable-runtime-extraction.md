---
phase: 1
title: "Remove Vulnerable Runtime Extraction"
status: completed
priority: P1
effort: "2-4 working days"
dependencies: []
---

# Phase 1: Remove Vulnerable Runtime Extraction

## Overview

Remove `extract-zip@2.0.1` from every packaged runtime path and replace it with an owned, fail-closed
archive extraction boundary. Extension and browser-engine archives must not write outside staging,
create links outside staging, exceed declared limits, or publish partially extracted state.

Current evidence: `extract-zip` is a direct desktop dependency, is repeated in packaged
`extraMetadata`, and is called by `ChromiumBootstrap.ts` and `extensions/crxPipeline.ts`. Yarn audit
reports high-severity symlink traversal advisory `GHSA-jmr9-qjv8-65gv` for all published versions up
to and including `2.0.1`.

## Context Links

- [Master plan](./plan.md)
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBootstrap.ts`
- `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\extensions\crxPipeline.ts`

## Requirements

- Functional: extract approved engine ZIPs and verified CRX/ZIP extensions into atomic staging.
- Security: reject absolute paths, drive-qualified paths, `..` traversal, NULs, symlinks, junctions,
  reparse points, duplicate-conflicting entries, excessive file counts, and zip bombs.
- Integrity: verify source signature/checksum before extraction and verify the final tree before rename.
- Operational: no vulnerable extraction package remains in `yarn.lock` or packaged `app.asar` metadata.
- Audit: CI evaluates production dependencies separately from dev-only findings and blocks every
  unapproved high/critical production advisory.

## Architecture

Create one `safe-archive-extraction.ts` boundary with explicit policies:

```text
trusted download or verified CRX
  -> enumerate archive metadata without writing
  -> normalize and validate every entry
  -> extract into owned random staging directory
  -> lstat walk: no links/reparse points, all paths contained, size/count caps hold
  -> validate engine binary or extension manifest
  -> atomic rename into final owned directory
```

Engine and extension callers may use different size/file-count limits, but must share path and link
validation. For extensions, reject all links. If an engine archive truly requires links, support only
relative links whose resolved target remains inside staging and add an exact fixture proving it.

## File Inventory

| Action | File | Rough size | Test impact |
|---|---|---:|---|
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\safe-archive-extraction.ts` | 150-250 lines | Central security boundary |
| Create | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\safe-archive-extraction.test.ts` | 200-300 lines | Malicious archive matrix |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\ChromiumBootstrap.ts` | 973 lines | Route engine ZIP fallback through boundary |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\extensions\crxPipeline.ts` | Existing | Route CRX/ZIP unpack through boundary |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\src\main\extensions\crx-pipeline.test.ts` | Existing | Add traversal and atomicity assertions |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\package.json` | Existing | Replace dependency; add audit script |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\electron.vite.config.ts` | Existing | Update external dependency list |
| Modify | `E:\MKTWorkspace\MKTBrowser\apps\desktop\electron-builder.yml` | Existing | Remove vulnerable packaged metadata |
| Modify | `E:\MKTWorkspace\MKTBrowser\yarn.lock` | Generated | Lock approved replacement versions |
| Modify | `E:\MKTWorkspace\MKTBrowser\.github\workflows\release.yml` | Existing | Run production audit gate |

## Function And Interface Checklist

- [x] `extractArchiveSafely(input)` accepts absolute source/staging paths and a strict policy object.
- [x] Entry normalization returns a relative path or a typed rejection; it never repairs unsafe input.
- [x] Extraction limits cover compressed size, uncompressed size, entry count, and per-file size.
- [x] Final containment uses filesystem inspection, not string-prefix checks alone.
- [x] Callers publish only through atomic rename after domain validation.
- [x] Audit command is deterministic and documents any advisory exception with owner and expiry.

## Implementation Steps

1. Capture the production dependency audit as NDJSON and classify runtime reachability. Treat
   `extract-zip` as release-blocking; separately record unrelated dev-only findings.
2. Select a maintained ZIP parser with no current high/critical advisory. Prefer direct low-level
   entry iteration over another convenience extraction wrapper. Pin the exact version.
3. Write malicious fixtures first: `../`, absolute Windows paths, mixed separators, link escape,
   duplicate entry collision, oversized metadata, truncated archive, and interrupted extraction.
4. Implement the shared extraction boundary and filesystem post-check.
5. Replace both runtime call sites. Preserve existing engine checksum/CRX signature checks and atomic
   store publication.
6. Remove `extract-zip` from source manifests, Electron externals, packaged metadata, and lockfile.
7. Add `yarn npm audit --all --recursive --environment production --severity high` to CI. If a
   temporary exception is unavoidable, require advisory ID, reachability analysis, owner, expiry,
   and a test that removes the vulnerable behavior from the reachable path.
8. Build the packaged app and inspect `app.asar` plus packaged `package.json` to prove the dependency
   is absent.

## Test Scenario Matrix

| Priority | Scenario | Expected result |
|---|---|---|
| Critical | ZIP entry resolves outside staging through `..`, drive prefix, or separator trick | Reject before writing |
| Critical | Symlink or junction points outside staging | Reject and remove staging |
| Critical | Signed CRX wraps unsafe ZIP content | Signature may pass; extraction still rejects |
| High | Archive exceeds byte/file limits | Abort with bounded error; no final directory |
| High | Process fails after partial extraction | Retry starts from clean staging; final state unchanged |
| High | Two installs race for same extension | One atomic winner; both return consistent store entry |
| Medium | Valid CFT/CloakBrowser/extension fixtures | Extracted output matches expected tree |

## Regression Gate

```powershell
corepack yarn install --immutable
corepack yarn npm audit --all --recursive --environment production --severity high
corepack yarn workspace @mktbrowser/desktop test:mkb02
corepack yarn workspace @mktbrowser/desktop test:mkb03
corepack yarn typecheck
corepack yarn lint
corepack yarn workspace @mktbrowser/desktop build
corepack yarn verify:packaged-contract
```

## Success Criteria

- [x] `extract-zip` is absent from manifests, lockfile, bundle externals, and packaged metadata.
- [x] All malicious traversal/link/bomb fixtures fail before final publication.
- [x] Valid engine and extension flows remain green in source and packaged verification.
- [x] No unapproved high/critical advisory is reachable from production dependencies.
- [x] Failure logs contain archive type and stable code, never source URL tokens or local secrets.

## Completion Evidence - 22 August 2026

- Direct `extract-zip@2.0.1` is absent from source manifests, Electron externals, packaged metadata,
  and the runtime lock entry. Electron tooling's distinct dev-only
  `@electron-internal/extract-zip@1.0.5` remains outside `app.asar`.
- The pinned production replacement is `yauzl@3.4.0`; `yarn audit:production` reports no suggestions.
- MKB-02 passed 69/69 after the final adversarial review fix; MKB-03 passed 31/31; the complete
  installer suite, typecheck, and zero-warning lint passed under Node `22.23.2`.
- Focused extraction and CRX tests passed 15/15. The final Windows directory build and packaged
  runtime/profile-lifecycle verifier passed.
- The final packaged verifier found no `extract-zip` metadata/files and found `yauzl@3.4.0` inside
  `app.asar`. `MKTBrowser.exe` SHA-256 is
  `6a3809d6ec83ad4f01459821b3de7cb0072483f42d67520dee8e729bdd2d2c69`; `app.asar` SHA-256 is
  `677c475d2f0338c644fc8a90d9b5eeb09ce61ccee0cb922b6ebe1acd059d9e1e`.

## Risk Assessment

- Native/system extractors may have different link semantics. Mitigation: one preflight and one
  post-extraction policy regardless of backend.
- Replacing extraction can break rare engine archives. Mitigation: retain sanitized real archive
  structure fixtures and fail closed rather than silently falling back.
- Audit output changes over time. Mitigation: parse advisory IDs, not human-formatted tables; require
  expiring exceptions instead of blanket ignores.

## Security Considerations

Archive input is attacker-influenced even when downloaded from an approved source because mirrors,
expired presigned links, compromised upstream releases, and local extension imports remain possible.
Checksum/signature verification and safe extraction are separate mandatory controls.

## Next Step

Proceed to Phase 2. Phase 3 still cannot become a release gate until the current PR check is required
by branch protection.
