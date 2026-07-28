import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
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

    const newBooking = await prisma.booking.create({
      data: {
        id: bookingId,
        type: body.type,
        status: body.status || "pending",
        owner: body.owner,
        vehicle: body.vehicle,
        plate: body.plate || null,
        date: body.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        classification: body.classification || "Private",
      },
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
