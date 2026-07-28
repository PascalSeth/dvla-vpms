import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("organizationId");

    const where: any = {};
    if (orgId) {
      where.organizationId = orgId;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        organization: {
          select: { name: true, code: true }
        }
      }
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, details, performedBy, organizationId } = body;

    if (!action || !details) {
      return NextResponse.json({ error: "Missing action or details" }, { status: 400 });
    }

    const log = await prisma.auditLog.create({
      data: {
        action,
        details,
        performedBy: performedBy || "system",
        organizationId: organizationId || null,
      }
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/audit error:", error);
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 });
  }
}
