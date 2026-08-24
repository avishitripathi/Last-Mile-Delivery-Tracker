const bcrypt = require("bcryptjs");
const { db, id, now } = require("./index");

const hash = (pw) => bcrypt.hashSync(pw, 10);

function upsertUser({ name, email, phone, password, role }) {
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) return existing;

  const row = {
    id: id(),
    name,
    email,
    phone,
    passwordHash: hash(password),
    role,
    createdAt: now(),
  };

  db.prepare(
    "INSERT INTO users (id,name,email,phone,passwordHash,role,createdAt) VALUES (@id,@name,@email,@phone,@passwordHash,@role,@createdAt)"
  ).run(row);

  return row;
}

function upsertZone({ name, code }) {
  const existing = db.prepare("SELECT * FROM zones WHERE code = ?").get(code);
  if (existing) return existing;

  const row = {
    id: id(),
    name,
    code,
    createdAt: now(),
  };

  db.prepare(
    "INSERT INTO zones (id,name,code,createdAt) VALUES (@id,@name,@code,@createdAt)"
  ).run(row);

  return row;
}

function upsertArea({ pincode, zoneId, label }) {
  const existing = db
    .prepare("SELECT * FROM zone_areas WHERE pincode = ?")
    .get(pincode);

  if (existing) {
    db.prepare(
      "UPDATE zone_areas SET zoneId=?, label=? WHERE pincode=?"
    ).run(zoneId, label, pincode);
    return;
  }

  db.prepare(
    "INSERT INTO zone_areas (id,zoneId,pincode,label) VALUES (?,?,?,?)"
  ).run(id(), zoneId, pincode, label);
}

function upsertAgentProfile(userId, data) {
  const existing = db
    .prepare("SELECT * FROM agent_profiles WHERE userId = ?")
    .get(userId);

  if (existing) return existing;

  const row = {
    id: id(),
    userId,
    status: data.status,
    currentLat: data.currentLat,
    currentLng: data.currentLng,
    currentZoneId: data.currentZoneId,
    updatedAt: now(),
  };

  db.prepare(
    "INSERT INTO agent_profiles (id,userId,status,currentLat,currentLng,currentZoneId,updatedAt) VALUES (@id,@userId,@status,@currentLat,@currentLng,@currentZoneId,@updatedAt)"
  ).run(row);

  return row;
}

function linkAgentZone(agentId, zoneId) {
  const existing = db
    .prepare("SELECT * FROM agent_zones WHERE agentId=? AND zoneId=?")
    .get(agentId, zoneId);

  if (existing) return;

  db.prepare(
    "INSERT INTO agent_zones (id,agentId,zoneId) VALUES (?,?,?)"
  ).run(id(), agentId, zoneId);
}

function upsertRateCard(rc) {
  const existing = db
    .prepare("SELECT * FROM rate_cards WHERE orderType=? AND zoneType=?")
    .get(rc.orderType, rc.zoneType);

  if (existing) {
    db.prepare(
      "UPDATE rate_cards SET ratePerKg=?, baseCharge=?, minCharge=?, updatedAt=? WHERE id=?"
    ).run(
      rc.ratePerKg,
      rc.baseCharge,
      rc.minCharge,
      now(),
      existing.id
    );

    return;
  }

  db.prepare(
    "INSERT INTO rate_cards (id,orderType,zoneType,ratePerKg,baseCharge,minCharge,isActive,createdAt,updatedAt) VALUES (?,?,?,?,?,?,1,?,?)"
  ).run(
    id(),
    rc.orderType,
    rc.zoneType,
    rc.ratePerKg,
    rc.baseCharge,
    rc.minCharge,
    now(),
    now()
  );
}

function upsertCod(c) {
  const existing = db
    .prepare("SELECT * FROM cod_surcharge_configs WHERE orderType=?")
    .get(c.orderType);

  if (existing) {
    db.prepare(
      "UPDATE cod_surcharge_configs SET flatFee=?, percentFee=?, updatedAt=? WHERE id=?"
    ).run(
      c.flatFee,
      c.percentFee,
      now(),
      existing.id
    );

    return;
  }

  db.prepare(
    "INSERT INTO cod_surcharge_configs (id,orderType,flatFee,percentFee,updatedAt) VALUES (?,?,?,?,?)"
  ).run(
    id(),
    c.orderType,
    c.flatFee,
    c.percentFee,
    now()
  );
}

