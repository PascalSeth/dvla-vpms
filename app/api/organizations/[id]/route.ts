import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const orgSelect = {
  id: true,
  name: true,
  slug: true,
  code: true,
  description: true,
  createdAt: true,
  _count: {
    select: { users: true },
  },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const organization = await prisma.organization.findUnique({
      where: { id },
      select: orgSelect,
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Failed to fetch organization." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { name, slug, code, description } = await request.json();

    if (!name?.trim() || !slug?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "Name, slug, and code are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
      },
      select: orgSelect,
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization. Slug or code may already exist." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.organization.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    if (existing._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete "${existing.name}" — ${existing._count.users} user(s) are still assigned. Reassign or remove users first.` },
        { status: 409 }
      );
    }

    await prisma.organization.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ error: "Failed to delete organization." }, { status: 500 });
  }
}
