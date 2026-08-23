const express = require("express");
const { db, id, now } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function withDetail(zone) {
  const areas = db.prepare("SELECT * FROM zone_areas WHERE zoneId = ?").all(zone.id);
  const agentZones = db
    .prepare(
      `SELECT az.id, ap.id as agentId, u.name as agentName, u.id as userId, ap.status
       FROM agent_zones az JOIN agent_profiles ap ON ap.id = az.agentId JOIN users u ON u.id = ap.userId
       WHERE az.zoneId = ?`
    )
    .all(zone.id);
  return { ...zone, areas, agents: agentZones };
}

// Anyone authenticated can list zones (needed for order form dropdowns etc.)
router.get("/", requireAuth, (req, res) => {
  const zones = db.prepare("SELECT * FROM zones ORDER BY name ASC").all();
  res.json(zones.map(withDetail));
});

router.post("/", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: "name and code are required" });
    const zone = { id: id(), name, code, createdAt: now() };
    db.prepare("INSERT INTO zones (id,name,code,createdAt) VALUES (@id,@name,@code,@createdAt)").run(zone);
    res.status(201).json(zone);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    db.prepare("DELETE FROM zones WHERE id = ?").run(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Assign a pincode/area to a zone (creates or re-maps it)
router.post("/:id/areas", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    const { pincode, label } = req.body;
    if (!pincode) return res.status(400).json({ error: "pincode is required" });
    const existing = db.prepare("SELECT * FROM zone_areas WHERE pincode = ?").get(pincode);
    if (existing) {
      db.prepare("UPDATE zone_areas SET zoneId = ?, label = ? WHERE pincode = ?").run(req.params.id, label || null, pincode);
      return res.status(200).json({ ...existing, zoneId: req.params.id, label });
    }
    const area = { id: id(), zoneId: req.params.id, pincode, label: label || null };
    db.prepare("INSERT INTO zone_areas (id,zoneId,pincode,label) VALUES (@id,@zoneId,@pincode,@label)").run(area);
    res.status(201).json(area);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/areas/:areaId", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    db.prepare("DELETE FROM zone_areas WHERE id = ?").run(req.params.areaId);
    res.status(204).end();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;