"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { label: "Dashboard",      href: "/dashboard",               icon: DashIcon },
      {
        label: "Vehicle Plates",
        icon: PlateIcon,
        subItems: [
          { label: "Search & Registry", href: "/dashboard/plates" },
          { label: "Applications",      href: "/dashboard/plates/applications" },
          { label: "Custom Plates",     href: "/dashboard/plates/custom" },
          { label: "Inventory / Batches", href: "/dashboard/plates/inventory" },
        ]
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports",   href: "/dashboard/reports", icon: ChartIcon },
      { label: "Audit Log", href: "/dashboard/audit",   icon: LogIcon },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
    ],
  },
];

/* Brand palette */
const GREEN  = "#81B71A";
const DKGREEN = "#6a9a15";   /* hover / active bg */

function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();

  const isPlatesActive = pathname.startsWith("/dashboard/plates");
  const [platesExpanded, setPlatesExpanded] = useState(isPlatesActive);

  return (
    <div className="h-full flex flex-col relative"
      style={{ background: "linear-gradient(175deg, #0d1a03 0%, #1a2e05 28%, #2d5009 58%, #4a7c10 82%, #81B71A 100%)" }}>

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.2)" }}>
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-lg blur-sm" style={{ background: "rgba(255,255,255,0.3)" }} />
          <Image src="/dvla-bg.png" alt="DVLA" width={34} height={34} priority
            className="relative rounded-lg object-contain"
            style={{ background: "rgba(255,255,255,0.25)", padding: 3 }} />
        </div>
        <div className={`overflow-hidden transition-all duration-300 flex flex-col justify-center
          ${collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-40 opacity-100"}`}>
          <p className="text-white font-bold text-sm tracking-widest uppercase leading-none whitespace-nowrap">DVLA</p>
          <p className="text-[10px] tracking-wider uppercase mt-0.5 whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.65)" }}>
            Vehicle Plate System
          </p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className={`flex-1 py-4 px-2 space-y-5 ${collapsed ? "overflow-visible" : "overflow-y-auto"}`}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.45)" }}>
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const hasSubItems = "subItems" in item;
                const active = hasSubItems
                  ? pathname.startsWith("/dashboard/plates")
                  : pathname === item.href;
                const Icon = item.icon;

                if (hasSubItems) {
                  const isExpanded = !collapsed && platesExpanded;
                  return (
                    <div key={item.label} className="space-y-0.5 relative group">
                      {/* Parent button */}
                      <button
                        onClick={() => {
                          if (collapsed) {
                            onToggle(); // expand sidebar if collapsed
                            setPlatesExpanded(true);
                          } else {
                            setPlatesExpanded(!platesExpanded);
                          }
                        }}
                        type="button"
                        className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                        style={{
                          background: active ? "rgba(255,255,255,0.18)" : "transparent",
                          color: "white",
                        }}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
                        )}
                        <span className="shrink-0" style={{ opacity: active ? 1 : 0.75 }}>
                          <Icon size={18} />
                        </span>
                        <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                          inline-block flex-1 text-left
                          ${collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-48 opacity-100"}`}
                          style={{ opacity: active ? 1 : 0.75 }}>
                          {item.label}
                        </span>
                        
                        {!collapsed && (
                          <span className="shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                            <ChevronDownIcon size={14} />
                          </span>
                        )}

                        {/* Hover overlay */}
                        {!active && (
                          <span className="absolute inset-0 rounded-lg opacity-0 hover:bg-white/10 group-hover:opacity-100 transition-opacity"
                            style={{ background: "rgba(255,255,255,0.12)" }} />
                        )}

                        {/* Collapsed tooltip / floating submenu popover */}
                        {collapsed && (
                          <div className="absolute left-full top-0 ml-3 py-1.5 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 flex flex-col z-50 min-w-[190px] border"
                               style={{ background: "linear-gradient(135deg, #0d1a03 0%, #1a2e05 100%)", borderColor: "rgba(129,183,26,0.3)" }}>
                            <div className="px-3 py-1.5 border-b text-[10px] font-bold uppercase tracking-wider"
                                 style={{ color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.1)" }}>
                              {item.label}
                            </div>
                            {item.subItems!.map((sub) => {
                              const subActive = pathname === sub.href;
                              return (
                                <Link key={sub.href} href={sub.href}
                                      className="px-3.5 py-2 text-xs font-medium transition-all hover:bg-white/10 text-left"
                                      style={{
                                        color: subActive ? "#81B71A" : "rgba(255,255,255,0.75)",
                                        background: subActive ? "rgba(255,255,255,0.06)" : "transparent"
                                      }}>
                                  {sub.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </button>
                      
                      {/* Submenu items list */}
                      {isExpanded && (
                        <div className="mt-1 ml-6 pl-3 border-l space-y-1" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                          {item.subItems!.map((sub) => {
                            const subActive = pathname === sub.href;
                            return (
                              <Link key={sub.href} href={sub.href}
                                    className="flex items-center py-2 px-3 text-xs rounded-md transition-all font-medium relative group"
                                    style={{
                                      color: subActive ? "white" : "rgba(255,255,255,0.65)",
                                      background: subActive ? "rgba(255,255,255,0.15)" : "transparent",
                                    }}>
                                <span className="text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 inline-block">
                                  {sub.label}
                                </span>
                                {!subActive && (
                                  <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: "rgba(255,255,255,0.06)" }} />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Standard Link item
                return (
                  <Link key={item.href} href={item.href!}
                    className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
                    style={{
                      background: active ? "rgba(255,255,255,0.22)" : "transparent",
                      color: "white",
                    }}>
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
                    )}
                    <span className="shrink-0" style={{ opacity: active ? 1 : 0.75 }}>
                      <Icon size={18} />
                    </span>
                    <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                      inline-block
                      ${collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-48 opacity-100"}`}
                      style={{ opacity: active ? 1 : 0.75 }}>
                      {item.label}
                    </span>

                    {/* Hover overlay */}
                    {!active && (
                      <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(255,255,255,0.12)" }} />
                    )}

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
                        whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-all duration-150 translate-x-1 group-hover:translate-x-0 z-50 shadow-xl"
                        style={{ background: "white", color: GREEN, border: `1px solid rgba(129,183,26,0.2)` }}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User ── */}
      <div className="shrink-0 px-2 pb-4 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
        <div className="flex items-center rounded-lg transition-all duration-300"
          style={{ 
            background: "rgba(255,255,255,0.15)",
            padding: collapsed ? "10px" : "10px 12px",
            gap: collapsed ? "0px" : "12px"
          }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0
            text-sm font-bold border-2 border-white"
            style={{ background: DKGREEN, color: "white" }}>
            A
          </div>
          <div className={`flex-1 overflow-hidden transition-all duration-300 flex flex-col justify-center
            ${collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-40 opacity-100"}`}>
            <p className="text-white text-xs font-semibold truncate leading-none">Administrator</p>
            <p className="text-[10px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>admin@dvla.gov.gh</p>
          </div>
          {!collapsed && (
            <button onClick={() => router.push("/login")} title="Sign out"
              className="shrink-0 transition-opacity hover:opacity-100"
              style={{ color: "rgba(255,255,255,0.65)" }}>
              <LogoutIcon size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Collapse toggle ── */}
      <button onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center
          shadow-md border-2 transition-transform hover:scale-110 z-10"
        style={{ background: "white", borderColor: GREEN, color: GREEN }}>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          {collapsed ? <path d="M3 2l4 3-4 3" /> : <path d="M7 2L3 5l4 3" />}
        </svg>
      </button>
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col relative shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 68 : 240 }}>
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={onMobileClose} />
          <aside className="fixed left-0 top-0 bottom-0 z-50 lg:hidden" style={{ width: 240 }}>
            <SidebarContent collapsed={false} onToggle={onMobileClose} />
          </aside>
        </>
      )}
    </>
  );
}

/* ── Icons ── */
function DashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function PlateIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth={2.5} />
      <circle cx="4.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="9" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ChartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function LogIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function LogoutIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function ChevronDownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
