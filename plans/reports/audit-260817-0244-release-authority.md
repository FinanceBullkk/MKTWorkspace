# Phase 04 — Release Authority & Supply Chain

Date: 2026-08-17
Plan: [`260816-0507-full-codebase-deep-audit`](../260816-0507-full-codebase-deep-audit/plan.md)
Depth achieved: **D3 adversarial trace + D4 executable proof on the verification logic (H55–H64)**
Status: **COMPLETE — H55–H72 classified. No P0/P1/P2. Three P3 findings. 10 new regression tests, 9 sabotage-proven. No ceremony executed, no R2 access, no publish.**

## Summary

This is the strongest subsystem examined in the audit so far. The trust chain is not merely present;
it is layered, and every layer was individually confirmed to be load-bearing by removing it and
watching a forged payload get accepted. Findings are three P3 observations, one of which is about
where a file lives rather than what the code does. Ranking them higher would misrepresent the risk.

The one result worth stating plainly: **before this phase, no test proved the root endorsement was
checked.** The existing suite covered "wrong delegated key" — which only exercises the manifest
signature. A forged delegation minted by an attacker's own root, internally consistent end to end,
had no test standing against it. The guard was there and correct; the proof was not. That gap is now
closed by test, not by reading.

## Findings

### C23 — P3 — The pinned release root is imported from `plans/`

Boundary: build-time trust anchor.

