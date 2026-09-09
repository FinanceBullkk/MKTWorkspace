# Nonblocking Relay Notification Candidate

Updated: 9 September 2026. Publication HOLD. VM and physical MSI acceptance OPEN.

## Reproduced Failure and Correction

Retained 0.3.15 / Relay 17 is rejected for promotion. Native tray > Check Relay showed a
synchronous error box. Authenticated MCP initialize timed out after 12,287 ms while it remained
open. After native OK: initialize HTTP 200 / 351 ms, tools/list 200 / 26 ms, get_runtime_info
200 / 2,243 ms. These measurements came from diagnostic tool outputs. Empty-session Quit later
left no Browser process/control listener and retained the exact Relay process/listener.

Browser 0.3.16 replaces this path with asynchronous `dialog.showMessageBox`. A dedicated notifier
deduplicates pending dialogs, handles presentation failure, and returns independently of dismissal.
Owned-installation checks and explicit-only Relay startup remain unchanged. A pending notice
regression and an exact production API-wiring guard are included in the committed installer suite.
Native responsiveness while the replacement dialog is open remains a required VM check.

## Frozen Source

- Browser: `a5a67320b15cc4bf445260a923e65f4d14ada260`, tree `4127b5187a2378b58ca5d1194d75310cf065d962`.
- Web metadata: `3e5ecd91167747e54143a10b5f8a45bab9a5711a`, tree `7bf7e78cb84ad4568abb2eb8f66e1e79e252e33d`.
- Candidate ID: `20260909-browser-0.3.16-relay-17-nonblocking-relay-cft`.
- Relay 17 is retained byte-for-byte from `78a8a84`; no Relay rebuild in this correction.
- Source commits are local only. No push, deployment, artifact upload or publication.

Build/evidence root: `D:/mkt-relay-notice-fix-20260909`.
Two Browser checkouts have independent dependencies and generated outputs. The clean Web sibling
also supplies the new quality/fixture runtime. Contracts use a separate clean checkout under
`E:/MKTWorkspace/local-test-artifacts/relay-notice-contracts-20260909/MKTTool`.

## Validation

- Source Browser notification/companion/tray: 24/24 PASS; version coherence: 5/5 PASS.
- Source Browser full lint/typecheck: PASS. Web metadata: 67/67 PASS; full lint: PASS.
- Frozen Browser A quality: seven command exits PASS. The explicit live Windows machine integration
  test is intentionally skipped outside the disposable VM; it is OPEN here, not a product PASS.
- Browser A/B installer packaging and normalized comparison: PASS, 129 files, zero differences.
- Web security/database contracts: PASS. Initial Web quality: FAIL (4 timeout/cleanup cases); R2 PASS.
- Signed sequence 20 and exact five-artifact verification: PASS. VM activation/lifecycle: OPEN.
- Physical MSI: owner-run checklist after exact VM acceptance; publication remains HOLD.

Exact retained installer: `D:/mkt-relay-notice-fix-20260909/candidate/installer.exe`;
SHA-256 `fd2617b06be6ba5de0b8797d07d528c81537e60cacb1d25aefad2b44c9863eb4`.
Frozen manifest SHA-256: `b63903ca0d26567950ece333ea4a1c38352e6900c3d0fe3a7dcde92b059f638a`.
VM bundle SHA-256: `c1075ffa9454cf2e3bb23c7de203e019b0f22b3908849ad716ca9826f5294359`.
Sequence 20 permits fresh state 0 only; existing nonzero MSI activation requires a reviewed transition.
The installer remains Authenticode-unsigned; signed compatibility metadata is a separate signature.

The first frozen Web run passed 2,164 tests and failed four in
`vault-delete-owner-guard.database.test.ts`: a 5-second test timeout, two 10-second hook timeouts,
then a duplicate synthetic user. Tests are serial; timed-out asynchronous cleanup can continue into
the next test. The PostgreSQL log records a concurrent 52.930-second checkpoint while installer
packaging was also active. That is environmental evidence, not definitive attribution of the first
timeout. No ownership assertion or timeout is relaxed. The unchanged commit is rerun from a new
checkout/database with installer builds stopped; retain the original FAIL receipt. The successful
runtime, if verified, will be the separate E: quality-r2 checkout, with its own binding.

