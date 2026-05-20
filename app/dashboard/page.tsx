"use client";

import { useState } from "react";
import Link from "next/link";

/* ─── Data ─── */

const TODAY = "Monday, 18 May 2026";

const STATS = [
  {
    label: "Total Plates Issued",
    value: "2,481",
    change: "+3.2%",
    up: true,
    icon: PlateStatIcon,
    accent: "#81B71A",
    bg: "rgba(129,183,26,0.09)",
    sub: "Adenta Branch — AD plates",
    spark: [182, 234, 199, 276, 312, 258, 324],
  },
  {
    label: "Pending Applications",
    value: "142",
    change: "+12.5%",
    up: true,
    icon: ClockStatIcon,
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.09)",
    sub: "Awaiting review",
    spark: [82, 94, 79, 106, 92, 108, 142],
  },
  {
    label: "Approved Today",
    value: "23",
    change: "+8.1%",
    up: true,
    icon: CheckStatIcon,
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.09)",
    sub: "Adenta Branch office",
    spark: [14, 16, 13, 18, 15, 17, 23],
  },
  {
    label: "Expired / Flagged",
    value: "48",
    change: "−4.3%",
    up: false,
    icon: AlertStatIcon,
    accent: "#ef4444",
    bg: "rgba(239,68,68,0.09)",
    sub: "Requires action",
    spark: [58, 55, 54, 56, 53, 52, 48],
  },
];

const MONTHLY = [
  { month: "Jan", value: 182 },
  { month: "Feb", value: 234 },
  { month: "Mar", value: 199 },
  { month: "Apr", value: 276 },
  { month: "May", value: 312 },
  { month: "Jun", value: 258 },
];

const PLATE_TYPES = [
  { label: "Private",    count: 1280, pct: 52, color: "#81B71A" },
  { label: "Commercial", count:  648, pct: 26, color: "#3b82f6" },
  { label: "Government", count:  298, pct: 12, color: "#f59e0b" },
  { label: "Equipment",  count:  255, pct: 10, color: "#8b5cf6" },
];

const REGIONS = [
  { name: "Adentan Frafraha", plates: 842, pct: 34, highlight: true  },
  { name: "Oyibi",            plates: 589, pct: 24, highlight: true  },
  { name: "Madina",           plates: 421, pct: 17, highlight: false },
  { name: "Teshie-Nungua",    plates: 297, pct: 12, highlight: false },
  { name: "Dodowa",           plates: 182, pct:  7, highlight: false },
  { name: "Others",           plates: 150, pct:  6, highlight: false },
];

const QUICK_ACTIONS = [
  { label: "New Application", sub: "Register a new plate",   color: "#81B71A", bg: "rgba(129,183,26,0.09)", icon: PlusQAIcon,     href: "/dashboard/booking"             },
  { label: "Search Registry",  sub: "Find by plate or owner", color: "#3b82f6", bg: "rgba(59,130,246,0.09)", icon: SearchQAIcon,   href: "/dashboard/plates"              },
  { label: "Export Report",    sub: "Download CSV or PDF",    color: "#8b5cf6", bg: "rgba(139,92,246,0.09)", icon: DownloadQAIcon, href: "/dashboard/reports"             },
];

const RECENT = [
  {
    id: "AD 0891-26",
    owners: [
      { name: "Kwame Asante", initials: "KA", role: "Primary" },
      { name: "Akua Asante",  initials: "AA", role: "Co-Owner" }
    ],
    region: "Adentan Frafraha",
    type: "Private",
    status: "Approved",
    date: "18 May 2026"
  },
  {
    id: "AD 1242-26",
    owners: [
      { name: "Abena Mensah", initials: "AM", role: "Primary" },
      { name: "Kofi Mensah",  initials: "KM", role: "Co-Owner" }
    ],
    region: "Oyibi",
    type: "Commercial",
    status: "Pending",
    date: "18 May 2026"
  },
  {
    id: "AD 0729-26",
    owners: [
      { name: "Yaw Boateng", initials: "YB", role: "Primary" }
    ],
    region: "Adentan Frafraha",
    type: "Private",
    status: "Approved",
    date: "17 May 2026"
  },
  {
    id: "AD 0928-26",
    owners: [
      { name: "Ama Owusu", initials: "AO", role: "Primary" }
    ],
    region: "Madina",
    type: "Government",
    status: "Approved",
    date: "17 May 2026"
  },
  {
    id: "AD 0819-26",
    owners: [
      { name: "Kojo Darko", initials: "KD", role: "Primary" }
    ],
    region: "Oyibi",
    type: "Commercial",
    status: "Rejected",
    date: "16 May 2026"
  },
  {
    id: "AD 0201-26",
    owners: [
      { name: "Efua Adjei", initials: "EA", role: "Primary" }
    ],
    region: "Teshie-Nungua",
    type: "Private",
    status: "Pending",
    date: "16 May 2026"
  },
  {
    id: "AD 3921-25",
    owners: [
      { name: "Fiifi Antwi", initials: "FA", role: "Primary" }
    ],
    region: "Dodowa",
    type: "Equipment",
    status: "Approved",
    date: "15 May 2026"
  },
];

