"use client";

import { useState, useEffect, useMemo } from "react";
import { DigitalPlate, PlateCategory } from "@/components/DigitalPlate";

interface PlateCategoryItem {
  id: string;
  code: string;
  name: string;
  badge: string;
  description: string | null;
  plateColor: string | null;
  textColor: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const SAMPLE_PLATES: Record<string, { plate: string; region: string }> = {
  PRIVATE: { plate: "GR-2026-24", region: "GREATER ACCRA" },
  COMMERCIAL: { plate: "GT-891-26", region: "TEMA METRO" },
  MOTORCYCLE: { plate: "M-26-AS 402", region: "ASHANTI" },
  GOVERNMENT: { plate: "GV 2026-01", region: "NATIONAL HQ" },
  ELECTRIC: { plate: "EV 812-26", region: "GREATER ACCRA" },
  TRAILER: { plate: "T 904-26", region: "WESTERN HARBOUR" },
  TEMPORARY: { plate: "TMP 4091-26", region: "GREATER ACCRA" },
  AGRICULTURAL: { plate: "AG 304-26", region: "BONO EAST" },
  DIPLOMATIC: { plate: "CD 104-26", region: "EMBASSY CORPS" },
};

export default function PlateCategoriesPage() {
  const [categories, setCategories] = useState<PlateCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlateCategoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    badge: "",
    description: "",
    isActive: true,
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/plates/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load plate categories:", err);
      showToast("Failed to connect to plate categories API", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? c.isActive
          : !c.isActive;

      return matchSearch && matchStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.filter((c) => !c.isActive).length;

  async function handleToggleStatus(item: PlateCategoryItem) {
    const updatedStatus = !item.isActive;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isActive: updatedStatus } : c))
    );

    try {
      const res = await fetch("/api/plates/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: updatedStatus }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }
      showToast(
        `${item.code} plate classification marked ${updatedStatus ? "ACTIVE" : "INACTIVE"}`
      );
    } catch (err) {
      // Rollback
      setCategories((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isActive: !updatedStatus } : c))
      );
      showToast("Failed to update status on server", "error");
    }
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      code: "",
      name: "",
      badge: "",
      description: "",
      isActive: true,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function handleOpenEdit(item: PlateCategoryItem) {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      badge: item.badge,
      description: item.description || "",
      isActive: item.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
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
        const res = await fetch("/api/plates/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            name: formData.name.trim(),
            badge: formData.badge.trim() || undefined,
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update category");
        }

        showToast(`Updated "${formData.name.toUpperCase()}" successfully`);
      } else {
        // Create new
        const res = await fetch("/api/plates/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            badge: formData.badge.trim() || `🏷️ ${formData.code.toUpperCase()}`,
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create category");
        }

        showToast(`Created category "${formData.code.toUpperCase()}"`);
      }

      setModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      setFormError(err.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory(item: PlateCategoryItem) {
    if (["PRIVATE", "COMMERCIAL", "MOTORCYCLE", "GOVERNMENT"].includes(item.code)) {
      alert("Standard baseline categories cannot be deleted. You can set them to INACTIVE instead.");
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${item.name}"?`)) return;

    try {
      const res = await fetch(`/api/plates/categories?id=${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      showToast(`Deleted category "${item.name}"`);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || "Could not delete category");
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
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
              Station Administration
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Plate Classifications &amp; Visualizer Registry
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage official vehicle plate classifications. Active plates are directly selectable at the Booking Desk and rendered on live digital visualizers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <span>+</span>
            <span>Add Plate Category</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Categories</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{categories.length}</p>
          <span className="text-[11px] text-slate-400">Baseline + Custom configurations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 uppercase">Active for Booking</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          <span className="text-[11px] text-emerald-600/80">Visible on officer registration desk</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Inactive / Suspended</span>
          <p className="text-2xl font-black text-slate-500 mt-1">{inactiveCount}</p>
          <span className="text-[11px] text-slate-400">Hidden from new booking issuance</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or classification name..."
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
              All ({categories.length})
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

      {/* Grid of Plate Categories */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-sm font-semibold text-slate-400">
          Loading plate categories from database...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">No plate classifications match the criteria</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCategories.map((cat) => {
            const sample = SAMPLE_PLATES[cat.code] || {
              plate: `${cat.code}-2026`,
              region: "GREATER ACCRA",
            };

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden flex flex-col justify-between ${
                  cat.isActive
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-slate-200/60 opacity-75 bg-slate-50/50"
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 tracking-tight">
                        {cat.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {cat.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block mt-0.5">
                      CODE: {cat.code}
                    </span>
                  </div>

                  {/* Active / Inactive Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      cat.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        cat.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {cat.isActive ? "Active in Desk" : "Inactive / Hidden"}
                  </span>
                </div>

                {/* Digital Plate Visualizer Container */}
                <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col items-center justify-center min-h-[160px]">
                  <div className="w-full max-w-[280px]">
                    <DigitalPlate
                      plateNumber={sample.plate}
                      category={cat.code as PlateCategory}
                      region={sample.region}
                      slogan={sample.region}
                      vin="1ZVBP9FF0C5272602"
                      make="GHANA MOTORS"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-3 uppercase tracking-wider">
                    Visualizer Rendering Preview
                  </span>
                </div>

                {/* Description & Metadata */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cat.description || "Official classification for registered vehicular units in this tier."}
                  </p>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    {/* Status Toggle Switch */}
                    <div className="flex items-center gap-2.5">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cat.isActive}
                          onChange={() => handleToggleStatus(cat)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className="text-[11px] font-bold text-slate-700">
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        Edit
                      </button>
                      {!["PRIVATE", "COMMERCIAL", "MOTORCYCLE", "GOVERNMENT"].includes(cat.code) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
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
                  {editingItem ? `Edit Category: ${editingItem.code}` : "New Plate Category"}
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

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Category Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingItem)}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="E.G. DIPLOMATIC"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Classification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.G. Diplomatic Corps (CD Plate)"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  UI Badge Label
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="E.G. 🔴 Diplomatic"
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
                  placeholder="Enter classification purpose and issuance criteria..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="categoryActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                <label
                  htmlFor="categoryActiveCheck"
                  className="text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  Active for Officer Booking Desk Selection
                </label>
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
                  {isSaving ? "Saving..." : "Save Classification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
