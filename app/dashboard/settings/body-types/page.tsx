"use client";

import { useState, useEffect, useMemo } from "react";

interface BodyTypeItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

// Body type icon mapping
const BODY_TYPE_ICONS: Record<string, string> = {
  SALOON: "🚗",
  HATCHBACK: "🚙",
  SUV: "🏎️",
  PICKUP: "🛻",
  MINIBUS: "🚐",
  BUS: "🚌",
  COUPE: "🏎️",
  EQUIPMENT: "🚜",
  CONVERTIBLE: "🏁",
  MOTORCYCLE: "🏍️",
};

export default function BodyTypesPage() {
  const [bodyTypes, setBodyTypes] = useState<BodyTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BodyTypeItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
    order: 10,
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadBodyTypes() {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles/body-types");
      if (res.ok) {
        const data = await res.json();
        setBodyTypes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load body types:", err);
      showToast("Failed to connect to body types API", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBodyTypes();
  }, []);

  const filteredBodyTypes = useMemo(() => {
    return bodyTypes.filter((bt) => {
      const matchSearch =
        bt.name.toLowerCase().includes(search.toLowerCase()) ||
        bt.code.toLowerCase().includes(search.toLowerCase()) ||
        (bt.description && bt.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? bt.isActive
          : !bt.isActive;

      return matchSearch && matchStatus;
    });
  }, [bodyTypes, search, statusFilter]);

  const activeCount = bodyTypes.filter((bt) => bt.isActive).length;
  const inactiveCount = bodyTypes.filter((bt) => !bt.isActive).length;

  async function handleToggleStatus(item: BodyTypeItem) {
    const updatedStatus = !item.isActive;
    // Optimistic UI update
    setBodyTypes((prev) =>
      prev.map((bt) => (bt.id === item.id ? { ...bt, isActive: updatedStatus } : bt))
    );

    try {
      const res = await fetch("/api/vehicles/body-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: updatedStatus }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }
      showToast(
        `${item.name} marked ${updatedStatus ? "ACTIVE" : "INACTIVE"}`
      );
    } catch (err) {
      // Rollback
      setBodyTypes((prev) =>
        prev.map((bt) => (bt.id === item.id ? { ...bt, isActive: !updatedStatus } : bt))
      );
      showToast("Failed to update status on server", "error");
    }
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      isActive: true,
      order: bodyTypes.length + 1,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function handleOpenEdit(item: BodyTypeItem) {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || "",
      isActive: item.isActive,
      order: item.order,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSaveBodyType(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("Code and Name are required");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        // Edit existing
        const res = await fetch("/api/vehicles/body-types", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
            order: formData.order,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update body type");
        }

        showToast(`Updated "${formData.name}" successfully`);
      } else {
        // Create new
        const res = await fetch("/api/vehicles/body-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
            order: formData.order,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create body type");
        }

        showToast(`Created body type "${formData.code.toUpperCase()}"`);
      }

      setModalOpen(false);
      await loadBodyTypes();
    } catch (err: any) {
      setFormError(err.message || "Failed to save body type");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteBodyType(item: BodyTypeItem) {
    if (["SALOON", "SUV", "PICKUP", "BUS"].includes(item.code)) {
      alert("Core baseline body types cannot be deleted. You can set them to INACTIVE instead.");
      return;
    }

    if (!confirm(`Are you sure you want to delete body type "${item.name}"?`)) return;

    try {
      const res = await fetch(`/api/vehicles/body-types?id=${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      showToast(`Deleted body type "${item.name}"`);
      await loadBodyTypes();
    } catch (err: any) {
      alert(err.message || "Could not delete body type");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-950 text-emerald-200 border-emerald-800"
              : "bg-red-950 text-red-200 border-red-800"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-xs font-bold text-sky-700 tracking-wider uppercase">
              Vehicle Configuration
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Vehicle Body Types Registry
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage official vehicle body type classifications. Active body types are directly selectable on the Booking Desk vehicle specification form.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <span>+</span>
            <span>Add Body Type</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Body Types</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{bodyTypes.length}</p>
          <span className="text-[11px] text-slate-400">Baseline + Custom configurations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 uppercase">Active for Booking</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          <span className="text-[11px] text-emerald-600/80">Selectable on vehicle spec form</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Inactive / Suspended</span>
          <p className="text-2xl font-black text-slate-500 mt-1">{inactiveCount}</p>
          <span className="text-[11px] text-slate-400">Hidden from new booking forms</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or body type name..."
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Filter:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({bodyTypes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                statusFilter === "INACTIVE"
                  ? "bg-white text-slate-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Body Types */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-sm font-semibold text-slate-400">
          Loading body types from database...
        </div>
      ) : filteredBodyTypes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">No body types match the criteria</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBodyTypes.map((bt) => {
            const icon = BODY_TYPE_ICONS[bt.code] || "🚗";

            return (
              <div
                key={bt.id}
                className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden flex flex-col ${
                  bt.isActive
                    ? "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    : "border-slate-200/60 opacity-70 bg-slate-50/50"
                }`}
              >
                {/* Card Header with Icon */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                        {icon}
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-900 tracking-tight block">
                          {bt.name}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                          {bt.code}
                        </span>
                      </div>
                    </div>

                    {/* Active / Inactive Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                        bt.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          bt.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {bt.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {bt.description || "Official vehicle body type classification for registration records."}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Order: {bt.order}</span>
                    <span>•</span>
                    <span>ID: {bt.id.slice(-6)}</span>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    {/* Status Toggle Switch */}
                    <div className="flex items-center gap-2.5">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bt.isActive}
                          onChange={() => handleToggleStatus(bt)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className="text-[11px] font-bold text-slate-700">
                        {bt.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(bt)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        Edit
                      </button>
                      {!["SALOON", "SUV", "PICKUP", "BUS"].includes(bt.code) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBodyType(bt)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {editingItem ? `Edit Body Type: ${editingItem.code}` : "New Body Type"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveBodyType} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Body Type Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingItem)}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="E.G. WAGON"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Body Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.G. Station Wagon"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter body type description and usage criteria..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bodyTypeActiveCheck"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                    />
                    <label
                      htmlFor="bodyTypeActiveCheck"
                      className="text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      Active on Booking Desk
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Body Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
