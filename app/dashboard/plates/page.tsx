"use client";

import { useState } from "react";

// Mock database of registered plates
const PLATES_DB = [
  { 
    id: "GR 8812-24", 
    owners: [
      { name: "Kwame Asante", email: "kwame.asante@gmail.com", phone: "+233 24 456 7890", role: "Primary" },
      { name: "Akua Asante", email: "akua.asante@gmail.com", phone: "+233 20 987 6543", role: "Co-Owner" }
    ], 
    vehicle: "Toyota Land Cruiser (2024)", 
    region: "Greater Accra", 
    category: "Private", 
    status: "Active", 
    date: "18 May 2026", 
    chassis: "JTEBU5JR8P209871" 
  },
  { 
    id: "AS 3982-25", 
    owners: [
      { name: "Abena Mensah", email: "abena.m@yahoo.com", phone: "+233 50 123 4567", role: "Primary" },
      { name: "Kofi Mensah", email: "kofi.m@yahoo.com", phone: "+233 24 987 6543", role: "Co-Owner" }
    ], 
    vehicle: "Hyundai Elantra (2023)", 
    region: "Ashanti", 
    category: "Commercial", 
    status: "Active", 
    date: "12 Feb 2026", 
    chassis: "KMHDK41D7NU381920" 
  },
  { 
    id: "GV 928-26",  
    owners: [
      { name: "Ministry of Health", email: "transport@moh.gov.gh", phone: "+233 30 223 4455", role: "Primary" }
    ], 
    vehicle: "Nissan Patrol (2025)", 
    region: "Greater Accra", 
    category: "Government", 
    status: "Active", 
    date: "05 May 2026", 
    chassis: "JN1BYSY61U391823" 
  },
  { 
    id: "WR 8729-24", 
    owners: [
      { name: "Yaw Boateng", email: "yaw.b@boatenglogistics.com", phone: "+233 24 555 8899", role: "Primary" }
    ], 
    vehicle: "Mercedes-Benz C-Class (2022)", 
    region: "Western", 
    category: "Private", 
    status: "Expired", 
    date: "14 Nov 2024", 
    chassis: "WDDGF4HB0DA829103" 
  },
  { 
    id: "ER 1029-25", 
    owners: [
      { name: "Ama Owusu", email: "ama.owusu@outlook.com", phone: "+233 27 111 2233", role: "Primary" }
    ], 
    vehicle: "Toyota Hilux (2023)", 
    region: "Eastern", 
    category: "Private", 
    status: "Active", 
    date: "17 May 2026", 
    chassis: "AHTFR29G4K8102983" 
  },
  { 
    id: "NR 4819-26", 
    owners: [
      { name: "Kojo Darko", email: "k.darko@darkotransport.com", phone: "+233 24 333 4455", role: "Primary" }
    ], 
    vehicle: "DAF XF Truck (2021)", 
    region: "Northern", 
    category: "Commercial", 
    status: "Suspended", 
    date: "16 May 2026", 
    chassis: "XLRTE47M0E2918320" 
  },
  { 
    id: "VR 201-26",  
    owners: [
      { name: "Efua Adjei", email: "efua.adjei@live.com", phone: "+233 20 555 6677", role: "Primary" }
    ], 
    vehicle: "Kia Sportage (2024)", 
    region: "Volta", 
    category: "Private", 
    status: "Active", 
    date: "16 May 2026", 
    chassis: "KNDPM4AC8R7281923" 
  },
  { 
    id: "CR 9921-25", 
    owners: [
      { name: "Fiifi Antwi", email: "f.antwi@capecoastbuilders.com", phone: "+233 24 777 8899", role: "Primary" }
    ], 
    vehicle: "Caterpillar Excavator (2020)", 
    region: "Central", 
    category: "Equipment", 
    status: "Active", 
    date: "15 May 2026", 
    chassis: "CAT0320CCPH291823" 
  },
];

