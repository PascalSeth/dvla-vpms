import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username, password, organizationId } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const whereCondition: any = { username };
    if (organizationId) {
      whereCondition.organizationId = organizationId;
    }

    const user = await prisma.user.findFirst({
      where: whereCondition,
      include: {
        organization: true,
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid username, password, or organization." },
        { status: 401 }
      );
    }

    // Exclude password in response
    const { password: _, ...userWithoutPassword } = user;

    // Log login event to audit trail
    try {
      await prisma.auditLog.create({
        data: {
          action: "USER_LOGIN",
          details: `User "${user.username}" (${user.name}) logged in — Organization: ${user.organization?.name || "N/A"}`,
          performedBy: user.username,
          organizationId: user.organizationId || null,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error:", auditErr);
    }

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Authentication failed due to a server error." },
      { status: 500 }
    );
  }
}
