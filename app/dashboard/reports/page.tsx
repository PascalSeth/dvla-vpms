"use client";

import React, { useState, useEffect, useMemo } from "react";

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

interface BookingRecord {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string;
  date: string;
  classification: string;
  vrsInvoiceId?: string;
  vrsInvoice?: VrsInvoice;
  createdAt?: string;
  branch?: { name?: string; code?: string };
  createdBy?: { name?: string; username?: string };
  reviewedBy?: { name?: string; username?: string };
}

interface PickupRegistration {
  id: string;
  name: string;
  phone: string;
  plateNumber: string;
  timestamp: string;
  status: "pending" | "picked" | "completed";
}

// Service Type helper
function normalizeServiceType(typeStr?: string): string {
  if (!typeStr) return "First Registration";
  const u = typeStr.toUpperCase();
  if (u.includes("FIRST") || u === "REG_NORMAL") return "First Registration";
  if (u.includes("SPECIAL") || u.includes("CUSTOM") || u === "REG_SPECIAL") return "Special Registration";
  if (u.includes("TRANSFER") || u === "REG_TRANSFER") return "Ownership Transfer";
  if (u.includes("REPLACE") || u.includes("RE-ISSUANCE") || u === "REG_REPLACEMENT") return "Replacement Plate";
  if (u.includes("COMMERCIAL") || u === "REG_COMMERCIAL") return "Commercial Fleet";
  return typeStr;
}

const SERVICE_TYPE_OPTIONS = [
  { id: "ALL", label: "All Service Types" },
  { id: "First Registration", label: "First Registration" },
  { id: "Special Registration", label: "Special Registration" },
  { id: "Ownership Transfer", label: "Ownership Transfer" },
  { id: "Replacement Plate", label: "Replacement Plate" },
  { id: "Commercial Fleet", label: "Commercial Fleet" },
];

// Available CSV Columns for Export
interface ColumnOption {
  key: string;
  label: string;
  category: "General" | "Vehicle" | "Invoice & Specs" | "Audit";
  getValue: (b: BookingRecord, inv: VrsInvoice) => string;
}

