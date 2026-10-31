# Audit Evidence

This directory accepts sanitized audit evidence only after Phase 01 freezes the baseline.

## Rules

- Do not store raw screenshots, logs, secrets, tokens, proxy values, observed IPs, or sensitive paths.
- Prefix files with their evidence ID, for example `AUTO-MKTT-001-npm-test.txt`.
- Every file must be indexed by SHA-256 in `artifact-manifest.sha256` during audit execution.
- Raw evidence remains in restricted, uncommitted storage and is hashed before sanitization.
- Do not add evidence produced during Phase 00 remediation.

Current status: empty; audit baseline not frozen.
