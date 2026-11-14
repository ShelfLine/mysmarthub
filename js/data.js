/* ==========================================================================
   SYSTEM SPECS & HARDWARE TELEMETRY TRACKER - DATA MODULE
   Hardware asset presets, specs schemas, JSON parser & storage layer
   ========================================================================== */

const STORAGE_KEYS = {
  MACHINES: 'telemetry_machines',
  ACTIVE_ID: 'telemetry_active_id',
  SETTINGS: 'telemetry_settings'
};

const DEFAULT_SETTINGS = {
  theme: 'dark'
};

// Seed hardware data including the real detected Dell PC
const DEFAULT_MACHINES = [
  {
    id: 'pc-dell-vostro',
    scannedAt: '2026-11-15 00:37:47',
    machineName: 'JAGDISH',
    customName: "Jagdish's Laptop",
    assignedTo: 'Jagdish',
    deviceType: 'Laptop',
    manufacturer: 'Dell Inc.',
    model: 'Vostro 3581',
    serialNumber: 'FHCGDX2',
    motherboard: 'Dell Inc. 0KVNNP',
    location: 'Primary Laptop / Workstation',
    processor: {
      name: 'Intel(R) Core(TM) i3-7020U CPU @ 2.30GHz',
      generation: '7th Generation Intel Core',
      cores: 2,
      logicalProcessors: 4,
      maxClockMHz: 2304
    },
    memory: {
      totalGB: 4,
      speedMHz: 2667,
      type: 'DDR4 SDRAM',
      slotsUsed: 1
    },
    storage: [
      {
        Model: 'POWER X SS1000',
        MediaType: 'SSD',
        SizeGB: 119,
        BusType: 'SATA (Solid State Drive)',
        HealthStatus: 'Healthy',
        OperationalStatus: 'OK',
        Role: 'Fast OS Boot Drive (C:)'
      },
      {
        Model: 'TOSHIBA MQ01ABD100',
        MediaType: 'HDD',
        SizeGB: 932,
        BusType: 'SATA (Hard Disk Drive)',
        HealthStatus: 'Healthy',
        OperationalStatus: 'OK',
        Role: 'Secondary Bulk Storage (D:, E:)'
      }
    ],
    volumes: [
      {
        DriveLetter: 'C:',
        Label: 'Local Disk (SSD)',
        TotalGB: 118.6,
        FreeGB: 49.4,
        UsedGB: 69.2,
        UsagePercent: 58,
        Health: 'Healthy'
      },
      {
        DriveLetter: 'D:',
        Label: 'New Volume (HDD Part 1)',
        TotalGB: 465.8,
        FreeGB: 463.1,
        UsedGB: 2.7,
        UsagePercent: 1,
        Health: 'Healthy'
      },
      {
        DriveLetter: 'E:',
        Label: 'New Volume (HDD Part 2)',
        TotalGB: 465.8,
        FreeGB: 374.6,
        UsedGB: 91.2,
        UsagePercent: 20,
        Health: 'Healthy'
      }
    ],
    graphics: 'Intel(R) HD Graphics 620',
    os: 'Microsoft Windows 10 Pro (64-bit)'
  },
  {
    id: 'pc-workstation-pro',
    scannedAt: '2026-11-10 14:15:00',
    machineName: 'DESKTOP-THCSER',
    customName: 'Engineering 3D Render PC',
    assignedTo: 'Engineering Lab',
    deviceType: 'Desktop PC',
    manufacturer: 'Custom Built Architecture',
    model: 'Z790 Creator Edition',
    serialNumber: 'SN-ASUS-994201',
    motherboard: 'ASUS ProArt Z790-CREATOR WIFI',
    location: 'Office Lab (Bay 4)',
    assignedTo: 'Engineering & 3D Render',
    processor: {
      name: 'Intel(R) Core(TM) i9-14900K CPU @ 3.20GHz',
      generation: '14th Generation Intel Core (Raptor Lake Refresh)',
      cores: 24,
      logicalProcessors: 32,
      maxClockMHz: 6000
    },
    memory: {
      totalGB: 64,
      speedMHz: 6000,
      type: 'DDR5 SDRAM',
      slotsUsed: 2
    },
    storage: [
      {
        Model: 'Samsung SSD 990 PRO 2TB',
        MediaType: 'SSD',
        SizeGB: 2000,
        BusType: 'NVMe PCIe 4.0 (Gen 4)',
        HealthStatus: 'Healthy',
        OperationalStatus: 'OK',
        Role: 'Ultra-Fast OS & Project Scratch'
      },
      {
        Model: 'Seagate IronWolf Pro 8TB',
        MediaType: 'HDD',
        SizeGB: 8000,
        BusType: 'SATA 6Gb/s (Enterprise HDD)',
        HealthStatus: 'Healthy',
        OperationalStatus: 'OK',
        Role: 'Cold Project Archive & Datasets'
      }
    ],
    volumes: [
      {
        DriveLetter: 'C:',
        Label: 'NVMe System',
        TotalGB: 1900,
        FreeGB: 1250,
        UsedGB: 650,
        UsagePercent: 34,
        Health: 'Healthy'
      },
      {
        DriveLetter: 'D:',
        Label: 'Archive Pool',
        TotalGB: 7600,
        FreeGB: 4100,
        UsedGB: 3500,
        UsagePercent: 46,
        Health: 'Healthy'
      }
    ],
    graphics: 'NVIDIA GeForce RTX 4080 (16GB GDDR6X)',
    os: 'Microsoft Windows 11 Pro for Workstations (64-bit)'
  }
];

