import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BranchType } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId");

    const branches = await prisma.branch.findMany({
      where: regionId ? { regionId } : undefined,
      include: {
        region: true,
        _count: {
          select: { users: true, bookings: true, pickupRegistrations: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(branches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, code, type, regionId, address, phone } = body;

    if (!name?.trim() || !slug?.trim() || !code?.trim() || !regionId) {
      return NextResponse.json(
        { error: "Name, slug, code, and regionId are required." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    const cleanCode = code.trim().toUpperCase();

    const existingSlug = await prisma.branch.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      return NextResponse.json({ error: "Branch slug already exists." }, { status: 400 });
    }

    const existingCode = await prisma.branch.findUnique({ where: { code: cleanCode } });
    if (existingCode) {
      return NextResponse.json({ error: "Branch code already exists." }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        code: cleanCode,
        type: type && Object.values(BranchType).includes(type) ? type : BranchType.REGIONAL,
        regionId,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
      },
      include: { region: true },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create branch" }, { status: 500 });
  }
}
