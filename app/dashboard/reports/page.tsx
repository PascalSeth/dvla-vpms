"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BookingRecord {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string;
  date: string;
  classification: string;
}

interface PickupRegistration {
  id: string;
  name: string;
  phone: string;
  plateNumber: string;
  timestamp: string;
  status: "pending" | "completed";
}

type TimeFilter = "all" | "month" | "week" | "today";

export default function ReportsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [pickups, setPickups] = useState<PickupRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [userRole, setUserRole] = useState("SUPERADMIN");

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
      } else {
        // Fallback
        const storedPickups = JSON.parse(localStorage.getItem("dvla_pickups") || "[]");
        setPickups(storedPickups);
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

  // Filter logic
  const now = new Date();
  const filterByTime = (dateStr: string, format: "date" | "timestamp") => {
    if (timeFilter === "all") return true;

    let itemDate = new Date();
    if (format === "date") {
      // YYYY-MM-DD
      itemDate = new Date(dateStr);
    } else {
      // e.g. "Jul 27, 2026, 08:30 PM"
      itemDate = new Date(dateStr);
    }

    if (isNaN(itemDate.getTime())) return true; // fallback if parse fails

    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeFilter === "today") return diffDays <= 1 && now.getDate() === itemDate.getDate();
    if (timeFilter === "week") return diffDays <= 7;
    if (timeFilter === "month") return diffDays <= 30;

    return true;
  };

  const filteredBookings = bookings.filter(b => filterByTime(b.date, "date"));
  const filteredPickups = pickups.filter(p => filterByTime(p.timestamp, "timestamp"));

  const totalFiled = filteredBookings.length;
  // A plate is considered "Issued" if it exists in pickups with status "completed"
  const issuedPlates = filteredPickups.filter(p => p.status === "completed").length;
  
  // Pending issuance are the ones that have been filed but not yet completed pickup
  const pendingIssuance = totalFiled - issuedPlates;
  const issuanceRatio = totalFiled > 0 ? Math.round((issuedPlates / totalFiled) * 100) : 0;

  if (userRole === "DATA_ENTRY") {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 my-8 shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          📊
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          System Analytics and Financial Performance Reports are restricted to <strong>SuperAdmin</strong> and <strong>Supervisor</strong> roles. Your account (Data Entry) does not have permission to view reporting metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #0d1a03 0%, #1a2e05 35%, #2d5009 70%, #4a7c10 100%)" }}>
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="reportgrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#reportgrid)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/20 backdrop-blur-md">
                DVLA HQ · Analytics
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Plate Issuance Reports
            </h1>
            <p className="text-white/70 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
              Track vehicle plate filing volumes versus physical plate issuance metrics. Filter by time to analyze performance.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-md border border-white/20">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeFilter(tf.id as TimeFilter)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === tf.id
                    ? "bg-white text-[#1a2e05] shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b7a99]">
          <div className="w-10 h-10 border-4 border-[#81B71A]/20 border-t-[#81B71A] rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-sm uppercase tracking-widest">Compiling Analytics...</p>
        </div>
      ) : (
        <>
          {/* Top Level KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border-l-4 border-[#3b82f6] shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-[#9aa3be] uppercase tracking-wider mb-2">Plates Filed (Total)</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-[#1a2e05] leading-none">{totalFiled}</p>
                <span className="text-[10px] font-bold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full">100% Volume</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border-l-4 border-[#81B71A] shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-[#9aa3be] uppercase tracking-wider mb-2">Plates Issued</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-[#3d6b08] leading-none">{issuedPlates}</p>
                <span className="text-[10px] font-bold text-[#81B71A] bg-[#81B71A]/10 px-2 py-0.5 rounded-full">Completed</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border-l-4 border-[#f59e0b] shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-[#9aa3be] uppercase tracking-wider mb-2">Pending Issuance</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-[#92610a] leading-none">{Math.max(0, pendingIssuance)}</p>
                <span className="text-[10px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">In Queue</span>
              </div>
            </div>

            <div className="bg-[#1a2e05] rounded-xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#81B71A] opacity-10 rounded-bl-full blur-2xl"></div>
              <p className="text-xs font-bold text-[#81B71A] uppercase tracking-wider mb-2 relative z-10">Issuance Ratio</p>
              <div className="flex items-end gap-2 relative z-10">
                <p className="text-4xl font-black text-white leading-none">{issuanceRatio}%</p>
                <p className="text-xs text-[#a3b8cc] mb-1 font-medium">{issuedPlates} out of {totalFiled} plates</p>
              </div>
              <div className="w-full bg-[#2d5009] h-1.5 rounded-full mt-4 overflow-hidden relative z-10">
                <div className="bg-[#81B71A] h-full rounded-full transition-all duration-1000" style={{ width: `${issuanceRatio}%` }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-xl border border-[#e8edf5] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-[#1a2e05] tracking-tight">Recent Issuances</h3>
                  <p className="text-xs text-[#6b7a99]">Latest plates successfully handed over to clients.</p>
                </div>
                <div className="p-2 bg-[#81B71A]/10 text-[#81B71A] rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                {filteredPickups.filter(p => p.status === "completed").slice(0, 5).length > 0 ? (
                  filteredPickups.filter(p => p.status === "completed").slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-[#e8edf5] bg-[#f8faff]">
                      <div>
                        <p className="font-mono font-bold text-[#1a2e05]">{p.plateNumber}</p>
                        <p className="text-[10px] font-bold text-[#6b7a99] uppercase mt-0.5">{p.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#81B71A]/10 text-[#3d6b08] border border-[#81B71A]/20">Issued</span>
                        <p className="text-[10px] text-[#9aa3be] mt-1">{p.timestamp}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-[#9aa3be] text-center py-6">No plates issued for this period.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#e8edf5] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-[#1a2e05] tracking-tight">Filing Backlog</h3>
                  <p className="text-xs text-[#6b7a99]">Latest filed plates waiting for issuance.</p>
                </div>
                <div className="p-2 bg-[#f59e0b]/10 text-[#f59e0b] rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                {filteredBookings.filter(b => !filteredPickups.some(p => p.plateNumber === b.plate && p.status === "completed")).slice(0, 5).length > 0 ? (
                  filteredBookings.filter(b => !filteredPickups.some(p => p.plateNumber === b.plate && p.status === "completed")).slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-[#e8edf5]">
                      <div>
                        <p className="font-mono font-bold text-[#1a2e05]">{b.plate || b.type}</p>
                        <p className="text-[10px] font-bold text-[#6b7a99] uppercase mt-0.5">{b.owner}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b]/10 text-[#92610a] border border-[#f59e0b]/20">Pending</span>
                        <p className="text-[10px] text-[#9aa3be] mt-1">{b.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-[#9aa3be] text-center py-6">No pending backlog for this period.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