const ACTIVITY = [
  { type: "approved" as const, text: "Plate AD 0891-26 approved for Kwame Asante & Akua Asante",  time: "2 min ago"  },
  { type: "pending"  as const, text: "New joint application submitted — Abena & Kofi Mensah",     time: "14 min ago" },
  { type: "rejected" as const, text: "Plate AD 0819-26 rejected — document mismatch",             time: "1 hr ago"   },
  { type: "batch"    as const, text: "Batch renewal processed — 12 plates, Adenta Branch",        time: "3 hr ago"   },
  { type: "system"   as const, text: "System backup completed successfully",                       time: "6 hr ago"   },
  { type: "pending"  as const, text: "Expiry notice sent to 18 AD plate owners",                  time: "Yesterday"  },
];

const ACTIVITY_CONFIG: Record<string, { dot: string; bg: string; color: string }> = {
  approved: { dot: "#81B71A", bg: "rgba(129,183,26,0.11)", color: "#3d6b08" },
  pending:  { dot: "#f59e0b", bg: "rgba(245,158,11,0.11)", color: "#92610a" },
  rejected: { dot: "#ef4444", bg: "rgba(239,68,68,0.11)",  color: "#991b1b" },
  batch:    { dot: "#3b82f6", bg: "rgba(59,130,246,0.11)", color: "#1e40af" },
  system:   { dot: "#81B71A", bg: "rgba(129,183,26,0.08)", color: "#3d6b08" },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Approved: { bg: "rgba(129,183,26,0.09)", color: "#3d6b08", border: "rgba(129,183,26,0.22)" },
  Pending:  { bg: "rgba(245,158,11,0.09)", color: "#92610a", border: "rgba(245,158,11,0.22)" },
  Rejected: { bg: "rgba(239,68,68,0.09)",  color: "#991b1b", border: "rgba(239,68,68,0.22)"  },
};

