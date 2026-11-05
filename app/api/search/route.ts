import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const NAVIGATION_ITEMS = [
  { title: "Dashboard Overview", description: "Station metrics, KPIs & volume", href: "/dashboard", keywords: "home overview analytics stats", category: "Navigation" },
  { title: "New Plate Booking", description: "File a new vehicle plate booking registration", href: "/dashboard/booking", keywords: "new booking register vehicle plate entry apply create", category: "Operations" },
  { title: "Booking Logs", description: "View, review and audit all filed bookings", href: "/dashboard/bookings", keywords: "booking logs history records applications audit", category: "Operations" },
  { title: "Vehicle Plates Registry", description: "Search all active and vanity license plates", href: "/dashboard/plates", keywords: "plates registry license vehicles search find", category: "Operations" },
  { title: "Plate Categories", description: "Private, Commercial, Government & Electric categories", href: "/dashboard/plates/categories", keywords: "categories types commercial private government electric", category: "Operations" },
  { title: "Reserved Plates", description: "Block ranges and vanity plate reservations", href: "/dashboard/plates/reserved", keywords: "reserved reservations vanity block range vip", category: "Operations" },
  { title: "Picked Plates Directory", description: "Records of physical plates collected by owners", href: "/dashboard/plates/picked", keywords: "picked collected directory retrieved handover", category: "Operations" },
  { title: "Plate Issuance & Pickup", description: "Hand over manufactured plates to legal owners", href: "/dashboard/pickup", keywords: "pickup issuance handover collect collection", category: "Operations" },
  { title: "Workflow Pipeline", description: "Approval stages, vetting & embossing queue", href: "/dashboard/workflow", keywords: "workflow pipeline queue vetting review approvals", category: "Operations" },
  { title: "Reports & Analytics", description: "Download CSV, view productivity & generation stats", href: "/dashboard/reports", keywords: "reports analytics stats charts export download", category: "Intelligence" },
  { title: "Audit Trail", description: "Full immutable system activity logs", href: "/dashboard/audit", keywords: "audit log security events history trail", category: "Intelligence" },
  { title: "Branches & Regions", description: "DVLA offices, regional headquarters & stations", href: "/dashboard/branches", keywords: "branches stations offices regions headquarters", category: "Administration" },
  { title: "User Management", description: "System staff, licensing officers & permissions", href: "/dashboard/users", keywords: "users accounts staff officers admins passwords", category: "Administration" },
  { title: "Approving Officers", description: "Supervisors assigned for booking sign-off", href: "/dashboard/supervisors", keywords: "supervisors approving officers sign off hierarchy", category: "Administration" },
  { title: "Vehicle Body Types", description: "Sedan, SUV, Truck, Hatchback definitions", href: "/dashboard/settings/body-types", keywords: "body types vehicle classification models", category: "Administration" },
  { title: "Service Types & Fees", description: "Configure registration services & customs fields", href: "/dashboard/services", keywords: "service types fees tariffs customized regular", category: "Administration" },
  { title: "System Settings", description: "Platform configuration, security & defaults", href: "/dashboard/settings", keywords: "settings system configuration preferences", category: "Administration" },
  { title: "Help & SOPs", description: "Standard operating procedures & officer manual", href: "/dashboard/help", keywords: "help sops manual documentation support faq", category: "Support" },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({
        query: "",
        navigation: [],
        bookings: [],
        plates: [],
        reservations: [],
      });
    }

    const lowerQuery = q.toLowerCase();

    // 1. Navigation items matching query
    const matchedNavigation = NAVIGATION_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.keywords.toLowerCase().includes(lowerQuery)
    ).slice(0, 4);

    // 2. Query Database in parallel
    const [bookings, vrsInvoices, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { owner: { contains: q, mode: "insensitive" } },
            { plate: { contains: q, mode: "insensitive" } },
            { vehicle: { contains: q, mode: "insensitive" } },
            { ownerPhone: { contains: q, mode: "insensitive" } },
            {
              vrsInvoice: {
                is: {
                  OR: [
                    { invoiceNo: { contains: q, mode: "insensitive" } },
                    { regNo: { contains: q, mode: "insensitive" } },
                    { chassisNo: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          vrsInvoice: { select: { invoiceNo: true, regNo: true, chassisNo: true, make: true } },
          branch: { select: { name: true, code: true } },
        },
      }),

      prisma.vrsInvoice.findMany({
        where: {
          OR: [
            { invoiceNo: { contains: q, mode: "insensitive" } },
            { regNo: { contains: q, mode: "insensitive" } },
            { ownerName: { contains: q, mode: "insensitive" } },
            { chassisNo: { contains: q, mode: "insensitive" } },
            { make: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),

      prisma.reservation.findMany({
        where: {
          OR: [
            { platePattern: { contains: q, mode: "insensitive" } },
            { holder: { contains: q, mode: "insensitive" } },
            { authRef: { contains: q, mode: "insensitive" } },
            { prefix: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Format Bookings
    const formattedBookings = bookings.map((b) => ({
      id: b.id,
      owner: b.owner,
      vehicle: b.vehicle,
      plate: b.plate || b.vrsInvoice?.regNo || null,
      status: b.status,
      classification: b.classification,
      date: b.date,
      invoiceNo: b.vrsInvoice?.invoiceNo,
      href: `/dashboard/bookings?q=${encodeURIComponent(b.id)}`,
    }));

    // Format Plates from VRS Invoices & assigned plates
    const plateMap = new Map<string, any>();

    // From Invoices
    for (const inv of vrsInvoices) {
      const plateNumber = inv.regNo || `TEMP-${inv.invoiceNo}`;
      if (!plateMap.has(plateNumber)) {
        plateMap.set(plateNumber, {
          plateNumber,
          owner: inv.ownerName,
          vehicle: `${inv.make} ${inv.yearModel || ""}`.trim(),
          chassis: inv.chassisNo,
          category: inv.classification || "Private",
          status: "Active",
          source: "VRS Invoice",
          href: `/dashboard/plates?q=${encodeURIComponent(plateNumber)}`,
        });
      }
    }

    // From Bookings with plates
    for (const b of bookings) {
      if (b.plate && !plateMap.has(b.plate)) {
        plateMap.set(b.plate, {
          plateNumber: b.plate,
          owner: b.owner,
          vehicle: b.vehicle,
          chassis: b.vrsInvoice?.chassisNo || "N/A",
          category: b.classification,
          status: b.status === "PICKED" ? "Picked" : b.status === "APPROVED" ? "Approved" : "Pending",
          source: `Booking #${b.id}`,
          href: `/dashboard/plates?q=${encodeURIComponent(b.plate)}`,
        });
      }
    }

    // Format Reservations
    const formattedReservations = reservations.map((r) => {
      const plateLabel =
        r.type === "Range"
          ? `${r.prefix} ${r.rangeStart}-${r.rangeEnd} (${r.year})`
          : r.platePattern || `${r.prefix} 1111-${r.year}`;
      return {
        id: r.id,
        platePattern: plateLabel,
        holder: r.holder,
        authRef: r.authRef,
        status: r.status,
        type: r.type,
        href: `/dashboard/plates/reserved?q=${encodeURIComponent(r.authRef || plateLabel)}`,
      };
    });

    return NextResponse.json({
      query: q,
      navigation: matchedNavigation,
      bookings: formattedBookings,
      plates: Array.from(plateMap.values()).slice(0, 6),
      reservations: formattedReservations,
      totalCount:
        matchedNavigation.length +
        formattedBookings.length +
        plateMap.size +
        formattedReservations.length,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Search failed to complete" },
      { status: 500 }
    );
  }
}

