import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BASELINE_SUPERVISORS = [
  {
    name: "SAVIOUR ADOM",
    badgeNumber: "SUP-0491",
    station: "DVLA ADENTA",
    isActive: true,
  },
  {
    name: "OFFICER MENSAH",
    badgeNumber: "SUP-0182",
    station: "DVLA ADENTA",
    isActive: true,
  },
  {
    name: "PASCAL SETH",
    badgeNumber: "SUP-0077",
    station: "DVLA HQ",
    isActive: true,
  },
  {
    name: "KWAME OSEI",
    badgeNumber: "SUP-0314",
    station: "DVLA 37 STATION",
    isActive: true,
  },
];

async function generateUniqueBadgeNumber(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `SUP-${num}`;
    const exists = await prisma.supervisor.findFirst({
      where: { badgeNumber: candidate },
    });
    if (!exists) return candidate;
  }
  return `SUP-${Date.now().toString().slice(-4)}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const branchId = searchParams.get("branchId");

    // Auto-seed baseline supervisors if database table is empty
    const count = await prisma.supervisor.count();
    if (count === 0) {
      for (const sup of BASELINE_SUPERVISORS) {
        await prisma.supervisor.upsert({
          where: { name: sup.name },
          update: {},
          create: sup,
        });
      }
    }

    const whereClause: any = {};
    if (activeOnly) whereClause.isActive = true;
    if (branchId) whereClause.branchId = branchId;

    const supervisors = await prisma.supervisor.findMany({
      where: whereClause,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: [
        { isActive: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(supervisors);
  } catch (error: any) {
    console.error("Error fetching supervisors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch supervisors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, badgeNumber, station, branchId, isActive } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Supervisor full legal name is required." },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim().toUpperCase();

    // Auto-generate badge number if not explicitly specified
    const finalBadge = badgeNumber && String(badgeNumber).trim()
      ? String(badgeNumber).trim().toUpperCase()
      : await generateUniqueBadgeNumber();

    const supervisor = await prisma.supervisor.upsert({
      where: { name: cleanName },
      update: {
        badgeNumber: finalBadge,
        station: station ? String(station).trim().toUpperCase() : undefined,
        branchId: branchId || undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      create: {
        name: cleanName,
        badgeNumber: finalBadge,
        station: station ? String(station).trim().toUpperCase() : "DVLA ADENTA",
        branchId: branchId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        branch: true,
      },
    });

    return NextResponse.json(supervisor, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supervisor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create supervisor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, badgeNumber, station, branchId, isActive } = body;

    if (!id && !name) {
      return NextResponse.json(
        { error: "Supervisor ID or Name is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.supervisor.update({
      where: id ? { id } : { name: String(name).trim().toUpperCase() },
      data: {
        name: name ? String(name).trim().toUpperCase() : undefined,
        badgeNumber: badgeNumber !== undefined ? String(badgeNumber).trim().toUpperCase() : undefined,
        station: station !== undefined ? String(station).trim().toUpperCase() : undefined,
        branchId: branchId !== undefined ? branchId : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        branch: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating supervisor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update supervisor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Supervisor ID is required for deletion." },
        { status: 400 }
      );
    }

    await prisma.supervisor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting supervisor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete supervisor" },
      { status: 500 }
    );
  }
}
