<#
.SYNOPSIS
  Builds the clean Windows VM that gates 2 and 3 need, and the non-signature half of gate 1.

.DESCRIPTION
  See windows-release-gates-runbook.md. Three gates cannot be closed by code:

    Gate 1 (H52) - out of scope for v1 (unsigned release, owner decision 12 Aug), except its
                   second half: the installed binary must not be writable by non-admins.
    Gate 2 (H41/H42) - power loss during an update.
    Gate 3 (H54) - a withdrawn installer on a clean machine.

  "On a clean machine" is the property under test, so the development box cannot stand in. This
  script builds that machine reproducibly, so a botched run is discarded rather than nursed.

.PARAMETER IsoPath
  Windows 11 installation ISO. Microsoft gates the download behind a browser session on purpose -
  fetching it programmatically is refused by their Sentinel anti-bot - so download it by hand from
  https://www.microsoft.com/software-download/windows11 ("Download Windows 11 Disk Image (ISO)").

.NOTES
  VERIFIED on this machine, 17 August 2026 (VirtualBox 7.2.14, Windows 11 Home 26200, Ryzen 5 5600):
    - createvm / modifyvm with efi, memory, cpus, chipset, graphics all apply cleanly
    - the default machine folder is D:\VMs, which has the free space
  NOT VERIFIED, because no ISO was present when this was written:
    - the unattended install itself
  The script therefore checks its own work where it can and stops on the first thing that is not
  what it asked for, rather than reporting success it has not earned.

  Secure Boot: enrollment cannot run before the NVRAM store exists, which is why
  `modifynvram enrollmssignatures` fails with VBOX_E_OBJECT_NOT_FOUND on a freshly created VM.
  Measured, not guessed. It is enrolled after the first boot instead - see the closing note.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$IsoPath,
  [string]$Name = "mkt-windows-gate",
  [int]$DiskGB = 80,
  [int]$MemoryMB = 6144,
  [int]$Cpus = 4,
  [string]$AdminUser = "gateop",
  [string]$AdminPassword = "GateOp!2026",
  [switch]$Recreate
)

$ErrorActionPreference = "Stop"
$VBoxManage = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"

function Invoke-VBox {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  # For a native executable the **exit code** is the truth; stderr is not. VBoxManage prints its
  # progress meter ("0%...10%...") to stderr on the long operations, and PowerShell 5.1 wraps every
  # native stderr line in an ErrorRecord - so under $ErrorActionPreference = "Stop" a command that
  # succeeded aborts the script. Measured while testing: `createmedium` dies this way, `modifyvm`
  # does not, purely because one has a progress meter and the other does not. Relaxing the
  # preference around the call and judging by $LASTEXITCODE is what makes that difference stop
  # mattering.
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try { $output = & $VBoxManage @Arguments } finally { $ErrorActionPreference = $previous }
  if ($LASTEXITCODE -ne 0) { throw "VBoxManage $($Arguments -join ' ') failed with exit code $LASTEXITCODE" }
  return $output
}

if (-not (Test-Path $VBoxManage)) { throw "VirtualBox not found. winget install --id Oracle.VirtualBox" }
if (-not (Test-Path $IsoPath))    { throw "ISO not found at $IsoPath. See the IsoPath note in this file's header." }

# A partially built VM is worse than none: it boots, looks plausible, and is not clean.
$existing = & $VBoxManage list vms | Select-String -SimpleMatch "`"$Name`""
if ($existing) {
  if (-not $Recreate) { throw "VM '$Name' already exists. Pass -Recreate to destroy and rebuild it." }
  Write-Host "Removing existing '$Name'..."
  # Not `| Out-Null`: VBoxManage writes its progress meter to stderr, and piping a native command's
  # stderr in PowerShell 5.1 wraps each line in an ErrorRecord, which $ErrorActionPreference = Stop
  # then turns into a terminating error on a command that actually succeeded. Assigning the output
  # instead keeps stderr out of the pipeline. Hit for real while testing this script.
  Invoke-VBox unregistervm $Name --delete | Out-Null
}

# `unregistervm --delete` only removes media the VM still knows about. A run that died between
# creating the disk and attaching it leaves an orphaned .vdi that belongs to no VM, and the next
# createmedium then fails with VERR_ALREADY_EXISTS - which reads like a VirtualBox problem and is
# really just debris. Hit while testing this script, twice. Sweep the directory as well.
$machineFolder = (& $VBoxManage list systemproperties | Select-String "Default machine folder" | ForEach-Object { ($_ -split ":\s+", 2)[1].Trim() })
$staleDir = Join-Path $machineFolder $Name

# Debris lives in two places and deleting only one is not enough. VirtualBox keeps a global media
# registry, so a disk from a failed run stays listed - as `inaccessible` once its file is gone - and
# `createmedium` still refuses the location because the registry entry owns it. Deleting the folder
# first actually makes this *harder* to diagnose, since the error then names a file that is not
# there. Unregister first, then delete. Both halves measured while testing this script.
$registered = & $VBoxManage list hdds
$uuid = $null
foreach ($line in $registered) {
  if ($line -match '^UUID:\s+(\S+)') { $uuid = $Matches[1] }
  if ($line -match '^Location:\s+(.+)$') {
    $location = $Matches[1].Trim()
    if ($uuid -and $location -like "$staleDir*") {
      Write-Host "Unregistering leftover medium $location"
      $ErrorActionPreference = "Continue"
      & $VBoxManage closemedium disk $uuid --delete | Out-Null
      if ($LASTEXITCODE -ne 0) { & $VBoxManage closemedium disk $uuid | Out-Null }
      $ErrorActionPreference = "Stop"
    }
  }
}

if (Test-Path $staleDir) {
  if (-not $Recreate) { throw "'$staleDir' exists but no VM '$Name' is registered - leftover from a failed run. Pass -Recreate to clear it." }
  Write-Host "Clearing leftover directory '$staleDir'..."
  Remove-Item -Recurse -Force $staleDir
}

Write-Host "`n[1/5] Creating '$Name'"
Invoke-VBox createvm --name $Name --ostype Windows11_64 --register | Out-Null

