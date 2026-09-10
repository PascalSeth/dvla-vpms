"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface PickupRecord {
  id: string;
  plateNumber: string;
  name: string;
  phone: string;
  timestamp: string;
  status: "PENDING" | "COMPLETED" | "pending" | "completed" | "picked";
  branchId?: string | null;
  bookingId?: string | null;
  registeredBy?: { id: string; name: string; username: string } | null;
  handedOverBy?: { id: string; name: string; username: string } | null;
  handedOverAt?: string | null;
  createdAt?: string;
  booking?: {
    owner?: string;
    vehicle?: string;
    classification?: string;
  } | null;
}

interface BookingSuggestion {
  id: string;
  plate: string;
  owner: string;
  vehicle: string;
  phone?: string;
}

export default function PlateIssuancePage() {
  const [records, setRecords] = useState<PickupRecord[]>([]);
  const [bookings, setBookings] = useState<BookingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Inputs
  const [plateNumber, setPlateNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queue Filters
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // User session
  const [userRole, setUserRole] = useState("SUPERADMIN");
  const [userName, setUserName] = useState("System Administrator");
  const [userId, setUserId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  const isSupervisor = userRole === "SUPERADMIN" || userRole === "SUPERVISOR";

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load user session
  useEffect(() => {
    const loadSession = () => {
      try {
        const stored = localStorage.getItem("dvla_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserRole(parsed.role?.toUpperCase() || "SUPERADMIN");
          setUserName(parsed.name || parsed.username || "System Administrator");
          setUserId(parsed.id || null);
          setBranchId(parsed.branchId || parsed.branch?.id || null);
        }
      } catch (e) {}
    };

    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  // Fetch Pickup Records and Bookings
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/pickups"),
        fetch("/api/bookings"),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setRecords(pData);
      }

      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData)) {
          setBookings(
            bData
              .filter((b: any) => b.plate)
              .map((b: any) => ({
                id: b.id,
                plate: b.plate,
                owner: b.owner,
                vehicle: b.vehicle,
                phone: b.vrsInvoice?.phone || b.phone,
              }))
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch pickup records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Optional plate autocomplete hint
  const matchingBooking = useMemo(() => {
    const clean = plateNumber.trim().toUpperCase().replace(/\s/g, "");
    if (!clean || clean.length < 3) return null;
    return bookings.find((b) => b.plate.toUpperCase().replace(/\s/g, "") === clean) || null;
  }, [plateNumber, bookings]);

  // Handle auto-fill from matching booking
  const handleApplyMatch = () => {
    if (matchingBooking) {
      setCustomerName(matchingBooking.owner);
      if (matchingBooking.phone) {
        setCustomerPhone(matchingBooking.phone);
      }
      triggerToast(`Autofilled customer details for ${matchingBooking.plate}`);
    }
  };

  // Submit new customer pickup record
  const handleSaveRecord = async (autoApprove: boolean) => {
    if (!plateNumber.trim()) {
      triggerToast("Please enter the Plate Number.");
      return;
    }
    if (!customerName.trim()) {
      triggerToast("Please enter the Customer's Name.");
      return;
    }
    if (!customerPhone.trim()) {
      triggerToast("Please enter the Customer's Phone Number.");
      return;
    }

    setIsSubmitting(true);
    const cleanPlate = plateNumber.trim().toUpperCase();
    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();

    const timestampStr =
      customTime.trim() ||
      new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    // Only Supervisors and Superadmins can auto-approve
    const canApprove = isSupervisor && autoApprove;
    const status = canApprove ? "COMPLETED" : "PENDING";

    try {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: cleanPlate,
          name: cleanName,
          phone: cleanPhone,
          timestamp: timestampStr,
          status,
          registeredById: userId,
          userId,
          adminUser: userName,
          bookingId: matchingBooking?.id || null,
          branchId,
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        setRecords((prev) => [newRecord, ...prev]);

        // Reset form
        setPlateNumber("");
        setCustomerName("");
        setCustomerPhone("");
        setCustomTime("");

        if (canApprove) {
          triggerToast(`✓ Plate ${cleanPlate} recorded & approved for ${cleanName}!`);
        } else {
          triggerToast(`✓ Customer record saved for ${cleanPlate}. Pending approval.`);
        }
      } else {
        throw new Error("Failed to save record");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error saving customer record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Easy 1-Click Approve on an existing pending record
  const handleApproveRecord = async (record: PickupRecord) => {
    try {
      const res = await fetch("/api/pickups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          status: "COMPLETED",
          plateNumber: record.plateNumber,
          handedOverById: userId,
          userId,
          adminUser: userName,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRecords((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? { ...r, status: "COMPLETED", handedOverAt: new Date().toISOString() }
              : r
          )
        );
        triggerToast(`✓ Handover approved for Plate ${record.plateNumber}!`);
      } else {
        throw new Error("Failed to approve handover");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error approving record.");
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string, plate: string) => {
    if (!confirm(`Are you sure you want to delete the record for ${plate}?`)) return;

    try {
      const res = await fetch(`/api/pickups?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId || "")}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        triggerToast(`Record for ${plate} deleted.`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error deleting record.");
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter(
      (r) => (r.status || "").toUpperCase() === "PENDING"
    ).length;
    const approved = records.filter(
      (r) =>
        (r.status || "").toUpperCase() === "COMPLETED" ||
        (r.status || "").toUpperCase() === "PICKED"
    ).length;

    return { total, pending, approved };
  }, [records]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const s = (r.status || "").toUpperCase();
      const isPending = s === "PENDING";
      const isApproved = s === "COMPLETED" || s === "PICKED";

      if (filterTab === "PENDING" && !isPending) return false;
      if (filterTab === "APPROVED" && !isApproved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const p = (r.plateNumber || "").toLowerCase();
        const n = (r.name || "").toLowerCase();
        const ph = (r.phone || "").toLowerCase();

        return p.includes(q) || n.includes(q) || ph.includes(q);
      }

      return true;
    });
  }, [records, filterTab, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-[#81B71A] animate-ping" />
          <span>{toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                DVLA Counter Record Keeping
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200">
                Logged Officer: {userName}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Plate Issuance &amp; Customer Records
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Record customer name and phone number when plates are collected, and easily approve handovers for official station record keeping.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/plates/picked"
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <span>📦 Issued Plates Archive</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Counter Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          {
            label: "Total Customer Pickups",
            val: stats.total,
            sub: "Total issuance records logged",
            color: "text-slate-900",
            dot: "bg-blue-500",
            badge: "All Records",
            badgeBg: "bg-blue-50 text-blue-700 border-blue-200/60",
            tab: "ALL" as const,
          },
          {
            label: "Pending Approval",
            val: stats.pending,
            sub: "Handovers waiting for sign-off",
            color: "text-amber-700",
            dot: "bg-amber-500",
            badge: "Needs Sign-off",
            badgeBg: "bg-amber-50 text-amber-800 border-amber-200/60",
            tab: "PENDING" as const,
          },
          {
            label: "Approved & Released",
            val: stats.approved,
            sub: "Authenticated plate collections",
            color: "text-emerald-700",
            dot: "bg-emerald-500",
            badge: "Approved",
            badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
            tab: "APPROVED" as const,
          },
        ].map((m) => (
          <div
            key={m.label}
            onClick={() => setFilterTab(m.tab)}
            className={`bg-white rounded-xl border p-4 shadow-2xs cursor-pointer transition-all hover:border-slate-400 ${
              filterTab === m.tab
                ? "border-slate-900 ring-2 ring-slate-900/10"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                <span className="text-[11px] font-semibold text-slate-500">{m.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeBg}`}>
                {m.badge}
              </span>
            </div>
            <p className={`font-mono text-2xl font-black tracking-tight ${m.color}`}>{m.val}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-Panel Desk ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ── Left Form: Customer Record Entry (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
            
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Counter Handover Desk
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Record Customer Collection
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter customer credentials when they arrive at the counter to collect their license plate.
              </p>
            </div>

            <div className="space-y-3.5">
              
              {/* Field 1: Plate Number */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Plate Number *
                </label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="e.g. 1092 GRXY or GV 8810 ADXS"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />

                {/* Helpful Autocomplete Chip */}
                {matchingBooking && (
                  <div className="mt-1.5 p-2 rounded-md bg-emerald-50 border border-emerald-200/60 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="text-[11px] text-emerald-900 leading-tight">
                      <span className="font-bold block">Vehicle Found:</span>
                      <span>{matchingBooking.owner} · {matchingBooking.vehicle}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyMatch}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition cursor-pointer shrink-0 ml-2"
                    >
                      Autofill
                    </button>
                  </div>
                )}
              </div>

              {/* Field 2: Customer Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Customer / Collector Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name of person collecting plate"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>

              {/* Field 3: Phone Number */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Customer Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0244 123 456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>

              {/* Field 4: Custom Timestamp (Optional) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Handover Time (Optional)
                </label>
                <input
                  type="text"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder="Leave empty for current time"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>

              {/* ── Action Buttons ── */}
              <div className="pt-2 space-y-2">
                
                {/* 1-Click: Save & Approve Immediately (SUPERVISORS & SUPERADMINS ONLY) */}
                {isSupervisor && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSaveRecord(true)}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>✓</span>
                    <span>{isSubmitting ? "Saving..." : "Record & Approve Immediately"}</span>
                  </button>
                )}

                {/* Save Record (Awaiting Supervisor Sign-off) */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveRecord(false)}
                  className={`w-full py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    isSupervisor
                      ? "border border-slate-300 hover:bg-slate-50 active:scale-98 text-slate-700 font-semibold text-xs py-2"
                      : "bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs shadow-xs"
                  }`}
                >
                  <span>📝</span>
                  <span>
                    {isSupervisor
                      ? "Record Only (Awaiting Supervisor Sign-off)"
                      : isSubmitting
                      ? "Saving Customer Record..."
                      : "Record Customer Collection"}
                  </span>
                </button>

              </div>

            </div>

          </div>
        </div>

        {/* ── Right Table: Customer Records & Approval Queue (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-3.5">
          
          {/* Toolbar: Filter Tabs & Search */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Issuance Ledger &amp; Approvals
              </span>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: "ALL" as const, label: "All Records", count: stats.total },
                  { id: "PENDING" as const, label: "Pending Approval", count: stats.pending, color: "text-amber-700" },
                  { id: "APPROVED" as const, label: "Approved", count: stats.approved, color: "text-emerald-700" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilterTab(t.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      filterTab === t.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${filterTab === t.id ? "bg-white/20 text-white" : t.color || "text-slate-500"}`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Plate Number, Customer Name, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
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

          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="text-left px-3.5 py-3">Plate Number</th>
                    <th className="text-left px-3.5 py-3">Customer (Name &amp; Phone)</th>
                    <th className="text-left px-3.5 py-3">Timestamp</th>
                    <th className="text-left px-3.5 py-3">Status</th>
                    <th className="text-right px-3.5 py-3">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => {
                      const status = (r.status || "").toUpperCase();
                      const isPending = status === "PENDING";

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          
                          {/* Plate Badge */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded border border-slate-300 bg-slate-50 text-slate-900 shadow-2xs inline-block">
                              {r.plateNumber}
                            </span>
                          </td>

                          {/* Customer Name & Phone */}
                          <td className="px-3.5 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{r.name}</span>
                              <span className="font-mono text-slate-500 text-[11px]">{r.phone}</span>
                            </div>
                          </td>

                          {/* Date / Time */}
                          <td className="px-3.5 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {r.timestamp}
                          </td>

                          {/* Status Pill */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                PENDING APPROVAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                APPROVED &amp; RELEASED
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending ? (
                                isSupervisor ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveRecord(r)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-md transition shadow-2xs cursor-pointer flex items-center gap-1"
                                    title="Approve Handover"
                                  >
                                    <span>✓</span>
                                    <span>Approve</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-amber-700 font-medium italic">
                                    Awaiting Sign-off
                                  </span>
                                )
                              ) : (
                                <span className="text-[11px] font-medium text-slate-400">
                                  ✓ Signed Off
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(r.id, r.plateNumber)}
                                className="p-1 text-slate-300 hover:text-rose-600 transition cursor-pointer ml-1"
                                title="Delete Record"
                              >
                                ✕
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <div className="space-y-1.5 max-w-sm mx-auto">
                          <span className="text-2xl block">📂</span>
                          <p className="font-semibold text-xs text-slate-700">No customer records found</p>
                          <p className="text-[11px] text-slate-400">
                            {filterTab === "PENDING"
                              ? "There are no customer pickups waiting for approval."
                              : "Enter the customer's name, phone number, and plate number on the left to log a pickup."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
