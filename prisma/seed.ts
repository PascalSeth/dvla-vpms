import { PrismaClient, UserRole, BranchType } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// All 16 Administrative Regions of Ghana
const GHANA_REGIONS = [
  { name: "Greater Accra Region", code: "GAR", description: "Capital territory and economic hub of Ghana" },
  { name: "Ashanti Region", code: "AR", description: "Central commercial region anchored by Kumasi" },
  { name: "Western Region", code: "WR", description: "Coastal region with industrial and port centers" },
  { name: "Central Region", code: "CR", description: "Historic coastal tourism and education hub" },
  { name: "Volta Region", code: "VR", description: "Eastern border region along Volta River" },
  { name: "Eastern Region", code: "ER", description: "Agricultural and mining center anchored by Koforidua" },
  { name: "Northern Region", code: "NR", description: "Largest northern region anchored by Tamale" },
  { name: "Upper East Region", code: "UER", description: "Northeastern border region anchored by Bolgatanga" },
  { name: "Upper West Region", code: "UWR", description: "Northwestern border region anchored by Wa" },
  { name: "Bono Region", code: "BR", description: "Mid-western agricultural belt anchored by Sunyani" },
  { name: "Bono East Region", code: "BER", description: "Commercial agricultural area anchored by Techiman" },
  { name: "Ahafo Region", code: "AHR", description: "Rich timber and mining region anchored by Goaso" },
  { name: "Oti Region", code: "OR", description: "Eastern ecological belt anchored by Dambai" },
  { name: "Savannah Region", code: "SR", description: "Northern wildlife and heritage area anchored by Damongo" },
  { name: "North East Region", code: "NER", description: "Northern administrative region anchored by Nalerigu" },
  { name: "Western North Region", code: "WNR", description: "Resource-rich cocoa belt anchored by Sefwi Wiawso" },
];

async function main() {
  console.log("🌱 Starting DVLA VPMS baseline database seed (Regions, Branch, Super Admin only)...");

  // 1. Seed all 16 Ghana Administrative Regions
  console.log("📍 Seeding 16 Ghana Administrative Regions...");
  const regionMap: Record<string, string> = {};

  for (const r of GHANA_REGIONS) {
    const region = await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: {
        name: r.name,
        code: r.code,
        description: r.description,
      },
    });
    regionMap[r.code] = region.id;
  }
  console.log("✅ All 16 administrative regions seeded successfully.");

  // 2. Seed Single Branch: DVLA ADENTA (Headquarters)
  console.log("🏢 Seeding single branch: DVLA ADENTA...");
  const adentaBranch = await prisma.branch.upsert({
    where: { code: "DVLA-ADENTA" },
    update: {
      name: "DVLA ADENTA",
      slug: "dvla-adenta",
      type: BranchType.HEADQUARTERS,
      regionId: regionMap["GAR"],
      address: "Jawaharlal Nehru Rd, Adenta Municipal, Accra",
      phone: "030 274 6760",
    },
    create: {
      name: "DVLA ADENTA",
      slug: "dvla-adenta",
      code: "DVLA-ADENTA",
      type: BranchType.HEADQUARTERS,
      regionId: regionMap["GAR"],
      address: "Jawaharlal Nehru Rd, Adenta Municipal, Accra",
      phone: "030 274 6760",
    },
  });
  console.log(`✅ Branch created: ${adentaBranch.name} (${adentaBranch.code})`);

  // 3. Seed Single User: Super Admin
  console.log("👤 Seeding single SUPERADMIN user...");
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      name: "System Administrator",
      email: "admin@dvla.gov.gh",
      password: "1234",
      role: UserRole.SUPERADMIN,
      branchId: adentaBranch.id,
    },
    create: {
      username: "admin",
      password: "1234",
      name: "System Administrator",
      email: "admin@dvla.gov.gh",
      role: UserRole.SUPERADMIN,
      branchId: adentaBranch.id,
    },
  });
  console.log(`✅ SUPERADMIN user created: @${adminUser.username} (${adminUser.name})`);

  // 4. Create Initial Audit Log
  await prisma.auditLog.create({
    data: {
      action: "SYSTEM_INITIALIZED",
      entity: "Branch",
      entityId: adentaBranch.id,
      details: JSON.stringify({
        message: "DVLA VPMS clean baseline initialized with 16 administrative regions, DVLA Adenta branch, and Super Admin.",
      }),
      performedById: adminUser.id,
      branchId: adentaBranch.id,
    },
  });

  console.log("\n🎉 Clean baseline seeding completed!");
  console.log("📊 Summary:");
  console.log("   • Regions: 16");
  console.log("   • Branches: 1 (DVLA ADENTA)");
  console.log("   • Users: 1 (admin / 1234 - SUPERADMIN)");
  console.log("   • Services: None");
  console.log("   • Data: None (0 invoices, 0 bookings, 0 reservations, 0 pickups)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
