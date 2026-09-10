"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { DigitalPlate, PlateCategory } from "@/components/DigitalPlate";
import { getStoredReservations, saveStoredReservations, Reservation } from "../../../components/reservationsData";

/* ─── Interfaces ─── */
interface PlateOwner {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface PlateItem {
  id: string;
  owners: PlateOwner[];
  vehicle: string;
  zone: string;
  category: "Private" | "Commercial" | "Government" | "Agricultural" | string;
  status: "Active" | "Suspended" | "Expired" | string;
  date: string;
  chassis: string;
}

const INITIAL_PLATES_DATA: PlateItem[] = [];

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
    <div className="relative shrink-0 w-[136px] h-[38px] rounded-md border-2 border-slate-900 shadow-md overflow-hidden select-none flex items-stretch"
         style={{
           background: isGov 
             ? "linear-gradient(180deg, #2f9e44 0%, #2b8a3e 60%, #1e702e 100%)"
             : "linear-gradient(180deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)",
           boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
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
      
      <div className="absolute inset-[1px] rounded-[3px] border border-slate-950/10 pointer-events-none z-30" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-white/30 z-20" />

      {/* Plate text */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-1">
        <span className="text-[5px] font-black tracking-[0.15em] leading-none mb-0.5"
              style={{ color: isGov ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.35)" }}>
          {isRange ? "BLOCK" : "VANITY"}
        </span>
        <span className="font-mono font-black text-[9.5px] tracking-wider uppercase leading-none"
              style={{ 
                fontFamily: "'Courier New', Courier, monospace",
                color: isGov ? "#ffffff" : "#0f172a",
                textShadow: isGov 
                  ? "1px 1px 1px rgba(0,0,0,0.4)" 
                  : "0.8px 0.8px 0px rgba(255,255,255,0.9), -0.5px -0.5px 0px rgba(0,0,0,0.2)"
              }}>
          {text}
        </span>
      </div>
    </div>
  );
}

export default function PlatesSearchPage() {
  const [activeTab, setActiveTab] = useState<"registry" | "reservations">("registry");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [platesList, setPlatesList] = useState<PlateItem[]>([]);
  const [activePlate, setActivePlate] = useState<PlateItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Reservation Form Modal state
  const [showAddRes, setShowAddRes] = useState(false);
  const [resType, setResType] = useState<"Single" | "Range">("Range");
  const [resPlate, setResPlate] = useState("");
  const [resRangeStart, setResRangeStart] = useState("");
  const [resRangeEnd, setResRangeEnd] = useState("");
  const [resPrefix, setResPrefix] = useState("AD");
  const [resYear, setResYear] = useState("26");
  const [resHolder, setResHolder] = useState("");
  const [resAuthRef, setResAuthRef] = useState("");
  const [resDuration, setResDuration] = useState("2 Years");

  const [resSearchQuery, setResSearchQuery] = useState("");
  const [selectedResType, setSelectedResType] = useState<"All" | "Range" | "Single">("All");
  const [selectedResStatus, setSelectedResStatus] = useState<"All" | "Active" | "Alert" | "Expired">("All");
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

  // Show temporary toast message
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const generateNewDVLAFormat = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    const num = String(Math.floor(1000 + Math.random() * 9000)).padStart(4, "0");
    return `${num}-AD${l1}${l2}`;
  };

  // Primary data load from database API
  const fetchAllPlatesData = async () => {
    setIsSyncing(true);
    try {
      const [vrsRes, bookingsRes, resRes] = await Promise.all([
        fetch("/api/vrs"),
        fetch("/api/bookings"),
        fetch("/api/reservations")
      ]);

      let mappedBookings: PlateItem[] = [];
      let mappedInvoices: PlateItem[] = [];

      const normalizeCategory = (cls?: string, plateId?: string): string => {
        if (cls) {
          const u = String(cls).toUpperCase();
          if (u.includes("GOV")) return "Government";
          if (u.includes("COMM")) return "Commercial";
          if (u.includes("ELEC") || u.includes("EV")) return "Electric";
          if (u.includes("MOTOR")) return "Motorcycle";
          if (u.includes("TRAIL")) return "Trailer";
        }
        if (plateId) {
          const p = String(plateId).toUpperCase();
          if (p.startsWith("GV")) return "Government";
          if (p.startsWith("EV")) return "Electric";
          if (p.startsWith("T ")) return "Trailer";
          if (p.startsWith("M ")) return "Motorcycle";
        }
        return "Private";
      };

      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        if (Array.isArray(bookings)) {
          mappedBookings = bookings.map((b: any) => {
            const name = b.owner || b.ownerName || "DVLA Client";
            const safeNameStr = String(name);
            const email = `${safeNameStr.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
            const phone = b.phone || b.vrsInvoice?.phone || "+233 24 000 0000";
            const address = b.address || b.vrsInvoice?.address || "";
            const plateId = b.plate || b.vrsInvoice?.regNo || generateNewDVLAFormat();
            const rawClass = b.classification || b.vrsInvoice?.classification;

            return {
              id: plateId,
              owners: [{ name: safeNameStr, email, phone, role: "Primary" }],
              vehicle: b.vehicle || `${b.vrsInvoice?.make || "Vehicle"} ${b.vrsInvoice?.yearModel || ""}`.trim(),
              zone: address.includes("Adentan") ? "Adentan Frafraha" : address.includes("Oyibi") ? "Oyibi" : "Madina",
              category: normalizeCategory(rawClass, plateId),
              status: b.status === "PICKED" ? "Picked Up" : b.status === "APPROVED" ? "Active" : "Pending",
              date: b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "18 May 2026",
              chassis: b.vrsInvoice?.chassisNo || b.chassisNo || "CHASSIS-N/A",
            };
          });
        }
      }

      if (vrsRes.ok) {
        const invoices = await vrsRes.json();
        if (Array.isArray(invoices)) {
          mappedInvoices = invoices.map((inv: any) => {
            const name = inv.ownerName || "DVLA Client";
            const safeNameStr = String(name);
            const email = `${safeNameStr.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
            const phone = inv.phone || "+233 24 000 0000";
            const address = inv.address || "";
            const plateId = inv.regNo || generateNewDVLAFormat();

            return {
              id: plateId,
              owners: [{ name: safeNameStr, email, phone, role: "Primary" }],
              vehicle: `${inv.make || "Vehicle"} ${inv.yearModel || ""}`.trim(),
              zone: address.includes("Adentan") ? "Adentan Frafraha" : address.includes("Oyibi") ? "Oyibi" : "Madina",
              category: normalizeCategory(inv.classification, plateId),
              status: "Active",
              date: "18 May 2026",
              chassis: inv.chassisNo || "CHASSIS-N/A",
            };
          });
        }
      }

      if (resRes.ok) {
        const dbReservations = await resRes.json();
        if (Array.isArray(dbReservations) && dbReservations.length > 0) {
          setReservations(dbReservations);
          saveStoredReservations(dbReservations);
        } else {
          setReservations(getStoredReservations());
        }
      } else {
        setReservations(getStoredReservations());
      }

      // Deduplicate using strict normalized uppercase key
      const uniqueMap = new Map<string, PlateItem>();

      for (const item of mappedBookings) {
        const key = item.id.trim().toUpperCase();
        if (!uniqueMap.has(key)) uniqueMap.set(key, item);
      }

      for (const item of mappedInvoices) {
        const key = item.id.trim().toUpperCase();
        if (!uniqueMap.has(key)) uniqueMap.set(key, item);
      }



      const finalPlates = Array.from(uniqueMap.values());
      setPlatesList(finalPlates);

      if (finalPlates.length > 0) {
        setActivePlate((prev) => (prev ? uniqueMap.get(prev.id.trim().toUpperCase()) || finalPlates[0] : finalPlates[0]));
      }

      setLastSyncedTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Plate Sync Error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchAllPlatesData();
  }, []);

  const updateReservations = (newRes: Reservation[]) => {
    setReservations(newRes);
    saveStoredReservations(newRes);
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resHolder || !resAuthRef) return;

    let newRes: Partial<Reservation>;
    const currentYear = 2026;
    let durationYears = 2;
    if (resDuration === "6 Months") durationYears = 0.5;
    else if (resDuration === "1 Year") durationYears = 1;
    
    const expiryDate = new Date();
    expiryDate.setFullYear(currentYear + durationYears);
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
        updateReservations(updated);
        triggerToast(`🛡️ Block reservation for ${resHolder} created in database!`);
      } else {
        throw new Error("Failed to save reservation to DB");
      }
    } catch (err) {
      console.error(err);
      const fallbackRes: Reservation = {
        ...(newRes as Reservation),
        id: (newRes as Reservation).id || `res-${Date.now()}`,
      };
      const updated = [fallbackRes, ...reservations];
      updateReservations(updated);
      triggerToast(`🛡️ Reservation created locally for ${resHolder}`);
    }
    
