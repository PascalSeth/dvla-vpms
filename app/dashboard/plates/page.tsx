"use client";

import { useState, useEffect } from "react";
import { getStoredReservations, saveStoredReservations, Reservation } from "../../../components/reservationsData";

// Adenta Branch — all plates carry the AD prefix
const PLATES_DB = [
  {
    id: "AD 0891-26",
    owners: [
      { name: "Kwame Asante",  email: "kwame.asante@gmail.com",    phone: "+233 24 456 7890", role: "Primary"  },
      { name: "Akua Asante",   email: "akua.asante@gmail.com",     phone: "+233 20 987 6543", role: "Co-Owner" }
    ],
    vehicle:  "Toyota Land Cruiser (2024)",
    zone:     "Adentan Frafraha",
    category: "Private",
    status:   "Active",
    date:     "18 May 2026",
    chassis:  "JTEBU5JR8P209871"
  },
  {
    id: "AD 1242-26",
    owners: [
      { name: "Abena Mensah",  email: "abena.m@yahoo.com",         phone: "+233 50 123 4567", role: "Primary"  },
      { name: "Kofi Mensah",   email: "kofi.m@yahoo.com",          phone: "+233 24 987 6543", role: "Co-Owner" }
    ],
    vehicle:  "Hyundai Elantra (2023)",
    zone:     "Oyibi",
    category: "Commercial",
    status:   "Active",
    date:     "12 Feb 2026",
    chassis:  "KMHDK41D7NU381920"
  },
  {
    id: "AD 0928-26",
    owners: [
      { name: "Ministry of Local Government", email: "transport@molg.gov.gh", phone: "+233 30 223 4455", role: "Primary" }
    ],
    vehicle:  "Nissan Patrol (2025)",
    zone:     "Adentan Frafraha",
    category: "Government",
    status:   "Active",
    date:     "05 May 2026",
    chassis:  "JN1BYSY61U391823"
  },
  {
    id: "AD 0729-24",
    owners: [
      { name: "Yaw Boateng", email: "yaw.b@boatenglogistics.com", phone: "+233 24 555 8899", role: "Primary" }
    ],
    vehicle:  "Mercedes-Benz C-Class (2022)",
    zone:     "Madina",
    category: "Private",
    status:   "Expired",
    date:     "14 Nov 2024",
    chassis:  "WDDGF4HB0DA829103"
  },
  {
    id: "AD 1029-25",
    owners: [
      { name: "Ama Owusu", email: "ama.owusu@outlook.com", phone: "+233 27 111 2233", role: "Primary" }
    ],
    vehicle:  "Toyota Hilux (2023)",
    zone:     "Teshie-Nungua",
    category: "Private",
    status:   "Active",
    date:     "17 May 2026",
    chassis:  "AHTFR29G4K8102983"
  },
  {
    id: "AD 0819-26",
    owners: [
      { name: "Kojo Darko", email: "k.darko@darkotransport.com", phone: "+233 24 333 4455", role: "Primary" }
    ],
    vehicle:  "DAF XF Truck (2021)",
    zone:     "Oyibi",
    category: "Commercial",
    status:   "Suspended",
    date:     "16 May 2026",
    chassis:  "XLRTE47M0E2918320"
  },
  {
    id: "AD 0201-26",
    owners: [
      { name: "Efua Adjei", email: "efua.adjei@live.com", phone: "+233 20 555 6677", role: "Primary" }
    ],
    vehicle:  "Kia Sportage (2024)",
    zone:     "Teshie-Nungua",
    category: "Private",
    status:   "Active",
    date:     "16 May 2026",
    chassis:  "KNDPM4AC8R7281923"
  },
  {
    id: "AD 3921-25",
    owners: [
      { name: "Fiifi Antwi", email: "f.antwi@adentabuilders.com", phone: "+233 24 777 8899", role: "Primary" }
    ],
    vehicle:  "Caterpillar Excavator (2020)",
    zone:     "Dodowa",
    category: "Equipment",
    status:   "Active",
    date:     "15 May 2026",
    chassis:  "CAT0320CCPH291823"
  },
  {
    id: "AD 0512-26",
    owners: [
      { name: "Nana Ama Darko",  email: "nana.darko@ghanalink.com",  phone: "+233 24 811 2290", role: "Primary"  },
      { name: "Kofi Darko Jr",   email: "kofijr.darko@ghanalink.com",phone: "+233 20 122 8820", role: "Co-Owner" }
    ],
    vehicle:  "Toyota Camry (2025)",
    zone:     "Adentan Frafraha",
    category: "Private",
    status:   "Active",
    date:     "09 May 2026",
    chassis:  "4T1BF3EK2AU572918"
  },
  {
    id: "AD 0634-26",
    owners: [
      { name: "Adenta Municipal Assembly", email: "transport@adentan.gov.gh", phone: "+233 30 288 1020", role: "Primary" }
    ],
    vehicle:  "Toyota HiAce Bus (2024)",
    zone:     "Adentan Frafraha",
    category: "Government",
    status:   "Active",
    date:     "02 Apr 2026",
    chassis:  "JTFPX22P8D0012940"
  },
  {
    id: "AD 0088-25",
    owners: [
      { name: "Bright Asiedu", email: "b.asiedu@oyibilogistics.com", phone: "+233 54 901 2244", role: "Primary" }
    ],
    vehicle:  "Isuzu D-Max Truck (2023)",
    zone:     "Oyibi",
    category: "Commercial",
    status:   "Active",
    date:     "22 Jan 2025",
    chassis:  "AHTFR29G4K8100011"
  },
  {
    id: "AD 2290-24",
    owners: [
      { name: "Vida Mensah", email: "vida.mensah@gmail.com", phone: "+233 27 449 9182", role: "Primary" }
    ],
    vehicle:  "Hyundai Tucson (2022)",
    zone:     "Madina",
    category: "Private",
    status:   "Expired",
    date:     "30 Jun 2024",
    chassis:  "KM8JUCAL4NU198302"
  },
];