export default function PlatesSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activePlate, setActivePlate] = useState<typeof PLATES_DB[0] | null>(PLATES_DB[0]);

  // Filtering logic
  const filteredPlates = PLATES_DB.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owners.some((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = selectedRegion === "All" || p.region === selectedRegion;
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;

    return matchesSearch && matchesRegion && matchesCategory && matchesStatus;
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
                DVLA VEHICLE PLATE MANAGEMENT SYSTEM
              </p>
            </div>
            <h2 className="font-extrabold tracking-tight text-white text-2xl">
              Plate Registry &amp; Directory
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Query, manage, and verify all registered vehicle plates across Ghana.
            </p>
          </div>
          <button className="px-5 py-2.5 rounded-xl text-xs font-bold transition hover:scale-[1.03] duration-200 shrink-0 shadow-lg"
            style={{ background: "white", color: "#2d5009" }}>
            + Register New Plate
          </button>
        </div>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Plates", val: "24,839", sub: "Active across all regions", accent: "#81B71A", bg: "rgba(129,183,26,0.09)", icon: PlateIcon },
          { label: "Private Category", val: "13,240", sub: "53.2% market share", accent: "#3b82f6", bg: "rgba(59,130,246,0.09)", icon: PrivateIcon },
          { label: "Commercial Category", val: "6,820", sub: "Yellow license plates", accent: "#f59e0b", bg: "rgba(245,158,11,0.09)", icon: CommercialIcon },
          { label: "Active Rate", val: "98.4%", sub: "+1.2% this quarter", accent: "#10b981", bg: "rgba(16,185,129,0.09)", icon: ActiveIcon },
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
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-medium"
                >
                  <option value="All">All Regions</option>
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Ashanti">Ashanti</option>
                  <option value="Western">Western</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Northern">Northern</option>
                  <option value="Volta">Volta</option>
                  <option value="Central">Central</option>
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
                    {["Plate ID", "Owner", "Category", "Region", "Status", "Date"].map((h) => (
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
                          <td className="px-5 py-3.5 text-xs text-[#6b7a99] font-medium whitespace-nowrap">{p.region}</td>
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
                
                {/* Ghanaian License Plate Visual Container */}
                <div className="relative w-full max-w-[340px] mx-auto aspect-[4.2/1] rounded-xl border-[4px] border-slate-900 p-1 shadow-2xl overflow-hidden select-none flex items-center"
                     style={{
                       background: activePlate.category === "Commercial" 
                         ? "linear-gradient(180deg, #ffe066 0%, #fcc419 60%, #fab005 100%)" 
                         : activePlate.category === "Government"
                         ? "linear-gradient(180deg, #2f9e44 0%, #2b8a3e 60%, #1e702e 100%)"
                         : "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 60%, #dee2e6 100%)",
                       boxShadow: "0 15px 30px rgba(0,0,0,0.18), inset 0 3px 6px rgba(255,255,255,0.8), inset 0 -3px 6px rgba(0,0,0,0.2)"
                     }}>
                  
                  {/* Embossed inner rim */}
                  <div className="absolute inset-[2px] rounded-lg border border-slate-950/20 pointer-events-none" />

                  {/* Reflective light shine overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-white/40 z-10" />

                  {/* Ghana Flag / Left Strip */}
                  <div className="w-[12%] h-full shrink-0 flex flex-col items-center justify-between py-1 bg-[#0c3b87] rounded-l-[5px] relative overflow-hidden z-20"
                       style={{ boxShadow: "1px 0 3px rgba(0,0,0,0.15)" }}>
                    
                    {/* Tiny Ghana Flag */}
                    <div className="w-[85%] aspect-[3/2] flex flex-col rounded-sm overflow-hidden border border-white/10 shrink-0">
                      <div className="flex-1 bg-red-600"></div>
                      <div className="flex-1 bg-yellow-400 flex items-center justify-center relative">
                        <span className="absolute text-[5px] text-black leading-none -top-[2px]">★</span>
                      </div>
                      <div className="flex-1 bg-green-600"></div>
                    </div>
                    
                    {/* GH Letters */}
                    <span className="text-[10px] font-black text-white leading-none tracking-tighter">GH</span>
                  </div>

                  {/* Embossed Letter Content */}
                  <div className="flex-1 flex items-center justify-center px-3 relative h-full z-20">
                    {/* Security Watermark / Gold Holographic Logo */}
                    <div className="absolute right-3 top-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 opacity-60 flex items-center justify-center"
                         style={{ boxShadow: "0 0 5px rgba(245,158,11,0.6)", border: "0.5px solid rgba(255,255,255,0.2)" }}>
                      <span className="text-[5px] font-black text-amber-950 select-none tracking-tighter">DVLA</span>
                    </div>

                    <span className="font-mono text-[20px] md:text-[22px] font-black tracking-wide whitespace-nowrap uppercase"
                          style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            letterSpacing: "3px",
                            color: activePlate.category === "Government"
                              ? "#ffffff"
                              : activePlate.category === "Equipment"
                              ? "#1b8a3e"
                              : "#1e293b",
                            textShadow: activePlate.category === "Government"
                              ? "2px 2px 2px rgba(0,0,0,0.5), -1px -1px 0px rgba(0,0,0,0.3)"
                              : "1.5px 1.5px 1px rgba(255,255,255,0.8), -1.5px -1.5px 1px rgba(0,0,0,0.5)"
                          }}>
                      {activePlate.id}
                    </span>
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
                      <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Region</p>
                      <p className="text-xs font-bold text-[#374167] mt-0.5">{activePlate.region}</p>
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

