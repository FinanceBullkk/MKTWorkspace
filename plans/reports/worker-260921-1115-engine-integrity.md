# Engine pin and checksum work

Scope: worklist items 4-5 in MKTBrowser. Existing dirty harness functionality preserved.

## Changes

- Historical default remains CloakBrowser `151.0.7922.108.2` and its original archive hash.
- Overrides require both `--engine-version` and `--engine-sha256`. Before any browser launch,
  the harness validates the tuple against `active-engine.json`, cache metadata, runtime metadata,
  and the local executable. Drift reports both required flags, before cache seeding or stock control.
- Pin output retains only sanitized URL origin/path, archive filename, version, digest, sequence,
  and size. URL credentials, query and fragment are removed. Invalid JSON errors cannot echo contents.
- Raw measurement output records sanitized local pin provenance. The new observation is metadata
  agreement, not new signature verification, engine-byte rehashing, or release acceptance.
- Pro and keyless CloakBrowser require usable SHA256SUMS. Network/HTTP/read errors, malformed or
  missing digests, duplicate archive entries, and conflicting version metadata fail closed.
- Pro resolves the digest before exchanging the licence key for an archive URL. Bootstrap requires
  a valid expected digest before downloading CloakBrowser or a compatibility-pinned artifact;
  mismatched bytes cannot reach extraction or readiness. No fallback or promotion was added.
- Existing unpinned development CFT behavior is unchanged: computed digest only, HTTPS/macOS
  codesign, no canonical upstream digest. Pinned CFT requires its expected digest.
- Diagnostic seat retries remain explicit, default zero, with a warning that retrying may prolong
  the hold. Explicit post-close quiet time precedes the local-free check so conservative cooldowns
  can be respected. Optional `appPath` supports the parent's separate disposable source validation.

## Evidence

Sanitized observation: `../260921-1109-licence-seat-fixes/cloakbrowser-151.0.7922.108.6-local-pin.json`.
Observed local sequence 2, version `151.0.7922.108.6`, archive size 540036860 bytes, metadata SHA-256
`5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37`.
The local pin, cache index, and runtime version agree. The executable exists.
Archive not downloaded or rehashed; signature not revalidated; engine not executed.
Production pins and release manifests were not changed.

## Validation

Supported Node: `22.23.2` from the explicit Volta executable.

- PASS: initial checksum regression run reproduced 15 failures in 17 tests, including missing
  digest reaching extraction. Same regressions pass after implementation.
- PASS: `node --experimental-strip-types --test apps/desktop/src/main/engine-download-checksum.test.ts apps/desktop/src/main/chromium-bootstrap-contract.test.ts apps/desktop/src/main/activated-engine-bootstrap.test.ts` - 29/29, no skips.
- PASS: `node --test scripts/fingerprint-engine-pin.test.cjs scripts/fingerprint-measurement-analysis.test.cjs` - 30/30, no skips.
- PASS: desktop TypeScript with noUnusedLocals, noUnusedParameters and noFallthroughCasesInSwitch.
- PASS: ESLint on all nine owned code/test files; `git diff --check`.
- The parent owns package script wiring and broad integration checks.

No vendor calls, browser/engine launches, real measurements, packaging, VM work, commits, pushes,
or deployments were performed by this worker. Previously installed caches were not retrospectively
reverified by the download guard. Local tests do not close identity or release acceptance.

## Unresolved questions

None for the implementation scope. Real engine availability and the vendor timer hypothesis remain
separate evidence work owned by the parent.
