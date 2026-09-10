import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BranchType } from "@/app/generated/prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        region: true,
        users: { select: { id: true, name: true, username: true, role: true } },
        _count: { select: { users: true, bookings: true, pickupRegistrations: true } },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch branch" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, code, type, regionId, address, phone } = body;

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name?.trim()) updateData.name = name.trim();
    if (slug?.trim()) updateData.slug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (code?.trim()) updateData.code = code.trim().toUpperCase();
    if (type && Object.values(BranchType).includes(type)) updateData.type = type;
    if (regionId) updateData.regionId = regionId;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;

    const updated = await prisma.branch.update({
      where: { id },
      data: updateData,
      include: { region: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update branch" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ message: "Branch deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete branch" }, { status: 500 });
  }
}
