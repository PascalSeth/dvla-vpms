"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

export interface NavSubItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: any;
  subItems?: NavSubItem[];
  superAdminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: DashIcon },
      { label: "New Booking", href: "/dashboard/booking", icon: BookingIcon },
      { label: "Booking Logs", href: "/dashboard/bookings", icon: HistoryIcon },
      {
        label: "Vehicle Plates",
        icon: PlateIcon,
        subItems: [
          { label: "All Plates", href: "/dashboard/plates" },
          { label: "Reserved Plates", href: "/dashboard/plates/reserved" },
          { label: "Plate Inventory", href: "/dashboard/plates/inventory" },
          { label: "Picked Directory", href: "/dashboard/plates/picked" },
        ],
      },
      { label: "Plate Issuance", href: "/dashboard/pickup", icon: PickupIcon },
      { label: "Workflow Pipeline", href: "/dashboard/workflow", icon: WorkflowIcon },
    ],
  },
  {
    title: "Intelligence & Audit",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: ChartIcon },
      { label: "Audit Log", href: "/dashboard/audit", icon: LogIcon },
    ],
  },
  {
    title: "Station Controls",
    items: [
      { label: "Branches & Regions", href: "/dashboard/branches", icon: OrgIcon, superAdminOnly: true },
      { label: "Users", href: "/dashboard/users", icon: UsersIcon, superAdminOnly: true },
      { label: "Service Types", href: "/dashboard/services", icon: ServiceIcon, superAdminOnly: true },
      { label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
      { label: "Help Center", href: "/dashboard/help", icon: HelpIcon },
    ],
  },
];

