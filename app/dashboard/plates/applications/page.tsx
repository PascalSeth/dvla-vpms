"use client";

import { useState } from "react";

// Mock database of pending applications
const APPLICATIONS_DB = [
  { id: "APP-2026-9081", name: "Kofi Annan", proposed: "GR 7777-26", category: "Private", region: "Greater Accra", date: "18 May 2026", email: "kofi.annan@gmail.com", status: "Pending" },
  { id: "APP-2026-9079", name: "Gifty Mensah", proposed: "GIFTY 1", category: "Private", region: "Ashanti", date: "17 May 2026", email: "gifty.m@mensahgroup.com", status: "Pending" },
  { id: "APP-2026-9064", name: "Ghana Water Co.", proposed: "GV 301-26", category: "Government", region: "Western", date: "16 May 2026", email: "fleet@gwc.com.gh", status: "Pending" },
  { id: "APP-2026-9051", name: "Ebenezer Lartey", proposed: "GW 9821-26", category: "Commercial", region: "Greater Accra", date: "15 May 2026", email: "ebenezer.l@gmail.com", status: "Pending" },
];

export default function PlateApplicationsPage() {
  const [apps, setApps] = useState(APPLICATIONS_DB);
  const [selectedApp, setSelectedApp] = useState<typeof APPLICATIONS_DB[0] | null>(APPLICATIONS_DB[0]);
  const [filterCategory, setFilterCategory] = useState("All");

  const handleApprove = (id: string) => {
    setApps(apps.map(app => app.id === id ? { ...app, status: "Approved" } : app));
    if (selectedApp?.id === id) {
      setSelectedApp({ ...selectedApp, status: "Approved" });
    }
  };

  const handleReject = (id: string) => {
    setApps(apps.map(app => app.id === id ? { ...app, status: "Rejected" } : app));
    if (selectedApp?.id === id) {
      setSelectedApp({ ...selectedApp, status: "Rejected" });
    }
  };

  const filteredApps = apps.filter(app => {
    return filterCategory === "All" || app.category === filterCategory;
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
              Plate Applications Registry
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Review, approve, or reject proposed standard and personalized vehicle plate applications.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Widgets ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Awaiting Review", val: apps.filter(a => a.status === "Pending").length, sub: "Requires supervisor sign-off", accent: "#f59e0b", bg: "rgba(245,158,11,0.09)", icon: ClockIcon },
          { label: "Approved Today", val: apps.filter(a => a.status === "Approved").length + 42, sub: "Successfully registry-synced", accent: "#81B71A", bg: "rgba(129,183,26,0.09)", icon: CheckIcon },
          { label: "Rejected / Flagged", val: apps.filter(a => a.status === "Rejected").length + 3, sub: "Duplications or inappropriate", accent: "#ef4444", bg: "rgba(239,68,68,0.09)", icon: XIcon },
          { label: "Avg. Processing Time", val: "12 mins", sub: "Fast track active", accent: "#3b82f6", bg: "rgba(59,130,246,0.09)", icon: ZapIcon },
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Applications Directory */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#e8edf5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#1a2e05]">Filter Applications</h3>
            <div className="flex flex-wrap gap-2">
              {["All", "Private", "Commercial", "Government"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition hover:scale-[1.03] duration-150 cursor-pointer"
                  style={{
                    background: filterCategory === cat ? "rgba(129,183,26,0.12)" : "#f8faff",
                    color: filterCategory === cat ? "#3d6b08" : "#6b7a99",
                    border: filterCategory === cat ? "1px solid rgba(129,183,26,0.25)" : "1px solid #e2e8f0"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e8edf5] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                    {["App ID", "Applicant", "Proposed Plate", "Region", "Category", "Status"].map((h) => (
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
                  {filteredApps.map((a) => {
                    const isActive = selectedApp?.id === a.id;
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedApp(a)}
                        className={`cursor-pointer transition-colors ${
                          isActive ? "bg-[#81B71A]/5 hover:bg-[#81B71A]/10" : "hover:bg-[#f8faff]"
                        }`}
                      >
                        <td className="px-5 py-4 font-mono text-xs font-bold text-[#2d5009] whitespace-nowrap">{a.id}</td>
                        <td className="px-5 py-4 font-semibold text-[#374167] whitespace-nowrap">{a.name}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold tracking-wide px-2 py-1 rounded border border-slate-300 bg-[#fafafa]">
                            {a.proposed}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#6b7a99] font-medium whitespace-nowrap">{a.region}</td>
                        <td className="px-5 py-4 text-xs text-[#6b7a99] font-medium whitespace-nowrap">{a.category}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                            style={{
                              background:
                                a.status === "Approved"
                                  ? "rgba(129,183,26,0.09)"
                                  : a.status === "Pending"
                                  ? "rgba(245,158,11,0.09)"
                                  : "rgba(239,68,68,0.09)",
                              color:
                                a.status === "Approved"
                                  ? "#3d6b08"
                                  : a.status === "Pending"
                                  ? "#92610a"
                                  : "#991b1b",
                              borderColor:
                                a.status === "Approved"
                                  ? "rgba(129,183,26,0.22)"
                                  : a.status === "Pending"
                                  ? "rgba(245,158,11,0.22)"
                                  : "rgba(239,68,68,0.22)"
                            }}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Application Details Sheet */}
        <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-6">
          {selectedApp ? (
            <>
              <div>
                <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider mb-4">Proposed Design</h3>
                
                {/* Ghanaian License Plate Visual Container */}
                <div className="relative w-full max-w-[340px] mx-auto aspect-[4.2/1] rounded-xl border-[4px] border-slate-900 p-1 shadow-2xl overflow-hidden select-none flex items-center"
                     style={{
                       background: selectedApp.category === "Commercial" 
                         ? "linear-gradient(180deg, #ffe066 0%, #fcc419 60%, #fab005 100%)" 
                         : selectedApp.category === "Government"
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
                    {/* Security Hologram */}
                    <div className="absolute right-3 top-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 opacity-60 flex items-center justify-center"
                         style={{ boxShadow: "0 0 5px rgba(245,158,11,0.6)", border: "0.5px solid rgba(255,255,255,0.2)" }}>
                      <span className="text-[5px] font-black text-amber-950 select-none tracking-tighter">DVLA</span>
                    </div>

                    <span className="font-mono text-[20px] md:text-[22px] font-black tracking-wide whitespace-nowrap uppercase"
                          style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            letterSpacing: "3px",
                            color: selectedApp.category === "Government"
                              ? "#ffffff"
                              : selectedApp.category === "Equipment"
                              ? "#1b8a3e"
                              : "#1e293b",
                            textShadow: selectedApp.category === "Government"
                              ? "2px 2px 2px rgba(0,0,0,0.5), -1px -1px 0px rgba(0,0,0,0.3)"
                              : "1.5px 1.5px 1px rgba(255,255,255,0.8), -1.5px -1.5px 1px rgba(0,0,0,0.5)"
                          }}>
                      {selectedApp.proposed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-4 pt-4 border-t border-[#f0f4f8]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9aa3be]">Applicant &amp; Review Specs</h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Applicant Name</p>
                    <p className="text-sm font-bold text-[#1a2e05]">{selectedApp.name}</p>
                    <p className="text-xs text-[#6b7a99] font-medium">{selectedApp.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Proposed Region</p>
                      <p className="text-xs font-bold text-[#374167] mt-0.5">{selectedApp.region}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Category Type</p>
                      <p className="text-xs font-bold text-[#374167] mt-0.5">{selectedApp.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Application Date</p>
                      <p className="text-xs font-bold text-[#374167] mt-0.5">{selectedApp.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9aa3be] uppercase font-bold">Current Status</p>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                            style={{
                              background: selectedApp.status === "Approved" 
                                ? "rgba(129,183,26,0.09)" 
                                : selectedApp.status === "Pending" 
                                ? "rgba(245,158,11,0.09)" 
                                : "rgba(239,68,68,0.09)",
                              color: selectedApp.status === "Approved" 
                                ? "#3d6b08" 
                                : selectedApp.status === "Pending" 
                                ? "#92610a" 
                                : "#991b1b",
                              borderColor: selectedApp.status === "Approved" 
                                ? "rgba(129,183,26,0.22)" 
                                : selectedApp.status === "Pending" 
                                ? "rgba(245,158,11,0.22)" 
                                : "rgba(239,68,68,0.22)"
                            }}>
                        {selectedApp.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              {selectedApp.status === "Pending" ? (
                <div className="flex gap-2 pt-4 border-t border-[#f0f4f8]">
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    className="flex-1 py-2.5 rounded-lg border border-red-200 hover:bg-red-50 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold text-red-600 cursor-pointer"
                  >
                    Reject Proposed
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 py-2.5 rounded-lg bg-[#81B71A] hover:bg-[#6a9a15] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold text-white shadow-lg cursor-pointer"
                  >
                    Approve &amp; Issue
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#f0f4f8] text-center text-xs font-semibold text-[#9aa3be]">
                  This application has already been processed as <strong className="uppercase">{selectedApp.status}</strong>.
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-sm text-[#9aa3be]">
              Select a pending application from the registry list to review details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── SVGs and Icon Components ── */
function ClockIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
