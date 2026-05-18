"use client";

import { useState } from "react";

// Mock database of inventory production batches
const BATCHES_DB = [
  { id: "BAT-2026-042", category: "Private", qty: 2500, region: "Greater Accra", status: "Delivered", date: "15 May 2026" },
  { id: "BAT-2026-043", category: "Commercial", qty: 1500, region: "Ashanti", status: "Shipped", date: "16 May 2026" },
  { id: "BAT-2026-044", category: "Government", qty: 500, region: "Greater Accra", status: "In Production", date: "18 May 2026" },
  { id: "BAT-2026-045", category: "Private", qty: 1000, region: "Western", status: "In Production", date: "18 May 2026" },
  { id: "BAT-2026-046", category: "Equipment", qty: 300, region: "Central", status: "Pending Approval", date: "18 May 2026" },
];

export default function PlatesInventoryPage() {
  const [batches, setBatches] = useState(BATCHES_DB);
  const [orderCategory, setOrderCategory] = useState("Private");
  const [orderQty, setOrderQty] = useState(1000);
  const [orderRegion, setOrderRegion] = useState("Greater Accra");
  const [ordering, setOrdering] = useState(false);

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setOrdering(true);
    setTimeout(() => {
      const newBatch = {
        id: `BAT-2026-0${batches.length + 42}`,
        category: orderCategory,
        qty: Number(orderQty),
        region: orderRegion,
        status: "Pending Approval",
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      };
      setBatches([newBatch, ...batches]);
      setOrdering(false);
      alert("New production batch request submitted successfully!");
    }, 1200);
  };

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
              Plate Inventory &amp; Production
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Track aluminum license plate blanks, schedule embossing queues, and dispatch regional batches.
            </p>
          </div>
        </div>
      </div>

      {/* ── Inventory KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Aluminum Blanks Stock", val: "84,291", sub: "Healthy reserves (Raw metal)", accent: "#81B71A", bg: "rgba(129,183,26,0.09)", icon: MetalIcon },
          { label: "Embossed This Week", val: "8,349", sub: "Across all regional centers", accent: "#3b82f6", bg: "rgba(59,130,246,0.09)", icon: EmbossIcon },
          { label: "In Production", val: "1,500", sub: "Active embossing presses", accent: "#f59e0b", bg: "rgba(245,158,11,0.09)", icon: ProductionIcon },
          { label: "Defective / Scrapped", val: "0.14%", sub: "Well below 1.5% threshold", accent: "#ef4444", bg: "rgba(239,68,68,0.09)", icon: TrashIcon },
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
        {/* Active Production Batches */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm">
            <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider mb-4">Active Production Batches</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                    {["Batch ID", "Category", "Quantity", "Regional Center", "Status", "Order Date"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#9aa3be] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f3f8]">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f8faff] transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#2d5009] whitespace-nowrap">{b.id}</td>
                      <td className="px-4 py-3.5 text-xs text-[#6b7a99] font-medium whitespace-nowrap">{b.category}</td>
                      <td className="px-4 py-3.5 font-bold text-[#374167] whitespace-nowrap">{b.qty.toLocaleString()} pcs</td>
                      <td className="px-4 py-3.5 text-xs text-[#374167] font-semibold whitespace-nowrap">{b.region}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                          style={{
                            background:
                              b.status === "Delivered"
                                ? "rgba(129,183,26,0.09)"
                                : b.status === "Shipped"
                                ? "rgba(59,130,246,0.09)"
                                : b.status === "In Production"
                                ? "rgba(245,158,11,0.09)"
                                : "rgba(148,163,184,0.09)",
                            color:
                              b.status === "Delivered"
                                ? "#3d6b08"
                                : b.status === "Shipped"
                                ? "#1d4ed8"
                                : b.status === "In Production"
                                ? "#b45309"
                                : "#475569",
                            borderColor:
                              b.status === "Delivered"
                                ? "rgba(129,183,26,0.22)"
                                : b.status === "Shipped"
                                ? "rgba(59,130,246,0.22)"
                                : b.status === "In Production"
                                ? "rgba(245,158,11,0.22)"
                                : "rgba(148,163,184,0.22)",
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#9aa3be] font-medium whitespace-nowrap">{b.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Start Production Form */}
        <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-5">
          <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider">Trigger Production</h3>
          
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                Plate Category
              </label>
              <select
                value={orderCategory}
                onChange={(e) => setOrderCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-semibold"
              >
                <option value="Private">Private (White Background)</option>
                <option value="Commercial">Commercial (Yellow Background)</option>
                <option value="Government">Government (Government Seal)</option>
                <option value="Equipment">Equipment (Specialized)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                Quantity (pcs)
              </label>
              <input
                type="number"
                min={100}
                max={50000}
                step={100}
                value={orderQty}
                onChange={(e) => setOrderQty(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm font-bold text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition"
              />
              <p className="text-[10px] text-[#9aa3be] mt-1.5 font-medium">Minimum batch sizing: 100 blanks</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                Target Regional Center
              </label>
              <select
                value={orderRegion}
                onChange={(e) => setOrderRegion(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-semibold"
              >
                <option value="Greater Accra">Greater Accra (37 Office)</option>
                <option value="Ashanti">Ashanti (Kumasi Office)</option>
                <option value="Western">Western (Takoradi Office)</option>
                <option value="Eastern">Eastern (Koforidua Office)</option>
                <option value="Northern">Northern (Tamale Office)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={ordering}
                className="w-full py-3 rounded-xl bg-[#81B71A] hover:bg-[#6a9a15] text-white font-bold text-sm tracking-wide shadow-lg transition duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {ordering ? "Starting Queue..." : "Initiate Embossing Queue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── KPI Stat SVGs ── */
function MetalIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M21 9H3M21 15H3" />
    </svg>
  );
}
function EmbossIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><circle cx="12" cy="12" r="4" />
    </svg>
  );
}
function ProductionIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