class SpecsStorage {
  static get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Error reading ${key}:`, e);
      return fallback;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }

  static parseCpuGeneration(cpuName) {
    if (!cpuName) return 'Unknown Processor';
    if (cpuName.match(/i[3579]-(\d{1,2})\d{3}/i)) {
      const genNum = RegExp.$1;
      return `${genNum}th Generation Intel Core`;
    }
    if (cpuName.match(/i[3579]-(\d)\d{2}\b/i)) {
      const genNum = RegExp.$1;
      return `${genNum}st Generation Intel Core`;
    }
    if (cpuName.match(/Ryzen \d (\d)\d{3}/i)) {
      const series = RegExp.$1;
      return `AMD Ryzen ${series}000 Series`;
    }
    if (cpuName.match(/Apple M(\d)/i)) {
      return `Apple Silicon M${RegExp.$1}`;
    }
    if (cpuName.match(/Xeon/i)) return 'Intel Xeon Server Processor';
    if (cpuName.match(/EPYC/i)) return 'AMD EPYC Server Processor';
    return 'Modern Multi-Core Processor';
  }

  static exportBackup() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      machines: this.get(STORAGE_KEYS.MACHINES, DEFAULT_MACHINES),
      settings: this.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    };
    return JSON.stringify(backup, null, 2);
  }

  static importBackup(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.machines) this.set(STORAGE_KEYS.MACHINES, parsed.machines);
      if (parsed.settings) this.set(STORAGE_KEYS.SETTINGS, parsed.settings);
      return true;
    } catch (e) {
      console.error('Import parse error:', e);
      return false;
    }
  }

  static exportCsv() {
    const machines = this.get(STORAGE_KEYS.MACHINES, DEFAULT_MACHINES);
    const headers = ['Friendly Label', 'Assigned User', 'Device Type', 'System Hostname', 'Manufacturer & Model', 'Serial Number / Service Tag', 'CPU Model', 'CPU Generation', 'RAM (GB)', 'Storage Drives & Health', 'OS'];
    const rows = machines.map(m => {
      const storageStr = (m.storage || []).map(s => `${s.MediaType}: ${s.Model} (${s.SizeGB}GB, Health: ${s.HealthStatus || 'Healthy'})`).join(' | ');
      return [
        `"${m.customName || m.machineName}"`,
        `"${m.assignedTo || '-'}"`,
        `"${m.deviceType || 'PC'}"`,
        `"${m.machineName}"`,
        `"${m.manufacturer} ${m.model}"`,
        `"${m.serialNumber}"`,
        `"${m.processor ? m.processor.name : '-'}"`,
        `"${m.processor ? m.processor.generation : '-'}"`,
        `"${m.memory ? m.memory.totalGB : '-'}"`,
        `"${storageStr}"`,
        `"${m.os || '-'}"`
      ];
    });
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  static resetDefaults() {
    this.set(STORAGE_KEYS.MACHINES, DEFAULT_MACHINES);
    this.set(STORAGE_KEYS.ACTIVE_ID, DEFAULT_MACHINES[0].id);
    this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
}

window.SpecsStorage = SpecsStorage;
window.STORAGE_KEYS = STORAGE_KEYS;
window.DEFAULT_MACHINES = DEFAULT_MACHINES;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
