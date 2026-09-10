"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  createdAt: string;
  _count?: { users: number };
}

interface OrgForm {
  name: string;
  slug: string;
  code: string;
  description: string;
}

const EMPTY_FORM: OrgForm = { name: "", slug: "", code: "", description: "" };

function toForm(org: Organization): OrgForm {
  return {
    name: org.name,
    slug: org.slug,
    code: org.code,
    description: org.description || "",
  };
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("SUPERADMIN");
  const [form, setForm] = useState<OrgForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const loadSession = () => {
      try {
        const stored = localStorage.getItem("dvla_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserRole(parsed.role?.toUpperCase() || "SUPERADMIN");
        }
      } catch (e) {}
    };

    loadSession();
    window.addEventListener("dvla_session_change", loadSession);
    return () => window.removeEventListener("dvla_session_change", loadSession);
  }, []);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "SUPERADMIN") {
      fetchOrganizations();
    }
  }, [userRole]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowModal(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const isEditing = Boolean(editingId);
      const res = await fetch(isEditing ? `/api/organizations/${editingId}` : "/api/organizations", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save organization");
      }

      await fetchOrganizations();
      triggerToast(isEditing ? `Updated organization: ${form.name}` : `Created organization: ${form.name}`);
      resetForm();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingId(org.id);
    setForm(toForm(org));
    setError("");
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete organization "${name}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/organizations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete organization");
        return;
      }
      await fetchOrganizations();
      triggerToast(`Deleted organization: ${name}`);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = organizations.reduce((acc, o) => acc + (o._count?.users || 0), 0);

  if (userRole !== "SUPERADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white rounded-xl border border-rose-200 p-8 max-w-md text-center shadow-xs space-y-3">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full mx-auto flex items-center justify-center text-xl font-bold">
            🔒
          </div>
          <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Organization and multi-tenant fleet management is restricted to <strong>SuperAdmin</strong> authority accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-[#81B71A] animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Top Command Header ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Multi-Tenant Fleet Entities
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database Active
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Fleet Organizations &amp; Institutional Portals
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Manage corporate fleet operators, state security agency branches, and multi-tenant administrative permissions across Ghana.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setError("");
                setShowModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#81B71A] hover:bg-[#72a316] active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>+</span>
              <span>New Organization</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Executive KPI Metric Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          {
            label: "Registered Organizations",
            val: organizations.length,
            sub: "Corporate & institutional fleet operators",
            dot: "bg-blue-500",
            badge: "All Fleets",
            badgeBg: "bg-blue-50 text-blue-700 border-blue-200/60",
          },
          {
            label: "Assigned Staff Users",
            val: totalUsers,
            sub: "Active users across organizations",
            dot: "bg-emerald-500",
            badge: "Active Seats",
            badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          },
          {
            label: "Administrative Mode",
            val: "SuperAdmin",
            sub: "Full multi-tenant tenant isolation",
            dot: "bg-amber-500",
            badge: "Root Control",
            badgeBg: "bg-amber-50 text-amber-800 border-amber-200/60",
          },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                <span className="text-[11px] font-semibold text-slate-500">{m.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeBg}`}>
                {m.badge}
              </span>
            </div>
            <p className="font-mono text-2xl font-bold text-slate-900 tracking-tight">{m.val}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search organizations by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredOrgs.length} of {organizations.length} organizations
          </span>
        </div>
      </div>

      {/* ── Main Organizations Table Card ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                {["Organization Details", "System Code", "URL Slug", "Total Users", "Joined Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-slate-400 font-medium">
                    Loading organizations database...
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-slate-400 font-medium">
                    No organizations found matching your search.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{org.name}</p>
                          {org.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-sm">{org.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                        {org.code}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-500 text-xs">
                      /{org.slug}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-800">
                      {org._count?.users ?? 0} users
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(org.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(org)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          disabled={deletingId === org.id}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] rounded transition disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === org.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Dialog for Create/Edit Organization ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {editingId ? "Edit Organization" : "Create New Organization"}
                </h3>
                <p className="text-[11px] text-slate-500">Fleet operator entity or agency branch</p>
              </div>
              <button
                onClick={resetForm}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
                    const code = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
                    setForm((prev) => ({
                      ...prev,
                      name,
                      slug: editingId ? prev.slug : slug,
                      code: editingId ? prev.code : code,
                    }));
                  }}
                  placeholder="e.g. Ghana Police Service Fleet"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    System Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="GPS-FLT"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    placeholder="gps-fleet"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Description / Operational Scope
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of operations, fleet category, and region..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
