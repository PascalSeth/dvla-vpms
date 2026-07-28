import { PrismaClient } from "@prisma/client";

type UserRole = "SUPERADMIN" | "SUPERVISOR" | "DATA_ENTRY";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding realistic relational database...");

  // 1. Create Default Organizations
  const dvlaOrg = await prisma.organization.upsert({
    where: { code: "DVLA-HQ" },
    update: {
      name: "DVLA HQ",
      slug: "dvla-hq",
      description: "Main DVLA HQ - Adenta Branch & Vehicle Licensing Center",
    },
    create: {
      name: "DVLA HQ",
      slug: "dvla-hq",
      code: "DVLA-HQ",
      description: "Main DVLA HQ - Adenta Branch & Vehicle Licensing Center",
    },
  });

  const stateHouseOrg = await prisma.organization.upsert({
    where: { code: "STH-FLEET" },
    update: {
      name: "State House VIP Fleet",
      slug: "state-house",
      description: "Presidential & Government VIP Fleet Management",
    },
    create: {
      name: "State House VIP Fleet",
      slug: "state-house",
      code: "STH-FLEET",
      description: "Presidential & Government VIP Fleet Management",
    },
  });

  const policeOrg = await prisma.organization.upsert({
    where: { code: "GPS-OPS" },
    update: {
      name: "Ghana Police Service",
      slug: "ghana-police",
      description: "Police Fleet & Operations Command",
    },
    create: {
      name: "Ghana Police Service",
      slug: "ghana-police",
      code: "GPS-OPS",
      description: "Police Fleet & Operations Command",
    },
  });

  // 2. Create Users per Organization
  const users: Array<{username: string, password: string, name: string, role: UserRole, email: string, organizationId: string}> = [
    {
      username: "admin",
      password: "1234",
      name: "System Administrator",
      role: "SUPERADMIN",
      email: "admin@dvla.gov.gh",
      organizationId: dvlaOrg.id,
    },
    {
      username: "dvla_officer",
      password: "1234",
      name: "Adenta Licensing Officer",
      role: "SUPERVISOR",
      email: "officer@dvla.gov.gh",
      organizationId: dvlaOrg.id,
    },
    {
      username: "vip_fleet_mgr",
      password: "1234",
      name: "VIP Fleet Director",
      role: "SUPERVISOR",
      email: "vip@statehouse.gov.gh",
      organizationId: stateHouseOrg.id,
    },
    {
      username: "police_ops",
      password: "1234",
      name: "Police Transport Controller",
      role: "DATA_ENTRY",
      email: "transport@police.gov.gh",
      organizationId: policeOrg.id,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: u,
      create: u,
    });
  }

  // 3. Seed Reservations connected to Organizations
  const res1 = await prisma.reservation.upsert({
    where: { id: "res-1" },
    update: {
      type: "Range",
      rangeStart: 9000,
      rangeEnd: 9099,
      prefix: "AD",
      year: "26",
      holder: "State House VIP Fleet",
      authRef: "DVLA-HQ-RES-9022",
      expiryDate: "2028-05-21",
      status: "Active",
      claimedCount: 15,
      totalCount: 100,
      organizationId: stateHouseOrg.id,
    },
    create: {
      id: "res-1",
      type: "Range",
      rangeStart: 9000,
      rangeEnd: 9099,
      prefix: "AD",
      year: "26",
      holder: "State House VIP Fleet",
      authRef: "DVLA-HQ-RES-9022",
      expiryDate: "2028-05-21",
      status: "Active",
      claimedCount: 15,
      totalCount: 100,
      organizationId: stateHouseOrg.id,
    },
  });

  const res2 = await prisma.reservation.upsert({
    where: { id: "res-2" },
    update: {
      type: "Range",
      rangeStart: 8500,
      rangeEnd: 8550,
      prefix: "AD",
      year: "26",
      holder: "Ghana Police Service Fleet",
      authRef: "GPS-OPS-2026-85",
      expiryDate: "2026-06-25",
      status: "Alert",
      claimedCount: 35,
      totalCount: 50,
      organizationId: policeOrg.id,
    },
    create: {
      id: "res-2",
      type: "Range",
      rangeStart: 8500,
      rangeEnd: 8550,
      prefix: "AD",
      year: "26",
      holder: "Ghana Police Service Fleet",
      authRef: "GPS-OPS-2026-85",
      expiryDate: "2026-06-25",
      status: "Alert",
      claimedCount: 35,
      totalCount: 50,
      organizationId: policeOrg.id,
    },
  });

  const res3 = await prisma.reservation.upsert({
    where: { id: "res-3" },
    update: {
      type: "Single",
      platePattern: "1111-ADAB",
      prefix: "AD",
      year: "26",
      holder: "Otumfuo Osei Tutu II (Vanity)",
      authRef: "DVLA-ROYAL-001",
      expiryDate: "2028-01-10",
      status: "Active",
      claimedCount: 0,
      totalCount: 1,
      organizationId: dvlaOrg.id,
    },
    create: {
      id: "res-3",
      type: "Single",
      platePattern: "1111-ADAB",
      prefix: "AD",
      year: "26",
      holder: "Otumfuo Osei Tutu II (Vanity)",
      authRef: "DVLA-ROYAL-001",
      expiryDate: "2028-01-10",
      status: "Active",
      claimedCount: 0,
      totalCount: 1,
      organizationId: dvlaOrg.id,
    },
  });

  // 4. Seed VRS Invoices (Vehicle Registration System Records)
  // Format for Private/Commercial: [Vehicle Number]-[Center Code (AD)][Random Identification Mark (2 letters)]
  const inv1 = await prisma.vrsInvoice.upsert({
    where: { invoiceNo: "40726012083437" },
    update: {
      bookingType: "REGISTRATION",
      classification: "PRIVATE",
      regNo: "0891-ADKX",
      ownerName: "Kwame Asante",
      address: "Plot 14, Adentan Frafraha, Greater Accra Region",
      phone: "+233 24 456 7890",
      make: "Toyota",
      yearModel: "Corolla 2024",
      engineCC: "1800",
      cylinders: "4",
      engineNo: "1ZR-FE-407260",
      chassisNo: "KMHDK41D7NU407260",
      bodyType: "Saloon",
      fuelType: "PETROL",
      netWeight: "1190",
      grossWeight: "1560",
      tyreFW: "195",
      tyreFD: "15",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "195",
      tyreRD: "15",
      organizationId: dvlaOrg.id,
    },
    create: {
      invoiceNo: "40726012083437",
      bookingType: "REGISTRATION",
      classification: "PRIVATE",
      regNo: "0891-ADKX",
      ownerName: "Kwame Asante",
      address: "Plot 14, Adentan Frafraha, Greater Accra Region",
      phone: "+233 24 456 7890",
      make: "Toyota",
      yearModel: "Corolla 2024",
      engineCC: "1800",
      cylinders: "4",
      engineNo: "1ZR-FE-407260",
      chassisNo: "KMHDK41D7NU407260",
      bodyType: "Saloon",
      fuelType: "PETROL",
      netWeight: "1190",
      grossWeight: "1560",
      tyreFW: "195",
      tyreFD: "15",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "195",
      tyreRD: "15",
      organizationId: dvlaOrg.id,
    },
  });

  const inv2 = await prisma.vrsInvoice.upsert({
    where: { invoiceNo: "40726012083438" },
    update: {
      bookingType: "REG_SPECIAL",
      classification: "COMMERCIAL",
      regNo: "1242-ADPT",
      ownerName: "Abena Mensah",
      address: "Block B, Oyibi New Site, Dodowa Road, Accra",
      phone: "+233 50 123 4567",
      make: "Hyundai",
      yearModel: "Tucson 2.0 Active 2023",
      engineCC: "2000",
      cylinders: "4",
      engineNo: "G4NA-HT-381920",
      chassisNo: "KM8JUCAL4NU198302",
      bodyType: "SUV / Station Wagon",
      fuelType: "PETROL",
      netWeight: "1680",
      grossWeight: "2145",
      tyreFW: "225",
      tyreFD: "17",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "225",
      tyreRD: "17",
      organizationId: dvlaOrg.id,
    },
    create: {
      invoiceNo: "40726012083438",
      bookingType: "REG_SPECIAL",
      classification: "COMMERCIAL",
      regNo: "1242-ADPT",
      ownerName: "Abena Mensah",
      address: "Block B, Oyibi New Site, Dodowa Road, Accra",
      phone: "+233 50 123 4567",
      make: "Hyundai",
      yearModel: "Tucson 2.0 Active 2023",
      engineCC: "2000",
      cylinders: "4",
      engineNo: "G4NA-HT-381920",
      chassisNo: "KM8JUCAL4NU198302",
      bodyType: "SUV / Station Wagon",
      fuelType: "PETROL",
      netWeight: "1680",
      grossWeight: "2145",
      tyreFW: "225",
      tyreFD: "17",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "225",
      tyreRD: "17",
      organizationId: dvlaOrg.id,
    },
  });

  const inv3 = await prisma.vrsInvoice.upsert({
    where: { invoiceNo: "40726012083439" },
    update: {
      bookingType: "REGISTRATION",
      classification: "PRIVATE",
      regNo: "0729-ADBR",
      ownerName: "Yaw Boateng",
      address: "No. 4 Otano Lane, Madina, Greater Accra Region",
      phone: "+233 24 555 8899",
      make: "Ford",
      yearModel: "Ranger Wildtrak 2024",
      engineCC: "2000",
      cylinders: "4",
      engineNo: "BI-TURBO-492100",
      chassisNo: "1FTFW1ED4MF829103",
      bodyType: "Pickup / Truck",
      fuelType: "DIESEL",
      netWeight: "1950",
      grossWeight: "3150",
      tyreFW: "265",
      tyreFD: "17",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "265",
      tyreRD: "17",
      organizationId: dvlaOrg.id,
    },
    create: {
      invoiceNo: "40726012083439",
      bookingType: "REGISTRATION",
      classification: "PRIVATE",
      regNo: "0729-ADBR",
      ownerName: "Yaw Boateng",
      address: "No. 4 Otano Lane, Madina, Greater Accra Region",
      phone: "+233 24 555 8899",
      make: "Ford",
      yearModel: "Ranger Wildtrak 2024",
      engineCC: "2000",
      cylinders: "4",
      engineNo: "BI-TURBO-492100",
      chassisNo: "1FTFW1ED4MF829103",
      bodyType: "Pickup / Truck",
      fuelType: "DIESEL",
      netWeight: "1950",
      grossWeight: "3150",
      tyreFW: "265",
      tyreFD: "17",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "265",
      tyreRD: "17",
      organizationId: dvlaOrg.id,
    },
  });

  const inv4 = await prisma.vrsInvoice.upsert({
    where: { invoiceNo: "40726012083440" },
    update: {
      bookingType: "REGISTRATION",
      classification: "GOVERNMENT",
      regNo: "GV 0928-26",
      ownerName: "Ministry of Local Government",
      address: "Ministries Area, Accra, Greater Accra",
      phone: "+233 30 223 4455",
      make: "Nissan",
      yearModel: "Patrol V8 2025",
      engineCC: "5600",
      cylinders: "8",
      engineNo: "VK56VD-982103",
      chassisNo: "JN1BYSY61U391823",
      bodyType: "SUV / Station Wagon",
      fuelType: "PETROL",
      netWeight: "2750",
      grossWeight: "3500",
      tyreFW: "275",
      tyreFD: "18",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "275",
      tyreRD: "18",
      organizationId: stateHouseOrg.id,
    },
    create: {
      invoiceNo: "40726012083440",
      bookingType: "REGISTRATION",
      classification: "GOVERNMENT",
      regNo: "GV 0928-26",
      ownerName: "Ministry of Local Government",
      address: "Ministries Area, Accra, Greater Accra",
      phone: "+233 30 223 4455",
      make: "Nissan",
      yearModel: "Patrol V8 2025",
      engineCC: "5600",
      cylinders: "8",
      engineNo: "VK56VD-982103",
      chassisNo: "JN1BYSY61U391823",
      bodyType: "SUV / Station Wagon",
      fuelType: "PETROL",
      netWeight: "2750",
      grossWeight: "3500",
      tyreFW: "275",
      tyreFD: "18",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "275",
      tyreRD: "18",
      organizationId: stateHouseOrg.id,
    },
  });

  const inv5 = await prisma.vrsInvoice.upsert({
    where: { invoiceNo: "40726012083441" },
    update: {
      bookingType: "REGISTRATION",
      classification: "ELECTRIC",
      regNo: "EV 0102-26",
      ownerName: "EcoDrive Ghana Ltd",
      address: "Airport Residential Area, Accra",
      phone: "+233 20 888 9900",
      make: "Tesla",
      yearModel: "Model Y Dual Motor 2025",
      engineCC: "0",
      cylinders: "0",
      engineNo: "ELECTRIC-3D1-9820",
      chassisNo: "5YJYGDEF0MN928102",
      bodyType: "SUV / Station Wagon",
      fuelType: "ELECTRIC",
      netWeight: "2000",
      grossWeight: "2400",
      tyreFW: "255",
      tyreFD: "19",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "255",
      tyreRD: "19",
      organizationId: dvlaOrg.id,
    },
    create: {
      invoiceNo: "40726012083441",
      bookingType: "REGISTRATION",
      classification: "ELECTRIC",
      regNo: "EV 0102-26",
      ownerName: "EcoDrive Ghana Ltd",
      address: "Airport Residential Area, Accra",
      phone: "+233 20 888 9900",
      make: "Tesla",
      yearModel: "Model Y Dual Motor 2025",
      engineCC: "0",
      cylinders: "0",
      engineNo: "ELECTRIC-3D1-9820",
      chassisNo: "5YJYGDEF0MN928102",
      bodyType: "SUV / Station Wagon",
      fuelType: "ELECTRIC",
      netWeight: "2000",
      grossWeight: "2400",
      tyreFW: "255",
      tyreFD: "19",
      tyreMW: "",
      tyreMD: "",
      tyreRW: "255",
      tyreRD: "19",
      organizationId: dvlaOrg.id,
    },
  });

  // 5. Seed Relational Bookings (Linking directly to vrsInvoices and reservations)
  const sampleBookings = [
    {
      id: "BK001",
      type: "Regular",
      status: "approved",
      owner: inv1.ownerName,
      vehicle: `${inv1.make} ${inv1.yearModel}`,
      plate: inv1.regNo,
      date: "18 May 2026",
      classification: "Private",
      organizationId: dvlaOrg.id,
      vrsInvoiceId: inv1.id,
    },
    {
      id: "BK002",
      type: "Special Numbers",
      status: "pending",
      owner: inv2.ownerName,
      vehicle: `${inv2.make} ${inv2.yearModel}`,
      plate: inv2.regNo,
      date: "17 May 2026",
      classification: "Commercial",
      organizationId: dvlaOrg.id,
      vrsInvoiceId: inv2.id,
    },
    {
      id: "BK003",
      type: "Regular",
      status: "approved",
      owner: inv4.ownerName,
      vehicle: `${inv4.make} ${inv4.yearModel}`,
      plate: inv4.regNo,
      date: "16 May 2026",
      classification: "Government",
      organizationId: stateHouseOrg.id,
      vrsInvoiceId: inv4.id,
      reservationId: res1.id,
    },
    {
      id: "BK004",
      type: "Transfer",
      status: "approved",
      owner: inv3.ownerName,
      vehicle: `${inv3.make} ${inv3.yearModel}`,
      plate: inv3.regNo,
      date: "15 May 2026",
      classification: "Private",
      organizationId: dvlaOrg.id,
      vrsInvoiceId: inv3.id,
    },
    {
      id: "BK005",
      type: "Customized Numbers",
      status: "rejected",
      owner: "Ama Owusu",
      vehicle: "Toyota Hilux (2023)",
      plate: null,
      date: "14 May 2026",
      classification: "Private",
      organizationId: dvlaOrg.id,
    },
    {
      id: "BK006",
      type: "Regular",
      status: "pending",
      owner: "Kojo Darko",
      vehicle: "DAF XF Truck (2021)",
      plate: null,
      date: "13 May 2026",
      classification: "Commercial",
      organizationId: dvlaOrg.id,
    },
    {
      id: "BK007",
      type: "EV Registration",
      status: "approved",
      owner: inv5.ownerName,
      vehicle: `${inv5.make} ${inv5.yearModel}`,
      plate: inv5.regNo,
      date: "19 May 2026",
      classification: "Electric",
      organizationId: dvlaOrg.id,
      vrsInvoiceId: inv5.id,
    },
  ];

  for (const bk of sampleBookings) {
    await prisma.booking.upsert({
      where: { id: bk.id },
      update: bk,
      create: bk,
    });
  }

  // 6. Seed Pickup Registrations (Relational connection to issued plates & organizations)
  const pickups = [
    {
      id: "pk-1",
      name: inv1.ownerName,
      phone: inv1.phone,
      plateNumber: inv1.regNo,
      timestamp: "2026-05-18 10:30 AM",
      status: "completed",
      organizationId: dvlaOrg.id,
    },
    {
      id: "pk-2",
      name: inv3.ownerName,
      phone: inv3.phone,
      plateNumber: inv3.regNo,
      timestamp: "2026-05-18 11:15 AM",
      status: "pending",
      organizationId: dvlaOrg.id,
    },
  ];

  for (const pk of pickups) {
    await prisma.pickupRegistration.upsert({
      where: { id: pk.id },
      update: pk,
      create: pk,
    });
  }

  // 7. Seed Audit Logs (Linked to realistic system actions)
  const auditLogs = [
    {
      id: "log-1",
      action: "PLATE_REGISTERED",
      details: `Plate ${inv1.regNo} issued for ${inv1.ownerName} (${inv1.make} ${inv1.yearModel})`,
      performedBy: "admin",
      ipAddress: "127.0.0.1",
      organizationId: dvlaOrg.id,
    },
    {
      id: "log-2",
      action: "RESERVATION_LOCKED",
      details: `Range block 9000-9099 locked for ${stateHouseOrg.name}`,
      performedBy: "admin",
      ipAddress: "127.0.0.1",
      organizationId: stateHouseOrg.id,
    },
    {
      id: "log-3",
      action: "PICKUP_COMPLETED",
      details: `Collector ${inv1.ownerName} (${inv1.phone}) picked up plate ${inv1.regNo}`,
      performedBy: "dvla_officer",
      ipAddress: "127.0.0.1",
      organizationId: dvlaOrg.id,
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: log,
      create: log,
    });
  }

  console.log("Multi-organization relational seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
