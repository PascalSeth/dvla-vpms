"use client";

import { useState, useEffect, useRef, useId, useCallback } from "react";
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

interface SearchNavigationItem {
  title: string;
  description: string;
  href: string;
  category: string;
}

interface SearchPlateItem {
  plateNumber: string;
  owner: string;
  vehicle: string;
  chassis: string;
  category: string;
  status: string;
  source: string;
  href: string;
}

interface SearchBookingItem {
  id: string;
  owner: string;
  vehicle: string;
  plate: string | null;
  status: string;
  classification: string;
  date: string;
  invoiceNo?: string;
  href: string;
}

interface SearchReservationItem {
  id: string;
  platePattern: string;
  holder: string;
  authRef: string;
  status: string;
  type: string;
  href: string;
}

interface SearchResponse {
  query: string;
  navigation: SearchNavigationItem[];
  plates: SearchPlateItem[];
  bookings: SearchBookingItem[];
  reservations: SearchReservationItem[];
  totalCount: number;
}

export default function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [currentBranch, setCurrentBranch] = useState<{ id?: string; name: string; code?: string; type?: string } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const profileId = useId();
  const notificationsId = useId();
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);

  // Global keyboard shortcuts (Ctrl+K / Cmd+K to focus search, Esc to close)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false);
          searchInputRef.current?.blur();
        }
        if (profileDropdownOpen) {
          setProfileDropdownOpen(false);
          profileButtonRef.current?.focus();
        }
        if (notificationsOpen) {
          setNotificationsOpen(false);
          notificationsButtonRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [profileDropdownOpen, notificationsOpen, searchOpen]);

  // Live search debounced fetcher
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Live search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      } catch {
        session = {
          username: "admin",
          name: "System Administrator",
          role: "SUPERADMIN",
          email: "admin@dvla.gov.gh",
        };
        setUserSession(session);
      }

      // B. Fetch live branch from /api/branches
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
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

  // 3. Navigation helper that dispatches popstate so open pages refresh filter immediately
  const navigateWithSearch = useCallback(
    (targetPath: string) => {
      setSearchOpen(false);
      router.push(targetPath);
      // Ensure target page listener receives notification if URL param changes
      setTimeout(() => {
        window.dispatchEvent(new Event("popstate"));
      }, 50);
    },
    [router]
  );

  // 4. Submit Search Form
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Check if query is formatted like a booking ID
    const isBookingQuery = q.toUpperCase().startsWith("BK") || q.toUpperCase().startsWith("#BK");
    if (isBookingQuery) {
      navigateWithSearch(`/dashboard/bookings?q=${encodeURIComponent(q.replace("#", ""))}`);
    } else {
      navigateWithSearch(`/dashboard/plates?q=${encodeURIComponent(q)}`);
    }
  };

  // 5. Role Switch Handler
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

  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#81B71A] focus-visible:ring-offset-2";
  const iconButton = `flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:h-9 md:w-9 ${focus}`;
  const panel = "fixed left-3 right-3 top-[60px] z-50 max-h-[calc(100dvh-76px)] overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-800 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80";
  const roleLabel = currentRole === "SUPERADMIN" ? "Super administrator" : currentRole === "SUPERVISOR" ? "Supervisor" : currentRole === "DATA_ENTRY" ? "Data entry officer" : currentRole;
  const initial = userSession?.name?.charAt(0).toUpperCase() || "A";

  const hasResults = Boolean(
    searchResults &&
      (searchResults.navigation.length > 0 ||
        searchResults.plates.length > 0 ||
        searchResults.bookings.length > 0 ||
        searchResults.reservations.length > 0)
  );

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white text-slate-800">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-5">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button type="button" onClick={onMobileMenuOpen} className={`${iconButton} lg:hidden`} aria-label="Open navigation menu">
          <TopbarIcon name="menu" />
        </button>

        {/* Station Workspace Info */}
        <div className="min-w-0 flex-1 md:flex-initial md:basis-52">
          <span className="mb-0.5 hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#81B71A] sm:block">
            Station Workspace
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <span title={orgName} className="truncate text-[13px] font-bold tracking-tight text-slate-900">
              {orgName}
            </span>
            {orgCode && (
              <span className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9.5px] font-mono font-semibold text-slate-600 xl:inline">
                {orgCode}
              </span>
            )}
          </div>
        </div>

        {/* ── Interactive Live Global Search Box (Desktop) ── */}
        <div ref={searchContainerRef} className="relative mx-auto hidden w-full max-w-md min-w-0 flex-1 md:block">
          <form role="search" onSubmit={handleSearchSubmit} className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <TopbarIcon name="search" size={15} />
            </span>

            <input
              ref={searchInputRef}
              aria-label="Search plates, bookings, VIN or owner"
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search plate, booking #, VIN or owner… (Ctrl+K)"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-16 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#81B71A] focus:bg-white focus:ring-3 focus:ring-[#81B71A]/20"
            />

            {/* Clear or Keyboard Shortcut Indicator */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults(null);
                    searchInputRef.current?.focus();
                  }}
                  className="w-5 h-5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition text-xs"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9.5px] font-mono text-slate-400 shadow-2xs">
                  ⌘K
                </kbd>
              )}
            </div>
          </form>

          {/* ── Live Search Dropdown Popup ── */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 w-full min-w-[380px] max-w-[500px] rounded-xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-100 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Search Results</span>
                  {isSearching ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#81B71A] font-semibold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A]" />
                      Searching…
                    </span>
                  ) : searchResults ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200/70 text-[9.5px] font-mono text-slate-600">
                      {searchResults.totalCount} found
                    </span>
                  ) : null}
                </div>

                <span className="text-[10px] text-slate-400 font-medium">Press Enter to view all</span>
              </div>

              {/* Results Container */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin]">
                {/* 1. Quick Navigation Shortcuts */}
                {searchResults && searchResults.navigation.length > 0 && (
                  <div className="p-2">
                    <span className="block px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">
                      Navigation
                    </span>
                    <div className="space-y-0.5">
                      {searchResults.navigation.map((nav) => (
                        <button
                          key={nav.href}
                          type="button"
                          onClick={() => navigateWithSearch(nav.href)}
                          className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition group"
                        >
                          <div className="min-w-0">
                            <span className="block text-xs font-semibold text-slate-800 group-hover:text-[#6a9715]">
                              {nav.title}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate">
                              {nav.description}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] text-slate-400 font-mono group-hover:text-slate-700">
                            Go →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Plates & VRS Invoices */}
                {searchResults && searchResults.plates.length > 0 && (
                  <div className="p-2">
                    <span className="block px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-700">
                      Vehicle Plates ({searchResults.plates.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.plates.map((plate) => (
                        <button
                          key={plate.plateNumber}
                          type="button"
                          onClick={() => navigateWithSearch(plate.href)}
                          className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50/60 transition group border border-transparent hover:border-emerald-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-xs shrink-0 tracking-wider">
                              {plate.plateNumber}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-semibold text-slate-800 truncate">
                                {plate.owner}
                              </span>
                              <span className="block text-[10px] text-slate-500 truncate">
                                {plate.vehicle} &bull; Chassis: {plate.chassis}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 text-[9.5px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded ml-2">
                            {plate.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Bookings */}
                {searchResults && searchResults.bookings.length > 0 && (
                  <div className="p-2">
                    <span className="block px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-amber-800">
                      Bookings &amp; Applications ({searchResults.bookings.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.bookings.map((bk) => (
                        <button
                          key={bk.id}
                          type="button"
                          onClick={() => navigateWithSearch(bk.href)}
                          className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-amber-50/60 transition group border border-transparent hover:border-amber-200"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-amber-800">
                                #{bk.id}
                              </span>
                              {bk.plate && (
                                <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  {bk.plate}
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-slate-600 truncate mt-0.5">
                              {bk.owner} &bull; {bk.vehicle}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                              bk.status.toLowerCase() === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : bk.status.toLowerCase() === "picked"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {bk.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Reservations */}
                {searchResults && searchResults.reservations.length > 0 && (
                  <div className="p-2">
                    <span className="block px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-purple-700">
                      Reserved Plates ({searchResults.reservations.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.reservations.map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => navigateWithSearch(res.href)}
                          className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-purple-50/60 transition group border border-transparent hover:border-purple-200"
                        >
                          <div className="min-w-0">
                            <span className="block text-xs font-mono font-bold text-slate-900">
                              {res.platePattern}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate">
                              Holder: {res.holder} &bull; Ref: {res.authRef}
                            </span>
                          </div>
                          <span className="shrink-0 text-[9.5px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                            {res.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isSearching && searchResults && !hasResults && (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs font-bold text-slate-700">No records found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Try searching by Plate Number, VRS Invoice, Legal Owner, or Chassis VIN.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigateWithSearch(`/dashboard/plates?q=${encodeURIComponent(searchQuery)}`)}
                  className="px-2.5 py-1 text-xs font-bold text-[#6a9715] hover:text-[#537610] hover:underline"
                >
                  Search in Plates →
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithSearch(`/dashboard/bookings?q=${encodeURIComponent(searchQuery)}`)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Search in Bookings →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls (Right side) */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setNotificationsOpen(false); }}>
            <button ref={notificationsButtonRef} type="button" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileDropdownOpen(false); }} className={`${iconButton} ${notificationsOpen ? "bg-slate-100 text-slate-900" : ""}`} aria-label="System alerts" aria-expanded={notificationsOpen} aria-controls={notificationsOpen ? notificationsId : undefined}>
              <TopbarIcon name="bell" />
            </button>
            {notificationsOpen && (
              <section id={notificationsId} aria-label="System alerts" className={panel}>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h2 className="text-[13px] font-semibold text-slate-900">System alerts</h2>
                  <button type="button" aria-label="Close alerts" className={iconButton} onClick={() => { setNotificationsOpen(false); notificationsButtonRef.current?.focus(); }}><TopbarIcon name="close" size={16} /></button>
                </div>
                <div className="px-4 py-3">
                  <p className="mb-3 text-[11px] text-slate-500">Configured system notices</p>
                  <div className="space-y-4">
                    <div><p className="text-xs font-medium text-slate-800">Database synchronization</p><p className="mt-1 text-[11px] leading-relaxed text-slate-600">PostgreSQL Supabase live stream active with zero lag.</p></div>
                    <div><p className="text-xs font-medium text-slate-800">Embossing queue online</p><p className="mt-1 text-[11px] leading-relaxed text-slate-600">Press line #2 dispatched 2,500 AD series blanks.</p></div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={profileRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setProfileDropdownOpen(false); }}>
            <button ref={profileButtonRef} type="button" onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotificationsOpen(false); }} aria-label="Account and role settings" aria-expanded={profileDropdownOpen} aria-controls={profileDropdownOpen ? profileId : undefined} className={`flex min-h-11 items-center gap-2.5 rounded-lg px-1.5 text-left transition-colors hover:bg-slate-100 ${focus}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-bold text-[#81B71A]">{initial}</span>
              <span className="hidden min-w-0 sm:block"><span className="block max-w-[145px] truncate text-xs font-semibold text-slate-900">{userSession?.name || "Administrator"}</span><span className="mt-0.5 block text-[10px] text-slate-500">{roleLabel}</span></span>
              <span className={`hidden text-slate-400 transition-transform sm:block ${profileDropdownOpen ? "rotate-180" : ""}`}><TopbarIcon name="chevron" size={13} /></span>
            </button>
            {profileDropdownOpen && (
              <section id={profileId} aria-label="Account settings" className={panel}>
                <div className="border-b border-slate-100 p-4">
                  <p className="break-words text-[13px] font-semibold text-slate-900">{userSession?.name || "System Administrator"}</p>
                  <p className="mt-1 break-all text-[11px] text-slate-500">{userSession?.email || "admin@dvla.gov.gh"}</p>
                  <p className="mt-2 text-[11px] font-bold text-[#6a9715]">{orgName}</p>
                </div>
                <div className="p-2">
                  <h2 className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Switch role</h2>
                  {[
                    { role: "SUPERADMIN", title: "Super administrator", desc: "Organization, users and audit logs" },
                    { role: "SUPERVISOR", title: "Supervisor", desc: "Approvals, quotas and certificates" },
                    { role: "DATA_ENTRY", title: "Data entry officer", desc: "Bookings and counter handover" },
                  ].map((tier) => (
                    <button key={tier.role} type="button" aria-pressed={currentRole === tier.role} onClick={() => { handleRoleSelect(tier.role); profileButtonRef.current?.focus(); }} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${focus} ${currentRole === tier.role ? "bg-emerald-50 text-emerald-950 font-bold border border-emerald-200" : "hover:bg-slate-50"}`}>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-medium">{tier.title}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{tier.desc}</span></span>
                      {currentRole === tier.role && <TopbarIcon name="check" size={16} />}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 p-2">
                  <Link href="/dashboard/help" onClick={() => setProfileDropdownOpen(false)} className={`flex min-h-11 items-center rounded-lg px-3 text-xs text-slate-600 hover:bg-slate-100 ${focus}`}>Help &amp; SOPs</Link>
                  <button type="button" onClick={handleLogout} className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 ${focus}`}>Sign out <TopbarIcon name="logout" size={15} /></button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Search Bar ── */}
      <form role="search" onSubmit={handleSearchSubmit} className="flex items-center gap-2 border-t border-slate-100 px-4 pb-2.5 pt-2 md:hidden">
        <span className="text-slate-400"><TopbarIcon name="search" size={16} /></span>
        <input
          ref={mobileSearchInputRef}
          aria-label="Search plates, VIN or owner"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search plate, booking #, VIN or owner…"
          className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#81B71A]/30"
        />
        <button type="submit" aria-label="Submit search" className={`flex h-9 w-9 items-center justify-center rounded-lg bg-[#81B71A] text-white ${focus}`}>
          <TopbarIcon name="arrow" size={16} />
        </button>
      </form>
    </header>
  );
}

function TopbarIcon({ name, size = 18 }: { name: "menu" | "search" | "bell" | "chevron" | "check" | "logout" | "arrow" | "close"; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      {name === "menu" && <path d="M4 6h16M4 12h16M4 18h16" />}
      {name === "search" && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>}
      {name === "bell" && <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4" /></>}
      {name === "chevron" && <path d="m6 9 6 6 6-6" />}
      {name === "check" && <path d="m5 12 4 4L19 6" />}
      {name === "logout" && <><path d="M9 4H5v16h4M9 12h12m-5-5 5 5-5 5" /></>}
      {name === "arrow" && <path d="M5 12h14m-5-5 5 5-5 5" />}
      {name === "close" && <path d="m6 6 12 12M18 6 6 18" />}
    </svg>
  );
}
