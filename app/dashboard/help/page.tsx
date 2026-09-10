"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface FAQItem {
  id: string;
  category: "filing" | "plates" | "security" | "hardware";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    category: "security",
    question: "What should an officer do when an INTERPOL / Stolen Vehicle VIN warning is triggered?",
    answer: "Immediately pause the registration booking. Do not certify or submit Stage 04. Record the 17-character VIN in the Station Suspicious Activity Log, notify the Station Superintending Officer, and forward the customs declaration code to the Ghana Police CID Auto Theft Unit via the integrated security hotline (Ext 402).",
  },
  {
    id: "faq-2",
    category: "plates",
    question: "What is the procedure for vehicle ownership transfer and plate retention?",
    answer: "Under the revised national statutory code, physical license plates remain the legal property of the original registered owner. Upon vehicle sale, the owner must either surrender the plate set to the counter desk or file a Plate Retention & Transfer Amendment at the booking desk to reassign the series to a newly acquired vehicle.",
  },
  {
    id: "faq-3",
    category: "filing",
    question: "How are joint co-owners registered on commercial or private vehicles?",
    answer: "In Stage 01 of the Booking Desk, click '+ Add Co-Owner'. You can add up to 4 legal co-owners. Each co-owner requires a verified Ghana Card PIN, residential address, and phone number. All names will appear on the official certificate of registration and digital plate registry.",
  },
  {
    id: "faq-4",
    category: "plates",
    question: "What qualifications govern the allocation of Electric Vehicle (EV) Green Plates?",
    answer: "Electric Vehicle (EV) and Plug-In Hybrid Electric (PHEV) vehicles qualify for the specialized reflective green plates (e.g. AD 8841-26). The fuel type in Stage 02 must be certified as 'Electric' or 'Plug-in Hybrid', and emissions rating must be 0 g/km. EV plates benefit from national road toll exemptions.",
  },
  {
    id: "faq-5",
    category: "security",
    question: "What happens when a Reserved Block Hold reaches its 60-day expiry?",
    answer: "Reserved blocks automatically enter a 7-day grace period with warning alerts displayed on the Reserved Plates dashboard. If unassigned by the organization or diplomatic mission after grace, the remaining unclaimed numbers are automatically released back into the general station inventory quota.",
  },
  {
    id: "faq-6",
    category: "hardware",
    question: "How to resolve communication timeout on Station Embossing Press line?",
    answer: "Verify the physical Ethernet connection on Press IP 192.168.4.120. Check that Socket Port 9100 is open in Station Settings. Press the physical 'Reset Controller' button on the stamping cabinet for 3 seconds to clear buffer memory, then click 'Sync Embossing Queue' on the Inventory page.",
  },
];