Write-Host "[2/5] Applying hardware"
# ich9, not the piix3 the ostype defaults to: Windows 11 expects a modern chipset. vboxsvga rather
# than the vboxvga default, which Windows 11 drives badly.
Invoke-VBox modifyvm $Name `
  --memory $MemoryMB --cpus $Cpus `
  --chipset ich9 --firmware efi `
  --graphicscontroller vboxsvga --vram 128 `
  --tpm-type 2.0 `
  --nic1 nat --audio-driver none --usb-xhci on | Out-Null

Write-Host "[3/5] Verifying the hardware actually applied"
# VBoxManage accepts some flags silently without applying them, and `showvminfo --machinereadable`
# does not report TPM at all in 7.2, so the settings XML is the only honest source.
$vmDir  = Join-Path $machineFolder $Name
$vbox   = Join-Path $vmDir "$Name.vbox"
if (-not (Test-Path $vbox)) { throw "Settings file missing at $vbox" }
[xml]$settings = Get-Content $vbox
$hardware = $settings.VirtualBox.Machine.Hardware

$checks = @(
  # Read the `type` attribute, not the element. `$hardware.Chipset` resolves to the XmlElement and
  # stringifies to "System.Xml.XmlElement", which compares unequal to everything and reads like a
  # real failure. The check caught that on its first run - against itself rather than the VM.
  @{ Name = "firmware EFI"; Actual = $hardware.Firmware.type;                Expected = "EFI" }
  @{ Name = "chipset ich9"; Actual = $hardware.Chipset.type;                 Expected = "ICH9" }
  @{ Name = "memory";       Actual = $hardware.Memory.RAMSize;               Expected = "$MemoryMB" }
  @{ Name = "cpu count";    Actual = $hardware.CPU.count;                    Expected = "$Cpus" }
  @{ Name = "TPM 2.0";      Actual = $hardware.TrustedPlatformModule.type;   Expected = "v2_0" }
)
$failed = @()
foreach ($c in $checks) {
  $ok = "$($c.Actual)" -eq "$($c.Expected)"
  Write-Host ("      {0,-14} {1}" -f $c.Name, $(if ($ok) { "ok" } else { "GOT '$($c.Actual)' WANT '$($c.Expected)'" }))
  if (-not $ok) { $failed += $c.Name }
}
if ($failed) {
  # Windows 11 setup refuses a machine without TPM 2.0, and a VM that fails these is not the clean
  # machine the gates are about. Stopping here beats discovering it 40 minutes into an install.
  throw "Hardware not as requested: $($failed -join ', '). Fix before installing."
}

Write-Host "[4/5] Creating and attaching the disk"
$disk = Join-Path $vmDir "$Name.vdi"
Invoke-VBox createmedium disk --filename $disk --size ($DiskGB * 1024) --format VDI | Out-Null
Invoke-VBox storagectl $Name --name "SATA" --add sata --controller IntelAhci --portcount 2 | Out-Null
Invoke-VBox storageattach $Name --storagectl "SATA" --port 0 --device 0 --type hdd --medium $disk | Out-Null

Write-Host "[5/5] Starting the unattended Windows install"
Write-Host "      This is the step no one has run yet on this machine - watch the first minutes."
Invoke-VBox unattended install $Name `
  --iso=$IsoPath `
  --user=$AdminUser --password=$AdminPassword --full-user-name=$AdminUser `
  --install-additions --locale=en_US --country=US `
  --time-zone="SE Asia Standard Time" `
  --start-vm=gui | Out-Null

Write-Host @"

VM '$Name' is installing. Windows setup runs unattended; expect 20-40 minutes.

Credentials: $AdminUser / $AdminPassword
These are deliberately weak and deliberately written down. The machine is disposable, holds no
production data, and is rebuilt with -Recreate rather than repaired. Do not enroll it against
production, and do not paste a real VAULT_KEY_OPERATOR into it.

AFTER the first boot completes, two things remain:

1.  Secure Boot, if a gate needs it. It cannot be enrolled before now, because the NVRAM store does
    not exist until the VM has booted once (VBOX_E_OBJECT_NOT_FOUND, measured 17 Aug 2026):
        VBoxManage controlvm "$Name" acpipowerbutton
        VBoxManage modifynvram "$Name" enrollmssignatures

2.  Snapshot it while it is still clean, before installing anything under test. This is what makes
    gates 2 and 3 repeatable instead of one-shot:
        VBoxManage snapshot "$Name" take "clean" --description "Fresh Windows, nothing installed"
    Restore between runs with:
        VBoxManage snapshot "$Name" restore "clean"

    Gate 3 needs a withdrawn installer. Relay v9-v12 are retained in
    MKTBrowser/apps/desktop/.relay-payload/, so the artifact exists - but confirm one of them is
    actually below the published compatibility floor before relying on it, or the gate has nothing
    to refuse.
"@