R2 finished PASS at 2026-09-09T01:04:24Z: full tests and coverage each pass 2,168/2,168 without
skips, and lint/typecheck/build pass. Quality receipt SHA-256:
`c8e63fdb0e7914acb6af5890a67bf283d955997b6f8cbc63c40fa5191a02846c`.
Coverage: 81.01% statements, 76.7% branches, 82.34% functions, 83.59% lines. Separate PostgreSQL
16 / Node 22 contracts PASS at 01:06:10Z; receipt SHA-256
`b602730b2bc9b05d37afe77dc4b2bfcaa67dd2a9663b5b5cbe402cc8a669c0c1`.
Both temporary test clusters stopped and password files were removed. Fresh observer proxy
preflight on source line 2 passes (SG, valid IP/timezone, no rate limit); private values withheld.

## Host and Fixture Cleanup

The rejected candidate's synthetic session was revoked (one exact session removed, zero remaining).
Its Next/HTTPS fixture processes and dedicated PostgreSQL port 55422 were stopped. Guest shutdown
completed normally. Snapshot `b23b00c2-e8a3-40bf-b3c6-e2d250979dfb` preserves the rejected state.

29 ignored node_modules directories from retired isolated builds were removed, with clean Git
source and retained-installer verification. Source, frozen binaries, evidence and snapshots remain.
Receipts are in `E:/MKTWorkspace/local-test-artifacts/host-disk-recovery-20260909`.

VirtualBox moved the rejected state's offline registered disk to
`D:/mkt-relay-notice-fix-20260909/preserved-dialog-failure-medium.vdi`.
10,624,172,032 bytes, SHA-256 `2250bcd130c5b9efb2f722e7f43d903dc0aa81c6b99511ef6ee6e1c7e134c647`.
Snapshot links/UUID and SHA-256 readback PASS; C: regained about 12 GB. This is a registered VM
snapshot dependency, not disposable build output. Never delete it during artifact cleanup.

## Exact VM Progress - 01:30 UTC

The original clean Defender snapshot was restored with 1 CPU / 4096 MiB. Exact 0.3.16 installation
passes 9/9; independently verified receipt SHA-256:
`6dfc773c9abf399b8151e5ebb23ac1eadde974b9c325b704ed9f0b62fc51a4cd`.
Browser opens automatically; Relay PID 1320 is started. Native Continue/Create profile reaches the
expected pre-activation missing-engine-pin screen. No engine pin or enrollment state is injected.

The pending-notice regression passes natively: Check Relay opens the new asynchronous error notice.
While it remains visibly unanswered, MCP initialize / list / get_runtime_info all return HTTP 200
without RPC/tool errors in 121 / 6 / 1,330 ms. Receipt: `candidate/mcp-dialog-open-native.json`.
The notice remains open after the probe; the tray menu still opens and Open MKT Browser restores
the manager. Closing the manager hides it to tray. Empty-session Quit was clicked at 01:29:37;
settled readback at 01:30:30 shows no Browser process or control listener and the unchanged Relay
PID 1320/listener. Active-profile lifecycle remains OPEN.

Earlier readback helpers enumerated only ports 47821 and 9333; their absent 47822 entry cannot prove
MCP was absent. The helper now includes 47822. First baseline probe and two runtime observations
timed out in SSH banner/transport before producing a result; they are OPEN, not MCP failures.
VirtualBox logged one AHCI reset; transport subsequently recovered. Host C: reserve was about
6.4 GB at 01:26 UTC. Keep monitoring resources; no heavy builds are active.

