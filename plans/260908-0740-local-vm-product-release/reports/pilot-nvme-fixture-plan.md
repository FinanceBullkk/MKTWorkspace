# Fresh NVMe Pilot Fixture Plan

## Scope

Prepare independent helpers for the clean VM clone. Preserve the original fixture and all existing
helpers/source. Authoring and synthetic validation only in this task; the parent performs real
provisioning after review. No PostgreSQL start, database query, service launch, old private-config
read, source rebuild or publication is authorized in this implementation slice.

Fixed target: `C:/mkt-vm/pilot-nvme-private-20260908`, PostgreSQL 17.10 loopback port 55419,
database `mkt_candidate_nvme_test`, role `mkt_nvme_pilot`. Never target operational port 5432 or
the old fixture on 55418. Source remains `D:/mkt-local-release-20260908/a/MKTTool` at
`b4ef969b5cac9473da77ef3db1bbb941b46cdd9c`; exact quality receipt and candidate stay unchanged.

## Design And Sequence

1. Record hashes of the existing pilot helpers. Use their exports unchanged: private ACL/JSON
   handling, frozen-source checks, minimal server environment, quality/runtime binding and auth.
2. A creation-only config helper requires explicit execution acknowledgement, Windows/Node 24,
   the exact non-redirected NVMe parent and a nonexistent target root. Create/restrict the empty
   root before any secret appears. Never modify the parent ACL or original proxy-file ACL.
3. Create the complete config once: independent random DB/auth/signing/server/operator keys,
   new session/binding/attempt paths, same frozen source/quality/candidate, same authorized proxy
   privately copied, and new TLS paths. No old config/key/session is read or copied. TLS issuance
   is a separate parent step; this helper does not change host trust or DNS.
4. A separate creation-only database helper validates exact config/data/role/port and free port,
   rejects existing data/log/password/receipt paths, pins PostgreSQL executable identities, then
   creates a dedicated SCRAM cluster and runs only committed Prisma migrate deploy on that DB.
   Raw child output stays private/suppressed; no credentials enter command-line arguments.
5. Bind cluster identity to canonical data path, database/role/loopback/port, PostgreSQL version,
   process identity and executable hashes. A stop after failure requires a fresh matching owned
   process proof; uncertain ownership remains BLOCKED for parent inspection. Never stop a generic
   postgres process or delete a cluster. Remove only the exact owned password scratch file.
6. Parent generates test TLS into the already-declared paths, prepares/verifies runtime binding,
   invokes the unchanged auth worker for a new synthetic ADMIN session, then unchanged Next/HTTPS
   helpers. Preserve strict empty-fixture startup requirements and normal Relay enrollment.

## Runtime Binding Boundary

An existing binding may be reused only by a reviewed private copy into the new root when
`assertRuntimeBinding(newConfig)` proves the full current frozen snapshot, Node identity, quality
receipt and build window still match. Do not copy an old fixture marker/session. If runtime drift
is found, fail closed; do not regenerate a binding merely to bless post-run changes. No binding
reuse or creation executes in this slice.

## Inline Plan Review Before Code

Reviewed for wrong-cluster mutation, secret leakage, stale-session reuse, source drift, config
rewrite, partial failure, uncertain process ownership and race-prone output reuse. Resolution:
exact immutable target contract, exclusive outputs, read-back identity checks, restricted ACLs,
redacted errors, fail-closed ownership and independent fresh credentials. No unresolved design
blocker to authoring; execution remains separate and unverified.

## Validation

- Synthetic-only tests: target drift, port 5432/55418, path escape/redirect, output reuse, invalid
  keys, independent config generation, exact command arguments and redacted command failure.
- Syntax checks on all new helpers; tests import helpers without side effects.
- Hash comparison confirms existing helper files unchanged. Frozen source is not modified.
- No synthetic result is clean-machine, service-start or activation evidence.

## Status And Next Action

Plan reviewed before code. Implementation authored and inline-reviewed; 34/34 synthetic tests
PASS, zero failures/skips; syntax checks PASS. A protocol-mutation test initially failed because
the URL setter ignored a non-special-to-special scheme change; explicit malformed fixture creation
fixed the test without weakening its assertion or the database guard.

Created under `local-test-artifacts/local-release-20260908/pilot-nvme/`:

- `pilot-nvme-contract.cjs`: exact config/command/database target contract.
- `pilot-input-bindings.cjs`: pinned hashes of eight unchanged original helper files.
- `pilot-nvme-io.cjs`: canonical paths, private ACLs, redacted child execution and owned PG checks.
- `prepare-private-config.cjs`: creation-only complete config and private proxy/key files.
- `prepare-disposable-database.cjs`: creation-only cluster/migrations and bound private receipt.
- `pilot-nvme.test.cjs`: synthetic-only target, path, identity and failure contracts.

Parent execution order after review: Node 24 invokes `prepare-private-config.cjs --prepare`, then
`prepare-disposable-database.cjs --prepare`; neither command ran during authoring. TLS files must
then be generated at the exact new config paths without rewriting that config. Verify/copy runtime
binding as described, then use unchanged auth, Next and HTTPS helpers with the new config. The
auth helper must precede Next; do not stop/restart PostgreSQL between their identity checks.

Failure review preserves partial directories and receipts. A failed start with no provable owned
postmaster is BLOCKED, never reported as a stopped cluster. Existing paths prevent blind reruns.
No helper changes the old fixture, source, global Node/PATH, host trust, or production port 5432.

Unresolved execution gates: host capacity, free target port, TLS issuance, runtime binding validity,
real cluster/auth/server startup, guest enrollment, activation/lifecycle and final fixture cleanup.
