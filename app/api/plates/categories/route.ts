import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BASELINE_PLATE_CATEGORIES = [
  {
    code: "PRIVATE",
    name: "Private (White Plate)",
    badge: "⚪ Private",
    description: "Standard white reflective plate with black embossing for private passenger vehicles",
    plateColor: "#ffffff",
    textColor: "#0f172a",
    isActive: true,
    order: 1,
  },
  {
    code: "COMMERCIAL",
    name: "Commercial (Yellow Plate)",
    badge: "🟡 Commercial",
    description: "Yellow reflective plate with black embossing for commercial transport, buses & taxis",
    plateColor: "#fcc419",
    textColor: "#0f172a",
    isActive: true,
    order: 2,
  },
  {
    code: "MOTORCYCLE",
    name: "Motorcycle (Light Blue Plate)",
    badge: "🔵 Motorcycle",
    description: "Light blue 2-tier square plate for private & commercial motorcycles and tricycles",
    plateColor: "#35baf6",
    textColor: "#000000",
    isActive: true,
    order: 3,
  },
  {
    code: "GOVERNMENT",
    name: "Government (GV Split Plate)",
    badge: "🏛️ GV Split",
    description: "Split yellow GV prefix plate with security triangles for ministries, departments & state agencies",
    plateColor: "#fcc419",
    textColor: "#0f172a",
    isActive: true,
    order: 4,
  },
  {
    code: "ELECTRIC",
    name: "Electric Vehicle (EV Green Plate)",
    badge: "🟢 EV Green",
    description: "Green EV split block on white reflective plate for eco-friendly zero-emission electric vehicles",
    plateColor: "#2b8a3e",
    textColor: "#0f172a",
    isActive: true,
    order: 5,
  },
  {
    code: "TRAILER",
    name: "Trailer (Yellow T Plate)",
    badge: "🟡 Trailer",
    description: "Yellow T split block on white plate for haulage, tankers and articulated commercial trailers",
    plateColor: "#fcc419",
    textColor: "#0f172a",
    isActive: true,
    order: 6,
  },
  {
    code: "TEMPORARY",
    name: "Temporary (TMP Sticker Plate)",
    badge: "🔷 TMP Sticker",
    description: "DVLA temporary operating permit with cyan-blue bar and embossed TMP serial for transit",
    plateColor: "#3fbdf1",
    textColor: "#ffffff",
    isActive: true,
    order: 7,
  },
  {
    code: "AGRICULTURAL",
    name: "Agricultural (Farm Machinery)",
    badge: "🚜 Agricultural",
    description: "Green AG split block plate for tractors, combine harvesters and registered farm machinery",
    plateColor: "#15803d",
    textColor: "#0f172a",
    isActive: true,
    order: 8,
  },
  {
    code: "DIPLOMATIC",
    name: "Diplomatic Corps (CD Plate)",
    badge: "🔴 Diplomatic",
    description: "Diplomatic crimson red reflective plate with white embossing for foreign embassies and missions",
    plateColor: "#991b1b",
    textColor: "#ffffff",
    isActive: true,
    order: 9,
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Auto-seed/ensure all baseline categories exist in database
    for (const item of BASELINE_PLATE_CATEGORIES) {
      await prisma.plateCategory.upsert({
        where: { code: item.code },
        update: {}, // Preserve admin active/inactive choice if already exists
        create: item,
      });
    }

    const categories = await prisma.plateCategory.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { order: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching plate categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch plate categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, badge, description, plateColor, textColor, isActive, order } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Category code and name are required." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const category = await prisma.plateCategory.upsert({
      where: { code: cleanCode },
      update: {
        name: String(name).trim(),
        badge: badge ? String(badge).trim() : undefined,
        description: description ? String(description).trim() : undefined,
        plateColor: plateColor || undefined,
        textColor: textColor || undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
      create: {
        code: cleanCode,
        name: String(name).trim(),
        badge: badge ? String(badge).trim() : `⚪ ${cleanCode}`,
        description: description ? String(description).trim() : null,
        plateColor: plateColor || "#ffffff",
        textColor: textColor || "#0f172a",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: order !== undefined ? Number(order) : 10,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating/updating plate category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save plate category" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, code, name, badge, description, isActive, order, plateColor, textColor } = body;

    if (!id && !code) {
      return NextResponse.json(
        { error: "Plate category ID or code is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.plateCategory.update({
      where: id ? { id } : { code },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        badge: badge !== undefined ? String(badge).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        order: order !== undefined ? Number(order) : undefined,
        plateColor: plateColor !== undefined ? String(plateColor) : undefined,
        textColor: textColor !== undefined ? String(textColor) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error patching plate category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update plate category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const code = searchParams.get("code");

    if (!id && !code) {
      return NextResponse.json(
        { error: "Plate category ID or code is required for deletion." },
        { status: 400 }
      );
    }

    await prisma.plateCategory.delete({
      where: id ? { id } : { code: code! },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting plate category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete plate category" },
      { status: 500 }
    );
  }
}
