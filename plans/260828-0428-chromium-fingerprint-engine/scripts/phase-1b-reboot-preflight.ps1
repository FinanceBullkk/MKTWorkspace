[CmdletBinding()]
param(
    [ValidateSet('Prepare', 'PostReboot')]
    [string]$Mode = 'PostReboot',
    [string]$EngineRoot = 'D:\mkt-browser-engine',
    [int]$DelaySeconds = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$OutputRoot = Join-Path $EngineRoot 'replays\phase-1b-execution'
$MktBrowserRoot = 'E:\MKTWorkspace\MKTBrowser'
$ExperimentalOutput = Join-Path $EngineRoot 'src\out\Experimental'

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

function Get-IsoNow {
    return (Get-Date).ToString('o')
}

function Get-PhysicalMemorySnapshot {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $totalBytes = [double]$os.TotalVisibleMemorySize * 1KB
    $availableBytes = [double]$os.FreePhysicalMemory * 1KB
    return [ordered]@{
        totalGiB = [math]::Round($totalBytes / 1GB, 2)
        availableGiB = [math]::Round($availableBytes / 1GB, 2)
        totalBytes = [int64]$totalBytes
        availableBytes = [int64]$availableBytes
        method = 'Win32_OperatingSystem.TotalVisibleMemorySize/FreePhysicalMemory'
    }
}

function Get-DriveSnapshot([string]$DriveLetter) {
    $drive = New-Object System.IO.DriveInfo($DriveLetter)
    return [ordered]@{
        freeGiB = [math]::Round($drive.AvailableFreeSpace / 1GB, 2)
        freeBytes = [int64]$drive.AvailableFreeSpace
        totalGiB = [math]::Round($drive.TotalSize / 1GB, 2)
    }
}

function Get-WorkloadProcessSnapshot {
    $names = @(
        'steam', 'steamwebhelper', 'Code', 'chrome', 'msedge', 'VirtualBox',
        'VirtualBoxVM', 'VBoxHeadless', 'VBoxSVC', 'vmware', 'vmware-vmx',
        'qemu-system-x86_64', 'wsl', 'wslhost', 'vmmem', 'vmmemWSL', 'vmwp',
        'ninja', 'siso', 'clang', 'clang-cl', 'lld-link', 'link'
    )
    $found = @()
    foreach ($name in $names) {
        $found += @(Get-Process -Name $name -ErrorAction SilentlyContinue | ForEach-Object {
            [ordered]@{ name = $_.ProcessName; id = $_.Id }
        })
    }
    return [ordered]@{
        count = $found.Count
        names = @($found | ForEach-Object { $_.name } | Sort-Object -Unique)
        processes = $found
    }
}

function Get-VirtualizationSnapshot {
    $issues = @()
    $vboxCount = 0
    $vboxVerified = $false
    $vboxPath = 'C:\Program Files\Oracle\VirtualBox\VBoxManage.exe'
    if (Test-Path -LiteralPath $vboxPath) {
        try {
            $lines = @(& $vboxPath list runningvms 2>$null | Where-Object { $_.ToString().Trim() })
            $vboxCount = $lines.Count
            $vboxVerified = $true
        } catch {
            $issues += 'VirtualBox query failed'
        }
    } else {
        $vboxVerified = $true
    }

    $wslAvailable = $false
    $wslCount = 0
    $wslCommand = Get-Command 'wsl.exe' -ErrorAction SilentlyContinue
    if ($null -ne $wslCommand) {
        try {
            $wslLines = @(& $wslCommand.Source '--list' '--running' '--quiet' 2>$null | Where-Object { $_.ToString().Trim() })
            $wslCount = $wslLines.Count
            $wslAvailable = $true
        } catch {
            $issues += 'WSL query failed'
        }
    } else {
        $wslAvailable = $true
    }

    $hyperVInstalled = $false
    $hyperVVerified = $true
    $hyperVGuestCount = 0
    $vmms = Get-Service -Name 'vmms' -ErrorAction SilentlyContinue
    if ($null -ne $vmms) {
        $hyperVInstalled = $true
        try {
            $guests = @(Get-CimInstance -Namespace 'root/virtualization/v2' -ClassName 'Msvm_ComputerSystem' -ErrorAction Stop |
                Where-Object { $_.Caption -match 'Virtual Machine' -and $_.ElementName -ne $env:COMPUTERNAME })
            $hyperVGuestCount = $guests.Count
        } catch {
            $hyperVVerified = $false
            $issues += 'Hyper-V guest inventory unavailable'
        }
    }

    $processes = Get-WorkloadProcessSnapshot
    $processVmNames = @('VirtualBox', 'VirtualBoxVM', 'VBoxHeadless', 'VBoxSVC', 'vmware', 'vmware-vmx',
        'qemu-system-x86_64', 'wsl', 'wslhost', 'vmmem', 'vmmemWSL', 'vmwp')
    $processVmCount = @($processes.processes | Where-Object { $processVmNames -contains $_.name }).Count
    $verified = $vboxVerified -and $wslAvailable -and $hyperVVerified
    $clean = ($vboxCount -eq 0) -and ($wslCount -eq 0) -and ($hyperVGuestCount -eq 0) -and ($processVmCount -eq 0)

    return [ordered]@{
        gateVerified = $verified
        clean = $clean
        virtualBoxRunning = $vboxCount
        wslRunning = $wslCount
        hyperVInstalled = $hyperVInstalled
        hyperVGuests = $hyperVGuestCount
        vmProcessCount = $processVmCount
        workloadProcessCount = $processes.count
        workloadProcessNames = $processes.names
        issues = @($issues)
    }
}

function Get-StringSha256([string]$Value) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [Text.Encoding]::UTF8.GetBytes($Value)
        return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    } finally {
        $sha.Dispose()
    }
}

