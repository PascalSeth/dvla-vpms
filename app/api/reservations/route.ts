import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ReservationStatus } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || searchParams.get("organizationId");

    const reservations = await prisma.reservation.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actorId = body.createdById || body.userId || null;
    const targetBranchId = body.branchId || body.organizationId || null;

    const rawStatus = (body.status || "ACTIVE").toUpperCase();
    const status: ReservationStatus = Object.values(ReservationStatus).includes(rawStatus as ReservationStatus)
      ? (rawStatus as ReservationStatus)
      : ReservationStatus.ACTIVE;

    const newReservation = await prisma.reservation.create({
      data: {
        type: body.type || "Single",
        platePattern: body.platePattern || null,
        rangeStart: body.rangeStart ? parseInt(body.rangeStart, 10) : null,
        rangeEnd: body.rangeEnd ? parseInt(body.rangeEnd, 10) : null,
        prefix: body.prefix,
        year: body.year,
        holder: body.holder,
        authRef: body.authRef,
        expiryDate: body.expiryDate,
        status,
        claimedCount: body.claimedCount ? parseInt(body.claimedCount, 10) : 0,
        totalCount: body.totalCount ? parseInt(body.totalCount, 10) : 1,
        branchId: targetBranchId,
        createdById: actorId,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    // Automatically record Audit Log
    const { recordAuditLog } = await import("@/lib/audit");
    const creatorName = newReservation.createdBy?.name || newReservation.createdBy?.username || body.adminUser || "Officer";
    
    let auditMsg = "";
    if (newReservation.type === "Range") {
      auditMsg = `${creatorName} reserved block sequence ${newReservation.prefix} ${newReservation.rangeStart}-${newReservation.rangeEnd} for ${newReservation.holder} (Ref: ${newReservation.authRef}, Exp: ${newReservation.expiryDate})`;
    } else {
      auditMsg = `${creatorName} reserved plate ${newReservation.platePattern || newReservation.prefix} for ${newReservation.holder} (Ref: ${newReservation.authRef}, Exp: ${newReservation.expiryDate})`;
    }

    await recordAuditLog({
      action: "RESERVATION_CREATED",
      entity: "Reservation",
      entityId: newReservation.id,
      details: {
        message: auditMsg,
        type: newReservation.type,
        holder: newReservation.holder,
        authRef: newReservation.authRef,
        expiryDate: newReservation.expiryDate,
        prefix: newReservation.prefix,
        platePattern: newReservation.platePattern,
      },
      performedById: actorId,
      branchId: newReservation.branchId,
      request,
    });

    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId") || searchParams.get("performedById");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const existing = await prisma.reservation.findUnique({
      where: { id },
      include: { branch: true },
    });

    await prisma.reservation.delete({
      where: { id },
    });

    if (existing) {
      const { recordAuditLog } = await import("@/lib/audit");
      await recordAuditLog({
        action: "RESERVATION_CANCELLED",
        entity: "Reservation",
        entityId: id,
        details: {
          message: `Officer cancelled reservation for ${existing.holder} (${existing.prefix}, Ref: ${existing.authRef})`,
          holder: existing.holder,
          authRef: existing.authRef,
        },
        performedById: userId || null,
        branchId: existing.branchId,
        request,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete reservation" },
      { status: 500 }
    );
  }
}
