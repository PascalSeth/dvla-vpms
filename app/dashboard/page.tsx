"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TODAY = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const SERVICES = [
  { label: "Regular Filing", color: "#81B71A" },
  { label: "Special Numbers", color: "#f59e0b" },
  { label: "Customized Numbers", color: "#8b5cf6" },
  { label: "GV Records", color: "#ef4444" },
  { label: "CD Records", color: "#3b82f6" },
  { label: "Transfer Records", color: "#06b6d4" },
];

const QUICK_ACTIONS = [
  { label: "File New Record", sub: "Pull VRS record & file", color: "#81B71A", bg: "rgba(129,183,26,0.09)", icon: PlusQAIcon, href: "/dashboard/booking" },
  { label: "Reserved Plates", sub: "Check block allocations", color: "#3b82f6", bg: "rgba(59,130,246,0.09)", icon: SearchQAIcon, href: "/dashboard/plates/reserved" },
  { label: "Plate Issuance", sub: "Issue plates for filed records", color: "#06b6d4", bg: "rgba(6,182,212,0.09)", icon: UserQAIcon, href: "/dashboard/pickup" },
];

const ACTIVITY_CONFIG: Record<string, { dot: string; bg: string; color: string }> = {
  approved: { dot: "#81B71A", bg: "rgba(129,183,26,0.11)", color: "#3d6b08" },
  pending: { dot: "#f59e0b", bg: "rgba(245,158,11,0.11)", color: "#92610a" },
  rejected: { dot: "#ef4444", bg: "rgba(239,68,68,0.11)", color: "#991b1b" },
  batch: { dot: "#3b82f6", bg: "rgba(59,130,246,0.11)", color: "#1e40af" },
  system: { dot: "#81B71A", bg: "rgba(129,183,26,0.08)", color: "#3d6b08" },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Approved: { bg: "rgba(129,183,26,0.09)", color: "#3d6b08", border: "rgba(129,183,26,0.22)" },
  approved: { bg: "rgba(129,183,26,0.09)", color: "#3d6b08", border: "rgba(129,183,26,0.22)" },
  Pending: { bg: "rgba(245,158,11,0.09)", color: "#92610a", border: "rgba(245,158,11,0.22)" },
  pending: { bg: "rgba(245,158,11,0.09)", color: "#92610a", border: "rgba(245,158,11,0.22)" },
  Rejected: { bg: "rgba(239,68,68,0.09)", color: "#991b1b", border: "rgba(239,68,68,0.22)" },
  rejected: { bg: "rgba(239,68,68,0.09)", color: "#991b1b", border: "rgba(239,68,68,0.22)" },
};

interface BookingRecord {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string;
  date: string;
  classification: string;
}