[`release-root-trust.ts:1`](../../MKTTool/src/lib/release/release-root-trust.ts#L1) imports the root
public key from
`plans/260812-1301-mkb-03-windows-onboarding-and-installer/release-authority-public-evidence/root-public.json`.
Every operator device accepts engine and Relay updates on the strength of that constant. `plans/` is
treated everywhere else in both repos as a records area — historical, freely reorganized, reviewed as
documentation.

**Why this is P3 and not higher.** [`release-root-trust.test.ts`](../../MKTTool/src/lib/release/release-root-trust.test.ts)
is a real tripwire: it re-derives `rootKeyId` from the public key, requires the bundled root to
verify the recorded `signed-delegation.json`, and pins the resulting `delegatedKeyId` as a hardcoded
64-hex literal at line 28. Swapping the trust root silently requires coherently editing three files
including a test constant. Anyone with that access already has repository write, which is game over
by a shorter path. So this is a robustness and review-surface concern, not a live trust weakness.

Remediation: move the JSON under `src/lib/release/` alongside its test. The evidence provenance is
worth recording in a comment, not worth expressing as a directory traversal into the plans tree.
Retest gate: existing `release-root-trust.test.ts` passes unchanged after the move.

### C24 — P3 — The artifact download route trusts stored R2 metadata, not the bytes it serves

Boundary: server → device artifact distribution.

[`relay-compatibility-artifact-source.ts:45-53`](../../MKTTool/src/lib/relay/relay-compatibility-artifact-source.ts#L45-L53):
on the R2 path the route compares the manifest's `sha256` against the object's *stored metadata*
checksum, then streams the object without hashing what it streams. The local-file path (line 56-59)
does hash. So a bucket object whose bytes were replaced while its metadata was preserved would be
served with an apparently valid integrity claim.

**Contained, and deliberately so.** The device hashes every downloaded byte and rejects on mismatch —
[`compatibility-artifact-staging.ts:114-121`](../../MKTTool/relay/src/compatibility-artifact-staging.ts#L114-L121)
verifies streamed size, on-disk size, and SHA-256 against the signed manifest, and
[`compatibility-set-integrity.ts:62`](../../MKTTool/relay/src/compatibility-set-integrity.ts#L62)
re-verifies from disk at activation. The real integrity guarantee is client-side and it holds. The
server-side effect is a failed update, not a compromised one. Impact: availability.

Remediation, if taken: hash on the way out, or accept explicitly and document that the server-side
check is advisory. Note the cost — hashing a 280 MB engine on every download request is not free, and
that is likely why it reads metadata. If so, say that in the code rather than leaving it to look like
an oversight.

### C25 — P3 — Hand-rolled SigV4 has no known-answer vector, and none can be sourced here

Boundary: R2 publication credentials.

[`s3-signature-v4.ts`](../../MKTTool/src/lib/r2/s3-signature-v4.ts) documents this honestly at lines
12-29 and declines to write a half-remembered signature into a test, which is the correct call — a
wrong constant would convert an unverified implementation into a "verified" one.

I attempted the obvious substitute for a published vector: cross-checking against an independent
implementation. Neither `aws4`, `@aws-sdk/signature-v4`, nor `@smithy/signature-v4` is present in the
dependency tree, and pulling one in to test the module whose entire reason for existing is avoiding
that dependency would be self-defeating.

Traced by hand against the SigV4 canonicalization rules for the narrow shape actually used — single
`PUT`, no query string, buffer payload — I found no defect: headers lowercased, whitespace-collapsed,
sorted, `signedHeaders` consistent with the canonical block; empty canonical query; correct
`stringToSign` assembly; correct four-stage signing-key derivation; and `encodeObjectKey` covering
`!'()*` which `encodeURIComponent` omits.

Accepted residual, with the reason the module already gives: a canonicalization error surfaces as
HTTP 403 `SignatureDoesNotMatch` on the first upload attempt and is recorded as a failed
`ScheduledJobRun`. It cannot fail silently or partially. Revisit if this ever signs query strings,
presigned URLs, or streaming uploads — the hand-rolled decision does not survive that scope change.

## New regression tests

Added to [`compatibility-manifest.test.ts`](../../MKTTool/src/lib/release/compatibility-manifest.test.ts)
(12 tests → 22). Every one was proven red before being accepted as green.

| Test | Guard it binds | Sabotage result |
| --- | --- | --- |
| Delegation minted by attacker's root, claiming the real root id | `verifySignedDelegation` | **Forged payload accepted** |
| Delegation naming the attacker's own root | `rootKeyId` equality | **Forged payload accepted** |
| Root-signed delegation with delegated public key swapped | `verifySignedDelegation` | **Forged payload accepted** |
| Manifest not naming the key its delegation carries | `manifest.delegatedKeyId` check | Fell through to manifest-signature rejection |
| Pinned root whose fingerprint contradicts its own key | root self-consistency | **Accepted** |
| Manifest signed under an expired delegation | authority window | **Accepted** |
| Manifest expiring after its delegation does | authority window | **Accepted** |
| Manifest signed before its delegation became active | authority window | **Accepted** |
| Revocation statement signed by a non-root key | revocation fail-closed | **Accepted (statement silently skipped)** |
| Manifest carrying an unknown field | schema `.strict()` | Not sabotaged — schema-level |

Six of the ten sabotages resulted in a **forged or out-of-window payload being fully accepted**, which
is the only evidence that matters for tests of this kind.

One honest qualification: the "does not name the key that signed it" test did not go fully open under
sabotage — it fell through to the manifest-signature check and was still rejected, with a different
message. That check is defense-in-depth, not a sole guard. The test asserts the specific message, so
it still detects the guard's removal.

## Hypothesis results

| ID | Result | Evidence |
| --- | --- | --- |
| H55 | Closed by new test | Root endorsement is verified before anything else trusts the delegated key: root fingerprint self-check, `rootKeyId` equality, `verifySignedDelegation` under the pinned root, delegated fingerprint re-derivation, manifest-names-its-signer. Three forged-chain tests now hold this open. |
| H56 | Closed by new test | `validateAuthorityWindow` checks signing time against host clock with 5-min skew, `issuedAt <= signedAt`, manifest expiry, `signedAt >= notBefore`, `now < delegationExpires`, and `manifestExpires <= delegationExpires`. `now` is host-supplied, never payload-supplied. Three window tests added. |
| H57 | Closed — fails closed by design plus local memory | The predicted "missing revocations file → nothing revoked" bug does not exist in the shape predicted. Absent statements do fail open *for a key never before seen revoked*; the design answers this with `knownRevokedDelegatedKeyIds`, monotonic local memory persisted by `prepareCompatibilityUpdate` **before** staging so an interrupted download cannot forget a proven revocation. A malformed or foreign-signed statement throws rather than being skipped — now tested. |
| H58 | Closed | Revocation is absolute. No "signed before revocation" carve-out exists, so there is no cutoff rule to get wrong. |
| H59 | Closed | `WINDOWS_RELEASE_ROOT_TRUST` is a frozen module constant. `main.ts:355-387` does not pass `rootTrust`; the option is a test-only injection seam. No environment variable reaches the trust root — the only `process.env` reads under `src/lib/release/` are the smoke observer proxy label and `RELAY_WEB_ORIGIN`. See C23 for the file's location. |
| H60 | Closed | The manifest signature covers the whole statement including every artifact `sha256`, `sizeBytes`, and URL, under domain `MKTTool Windows compatibility manifest v1`. Artifacts are not swappable under a valid signature. |
| H61 | Closed | Hash is compared, three times: streaming during download with a size cap that aborts an oversized body, re-verified from disk after write, and re-verified at activation against the protected digest. Download uses `redirect: "error"` and `flags: "wx"`. |
| H62 | Closed | `validateSequence` enforces the installer floor, the monotonic high-water mark, strictly-newer-than-current, declared transition membership, exact retained sequence, and no duplicate transitions. The only replay permitted is a byte-identical pending manifest bound by digest. |
| H63 | Closed | Every schema object is `.strict()`. Unknown-field test added. |
| H64 | Closed | `verifyRollbackAuthorization` enforces the floor (`rollback-authorization.test.ts:28`), strictly-older target, device binding, one-use authorization ids, 60-second maximum lifetime, and domain separation. |
| H65 | Closed | The root seed exists only in memory, is zeroized in `finally`, and reaches disk only inside an AES-256-GCM envelope with the metadata bound as AAD. Files are written `wx`, mode `0o600`, via atomic rename. The passphrase is read from a TTY in raw mode and never persisted. Residual, unavoidable: Node's `KeyObject` retains an internal copy that `seed.fill(0)` does not reach. |
| H66 | Closed | `ROOT_BACKUP_SCRYPT` = N 262144, r 8, p 1 — above current guidance, not a first-draft default. `validateScryptParameters` pins r and p and rejects non-power-of-two or out-of-range N on both encrypt and decrypt. |
| H67 | Closed | The rehearsal genuinely decrypts backup B, re-derives the key, signs a recovery proof with the recovered key, and verifies it — a recoverability proof, not a receipt check. `verifyWrittenBackup` additionally read-back-decrypts both copies at ceremony time, and `assertSeparateVolumeRoots` refuses to put both on one volume. |
| H68 | Closed | DPAPI scope is `CurrentUser`, not `LocalMachine`, for both protect and unprotect. |
| H69 | Closed | The verifier requires an out-of-band `expectedRootKeyId` fingerprint, re-derives the root id from the public key, cross-checks it against both the root record and the ceremony record, verifies the delegation and the recovery proof under that root, and binds the DPAPI-held delegated key to the delegation. Not self-signed. |
| H70 | Closed | `publishImmutable` head-checks first, refuses to overwrite an existing object with different bytes, `PUT`s with `ifNoneMatch: "*"` so immutability is enforced by R2 rather than asserted by the publisher, then re-heads and re-downloads to hash the actual stored bytes. |
| H71 | Accepted residual (C25) | No canonicalization flaw found for the shape in use; no known-answer vector obtainable. |
| H72 | Partly closed (C24) | The route rejects any path the signed manifest does not name and checks size and checksum, but on the R2 path the checksum comes from object metadata rather than the served bytes. Client-side verification is what actually holds. |

## Verification

| Gate | Result |
| --- | --- |
| `src/lib/release`, `scripts/release-authority`, `src/lib/r2` (excluding `*.database.test.ts`) | PASS — 10 files, 61 tests |
| `relay/src/local-updater`, `handle-compatibility-update`, `update-state` | PASS — 3 files, 41 tests |
| `compatibility-manifest.test.ts` after each sabotage restore | PASS — 22/22 |
| Sabotage A (chain checks removed) | 5 failed as required |
| Sabotage B+C (authority window, revocation fail-closed) | 4 failed as required |
| Source restored via `git checkout --` after every sabotage | Confirmed clean by `git status` |

No ceremony was executed. No R2 credentials were read, no bucket contacted, no publish run. No key
material, real or synthetic, appears in this report.

## Carried-in dependency: the Phase 01 domain-separation question

The phase brief predicted that "the same Ed25519 key signs manifests" and that a domain-separation
failure would escalate every hypothesis here. That prediction was half right and worth correcting in
the record.

Manifests are **not** signed by the server key — they are signed by the delegated release key, which
exists only in a DPAPI store on the signing machine and is endorsed by the offline root. But the
server key genuinely is reused: it signs tickets, compatibility update authorizations, and rollback
authorizations. The two authorization protocols carry explicit domain prefixes. The ticket protocol
does not — [`ticket-verifier.ts:98-103`](../../MKTTool/src/lib/tickets/ticket-verifier.ts#L98-L103)
verifies over the base64url envelope string directly.

Confusion between them is still unreachable, and for a reason that is incidental rather than
designed: every release domain prefix begins with characters — spaces and a newline — that cannot
occur in a base64url string, so the two signed-byte spaces are disjoint. A ticket signature can never
be replayed as an authorization, or the reverse. C1 remains the right finding; this phase neither
escalates nor closes it.

## Deferred to the human gate

1. Authenticode validity after resource edits — Windows signing is still disabled, so this remains
   the Phase 03 carry-forward (H52) and belongs to a release rehearsal, not to code.
2. Clean-machine withdrawn-installer behavior (H54): a truly clean VM running a withdrawn older
   installer has only that installer's embedded floor and bundled revocations. The revocation memory
   proven here is *local* memory — a device with no history has none. This is the honest residual of
   the revocation design and it is a distribution-authority question, not a code defect.

## Unresolved questions

1. C24 — is the R2 metadata checksum a deliberate cost trade-off against hashing 280 MB per request?
   If yes it wants one comment; if no it wants a fix. I cannot tell which from the code.
2. C23 — move the trust anchor into `src/`, or keep the provenance-by-location and accept the review
   surface? Moving it is cheap and the test travels with it.
