import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
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
    const newReservation = await prisma.reservation.create({
      data: {
        type: body.type,
        platePattern: body.platePattern || null,
        rangeStart: body.rangeStart ? parseInt(body.rangeStart, 10) : null,
        rangeEnd: body.rangeEnd ? parseInt(body.rangeEnd, 10) : null,
        prefix: body.prefix,
        year: body.year,
        holder: body.holder,
        authRef: body.authRef,
        expiryDate: body.expiryDate,
        status: body.status || "Active",
        claimedCount: body.claimedCount ? parseInt(body.claimedCount, 10) : 0,
        totalCount: body.totalCount ? parseInt(body.totalCount, 10) : 1,
      },
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
