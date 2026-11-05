"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  customFieldData?: Record<string, any>;
  vrsInvoiceId?: string;
  vrsInvoice?: VrsInvoice;
  createdAt?: string;
  branch?: { name?: string; code?: string };
  createdBy?: { name?: string; username?: string };
  reviewedBy?: { name?: string; username?: string; role?: string };
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [periodPreset, setPeriodPreset] = useState<"all" | "today" | "yesterday" | "this_week" | "this_month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [officerFilter, setOfficerFilter] = useState<string>("all");
  const [showProductivityPanel, setShowProductivityPanel] = useState<boolean>(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

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

  // Sync URL search parameter (?q=...) into search query
  useEffect(() => {
    const readQueryParam = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q");
        if (q) {
          setSearchQuery(q);
        }
      } catch {}
    };
    readQueryParam();
    window.addEventListener("popstate", readQueryParam);
    return () => window.removeEventListener("popstate", readQueryParam);
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

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, classificationFilter, officerFilter, periodPreset, customStartDate, customEndDate]);

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

    const initials =
      name
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
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "this_week":
        return "This Week";
      case "this_month":
        return "This Month";
      case "custom":
        if (customStartDate && customEndDate) return `${customStartDate} → ${customEndDate}`;
        if (customStartDate) return `From ${customStartDate}`;
        if (customEndDate) return `Up to ${customEndDate}`;
        return "Custom Range";
      default:
        return "All Time";
    }
  }, [periodPreset, customStartDate, customEndDate]);

  // ── Bookings within Active Period (Base for Officer Analytics) ──
  const bookingsInPeriod = useMemo(() => {
    return bookings.filter((b) => isWithinPeriod(b, periodPreset, customStartDate, customEndDate));
  }, [bookings, periodPreset, customStartDate, customEndDate]);

  // ── Available Officers list across all loaded records ──
  const availableOfficers = useMemo(() => {
    const map = new Map<string, { name: string; username?: string; count: number }>();
    bookings.forEach((b) => {
      const off = getBookingOfficer(b);
      const existing = map.get(off.name) || { name: off.name, username: off.username, count: 0 };
      existing.count += 1;
      map.set(off.name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [bookings]);

  // ── Officer Productivity & Activity Breakdown per Active Period ──
  const officerProductivityList = useMemo<OfficerProductivity[]>(() => {
    const map = new Map<string, OfficerProductivity>();

    bookingsInPeriod.forEach((b) => {
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
      .map((item) => ({
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
          (b.customFieldData?.regularPlate && String(b.customFieldData.regularPlate).toLowerCase().includes(q)) ||
          off.name.toLowerCase().includes(q) ||
          (off.username && off.username.toLowerCase().includes(q)) ||
          invNo.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [bookings, periodPreset, customStartDate, customEndDate, officerFilter, statusFilter, classificationFilter, searchQuery]);

  // ── Pagination Calculation ──
  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

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

  // ── Consistent Status Badge Style ──
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
          dot: "bg-[#81B71A]",
          label: "Approved",
        };
      case "rejected":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200/80",
          dot: "bg-rose-500",
          label: "Rejected",
        };
      case "picked":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200/80",
          dot: "bg-blue-500",
          label: "Picked Up",
        };
      default:
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200/80",
          dot: "bg-amber-500",
          label: "Pending",
        };
    }
  };

  // ── Consistent Classification Pill Style ──
  const getClassificationBadge = (classification: string) => {
    const c = (classification || "").toLowerCase();
    if (c === "commercial") {
      return "bg-amber-50 text-amber-900 border-amber-300 font-bold";
    }
    if (c === "government") {
      return "bg-slate-900 text-white border-slate-950 font-bold";
    }
    if (c === "electric") {
      return "bg-emerald-50 text-emerald-950 border-emerald-300 font-bold";
    }
    return "bg-slate-100 text-slate-800 border-slate-200 font-medium";
  };

  const hasActiveFilters =
    officerFilter !== "all" ||
    periodPreset !== "all" ||
    classificationFilter !== "all" ||
    statusFilter !== "all" ||
    Boolean(searchQuery.trim());

  function resetAllFilters() {
    setOfficerFilter("all");
    setPeriodPreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setClassificationFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  }

  function exportCSV() {
    const headers = [
      "Log ID",
      "Date Filed",
      "Desk Officer",
      "Officer Username",
      "Legal Owner",
      "Vehicle",
      "Plate Assigned",
      "Regular Plate",
      "Classification",
      "Status",
      "Branch",
    ];
    const rows = filteredBookings.map((b) => {
      const off = getBookingOfficer(b);
      return [
        b.id,
        b.date || (b.createdAt ? b.createdAt.slice(0, 10) : ""),
        `"${off.name.replace(/"/g, '""')}"`,
        off.username || "",
        `"${b.owner.replace(/"/g, '""')}"`,
        `"${b.vehicle.replace(/"/g, '""')}"`,
        b.plate || "Pending",
        b.customFieldData?.regularPlate || "",
        b.classification,
        b.status,
        `"${(b.branch?.name || "").replace(/"/g, '""')}"`,
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `dvla_booking_logs_${periodPreset}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 pb-12 font-sans text-slate-800 antialiased p-3 sm:p-5">
      {/* ── 1. Top Executive Command Header matching Dashboard Theme ── */}
      <header className="bg-white rounded-xl border border-slate-200/80 px-4 py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#103014] border border-[#24582a] p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
            <Image
              src="/dvla-bg.png"
              alt="DVLA Crest"
              width={24}
              height={24}
              priority
              className="object-contain"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Booking Logs</h1>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold border border-slate-200/80">
                Logbook
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A] animate-pulse" />
                <span>{filteredBookings.length} Active Records</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Official vehicle registration &bull; Central registry audit trail
            </p>
          </div>
        </div>

        {/* Action Controls (Standard h-8 size matching dashboard) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowProductivityPanel((prev) => !prev)}
            className={`h-8 px-2.5 sm:px-3 rounded-lg border text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
              showProductivityPanel
                ? "bg-[#103014] border-[#103014] text-white"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
            title="Toggle Officer Output Breakdown"
          >
            <span>👥 Officers ({officerProductivityList.length})</span>
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="h-8 px-2.5 sm:px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download CSV export"
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <Link
            href="/dashboard/booking"
            className="h-8 px-3 rounded-lg bg-[#81B71A] hover:bg-[#72a315] text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5"
          >
            <span>+</span>
            <span>New Booking</span>
          </Link>
        </div>
      </header>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A]" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="font-bold ml-4 cursor-pointer text-emerald-700 hover:text-emerald-950 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 2. Metric KPI Cards matching Dashboard Theme ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total in Period */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Filings in Period</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 font-mono">
              All: {stats.allTime}
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {stats.total}
            </span>
            <span className="text-[11px] text-slate-400">entries</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate">{periodLabel}</span>
            <span className="text-slate-600 font-medium">Logged</span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Approved</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700 font-mono tracking-tight">
              {stats.approved}
            </span>
            <span className="text-[11px] text-emerald-600/70">certified</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A]" />
              Ready for issuance
            </span>
            <span className="text-slate-600 font-medium font-mono">{stats.approved}</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-700 font-mono tracking-tight">
              {stats.pending}
            </span>
            <span className="text-[11px] text-amber-600/70">awaiting</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Supervisor desk</span>
            <span className="text-amber-700 font-medium">Pending action</span>
          </div>
        </div>

        {/* Picked Up / Finished */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Plates Issued</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80 font-mono">
              Picked
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-blue-700 font-mono tracking-tight">
              {stats.picked}
            </span>
            <span className="text-[11px] text-blue-600/70">delivered</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>{stats.rejected > 0 ? `${stats.rejected} rejected` : "0 rejections"}</span>
            <span className="text-slate-600 font-medium">Completed</span>
          </div>
        </div>
      </div>

      {/* ── 3. Officer Output Panel (Collapsible) ── */}
      {showProductivityPanel && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#81B71A]" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Officer Filing Performance</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {periodLabel}
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Breakdown of booking entries filed per desk officer.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {officerFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setOfficerFilter("all")}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer flex items-center gap-1"
                >
                  <span>Filtering: {officerFilter}</span>
                  <span className="text-[10px]">✕</span>
                </button>
              )}
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                {officerProductivityList.length} Officers &bull; {bookingsInPeriod.length} Entries
              </span>
            </div>
          </div>

          {officerProductivityList.length === 0 ? (
            <div className="p-4 text-center text-xs font-semibold text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              No entries filed during {periodLabel}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {officerProductivityList.map((off) => {
                const isSelected = officerFilter === off.name;
                const initials =
                  off.name
                    .split(" ")
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("") || "OF";

                return (
                  <div
                    key={off.name}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? "bg-emerald-50/70 border-[#81B71A] ring-2 ring-[#81B71A]/20 shadow-xs"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#103014] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
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
                        <span className="text-sm font-black font-mono text-slate-950 block leading-tight">
                          {off.total}
                        </span>
                        <span className="text-[9px] font-bold font-mono px-1 rounded bg-slate-200 text-slate-700">
                          {off.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Distribution Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(off.approved / off.total) * 100}%` }}
                          className="bg-[#81B71A] h-full"
                          title={`Approved: ${off.approved}`}
                        />
                        <div
                          style={{ width: `${(off.pending / off.total) * 100}%` }}
                          className="bg-amber-500 h-full"
                          title={`Pending: ${off.pending}`}
                        />
                        <div
                          style={{ width: `${(off.picked / off.total) * 100}%` }}
                          className="bg-blue-500 h-full"
                          title={`Picked: ${off.picked}`}
                        />
                        <div
                          style={{ width: `${(off.rejected / off.total) * 100}%` }}
                          className="bg-rose-500 h-full"
                          title={`Rejected: ${off.rejected}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 font-mono">
                        <span className="text-emerald-800 font-bold">✓{off.approved}</span>
                        <span className="text-amber-800 font-bold">⏳{off.pending}</span>
                        {off.picked > 0 && <span className="text-blue-800 font-bold">📦{off.picked}</span>}
                        {off.rejected > 0 && <span className="text-rose-800 font-bold">✕{off.rejected}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOfficerFilter(isSelected ? "all" : off.name)}
                      className={`w-full py-1 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? "bg-[#103014] text-white"
                          : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <span>{isSelected ? "Showing" : "Filter"}</span>
                      <span>({off.total})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Unified Search & Filter Control Bar ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        {/* Row 1: Search Box + Filters Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Plate, Owner, VIN, Officer..."
              className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#81B71A] focus:ring-1 focus:ring-[#81B71A]"
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

          <button
            type="button"
            onClick={() => setShowFiltersPanel((prev) => !prev)}
            className={`h-8 px-2.5 sm:px-3 rounded-lg border text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
              showFiltersPanel || hasActiveFilters
                ? "bg-[#103014] border-[#103014] text-white"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <span>⚙ Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A]" />
            )}
          </button>
        </div>

        {/* Row 2: Status Filter Segment Tabs (DVLA Dark Forest Green + Lime Theme) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-0.5">
          {(
            [
              { id: "all", label: "All Logs", count: bookingsInPeriod.length },
              { id: "pending", label: "Pending", count: stats.pending },
              { id: "approved", label: "Approved", count: stats.approved },
              { id: "picked", label: "Picked", count: stats.picked },
              { id: "rejected", label: "Rejected", count: stats.rejected },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`h-7 px-2.5 sm:px-3 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 ${
                  active
                    ? "bg-[#103014] text-white font-bold shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    active
                      ? "bg-white/20 text-white font-bold"
                      : "bg-white text-slate-700 border border-slate-200/80 font-semibold"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold whitespace-nowrap cursor-pointer hover:underline ml-auto pl-2 shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Row 3: Collapsible Secondary Filter Dropdowns & Timeframe */}
        {showFiltersPanel && (
          <div className="pt-2.5 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Officer Dropdown */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Desk Officer
                </label>
                <select
                  value={officerFilter}
                  onChange={(e) => setOfficerFilter(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#81B71A] cursor-pointer"
                >
                  <option value="all">All Officers ({availableOfficers.length})</option>
                  {availableOfficers.map((off) => (
                    <option key={off.name} value={off.name}>
                      {off.name} ({off.count} entries)
                    </option>
                  ))}
                </select>
              </div>

              {/* Classification Dropdown */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Plate Classification
                </label>
                <select
                  value={classificationFilter}
                  onChange={(e) => setClassificationFilter(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#81B71A] cursor-pointer"
                >
                  <option value="all">All Classifications</option>
                  <option value="private">Private (White Plate)</option>
                  <option value="commercial">Commercial (Yellow Plate)</option>
                  <option value="government">Government (GV Plate)</option>
                  <option value="electric">Electric (EV Green Plate)</option>
                  <option value="trailer">Trailer</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>
            </div>

            {/* Timeframe Presets */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Timeframe
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(
                  [
                    { id: "all", label: "All Time" },
                    { id: "today", label: "Today" },
                    { id: "yesterday", label: "Yesterday" },
                    { id: "this_week", label: "This Week" },
                    { id: "this_month", label: "This Month" },
                    { id: "custom", label: "Custom Range" },
                  ] as const
                ).map((p) => {
                  const isActive = periodPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPeriodPreset(p.id)}
                      className={`h-7 px-2.5 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                        isActive
                          ? "bg-[#103014] text-white font-bold"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {periodPreset === "custom" && (
                <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-500 font-bold text-[10px] uppercase">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-7 px-2 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-[#81B71A]"
                  />
                  <span className="text-slate-500 font-bold text-[10px] uppercase">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-7 px-2 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-[#81B71A]"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Main Logs Container: Dual Mobile Cards + Desktop Table ── */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 text-center text-xs font-semibold text-slate-500 space-y-2 shadow-2xs">
          <p>No booking records found matching your active filter criteria.</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Mobile Card Feed (Visible on Mobile: < md) ── */}
          <div className="space-y-2.5 md:hidden">
            {paginatedBookings.map((b) => {
              const badge = getStatusBadge(b.status);
              const officerInfo = getBookingOfficer(b);
              const classStyle = getClassificationBadge(b.classification);

              return (
                <div
                  key={b.id}
                  onClick={() => setInspectBooking(b)}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:border-[#81B71A] transition-all cursor-pointer space-y-2.5 active:bg-slate-50/70"
                >
                  {/* Top Bar: Log ID, Filing Date, and Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        #{b.id}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {b.date}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Plate Banner */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/70">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Assigned Plate
                      </span>
                      <div className="font-mono font-black text-sm text-slate-950 truncate tracking-wide">
                        {b.plate || <span className="text-slate-400 font-normal">Pending</span>}
                      </div>
                      {b.customFieldData?.regularPlate && (
                        <span className="text-[10px] text-slate-500 font-medium block">
                          Regular: <strong className="font-mono text-slate-700">{b.customFieldData.regularPlate}</strong>
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${classStyle}`}>
                      {b.classification}
                    </span>
                  </div>

                  {/* Owner & Vehicle Info */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Owner</span>
                      <span className="font-bold text-slate-900 truncate max-w-[210px]">{b.owner}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Vehicle</span>
                      <span className="font-medium text-slate-700 truncate max-w-[210px]">{b.vehicle}</span>
                    </div>
                  </div>

                  {/* Card Footer: Officer Initials & Review Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#103014] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                        {officerInfo.initials}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 block truncate">
                          {officerInfo.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block truncate">
                          {b.branch?.name || "DVLA Station"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectBooking(b);
                      }}
                      className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-[#81B71A] hover:text-white text-emerald-800 text-xs font-bold border border-emerald-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Review</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table (Visible on Desktop: >= md) ── */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
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
                  {paginatedBookings.map((b) => {
                    const badge = getStatusBadge(b.status);
                    const isUpdating = updatingId === b.id;
                    const officerInfo = getBookingOfficer(b);
                    const initials = officerInfo.initials;
                    const classStyle = getClassificationBadge(b.classification);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          #{b.id}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                          {b.date}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#103014] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
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
                          <div>{b.plate || <span className="text-slate-400 font-normal">Pending</span>}</div>
                          {b.customFieldData?.regularPlate && (
                            <div className="text-[10px] text-slate-500 font-normal">
                              Reg: <span className="font-semibold text-slate-700">{b.customFieldData.regularPlate}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${classStyle}`}>
                            {b.classification}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{isUpdating ? "Saving..." : badge.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectBooking(b)}
                            className="h-7 px-2.5 rounded-lg border border-slate-200 hover:border-[#81B71A] hover:bg-emerald-50/50 hover:text-emerald-800 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
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
          </div>

          {/* ── 6. Pagination Bar ── */}
          <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-600 shadow-2xs gap-2">
            <div className="text-[11px] sm:text-xs text-slate-500">
              Showing{" "}
              <strong className="text-slate-800">
                {filteredBookings.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>
              –
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, filteredBookings.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{filteredBookings.length}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition cursor-pointer"
              >
                ← Prev
              </button>

              <span className="px-2 text-[11px] font-mono font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Verification Modal / Drawer matching DVLA Theme ── */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header in DVLA Forest Green */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 bg-[#103014] text-white shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81B71A] block">
                  Logbook Record Verification
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  Log #{inspectBooking.id} &bull; {inspectBooking.owner}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBooking(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center justify-center transition cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
              {/* Digital Plate Showcase in Modal */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                <div className="w-full max-w-[240px] sm:max-w-[280px]">
                  <DigitalPlate
                    plateNumber={inspectBooking.plate || "PENDING"}
                    category={(inspectBooking.classification as PlateCategory) || "Private"}
                  />
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-700 mt-2 text-center">
                  Classification: <strong className="text-slate-900 font-bold">{inspectBooking.classification}</strong> &bull; Date Filed: <strong className="text-slate-900 font-bold">{inspectBooking.date}</strong>
                </span>
              </div>

              {/* Side-by-Side Comparison: Filing vs VRS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#103014] block border-b border-slate-200 pb-1">
                    📝 Registration Record
                  </span>
                  <div className="space-y-1.5 text-slate-800">
                    <p>
                      <span className="text-slate-400 font-medium inline-block w-16">Owner:</span>{" "}
                      <strong className="text-slate-950 font-bold">{inspectBooking.owner}</strong>
                    </p>
                    <p>
                      <span className="text-slate-400 font-medium inline-block w-16">Vehicle:</span>{" "}
                      <span className="text-slate-900 font-medium">{inspectBooking.vehicle}</span>
                    </p>
                    <p>
                      <span className="text-slate-400 font-medium inline-block w-16">Plate:</span>{" "}
                      <strong className="font-mono text-slate-950 font-bold bg-slate-200/80 px-1.5 py-0.5 rounded text-xs">
                        {inspectBooking.plate || "Pending"}
                      </strong>
                    </p>
                    {inspectBooking.customFieldData?.regularPlate && (
                      <p>
                        <span className="text-slate-400 font-medium inline-block w-20">Regular No:</span>{" "}
                        <strong className="font-mono text-slate-950 font-bold bg-slate-200/80 px-1.5 py-0.5 rounded text-xs">
                          {inspectBooking.customFieldData.regularPlate}
                        </strong>
                      </p>
                    )}
                    <p>
                      <span className="text-slate-400 font-medium inline-block w-16">Service:</span>{" "}
                      <span className="text-slate-900 font-medium">{inspectBooking.type}</span>
                    </p>
                    <p>
                      <span className="text-slate-400 font-medium inline-block w-16">Station:</span>{" "}
                      <span className="text-slate-900 font-medium">{inspectBooking.branch?.name || "DVLA Head Office"}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium inline-block w-16">Officer:</span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-950">
                        <span className="w-5 h-5 rounded-full bg-[#103014] text-white text-[9px] font-bold inline-flex items-center justify-center">
                          {getBookingOfficer(inspectBooking).initials}
                        </span>
                        <span>{getBookingOfficer(inspectBooking).name}</span>
                        {getBookingOfficer(inspectBooking).username && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded font-mono">
                            @{getBookingOfficer(inspectBooking).username}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#103014] block border-b border-slate-200 pb-1">
                    📄 VRS Invoice Verification
                  </span>
                  {inspectBooking.vrsInvoice ? (
                    <div className="space-y-1.5 text-slate-800">
                      <p>
                        <span className="text-slate-400 font-medium inline-block w-20">Invoice:</span>{" "}
                        <strong className="font-mono text-slate-950 font-bold">{inspectBooking.vrsInvoice.invoiceNo}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400 font-medium inline-block w-20">VRS Owner:</span>{" "}
                        <span className="text-slate-900 font-medium">{inspectBooking.vrsInvoice.ownerName}</span>
                      </p>
                      <p>
                        <span className="text-slate-400 font-medium inline-block w-20">VIN:</span>{" "}
                        <span className="font-mono text-slate-900 font-medium">{inspectBooking.vrsInvoice.chassisNo || "—"}</span>
                      </p>
                      <p>
                        <span className="text-slate-400 font-medium inline-block w-20">Engine:</span>{" "}
                        <span className="font-mono text-slate-900 font-medium">{inspectBooking.vrsInvoice.engineNo || "—"}</span>
                      </p>
                      <p>
                        <span className="text-slate-400 font-medium inline-block w-20">Body / Fuel:</span>{" "}
                        <span className="text-slate-900 font-medium">
                          {inspectBooking.vrsInvoice.bodyType} &bull; {inspectBooking.vrsInvoice.fuelType}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 font-medium italic text-xs py-2">
                      No direct VRS Invoice attached to this manual filing.
                    </p>
                  )}
                </div>
              </div>

              {/* Previous Title Owner & Transfer Details */}
              {(inspectBooking.previousOwnerName ||
                inspectBooking.previousOwnerPhone ||
                inspectBooking.previousOwnerAddress ||
                inspectBooking.previousOwnerCustom) && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/70 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      <span>🔄 Previous Title Owner &amp; Transfer Record</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 uppercase">
                      Title Transfer
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-900">
                    {inspectBooking.previousOwnerName && (
                      <p>
                        <span className="text-slate-500 font-medium">Previous Owner:</span>{" "}
                        <strong className="text-slate-950 font-bold">{inspectBooking.previousOwnerName}</strong>
                      </p>
                    )}
                    {inspectBooking.previousOwnerPhone && (
                      <p>
                        <span className="text-slate-500 font-medium">Contact Phone:</span>{" "}
                        <span className="font-mono text-slate-950 font-bold">{inspectBooking.previousOwnerPhone}</span>
                      </p>
                    )}
                    {inspectBooking.previousOwnerAddress && (
                      <p className="sm:col-span-2">
                        <span className="text-slate-500 font-medium">Previous Address:</span>{" "}
                        <span className="text-slate-900 font-medium">{inspectBooking.previousOwnerAddress}</span>
                      </p>
                    )}
                    {inspectBooking.previousOwnerCustom && (
                      <p className="sm:col-span-2">
                        <span className="text-slate-500 font-medium">Transfer Reference:</span>{" "}
                        <strong className="font-mono text-slate-950 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">
                          {inspectBooking.previousOwnerCustom}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Decision Log */}
              {inspectBooking.reviewedBy && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                    inspectBooking.status?.toLowerCase() === "approved"
                      ? "bg-emerald-50/70 border-emerald-200/80"
                      : inspectBooking.status?.toLowerCase() === "rejected"
                      ? "bg-rose-50/70 border-rose-200/80"
                      : "bg-blue-50/70 border-blue-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-current/20 pb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        inspectBooking.status?.toLowerCase() === "approved"
                          ? "text-emerald-900"
                          : inspectBooking.status?.toLowerCase() === "rejected"
                          ? "text-rose-900"
                          : "text-blue-900"
                      }`}
                    >
                      <span>
                        {inspectBooking.status?.toLowerCase() === "approved"
                          ? "✓"
                          : inspectBooking.status?.toLowerCase() === "rejected"
                          ? "✕"
                          : "●"}
                      </span>
                      <span>Decision Record — {inspectBooking.status?.toUpperCase()}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-900">
                    <p>
                      <span className="text-slate-500 font-medium">Approving Officer:</span>{" "}
                      <strong className="text-slate-950 font-bold">
                        {inspectBooking.reviewedBy.name || inspectBooking.reviewedBy.username}
                      </strong>
                    </p>
                    {inspectBooking.reviewedAt && (
                      <p>
                        <span className="text-slate-500 font-medium">Date &amp; Time:</span>{" "}
                        <span className="font-mono text-slate-900 font-medium">
                          {new Date(inspectBooking.reviewedAt).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </p>
                    )}
                    {inspectBooking.reviewNote && (
                      <p className="sm:col-span-2">
                        <span className="text-slate-500 font-medium">Note / Reason:</span>{" "}
                        <span className="italic text-slate-900 font-medium">{inspectBooking.reviewNote}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Actions Footer with Theme Colors */}
            {canMakeDecisions && (
              <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                  Officer Action:
                </span>
                <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(inspectBooking.id, "approved")}
                    className="h-8 py-1.5 px-3 rounded-lg bg-[#103014] hover:bg-[#18481e] text-white text-xs font-bold transition shadow-2xs cursor-pointer text-center"
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(inspectBooking.id, "picked")}
                    className="h-8 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer text-center"
                  >
                    Mark Picked
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(inspectBooking.id, "rejected")}
                    className="h-8 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer text-center"
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
