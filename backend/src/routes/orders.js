const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { db, id, now } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { calculateCharge } = require("../services/rateEngine");
const { detectZoneByPincode } = require("../services/zoneDetection");
const { findBestAgent, ACTIVE_STATUSES } = require("../services/assignment");
const { notifyOrderStatus } = require("../services/notification");
const { generateOrderNumber } = require("../utils/orderNumber");
const { toBool } = require("../utils/serialize");

const router = express.Router();

// Valid manual status transitions an AGENT may make (in order).
// Admin can override to ANY status regardless of this map.
const AGENT_ALLOWED_TRANSITIONS = {
  ASSIGNED: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
};
const ALL_STATUSES = [
  "CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY",
  "DELIVERED", "FAILED", "RESCHEDULED", "CANCELLED",
];

function getCustomer(customerId) {
  return db.prepare("SELECT id,name,email,phone FROM users WHERE id = ?").get(customerId);
}

function getAgentBrief(agentId) {
  if (!agentId) return null;
  const profile = db.prepare("SELECT * FROM agent_profiles WHERE id = ?").get(agentId);
  if (!profile) return null;
  const user = db.prepare("SELECT id,name,phone FROM users WHERE id = ?").get(profile.userId);
  return { ...profile, user };
}

function hydrateOrder(order) {
  if (!order) return order;
  return toBool(
    {
      ...order,
      customer: getCustomer(order.customerId),
      pickupZone: order.pickupZoneId ? db.prepare("SELECT * FROM zones WHERE id=?").get(order.pickupZoneId) : null,
      dropZone: order.dropZoneId ? db.prepare("SELECT * FROM zones WHERE id=?").get(order.dropZoneId) : null,
      assignedAgent: getAgentBrief(order.assignedAgentId),
    },
    ["minChargeApplied"]
  );
}

function hydrateOrderFull(order) {
  const base = hydrateOrder(order);
  base.statusHistory = db
    .prepare("SELECT * FROM order_status_history WHERE orderId = ? ORDER BY createdAt ASC")
    .all(order.id)
    .map((h) => ({
      ...h,
      actor: h.actorId ? db.prepare("SELECT name, role FROM users WHERE id=?").get(h.actorId) : null,
    }));
  base.rescheduleRequests = db
    .prepare("SELECT * FROM reschedule_requests WHERE orderId = ? ORDER BY createdAt DESC")
    .all(order.id);
  base.notifications = db
    .prepare("SELECT * FROM notifications WHERE orderId = ? ORDER BY createdAt DESC")
    .all(order.id);
  return base;
}

function insertHistory({ orderId, status, actorId, actorRole, note }) {
  db.prepare(
    "INSERT INTO order_status_history (id,orderId,status,actorId,actorRole,note,createdAt) VALUES (?,?,?,?,?,?,?)"
  ).run(id(), orderId, status, actorId || null, actorRole || null, note || null, now());
}

function resolveZonesAndInputs(body) {
  const {
    lengthCm, breadthCm, heightCm, actualWeightKg,
    orderType, paymentType, pickupPincode, dropPincode,
  } = body;

  for (const [k, v] of Object.entries({ lengthCm, breadthCm, heightCm, actualWeightKg })) {
    if (v == null || Number(v) <= 0) {
      const err = new Error(`Invalid package dimension/weight: ${k} must be a positive number`);
      err.status = 400;
      throw err;
    }
  }
  if (!["B2B", "B2C"].includes(orderType)) {
    const err = new Error("orderType must be B2B or B2C");
    err.status = 400;
    throw err;
  }
  if (!["PREPAID", "COD"].includes(paymentType)) {
    const err = new Error("paymentType must be PREPAID or COD");
    err.status = 400;
    throw err;
  }

  return {
    lengthCm: Number(lengthCm),
    breadthCm: Number(breadthCm),
    heightCm: Number(heightCm),
    actualWeightKg: Number(actualWeightKg),
    orderType,
    paymentType,
    pickupZoneId: detectZoneByPincode(pickupPincode),
    dropZoneId: detectZoneByPincode(dropPincode),
  };
}

