"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

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
      triggerToast(`🏭 Batch ${newBatch.id} (${newBatch.qty.toLocaleString()} pcs) queued for ${orderRegion}!`);
    }, 800);
  };

  const filteredBatches = batches.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || b.id.toLowerCase().includes(q) || b.region.toLowerCase().includes(q);
    const matchesCat = categoryFilter === "All" || b.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalBlanksInProduction = batches
    .filter(b => b.status === "In Production" || b.status === "Pending Approval")
    .reduce((acc, b) => acc + b.qty, 0);

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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Manufacturing &amp; Regional Logistics
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Press Lines Operational
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Plate Inventory &amp; Production Queue
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Track raw aluminum plate blanks, schedule regional embossing press jobs, and monitor dispatch batches across Ghana.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => triggerToast("📊 Aluminum stock inventory report compiled")}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export Stock Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Inventory KPI Metric Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            label: "Aluminum Blanks Stock",
            val: "84,291 pcs",
            sub: "Raw metal inventory reserve",
            dot: "bg-emerald-500",
            badge: "Sufficient (+45d)",
            badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
          },
          {
            label: "Embossed This Week",
            val: "8,349 pcs",
            sub: "Across all regional plants",
            dot: "bg-blue-500",
            badge: "98.2% on schedule",
            badgeBg: "bg-blue-50 text-blue-700 border-blue-200/60"
          },
          {
            label: "In Active Queue",
            val: `${totalBlanksInProduction.toLocaleString()} pcs`,
            sub: "Active stamping & embossing",
            dot: "bg-amber-500",
            badge: "Active Presses",
            badgeBg: "bg-amber-50 text-amber-800 border-amber-200/60"
          },
          {
            label: "Scrap / Reject Rate",
            val: "0.14%",
            sub: "Below 1.5% maximum tolerance",
            dot: "bg-[#81B71A]",
            badge: "Optimal Yield",
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

      {/* ── Main Production Section: Left Batches Table & Right Form ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        
        {/* Left 2 Columns: Production Batches Table */}
        <div className="xl:col-span-2 space-y-3.5">
          {/* Table Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search batch ID or region..."
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

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Private">Private</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Government">Government</option>
                  <option value="Equipment">Equipment</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Production">In Production</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Pending Approval">Pending Approval</option>
                </select>
              </div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    {["Batch ID", "Category", "Quantity", "Regional Plant", "Status", "Queue Date"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                          {b.id}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            b.category === "Commercial"
                              ? "bg-amber-100/80 text-amber-900 border border-amber-200"
                              : b.category === "Government"
                              ? "bg-emerald-100/80 text-emerald-900 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {b.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {b.qty.toLocaleString()} pcs
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                          {b.region}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              b.status === "Delivered"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : b.status === "Shipped"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : b.status === "In Production"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              b.status === "Delivered"
                                ? "bg-emerald-500"
                                : b.status === "Shipped"
                                ? "bg-blue-500"
                                : b.status === "In Production"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-slate-400"
                            }`} />
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-medium whitespace-nowrap">
                          {b.date}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        No production batches found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Trigger Production Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4 sticky top-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Schedule Production Batch
            </h3>
            <p className="text-[11px] text-slate-500">Initiate automated blank stamping &amp; embossing</p>
          </div>
          
          <form onSubmit={handleCreateBatch} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Plate Category &amp; Film Type
              </label>
              <select
                value={orderCategory}
                onChange={(e) => setOrderCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition font-semibold"
              >
                <option value="Private">Private (White Retroreflective)</option>
                <option value="Commercial">Commercial (Yellow Retroreflective)</option>
                <option value="Government">Government (State Dark Green Seal)</option>
                <option value="Equipment">Specialized Equipment &amp; Trailer</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Blank Quantity (pcs)
                </label>
                <span className="text-[10px] text-slate-400">Min 100 blanks</span>
              </div>
              <input
                type="number"
                min={100}
                max={50000}
                step={100}
                value={orderQty}
                onChange={(e) => setOrderQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
              <div className="flex items-center gap-1.5 mt-1.5">
                {[500, 1000, 2500, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setOrderQty(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                      orderQty === preset
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    +{preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Destination Regional Center
              </label>
              <select
                value={orderRegion}
                onChange={(e) => setOrderRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition font-semibold"
              >
                <option value="Greater Accra">Greater Accra (37 Regional Depot)</option>
                <option value="Ashanti">Ashanti (Kumasi Center)</option>
                <option value="Western">Western (Takoradi Center)</option>
                <option value="Eastern">Eastern (Koforidua Depot)</option>
                <option value="Northern">Northern (Tamale Regional Depot)</option>
                <option value="Central">Central (Cape Coast Depot)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={ordering}
                className="w-full py-2.5 rounded-lg bg-[#81B71A] hover:bg-[#72a316] text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {ordering ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                    </svg>
                    <span>Dispatching to Presses...</span>
                  </>
                ) : (
                  <span>Initiate Embossing Queue</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
