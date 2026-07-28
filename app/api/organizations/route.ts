import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        description: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
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

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        description: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization. Slug or code may already exist." },
      { status: 500 }
    );
  }
}
