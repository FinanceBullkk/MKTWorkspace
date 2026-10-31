# S5 handoff runbook — real-environment gates

> **Retained future-reopen/P4b procedure — not an active gate.** P4a Web is already independent;
> P4b's Browser tuple remains OPEN, and Lane C is **CLOSED** because no CloakBrowser channel exists.
> Do not schedule this runbook, a vendor request, or a Browser real-account canary unless a new
> product decision explicitly reopens that lane.

Status: READY FOR HUMAN/EXTERNAL INPUTS, NOT STARTED  |  Candidate: `20260830-browser-0.3.13-relay-16`

This runbook is prepared for the exact signed candidate only. It does not authorize Browser
real-account use. The current candidate remains a controlled demo until every required gate is
independently evidenced. Do not place credentials, OTPs, cookies, tickets, proxy URLs, page text,
license keys, or decrypted vault material in logs or evidence.

## Entry conditions

An operator may start S5 only after the release owner records all of the following:

- a signed/frozen candidate manifest and immutable installer URL;
- exact installer, `app.asar`, Relay archive/EXE, engine, and payload-manifest hashes;
- two disposable static proxy/profile labels, a vendor test entitlement, and a clean PC-B owner;
- a human operator and an approved disposable/sandbox account;
- a disposable host capable of a real power-off/power-on and an evidence reviewer.

The engine pin must not change after entry. If it changes, stop, mark all S5 evidence `INVALID`, and
return to S3/S4b for a new candidate.

## Evidence envelope

Create one sanitized JSON record per machine and gate under
`plans/260829-2125-internal-product-readiness/reports/real-environment-evidence/`. Use labels such
as `PC-A`, `PC-B`, `proxy-A`, and `proxy-B`; never use personal names, IP addresses, account IDs,
profile IDs, or vendor lease/key values.

```json
{
  "candidateId": "20260830-browser-0.3.13-relay-16",
  "machineLabel": "PC-A",
  "gate": "G1|G2-NETWORK|G3-LICENSE|G3-RECOVERY|G4-OPERATOR",
  "startedAt": "<UTC ISO-8601>",
  "installerSha256": "<64 lowercase hex>",
  "engine": { "channel": "<approved>", "version": "<approved>", "sha256": "<64 lowercase hex>" },
  "profileLabel": "profile-A",
  "proxyLabel": "proxy-A",
  "checks": [{ "name": "<check>", "result": "PASS|FAIL|OPEN|NOT-RUN", "durationMs": 0 }],
  "cleanup": { "processes": "PASS|FAIL|OPEN", "residue": "PASS|FAIL|OPEN" },
  "operatorAttestation": "<event-only statement, no values>",
  "verdict": "PASS|FAIL|OPEN|BLOCKED",
  "notes": "<sanitized reason>"
}
```

## PC-A sequence

1. Reset to the approved clean snapshot. Confirm Windows x64, no Node requirement, no prior MKT
   Browser/Relay process, no old profile directory, and no inherited environment/config files.
2. Download the immutable candidate installer. Verify it before opening it; PowerShell output may
   include only the path, byte count, and digest:

   ```powershell
   Get-Item -LiteralPath .\MKTBrowser-win-x64.exe | Select-Object Length,FullName
   Get-FileHash -LiteralPath .\MKTBrowser-win-x64.exe -Algorithm SHA256
   ```

   Compare against the signed manifest. A mismatch is a hard stop; do not retry with a different
   file under the same candidate ID.
3. Install per-user. Record installer result, ports `47821`/`47822`, and owned process paths. Do
   not run `electron .`, Node, developer flags, unpinned/CFT identity runs, or raw CDP tools.
4. Enroll one Relay device through the normal MKTTool flow. Assign exactly one managed profile and
   one static proxy label. Verify the profile cannot launch while the proxy is missing, changed, or
   fails its preflight.

## G1 — human input/login

