const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // ---- Users -----------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@lastmile.test" },
    update: {},
    create: {
      name: "Ops Admin",
      email: "admin@lastmile.test",
      phone: "9000000001",
      passwordHash: hash("Admin@123"),
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@lastmile.test" },
    update: {},
    create: {
      name: "Riya Sharma",
      email: "customer@lastmile.test",
      phone: "9000000002",
      passwordHash: hash("Customer@123"),
      role: "CUSTOMER",
    },
  });

  const agentUser1 = await prisma.user.upsert({
    where: { email: "agent1@lastmile.test" },
    update: {},
    create: {
      name: "Karan Verma",
      email: "agent1@lastmile.test",
      phone: "9000000003",
      passwordHash: hash("Agent@123"),
      role: "AGENT",
    },
  });

  const agentUser2 = await prisma.user.upsert({
    where: { email: "agent2@lastmile.test" },
    update: {},
    create: {
      name: "Meena Iyer",
      email: "agent2@lastmile.test",
      phone: "9000000004",
      passwordHash: hash("Agent@123"),
      role: "AGENT",
    },
  });

  // ---- Zones -------------------------------------------------------------
  const zoneCentral = await prisma.zone.upsert({
    where: { code: "BPL-CENTRAL" },
    update: {},
    create: { name: "Bhopal Central", code: "BPL-CENTRAL" },
  });
  const zoneEast = await prisma.zone.upsert({
    where: { code: "BPL-EAST" },
    update: {},
    create: { name: "Bhopal East", code: "BPL-EAST" },
  });
  const zoneIndore = await prisma.zone.upsert({
    where: { code: "IND-CITY" },
    update: {},
    create: { name: "Indore City", code: "IND-CITY" },
  });

  const areas = [
    { pincode: "462001", zoneId: zoneCentral.id, label: "TT Nagar" },
    { pincode: "462002", zoneId: zoneCentral.id, label: "Arera Colony" },
    { pincode: "462003", zoneId: zoneCentral.id, label: "Shahpura" },
    { pincode: "462016", zoneId: zoneEast.id, label: "Bairagarh" },
    { pincode: "462022", zoneId: zoneEast.id, label: "Ratibad" },
    { pincode: "452001", zoneId: zoneIndore.id, label: "Rajwada" },
    { pincode: "452010", zoneId: zoneIndore.id, label: "Vijay Nagar" },
  ];
  for (const a of areas) {
    await prisma.zoneArea.upsert({
      where: { pincode: a.pincode },
      update: { zoneId: a.zoneId, label: a.label },
      create: a,
    });
  }

  // ---- Agent profiles + zone coverage ------------------------------------
  const agentProfile1 = await prisma.agentProfile.upsert({
    where: { userId: agentUser1.id },
    update: {},
    create: {
      userId: agentUser1.id,
      status: "AVAILABLE",
      currentLat: 23.2599,
      currentLng: 77.4126,
      currentZoneId: zoneCentral.id,
    },
  });
  const agentProfile2 = await prisma.agentProfile.upsert({
    where: { userId: agentUser2.id },
    update: {},
    create: {
      userId: agentUser2.id,
      status: "AVAILABLE",
      currentLat: 23.2156,
      currentLng: 77.4}, // Bairagarh-ish, East zone
  });

  await prisma.agentZone.upsert({
    where: { agentId_zoneId: { agentId: agentProfile1.id, zoneId: zoneCentral.id } },
    update: {},
    create: { agentId: agentProfile1.id, zoneId: zoneCentral.id },
  });
  await prisma.agentZone.upsert({
    where: { agentId_zoneId: { agentId: agentProfile2.id, zoneId: zoneEast.id } },
    update: {},
    create: { agentId: agentProfile2.id, zoneId: zoneEast.id },
  });
  // agent2 also covers Central as backup
  await prisma.agentZone.upsert({
    where: { agentId_zoneId: { agentId: agentProfile2.id, zoneId: zoneCentral.id } },
    update: {},
    create: { agentId: agentProfile2.id, zoneId: zoneCentral.id },
  });

  // ---- Rate cards ---------------------------------------------------------
  const rateCards = [
    { orderType: "B2C", zoneType: "INTRA", ratePerKg: 20, baseCharge: 40, minCharge: 40 },
    { orderType: "B2C", zoneType: "INTER", ratePerKg: 28, baseCharge: 60, minCharge: 60 },
    { orderType: "B2B", zoneType: "INTRA", ratePerKg: 15, baseCharge: 50, minCharge: 50 },
    { orderType: "B2B", zoneType: "INTER", ratePerKg: 22, baseCharge: 80, minCharge: 80 },
  ];
  for (const rc of rateCards) {
    await prisma.rateCard.upsert({
      where: { orderType_zoneType: { orderType: rc.orderType, zoneType: rc.zoneType } },
      update: rc,
      create: rc,
    });
  }

  // ---- COD surcharge config -------------------------------------------
  const codConfigs = [
    { orderType: "B2C", flatFee: 15, percentFee: 1.5 },
    { orderType: "B2B", flatFee: 25, percentFee: 1.0 },
  ];
  for (const c of codConfigs) {
    await prisma.codSurchargeConfig.upsert({
      where: { orderType: c.orderType },
      update: c,
      create: c,
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:    admin@lastmile.test / Admin@123");
  console.log("Customer login: customer@lastmile.test / Customer@123");
  console.log("Agent logins:   agent1@lastmile.test / Agent@123  (Bhopal Central)");
  console.log("                agent2@lastmile.test / Agent@123  (Bhopal East + Central backup)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });