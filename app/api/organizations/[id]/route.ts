import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const branchSelect = {
  id: true,
  name: true,
  slug: true,
  code: true,
  address: true,
  createdAt: true,
  _count: {
    select: { users: true },
  },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const branch = await prisma.branch.findUnique({
      where: { id },
      select: branchSelect,
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    return NextResponse.json({ error: "Failed to fetch branch." }, { status: 500 });
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

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        code: code.trim().toUpperCase(),
        address: description?.trim() || null,
      },
      select: branchSelect,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      { error: "Failed to update branch. Slug or code may already exist." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.branch.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    if (existing._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete "${existing.name}" — ${existing._count.users} user(s) are still assigned. Reassign or remove users first.` },
        { status: 409 }
      );
    }

    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json({ error: "Failed to delete branch." }, { status: 500 });
  }
}
