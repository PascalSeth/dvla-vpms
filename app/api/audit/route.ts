import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || searchParams.get("organizationId");

    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        performedBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, entity, entityId, details, performedById, branchId, organizationId, ipAddress } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const { recordAuditLog } = await import("@/lib/audit");
    const log = await recordAuditLog({
      action,
      entity,
      entityId,
      details,
      performedById: performedById || null,
      branchId: branchId || organizationId || null,
      request,
      ipAddress,
    });

    if (!log) {
      return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating audit log:", error);
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 });
  }
}
