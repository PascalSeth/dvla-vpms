import { NextResponse } from "next/server";
import { UserRole } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  role: true,
  branchId: true,
  createdAt: true,
  branch: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      region: {
        select: { id: true, name: true, code: true },
      },
    },
  },
} as const;

const VALID_ROLES: UserRole[] = ["SUPERADMIN", "SUPERVISOR", "DATA_ENTRY"];

function parseRole(role: string | undefined): UserRole | null {
  const normalized = role?.toUpperCase() as UserRole | undefined;
  return normalized && VALID_ROLES.includes(normalized) ? normalized : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, password, name, email, role, branchId, organizationId } = body;

    const targetBranchId = branchId || organizationId;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetBranchId) {
      const branch = await prisma.branch.findUnique({ where: { id: targetBranchId } });
      if (!branch) {
        return NextResponse.json({ error: "Branch not found." }, { status: 404 });
      }
    }

    const updateData: {
      username?: string;
      password?: string;
      name?: string;
      email?: string | null;
      role?: UserRole;
      branchId?: string;
    } = {};

    if (username?.trim()) updateData.username = username.trim().toLowerCase();
    if (password?.trim()) updateData.password = password.trim();
    if (name?.trim()) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email?.trim() || null;

    const parsedRole = parseRole(role);
    if (parsedRole) updateData.role = parsedRole;
    if (targetBranchId) updateData.branchId = targetBranchId;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user. Username or email may already exist." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