function main() {
  // ADMIN
  upsertUser({
    name: "Ops Admin",
    email: "admin@lastmile.test",
    phone: "9000000001",
    password: "Admin@123",
    role: "ADMIN",
  });

  // CUSTOMER
  upsertUser({
    name: "Avishi Tripathi",
    email: "customer@lastmile.test",
    phone: "9000000002",
    password: "Customer@123",
    role: "CUSTOMER",
  });

  // AGENTS
  const agentUser1 = upsertUser({
    name: "Karan Verma",
    email: "agent1@lastmile.test",
    phone: "9000000003",
    password: "Agent@123",
    role: "AGENT",
  });

  const agentUser2 = upsertUser({
    name: "Meena Iyer",
    email: "agent2@lastmile.test",
    phone: "9000000004",
    password: "Agent@123",
    role: "AGENT",
  });

  // ZONES
  const zoneCentral = upsertZone({
    name: "Bhopal Central",
    code: "BPL-CENTRAL",
  });

  const zoneEast = upsertZone({
    name: "Bhopal East",
    code: "BPL-EAST",
  });

  upsertZone({
    name: "Indore City",
    code: "IND-CITY",
  });

  // AREAS
  upsertArea({
    pincode: "462001",
    zoneId: zoneCentral.id,
    label: "TT Nagar",
  });

  upsertArea({
    pincode: "462002",
    zoneId: zoneCentral.id,
    label: "Arera Colony",
  });

  upsertArea({
    pincode: "462003",
    zoneId: zoneCentral.id,
    label: "Shahpura",
  });

  upsertArea({
    pincode: "462016",
    zoneId: zoneEast.id,
    label: "Bairagarh",
  });

  upsertArea({
    pincode: "462022",
    zoneId: zoneEast.id,
    label: "Ratibad",
  });

  upsertArea({
    pincode: "452001",
    zoneId: upsertZone({
      name: "Indore City",
      code: "IND-CITY",
    }).id,
    label: "Rajwada",
  });

  upsertArea({
    pincode: "452010",
    zoneId: upsertZone({
      name: "Indore City",
      code: "IND-CITY",
    }).id,
    label: "Vijay Nagar",
  });

  // AGENT PROFILES
  const agentProfile1 = upsertAgentProfile(agentUser1.id, {
    status: "AVAILABLE",
    currentLat: 23.2599,
    currentLng: 77.4126,
    currentZoneId: zoneCentral.id,
  });

  const agentProfile2 = upsertAgentProfile(agentUser2.id, {
    status: "AVAILABLE",
    currentLat: 23.2156,
    currentLng: 77.44,
    currentZoneId: zoneEast.id,
  });

  linkAgentZone(agentProfile1.id, zoneCentral.id);

  linkAgentZone(agentProfile2.id, zoneEast.id);

  linkAgentZone(
    agentProfile2.id,
    zoneCentral.id
  ); // backup coverage

  // RATE CARDS
  upsertRateCard({
    orderType: "B2C",
    zoneType: "INTRA",
    ratePerKg: 20,
    baseCharge: 40,
    minCharge: 40,
  });

  upsertRateCard({
    orderType: "B2C",
    zoneType: "INTER",
    ratePerKg: 28,
    baseCharge: 60,
    minCharge: 60,
  });

  upsertRateCard({
    orderType: "B2B",
    zoneType: "INTRA",
    ratePerKg: 15,
    baseCharge: 50,
    minCharge: 50,
  });

  upsertRateCard({
    orderType: "B2B",
    zoneType: "INTER",
    ratePerKg: 22,
    baseCharge: 80,
    minCharge: 80,
  });

  // COD CONFIG
  upsertCod({
    orderType: "B2C",
    flatFee: 15,
    percentFee: 1.5,
  });

  upsertCod({
    orderType: "B2B",
    flatFee: 25,
    percentFee: 1.0,
  });

  console.log("Seed complete.");
  console.log("Admin login:    admin@lastmile.test / Admin@123");
  console.log("Customer login: customer@lastmile.test / Customer@123");
  console.log(
    "Agent logins:   agent1@lastmile.test / Agent@123  (Bhopal Central)"
  );
  console.log(
    "                agent2@lastmile.test / Agent@123  (Bhopal East + Central backup)"
  );
}

main();