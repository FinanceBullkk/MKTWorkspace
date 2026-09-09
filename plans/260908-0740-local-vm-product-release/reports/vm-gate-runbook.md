# Local Candidate VM Gates

Prepared only. No VM connection, start, restore, transfer, install or uninstall occurred during bundle preparation.
No private keys or proxy credentials are included. Source scripts under `local-test-artifacts/vm` are unchanged.

## Prerequisites

- Disposable VirtualBox guest, interactive logged-in user `mktqa`, elevation available, Defender enabled.
- Host-recorded restore/readback evidence for snapshot `326357d7-35b1-4c91-92ca-856fb0f35e9b` before clean and separately before repair.
- Guest destination exactly `C:\Users\mktqa\mkt-local-release-20260908\vm-gate`.
- Verify the host bundle-descriptor SHA-256 sidecar; pass that independently obtained value as `-ExpectedBundleSha256`.
- Use the already approved SSH endpoint and port. This bundle does not guess them or start the VM.

## Transfer And Run

The following are commands for the coordinator to execute later, not executed preparation steps.
Set `$taskGuestTarget` to the approved `mktqa@host` and `$taskGuestPort` to the approved forwarded SSH port.
Create the destination parent if absent; stop if it already contains unrelated files.

```powershell
$taskBundle = 'E:\MKTWorkspace\local-test-artifacts\local-release-20260908\vm-gate'
$taskKey = 'E:\MKTWorkspace\local-test-artifacts\vm\mkt-vm-key'
$taskBundleHash = (Get-FileHash -LiteralPath "$taskBundle\bundle-descriptor.json" -Algorithm SHA256).Hash.ToLowerInvariant()
scp -i $taskKey -P $taskGuestPort -r $taskBundle "${taskGuestTarget}:C:/Users/mktqa/mkt-local-release-20260908/"
```

Inside the guest, substitute the independently obtained host hash:

```powershell
$taskGuestBundle = 'C:\Users\mktqa\mkt-local-release-20260908\vm-gate'
powershell.exe -NoProfile -File "$taskGuestBundle\run-local-release-installer-gate.ps1" -Gate clean -ExpectedBundleSha256 <HOST_BUNDLE_SHA256> -SnapshotId 326357d7-35b1-4c91-92ca-856fb0f35e9b -VerifyOnly
powershell.exe -NoProfile -File "$taskGuestBundle\start-local-release-installer-gate.ps1" -Gate clean -ExpectedBundleSha256 <HOST_BUNDLE_SHA256> -SnapshotId 326357d7-35b1-4c91-92ca-856fb0f35e9b
```

1. Clean: restore the snapshot, record host restore/readback, transfer, run clean, collect `clean-*` files. Require 9/9 checks plus bound receipt PASS.
2. Repair: restore the same clean snapshot again, record host restore/readback, transfer, run with `-Gate repair`, collect `repair-*` files. Require 13/13 checks plus bound receipt PASS.
3. Uninstall: retain the successfully repaired guest, run with `-Gate uninstall`, collect `uninstall-*` files. Require 15/15 checks plus bound receipt PASS.

Do not reuse existing receipt paths. Gate tasks are one-shot with no recurring trigger. A timeout/failure requires inspection of remaining guest processes before reuse; preparation does not authorize broad cleanup.

## Evidence Boundaries

The wrappers verify source commit/tree declarations, bundle input hashes, installer/ASAR/Relay tuple and complete gate matrices. The snapshot ID is a required declared restore target, not a guest-observed fact; retain separate host evidence.
The copied clean script only relabels the former published-hash wording as an unpublished candidate hash. Verification logic remains unchanged; source/copy hashes and the transformation are recorded in the bundle descriptor.
These are installer lifecycle gates, not evidence of runtime CFT identity, network isolation, real-account approval, publication or overall release readiness.

## Preparation Plan And Checks

Plan: preserve signed/history bytes; validate selected b/c build evidence; add factual correction and exact Relay disk aliases; bind new VM scripts; run read-only hash and parser checks.
VM execution remains OPEN until the coordinator runs and collects the gates. No unresolved bundle configuration question except the already approved SSH endpoint/port, supplied by the coordinator.
