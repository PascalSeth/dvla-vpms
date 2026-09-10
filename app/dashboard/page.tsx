"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

const TODAY = new Date().toLocaleDateString("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface BookingRecord {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string | null;
  date: string;
  classification?: string | null;
  createdAt?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
    region?: { name: string; code: string } | null;
  } | null;
  vrsInvoice?: {
    invoiceNo: string;
    make: string;
    model?: string;
  } | null;
  reviewedBy?: { name: string } | null;
}

interface DashboardStats {
  summary: {
    totalBookings: number;
    approvedBookings: number;
    pendingBookings: number;
    pickedBookings: number;
    rejectedBookings: number;
    approvedPct: number;
    pendingPct: number;
    pickedPct: number;
    rejectedPct: number;
    totalBranches: number;
    totalRegions: number;
    totalUsers: number;
    totalReservations: number;
    totalInvoices: number;
    momGrowthPct: number;
    dailyVelocity: number;
    auditSlaPct: number;
    peakDayLabel: string;
  };
  classifications: {
    private: { count: number; pct: number; samplePlate: string | null };
    commercial: { count: number; pct: number; samplePlate: string | null };
    government: { count: number; pct: number; samplePlate: string | null };
    electric: { count: number; pct: number; samplePlate: string | null };
  };
  trajectory: {
    days7: Array<{
      date: string;
      dayLabel: string;
      fullLabel: string;
      count: number;
      approved: number;
      pending: number;
    }>;
    days30: Array<{ date: string; dayLabel: string; count: number }>;
    dailyVelocity: number;
    auditSlaPct: number;
    peakDayLabel: string;
  };
  regionalHubs: Array<{
    id: string;
    name: string;
    code: string;
    branchCount: number;
    bookingCount: number;
    sharePct: number;
    primaryBranchName: string | null;
  }>;
  branchPerformance: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    regionName: string;
    bookingsCount: number;
    usersCount: number;
    pickupsCount: number;
  }>;
  recentBookings: BookingRecord[];
}

export default function DashboardPage() {
  const [session, setSession] = useState<{
    name?: string;
    role?: string;
    organization?: { name: string; code: string };
    branch?: { id?: string; name: string; code: string };
  } | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "APPROVED" | "PENDING" | "PICKED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [chartView, setChartView] = useState<"7D" | "30D">("7D");

  const fetchDashboardStats = async (branchId?: string) => {
    try {
      setLoading(true);
      const url = branchId ? `/api/dashboard/stats?branchId=${branchId}` : "/api/dashboard/stats";
      const res = await fetch(url);
      if (res.ok) {
        const data: DashboardStats = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Dashboard stats load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Session load
    const stored = localStorage.getItem("dvla_session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    // 2. Fetch live data from database stats endpoint
    fetchDashboardStats();

    // Listen for station changes in topbar
    const handleSessionChange = () => {
      const updated = localStorage.getItem("dvla_session");
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          setSession(parsed);
          fetchDashboardStats(parsed?.branch?.id);
        } catch (e) {}
      }
    };

    window.addEventListener("dvla_session_change", handleSessionChange);
    return () => window.removeEventListener("dvla_session_change", handleSessionChange);
  }, []);

  const userName = session?.name || "Administrator";
  const orgName = session?.branch?.name || session?.organization?.name || (stats?.branchPerformance[0]?.name || "DVLA Station");
  const orgCode = session?.branch?.code || session?.organization?.code || (stats?.branchPerformance[0]?.code || "");

  const bookingsList = stats?.recentBookings || [];

  // Filtered recent filings
  const filteredRecords = useMemo(() => {
    let list = bookingsList;
    if (activeTab !== "ALL") {
      list = list.filter((b) => (b.status || "").toUpperCase() === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          (b.plate || "").toLowerCase().includes(q) ||
          b.owner.toLowerCase().includes(q) ||
          b.vehicle.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 8);
  }, [bookingsList, activeTab, searchQuery]);

  // Dynamic SVG Geometry computed from real DB time series
  const chartData = useMemo(() => {
    if (!stats) return { polyline: "", polygon: "", points: [], maxVal: 1, days: [] };

    const days = chartView === "7D" ? stats.trajectory.days7 : stats.trajectory.days30;
    if (!days || days.length === 0) return { polyline: "", polygon: "", points: [], maxVal: 1, days: [] };

    const maxVal = Math.max(...days.map((d) => d.count), 1);
    const N = days.length;

    const points = days.map((d, i) => {
      const x = Math.round((i / Math.max(N - 1, 1)) * 500);
      // SVG Y range from 100 (baseline) to 15 (peak) -> available 85px
      const y = Math.round(100 - (d.count / maxVal) * 85);
      return {
        x,
        y,
        val: d.count,
        label: "fullLabel" in d ? d.fullLabel : d.dayLabel,
        dayLabel: d.dayLabel,
      };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
    const polygon = `0,110 ${polyline} 500,110`;

    return { polyline, polygon, points, maxVal, days };
  }, [stats, chartView]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* ── 1. Executive Corporate Command Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center shrink-0 shadow-sm">
            <Image
              src="/dvla-bg.png"
              alt="DVLA Ghana Crest"
              width={32}
              height={32}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {orgName} Executive Operations Cockpit
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-extrabold border border-slate-200">
                {orgCode}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A] animate-pulse" />
                DATABASE ACTIVE &bull; {stats?.summary.totalBookings ?? 0} LIVE RECORDS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              National Vehicle Registration &amp; Plate Management System &bull; Active Officer: <strong className="text-slate-800 font-semibold">{userName}</strong> &bull; {TODAY}
            </p>
          </div>
        </div>

        {/* Executive Action Shortcuts */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchDashboardStats(session?.branch?.id)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Refresh database statistics"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Sync</span>
          </button>
          <Link
            href="/dashboard/reports"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <ReportIcon className="w-4 h-4 text-slate-500" />
            <span>Audit Reports</span>
          </Link>
          <Link
            href="/dashboard/booking"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#81B71A] to-[#6fa314] hover:brightness-105 text-white text-xs font-extrabold transition shadow-md shadow-[#81B71A]/20 flex items-center gap-2 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>+ New Plate Booking</span>
          </Link>
        </div>
      </div>

      {/* ── 2. 4 Executive Real-Time Core KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Registrations */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Registrations
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {stats?.summary.totalBookings ?? 0}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                PostgreSQL
              </span>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${(stats?.summary.momGrowthPct ?? 0) >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                <span>{(stats?.summary.momGrowthPct ?? 0) >= 0 ? "↑" : "↓"}</span> {Math.abs(stats?.summary.momGrowthPct ?? 0)}% MoM
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Prisma DB Verified</span>
            <span className="font-bold text-slate-800 font-mono">100% Synced</span>
          </div>
        </div>

        {/* KPI 2: Approved Filings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Approved &amp; Stamped
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {stats?.summary.approvedBookings ?? 0}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold font-mono">
              {stats?.summary.approvedPct ?? 0}% Quota
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-[#81B71A] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.summary.approvedPct ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Ready for Physical Stamping</span>
              <span className="font-mono font-bold text-slate-600">
                {stats?.summary.approvedBookings ?? 0} of {stats?.summary.totalBookings ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pending Verification */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Verification
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {stats?.summary.pendingBookings ?? 0}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
              Review Queue
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.summary.pendingPct ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Queue: {stats?.summary.pendingBookings ?? 0} awaiting officer sign-off</span>
              <span className="font-mono font-bold text-slate-600">
                {stats?.summary.pendingBookings ?? 0} pending
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Picked Up */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Completed Pickups
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {stats?.summary.pickedBookings ?? 0}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-extrabold font-mono">
              {stats?.summary.pickedPct ?? 0}% Distributed
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.summary.pickedPct ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>In Public Circulation</span>
              <span className="font-mono font-bold text-slate-600">
                {stats?.summary.rejectedBookings ?? 0} rejected
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. Creative Corporate Analytics: Trajectory Chart & National Hub Capacity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Registration Volume Trajectory (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Weekly Registration Trajectory &amp; Volume
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active filing velocity across recent operational business days (100% database-computed)
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setChartView("7D")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  chartView === "7D" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                7-Day Trajectory
              </button>
              <button
                type="button"
                onClick={() => setChartView("30D")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  chartView === "30D" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                30-Day Trend
              </button>
            </div>
          </div>

          {/* Dynamic Responsive SVG Chart Driven by Database Records */}
          <div className="relative h-44 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#81B71A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#81B71A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background horizontal grid lines */}
              <line x1="0" y1="15" x2="500" y2="15" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="57" x2="500" y2="57" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area fill */}
              {chartData.polygon && (
                <polygon points={chartData.polygon} fill="url(#areaGlow)" />
              )}

              {/* Smooth Trendline */}
              {chartData.polyline && (
                <polyline
                  points={chartData.polyline}
                  fill="none"
                  stroke="#81B71A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dynamic Interactive Point Nodes from DB */}
              {chartData.points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#81B71A"
                    strokeWidth="2.5"
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${p.label}: ${p.val} filings`}</title>
                  </circle>
                </g>
              ))}
            </svg>

            {/* Dynamic X-axis days based on actual database range */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100">
              {chartView === "7D" ? (
                (stats?.trajectory.days7 || []).map((d, idx) => (
                  <span
                    key={d.date}
                    className={
                      stats?.trajectory.peakDayLabel.includes(d.dayLabel)
                        ? "font-bold text-slate-900"
                        : "text-slate-500"
                    }
                  >
                    {d.dayLabel}
                  </span>
                ))
              ) : (
                <>
                  <span>30 DAYS AGO</span>
                  <span>15 DAYS AGO</span>
                  <span className="font-bold text-slate-900">TODAY</span>
                </>
              )}
            </div>
          </div>

          {/* Performance telemetry footer (Database computed) */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Daily Velocity</span>
              <p className="text-xs font-black text-slate-800 font-mono mt-0.5">
                {stats?.trajectory.dailyVelocity ?? 0} filings/day
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Approval Rate</span>
              <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">
                {stats?.summary.approvedPct ?? 0}% Verified
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Audit SLA</span>
              <p className="text-xs font-black text-blue-700 font-mono mt-0.5">
                {stats?.trajectory.auditSlaPct ?? 100}% Compliant
              </p>
            </div>
          </div>
        </div>

        {/* Right: National Station Stock & Hub Allocation (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                National Station Quota &amp; Hubs
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {stats?.summary.totalRegions ?? 16} REGIONS &bull; {stats?.summary.totalBranches ?? 0} STATIONS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live plate allocation &amp; filings across national administrative nodes
            </p>
          </div>

          {/* Real regional hubs capacity bars from database */}
          <div className="space-y-3">
            {stats && stats.regionalHubs.length > 0 ? (
              stats.regionalHubs.slice(0, 4).map((hub, idx) => {
                const colorScheme =
                  idx === 0
                    ? "bg-[#81B71A]"
                    : idx === 1
                    ? "bg-blue-600"
                    : idx === 2
                    ? "bg-amber-500"
                    : "bg-purple-600";

                return (
                  <div key={hub.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {hub.name} {hub.primaryBranchName ? `• ${hub.primaryBranchName}` : "• Standby Hub"}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {hub.sharePct}% National Share
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`${colorScheme} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(hub.sharePct, hub.branchCount > 0 ? 8 : 2)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        {hub.branchCount} Operational Station{hub.branchCount === 1 ? "" : "s"}
                      </span>
                      <span className="font-semibold text-slate-600">
                        {hub.bookingCount} Filings Registered
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No regional stations registered in database yet.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Active: {stats?.summary.totalBranches ?? 0} Station{stats?.summary.totalBranches === 1 ? "" : "s"} in {stats?.summary.totalRegions ?? 0} Regions
            </span>
            <Link
              href="/dashboard/branches"
              className="text-[#558110] hover:text-[#385908] font-bold text-[11px] hover:underline"
            >
              Manage {stats?.summary.totalRegions ?? 16} Regional Jurisdictions &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* ── 4. Real Fleet Classification Mix (High Contrast Cards) ── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Fleet Classification Breakdown
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live registration distribution by official Ghana plate classification category (from database)
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {stats?.summary.totalBookings ?? 0} FILINGS AUDITED
          </span>
        </div>

        {/* Real Segmented Classification Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100">
            <div
              style={{ width: `${stats?.classifications.private.pct ?? 0}%` }}
              className="bg-slate-800 hover:brightness-125 transition-all cursor-pointer"
              title={`Private: ${stats?.classifications.private.count ?? 0} (${stats?.classifications.private.pct ?? 0}%)`}
            />
            <div
              style={{ width: `${stats?.classifications.commercial.pct ?? 0}%` }}
              className="bg-amber-400 hover:brightness-110 transition-all cursor-pointer"
              title={`Commercial: ${stats?.classifications.commercial.count ?? 0} (${stats?.classifications.commercial.pct ?? 0}%)`}
            />
            <div
              style={{ width: `${stats?.classifications.government.pct ?? 0}%` }}
              className="bg-emerald-600 hover:brightness-110 transition-all cursor-pointer"
              title={`Government: ${stats?.classifications.government.count ?? 0} (${stats?.classifications.government.pct ?? 0}%)`}
            />
            <div
              style={{ width: `${stats?.classifications.electric.pct ?? 0}%` }}
              className="bg-[#81B71A] hover:brightness-110 transition-all cursor-pointer"
              title={`Electric (EV): ${stats?.classifications.electric.count ?? 0} (${stats?.classifications.electric.pct ?? 0}%)`}
            />
          </div>
        </div>

        {/* 4 Category Cards with Dynamic Database Sample Plate Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          {/* Private */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                <span className="text-xs font-bold text-slate-900">Private Vehicle</span>
              </div>
              <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-800 border border-slate-300 font-bold shadow-2xs">
                {stats?.classifications.private.samplePlate
                  ? `⚪ ${stats.classifications.private.samplePlate}`
                  : "⚪ None Logged"}
              </span>
            </div>
            <span className="font-mono font-black text-base text-slate-900">
              {stats?.classifications.private.count ?? 0}{" "}
              <span className="text-[10px] text-slate-400 font-normal">
                ({stats?.classifications.private.pct ?? 0}%)
              </span>
            </span>
          </div>

          {/* Commercial */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-900">Commercial</span>
              </div>
              <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 border border-amber-400 font-bold shadow-2xs">
                {stats?.classifications.commercial.samplePlate
                  ? `🟡 ${stats.classifications.commercial.samplePlate}`
                  : "🟡 None Logged"}
              </span>
            </div>
            <span className="font-mono font-black text-base text-slate-900">
              {stats?.classifications.commercial.count ?? 0}{" "}
              <span className="text-[10px] text-slate-400 font-normal">
                ({stats?.classifications.commercial.pct ?? 0}%)
              </span>
            </span>
          </div>

          {/* Government */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Gov Protocol (GV)</span>
              </div>
              <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-900 border border-slate-400 font-bold shadow-2xs">
                {stats?.classifications.government.samplePlate
                  ? `🏛️ ${stats.classifications.government.samplePlate}`
                  : "🏛️ None Logged"}
              </span>
            </div>
            <span className="font-mono font-black text-base text-slate-900">
              {stats?.classifications.government.count ?? 0}{" "}
              <span className="text-[10px] text-slate-400 font-normal">
                ({stats?.classifications.government.pct ?? 0}%)
              </span>
            </span>
          </div>

          {/* EV */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#81B71A]" />
                <span className="text-xs font-bold text-slate-900">Electric Vehicle (EV)</span>
              </div>
              <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold shadow-2xs">
                {stats?.classifications.electric.samplePlate
                  ? `🟢 ${stats.classifications.electric.samplePlate}`
                  : "🟢 None Logged"}
              </span>
            </div>
            <span className="font-mono font-black text-base text-slate-900">
              {stats?.classifications.electric.count ?? 0}{" "}
              <span className="text-[10px] text-slate-400 font-normal">
                ({stats?.classifications.electric.pct ?? 0}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 5. Live High-Density Database Filings Table ── */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Recent Station Filings
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono border border-slate-200">
              {stats?.summary.totalBookings ?? bookingsList.length} Records in Database
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search plate, owner, car..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#81B71A] outline-none transition w-48 font-medium shadow-2xs"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {(["ALL", "APPROVED", "PENDING", "PICKED", "REJECTED"] as const).map((tab) => {
                const count =
                  tab === "ALL"
                    ? stats?.summary.totalBookings ?? bookingsList.length
                    : tab === "APPROVED"
                    ? stats?.summary.approvedBookings ?? 0
                    : tab === "PENDING"
                    ? stats?.summary.pendingBookings ?? 0
                    : tab === "PICKED"
                    ? stats?.summary.pickedBookings ?? 0
                    : stats?.summary.rejectedBookings ?? 0;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      activeTab === tab
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`text-[9px] px-1 rounded-full ${activeTab === tab ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-3">Plate Identifier</th>
                <th className="py-3 px-3">Registered Owner</th>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Station Node</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Filing Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading live database records…
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No records found matching current criteria
                  </td>
                </tr>
              ) : (
                filteredRecords.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    {/* ID */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono font-bold text-slate-700">
                      #{b.id}
                    </td>

                    {/* Plate */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {b.plate ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-black text-[11px] border shadow-2xs ${
                            b.plate.startsWith("GV")
                              ? "bg-slate-100 text-slate-900 border-slate-300"
                              : b.plate.startsWith("EV")
                              ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                              : "bg-amber-100 text-amber-950 border-amber-300"
                          }`}
                        >
                          {b.plate}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                      )}
                    </td>

                    {/* Owner */}
                    <td className="py-2.5 px-3 font-semibold text-slate-800 truncate max-w-[150px]">
                      {b.owner}
                    </td>

                    {/* Vehicle */}
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-[160px]">
                      {b.vehicle}
                    </td>

                    {/* Classification */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {b.classification || b.type}
                      </span>
                    </td>

                    {/* Station Node */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {b.branch?.name || orgName}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          (b.status || "").toUpperCase() === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : (b.status || "").toUpperCase() === "PICKED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : (b.status || "").toUpperCase() === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            (b.status || "").toUpperCase() === "APPROVED"
                              ? "bg-emerald-500"
                              : (b.status || "").toUpperCase() === "PICKED"
                              ? "bg-blue-500"
                              : (b.status || "").toUpperCase() === "REJECTED"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {b.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap text-slate-400 font-medium">
                      {b.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Connected live to DVLA PostgreSQL Prisma Database &bull; {stats?.summary.totalBookings ?? 0} Total Filings
          </span>
          <Link
            href="/dashboard/bookings"
            className="text-[#558110] hover:text-[#385908] font-bold text-[11px] hover:underline flex items-center gap-1"
          >
            <span>Open Complete Bookings Directory ({stats?.summary.totalBookings ?? 0} Records) &rarr;</span>
          </Link>
        </div>
      </div>

    </div>
  );
}

/* ── Lightweight Icons ── */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
