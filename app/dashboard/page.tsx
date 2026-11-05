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
    const stored = localStorage.getItem("dvla_session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    fetchDashboardStats();

    const handleSessionChange = () => {
      const updated = localStorage.getItem("dvla_session");
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          setSession(parsed);
          fetchDashboardStats(parsed?.branch?.id);
        } catch (e) { }
      }
    };

    window.addEventListener("dvla_session_change", handleSessionChange);
    return () => window.removeEventListener("dvla_session_change", handleSessionChange);
  }, []);

  const userName = session?.name || "Administrator";
  const orgName =
    session?.branch?.name ||
    session?.organization?.name ||
    stats?.branchPerformance[0]?.name ||
    "DVLA Station";
  const orgCode =
    session?.branch?.code ||
    session?.organization?.code ||
    stats?.branchPerformance[0]?.code ||
    "HQ";

  const bookingsList = stats?.recentBookings || [];

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

  const chartData = useMemo(() => {
    if (!stats) return { polyline: "", polygon: "", points: [], maxVal: 1, days: [] };

    const days = chartView === "7D" ? stats.trajectory.days7 : stats.trajectory.days30;
    if (!days || days.length === 0)
      return { polyline: "", polygon: "", points: [], maxVal: 1, days: [] };

    const maxVal = Math.max(...days.map((d) => d.count), 1);
    const N = days.length;

    const points = days.map((d, i) => {
      const x = Math.round((i / Math.max(N - 1, 1)) * 500);
      const y = Math.round(100 - (d.count / maxVal) * 80);
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
    <div className="max-w-7xl mx-auto space-y-3.5 pb-12 font-sans text-slate-800 antialiased">
      {/* ── 1. Sleek Compact Command Bar ── */}
      <header className="bg-white rounded-xl border border-slate-200/80 px-4 py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 p-1.5 flex items-center justify-center shrink-0">
            <Image
              src="/dvla-bg.png"
              alt="DVLA Crest"
              width={24}
              height={24}
              priority
              className="object-contain"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-slate-900 truncate">{orgName}</h1>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold border border-slate-200/80">
                {orgCode}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A] animate-pulse" />
                Live ({stats?.summary.totalBookings ?? 0})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Officer: <span className="font-medium text-slate-700">{userName}</span> &bull; {TODAY}
            </p>
          </div>
        </div>

        {/* Compact Action Buttons (h-8 standard) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchDashboardStats(session?.branch?.id)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
            title="Sync Database"
          >
            <SyncIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#81B71A]" : "text-slate-400"}`} />
            <span>Sync</span>
          </button>

          <Link
            href="/dashboard/reports"
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition inline-flex items-center gap-1.5"
          >
            <ReportIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Reports</span>
          </Link>

          <Link
            href="/dashboard/booking"
            className="h-8 px-3 rounded-lg bg-[#81B71A] hover:bg-[#72a315] text-white text-xs font-semibold transition shadow-2xs inline-flex items-center gap-1.5"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </Link>
        </div>
      </header>

      {/* ── 2. Cute, Bite-Sized KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Registrations */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Total Filings</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${(stats?.summary.momGrowthPct ?? 0) >= 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  : "bg-amber-50 text-amber-700 border-amber-200/60"
                }`}
            >
              {(stats?.summary.momGrowthPct ?? 0) >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(stats?.summary.momGrowthPct ?? 0)}% MoM
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {stats?.summary.totalBookings ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">records</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>PostgreSQL</span>
            <span className="text-slate-600 font-medium">100% Synced</span>
          </div>
        </div>

        {/* KPI 2: Approved */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Approved</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
              {stats?.summary.approvedPct ?? 0}%
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {stats?.summary.approvedBookings ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">stamped</span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-[#81B71A] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.summary.approvedPct ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Ready for issue</span>
              <span className="font-mono text-slate-600">
                {stats?.summary.approvedBookings ?? 0}/{stats?.summary.totalBookings ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pending */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Pending Review</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
              Queue
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {stats?.summary.pendingBookings ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">awaiting</span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.summary.pendingPct ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Officer verification</span>
              <span className="font-mono text-slate-600">{stats?.summary.pendingPct ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Picked Up */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Picked Up</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-mono">
              {stats?.summary.pickedPct ?? 0}%
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {stats?.summary.pickedBookings ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">issued</span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.summary.pickedPct ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Dispatched</span>
              <span className="font-mono text-rose-600">
                {stats?.summary.rejectedBookings ?? 0} rejected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Creative Bento Grid: Trajectory + Fleet Mix + Regional Hubs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left 8 Columns: Trajectory Chart + Compact Fleet Classification */}
        <div className="lg:col-span-8 flex flex-col gap-3.5">
          {/* Trajectory Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Registration Trajectory</h2>
                <p className="text-[11px] text-slate-400">
                  Daily filing volume &amp; processing velocity
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Inline Mini Telemetry Pills */}
                <div className="hidden sm:flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-slate-600">
                    Velocity:{" "}
                    <strong className="font-mono text-slate-900">
                      {stats?.trajectory.dailyVelocity ?? 0}/d
                    </strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-slate-600">
                    SLA:{" "}
                    <strong className="font-mono text-emerald-700">
                      {stats?.trajectory.auditSlaPct ?? 100}%
                    </strong>
                  </span>
                </div>

                {/* View Switcher */}
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                  {(["7D", "30D"] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setChartView(view)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${chartView === view
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Contained SVG Chart */}
            <div className="relative h-36 w-full pt-3">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 500 115"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#81B71A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#81B71A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />

                {chartData.polygon && (
                  <polygon points={chartData.polygon} fill="url(#chartFade)" />
                )}

                {chartData.polyline && (
                  <polyline
                    points={chartData.polyline}
                    fill="none"
                    stroke="#81B71A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {chartData.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="#ffffff"
                    stroke="#81B71A"
                    strokeWidth="2"
                    className="hover:scale-125 transition-transform cursor-pointer"
                  >
                    <title>{`${p.label}: ${p.val} filings`}</title>
                  </circle>
                ))}
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100">
              {chartView === "7D" ? (
                (stats?.trajectory.days7 || []).map((d) => (
                  <span
                    key={d.date}
                    className={
                      stats?.trajectory.peakDayLabel?.includes(d.dayLabel)
                        ? "font-bold text-slate-800"
                        : "text-slate-400"
                    }
                  >
                    {d.dayLabel}
                  </span>
                ))
              ) : (
                <>
                  <span>30d ago</span>
                  <span>15d ago</span>
                  <span className="font-semibold text-slate-700">Today</span>
                </>
              )}
            </div>
          </div>

          {/* Fleet Classification Breakdown (Compact Strip) */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">Fleet Classification Mix</h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({stats?.summary.totalBookings ?? 0} audited)
                </span>
              </div>
              {/* Multi-segment micro bar */}
              <div className="w-32 sm:w-48 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${stats?.classifications.private.pct ?? 0}%` }}
                  className="bg-slate-800"
                />
                <div
                  style={{ width: `${stats?.classifications.commercial.pct ?? 0}%` }}
                  className="bg-amber-400"
                />
                <div
                  style={{ width: `${stats?.classifications.government.pct ?? 0}%` }}
                  className="bg-emerald-600"
                />
                <div
                  style={{ width: `${stats?.classifications.electric.pct ?? 0}%` }}
                  className="bg-[#81B71A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  label: "Private",
                  dot: "bg-slate-800",
                  plateStyle: "bg-white text-slate-800 border-slate-300",
                  data: stats?.classifications.private,
                },
                {
                  label: "Commercial",
                  dot: "bg-amber-400",
                  plateStyle: "bg-amber-100 text-amber-950 border-amber-300",
                  data: stats?.classifications.commercial,
                },
                {
                  label: "Gov Protocol",
                  dot: "bg-emerald-600",
                  plateStyle: "bg-slate-100 text-slate-800 border-slate-300",
                  data: stats?.classifications.government,
                },
                {
                  label: "Electric (EV)",
                  dot: "bg-[#81B71A]",
                  plateStyle: "bg-emerald-50 text-emerald-900 border-emerald-300",
                  data: stats?.classifications.electric,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.data?.pct ?? 0}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {item.data?.count ?? 0}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border truncate max-w-[85px] ${item.plateStyle}`}
                    >
                      {item.data?.samplePlate || "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Regional Station Hubs */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Regional Hubs</h2>
                <p className="text-[11px] text-slate-400">
                  {stats?.summary.totalRegions ?? 16} Regions &bull;{" "}
                  {stats?.summary.totalBranches ?? 0} Stations
                </p>
              </div>
              <Link
                href="/dashboard/branches"
                className="text-[11px] font-semibold text-[#558110] hover:underline"
              >
                View All &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {stats && stats.regionalHubs.length > 0 ? (
                stats.regionalHubs.slice(0, 5).map((hub, idx) => {
                  const barColor =
                    idx === 0
                      ? "bg-[#81B71A]"
                      : idx === 1
                        ? "bg-blue-600"
                        : idx === 2
                          ? "bg-amber-500"
                          : "bg-slate-600";

                  return (
                    <div key={hub.id} className="py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 truncate">{hub.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {hub.primaryBranchName || "Standby Node"} &bull; {hub.branchCount}{" "}
                            station{hub.branchCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-slate-900">
                            {hub.bookingCount}
                          </span>
                          <span className="block text-[10px] font-mono text-slate-400">
                            {hub.sharePct}% share
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`${barColor} h-full rounded-full transition-all duration-500`}
                          style={{
                            width: `${Math.max(hub.sharePct, hub.branchCount > 0 ? 6 : 2)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No regional hubs active yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Active Station Quota</span>
            <span className="font-mono font-semibold text-slate-700">
              {stats?.summary.totalBranches ?? 0} Online
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Compact High-Density Recent Filings Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900">Recent Station Filings</h3>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">
              {stats?.summary.totalBookings ?? bookingsList.length}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Compact Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter plate, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 pr-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#81B71A] outline-none transition w-44 text-slate-700 placeholder:text-slate-400"
              />
              <svg
                className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Compact Filter Pills */}
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
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
                    className={`h-6 px-2 rounded-md text-[10px] font-semibold transition cursor-pointer inline-flex items-center gap-1 ${activeTab === tab
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    <span>{tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                    <span className="text-[9px] font-mono text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-2 px-4">Filing ID</th>
                <th className="py-2 px-3">Plate</th>
                <th className="py-2 px-3">Owner</th>
                <th className="py-2 px-3">Vehicle</th>
                <th className="py-2 px-3">Class</th>
                <th className="py-2 px-3">Station</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Syncing live records…
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No matching filings found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((b) => {
                  const statusUpper = (b.status || "").toUpperCase();
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-4 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-600">
                        #{b.id}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        {b.plate ? (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border ${b.plate.startsWith("GV")
                                ? "bg-slate-100 text-slate-800 border-slate-300"
                                : b.plate.startsWith("EV")
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                                  : "bg-amber-50 text-amber-950 border-amber-300"
                              }`}
                          >
                            {b.plate}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-[140px]">
                        {b.owner}
                      </td>

                      <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">
                        {b.vehicle}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-600">
                          {b.classification || b.type}
                        </span>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-500">
                        {b.branch?.name || orgName}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusUpper === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              : statusUpper === "PICKED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                                : statusUpper === "REJECTED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200/70"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/70"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusUpper === "APPROVED"
                                ? "bg-emerald-500"
                                : statusUpper === "PICKED"
                                  ? "bg-blue-500"
                                  : statusUpper === "REJECTED"
                                    ? "bg-rose-500"
                                    : "bg-amber-500"
                              }`}
                          />
                          {b.status}
                        </span>
                      </td>

                      <td className="py-2 px-4 text-right whitespace-nowrap text-[11px] text-slate-400 font-mono">
                        {b.date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Table Footer */}
        <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">
            Showing {filteredRecords.length} of {stats?.summary.totalBookings ?? 0} records
          </span>
          <Link
            href="/dashboard/bookings"
            className="text-[#558110] hover:text-[#385908] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Full Directory</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Crisp Micro Icons ── */

function SyncIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
      />
    </svg>
  );
}

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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}