# Web/Auth Review ? MKTTool

> Historical review snapshot: findings below were recorded against older checked-out branches, not the accepted installer or the current default branches. See [repair closure](review-260910-quality-repair-closure.md) for reconciliation, verification and delivery status.

Scope: full source review of `MKTTool` Web authentication, API entry points, account/profile actions, Relay enrollment and operator-key setup, and vault UI. HEAD `bfd51ac`. Source-derived findings unless marked reproduced. No production actions or database migrations.

## Findings

### High ? profile creation commit is not concurrency-safe
`src/lib/accounts/account-profile-actions.ts:183-~290` (`recordCreatedProfile`) reads account ownership, Relay-device revocation/owner, and profile-ID uniqueness with `findUnique`, then performs an unconditional `account.update` in a later transaction. No `updatedAt`/revision or owner/device predicates are included in the write. An ADMIN can revoke/reassign the nick or device after the reads but before the update; the stale completion then writes `antidetectProfileId` and `deviceId` back onto the nick. A concurrent profile completion can likewise overwrite a newer assignment. This violates the documented `deviceId -> owner` invariant and can pin a profile to a revoked/wrong PC. Fix with a serializable transaction or conditional `updateMany` requiring the observed revision, ownerId, deviceId and profile-null state; re-read and reject stale completion. Add an interleaving database test.

### High ? profile creation is unusable when an operator has multiple active Relay PCs
`src/components/vault/antidetect-profile-card.tsx:191` calls `requestCreateProfileTicket(accountId, plan.plan)` without `deviceId`. `resolveTicketRecipient` (`src/lib/tickets/ticket-recipient-lookup.ts:40-91`) deliberately rejects when the actor has more than one active device unless a device ID is supplied. The UI has no Relay-PC selector and does not pass the current local Relay device ID. Any operator with two active PCs cannot create a profile, even when the current Relay is healthy. Fix by deriving and passing the verified local `health.deviceId`, or render a required device selector with a server-side ownership check. Add component/action coverage for two devices.

### Medium ? secret values are changed by client-side trimming
`src/components/vault/account-vault-form.tsx:113` applies `.trim()` to every password, email password, and TOTP secret before encrypting. Leading/trailing spaces are valid password characters and are significant in TOTP base32 input in some providers. Saving `" secret "` silently stores `"secret"`; operators can no longer authenticate with the intended credential. Trim only identifiers/labels. Preserve secret bytes (or apply field-specific canonicalization explicitly and tell the operator). Add a regression test with whitespace-bearing password input.

### Medium ? removed-user email is reflected into the login URL
`src/lib/auth/require-actor.ts:84-91` returns `Account ${email} is no longer allowed...`; `src/proxy.ts:41-43` copies that message into `error_description` on a `/login` redirect. This puts a user's email in browser history, referrer-bearing logs, screenshots and support URLs, and turns an authorization detail into a client-visible query string. Use a fixed error code (`EMAIL_NOT_ALLOWED`) and map it to a generic message on the login page; keep the email only in server-side audit/log context.

## Positive observations

- Every discovered server action and API route is wrapped by `guardedAction`/`guardedRoute` or explicit machine authorization; route POSTs use `isSameOrigin` where side effects exist.
- OAuth callback uses one-time state cookie, deletes it before processing, and keeps tokens out of query strings; Graph errors redact token-like values.
- Relay ticket issuance binds recipient device, uses signed sealed envelopes, expiry/replay protections, and checks nick owner/device locality before issuing.
- Operator-key delivery serializes first-device transitions with a PostgreSQL advisory transaction lock and conditional updates.

## Coverage and residual gaps

Reviewed source and tests under `src/lib/auth`, `src/lib/accounts`, `src/lib/relay`, `src/lib/tickets`, `src/lib/enrollment`, `src/app/api`, and related vault/setup components. Existing unit/database tests were inspected but not treated as proof of production readiness. No clean VM, installer, multi-process deployment, live OAuth, or production database test was run. The profile race needs a real `_test` PostgreSQL interleaving test before severity is finalized.

## Unresolved questions

- Should operators be allowed to create profiles on a different one of their active Relay PCs, or must the current local health identity always be selected automatically?
- Are leading/trailing spaces intentionally forbidden by the credential contract, or are they valid secrets?
