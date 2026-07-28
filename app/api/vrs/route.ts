import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceNo = searchParams.get("invoiceNo");

    if (invoiceNo) {
      const invoice = await prisma.vrsInvoice.findUnique({
        where: { invoiceNo },
      });
      if (!invoice) {
        return NextResponse.json({ error: "VRS Invoice not found" }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }

    const invoices = await prisma.vrsInvoice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching VRS invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch VRS invoices" },
      { status: 500 }
    );
  }
}
