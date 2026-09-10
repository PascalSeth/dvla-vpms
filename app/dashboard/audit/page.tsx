"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  performerRole?: string;
  branchName: string;
  branchCode: string;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  SYSTEM_INITIALIZED:        { label: "System Initialized",            color: "#059669", bg: "rgba(5,150,105,0.08)",   border: "rgba(5,150,105,0.2)",   icon: "🚀" },
  BOOKING_CREATED:           { label: "Booking Created",               color: "#2563eb", bg: "rgba(37,99,235,0.08)",   border: "rgba(37,99,235,0.2)",   icon: "📝" },
  BOOKING_APPROVED:          { label: "Booking Approved",              color: "#16a34a", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.2)",   icon: "✓" },
  BOOKING_REJECTED:          { label: "Booking Rejected",              color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)",   icon: "✕" },
  BOOKING_PICKED:            { label: "Plate Issued",                  color: "#0891b2", bg: "rgba(8,145,178,0.08)",   border: "rgba(8,145,178,0.2)",   icon: "📦" },
  PLATE_COLLECTION_RECORDED: { label: "Customer Collection Recorded", color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.2)",   icon: "📥" },
  PLATE_PICKED:              { label: "Plate Handover Approved",      color: "#0891b2", bg: "rgba(8,145,178,0.08)",   border: "rgba(8,145,178,0.2)",   icon: "🤝" },
  PICKUP_DELETED:            { label: "Collection Record Deleted",     color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)",   icon: "🗑️" },
  RESERVATION_CREATED:       { label: "Plate Block Reserved",          color: "#4f46e5", bg: "rgba(79,70,229,0.08)",   border: "rgba(79,70,229,0.2)",   icon: "🛡️" },
  RESERVATION_LOCKED:        { label: "Block Reserved",                color: "#4f46e5", bg: "rgba(79,70,229,0.08)",   border: "rgba(79,70,229,0.2)",   icon: "🛡️" },
  RESERVATION_CANCELLED:     { label: "Reservation Cancelled",        color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   icon: "🚫" },
  USER_LOGIN:                { label: "Officer Login",                 color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)",  icon: "🔐" },
  USER_CREATED:              { label: "User Account Created",          color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  icon: "👤" },
  SERVICE_TYPE_CREATED:      { label: "Service Type Created",          color: "#9333ea", bg: "rgba(147,51,234,0.08)",  border: "rgba(147,51,234,0.2)",  icon: "⚙️" },
  PLATE_REGISTERED:          { label: "Record Filed",                  color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  icon: "📋" },
  PLATE_SUSPENDED:           { label: "Record Suspended",              color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  icon: "⚠️" },
  PLATE_TRANSFERRED:         { label: "Ownership Transfer",            color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)",   icon: "🔄" },
  SYSTEM_AUDIT:              { label: "System Audit",                  color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", icon: "🖥️" },
};

function getActionMeta(action: string) {
  return (
    ACTION_META[action] || {
      label: action.replace(/_/g, " "),
      color: "#64748b",
      bg: "rgba(100,116,139,0.08)",
      border: "rgba(100,116,139,0.2)",
      icon: "📋",
    }
  );
}

function formatTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return { date, time };
  } catch {
    return { date: "—", time: "—" };
  }
}

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "Recently";
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [userRole, setUserRole] = useState("SUPERADMIN");

  useEffect(() => {
    const loadSession = () => {
      try {
        const storedSession = localStorage.getItem("dvla_session");
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          setUserRole(parsed.role?.toUpperCase() || "SUPERADMIN");
        }
      } catch (e) {}
    };

    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  const fetchLogs = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: AuditEntry[] = data.map((d: any) => {
            // Safely extract performer name & role (handles object, string, or null)
            let performer = "System";
            let role = "";
            if (d.performedBy) {
              if (typeof d.performedBy === "object") {
                performer = d.performedBy.name || d.performedBy.username || "System";
                role = d.performedBy.role || "";
              } else if (typeof d.performedBy === "string") {
                performer = d.performedBy;
              }
            }

            // Safely parse JSON details
            let displayDetails = d.details || "";
            if (typeof d.details === "string" && d.details.trim().startsWith("{")) {
              try {
                const parsed = JSON.parse(d.details);
                if (parsed && typeof parsed === "object") {
                  displayDetails = parsed.message || parsed.description || parsed.note || d.details;
                  if (performer === "System" && parsed.adminUser) {
                    performer = parsed.adminUser;
                  }
                  if (!role && parsed.role) {
                    role = parsed.role;
                  }
                }
              } catch {}
            }

            const branchName = d.branch?.name || d.organization?.name || "DVLA Station";
            const branchCode = d.branch?.code || d.organization?.code || "";

            return {
              id: d.id,
              action: d.action || "SYSTEM_AUDIT",
              details: displayDetails,
              performedBy: performer,
              performerRole: role || undefined,
              branchName,
              branchCode,
              ipAddress: d.ipAddress || null,
              createdAt: d.createdAt,
            };
          });
          setLogs(mapped);
        } else {
          setLogs([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      if (showLoadingState) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
    // Auto-refresh every 12 seconds
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "All" || log.action === filterAction;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesAction;

    const matchesSearch =
      (log.details || "").toLowerCase().includes(query) ||
      (log.performedBy || "").toLowerCase().includes(query) ||
      (log.performerRole || "").toLowerCase().includes(query) ||
      (log.action || "").toLowerCase().includes(query) ||
      (log.branchName || "").toLowerCase().includes(query) ||
      (log.branchCode || "").toLowerCase().includes(query);

    return matchesAction && matchesSearch;
  });

  // Stats counters
  const actionCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  if (userRole === "DATA_ENTRY") {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 my-8 shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          🛡️
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          System Audit &amp; Security Compliance Logs are restricted to <strong>SuperAdmin</strong> and <strong>Supervisor</strong> roles. Your account (Data Entry) does not have permission to view audit history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto p-6">
      {/* Top Command Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Security &amp; Governance
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Audit Stream
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">DVLA Station · Automated Tracing</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Audit Trail &amp; Compliance Ledger
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl font-normal">
            Automated, immutable audit trail identifying <strong>WHO</strong> did <strong>WHAT</strong> at <strong>WHAT TIME</strong> across Bookings, Customer Collections, Plate Issuance, and Reservations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLogs(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLoading ? "animate-spin" : ""}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
            </svg>
            <span>{isLoading ? "Syncing..." : "Refresh Ledger"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Events", val: logs.length, dot: "bg-indigo-500", tag: "All Logged", tagBg: "bg-indigo-50 text-indigo-700 border-indigo-100" },
          { label: "Operations & Registrations", val: (actionCounts["BOOKING_CREATED"] || 0) + (actionCounts["PLATE_REGISTERED"] || 0) + (actionCounts["PLATE_COLLECTION_RECORDED"] || 0) + (actionCounts["RESERVATION_CREATED"] || 0) + (actionCounts["RESERVATION_LOCKED"] || 0), dot: "bg-emerald-500", tag: "Active Ops", tagBg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "Approvals & Releases", val: (actionCounts["BOOKING_APPROVED"] || 0) + (actionCounts["PLATE_PICKED"] || 0) + (actionCounts["BOOKING_PICKED"] || 0), dot: "bg-blue-500", tag: "Sign-offs", tagBg: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Compliance & Authentication", val: (actionCounts["SYSTEM_AUDIT"] || 0) + (actionCounts["SYSTEM_INITIALIZED"] || 0) + (actionCounts["USER_LOGIN"] || 0) + (actionCounts["USER_CREATED"] || 0), dot: "bg-slate-500", tag: "Compliance", tagBg: "bg-slate-50 text-slate-700 border-slate-200" },
        ].map((m) => (
          <div key={m.label} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{m.label}</span>
              <span className={`w-2 h-2 rounded-full ${m.dot}`} />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-slate-900">{m.val}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${m.tagBg}`}>
                {m.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Search &amp; Filter Events</h3>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
            {(["timeline", "table"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {mode === "timeline" ? "⏱ Timeline View" : "📋 Table View"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search details, officer name, plate number, role, or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal transition"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-medium cursor-pointer"
          >
            <option value="All">All Action Types</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{getActionMeta(a).label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-emerald-500/20 border-t-emerald-600 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Loading audit ledger...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <p className="text-3xl mb-2">📜</p>
          <p className="text-sm font-bold text-slate-800">No audit events found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || filterAction !== "All"
              ? "No events match your current filter parameters. Try adjusting your search query."
              : "Audit events will automatically appear here as system actions are executed."}
          </p>
        </div>
      ) : viewMode === "timeline" ? (
        /* ─── Timeline View ─── */
        <div className="space-y-0 relative">
          {/* Vertical Spine */}
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-slate-200 hidden md:block" />

          {filteredLogs.map((log, idx) => {
            const meta = getActionMeta(log.action);
            const ts = formatTimestamp(log.createdAt);
            const performerInitial = (log.performedBy || "S").charAt(0).toUpperCase();

            return (
              <div key={log.id} className="relative flex gap-4 md:gap-6 group" style={{ paddingBottom: idx < filteredLogs.length - 1 ? "1.25rem" : "0" }}>
                {/* Timeline Node */}
                <div className="hidden md:flex flex-col items-center z-10 shrink-0" style={{ width: "3rem" }}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-2xs border transition-transform group-hover:scale-105"
                    style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="md:hidden text-base">{meta.icon}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                        style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                      >
                        {meta.label}
                      </span>
                      {(log.branchCode || log.branchName) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.branchCode || log.branchName}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-700">{ts.date}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ts.time}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 font-normal leading-relaxed">{log.details}</p>

                  <div className="flex flex-wrap items-center gap-4 pt-2.5 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {performerInitial}
                      </div>
                      <span className="font-semibold text-slate-800">{log.performedBy}</span>
                      {log.performerRole && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tight">
                          {log.performerRole.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {log.ipAddress && (
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                        IP: {log.ipAddress}
                      </span>
                    )}

                    <span className="text-slate-400 ml-auto text-[11px]">{timeAgo(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Table View ─── */
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  {["Timestamp", "Action", "Details", "Performed By", "Station / Branch", "IP Address"].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const meta = getActionMeta(log.action);
                  const ts = formatTimestamp(log.createdAt);
                  const performerInitial = (log.performedBy || "S").charAt(0).toUpperCase();

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-800">{ts.date}</p>
                          <p className="text-[10px] font-mono text-slate-400">{ts.time}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1"
                          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                        >
                          <span>{meta.icon}</span> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-700 truncate">{log.details}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {performerInitial}
                          </div>
                          <span className="font-semibold text-slate-800">{log.performedBy}</span>
                          {log.performerRole && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tight">
                              {log.performerRole.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.branchName ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {log.branchName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-slate-500 text-[11px]">{log.ipAddress || "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
