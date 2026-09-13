# Relay Download 401 Diagnosis

Date: 2026-09-13

## Finding

The pinned Relay network path fails because the local and deployed machine tokens diverge.

- Local `MKTTOOL_RELEASE_TOKEN`: present at Process and User scope, 64 characters.
- Railway production `RELAY_RELEASE_DOWNLOAD_TOKEN`: present, 64 characters.
- In-memory comparison: exact equality `false`; SHA-256 prefixes differ (`0595683c3f73` local,
  `690d7d8ab9c4` Railway). Values were never written to this report.
- Authenticated GET of `/api/relay/download/v17` from the current host: HTTP 401, JSON response.
- Railway service is online in `production` at deployment `de55e528-ce24-4a78-9b2c-6173cce0cdae`.

This is a verified credential mismatch (or an equivalent stale process environment), not a missing
local variable, URL typo, R2 object absence, or archive checksum defect.

## Why 401 is expected

`fetch-pinned-relay.cjs` reads `MKTTOOL_RELEASE_TOKEN`, sends `Authorization: Bearer <token>`, and
fails closed on any status other than 200 (or a valid 206 resume). The Web route calls
`releaseDownloadTokenMatches`, which reads `RELAY_RELEASE_DOWNLOAD_TOKEN` and performs a
length-checked timing-safe equality comparison. Invalid and absent machine credentials intentionally
fall through to the same 401 login response.

## Sources consulted

1. `MKTBrowser/apps/desktop/scripts/fetch-pinned-relay.cjs` — client header, immutable v17 URL,
   resume handling, size/SHA-256 verification, atomic staging.
2. `MKTTool/src/lib/relay/release-download-token.ts` and
   `MKTTool/src/app/api/relay/download/[version]/route.ts` — server variable name and exact auth
   contract.
3. `plans/reports/release-260913-0500-browser-0.3.22-gate-two-build-and-clean-vm.md` — two
   consecutive candidates used a hash-verified cached archive because network auth returned 401.
4. `MKTTool/docs/deployment-guide.md` — documented rotation procedure and separation of Railway
   token from Windows build token.
5. `plans/260830-0830-consolidation-and-lane-a-release/reports/lane-a-deploy.md` — prior evidence
   that the same route succeeds with a matching authorized token and full GET/hash verification.

## Safe remediation

1. Generate one new random 32-byte hex token on the operator machine; do not paste it into chat,
   logs, shell history, or a repository.
2. Set that value as Railway production `RELAY_RELEASE_DOWNLOAD_TOKEN`, restart/deploy the web
   service so the running process loads it.
3. Set the identical value at Windows User scope as `MKTTOOL_RELEASE_TOKEN`; restart build shells.
4. Verify without printing the value: compare only presence, length, and an in-memory digest prefix;
   then run a full authenticated GET of v17 and compare bytes to `relay-release.json` size/SHA-256.
5. If the route remains 401 after exact equality, inspect the deployed commit/runtime environment and
   redeploy; do not weaken the route or switch back to a user session cookie.

The current local `.env` does not define this token; the effective value comes from User/Process
scope. Keep the token out of `.env` unless the file is secured and ignored; prefer a protected User
secret or CI secret injection.

## Policy recommendation

Ranked choice:

| Rank | Policy | Reproducibility | Security | Operational risk | Recommendation |
|---|---|---:|---:|---:|---|
| 1 | Restore matching machine token; network fetch is default | High | High | Low after rotation | Adopt |
| 2 | Hash-verified cached archive as emergency fallback only | Medium | High if provenance retained | Medium (stale cache) | Retain, document as fallback |
| 3 | Make cached archive the supported primary path | Low | Medium | High (hidden drift, new builders blocked) | Reject |
| 4 | Reuse human session cookie | Medium | Low | High (expiry, overbroad access) | Reject |

The cached v17 archive is acceptable for the already accepted byte-equivalence evidence because the
script checks source and copied bytes against the immutable size/SHA-256 pin. It cannot close the
network reproducibility gate or substitute for authenticated publication evidence.

## Unresolved questions

- After token rotation, which exact deployment/restart receipt will bind the new environment to the
  production route?
- Should the release runner add a preflight that compares local and server token digests without
  exposing values, before starting a long build?
- The human-readable Railway variable command printed production secrets during diagnosis; rotate
  exposed production credentials and avoid that command. Use `--json` with in-memory redaction only.
