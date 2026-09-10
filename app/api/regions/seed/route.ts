import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GHANA_REGIONS = [
  { name: "Greater Accra Region", code: "GAR", description: "Capital territory and economic hub of Ghana" },
  { name: "Ashanti Region", code: "AR", description: "Central commercial region anchored by Kumasi" },
  { name: "Western Region", code: "WR", description: "Coastal region with industrial and port centers" },
  { name: "Central Region", code: "CR", description: "Historic coastal tourism and education hub" },
  { name: "Volta Region", code: "VR", description: "Eastern border region along Volta River" },
  { name: "Eastern Region", code: "ER", description: "Agricultural and mining center anchored by Koforidua" },
  { name: "Northern Region", code: "NR", description: "Largest northern region anchored by Tamale" },
  { name: "Upper East Region", code: "UER", description: "Northeastern border region anchored by Bolgatanga" },
  { name: "Upper West Region", code: "UWR", description: "Northwestern border region anchored by Wa" },
  { name: "Bono Region", code: "BR", description: "Mid-western agricultural belt anchored by Sunyani" },
  { name: "Bono East Region", code: "BER", description: "Commercial agricultural area anchored by Techiman" },
  { name: "Ahafo Region", code: "AHR", description: "Rich timber and mining region anchored by Goaso" },
  { name: "Oti Region", code: "OR", description: "Eastern ecological belt anchored by Dambai" },
  { name: "Savannah Region", code: "SR", description: "Northern wildlife and heritage area anchored by Damongo" },
  { name: "North East Region", code: "NER", description: "Northern administrative region anchored by Nalerigu" },
  { name: "Western North Region", code: "WNR", description: "Resource-rich cocoa belt anchored by Sefwi Wiawso" },
];

export async function GET() {
  return NextResponse.json({
    totalRegions: GHANA_REGIONS.length,
    regions: GHANA_REGIONS,
    info: "POST to this endpoint to seed or restore all 16 Ghana administrative regions (no branches).",
  });
}

export async function POST() {
  try {
    const results = await Promise.all(
      GHANA_REGIONS.map((reg) =>
        prisma.region.upsert({
          where: { code: reg.code },
          update: {
            name: reg.name,
            description: reg.description,
          },
          create: {
            name: reg.name,
            code: reg.code,
            description: reg.description,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${results.length} Ghana administrative regions (no branches).`,
      count: results.length,
      regions: results,
    });
  } catch (error: any) {
    console.error("Error seeding regions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed Ghana regions" },
      { status: 500 }
    );
  }
}
