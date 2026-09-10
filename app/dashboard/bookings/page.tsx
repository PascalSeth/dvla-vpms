"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DigitalPlate, PlateCategory } from "@/components/DigitalPlate";

interface VrsInvoice {
  id?: string;
  invoiceNo?: string;
  bookingType?: string;
  classification?: string;
  regNo?: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  make?: string;
  yearModel?: string;
  engineCC?: string;
  cylinders?: string;
  engineNo?: string;
  chassisNo?: string;
  bodyType?: string;
  fuelType?: string;
}

interface Booking {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string;
  date: string;
  classification: string;
  previousOwnerName?: string;
  previousOwnerPhone?: string;
  previousOwnerAddress?: string;
  previousOwnerCustom?: string;
  vrsInvoiceId?: string;
  vrsInvoice?: VrsInvoice;
  createdAt?: string;
  branch?: { name?: string; code?: string };
  createdBy?: { name?: string; username?: string };
  reviewedBy?: { name?: string; username?: string };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userRole, setUserRole] = useState("SUPERADMIN");
  const [userName, setUserName] = useState("Admin User");
  const [userId, setUserId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inspectBooking, setInspectBooking] = useState<Booking | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = () => {
      try {
        const storedSession = localStorage.getItem("dvla_session");
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          setUserRole(parsed.role?.toUpperCase() || "SUPERADMIN");
          setUserName(parsed.name || parsed.username || "Admin User");
          setUserId(parsed.id || null);
        }
      } catch (e) {}
    };

    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  const canMakeDecisions = userRole === "SUPERADMIN" || userRole === "SUPERVISOR";

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setBookings(data);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch bookings from DB:", err);
      }
      const stored = JSON.parse(localStorage.getItem("dvla_bookings") || "[]");
      setBookings(stored);
    }
    loadBookings();
  }, []);

  async function handleStatusChange(bookingId: string, newStatus: "approved" | "rejected" | "pending" | "picked") {
    setUpdatingId(bookingId);
    setToastMessage(null);

    // Optimistic UI update
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );

    if (inspectBooking && inspectBooking.id === bookingId) {
      setInspectBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status: newStatus,
          adminUser: userName,
          reviewedById: userId,
          userId: userId,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? updated : b))
        );
        if (inspectBooking && inspectBooking.id === bookingId) {
          setInspectBooking(updated);
        }
        setToastMessage(`Booking #${bookingId} status changed to ${newStatus.toUpperCase()}.`);
      } else {
        const current = JSON.parse(localStorage.getItem("dvla_bookings") || "[]");
        const updatedLocal = current.map((b: Booking) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        );
        localStorage.setItem("dvla_bookings", JSON.stringify(updatedLocal));
        setToastMessage(`Booking #${bookingId} status set to ${newStatus.toUpperCase()}.`);
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
      setToastMessage(`Updated status for #${bookingId} locally.`);
    } finally {
      setUpdatingId(null);
    }
  }

  // Filter bookings by status, classification, and search query
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter !== "all" && b.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Classification filter
      if (classificationFilter !== "all" && b.classification.toLowerCase() !== classificationFilter.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invNo = b.vrsInvoice?.invoiceNo?.toLowerCase() || "";
        const match =
          b.id.toLowerCase().includes(q) ||
          b.owner.toLowerCase().includes(q) ||
          b.vehicle.toLowerCase().includes(q) ||
          (b.plate && b.plate.toLowerCase().includes(q)) ||
          invNo.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, classificationFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status.toLowerCase() === "pending").length;
    const approved = bookings.filter((b) => b.status.toLowerCase() === "approved").length;
    const picked = bookings.filter((b) => b.status.toLowerCase() === "picked").length;
    const rejected = bookings.filter((b) => b.status.toLowerCase() === "rejected").length;

    return { total, pending, approved, picked, rejected };
  }, [bookings]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "picked":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  function exportCSV() {
    const headers = ["ID", "Owner", "Vehicle", "Plate", "Classification", "Status", "Date"];
    const rows = filteredBookings.map(b => [
      b.id,
      `"${b.owner.replace(/"/g, '""')}"`,
      `"${b.vehicle.replace(/"/g, '""')}"`,
      b.plate || "Pending",
      b.classification,
      b.status,
      b.date
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dvla_booking_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">

      {/* ── 1. Top Header Bar ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Booking Logs
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              {bookings.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official vehicle registration and plate assignment logbook &bull; Central registry audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Download CSV export"
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <Link
            href="/dashboard/booking"
            className="px-3.5 py-1.5 rounded-lg bg-[#103014] hover:bg-[#18481e] text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
          >
            <span>+</span>
            <span>New Booking</span>
          </Link>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-2xs">
          <span>✓ {toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-bold ml-4 cursor-pointer text-emerald-700 hover:text-emerald-950">
            ✕
          </button>
        </div>
      )}

      {/* ── 2. Metric KPI Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Filed</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{stats.total}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Pending</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-700 mt-0.5">{stats.pending}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Approved</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{stats.approved}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">Rejected</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-700 mt-0.5">{stats.rejected}</p>
        </div>
      </div>

      {/* ── 3. Filter & Search Toolbar ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Owner, Plate Number, VIN, Model, or Invoice #..."
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#81B71A] focus:ring-1 focus:ring-[#81B71A]"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Classification Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Class:</span>
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Classifications</option>
              <option value="private">Private (White)</option>
              <option value="commercial">Commercial (Yellow)</option>
              <option value="government">Government (GV Split)</option>
              <option value="electric">Electric (EV Green)</option>
              <option value="trailer">Trailer</option>
              <option value="motorcycle">Motorcycle</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          {([
            { id: "all", label: "All Logs", count: bookings.length },
            { id: "pending", label: "Pending", count: stats.pending },
            { id: "approved", label: "Approved", count: stats.approved },
            { id: "picked", label: "Picked", count: stats.picked },
            { id: "rejected", label: "Rejected", count: stats.rejected },
          ] as const).map(tab => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? "bg-slate-900 text-white shadow-2xs font-bold"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${active ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-700"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Booking Logs Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500 space-y-2">
            <p>No booking records found matching your active filter criteria.</p>
            {(searchQuery || statusFilter !== "all" || classificationFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setClassificationFilter("all");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Date Filed</th>
                  <th className="py-3 px-4">Legal Owner &amp; Vehicle</th>
                  <th className="py-3 px-4">Plate Assigned</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const badgeClass = getStatusBadge(b.status);
                  const isUpdating = updatingId === b.id;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        #{b.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {b.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.owner}</div>
                        <div className="text-[11px] text-slate-500">{b.vehicle}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.plate || <span className="text-slate-400 font-normal">Pending</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {b.classification}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeClass}`}>
                          {isUpdating ? "Saving..." : b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectBooking(b)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          Inspect &amp; Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Clean Modal Drawer: Inspect & VRS Verification ── */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 p-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Logbook Record Verification
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Booking Log #{inspectBooking.id} &bull; {inspectBooking.owner}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBooking(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Digital Plate Showcase in Modal */}
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <div className="w-full max-w-[280px]">
                <DigitalPlate
                  plateNumber={inspectBooking.plate || "PENDING"}
                  category={(inspectBooking.classification as PlateCategory) || "Private"}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-2">
                Classification: {inspectBooking.classification} &bull; Date Filed: {inspectBooking.date}
              </span>
            </div>

            {/* Side-by-Side Comparison: Filing vs VRS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-100 pb-1">
                  📝 Registration Record
                </span>
                <p><span className="text-slate-400">Owner:</span> <strong>{inspectBooking.owner}</strong></p>
                <p><span className="text-slate-400">Vehicle:</span> {inspectBooking.vehicle}</p>
                <p><span className="text-slate-400">Plate:</span> <strong className="font-mono">{inspectBooking.plate || "Pending"}</strong></p>
                <p><span className="text-slate-400">Service:</span> {inspectBooking.type}</p>
                <p><span className="text-slate-400">Station:</span> {inspectBooking.branch?.name || "DVLA Adenta"}</p>
                <p><span className="text-slate-400">Officer:</span> {inspectBooking.createdBy?.name || inspectBooking.createdBy?.username || "A. Owusu"}</p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-100 pb-1">
                  📄 VRS Invoice Verification
                </span>
                {inspectBooking.vrsInvoice ? (
                  <>
                    <p><span className="text-slate-400">Invoice:</span> <strong className="font-mono">{inspectBooking.vrsInvoice.invoiceNo}</strong></p>
                    <p><span className="text-slate-400">VRS Owner:</span> {inspectBooking.vrsInvoice.ownerName}</p>
                    <p><span className="text-slate-400">VIN:</span> <span className="font-mono">{inspectBooking.vrsInvoice.chassisNo || "—"}</span></p>
                    <p><span className="text-slate-400">Engine:</span> <span className="font-mono">{inspectBooking.vrsInvoice.engineNo || "—"}</span></p>
                    <p><span className="text-slate-400">Body / Fuel:</span> {inspectBooking.vrsInvoice.bodyType} &bull; {inspectBooking.vrsInvoice.fuelType}</p>
                  </>
                ) : (
                  <p className="text-slate-400 italic">No direct VRS Invoice attached to this manual filing.</p>
                )}
              </div>
            </div>

            {/* Previous Title Owner & Transfer Details (if present) */}
            {(inspectBooking.previousOwnerName || inspectBooking.previousOwnerPhone || inspectBooking.previousOwnerAddress || inspectBooking.previousOwnerCustom) && (
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span>🔄 Previous Title Owner &amp; Transfer Record</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 uppercase">
                    Title Transfer
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                  {inspectBooking.previousOwnerName && (
                    <p><span className="text-slate-500 font-medium">Previous Owner:</span> <strong>{inspectBooking.previousOwnerName}</strong></p>
                  )}
                  {inspectBooking.previousOwnerPhone && (
                    <p><span className="text-slate-500 font-medium">Contact Phone:</span> <span className="font-mono">{inspectBooking.previousOwnerPhone}</span></p>
                  )}
                  {inspectBooking.previousOwnerAddress && (
                    <p className="sm:col-span-2"><span className="text-slate-500 font-medium">Previous Address:</span> {inspectBooking.previousOwnerAddress}</p>
                  )}
                  {inspectBooking.previousOwnerCustom && (
                    <p className="sm:col-span-2"><span className="text-slate-500 font-medium">Transfer Reference:</span> <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{inspectBooking.previousOwnerCustom}</strong></p>
                  )}
                </div>
              </div>
            )}

            {/* Supervisor Decision Controls */}
            {canMakeDecisions && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Supervisor Certification</span>
                  <span className="text-[11px] text-slate-500">Update official logbook status</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(inspectBooking.id, "approved")}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(inspectBooking.id, "picked")}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    Mark Picked
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(inspectBooking.id, "rejected")}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
