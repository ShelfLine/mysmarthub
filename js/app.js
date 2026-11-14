/* ==========================================================================
   SYSTEM SPECS & HARDWARE TELEMETRY TRACKER - CORE APPLICATION CONTROLLER
   Hardware Telemetry Renderer, Scanner Bridge, JSON Importer & Fleet Switcher
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    machines: SpecsStorage.get(STORAGE_KEYS.MACHINES, DEFAULT_MACHINES),
    activeId: SpecsStorage.get(STORAGE_KEYS.ACTIVE_ID, DEFAULT_MACHINES[0].id),
    settings: SpecsStorage.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  };

  // DOM Elements
  const elements = {
    // Header & Actions
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    cloudStatusPill: document.getElementById('cloudStatusPill'),
    cloudStatusText: document.getElementById('cloudStatusText'),
    btnSyncCloud: document.getElementById('btnSyncCloud'),
    syncCloudIcon: document.getElementById('syncCloudIcon'),
    btnOpenScanModal: document.getElementById('btnOpenScanModal'),
    btnPasteJson: document.getElementById('btnPasteJson'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnExportJson: document.getElementById('btnExportJson'),
    btnImportJson: document.getElementById('btnImportJson'),
    fileImportInput: document.getElementById('fileImportInput'),
    btnPrintReport: document.getElementById('btnPrintReport'),
    btnResetDefaults: document.getElementById('btnResetDefaults'),

    // Scanner Banner
    scanCmdCode: document.getElementById('scanCmdCode'),
    btnCopyScanCmd: document.getElementById('btnCopyScanCmd'),
    btnDownloadBatchLauncher: document.getElementById('btnDownloadBatchLauncher'),
    btnSwitchScanMode: document.getElementById('btnSwitchScanMode'),

    // Hero Telemetry HUD Cards
    hudCpuTitle: document.getElementById('hudCpuTitle'),
    hudCpuGen: document.getElementById('hudCpuGen'),
    hudCpuCores: document.getElementById('hudCpuCores'),

    hudRamTotal: document.getElementById('hudRamTotal'),
    hudRamSpeed: document.getElementById('hudRamSpeed'),
    hudRamType: document.getElementById('hudRamType'),

    hudStorageTotal: document.getElementById('hudStorageTotal'),
    hudStorageBreakdown: document.getElementById('hudStorageBreakdown'),
    hudStorageDrivesCount: document.getElementById('hudStorageDrivesCount'),

    hudSerialTag: document.getElementById('hudSerialTag'),
    hudMotherboard: document.getElementById('hudMotherboard'),
    hudMachineModel: document.getElementById('hudMachineModel'),
    btnCopySerial: document.getElementById('btnCopySerial'),

    // Detailed Hardware Matrices & Active Machine
    activeMachineDeviceIcon: document.getElementById('activeMachineDeviceIcon'),
    activeMachineHeaderName: document.getElementById('activeMachineHeaderName'),
    activeMachineDeviceTypeBadge: document.getElementById('activeMachineDeviceTypeBadge'),
    activeMachineUserChip: document.getElementById('activeMachineUserChip'),
    activeMachineHostname: document.getElementById('activeMachineHostname'),
    activeMachineLocation: document.getElementById('activeMachineLocation'),
    activeMachineTimestamp: document.getElementById('activeMachineTimestamp'),
    btnOpenEditMachineModal: document.getElementById('btnOpenEditMachineModal'),
    storageDisksContainer: document.getElementById('storageDisksContainer'),
    identityTableBody: document.getElementById('identityTableBody'),
    fleetMachinesGrid: document.getElementById('fleetMachinesGrid'),

    // Edit Machine Modal
    editMachineModal: document.getElementById('editMachineModal'),
    editMachineModalClose: document.getElementById('editMachineModalClose'),
    editMachineId: document.getElementById('editMachineId'),
    editMachineHostname: document.getElementById('editMachineHostname'),
    editMachineCustomName: document.getElementById('editMachineCustomName'),
    editMachineDeviceType: document.getElementById('editMachineDeviceType'),
    editMachineAssignedTo: document.getElementById('editMachineAssignedTo'),
    editMachineLocation: document.getElementById('editMachineLocation'),
    btnSaveMachineDetails: document.getElementById('btnSaveMachineDetails'),

    // Scan & Bridge Modal
    scanModal: document.getElementById('scanModal'),
    scanModalClose: document.getElementById('scanModalClose'),
    modalScanCmdCode: document.getElementById('modalScanCmdCode'),
    btnCopyModalCmd: document.getElementById('btnCopyModalCmd'),
    btnDownloadBatchLauncherModal: document.getElementById('btnDownloadBatchLauncherModal'),
    scanJsonArea: document.getElementById('scanJsonArea'),
    btnProcessJsonInput: document.getElementById('btnProcessJsonInput'),
    btnDownloadPsScript: document.getElementById('btnDownloadPsScript'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // -------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = '⚡';
    let color = 'var(--neon-cyan)';
    if (type === 'success') { icon = '✓'; color = 'var(--neon-green)'; }
    if (type === 'error') { icon = '✕'; color = 'var(--neon-rose)'; }

    toast.innerHTML = `<span style="color:${color}; font-weight:bold; font-size:1.1rem;">${icon}</span><span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 2800);
    }, 2800);
  }

  // -------------------------------------------------------------
  // Theme Management
  // -------------------------------------------------------------
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    elements.themeToggleBtn.innerHTML = state.settings.theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }

  elements.themeToggleBtn.addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    SpecsStorage.set(STORAGE_KEYS.SETTINGS, state.settings);
    applyTheme();
    showToast(`Theme switched to ${state.settings.theme} mode`);
  });

  // -------------------------------------------------------------
  // Active Machine Selector & Telemetry Display
  // -------------------------------------------------------------
  function getActiveMachine() {
    return state.machines.find(m => m.id === state.activeId) || state.machines[0];
  }

  function renderActiveTelemetry() {
    const m = getActiveMachine();
    if (!m) return;

    // Header Meta & Device Identification
    const isLaptop = (m.deviceType || '').toLowerCase().includes('laptop');
    const isServer = (m.deviceType || '').toLowerCase().includes('server');
    const icon = isLaptop ? '💻' : (isServer ? '🗄️' : '🖥️');

    if (elements.activeMachineDeviceIcon) elements.activeMachineDeviceIcon.textContent = icon;
    if (elements.activeMachineHeaderName) elements.activeMachineHeaderName.textContent = m.customName || m.machineName;
    if (elements.activeMachineDeviceTypeBadge) {
      elements.activeMachineDeviceTypeBadge.textContent = `${icon} ${m.deviceType || 'PC'}`;
      elements.activeMachineDeviceTypeBadge.className = `device-type-badge ${isLaptop ? 'laptop' : 'desktop'}`;
    }
    if (elements.activeMachineUserChip) {
      elements.activeMachineUserChip.textContent = `👤 ${m.assignedTo || 'Unassigned'}`;
    }
    if (elements.activeMachineHostname) {
      elements.activeMachineHostname.textContent = `Host: ${m.machineName || 'DESKTOP'}`;
    }
    if (elements.activeMachineLocation) {
      elements.activeMachineLocation.textContent = m.location || 'Office Workstation';
    }
    if (elements.activeMachineTimestamp) {
      elements.activeMachineTimestamp.textContent = m.scannedAt ? `Scanned: ${m.scannedAt}` : 'Live Telemetry Active';
    }

    // 1. CPU Card
    elements.hudCpuTitle.textContent = m.processor ? m.processor.name : 'Unknown CPU';
    elements.hudCpuGen.textContent = m.processor && m.processor.generation ? m.processor.generation : SpecsStorage.parseCpuGeneration(m.processor?.name);
    elements.hudCpuCores.textContent = m.processor ? `${m.processor.cores} Cores / ${m.processor.logicalProcessors} Threads` : '2 Cores / 4 Threads';

    // 2. RAM Card
    elements.hudRamTotal.textContent = m.memory ? `${m.memory.totalGB} GB RAM` : '4 GB RAM';
    elements.hudRamSpeed.textContent = m.memory && m.memory.speedMHz ? `@ ${m.memory.speedMHz} MHz` : '@ 2667 MHz';
    elements.hudRamType.textContent = m.memory && m.memory.type ? m.memory.type : 'DDR4 SDRAM';

    // 3. Storage Overview Card
    const storageList = m.storage || [];
    let totalGB = 0;
    let ssdCount = 0;
    let hddCount = 0;

    storageList.forEach(d => {
      const size = parseInt(d.SizeGB) || 0;
      totalGB += size;
      const media = (d.MediaType || '').toLowerCase();
      if (media.includes('ssd') || d.Model?.toLowerCase().includes('ssd') || d.Model?.toLowerCase().includes('nvme')) {
        ssdCount++;
      } else {
        hddCount++;
      }
    });

    const formattedTotal = totalGB >= 1000 ? `${(totalGB / 1000).toFixed(1)} TB Total` : `${totalGB} GB Total`;
    elements.hudStorageTotal.textContent = formattedTotal;
    elements.hudStorageBreakdown.textContent = `${ssdCount}x SSD (Fast) • ${hddCount}x HDD (Bulk)`;
    elements.hudStorageDrivesCount.textContent = `${storageList.length} physical drive${storageList.length === 1 ? '' : 's'}`;

    // 4. Motherboard & Serial Tag Card
    elements.hudSerialTag.textContent = m.serialNumber || 'N/A';
    elements.hudMotherboard.textContent = m.motherboard || 'OEM System Board';
    elements.hudMachineModel.textContent = `${m.manufacturer || ''} ${m.model || ''}`.trim() || 'Custom PC';

    // -------------------------------------------------------------
    // Detailed Physical Disks & Health Telemetry Matrix
    // -------------------------------------------------------------
    elements.storageDisksContainer.innerHTML = '';
    if (storageList.length === 0) {
      elements.storageDisksContainer.innerHTML = `
        <div style="padding:20px; text-align:center; color:var(--text-dim);">No storage drives detected.</div>
      `;
    } else {
      storageList.forEach(disk => {
        const item = document.createElement('div');
        item.className = 'disk-card-item';

        const isSsd = (disk.MediaType || '').toLowerCase().includes('ssd') || (disk.Model || '').toLowerCase().includes('ssd') || (disk.Model || '').toLowerCase().includes('nvme');
        const badgeClass = isSsd ? 'ssd' : 'hdd';
        const healthStatus = disk.HealthStatus || 'Healthy';
        const isHealthy = healthStatus.toLowerCase() === 'healthy' || healthStatus.toLowerCase() === 'ok';

        const sizeStr = disk.SizeGB >= 1000 ? `${(disk.SizeGB / 1000).toFixed(1)} TB` : `${disk.SizeGB} GB`;

        item.innerHTML = `
          <div class="disk-card-top-row">
            <div style="display:flex; align-items:center; gap:12px; min-width:0;">
              <div style="font-size:1.6rem;">${isSsd ? '⚡' : '💾'}</div>
              <div style="min-width:0;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="disk-type-badge ${badgeClass}">${badgeClass.toUpperCase()}</span>
                  <span class="disk-model-name">${disk.Model}</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                  <span>Bus: <strong>${disk.BusType || 'SATA'}</strong></span>
                  ${disk.Role ? `<span> • <strong>${disk.Role}</strong></span>` : ''}
                </div>
              </div>
            </div>
            <div>
              <div class="disk-capacity-huge">${sizeStr}</div>
              <div style="display:flex; justify-content:flex-end; margin-top:2px;">
                <span class="health-pill ${isHealthy ? 'healthy' : 'warning'}">
                  ${isHealthy ? '🟢' : '🟡'} ${healthStatus} (${disk.OperationalStatus || 'OK'})
                </span>
              </div>
            </div>
          </div>
        `;
        elements.storageDisksContainer.appendChild(item);
      });
    }

    // Render Logical Volumes breakdown if available
    const volumesList = m.volumes || [];
    if (volumesList.length > 0) {
      const volSection = document.createElement('div');
      volSection.style.marginTop = '10px';
      volSection.innerHTML = `
        <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-dim); margin-bottom:8px;">
          Partition Capacity & Free Space Telemetry
        </div>
      `;

      volumesList.forEach(v => {
        const row = document.createElement('div');
        row.style.background = 'var(--input-bg)';
        row.style.border = '1px solid var(--card-border)';
        row.style.borderRadius = 'var(--radius-sm)';
        row.style.padding = '10px 14px';
        row.style.marginBottom = '8px';

        const isFull = v.UsagePercent > 80;

        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; margin-bottom:6px;">
            <span><strong class="font-mono" style="color:var(--neon-cyan);">${v.DriveLetter}</strong> (${v.Label})</span>
            <span><strong>${v.FreeGB} GB Free</strong> of ${v.TotalGB} GB (${v.UsagePercent}% used)</span>
          </div>
          <div class="volume-bar-wrap">
            <div class="volume-bar-fill ${isFull ? 'warning' : ''}" style="width: ${v.UsagePercent}%;"></div>
          </div>
        `;
        volSection.appendChild(row);
      });

      elements.storageDisksContainer.appendChild(volSection);
    }

    // -------------------------------------------------------------
    // Motherboard & Identity Specs Table
    // -------------------------------------------------------------
    elements.identityTableBody.innerHTML = `
      <tr><td>Friendly Device Label</td><td><strong style="color:var(--neon-cyan);">${m.customName || m.machineName}</strong></td></tr>
      <tr><td>Device Category</td><td><span class="device-type-badge ${isLaptop ? 'laptop' : 'desktop'}">${icon} ${m.deviceType || 'Desktop PC'}</span></td></tr>
      <tr><td>Assigned User / Owner</td><td><span class="user-owner-chip">👤 ${m.assignedTo || 'Unassigned'}</span></td></tr>
      <tr><td>System Hostname</td><td><span class="font-mono">${m.machineName || '-'}</span></td></tr>
      <tr><td>System Serial / Service Tag</td><td><span class="serial-tag-highlight font-mono">${m.serialNumber || 'N/A'}</span></td></tr>
      <tr><td>System Manufacturer & Model</td><td>${m.manufacturer || '-'} ${m.model || '-'}</td></tr>
      <tr><td>Motherboard / Mainboard</td><td>${m.motherboard || '-'}</td></tr>
      <tr><td>Processor Generation</td><td><span class="gen-badge">${m.processor?.generation || '-'}</span></td></tr>
      <tr><td>CPU Clock & Topology</td><td>${m.processor ? `${m.processor.cores} Physical Cores, ${m.processor.logicalProcessors} Logical Threads @ ${(m.processor.maxClockMHz / 1000).toFixed(2)} GHz` : '-'}</td></tr>
      <tr><td>Installed System Memory</td><td>${m.memory ? `${m.memory.totalGB} GB ${m.memory.type || ''} @ ${m.memory.speedMHz || ''} MHz` : '-'}</td></tr>
      <tr><td>Dedicated / Integrated GPU</td><td>${m.graphics || 'Integrated Graphics'}</td></tr>
      <tr><td>Operating System Platform</td><td>${m.os || 'Windows 10/11 (64-bit)'}</td></tr>
      <tr><td>Assigned Location & Dept</td><td>${m.location || 'Office Workstation'}</td></tr>
    `;

    renderFleetGrid();
  }

  // -------------------------------------------------------------
  // Fleet Machine Cards Grid
  // -------------------------------------------------------------
  function renderFleetGrid() {
    elements.fleetMachinesGrid.innerHTML = '';
    state.machines.forEach(pc => {
      const card = document.createElement('div');
      card.className = `cyber-panel machine-card-tile ${pc.id === state.activeId ? 'active' : ''}`;

      const totalDiskGB = (pc.storage || []).reduce((acc, d) => acc + (parseInt(d.SizeGB) || 0), 0);
      const diskStr = totalDiskGB >= 1000 ? `${(totalDiskGB / 1000).toFixed(1)} TB` : `${totalDiskGB} GB`;

      const isLap = (pc.deviceType || '').toLowerCase().includes('laptop');
      const isSrv = (pc.deviceType || '').toLowerCase().includes('server');
      const tileIcon = isLap ? '💻' : (isSrv ? '🗄️' : '🖥️');

      card.innerHTML = `
        <div class="machine-tile-header">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <span style="font-size:1.4rem;">${tileIcon}</span>
            <div style="min-width:0;">
              <div class="machine-tile-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${pc.customName || pc.machineName}
              </div>
              <div class="machine-tile-sub font-mono">Host: ${pc.machineName}</div>
            </div>
          </div>
          <span class="serial-tag-highlight font-mono" style="font-size:0.75rem;">${pc.serialNumber || 'TAG'}</span>
        </div>

        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:2px;">
          <span class="device-type-badge ${isLap ? 'laptop' : 'desktop'}">
            ${tileIcon} ${pc.deviceType || 'Desktop PC'}
          </span>
          <span class="user-owner-chip">👤 ${pc.assignedTo || 'Unassigned'}</span>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-muted); display:flex; flex-direction:column; gap:4px; margin-top:4px;">
          <div>🧠 <strong>${pc.processor ? pc.processor.name : 'CPU'}</strong></div>
          <div>⚡ <strong>${pc.memory ? `${pc.memory.totalGB} GB RAM` : 'RAM'}</strong> • 💾 <strong>${diskStr} Storage</strong></div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px; border-top:1px solid var(--divider); padding-top:8px;">
          <span style="font-size:0.72rem; color:var(--text-dim);">${pc.os || 'Windows'}</span>
          <div style="display:flex; gap:6px;">
            <button class="cyber-btn-secondary btn-edit-tile" style="padding:3px 8px; font-size:0.72rem;">✏️ Edit</button>
            <button class="cyber-btn-secondary btn-inspect-pc" style="padding:3px 8px; font-size:0.72rem;">Inspect</button>
            <button class="cyber-btn-secondary btn-delete-pc" style="padding:3px 8px; font-size:0.72rem; color:var(--neon-rose);">✕</button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-pc') || e.target.closest('.btn-edit-tile')) return;
        state.activeId = pc.id;
        SpecsStorage.set(STORAGE_KEYS.ACTIVE_ID, pc.id);
        renderActiveTelemetry();
      });

      card.querySelector('.btn-edit-tile').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(pc.id);
      });

      card.querySelector('.btn-delete-pc').addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.machines.length <= 1) {
          alert('You must have at least one machine in your telemetry fleet.');
          return;
        }
        if (confirm(`Remove machine "${pc.machineName}" from your hardware telemetry fleet?`)) {
          state.machines = state.machines.filter(m => m.id !== pc.id);
          if (state.activeId === pc.id) state.activeId = state.machines[0].id;
          SpecsStorage.set(STORAGE_KEYS.MACHINES, state.machines);
          SpecsStorage.set(STORAGE_KEYS.ACTIVE_ID, state.activeId);
          renderActiveTelemetry();
          showToast('Machine removed from fleet', 'info');
        }
      });

      elements.fleetMachinesGrid.appendChild(card);
    });
  }

  // -------------------------------------------------------------
  // 1-Click Hardware Scanner Bridge & JSON Importer
  // -------------------------------------------------------------
  function parseAndImportSpecsJson(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString.replace(/^\uFEFF/, '').trim()) : jsonString;

      const serialNumber = data.serialNumber || 'UNKNOWN-SERIAL';

      let gen = data.processor?.generation;
      if (!gen || gen === 'Unknown Gen') {
        gen = SpecsStorage.parseCpuGeneration(data.processor?.name);
      }

      const isLap = (data.deviceType || '').toLowerCase().includes('laptop') || (data.model || '').toLowerCase().includes('vostro') || (data.machineName || '').toLowerCase().includes('laptop');
      const detectedType = data.deviceType || (isLap ? 'Laptop' : 'Desktop PC');
      const assignedTo = data.assignedTo || 'Current User';
      const customName = data.customName || `${assignedTo}'s ${detectedType}`;

      const importedMachine = {
        id: 'pc-' + (data.serialNumber ? data.serialNumber.toLowerCase() : Date.now()),
        scannedAt: data.scannedAt || new Date().toISOString(),
        machineName: data.machineName || 'Scanned PC',
        customName: customName,
        assignedTo: assignedTo,
        deviceType: detectedType,
        manufacturer: data.manufacturer || 'OEM',
        model: data.model || 'System Model',
        serialNumber: serialNumber,
        motherboard: data.motherboard || 'Mainboard',
        location: data.location || 'Office / Local System',
        processor: {
          name: data.processor?.name || 'Processor',
          generation: gen,
          cores: data.processor?.cores || 2,
          logicalProcessors: data.processor?.logicalProcessors || 4,
          maxClockMHz: data.processor?.maxClockMHz || 2400
        },
        memory: {
          totalGB: data.memory?.totalGB || 4,
          speedMHz: data.memory?.speedMHz || 2667,
          type: 'DDR4 / DDR5',
          slotsUsed: data.memory?.slotsUsed || 1
        },
        storage: data.storage || [
          { Model: 'Primary SSD', MediaType: 'SSD', SizeGB: 512, BusType: 'NVMe', HealthStatus: 'Healthy', OperationalStatus: 'OK' }
        ],
        volumes: data.volumes || [],
        graphics: data.graphics || 'Graphics Controller',
        os: data.os || 'Windows (64-bit)'
      };

      const existingIdx = state.machines.findIndex(m => m.serialNumber === serialNumber && serialNumber !== 'UNKNOWN-SERIAL');
      if (existingIdx !== -1) {
        state.machines[existingIdx] = importedMachine;
      } else {
        state.machines.unshift(importedMachine);
      }

      state.activeId = importedMachine.id;
      SpecsStorage.set(STORAGE_KEYS.MACHINES, state.machines);
      SpecsStorage.set(STORAGE_KEYS.ACTIVE_ID, state.activeId);

      renderActiveTelemetry();
      elements.scanModal.classList.remove('open');
      showToast(`Hardware & Disk Health loaded for ${importedMachine.machineName}! 🎉`, 'success');
      return true;
    } catch (err) {
      console.error('JSON parsing error:', err);
      showToast(`Invalid JSON format: ${err.message}`, 'error');
      return false;
    }
  }

  // Clipboard Bridge Integration
  elements.btnPasteJson.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim().startsWith('{')) {
        elements.scanModal.classList.add('open');
        elements.scanJsonArea.focus();
        showToast('Paste your hardware JSON into the box below', 'info');
        return;
      }
      parseAndImportSpecsJson(text);
    } catch (e) {
      elements.scanModal.classList.add('open');
      elements.scanJsonArea.focus();
    }
  });

  // -------------------------------------------------------------
  // Dynamic Cloud Portal URL & 1-Line Command Generator
  // -------------------------------------------------------------
  function getOrigin() {
    if (window.location.protocol.startsWith('http')) {
      return window.location.origin;
    }
    // Fallback default domain if running from file://
    return 'https://mysmarthub.vercel.app';
  }

  function getOneLinerCmd() {
    return `irm ${getOrigin()}/scan.ps1 | iex`;
  }

  function setupDynamicCommands() {
    const cmd = getOneLinerCmd();
    if (elements.scanCmdCode) elements.scanCmdCode.textContent = cmd;
    if (elements.modalScanCmdCode) elements.modalScanCmdCode.textContent = cmd;
  }

  // 1-Click Batch File (.bat) Generator
  function downloadBatchLauncher() {
    const origin = getOrigin();
    const portalScriptUrl = `${origin}/scan.ps1`;
    const batContent = `@echo off
title CyberSpecs Fleet Hardware Scanner
echo ==========================================================
echo       CYBERSPECS HARDWARE & DISK HEALTH SCANNER
echo ==========================================================
echo Target Cloud Fleet: ${origin}
echo Scanning PC Hardware and Transmitting Telemetry...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm '${portalScriptUrl}' | iex"
echo.
echo ==========================================================
echo Scan complete! Press any key to close this window...
echo ==========================================================
pause >nul
`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CyberSpecs-Scan.bat';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded 1-Click "CyberSpecs-Scan.bat"! Run it on any user PC.', 'success');
  }

  // -------------------------------------------------------------
  // Method 1: Live Cloud Fleet Synchronization (/api/specs)
  // -------------------------------------------------------------
  async function syncCloudFleet(isManual = false) {
    if (elements.syncCloudIcon) elements.syncCloudIcon.classList.add('spin-anim');
    if (elements.cloudStatusPill) {
      elements.cloudStatusPill.className = 'cloud-status-pill syncing';
      elements.cloudStatusText.textContent = 'Syncing...';
    }

    // 1. If running locally as a file:/// URL, /api/specs is not reachable directly
    if (window.location.protocol === 'file:') {
      if (elements.cloudStatusPill) {
        elements.cloudStatusPill.className = 'cloud-status-pill';
        elements.cloudStatusText.textContent = 'Local Mode (file://)';
      }
      if (elements.syncCloudIcon) elements.syncCloudIcon.classList.remove('spin-anim');

      if (isManual) {
        // Try auto-loading from clipboard if user ran scan.ps1
        try {
          const clip = await navigator.clipboard.readText();
          if (clip && (clip.includes('processor') || clip.includes('serialNumber'))) {
            const ok = parseAndImportSpecsJson(clip);
            if (ok) {
              showToast('Detected hardware specs on clipboard and loaded successfully! 🎉', 'success');
              return;
            }
          }
        } catch (e) {}

        showToast('Local file mode: Run "start-server.bat" to start local cloud server, or click "Paste Specs"!', 'info');
        elements.scanModal.classList.add('open');
      }
      return;
    }

    // 2. Fetch from Cloud API (/api/specs)
    try {
      const res = await fetch('/api/specs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.machines)) {
        if (data.machines.length === 0) {
          if (elements.cloudStatusPill) {
            elements.cloudStatusPill.className = 'cloud-status-pill';
            elements.cloudStatusText.textContent = 'Cloud Online (0 PCs)';
          }
          if (isManual) {
            // Check clipboard as fallback
            try {
              const clip = await navigator.clipboard.readText();
              if (clip && (clip.includes('processor') || clip.includes('serialNumber'))) {
                const ok = parseAndImportSpecsJson(clip);
                if (ok) {
                  showToast('Loaded specs from your clipboard! 🎉', 'success');
                  return;
                }
              }
            } catch (e) {}
            showToast('Cloud API online! No remote PCs have pushed specs yet. Run scan.ps1 or click Paste Specs.', 'info');
          }
          return;
        }

        let addedCount = 0;
        let lastReported = null;

        data.machines.forEach(cloudMachine => {
          if (!cloudMachine || !cloudMachine.serialNumber) return;
          const existingIdx = state.machines.findIndex(m => m.serialNumber === cloudMachine.serialNumber);
          if (existingIdx !== -1) {
            state.machines[existingIdx] = { ...state.machines[existingIdx], ...cloudMachine };
            lastReported = state.machines[existingIdx];
          } else {
            state.machines.unshift(cloudMachine);
            lastReported = cloudMachine;
            addedCount++;
          }
        });

        // Auto-switch to newest reported machine so user sees it right away
        if (lastReported) {
          state.activeId = lastReported.id;
          SpecsStorage.set(STORAGE_KEYS.ACTIVE_ID, state.activeId);
        }

        SpecsStorage.set(STORAGE_KEYS.MACHINES, state.machines);
        renderActiveTelemetry();

        const totalOnline = state.machines.length;
        if (elements.cloudStatusPill) {
          elements.cloudStatusPill.className = 'cloud-status-pill';
          elements.cloudStatusText.textContent = `Cloud Live (${totalOnline} PCs)`;
        }

        if (isManual) {
          showToast(`Cloud Fleet Synced! Loaded ${data.machines.length} machine(s) from cloud. 🎉`, 'success');
        }
      }
    } catch (err) {
      if (elements.cloudStatusPill) {
        elements.cloudStatusPill.className = 'cloud-status-pill offline';
        elements.cloudStatusText.textContent = 'Cloud Standby';
      }
      if (isManual) {
        showToast('Could not reach cloud API. Double-click "start-server.bat" to start local server!', 'error');
      }
    } finally {
      if (elements.syncCloudIcon) elements.syncCloudIcon.classList.remove('spin-anim');
    }
  }

  // -------------------------------------------------------------
  // Event Handlers & Modal Listeners
  // -------------------------------------------------------------
  if (elements.btnSyncCloud) {
    elements.btnSyncCloud.addEventListener('click', () => syncCloudFleet(true));
  }

  if (elements.btnCopyScanCmd) {
    elements.btnCopyScanCmd.addEventListener('click', () => {
      const cmd = elements.scanCmdCode ? elements.scanCmdCode.textContent.trim() : getOneLinerCmd();
      navigator.clipboard.writeText(cmd).then(() => {
        showToast('Copied 1-line scan command! Run in PowerShell on any user PC.', 'success');
      });
    });
  }

  if (elements.btnCopyModalCmd) {
    elements.btnCopyModalCmd.addEventListener('click', () => {
      const cmd = elements.modalScanCmdCode ? elements.modalScanCmdCode.textContent.trim() : getOneLinerCmd();
      navigator.clipboard.writeText(cmd).then(() => {
        showToast('Copied 1-line scan command to clipboard!', 'success');
      });
    });
  }

  if (elements.btnDownloadBatchLauncher) {
    elements.btnDownloadBatchLauncher.addEventListener('click', downloadBatchLauncher);
  }

  if (elements.btnDownloadBatchLauncherModal) {
    elements.btnDownloadBatchLauncherModal.addEventListener('click', downloadBatchLauncher);
  }

  if (elements.btnSwitchScanMode) {
    elements.btnSwitchScanMode.addEventListener('click', () => elements.scanModal.classList.add('open'));
  }

  elements.btnProcessJsonInput.addEventListener('click', () => {
    const raw = elements.scanJsonArea.value.trim();
    if (!raw) {
      alert('Please paste the JSON output from the scan script.');
      return;
    }
    parseAndImportSpecsJson(raw);
  });

  elements.btnDownloadPsScript.addEventListener('click', () => {
    window.open('scan.ps1', '_blank');
    showToast('Download started for scan.ps1', 'info');
  });

  elements.btnCopySerial.addEventListener('click', () => {
    const sn = elements.hudSerialTag.textContent;
    navigator.clipboard.writeText(sn).then(() => {
      showToast(`Serial Tag "${sn}" copied to clipboard!`, 'success');
    });
  });

  // Export handlers
  elements.btnExportCsv.addEventListener('click', () => {
    const csv = SpecsStorage.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hardware-fleet-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported CSV Hardware Inventory Audit Report!', 'success');
  });

  elements.btnExportJson.addEventListener('click', () => {
    const json = SpecsStorage.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hardware-fleet-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported complete fleet JSON backup!', 'success');
  });

  elements.btnImportJson.addEventListener('click', () => elements.fileImportInput.click());
  elements.fileImportInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const ok = SpecsStorage.importBackup(evt.target.result);
      if (ok) {
        showToast('Fleet restored from backup! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 700);
      } else {
        showToast('Invalid backup file format', 'error');
      }
    };
    reader.readAsText(file);
  });

  elements.btnPrintReport.addEventListener('click', () => {
    window.print();
  });

  elements.btnResetDefaults.addEventListener('click', () => {
    if (confirm('Reset hardware fleet to default detected Dell PC and sample fleet?')) {
      SpecsStorage.resetDefaults();
      showToast('Reset to defaults! Reloading...', 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  });

  // -------------------------------------------------------------
  // Edit Device & User Metadata Modal
  // -------------------------------------------------------------
  function openEditModal(pcId) {
    const target = state.machines.find(m => m.id === pcId) || getActiveMachine();
    if (!target) return;

    if (elements.editMachineId) elements.editMachineId.value = target.id;
    if (elements.editMachineHostname) elements.editMachineHostname.value = target.machineName || '';
    if (elements.editMachineCustomName) elements.editMachineCustomName.value = target.customName || target.machineName || '';
    if (elements.editMachineDeviceType) elements.editMachineDeviceType.value = target.deviceType || 'Desktop PC';
    if (elements.editMachineAssignedTo) elements.editMachineAssignedTo.value = target.assignedTo || '';
    if (elements.editMachineLocation) elements.editMachineLocation.value = target.location || '';

    if (elements.editMachineModal) elements.editMachineModal.classList.add('open');
  }

  if (elements.btnOpenEditMachineModal) {
    elements.btnOpenEditMachineModal.addEventListener('click', () => {
      openEditModal(state.activeId);
    });
  }

  if (elements.editMachineModalClose) {
    elements.editMachineModalClose.addEventListener('click', () => {
      if (elements.editMachineModal) elements.editMachineModal.classList.remove('open');
    });
  }

  if (elements.btnSaveMachineDetails) {
    elements.btnSaveMachineDetails.addEventListener('click', async () => {
      const id = elements.editMachineId.value;
      const target = state.machines.find(m => m.id === id);
      if (!target) return;

      const newCustomName = elements.editMachineCustomName.value.trim() || target.machineName;
      const newDeviceType = elements.editMachineDeviceType.value;
      const newAssignedTo = elements.editMachineAssignedTo.value.trim() || 'Staff Member';
      const newLocation = elements.editMachineLocation.value.trim() || 'Office Workstation';

      target.customName = newCustomName;
      target.deviceType = newDeviceType;
      target.assignedTo = newAssignedTo;
      target.location = newLocation;

      SpecsStorage.set(STORAGE_KEYS.MACHINES, state.machines);
      renderActiveTelemetry();
      if (elements.editMachineModal) elements.editMachineModal.classList.remove('open');
      showToast(`Saved: "${newCustomName}" (${newDeviceType} • ${newAssignedTo})!`, 'success');

      // Sync update with cloud API (/api/specs) if reachable
      try {
        await fetch('/api/specs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: target.id,
            serialNumber: target.serialNumber,
            customName: newCustomName,
            deviceType: newDeviceType,
            assignedTo: newAssignedTo,
            location: newLocation
          })
        });
      } catch (e) {}
    });
  }

  // Modal Listeners
  elements.btnOpenScanModal.addEventListener('click', () => elements.scanModal.classList.add('open'));
  elements.scanModalClose.addEventListener('click', () => elements.scanModal.classList.remove('open'));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });

  // Initialization
  function init() {
    applyTheme();
    setupDynamicCommands();
    renderActiveTelemetry();
    syncCloudFleet(false);

    // Auto-sync every 25 seconds for live fleet discovery
    setInterval(() => syncCloudFleet(false), 25000);
  }

  init();
});
