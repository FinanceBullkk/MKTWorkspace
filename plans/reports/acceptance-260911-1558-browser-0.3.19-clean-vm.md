# Acceptance — MKT Browser 0.3.19, clean-VM run

Run 2026-09-11, 08:12–09:05 UTC (15:12–16:05 +07). Agent-driven, VirtualBox guest on the owner's
dev host. **This is VM evidence only.** Not Actions, not deploy, not human acceptance, not
independent physical hardware.

## Verdict

**The uninstall defect that 0.3.19 exists to fix is fixed, confirmed on a clean VM.**
Publication gate `HOLD_PENDING_VM_AND_MSI` — the VM half is now satisfied; MSI unchanged.

Two real defects were found in the process, both of them in the *repair* path rather than the
uninstall path this candidate was cut for. Both are fixed in 0.3.20 (MKTBrowser#23):

1. The repair/upgrade preflight refused while the Relay the install starts was running — a WOW64
   process lookup, the same class as the uninstall defect #21 fixed, in a script #21 did not touch.
2. The unpinned-engine error advised "run installer repair", which cannot create the pin.

Note on scope: two findings recorded in the first pass did **not** survive verification — a "blank
window" (a VM display artifact) and "the engine never provisions" (correct behaviour on an unpaired
guest). Both corrections are marked inline below.

## Fixture

| | |
|---|---|
| VM | `mkt-phase5-nvme-20260908` @ snapshot `nvme-stable-clean-20260908` |
| Lineage | full clone of `326357d7` = `clean-with-ssh-defender-20260825` |
| Guest | Windows 11 Home build 26200, x64, 3.98 GiB, 2 vCPU |
| Defender | **live**: RealTimeProtection True, engine 1.1.26080.3, signatures 1.459.105.0 (2026-09-07) |
| Baseline | product never installed — no install dir, no Relay dir, no MKT uninstall entries, no Node |
| Access | `ssh -i local-test-artifacts\vm\mkt-vm-key -p 2222 mktqa@127.0.0.1`; interactive work dispatched into session 1 via `schtasks /it` |

Defender signatures are *newer* than the snapshot description records, i.e. it self-updated — the
AV was genuinely running, not a stale fixture.

Host policy respected: RAM measured before start (owner freed memory first; 5778 MB available at
start, 3592 MB available with the VM running). No owner applications were closed by the agent, and
no builds were launched while the VM ran.

## Chain of custody

Retained installer hashed on the host **and again inside the guest** after transfer:

```
sha256 3346143bf52971a552bee4acdd12b2d4439c294b4a5801c9d54743d9595f3a54
size   146050951
```

Both match the published object `MKTBrowser-20260911-browser-0.3.19-relay-17-uninstall-host-bitness-cft.exe`.
Not rebuilt. The bytes under test are the published bytes.

## Receipts bound to release hashes

| Component | Expected | Observed in guest | |
|---|---|---|---|
| installer | `3346143b…f3a54` | `3346143B…F3A54` | PASS |
| `app.asar` | `8fed20cd…773c3` | `8FED20CD…773C3` | PASS |
| Relay version | 17 | `relay-installed-version.txt` = 17; `activeRelayVersion` 17; status page "MKTTool Relay - version 17" | PASS |
| control contract | v4 | runtime `contractVersion: 4` | PASS |
| profile schema | v3 | runtime `profileSchemaVersion: 3` | PASS |
| app version | 0.3.19 | `MKTBrowser.exe` 0.3.19; runtime `appVersion 0.3.19` | PASS |
| engine CFT `152.0.7977.64` | pinned | not provisioned: guest never paired, so no activation was dispatched | NOT EXERCISED |

Anti-downgrade control present: `relay-security-state.json` carries `rollbackFloor: 17`,
`migrationStage: activated`, DPAPI-protected `device-private-key`.

## Install and first run — PASS with a caveat

Interactive wizard, per-user default ("Only for me"), install to
`%LOCALAPPDATA%\Programs\MKTBrowser`. One UAC elevation for PowerShell (the Relay step), approved.

- 130 files, 438.3 MB, matching the wizard's 438.0 MB estimate
- Startup contains **`MKT Browser.lnk` only** — single-entry takeover works
- HKCU uninstall entry present with `/currentuser`; **no HKLM entries** — correct for per-user
- Relay auto-started by the install; both DPAPI secrets created
- Relay listening 47821, Browser MCP listening 47822, both 127.0.0.1
- Browser MCP fully functional: `tools/list`, `get_runtime_info`, `create_profile`, `list_profiles`
  all answer correctly; a profile was created with a coherent generated fingerprint

