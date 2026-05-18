/* ─── Data ─── */

const TODAY = "Monday, 18 May 2026";

const STATS = [
  {
    label: "Total Plates Issued",
    value: "24,839",
    change: "+3.2%",
    up: true,
    icon: PlateStatIcon,
    accent: "#81B71A",
    bg: "rgba(129,183,26,0.09)",
    sub: "All regions combined",
    spark: [1820, 2340, 1990, 2760, 3120, 2580, 3240],
  },
  {
    label: "Pending Applications",
    value: "1,042",
    change: "+12.5%",
    up: true,
    icon: ClockStatIcon,
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.09)",
    sub: "Awaiting review",
    spark: [820, 940, 790, 1060, 920, 1080, 1042],
  },
  {
    label: "Approved Today",
    value: "186",
    change: "+8.1%",
    up: true,
    icon: CheckStatIcon,
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.09)",
    sub: "Across all offices",
    spark: [140, 165, 130, 180, 155, 172, 186],
  },
  {
    label: "Expired / Flagged",
    value: "317",
    change: "−4.3%",
    up: false,
    icon: AlertStatIcon,
    accent: "#ef4444",
    bg: "rgba(239,68,68,0.09)",
    sub: "Requires action",
    spark: [380, 355, 340, 360, 330, 320, 317],
  },
];

const MONTHLY = [
  { month: "Jan", value: 1820 },
  { month: "Feb", value: 2340 },
  { month: "Mar", value: 1990 },
  { month: "Apr", value: 2760 },
  { month: "May", value: 3120 },
  { month: "Jun", value: 2580 },
];

const PLATE_TYPES = [
  { label: "Private",    count: 13240, pct: 53, color: "#81B71A" },
  { label: "Commercial", count:  6820, pct: 27, color: "#3b82f6" },
  { label: "Government", count:  2569, pct: 10, color: "#f59e0b" },
  { label: "Equipment",  count:  2210, pct: 10, color: "#8b5cf6" },
];

const REGIONS = [
  { name: "Greater Accra", plates: 8420, pct: 34, highlight: true  },
  { name: "Ashanti",       plates: 5890, pct: 24, highlight: true  },
  { name: "Western",       plates: 3210, pct: 13, highlight: false },
  { name: "Eastern",       plates: 2840, pct: 11, highlight: false },
  { name: "Northern",      plates: 2360, pct:  9, highlight: false },
  { name: "Others",        plates: 2119, pct:  9, highlight: false },
];

const QUICK_ACTIONS = [
  { label: "New Application", sub: "Register a new plate",   color: "#81B71A", bg: "rgba(129,183,26,0.09)", icon: PlusQAIcon    },
  { label: "Search Registry",  sub: "Find by plate or owner", color: "#3b82f6", bg: "rgba(59,130,246,0.09)", icon: SearchQAIcon  },
  { label: "Batch Renewal",    sub: "Process bulk renewals",  color: "#f59e0b", bg: "rgba(245,158,11,0.09)", icon: RefreshQAIcon },
  { label: "Export Report",    sub: "Download CSV or PDF",    color: "#8b5cf6", bg: "rgba(139,92,246,0.09)", icon: DownloadQAIcon},
];

const RECENT = [
  { id: "GR 8812-24", owner: "Kwame Asante",  initials: "KA", region: "Greater Accra", type: "Private",    status: "Approved", date: "18 May 2026" },
  { id: "AS 3982-25", owner: "Abena Mensah",  initials: "AM", region: "Ashanti",       type: "Commercial", status: "Pending",  date: "18 May 2026" },
  { id: "WR 8729-24", owner: "Yaw Boateng",   initials: "YB", region: "Western",       type: "Private",    status: "Approved", date: "17 May 2026" },
  { id: "GV 928-26",  owner: "Ama Owusu",     initials: "AO", region: "Eastern",       type: "Government", status: "Approved", date: "17 May 2026" },
  { id: "NR 4819-26", owner: "Kojo Darko",    initials: "KD", region: "Northern",      type: "Commercial", status: "Rejected", date: "16 May 2026" },
  { id: "VR 201-26",  owner: "Efua Adjei",    initials: "EA", region: "Volta",         type: "Private",    status: "Pending",  date: "16 May 2026" },
  { id: "CR 9921-25", owner: "Fiifi Antwi",   initials: "FA", region: "Central",       type: "Equipment",  status: "Approved", date: "15 May 2026" },
];

const ACTIVITY = [
  { type: "approved" as const, text: "Plate GR 8812-24 approved for Kwame Asante",    time: "2 min ago"  },
  { type: "pending"  as const, text: "New application submitted — Abena Mensah",       time: "14 min ago" },
  { type: "rejected" as const, text: "Plate NR 4819-26 rejected — document mismatch", time: "1 hr ago"   },
  { type: "batch"    as const, text: "Batch renewal processed — 42 plates, Ashanti",  time: "3 hr ago"   },
  { type: "system"   as const, text: "System backup completed successfully",            time: "6 hr ago"   },
  { type: "pending"  as const, text: "Expiry notice sent to 78 plate owners",           time: "Yesterday"  },
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
        fill="#1a2e05" fontFamily="system-ui,sans-serif">24.8k</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="8.5" fill="#9aa3be"
        fontFamily="system-ui,sans-serif" letterSpacing="0.8">TOTAL PLATES</text>
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
export default function DashboardPage() {
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
                Here&apos;s an overview of DVLA Vehicle Plate Management today.
              </p>
              {/* Mini stat pills */}
              <div className="flex flex-wrap gap-2.5 mt-4">
                {[
                  { label: "Registrations Today", val: "186"    },
                  { label: "Processing Queue",     val: "1,042"  },
                  { label: "System Uptime",        val: "99.8%"  },
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
              <button style={{
                padding: "0.6rem 1.3rem", borderRadius: "0.75rem",
                fontSize: "0.825rem", fontWeight: 700,
                background: "white", color: "#2d5009", border: "none", cursor: "pointer",
                boxShadow: "0 4px 18px rgba(0,0,0,0.22)", letterSpacing: "-0.01em",
              }}>
                + New Application
              </button>
              <button style={{
                padding: "0.6rem 1.3rem", borderRadius: "0.75rem",
                fontSize: "0.825rem", fontWeight: 600,
                background: "rgba(255,255,255,0.1)", color: "white",
                border: "1px solid rgba(255,255,255,0.24)", cursor: "pointer",
              }}>
                Export Report
              </button>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.label}
            className="bg-white rounded-xl border border-[#e8edf5] flex items-center gap-3.5 text-left
              hover:shadow-md hover:border-[#d8e4f0] transition-all duration-200 group"
            style={{ padding: "1rem 1.1rem", boxShadow: "0 1px 8px rgba(0,0,0,0.042)", cursor: "pointer" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0
              transition-transform duration-200 group-hover:scale-110"
              style={{ background: a.bg, color: a.color }}>
              <a.icon />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1a2e05" }}>{a.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>{a.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8edf5] p-5"
          style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Monthly Registrations</h3>
              <p className="text-xs mt-0.5" style={{ color: "#9aa3be" }}>Jan – Jun 2026</p>
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
            <h3 className="font-semibold text-sm" style={{ color: "#1a2e05" }}>Regional Distribution</h3>
            <p className="text-xs mt-0.5" style={{ color: "#9aa3be" }}>Plates issued by region, 2026</p>
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
              <p className="text-[11px] mt-0.5" style={{ color: "#9aa3be" }}>Latest plate activity across all regions</p>
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
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, #2d5009, #81B71A)" }}>
                          {r.initials}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "#374167" }}>{r.owner}</span>
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