interface SupportTicket {
  id: string;
  category: string;
  priority: "Normal" | "Urgent" | "Critical";
  subject: string;
  status: "Open" | "In Review" | "Resolved";
  timestamp: string;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"manual" | "faq" | "ticket" | "status">("manual");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-1");

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Hardware Press");
  const [ticketPriority, setTicketPriority] = useState<"Normal" | "Urgent" | "Critical">("Normal");
  const [ticketDesc, setTicketDesc] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "TKT-DVLA-8402",
      category: "Hardware Press",
      priority: "Urgent",
      subject: "Press Line #2 Blank Feeder Jam",
      status: "In Review",
      timestamp: "Today at 08:45 GMT",
    },
    {
      id: "TKT-DVLA-8391",
      category: "Database Sync",
      priority: "Normal",
      subject: "Tema Customs Gateway Latency",
      status: "Resolved",
      timestamp: "Yesterday",
    },
  ]);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    const newTicket: SupportTicket = {
      id: `TKT-DVLA-${Math.floor(8500 + Math.random() * 500)}`,
      category: ticketCategory,
      priority: ticketPriority,
      subject: ticketSubject.trim(),
      status: "Open",
      timestamp: "Just now",
    };

    setTickets([newTicket, ...tickets]);
    setTicketSubject("");
    setTicketDesc("");
    setTicketSubmitted(true);
    setTimeout(() => setTicketSubmitted(false), 4000);
  };

  const handleDownloadSop = (title: string) => {
    const docContent = `DVLA OFFICIAL STANDARD OPERATING PROCEDURE\nTitle: ${title}\nAuthority: Driver and Vehicle Licensing Authority (DVLA Ghana)\nClassification: OFFICIAL RESTRICTED\nDate: September 2026\n\n1. SCOPE & PURPOSE\nThis standard operating procedure mandates strict compliance across all regional licensing offices, municipal satellite stations, and production centers.\n\n2. CUSTODY & AUDIT\nAll plate blanks must be checked against central database serial numbers before heat-stamping.`;
    const blob = new Blob([docContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DVLA_SOP_${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto p-6">
      {/* Top Command Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Knowledge Base &amp; Support
            </span>
            <span className="text-xs text-slate-400 font-mono">DVLA Station SOPs &amp; Help Desk</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Officer Help Center &amp; SOP Knowledge Base
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl font-normal">
            Operational reference documentation, standard operating procedure manuals, regulatory FAQs, and direct station technical support dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/workflow"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <span>Open Workflow Pipeline</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Search & Tabs Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {[
            { id: "manual", label: "SOP Manuals & Guides", icon: "📖" },
            { id: "faq", label: "Interactive FAQs", icon: "❓" },
            { id: "ticket", label: "Submit Help Ticket", icon: "🎫" },
            { id: "status", label: "System Health Matrix", icon: "⚡" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100/70"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Knowledge Base Instant Search */}
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Search FAQs &amp; SOP guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: SOP Manuals & Guides */}
      {activeTab === "manual" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
          {[
            {
              title: "SOP 01: Physical Plate Chain of Custody",
              code: "DVLA-SOP-COC-01",
              category: "Counter Operations",
              desc: "Mandatory counter identification verification, photo identification validation, and double-entry register logging for collection counter.",
            },
            {
              title: "SOP 02: RFID Smart Chip Pairing Protocol",
              code: "DVLA-SOP-RFID-02",
              category: "Manufacturing Line",
              desc: "Procedures for programming passive 860-960 MHz UHF RFID tags and heat-bonding holographic security seals to embossed aluminum.",
            },
            {
              title: "SOP 03: Anti-Smuggling Chassis Validation",
              code: "DVLA-SOP-VIN-03",
              category: "Intelligence & Security",
              desc: "Cross-referencing 17-digit ISO VIN stamps against GRA Tema/Takoradi Port customs records, Interpol stolen motor databases, and ECOWAS registry.",
            },
            {
              title: "SOP 04: Institutional Block Allocation",
              code: "DVLA-SOP-BLK-04",
              category: "Fleet Registrations",
              desc: "Rules governing block reservation allocations for Government Ministries, diplomatic corps, and state security agency fleets.",
            },
            {
              title: "SOP 05: Lost / Stolen Plate Replacement",
              code: "DVLA-SOP-LST-05",
              category: "Client Services",
              desc: "Affidavit verification, police station confirmation receipt, and automated reissuance sequence assigning with security warning flag.",
            },
            {
              title: "SOP 06: EV Toll Exemption Certification",
              code: "DVLA-SOP-EV-06",
              category: "Environmental Policy",
              desc: "Standards for authenticating zero-emissions electric motor propulsion systems and assigning green registration plates.",
            },
          ].map((sop) => (
            <div
              key={sop.code}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {sop.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{sop.code}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{sop.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">{sop.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">PDF Guide · 4 Pages</span>
                <button
                  onClick={() => handleDownloadSop(sop.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 transition cursor-pointer"
                >
                  <span>📥</span>
                  <span>Download SOP</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Interactive FAQs */}
      {activeTab === "faq" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-4 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Frequently Asked Operational Questions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick guidance on common regulatory and technical scenarios encountered at stations.</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 font-mono">
              {filteredFaqs.length} FAQs Found
            </span>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-slate-200/80 overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    className="w-full text-left p-4 bg-white hover:bg-slate-50 flex items-center justify-between gap-4 transition cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-emerald-600 font-mono">Q:</span>
                      <span>{faq.question}</span>
                    </span>
                    <span className="text-slate-400 font-bold text-sm shrink-0">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                      <span className="text-emerald-700 font-bold font-mono mr-1.5">Official SOP:</span>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Submit Support Ticket */}
      {activeTab === "ticket" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in">
          {/* Ticket Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Station IT &amp; Engineering Support Ticket</h3>
              <p className="text-xs text-slate-500 mt-0.5">Submit hardware malfunction reports, database sync issues, or account permission escalations.</p>
            </div>

            {ticketSubmitted && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                ✓ Support ticket submitted successfully! Regional IT dispatch has been notified.
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Hardware Press">Embossing Machine / Press Hardware</option>
                    <option value="Database Sync">PostgreSQL / Supabase Database Sync</option>
                    <option value="VRS Customs">GRA Customs VRS Gateway Integration</option>
                    <option value="User Credentials">Officer Role Credentials / Permissions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity &amp; Priority Level</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Normal">Normal — Routine Inquiry</option>
                    <option value="Urgent">Urgent — Slowing Station Operations</option>
                    <option value="Critical">Critical — Station Stamping Line Halted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Press Line #02 Sensor Calibration Error"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Technical Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe error code, affected plate series, and steps taken..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
                >
                  Submit Incident Ticket
                </button>
              </div>
            </form>
          </div>

          {/* Ticket History Sidebar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Station Active Tickets ({tickets.length})</h3>
            
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{t.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        t.status === "Resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "In Review"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 line-clamp-1">{t.subject}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{t.category}</span>
                    <span>{t.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System Health Matrix */}
      {activeTab === "status" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">National Infrastructure &amp; API Connectivity Status</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time health telemetry across DVLA central databases, customs gateways, and station nodes.</p>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "PostgreSQL Central Primary Node",
                endpoint: "db.dvla.gov.gh (Supabase Cluster)",
                status: "Operational",
                latency: "14ms",
                uptime: "99.98%",
                desc: "Holds national vehicle registries, co-owner tables, and block reservation quotas.",
              },
              {
                name: "GRA Customs VRS Gateway",
                endpoint: "vrs-api.gra.gov.gh (REST / OAuth2)",
                status: "Operational",
                latency: "42ms",
                uptime: "99.91%",
                desc: "Clears bill of entry declarations, customs duty payment verification, and CIF invoices.",
              },
              {
                name: "Interpol National Central Bureau (NCB)",
                endpoint: "interpol.police.gov.gh (Encrypted VPN)",
                status: "Operational",
                latency: "68ms",
                uptime: "99.85%",
                desc: "Conducts instant stolen motor vehicle (SMV) database cross-checks on all 17-char VINs.",
              },
              {
                name: "Citizen SMS Gateway (MTN / Telecel)",
                endpoint: "sms.ghana.gov.gh (SMPP v3.4)",
                status: "Operational",
                latency: "120ms",
                uptime: "99.99%",
                desc: "Dispatches automated counter pickup notifications and filing verification tokens to owners.",
              },
            ].map((node) => (
              <div key={node.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{node.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {node.status}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-slate-500">{node.endpoint}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{node.desc}</p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Latency: <strong className="text-emerald-700">{node.latency}</strong></span>
                  <span>Uptime: <strong className="text-slate-700">{node.uptime}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
