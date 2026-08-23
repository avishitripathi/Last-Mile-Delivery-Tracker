const express = require("express");
const { db, id, now } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { toBool } = require("../utils/serialize");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const rateCards = db.prepare("SELECT * FROM rate_cards ORDER BY orderType ASC, zoneType ASC").all();
  const codConfigs = db.prepare("SELECT * FROM cod_surcharge_configs").all();
  res.json({
    rateCards: rateCards.map((r) => toBool(r, ["isActive"])),
    codConfigs,
  });
});

// Upsert a rate card for (orderType, zoneType)
router.put("/", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    const { orderType, zoneType, ratePerKg, baseCharge, minCharge, isActive = true } = req.body;
    if (!orderType || !zoneType) {
      return res.status(400).json({ error: "orderType and zoneType are required" });
    }
    const existing = db.prepare("SELECT * FROM rate_cards WHERE orderType = ? AND zoneType = ?").get(orderType, zoneType);
    if (existing) {
      db.prepare(
        "UPDATE rate_cards SET ratePerKg=?, baseCharge=?, minCharge=?, isActive=?, updatedAt=? WHERE id=?"
      ).run(ratePerKg, baseCharge, minCharge, isActive ? 1 : 0, now(), existing.id);
      return res.json(toBool(db.prepare("SELECT * FROM rate_cards WHERE id=?").get(existing.id), ["isActive"]));
    }
    const row = { id: id(), orderType, zoneType, ratePerKg, baseCharge, minCharge, isActive: isActive ? 1 : 0, createdAt: now(), updatedAt: now() };
    db.prepare(
      "INSERT INTO rate_cards (id,orderType,zoneType,ratePerKg,baseCharge,minCharge,isActive,createdAt,updatedAt) VALUES (@id,@orderType,@zoneType,@ratePerKg,@baseCharge,@minCharge,@isActive,@createdAt,@updatedAt)"
    ).run(row);
    res.json(toBool(row, ["isActive"]));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Upsert COD surcharge config per order type
router.put("/cod", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    const { orderType, flatFee, percentFee } = req.body;
    if (!orderType) return res.status(400).json({ error: "orderType is required" });
    const existing = db.prepare("SELECT * FROM cod_surcharge_configs WHERE orderType = ?").get(orderType);
    if (existing) {
      db.prepare("UPDATE cod_surcharge_configs SET flatFee=?, percentFee=?, updatedAt=? WHERE id=?").run(
        flatFee, percentFee, now(), existing.id
      );
      return res.json(db.prepare("SELECT * FROM cod_surcharge_configs WHERE id=?").get(existing.id));
    }
    const row = { id: id(), orderType, flatFee, percentFee, updatedAt: now() };
    db.prepare(
      "INSERT INTO cod_surcharge_configs (id,orderType,flatFee,percentFee,updatedAt) VALUES (@id,@orderType,@flatFee,@percentFee,@updatedAt)"
    ).run(row);
    res.json(row);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;