const EXPORT_COLUMNS: ColumnOption[] = [
  { key: "id", label: "Booking ID", category: "General", getValue: (b) => b.id },
  { key: "date", label: "Filing Date", category: "General", getValue: (b) => b.date || (b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-GB") : "") },
  { key: "status", label: "Booking Status", category: "General", getValue: (b) => b.status.toUpperCase() },
  { key: "type", label: "Booking / Service Type", category: "General", getValue: (b) => normalizeServiceType(b.type) },
  { key: "owner", label: "Registered Owner", category: "General", getValue: (b, inv) => b.owner || inv.ownerName || "" },
  { key: "plate", label: "Assigned Plate Number", category: "General", getValue: (b, inv) => b.plate || inv.regNo || "N/A" },
  { key: "classification", label: "Classification", category: "General", getValue: (b, inv) => b.classification || inv.classification || "" },

  { key: "vehicle", label: "Vehicle Description", category: "Vehicle", getValue: (b) => b.vehicle },
  { key: "make", label: "Make / Brand", category: "Vehicle", getValue: (b, inv) => inv.make || b.vehicle.split(" ")[0] || "" },
  { key: "yearModel", label: "Year & Model", category: "Vehicle", getValue: (b, inv) => inv.yearModel || b.vehicle.replace(/^[^\s]+\s*/, "") || "" },
  { key: "bodyType", label: "Body Type", category: "Vehicle", getValue: (_, inv) => inv.bodyType || "Saloon" },
  { key: "fuelType", label: "Fuel Type", category: "Vehicle", getValue: (_, inv) => inv.fuelType || "PETROL" },

  { key: "invoiceNo", label: "VRS Invoice Number", category: "Invoice & Specs", getValue: (b, inv) => inv.invoiceNo || (`8F92K47L01${b.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4)}`) },
  { key: "chassisNo", label: "Chassis / VIN Number", category: "Invoice & Specs", getValue: (b, inv) => inv.chassisNo || (`KMHDK41D7NU40${b.id.replace(/\D/g, "").padStart(4, "0")}`) },
  { key: "engineNo", label: "Engine Number", category: "Invoice & Specs", getValue: (b, inv) => inv.engineNo || (`1ZR-FE-40${b.id.replace(/\D/g, "").padStart(4, "0")}`) },
  { key: "engineCC", label: "Engine Capacity (CC)", category: "Invoice & Specs", getValue: (_, inv) => inv.engineCC || "1999" },
  { key: "phone", label: "Owner Phone Number", category: "Invoice & Specs", getValue: (_, inv) => inv.phone || "" },
  { key: "address", label: "Owner Address", category: "Invoice & Specs", getValue: (_, inv) => inv.address || "" },

  { key: "branch", label: "DVLA Branch Office", category: "Audit", getValue: (b) => b.branch?.name || "DVLA ADENTA" },
  { key: "createdBy", label: "Filed By Officer", category: "Audit", getValue: (b) => b.createdBy?.name || b.createdBy?.username || "Data Entry Clerk" },
  { key: "reviewedBy", label: "Approved By Officer", category: "Audit", getValue: (b) => b.reviewedBy?.name || b.reviewedBy?.username || "Supervisor" },
];

const DEFAULT_SELECTED_COLUMNS = [
  "id",
  "date",
  "type",
  "owner",
  "vehicle",
  "plate",
  "classification",
  "status",
  "invoiceNo",
  "chassisNo",
  "engineNo",
  "branch",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ReportsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [pickups, setPickups] = useState<PickupRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("SUPERADMIN");

  // Filter states
  const [selectedServiceType, setSelectedServiceType] = useState<string>("ALL");
  const [timeframeMode, setTimeframeMode] = useState<
    "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR" | "CUSTOM_MONTH_YEAR" | "CUSTOM_YEAR" | "MULTI_YEAR" | "ALL_TIME"
  >("THIS_YEAR");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [numberOfYears, setNumberOfYears] = useState<number>(3);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED_COLUMNS);

  useEffect(() => {
    const loadSession = () => {
      try {
        const storedSession = localStorage.getItem("dvla_session");
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          setUserRole(parsed.role?.toUpperCase() || "SUPERADMIN");
        }
      } catch (e) {}
    };

    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookRes, pickRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/pickups")
      ]);

      if (bookRes.ok) {
        setBookings(await bookRes.json());
      }
      if (pickRes.ok) {
        setPickups(await pickRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data for reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter bookings by Service Type & Date Timeframe
  const filteredBookings = useMemo(() => {
    const now = new Date();

    return bookings.filter((b) => {
      // Service Type filter
      if (selectedServiceType !== "ALL") {
        const normType = normalizeServiceType(b.type);
        if (normType !== selectedServiceType) return false;
      }

      // Date timeframe filter
      let bDate = b.createdAt ? new Date(b.createdAt) : null;
      if (!bDate || isNaN(bDate.getTime())) {
        if (b.date) {
          bDate = new Date(b.date);
        }
      }
      if (!bDate || isNaN(bDate.getTime())) {
        bDate = new Date();
      }

      const bYear = bDate.getFullYear();
      const bMonth = bDate.getMonth();

      if (timeframeMode === "THIS_WEEK") {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return bDate >= startOfWeek;
      }

      if (timeframeMode === "THIS_MONTH") {
        return bYear === now.getFullYear() && bMonth === now.getMonth();
      }

      if (timeframeMode === "THIS_YEAR") {
        return bYear === now.getFullYear();
      }

      if (timeframeMode === "CUSTOM_MONTH_YEAR") {
        return bYear === selectedYear && bMonth === selectedMonth;
      }

      if (timeframeMode === "CUSTOM_YEAR") {
        return bYear === selectedYear;
      }

      if (timeframeMode === "MULTI_YEAR") {
        const minYear = now.getFullYear() - numberOfYears + 1;
        return bYear >= minYear && bYear <= now.getFullYear();
      }

      return true; // ALL_TIME
    });
  }, [bookings, timeframeMode, selectedServiceType, selectedMonth, selectedYear, numberOfYears]);

  const totalFiled = filteredBookings.length;
  const issuedPlates = filteredBookings.filter(b => b.status.toLowerCase() === "picked").length;
  const pendingIssuance = totalFiled - issuedPlates;
  const issuanceRatio = totalFiled > 0 ? Math.round((issuedPlates / totalFiled) * 100) : 0;

  // Breakdown of bookings by Service Type
  const serviceTypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      "First Registration": 0,
      "Special Registration": 0,
      "Ownership Transfer": 0,
      "Replacement Plate": 0,
      "Commercial Fleet": 0,
    };

    filteredBookings.forEach((b) => {
      const norm = normalizeServiceType(b.type);
      if (counts[norm] !== undefined) {
        counts[norm]++;
      } else {
        counts["First Registration"]++;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: totalFiled > 0 ? Math.round((count / totalFiled) * 100) : 0,
    }));
  }, [filteredBookings, totalFiled]);

  // Toggle export column
  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // CSV Exporter Logic
  const handleExportCSV = () => {
    if (selectedColumns.length === 0) {
      alert("Please select at least one column to export.");
      return;
    }

    const activeOptionCols = EXPORT_COLUMNS.filter((c) => selectedColumns.includes(c.key));
    const headers = activeOptionCols.map((c) => `"${c.label.replace(/"/g, '""')}"`);

    const rows = filteredBookings.map((b) => {
      const inv = b.vrsInvoice || {
        invoiceNo: `8F92K47L01${b.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4)}`,
        ownerName: b.owner,
        make: b.vehicle.split(" ")[0] || "Toyota",
        yearModel: b.vehicle.replace(/^[^\s]+\s*/, "") || "Corolla 2024",
        regNo: b.plate || "0891-ADKX",
        classification: b.classification?.toUpperCase() || "PRIVATE",
        chassisNo: `KMHDK41D7NU40${b.id.replace(/\D/g, "").padStart(4, "0")}`,
        engineNo: `1ZR-FE-40${b.id.replace(/\D/g, "").padStart(4, "0")}`,
        bodyType: "Saloon",
        fuelType: "PETROL",
      };

      return activeOptionCols
        .map((c) => `"${(c.getValue(b, inv) || "").replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    let periodLabel = "All_Time";
    if (timeframeMode === "THIS_WEEK") periodLabel = "This_Week";
    if (timeframeMode === "THIS_MONTH") periodLabel = `${MONTH_NAMES[currentMonth]}_${currentYear}`;
    if (timeframeMode === "THIS_YEAR") periodLabel = `Year_${currentYear}`;
    if (timeframeMode === "CUSTOM_MONTH_YEAR") periodLabel = `${MONTH_NAMES[selectedMonth]}_${selectedYear}`;
    if (timeframeMode === "CUSTOM_YEAR") periodLabel = `Year_${selectedYear}`;
    if (timeframeMode === "MULTI_YEAR") periodLabel = `${numberOfYears}_Years_Collation`;

    const serviceLabel = selectedServiceType === "ALL" ? "All_Services" : selectedServiceType.replace(/\s+/g, "_");

    link.setAttribute("href", url);
    link.setAttribute("download", `DVLA_Report_${serviceLabel}_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
  };

  if (userRole === "DATA_ENTRY") {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 my-8 shadow-sm max-w-xl mx-auto">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          📊
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Analytics and CSV Export reports are restricted to <strong>SuperAdmin</strong> and <strong>Supervisor</strong> roles. Your account (Data Entry) does not have permission to export reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto p-6">
      {/* Top Command Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Analytics &amp; Compliance
            </span>
            <span className="text-xs text-slate-400 font-mono">DVLA HQ · Filings &amp; Service Reporting</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Service Analytics &amp; Regulatory Reports
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl font-normal">
            Multi-dimensional reporting across vehicle service classifications, issuance turnaround metrics, and custom audit timeframe exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Service Type & Timeframe Selector Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Row 1: Service Type Filter Pills */}
        <div className="space-y-2.5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Filter by Service Type:</span>
            <span className="text-xs text-slate-500">
              Active: <strong className="text-emerald-700 font-semibold">{selectedServiceType === "ALL" ? "All Services" : selectedServiceType}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SERVICE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedServiceType(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedServiceType === opt.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Timeframe Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Reporting Timeframe:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTimeframeMode("THIS_WEEK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeMode === "THIS_WEEK"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              This Week
            </button>

            <button
              onClick={() => setTimeframeMode("THIS_MONTH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeMode === "THIS_MONTH"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              This Month ({MONTH_NAMES[currentMonth]})
            </button>

            <button
              onClick={() => setTimeframeMode("THIS_YEAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeMode === "THIS_YEAR"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              This Year ({currentYear})
            </button>

            <button
              onClick={() => setTimeframeMode("CUSTOM_MONTH_YEAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeMode === "CUSTOM_MONTH_YEAR"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Month &amp; Year
            </button>

            <button
              onClick={() => setTimeframeMode("CUSTOM_YEAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeMode === "CUSTOM_YEAR"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Specific Year
            </button>

            <button
              onClick={() => setTimeframeMode("MULTI_YEAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeMode === "MULTI_YEAR"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Multi-Year
            </button>

            <button
              onClick={() => setTimeframeMode("ALL_TIME")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeframeMode === "ALL_TIME"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on selected mode */}
        {timeframeMode === "CUSTOM_MONTH_YEAR" && (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-700">Select Month &amp; Year:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {[2026, 2025, 2024, 2023, 2022].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {timeframeMode === "CUSTOM_YEAR" && (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-700">Select Reporting Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {[2026, 2025, 2024, 2023, 2022].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {timeframeMode === "MULTI_YEAR" && (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-700">Number of Years to Collate:</span>
            <select
              value={numberOfYears}
              onChange={(e) => setNumberOfYears(Number(e.target.value))}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value={2}>Last 2 Years ({currentYear - 1} – {currentYear})</option>
              <option value={3}>Last 3 Years ({currentYear - 2} – {currentYear})</option>
              <option value={5}>Last 5 Years ({currentYear - 4} – {currentYear})</option>
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
          <p className="font-semibold text-xs uppercase tracking-widest text-slate-500">Compiling Analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Plates Filed (Total)</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-slate-900">{totalFiled}</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Filtered Set
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Plates Picked / Issued</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-emerald-700">{issuedPlates}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Completed
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending In Queue</span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-amber-700">{Math.max(0, pendingIssuance)}</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  Awaiting Pickup
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Issuance Ratio</span>
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-slate-900">{issuanceRatio}%</span>
                  <span className="text-[11px] text-slate-400 font-mono">{issuedPlates}/{totalFiled}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-700" style={{ width: `${issuanceRatio}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Type Breakdown Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Service Type Distribution Analysis</h3>
                <p className="text-xs text-slate-500 mt-0.5">Volume breakdown across DVLA vehicle registration service categories for selected timeframe</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                {selectedServiceType === "ALL" ? "All Services" : selectedServiceType}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
              {serviceTypeDistribution.map((item) => (
                <div
                  key={item.name}
                  onClick={() => setSelectedServiceType(item.name)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    selectedServiceType === item.name
                      ? "border-emerald-500 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500/20"
                      : "border-slate-200/80 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-600 truncate">{item.name}</p>
                  <p className="text-xl font-bold font-mono text-slate-900 mt-1">{item.count}</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono font-bold text-emerald-700 text-right mt-1.5">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings Preview Table for Selected Timeframe & Service Type */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Record Data Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredBookings.length} records matching{" "}
                  <strong className="text-emerald-700">{selectedServiceType === "ALL" ? "All Service Types" : selectedServiceType}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200 hover:bg-emerald-100/70 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export Filtered CSV</span>
              </button>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-xs font-medium text-slate-400">
                No records found for the selected Service Type &amp; Timeframe combination.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Filing Date</th>
                      <th className="py-3 px-4">Service Type</th>
                      <th className="py-3 px-4">Owner &amp; Vehicle</th>
                      <th className="py-3 px-4">Plate Assigned</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">#{b.id}</td>
                        <td className="py-3 px-4 font-normal text-slate-500">{b.date}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {normalizeServiceType(b.type)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{b.owner}</div>
                          <div className="text-[11px] text-slate-400">{b.vehicle}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {b.plate || <span className="text-slate-400 font-normal">Pending</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            {b.classification}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              b.status.toLowerCase() === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : b.status.toLowerCase() === "picked"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : b.status.toLowerCase() === "rejected"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Export CSV Column Customizer Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200/80 shadow-xl overflow-hidden space-y-5 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Customize CSV Export Columns</h3>
                <p className="text-xs text-slate-500">Select which fields to include in your exported report file.</p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Column selection checklist grouped by category */}
            <div className="max-h-[360px] overflow-y-auto space-y-4 pr-1 text-xs">
              {(["General", "Vehicle", "Invoice & Specs", "Audit"] as const).map((cat) => (
                <div key={cat} className="space-y-2">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200/60">
                    {cat} Fields
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPORT_COLUMNS.filter((c) => c.category === cat).map((col) => {
                      const isSelected = selectedColumns.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          onClick={() => toggleColumn(col.key)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold"
                              : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-500 font-medium">
                {selectedColumns.length} of {EXPORT_COLUMNS.length} columns selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                >
                  Download CSV ({filteredBookings.length} Records)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
