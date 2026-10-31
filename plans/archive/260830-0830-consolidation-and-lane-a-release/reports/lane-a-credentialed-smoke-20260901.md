# Lane A credentialed smoke report

Date: 2026-09-01 (ICT)
Status: **P4-08 PASS / bounded; owner-signed CONDITIONAL GO recorded**

## Scope

This was an admin-led smoke against the live MKTTool Web deployment. It covered authentication,
Facebook token health, the destructive-action confirmation UI, scheduler evidence, and backup
freshness. It did not publish content, revoke a session or token, bind a Relay device, or change
production data.

## Results

| Check | Result | Evidence |
|---|---|---|
| Google OAuth callback/admin session | **PASS** | After the stale OAuth tab returned a CSRF error, the preserved production session resolved to the approved allowlisted account and the UI showed the administrator role. |
| Allowlist and role matrix | **PASS / admin path** | Production shell rendered the signed-in account as an administrator; protected pages `/facebook`, `/setup`, `/relay-devices`, `/health`, and `/queue` were reachable. Negative unauthorised-role paths were not exercised. |
| Facebook token health | **PASS** | `/facebook` showed one connected account and one Page with `Token tốt`; `Kiểm tra token tất cả Page` completed with `1 Page đều dùng được` and refreshed the last-check timestamp to 01/09 15:43. |
| Destructive-action confirmation | **PASS / no submit** | First click on `Ngắt kết nối` exposed the second step `Ngắt Anh Hao và gỡ 1 Page?`; `Thôi` was clicked. No disconnect or Page removal was submitted. |
| Daily scheduler | **PASS / qualified** | `/health` showed the configured 09:00 team-timezone schedule and the latest run `01/09 09:00` was recorded as dispatched. Its Reddit parser result is outside Lane A. |
| Backup freshness | **PASS** | Read-only production query for `daily-backup` returned `outcome=LAUNCHED`, `lastRunAt=2026-08-31T20:00:57.679Z` (03:00:57 ICT), and R2 upload detail for a 64 KB dump containing 117 rows in 15 tables. |
| Posting path | **NOT EXERCISED** | `/queue` contained zero jobs, so no live post was available for a safe bounded run. No content was created or submitted. |

## Explicitly not exercised

- Google logout/session revocation and Facebook token revocation were not run, per the owner's
  instruction not to revoke sessions or tokens.
- A negative unauthorised-email or operator-role login path was not exercised; only the approved
  administrator path was tested.
- Relay current-PC confirmation was not submitted; `/setup` remains a Browser/fleet operation and
  is not needed to qualify the Lane A Web smoke.
- The setup page still fail-closes the Browser installer because the release tuple is incomplete;
  this remains the separate P4b Browser gate.

## Decision impact

P4-08 is complete as a bounded credentialed/admin smoke. The owner signed **CONDITIONAL GO for Lane A
internal demo / controlled beta** on 2026-09-01 (ICT), accepting residual risks 1–8. The decision does
not authorize unattended posting, identity-isolation claims, Relay-floor changes, or Browser
promotion.

## Unresolved questions

- Second owner-machine Relay v16 health observation before any floor change.
- Exact trigger of the historical production 503 remains unconfirmed; R2 latency is still a
  hypothesis, not a measured serving-region cause.
