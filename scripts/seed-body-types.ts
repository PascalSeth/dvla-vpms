import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BASELINE_BODY_TYPES = [
  { code: "SALOON", name: "Saloon", description: "Standard sedan / saloon body style for passenger cars", isActive: true, order: 1 },
  { code: "HATCHBACK", name: "Hatchback", description: "Compact hatchback body style with rear door", isActive: true, order: 2 },
  { code: "SUV", name: "SUV / Station Wagon", description: "Sport Utility Vehicle or station wagon body type", isActive: true, order: 3 },
  { code: "PICKUP", name: "Pickup / Truck", description: "Pickup truck, flatbed or cargo truck body type", isActive: true, order: 4 },
  { code: "MINIBUS", name: "Minibus / Van", description: "Minibus, passenger van or panel van body type", isActive: true, order: 5 },
  { code: "BUS", name: "Bus", description: "Full-size bus for mass transit or intercity transport", isActive: true, order: 6 },
  { code: "COUPE", name: "Coupe", description: "Two-door sports coupe or grand tourer body style", isActive: true, order: 7 },
  { code: "EQUIPMENT", name: "Equipment / Machinery", description: "Heavy equipment, construction machinery or agricultural vehicles", isActive: true, order: 8 },
];

async function main() {
  console.log("Seeding body types...");
  for (const item of BASELINE_BODY_TYPES) {
    const result = await prisma.vehicleBodyType.upsert({
      where: { code: item.code },
      update: {}, // Preserve admin active/inactive choice if already exists
      create: item,
    });
    console.log(`Upserted: ${result.name} (${result.code})`);
  }
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
