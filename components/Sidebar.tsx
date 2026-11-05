"use client";

import { useState, useEffect, useRef, useId } from "react";
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
  icon: (props: { size?: number; className?: string }) => React.JSX.Element;
  subItems?: NavSubItem[];
  superAdminOnly?: boolean;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: DashIcon },
      { label: "New Booking", href: "/dashboard/booking", icon: BookingIcon },
      { label: "Booking Logs", href: "/dashboard/bookings", icon: HistoryIcon },
      {
        label: "Vehicle Plates",
        icon: PlateIcon,
        subItems: [
          { label: "All Plates", href: "/dashboard/plates" },
          { label: "Plate Categories", href: "/dashboard/plates/categories" },
          { label: "Reserved Plates", href: "/dashboard/plates/reserved" },
          { label: "Picked Directory", href: "/dashboard/plates/picked" },
        ],
      },
      { label: "Plate Issuance", href: "/dashboard/pickup", icon: PickupIcon },
      { label: "Workflow Pipeline", href: "/dashboard/workflow", icon: WorkflowIcon },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: ChartIcon },
      { label: "Audit Log", href: "/dashboard/audit", icon: LogIcon },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Branches & Regions", href: "/dashboard/branches", icon: OrgIcon, superAdminOnly: true },
      { label: "Users", href: "/dashboard/users", icon: UsersIcon, superAdminOnly: true },
      { label: "Approving Officers", href: "/dashboard/supervisors", icon: OfficerIcon },
      { label: "Body Types", href: "/dashboard/settings/body-types", icon: BodyTypeIcon },
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
      } catch {
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
    "/dashboard/plates/categories",
    "/dashboard/plates/reserved",
    "/dashboard/plates/inventory",
    "/dashboard/plates/picked",
    "/dashboard/pickup",
    "/dashboard/supervisors",
    "/dashboard/workflow",
    "/dashboard/help",
    "/dashboard/settings/body-types",
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

  const handleLogout = () => {
    try {
      localStorage.removeItem("dvla_session");
      window.dispatchEvent(new Event("dvla_session_change"));
    } catch { }
    router.push("/login");
  };

  const isCollapsedDesktop = collapsed && !isMobile;

  const submenuId = useId();
  const focusStyle = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#486B58] focus-visible:ring-offset-2";
  const rowStyle = `group flex w-full items-center gap-3 rounded-lg text-[13px] font-medium transition-colors ${focusStyle} ${isMobile ? "min-h-11" : "min-h-9"}`;
  const activeStyle = "bg-[#E8EFE9] text-[#294F39]";
  const idleStyle = "text-[#626863] hover:bg-[#F0F1EE] hover:text-[#252B27]";
  const displayRole = role === "SUPERADMIN" ? "Super administrator" : role === "DATA_ENTRY" ? "Data entry" : role === "SUPERVISOR" ? "Supervisor" : role.replace(/_/g, " ").toLowerCase();

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-[#E4E7E1] bg-[#FAFBF8] text-[#252B27]">
      <header className={`flex h-20 shrink-0 items-center ${isCollapsedDesktop ? "justify-center px-2" : "justify-between gap-2 px-4"}`}>
        {isCollapsedDesktop ? (
          <button type="button" onClick={onToggle} title="Expand sidebar" aria-label="Expand sidebar" className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E7E1] bg-white hover:bg-[#F0F1EE] ${focusStyle}`}>
            <Image src="/dvla-bg.png" alt="DVLA" width={27} height={27} priority className="object-contain" />
          </button>
        ) : (
          <>
            <Link href="/dashboard" onClick={onItemClick} className={`flex min-w-0 items-center gap-2.5 rounded-lg ${focusStyle}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4E7E1] bg-white">
                <Image src="/dvla-bg.png" alt="DVLA" width={28} height={28} priority className="object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold tracking-tight">DVLA <span className="font-normal text-[#777E77]">/ VPMS</span></span>
                <span className="mt-0.5 block truncate text-[11px] text-[#70776F]">Adenta Station</span>
              </span>
            </Link>
            <button type="button" onClick={onToggle} title={isMobile ? "Close menu" : "Collapse sidebar"} aria-label={isMobile ? "Close menu" : "Collapse sidebar"} className={`flex shrink-0 items-center justify-center rounded-lg text-[#757C75] hover:bg-[#ECEEE9] hover:text-[#252B27] ${isMobile ? "h-11 w-11" : "h-8 w-8"} ${focusStyle}`}>
              {isMobile ? <CloseIcon size={18} /> : <CollapseIcon size={16} />}
            </button>
          </>
        )}
      </header>

      <nav aria-label="Main navigation" className={`min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-5 pt-2 [scrollbar-width:thin] ${isCollapsedDesktop ? "px-2" : "px-3"}`}>
        {filteredSections.map((section, sectionIndex) => (
          <section key={section.title} aria-label={section.title}>
            {isCollapsedDesktop ? (
              sectionIndex > 0 && <div className="mx-3 mb-3 border-t border-[#E4E7E1]" />
            ) : (
              <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A8179]">{section.title}</h2>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const hasSubItems = Boolean(item.subItems?.length);
                const active = hasSubItems ? isPlatesActive : pathname === item.href;
                const Icon = item.icon;
                const rowClass = `${rowStyle} ${isCollapsedDesktop ? "justify-center px-0" : "px-3"} ${active ? activeStyle : idleStyle}`;

                if (hasSubItems) {
                  const expanded = !isCollapsedDesktop && platesExpanded;
                  return (
                    <div key={item.label}>
                      <button type="button" className={rowClass} title={isCollapsedDesktop ? item.label : undefined} aria-label={item.label} aria-expanded={expanded} aria-controls={expanded ? submenuId : undefined} onClick={() => {
                        if (isCollapsedDesktop) { onToggle(); setPlatesExpanded(true); }
                        else setPlatesExpanded((value) => !value);
                      }}>
                        <span className="shrink-0"><Icon size={17} /></span>
                        {!isCollapsedDesktop && <><span className="flex-1 truncate text-left">{item.label}</span><span className={`transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}><ChevronDownIcon size={13} /></span></>}
                      </button>
                      {expanded && (
                        <div id={submenuId} className="mb-1 ml-5 mt-1 space-y-0.5 border-l border-[#DCE2DA] pl-3">
                          {item.subItems!.map((sub) => (
                            <Link key={sub.href} href={sub.href} onClick={onItemClick} aria-current={pathname === sub.href ? "page" : undefined} className={`flex items-center rounded-md px-3 text-[12px] transition-colors ${isMobile ? "min-h-11" : "min-h-8"} ${focusStyle} ${pathname === sub.href ? "bg-[#E8EFE9] font-semibold text-[#294F39]" : idleStyle}`}>
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link key={item.href} href={item.href!} onClick={onItemClick} aria-current={active ? "page" : undefined} aria-label={isCollapsedDesktop ? item.label : undefined} title={isCollapsedDesktop ? item.label : undefined} className={rowClass}>
                    <span className="shrink-0"><Icon size={17} /></span>
                    {!isCollapsedDesktop && <><span className="flex-1 truncate">{item.label}</span>{active && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#486B58]" />}</>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <footer className={`shrink-0 border-t border-[#E4E7E1] bg-[#F4F6F1] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 ${isCollapsedDesktop ? "px-2" : "px-4"}`}>
        <div className={`flex items-center ${isCollapsedDesktop ? "flex-col gap-2" : "gap-2.5"}`}>
          <span title={userSession?.name || "Administrator"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCE2D8] bg-[#E8ECE3] text-xs font-semibold text-[#4F5E48]">
            {userSession?.name?.charAt(0).toUpperCase() || "A"}
          </span>
          {!isCollapsedDesktop && <div className="min-w-0 flex-1"><p title={userSession?.name} className="truncate text-[12px] font-semibold">{userSession?.name || "Administrator"}</p><p className="mt-0.5 truncate text-[10px] text-[#70776F]">{displayRole}</p></div>}
          <button type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out" className={`flex shrink-0 items-center justify-center rounded-lg text-[#777E77] hover:bg-[#F4E9E6] hover:text-[#9C4939] ${isMobile ? "h-11 w-11" : "h-8 w-8"} ${focusStyle}`}><LogoutIcon size={16} /></button>
        </div>
      </footer>
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!mobileOpen) { if (dialog.open) dialog.close(); return; }
    const desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.matches) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const closeOnDesktop = () => { if (desktop.matches) onMobileClose(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      <aside aria-label="Sidebar" className={`relative z-20 hidden min-h-0 shrink-0 flex-col transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </aside>
      <dialog ref={dialogRef} aria-label="Navigation menu" onCancel={(event) => { event.preventDefault(); onMobileClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onMobileClose(); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-inherit backdrop:bg-[#1D2722]/30 backdrop:backdrop-blur-sm lg:hidden">
        <aside className="h-full w-72 max-w-[88vw] shadow-xl">
          {mobileOpen && <SidebarContent collapsed={false} onToggle={onMobileClose} onItemClick={onMobileClose} isMobile />}
        </aside>
      </dialog>
    </>
  );
}

/* ── Lightweight Precision SVG Icons (15-18px) ── */

function DashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function PlateIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2.5" />
      <line x1="7" y1="12" x2="17" y2="12" strokeWidth={2.5} />
      <circle cx="5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="19" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BookingIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function HistoryIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function PickupIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function ChartIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function LogIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function OrgIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="8.5" y="14" width="7" height="7" rx="1" />
      <path d="M6.5 10v2a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
      <path d="M12 14v-2" />
    </svg>
  );
}

function UsersIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
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

function OfficerIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ServiceIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 15h10M7 11h10M7 7h4" />
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

function BodyTypeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="7" cy="16" r="2" />
      <circle cx="17" cy="16" r="2" />
      <path d="M5 5l2-3h10l2 3" />
      <path d="M3 12h18" />
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
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CollapseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 9l-3 3 3 3" />
    </svg>
  );
}
