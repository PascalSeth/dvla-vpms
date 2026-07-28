"use client";

import { useState, useEffect, FormEvent } from "react";
import OrganizationUsersPanel from "@/components/OrganizationUsersPanel";

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
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [error, setError] = useState("");

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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${isEditing ? "update" : "create"} organization.`);
        return;
      }

      if (isEditing) {
        setOrganizations((prev) =>
          prev.map((org) => (org.id === editingId ? data : org)).sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        setOrganizations((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
      resetForm();
    } catch (err) {
      setError(`Failed to ${editingId ? "update" : "create"} organization.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingId(org.id);
    setForm(toForm(org));
    setError("");
  };

  const handleDelete = async (org: Organization) => {
    const userCount = org._count?.users ?? 0;
    const message =
      userCount > 0
        ? `"${org.name}" has ${userCount} assigned user(s) and cannot be deleted until they are reassigned.`
        : `Delete "${org.name}"? This action cannot be undone.`;

    if (userCount > 0) {
      setError(message);
      return;
    }

    if (!window.confirm(message)) return;

    setDeletingId(org.id);
    setError("");
    try {
      const res = await fetch(`/api/organizations/${org.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete organization.");
        return;
      }
      setOrganizations((prev) => prev.filter((item) => item.id !== org.id));
      if (editingId === org.id) resetForm();
      if (selectedOrg?.id === org.id) setSelectedOrg(null);
    } catch (err) {
      setError("Failed to delete organization.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUserCountChange = (organizationId: string, count: number) => {
    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === organizationId ? { ...org, _count: { users: count } } : org
      )
    );
    setSelectedOrg((prev) =>
      prev?.id === organizationId ? { ...prev, _count: { users: count } } : prev
    );
  };

  if (userRole !== "SUPERADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-[#e8edf5] p-10 max-w-lg text-center" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: "rgba(239,68,68,0.1)" }}>
            🔒
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#374167" }}>Access Restricted</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6b7a99" }}>
            Organization management is restricted to <strong>SuperAdmin</strong> accounts only.
            Supervisors and Data Entry users operate within their assigned organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0d1a03 0%, #1a2e05 50%, #2d5009 100%)" }}>
        <h1 className="text-4xl font-bold text-white mb-2">Organizations</h1>
        <p className="text-white/60 text-lg">Manage multi-tenant fleet operators and DVLA branches</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8edf5] overflow-hidden" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f0f3f8", background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#374167" }}>Registered Organizations</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md" style={{ background: "rgba(129,183,26,0.1)", color: "#2d5009" }}>
              {organizations.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f0f3f8" }}>
                  {["Name", "Code", "Slug", "Users", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "#9aa3be" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#9aa3be" }}>
                      Loading organizations...
                    </td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#9aa3be" }}>
                      No organizations found.
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr
                      key={org.id}
                      className="border-t transition-colors"
                      style={{
                        borderColor: "#f0f3f8",
                        background:
                          editingId === org.id
                            ? "rgba(129,183,26,0.04)"
                            : selectedOrg?.id === org.id
                              ? "rgba(59,130,246,0.04)"
                              : undefined,
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-xs" style={{ color: "#374167" }}>{org.name}</p>
                        {org.description && (
                          <p className="text-[11px] mt-0.5 truncate max-w-xs" style={{ color: "#9aa3be" }}>{org.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md" style={{ background: "rgba(129,183,26,0.07)", color: "#2d5009" }}>
                          {org.code}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono" style={{ color: "#6b7a99" }}>{org.slug}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold" style={{ color: "#374167" }}>
                        {org._count?.users ?? 0}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: "#b0bbd6" }}>
                        {new Date(org.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrg(org)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition-colors hover:bg-[#fafbfe]"
                            style={{
                              borderColor: selectedOrg?.id === org.id ? "#81B71A" : "#e8edf5",
                              color: selectedOrg?.id === org.id ? "#2d5009" : "#374167",
                              background: selectedOrg?.id === org.id ? "rgba(129,183,26,0.08)" : undefined,
                            }}
                          >
                            Users
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(org)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition-colors hover:bg-[#fafbfe]"
                            style={{ borderColor: "#e8edf5", color: "#374167" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(org)}
                            disabled={deletingId === org.id}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border transition-colors hover:bg-red-50 disabled:opacity-50"
                            style={{ borderColor: "rgba(239,68,68,0.25)", color: "#991b1b" }}
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

        <div className="bg-white rounded-xl border border-[#e8edf5] p-6 h-fit" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#374167" }}>
              {editingId ? "Edit Organization" : "Add Organization"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "#9aa3be" }}
              >
                Cancel
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#9aa3be" }}>Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. DVLA Kumasi Branch"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-[#81B71A]"
                style={{ borderColor: "#e8edf5", color: "#374167" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#9aa3be" }}>Code</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. DVLA-KSI"
                className="w-full px-3 py-2.5 rounded-lg border text-sm font-mono outline-none focus:border-[#81B71A]"
                style={{ borderColor: "#e8edf5", color: "#374167" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#9aa3be" }}>Slug</label>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                placeholder="e.g. dvla-kumasi"
                className="w-full px-3 py-2.5 rounded-lg border text-sm font-mono outline-none focus:border-[#81B71A]"
                style={{ borderColor: "#e8edf5", color: "#374167" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#9aa3be" }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Optional description..."
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-[#81B71A] resize-none"
                style={{ borderColor: "#e8edf5", color: "#374167" }}
              />
            </div>
            {error && (
              <p className="text-xs font-medium text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-opacity disabled:opacity-60"
              style={{ background: "#81B71A" }}
            >
              {isSubmitting
                ? editingId
                  ? "Saving..."
                  : "Creating..."
                : editingId
                  ? "Save Changes"
                  : "Create Organization"}
            </button>
          </form>
        </div>
      </div>

      {selectedOrg && (
        <OrganizationUsersPanel
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          onClose={() => setSelectedOrg(null)}
          onUserCountChange={handleUserCountChange}
        />
      )}
    </div>
  );
}
