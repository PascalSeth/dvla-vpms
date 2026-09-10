"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopbarProps {
  onMobileMenuOpen: () => void;
}

interface UserSession {
  username: string;
  name: string;
  role: string;
  email?: string;
  branchId?: string;
  branch?: { id?: string; name: string; code?: string; type?: string };
  organization?: { id?: string; name: string; code?: string };
}

export default function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [currentBranch, setCurrentBranch] = useState<{ id?: string; name: string; code?: string; type?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // 1. Fetch live branch from DB API & User Session Load
  useEffect(() => {
    let isMounted = true;

    async function loadBranchAndSession() {
      // A. Load session from localStorage
      let session: any = null;
      try {
        const stored = localStorage.getItem("dvla_session");
        if (stored) {
          session = JSON.parse(stored);
          setUserSession(session);
        } else {
          session = {
            username: "admin",
            name: "System Administrator",
            role: "SUPERADMIN",
            email: "admin@dvla.gov.gh",
          };
          setUserSession(session);
        }
      } catch (e) {
        session = {
          username: "admin",
          name: "System Administrator",
          role: "SUPERADMIN",
          email: "admin@dvla.gov.gh",
        };
        setUserSession(session);
      }

      // B. Fetch live branch from /api/branches (never hardcode)
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const branches = await res.json();
          if (Array.isArray(branches) && branches.length > 0 && isMounted) {
            const targetId = session?.branchId || session?.branch?.id || session?.organizationId;
            const matched = targetId
              ? branches.find((b: any) => b.id === targetId || b.code === targetId || b.slug === targetId)
              : branches[0];

            const active = matched || branches[0];
            if (active) {
              setCurrentBranch({
                id: active.id,
                name: active.name,
                code: active.code,
                type: active.type,
              });

              // Synchronize session branch object in localStorage
              if (session && (!session.branch || session.branch.name !== active.name)) {
                const updatedSession = {
                  ...session,
                  branchId: active.id,
                  branch: { id: active.id, name: active.name, code: active.code, type: active.type },
                };
                localStorage.setItem("dvla_session", JSON.stringify(updatedSession));
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch branch in Topbar:", err);
      }
    }

    loadBranchAndSession();

    window.addEventListener("dvla_session_change", loadBranchAndSession);
    window.addEventListener("dvla_branch_change", loadBranchAndSession);

    return () => {
      isMounted = false;
      window.removeEventListener("dvla_session_change", loadBranchAndSession);
      window.removeEventListener("dvla_branch_change", loadBranchAndSession);
    };
  }, []);

  // 2. Click outside listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Role Switch Handler
  const handleRoleSelect = (newRole: string) => {
    let name = "System Administrator";
    let username = "admin";

    if (newRole === "SUPERVISOR") {
      name = `${currentBranch?.name || "DVLA"} Licensing Supervisor`;
      username = "dvla_officer";
    } else if (newRole === "DATA_ENTRY") {
      name = `${currentBranch?.name || "DVLA"} Registration Officer`;
      username = "counter_clerk";
    }

    const updated: UserSession = {
      username,
      name,
      role: newRole,
      email: `${username}@dvla.gov.gh`,
      branchId: currentBranch?.id || userSession?.branchId,
      branch: currentBranch || userSession?.branch,
    };

    setUserSession(updated);
    localStorage.setItem("dvla_session", JSON.stringify(updated));
    window.dispatchEvent(new Event("dvla_session_change"));
    setProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("dvla_session");
    router.push("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/dashboard/plates?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const orgName =
    currentBranch?.name ||
    userSession?.branch?.name ||
    userSession?.organization?.name ||
    "DVLA Station";

  const orgCode =
    currentBranch?.code ||
    userSession?.branch?.code ||
    currentBranch?.type ||
    "";

  const currentRole = userSession?.role?.toUpperCase() || "SUPERADMIN";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 h-14 bg-gradient-to-r from-[#103014] via-[#153e1a] to-[#0e2c12] text-white border-b border-[#24582a]/50 shrink-0 shadow-xs relative select-none">
      
      {/* ── Left: Mobile Hamburger & Station Identity ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Dynamic Station Identity */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#81B71A] shrink-0 animate-pulse" />
          <span className="font-bold text-xs sm:text-sm text-white truncate tracking-tight">{orgName}</span>
          {orgCode && (
            <span className="text-[11px] font-mono text-emerald-400/80 hidden md:inline shrink-0">
              · {orgCode}
            </span>
          )}
        </div>
      </div>

      {/* ── Center: Slim Understated Search ── */}
      <div className="flex-1 max-w-xs mx-3 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate, VIN, owner..."
            className="w-full pl-8 pr-4 py-1.5 bg-black/25 hover:bg-black/35 border border-white/10 focus:border-[#81B71A] rounded-full text-xs text-white placeholder:text-slate-400 focus:outline-none transition"
          />
        </form>
      </div>

      {/* ── Right: Clean Action Controls ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer relative"
            aria-label="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#81B71A]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 space-y-2 z-50 animate-in zoom-in-95 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Alerts</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  All Systems Operational
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800 text-[11px]">Database Synchronization</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">PostgreSQL Supabase live stream active with zero lag.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800 text-[11px]">Embossing Queue Online</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Press line #2 dispatched 2,500 AD series blanks.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Executive Officer Profile Menu ── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            {/* Avatar badge */}
            <div className="w-7 h-7 rounded-full bg-[#81B71A] text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs">
              {userSession?.name ? userSession.name.charAt(0).toUpperCase() : "A"}
            </div>

            {/* Officer Name */}
            <span className="text-xs font-semibold text-white hidden sm:inline max-w-[120px] truncate">
              {userSession?.name || "Admin"}
            </span>

            {/* Chevron icon */}
            <svg
              className={`w-3 h-3 text-slate-300 transition-transform ${
                profileDropdownOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>

          {/* Interactive Officer Profile Dropdown Popover */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 space-y-3 z-50 animate-in zoom-in-95">
              {/* Officer Dossier Header */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold font-mono shadow-xs">
                  {userSession?.name ? userSession.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="leading-tight">
                  <p className="font-bold text-xs text-slate-900">{userSession?.name || "System Administrator"}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{userSession?.email || "admin@dvla.gov.gh"}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">{orgName}</p>
                </div>
              </div>

              {/* Authority Role Switcher */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Active Authority Level
                </span>

                {[
                  {
                    role: "SUPERADMIN",
                    title: "SuperAdmin",
                    desc: "Full root access, audit logs, & org control",
                    color: "text-rose-700",
                    border: "border-rose-200",
                    dot: "bg-rose-500",
                  },
                  {
                    role: "SUPERVISOR",
                    title: "Supervisor (Admin)",
                    desc: "Booking approval, quota sign-off, & certs",
                    color: "text-amber-700",
                    border: "border-amber-200",
                    dot: "bg-amber-500",
                  },
                  {
                    role: "DATA_ENTRY",
                    title: "Data Entry Officer",
                    desc: "Standard plate bookings & counter handover",
                    color: "text-blue-700",
                    border: "border-blue-200",
                    dot: "bg-blue-500",
                  },
                ].map((tier) => {
                  const isSelected = currentRole === tier.role;
                  return (
                    <button
                      key={tier.role}
                      onClick={() => handleRoleSelect(tier.role)}
                      className={`w-full text-left p-2 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? `bg-slate-50 ${tier.border} shadow-2xs`
                          : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                        isSelected ? tier.dot : "bg-slate-300"
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${tier.color}`}>
                            {tier.title}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          {tier.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Shortcuts & Sign out */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  href="/dashboard/help"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="text-slate-600 hover:text-slate-900 font-semibold text-[11px] py-1 px-2 rounded hover:bg-slate-100 transition"
                >
                  Help &amp; SOPs
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-rose-600 hover:text-rose-800 font-bold text-[11px] py-1 px-2 rounded hover:bg-rose-50 transition cursor-pointer"
                >
                  Sign Out →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