The human operator, not a script, performs focus, click, scroll, typing, navigation, and (only if
the disposable account owner approves) first login. Google credentials, OTP, CAPTCHA, recovery, and
password-manager actions remain entirely human-controlled. The recorder stores event types and
outcomes only, for example: `focus`, `typed`, `submit`, `login-complete`, `closed`.

Required result: three packaged manual-login/input interactions with valid cover control and
interleaved A/B evidence. If no disposable account is available, run focus/typing only and leave
the login sub-gate `OPEN`; do not substitute a real or high-value account.

Stop immediately on unexpected navigation, credential exposure, profile cross-wire, unapproved
automation, or a request to use a production account. Preserve only sanitized diagnostics.

## G2 — network, DNS, WebRTC, and firewall

Run each profile independently and repeat each probe at least three consecutive times. The network
owner supplies the approved expected country/ASN and resolver policy out of band; the evidence file
contains labels and pass/fail only.

| Probe | Required result | Stop condition |
|---|---|---|
| External egress | 3/3 matches assigned static country/ASN/IP label | Any mismatch or direct egress |
| In-browser egress | 3/3 matches the same assigned route | Any mismatch/cross-wire |
| DNS/DoH | 3/3 uses approved resolver/path | Any local, fallback, or unapproved resolver |
| WebRTC/UDP | 3/3 exposes zero disallowed host/public candidates | Any candidate leak |
| Fault injection | Proxy/firewall fault blocks launch before engine spawn | Any direct fallback or stale-profile launch |

Collect no raw IP, resolver address, candidate, proxy URL, or page content. Record tool name/version,
bounded timeout, profile/proxy labels, and aggregate counts only.

## G3 — vendor lease and recovery

The vendor owner observes the authoritative lease dashboard/API while the operator runs:

1. start one approved disposable lease;
2. bounded heartbeat and normal close;
3. attempted second profile/seat, which must be refused without spawning a second engine;
4. network interruption and process termination;
5. re-enrollment after cooldown and explicit end/revocation.

Record vendor outcomes as `GRANTED`, `REFUSED`, `RELEASED`, `COOLING`, or `UNKNOWN`, with labels and
bounded times only. A local timer or UI state is not vendor truth.

For exact-candidate recovery, run normal close, graceful Relay restart, forced termination, reboot,
and a real disposable-host power-off/power-on. After every restart, issue a fresh synthetic ticket
and replay the previously spent ticket. Required result: the spent ticket is rejected after restart,
the fresh ticket succeeds once, and the journal/lease state is durable. A VM reboot without a real
power cut is insufficient for Lane C.

## G4 — clean second PC

Reset `PC-B` to a clean snapshot with no Node, `.env`, copied JSON/key, or borrowed profile directory.
Install only the published candidate, then have an unfamiliar operator repeat enrollment, one
profile/proxy assignment, managed launch, one human smoke, repair, and uninstall. Compare only
sanitized event outcomes and hashes with PC-A. Any inherited state or manual secret transfer makes
G4 `FAIL`/`OPEN` and invalidates the run.

## Cleanup and signoff

Close all Browser/Relay processes through their owned lifecycle, revoke disposable leases, remove
temporary profiles/proxies, reset the snapshots, and scan logs/evidence for secret-like values.
Record cleanup failures explicitly; never hide them under a green aggregate. Required independent
signoffs: operator, network, vendor, second-PC/operations, security reviewer, and release owner.

## Canary preparation (after S4b only)

For Lane A/B, prepare a seven-day calendar only after S4a has frozen the engine and S4b has a signed
tuple. Daily metrics are aggregate counts: successful/blocked launches, replay rejects, proxy/DNS/
WebRTC leaks, vendor refusals, auth/rate-limit errors, crash/recovery outcomes, and operator safety
incidents. Stop the line on any replay acceptance, direct leak, cross-account/profile wire, unknown
vendor lease, secret exposure, or unapproved account use. The workspace owner is the sole rollback
approver; the operator escalates and does not execute an autonomous rollback.
