import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PickupStatus, BookingStatus } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || searchParams.get("organizationId");

    const pickups = await prisma.pickupRegistration.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { include: { region: true } },
        booking: {
          include: { vrsInvoice: true },
        },
        registeredBy: { select: { id: true, name: true, username: true } },
        handedOverBy: { select: { id: true, name: true, username: true } },
      },
    });
    return NextResponse.json(pickups);
  } catch (error) {
    console.error("Error fetching pickups:", error);
    return NextResponse.json(
      { error: "Failed to fetch pickup registrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawStatus = (body.status || "PENDING").toUpperCase();
    const status: PickupStatus = Object.values(PickupStatus).includes(rawStatus as PickupStatus)
      ? (rawStatus as PickupStatus)
      : PickupStatus.PENDING;

    const targetBranchId = body.branchId || body.organizationId || null;
    const actorId = body.registeredById || body.userId || null;
    const isApprovedImmediately = status === PickupStatus.COMPLETED;

    // Find matching booking if plateNumber exists
    let matchingBookingId = body.bookingId || null;
    if (!matchingBookingId && body.plateNumber) {
      const match = await prisma.booking.findFirst({
        where: { plate: body.plateNumber.trim() },
        orderBy: { createdAt: "desc" },
      });
      if (match) {
        matchingBookingId = match.id;
      }
    }

    const newPickup = await prisma.pickupRegistration.create({
      data: {
        name: body.name,
        phone: body.phone,
        plateNumber: body.plateNumber ? body.plateNumber.trim().toUpperCase() : null,
        timestamp: body.timestamp || new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status,
        branchId: targetBranchId,
        bookingId: matchingBookingId,
        registeredById: actorId,
        handedOverById: isApprovedImmediately ? actorId : null,
        handedOverAt: isApprovedImmediately ? new Date() : null,
      },
      include: {
        branch: true,
        booking: { include: { vrsInvoice: true } },
        registeredBy: { select: { id: true, name: true, username: true, role: true } },
        handedOverBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    // If immediately approved, update matching booking status to PICKED
    if (isApprovedImmediately && newPickup.plateNumber) {
      try {
        await prisma.booking.updateMany({
          where: { plate: newPickup.plateNumber },
          data: { status: BookingStatus.PICKED },
        });
      } catch (bkErr) {
        console.error("Failed to update matching booking status:", bkErr);
      }
    }

    // Automatically record Audit Log
    const { recordAuditLog } = await import("@/lib/audit");
    const actorName = newPickup.registeredBy?.name || newPickup.registeredBy?.username || body.adminUser || "Officer";

    if (isApprovedImmediately) {
      await recordAuditLog({
        action: "PLATE_PICKED",
        entity: "PickupRegistration",
        entityId: newPickup.id,
        details: {
          message: `Supervisor ${actorName} recorded and approved plate handover for ${newPickup.plateNumber || "N/A"} to customer ${newPickup.name} (${newPickup.phone})`,
          plateNumber: newPickup.plateNumber,
          customerName: newPickup.name,
          customerPhone: newPickup.phone,
          status: "COMPLETED",
        },
        performedById: actorId,
        branchId: newPickup.branchId,
        request,
      });
    } else {
      await recordAuditLog({
        action: "PLATE_COLLECTION_RECORDED",
        entity: "PickupRegistration",
        entityId: newPickup.id,
        details: {
          message: `Officer ${actorName} recorded customer collection for plate ${newPickup.plateNumber || "N/A"} (Customer: ${newPickup.name}, Phone: ${newPickup.phone}) — Pending Handover Approval`,
          plateNumber: newPickup.plateNumber,
          customerName: newPickup.name,
          customerPhone: newPickup.phone,
          status: "PENDING",
        },
        performedById: actorId,
        branchId: newPickup.branchId,
        request,
      });
    }

    return NextResponse.json(newPickup, { status: 201 });
  } catch (error) {
    console.error("Error creating pickup:", error);
    return NextResponse.json(
      { error: "Failed to create pickup registration" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status: rawStatus, plateNumber, handedOverById, userId, adminUser } = body;
    if (!id || !rawStatus) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const normalizedStatus = rawStatus.toUpperCase();
    const isPickedOrCompleted = normalizedStatus === "PICKED" || normalizedStatus === "COMPLETED";
    const supervisorId = handedOverById || userId || null;

    const newStatus: PickupStatus = isPickedOrCompleted ? PickupStatus.COMPLETED : PickupStatus.PENDING;

    const updated = await prisma.pickupRegistration.update({
      where: { id },
      data: {
        status: newStatus,
        handedOverById: isPickedOrCompleted ? supervisorId : null,
        handedOverAt: isPickedOrCompleted ? new Date() : null,
      },
      include: {
        branch: true,
        booking: { include: { vrsInvoice: true } },
        registeredBy: { select: { id: true, name: true, username: true } },
        handedOverBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    const targetPlate = plateNumber || updated.plateNumber;

    // When a plate is handed over, update matching Booking records status to PICKED
    if (targetPlate && isPickedOrCompleted) {
      try {
        await prisma.booking.updateMany({
          where: { plate: targetPlate },
          data: { status: BookingStatus.PICKED },
        });
      } catch (bkErr) {
        console.error("Failed to update matching booking status:", bkErr);
      }

      // Automatically record Audit Trail
      const { recordAuditLog } = await import("@/lib/audit");
      const supervisorName = updated.handedOverBy?.name || updated.handedOverBy?.username || adminUser || "Supervisor";
      await recordAuditLog({
        action: "PLATE_PICKED",
        entity: "PickupRegistration",
        entityId: id,
        details: {
          message: `Supervisor ${supervisorName} APPROVED and completed plate handover for plate ${targetPlate} to customer ${updated.name} (${updated.phone})`,
          plateNumber: targetPlate,
          customerName: updated.name,
          customerPhone: updated.phone,
          adminUser: supervisorName,
        },
        performedById: supervisorId,
        branchId: updated.branchId,
        request,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating pickup:", error);
    return NextResponse.json(
      { error: "Failed to update pickup registration" },
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

    const existing = await prisma.pickupRegistration.findUnique({
      where: { id },
      include: { branch: true },
    });

    await prisma.pickupRegistration.delete({
      where: { id },
    });

    if (existing) {
      const { recordAuditLog } = await import("@/lib/audit");
      await recordAuditLog({
        action: "PICKUP_DELETED",
        entity: "PickupRegistration",
        entityId: id,
        details: {
          message: `Officer deleted customer collection record for plate ${existing.plateNumber || "N/A"} (Customer: ${existing.name}, Phone: ${existing.phone})`,
          plateNumber: existing.plateNumber,
          customerName: existing.name,
          customerPhone: existing.phone,
        },
        performedById: userId || null,
        branchId: existing.branchId,
        request,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pickup:", error);
    return NextResponse.json(
      { error: "Failed to delete pickup registration" },
      { status: 500 }
    );
  }
}
