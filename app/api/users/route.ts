import { NextResponse } from "next/server";
import { UserRole } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  firstName: true,
  lastName: true,
  middleName: true,
  role: true,
  branchId: true,
  mustResetPassword: true,
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

/**
 * Generates an automatic, collision-resistant standardized username.
 * e.g. "kwame.mensah", "kwame.k.mensah", "kwame.mensah2"
 */
async function generateUniqueUsername(
  firstName: string,
  lastName: string,
  middleName?: string
): Promise<string> {
  const f = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const l = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const m = (middleName?.trim().toLowerCase() || "").replace(/[^a-z0-9]/g, "");

  const safeF = f || "officer";
  const safeL = l || "dvla";

  // 1. Standard: firstname.lastname
  const base = `${safeF}.${safeL}`;
  const existing1 = await prisma.user.findUnique({ where: { username: base } });
  if (!existing1) return base;

  // 2. Middle initial: firstname.m.lastname
  if (m.length > 0) {
    const withMiddle = `${safeF}.${m[0]}.${safeL}`;
    const existing2 = await prisma.user.findUnique({ where: { username: withMiddle } });
    if (!existing2) return withMiddle;
  }

  // 3. Counter: firstname.lastname2, firstname.lastname3...
  let counter = 2;
  while (counter < 1000) {
    const candidate = `${base}${counter}`;
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    counter++;
  }

  return `${base}.${crypto.randomBytes(2).toString("hex")}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || searchParams.get("organizationId");

    const users = await prisma.user.findMany({
      where: branchId ? { branchId } : undefined,
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
    const body = await request.json();
    const {
      firstName,
      lastName,
      middleName,
      name,
      username: rawUsername,
      password: rawPassword,
      email,
      role,
      branchId,
      organizationId,
    } = body;

    const targetBranchId = branchId || organizationId;

    if (!targetBranchId) {
      return NextResponse.json(
        { error: "Assigned DVLA branch is required." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "A valid email address is required to dispatch login credentials." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: `An account with email "${cleanEmail}" already exists in the system.` },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: targetBranchId } });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    // Determine Names and Automatic Username
    let finalFirstName = firstName?.trim() || "";
    let finalLastName = lastName?.trim() || "";
    const finalMiddleName = middleName?.trim() || "";
    let finalFullName = "";

    if (finalFirstName && finalLastName) {
      finalFullName = `${finalFirstName} ${finalMiddleName ? finalMiddleName + " " : ""}${finalLastName}`.trim();
    } else if (name?.trim()) {
      finalFullName = name.trim();
      const parts = finalFullName.split(/\s+/);
      finalFirstName = parts[0] || "Officer";
      finalLastName = parts.slice(1).join(" ") || "Staff";
    } else {
      return NextResponse.json(
        { error: "First Name and Last Name are required." },
        { status: 400 }
      );
    }

    let finalUsername = rawUsername?.trim().toLowerCase();
    if (!finalUsername) {
      finalUsername = await generateUniqueUsername(finalFirstName, finalLastName, finalMiddleName);
    }

    // Secure temporary password and 24h reset/activation token
    const tempPassword = rawPassword?.trim() || `DVLA-${crypto.randomBytes(3).toString("hex").toUpperCase()}!`;
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const parsedRole = parseRole(role) || "DATA_ENTRY";

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        password: tempPassword,
        name: finalFullName,
        firstName: finalFirstName || null,
        lastName: finalLastName || null,
        middleName: finalMiddleName || null,
        email: cleanEmail,
        role: parsedRole,
        branchId: targetBranchId,
        resetToken,
        resetTokenExpiry,
        mustResetPassword: true,
      },
      select: userSelect,
    });

    // Send Welcome Email
    let emailResult: any = { success: true, delivered: false, note: "" };
    try {
      const { sendWelcomeNewUserEmail } = await import("@/lib/mail");
      emailResult = await sendWelcomeNewUserEmail({
        to: user.email!,
        name: user.name,
        username: user.username,
        tempPassword,
        resetToken,
        role: user.role,
        branchName: branch.name,
      });
    } catch (mailErr) {
      console.error("Failed to send welcome email:", mailErr);
    }

    // Automatically record Audit Log
    try {
      const { recordAuditLog } = await import("@/lib/audit");
      const creatorId = body.creatorId || body.userId || body.performedById || null;
      await recordAuditLog({
        action: "USER_CREATED",
        entity: "User",
        entityId: user.id,
        details: {
          message: `Officer account created for ${user.name} (${user.username}, Role: ${user.role}) assigned to ${branch.name}. Onboarding email dispatched.`,
          createdUser: user.name,
          username: user.username,
          role: user.role,
          branch: branch.name,
          email: user.email,
        },
        performedById: creatorId,
        branchId: targetBranchId,
        request,
      });
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
    }

    return NextResponse.json(
      {
        ...user,
        emailDispatched: emailResult.delivered,
        emailNote: emailResult.note,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user. Username or email may already exist." },
      { status: 500 }
    );
  }
}
