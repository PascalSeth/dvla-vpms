import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  role: true,
  organizationId: true,
  createdAt: true,
  organization: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} as const;

const VALID_ROLES: UserRole[] = ["SUPERADMIN", "SUPERVISOR", "DATA_ENTRY"];

function parseRole(role: string | undefined): UserRole | null {
  const normalized = role?.toUpperCase() as UserRole | undefined;
  return normalized && VALID_ROLES.includes(normalized) ? normalized : null;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { username, password, name, email, role, organizationId } = await request.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (organizationId) {
      const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!organization) {
        return NextResponse.json({ error: "Organization not found." }, { status: 404 });
      }
    }

    const parsedRole = role ? parseRole(role) : null;
    if (role && !parsedRole) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(username?.trim() ? { username: username.trim().toLowerCase() } : {}),
        ...(password?.trim() ? { password: password.trim() } : {}),
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(parsedRole ? { role: parsedRole } : {}),
        ...(organizationId ? { organizationId } : {}),
      },
      select: userSelect,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user. Username or email may already exist." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (existing.role === "SUPERADMIN") {
      const superAdminCount = await prisma.user.count({ where: { role: "SUPERADMIN" } });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last SuperAdmin account." },
          { status: 409 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
