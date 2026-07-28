"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredReservations, fetchReservationsFromDB, Reservation } from "../../../../components/reservationsData";

export default function ReservedPlatesPage() {
  const [reservations, setReservations] = useState<Reservation[]>(() => getStoredReservations());

  useEffect(() => {
    async function loadData() {
      const data = await fetchReservationsFromDB();
      setReservations(data);
    }
    loadData();
  }, []);

  const totalReserved = reservations.reduce((acc, r) => acc + r.totalCount, 0);
  const claimed = reservations.reduce((acc, r) => acc + r.claimedCount, 0);
  const available = totalReserved - claimed;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Banner */}
      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0d1a03 0%, #1a2e05 50%, #2d5009 100%)" }}>
        <h1 className="text-4xl font-bold text-white mb-2">Reserved Plates</h1>
        <p className="text-white/60 text-lg">Check availability and manage reserved numbers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Reserved", value: totalReserved.toLocaleString(), color: "#3b82f6" },
          { label: "Claimed", value: claimed.toLocaleString(), color: "#f59e0b" },
          { label: "Available", value: available.toLocaleString(), color: "#81B71A" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 border border-l-4" style={{ borderLeftColor: stat.color, boxShadow: "0 2px 8px rgba(0,0,0,0.045)" }}>
            <p className="text-xs font-bold text-[#9aa3be] uppercase mb-2">{stat.label}</p>
            <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Reservations by Type */}
      <div className="bg-white rounded-xl border border-[#e8edf5] p-6" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
        <h2 className="text-lg font-bold mb-6" style={{ color: "#1a2e05" }}>Reserved Numbers by Type</h2>
        <div className="space-y-4">
          {reservations.map((res) => {
            const utilization = (res.claimedCount / res.totalCount) * 100;
            const available = res.totalCount - res.claimedCount;

            return (
              <div key={res.id} className="border border-[#e8edf5] rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: "#1a2e05" }}>{res.holder}</h3>
                    <p className="text-xs text-[#9aa3be] mt-1">Prefix: <span className="font-mono font-bold">{res.prefix}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "#81B71A" }}>{available}</p>
                    <p className="text-xs text-[#9aa3be]">available</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "#6b7a99" }}>Usage</span>
                    <span style={{ color: "#1a2e05" }} className="font-bold">{res.claimedCount} / {res.totalCount}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f0f3f8]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${utilization}%`,
                        background: utilization > 80 ? "#ef4444" : utilization > 50 ? "#f59e0b" : "#81B71A",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[#f8faff] rounded-lg p-4 border border-[#e8edf5]">
        <p className="text-xs font-bold text-[#9aa3be] uppercase mb-3">Legend</p>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#81B71A" }} />
            <span className="text-xs text-[#6b7a99]">Good (0-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
            <span className="text-xs text-[#6b7a99]">Caution (50-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
            <span className="text-xs text-[#6b7a99]">Critical (80%+)</span>
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
