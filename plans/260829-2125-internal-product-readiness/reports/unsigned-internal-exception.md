# Unsigned Windows internal-only exception

Candidate: `20260830-browser-0.3.13-relay-16`
Status: DECIDED CONTROL / NOT ACTIVE FOR DISTRIBUTION
Applies to: Lane A and Lane B only
Expires: `2026-10-28T20:50:00.000Z` (`2026-10-29 03:50 ICT`)

## Scope

The workspace owner approved a 60-day exception from the S3 draft-build evidence cutover. It does
not assert Authenticode, does not authorize Lane C or real accounts, and does not override the clean
VM, exact-artifact, vendor, identity, network, recovery, operator, or canary gates. A later frozen
build must generate and persist the same expiry in its provenance; rebuilding does not silently
extend this exception.

## Distribution allowlist

- Channel: authenticated MKTTool setup route only, after the deployment-owned approved tuple matches
  the full installer metadata and size.
- Artifact: only the immutable candidate hash in the signed release manifest; no mutable-key
  overwrite, email attachment, public link, chat upload, or removable-media copy.
- Recipients: workspace owner plus owner-named internal pilot operators. Operator rows remain blank
  until the owner supplies names.
- Operations: controlled Windows internal pilot, one profile at a time, synthetic/disposable
  accounts, and human login/input only.

| Role | Named operator | Status |
|---|---|---|
| Pilot operator 1 |  | OPEN — owner input required |
| Pilot operator 2 |  | OPEN — owner input required |
| On-call operator |  | OPEN — owner input required |

## SmartScreen operator procedure

1. Start only from the authenticated setup page and compare the displayed installer SHA-256 and
   Browser/Relay tuple with the release record before downloading.
2. Confirm Windows shows the expected unsigned-publisher warning. Do not disable Defender,
   SmartScreen, antivirus, or system policy.
3. Select **More info** and **Run anyway** only for the exact allowlisted hash. If the filename,
   size, hash, version, source, engine pin, or Relay tuple differs, stop and report an incident.
4. Capture the warning and final hash result on the clean disposable VM without recording user,
   device, credential, proxy, or account secrets.
5. Treat any second/unexpected warning, changed bytes, missing metadata, expired exception, or setup
   route refusal as stop-the-line. Do not obtain the file through another channel.

## Ownership and expiry behavior

| Control | Owner | State |
|---|---|---|
| Release owner | Workspace owner | DECIDED |
| Security approver | Workspace owner | DECIDED |
| Technical approver | Codex reviewing agent, delegated | DECIDED |
| Incident owner | Workspace owner | DECIDED |
| Rollback approver | Workspace owner only | DECIDED |
| Named operators/on-call |  | OPEN — owner input required |
| Clean-VM SmartScreen capture |  | OPEN — external VM gate |

The metadata reader rejects an absent or expired `signing-exception-expires-at` value both when it
reads the object and immediately before serving bytes. Expiry is automatic and fail-closed; a new
exception requires a new explicit owner decision and a new frozen tuple.