/* ── Sparkline ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 72, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
    </svg>
  );
}

/* ── SVG Donut chart ── */
function DonutChart() {
  const cx = 70, cy = 70, r = 50, sw = 16;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const segs = PLATE_TYPES.map(t => {
    const len = (t.pct / 100) * circ;
    const offset = -(acc / 100) * circ;
    acc += t.pct;
    return { ...t, len, offset };
  });
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f3f8" strokeWidth={sw} />
      {segs.map((s) => (
        <circle key={s.label}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={sw - 2}
          strokeDasharray={`${s.len.toFixed(2)} ${(circ - s.len).toFixed(2)}`}
          strokeDashoffset={s.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="19" fontWeight="700"
        fill="#1a2e05" fontFamily="system-ui,sans-serif">2.5k</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="8.5" fill="#9aa3be"
        fontFamily="system-ui,sans-serif" letterSpacing="0.8">AD PLATES</text>
    </svg>
  );
}

/* ── SVG Bar chart ── */
function BarChart() {
  const max = Math.max(...MONTHLY.map(d => d.value));
  const ceiling = Math.ceil((max * 1.22) / 500) * 500;
  const svgH = 176, padT = 28, padB = 30;
  const chartH = svgH - padT - padB;
  const svgW = 560, padLR = 8;
  const slotW = (svgW - padLR * 2) / MONTHLY.length;
  const barW = slotW * 0.50;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: svgH }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#81B71A" stopOpacity="1"    />
          <stop offset="100%" stopColor="#81B71A" stopOpacity="0.32" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => {
        const y = padT + chartH * (1 - g);
        return (
          <line key={i}
            x1={padLR} y1={y} x2={svgW - padLR} y2={y}
            stroke={g === 0 ? "#e8edf5" : "#f0f3f8"}
            strokeWidth={1}
            strokeDasharray={g > 0 ? "5 6" : undefined}
          />
        );
      })}
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((g, i) => (
        <text key={i}
          x={padLR + 2}
          y={padT + chartH * (1 - g) - 4}
          fontSize="9" fill="#c3ccd8"
          fontFamily="system-ui,sans-serif">
          {g === 0 ? "0" : `${Math.round(ceiling * g / 1000)}k`}
        </text>
      ))}
      {/* Bars */}
      {MONTHLY.map((d, i) => {
        const barH = (d.value / ceiling) * chartH;
        const x = padLR + slotW * i + (slotW - barW) / 2;
        const y = padT + chartH - barH;
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={barH} rx="5" ry="5" fill="url(#barGrad)" />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle"
              fontSize="10" fill="#6b7a99" fontFamily="system-ui,sans-serif" fontWeight="600">
              {(d.value / 1000).toFixed(1)}k
            </text>
            <text x={x + barW / 2} y={padT + chartH + 20} textAnchor="middle"
              fontSize="11" fill="#9aa3be" fontFamily="system-ui,sans-serif">
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Page ── */
const TRACKING_DB = [
  { id: "AD 0891-26", chassis: "JTEBU5JR8P209871",  category: "Private",    owners: "Kwame Asante & Akua Asante",         step: 5, date: "18 May 2026", details: "Embossing & tagging complete. Ready for physical pickup at the Adenta Branch office, Frafraha." },
  { id: "AD 1242-26", chassis: "KMHDK41D7NU381920", category: "Commercial", owners: "Abena Mensah & Kofi Mensah",          step: 3, date: "18 May 2026", details: "Chassis sequence verified and approved. Moving into the Adenta embossing queue." },
  { id: "AD 0928-26", chassis: "JN1BYSY61U391823",  category: "Government", owners: "Ministry of Local Government",        step: 4, date: "18 May 2026", details: "Embossing complete. Smart chip paired with govt. fleet profile. Awaiting final sign-off." },
  { id: "AD 0819-26", chassis: "CAT0320CCPH291823", category: "Commercial", owners: "Ebenezer Lartey & Victoria Lartey",  step: 2, date: "15 May 2026", details: "Requisition logged and owner details mapped. Pending payment and document confirmation." }
];

const STEPS = [
  { step: 1, label: "Blanks Loaded", sub: "Inventory Allocated" },
  { step: 2, label: "Requisition Booked", sub: "Owner & VIN Mapped" },
  { step: 3, label: "Verified & Approved", sub: "Approved by Supervisor" },
  { step: 4, label: "Embossed & Tagged", sub: "Smart-Chip Paired" },
  { step: 5, label: "Ready for Pickup", sub: "Awaiting Collection" }
];

export default function DashboardPage() {
  const [trackQuery, setTrackQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(TRACKING_DB[0]);

  // Filter based on input match
  const matchedTracks = TRACKING_DB.filter(t => 
    t.id.toLowerCase().includes(trackQuery.toLowerCase()) ||
    t.chassis.toLowerCase().includes(trackQuery.toLowerCase())
  );
  return (
    <div className="space-y-5 pb-8">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(115deg, #0d1a03 0%, #1a2e05 18%, #2d5009 48%, #4a7c10 74%, #81B71A 100%)" }}>

        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.065 }} preserveAspectRatio="none">
          <defs>
            <pattern id="herogrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#herogrid)" />
        </svg>

        {/* Decorative rings */}
        <div className="absolute pointer-events-none"
          style={{ right: -90, top: "50%", transform: "translateY(-50%)", width: 330, height: 330, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.07)" }} />
        <div className="absolute pointer-events-none"
          style={{ right: 24, top: "50%", transform: "translateY(-50%)", width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />

        <div className="relative px-6 py-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
                  {TODAY}
                </p>
              </div>
              <h2 className="font-extrabold tracking-tight" style={{ color: "white", fontSize: "1.55rem", lineHeight: 1.2 }}>
                Welcome back, Administrator
              </h2>
              <p style={{ color: "rgba(255,255,255,0.58)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
                Adenta Branch — AD plates overview for today.
              </p>
              {/* Mini stat pills */}
              <div className="flex flex-wrap gap-2.5 mt-4">
                {[
                  { label: "AD Plates Today",  val: "23"     },
                  { label: "Processing Queue", val: "142"    },
                  { label: "System Uptime",    val: "99.8%"  },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.6rem",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    backdropFilter: "blur(8px)",
                  }}>
                    <p style={{ color: "white", fontWeight: 700, fontSize: "0.875rem", lineHeight: 1 }}>{s.val}</p>
                    <p style={{ color: "rgba(255,255,255,0.48)", fontSize: "0.625rem", marginTop: "0.18rem", whiteSpace: "nowrap" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link href="/dashboard/booking" style={{
                display: "block", textAlign: "center", textDecoration: "none",
                padding: "0.6rem 1.3rem", borderRadius: "0.75rem",
                fontSize: "0.825rem", fontWeight: 700,
                background: "white", color: "#2d5009",
                boxShadow: "0 4px 18px rgba(0,0,0,0.22)", letterSpacing: "-0.01em",
              }}>
                + New Application
              </Link>
              <Link href="/dashboard/reports" style={{
                display: "block", textAlign: "center", textDecoration: "none",
                padding: "0.6rem 1.3rem", borderRadius: "0.75rem",
                fontSize: "0.825rem", fontWeight: 600,
                background: "rgba(255,255,255,0.1)", color: "white",
                border: "1px solid rgba(255,255,255,0.24)",
              }}>
                Export Report
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e8edf5] relative overflow-hidden"
            style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.055)", padding: "1.2rem 1.25rem 1rem" }}>
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
              style={{ background: s.accent }} />

            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: s.bg, color: s.accent }}>
                <s.icon />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
                style={{
                  background: s.up ? "rgba(129,183,26,0.08)" : "rgba(239,68,68,0.08)",
                  color:      s.up ? "#3d6b08" : "#991b1b",
                  borderColor:s.up ? "rgba(129,183,26,0.22)" : "rgba(239,68,68,0.22)",
                }}>
                {s.up ? "↑" : "↓"} {s.change.replace("+","").replace("−","")}
              </span>
            </div>

            <p className="font-bold tracking-tight" style={{ fontSize: "1.875rem", color: "#1a2e05", lineHeight: 1 }}>{s.value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "#6b7a99" }}>{s.label}</p>

            <div className="flex items-end justify-between mt-3 pt-3 border-t border-[#f0f3f8]">
              <p className="text-[10px]" style={{ color: "#b0bbd6" }}>{s.sub}</p>
              <Sparkline data={s.spark} color={s.accent} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} href={a.href}
            className="bg-white rounded-xl border border-[#e8edf5] flex items-center gap-3.5
              hover:shadow-md hover:border-[#d8e4f0] transition-all duration-200 group no-underline"
            style={{ padding: "1rem 1.1rem", boxShadow: "0 1px 8px rgba(0,0,0,0.042)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0
              transition-transform duration-200 group-hover:scale-110"
              style={{ background: a.bg, color: a.color }}>
              <a.icon />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1a2e05" }}>{a.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Plate Issuance Lifecycle Tracker (Up to Pickup) ── */}
      <div className="bg-white rounded-xl border border-[#e8edf5] p-5 space-y-4"
           style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.055)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f4f8] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#1a2e05] uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span> Plate Issuance Lifecycle Tracker
            </h3>
            <p className="text-xs text-[#9aa3be] mt-0.5">Track plate requisition status sequentially all the way up to customer pickup.</p>
          </div>
          
          {/* Quick search input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="Search Plate ID or Chassis VIN..."
              className="w-full pl-9 pr-4 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-xl text-xs text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-medium"
            />
            <span className="absolute left-3 top-2.5 text-xs opacity-60">🔍</span>
            
            {/* Dropdown list matches */}
            {trackQuery.trim() !== "" && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-[#f0f4f8] max-h-48 overflow-y-auto">
                {matchedTracks.length > 0 ? (
                  matchedTracks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTrack(t);
                        setTrackQuery("");
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#f8faff] transition text-xs font-semibold text-[#374167] flex items-center justify-between"
                    >
                      <span>{t.id} <span className="text-[10px] text-[#9aa3be] font-medium">({t.chassis})</span></span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">{t.category}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-[#9aa3be] font-semibold">No active plate matches found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Plate Details Info Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f8faff] p-4 rounded-xl border border-[#e8edf5]">
          <div>
            <span className="text-[9px] font-black uppercase text-[#9aa3be] tracking-wider block">PLATE ID / REQUISITION</span>
            <span className="font-mono text-sm font-black text-slate-800 tracking-wider uppercase border-[1.5px] border-slate-900 px-2 py-0.5 rounded bg-white shadow-sm inline-block mt-1">
              {selectedTrack.id}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-[#9aa3be] tracking-wider block">VEHICLE CHASSIS (VIN)</span>
            <span className="text-xs font-bold text-[#374167] block mt-1.5">{selectedTrack.chassis}</span>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-[#9aa3be] tracking-wider block">REGISTERED CO-OWNERS</span>
            <span className="text-xs font-bold text-[#1a2e05] block mt-1.5">👤 {selectedTrack.owners}</span>
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="pt-4 pb-2">
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
            {/* Step connectors */}
            <div className="absolute top-[21px] left-5 md:left-[10%] right-[10%] bottom-5 md:bottom-auto h-full md:h-1 bg-[#cbd5e1] -z-10 hidden md:block" />
            
            {STEPS.map((s, idx) => {
              const isCompleted = s.step <= selectedTrack.step;
              const isCurrent = s.step === selectedTrack.step;
              return (
                <div key={s.step} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1 relative text-left md:text-center px-2">
                  {/* Step circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition duration-300 ${
                    isCompleted 
                      ? "bg-[#81B71A] border-[#81B71A] text-white" 
                      : "bg-white border-[#cbd5e1] text-[#94a3b8]"
                  } ${isCurrent ? "ring-4 ring-[#81B71A]/20 scale-105" : ""}`}>
                    {isCompleted ? "✓" : s.step}
                  </div>
                  
                  {/* Step details */}
                  <div className="space-y-0.5">
                    <p className={`text-xs font-bold transition duration-300 ${
                      isCompleted ? "text-[#1a2e05]" : "text-[#94a3b8]"
                    }`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-[#9aa3be] font-medium leading-tight max-w-[140px] md:mx-auto">
                      {s.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Status Notification Alert */}
        <div className="p-3.5 rounded-xl border border-[#cbd5e1]/40 bg-[#fbfcfd] flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5">💡</span>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#374167]">Current Milestone Progress:</h4>
            <p className="text-xs text-[#52607a] font-medium">{selectedTrack.details}</p>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8edf5] p-5"
          style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Monthly Registrations</h3>
              <p className="text-xs mt-0.5" style={{ color: "#9aa3be" }}>Adenta Branch — Jan – Jun 2026</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#9aa3be" }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#81B71A" }} />
                Plates issued
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(129,183,26,0.09)", color: "#3d6b08" }}>
                ↑ 14.8% vs last period
              </span>
            </div>
          </div>
          <BarChart />
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-[#e8edf5] p-5"
          style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Plate Types</h3>
          <p className="text-xs mt-0.5 mb-4" style={{ color: "#9aa3be" }}>Distribution by category</p>

          <div className="flex items-center justify-center mb-4">
            <DonutChart />
          </div>

          <div className="space-y-2.5">
            {PLATE_TYPES.map((t) => (
              <div key={t.label} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: t.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: "#374167" }}>{t.label}</span>
                    <span className="text-xs font-bold" style={{ color: "#1a2e05" }}>{t.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#f0f3f8" }}>
                    <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold shrink-0 w-7 text-right" style={{ color: "#9aa3be" }}>{t.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Regional breakdown ── */}
      <div className="bg-white rounded-xl border border-[#e8edf5] p-5"
        style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Adenta Coverage Zones</h3>
            <p className="text-xs mt-0.5" style={{ color: "#9aa3be" }}>AD plates by coverage zone — 2026</p>
          </div>
          <button className="text-xs font-medium hover:underline" style={{ color: "#81B71A" }}>
            View all regions →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {REGIONS.map((r) => (
            <div key={r.name}
              className="rounded-xl p-4 border transition-all hover:shadow-md cursor-pointer"
              style={{
                background:   r.highlight ? "rgba(129,183,26,0.045)" : "#fafbfe",
                borderColor:  r.highlight ? "rgba(129,183,26,0.2)"   : "#f0f3f8",
              }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: r.highlight ? "rgba(129,183,26,0.14)" : "#f0f3f8" }}>
                <MapPinIcon color={r.highlight ? "#81B71A" : "#c3ccd8"} />
              </div>
              <p className="font-bold text-base leading-none" style={{ color: "#1a2e05" }}>
                {r.plates.toLocaleString()}
              </p>
              <p className="text-[10px] font-medium mt-1 leading-tight" style={{ color: "#6b7a99" }}>
                {r.name}
              </p>
              <div className="mt-2.5 h-1.5 rounded-full" style={{ background: "#f0f3f8" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${r.pct}%`, background: r.highlight ? "#81B71A" : "#d1d8e8" }} />
              </div>
              <p className="text-[10px] mt-1 font-semibold" style={{ color: r.highlight ? "#81B71A" : "#b0bbd6" }}>{r.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table + Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent registrations */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#e8edf5] overflow-hidden"
          style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f3f8]">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Recent Registrations</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>Latest AD plate activity — Adenta Branch</p>
            </div>
            <button className="text-xs font-semibold hover:underline" style={{ color: "#81B71A" }}>
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                  {["Plate ID", "Owner", "Region", "Type", "Status", "Date"].map((h) => (
                    <th key={h}
                      className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                      style={{ color: "#9aa3be" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT.map((r, i) => (
                  <tr key={r.id}
                    className="border-t hover:bg-[#fafbfe] transition-colors cursor-pointer"
                    style={{ borderColor: "#f0f3f8" }}>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold tracking-wide px-2 py-1 rounded-md"
                        style={{ background: "rgba(129,183,26,0.07)", color: "#2d5009" }}>
                        {r.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex -space-x-2.5 overflow-hidden mr-2.5">
                          {r.owners.map((owner, idx) => (
                            <div key={idx} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ring-2 ring-white"
                              title={`${owner.name} (${owner.role})`}
                              style={{ 
                                background: owner.role === "Primary" 
                                  ? "linear-gradient(135deg, #2d5009, #81B71A)" 
                                  : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                                zIndex: r.owners.length - idx
                              }}>
                              {owner.initials}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#374167] leading-none">
                            {r.owners[0].name}
                          </span>
                          {r.owners.length > 1 && (
                            <span className="text-[10px] text-[#81B71A] font-bold mt-1 flex items-center gap-1">
                              <span>👥</span> +{r.owners.length - 1} Co-owner
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#6b7a99" }}>{r.region}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{ background: "#f4f6fb", color: "#6b7a99" }}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                        style={STATUS_STYLE[r.status]}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#b0bbd6" }}>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden"
          style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f3f8]">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Activity Feed</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>Real-time system events</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#81B71A" }} />
              <span className="text-[10px] font-medium" style={{ color: "#81B71A" }}>Live</span>
            </div>
          </div>
          <div className="p-3 space-y-1">
            {ACTIVITY.map((a, i) => {
              const cfg = ACTIVITY_CONFIG[a.type];
              return (
                <div key={i}
                  className="flex gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-[#fafbfe] cursor-pointer">
                  <div className="relative mt-0.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: cfg.bg }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                    </div>
                    {i < ACTIVITY.length - 1 && (
                      <div className="absolute top-8 left-3 w-px h-3"
                        style={{ background: "#f0f3f8" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs leading-relaxed" style={{ color: "#374167" }}>{a.text}</p>
                    <p className="text-[10px] mt-1 font-medium" style={{ color: "#b0bbd6" }}>{a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System status footer */}
          <div className="px-5 py-3.5 border-t" style={{ borderColor: "#f0f3f8", background: "#fafbfe" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#b0bbd6" }}>System Status</p>
            <div className="flex items-center gap-2">
              {[
                { label: "API", ok: true   },
                { label: "DB",  ok: true   },
                { label: "CDN", ok: true   },
                { label: "SMS", ok: false  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.ok ? "#81B71A" : "#f59e0b" }} />
                  <span className="text-[10px] font-medium" style={{ color: s.ok ? "#6b7a99" : "#92610a" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Stat icons ── */
function PlateStatIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth={2.5} />
      <circle cx="4.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ClockStatIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
    </svg>
  );
}
function CheckStatIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function AlertStatIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

/* ── Quick action icons ── */
function PlusQAIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function SearchQAIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function RefreshQAIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,4 23,10 17,10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function DownloadQAIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/* ── Map pin icon ── */
function MapPinIcon({ color = "#81B71A" }: { color?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
