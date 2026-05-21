"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "/dashboard":                      "Dashboard",
  "/dashboard/booking":              "Booking Desk",
  "/dashboard/plates":               "Vehicle Plates",
  "/dashboard/reports":              "Reports",
  "/dashboard/audit":                "Audit Log",
  "/dashboard/settings":             "Settings",
  "/dashboard/help":                 "Help & Workflow",
};

interface TopbarProps {
  onMobileMenuOpen: () => void;
}

export default function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);
  const pageTitle = LABELS[pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-5 h-16 bg-white border-b border-[#e8edf5] shrink-0"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>

      {/* Mobile hamburger */}
      <button onClick={onMobileMenuOpen}
        className="lg:hidden flex flex-col gap-1.5 p-1 rounded text-[#6b7a99] hover:text-[#1a2e05] transition">
        <span className="block w-5 h-0.5 bg-current rounded-full" />
        <span className="block w-5 h-0.5 bg-current rounded-full" />
        <span className="block w-3.5 h-0.5 bg-current rounded-full" />
      </button>

      {/* Page title + breadcrumb */}
      <div className="hidden sm:flex flex-col leading-none">
        <div className="flex items-center gap-1.5 text-[10px] text-[#b0bbd6] uppercase tracking-widest font-medium">
          <span>DVLA</span>
          <span>/</span>
          <span>Adenta</span>
          <span>/</span>
          <span style={{ color: "#81B71A" }}>{pageTitle}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="text-[#1a2e05] font-bold text-base">{pageTitle}</h1>
          <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(129,183,26,0.1)", color: "#3d6b08", border: "1px solid rgba(129,183,26,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#81B71A" }} />
            Adenta Branch
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs ml-4 hidden md:block">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: searchFocused ? "#81B71A" : "#b0bbd6" }}>
            <SearchIcon size={15} />
          </span>
          <input
            type="text"
            placeholder="Search plates, owners…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-[#f8faff] text-[#1a2e05] placeholder-[#c3ccd8] outline-none transition-all"
            style={{
              borderColor: searchFocused ? "#81B71A" : "#e8edf5",
              boxShadow: searchFocused ? "0 0 0 3px rgba(129,183,26,0.12)" : "none",
            }}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">

        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f4f6fb]"
          style={{ color: "#6b7a99" }}>
          <BellIcon size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white"
            style={{ background: "#81B71A" }} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: "#e8edf5" }} />

        {/* User pill */}
        <button className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-lg transition-colors hover:bg-[#f4f6fb]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 border-2"
            style={{ background: "#81B71A", borderColor: "#6a9a15" }}>
            A
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-none" style={{ color: "#1a2e05" }}>Admin</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#9aa3be" }}>Adenta Branch Officer</p>
          </div>
          <ChevronIcon size={12} />
        </button>
      </div>
    </header>
  );
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function ChevronIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}
