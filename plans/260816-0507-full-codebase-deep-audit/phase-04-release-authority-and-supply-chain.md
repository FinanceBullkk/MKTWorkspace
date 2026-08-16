# Phase 04 — Release Authority & Supply Chain

Depth: **D3**, escalating to **D4** for verification logic · Priority: P1 · Status: Completed · Effort: 1 session

Execution snapshot: H55–H72 classified in
[`audit-260817-0244-release-authority.md`](../reports/audit-260817-0244-release-authority.md).
No P0/P1/P2. Three P3 findings: C23 trust anchor imported from `plans/`, C24 artifact route trusts
stored R2 metadata rather than served bytes, C25 hand-rolled SigV4 has no obtainable known-answer
vector. Ten regression tests added; nine proven red by sabotage, six of those showing a forged or
out-of-window payload fully accepted with the guard removed. No ceremony executed, no R2 access, no
publish.

## Context

- Depends on Phase 01 domain-separation result (H01/H02) — the same Ed25519 key signs manifests.
- 16 Aug: entirely unexamined.

## Why this matters out of proportion to its size

~1,400 lines total, but it is the trust root. Every device accepts engine and Relay updates on the
strength of these signatures. A verification bug here is remote code execution on every operator
machine, delivered through the legitimate update channel. Small code, maximum blast radius.

The offline root ceremony has its own tests (`offline-root-ceremony.test.ts`,
`release-authority-ceremony-verifier.test.ts`, `release-authority-format.test.ts`,
`windows-dpapi-current-user.test.ts`). Same question as Phase 01: do they encode an adversary.

## Scope

**Ceremony** (`scripts/release-authority/`): `offline-root-ceremony.mjs` 184 ·
`release-authority-format.mjs` 169 · `release-authority-ceremony-verifier.ts` 162 ·
`prepare-delegated-release-key.ts` 106 · `offline-ceremony-io.mjs` 73 ·
`offline-root-backup-files.mjs` 52 · `verify-release-authority-ceremony.ts` 51 ·
`release-authority-key-primitives.mjs` 45 · `windows-dpapi-current-user.ts` 43 ·
`prepare-offline-ceremony-bundle.ps1` 32

**Manifest** (`src/lib/release/`): `compatibility-manifest.ts` 178 ·
`compatibility-update-actions.ts` 150 · `compatibility-update-authorization.ts` 137 ·
`compatibility-manifest-schema.ts` 116 · `rollback-authorization.ts` 91 ·
`compatibility-rollback-actions.ts` 69 · `compatibility-manifest-crypto.ts` 62 ·
`compatibility-control-contract.ts` 29 · `compatibility-artifact-paths.ts` 23 ·
`release-root-trust.ts` 7

**Distribution**: `src/lib/relay/relay-release-r2.ts` · `relay-compatibility-manifest-file.ts` ·
`src/lib/r2/*` (s3-signature-v4, r2-client, r2-config) · `scripts/publish-*.ts` ·
`app/api/relay/download/**` (4 routes)

## Key insights carried in

- `release-root-trust.ts` is 7 lines — the root of trust is a near-constant. Verify it is pinned and
  not env-overridable at runtime.
- `signDelegationRevocation` exists and is test-only-referenced. Revocation is implemented; the
  question is whether the **client** checks it, and what it does when the revocation list is missing.
- Download routes use `machineRoute`/`machineOrGuardedRoute` with a constant-time bearer check
  (verified 16 Aug). The auth is sound; artifact integrity is the open question.
- `ROOT_BACKUP_SCRYPT` is unreferenced outside its module — check the parameters are current-strength,
  not defaults from a first draft.

## Failure hypotheses

**Chain of trust**
- H55 Client verifies the delegated key's signature but not the root's signature *over* the delegation —
  i.e. any delegated key is accepted, not only root-endorsed ones.
- H56 Delegation expiry is not checked, or is checked against a client-supplied timestamp.
- H57 Revocation check **fails open**: missing/unreachable revocations file → treated as "nothing
  revoked". The most likely real bug in this phase.
- H58 A revoked delegated key still validates artifacts signed before revocation, with no cutoff rule.
- H59 Root key is overridable by env var or config file, so a compromised machine repoints its own trust root.

**Manifest and artifacts**
- H60 Manifest signature covers metadata but not artifact hashes, so artifacts are swappable under a
  valid signature.
- H61 Artifact hash is computed but not compared, or compared with `==` on differing encodings.
- H62 Manifest version is not monotonic — an old signed manifest is replayable to force a downgrade to
  a known-vulnerable engine.
- H63 `compatibility-manifest-schema` accepts unknown fields that later code trusts.
- H64 Rollback authorization has no floor, permitting rollback to a revoked release (couples to H54).

**Ceremony and key custody**
- H65 Offline root private key touches disk unencrypted at any point, or reaches a temp file.
- H66 `ROOT_BACKUP_SCRYPT` parameters are below current guidance.
- H67 Recovery rehearsal does not actually prove recoverability — verifies a receipt rather than a
  restored key.
- H68 DPAPI wrapping is machine-scoped rather than user-scoped, widening who can unwrap.
- H69 Ceremony verifier accepts a self-signed receipt (no independent root check).

**Distribution**
- H70 R2 objects are mutable — a published version can be replaced in place. (`publish-*.ts` mentions
  immutability; prove it is enforced server-side, not just asserted by the publisher.)
- H71 `s3-signature-v4.ts` is a hand-rolled SigV4 with a canonicalization flaw.
- H72 Download route serves an artifact without verifying the stored hash matches the manifest.

## Method

1. Write H55–H72 before reading.
2. D2 read in trust order: root trust → ceremony → delegation → manifest schema → manifest crypto →
   client verification → distribution.
3. **D4 for verification logic** (H55–H64): these are pure functions over signed inputs — cheap to
   test properly, and the highest-value tests in the phase. Feed each a tampered artifact: wrong
   signer, expired delegation, revoked key, swapped hash, replayed old version.
4. Carry Phase 01's domain-separation matrix result here; if key reuse lacks separation, every
   hypothesis above escalates.
5. Ceremony hypotheses (H65–H69) are D3 — the real ceremony is offline and out of scope to execute.

## Todo

- [x] Write H55–H72 (written 16 Aug, before any code was read)
- [x] D2 read trust chain
- [x] D4 tampered-input tests for H55–H64, each sabotage-proven
- [x] D3 trace of ceremony key custody
- [x] Distribution/immutability trace
- [x] [`plans/reports/audit-260817-0244-release-authority.md`](../reports/audit-260817-0244-release-authority.md)

## Success criteria

- Every verification rejection path has a test with a tampered input that goes red without it.
- Revocation is proven to fail **closed**.
- Root trust is proven non-overridable at runtime.
- Key custody documented end to end: generation → backup → use → recovery.

## Security considerations

Synthetic root and delegated keys only. Never execute the real ceremony, never touch production R2,
never publish. No key material — real or synthetic — in reports.

## Risks

- **Cannot test the real ceremony.** Offline by design. Findings here are about the code path, not the
  human procedure; the procedure belongs to the human gate.
- **Depends on Phase 01.** Running this before Phase 01 risks re-deriving the domain-separation
  question. Keep the order.

## Next

Phase 05 — unrelated risk area; can run in parallel if time is split.
