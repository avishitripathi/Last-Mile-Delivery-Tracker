const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/^file:/, "")
  : path.join(__dirname, "..", "..", "dev.db");

const db = new Database(path.isAbsolute(DB_PATH) ? DB_PATH : path.join(__dirname, "..", "..", DB_PATH));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

module.exports = { db, id, now };