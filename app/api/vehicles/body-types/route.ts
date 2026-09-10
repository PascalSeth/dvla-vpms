import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const bodyTypes = await prisma.vehicleBodyType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { order: "asc" },
    });

    return NextResponse.json(bodyTypes);
  } catch (error: any) {
    console.error("Error fetching body types:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch body types" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, description, isActive, order } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Body type code and name are required." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const bodyType = await prisma.vehicleBodyType.upsert({
      where: { code: cleanCode },
      update: {
        name: String(name).trim(),
        description: description ? String(description).trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
      create: {
        code: cleanCode,
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: order !== undefined ? Number(order) : 10,
      },
    });

    return NextResponse.json(bodyType, { status: 201 });
  } catch (error: any) {
    console.error("Error creating/updating body type:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save body type" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, code, name, description, isActive, order } = body;

    if (!id && !code) {
      return NextResponse.json(
        { error: "Body type ID or code is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.vehicleBodyType.update({
      where: id ? { id } : { code },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error patching body type:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update body type" },
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
        { error: "Body type ID or code is required for deletion." },
        { status: 400 }
      );
    }

    await prisma.vehicleBodyType.delete({
      where: id ? { id } : { code: code! },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting body type:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete body type" },
      { status: 500 }
    );
  }
}