function SidebarContent({
  collapsed,
  onToggle,
  onItemClick,
  isMobile = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onItemClick?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isPlatesActive = pathname.startsWith("/dashboard/plates");
  const [platesExpanded, setPlatesExpanded] = useState(isPlatesActive);
  const [userSession, setUserSession] = useState<{ name: string; role: string; email?: string } | null>(null);

  useEffect(() => {
    const loadSession = () => {
      try {
        const stored = localStorage.getItem("dvla_session");
        if (stored) {
          setUserSession(JSON.parse(stored));
        } else {
          setUserSession({ name: "System Administrator", role: "SUPERADMIN", email: "admin@dvla.gov.gh" });
        }
      } catch (err) {
        setUserSession({ name: "System Administrator", role: "SUPERADMIN", email: "admin@dvla.gov.gh" });
      }
    };

    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/dashboard/plates")) {
      setPlatesExpanded(true);
    }
  }, [pathname]);

  const role = userSession?.role?.toUpperCase() || "SUPERADMIN";

  const dataEntryAllowed = new Set([
    "/dashboard/booking",
    "/dashboard/bookings",
    "/dashboard/plates",
    "/dashboard/plates/reserved",
    "/dashboard/plates/inventory",
    "/dashboard/plates/picked",
    "/dashboard/pickup",
    "/dashboard/workflow",
    "/dashboard/help",
  ]);

  const isItemAllowed = (item: NavItem) => {
    if (item.superAdminOnly && role !== "SUPERADMIN") return false;
    if (role === "DATA_ENTRY") {
      if (item.href && dataEntryAllowed.has(item.href)) return true;
      if (item.subItems?.some((sub) => dataEntryAllowed.has(sub.href))) return true;
      return false;
    }
    if (role === "SUPERVISOR" && item.href === "/dashboard/settings") return false;
    return true;
  };

  const filteredSections = NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter(isItemAllowed),
  })).filter((sec) => sec.items.length > 0);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#103014] via-[#1a4a1f] to-[#123817] text-slate-200 border-r border-[#24582a]/70 shadow-xl select-none">
      
      {/* ── Rich DVLA Green Ambient Glow matching Login ── */}
      <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#81B71A]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-10 w-48 h-48 rounded-full bg-[#81B71A]/15 blur-3xl pointer-events-none" />

      {/* ── Sidebar Header ── */}
      {collapsed && !isMobile ? (
        /* Collapsed Header: Centered Logo + Dedicated Expand Button */
        <div className="py-2.5 px-2 border-b border-[#24582a]/70 shrink-0 flex flex-col items-center gap-1.5 bg-[#0d2711]/60 backdrop-blur-xs">
          <button
            type="button"
            onClick={onToggle}
            className="w-10 h-10 rounded-xl bg-[#173e1c] border border-[#81B71A]/40 p-1 flex items-center justify-center shadow-xs hover:bg-[#81B71A] transition group relative cursor-pointer"
            title="Click to expand sidebar"
            aria-label="Expand sidebar"
          >
            <Image
              src="/dvla-bg.png"
              alt="DVLA Emblem"
              width={24}
              height={24}
              priority
              className="object-contain"
            />
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-50 flex items-center gap-1.5 border border-slate-700">
              <span>DVLA VPMS</span>
              <span className="text-[#81B71A] text-xs font-mono">(Expand)</span>
            </div>
          </button>

          {/* Clean dedicated expand trigger button */}
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-5 rounded-md bg-[#18421d] hover:bg-[#81B71A] text-[#81B71A] hover:text-white transition flex items-center justify-center text-[10px] font-black cursor-pointer shadow-2xs border border-[#27612f]"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            ▶
          </button>
        </div>
      ) : (
        /* Expanded Header: Full Brand Title + Station Tag + SINGLE Header Collapse Button */
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#24582a]/70 shrink-0 relative z-10 bg-[#0d2711]/70 backdrop-blur-md">
          <Link 
            href="/dashboard" 
            onClick={onItemClick}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-[#173e1c] border border-[#81B71A]/40 p-1 flex items-center justify-center shadow-xs group-hover:border-[#81B71A] transition">
                <Image
                  src="/dvla-bg.png"
                  alt="DVLA Emblem"
                  width={24}
                  height={24}
                  priority
                  className="object-contain"
                />
              </div>
            </div>

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-xs tracking-wider uppercase truncate leading-tight">
                  DVLA VPMS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A] shadow-[0_0_6px_#81B71A]" />
              </div>
              <span className="text-[10px] text-[#81B71A] font-bold tracking-wide truncate leading-tight">
                Adenta Station
              </span>
            </div>
          </Link>

          {/* Single Collapse Button */}
          <button
            type="button"
            onClick={onToggle}
            className="w-7 h-7 rounded-lg bg-[#18421d] hover:bg-[#81B71A] text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer shrink-0 shadow-2xs border border-[#27612f]"
            title={isMobile ? "Close menu" : "Collapse sidebar"}
            aria-label={isMobile ? "Close menu" : "Collapse sidebar"}
          >
            {isMobile ? <CloseIcon size={16} /> : <CollapseIcon size={14} collapsed={false} />}
          </button>
        </div>
      )}

      {/* ── Navigation Links in Deep Forest Green Theme ── */}
      <nav className={`flex-1 py-3 ${collapsed && !isMobile ? "px-1.5 space-y-2.5" : "px-2.5 space-y-3.5"} overflow-y-auto overflow-x-hidden relative z-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {(!collapsed || isMobile) && (
              <div className="flex items-center gap-2 px-2 pb-1">
                <span className="text-[9px] font-black tracking-[0.14em] text-[#8bc34a] uppercase">
                  {section.title}
                </span>
                <span className="flex-1 h-px bg-[#24582a]/70" />
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                const active = hasSubItems
                  ? pathname.startsWith("/dashboard/plates")
                  : pathname === item.href;
                const Icon = item.icon;

                if (hasSubItems) {
                  const isExpanded = (!collapsed || isMobile) && platesExpanded;
                  return (
                    <div key={item.label} className="relative group">
                      {collapsed && !isMobile ? (
                        /* Collapsed Submenu Trigger with Centered Icon */
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              onToggle();
                              setPlatesExpanded(true);
                            }}
                            className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              active
                                ? "bg-[#81B71A] text-white font-bold shadow-md shadow-[#81B71A]/30"
                                : "text-slate-300 hover:text-white hover:bg-white/10"
                            }`}
                            aria-label={item.label}
                          >
                            <Icon size={17} />
                          </button>

                          {/* Floating Submenu Flyout on Hover when Collapsed */}
                          <div className="absolute left-full top-0 ml-3 py-2 px-1.5 rounded-xl bg-[#0e2a12] border border-[#27612f] shadow-2xl backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 min-w-[200px]">
                            <div className="px-3 py-1 text-[10px] font-black text-[#81B71A] tracking-wider uppercase border-b border-[#24582a] mb-1 flex items-center justify-between">
                              <span>{item.label}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#81B71A]" />
                            </div>
                            {item.subItems!.map((sub) => {
                              const subActive = pathname === sub.href;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={onItemClick}
                                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition ${
                                    subActive
                                      ? "bg-[#81B71A] text-white font-bold shadow-xs"
                                      : "text-slate-300 hover:text-white hover:bg-white/10"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${subActive ? "bg-white" : "bg-[#81B71A]"}`} />
                                  <span>{sub.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Expanded Submenu Accordion */
                        <div>
                          <button
                            type="button"
                            onClick={() => setPlatesExpanded(!platesExpanded)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                              active
                                ? "bg-gradient-to-r from-[#81B71A] to-[#6fa314] text-white border-l-[3.5px] border-white shadow-md shadow-[#81B71A]/25 font-bold"
                                : "text-slate-300 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`shrink-0 transition-colors ${
                                  active ? "text-white" : "text-[#8bc34a] group-hover:text-[#a0dc2e]"
                                }`}
                              >
                                <Icon size={16} />
                              </span>
                              <span className="truncate">
                                {item.label}
                              </span>
                            </div>
                            <span
                              className={`text-slate-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-white" : ""
                              }`}
                            >
                              <ChevronDownIcon size={13} />
                            </span>
                          </button>

                          {/* Expanded Sub-items List */}
                          {isExpanded && (
                            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#24582a] space-y-0.5 py-0.5">
                              {item.subItems!.map((sub) => {
                                const subActive = pathname === sub.href;
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={onItemClick}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                      subActive
                                        ? "bg-[#81B71A] text-white font-bold shadow-xs"
                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full transition-colors ${subActive ? "bg-white" : "bg-[#81B71A]"}`} />
                                    <span className="truncate">{sub.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // Standard Single Link
                return (
                  <div key={item.href} className="relative group">
                    {collapsed && !isMobile ? (
                      /* Collapsed Single Link: Centered Icon with Floating Tooltip */
                      <Link
                        href={item.href!}
                        onClick={onItemClick}
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 ${
                          active
                            ? "bg-[#81B71A] text-white font-bold shadow-md shadow-[#81B71A]/30"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                        aria-label={item.label}
                      >
                        <span className={`shrink-0 transition-colors ${active ? "text-white" : "text-[#8bc34a] group-hover:text-[#a0dc2e]"}`}>
                          <Icon size={17} />
                        </span>

                        {/* Floating Tooltip */}
                        <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 shadow-xl z-50 flex items-center gap-1.5">
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    ) : (
                      /* Expanded Single Link */
                      <Link
                        href={item.href!}
                        onClick={onItemClick}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          active
                            ? "bg-gradient-to-r from-[#81B71A] to-[#6fa314] text-white border-l-[3.5px] border-white shadow-md shadow-[#81B71A]/25 font-bold"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span
                          className={`shrink-0 transition-colors ${
                            active ? "text-white" : "text-[#8bc34a] group-hover:text-[#a0dc2e]"
                          }`}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Pedestal Footer matching Login Palette ── */}
      <div className="p-2.5 border-t border-[#24582a]/70 shrink-0 relative z-10 bg-[#0a200e]/85 backdrop-blur-md">
        {collapsed && !isMobile ? (
          /* Collapsed User Footer: Centered Avatar with Floating Profile Popover */
          <div className="relative group flex justify-center py-1">
            <div className="relative cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#81B71A] to-[#a0dc2e] p-0.5 shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#14330b] flex items-center justify-center text-[#d9ff88] font-black text-xs">
                  {userSession?.name ? userSession.name.charAt(0).toUpperCase() : "A"}
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#81B71A] border-2 border-[#103014]" />
            </div>

            {/* Profile Popover on Hover */}
            <div className="absolute left-full bottom-0 ml-3 p-3 rounded-xl bg-[#0e2a12] border border-[#27612f] text-slate-100 shadow-2xl backdrop-blur-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 min-w-[210px] space-y-2">
              <div>
                <p className="text-xs font-bold text-white truncate">
                  {userSession?.name || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {userSession?.email || "admin@dvla.gov.gh"}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#24582a]">
                <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-[#81B71A]/20 text-[#a0dc2e] border border-[#81B71A]/40">
                  {role}
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer flex items-center gap-1"
                >
                  <LogoutIcon size={12} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Expanded User Footer: Clean Dark Forest Green Card */
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#113516] border border-[#24582a] shadow-xs hover:border-[#81B71A]/60 transition duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#81B71A] to-[#a0dc2e] p-0.5 shadow-xs">
                  <div className="w-full h-full rounded-[6px] bg-[#14330b] flex items-center justify-center text-[#d9ff88] font-black text-xs">
                    {userSession?.name ? userSession.name.charAt(0).toUpperCase() : "A"}
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#81B71A] border-2 border-[#113516]" />
              </div>

              <div className="min-w-0 flex flex-col">
                <p className="text-white text-xs font-bold truncate leading-tight">
                  {userSession?.name || "Administrator"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded leading-none ${
                      role === "SUPERADMIN"
                        ? "bg-[#81B71A]/20 text-[#a0dc2e] border border-[#81B71A]/40"
                        : role === "SUPERVISOR"
                        ? "bg-amber-900/40 text-amber-300 border border-amber-700/50"
                        : "bg-cyan-900/40 text-cyan-300 border border-cyan-700/50"
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/login")}
              title="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer shrink-0"
              aria-label="Sign out"
            >
              <LogoutIcon size={14} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Persistent Sidebar (No duplicate floating button) */}
      <aside 
        className={`hidden lg:flex flex-col relative shrink-0 transition-all duration-300 ease-in-out z-20 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <SidebarContent 
          collapsed={collapsed} 
          onToggle={onToggle} 
        />
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={onMobileClose} 
          />
          {/* Slide-out Panel */}
          <aside className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <SidebarContent 
              collapsed={false} 
              onToggle={onMobileClose} 
              onItemClick={onMobileClose}
              isMobile={true}
            />
          </aside>
        </div>
      )}
    </>
  );
}

/* ── Lightweight SVG Icons (16-18px) ── */

function DashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PlateIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth={2.5} />
      <circle cx="4.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BookingIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function HistoryIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PickupIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M16 11h6M19 8v6" />
    </svg>
  );
}

function ChartIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function LogIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function OrgIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}

function UsersIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WorkflowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="12" r="3" />
      <path d="M9 6h3a3 3 0 0 1 3 3v3" />
      <path d="M9 18h3a3 3 0 0 0 3-3v-3" />
    </svg>
  );
}

function ServiceIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="14" y2="10" />
    </svg>
  );
}

function SettingsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function HelpIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function LogoutIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronDownIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CollapseIcon({ size = 14, collapsed }: { size?: number; collapsed: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {collapsed ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M14 9l3 3-3 3" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M16 15l-3-3 3-3" />
        </>
      )}
    </svg>
  );
}