**Caveat (CORRECTED 2026-09-11 18:20 — see note below):** during this run the Browser window was
screenshotted twice, 80 s apart, and appeared **entirely black**. That was recorded here as a
product defect. It is not one. A later reproduction on a fresh restore of the same snapshot reached
the normal onboarding screens and then the engine-error modal, with no code change. The earlier
black frames are attributed to this VM's display pipeline, which in the same session also failed
`VBoxManage screenshotpng` outright (`E_FAIL`) and silently stopped delivering injected scancodes.
**A screenshot from this fixture is not on its own evidence that the product drew nothing.**

## Uninstall with the Relay running — PASS (the headline)

The 0.3.18 defect had two halves: the uninstaller did not stop the Relay it owns, and plain `/S`
returned exit 0 while removing nothing. Reproduced here under the *same* condition — Relay left
deliberately running, as the install leaves it:

```
[before]  installFiles=148 relayExe=True hkcuEntries=1 startupEntries=1 relayRunning=1
"Uninstall MKTBrowser.exe" /S   -> exit 0
[after]   installFiles=0   relayExe=False hkcuEntries=0 startupEntries=0 relayRunning=0
```

Both halves fixed: it stopped the Relay it owns, and exit 0 now corresponds to an uninstall that
actually happened.

## Cleanup — PASS

Removed: install directory (entirely), Relay executable, HKCU uninstall entry, Startup entry,
desktop shortcuts, Start Menu entries. No MKT processes, nothing listening on 47821/47822.
No HKCU or HKLM (incl. WOW6432Node) residue.

Deliberately preserved, as designed: `relay-config.json`, `relay-device-key.json`,
`relay-installed-version.txt`, `relay-security-state.json`, both `protected-secrets\*.dpapi`,
and user profiles (`profiles.db`).

## OPEN 1 — the engine error misdescribes itself and advises a remedy that cannot work

*(Scope corrected: this section originally claimed the engine "never provisions" as a defect. It
does not provision on an unpaired guest by design — see the correction below.)*

Root-caused deterministically, not inferred. Main-process stderr:

```
Chromium bootstrap failed: Error: This MKT Browser build has no verified compatibility-set
engine pin. Run installer repair instead of resolving an upstream latest version.
```

Mechanism confirmed: `%LOCALAPPDATA%\MKTTool\compatibility-updater` (holding `active-engine.json`)
**does not exist**. `ChromiumBootstrap.fetchManifest()` refuses to resolve an upstream "latest"
without a verified pin — correct fail-closed behaviour. Consequences:

- `get_runtime_info` reports `engine: {kind: "cft", version: null, status: "error"}`
- `launch_profile` returns `ENGINE_UNAVAILABLE: The browser engine is not ready (error)` in ~70 ms,
  no download attempted
- the pinned engine `152.0.7977.64` is therefore **never exercised on this fixture**

**CORRECTED 2026-09-11 18:45 — this is not a defect at all.** The release runbook is explicit:
*"install -> pair -> ADMIN `repairMissingState`. Only the supported verified activation creates the
engine pin."* `repairMissingState` is an ADMIN-authorised compatibility update dispatched to a
**paired device** (`MKTTool src/lib/release/compatibility-update-actions.ts`). This VM was never
paired — the Relay page said so plainly ("configuration INCOMPLETE") — and no activation was ever
dispatched to it. An unpaired guest therefore has no engine **by design**. This item is the same
gap already recorded under "Not exercised — signed CFT activation", not a second finding.

What remains a real defect is only the message:

1. **The advised remedy cannot work.** The error says "Run installer repair". Repair was run with
   the Relay stopped first (confirmed `relayRunning=0` before dispatch). Observed afterwards by
   direct query: 148 files present, Relay running again under a new PID, and
   `compatibility-updater` **still did not exist**. Repair cannot deliver a pin that only the update
   channel carries. The message sends the operator down a dead end.

   *Evidence limit:* the repair run's own installer **exit code was not captured** — the wrapper
   script did not flush past the dispatch line, and the surrounding task's "exit 0" is the SSH
   wrapper's, not the installer's. The post-state above was verified directly and does not depend
   on it. (The separate earlier silent *reinstall* did return a captured `installer exit code: 0`.)

   Confirmed after repair by relaunching and re-querying: the same
   `no verified compatibility-set engine pin` stderr, `get_runtime_info` still
   `engine: {kind: "cft", version: null, status: "error"}`, `compatibility-updater` still absent.
   Repair changes nothing about the engine.
