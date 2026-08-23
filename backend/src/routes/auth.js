const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, id, now } = require("../db");

const router = express.Router();

function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function safe(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// Public self-registration is always CUSTOMER. Agent/Admin accounts are
// created by an admin via /api/agents (or seeded) to avoid privilege
// escalation through the public signup form.
router.post("/register", (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user = {
      id: id(),
      name,
      email,
      phone: phone || null,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "CUSTOMER",
      createdAt: now(),
    };
    db.prepare(
      "INSERT INTO users (id,name,email,phone,passwordHash,role,createdAt) VALUES (@id,@name,@email,@phone,@passwordHash,@role,@createdAt)"
    ).run(user);

    res.status(201).json({ token: sign(user), user: safe(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json({ token: sign(user), user: safe(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;