    setResPlate("");
    setResRangeStart("");
    setResRangeEnd("");
    setResHolder("");
    setResAuthRef("");
    setShowAddRes(false);
  };

  // Active Plates Registry Filter
  const filteredPlates = platesList.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.id.toLowerCase().includes(query) ||
      p.owners.some((o) => o.name.toLowerCase().includes(query) || o.email.toLowerCase().includes(query)) ||
      p.vehicle.toLowerCase().includes(query) ||
      p.chassis.toLowerCase().includes(query);

    const matchesZone     = selectedZone === "All"     || p.zone === selectedZone;
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesStatus   = selectedStatus === "All"   || p.status === selectedStatus;

    return matchesSearch && matchesZone && matchesCategory && matchesStatus;
  });

  // Reservations Filter
  const filteredReservations = reservations.filter((res) => {
    const query = resSearchQuery.toLowerCase();
    const matchesSearch =
      res.holder.toLowerCase().includes(query) ||
      res.authRef.toLowerCase().includes(query) ||
      res.prefix.toLowerCase().includes(query) ||
      (res.type === "Range" 
        ? `${res.prefix} ${res.rangeStart}-${res.rangeEnd}`.toLowerCase().includes(query)
        : res.platePattern?.toLowerCase().includes(query));

    const matchesType = selectedResType === "All" || res.type === selectedResType;
    const matchesStatus = selectedResStatus === "All" || res.status === selectedResStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert Banner */}
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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                DVLA HQ · AD Series Registry
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live DB Synchronized
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Vehicle Plate Registry &amp; Directory
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Verify, inspect, and audit all official AD-prefix vehicle licence plates, vanity series, and reserved institutional fleet allocations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAllPlatesData}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isSyncing ? "animate-spin" : ""}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
              <span>{isSyncing ? "Syncing..." : `Sync DB (${lastSyncedTime})`}</span>
            </button>
            {activeTab === "reservations" && (
              <button
                onClick={() => setShowAddRes(true)}
                className="px-3.5 py-2 rounded-lg bg-[#81B71A] hover:bg-[#72a316] active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>+</span>
                <span>New Block Hold</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Segmented Navigation Tabs ── */}
        <div className="flex items-center gap-3 border-t border-slate-100 pt-3 mt-4">
          <button
            onClick={() => setActiveTab("registry")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "registry"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>🚗 Active Plate Registry</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === "registry" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {platesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "reservations"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>🛡️ Reserved Ranges &amp; Blocks</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === "reservations" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            }`}>
              {reservations.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Registry View ── */}
      {activeTab === "registry" ? (
        <>
          {/* ── Executive Metric KPI Strip ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                label: "Total Registered Plates",
                val: platesList.length,
                sub: "Live database synced",
                dot: "bg-emerald-500",
                badge: "Active DB",
                badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              },
              {
                label: "Private Series",
                val: platesList.filter(p => p.category === "Private").length,
                sub: platesList.length > 0 ? `${Math.round((platesList.filter(p => p.category === "Private").length / platesList.length) * 100)}% of active fleet` : "Personal vehicles",
                dot: "bg-blue-500",
                badge: "White Plates",
                badgeBg: "bg-blue-50 text-blue-700 border-blue-200/60"
              },
              {
                label: "Commercial Fleet",
                val: platesList.filter(p => p.category === "Commercial").length,
                sub: "Commercial passenger/cargo",
                dot: "bg-amber-500",
                badge: "Yellow Plates",
                badgeBg: "bg-amber-50 text-amber-800 border-amber-200/60"
              },
              {
                label: "Operational Compliance",
                val: platesList.length > 0 ? `${((platesList.filter(p => p.status === "Active").length / platesList.length) * 100).toFixed(1)}%` : "100%",
                sub: "Verified valid status",
                dot: "bg-[#81B71A]",
                badge: "Certified",
                badgeBg: "bg-[#81B71A]/10 text-[#2d5009] border-[#81B71A]/30"
              },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                    <span className="text-[11px] font-semibold text-slate-500">{m.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeBg}`}>
                    {m.badge}
                  </span>
                </div>
                <p className="font-mono text-2xl font-bold text-slate-900 tracking-tight">{m.val}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Main Section: Table & Inspector Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
            
            {/* Left 2 Columns: Filters & Directory Table */}
            <div className="xl:col-span-2 space-y-3.5">
              
              {/* Filter Toolbar Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    Filter Plate Registry
                  </span>
                  {(searchQuery || selectedZone !== "All" || selectedCategory !== "All" || selectedStatus !== "All") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedZone("All");
                        setSelectedCategory("All");
                        setSelectedStatus("All");
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                  <div className="md:col-span-6 relative">
                    <input
                      type="text"
                      placeholder="Search Plate ID, Owner, or VIN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                    />
                    <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition cursor-pointer"
                    >
                      <option value="All">All Municipal Zones</option>
                      <option value="Adentan Frafraha">Adentan Frafraha</option>
                      <option value="Oyibi">Oyibi</option>
                      <option value="Madina">Madina</option>
                      <option value="Teshie-Nungua">Teshie-Nungua</option>
                      <option value="Dodowa">Dodowa</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      <option value="Private">Private</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Electric">Electric Vehicle (EV)</option>
                      <option value="Government">Government</option>
                      <option value="Trailer">Trailer</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Agricultural">Agricultural</option>
                    </select>
                  </div>
                </div>

                {/* Quick Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1.5">Status:</span>
                  {["All", "Active", "Suspended", "Expired"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                        selectedStatus === st
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                  <span className="ml-auto text-[11px] text-slate-400 font-mono font-medium">
                    Showing {filteredPlates.length} of {platesList.length} plates
                  </span>
                </div>
              </div>

              {/* Directory Table Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80">
                        {["Plate Number", "Registered Owner", "Vehicle Specification", "Category", "Zone", "Status"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPlates.length > 0 ? (
                        filteredPlates.map((p, idx) => {
                          const isSelected = activePlate?.id === p.id;
                          return (
                            <tr
                              key={`${p.id}-${idx}`}
                              onClick={() => setActivePlate(p)}
                              className={`cursor-pointer transition-colors ${
                                isSelected 
                                  ? "bg-slate-50/90 border-l-4 border-l-slate-900" 
                                  : "hover:bg-slate-50/60 border-l-4 border-l-transparent"
                              }`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-900 shadow-2xs">
                                  {p.id}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-slate-900 font-bold">{p.owners[0]?.name || "N/A"}</span>
                                  {p.owners.length > 1 && (
                                    <span className="text-[10px] text-emerald-700 font-medium">
                                      +{p.owners.length - 1} Co-owner
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                                {p.vehicle}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  p.category === "Commercial" 
                                    ? "bg-amber-100/80 text-amber-900 border border-amber-200"
                                    : p.category === "Government"
                                    ? "bg-emerald-100/80 text-emerald-900 border border-emerald-200"
                                    : p.category === "Electric"
                                    ? "bg-teal-100/80 text-teal-900 border border-teal-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}>
                                  {p.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">{p.zone}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  p.status === "Active" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : p.status === "Suspended"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    p.status === "Active" ? "bg-emerald-500" : p.status === "Suspended" ? "bg-amber-500" : "bg-rose-500"
                                  }`} />
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-xs font-medium text-slate-400">
                            No plates match your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Plate Inspector Panel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-5 sticky top-5">
              {activePlate ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Plate Inspector &amp; Visualizer
                      </h3>
                      <p className="text-[11px] text-slate-400">Official digital plate render</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      VERIFIED
                    </span>
                  </div>

                  {/* License Plate Preview Container */}
                  <div className="w-full max-w-[280px] sm:max-w-[300px] mx-auto py-1">
                    <DigitalPlate 
                      plateNumber={activePlate.id} 
                      category={activePlate.category as PlateCategory}
                      region="GREATER ACCRA"
                      slogan="GREATER ACCRA"
                      vin={activePlate.chassis}
                    />
                  </div>

                  {/* Registered Specifications */}
                  <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Registered Owner</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{activePlate.owners[0]?.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{activePlate.owners[0]?.email}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vehicle Model &amp; VIN</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{activePlate.vehicle}</p>
                      <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                        VIN: {activePlate.chassis}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Municipal Zone</p>
                        <p className="font-semibold text-slate-900 mt-0.5">{activePlate.zone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category</p>
                        <p className="font-semibold text-slate-900 mt-0.5">{activePlate.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inspector Action Buttons */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => triggerToast(`📜 Exporting Verification Certificate for ${activePlate.id}...`)}
                      className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      Export Verification Certificate
                    </button>
                    <button
                      onClick={() => triggerToast(`⚠️ Status flag updated for ${activePlate.id}`)}
                      className="w-full py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      Update Record Status
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  Select a plate from the registry table to inspect full specifications.
                </div>
              )}
            </div>

          </div>
        </>
      ) : (
        /* ── Reserved Ranges View ── */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Reserved Block Allocations</h2>
              <p className="text-xs text-slate-500">Active quota reservations for state agencies, diplomatic missions, and organizations.</p>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="text"
                placeholder="Search holder, ref or prefix..."
                value={resSearchQuery}
                onChange={(e) => setResSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-56"
              />
              <button
                onClick={() => setShowAddRes(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#81B71A] hover:bg-[#72a316] text-white font-semibold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span>
                <span>New Hold</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredReservations.map((res) => (
              <div key={res.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <MiniPlateBadge
                    type={res.type}
                    platePattern={res.platePattern}
                    prefix={res.prefix}
                    rangeStart={res.rangeStart}
                    year={res.year}
                  />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    res.status === "Active" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {res.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{res.holder}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Auth Ref: {res.authRef}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Block Utilization</span>
                    <span className="font-mono font-bold text-slate-900">{res.claimedCount} / {res.totalCount} Slots</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#81B71A] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (res.claimedCount / res.totalCount) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Prefix: {res.prefix}</span>
                    <span>Expires: {res.expiryDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Dialog for New Reservation */}
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
                  placeholder="e.g. Ghana Armed Forces / National Security" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Authorization Reference</label>
                <input 
                  required 
                  value={resAuthRef} 
                  onChange={e => setResAuthRef(e.target.value)} 
                  placeholder="e.g. DVLA-HQ-RES-2026-09" 
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

/* ── Metric Stat Icons ── */
function PlateIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth={2.5} />
    </svg>
  );
}
function PrivateIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function CommercialIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ActiveIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