2. **The failure is surfaced, but described wrongly.** *(Corrected: this item originally read "the
   failure is invisible". That was wrong — see the corrected caveat above.)* A reproduction run
   drove the UI and the `ChromiumBootstrapModal` does appear, after the two onboarding steps, as
   **"Setup failed — We could not download the Chromium binary."** carrying the engine-pin message
   and a **"Retry download"** button. Nothing was ever downloaded: the build refused to resolve an
   engine at all. So the operator is told a network-shaped story about a failure that is not
   network-shaped, and offered a retry that re-runs the same refusal.

## OPEN 2 — repair is blocked by the Relay that the install starts

Interactive repair, Relay running (the state the install leaves):

```
MKTTool Relay is running, but its executable ownership could not be verified.
Safe action: close it in Task Manager, then retry.
MKT Browser did not install or remove a program or profile data.
```

It fails closed and says so plainly — that part is good, and better than 0.3.18's silent `/S`.
But note the inconsistency: **uninstall stops the running Relay successfully, repair refuses to.**
The same running Relay is fatal to one path and handled by the other. With the Relay stopped,
repair completes normally. So the ordinary sequence install → use → repair hits a wall that
install → use → uninstall no longer does.

Whether "ownership could not be verified" is a residue of the WOW64/host-bitness class fixed for
uninstall in PR #21, or a separate deliberate check, was not determined here.

## Not exercised — stays OPEN

- **Signed CFT activation.** Cannot run: compatibility manifest sequence 23 unpublished, and
  `sign-compatibility-manifest.ts` is refused by the auto-mode classifier. Agent cannot unblock it.
- **Proxy failure / recovery.** Cannot run: requires a profile-driven launch, and every launch
  returns `ENGINE_UNAVAILABLE`. Blocked by OPEN 1, not skipped by choice.
- **Pinned-engine verification.** The candidate's engine was never downloaded, so the pinned build
  was not verified on the clean VM either. The host run could not do it (host had `…83`, candidate
  pins `…64`); this run could not do it for a different reason.
- **Browser-page network, unfamiliar-operator, second-PC, seven-day canary.** A VM on this host is
  not independent physical hardware. All remain OPEN regardless of this result.

## Method notes for the next session

- PowerShell 5.1 turns native stderr into a terminating `NativeCommandError`; run `schtasks` through
  `cmd /c "… 2>&1"` or the dispatcher dies on a harmless "task not found".
- SSH lands in a non-interactive session and **cannot see session 1 window titles**. Dispatch UI work
  with `schtasks /it` and target windows from inside session 1.
- SendKeys reaches a wizard's main window but **not its modal child**, and not the UAC secure desktop.
  UAC needs `VBoxManage controlvm … keyboardputscancode` (Left `e0 4b e0 cb`, Enter `1c 9c`).
  Scancode injection stopped landing later in the run once the guest display slept —
  `screenshotpng` returned `E_FAIL` at that point.
- `Start-Process -Wait` on this installer does not return promptly, and PowerShell over SSH buffers
  until exit — a task's "exit 0" is the SSH wrapper's, **not** the installer's. Read guest state
  directly rather than trusting the wrapper.
- Launching the Browser from the SSH (session 0) context produces Chromium
  `os_crypt_win` DPAPI errors (`0x8009000B` decrypt, `0x5` encrypt). Treated here as an artifact of
  the non-interactive session's user context, **not** reported as a product defect — the
  session 1 install-launched instance was the one used for first-run observations.
- MCP arguments must be literal JSON — PowerShell's `@{}` serialises to `[]` and the server rejects
  it. `launch_profile` takes `profile_id`, not `id`.

## Unresolved questions

1. Should the engine-pin error stop advising "run installer repair"? Repair provably cannot supply
   the pin. What *is* the operator's correct action when the compatibility set has not been published?
2. Should repair stop the Relay it owns, the way uninstall now does? If the refusal is deliberate,
   the message should say "close it" without implying an ownership-verification failure.
3. Is "executable ownership could not be verified" in the repair path the same host-bitness class
   that PR #21 fixed for uninstall?
4. Should the engine-error modal still say "We could not download the Chromium binary" and offer
   "Retry download" when the build refused to resolve an engine and downloaded nothing?
5. Clean-VM acceptance cannot reach the engine without pairing the guest to MKTTool Web and
   dispatching an ADMIN `repairMissingState` to it. Is pairing a disposable guest in scope for the
   gate? If not, the pinned engine can never be exercised there, and the gate should say so rather
   than leaving the step open every run.