// -----------------------------------------------------------------------
// QUOTE — compute the charge WITHOUT persisting anything, so the customer
// can see the price before confirming the order.
// -----------------------------------------------------------------------
router.post("/quote", requireAuth, (req, res) => {
  try {
    const inputs = resolveZonesAndInputs(req.body);
    if (!inputs.pickupZoneId || !inputs.dropZoneId) {
      return res.status(422).json({
        error: "One or both pincodes are not mapped to a service zone yet. Ask an admin to add this area to a zone.",
        pickupZoneDetected: !!inputs.pickupZoneId,
        dropZoneDetected: !!inputs.dropZoneId,
      });
    }
    const pricing = calculateCharge(inputs);
    res.json({ ...pricing, pickupZoneId: inputs.pickupZoneId, dropZoneId: inputs.dropZoneId });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// -----------------------------------------------------------------------
// CREATE ORDER
// -----------------------------------------------------------------------
router.post("/", requireAuth, (req, res) => {
  try {
    const {
      pickupAddressLine, pickupCity, pickupPincode,
      dropAddressLine, dropCity, dropPincode,
      customerId: bodyCustomerId, customerName, customerEmail, customerPhone,
    } = req.body;

    if (!pickupAddressLine || !pickupCity || !pickupPincode || !dropAddressLine || !dropCity || !dropPincode) {
      return res.status(400).json({ error: "Full pickup and drop address (line, city, pincode) is required" });
    }

    let customerId = req.user.id;
    let createdByAdminId = null;

    if (req.user.role === "ADMIN") {
      createdByAdminId = req.user.id;
      if (bodyCustomerId) {
        customerId = bodyCustomerId;
      } else if (customerEmail) {
        let customer = db.prepare("SELECT * FROM users WHERE email = ?").get(customerEmail);
        if (!customer) {
          const newId = id();
          db.prepare(
            "INSERT INTO users (id,name,email,phone,passwordHash,role,createdAt) VALUES (?,?,?,?,?,?,?)"
          ).run(newId, customerName || customerEmail, customerEmail, customerPhone || null, bcrypt.hashSync(crypto.randomBytes(9).toString("hex"), 10), "CUSTOMER", now());
          customer = db.prepare("SELECT * FROM users WHERE id = ?").get(newId);
        }
        customerId = customer.id;
      } else {
        return res.status(400).json({ error: "Admin must supply customerId or customerEmail" });
      }
    } else if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({ error: "Only customers or admins can create orders" });
    }

    const inputs = resolveZonesAndInputs(req.body);
    if (!inputs.pickupZoneId || !inputs.dropZoneId) {
      return res.status(422).json({ error: "One or both pincodes are not mapped to a service zone yet." });
    }
    const pricing = calculateCharge(inputs);

    const orderId = id();
    const orderRow = {
      id: orderId,
      orderNumber: generateOrderNumber(),
      customerId,
      createdByAdminId,
      pickupAddressLine, pickupCity, pickupPincode, pickupZoneId: inputs.pickupZoneId,
      dropAddressLine, dropCity, dropPincode, dropZoneId: inputs.dropZoneId,
      lengthCm: inputs.lengthCm, breadthCm: inputs.breadthCm, heightCm: inputs.heightCm,
      actualWeightKg: inputs.actualWeightKg,
      volumetricWeightKg: pricing.volumetricWeightKg,
      chargeableWeightKg: pricing.chargeableWeightKg,
      orderType: inputs.orderType,
      paymentType: inputs.paymentType,
      zoneTypeUsed: pricing.zoneTypeUsed,
      rateCardId: pricing.rateCardId,
      ratePerKgUsed: pricing.ratePerKgUsed,
      baseChargeUsed: pricing.baseChargeUsed,
      computedCharge: pricing.computedCharge,
      minChargeApplied: pricing.minChargeApplied ? 1 : 0,
      codSurcharge: pricing.codSurcharge,
      totalCharge: pricing.totalCharge,
      status: "CREATED",
      createdAt: now(),
      updatedAt: now(),
    };

    const insert = db.prepare(
      `INSERT INTO orders (
        id, orderNumber, customerId, createdByAdminId,
        pickupAddressLine, pickupCity, pickupPincode, pickupZoneId,
        dropAddressLine, dropCity, dropPincode, dropZoneId,
        lengthCm, breadthCm, heightCm, actualWeightKg, volumetricWeightKg, chargeableWeightKg,
        orderType, paymentType, zoneTypeUsed, rateCardId, ratePerKgUsed, baseChargeUsed,
        computedCharge, minChargeApplied, codSurcharge, totalCharge, status, createdAt, updatedAt
      ) VALUES (
        @id, @orderNumber, @customerId, @createdByAdminId,
        @pickupAddressLine, @pickupCity, @pickupPincode, @pickupZoneId,
        @dropAddressLine, @dropCity, @dropPincode, @dropZoneId,
        @lengthCm, @breadthCm, @heightCm, @actualWeightKg, @volumetricWeightKg, @chargeableWeightKg,
        @orderType, @paymentType, @zoneTypeUsed, @rateCardId, @ratePerKgUsed, @baseChargeUsed,
        @computedCharge, @minChargeApplied, @codSurcharge, @totalCharge, @status, @createdAt, @updatedAt
      )`
    );
    insert.run(orderRow);
    insertHistory({ orderId, status: "CREATED", actorId: req.user.id, actorRole: req.user.role, note: "Order created" });

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    const hydrated = hydrateOrderFull(order);
    notifyOrderStatus(order, hydrated.customer);

    res.status(201).json(hydrated);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// -----------------------------------------------------------------------
// LIST / FILTER — role-scoped
// -----------------------------------------------------------------------
router.get("/", requireAuth, (req, res) => {
  const { status, zoneId, agentId } = req.query;
  const clauses = [];
  const params = [];

  if (req.user.role === "CUSTOMER") {
    clauses.push("customerId = ?");
    params.push(req.user.id);
  } else if (req.user.role === "AGENT") {
    const profile = db.prepare("SELECT * FROM agent_profiles WHERE userId = ?").get(req.user.id);
    clauses.push("assignedAgentId = ?");
    params.push(profile ? profile.id : "__none__");
  }

  if (status) { clauses.push("status = ?"); params.push(status); }
  if (zoneId) { clauses.push("(pickupZoneId = ? OR dropZoneId = ?)"); params.push(zoneId, zoneId); }
  if (agentId && req.user.role === "ADMIN") { clauses.push("assignedAgentId = ?"); params.push(agentId); }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const orders = db.prepare(`SELECT * FROM orders ${where} ORDER BY createdAt DESC`).all(...params);
  res.json(orders.map(hydrateOrder));
});

// -----------------------------------------------------------------------
// GET ONE — with full immutable tracking timeline
// -----------------------------------------------------------------------
router.get("/:id", requireAuth, (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role === "CUSTOMER" && order.customerId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (req.user.role === "AGENT") {
    const profile = db.prepare("SELECT * FROM agent_profiles WHERE userId = ?").get(req.user.id);
    if (!profile || order.assignedAgentId !== profile.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }
  res.json(hydrateOrderFull(order));
});

// -----------------------------------------------------------------------
// ASSIGN — admin manual assignment OR auto-assignment
// -----------------------------------------------------------------------
router.post("/:id/assign", requireAuth, requireRole("ADMIN"), (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    let agentProfile;
    if (req.body.auto) {
      agentProfile = findBestAgent({ pickupZoneId: order.pickupZoneId });
      if (!agentProfile) return res.status(409).json({ error: "No available agent found for this pickup zone" });
    } else {
      if (!req.body.agentId) return res.status(400).json({ error: "agentId is required for manual assignment" });
      agentProfile = db.prepare("SELECT * FROM agent_profiles WHERE id = ?").get(req.body.agentId);
      if (!agentProfile) return res.status(404).json({ error: "Agent not found" });
    }

    db.prepare("UPDATE orders SET assignedAgentId = ?, status = ?, updatedAt = ? WHERE id = ?").run(
      agentProfile.id, "ASSIGNED", now(), order.id
    );
    insertHistory({
      orderId: order.id, status: "ASSIGNED", actorId: req.user.id, actorRole: "ADMIN",
      note: req.body.auto ? `Auto-assigned to agent ${agentProfile.id}` : `Manually assigned to agent ${agentProfile.id}`,
    });

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
    const hydrated = hydrateOrderFull(updated);
    notifyOrderStatus(updated, hydrated.customer);
    res.json(hydrated);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// -----------------------------------------------------------------------
// STATUS UPDATE — agent progresses their own order; admin can override to
// any status at any time (audit trail records the override).
// -----------------------------------------------------------------------
router.patch("/:id/status", requireAuth, (req, res) => {
  try {
    const { status, note } = req.body;
    if (!ALL_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (req.user.role === "AGENT") {
      const profile = db.prepare("SELECT * FROM agent_profiles WHERE userId = ?").get(req.user.id);
      if (!profile || order.assignedAgentId !== profile.id) {
        return res.status(403).json({ error: "You are not assigned to this order" });
      }
      const allowed = AGENT_ALLOWED_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        return res.status(409).json({ error: `Cannot move order from ${order.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}` });
      }
    } else if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const deliveredAt = status === "DELIVERED" ? now() : order.deliveredAt;
    db.prepare("UPDATE orders SET status = ?, deliveredAt = ?, updatedAt = ? WHERE id = ?").run(
      status, deliveredAt, now(), order.id
    );
    insertHistory({
      orderId: order.id, status, actorId: req.user.id, actorRole: req.user.role,
      note: note || (req.user.role === "ADMIN" ? "Status overridden by admin" : undefined),
    });

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
    const hydrated = hydrateOrderFull(updated);
    notifyOrderStatus(updated, hydrated.customer);
    res.json(hydrated);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// -----------------------------------------------------------------------
// RESCHEDULE — after a FAILED delivery, customer (or admin) picks a new
// date. Order moves to RESCHEDULED and is re-queued for the new attempt.
// -----------------------------------------------------------------------
router.post("/:id/reschedule", requireAuth, (req, res) => {
  try {
    const { newDate, reason, reassignAgentId, autoReassign } = req.body;
    if (!newDate) return res.status(400).json({ error: "newDate is required" });

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "FAILED") return res.status(409).json({ error: "Only a FAILED order can be rescheduled" });
    if (req.user.role === "CUSTOMER" && order.customerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    let newAgentId = order.assignedAgentId;
    if (req.user.role === "ADMIN") {
      if (autoReassign) {
        const agent = findBestAgent({ pickupZoneId: order.pickupZoneId });
        newAgentId = agent ? agent.id : null;
      } else if (reassignAgentId) {
        newAgentId = reassignAgentId;
      }
    }

    const newDateIso = new Date(newDate).toISOString();
    const tx = db.transaction(() => {
      db.prepare(
        "INSERT INTO reschedule_requests (id,orderId,requestedById,previousDate,newDate,reason,createdAt) VALUES (?,?,?,?,?,?,?)"
      ).run(id(), order.id, req.user.id, order.scheduledDate, newDateIso, reason || null, now());

      db.prepare("UPDATE orders SET scheduledDate = ?, assignedAgentId = ?, status = ?, updatedAt = ? WHERE id = ?").run(
        newDateIso, newAgentId, "RESCHEDULED", now(), order.id
      );
      insertHistory({
        orderId: order.id, status: "RESCHEDULED", actorId: req.user.id, actorRole: req.user.role,
        note: `Rescheduled to ${newDateIso}${reason ? ` — ${reason}` : ""}`,
      });
    });
    tx();

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
    const hydrated = hydrateOrderFull(updated);
    notifyOrderStatus(updated, hydrated.customer);
    res.json(hydrated);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

module.exports = router;