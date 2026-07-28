"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  ipAddress: string | null;
  organizationId: string | null;
  organization?: { name: string; code: string } | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  PLATE_REGISTERED:    { label: "Record Filed",         color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  icon: "📋" },
  RESERVATION_LOCKED:  { label: "Block Reserved",       color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)",  icon: "🛡️" },
  USER_LOGIN:          { label: "User Login",           color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)",  icon: "🔐" },
  PLATE_SUSPENDED:     { label: "Record Suspended",     color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  icon: "⚠️" },
  PLATE_TRANSFERRED:   { label: "Ownership Transfer",   color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)",   icon: "🔄" },
  SYSTEM_AUDIT:        { label: "System Audit",         color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", icon: "🖥️" },
};

function getActionMeta(action: string) {
  return ACTION_META[action] || { label: action, color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", icon: "📋" };
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { date, time };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "All" || log.action === filterAction;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      log.details.toLowerCase().includes(query) ||
      log.performedBy.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      (log.organization?.name || "").toLowerCase().includes(query);
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
          System Audit & Security Compliance Logs are restricted to <strong>SuperAdmin</strong> and <strong>Supervisor</strong> roles. Your account (Data Entry) does not have permission to view audit history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #0c0a1a 0%, #1e1b4b 35%, #312e81 70%, #6366f1 100%)" }}>
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="auditgrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auditgrid)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/20 backdrop-blur-md">
                DVLA HQ · Compliance
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Audit Stream
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Audit Trail &amp; Compliance Log
            </h1>
            <p className="text-white/70 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
              Immutable, timestamped record of all plate registrations, block hold reservations, user logins, and administrative actions across all organizations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLoading ? "animate-spin" : ""}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
              <span>{isLoading ? "Syncing..." : "Refresh Logs"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events", val: logs.length, accent: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: "📊" },
          { label: "Filed Records", val: (actionCounts["PLATE_REGISTERED"] || 0) + (actionCounts["PLATE_SUSPENDED"] || 0) + (actionCounts["PLATE_TRANSFERRED"] || 0), accent: "#10b981", bg: "rgba(16,185,129,0.08)", icon: "📋" },
          { label: "Block Reservations", val: actionCounts["RESERVATION_LOCKED"] || 0, accent: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: "🛡️" },
          { label: "System Audits", val: actionCounts["SYSTEM_AUDIT"] || 0, accent: "#64748b", bg: "rgba(100,116,139,0.08)", icon: "🖥️" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-[#e8edf5] relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.04)", padding: "1.2rem 1.25rem 1rem" }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: m.accent }} />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base" style={{ background: m.bg }}>
                {m.icon}
              </div>
            </div>
            <p className="font-extrabold tracking-tight text-[#1a2e05] text-2xl md:text-3xl leading-none">{m.val}</p>
            <p className="text-xs font-bold mt-1.5 text-[#6b7a99]">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider">Filter &amp; Search</h3>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {(["timeline", "table"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                style={{
                  background: viewMode === mode ? "#fff" : "transparent",
                  color: viewMode === mode ? "#1a2e05" : "#64748b",
                  boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {mode === "timeline" ? "⏱ Timeline" : "📋 Table"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search events, user, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium transition"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3be] pointer-events-none">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9aa3be] hover:text-black cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition font-bold"
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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-[#64748b]">Loading audit trail...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e8edf5] p-12 text-center">
          <p className="text-4xl mb-3">📜</p>
          <p className="text-sm font-bold text-[#374167]">No audit events found</p>
          <p className="text-xs text-[#9aa3be] mt-1">
            {searchQuery || filterAction !== "All"
              ? "Try adjusting your search or filter criteria."
              : "Audit events will appear here as actions are performed."}
          </p>
        </div>
      ) : viewMode === "timeline" ? (
        /* ─── Timeline View ─── */
        <div className="space-y-0 relative">
          {/* Vertical Spine */}
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-300 via-slate-200 to-slate-100 hidden md:block" />

          {filteredLogs.map((log, idx) => {
            const meta = getActionMeta(log.action);
            const ts = formatTimestamp(log.createdAt);

            return (
              <div key={log.id} className="relative flex gap-4 md:gap-6 group" style={{ paddingBottom: idx < filteredLogs.length - 1 ? "1.25rem" : "0" }}>
                {/* Timeline Node */}
                <div className="hidden md:flex flex-col items-center z-10 shrink-0" style={{ width: "3rem" }}>
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm shadow-md border-2 transition-transform group-hover:scale-110"
                    style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-xl border border-[#e8edf5] p-5 shadow-sm hover:shadow-md hover:border-indigo-200/50 transition-all group-hover:-translate-y-0.5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="md:hidden text-base">{meta.icon}</span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                        style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                      >
                        {meta.label}
                      </span>
                      {log.organization && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.organization.code}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-[#374167]">{ts.date}</p>
                      <p className="text-[10px] text-[#9aa3be] font-mono">{ts.time}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#374167] font-medium leading-relaxed">{log.details}</p>

                  <div className="flex flex-wrap items-center gap-4 pt-2.5 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-black">
                        {log.performedBy.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-[#374167]">{log.performedBy}</span>
                    </div>

                    {log.ipAddress && (
                      <span className="font-mono text-[#9aa3be] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        IP: {log.ipAddress}
                      </span>
                    )}

                    <span className="text-[#9aa3be] ml-auto font-medium">{timeAgo(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Table View ─── */
        <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0]">
                  {["Timestamp", "Action", "Details", "Performed By", "Organization", "IP Address"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-extrabold uppercase tracking-wider text-[#64748b]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3f8]">
                {filteredLogs.map((log) => {
                  const meta = getActionMeta(log.action);
                  const ts = formatTimestamp(log.createdAt);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-[#374167]">{ts.date}</p>
                          <p className="text-[10px] font-mono text-[#9aa3be]">{ts.time}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                        >
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-[#374167] font-medium truncate">{log.details}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-black">
                            {log.performedBy.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-[#374167]">{log.performedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.organization ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {log.organization.name}
                          </span>
                        ) : (
                          <span className="text-[#9aa3be]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-[#9aa3be]">{log.ipAddress || "—"}</span>
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
