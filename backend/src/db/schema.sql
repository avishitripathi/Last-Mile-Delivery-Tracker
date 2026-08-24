-- Last-Mile Delivery Tracker — relational schema (SQLite dialect).
-- Portable to Postgres with only minor type tweaks (TEXT ids -> uuid,
-- DATETIME -> timestamptz, INTEGER booleans -> boolean). See README.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  passwordHash  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('CUSTOMER','AGENT','ADMIN')),
  createdAt     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS zones (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  code      TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Zone detection lookup: every serviceable pincode maps to exactly one zone.
CREATE TABLE IF NOT EXISTS zone_areas (
  id      TEXT PRIMARY KEY,
  zoneId  TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL UNIQUE,
  label   TEXT
);

CREATE TABLE IF NOT EXISTS agent_profiles (
  id            TEXT PRIMARY KEY,
  userId        TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('AVAILABLE','BUSY','OFFLINE')),
  currentLat    REAL,
  currentLng    REAL,
  currentZoneId TEXT REFERENCES zones(id),
  updatedAt     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Which zones an agent is eligible to service (many-to-many).
CREATE TABLE IF NOT EXISTS agent_zones (
  id      TEXT PRIMARY KEY,
  agentId TEXT NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  zoneId  TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  UNIQUE(agentId, zoneId)
);

-- Admin-configurable pricing, one row per (orderType, zoneType).
CREATE TABLE IF NOT EXISTS rate_cards (
  id         TEXT PRIMARY KEY,
  orderType  TEXT NOT NULL CHECK (orderType IN ('B2B','B2C')),
  zoneType   TEXT NOT NULL CHECK (zoneType IN ('INTRA','INTER')),
  ratePerKg  REAL NOT NULL,
  baseCharge REAL NOT NULL,
  minCharge  REAL NOT NULL,
  isActive   INTEGER NOT NULL DEFAULT 1,
  createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(orderType, zoneType)
);

CREATE TABLE IF NOT EXISTS cod_surcharge_configs (
  id         TEXT PRIMARY KEY,
  orderType  TEXT NOT NULL UNIQUE CHECK (orderType IN ('B2B','B2C')),
  flatFee    REAL NOT NULL DEFAULT 0,
  percentFee REAL NOT NULL DEFAULT 0,
  updatedAt  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  orderNumber       TEXT NOT NULL UNIQUE,

  customerId        TEXT NOT NULL REFERENCES users(id),
  createdByAdminId  TEXT REFERENCES users(id),

  pickupAddressLine TEXT NOT NULL,
  pickupCity        TEXT NOT NULL,
  pickupPincode     TEXT NOT NULL,
  pickupZoneId      TEXT REFERENCES zones(id),

  dropAddressLine   TEXT NOT NULL,
  dropCity          TEXT NOT NULL,
  dropPincode       TEXT NOT NULL,
  dropZoneId        TEXT REFERENCES zones(id),

  lengthCm            REAL NOT NULL,
  breadthCm           REAL NOT NULL,
  heightCm            REAL NOT NULL,
  actualWeightKg      REAL NOT NULL,
  volumetricWeightKg  REAL NOT NULL,
  chargeableWeightKg  REAL NOT NULL,

  orderType   TEXT NOT NULL CHECK (orderType IN ('B2B','B2C')),
  paymentType TEXT NOT NULL CHECK (paymentType IN ('PREPAID','COD')),

  zoneTypeUsed     TEXT NOT NULL CHECK (zoneTypeUsed IN ('INTRA','INTER')),
  rateCardId       TEXT REFERENCES rate_cards(id),
  ratePerKgUsed    REAL NOT NULL,
  baseChargeUsed   REAL NOT NULL,
  computedCharge   REAL NOT NULL,
  minChargeApplied INTEGER NOT NULL DEFAULT 0,
  codSurcharge     REAL NOT NULL DEFAULT 0,
  totalCharge      REAL NOT NULL,

  status           TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN
    ('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED','CANCELLED')),
  assignedAgentId  TEXT REFERENCES agent_profiles(id),

  scheduledDate TEXT,
  deliveredAt   TEXT,

  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Immutable, append-only audit trail: every status transition is logged
-- with who did it and when. Rows are only ever INSERTed.
CREATE TABLE IF NOT EXISTS order_status_history (
  id        TEXT PRIMARY KEY,
  orderId   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status    TEXT NOT NULL,
  actorId   TEXT REFERENCES users(id),
  actorRole TEXT,
  note      TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reschedule_requests (
  id            TEXT PRIMARY KEY,
  orderId       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  requestedById TEXT NOT NULL REFERENCES users(id),
  previousDate  TEXT,
  newDate       TEXT NOT NULL,
  reason        TEXT,
  createdAt     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id        TEXT PRIMARY KEY,
  orderId   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel   TEXT NOT NULL CHECK (channel IN ('EMAIL','SMS')),
  recipient TEXT NOT NULL,
  subject   TEXT,
  message   TEXT NOT NULL,
  status    TEXT NOT NULL CHECK (status IN ('SENT','FAILED','SIMULATED')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders(assignedAgentId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_pickupzone ON orders(pickupZoneId);
CREATE INDEX IF NOT EXISTS idx_orders_dropzone ON orders(dropZoneId);
CREATE INDEX IF NOT EXISTS idx_history_order ON order_status_history(orderId);
CREATE INDEX IF NOT EXISTS idx_agentzones_zone ON agent_zones(zoneId);
CREATE INDEX IF NOT EXISTS idx_zoneareas_pincode ON zone_areas(pincode);