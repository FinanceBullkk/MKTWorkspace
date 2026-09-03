# Proxy authorization and audit

**Status:** Completed  
**Base:** `master`  
**Branch:** `feat/proxy-authorization-and-audit`

## Scope

Close PR #55's owner decision with options B + D. Do not translate existing strings, run a
migration, change rollout scope, or change `antidetectProfileId` authorization.

## Steps

1. Branch from current `origin/master` and run the existing account-update database tests.
2. Extend the existing admin guard so `updateAccount` can check its authenticated actor without a
   second session lookup; require ADMIN only when normalized `proxyId` differs from the stored value.
3. Keep the proxy selector and consequential confirmation for ADMIN. Show OPERATOR the current proxy
   read-only plus the primary contact derived from `ADMIN_EMAILS`; retain server-side enforcement.
4. Append proxy and browser-profile before-to-after values to `ACCOUNT_UPDATED` detail only when each
   value changes. Keep the audit row inside the existing transaction and log IDs/labels only.
5. Add four real-Postgres regressions: rejected operator proxy change with no writes; permitted
   non-proxy operator edit; permitted/admin-audited proxy change; audited profile change with unchanged
   authorization.
6. Update living documentation for the authorization/audit behavior. Run targeted tests, typecheck,
   lint, full tests, build, secret scan, and diff checks.
7. Review the remote diff, commit focused owned paths, push, open one PR to `master`, and verify the
   authoritative GitHub Actions result.

## Success criteria

- Proxy reassignment through `updateAccount` is ADMIN-only; ordinary shared edits remain available.
- OPERATOR cannot edit the proxy control and receives an actionable ADMIN contact.
- Proxy/profile changes leave readable, non-secret, transactional audit evidence.
- All required local and GitHub gates pass; PR describes B, role split, D, four tests, and the open
  owner decision for `antidetectProfileId` authorization.

## Result

- PR: https://github.com/Techieslab-app/MKTTool/pull/56
- Commits: `5c710a1`, `7b55a5b`
- Local: typecheck, lint, 221 files / 2012 tests, build, secret scan, and diff check passed.
- GitHub Actions run `33757932146`: check, contracts, relay-executable, and secret-scan passed;
  deploy-verification skipped as expected for a pull request.

## Unresolved questions

- Should a follow-up guard cross-owner `antidetectProfileId` rebinding like proxy assignment, or
  introduce an owner-or-ADMIN dedicated profile-binding action? This PR intentionally leaves it open.
