import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const whereBranch = branchId && branchId !== "ALL" ? { branchId } : {};

    // 1. Core aggregate counts
    const [
      totalBookings,
      approvedBookings,
      pendingBookings,
      pickedBookings,
      rejectedBookings,
      totalBranches,
      totalRegions,
      totalUsers,
      totalReservations,
      totalInvoices,
      allBookings,
      allBranches,
      allRegions,
    ] = await Promise.all([
      prisma.booking.count({ where: whereBranch }),
      prisma.booking.count({ where: { ...whereBranch, status: "APPROVED" } }),
      prisma.booking.count({ where: { ...whereBranch, status: "PENDING" } }),
      prisma.booking.count({ where: { ...whereBranch, status: "PICKED" } }),
      prisma.booking.count({ where: { ...whereBranch, status: "REJECTED" } }),
      prisma.branch.count(),
      prisma.region.count(),
      prisma.user.count(),
      prisma.reservation.count({ where: whereBranch }),
      prisma.vrsInvoice.count({ where: whereBranch }),
      // All bookings for classification, time-series, and sample plates
      prisma.booking.findMany({
        where: whereBranch,
        orderBy: { createdAt: "desc" },
        include: {
          branch: { include: { region: true } },
          vrsInvoice: true,
          reviewedBy: { select: { name: true } },
        },
      }),
      // Branches with booking counts
      prisma.branch.findMany({
        include: {
          region: true,
          _count: {
            select: { bookings: true, users: true, pickupRegistrations: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      // Regions with branches and booking totals
      prisma.region.findMany({
        include: {
          branches: {
            include: {
              _count: { select: { bookings: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const safeTotal = totalBookings || 1;
    const approvedPct = Math.round((approvedBookings / safeTotal) * 100);
    const pendingPct = Math.round((pendingBookings / safeTotal) * 100);
    const pickedPct = Math.round((pickedBookings / safeTotal) * 100);
    const rejectedPct = Math.round((rejectedBookings / safeTotal) * 100);

    // 2. Real classification breakdown & sample plates from DB
    const privBookings = allBookings.filter(
      (b) => (b.classification || "").toUpperCase() === "PRIVATE" || (!b.classification?.toUpperCase().includes("COMMERCIAL") && !b.classification?.toUpperCase().includes("GOV") && !b.classification?.toUpperCase().includes("ELEC"))
    );
    const commBookings = allBookings.filter((b) => (b.classification || "").toUpperCase().includes("COMMERCIAL"));
    const govBookings = allBookings.filter(
      (b) => (b.classification || "").toUpperCase().includes("GOV") || (b.plate || "").startsWith("GV")
    );
    const evBookings = allBookings.filter(
      (b) => (b.classification || "").toUpperCase().includes("ELEC") || (b.plate || "").startsWith("EV")
    );

    const classifications = {
      private: {
        count: privBookings.length,
        pct: Math.round((privBookings.length / safeTotal) * 100),
        samplePlate: privBookings.find((b) => b.plate)?.plate || null,
      },
      commercial: {
        count: commBookings.length,
        pct: Math.round((commBookings.length / safeTotal) * 100),
        samplePlate: commBookings.find((b) => b.plate)?.plate || null,
      },
      government: {
        count: govBookings.length,
        pct: Math.round((govBookings.length / safeTotal) * 100),
        samplePlate: govBookings.find((b) => b.plate)?.plate || null,
      },
      electric: {
        count: evBookings.length,
        pct: Math.round((evBookings.length / safeTotal) * 100),
        samplePlate: evBookings.find((b) => b.plate)?.plate || null,
      },
    };

    // 3. Time Series & Trajectory from real DB timestamps
    const now = new Date();
    
    // Helper to format date key "YYYY-MM-DD"
    const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

    // Build 7-day buckets
    const days7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const dayLabel = d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
      const fullLabel = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

      const dayBookings = allBookings.filter((b) => toDateKey(new Date(b.createdAt)) === key);
      const approved = dayBookings.filter((b) => b.status === "APPROVED").length;
      const pending = dayBookings.filter((b) => b.status === "PENDING").length;

      days7.push({
        date: key,
        dayLabel,
        fullLabel,
        count: dayBookings.length,
        approved,
        pending,
      });
    }

    // Build 30-day buckets
    const days30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const dayLabel = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

      const dayBookings = allBookings.filter((b) => toDateKey(new Date(b.createdAt)) === key);
      days30.push({
        date: key,
        dayLabel,
        count: dayBookings.length,
      });
    }

    // Velocity & Trajectory stats
    const totalIn7Days = days7.reduce((acc, d) => acc + d.count, 0);
    const dailyVelocity = parseFloat((totalIn7Days / 7).toFixed(1));
    
    // Peak day
    let peakDay = days7[0];
    for (const d of days7) {
      if (d.count >= peakDay.count) {
        peakDay = d;
      }
    }
    const peakDayLabel = peakDay.count > 0 ? `${peakDay.dayLabel} (${peakDay.count})` : "STEADY";

    // MoM Growth calculation (compare last 15 days vs previous 15 days)
    const midPoint = new Date(now);
    midPoint.setDate(midPoint.getDate() - 15);
    const pastPoint = new Date(now);
    pastPoint.setDate(pastPoint.getDate() - 30);

    const recentHalf = allBookings.filter((b) => new Date(b.createdAt) >= midPoint).length;
    const priorHalf = allBookings.filter((b) => new Date(b.createdAt) < midPoint && new Date(b.createdAt) >= pastPoint).length;
    
    let momGrowthPct = 0;
    if (priorHalf === 0) {
      momGrowthPct = recentHalf > 0 ? 100 : 0;
    } else {
      momGrowthPct = Math.round(((recentHalf - priorHalf) / priorHalf) * 100);
    }

    // Audit SLA (% of bookings reviewed or resolved)
    const resolvedCount = approvedBookings + rejectedBookings + pickedBookings;
    const auditSlaPct = totalBookings > 0 ? parseFloat(((resolvedCount / totalBookings) * 100).toFixed(1)) : 100.0;

    // 4. Real Regional Distribution from Database
    const regionalHubs = allRegions.map((region) => {
      const branchCount = region.branches.length;
      const bookingCount = region.branches.reduce(
        (sum, br) => sum + (br._count?.bookings || 0),
        0
      );
      const sharePct = totalBookings > 0 ? Math.round((bookingCount / totalBookings) * 100) : 0;
      const primaryBranch = region.branches[0]?.name || null;

      return {
        id: region.id,
        name: region.name,
        code: region.code,
        branchCount,
        bookingCount,
        sharePct,
        primaryBranchName: primaryBranch,
      };
    });

    // Sort regional hubs by booking count desc, then by branch count desc
    regionalHubs.sort((a, b) => b.bookingCount - a.bookingCount || b.branchCount - a.branchCount);

    // 5. Active Branches ranking
    const branchPerformance = allBranches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      type: b.type,
      regionName: b.region?.name || "Unassigned Region",
      bookingsCount: b._count?.bookings || 0,
      usersCount: b._count?.users || 0,
      pickupsCount: b._count?.pickupRegistrations || 0,
    }));
    branchPerformance.sort((a, b) => b.bookingsCount - a.bookingsCount);

    return NextResponse.json({
      summary: {
        totalBookings,
        approvedBookings,
        pendingBookings,
        pickedBookings,
        rejectedBookings,
        approvedPct,
        pendingPct,
        pickedPct,
        rejectedPct,
        totalBranches,
        totalRegions,
        totalUsers,
        totalReservations,
        totalInvoices,
        momGrowthPct,
        dailyVelocity,
        auditSlaPct,
        peakDayLabel,
      },
      classifications,
      trajectory: {
        days7,
        days30,
        dailyVelocity,
        auditSlaPct,
        peakDayLabel,
      },
      regionalHubs,
      branchPerformance,
      recentBookings: allBookings.slice(0, 15),
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard statistics" },
      { status: 500 }
    );
  }
}