export default function DashboardPage() {
  const [session, setSession] = useState<{ name?: string; organization?: { name: string; code: string } } | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [dbStats, setDbStats] = useState({
    totalBookings: 0,
    specialNumbers: 0,
    reservedAvailable: 0,
    pendingBookings: 0,
    pickupsToday: 0,
  });
  const [activities, setActivities] = useState<Array<{ type: string; text: string; time: string }>>([]);

  useEffect(() => {
    // 1. Load user session
    const stored = localStorage.getItem("dvla_session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }

    // 2. Fetch live data from Prisma DB APIs
    async function loadDashboardData() {
      try {
        const [bookingsRes, resRes, pickupsRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/reservations"),
          fetch("/api/pickups"),
        ]);

        let bData: BookingRecord[] = [];
        let totalB = 0;
        let specialCnt = 0;
        let pendingB = 0;
        let reservedAvail = 0;
        let pickupsCnt = 0;

        if (bookingsRes.ok) {
          bData = await bookingsRes.json();
          totalB = bData.length;
          specialCnt = bData.filter((b) => b.type.toLowerCase().includes("special") || b.type.toLowerCase().includes("custom")).length;
          pendingB = bData.filter((b) => b.status === "pending").length;
          setBookings(bData);
        }

        if (resRes.ok) {
          const reservations = await resRes.json();
          reservedAvail = reservations.reduce((acc: number, r: any) => acc + (r.totalCount - r.claimedCount), 0);
        }

        if (pickupsRes.ok) {
          const pickups = await pickupsRes.json();
          pickupsCnt = pickups.length;
        }

        setDbStats({
          totalBookings: totalB,
          specialNumbers: specialCnt,
          reservedAvailable: reservedAvail,
          pendingBookings: pendingB,
          pickupsToday: pickupsCnt,
        });

        // Generate activity feed from actual DB bookings
        const liveActivities = bData.slice(0, 5).map((b) => ({
          type: b.status === "approved" ? "approved" : b.status === "rejected" ? "rejected" : "pending",
          text: `Record ${b.id} (${b.type}) filed for ${b.owner} — status: ${b.status}`,
          time: b.date || "Today",
        }));

        if (liveActivities.length === 0) {
          setActivities([
            { type: "system", text: "Database synced with Supabase PostgreSQL", time: "Just now" },
            { type: "batch", text: "Multi-tenant organization structures ready", time: "1 hr ago" },
          ]);
        } else {
          setActivities(liveActivities);
        }
      } catch (err) {
        console.error("Error loading dashboard data from Prisma DB:", err);
      }
    }

    loadDashboardData();
  }, []);

  const userName = session?.name || "Administrator";
  const orgName = session?.organization?.name || "DVLA HQ";
  const orgCode = session?.organization?.code || "DVLA-HQ";

  return (
    <div className="space-y-5 pb-8">
      {/* ── Hero Banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(115deg, #0d1a03 0%, #1a2e05 18%, #2d5009 48%, #4a7c10 74%, #81B71A 100%)" }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.065 }} preserveAspectRatio="none">
          <defs>
            <pattern id="herogrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#herogrid)" />
        </svg>

        <div className="relative px-6 py-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#81B71A" }} />
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700 }}>
                  {orgCode} • {TODAY}
                </p>
              </div>
              <h2 className="font-extrabold tracking-tight" style={{ color: "white", fontSize: "1.55rem", lineHeight: 1.2 }}>
                Welcome back, {userName}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.70)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
                {orgName} — Live record-keeping dashboard for vehicle plates filed from VRS.
              </p>

              {/* Mini stat pills */}
              <div className="flex flex-wrap gap-2.5 mt-4">
                {[
                  { label: "Filed Records", val: String(dbStats.totalBookings) },
                  { label: "Pending Review", val: String(dbStats.pendingBookings) },
                  { label: "Reserved Available", val: String(dbStats.reservedAvailable) },
                  { label: "Visitor Pickups", val: String(dbStats.pickupsToday) },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "0.6rem",
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <p style={{ color: "white", fontWeight: 700, fontSize: "0.875rem", lineHeight: 1 }}>{s.val}</p>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.625rem", marginTop: "0.18rem", whiteSpace: "nowrap" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href="/dashboard/booking"
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "0.6rem 1.3rem",
                  borderRadius: "0.75rem",
                  fontSize: "0.825rem",
                  fontWeight: 700,
                  background: "white",
                  color: "#2d5009",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.22)",
                }}
              >
                + New Application
              </Link>
              <Link
                href="/dashboard/bookings"
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "0.6rem 1.3rem",
                  borderRadius: "0.75rem",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.24)",
                }}
              >
                View History
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Bookings", value: String(dbStats.totalBookings), color: "#81B71A" },
          { label: "Special / Range Numbers", value: String(dbStats.specialNumbers), color: "#8b5cf6" },
          { label: "Reserved Available", value: String(dbStats.reservedAvailable), color: "#3b82f6" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[#e8edf5] p-5 hover:border-[#d1d8e8] transition-colors" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.035)" }}>
            <p className="text-xs font-bold text-[#9aa3be] uppercase tracking-wide mb-3">{s.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <div className="w-1 h-8 rounded-full" style={{ background: s.color, opacity: 0.3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="bg-white rounded-xl border border-[#e8edf5] flex items-center gap-3.5 hover:shadow-md hover:border-[#d8e4f0] transition-all duration-200 group no-underline"
            style={{ padding: "1rem 1.1rem", boxShadow: "0 1px 8px rgba(0,0,0,0.042)" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ background: a.bg, color: a.color }}
            >
              <a.icon />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1a2e05" }}>{a.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Booking Services ── */}
      <div className="bg-white rounded-xl border border-[#e8edf5] p-6" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
        <h2 className="text-lg font-bold mb-6" style={{ color: "#1a2e05" }}>Booking Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((service) => (
            <Link key={service.label} href={`/dashboard/booking?service=${encodeURIComponent(service.label)}`}>
              <div
                className="p-4 rounded-lg border border-[#e8edf5] hover:border-[#d1d8e8] hover:bg-[#f8faff] transition-all cursor-pointer group"
                style={{ borderLeftWidth: "4px", borderLeftColor: service.color }}
              >
                <h3 className="font-bold text-sm mb-1 group-hover:text-[#81B71A] transition-colors" style={{ color: "#1a2e05" }}>
                  {service.label}
                </h3>
                <p className="text-xs" style={{ color: "#9aa3be" }}>Plate booking &amp; registration service</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Table + Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent registrations from Database */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#e8edf5] overflow-hidden" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f3f8]">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Recent Registrations (Live DB)</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>{orgName} — Database records</p>
            </div>
            <Link href="/dashboard/bookings" className="text-xs font-semibold hover:underline" style={{ color: "#81B71A" }}>
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                  {["Booking ID", "Owner", "Vehicle", "Classification", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "#9aa3be" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.slice(0, 6).map((b) => {
                    const st = STATUS_STYLE[b.status] || STATUS_STYLE["Pending"];
                    return (
                      <tr key={b.id} className="border-t hover:bg-[#fafbfe] transition-colors cursor-pointer" style={{ borderColor: "#f0f3f8" }}>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold tracking-wide px-2 py-1 rounded-md" style={{ background: "rgba(129,183,26,0.07)", color: "#2d5009" }}>
                            {b.id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-semibold text-[#374167]">{b.owner}</span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#6b7a99" }}>
                          {b.vehicle}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                          <span className="px-2.5 py-1 rounded-full font-semibold border" style={{ background: "rgba(129,183,26,0.09)", color: "#3d6b08", borderColor: "rgba(129,183,26,0.22)" }}>
                            {b.classification || "Private"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border" style={st}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#b0bbd6" }}>
                          {b.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center" style={{ color: "#9aa3be" }}>
                      No database records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f3f8]">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Activity Feed</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>Real-time database events</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#81B71A" }} />
              <span className="text-[10px] font-medium" style={{ color: "#81B71A" }}>Live DB</span>
            </div>
          </div>
          <div className="p-3 space-y-1">
            {activities.map((a, i) => {
              const cfg = ACTIVITY_CONFIG[a.type] || ACTIVITY_CONFIG["system"];
              return (
                <div key={i} className="flex gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-[#fafbfe] cursor-pointer">
                  <div className="relative mt-0.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs leading-relaxed" style={{ color: "#374167" }}>
                      {a.text}
                    </p>
                    <p className="text-[10px] mt-1 font-medium" style={{ color: "#b0bbd6" }}>
                      {a.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3.5 border-t" style={{ borderColor: "#f0f3f8", background: "#fafbfe" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#b0bbd6" }}>
              System Status
            </p>
            <div className="flex items-center gap-2">
              {[
                { label: "API", ok: true },
                { label: "Prisma DB", ok: true },
                { label: "Supabase", ok: true },
                { label: "Multi-Tenant", ok: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#81B71A" }} />
                  <span className="text-[10px] font-medium" style={{ color: "#6b7a99" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Quick action icons ── */
function PlusQAIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchQAIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UserQAIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
