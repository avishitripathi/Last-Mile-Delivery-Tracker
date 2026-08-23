const express = require("express");
const { db } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/customers", (req, res) => {
  const customers = db
    .prepare("SELECT id,name,email,phone,createdAt FROM users WHERE role='CUSTOMER' ORDER BY createdAt DESC")
    .all();
  res.json(customers);
});

router.get("/summary", (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const byStatusRows = db.prepare("SELECT status, COUNT(*) as c FROM orders GROUP BY status").all();
  const totalAgents = db.prepare("SELECT COUNT(*) as c FROM agent_profiles").get().c;
  const availableAgents = db.prepare("SELECT COUNT(*) as c FROM agent_profiles WHERE status='AVAILABLE'").get().c;

  res.json({
    totalOrders,
    byStatus: Object.fromEntries(byStatusRows.map((r) => [r.status, r.c])),
    totalAgents,
    availableAgents,
  });
});

module.exports = router;