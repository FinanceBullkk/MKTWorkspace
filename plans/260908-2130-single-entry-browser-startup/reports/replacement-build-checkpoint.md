# Replacement Candidate - 9 September 2026

**REJECTED / SUPERSEDED:** 0.3.14 reached signed activation smoke, then failed because Browser
ignored the Relay-installed engine without `current.json` and retried its authenticated URL
without credentials (HTTP 401). Preserve this historical tuple and its failure snapshot
`6bec61e3-f4f2-42c6-942e-d91bdc147417`. The next candidate is 0.3.15 / unchanged Relay 17 under
`D:/mkt-engine-cache-fix-20260909`; no exact VM/MSI acceptance yet.

Publication HOLD pending exact replacement VM acceptance and owner-run physical MSI checks.
Do not distribute rejected Browser 0.3.13 / Relay 16 A.

## Frozen Inputs and Artifact

- Root: `D:/mkt-activation-fix-20260909`.
- Candidate: `20260909-browser-0.3.14-relay-17-activation-repair-cft`.
- Browser source: `cea4611eb01d5e73a1a52040c53b7e8493a76fe7`, tree `38bc8219aa22acc90985954aa05b0e042188232d`.
- Web/source sibling: `a2a321ff69e00d9172d7daf5fcf6352a85021e64`, tree `b4b0c1bca143fdaf6eef518a4020c562a0b7e444`.
- Relay build source: `78a8a84`; the subsequent Web commit only reconciles candidate metadata/tests/docs.
- Exact retained installer: `candidate/installer.exe`, 146047323 bytes,
  SHA-256 `c1c42236c460264dd2662935593bf35a8a1d88974568d035603e14694f9e9408`.
- Relay 17 ZIP: 34289393 bytes, SHA-256 `d8bf25dcb446d779bd5461419ea7562044e280ac1d16592a71a52f156f6359cf`.
- Relay EXE: 92414976 bytes, SHA-256 `827fc9330e5845b13d41827e3c1528439e85ff38bb6ea2ca3b72355b15ccc31e`.
- CFT 152.0.7977.64 archive: 202713690 bytes,
  SHA-256 `b0db25dea445822429d8ebd36d53344cadcd63127308759456964029bbe18004`.
- Signed sequence 18: `candidate/manifest.signed.json`,
  SHA-256 `0dbc81cb6cabdc7b551157618bf31aade7a36dcb6adfe0cf1b81514510845eca`.
  Fresh state 0 only; existing nonzero sequences require a separately reviewed transition.
- EXE remains NotSigned under the recorded internal unsigned exception. Manifest signing does not
  add Authenticode. No upload, publication, deployment or source push in this continuation.

## Verified Local Gates

| Gate | Result | Receipt / limit |
|---|---|---|
| Relay independent A2/B2 | PASS | EXE, ZIP and sidecar byte-identical without normalization; `evidence/relay-comparison.json` |
| Retained Relay packaged smoke | PASS | Real encryption, enrollment, replay/expiry rejection and retirement; `evidence/relay-a2-verify.json` |
| Web full quality | PASS | 2,168/2,168 tests and coverage run, lint, typecheck, production build; `evidence/mkttool-quality-final/receipt.json` |
| Web coverage | PASS | 81.01% statements, 76.70% branches, 82.34% functions, 83.59% lines; no skipped tests |
| Security | PASS | Secret scan and production audit; `evidence/mkttool-security/receipt.json` |
| Database contracts | PASS | PostgreSQL 16.15 / Node 22.23.1 restore and rate-limit contracts; `evidence/mkttool-contracts/receipt.json`; cluster stopped |
| Browser quality | PASS / OPEN | Seven required commands passed; `a2-quality.json`. Explicit Windows machine integration skipped once and remains a VM gate |
| Browser critical coverage | PASS | 121/121, zero skipped; 91.48% lines, 84.23% branches, 91.39% functions |
| Browser independent A2/B2 | PASS | 129 normalized files, zero differences; digest `629120db764c5cce715871e901b6a4d9ef420901e7568330500a60982e2caac6`; `candidate/build-comparison.json` |
| Metadata signature and tuple | PASS | Five exact artifacts, root/delegation/revocation/control-contract checks; `candidate/metadata-verification.json` |
| Replacement VM | IN PROGRESS | Restored `dde2d98e-72d7-466e-8339-fb6b9c552752`; 1 vCPU, 4096 MiB, SATA host I/O cache on; Defender enabled; exact clean installer task started |
| Physical MSI | OPEN | Owner performs checklist after VM gates; existing installation/network context requested |

The first Relay A/B attempt differed because Node SEA embedded absolute checkout paths. Relative
SEA paths fixed this; preserve the failed comparison artifacts. Web's first full run failed five
stale-v16 fixtures (2,160 passed). Browser's first quality run failed its old immutable v16 guard.
All named failures have later passing evidence; no failed receipt was overwritten.

Packaged smoke left one temporary directory because immediate deletion hit a file lock. A later
manual cleanup command was rejected by automatic approval review with `blocked by policy`.
No process from that exact temporary directory was observed afterward; the directory is retained.

## Active VM Fixture

Private host root: `C:/mkt-vm/pilot-activation-repair-private-20260909` (never commit its contents).
Dedicated PostgreSQL port 55421, database `mkt_candidate_activation_repair_test`.
Helpers: `E:/MKTWorkspace/local-test-artifacts/local-release-20260908/pilot-activation-repair`.
Runtime binding covers 42,787 entries and the passed final quality receipt; binding SHA-256
`e0ea1d82d32ec2f149eb7a40aee9c09e84bd46a6a1b4ddfbfa353f16a909e7aa`.
Guest namespace: `C:/Users/mktqa/mkt-activation-repair-20260909/vm-gate`.
Bundle SHA-256: `e11ef7def7ad3c24e45e635bf073c24e8d79b4dc501f38608908caac0cd6b8b1`.
Original failed activation snapshot `214b005b-c37a-40d8-8711-dd75fab1bcfd` remains preserved.

Session revocation, temporary trust/hosts cleanup and shutdown are required after this new trial.
