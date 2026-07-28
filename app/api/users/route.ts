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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    const users = await prisma.user.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: userSelect,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, name, email, role, organizationId } = await request.json();

    if (!username?.trim() || !password?.trim() || !name?.trim() || !organizationId) {
      return NextResponse.json(
        { error: "Username, password, name, and organization are required." },
        { status: 400 }
      );
    }

    const parsedRole = parseRole(role) || "DATA_ENTRY";

    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        email: email?.trim() || null,
        role: parsedRole,
        organizationId,
      },
      select: userSelect,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user. Username or email may already exist." },
      { status: 500 }
    );
  }
}