Fresh fixture runtime binding passes for the verified R2 checkout (42,842 entries), binding SHA
`e6cb7b6d1566e9f6f3552e55c8e4d4ddd30a2593a43a45e55f9f6b49aeb513af`.
Dedicated PostgreSQL17 on 55423, Next on 38117 and private HTTPS on 443 are running. Synthetic ADMIN
session is active and must be revoked at cleanup. Guest-only CA/hosts configuration passes at
01:27:37 with HTTPS 200 and normal TLS validation; host trust is unchanged. Display AC timeout is
disabled only in this disposable guest for observation. Clean snapshot restoration removes both.
Cold shutdown/power-on completes. The first early-login Defender readback was false while services
were starting; the settled 01:34:13 readback has Defender/real-time protection true, Browser at tray,
MCP 47822 and Relay 47821, both with normal process priority. Limited-token CA fixture passes, old
Relay PID 6040 replaced by verified PID 5656 with process-only CA; receipt SHA-256
`8a181a73fd0748c2c8e6100c617c071bd0a64d5d99e6c7796aacdfd785c53d00`.

Supported Web PC confirmation/enrollment and first-device operator-key bootstrap complete.
Sequence 20 is submitted through the Web confirmation at 01:38. Five artifacts stage, owned
Browser/Relay stop, and the CFT runtime extracts. Activation pauses inside the old uninstaller:
the first elevation attempt fails with the native administrator-approval notice; no UAC acceptance
was observed for that attempt. Dismissing the notice lets the installer retry. At 01:46 a native UAC
prompt is observed, its exact signed Windows PowerShell command matches the bundled firewall
script/owned CFT and Cloak paths, and approval is provided. Activation continues. Preserve this
interrupted attempt; do not call staging or a helper process alone activation PASS.

## Activation Smoke Failure - 01:52 UTC

After the exact uninstall/install firewall UAC approvals, activation reaches `smoke` at 01:49.
The helper then exits without promoting sequence 20; Browser and Relay remain stopped. This
activation attempt is FAIL. A separately authorized diagnostic run at 01:51:51-01:52:12 launches
the exact installed Browser and CFT with captured stderr. It exits 1 because the browser-page
response from `https://ipapi.co/json/` is not JSON (prefix `ipapi.co\nP`). The protected update
state hash is unchanged. Receipt: `candidate/packaged-smoke-diagnostic.json`.

Network/TLS/challenge and page-read timing are under diagnosis. Host curl success does not prove
browser-page egress. No certificate bypass, profile proxy replacement, pin injection, candidate
rebuild or promotion has occurred. Physical MSI and publication remain HOLD.

## Confirmed Diagnosis and Replacement - 02:10 UTC

The exact packaged sidecar captures HTTP 403 from ipapi with `securityState=secure` and issuer
`WE1`. A separate disposable CFT diagnostic displays the Cloudflare security-verification page.
The same engine (`79832d1e60cbad9323c07339f9608bc0ce93cb9242b9b5481c04a0c536720980`) and proxy
reach `https://api.ipify.org/?format=json`: HTTPS 200, JSON, valid IP matching the independent Node
proxy probe. This is diagnosis, not candidate acceptance. Receipts:
`candidate/packaged-smoke-network-diagnostic.json` and `candidate/browser-ip-services.json`.

Browser 0.3.17 switches the browser-page observer to ipify, retains exact egress comparison,
rejects redirects/invalid addresses and sanitizes malformed-response errors. Nine added tests fail
before the correction; all 12 smoke cases pass afterward. Full Browser lint/typecheck, five version
coherence tests and 67 Web metadata tests pass. Frozen source commits:
Browser `26bc2d839975082cb4f0b2ee437c9c319d71d94e`,
Web `bb378ae8f6fd27612654da1b93554e97869e0827`.

The exact fixture session was revoked (one removed, zero remaining); Next, HTTPS, SSH tunnel and
dedicated PostgreSQL 55423 were stopped. VM shut down normally. Failure snapshot
`bcb0392f-31e4-4ea5-b6c4-684abcc7b190` retains 0.3.16 unpromoted smoke state. No source push,
deployment, artifact upload or publication occurred. New evidence root:
`D:/mkt-ip-observer-fix-20260909`. Sequence 21, A/B and VM/MSI gates remain OPEN.
