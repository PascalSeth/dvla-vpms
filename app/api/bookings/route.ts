import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || searchParams.get("organizationId");

    const bookings = await prisma.booking.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        vrsInvoice: true,
        branch: { include: { region: true } },
        createdBy: { select: { id: true, name: true, username: true } },
        reviewedBy: { select: { id: true, name: true, username: true } },
      },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const count = await prisma.booking.count();
    const bookingId = body.id || `BK${String(count + 1).padStart(3, "0")}`;

    // Normalize status string to Enum
    const rawStatus = (body.status || "PENDING").toUpperCase();
    const status: BookingStatus = Object.values(BookingStatus).includes(rawStatus as BookingStatus)
      ? (rawStatus as BookingStatus)
      : BookingStatus.PENDING;

    const targetBranchId = body.branchId || body.organizationId || null;

    // Check if VRS Invoice or Plate is already booked
    if (body.vrsInvoiceId) {
      const existing = await prisma.booking.findFirst({
        where: { vrsInvoiceId: body.vrsInvoiceId },
      });
      if (existing) {
        return NextResponse.json(
          { error: `This VRS Invoice has already been booked (Booking ID: #${existing.id}).` },
          { status: 400 }
        );
      }
    } else if (body.vrsInvoiceNo) {
      const existing = await prisma.booking.findFirst({
        where: {
          vrsInvoice: { invoiceNo: body.vrsInvoiceNo.trim() },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `VRS Invoice #${body.vrsInvoiceNo} has already been booked (Booking ID: #${existing.id}).` },
          { status: 400 }
        );
      }
    }

    if (body.plate && body.plate.trim()) {
      const existingPlate = await prisma.booking.findFirst({
        where: { plate: body.plate.trim() },
      });
      if (existingPlate) {
        return NextResponse.json(
          { error: `Plate "${body.plate}" has already been booked under Booking ID #${existingPlate.id}.` },
          { status: 400 }
        );
      }
    }

    const newBooking = await prisma.booking.create({
      data: {
        id: bookingId,
        type: body.type,
        status,
        owner: body.owner,
        vehicle: body.vehicle,
        plate: body.plate || null,
        date: body.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        classification: body.classification || "Private",
        vrsInvoiceId: body.vrsInvoiceId || null,
        branchId: targetBranchId,
        createdById: body.createdById || body.userId || null,
        previousOwnerName: body.previousOwnerName || body.oldOwnerName || null,
        previousOwnerPhone: body.previousOwnerPhone || body.oldOwnerPhone || null,
        previousOwnerAddress: body.previousOwnerAddress || body.oldOwnerAddr || null,
        previousOwnerCustom: body.previousOwnerCustom || body.oldOwnerCustom || null,
      },
      include: {
        vrsInvoice: true,
        branch: true,
        createdBy: { select: { id: true, name: true, username: true } },
      },
    });

    // Automatically persist newly encountered vehicle model to database catalog
    if (body.make && body.model) {
      try {
        const cleanMake = body.make.trim();
        const cleanModel = body.model.trim();
        if (cleanMake && cleanModel) {
          await prisma.vehicleModel.upsert({
            where: {
              make_model: {
                make: cleanMake,
                model: cleanModel,
              },
            },
            update: {
              year: body.yearModel || body.year || undefined,
              bodyType: body.bodyType || undefined,
              engineCC: body.engineCC || undefined,
              cylinders: body.cylinders || undefined,
              fuelType: body.fuelType || undefined,
              netWeight: body.netWeight || undefined,
              grossWeight: body.grossWeight || undefined,
              tyreW: body.tyreFW || body.tyreW || undefined,
              tyreDia: body.tyreFD || body.tyreDia || undefined,
              usageCount: { increment: 1 },
            },
            create: {
              make: cleanMake,
              model: cleanModel,
              year: body.yearModel || body.year || "2024",
              bodyType: body.bodyType || "Saloon",
              engineCC: body.engineCC || "2000",
              cylinders: body.cylinders || "4",
              fuelType: body.fuelType || "PETROL",
              netWeight: body.netWeight || "1500",
              grossWeight: body.grossWeight || "2000",
              tyreW: body.tyreFW || body.tyreW || "215",
              tyreDia: body.tyreFD || body.tyreDia || "16",
              category: body.bodyType?.includes("Pickup")
                ? "Pickup"
                : body.bodyType?.includes("SUV")
                ? "SUV"
                : body.bodyType?.includes("Truck") || body.bodyType?.includes("Van")
                ? "Commercial"
                : "Sedan",
              isCustom: true,
              usageCount: 1,
            },
          });
        }
      } catch (persistErr) {
        console.warn("Auto-persisting vehicle to catalog failed:", persistErr);
      }
    }

    // Automatically record Audit Log entry
    const { recordAuditLog } = await import("@/lib/audit");
    const creatorName = newBooking.createdBy?.name || newBooking.createdBy?.username || body.userName || "Officer";
    const prevOwnerInfo = newBooking.previousOwnerName
      ? ` (Prev Owner: ${newBooking.previousOwnerName}${newBooking.previousOwnerPhone ? `, Phone: ${newBooking.previousOwnerPhone}` : ""})`
      : "";
    await recordAuditLog({
      action: "BOOKING_CREATED",
      entity: "Booking",
      entityId: newBooking.id,
      details: {
        message: `${creatorName} created booking #${newBooking.id} for ${newBooking.owner} (${newBooking.vehicle}${newBooking.plate ? `, Plate: ${newBooking.plate}` : ""}) — Service: ${newBooking.type}${prevOwnerInfo}`,
        bookingId: newBooking.id,
        owner: newBooking.owner,
        vehicle: newBooking.vehicle,
        plate: newBooking.plate,
        type: newBooking.type,
        status: newBooking.status,
        previousOwnerName: newBooking.previousOwnerName,
        previousOwnerPhone: newBooking.previousOwnerPhone,
        previousOwnerAddress: newBooking.previousOwnerAddress,
        previousOwnerCustom: newBooking.previousOwnerCustom,
      },
      performedById: body.createdById || body.userId || null,
      branchId: targetBranchId || newBooking.branchId,
      request,
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status: rawStatus, adminUser, reviewedById, userId, reviewNote } = body;

    if (!id || !rawStatus) {
      return NextResponse.json(
        { error: "Booking ID and status are required" },
        { status: 400 }
      );
    }

    const normalizedStatus = rawStatus.toUpperCase() as BookingStatus;
    const status: BookingStatus = Object.values(BookingStatus).includes(normalizedStatus)
      ? normalizedStatus
      : BookingStatus.PENDING;

    const reviewerId = reviewedById || userId || null;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
      include: {
        vrsInvoice: true,
        branch: true,
        createdBy: { select: { id: true, name: true, username: true } },
        reviewedBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    // Record Audit Log for Admin / Supervisor Approval / Rejection / Picked
    const { recordAuditLog } = await import("@/lib/audit");
    const reviewerName = updatedBooking.reviewedBy?.name || updatedBooking.reviewedBy?.username || adminUser || "Supervisor";
    
    let auditAction = `BOOKING_${status}`;
    let auditMessage = `Supervisor ${reviewerName} updated booking #${id} to ${status}`;

    if (status === BookingStatus.APPROVED) {
      auditAction = "BOOKING_APPROVED";
      auditMessage = `Supervisor ${reviewerName} APPROVED booking #${id} for ${updatedBooking.owner} (${updatedBooking.vehicle}${updatedBooking.plate ? `, Plate: ${updatedBooking.plate}` : ""})`;
    } else if (status === BookingStatus.REJECTED) {
      auditAction = "BOOKING_REJECTED";
      auditMessage = `Supervisor ${reviewerName} REJECTED booking #${id} for ${updatedBooking.owner}. Reason: ${reviewNote || "Unspecified"}`;
    } else if (status === BookingStatus.PICKED) {
      auditAction = "BOOKING_PICKED";
      auditMessage = `Officer ${reviewerName} marked plate for booking #${id} as ISSUED / PICKED to ${updatedBooking.owner}`;
    }

    await recordAuditLog({
      action: auditAction,
      entity: "Booking",
      entityId: id,
      details: {
        message: auditMessage,
        adminUser: reviewerName,
        reviewNote: reviewNote || null,
        status,
        plate: updatedBooking.plate,
        owner: updatedBooking.owner,
      },
      performedById: reviewerId,
      branchId: updatedBooking.branchId,
      request,
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}
