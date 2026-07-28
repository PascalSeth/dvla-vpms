"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Booking {
  id: string;
  type: string;
  status: string;
  owner: string;
  vehicle: string;
  plate?: string;
  date: string;
  classification: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>("all");
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

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
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

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return { bg: "rgba(129,183,26,0.09)", color: "#3d6b08" };
      case "pending": return { bg: "rgba(245,158,11,0.09)", color: "#92610a" };
      case "rejected": return { bg: "rgba(239,68,68,0.09)", color: "#991b1b" };
      default: return { bg: "rgba(59,130,246,0.09)", color: "#1e40af" };
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Banner */}
      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0d1a03 0%, #1a2e05 50%, #2d5009 100%)" }}>
        <h1 className="text-4xl font-bold text-white mb-2">Booking History</h1>
        <p className="text-white/60 text-lg">Track all plate bookings and their status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: stats.total, color: "#81B71A" },
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          { label: "Approved", value: stats.approved, color: "#3b82f6" },
          { label: "Rejected", value: stats.rejected, color: "#ef4444" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border-l-4" style={{ borderLeftColor: stat.color, boxShadow: "0 2px 8px rgba(0,0,0,0.045)" }}>
            <p className="text-xs font-bold text-[#9aa3be] uppercase">{stat.label}</p>
            <p className="text-3xl font-bold mt-2" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filter === tab
                ? "bg-[#81B71A] text-white"
                : "bg-white border border-[#e8edf5] text-[#6b7a99] hover:border-[#81B71A]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
                {(userRole === "SUPERADMIN" || userRole === "SUPERVISOR")
                  ? ["Booking ID", "Type", "Owner", "Vehicle", "Plate", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "#9aa3be" }}>
                        {h}
                      </th>
                    ))
                  : ["Booking ID", "Type", "Owner", "Vehicle", "Plate", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "#9aa3be" }}>
                        {h}
                      </th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((booking) => {
                  const statusStyle = getStatusColor(booking.status);
                  return (
                    <tr key={booking.id} className="border-t hover:bg-[#fafbfe] transition-colors cursor-pointer" style={{ borderColor: "#f0f3f8" }}>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md" style={{ background: "rgba(129,183,26,0.07)", color: "#2d5009" }}>
                          {booking.id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#6b7a99" }}>{booking.type}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold" style={{ color: "#374167" }}>{booking.owner}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#6b7a99" }}>{booking.vehicle}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs">{booking.plate || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border" style={{ ...statusStyle, border: `1px solid ${statusStyle.color}33` }}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#b0bbd6" }}>{booking.date}</td>
                      {(userRole === "SUPERADMIN" || userRole === "SUPERVISOR") && (
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                          {booking.status === "pending" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "approved" } : b));
                                }}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "rejected" } : b));
                                }}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded transition"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Locked</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center" style={{ color: "#9aa3be" }}>
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Back Button */}
      <Link href="/dashboard" className="inline-block px-4 py-2 rounded-lg text-sm font-bold" style={{ background: "#81B71A", color: "white" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
