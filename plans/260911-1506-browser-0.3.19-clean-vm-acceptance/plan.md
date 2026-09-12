# Browser 0.3.19 — clean-VM acceptance

Status: **run complete 2026-09-11 ~16:05 +07**. Report:
`plans/reports/acceptance-260911-1558-browser-0.3.19-clean-vm.md`.

## Fixture

VM `mkt-phase5-nvme-20260908` @ snapshot `nvme-stable-clean-20260908` (4 GiB, 2 vCPU, NVMe).
Full clone of `326357d7` = `clean-with-ssh-defender-20260825`; Defender verified live in-guest
(engine 1.1.26080.3, signatures 1.459.105.0, real-time on).
Guest access: `ssh -i local-test-artifacts\vm\mkt-vm-key -p 2222 mktqa@127.0.0.1`.

## Binding hashes

| Component | Value | Result |
|---|---|---|
| installer | `3346143bf52971a552bee4acdd12b2d4439c294b4a5801c9d54743d9595f3a54` | matched in-guest |
| browser `app.asar` | `8fed20cde5d71abb254f82b6e2823ef2c73f715bdbf5d04470be02d4da5773c3` | matched in-guest |
| relay v17 | `d8bf25dc…59cf` (zip) | version 17 confirmed installed |
| control contract v4 | `9b18ce41…cb91` | runtime reports contractVersion 4 |
| engine CFT 152.0.7977.64 | `b0db25de…8004` | **never provisioned — not verified** |

## Steps

- [x] 1. Restore snapshot, boot, confirm Defender and never-installed baseline
- [x] 2. Copy exact installer, re-hash in-guest, install
- [x] 3. First run — starts, contract v4 / schema v3, MCP functional; onboarding then the
      engine-error modal render correctly (an earlier "black window" reading was a VM display artifact)
- [x] 4. Packaged Relay lifecycle — v17 installed, started by install, serving on 47821, DPAPI keys
- [ ] 5. Proxy failure/recovery — **BLOCKED** by engine unavailable
- [x] 6. Repair — reinstalls with Relay stopped (installer exit code not captured); **refuses with
      Relay running**; does not deliver engine pin
- [x] 7. **Uninstall** — **PASS**, both halves of the 0.3.18 defect fixed
- [x] 8. Cleanup — install/registry/Startup/shortcuts removed; operator identity + profiles preserved
- [x] 9. Report written

## Outcome

**Uninstall defect fixed and confirmed on a clean VM.** The VM half of
`HOLD_PENDING_VM_AND_MSI` is satisfied.

Two OPEN items (detail in the report):
1. Engine never provisions — no verified compatibility-set pin (sequence 23 unpublished). Blank
   window with no message, and the advised remedy "run installer repair" provably does not work.
2. Repair is blocked by the Relay the install itself starts, while uninstall handles it fine.

Still OPEN regardless: signed CFT activation, proxy failure/recovery, pinned-engine verification,
browser-page network, unfamiliar-operator, second-PC, seven-day canary.

## Next

Task 2 (operator promotion — set `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` on Railway) was
**not** started. It is gated behind this acceptance and is the owner's call given the OPEN items.
