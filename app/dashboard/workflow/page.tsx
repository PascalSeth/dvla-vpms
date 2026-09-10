"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DigitalPlate, PlateCategory } from "@/components/DigitalPlate";

interface WorkflowItem {
  id: string;
  plateNumber: string;
  ownerName: string;
  phone: string;
  vin: string;
  vehicle: string;
  category: PlateCategory;
  stage: 1 | 2 | 3 | 4 | 5;
  officer: string;
  slaMinutes: number;
  enteredStageAt: string;
  notes?: string;
}

const STAGES = [
  { id: 1, name: "1. Blanks Stocking", short: "Raw Stock", icon: "📦", desc: "Raw aluminum blank logged & assigned" },
  { id: 2, name: "2. Requisition Filing", short: "Filing Desk", icon: "📝", desc: "Owner documentation & record filing" },
  { id: 3, name: "3. Chassis & Security Audit", short: "Security Audit", icon: "🔍", desc: "Interpol clearance & supervisor sign-off" },
  { id: 4, name: "4. Embossing & Smart RFID", short: "Embossing", icon: "🖨️", desc: "Heat-stamping & chip pairing" },
  { id: 5, name: "5. Counter Handover", short: "Ready for Pickup", icon: "🤝", desc: "Physical plate ready for citizen collection" },
] as const;

const INITIAL_WORKFLOW_ITEMS: WorkflowItem[] = [
  {
    id: "WF-2026-081",
    plateNumber: "AD 1092-26",
    ownerName: "Kwame Mensah",
    phone: "024 456 7890",
    vin: "JHMGE8850CC019284",
    vehicle: "2022 Toyota Land Cruiser Prado",
    category: "private",
    stage: 2,
    officer: "Eric Ansah",
    slaMinutes: 14,
    enteredStageAt: "10 mins ago",
    notes: "Customs declaration cleared at Tema Port.",
  },
  {
    id: "WF-2026-082",
    plateNumber: "AD 4059-26",
    ownerName: "Ministry of Transport",
    phone: "030 211 4455",
    vin: "WBA33AY07NF501928",
    vehicle: "2024 Nissan Patrol V8 VIP",
    category: "government",
    stage: 3,
    officer: "Kofi Owusu",
    slaMinutes: 28,
    enteredStageAt: "18 mins ago",
    notes: "Requires dual supervisor authorization.",
  },
  {
    id: "WF-2026-083",
    plateNumber: "AD 8841-26",
    ownerName: "Samuel Osei Tutu",
    phone: "020 987 6543",
    vin: "1HGCR2F83HA029381",
    vehicle: "2023 Hyundai Ioniq 5 EV",
    category: "ev",
    stage: 4,
    officer: "Abena Serwaa",
    slaMinutes: 8,
    enteredStageAt: "5 mins ago",
    notes: "Green EV reflective foil mounted in press #2.",
  },
  {
    id: "WF-2026-084",
    plateNumber: "AD 3021-26",
    ownerName: "Greater Accra Haulage Ltd",
    phone: "055 332 9901",
    vin: "3FA6P0H78HR192834",
    vehicle: "2021 DAF Heavy Haulage Truck",
    category: "commercial",
    stage: 1,
    officer: "Yaw Boateng",
    slaMinutes: 4,
    enteredStageAt: "2 mins ago",
    notes: "Commercial yellow blank dispatched from inventory.",
  },
  {
    id: "WF-2026-085",
    plateNumber: "AD 9112-26",
    ownerName: "Akosua Addo",
    phone: "027 884 1290",
    vin: "KL4CJASB8EB819203",
    vehicle: "2024 Mercedes-Benz C300",
    category: "private",
    stage: 5,
    officer: "Eric Ansah",
    slaMinutes: 45,
    enteredStageAt: "32 mins ago",
    notes: "Staged at counter #03. SMS notification dispatched.",
  },
];

