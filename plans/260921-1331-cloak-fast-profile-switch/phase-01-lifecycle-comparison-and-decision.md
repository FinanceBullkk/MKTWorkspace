# Phase 1 lifecycle comparison and adapter decision

Date: 21 September 2026. Scope: source analysis only; no new CloakBrowser launch.

## Frozen inputs

- MKTBrowser baseline: `06fe257c7ee615b156d776cfd10d415a933c23b2`.
- MKTTool baseline: `3461b58f5e0e6e30221354e1b29b945e84c5fdf8`.
- Node: `22.23.2`; Yarn: `4.5.0`; Electron: `42.8.1`.
- Product control stack: `chrome-remote-interface ^0.33.3`; MCP SDK `^1.0.4`.
- Successful diagnostic stack: `cloakbrowser 0.5.10`; `playwright-core 1.62.0`.
- CloakBrowser runtime: `151.0.7922.108.6`, active pin sequence 2.
- Archive SHA-256: `5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37`.
- Executed `chrome.exe` SHA-256:
  `484ab0e66600a3b0a8c4848ccaef38ce65b69e87687a68a3b2b68d5db1f0455e`.
- Immutable SDK evidence hashes:
  - `verify-official-sdk-reuse.cjs`:
    `7ef6aca79e0305468100b8bda0a0325271e12105edd98aa309cc728588a6e4fc`.
  - `official-sdk-reuse.json`:
    `fb010fe5a78067476f09bb108fd80a886c7b5de57a8468d2281714184069c006`.
  - `debug-260921-1314-cloak-free-seat-reuse.md`:
    `104f93a5e973c487ae02fcbd95a33ef0078fe7c4651c07813f12358a3dcf4373`.

## Compared lifecycle responsibilities

| Responsibility | Successful SDK experiment | Existing application path | Decision |
|---|---|---|---|
| Executable | Supported local-binary override to the exact pinned runtime | Bootstrap resolves and verifies the installed pinned runtime | Keep application bootstrap and pin enforcement |
| Persistent storage | SDK `userDataDir` per disposable profile | Explicit `--user-data-dir` per owned profile | Keep existing profile directories and seed ownership |
| Native fingerprint | One native `--fingerprint=<seed>` argument | Existing coherent native `--fingerprint-*` arguments; no CDP fingerprint layer for CloakBrowser | Keep existing native configuration unchanged |
| Proxy | Not exercised in the SDK diagnostic | Preflight egress verification, local SOCKS bridge, remote DNS, WebRTC containment, fail-closed launch | Keep existing proxy path; SDK diagnostic cannot prove fidelity here |
| Control transport | Official SDK persistent context | Direct process spawn plus `--remote-debugging-port=0` and owned CDP session | Keep CDP architecture; do not add a production Playwright/SDK dependency |
| Environment | SDK-owned launch environment | Deliberately minimal environment plus required Windows profile variables and licence key | Keep the existing sanitized environment |
| Process ownership | Diagnostic did not request a detached child | Application previously forced `detached: true` on every engine | Use attached ownership only for Windows CloakBrowser fast reuse; retain detached fallback elsewhere |
| Process handoff | SDK context owns its browser lifecycle | Application discovers the primary process by profile data directory when a launcher hands off | Keep discovery and ownership verification |
| Normal close | `context.close()` with a bounded diagnostic deadline | `Browser.close`, 4-second exit wait, `SIGTERM`, `SIGKILL`, then data-directory sweep | Keep the existing close ladder and require verified process exit |
| Capacity | Count before/during/after in the diagnostic | Local pool and durable journal previously relied on fixed cooldown | Add a count-only observer and one desktop coordinator; count is aggregate evidence, not a lease receipt |
| Retry | Exactly one attempt for each profile | Refusal policy already forbids automatic engine retry | Preserve one engine attempt per operator request |

## Decision

Repair the existing launcher. Do not introduce the official SDK or Playwright into production for
this change.

The SDK result proves a supported sequential-reuse path exists, but it does not isolate which
launcher difference caused the earlier refusal. Replacing the driver would also change the control
transport, packaging dependencies, process ownership, proxy path, and native fingerprint surface at
once. The current driver already owns the required persistent-profile, signed-engine, proxy,
authorization, and CDP contracts.

The smallest selected change is therefore:

1. Keep direct spawn, CDP, profile directories, native fingerprint arguments, and proxy setup.
2. Add one count-only capacity observer with bounded timeout, response size, monotonic freshness,
   key-generation invalidation, and single-flight checks.
3. Add one coordinator for local admission, durable reservation, explicit refresh, refusal
   invalidation, and one-attempt launch serialization.
4. Use attached process ownership only on Windows CloakBrowser while fast reuse is enabled.
5. Retain detached ownership for CFT, non-Windows platforms, and rollback mode.
6. Retain conservative cooling/recovery when ownership or capacity cannot be verified.

Rollback is `MKT_BROWSER_FAST_LICENSE_REUSE=0`. It does not change the engine, delete profiles, or
rewrite the durable journal. The cause of the earlier retained session remains `OPEN`; successful
SDK behavior is not claimed as a causal diagnosis.

## Preserved boundaries

- No session-start or session-end API probe.
- No automatic launch queue or retry.
- No key, proxy credential, command line, signed query, or account data in status output.
- Vendor count never proves a specific local lease was released.
- Local policy remains one active profile even when vendor limit is greater than one.
- `license-capacity-v1` remains unadvertised until live integration acceptance.
- Native fingerprint, proxy/DNS/WebRTC, packaged installer, and real-account acceptance remain
  separate gates. `G2-IDENTITY=FAIL` is unchanged.

## Unresolved questions

- Which exact launcher difference caused the earlier retained session remains unknown.
- Product-path P1 -> P2 timing and final vendor baseline remain unmeasured for this implementation.
- Native fingerprint A/B/C, proxy/DNS/WebRTC, packaged installer, second-PC, human acceptance, and
  canary evidence remain open.