function Get-MktBrowserSnapshot {
    $tracked = @(& git -C $MktBrowserRoot ls-files -s 2>$null)
    $dirty = @(& git -C $MktBrowserRoot status --short 2>$null)
    return [ordered]@{
        trackedIndexSha256 = Get-StringSha256 (($tracked -join "`n") + "`n")
        dirtyPathCount = $dirty.Count
        dirtyPaths = @($dirty)
    }
}

function Get-ArtifactSnapshot {
    $chromePath = Join-Path $ExperimentalOutput 'chrome.exe'
    $exeCount = @(Get-ChildItem -LiteralPath $ExperimentalOutput -Filter '*.exe' -File -Recurse -ErrorAction SilentlyContinue).Count
    $artifact = [ordered]@{
        expectedPath = $chromePath
        exists = Test-Path -LiteralPath $chromePath -PathType Leaf
        recursiveExeCount = $exeCount
    }
    if ($artifact.exists) {
        $file = Get-Item -LiteralPath $chromePath
        $hash = Get-FileHash -LiteralPath $chromePath -Algorithm SHA256
        $artifact.sizeBytes = [int64]$file.Length
        $artifact.sha256 = $hash.Hash.ToLowerInvariant()
    }
    return $artifact
}

function Get-Snapshot {
    return [ordered]@{
        timestamp = Get-IsoNow
        host = $env:COMPUTERNAME
        mode = $Mode
        ram = Get-PhysicalMemorySnapshot
        drives = [ordered]@{
            D = Get-DriveSnapshot 'D:\'
            E = Get-DriveSnapshot 'E:\'
        }
        virtualization = Get-VirtualizationSnapshot
        artifact = Get-ArtifactSnapshot
        mktBrowser = Get-MktBrowserSnapshot
    }
}

if ($DelaySeconds -gt 0) {
    Start-Sleep -Seconds $DelaySeconds
}

$snapshot = Get-Snapshot
$ramPass = [double]$snapshot.ram.availableGiB -gt 12
$diskPass = [double]$snapshot.drives.D.freeGiB -ge 200
$vmPass = [bool]$snapshot.virtualization.gateVerified -and [bool]$snapshot.virtualization.clean
$workloadPass = ([int]$snapshot.virtualization.workloadProcessCount -eq 0) -and
    (@($snapshot.virtualization.issues).Count -eq 0)
$verdict = if ($ramPass -and $diskPass -and $vmPass -and $workloadPass) { 'PASS' } else { 'BLOCKED' }
$snapshot['gate'] = [ordered]@{
    ramPass = $ramPass
    diskPass = $diskPass
    vmPass = $vmPass
    workloadPass = $workloadPass
    verdict = $verdict
}

$stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$fileName = if ($Mode -eq 'Prepare') { "pre-reboot-$stamp.json" } else { "post-reboot-$stamp.json" }
$outputPath = Join-Path $OutputRoot $fileName
$snapshot | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $outputPath -Encoding UTF8

Write-Output ("Phase 1B {0}: {1}" -f $Mode, $verdict)
Write-Output ("Evidence: {0}" -f $outputPath)
Write-Output ("Available RAM: {0} GiB; D: free: {1} GiB; VM/WSL clean: {2}" -f
    $snapshot.ram.availableGiB, $snapshot.drives.D.freeGiB, $snapshot.virtualization.clean)

if ($Mode -eq 'Prepare') {
    Write-Output 'After reboot run this script with -Mode PostReboot -DelaySeconds 20 from a minimal terminal.'
}

if ($Mode -eq 'PostReboot' -and $verdict -ne 'PASS') {
    exit 2
}
exit 0
