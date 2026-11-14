// ==============================================================================
// VERCEL SERVERLESS SCRIPT GENERATOR: /api/scan & /scan.ps1
// Dynamically serves scan.ps1 with user/device type prompts and current domain
// ==============================================================================

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'mysmarthub.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const portalUrl = `${proto}://${host}/api/specs`;

  const script = `# ==============================================================================
# CYBERSPECS HARDWARE & DISK HEALTH SCANNER - AUTO CLOUD TRANSMITTER
# Live Streamed from: ${proto}://${host}
# ==============================================================================

param(
    [string]$AssignedTo = "",
    [string]$DeviceType = "",
    [string]$CustomName = "",
    [string]$PortalUrl = "${portalUrl}",
    [switch]$NonInteractive
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       CYBERSPECS HARDWARE & DISK HEALTH SCANNER          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Scanning PC Hardware, Motherboard Serial & Storage..." -ForegroundColor Yellow

# 1. Computer System & Motherboard / Serial Number
$bios = Get-CimInstance Win32_BIOS
$sys = Get-CimInstance Win32_ComputerSystem
$board = Get-CimInstance Win32_BaseBoard

# 2. Auto-detect Device Type (Laptop vs Desktop PC)
$isLaptop = $false
try {
    $hasBattery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
    $chassis = (Get-CimInstance Win32_SystemEnclosure -ErrorAction SilentlyContinue).ChassisTypes
    if ($hasBattery -or ($chassis -contains 8 -or $chassis -contains 9 -or $chassis -contains 10 -or $chassis -contains 11 -or $chassis -contains 12 -or $chassis -contains 14 -or $chassis -contains 30 -or $chassis -contains 31 -or $chassis -contains 32)) {
        $isLaptop = $true
    }
} catch {}

$autoDeviceType = if ($isLaptop) { "Laptop" } else { "Desktop PC" }

# 3. Interactive User & Device Identification
if (-not $AssignedTo -and -not $NonInteractive -and [Environment]::UserInteractive) {
    Write-Host ""
    Write-Host "--- USER & DEVICE IDENTIFICATION ---" -ForegroundColor Cyan
    $defaultUser = if ($env:USERNAME) { $env:USERNAME } else { "User" }
    $inputUser = Read-Host "Assigned User / Employee Name (e.g. Rahul, Accounts, Sales) [Default: $defaultUser]"
    $AssignedTo = if ($inputUser -and $inputUser.Trim()) { $inputUser.Trim() } else { $defaultUser }

    Write-Host "Auto-detected Device Type: $autoDeviceType" -ForegroundColor Gray
    $inputType = Read-Host "Device Type ([1] Laptop  [2] Desktop PC  [Enter for $autoDeviceType])"
    if ($inputType -eq "1" -or $inputType -match "lap") {
        $DeviceType = "Laptop"
    } elseif ($inputType -eq "2" -or $inputType -match "desk|pc") {
        $DeviceType = "Desktop PC"
    } else {
        $DeviceType = $autoDeviceType
    }

    $defaultFriendly = "$AssignedTo's $DeviceType"
    $inputName = Read-Host "Friendly Machine Name (e.g. Accounts Laptop, Bay 4 PC) [Default: $defaultFriendly]"
    $CustomName = if ($inputName -and $inputName.Trim()) { $inputName.Trim() } else { $defaultFriendly }
    Write-Host "✓ Assigned: $CustomName ($AssignedTo - $DeviceType)\`n" -ForegroundColor Green
} else {
    if (-not $AssignedTo) { $AssignedTo = if ($env:USERNAME) { $env:USERNAME } else { "Staff Member" } }
    if (-not $DeviceType) { $DeviceType = $autoDeviceType }
    if (-not $CustomName) { $CustomName = "$AssignedTo's $DeviceType" }
}

# 4. Processor & Generation
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuName = $cpu.Name.Trim()

$gen = "Modern Multi-Core Processor"
if ($cpuName -match "i[3579]-(\\d{1,2})\\d{3}") {
    $gen = "$($matches[1])th Generation Intel Core"
} elseif ($cpuName -match "i[3579]-(\\d)\\d{2}\\b") {
    $gen = "$($matches[1])st Generation Intel Core"
} elseif ($cpuName -match "Ryzen \\d (\\d)\\d{3}") {
    $gen = "AMD Ryzen $($matches[1])000 Series"
} elseif ($cpuName -match "Apple M(\\d)") {
    $gen = "Apple Silicon M$($matches[1])"
} elseif ($cpuName -match "Xeon") {
    $gen = "Intel Xeon Server Processor"
}

# 5. RAM / Physical Memory
$memModules = Get-CimInstance Win32_PhysicalMemory
$totalRamBytes = ($memModules | Measure-Object -Property Capacity -Sum).Sum
$totalRamGB = [math]::Round($totalRamBytes / 1GB, 1)
$ramSpeed = ($memModules | Select-Object -First 1).Speed
$ramSlots = $memModules.Count

# 6. Storage Drives & Live Health Status (SSD vs HDD)
$disks = @()
try {
    $physDisks = Get-PhysicalDisk
    foreach ($d in $physDisks) {
        $sizeGB = [math]::Round($d.Size / 1GB)
        $mediaType = if ($d.MediaType) { $d.MediaType } else { if ($d.FriendlyName -match "SSD|NVMe") { "SSD" } else { "HDD" } }
        $health = if ($d.HealthStatus) { $d.HealthStatus } else { "Healthy" }
        $opStatus = if ($d.OperationalStatus) { $d.OperationalStatus } else { "OK" }

        $disks += [PSCustomObject]@{
            Model = $d.FriendlyName
            MediaType = $mediaType
            SizeGB = $sizeGB
            BusType = if ($d.BusType) { $d.BusType } else { "SATA" }
            HealthStatus = $health
            OperationalStatus = $opStatus
        }
    }
} catch {
    $winDisks = Get-CimInstance Win32_DiskDrive
    foreach ($d in $winDisks) {
        $sizeGB = [math]::Round($d.Size / 1GB)
        $isSsd = $d.Model -match "SSD|NVMe"
        $disks += [PSCustomObject]@{
            Model = $d.Model
            MediaType = if ($isSsd) { "SSD" } else { "HDD" }
            SizeGB = $sizeGB
            BusType = "SATA/NVMe"
            HealthStatus = if ($d.Status -eq "OK") { "Healthy" } else { $d.Status }
            OperationalStatus = $d.Status
        }
    }
}

# 7. Logical Volume Free & Used Storage Space
$volumes = @()
Get-Volume | Where-Object { $_.DriveLetter } | ForEach-Object {
    $total = [math]::Round($_.Size / 1GB, 1)
    $free = [math]::Round($_.SizeRemaining / 1GB, 1)
    $used = [math]::Round($total - $free, 1)
    $pctUsed = if ($total -gt 0) { [math]::Round(($used / $total) * 100) } else { 0 }

    $volumes += [PSCustomObject]@{
        DriveLetter = "$($_.DriveLetter):"
        Label = if ($_.FileSystemLabel) { $_.FileSystemLabel } else { "Local Disk" }
        TotalGB = $total
        FreeGB = $free
        UsedGB = $used
        UsagePercent = $pctUsed
        Health = $_.HealthStatus
    }
}

# 8. Operating System & Graphics
$os = Get-CimInstance Win32_OperatingSystem
$gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1

# Build Unified Hardware Payload
$specsPayload = [PSCustomObject]@{
    scannedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    machineName = $sys.Name
    customName = $CustomName
    assignedTo = $AssignedTo
    deviceType = $DeviceType
    manufacturer = $sys.Manufacturer
    model = $sys.Model
    serialNumber = $bios.SerialNumber
    motherboard = "$($board.Manufacturer) $($board.Product)"
    processor = [PSCustomObject]@{
        name = $cpuName
        generation = $gen
        cores = $cpu.NumberOfCores
        logicalProcessors = $cpu.NumberOfLogicalProcessors
        maxClockMHz = $cpu.MaxClockSpeed
    }
    memory = [PSCustomObject]@{
        totalGB = $totalRamGB
        speedMHz = $ramSpeed
        slotsUsed = $ramSlots
    }
    storage = $disks
    volumes = $volumes
    graphics = $gpu.Name
    os = "$($os.Caption) ($($os.OSArchitecture))"
}

$jsonOutput = $specsPayload | ConvertTo-Json -Depth 4

# Safe Output Path: PSScriptRoot or Desktop/Temp fallback
$saveDir = if ($PSScriptRoot) { $PSScriptRoot } else { [Environment]::GetFolderPath("Desktop") }
if (-not $saveDir -or -not (Test-Path $saveDir)) {
    $saveDir = [System.IO.Path]::GetTempPath()
}
$outPath = Join-Path $saveDir "system-specs.json"
try {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($outPath, $jsonOutput, $utf8NoBom)
} catch {
    $jsonOutput | Out-File -FilePath $outPath -Encoding utf8
}

# Copy to clipboard
try {
    Set-Clipboard -Value $jsonOutput
    $copied = $true
} catch {
    $copied = $false
}

Write-Host "\`n[OK] Hardware Scan Complete!" -ForegroundColor Green
Write-Host "  -> Device Label: $CustomName ($DeviceType)" -ForegroundColor Cyan
Write-Host "  -> Assigned User: $AssignedTo" -ForegroundColor Gray
Write-Host "  -> System Hostname: $($sys.Name) ($($sys.Manufacturer) $($sys.Model))" -ForegroundColor Gray
Write-Host "  -> Serial/Service Tag: $($bios.SerialNumber)" -ForegroundColor Cyan
Write-Host "  -> CPU: $cpuName [$gen]" -ForegroundColor Gray
Write-Host "  -> RAM: $totalRamGB GB @ $ramSpeed MHz" -ForegroundColor Gray
Write-Host "  -> Disks: $($disks.Count) physical drive(s) healthy" -ForegroundColor Gray

# Transmit to online dashboard
if ($PortalUrl -and $PortalUrl.StartsWith("http")) {
    Write-Host "\`nTransmitting hardware telemetry to online fleet dashboard..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $PortalUrl -Method Post -Body $jsonOutput -ContentType "application/json"
        Write-Host "[OK] Successfully uploaded to fleet: $PortalUrl" -ForegroundColor Green
    } catch {
        Write-Host "[!] Note: Could not auto-upload to $PortalUrl ($_)" -ForegroundColor Yellow
        Write-Host "    (Specs are copied to clipboard and saved at: $outPath)" -ForegroundColor Gray
    }
}

if ($copied) {
    Write-Host "\`n[OK] Full specs JSON copied to your clipboard!" -ForegroundColor Cyan
}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(script);
}
