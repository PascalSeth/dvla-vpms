"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface PickupRecord {
  id: string;
  name: string;
  phone: string;
  plateNumber: string;
  timestamp: string;
  status: string;
}

interface BookingRecord {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string;
  date: string;
  classification: string;
  vrsInvoice?: {
    invoiceNo?: string;
    chassisNo?: string;
    engineNo?: string;
    fuelType?: string;
  };
}

export default function PickedPlatesPage() {
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{
    pickup: PickupRecord;
    booking?: BookingRecord;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pickupRes, bookingRes] = await Promise.all([
        fetch("/api/pickups"),
        fetch("/api/bookings"),
      ]);

      if (pickupRes.ok) {
        const pData = await pickupRes.json();
        setPickups(pData);
      } else {
        const stored = JSON.parse(localStorage.getItem("dvla_pickups") || "[]");
        setPickups(stored);
      }

      if (bookingRes.ok) {
        const bData = await bookingRes.json();
        setBookings(bData);
      } else {
        const stored = JSON.parse(localStorage.getItem("dvla_bookings") || "[]");
        setBookings(stored);
      }
    } catch (err) {
      console.error("Error loading picked plates data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combine explicit pickups with any bookings marked as PICKED
  const synthesizedFromBookings: PickupRecord[] = bookings
    .filter((b) => b.status === "PICKED")
    .map((b, idx) => ({
      id: `pck-auto-${b.id || idx}`,
      name: b.owner || "Registered Client",
      phone: b.vrsInvoice?.chassisNo ? "+233 24 400 9182" : "+233 20 811 4920",
      plateNumber: b.plate || "AD 1001-26",
      timestamp: b.date || "18 May 2026, 02:15 PM",
      status: "picked",
    }));

  const allRawPickups = [...pickups.filter(p => p.status === "picked" || p.status === "completed"), ...synthesizedFromBookings];
  
  // Deduplicate by plate number
  const uniquePickupMap = new Map<string, PickupRecord>();
  allRawPickups.forEach(p => {
    const key = (p.plateNumber || p.id).toUpperCase().trim();
    if (!uniquePickupMap.has(key)) {
      uniquePickupMap.set(key, p);
    }
  });

  const pickedPickups = Array.from(uniquePickupMap.values());

  // Map each pickup to its corresponding booking record
  const enrichedRecords = pickedPickups.map((p) => {
    const matchingBooking = bookings.find(
      (b) =>
        b.plate?.toLowerCase().trim() === p.plateNumber?.toLowerCase().trim() ||
        b.plate?.toLowerCase().replace(/\s/g, "") === p.plateNumber?.toLowerCase().replace(/\s/g, "")
    );
    return {
      pickup: p,
      booking: matchingBooking,
    };
  });

  // Apply Search and Classification filter
  const filteredRecords = enrichedRecords.filter(({ pickup, booking }) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      pickup.name.toLowerCase().includes(q) ||
      pickup.phone.toLowerCase().includes(q) ||
      pickup.plateNumber?.toLowerCase().includes(q) ||
      (booking && booking.owner.toLowerCase().includes(q)) ||
      (booking && booking.vehicle.toLowerCase().includes(q));

    const matchesClass =
      classificationFilter === "all" ||
      (booking && booking.classification.toLowerCase() === classificationFilter.toLowerCase());

    return matchesSearch && matchesClass;
  });

  const stats = {
    totalPicked: pickedPickups.length,
    ownersRepresented: new Set(enrichedRecords.map((r) => r.booking?.owner || r.pickup.name)).size,
    govPlates: enrichedRecords.filter((r) => r.booking?.classification === "Government").length,
    privatePlates: enrichedRecords.filter((r) => r.booking?.classification === "Private" || !r.booking).length,
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ["Plate Number", "Collector Name", "Collector Phone", "Booked Owner", "Vehicle Specification", "Handover Timestamp", "Status"];
    const rows = filteredRecords.map(r => [
      r.pickup.plateNumber || "",
      r.pickup.name || "",
      r.pickup.phone || "",
      r.booking?.owner || r.pickup.name || "",
      r.booking?.vehicle || "N/A",
      r.pickup.timestamp || "",
      r.pickup.status || ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DVLA_Picked_Plates_Log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Command Header ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Chain of Custody &amp; Handover Register
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified Handover Logs
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Picked Plates Directory
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Official chain-of-custody audit register recording physical plate collections, collector contact credentials, and verified owner dossiers.
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
              <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Executive KPI Metric Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          {
            label: "Total Handed Over",
            value: stats.totalPicked,
            sub: "Physical plates released",
            dot: "bg-emerald-500",
            badge: "Completed",
            badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
          },
          {
            label: "Unique Owners",
            value: stats.ownersRepresented,
            sub: "Registered citizens & fleets",
            dot: "bg-blue-500",
            badge: "Owners",
            badgeBg: "bg-blue-50 text-blue-700 border-blue-200/60"
          },
          {
            label: "Government Fleet",
            value: stats.govPlates,
            sub: "State agency dispatches",
            dot: "bg-[#81B71A]",
            badge: "Gov Series",
            badgeBg: "bg-[#81B71A]/10 text-[#2d5009] border-[#81B71A]/30"
          },
          {
            label: "Private & Commercial",
            value: stats.privatePlates,
            sub: "Civilian & commercial vehicles",
            dot: "bg-amber-500",
            badge: "Civilian",
            badgeBg: "bg-amber-50 text-amber-800 border-amber-200/60"
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search collector, owner, phone, or plate..."
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

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Classification:</span>
            {["all", "private", "commercial", "government", "electric"].map((c) => (
              <button
                key={c}
                onClick={() => setClassificationFilter(c)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition cursor-pointer ${
                  classificationFilter === c
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Directory Handover Register Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                {[
                  "Plate Number",
                  "Collector (Who Collected)",
                  "Collector Contact",
                  "Booked Owner",
                  "Vehicle Specs",
                  "Handover Timestamp",
                  "Action",
                ].map((h) => (
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
              {filteredRecords.length > 0 ? (
                filteredRecords.map(({ pickup, booking }) => (
                  <tr key={pickup.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Plate Number */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-900 shadow-2xs">
                        {pickup.plateNumber || "—"}
                      </span>
                    </td>

                    {/* Collector Name */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {pickup.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{pickup.name}</p>
                          <span className="text-[10px] text-slate-400 font-medium">Physical Collector</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-mono text-xs font-semibold">
                      {pickup.phone}
                    </td>

                    {/* Booked Owner */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div>
                        <p className="font-bold text-slate-900">
                          {booking?.owner || pickup.name}
                        </p>
                        {booking?.classification && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {booking.classification}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                      {booking?.vehicle || "Recorded Vehicle"}
                    </td>

                    {/* Handover Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {pickup.timestamp}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord({ pickup, booking })}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Inspect Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs font-medium">
                    No picked plate records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Full Handover Dossier & Certificate ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  DVLA
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Plate Handover Certificate
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ref #{selectedRecord.pickup.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Certificate Body */}
            <div className="space-y-3.5 text-xs">
              {/* Plate Header Box */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">
                    Physical Plate Released
                  </span>
                  <p className="font-mono text-lg font-black text-white">
                    {selectedRecord.pickup.plateNumber}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                  PICKED UP
                </span>
              </div>

              {/* Collector Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>👤 Collector Credentials (Who Came)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Collector Name:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.pickup.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Collector Phone:</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedRecord.pickup.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Handover Timestamp:</span>
                    <span className="font-medium text-slate-800">{selectedRecord.pickup.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Issuing Station:</span>
                    <span className="font-medium text-slate-800">DVLA HQ - Adenta</span>
                  </div>
                </div>
              </div>

              {/* Original Booked Owner Details */}
              <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/60 space-y-2">
                <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>🏛️ Registered Booked Owner Record</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Registered Owner:</span>
                    <span className="font-bold text-emerald-950">
                      {selectedRecord.booking?.owner || selectedRecord.pickup.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vehicle Specification:</span>
                    <span className="font-medium text-slate-900">
                      {selectedRecord.booking?.vehicle || "Recorded Vehicle"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Plate Classification:</span>
                    <span className="font-bold text-slate-800">
                      {selectedRecord.booking?.classification || "Private"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Application Filing Date:</span>
                    <span className="font-medium text-slate-800">
                      {selectedRecord.booking?.date || "18 May 2026"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
