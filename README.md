# ⚡ CyberSpecs — Online PC Hardware Telemetry & Fleet Tracker

An advanced, responsive, and futuristic **Online PC Hardware Telemetry Dashboard & Disk Health Tracker** designed in the **Aurora Obsidian & Cyber Telemetry HUD** UI theme.

Built using **HTML5, CSS3, ES6+ JavaScript, Vercel Serverless Functions, and GitHub**, it allows IT administrators, tech teams, and office managers to track genuine low-level hardware metrics across **all user PCs online**: **Processor Generation**, **SMBIOS Serial Number / Service Tag**, **DDR RAM Capacity & Clock Frequency**, and **Physical SSD vs. HDD Health & Free Space Telemetry Matrix**.

---

## 🌐 Method 1: 1-Line Online Cloud Telemetry (Zero Install)

Because modern web browsers run inside a security sandbox, they cannot directly read motherboard serials or physical disk models. **CyberSpecs** solves this with **Method 1**: a zero-install, 1-line PowerShell command that can be run on **any remote user PC**:

```powershell
irm https://<YOUR-VERCEL-DOMAIN>/scan.ps1 | iex
```

### ⚡ How It Works in 3 Seconds:
1. **Zero Download**: The user simply opens Windows PowerShell, pastes the 1-liner, and presses <kbd>Enter</kbd>.
2. **Safe & Read-Only**: Queries WMI/CIM for the CPU generation, serial tag, RAM, and SSD/HDD health status.
3. **Automatic Cloud Push**: Transmits the JSON payload via HTTP `POST /api/specs` straight into your central Vercel cloud dashboard.
4. **Instant Dashboard Appearance**: The admin's dashboard automatically refreshes and displays the new computer tile with full telemetry specs!

> [!TIP]
> **Prefer double-clicking a file?** Users can also download **`CyberSpecs-Scan.bat`** directly from the website header or modal, which runs the exact same scan in 1 click!

---

## 🎨 UI Theme: Aurora Obsidian & Cyber Telemetry HUD

- **Color Palette**: Deep void obsidian (`#050811`) background with ambient holographic cyan (`#00f5ff`), electric violet (`#8b5cf6`), and quantum green (`#10b981`) telemetry glows.
- **Live Fleet Polling**: Real-time cloud sync pill (`🟢 Cloud Live: X PCs`) with auto-polling every 25 seconds and manual refresh (`🔄 Sync Cloud`).
- **Physical Disk Telemetry Matrix**: Instant visual badges for SSD (`⚡ SSD`) vs HDD (`💾 HDD`), capacity, bus type (SATA / NVMe), SMART health (`🟢 Healthy (OK)`), and logical volume partition utilization bars (`C:`, `D:`, `E:`).
- **Theme Switcher**: Instant toggle between **Aurora Obsidian (Dark)** and **Cyber Slate (Light)**.

---

## 💾 Live Verified Physical Drives & Health Status

