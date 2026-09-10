import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        address: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Error fetching organizations/branches:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, slug, code, description } = await request.json();

    if (!name?.trim() || !slug?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "Name, slug, and code are required." },
        { status: 400 }
      );
    }

    // Get or create default region if not present
    let defaultRegion = await prisma.region.findFirst();
    if (!defaultRegion) {
      defaultRegion = await prisma.region.create({
        data: {
          name: "Greater Accra Region",
          code: "GAR",
          description: "Default Headquarter Region",
        },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        code: code.trim().toUpperCase(),
        address: description?.trim() || null,
        regionId: defaultRegion.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Failed to create branch. Slug or code may already exist." },
      { status: 500 }
    );
  }
}
