# VM Gate R2 Runbook

## Diagnosis And Scope

The r1 guest clean script produced 9/9 raw checks, but its wrapper correctly remained FAIL because `childExitCode` was null and the wrapper could not establish successful child completion. Preserve that result; do not promote it retrospectively.

Host Windows PowerShell 5.1.26100.9168 reproduces null ExitCode after Start-Process/WaitForExit/Refresh for children exiting both 0 and 7. Acquiring Process.Handle before the wait returns exactly 0 and 7 with matching stdout/stderr. R2 applies that proven handle-lifetime fix, captures the code before Dispose, and rejects null explicitly.

Original `vm-gate` files and `vm-clean-first` evidence are unchanged. R2 also archives the previous descriptor, wrappers, raw/bound failure evidence and logs under `vm-gate-r2/prior-r1`. Host-only synthetic process proof is not a VM gate pass.

## Transfer

Host bundle: `E:\MKTWorkspace\local-test-artifacts\local-release-20260908\vm-gate-r2`.
Guest bundle: `C:\Users\mktqa\mkt-local-release-20260908\vm-gate-r2`.
Use the already approved SSH target/port and the existing `local-test-artifacts/vm/mkt-vm-key`; no credentials are included in this bundle.

```powershell
$taskBundle = 'E:\MKTWorkspace\local-test-artifacts\local-release-20260908\vm-gate-r2'
$taskKey = 'E:\MKTWorkspace\local-test-artifacts\vm\mkt-vm-key'
$taskBundleHash = (Get-FileHash -LiteralPath "$taskBundle\bundle-descriptor.json" -Algorithm SHA256).Hash.ToLowerInvariant()
scp -i $taskKey -P $taskGuestPort -r $taskBundle "${taskGuestTarget}:C:/Users/mktqa/mkt-local-release-20260908/"
```

## Run In The Guest

Every initial PowerShell invocation must include `-ExecutionPolicy RemoteSigned`. Without it, Restricted may block the script before any gate runs. This is a process-scoped invocation flag; do not change machine/user execution policies.

```powershell
$taskGuestBundle = 'C:\Users\mktqa\mkt-local-release-20260908\vm-gate-r2'
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "$taskGuestBundle\run-local-release-installer-gate.ps1" -Gate clean -ExpectedBundleSha256 <HOST_R2_BUNDLE_SHA256> -SnapshotId 326357d7-35b1-4c91-92ca-856fb0f35e9b -VerifyOnly
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "$taskGuestBundle\start-local-release-installer-gate.ps1" -Gate clean -ExpectedBundleSha256 <HOST_R2_BUNDLE_SHA256> -SnapshotId 326357d7-35b1-4c91-92ca-856fb0f35e9b
```

1. Restore snapshot `326357d7-35b1-4c91-92ca-856fb0f35e9b`, retain host restore/readback evidence, transfer r2, run clean; require a new bound PASS plus 9/9 checks.
2. Restore the same blank snapshot separately, retain evidence, transfer r2, run `-Gate repair`; repair self-installs the baseline before damage injection. Require a new bound PASS plus 13/13 checks.
3. Retain the successful repaired state and run `-Gate uninstall`; require a new bound PASS plus 15/15 checks.

Tasks use the new `mkt-local-release-r2-{gate}-20260908` namespace, no recurring trigger and a 26-minute upper bound. Existing evidence is never overwritten. On timeout/failure inspect remaining guest processes before reuse; do not perform broad cleanup.

## Evidence Limits

All VM gates are OPEN at r2 preparation. Snapshot identity is a declared required target, corroborated separately by the host. Installer hashes identify an unpublished candidate, not a published release. Runtime engine/network/real-account and release-promotion gates remain separate. No guest operations or product-source changes occur during this fix.