| Physical Drive | Media Type | Health & SMART | Capacity & Partitions | Status |
| :--- | :--- | :--- | :--- | :---: |
| **`POWER X SS1000`** | **SSD (Solid State Drive)** | 🟢 **Healthy (OK)** | **`119 GB`** • Mounts `C:\` (Fast Boot & OS)<br>• 49.4 GB Free (42% free space) | **Operational** |
| **`TOSHIBA MQ01ABD100`** | **HDD (Hard Disk Drive)** | 🟢 **Healthy (OK)** | **`932 GB (1 TB)`** • Partitioned into:<br>• `D:\` 465.8 GB (463.1 GB Free - 99%)<br>• `E:\` 465.8 GB (374.6 GB Free - 80%) | **Operational** |

---

## 🧠 System & Processor Telemetry

| Telemetry Pillar | Detected Values | Detection Method |
| :--- | :--- | :--- |
| **🧠 Processor & Generation** | **`Intel(R) Core(TM) i3-7020U CPU @ 2.30GHz`**<br>• **Generation**: `7th Generation Intel Core`<br>• **Topology**: 2 Physical Cores, 4 Logical Threads | Read from `Win32_Processor` with auto-generation regex classifier. |
| **🏷️ Asset Serial / Service Tag** | **`FHCGDX2`** (Dell Service Tag) | Read from `Win32_BIOS` (BIOS / Motherboard Serial). |
| **⚡ Physical Memory (RAM)** | **`4 GB DDR4 SDRAM @ 2667 MHz`** | Read from `Win32_PhysicalMemory` (Capacity, Speed, Channel topology). |
| **🖥️ Motherboard & OEM System** | **`Dell Inc. Vostro 3581`** • Motherboard: `Dell Inc. 0KVNNP` | Read from `Win32_BaseBoard` & `Win32_ComputerSystem`. |
| **🎮 Graphics & Operating System** | `Intel(R) HD Graphics 620` • `Microsoft Windows 10 Pro (64-bit)` | Read from `Win32_VideoController` & `Win32_OperatingSystem`. |

---

## 📁 Project Architecture

```
mysmarthub/
├── api/
│   ├── scan.js          # Dynamic PowerShell script server (injects host domain)
│   └── specs.js         # Cloud API receiver (GET fleet, POST report, DELETE)
├── css/
│   └── styles.css       # Aurora Obsidian & Cyber Telemetry UI theme design system
├── js/
│   ├── app.js           # Telemetry renderer, cloud fleet sync, dynamic 1-liner & batch generator
│   └── data.js          # Hardware schema, CPU generation classifier, CSV/JSON backup & restore
├── index.html           # Cyber Telemetry HUD layout, Hero HUD cards, fleet grid & scan modals
├── scan.ps1             # Safe, read-only Windows PowerShell hardware scanner script
├── scan.bat             # 1-click batch launcher for non-technical users
├── system-specs.json    # Real detected specs from your host PC (Dell Vostro 3581)
├── vercel.json          # Serverless routing, rewrites (/scan.ps1 -> /api/scan) & CORS
├── .gitignore           # Git ignore exclusions
└── README.md            # Complete documentation & deployment guide
```

---

## 🐙 Step-by-Step GitHub Setup

### Step 1: Initialize Git and Commit
Open PowerShell in `d:\Code\mysmarthub` and run:
```bash
git init
git add .
git commit -m "feat: complete CyberSpecs online hardware telemetry fleet tracker"
```

### Step 2: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Set repository name: `mysmarthub` (or `cyberspecs`).
3. Set visibility to **Public** or **Private**.
4. Leave "Add a README file" **unchecked**.
5. Click **Create repository**.

### Step 3: Link and Push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/mysmarthub.git
git push -u origin main
```
*(Replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub username).*

---

## ▲ Step-by-Step Vercel Deployment

Deploying this telemetry portal to Vercel takes under 60 seconds:

### Method 1: Deploy via Vercel Web Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** ➔ **Project**.
3. Under **Import Git Repository**, select your `mysmarthub` repo.
4. In project configuration:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./`
   - **Build & Output Settings**: Leave empty (zero build configuration required).
5. Click **Deploy**.
6. In ~15 seconds, Vercel gives you your production URL:
   `https://<your-project>.vercel.app`

### Step 4: Share with Your User PCs!
Once deployed, share this single line with any user in your office (via Teams, Slack, or Email):
```powershell
irm https://<your-project>.vercel.app/scan.ps1 | iex
```
As soon as they press Enter, their machine's CPU model, generation, serial number, RAM, and SSD vs HDD health will instantly appear on your dashboard!

---

## 🔒 Security & Privacy Guarantee
- The scanner script (`scan.ps1`) is **100% read-only** (it only queries hardware information via Windows CIM/WMI; it modifies zero files and requires zero administrative privileges).
- Data is transmitted encrypted over HTTPS directly to your private `/api/specs` endpoint.

---

## 📄 License
MIT License. Free for personal, commercial, and enterprise IT hardware fleet tracking.
