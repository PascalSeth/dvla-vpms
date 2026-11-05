"use client";

import { useState, useEffect, useRef, useId } from "react";
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

  const profileId = useId();
  const notificationsId = useId();
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (profileDropdownOpen) { setProfileDropdownOpen(false); profileButtonRef.current?.focus(); }
      if (notificationsOpen) { setNotificationsOpen(false); notificationsButtonRef.current?.focus(); }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [profileDropdownOpen, notificationsOpen]);

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

  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#486B58] focus-visible:ring-offset-2";
  const iconButton = `flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#70776F] transition-colors hover:bg-[#F0F2ED] hover:text-[#294F39] md:h-9 md:w-9 ${focus}`;
  const panel = "fixed left-3 right-3 top-[60px] z-50 max-h-[calc(100dvh-76px)] overflow-y-auto rounded-xl border border-[#E1E6DD] bg-white text-[#252B27] shadow-[0_12px_40px_-12px_rgba(28,40,31,0.22)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80";
  const roleLabel = currentRole === "SUPERADMIN" ? "Super administrator" : currentRole === "SUPERVISOR" ? "Supervisor" : currentRole === "DATA_ENTRY" ? "Data entry officer" : currentRole;
  const initial = userSession?.name?.charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-[#E4E7E1] bg-white text-[#252B27]">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-5">
        <button type="button" onClick={onMobileMenuOpen} className={`${iconButton} lg:hidden`} aria-label="Open navigation menu">
          <TopbarIcon name="menu" />
        </button>

        <div className="min-w-0 flex-1 md:flex-initial md:basis-56">
          <span className="mb-0.5 hidden text-[10px] font-medium uppercase tracking-[0.1em] text-[#777F74] sm:block">Station workspace</span>
          <div className="flex min-w-0 items-center gap-2">
            <span title={orgName} className="truncate text-[13px] font-semibold tracking-tight">{orgName}</span>
            {orgCode && <span className="hidden shrink-0 rounded border border-[#E3E7DF] bg-[#F6F7F3] px-1.5 py-0.5 text-[10px] font-medium text-[#70776F] xl:inline">{orgCode}</span>}
          </div>
        </div>

        <form role="search" onSubmit={handleSearchSubmit} className="relative mx-auto hidden w-full max-w-sm min-w-0 flex-1 md:block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8479]"><TopbarIcon name="search" size={16} /></span>
          <input aria-label="Search plates, VIN or owner" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search plate, VIN or owner…" className="h-9 w-full rounded-lg border border-[#E4E7E1] bg-[#F7F8F5] pl-9 pr-3 text-xs text-[#252B27] outline-none transition-colors placeholder:text-[#777F74] hover:border-[#CFD7CA] focus:border-[#6A8773] focus:bg-white focus:ring-2 focus:ring-[#E8EFE9]" />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="relative" ref={notifRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setNotificationsOpen(false); }}>
            <button ref={notificationsButtonRef} type="button" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileDropdownOpen(false); }} className={`${iconButton} ${notificationsOpen ? "bg-[#E8EFE9] text-[#294F39]" : ""}`} aria-label="System alerts" aria-expanded={notificationsOpen} aria-controls={notificationsOpen ? notificationsId : undefined}>
              <TopbarIcon name="bell" />
            </button>
            {notificationsOpen && (
              <section id={notificationsId} aria-label="System alerts" className={panel}>
                <div className="flex items-center justify-between border-b border-[#EDF0E9] px-4 py-3">
                  <h2 className="text-[13px] font-semibold">System alerts</h2>
                  <button type="button" aria-label="Close alerts" className={iconButton} onClick={() => { setNotificationsOpen(false); notificationsButtonRef.current?.focus(); }}><TopbarIcon name="close" size={16} /></button>
                </div>
                <div className="px-4 py-3">
                  <p className="mb-3 text-[11px] text-[#777F74]">Configured system notices</p>
                  <div className="space-y-4">
                    <div><p className="text-xs font-medium">Database synchronization</p><p className="mt-1 text-[11px] leading-relaxed text-[#70776F]">PostgreSQL Supabase live stream active with zero lag.</p></div>
                    <div><p className="text-xs font-medium">Embossing queue online</p><p className="mt-1 text-[11px] leading-relaxed text-[#70776F]">Press line #2 dispatched 2,500 AD series blanks.</p></div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-[#E4E7E1] sm:block" />

          <div className="relative" ref={profileRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setProfileDropdownOpen(false); }}>
            <button ref={profileButtonRef} type="button" onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotificationsOpen(false); }} aria-label="Account and role settings" aria-expanded={profileDropdownOpen} aria-controls={profileDropdownOpen ? profileId : undefined} className={`flex min-h-11 items-center gap-2.5 rounded-lg px-1.5 text-left transition-colors hover:bg-[#F4F6F1] ${focus}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCE2D8] bg-[#E8ECE3] text-xs font-semibold text-[#4F5E48]">{initial}</span>
              <span className="hidden min-w-0 sm:block"><span className="block max-w-[145px] truncate text-xs font-semibold">{userSession?.name || "Administrator"}</span><span className="mt-0.5 block text-[10px] text-[#70776F]">{roleLabel}</span></span>
              <span className={`hidden text-[#7A8179] transition-transform sm:block ${profileDropdownOpen ? "rotate-180" : ""}`}><TopbarIcon name="chevron" size={13} /></span>
            </button>
            {profileDropdownOpen && (
              <section id={profileId} aria-label="Account settings" className={panel}>
                <div className="border-b border-[#EDF0E9] p-4">
                  <p className="break-words text-[13px] font-semibold">{userSession?.name || "System Administrator"}</p>
                  <p className="mt-1 break-all text-[11px] text-[#70776F]">{userSession?.email || "admin@dvla.gov.gh"}</p>
                  <p className="mt-2 text-[11px] font-medium text-[#486B58]">{orgName}</p>
                </div>
                <div className="p-2">
                  <h2 className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777F74]">Switch role</h2>
                  {[
                    { role: "SUPERADMIN", title: "Super administrator", desc: "Organization, users and audit logs" },
                    { role: "SUPERVISOR", title: "Supervisor", desc: "Approvals, quotas and certificates" },
                    { role: "DATA_ENTRY", title: "Data entry officer", desc: "Bookings and counter handover" },
                  ].map((tier) => (
                    <button key={tier.role} type="button" aria-pressed={currentRole === tier.role} onClick={() => { handleRoleSelect(tier.role); profileButtonRef.current?.focus(); }} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${focus} ${currentRole === tier.role ? "bg-[#E8EFE9] text-[#294F39]" : "hover:bg-[#F4F6F1]"}`}>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-medium">{tier.title}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-[#70776F]">{tier.desc}</span></span>
                      {currentRole === tier.role && <TopbarIcon name="check" size={16} />}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-[#EDF0E9] p-2">
                  <Link href="/dashboard/help" onClick={() => setProfileDropdownOpen(false)} className={`flex min-h-11 items-center rounded-lg px-3 text-xs text-[#626B5E] hover:bg-[#F4F6F1] ${focus}`}>Help &amp; SOPs</Link>
                  <button type="button" onClick={handleLogout} className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-medium text-[#9C4939] hover:bg-[#F8EEEB] ${focus}`}>Sign out <TopbarIcon name="logout" size={15} /></button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      <form role="search" onSubmit={handleSearchSubmit} className="flex items-center gap-2 border-t border-[#F0F2EC] px-4 pb-2.5 pt-2 md:hidden">
        <span className="text-[#7C8479]"><TopbarIcon name="search" size={16} /></span>
        <input aria-label="Search plates, VIN or owner" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search plate, VIN or owner…" className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-1 text-base text-[#252B27] outline-none placeholder:text-[#777F74] focus:ring-2 focus:ring-[#E8EFE9]" />
        <button type="submit" aria-label="Submit search" className={`flex h-11 w-11 items-center justify-center rounded-lg bg-[#F0F3EC] text-[#486B58] ${focus}`}><TopbarIcon name="arrow" size={16} /></button>
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
