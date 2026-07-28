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

      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        if (Array.isArray(bookings)) {
          mappedBookings = bookings.map((b: any) => {
            const name = b.ownerName || b.owner || "DVLA Client";
            const safeNameStr = String(name);
            const email = `${safeNameStr.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
            const phone = b.phone || "+233 24 000 0000";
            const address = b.address || "";
            return {
              id: b.regNo || generateNewDVLAFormat(),
              owners: [{ name: safeNameStr, email, phone, role: "Primary" }],
              vehicle: `${b.make || "Vehicle"} ${b.yearModel || b.model || ""}`.trim(),
              zone: address.includes("Adentan") ? "Adentan Frafraha" : address.includes("Oyibi") ? "Oyibi" : "Madina",
              category: b.classification === "COMMERCIAL" ? "Commercial" : b.classification === "GOVERNMENT" ? "Government" : "Private",
              status: "Active",
              date: b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "18 May 2026",
              chassis: b.chassisNo || "CHASSIS-N/A",
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
            return {
              id: inv.regNo || generateNewDVLAFormat(),
              owners: [{ name: safeNameStr, email, phone, role: "Primary" }],
              vehicle: `${inv.make || "Vehicle"} ${inv.yearModel || ""}`.trim(),
              zone: address.includes("Adentan") ? "Adentan Frafraha" : address.includes("Oyibi") ? "Oyibi" : "Madina",
              category: inv.classification === "COMMERCIAL" ? "Commercial" : inv.classification === "GOVERNMENT" ? "Government" : "Private",
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
        body: JSON.stringify(newRes),
      });

      if (res.ok) {
        const created = await res.json();
        const updated = [created, ...reservations];
        updateReservations(updated);
        triggerToast(`🛡️ Block reservation for ${resHolder} created in database!`);

        // Log to audit trail
        fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RESERVATION_LOCKED",
            details: resType === "Range"
              ? `Range block ${resPrefix} ${resRangeStart}-${resRangeEnd} locked for ${resHolder} (Ref: ${resAuthRef})`
              : `Vanity plate ${resPlate || resPrefix} reserved for ${resHolder} (Ref: ${resAuthRef})`,
            performedBy: "admin",
          }),
        }).catch(() => {});
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1a2e05] text-white text-xs font-bold shadow-2xl border border-[#81B71A]/40 flex items-center gap-2.5 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#81B71A] animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Page Hero Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #091402 0%, #152704 35%, #274807 70%, #81B71A 100%)" }}>
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="headergrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#headergrid)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/20 backdrop-blur-md">
                DVLA HQ · AD Series
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Supabase DB
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Vehicle Plate Registry &amp; Directory
            </h1>
            <p className="text-white/75 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
              Verify, inspect, and manage all official AD-prefix vehicle licence plates, private vanity series, and reserved organization fleet allocations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllPlatesData}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isSyncing ? "animate-spin" : ""}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
              <span>{isSyncing ? "Syncing..." : `Sync DB (${lastSyncedTime})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-1">
        <div className="flex gap-4 md:gap-8">
          <button
            onClick={() => setActiveTab("registry")}
            className={`pb-3.5 text-xs md:text-sm font-extrabold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "registry" ? "text-[#3d6b08]" : "text-[#64748b] hover:text-[#3d6b08]"
            }`}
          >
            <span>🚗 Active Plate Registry</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#81B71A]/15 text-[#3d6b08]">
              {platesList.length}
            </span>
            {activeTab === "registry" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#81B71A] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("reservations")}
            className={`pb-3.5 text-xs md:text-sm font-extrabold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "reservations" ? "text-[#3d6b08]" : "text-[#64748b] hover:text-[#3d6b08]"
            }`}
          >
            <span>🛡️ Reserved Ranges &amp; Blocks</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
              {reservations.length}
            </span>
            {activeTab === "reservations" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#81B71A] rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* ── Registry View ── */}
      {activeTab === "registry" ? (
        <>
          {/* ── Metrics Cards Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total AD Plates",
                val: platesList.length,
                sub: "Live database plates",
                accent: "#81B71A",
                bg: "rgba(129,183,26,0.09)",
                icon: PlateIcon
              },
              {
                label: "Private Category",
                val: platesList.filter(p => p.category === "Private").length,
                sub: platesList.length > 0 ? `${Math.round((platesList.filter(p => p.category === "Private").length / platesList.length) * 100)}% of total` : "Personal cars",
                accent: "#3b82f6",
                bg: "rgba(59,130,246,0.09)",
                icon: PrivateIcon
              },
              {
                label: "Commercial Category",
                val: platesList.filter(p => p.category === "Commercial").length,
                sub: "Commercial yellow plates",
                accent: "#f59e0b",
                bg: "rgba(245,158,11,0.09)",
                icon: CommercialIcon
              },
              {
                label: "Verified Active Rate",
                val: platesList.length > 0 ? `${((platesList.filter(p => p.status === "Active").length / platesList.length) * 100).toFixed(1)}%` : "100%",
                sub: "Operational compliance",
                accent: "#10b981",
                bg: "rgba(16,185,129,0.09)",
                icon: ActiveIcon
              },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-[#e8edf5] relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.04)", padding: "1.2rem 1.25rem 1rem" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: m.accent }} />
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: m.bg, color: m.accent }}>
                    <m.icon />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.accent }}>
                    Active
                  </span>
                </div>
                <p className="font-extrabold tracking-tight text-[#1a2e05] text-2xl md:text-3xl leading-none">{m.val}</p>
                <p className="text-xs font-bold mt-1.5 text-[#6b7a99]">{m.label}</p>
                <p className="text-[10px] mt-2.5 pt-2.5 border-t border-[#f0f3f8] text-[#9aa3be] font-medium">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Main Section: Table & Inspector Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Left 2 Columns: Filters & Directory Table */}
            <div className="xl:col-span-2 space-y-4">
              
              {/* Filter Toolbar Card */}
              <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider">Filter Directory</h3>
                  {(searchQuery || selectedZone !== "All" || selectedCategory !== "All" || selectedStatus !== "All") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedZone("All");
                        setSelectedCategory("All");
                        setSelectedStatus("All");
                      }}
                      className="text-[11px] font-bold text-red-600 hover:text-red-800 transition cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2 relative">
                    <input
                      type="text"
                      placeholder="Search Plate ID, Owner Name or Chassis VIN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 font-medium transition"
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

                  <div>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-bold"
                    >
                      <option value="All">All Zones</option>
                      <option value="Adentan Frafraha">Adentan Frafraha</option>
                      <option value="Oyibi">Oyibi</option>
                      <option value="Madina">Madina</option>
                      <option value="Teshie-Nungua">Teshie-Nungua</option>
                      <option value="Dodowa">Dodowa</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-bold"
                    >
                      <option value="All">All Categories</option>
                      <option value="Private">Private</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Electric">Electric Vehicle (EV)</option>
                      <option value="Government">Government</option>
                      <option value="Trailer">Trailer</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Agricultural">Agricultural</option>
                    </select>
                  </div>
                </div>

                {/* Quick Status Filter Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0f4f8]">
                  <span className="text-xs text-[#9aa3be] font-bold mr-2">Status:</span>
                  {["All", "Active", "Suspended", "Expired"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className="px-3.5 py-1 rounded-full text-xs font-bold transition duration-150 cursor-pointer"
                      style={{
                        background: selectedStatus === st ? "rgba(129,183,26,0.12)" : "#f1f5f9",
                        color: selectedStatus === st ? "#3d6b08" : "#64748b",
                        border: selectedStatus === st ? "1px solid rgba(129,183,26,0.3)" : "1px solid transparent",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directory Table Card */}
              <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#e2e8f0]">
                        {["Plate ID", "Owner", "Vehicle Model", "Category", "Zone", "Status"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 font-extrabold uppercase tracking-wider text-[#64748b]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f3f8]">
                      {filteredPlates.length > 0 ? (
                        filteredPlates.map((p, idx) => {
                          const isActive = activePlate?.id === p.id;
                          return (
                            <tr
                              key={`${p.id}-${idx}`}
                              onClick={() => setActivePlate(p)}
                              className={`cursor-pointer transition-colors ${
                                isActive ? "bg-[#81B71A]/10 border-l-4 border-l-[#81B71A]" : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="font-mono text-xs font-black tracking-wider px-2 py-1 rounded border border-[#81B71A]/30 bg-[#81B71A]/10 text-[#2d5009]">
                                  {p.id}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-[#1a2e05] font-bold">{p.owners[0]?.name || "N/A"}</span>
                                  {p.owners.length > 1 && (
                                    <span className="text-[10px] text-[#81B71A] font-bold">
                                      +{p.owners.length - 1} Co-owner
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-[#374167] font-semibold whitespace-nowrap">{p.vehicle}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.category === "Commercial" 
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : p.category === "Government"
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}>
                                  {p.category}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-[#64748b] font-medium whitespace-nowrap">{p.zone}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  p.status === "Active" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : p.status === "Suspended"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-xs font-semibold text-[#9aa3be]">
                            No plates match your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3D Plate Inspector Panel */}
            <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-6 sticky top-6">
              {activePlate ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#f0f4f8] pb-3">
                    <h3 className="font-extrabold text-[#1a2e05] text-xs uppercase tracking-wider">
                      Plate Inspector &amp; Visualizer
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-[#81B71A] bg-[#81B71A]/10 px-2 py-0.5 rounded">
                      VERIFIED
                    </span>
                  </div>

                  {/* 3D Ghanaian License Plate Preview Component */}
                  <div className="space-y-4 flex flex-col items-center">
                    <DigitalPlate 
                      plateNumber={activePlate.id} 
                      category={activePlate.category as PlateCategory}
                      region="GREATER ACCRA"
                      slogan="GREATER ACCRA"
                      vin={activePlate.chassis}
                    />
                  </div>

                  {/* Registered Specifications */}
                  <div className="space-y-3 text-xs pt-2">
                    <div>
                      <p className="text-[10px] text-[#9aa3be] uppercase font-extrabold">Registered Owner</p>
                      <p className="text-sm font-extrabold text-[#1a2e05] mt-0.5">{activePlate.owners[0]?.name}</p>
                      <p className="text-[11px] text-[#64748b] font-medium">{activePlate.owners[0]?.email}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-[#9aa3be] uppercase font-extrabold">Vehicle Model &amp; VIN</p>
                      <p className="font-bold text-[#374167] mt-0.5">{activePlate.vehicle}</p>
                      <p className="text-[11px] font-mono text-[#64748b] bg-slate-50 p-1.5 rounded border border-slate-200 mt-1">
                        VIN: {activePlate.chassis}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-[#9aa3be] uppercase font-extrabold">Zone</p>
                        <p className="font-bold text-[#1a2e05]">{activePlate.zone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9aa3be] uppercase font-extrabold">Category</p>
                        <p className="font-bold text-[#1a2e05]">{activePlate.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inspector Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-[#f0f4f8]">
                    <button
                      onClick={() => triggerToast(`📜 Exporting Verification Certificate for ${activePlate.id}...`)}
                      className="w-full py-2.5 rounded-lg bg-[#81B71A] hover:bg-[#81B71A]/90 text-white font-bold text-xs shadow transition cursor-pointer"
                    >
                      Export Verification Certificate
                    </button>
                    <button
                      onClick={() => triggerToast(`⚠️ Status flag updated for ${activePlate.id}`)}
                      className="w-full py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-[#374167] font-bold text-xs transition cursor-pointer"
                    >
                      Update Record Status
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-xs text-[#9aa3be]">
                  Select a plate from the registry table to inspect full specifications.
                </div>
              )}
            </div>

          </div>
        </>
      ) : (
        /* ── Reserved Ranges View ── */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#1a2e05]">Reserved Block Allocations</h2>
            <button
              onClick={() => setShowAddRes(true)}
              className="px-4 py-2 rounded-xl bg-[#81B71A] text-white font-bold text-xs hover:bg-[#81B71A]/90 transition shadow cursor-pointer"
            >
              + Lock New Block Hold
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReservations.map((res) => (
              <div key={res.id} className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <MiniPlateBadge
                    type={res.type}
                    platePattern={res.platePattern}
                    prefix={res.prefix}
                    rangeStart={res.rangeStart}
                    year={res.year}
                  />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    res.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {res.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1a2e05] text-sm">{res.holder}</h3>
                  <p className="text-[11px] text-[#64748b] font-mono mt-0.5">Ref: {res.authRef}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Utilization</span>
                    <span>{res.claimedCount} / {res.totalCount} Slots</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#81B71A] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (res.claimedCount / res.totalCount) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Dialog for New Reservation */}
      {showAddRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#1a2e05]">Issue New Block Hold</h3>
              <button onClick={() => setShowAddRes(false)} className="text-slate-400 hover:text-black font-bold">✕</button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Hold Type</label>
                <select value={resType} onChange={(e) => setResType(e.target.value as any)} className="w-full p-2 border border-slate-200 rounded text-xs font-bold">
                  <option value="Range">Range Block (e.g. AB 9000-9099)</option>
                  <option value="Single">Single Vanity (e.g. AB 1111-AD)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Organization Holder</label>
                <input required value={resHolder} onChange={e => setResHolder(e.target.value)} placeholder="e.g. Ghana Armed Forces" className="w-full p-2 border border-slate-200 rounded text-xs font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Authorization Reference</label>
                <input required value={resAuthRef} onChange={e => setResAuthRef(e.target.value)} placeholder="e.g. DVLA-HQ-RES-2026" className="w-full p-2 border border-slate-200 rounded text-xs font-mono font-bold" />
              </div>

              {resType === "Range" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Range Start</label>
                    <input required type="number" value={resRangeStart} onChange={e => setResRangeStart(e.target.value)} placeholder="9000" className="w-full p-2 border border-slate-200 rounded text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Range End</label>
                    <input required type="number" value={resRangeEnd} onChange={e => setResRangeEnd(e.target.value)} placeholder="9099" className="w-full p-2 border border-slate-200 rounded text-xs font-mono" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Plate Pattern</label>
                  <input required value={resPlate} onChange={e => setResPlate(e.target.value)} placeholder="e.g. AB 1111-AD" className="w-full p-2 border border-slate-200 rounded text-xs font-mono" />
                </div>
              )}

              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#81B71A] text-white font-bold text-xs hover:bg-[#81B71A]/90 transition shadow">
                Lock &amp; Save Block Hold
              </button>
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
