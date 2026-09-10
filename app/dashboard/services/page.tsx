"use client";

import { useState, useEffect, useMemo } from "react";

interface Branch {
  id: string;
  name: string;
  code: string;
  slug: string;
}

interface ServiceType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  isGlobal: boolean;
  isActive: boolean;
  requiresPreviousOwner: boolean;
  prevOwnerRequireName?: boolean;
  prevOwnerRequirePhone?: boolean;
  prevOwnerRequireAddress?: boolean;
  prevOwnerRequireCustom?: boolean;
  prevOwnerCustomLabel?: string | null;
  branchId: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
    slug: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string;
}

export default function ServiceTypesPage() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "global" | "branch">("all");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "PRIVATE",
    isGlobal: true,
    branchId: "",
    isActive: true,
    requiresPreviousOwner: false,
    prevOwnerRequireName: true,
    prevOwnerRequirePhone: false,
    prevOwnerRequireAddress: true,
    prevOwnerRequireCustom: false,
    prevOwnerCustomLabel: "",
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ServiceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Alert Notification
  const [alertBanner, setAlertBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Session & Role Authorization
  const [sessionUser, setSessionUser] = useState<{
    id?: string;
    name?: string;
    username?: string;
    role?: string;
    branchId?: string;
    branch?: { id?: string; name: string; code?: string };
  } | null>(null);

  useEffect(() => {
    function loadSession() {
      try {
        const stored = localStorage.getItem("dvla_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setSessionUser(parsed);
        } else {
          setSessionUser({
            username: "admin",
            name: "System Administrator",
            role: "SUPERADMIN",
          });
        }
      } catch (e) {
        setSessionUser({
          username: "admin",
          name: "System Administrator",
          role: "SUPERADMIN",
        });
      }
    }
    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  const isSuperAdmin = (sessionUser?.role?.toUpperCase() || "SUPERADMIN") === "SUPERADMIN";

  const userBranchId = useMemo(() => {
    if (sessionUser?.branchId) return sessionUser.branchId;
    if (sessionUser?.branch?.id) return sessionUser.branch.id;
    if (sessionUser?.branch?.name && branches.length > 0) {
      const match = branches.find(
        (b) =>
          b.name.toLowerCase() === sessionUser.branch?.name.toLowerCase() ||
          b.code.toLowerCase() === sessionUser.branch?.code?.toLowerCase()
      );
      if (match) return match.id;
    }
    return branches[0]?.id || "";
  }, [sessionUser, branches]);

  const userBranchName = useMemo(() => {
    if (userBranchId && branches.length > 0) {
      const match = branches.find((b) => b.id === userBranchId);
      if (match) return `${match.name} (${match.code})`;
    }
    return sessionUser?.branch?.name || "Assigned Station";
  }, [userBranchId, branches, sessionUser]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBranches();
  }, []);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "PRIVATE",
      isGlobal: isSuperAdmin ? true : false,
      branchId: isSuperAdmin ? (branches[0]?.id || "") : userBranchId,
      isActive: true,
      requiresPreviousOwner: false,
      prevOwnerRequireName: true,
      prevOwnerRequirePhone: false,
      prevOwnerRequireAddress: true,
      prevOwnerRequireCustom: false,
      prevOwnerCustomLabel: "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (svc: ServiceType) => {
    if (!isSuperAdmin && svc.isGlobal) {
      alert("Permission Denied: Only Super Administrators can modify nationwide Global service types.");
      return;
    }
    if (!isSuperAdmin && svc.branchId && userBranchId && svc.branchId !== userBranchId) {
      alert("Permission Denied: You do not have permission to modify service types belonging to another station.");
      return;
    }

    setEditingService(svc);
    setFormData({
      code: svc.code,
      name: svc.name,
      description: svc.description || "",
      category: svc.category || "PRIVATE",
      isGlobal: isSuperAdmin ? svc.isGlobal : false,
      branchId: isSuperAdmin ? (svc.branchId || (branches[0]?.id || "")) : (svc.branchId || userBranchId),
      isActive: svc.isActive,
      requiresPreviousOwner: Boolean(svc.requiresPreviousOwner),
      prevOwnerRequireName: svc.prevOwnerRequireName !== undefined ? Boolean(svc.prevOwnerRequireName) : true,
      prevOwnerRequirePhone: Boolean(svc.prevOwnerRequirePhone),
      prevOwnerRequireAddress: svc.prevOwnerRequireAddress !== undefined ? Boolean(svc.prevOwnerRequireAddress) : true,
      prevOwnerRequireCustom: Boolean(svc.prevOwnerRequireCustom),
      prevOwnerCustomLabel: svc.prevOwnerCustomLabel || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("Service Code and Name are required.");
      return;
    }

    const finalIsGlobal = isSuperAdmin ? Boolean(formData.isGlobal) : false;
    const finalBranchId = finalIsGlobal ? null : (isSuperAdmin ? formData.branchId : userBranchId);

    if (!finalIsGlobal && !finalBranchId) {
      setFormError("Please select a target branch for this station-specific service.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        isGlobal: finalIsGlobal,
        branchId: finalBranchId,
        isActive: formData.isActive,
        requiresPreviousOwner: Boolean(formData.requiresPreviousOwner),
        prevOwnerRequireName: Boolean(formData.prevOwnerRequireName),
        prevOwnerRequirePhone: Boolean(formData.prevOwnerRequirePhone),
        prevOwnerRequireAddress: Boolean(formData.prevOwnerRequireAddress),
        prevOwnerRequireCustom: Boolean(formData.prevOwnerRequireCustom),
        prevOwnerCustomLabel: formData.prevOwnerCustomLabel?.trim() || null,
        userId: sessionUser?.id || undefined,
        userRole: sessionUser?.role || undefined,
      };

      let res;
      if (editingService) {
        res = await fetch(`/api/services/${editingService.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save service type");
      }

      setAlertBanner({
        type: "success",
        message: editingService
          ? `Service "${result.name}" was successfully updated.`
          : `New service "${result.name}" (${result.code}) registered into catalog.`,
      });
      setModalOpen(false);
      fetchServices();
      setTimeout(() => setAlertBanner(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (svc: ServiceType) => {
    if (!isSuperAdmin && svc.isGlobal) {
      alert("Permission Denied: Only Super Administrators can toggle availability of nationwide Global services.");
      return;
    }
    if (!isSuperAdmin && svc.branchId && userBranchId && svc.branchId !== userBranchId) {
      alert("Permission Denied: You cannot modify service types of another station.");
      return;
    }

    try {
      const res = await fetch(`/api/services/${svc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !svc.isActive,
          userId: sessionUser?.id || undefined,
          userRole: sessionUser?.role || undefined,
        }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === svc.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!isSuperAdmin && deleteTarget.isGlobal) {
      alert("Permission Denied: Only Super Administrators can delete nationwide Global service types.");
      setDeleteTarget(null);
      return;
    }
    if (!isSuperAdmin && deleteTarget.branchId && userBranchId && deleteTarget.branchId !== userBranchId) {
      alert("Permission Denied: You cannot delete service types belonging to another station.");
      setDeleteTarget(null);
      return;
    }

    try {
      setIsDeleting(true);
      const queryParams = new URLSearchParams();
      if (sessionUser?.id) queryParams.set("userId", sessionUser.id);
      if (sessionUser?.role) queryParams.set("userRole", sessionUser.role);
      const url = queryParams.toString()
        ? `/api/services/${deleteTarget.id}?${queryParams.toString()}`
        : `/api/services/${deleteTarget.id}`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlertBanner({
          type: "success",
          message: `Service "${deleteTarget.name}" deleted from registry.`,
        });
        setDeleteTarget(null);
        fetchServices();
        setTimeout(() => setAlertBanner(null), 4000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete service type.");
      }
    } catch (err) {
      console.error("Failed to delete service:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      // Scope Filter
      if (scopeFilter === "global" && !svc.isGlobal) return false;
      if (scopeFilter === "branch" && svc.isGlobal) return false;

      // Branch Filter
      if (selectedBranchFilter !== "ALL") {
        if (selectedBranchFilter === "GLOBAL_ONLY" && !svc.isGlobal) return false;
        if (selectedBranchFilter !== "GLOBAL_ONLY" && svc.branchId !== selectedBranchFilter) return false;
      }

      // Status Filter
      if (statusFilter === "ACTIVE" && !svc.isActive) return false;
      if (statusFilter === "INACTIVE" && svc.isActive) return false;

      // Search Filter
      if (search) {
        const q = search.toLowerCase();
        const codeMatch = svc.code.toLowerCase().includes(q);
        const nameMatch = svc.name.toLowerCase().includes(q);
        const descMatch = svc.description?.toLowerCase().includes(q);
        const branchMatch = svc.branch?.name.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !descMatch && !branchMatch) return false;
      }

      return true;
    });
  }, [services, scopeFilter, selectedBranchFilter, statusFilter, search]);

  // Counts
  const totalCount = services.length;
  const globalCount = services.filter((s) => s.isGlobal).length;
  const branchCount = services.filter((s) => !s.isGlobal).length;
  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
              isSuperAdmin ? "bg-[#103014] text-[#81B71A]" : "bg-purple-900 text-purple-200"
            }`}>
              {isSuperAdmin ? "SuperAdmin Control" : "Station Officer Access"}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {isSuperAdmin
                ? "Full Nationwide (Global) & Station Registry"
                : `Station Scope: ${userBranchName}`}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Filing Service Types Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? "Configure global nationwide services and station-specific filing categories used on the New Booking desk."
              : `Configure station-specific filing service types for ${userBranchName}. Nationwide global services are managed by SuperAdmin.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchServices}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#103014] to-[#1a4a1f] hover:from-[#153e1a] hover:to-[#225c27] rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>{isSuperAdmin ? "New Service Type" : `New Station Service (${userBranchName.split(" ")[0]})`}</span>
          </button>
        </div>
      </div>

      {/* ── Alert Notification ── */}
      {alertBanner && (
        <div
          className={`px-4 py-3 rounded-lg border text-xs font-medium flex items-center justify-between shadow-2xs ${
            alertBanner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{alertBanner.type === "success" ? "✓" : "⚠️"}</span>
            <span>{alertBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertBanner(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 2. KPI Metrics Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Service Types
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Configured in registry</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Global (Nationwide)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{globalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Available at all DVLA stations</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Branch-Specific</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{branchCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Provisioned for designated centers</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Active & Available</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Live on New Booking workstation</div>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <svg
              className="absolute left-3 top-2.5 text-slate-400"
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#81B71A] transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Scope Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/70 border border-slate-200 rounded-lg text-xs w-full md:w-auto">
            {(
              [
                { id: "all", label: `All Scopes (${totalCount})` },
                { id: "global", label: `🌍 Global (${globalCount})` },
                { id: "branch", label: `🏢 Branch-Specific (${branchCount})` },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setScopeFilter(pill.id)}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  scopeFilter === pill.id
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Filter by Station:</span>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#81B71A]"
            >
              <option value="ALL">All Stations (Nationwide & Local)</option>
              <option value="GLOBAL_ONLY">Global Services Only</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#81B71A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {(search || scopeFilter !== "all" || selectedBranchFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setScopeFilter("all");
                setSelectedBranchFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="ml-auto text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Service Types High-Density Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            Loading service types catalog...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold text-lg">
              🔍
            </div>
            <h4 className="text-sm font-bold text-slate-800">No service types found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching registration services match your search or filter criteria.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-[#103014] rounded-lg hover:bg-[#153e1a] cursor-pointer"
            >
              Add First Service Type
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Service Name & Description</th>
                  <th className="py-3 px-4">Operating Scope</th>
                  <th className="py-3 px-4">Classification Hint</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/70 transition">
                    {/* Code */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {svc.code}
                      </span>
                    </td>

                    {/* Name & Description */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{svc.name}</span>
                        {svc.requiresPreviousOwner && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                              Title Transfer
                            </span>
                            <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              Parameters: {[
                                svc.prevOwnerRequireName !== false && "Name",
                                svc.prevOwnerRequirePhone && "Phone",
                                svc.prevOwnerRequireAddress !== false && "Address",
                                svc.prevOwnerRequireCustom && (svc.prevOwnerCustomLabel || "Custom Ref"),
                              ].filter(Boolean).join(" • ") || "Default"}
                            </span>
                          </div>
                        )}
                      </div>
                      {svc.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {svc.description}
                        </div>
                      )}
                    </td>

                    {/* Operating Scope */}
                    <td className="py-3.5 px-4">
                      {svc.isGlobal ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>🌍 Global (All Stations)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          <span>🏢 {svc.branch?.name || "Designated Branch"}</span>
                        </span>
                      )}
                    </td>

                    {/* Category Hint */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px] uppercase tracking-wider">
                        {svc.category || "ALL"}
                      </span>
                    </td>



                    {/* Active Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(svc)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          svc.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                        title="Click to toggle availability"
                      >
                        {svc.isActive ? "● Active" : "○ Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin || (!svc.isGlobal && (!svc.branchId || svc.branchId === userBranchId)) ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(svc)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(svc)}
                            className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200" title="Only Super Administrators can modify nationwide Global service types">
                          <span>🔒</span>
                          <span>{svc.isGlobal ? "Global Locked" : "Restricted Station"}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Create / Edit Service Type Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingService ? "Edit Service Type" : "Create New Filing Service"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingService
                    ? `Updating parameters for ${editingService.code}`
                    : "Add a new registration service available for booking"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Service Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })
                    }
                    placeholder="e.g. REG_DIPLOMATIC"
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#81B71A]"
                  />
                  <span className="text-[10px] text-slate-400">Unique alphanumeric identifier</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Plate Classification Hint
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#81B71A]"
                  >
                    <option value="PRIVATE">Private (White Plate)</option>
                    <option value="COMMERCIAL">Commercial (Yellow Plate)</option>
                    <option value="ELECTRIC">Electric Vehicle (EV Green)</option>
                    <option value="GOVERNMENT">Government (GV Split)</option>
                    <option value="TRAILER">Trailer (Yellow T)</option>
                    <option value="MOTORCYCLE">Motorcycle (Blue)</option>
                    <option value="ALL">Any / Unrestricted</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Target plate category</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Service Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Diplomatic & Consular Fast-Track"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#81B71A]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Official diplomatic mission vehicle registration with expedited clearance"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#81B71A] resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Active Service Status</div>
                  <div className="text-[10px] text-slate-400">Enable or disable availability for counter clerks during new booking</div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#81B71A] focus:ring-[#81B71A] border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Active on workstation
                  </span>
                </label>
              </div>

              {/* Requires Previous Title Owner Details (Title Transfer) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                      <span>Requires Previous Title Owner Details</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                        Title Transfer
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      When selected at the booking desk, automatically opens and configures previous title owner fields without manual toggling.
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.requiresPreviousOwner}
                      onChange={(e) => setFormData({ ...formData, requiresPreviousOwner: e.target.checked })}
                      className="w-4 h-4 rounded text-[#81B71A] focus:ring-[#81B71A] border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Enable Transfer Parameters
                    </span>
                  </label>
                </div>

                {formData.requiresPreviousOwner && (
                  <div className="pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Configurable Required Parameters:</span>
                      <span className="text-[10px] font-normal text-slate-400">Officer desk field parameters</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Name */}
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.prevOwnerRequireName}
                          onChange={(e) => setFormData({ ...formData, prevOwnerRequireName: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-[#81B71A] focus:ring-[#81B71A] border-slate-300 cursor-pointer"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">Owner Name</div>
                          <div className="text-[9px] text-slate-400">Full legal name</div>
                        </div>
                      </label>

                      {/* Phone */}
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.prevOwnerRequirePhone}
                          onChange={(e) => setFormData({ ...formData, prevOwnerRequirePhone: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-[#81B71A] focus:ring-[#81B71A] border-slate-300 cursor-pointer"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">Phone Number</div>
                          <div className="text-[9px] text-slate-400">Contact line</div>
                        </div>
                      </label>

                      {/* Address */}
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.prevOwnerRequireAddress}
                          onChange={(e) => setFormData({ ...formData, prevOwnerRequireAddress: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-[#81B71A] focus:ring-[#81B71A] border-slate-300 cursor-pointer"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">Address</div>
                          <div className="text-[9px] text-slate-400">Residential / Office</div>
                        </div>
                      </label>
                    </div>

                    {/* Custom Reference / Parameter */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.prevOwnerRequireCustom}
                          onChange={(e) => setFormData({ ...formData, prevOwnerRequireCustom: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-[#81B71A] focus:ring-[#81B71A] border-slate-300 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          Require Custom Reference / Parameter Field
                        </span>
                      </label>

                      {formData.prevOwnerRequireCustom && (
                        <div className="pt-1.5 animate-in fade-in duration-100">
                          <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                            Custom Field Label (shown to officer):
                          </label>
                          <input
                            type="text"
                            value={formData.prevOwnerCustomLabel}
                            onChange={(e) => setFormData({ ...formData, prevOwnerCustomLabel: e.target.value })}
                            placeholder="e.g. Affidavit No. / Deed of Gift Ref / Court Clearance #"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#81B71A]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Scope Selection */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-800 block">
                    Operating Scope &amp; Station Jurisdiction
                  </label>
                  {!isSuperAdmin && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                      Branch Scope
                    </span>
                  )}
                </div>

                {isSuperAdmin ? (
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={formData.isGlobal}
                        onChange={() => setFormData({ ...formData, isGlobal: true })}
                        className="mt-0.5 text-[#81B71A] focus:ring-[#81B71A]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          🌍 Global (All DVLA Branches Nationwide)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          This service type will be available at every regional, district, and satellite station.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/60">
                      <input
                        type="radio"
                        name="scope"
                        checked={!formData.isGlobal}
                        onChange={() => setFormData({ ...formData, isGlobal: false })}
                        className="mt-0.5 text-[#81B71A] focus:ring-[#81B71A]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          🏢 Branch-Specific (Restricted Station)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Provisioned exclusively for officers operating at a designated center.
                        </div>
                      </div>
                    </label>

                    {!formData.isGlobal && (
                      <div className="pt-2 animate-in fade-in duration-100">
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Assigned Branch / Station <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.branchId}
                          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                          required={!formData.isGlobal}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#81B71A]"
                        >
                          <option value="">Select a regional station...</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-lg border border-purple-200 flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        🏢
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Station-Specific Service (Locked to {userBranchName})
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          New service will be provisioned exclusively for your assigned center <strong className="text-slate-800">{userBranchName}</strong>.
                        </p>
                        <p className="text-[10px] text-amber-700 font-medium mt-1">
                          🔒 Only Super Administrators can designate nationwide Global service types.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 sticky bottom-0 bg-white/95 backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#103014] hover:bg-[#153e1a] rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingService ? "Update Service Type" : "Create Service Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Delete Service Type</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deleteTarget.name}</span> ({deleteTarget.code})?
                This will remove the service from active booking options across designated stations.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
