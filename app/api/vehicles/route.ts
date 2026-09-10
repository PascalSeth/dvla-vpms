import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { VEHICLE_CATALOG } from "@/lib/vehicleCatalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();
    const make = searchParams.get("make")?.trim();
    const category = searchParams.get("category")?.trim();

    // Auto-seed baseline Ghana fleet models if database table is empty
    const count = await prisma.vehicleModel.count();
    if (count === 0) {
      const seedData = VEHICLE_CATALOG.map((v) => ({
        make: v.make.trim(),
        model: v.model.trim(),
        year: "2024",
        bodyType: v.bodyType,
        engineCC: v.engineCC,
        cylinders: v.cylinders,
        fuelType: v.fuelType,
        netWeight: v.netWeight,
        grossWeight: v.grossWeight,
        tyreW: v.tyreW,
        tyreDia: v.tyreDia,
        defaultEnginePrefix: v.defaultEnginePrefix || null,
        category: v.bodyType.includes("Pickup")
          ? "Pickup"
          : v.bodyType.includes("SUV")
          ? "SUV"
          : v.bodyType.includes("Truck") || v.bodyType.includes("Van")
          ? "Commercial"
          : "Sedan",
        isCustom: false,
        usageCount: v.popular ? 10 : 1,
      }));

      await prisma.vehicleModel.createMany({
        data: seedData,
        skipDuplicates: true,
      });
    }

    const whereClause: any = {};

    if (make && make.toLowerCase() !== "all") {
      whereClause.make = { equals: make, mode: "insensitive" };
    }

    if (category && category.toLowerCase() !== "all") {
      whereClause.category = { equals: category, mode: "insensitive" };
    }

    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      whereClause.AND = terms.map((term) => ({
        OR: [
          { make: { contains: term, mode: "insensitive" } },
          { model: { contains: term, mode: "insensitive" } },
          { category: { contains: term, mode: "insensitive" } },
          { bodyType: { contains: term, mode: "insensitive" } },
        ],
      }));
    }

    const vehicles = await prisma.vehicleModel.findMany({
      where: whereClause,
      orderBy: [
        { usageCount: "desc" },
        { make: "asc" },
        { model: "asc" },
      ],
      take: 100,
    });

    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error("Error fetching vehicles from database:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vehicles from database" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      make,
      model,
      year,
      bodyType = "Saloon",
      engineCC = "2000",
      cylinders = "4",
      fuelType = "PETROL",
      netWeight = "1500",
      grossWeight = "2000",
      tyreW = "215",
      tyreDia = "16",
      defaultEnginePrefix,
      category,
      isCustom = true,
      userId,
    } = body;

    if (!make?.trim() || !model?.trim()) {
      return NextResponse.json(
        { error: "Vehicle Make and Model are required." },
        { status: 400 }
      );
    }

    const cleanMake = make.trim();
    const cleanModel = model.trim();

    const inferredCategory =
      category ||
      (bodyType.toLowerCase().includes("pickup")
        ? "Pickup"
        : bodyType.toLowerCase().includes("suv")
        ? "SUV"
        : bodyType.toLowerCase().includes("truck") || bodyType.toLowerCase().includes("van")
        ? "Commercial"
        : "Sedan");

    const vehicle = await prisma.vehicleModel.upsert({
      where: {
        make_model: {
          make: cleanMake,
          model: cleanModel,
        },
      },
      update: {
        year: year ? String(year).trim() : undefined,
        bodyType: bodyType ? String(bodyType).trim() : undefined,
        engineCC: engineCC ? String(engineCC).trim() : undefined,
        cylinders: cylinders ? String(cylinders).trim() : undefined,
        fuelType: fuelType ? String(fuelType).trim() : undefined,
        netWeight: netWeight ? String(netWeight).trim() : undefined,
        grossWeight: grossWeight ? String(grossWeight).trim() : undefined,
        tyreW: tyreW ? String(tyreW).trim() : undefined,
        tyreDia: tyreDia ? String(tyreDia).trim() : undefined,
        defaultEnginePrefix: defaultEnginePrefix ? String(defaultEnginePrefix).trim() : undefined,
        category: inferredCategory,
        usageCount: { increment: 1 },
      },
      create: {
        make: cleanMake,
        model: cleanModel,
        year: year ? String(year).trim() : "2024",
        bodyType: String(bodyType).trim(),
        engineCC: String(engineCC).trim(),
        cylinders: String(cylinders).trim(),
        fuelType: String(fuelType).trim(),
        netWeight: String(netWeight).trim(),
        grossWeight: String(grossWeight).trim(),
        tyreW: String(tyreW).trim(),
        tyreDia: String(tyreDia).trim(),
        defaultEnginePrefix: defaultEnginePrefix ? String(defaultEnginePrefix).trim() : null,
        category: inferredCategory,
        isCustom: Boolean(isCustom),
        usageCount: 1,
      },
    });

    // Optionally record audit trail
    try {
      const { recordAuditLog } = await import("@/lib/audit");
      await recordAuditLog({
        action: "VEHICLE_CATALOG_UPDATED",
        entity: "VehicleModel",
        entityId: vehicle.id,
        details: {
          message: `Saved vehicle model "${vehicle.make} ${vehicle.model}" (${vehicle.bodyType}, ${vehicle.engineCC}cc) to catalog database`,
          make: vehicle.make,
          model: vehicle.model,
          isCustom: vehicle.isCustom,
        },
        performedById: userId || null,
        request,
      });
    } catch {
      // Non-blocking if audit fails
    }

    return NextResponse.json({ success: true, vehicle }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving vehicle to catalog database:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save vehicle model" },
      { status: 500 }
    );
  }
}
