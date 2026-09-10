import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GHANA_REGIONS } from "./seed/route";

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      include: {
        branches: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(regions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch regions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, name, code, description } = body;

    // Direct seed action
    if (action === "seed") {
      const results = await Promise.all(
        GHANA_REGIONS.map((reg) =>
          prisma.region.upsert({
            where: { code: reg.code },
            update: {
              name: reg.name,
              description: reg.description,
            },
            create: {
              name: reg.name,
              code: reg.code,
              description: reg.description,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${results.length} Ghana administrative regions (no branches).`,
        count: results.length,
        regions: results,
      });
    }

    // Individual region creation
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "Region name and code are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await prisma.region.findFirst({
      where: {
        OR: [{ code: cleanCode }, { name: name.trim() }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A region with this name or code already exists." },
        { status: 400 }
      );
    }

    const region = await prisma.region.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(region, { status: 201 });
  } catch (error: any) {
    console.error("Failed to process region request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process region request" },
      { status: 500 }
    );
  }
}
