const express = require("express");
const bcrypt = require("bcryptjs");
const { db, id, now } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ACTIVE_STATUSES } = require("../services/assignment");

const router = express.Router();
const activePlaceholders = ACTIVE_STATUSES.map(() => "?").join(",");

function agentWithDetail(profile) {
  const user = db.prepare("SELECT id,name,email,phone FROM users WHERE id = ?").get(profile.userId);
  const zones = db
    .prepare(
      `SELECT z.* FROM agent_zones az JOIN zones z ON z.id = az.zoneId WHERE az.agentId = ?`
    )
    .all(profile.id);
  const activeOrderCount = db
    .prepare(`SELECT COUNT(*) as c FROM orders WHERE assignedAgentId=? AND status IN (${activePlaceholders})`)
    .get(profile.id, ...ACTIVE_STATUSES).c;
  return { ...profile, user, zones, activeOrderCount };
}

// Admin: list all agents with their zones + current load
router.get("/", requireAuth, requireRole("ADMIN"), (req, res) => {
  const agents = db.prepare("SELECT * FROM agent_profiles").all();
  res.json(agents.map(agentWithDetail));
});

// Admin: create a new agent (user + profile in one step)
router.post("/", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    const { name, email, phone, password, zoneIds = [] } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const userId = id();
    db.prepare(
      "INSERT INTO users (id,name,email,phone,passwordHash,role,createdAt) VALUES (?,?,?,?,?,?,?)"
    ).run(userId, name, email, phone || null, bcrypt.hashSync(password, 10), "AGENT", now());

    const profileId = id();
    db.prepare(
      "INSERT INTO agent_profiles (id,userId,status,updatedAt) VALUES (?,?,?,?)"
    ).run(profileId, userId, "OFFLINE", now());

    for (const zoneId of zoneIds) {
      db.prepare("INSERT INTO agent_zones (id,agentId,zoneId) VALUES (?,?,?)").run(id(), profileId, zoneId);
    }

    const profile = db.prepare("SELECT * FROM agent_profiles WHERE id = ?").get(profileId);
    res.status(201).json(agentWithDetail(profile));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Admin: change an agent's zone coverage
router.put("/:agentId/zones", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    const { zoneIds = [] } = req.body;
    db.prepare("DELETE FROM agent_zones WHERE agentId = ?").run(req.params.agentId);
    for (const zoneId of zoneIds) {
      db.prepare("INSERT INTO agent_zones (id,agentId,zoneId) VALUES (?,?,?)").run(id(), req.params.agentId, zoneId);
    }
    const profile = db.prepare("SELECT * FROM agent_profiles WHERE id = ?").get(req.params.agentId);
    if (!profile) return res.status(404).json({ error: "Agent not found" });
    res.json(agentWithDetail(profile));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Agent (or admin): update own availability status / current location
router.patch("/:agentId/status", requireAuth, (req, res) => {
  try {
    const profile = db.prepare("SELECT * FROM agent_profiles WHERE id = ?").get(req.params.agentId);
    if (!profile) return res.status(404).json({ error: "Agent not found" });
    if (req.user.role !== "ADMIN" && profile.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { status, currentLat, currentLng, currentZoneId } = req.body;
    db.prepare(
      `UPDATE agent_profiles SET
        status = COALESCE(?, status),
        currentLat = COALESCE(?, currentLat),
        currentLng = COALESCE(?, currentLng),
        currentZoneId = COALESCE(?, currentZoneId),
        updatedAt = ?
       WHERE id = ?`
    ).run(status || null, currentLat ?? null, currentLng ?? null, currentZoneId || null, now(), req.params.agentId);
    res.json(db.prepare("SELECT * FROM agent_profiles WHERE id = ?").get(req.params.agentId));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Agent: get my own profile
router.get("/me", requireAuth, requireRole("AGENT"), (req, res) => {
  const profile = db.prepare("SELECT * FROM agent_profiles WHERE userId = ?").get(req.user.id);
  if (!profile) return res.status(404).json({ error: "Agent profile not found" });
  res.json(agentWithDetail(profile));
});

module.exports = router;