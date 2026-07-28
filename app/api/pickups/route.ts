import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pickups = await prisma.pickupRegistration.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(pickups);
  } catch (error) {
    console.error("Error fetching pickups:", error);
    return NextResponse.json(
      { error: "Failed to fetch pickup registrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPickup = await prisma.pickupRegistration.create({
      data: {
        name: body.name,
        phone: body.phone,
        plateNumber: body.plateNumber || null,
        timestamp: body.timestamp || new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: body.status || "pending",
      },
    });
    return NextResponse.json(newPickup, { status: 201 });
  } catch (error) {
    console.error("Error creating pickup:", error);
    return NextResponse.json(
      { error: "Failed to create pickup registration" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updated = await prisma.pickupRegistration.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating pickup:", error);
    return NextResponse.json(
      { error: "Failed to update pickup registration" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    await prisma.pickupRegistration.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pickup:", error);
    return NextResponse.json(
      { error: "Failed to delete pickup registration" },
      { status: 500 }
    );
  }
}
