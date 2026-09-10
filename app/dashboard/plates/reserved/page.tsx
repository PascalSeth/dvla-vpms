"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredReservations, fetchReservationsFromDB, saveStoredReservations, Reservation } from "../../../../components/reservationsData";

/* ─── Mini Ghanaian License Plate Badge Component ─── */
function MiniPlateBadge({ type, platePattern, prefix, rangeStart, year }: { 
  type: "Single" | "Range"; 
  platePattern?: string; 
  prefix: string; 
  rangeStart?: number; 
  year: string; 
}) {
  const isRange = type === "Range";
  let text = "";
  if (isRange) {
    const startStr = rangeStart !== undefined ? String(rangeStart) : "";
    const prefixNum = startStr.substring(0, startStr.length - 2) || "90";
    text = `${prefix} ${prefixNum}XX-${year}`;
  } else {
    text = platePattern || `${prefix} 1111-${year}`;
  }

  const isGov = type === "Range" && (rangeStart === 9000 || rangeStart === 8500 || (rangeStart !== undefined && rangeStart >= 8000 && rangeStart <= 9500));

  return (
    <div className="relative shrink-0 w-[130px] h-[36px] rounded-md border-2 border-slate-900 shadow-xs overflow-hidden select-none flex items-stretch"
         style={{
           background: isGov 
             ? "linear-gradient(180deg, #103014 0%, #0d2810 60%, #081d0a 100%)"
             : "linear-gradient(180deg, #ffffff 0%, #f8fafc 60%, #e2e8f0 100%)",
         }}>
      {/* GH Flag Strip */}
      <div className="w-[14%] shrink-0 flex flex-col items-center justify-between py-0.5 bg-[#0c3b87] rounded-l-[1px] z-10">
        <div className="w-[85%] aspect-[3/2] flex flex-col rounded-[0.5px] overflow-hidden">
          <div className="flex-1 bg-red-600" />
          <div className="flex-1 bg-yellow-400 relative flex items-center justify-center">
            <span className="absolute text-[2.5px] text-black font-black leading-none" style={{ transform: "scale(0.8)" }}>★</span>
          </div>
          <div className="flex-1 bg-green-600" />
        </div>
        <span className="text-[5.5px] font-black text-white leading-none tracking-tighter" style={{ transform: "scale(0.9)" }}>GH</span>
      </div>
      
      {/* Plate text */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-1">
        <span className="text-[5px] font-black tracking-[0.15em] leading-none mb-0.5"
              style={{ color: isGov ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.4)" }}>
          {isRange ? "RANGE BLOCK" : "VANITY HOLD"}
        </span>
        <span className="font-mono font-black text-[9px] tracking-wider uppercase leading-none"
              style={{ 
                color: isGov ? "#ffffff" : "#0f172a",
              }}>
          {text}
        </span>
      </div>
    </div>
  );
}

export default function ReservedPlatesPage() {
  const [reservations, setReservations] = useState<Reservation[]>(() => getStoredReservations());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Range" | "Single">("All");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddRes, setShowAddRes] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ id?: string; name?: string; username?: string; role?: string; branchId?: string } | null>(null);

  useEffect(() => {
    const loadSession = () => {
      try {
        const stored = localStorage.getItem("dvla_session");
        if (stored) setSessionUser(JSON.parse(stored));
      } catch {}
    };
    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  // Form State for new reservation
  const [resType, setResType] = useState<"Single" | "Range">("Range");
  const [resPlate, setResPlate] = useState("");
  const [resRangeStart, setResRangeStart] = useState("");
  const [resRangeEnd, setResRangeEnd] = useState("");
  const [resPrefix, setResPrefix] = useState("AD");
  const [resYear, setResYear] = useState("26");
  const [resHolder, setResHolder] = useState("");
  const [resAuthRef, setResAuthRef] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReservationsFromDB();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resHolder || !resAuthRef) return;

    let newRes: Partial<Reservation>;
    const currentYear = 2026;
    const expiryDate = new Date();
    expiryDate.setFullYear(currentYear + 2);
    const expiryStr = expiryDate.toISOString().split("T")[0];

    if (resType === "Single") {
      newRes = {
        type: "Single",
        platePattern: resPlate || `${resPrefix} 1111-${resYear}`,
        prefix: resPrefix,
        year: resYear,
        holder: resHolder,
        authRef: resAuthRef,
        expiryDate: expiryStr,
        status: "Active",
        claimedCount: 0,
        totalCount: 1,
      };
    } else {
      const start = parseInt(resRangeStart, 10) || 0;
      const end = parseInt(resRangeEnd, 10) || 99;
      newRes = {
        type: "Range",
        rangeStart: start,
        rangeEnd: end,
        prefix: resPrefix,
        year: resYear,
        holder: resHolder,
        authRef: resAuthRef,
        expiryDate: expiryStr,
        status: "Active",
        claimedCount: 0,
        totalCount: Math.max(1, end - start + 1),
      };
    }

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRes,
          createdById: sessionUser?.id || undefined,
          userId: sessionUser?.id || undefined,
          adminUser: sessionUser?.name || sessionUser?.username || "Officer",
          branchId: sessionUser?.branchId || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        const updated = [created, ...reservations];
        setReservations(updated);
        saveStoredReservations(updated);
        triggerToast(`🛡️ Block reservation for ${resHolder} recorded in database!`);
      } else {
        throw new Error("Failed to save to DB");
      }
    } catch (err) {
      const fallback: Reservation = {
        ...(newRes as Reservation),
        id: `res-${Date.now()}`,
      };
      const updated = [fallback, ...reservations];
      setReservations(updated);
      saveStoredReservations(updated);
      triggerToast(`🛡️ Block reservation saved locally for ${resHolder}`);
    }

    setResPlate("");
    setResRangeStart("");
    setResRangeEnd("");
    setResHolder("");
    setResAuthRef("");
    setShowAddRes(false);
  };

  const totalReserved = reservations.reduce((acc, r) => acc + r.totalCount, 0);
  const claimed = reservations.reduce((acc, r) => acc + r.claimedCount, 0);
  const available = totalReserved - claimed;
  const overallUtilization = totalReserved > 0 ? ((claimed / totalReserved) * 100).toFixed(1) : "0";

  const filteredReservations = reservations.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      r.holder.toLowerCase().includes(q) ||
      r.authRef.toLowerCase().includes(q) ||
      r.prefix.toLowerCase().includes(q) ||
      (r.platePattern && r.platePattern.toLowerCase().includes(q));

    const matchesType = filterType === "All" || r.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-[#81B71A] animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Top Command Header ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Quota &amp; Fleet Management
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live DB Allocations
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Reserved Plate Allocations &amp; Quota Tracking
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Monitor reserved plate series quotas, institutional holds for state security, diplomatic missions, and corporate vanity allocations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer disabled:opacity-60"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLoading ? "animate-spin" : ""}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
              <span>{isLoading ? "Refreshing..." : "Refresh Quotas"}</span>
            </button>
            <button
              onClick={() => setShowAddRes(true)}
              className="px-3.5 py-2 rounded-lg bg-[#81B71A] hover:bg-[#72a316] active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>+</span>
              <span>New Reservation Block</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Executive KPI Metric Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {[
          {
            label: "Total Reserved Allocation",
            value: totalReserved.toLocaleString(),
            sub: `${reservations.length} active institutional series`,
            dot: "bg-blue-500",
            badge: "Reserved Pool",
            badgeBg: "bg-blue-50 text-blue-700 border-blue-200/60"
          },
          {
            label: "Claimed / Issued Plates",
            value: claimed.toLocaleString(),
            sub: `${overallUtilization}% overall block utilization`,
            dot: "bg-amber-500",
            badge: "Claimed",
            badgeBg: "bg-amber-50 text-amber-800 border-amber-200/60"
          },
          {
            label: "Available Quota Capacity",
            value: available.toLocaleString(),
            sub: "Ready for issuance on booking",
            dot: "bg-emerald-500",
            badge: "Available",
            badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
                <span className="text-[11px] font-semibold text-slate-500">{stat.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stat.badgeBg}`}>
                {stat.badge}
              </span>
            </div>
            <p className="font-mono text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Filter by holder, ref, or plate pattern..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Type:</span>
            {(["All", "Range", "Single"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  filterType === t
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t === "All" ? "All Formats" : t === "Range" ? "Range Blocks" : "Single Vanity"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reservations Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReservations.length > 0 ? (
          filteredReservations.map((res) => {
            const utilization = res.totalCount > 0 ? (res.claimedCount / res.totalCount) * 100 : 0;
            const resAvailable = Math.max(0, res.totalCount - res.claimedCount);

            return (
              <div key={res.id} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <MiniPlateBadge
                    type={res.type}
                    platePattern={res.platePattern}
                    prefix={res.prefix}
                    rangeStart={res.rangeStart}
                    year={res.year}
                  />
                  <div className="text-right">
                    <span className="font-mono text-base font-extrabold text-slate-900 block leading-tight">
                      {resAvailable}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Available</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{res.holder}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-500">Ref: {res.authRef}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-medium text-slate-400">Prefix {res.prefix}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Slot Utilization</span>
                    <span className="font-mono font-bold text-slate-900">
                      {res.claimedCount} / {res.totalCount} ({utilization.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, utilization)}%`,
                        background: utilization > 80 ? "#ef4444" : utilization > 50 ? "#f59e0b" : "#81B71A",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                    <span>Valid until: {res.expiryDate}</span>
                    <span className="text-emerald-700 font-semibold">{res.status}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white rounded-xl border border-slate-200/80 p-12 text-center text-xs text-slate-400 font-medium">
            No reserved plate allocations match your search criteria.
          </div>
        )}
      </div>

      {/* ── Status Threshold Legend ── */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilization Scale:</span>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#81B71A]" />
              <span>Optimal (0-50%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span>Elevated (50-80%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span>Depleted (80%+)</span>
            </div>
          </div>
        </div>

        <Link 
          href="/dashboard/plates" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
        >
          <span>← Back to Plate Directory</span>
        </Link>
      </div>

      {/* ── Modal Dialog for New Reservation ── */}
      {showAddRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Issue New Block Hold</h3>
                <p className="text-[11px] text-slate-500">Lock plate quota for organization or government agency</p>
              </div>
              <button 
                onClick={() => setShowAddRes(false)} 
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Hold Type</label>
                <select 
                  value={resType} 
                  onChange={(e) => setResType(e.target.value as any)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="Range">Range Block (e.g. AD 9000-9099)</option>
                  <option value="Single">Single Vanity (e.g. AD 1111-26)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Organization Holder</label>
                <input 
                  required 
                  value={resHolder} 
                  onChange={e => setResHolder(e.target.value)} 
                  placeholder="e.g. Ministry of Foreign Affairs" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Authorization Reference</label>
                <input 
                  required 
                  value={resAuthRef} 
                  onChange={e => setResAuthRef(e.target.value)} 
                  placeholder="e.g. DVLA-MFA-2026-004" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10" 
                />
              </div>

              {resType === "Range" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Range Start</label>
                    <input 
                      required 
                      type="number" 
                      value={resRangeStart} 
                      onChange={e => setResRangeStart(e.target.value)} 
                      placeholder="9000" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Range End</label>
                    <input 
                      required 
                      type="number" 
                      value={resRangeEnd} 
                      onChange={e => setResRangeEnd(e.target.value)} 
                      placeholder="9099" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10" 
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Plate Pattern</label>
                  <input 
                    required 
                    value={resPlate} 
                    onChange={e => setResPlate(e.target.value)} 
                    placeholder="e.g. AD 1111-26" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10" 
                  />
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  Lock &amp; Save Block Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
