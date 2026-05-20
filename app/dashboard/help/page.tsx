"use client";

import { useState } from "react";

const PAGES_GUIDE = [
  {
    title: "📊 Admin Dashboard",
    route: "/dashboard",
    purpose: "Main Overview Page",
    description: "This page shows general counts like total plates issued and pending requests. It also has a search tracker. You can search by Chassis Number or Plate ID to see the progress of a plate up to pickup.",
    color: "#81B71A",
    bg: "rgba(129,183,26,0.08)",
  },
  {
    title: "📖 Booking Desk",
    route: "/dashboard/booking",
    purpose: "Digitized Register Book",
    description: "This page replaces the paper register book. You can enter all columns from the paper sheets (owner, full vehicle specs, tyre sizes, payments, and officers). It includes a scan simulator and a live book preview.",
    color: "#81B71A",
    bg: "rgba(129,183,26,0.08)",
  },
  {
    title: "🔍 Search & Registry",
    route: "/dashboard/plates",
    purpose: "Search Issued Plates",
    description: "This page lets you search all issued plates. You can search by plate number or owner names. It shows pictures of the plates and displays the details of all co-owners.",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    title: "📝 Applications Review",
    route: "/dashboard/plates/applications",
    purpose: "Approve or Reject Requests",
    description: "This page is for supervisors. You can look at new plate requests, check co-owners, verify the Chassis Number, and click Approve or Reject to send it to production.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    title: "✨ Custom Plates Workshop",
    route: "/dashboard/plates/custom",
    purpose: "Apply for Custom Plates",
    description: "This page lets customers apply for a custom vanity plate. It checks that the text is valid, blocks bad words, and lets you add up to 4 co-owners to the plate.",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
  }
];

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Blanks Stocking",
    badge: "Step 1",
    description: "Raw aluminum plates are bought and placed in the warehouse stock.",
    color: "#6b7a99",
    icon: "📦"
  },
  {
    step: 2,
    title: "Requisition Booking",
    badge: "Step 2",
    description: "The customer applies for a plate. They enter the primary owner details, add co-owners, and enter their Chassis Number.",
    color: "#3b82f6",
    icon: "📝"
  },
  {
    step: 3,
    title: "Chassis & Security Audit",
    badge: "Step 3",
    description: "The officer checks the Chassis Number to make sure this vehicle is cleared and does not have duplicate plates. The supervisor approves the request.",
    color: "#f59e0b",
    icon: "🔍"
  },
  {
    step: 4,
    title: "Embossing & Smart-Tagging",
    badge: "Step 4",
    description: "The raw blank plate is stamped with numbers and colored (White, Yellow, Green, or Purple). A smart scannable chip is paired with the plate.",
    color: "#8b5cf6",
    icon: "🖨️"
  },
  {
    step: 5,
    title: "Customer Pickup",
    badge: "Step 5 (Final)",
    description: "The plate is active. The customer goes to the regional collection counter, shows their ID, and picks up their physical license plate.",
    color: "#81B71A",
    icon: "🎁"
  }
];

export default function HelpPage() {
  const [activeWorkflow, setActiveWorkflow] = useState(1);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Page Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-6 mb-2"
        style={{ background: "linear-gradient(115deg, #0d1a03 0%, #1a2e05 18%, #2d5009 48%, #4a7c10 74%, #81B71A 100%)" }}>
        
        {/* Grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} preserveAspectRatio="none">
          <defs>
            <pattern id="headergrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#headergrid)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.6)" }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
                DVLA VEHICLE PLATE SYSTEM
              </p>
            </div>
            <h2 className="font-extrabold tracking-tight text-white text-2xl">
              Portal Workflow &amp; Supervisor Guide
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              A simple guide explaining the system pages and the step-by-step plate issuance cycle.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Side: System Pages Directory */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm">
            <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider mb-4">🖥️ Application View Directory</h3>
            
            <div className="space-y-4">
              {PAGES_GUIDE.map((page) => (
                <div key={page.route} className="flex gap-4 p-4 rounded-xl border border-[#f0f4f8] bg-[#fdfefe] hover:shadow-md transition duration-200">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: page.bg, color: page.color, fontSize: "1.25rem" }}>
                    {page.title.split(" ")[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#1a2e05]">{page.title.split(" ").slice(1).join(" ")}</h4>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-[#9aa3be] bg-slate-50 border border-slate-100">
                        {page.route}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-[#52607a] bg-[#f0f4f8]">
                        {page.purpose}
                      </span>
                    </div>
                    <p className="text-xs text-[#52607a] leading-relaxed font-medium">
                      {page.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Flow to Pickup */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
            <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider">🔄 Step-by-Step Issuance Cycle (Up to Pickup)</h3>
            <p className="text-xs text-[#9aa3be] leading-relaxed">
              This system tracks plate management from raw inventory stock up to final customer collection.
            </p>
            
            <div className="relative border-l-2 border-[#e2e8f0] ml-3 pl-6 space-y-5 py-2">
              {WORKFLOW_STEPS.map((step) => {
                const isActive = activeWorkflow === step.step;
                return (
                  <div
                    key={step.step}
                    className="relative cursor-pointer group"
                    onClick={() => setActiveWorkflow(step.step)}
                  >
                    {/* Stepper Bullet */}
                    <div className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shadow-sm transition-all duration-300 ${
                      isActive
                        ? "bg-[#81B71A] border-[#81B71A] text-white scale-110 ring-4 ring-[#81B71A]/10"
                        : "bg-white border-[#cbd5e1] text-[#94a3b8] group-hover:border-[#94a3b8]"
                    }`}>
                      {step.step}
                    </div>

                    <div className={`p-3 rounded-lg border transition duration-150 ${
                      isActive 
                        ? "bg-[#f8faff] border-[#81B71A]/30 shadow-sm" 
                        : "bg-white border-transparent hover:bg-slate-50/50"
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[#1a2e05]">{step.icon} {step.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-100 text-[#6b7a99]">
                          {step.badge}
                        </span>
                      </div>
                      
                      {isActive && (
                        <p className="text-[11px] text-[#52607a] mt-2 leading-relaxed font-semibold transition-all duration-200">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note box */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-[#6b7a99] font-medium leading-relaxed">
              💡 <strong>Note:</strong> Under the new DVLA policy, license plates serve as a secure personal ID. Plates must be removed when a vehicle is sold or transferred to a new owner.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
