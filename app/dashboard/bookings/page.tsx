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
  reviewedBy?: { name?: string; username?: string; role?: string };
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [periodPreset, setPeriodPreset] = useState<"all" | "today" | "yesterday" | "this_week" | "this_month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [officerFilter, setOfficerFilter] = useState<string>("all");
  const [showProductivityPanel, setShowProductivityPanel] = useState<boolean>(true);
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

  // ── Helper: Parse Booking Creation Date ──
  function parseBookingDate(b: Booking): Date | null {
    if (b.createdAt) {
      const d = new Date(b.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (b.date) {
      const d = new Date(b.date);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  // ── Helper: Check if Booking falls inside Custom Period ──
  function isWithinPeriod(b: Booking, preset: string, startStr: string, endStr: string): boolean {
    if (preset === "all") return true;

    const bDate = parseBookingDate(b);
    if (!bDate) return true;

    const now = new Date();

    if (preset === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return bDate >= todayStart && bDate <= todayEnd;
    }

    if (preset === "yesterday") {
      const yestStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const yestEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return bDate >= yestStart && bDate <= yestEnd;
    }

    if (preset === "this_week") {
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek), 23, 59, 59, 999);
      return bDate >= weekStart && bDate <= weekEnd;
    }

    if (preset === "this_month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return bDate >= monthStart && bDate <= monthEnd;
    }

    if (preset === "custom") {
      let valid = true;
      if (startStr) {
        const s = new Date(startStr + "T00:00:00");
        if (!isNaN(s.getTime())) valid = valid && bDate >= s;
      }
      if (endStr) {
        const e = new Date(endStr + "T23:59:59.999");
        if (!isNaN(e.getTime())) valid = valid && bDate <= e;
      }
      return valid;
    }

    return true;
  }

  // ── Helper: Extract Officer Name & Details from Booking ──
  function getBookingOfficer(b: Booking): { name: string; username?: string; initials: string } {
    let name = "DVLA Entry Desk";
    let username: string | undefined = undefined;

    if (b.createdBy?.name || b.createdBy?.username) {
      name = b.createdBy.name || b.createdBy.username || "Officer";
      username = b.createdBy.username;
    }

    const initials = name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "OF";

    return {
      name,
      username,
      initials,
    };
  }

  // ── Human-Readable Period Label ──
  const periodLabel = useMemo(() => {
    switch (periodPreset) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "this_week": return "This Week";
      case "this_month": return "This Month";
      case "custom":
        if (customStartDate && customEndDate) return `${customStartDate} → ${customEndDate}`;
        if (customStartDate) return `From ${customStartDate}`;
        if (customEndDate) return `Up to ${customEndDate}`;
        return "Custom Range";
      default: return "All Time";
    }
  }, [periodPreset, customStartDate, customEndDate]);

  // ── Bookings within Active Period (Base for Officer Analytics) ──
  const bookingsInPeriod = useMemo(() => {
    return bookings.filter(b => isWithinPeriod(b, periodPreset, customStartDate, customEndDate));
  }, [bookings, periodPreset, customStartDate, customEndDate]);

  // ── Available Officers list across all loaded records ──
  const availableOfficers = useMemo(() => {
    const map = new Map<string, { name: string; username?: string; count: number }>();
    bookings.forEach(b => {
      const off = getBookingOfficer(b);
      const existing = map.get(off.name) || { name: off.name, username: off.username, count: 0 };
      existing.count += 1;
      map.set(off.name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [bookings]);

  // ── Officer Productivity & Activity Breakdown per Active Period ──
  interface OfficerProductivity {
    name: string;
    username?: string;
    total: number;
    approved: number;
    pending: number;
    picked: number;
    rejected: number;
    percent: number;
  }

  const officerProductivityList = useMemo<OfficerProductivity[]>(() => {
    const map = new Map<string, OfficerProductivity>();

    bookingsInPeriod.forEach(b => {
      const off = getBookingOfficer(b);
      const existing = map.get(off.name) || {
        name: off.name,
        username: off.username,
        total: 0,
        approved: 0,
        pending: 0,
        picked: 0,
        rejected: 0,
        percent: 0,
      };

      existing.total += 1;
      const st = (b.status || "").toLowerCase();
      if (st === "approved") existing.approved += 1;
      else if (st === "rejected") existing.rejected += 1;
      else if (st === "picked") existing.picked += 1;
      else existing.pending += 1;

      map.set(off.name, existing);
    });

    const totalCount = bookingsInPeriod.length || 1;
    return Array.from(map.values())
      .map(item => ({
        ...item,
        percent: Math.round((item.total / totalCount) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [bookingsInPeriod]);

  // ── Filter bookings by period, officer, status, classification, and search query ──
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Period filter
      if (!isWithinPeriod(b, periodPreset, customStartDate, customEndDate)) {
        return false;
      }
      // 2. Officer filter
      if (officerFilter !== "all") {
        const off = getBookingOfficer(b);
        if (off.name !== officerFilter) return false;
      }
      // 3. Status filter
      if (statusFilter !== "all" && b.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // 4. Classification filter
      if (classificationFilter !== "all" && b.classification.toLowerCase() !== classificationFilter.toLowerCase()) {
        return false;
      }
      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const off = getBookingOfficer(b);
        const invNo = b.vrsInvoice?.invoiceNo?.toLowerCase() || "";
        const match =
          b.id.toLowerCase().includes(q) ||
          b.owner.toLowerCase().includes(q) ||
          b.vehicle.toLowerCase().includes(q) ||
          (b.plate && b.plate.toLowerCase().includes(q)) ||
          off.name.toLowerCase().includes(q) ||
          (off.username && off.username.toLowerCase().includes(q)) ||
          invNo.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [bookings, periodPreset, customStartDate, customEndDate, officerFilter, statusFilter, classificationFilter, searchQuery]);

  // ── Statistics for Period & Overall Registry ──
  const stats = useMemo(() => {
    const totalInPeriod = bookingsInPeriod.length;
    const pending = bookingsInPeriod.filter((b) => b.status.toLowerCase() === "pending").length;
    const approved = bookingsInPeriod.filter((b) => b.status.toLowerCase() === "approved").length;
    const picked = bookingsInPeriod.filter((b) => b.status.toLowerCase() === "picked").length;
    const rejected = bookingsInPeriod.filter((b) => b.status.toLowerCase() === "rejected").length;
    const topOfficer = officerProductivityList.length > 0 ? officerProductivityList[0] : null;

    return {
      total: totalInPeriod,
      allTime: bookings.length,
      pending,
      approved,
      picked,
      rejected,
      activeOfficers: officerProductivityList.length,
      topOfficer,
    };
  }, [bookingsInPeriod, officerProductivityList, bookings.length]);

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
    const headers = ["Log ID", "Date Filed", "Desk Officer", "Officer Username", "Legal Owner", "Vehicle", "Plate Assigned", "Classification", "Status", "Branch"];
    const rows = filteredBookings.map(b => {
      const off = getBookingOfficer(b);
      return [
        b.id,
        b.date || (b.createdAt ? b.createdAt.slice(0, 10) : ""),
        `"${off.name.replace(/"/g, '""')}"`,
        off.username || "",
        `"${b.owner.replace(/"/g, '""')}"`,
        `"${b.vehicle.replace(/"/g, '""')}"`,
        b.plate || "Pending",
        b.classification,
        b.status,
        `"${(b.branch?.name || "").replace(/"/g, '""')}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dvla_booking_logs_${periodPreset}_${new Date().toISOString().slice(0, 10)}.csv`);
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
            onClick={() => setShowProductivityPanel(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              showProductivityPanel
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title="Toggle Officer Productivity Breakdown"
          >
            <span>👥 Officer Output ({officerProductivityList.length})</span>
          </button>
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
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Entries in Period</span>
            <span className="text-[10px] font-mono text-slate-400">All: {stats.allTime}</span>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{stats.total}</p>
          <span className="text-[10px] text-slate-500 truncate block mt-0.5 font-medium">{periodLabel}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Active Officers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{stats.activeOfficers}</p>
          <span className="text-[10px] text-emerald-700 font-semibold truncate block mt-0.5">
            {stats.topOfficer ? `Top: ${stats.topOfficer.name}` : "No entries"}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-700 mt-0.5">{stats.pending}</p>
          <span className="text-[10px] text-amber-700 font-semibold truncate block mt-0.5">
            {stats.approved} Approved in period
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">Rejected</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-700 mt-0.5">{stats.rejected}</p>
          <span className="text-[10px] text-rose-700 font-semibold truncate block mt-0.5">
            {stats.picked} Picked up
          </span>
        </div>
      </div>

      {/* ── 3. Officer Performance & Productivity Breakdown Station ── */}
      {showProductivityPanel && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>👥 Officer Performance &amp; Entry Breakdown</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {periodLabel}
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Breakdown of entries and verification output per desk officer for the selected custom timeframe.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {officerFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setOfficerFilter("all")}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer flex items-center gap-1"
                >
                  <span>Filtering: {officerFilter}</span>
                  <span className="text-[10px] font-bold">✕ Clear</span>
                </button>
              )}
              <span className="text-[11px] text-slate-400 font-mono">
                {officerProductivityList.length} Officers &bull; {bookingsInPeriod.length} Entries
              </span>
            </div>
          </div>

          {officerProductivityList.length === 0 ? (
            <div className="p-6 text-center text-xs font-semibold text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              No registration entries filed by any officer during {periodLabel}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {officerProductivityList.map((off) => {
                const isSelected = officerFilter === off.name;
                const initials = off.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("") || "OF";

                return (
                  <div
                    key={off.name}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#103014] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-900 truncate" title={off.name}>
                            {off.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {off.username ? `@${off.username}` : "Desk Officer"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black font-mono text-slate-950 block leading-tight">
                          {off.total}
                        </span>
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          {off.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Mini distribution bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(off.approved / off.total) * 100}%` }} className="bg-emerald-500 h-full" title={`Approved: ${off.approved}`} />
                        <div style={{ width: `${(off.pending / off.total) * 100}%` }} className="bg-amber-500 h-full" title={`Pending: ${off.pending}`} />
                        <div style={{ width: `${(off.picked / off.total) * 100}%` }} className="bg-blue-500 h-full" title={`Picked: ${off.picked}`} />
                        <div style={{ width: `${(off.rejected / off.total) * 100}%` }} className="bg-rose-500 h-full" title={`Rejected: ${off.rejected}`} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="text-emerald-700 font-semibold font-mono">✓ {off.approved} Appr</span>
                        <span className="text-amber-700 font-semibold font-mono">⏳ {off.pending} Pend</span>
                        {off.rejected > 0 && <span className="text-rose-700 font-semibold font-mono">✕ {off.rejected} Rej</span>}
                        {off.picked > 0 && <span className="text-blue-700 font-semibold font-mono">📦 {off.picked} Pick</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOfficerFilter(isSelected ? "all" : off.name)}
                      className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
                          : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <span>{isSelected ? "✓ Showing Entries" : `Show Entries (${off.total})`}</span>
                      {!isSelected && <span>&rarr;</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Filter & Search Toolbar ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Row 1: Search + Officer Dropdown + Classification */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Owner, Plate, VIN, Model, Invoice #, or Officer Name..."
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Officer Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Officer:</span>
              <select
                value={officerFilter}
                onChange={(e) => setOfficerFilter(e.target.value)}
                className={`px-2.5 py-2 rounded-lg border text-xs font-semibold focus:outline-none cursor-pointer ${
                  officerFilter !== "all"
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <option value="all">All Officers ({availableOfficers.length})</option>
                {availableOfficers.map((off) => (
                  <option key={off.name} value={off.name}>
                    {off.name} ({off.count} total)
                  </option>
                ))}
              </select>
            </div>

            {/* Classification Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Class:</span>
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
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
        </div>

        {/* Row 2: Custom Period Selector Pills & Date Pickers */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Timeframe:</span>
            {([
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_week", label: "This Week" },
              { id: "this_month", label: "This Month" },
              { id: "custom", label: "Custom Range" },
            ] as const).map((p) => {
              const isActive = periodPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodPreset(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-[#103014] text-white shadow-2xs font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers when 'custom' is active */}
          {periodPreset === "custom" && (
            <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-bold text-[10px] uppercase">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-500 font-bold text-[10px] uppercase">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Row 3: Status Filter Tabs & Active Filter Reset */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {([
              { id: "all", label: "All Logs", count: filteredBookings.length },
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

          {(officerFilter !== "all" || periodPreset !== "all" || classificationFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setOfficerFilter("all");
                setPeriodPreset("all");
                setCustomStartDate("");
                setCustomEndDate("");
                setClassificationFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold whitespace-nowrap cursor-pointer hover:underline"
            >
              ✕ Reset All Filters
            </button>
          )}
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
                  <th className="py-3 px-4">Desk Officer</th>
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
                  const officerInfo = getBookingOfficer(b);
                  const initials = officerInfo.initials;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        #{b.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {b.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-emerald-200">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setOfficerFilter(officerInfo.name)}
                              className="font-bold text-slate-900 hover:text-emerald-700 text-xs text-left truncate block cursor-pointer transition-colors"
                              title={`Filter entries by ${officerInfo.name}`}
                            >
                              {officerInfo.name}
                            </button>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              {b.branch?.name || (officerInfo.username ? `@${officerInfo.username}` : "Entry Desk")}
                            </p>
                          </div>
                        </div>
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
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 p-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Logbook Record Verification
                </span>
                <h3 className="text-base font-bold text-slate-950">
                  Booking Log #{inspectBooking.id} &bull; {inspectBooking.owner}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBooking(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-sm font-bold flex items-center justify-center transition cursor-pointer"
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
              <span className="text-xs font-mono font-medium text-slate-700 mt-2">
                Classification: <strong className="text-slate-900 font-bold">{inspectBooking.classification}</strong> &bull; Date Filed: <strong className="text-slate-900 font-bold">{inspectBooking.date}</strong>
              </span>
            </div>

            {/* Side-by-Side Comparison: Filing vs VRS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-900">
              <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1">
                  📝 Registration Record
                </span>
                <div className="space-y-1.5 text-slate-800">
                  <p><span className="text-slate-500 font-semibold inline-block w-16">Owner:</span> <strong className="text-slate-950 font-bold">{inspectBooking.owner}</strong></p>
                  <p><span className="text-slate-500 font-semibold inline-block w-16">Vehicle:</span> <span className="text-slate-900 font-semibold">{inspectBooking.vehicle}</span></p>
                  <p><span className="text-slate-500 font-semibold inline-block w-16">Plate:</span> <strong className="font-mono text-slate-950 font-bold bg-slate-200/80 px-1.5 py-0.5 rounded text-xs">{inspectBooking.plate || "Pending"}</strong></p>
                  <p><span className="text-slate-500 font-semibold inline-block w-16">Service:</span> <span className="text-slate-900 font-semibold">{inspectBooking.type}</span></p>
                  <p><span className="text-slate-500 font-semibold inline-block w-16">Station:</span> <span className="text-slate-900 font-semibold">{inspectBooking.branch?.name || "DVLA Adenta"}</span></p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold inline-block w-16">Officer:</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-950">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center justify-center">
                        {getBookingOfficer(inspectBooking).initials}
                      </span>
                      <span>{getBookingOfficer(inspectBooking).name}</span>
                      {getBookingOfficer(inspectBooking).username && (
                        <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          @{getBookingOfficer(inspectBooking).username}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1">
                  📄 VRS Invoice Verification
                </span>
                {inspectBooking.vrsInvoice ? (
                  <div className="space-y-1.5 text-slate-800">
                    <p><span className="text-slate-500 font-semibold inline-block w-20">Invoice:</span> <strong className="font-mono text-slate-950 font-bold">{inspectBooking.vrsInvoice.invoiceNo}</strong></p>
                    <p><span className="text-slate-500 font-semibold inline-block w-20">VRS Owner:</span> <span className="text-slate-900 font-semibold">{inspectBooking.vrsInvoice.ownerName}</span></p>
                    <p><span className="text-slate-500 font-semibold inline-block w-20">VIN:</span> <span className="font-mono text-slate-900 font-semibold">{inspectBooking.vrsInvoice.chassisNo || "—"}</span></p>
                    <p><span className="text-slate-500 font-semibold inline-block w-20">Engine:</span> <span className="font-mono text-slate-900 font-semibold">{inspectBooking.vrsInvoice.engineNo || "—"}</span></p>
                    <p><span className="text-slate-500 font-semibold inline-block w-20">Body / Fuel:</span> <span className="text-slate-900 font-semibold">{inspectBooking.vrsInvoice.bodyType} &bull; {inspectBooking.vrsInvoice.fuelType}</span></p>
                  </div>
                ) : (
                  <p className="text-slate-600 font-medium italic text-xs py-2">No direct VRS Invoice attached to this manual filing.</p>
                )}
              </div>
            </div>

            {/* Previous Title Owner & Transfer Details (if present) */}
            {(inspectBooking.previousOwnerName || inspectBooking.previousOwnerPhone || inspectBooking.previousOwnerAddress || inspectBooking.previousOwnerCustom) && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span>🔄 Previous Title Owner &amp; Transfer Record</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 uppercase">
                    Title Transfer
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-900">
                  {inspectBooking.previousOwnerName && (
                    <p><span className="text-slate-600 font-semibold">Previous Owner:</span> <strong className="text-slate-950 font-bold">{inspectBooking.previousOwnerName}</strong></p>
                  )}
                  {inspectBooking.previousOwnerPhone && (
                    <p><span className="text-slate-600 font-semibold">Contact Phone:</span> <span className="font-mono text-slate-950 font-bold">{inspectBooking.previousOwnerPhone}</span></p>
                  )}
                  {inspectBooking.previousOwnerAddress && (
                    <p className="sm:col-span-2"><span className="text-slate-600 font-semibold">Previous Address:</span> <span className="text-slate-900 font-semibold">{inspectBooking.previousOwnerAddress}</span></p>
                  )}
                  {inspectBooking.previousOwnerCustom && (
                    <p className="sm:col-span-2"><span className="text-slate-600 font-semibold">Transfer Reference:</span> <strong className="font-mono text-slate-950 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">{inspectBooking.previousOwnerCustom}</strong></p>
                  )}
                </div>
              </div>
            )}

            {/* ── Approval / Review State ── */}
            {inspectBooking.reviewedBy && (
              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                inspectBooking.status?.toLowerCase() === "approved" ? "bg-emerald-50 border-emerald-200/80" :
                inspectBooking.status?.toLowerCase() === "rejected" ? "bg-rose-50 border-rose-200/80" :
                "bg-blue-50 border-blue-200/80"
              }`}>
                <div className="flex items-center justify-between border-b border-current/20 pb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    inspectBooking.status?.toLowerCase() === "approved" ? "text-emerald-900" :
                    inspectBooking.status?.toLowerCase() === "rejected" ? "text-rose-900" :
                    "text-blue-900"
                  }`}>
                    <span>{inspectBooking.status?.toLowerCase() === "approved" ? "✓" : inspectBooking.status?.toLowerCase() === "rejected" ? "✕" : "●"}</span>
                    <span>Decision Record — {inspectBooking.status?.toUpperCase()}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-900">
                  <p>
                    <span className="text-slate-600 font-semibold">Approving Officer:</span>{" "}
                    <strong className="text-slate-950 font-bold">{inspectBooking.reviewedBy.name || inspectBooking.reviewedBy.username}</strong>
                  </p>
                  {inspectBooking.reviewedAt && (
                    <p>
                      <span className="text-slate-600 font-semibold">Date &amp; Time:</span>{" "}
                      <span className="font-mono text-slate-900 font-semibold">{new Date(inspectBooking.reviewedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </p>
                  )}
                  {inspectBooking.reviewNote && (
                    <p className="sm:col-span-2">
                      <span className="text-slate-600 font-semibold">Note / Reason:</span>{" "}
                      <span className="italic text-slate-900 font-medium">{inspectBooking.reviewNote}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Approving Officer Controls */}
            {canMakeDecisions && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Approving Officer Controls</span>
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
