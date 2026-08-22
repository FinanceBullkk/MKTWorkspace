# P0 Acceptance Matrix

**Baseline run:** `P0-G0-20260821-01`

**Status vocabulary:** `PASS`, `FAIL`, `BLOCKED`, `OPEN`, `INVALID`

**Rule:** A unit test cannot close a packaged Windows, real-proxy, license-service, second-PC, or
human interaction gate.

## Evidence Contract

Every retained run must contain only:

- run ID, source SHA, dirty-diff digest when applicable, artifact SHA-256, and version;
- disposable profile label, proxy label, engine kind, host label, and operator role;
- stable error code, boolean route match, country/ASN label, bounded timing, and cleanup result;
- control/treatment classification, invalidation reason, and final verdict.

Never retain full license keys, proxy URLs, proxy hosts, proxy credentials, observed IP addresses,
MCP tokens, Relay tickets, cookies, credentials, OTP values, raw vendor responses, or page content.
Secret-like error values must be redacted longest-first before they can enter a report.

## Disposable Assignments

| Label | Profile ID | Proxy label | Engine | Status |
|---|---|---|---|---|
| `P0-A` | Pending owner selection | Pending owner selection | CloakBrowser for operational proof; CFT control where specified | `BLOCKED` |
| `P0-B` | Pending owner selection | Pending owner selection; must differ from `P0-A` | CloakBrowser for operational proof; CFT control where specified | `BLOCKED` |

No real account, existing operational profile, or production proxy may be substituted for these
labels during disposable gates.

## G0 Baseline Gates

| Gate | Expected evidence | Current result | Status |
|---|---|---|---|
| `G0-SOURCE` | Workspace, MKTTool, and MKTBrowser branch/SHA/dirty state | Recorded in `baseline-report.md` | `PASS` |
| `G0-OWNERSHIP` | Existing root work is inventoried and untouched | 18 reports plus one audit-plan edit remain user-owned | `PASS` |
| `G0-NODE22` | Node 22 plus adjacent Corepack runs package preflight | Node `22.18.0`, Yarn `4.5.0` | `PASS` |
| `G0-MKTTOOL` | Tests, typecheck, lint, build | 1,878 tests and all compile/build gates pass | `PASS` |
| `G0-BROWSER` | verify:node, typecheck, lint, installer tests | Pass; 217 passed, 1 explicit pre-install machine skip, 0 failed | `PASS` |
| `G0-PACKAGED` | Fresh directory package passes public runtime/lifecycle contract | Pass after preserving the `PROXY_REJECTED` assertion | `PASS` |
| `G0-ARTIFACTS` | Installed, candidate, Relay, installer, and rollback hashes | Final installer, installed Browser, Relay archive entry, and frozen rollback tuple match | `PASS` |
| `G0-PORTS` | `47821` and `47822` owned by expected installed binaries | Exact installed Relay and Browser paths, hashes, versions, and sanitized health verified | `PASS` |
| `G0-PAIRS` | Two approved disposable profile/proxy pairs | Not supplied | `BLOCKED` |
| `G0-REDACTION` | Owner approves this evidence contract | Approved by owner on 21 August 2026 | `PASS` |

## Downstream Gates

| Gate | Minimum evidence | Status |
|---|---|---|
| `G1-INPUT` | Valid cover control, interleaved A/B evidence, three packaged manual-login interactions | `OPEN` |
| `G2-NETWORK` | Two proxies, matching independent/in-browser route, no DNS/WebRTC bypass | `OPEN` |
| `G2-IDENTITY` | Same-profile stability plus cross-profile fingerprint/storage separation | `OPEN` |
| `G3-LICENSE` | Measured vendor schema and confirmed-release-only lease state | `OPEN` |
| `G3-RECOVERY` | Normal close, hard kill, Electron crash, Relay restart, and reboot recovery | `OPEN` |
| `G4-OPERATOR` | Second-PC installer/setup with no manual secret or configuration copying | `OPEN` |
| `G5-CANARY` | Seven days of approved manual use with all metrics inside threshold | `OPEN` |
| `G5-DECISION` | Signed GO or exact NO-GO blockers | `OPEN` |

## Invalidation Rules

A run becomes `INVALID` when any source diff, artifact hash, profile/proxy assignment, engine version,
firewall rule, compatibility tuple, test order, or prewritten control changes. A failed control makes
its paired treatment invalid. Missing cleanup, missing timestamps, secret-bearing output, or an
unexplained process owner also invalidates the run.

Skipped machine and human gates remain `OPEN` or `BLOCKED`; they are never converted to `PASS` from
unit, mock, source-shape, or unpackaged evidence.
