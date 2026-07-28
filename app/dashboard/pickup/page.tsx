"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PickupRegistration {
  id: string;
  name: string;
  phone: string;
  plateNumber: string;
  timestamp: string;
  status: "pending" | "completed";
}

interface PlateRecord {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string;
  date: string;
  classification: string;
}

export default function PickupPage() {
  const [registrations, setRegistrations] = useState<PickupRegistration[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  // Search State
  const [searchPlate, setSearchPlate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [matchedRecord, setMatchedRecord] = useState<PlateRecord | null>(null);
  const [searchError, setSearchError] = useState("");

  // Confirmation State
  const [collectorName, setCollectorName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadPickups() {
      try {
        const res = await fetch("/api/pickups");
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch pickups from DB:", err);
      }
      const stored = JSON.parse(localStorage.getItem("dvla_pickups") || "[]");
      setRegistrations(stored);
    }
    loadPickups();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setMatchedRecord(null);
    setCollectorName("");
    setPhone("");
    setSubmitSuccess(false);

    try {
      // Find the plate in the bookings/filed records
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const records: PlateRecord[] = await res.json();
        const query = searchPlate.trim().toLowerCase();
        
        // Exact match or partial match on plate number
        const match = records.find(r => 
          r.plate?.toLowerCase() === query || 
          r.plate?.toLowerCase().replace(/\s/g, '') === query.replace(/\s/g, '')
        );

        if (match) {
          setMatchedRecord(match);
        } else {
          setSearchError(`No filed record found for plate "${searchPlate}". Make sure the plate has been filed from VRS first.`);
        }
      } else {
        setSearchError("Failed to access plate directory.");
      }
    } catch (err) {
      console.error(err);
      setSearchError("System error during plate lookup.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!matchedRecord || !phone.trim()) return;
    setIsSubmitting(true);

    const payload = {
      name: collectorName.trim() || matchedRecord.owner,
      phone: phone.trim(),
      plateNumber: matchedRecord.plate || searchPlate,
      timestamp: new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: "pending", // Initially pending until physical handover
    };

    try {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const updated = [created, ...registrations];
        setRegistrations(updated);
        localStorage.setItem("dvla_pickups", JSON.stringify(updated));
        
        // Log to audit trail
        fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SYSTEM_AUDIT",
            details: `Plate pickup initiated for ${payload.plateNumber} by ${payload.name}`,
            performedBy: "admin",
          }),
        }).catch(() => {});

        setSubmitSuccess(true);
        setMatchedRecord(null);
        setSearchPlate("");
        setCollectorName("");
        setPhone("");
      } else {
        throw new Error("Failed to save pickup");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving pickup record.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(false), 3000);
    }
  };

  const markAsCompleted = async (id: string, plate?: string) => {
    try {
      await fetch("/api/pickups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed" }),
      });
      
      if (plate) {
         fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "PLATE_TRANSFERRED",
            details: `Plate ${plate} physically collected by owner`,
            performedBy: "admin",
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to update status in DB:", err);
    }
    const updated = registrations.map(r =>
      r.id === id ? { ...r, status: "completed" as const } : r
    );
    setRegistrations(updated);
    localStorage.setItem("dvla_pickups", JSON.stringify(updated));
  };

  const deleteRegistration = async (id: string) => {
    try {
      await fetch(`/api/pickups?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete pickup from DB:", err);
    }
    const updated = registrations.filter(r => r.id !== id);
    setRegistrations(updated);
    localStorage.setItem("dvla_pickups", JSON.stringify(updated));
  };

  const filtered = filter === "all"
    ? registrations
    : registrations.filter(r => r.status === filter);

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === "pending").length,
    completed: registrations.filter(r => r.status === "completed").length,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Banner */}
      <div className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0d1a03 0%, #1a2e05 50%, #2d5009 100%)" }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="pickupgrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pickupgrid)" />
        </svg>
        <div className="relative">
          <h1 className="text-4xl font-extrabold text-white mb-2">Plate Issuance</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto font-medium">Search the filed plates directory to authorize physical plate issuance for walk-in visitors.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Visitors", value: stats.total, color: "#3b82f6" },
          { label: "Pending Issuance", value: stats.pending, color: "#f59e0b" },
          { label: "Plates Issued", value: stats.completed, color: "#81B71A" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderLeftColor: stat.color, boxShadow: "0 2px 8px rgba(0,0,0,0.045)" }}>
            <p className="text-xs font-bold text-[#9aa3be] uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-extrabold mt-2 tracking-tight" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Registration Form / Lookup */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#e8edf5] p-6 shadow-sm" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
            <h2 className="text-lg font-extrabold mb-1 tracking-tight" style={{ color: "#1a2e05" }}>Step 1: Look up Plate</h2>
            <p className="text-xs text-[#6b7a99] mb-5">Verify the plate has been filed from VRS.</p>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value)}
                    placeholder="e.g. 0891-ADKX"
                    className="w-full pl-4 pr-24 py-3 border border-[#e2e8f0] rounded-xl text-sm font-bold tracking-widest text-[#1a2e05] uppercase placeholder:normal-case placeholder-[#c3ccd8] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 focus:border-[#81B71A]"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchPlate}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: "#81B71A" }}
                  >
                    {isSearching ? "..." : "Search"}
                  </button>
                </div>
                {searchError && (
                  <p className="text-xs font-bold text-red-500 mt-2 p-2 bg-red-50 rounded-md border border-red-100">
                    ⚠️ {searchError}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Matched Record */}
          {matchedRecord && (
            <div className="bg-white rounded-xl border-2 border-[#81B71A]/40 p-6 shadow-md shadow-[#81B71A]/5 animate-in fade-in slide-in-from-top-4">
              <h2 className="text-lg font-extrabold mb-1 tracking-tight" style={{ color: "#1a2e05" }}>Step 2: Verify & Authorize</h2>
              <p className="text-xs text-[#6b7a99] mb-4">Confirm ID matches the filed record.</p>

              <div className="bg-[#f8faff] rounded-lg p-4 border border-[#e2e8f0] space-y-3 mb-5">
                <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
                  <span className="text-[10px] font-bold text-[#9aa3be] uppercase tracking-wider">Plate Number</span>
                  <span className="font-mono font-bold text-lg text-[#1a2e05]">{matchedRecord.plate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#9aa3be] uppercase tracking-wider block mb-0.5">Owner / Organization</span>
                  <span className="font-bold text-sm text-[#3d6b08]">{matchedRecord.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#9aa3be] uppercase tracking-wider block mb-0.5">Vehicle Detail</span>
                  <span className="font-medium text-xs text-[#374167]">{matchedRecord.vehicle}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#9aa3be] uppercase block mb-1">Collector's Name</label>
                  <input
                    type="text"
                    required
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    placeholder="Enter name of the person picking up (if not owner)"
                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 focus:border-[#81B71A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#9aa3be] uppercase block mb-1">Collector's Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +233 24 456 7890"
                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 focus:border-[#81B71A]"
                  />
                </div>
                
                <button
                  onClick={handleConfirmPickup}
                  disabled={isSubmitting || !phone || !collectorName}
                  className="w-full py-3 rounded-lg font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
                  style={{ background: "linear-gradient(115deg, #2d5009, #81B71A)" }}
                >
                  {isSubmitting ? "Processing..." : "Authorize Plate Issuance"}
                </button>
              </div>
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-[#81B71A]/10 border-2 border-[#81B71A]/30 text-center animate-in fade-in zoom-in">
              <div className="w-10 h-10 rounded-full bg-[#81B71A] text-white flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p className="font-bold text-[#3d6b08]">Issuance Authorized</p>
              <p className="text-xs text-[#6b7a99] mt-1">Visitor added to the issuance queue.</p>
            </div>
          )}
        </div>

        {/* Registrations List */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { id: "pending", label: "Waiting for Plate" },
              { id: "completed", label: "Issued" },
              { id: "all", label: "All Records" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  filter === tab.id
                    ? "bg-[#81B71A] text-white shadow-md shadow-[#81B71A]/20"
                    : "bg-white border border-[#e8edf5] text-[#6b7a99] hover:border-[#81B71A]/40 hover:bg-[#f8faff]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Registrations Table */}
          <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                    {["Plate Number", "Owner / Visitor", "Phone", "Time Added", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "#9aa3be" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((reg) => (
                      <tr key={reg.id} className="border-t hover:bg-[#fafbfe] transition-colors" style={{ borderColor: "#f0f3f8" }}>
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold px-2 py-1 bg-slate-100 rounded text-sm text-[#1a2e05] border border-slate-200 shadow-sm">{reg.plateNumber}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold block text-sm" style={{ color: "#374167" }}>{reg.name}</span>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium" style={{ color: "#6b7a99" }}>{reg.phone}</td>
                        <td className="px-5 py-4 text-xs" style={{ color: "#9aa3be" }}>{reg.timestamp}</td>
                        <td className="px-5 py-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                            style={{
                              background: reg.status === "pending" ? "rgba(245,158,11,0.09)" : "rgba(129,183,26,0.09)",
                              color: reg.status === "pending" ? "#92610a" : "#3d6b08",
                              borderColor: reg.status === "pending" ? "rgba(245,158,11,0.22)" : "rgba(129,183,26,0.22)",
                            }}
                          >
                            {reg.status === "pending" ? "Waiting" : "Collected"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            {reg.status === "pending" && (
                              <button
                                onClick={() => markAsCompleted(reg.id, reg.plateNumber)}
                                className="px-3 py-1.5 rounded-lg bg-[#81B71A]/10 hover:bg-[#81B71A]/20 text-[#3d6b08] text-[11px] font-bold transition flex items-center gap-1 border border-[#81B71A]/20"
                              >
                                ✓ Hand Over
                              </button>
                            )}
                            <button
                              onClick={() => deleteRegistration(reg.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition border border-red-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">📭</span>
                        </div>
                        <p className="text-sm font-bold text-[#374167]">No {filter !== "all" ? filter : ""} pickups found</p>
                        <p className="text-xs text-[#9aa3be] mt-1">Use the search to authorize a new plate collection.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <Link href="/dashboard" className="inline-block px-4 py-2 rounded-lg text-sm font-bold" style={{ background: "#81B71A", color: "white" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
