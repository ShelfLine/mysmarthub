// ==============================================================================
// VERCEL SERVERLESS CLOUD ENDPOINT: /api/specs
// Receives, stores, and serves hardware telemetry from all fleet user PCs
// ==============================================================================

// In-memory cache for serverless lifecycle
let fleetCache = [];

export default async function handler(req, res) {
  // Enable CORS so machines can report from anywhere
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. GET: Return all fleet machines reported by users
  if (req.method === 'GET') {
    // If KV / Redis is configured, fetch from KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const kvRes = await fetch(`${process.env.KV_REST_API_URL}/get/fleet_machines`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
        });
        const kvData = await kvRes.json();
        if (kvData.result) {
          const parsed = typeof kvData.result === 'string' ? JSON.parse(kvData.result) : kvData.result;
          return res.status(200).json({ success: true, source: 'kv', machines: parsed });
        }
      } catch (e) {
        console.warn('KV read failed, falling back to cache:', e);
      }
    }

    return res.status(200).json({
      success: true,
      source: 'memory',
      count: fleetCache.length,
      machines: fleetCache
    });
  }

  // 2. POST: Receive new machine specs from scan.ps1
  if (req.method === 'POST') {
    try {
      let payload = req.body;
      if (typeof payload === 'string') {
        payload = JSON.parse(payload.replace(/^\uFEFF/, '').trim());
      }

      if (!payload || !payload.serialNumber) {
        return res.status(400).json({ success: false, error: 'Missing serialNumber or hardware payload' });
      }

      // Generate unique ID from serial or machineName
      const id = 'pc-' + payload.serialNumber.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const machineRecord = {
        id,
        scannedAt: payload.scannedAt || new Date().toISOString(),
        machineName: payload.machineName || 'Remote User PC',
        manufacturer: payload.manufacturer || 'OEM',
        model: payload.model || 'Workstation',
        serialNumber: payload.serialNumber,
        motherboard: payload.motherboard || 'System Board',
        location: payload.location || 'Remote Employee / Office',
        assignedTo: payload.assignedTo || payload.machineName || 'Staff Member',
        processor: payload.processor || { name: 'Processor', generation: 'Modern Multi-Core' },
        memory: payload.memory || { totalGB: 4, speedMHz: 2667, type: 'DDR4' },
        storage: payload.storage || [],
        volumes: payload.volumes || [],
        graphics: payload.graphics || 'Display Adapter',
        os: payload.os || 'Windows (64-bit)'
      };

      // Upsert in memory cache
      const existingIdx = fleetCache.findIndex(m => m.serialNumber === machineRecord.serialNumber);
      if (existingIdx !== -1) {
        fleetCache[existingIdx] = machineRecord;
      } else {
        fleetCache.unshift(machineRecord);
      }

      // If Vercel KV is configured, persist permanently
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
          await fetch(`${process.env.KV_REST_API_URL}/set/fleet_machines`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(JSON.stringify(fleetCache))
          });
        } catch (e) {
          console.warn('KV persist error:', e);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Hardware specs received for ${machineRecord.machineName} (${machineRecord.serialNumber})`,
        machine: machineRecord
      });
    } catch (err) {
      console.error('Error handling specs POST:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. DELETE: Remove machine or clear
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (id) {
      fleetCache = fleetCache.filter(m => m.id !== id);
    } else {
      fleetCache = [];
    }

    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await fetch(`${process.env.KV_REST_API_URL}/set/fleet_machines`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(JSON.stringify(fleetCache))
        });
      } catch (e) {}
    }

    return res.status(200).json({ success: true, message: 'Deleted' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