export default function WorkflowPage() {
  const [items, setItems] = useState<WorkflowItem[]>(INITIAL_WORKFLOW_ITEMS);
  const [selectedStageFilter, setSelectedStageFilter] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectItem, setInspectItem] = useState<WorkflowItem | null>(null);
  const [isExpediteModalOpen, setIsExpediteModalOpen] = useState(false);

  // New expedited item form
  const [newOwner, setNewOwner] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newCategory, setNewCategory] = useState<PlateCategory>("private");

  // Advance item to next stage
  const advanceStage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.stage < 5) {
          return {
            ...item,
            stage: (item.stage + 1) as any,
            enteredStageAt: "Just now",
            slaMinutes: 1,
          };
        }
        return item;
      })
    );
  };

  // Revert stage
  const revertStage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.stage > 1) {
          return {
            ...item,
            stage: (item.stage - 1) as any,
            enteredStageAt: "Just now",
          };
        }
        return item;
      })
    );
  };

  const handleCreateExpedited = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner.trim() || !newVehicle.trim()) return;

    const newItem: WorkflowItem = {
      id: `WF-2026-${Math.floor(100 + Math.random() * 900)}`,
      plateNumber: newPlate.trim() || `AD ${Math.floor(1000 + Math.random() * 8999)}-26`,
      ownerName: newOwner.trim(),
      phone: "024 000 1122",
      vin: `VIN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      vehicle: newVehicle.trim(),
      category: newCategory,
      stage: 1,
      officer: "Supervisor Override",
      slaMinutes: 1,
      enteredStageAt: "Just now",
      notes: "Expedited processing ticket issued.",
    };

    setItems([newItem, ...items]);
    setNewOwner("");
    setNewVehicle("");
    setNewPlate("");
    setIsExpediteModalOpen(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStage = selectedStageFilter === "ALL" || item.stage === selectedStageFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.ownerName.toLowerCase().includes(q) ||
        item.plateNumber.toLowerCase().includes(q) ||
        item.vin.toLowerCase().includes(q) ||
        item.vehicle.toLowerCase().includes(q);
      return matchesStage && matchesSearch;
    });
  }, [items, selectedStageFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto p-6">
      {/* Top Command Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operations Control
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Pipeline Active
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">DVLA HQ · 5-Stage SLA Tracker</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Plate Lifecycle Workflow &amp; SLA Pipeline
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl font-normal">
            Track and orchestrate active vehicle plate applications through blanks stocking, registration filing, security chassis audit, physical embossing, and counter collection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsExpediteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <span className="text-sm leading-none">+</span>
            <span>Expedite New Filing</span>
          </button>
        </div>
      </div>

      {/* KPI Pipeline Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active in Pipeline</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900">{items.length}</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Total In Progress
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg. SLA Turnaround</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-700">~21m</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Within Target
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Embossing Queue</span>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-purple-700">
              {items.filter((i) => i.stage === 4).length}
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
              Press Line 2
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ready for Counter Pickup</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {items.filter((i) => i.stage === 5).length}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              Counter Staged
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedStageFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedStageFilter === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Stages ({items.length})
          </button>
          {STAGES.map((s) => {
            const count = items.filter((i) => i.stage === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStageFilter(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  selectedStageFilter === s.id
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.short} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Search plate, owner, VIN..."
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

      {/* 5-Stage Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start">
        {STAGES.map((stage) => {
          const stageItems = filteredItems.filter((i) => i.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 space-y-3 min-h-[460px] flex flex-col"
            >
              {/* Column Header */}
              <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{stage.icon}</span>
                    <h3 className="text-xs font-bold text-slate-900">{stage.short}</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{stage.desc}</p>
                </div>
                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                  {stageItems.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[640px] pr-0.5">
                {stageItems.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-center p-3 text-[11px] text-slate-400">
                    No filings in this stage
                  </div>
                ) : (
                  stageItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setInspectItem(item)}
                      className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-2.5 cursor-pointer group"
                    >
                      {/* Top plate & category tag */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.plateNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.category === "government"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.category === "commercial"
                              ? "bg-amber-100 text-amber-800"
                              : item.category === "ev"
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* Vehicle & Owner */}
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-slate-800 truncate">{item.ownerName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{item.vehicle}</div>
                      </div>

                      {/* SLA and Stage progression buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-400">{item.enteredStageAt}</span>

                        <div className="flex items-center gap-1">
                          {item.stage > 1 && (
                            <button
                              onClick={(e) => revertStage(item.id, e)}
                              title="Move Back"
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
                            >
                              ←
                            </button>
                          )}
                          {item.stage < 5 ? (
                            <button
                              onClick={(e) => advanceStage(item.id, e)}
                              title="Advance to Next Stage"
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
                            >
                              <span>Next</span>
                              <span>→</span>
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Item Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200/80 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">WORKFLOW DOSSIER · {inspectItem.id}</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">Application Lifecycle Audit</h2>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Render authentic digital plate preview */}
            <div className="flex justify-center p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="w-full max-w-xs transform scale-90">
                <DigitalPlate
                  plateNumber={inspectItem.plateNumber}
                  category={inspectItem.category}
                />
              </div>
            </div>

            {/* Detailed Spec List */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Primary Legal Owner</span>
                <span className="font-bold text-slate-900">{inspectItem.ownerName}</span>
                <span className="text-[11px] text-slate-500 block font-mono">{inspectItem.phone}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Vehicle Make &amp; Model</span>
                <span className="font-bold text-slate-900">{inspectItem.vehicle}</span>
                <span className="text-[10px] text-slate-500 block font-mono">{inspectItem.vin}</span>
              </div>
            </div>

            {/* Current Stage Indicator */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold block">Current Operational Stage</span>
                <span className="font-bold text-xs text-emerald-950">
                  {STAGES.find((s) => s.id === inspectItem.stage)?.name}
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-700">{inspectItem.enteredStageAt}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                {inspectItem.stage > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      revertStage(inspectItem.id);
                      setInspectItem(null);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    ← Revert Stage
                  </button>
                )}
                {inspectItem.stage < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      advanceStage(inspectItem.id);
                      setInspectItem(null);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    Advance to Next Stage →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expedited Filing Modal */}
      {isExpediteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200/80 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Expedite Pipeline Filing</h2>
                <p className="text-xs text-slate-500">Insert an accelerated vehicle filing ticket directly into the workflow.</p>
              </div>
              <button
                onClick={() => setIsExpediteModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpedited} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024 Toyota RAV4 Hybrid"
                  value={newVehicle}
                  onChange={(e) => setNewVehicle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plate Number</label>
                  <input
                    type="text"
                    placeholder="Auto-assigned if empty"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plate Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PlateCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="private">Private (White)</option>
                    <option value="commercial">Commercial (Yellow)</option>
                    <option value="government">Government (Green Split)</option>
                    <option value="ev">Electric Vehicle (Green)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpediteModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                >
                  Inject into Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
