# ==============================================================================
# PC HARDWARE & DISK HEALTH SCANNER & CLOUD TRANSMITTER
# Queries WMI/CIM, displays specs, and transmits to your online dashboard
# ==============================================================================

param(
    [string]$PortalUrl = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       CYBERSPECS HARDWARE & DISK HEALTH SCANNER          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Scanning PC Hardware, Motherboard Serial & Storage..." -ForegroundColor Yellow

# 1. Computer System & Motherboard / Serial Number
$bios = Get-CimInstance Win32_BIOS
$sys = Get-CimInstance Win32_ComputerSystem
$board = Get-CimInstance Win32_BaseBoard

# 2. Processor & Generation
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuName = $cpu.Name.Trim()

# Auto-detect Generation
$gen = "Unknown Gen"
if ($cpuName -match "i[3579]-(\d{1,2})\d{3}") {
    $gen = "$($matches[1])th Generation Intel Core"
} elseif ($cpuName -match "Ryzen \d (\d)\d{3}") {
    $gen = "AMD Ryzen $($matches[1])000 Series"
} elseif ($cpuName -match "Apple M(\d)") {
    $gen = "Apple Silicon M$($matches[1])"
}

# 3. RAM / Physical Memory
$memModules = Get-CimInstance Win32_PhysicalMemory
$totalRamBytes = ($memModules | Measure-Object -Property Capacity -Sum).Sum
$totalRamGB = [math]::Round($totalRamBytes / 1GB, 1)
$ramSpeed = ($memModules | Select-Object -First 1).Speed
$ramSlots = $memModules.Count

# 4. Storage Drives & Live Health Status (SSD vs HDD)
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

# 5. Logical Volume Free & Used Storage Space
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

# 6. Operating System & Graphics
$os = Get-CimInstance Win32_OperatingSystem
$gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1

# Build Unified Hardware Payload
$specsPayload = [PSCustomObject]@{
    scannedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    machineName = $sys.Name
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

Write-Host "`n✓ Hardware Scan Complete!" -ForegroundColor Green
Write-Host "  -> Machine: $($sys.Name) ($($sys.Manufacturer) $($sys.Model))" -ForegroundColor Gray
Write-Host "  -> Serial/Service Tag: $($bios.SerialNumber)" -ForegroundColor Cyan
Write-Host "  -> CPU: $cpuName [$gen]" -ForegroundColor Gray
Write-Host "  -> RAM: $totalRamGB GB @ $ramSpeed MHz" -ForegroundColor Gray
Write-Host "  -> Disks: $($disks.Count) physical drive(s) healthy" -ForegroundColor Gray

# If Portal URL was supplied or set in env, automatically upload via POST!
if (-not $PortalUrl -and $env:CYBERSPECS_PORTAL) {
    $PortalUrl = $env:CYBERSPECS_PORTAL
}

if ($PortalUrl -and $PortalUrl.StartsWith("http")) {
    Write-Host "`nTransmitting hardware telemetry to online dashboard..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $PortalUrl -Method Post -Body $jsonOutput -ContentType "application/json"
        Write-Host "✓ Successfully transmitted to cloud fleet: $PortalUrl" -ForegroundColor Green
    } catch {
        Write-Host "✕ Cloud transmission note: Could not upload to $PortalUrl ($_)" -ForegroundColor Yellow
        Write-Host "  (Specs are saved locally at: $outPath and copied to clipboard)" -ForegroundColor Gray
    }
} else {
    Write-Host "`n(Tip: Run with -PortalUrl 'https://your-site.vercel.app/api/specs' to auto-sync to your online dashboard)" -ForegroundColor DarkGray
}

if ($copied) {
    Write-Host "`n✓ Full specs JSON copied to your clipboard!" -ForegroundColor Cyan
}