function MiniPlateBadge({ type, platePattern, prefix, rangeStart, rangeEnd, year }: { 
  type: "Single" | "Range"; 
  platePattern?: string; 
  prefix: string; 
  rangeStart?: number; 
  rangeEnd?: number; 
  year: string; 
}) {
  const isRange = type === "Range";
  
  // Format the text inside the mini plate
  let text = "";
  if (isRange) {
    const startStr = rangeStart !== undefined ? String(rangeStart) : "";
    const prefixNum = startStr.substring(0, startStr.length - 2) || "90";
    text = `${prefix} ${prefixNum}XX-${year}`;
  } else {
    text = platePattern || `${prefix} 1111-${year}`;
  }

  // Differentiate styling - State House & Police use Government Green theme, Otumfuo uses Premium theme
  const isGov = type === "Range" && (rangeStart === 9000 || rangeStart === 8500 || (rangeStart !== undefined && rangeStart >= 8000 && rangeStart <= 9500));

  return (
    <div className="relative shrink-0 w-[132px] h-[38px] rounded-md border-2 border-slate-900 shadow-md overflow-hidden select-none flex items-stretch"
         style={{
           background: isGov 
             ? "linear-gradient(180deg, #2f9e44 0%, #2b8a3e 60%, #1e702e 100%)"
             : "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 60%, #dee2e6 100%)",
           boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
         }}>
      {/* GH Strip */}
      <div className="w-[12%] shrink-0 flex flex-col items-center justify-between py-0.5 bg-[#0c3b87] rounded-l-[1px] z-10">
        <div className="w-[85%] aspect-[3/2] flex flex-col rounded-[0.5px] overflow-hidden">
          <div className="flex-1 bg-red-600" />
          <div className="flex-1 bg-yellow-400 relative flex items-center justify-center">
            <span className="absolute text-[2.5px] text-black font-black leading-none" style={{ transform: "scale(0.8)" }}>★</span>
          </div>
          <div className="flex-1 bg-green-600" />
        </div>
        <span className="text-[5.5px] font-black text-white leading-none tracking-tighter" style={{ transform: "scale(0.9)" }}>GH</span>
      </div>
      
      {/* Embossed inner rim */}
      <div className="absolute inset-[1px] rounded-[3px] border border-slate-950/10 pointer-events-none z-30" />
      {/* Shine */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-white/20 z-20" />

      {/* Plate text */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-1">
        <span className="text-[5px] font-black tracking-[0.15em] leading-none mb-0.5"
              style={{ color: isGov ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.35)" }}>
          {isRange ? "BLOCK" : "VANITY"}
        </span>
        <span className="font-mono font-black text-[9px] tracking-wider uppercase leading-none"
              style={{ 
                fontFamily: "'Courier New', Courier, monospace",
                color: isGov ? "#ffffff" : "#1e293b",
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

  // Load from stored cache on mount
  useEffect(() => {
    setReservations(getStoredReservations());
  }, []);

  const updateReservations = (newRes: Reservation[]) => {
    setReservations(newRes);
    saveStoredReservations(newRes);
  };

  // New reservation states
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

  // Reservation filtering states
  const [resSearchQuery, setResSearchQuery] = useState("");
  const [selectedResType, setSelectedResType] = useState<"All" | "Range" | "Single">("All");
  const [selectedResStatus, setSelectedResStatus] = useState<"All" | "Active" | "Alert" | "Expired">("All");

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resHolder || !resAuthRef) return;

    let newRes: Reservation;
    // Calculate simple mock expiry date (current year + duration)
    const currentYear = 2026;
    let durationYears = 2;
    if (resDuration === "6 Months") durationYears = 0.5;
    else if (resDuration === "1 Year") durationYears = 1;
    
    const expiryDate = new Date();
    expiryDate.setFullYear(currentYear + durationYears);
    const expiryStr = expiryDate.toISOString().split("T")[0];

    if (resType === "Single") {
      newRes = {
        id: `res-${Date.now()}`,
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
        id: `res-${Date.now()}`,
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

    const updated = [newRes, ...reservations];
    updateReservations(updated);
    
    // Reset form
    setResPlate("");
    setResRangeStart("");
    setResRangeEnd("");
    setResHolder("");
    setResAuthRef("");
    setShowAddRes(false);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activePlate, setActivePlate] = useState<typeof PLATES_DB[0] | null>(PLATES_DB[0]);

  // Filtering logic
  const filteredPlates = PLATES_DB.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owners.some((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone     = selectedZone === "All"     || p.zone === selectedZone;
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesStatus   = selectedStatus === "All"   || p.status === selectedStatus;

    return matchesSearch && matchesZone && matchesCategory && matchesStatus;
  });

  // Reservation Filtering logic
  const filteredReservations = reservations.filter((res) => {
    const query = resSearchQuery.toLowerCase();
    const matchesSearch =
      res.holder.toLowerCase().includes(query) ||
      res.authRef.toLowerCase().includes(query) ||
      res.prefix.toLowerCase().includes(query) ||
      (res.type === "Range" 
        ? `${res.prefix} ${res.rangeStart}-${res.rangeEnd}`.toLowerCase().includes(query)
        : res.platePattern?.toLowerCase().includes(query));

    const matchesType =
      selectedResType === "All" || res.type === selectedResType;

    const matchesStatus =
      selectedResStatus === "All" || res.status === selectedResStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-8">
      
      {/* ── Page Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-6 mb-2"
        style={{ background: "linear-gradient(115deg, #0d1a03 0%, #1a2e05 18%, #2d5009 48%, #4a7c10 74%, #81B71A 100%)" }}>
        
        {/* Grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} preserveAspectRatio="none">
          <defs>
            <pattern id="headergrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#headergrid)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.6)" }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
                DVLA — Adenta Branch · AD Plate Registry
              </p>
            </div>
            <h2 className="font-extrabold tracking-tight text-white text-2xl">
              Plate Registry &amp; Directory
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Manage and verify all AD-prefix plates issued from the Adenta Branch.
            </p>
          </div>
          <button className="px-5 py-2.5 rounded-xl text-xs font-bold transition hover:scale-[1.03] duration-200 shrink-0 shadow-lg"
            style={{ background: "white", color: "#2d5009" }}>
            + Register New Plate
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex border-b border-[#cbd5e1] gap-6 mb-6">
        <button
          onClick={() => setActiveTab("registry")}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === "registry" ? "text-[#3d6b08] font-extrabold" : "text-[#64748b] hover:text-[#3d6b08]"
          }`}
        >
          Active Plates Registry
          {activeTab === "registry" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#81B71A] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === "reservations" ? "text-[#3d6b08] font-extrabold" : "text-[#64748b] hover:text-[#3d6b08]"
          }`}
        >
          <span>🛡️</span> Reserved Ranges &amp; Blocks
          {activeTab === "reservations" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#81B71A] rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === "registry" ? (
        <>
          {/* ── Metrics Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "AD Plates Total",     val: "2,481",  sub: "All active Adenta Branch plates",  accent: "#81B71A", bg: "rgba(129,183,26,0.09)", icon: PlateIcon      },
              { label: "Private Category",    val: "1,280",  sub: "52% of all AD plates",             accent: "#3b82f6", bg: "rgba(59,130,246,0.09)", icon: PrivateIcon    },
              { label: "Commercial Category", val: "648",    sub: "Yellow licence plates",             accent: "#f59e0b", bg: "rgba(245,158,11,0.09)", icon: CommercialIcon },
              { label: "Active Rate",         val: "96.1%",  sub: "+0.8% this quarter",               accent: "#10b981", bg: "rgba(16,185,129,0.09)", icon: ActiveIcon     },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-[#e8edf5] relative overflow-hidden"
                style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.055)", padding: "1.2rem 1.25rem 1rem" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: m.accent }} />
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: m.bg, color: m.accent }}>
                    <m.icon />
                  </div>
                </div>
                <p className="font-bold tracking-tight text-[#1a2e05]" style={{ fontSize: "1.65rem", lineHeight: 1 }}>{m.val}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "#6b7a99" }}>{m.label}</p>
                <p className="text-[10px] mt-2.5 pt-2.5 border-t border-[#f0f3f8]" style={{ color: "#b0bbd6" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Main Panel Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Registry List & Filters */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
                <h3 className="font-bold text-[#1a2e05] text-sm uppercase tracking-wider">Filter Registry</h3>

                {/* Filters grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Search by Plate ID, Owner or Vehicle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition"
                    />
                  </div>

                  <div>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-medium"
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
                      className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-medium"
                    >
                      <option value="All">All Categories</option>
                      <option value="Private">Private</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Government">Government</option>
                      <option value="Equipment">Equipment</option>
                    </select>
                  </div>
                </div>

                {/* Quick tags */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0f4f8]">
                  <span className="text-xs text-[#9aa3be] mr-2">Status:</span>
                  {["All", "Active", "Suspended", "Expired"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className="px-3.5 py-1 rounded-full text-xs font-bold transition hover:scale-[1.03] duration-150 cursor-pointer"
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

              {/* Directory Table */}
              <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                        {["Plate ID", "Owner", "Category", "Zone", "Status", "Date"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#9aa3be] whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f3f8]">
                      {filteredPlates.length > 0 ? (
                        filteredPlates.map((p) => {
                          const isActive = activePlate?.id === p.id;
                          return (
                            <tr
                              key={p.id}
                              onClick={() => setActivePlate(p)}
                              className={`cursor-pointer transition-colors ${
                                isActive ? "bg-[#81B71A]/5 hover:bg-[#81B71A]/10" : "hover:bg-[#f8faff]"
                              }`}
                            >
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold tracking-wide px-2 py-1 rounded-md"
                                  style={{ background: "rgba(129,183,26,0.07)", color: "#2d5009" }}>
                                  {p.id}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-[#374167] font-semibold">{p.owners[0].name}</span>
                                  {p.owners.length > 1 && (
                                    <span className="text-[10px] text-[#81B71A] font-bold mt-0.5 flex items-center gap-1">
                                      <span>👥</span> +{p.owners.length - 1} Co-owner{p.owners.length > 2 ? 's' : ''} ({p.owners.slice(1).map(o => o.name).join(', ')})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-[#6b7a99] font-medium whitespace-nowrap">{p.category}</td>
                              <td className="px-5 py-3.5 text-xs text-[#6b7a99] font-medium whitespace-nowrap">{p.zone}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                                  style={{
                                    background:
                                      p.status === "Active"
                                        ? "rgba(129,183,26,0.09)"
                                        : p.status === "Suspended"
                                        ? "rgba(245,158,11,0.09)"
                                        : "rgba(239,68,68,0.09)",
                                    color:
                                      p.status === "Active"
                                        ? "#3d6b08"
                                        : p.status === "Suspended"
                                        ? "#92610a"
                                        : "#991b1b",
                                    borderColor:
                                      p.status === "Active"
                                        ? "rgba(129,183,26,0.22)"
                                        : p.status === "Suspended"
                                        ? "rgba(245,158,11,0.22)"
                                        : "rgba(239,68,68,0.22)",
                                  }}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-[#9aa3be] font-medium whitespace-nowrap">{p.date}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-sm font-semibold text-[#9aa3be]">
                            No plates match your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Plate Detail / Visualizer Panel */}
            <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-6">
              {activePlate ? (
                <>
                  <div>
                    <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider mb-4">Plate Visualizer</h3>
                    
                    {/* Ghanaian Licence Plate Visualizer */}
                    <div className="space-y-3">
                      {/* Category colour legend */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {[
                          { cat: "Private",    bg: "#e9ecef", text: "#1e293b", border: "#adb5bd" },
                          { cat: "Commercial", bg: "#fcc419", text: "#1e293b", border: "#f08c00" },
                          { cat: "Government", bg: "#2b8a3e", text: "#ffffff", border: "#1e5f2e" },
                          { cat: "Equipment",  bg: "#e9ecef", text: "#1b8a3e", border: "#adb5bd" },
                        ].map(({ cat, bg, border }) => (
                          <div key={cat} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm border" style={{ background: bg, borderColor: border }} />
                            <span className="text-[10px] font-semibold" style={{ color: activePlate.category === cat ? "#1a2e05" : "#9aa3be" }}>{cat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Main plate */}
                      <div className="relative w-full max-w-[340px] mx-auto rounded-xl border-[4px] border-slate-900 shadow-2xl overflow-hidden select-none"
                           style={{
                             background: activePlate.category === "Commercial"
                               ? "linear-gradient(180deg, #ffe066 0%, #fcc419 60%, #fab005 100%)"
                               : activePlate.category === "Government"
                               ? "linear-gradient(180deg, #2f9e44 0%, #2b8a3e 60%, #1e702e 100%)"
                               : "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 60%, #dee2e6 100%)",
                             boxShadow: "0 15px 30px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.8), inset 0 -3px 6px rgba(0,0,0,0.2)"
                           }}>

                        {/* Embossed inner rim */}
                        <div className="absolute inset-[2px] rounded-lg border border-slate-950/20 pointer-events-none z-30" />
                        {/* Light shine */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-white/40 z-20" />

                        <div className="flex items-stretch h-[76px]">
                          {/* Ghana flag strip */}
                          <div className="w-[11%] shrink-0 flex flex-col items-center justify-between py-1.5 bg-[#0c3b87] rounded-l-[5px] z-20"
                               style={{ boxShadow: "1px 0 3px rgba(0,0,0,0.15)" }}>
                            <div className="w-[80%] aspect-[3/2] flex flex-col rounded-sm overflow-hidden border border-white/10">
                              <div className="flex-1 bg-red-600" />
                              <div className="flex-1 bg-yellow-400 relative flex items-center justify-center">
                                <span className="absolute text-[5px] text-black leading-none font-black">★</span>
                              </div>
                              <div className="flex-1 bg-green-600" />
                            </div>
                            <span className="text-[9px] font-black text-white leading-none tracking-tighter">GH</span>
                          </div>

                          {/* Plate content */}
                          <div className="flex-1 flex flex-col items-center justify-center px-3 relative z-20">
                            {/* DVLA hologram */}
                            <div className="absolute right-2.5 top-2 w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 opacity-55 flex items-center justify-center"
                                 style={{ boxShadow: "0 0 5px rgba(245,158,11,0.5)", border: "0.5px solid rgba(255,255,255,0.2)" }}>
                              <span className="text-[4.5px] font-black text-amber-950 tracking-tighter">DVLA</span>
                            </div>

                            {/* Branch label above plate number */}
                            <span className="text-[8px] font-black uppercase tracking-[0.22em] mb-0.5"
                                  style={{
                                    color: activePlate.category === "Government" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.38)",
                                    fontFamily: "system-ui, sans-serif"
                                  }}>
                              ADENTA · GHANA
                            </span>

                            {/* Plate number */}
                            <span className="font-mono font-black whitespace-nowrap uppercase leading-none"
                                  style={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: "clamp(16px, 5vw, 24px)",
                                    letterSpacing: "4px",
                                    color: activePlate.category === "Government"
                                      ? "#ffffff"
                                      : activePlate.category === "Equipment"
                                      ? "#1b8a3e"
                                      : "#1e293b",
                                    textShadow: activePlate.category === "Government"
                                      ? "2px 2px 2px rgba(0,0,0,0.5)"
                                      : "1.5px 1.5px 1px rgba(255,255,255,0.9), -1px -1px 0 rgba(0,0,0,0.45)"
                                  }}>
                              {activePlate.id}
                            </span>

                            {/* Category sub-label */}
                            <span className="text-[7px] font-bold uppercase tracking-[0.18em] mt-0.5"
                                  style={{
                                    color: activePlate.category === "Government" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.32)",
                                    fontFamily: "system-ui, sans-serif"
                                  }}>
                              {activePlate.category} · {activePlate.zone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bolt indicators below plate */}
                      <div className="flex justify-between px-4 max-w-[340px] mx-auto">
                        {[0, 1].map(i => (
                          <div key={i} className="w-4 h-4 rounded-full border-2 border-[#94a3b8] flex items-center justify-center"
                               style={{ background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Plate Properties */}
                  <div className="space-y-4 pt-4 border-t border-[#f0f4f8]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#9aa3be]">Owner &amp; Vehicle Specs</h4>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Registered Owners ({activePlate.owners.length})</p>
                        <div className="space-y-2">
                          {activePlate.owners.map((owner, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg border border-[#e8edf5] bg-[#f8faff] shadow-sm">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-bold text-[#1a2e05]">{owner.name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  owner.role === "Primary" 
                                    ? "bg-[#81B71A]/10 text-[#3d6b08] border border-[#81B71A]/20" 
                                    : "bg-blue-50 text-blue-700 border border-blue-100"
                                }`}>
                                  {owner.role}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#6b7a99] font-semibold flex items-center gap-1">
                                <span className="opacity-75">✉️</span> {owner.email}
                              </p>
                              {owner.phone && (
                                <p className="text-[10px] text-[#6b7a99] font-semibold flex items-center gap-1 mt-0.5">
                                  <span className="opacity-75">📞</span> {owner.phone}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Vehicle Details</p>
                        <p className="text-sm font-bold text-[#1a2e05]">{activePlate.vehicle}</p>
                        <p className="text-[11px] font-mono text-[#6b7a99] mt-1 bg-[#f8faff] p-1.5 rounded border border-[#e2e8f0]">Chassis: {activePlate.chassis}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Zone</p>
                          <p className="text-xs font-bold text-[#374167] mt-0.5">{activePlate.zone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Category</p>
                          <p className="text-xs font-bold text-[#374167] mt-0.5">{activePlate.category}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Issue Date</p>
                          <p className="text-xs font-bold text-[#374167] mt-0.5">{activePlate.date}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Status</p>
                          <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                                style={{
                                  background: activePlate.status === "Active" ? "rgba(129,183,26,0.09)" : "rgba(239,68,68,0.09)",
                                  color: activePlate.status === "Active" ? "#3d6b08" : "#991b1b",
                                  borderColor: activePlate.status === "Active" ? "rgba(129,183,26,0.22)" : "rgba(239,68,68,0.22)"
                                }}>
                            {activePlate.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-[#f0f4f8]">
                    <button className="flex-1 py-2.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold text-[#374167] cursor-pointer">
                      Edit Record
                    </button>
                    <button className="flex-1 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold text-red-700 border border-red-200 cursor-pointer">
                      Suspend Plate
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-sm text-[#9aa3be]">
                  Select a vehicle plate from the registry list to view detailed specifications.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── Reservations Metrics Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Active Reservations",
                val: reservations.length,
                sub: "Registered blocks & vanity plates",
                accent: "#3b82f6",
                bg: "rgba(59,130,246,0.09)",
                icon: PlateIcon
              },
              {
                label: "Blocked Numbers Pool",
                val: reservations.reduce((sum, r) => r.status !== "Expired" ? sum + r.totalCount : sum, 0).toLocaleString(),
                sub: "Held pool numbers protected",
                accent: "#81B71A",
                bg: "rgba(129,183,26,0.09)",
                icon: ActiveIcon
              },
              {
                label: "Claimed Fleet Units",
                val: reservations.reduce((sum, r) => r.status !== "Expired" ? sum + r.claimedCount : sum, 0).toLocaleString(),
                sub: "Allocated fleet slots",
                accent: "#10b981",
                bg: "rgba(16,185,129,0.09)",
                icon: PrivateIcon
              },
              {
                label: "Pending Expiry Warnings",
                val: reservations.filter((r) => r.status === "Alert").length,
                sub: "Blocks expiring within 30 days",
                accent: "#f59e0b",
                bg: "rgba(245,158,11,0.09)",
                icon: CommercialIcon
              }
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-[#e8edf5] relative overflow-hidden"
                style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.055)", padding: "1.2rem 1.25rem 1rem" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: m.accent }} />
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: m.bg, color: m.accent }}>
                    <m.icon />
                  </div>
                </div>
                <p className="font-bold tracking-tight text-[#1a2e05]" style={{ fontSize: "1.65rem", lineHeight: 1 }}>{m.val}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "#6b7a99" }}>{m.label}</p>
                <p className="text-[10px] mt-2.5 pt-2.5 border-t border-[#f0f3f8]" style={{ color: "#b0bbd6" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Reservations Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Active Blocks Ledger */}
            <div className="xl:col-span-2 space-y-4">
              
              {/* Search & Filter Panel for Reservations */}
              <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#1a2e05] text-sm uppercase tracking-wider">Reserved Blocks Registry</h3>
                    <p className="text-xs text-[#6b7a99] mt-0.5">Real-time locks integrated into Booking Desk validation.</p>
                  </div>
                  {!showAddRes && (
                    <button
                      onClick={() => setShowAddRes(true)}
                      className="px-4 py-2.5 bg-[#81B71A] hover:bg-[#81B71A]/90 text-white rounded-xl text-xs font-bold transition hover:scale-[1.02] shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <span>🛡️</span> Secure New Block
                    </button>
                  )}
                </div>
                
                {/* Search Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#f0f4f8]">
                  <div>
                    <input
                      type="text"
                      placeholder="Search holder, document or range..."
                      value={resSearchQuery}
                      onChange={(e) => setResSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-medium"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={selectedResType}
                      onChange={(e) => setSelectedResType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-bold"
                    >
                      <option value="All">All Allocation Types</option>
                      <option value="Range">Range Block Only</option>
                      <option value="Single">Premium Vanity Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <select
                      value={selectedResStatus}
                      onChange={(e) => setSelectedResStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-bold"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Alert">Near Expiry (Alert)</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                        {[
                          "Plate Preview",
                          "Reservation Holder",
                          "Allocation Scope",
                          "Authority Doc",
                          "Utilization",
                          "Release Action"
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#9aa3be] whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f3f8]">
                      {filteredReservations.length > 0 ? (
                        filteredReservations.map((res) => {
                          const progress = res.totalCount > 0 ? Math.round((res.claimedCount / res.totalCount) * 100) : 0;
                          const isRange = res.type === "Range";
                          
                          // Subtle border accent based on status
                          const accentClass = 
                            res.status === "Alert" 
                              ? "border-l-4 border-l-[#f59e0b]" 
                              : res.status === "Expired" 
                              ? "border-l-4 border-l-[#ef4444]" 
                              : "border-l-4 border-l-[#81B71A]";

                          return (
                            <tr
                              key={res.id}
                              className={`transition-colors hover:bg-[#f8faff] ${accentClass}`}
                            >
                              {/* 1. Miniature Plate Preview */}
                              <td className="px-5 py-4 whitespace-nowrap shrink-0">
                                <div className="flex items-center justify-start">
                                  <MiniPlateBadge 
                                    type={res.type}
                                    platePattern={res.platePattern}
                                    prefix={res.prefix}
                                    rangeStart={res.rangeStart}
                                    rangeEnd={res.rangeEnd}
                                    year={res.year}
                                  />
                                </div>
                              </td>

                              {/* 2. Holder & Badges */}
                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className="font-extrabold text-xs text-[#1a2e05] tracking-tight leading-snug block min-w-[140px] max-w-[200px]">
                                    {res.holder}
                                  </span>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                      isRange 
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" 
                                        : "bg-blue-50 text-blue-700 border border-blue-100/50"
                                    }`}>
                                      {isRange ? "Range Block" : "Premium Vanity"}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                                      res.status === "Active" 
                                        ? "bg-[#81B71A]/10 text-[#3d6b08] border-[#81B71A]/20" 
                                        : res.status === "Alert" 
                                        ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-extrabold" 
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}>
                                      {res.status === "Alert" ? "⚠️ Alert" : res.status}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Scope & Count */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-xs font-black text-[#2d5009] bg-[#81B71A]/10 px-2 py-0.5 rounded border border-[#81B71A]/20 inline-block w-fit">
                                    {isRange 
                                      ? `${res.prefix} ${res.rangeStart}-${res.rangeEnd}`
                                      : res.platePattern
                                    }
                                  </span>
                                  <span className="text-[10px] text-[#6b7a99] font-medium block">
                                    ({res.totalCount} {res.totalCount === 1 ? 'number' : 'numbers'} secured)
                                  </span>
                                </div>
                              </td>

                              {/* 4. Authority Document */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
                                    📄 {res.authRef}
                                  </span>
                                  <span className="text-[10px] text-[#6b7a99] font-semibold block mt-0.5 flex items-center gap-1">
                                    <span className="opacity-75">📅</span> exp: {res.expiryDate}
                                  </span>
                                </div>
                              </td>

                              {/* 5. Utilization Progress */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="w-[120px] flex flex-col gap-1">
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-[#6b7a99] uppercase tracking-wider">Claims</span>
                                    <span className="text-[#1a2e05]">{progress}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500" 
                                      style={{ 
                                        width: `${progress}%`,
                                        background: res.status === 'Alert' 
                                          ? "linear-gradient(90deg, #f59e0b, #d97706)" 
                                          : res.status === 'Expired'
                                          ? "linear-gradient(90deg, #ef4444, #b91c1c)"
                                          : "linear-gradient(90deg, #81B71A, #4a7c10)" 
                                      }} 
                                    />
                                  </div>
                                  <span className="text-[9px] text-[#6b7a99] font-bold block mt-0.5">
                                    {res.claimedCount} / {res.totalCount} Filed
                                  </span>
                                </div>
                              </td>

                              {/* 6. Release & Quick-Book Action */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {res.status !== "Expired" ? (
                                    <a
                                      href={`/dashboard/booking?prefill=1&type=${res.type}&prefix=${res.prefix}&year=${res.year}&holder=${encodeURIComponent(res.holder)}&platePattern=${encodeURIComponent(res.platePattern || '')}&rangeStart=${res.rangeStart || ''}&rangeEnd=${res.rangeEnd || ''}`}
                                      className="px-2.5 py-1.5 rounded-lg bg-[#81B71A] hover:bg-[#81B71A]/90 text-white text-[10px] font-bold shadow-sm transition hover:scale-[1.02] flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>✍️</span> Book
                                    </a>
                                  ) : (
                                    <button
                                      disabled
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold border border-slate-200 cursor-not-allowed flex items-center gap-1"
                                    >
                                      <span>🔒</span> Expired
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => {
                                      const updated = reservations.filter((r) => r.id !== res.id);
                                      updateReservations(updated);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-[10px] font-bold border border-rose-200 transition cursor-pointer flex items-center gap-1"
                                    title="Release reservation block and return slots to public pool"
                                  >
                                    <span>🗑️</span> Release
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-sm font-semibold text-[#9aa3be]">
                            No plate reservations found matching these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Reservation form or audit guide */}
            <div className="xl:col-span-1">
              {showAddRes ? (
                <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                    <h3 className="font-extrabold text-[#1a2e05] text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <span>🛡️</span> Secure Reservation
                    </h3>
                    <button
                      onClick={() => setShowAddRes(false)}
                      className="text-xs font-bold text-[#64748b] hover:text-[#1a2e05] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleAddReservation} className="space-y-4">
                    {/* Toggle Reservation Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#9aa3be] uppercase font-bold">Allocation Type</label>
                      <div className="grid grid-cols-2 gap-2 bg-[#f8faff] p-1.5 rounded-lg border border-[#e2e8f0]">
                        <button
                          type="button"
                          onClick={() => setResType("Range")}
                          className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            resType === "Range" ? "bg-white text-[#3d6b08] shadow-sm" : "text-[#64748b]"
                          }`}
                        >
                          Range Block
                        </button>
                        <button
                          type="button"
                          onClick={() => setResType("Single")}
                          className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            resType === "Single" ? "bg-white text-[#3d6b08] shadow-sm" : "text-[#64748b]"
                          }`}
                        >
                          Single Plate
                        </button>
                      </div>
                    </div>

                    {/* Holder and Auth Ref */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Holder/Requesting Entity</label>
                        <input
                          type="text"
                          required
                          value={resHolder}
                          onChange={(e) => setResHolder(e.target.value)}
                          placeholder="e.g. State House VIP Fleet, Police Service"
                          className="w-full px-3.5 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#1a2e05] focus:ring-2 focus:ring-[#81B71A]/30 focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Authority Document Ref</label>
                        <input
                          type="text"
                          required
                          value={resAuthRef}
                          onChange={(e) => setResAuthRef(e.target.value)}
                          placeholder="e.g. DVLA-HQ-RES-9022"
                          className="w-full px-3.5 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#1a2e05] focus:ring-2 focus:ring-[#81B71A]/30 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Dynamic Range / Plate fields */}
                    {resType === "Single" ? (
                      <div>
                        <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Premium Plate ID</label>
                        <input
                          type="text"
                          required
                          value={resPlate}
                          onChange={(e) => setResPlate(e.target.value)}
                          placeholder="e.g. AD 1111-26"
                          className="w-full px-3.5 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs font-mono font-bold text-[#1a2e05] uppercase focus:ring-2 focus:ring-[#81B71A]/30 focus:outline-none transition"
                        />
                        <p className="text-[9px] text-[#9aa3be] mt-1">Must use branch prefix AD followed by 4 digits and year (e.g. AD 1111-26)</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Prefix</label>
                            <input
                              type="text"
                              disabled
                              value={resPrefix}
                              className="w-full px-3.5 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg text-xs font-mono font-bold text-[#64748b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Year</label>
                            <input
                              type="text"
                              required
                              value={resYear}
                              onChange={(e) => setResYear(e.target.value)}
                              placeholder="26"
                              maxLength={2}
                              className="w-full px-3.5 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs font-mono font-bold text-[#1a2e05] focus:ring-2 focus:ring-[#81B71A]/30 focus:outline-none transition"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Range Start</label>
                            <input
                              type="number"
                              required
                              value={resRangeStart}
                              onChange={(e) => setResRangeStart(e.target.value)}
                              placeholder="e.g. 9000"
                              className="w-full px-3.5 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs font-mono font-semibold text-[#1a2e05] focus:ring-2 focus:ring-[#81B71A]/30 focus:outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Range End</label>
                            <input
                              type="number"
                              required
                              value={resRangeEnd}
                              onChange={(e) => setResRangeEnd(e.target.value)}
                              placeholder="e.g. 9099"
                              className="w-full px-3.5 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs font-mono font-semibold text-[#1a2e05] focus:ring-2 focus:ring-[#81B71A]/30 focus:outline-none transition"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    <div>
                      <label className="text-[10px] text-[#9aa3be] uppercase font-bold block mb-1">Block Duration</label>
                      <select
                        value={resDuration}
                        onChange={(e) => setResDuration(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#1a2e05] focus:ring-2 focus:ring-[#81B71A]/30 focus:outline-none transition"
                      >
                        <option value="6 Months">6 Months</option>
                        <option value="1 Year">1 Year</option>
                        <option value="2 Years">2 Years (Standard)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-[#81B71A] hover:bg-[#81B71A]/90 text-white text-xs font-bold transition hover:scale-[1.02] shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <span>🛡️</span> Lock &amp; Issue Reservation
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-[#e8edf5] shadow-md space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#f1f5f9] pb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#81B71A]/10 flex items-center justify-center text-[#3d6b08]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <h3 className="font-extrabold text-[#1a2e05] text-xs uppercase tracking-wider">
                      DVLA Compliance Protocol
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Card 1: Accidental Issuance Protection */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white hover:from-white hover:to-slate-50/50 hover:shadow-md hover:border-[#81B71A]/20 hover:scale-[1.01] transition-all duration-200 group flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#81B71A]/10 text-[#3d6b08] group-hover:bg-[#81B71A]/20 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 11 2 2 4-4" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#1a2e05] group-hover:text-[#3d6b08] transition-colors">
                          Accidental Issuance Protection
                        </h4>
                        <p className="text-[10px] text-[#6b7a99] leading-relaxed">
                          The filing desk dynamically checks plate entries against active range blocklists. It issues high-visibility warning notices with executive reference codes upon conflict, preventing accidental public assignments without blocking the user.
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Frictionless Utilization Sync */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white hover:from-white hover:to-slate-50/50 hover:shadow-md hover:border-blue-500/20 hover:scale-[1.01] transition-all duration-200 group flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 5c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z" />
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#1a2e05] group-hover:text-blue-600 transition-colors">
                          Frictionless Utilization Sync
                        </h4>
                        <p className="text-[10px] text-[#6b7a99] leading-relaxed">
                          Filing matches auto-links the issued plate to its reservation pool, incrementing block utilization metrics in real-time. Administrative locks, supervisor override gates, and bypass PIN entry requirements are removed.
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Hold Lifecycle & Autorelease */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white hover:from-white hover:to-slate-50/50 hover:shadow-md hover:border-amber-500/20 hover:scale-[1.01] transition-all duration-200 group flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                          <path d="M12 2a10 10 0 0 1 6 18" strokeWidth="3" opacity="0.15" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#1a2e05] group-hover:text-amber-600 transition-colors">
                          Hold Lifecycle &amp; Autorelease
                        </h4>
                        <p className="text-[10px] text-[#6b7a99] leading-relaxed">
                          All block holds expire after a standard 2-year duration. The database transitions records to an amber <strong>"Alert"</strong> status 30 days prior to expiry, prompting administrators to renew holds before automatic release.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddRes(true)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#374167] text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer mt-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Secure New Block Hold
                  </button>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}

/* ── SVGs and Stat icons ── */
function PlateIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth={2.5} />
    </svg>
  );
}
function PrivateIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function CommercialIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ActiveIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

