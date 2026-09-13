# Security Credential Exposure Inventory

Date: 2026-09-13

## Scope

The production Railway variable list was queried with `railway variables --json` and consumed
in-memory. Only variable names were emitted; no values are recorded here. The earlier diagnostic
used a human-readable listing, so treat every secret-bearing variable in that listing as exposed
until the provider or owner confirms otherwise.

## Inventory

| Variable | Domain | Rotation impact | Safe action |
|---|---|---|---|
| `RELAY_RELEASE_DOWNLOAD_TOKEN` | release distribution | old build shells fail until refreshed | **Rotated and verified**; full Relay v17 GET/hash passed |
| `BETTER_AUTH_SECRET` | web sessions | invalidates existing sessions | rotate during a planned maintenance window, then verify Google login |
| `TICKET_SIGNING_KEY` | signed server tickets | invalidates outstanding tickets and requires device/client convergence | rotate only with rollback window and fresh device smoke |
| `VAULT_KEY_SERVER` | encrypted server-domain data | can make all encrypted proxy/Facebook data unreadable if mishandled | use `vault:rekey --domain=server --apply` only after backup + decrypt preflight |
| `R2_SECRET_ACCESS_KEY`, `R2_ACCESS_KEY_ID` | database/release storage | breaks backup and artifact publication until both sides update | rotate in Cloudflare, then verify backup and release read-back |
| `RELAY_RELEASE_R2_SECRET_ACCESS_KEY`, `RELAY_RELEASE_R2_ACCESS_KEY_ID` | release storage | breaks compatibility publication/read-back | rotate in Cloudflare, then verify sequence manifest/artifact GETs |
| `DATABASE_URL` | production database | requires provider-side credential rotation and deploy restart | rotate through Railway/Postgres controls; run health and backup restore checks |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | login callback fails until provider and Railway agree | rotate in Google Cloud, update Railway, verify login/callback |
| `FACEBOOK_APP_SECRET` | Facebook Graph/OAuth | page integration fails until provider and Railway agree | rotate in Meta dashboard, update Railway, verify page smoke |

`VAULT_KEY_OPERATOR` is not a Railway variable; it remains an operator-device secret and must be
handled separately if the diagnostic listing included the machine's environment or user scope.

## Order

1. Preserve a current production backup and record a rollback owner.
2. Rotate provider/API credentials first (Cloudflare, Postgres, Google, Meta), deploy, and verify
   health, backup, release read-back, and OAuth callbacks.
3. Rotate `BETTER_AUTH_SECRET` in a planned session-reset window.
4. Rotate `TICKET_SIGNING_KEY` only after a fresh device/ticket smoke and explicit rollback window.
5. Rotate `VAULT_KEY_SERVER` through the transactional rekey command; retain the old key until a
   decrypted-data smoke and backup restore check pass.
6. Revoke old credentials and document provider-side revocation timestamps.

## Release effect

This inventory does not close the security blocker. It prevents unsafe ad-hoc key replacement and
keeps Browser promotion **NO-GO** until the owner/provider rotation receipts exist.
