"use client";

import { useState, useEffect, FormEvent } from "react";

interface OrgUser {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: "SUPERADMIN" | "SUPERVISOR" | "DATA_ENTRY";
  organizationId: string | null;
  createdAt: string;
}

interface UserForm {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  role: "SUPERADMIN" | "SUPERVISOR" | "DATA_ENTRY";
  username?: string;
  password?: string;
}

const EMPTY_USER_FORM: UserForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  role: "DATA_ENTRY",
  username: "",
  password: "",
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "SuperAdmin",
  SUPERVISOR: "Supervisor",
  DATA_ENTRY: "Data Entry",
};

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  SUPERADMIN: { bg: "rgba(239,68,68,0.1)", color: "#991b1b" },
  SUPERVISOR: { bg: "rgba(245,158,11,0.1)", color: "#92610a" },
  DATA_ENTRY: { bg: "rgba(59,130,246,0.1)", color: "#1e40af" },
};

interface OrganizationUsersPanelProps {
  organizationId: string;
  organizationName: string;
  onClose?: () => void;
  onUserCountChange: (organizationId: string, count: number) => void;
}

export default function OrganizationUsersPanel({
  organizationId,
  organizationName,
  onClose,
  onUserCountChange,
}: OrganizationUsersPanelProps) {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<UserForm>(EMPTY_USER_FORM);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users?organizationId=${organizationId}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setUsers(list);
        onUserCountChange(organizationId, list.length);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, onUserCountChange]);

  const resetUserForm = () => {
    setForm(EMPTY_USER_FORM);
    setEditingUserId(null);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("First Name, Last Name, and Official Email are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingUserId);
      const fullName = `${form.firstName.trim()} ${form.middleName.trim() ? form.middleName.trim() + " " : ""}${form.lastName.trim()}`.trim();
      const payload = isEditing
        ? {
            name: fullName,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            middleName: form.middleName.trim() || null,
            email: form.email.trim().toLowerCase(),
            role: form.role,
            organizationId,
            ...(form.password?.trim() ? { password: form.password.trim() } : {}),
          }
        : {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            middleName: form.middleName.trim() || undefined,
            email: form.email.trim().toLowerCase(),
            role: form.role,
            organizationId,
          };

      const res = await fetch(isEditing ? `/api/users/${editingUserId}` : "/api/users", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to ${isEditing ? "update" : "create"} user.`);
        return;
      }

      if (isEditing) {
        setUsers((prev) => prev.map((user) => (user.id === editingUserId ? data : user)));
      } else {
        setUsers((prev) => [...prev, data]);
        onUserCountChange(organizationId, users.length + 1);
      }
      resetUserForm();
    } catch {
      setError(`Failed to ${editingUserId ? "update" : "create"} user.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: OrgUser) => {
    setEditingUserId(user.id);
    const parts = (user.name || "").trim().split(/\s+/);
    setForm({
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      middleName: "",
      email: user.email || "",
      role: user.role,
      username: user.username,
      password: "",
    });
    setError("");
  };

  const handleDelete = async (user: OrgUser) => {
    if (!window.confirm(`Delete user "${user.name}" (@${user.username})?`)) return;

    setDeletingUserId(user.id);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete user.");
        return;
      }
      const nextUsers = users.filter((item) => item.id !== user.id);
      setUsers(nextUsers);
      onUserCountChange(organizationId, nextUsers.length);
      if (editingUserId === user.id) resetUserForm();
    } catch {
      setError("Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e8edf5] overflow-hidden" style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}>
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: "#f0f3f8", background: "linear-gradient(90deg, #f8faff 0%, #f4f6fb 100%)" }}>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#374167" }}>
            Organization Users
          </h2>
          <p className="text-xs mt-1" style={{ color: "#9aa3be" }}>
            {organizationName} · {users.length} user{users.length === 1 ? "" : "s"}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide border"
            style={{ borderColor: "#e8edf5", color: "#6b7a99" }}
          >
            Close
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 p-6">
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#f0f3f8" }}>
                {["Name", "Username", "Email", "Role", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "#9aa3be" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#9aa3be" }}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#9aa3be" }}>
                    No users assigned to this organization yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleStyle = ROLE_STYLES[user.role] || ROLE_STYLES.DATA_ENTRY;
                  return (
                    <tr
                      key={user.id}
                      className="border-t"
                      style={{
                        borderColor: "#f0f3f8",
                        background: editingUserId === user.id ? "rgba(129,183,26,0.04)" : undefined,
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-xs" style={{ color: "#374167" }}>{user.name}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono" style={{ color: "#6b7a99" }}>
                        @{user.username}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs" style={{ color: "#6b7a99" }}>
                        {user.email || "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: roleStyle.bg, color: roleStyle.color }}
                        >
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border"
                            style={{ borderColor: "#e8edf5", color: "#374167" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            disabled={deletingUserId === user.id}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border disabled:opacity-50"
                            style={{ borderColor: "rgba(239,68,68,0.25)", color: "#991b1b" }}
                          >
                            {deletingUserId === user.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 lg:mt-0 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-6" style={{ borderColor: "#f0f3f8" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#374167" }}>
              {editingUserId ? "Edit User" : "Add User"}
            </h3>
            {editingUserId && (
              <button type="button" onClick={resetUserForm} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9aa3be" }}>
                Cancel
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!editingUserId && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-relaxed">
                ⚡ Username will be auto-generated as <span className="font-mono font-bold">firstname.lastname</span>. An activation email with temporary credentials will be dispatched.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9aa3be" }}>First Name *</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Kwame"
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-[#81B71A]"
                  style={{ borderColor: "#e8edf5", color: "#374167" }}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9aa3be" }}>Last Name *</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Mensah"
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-[#81B71A]"
                  style={{ borderColor: "#e8edf5", color: "#374167" }}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9aa3be" }}>Middle Name (Optional)</label>
              <input
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                placeholder="Kofi"
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-[#81B71A]"
                style={{ borderColor: "#e8edf5", color: "#374167" }}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9aa3be" }}>Official Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="officer@dvla.gov.gh"
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-[#81B71A]"
                style={{ borderColor: "#e8edf5", color: "#374167" }}
              />
            </div>

            {editingUserId && (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9aa3be" }}>Username</label>
                  <input
                    disabled
                    value={`@${form.username}`}
                    className="w-full px-3 py-2 rounded-lg border text-xs font-mono bg-slate-100"
                    style={{ borderColor: "#e8edf5", color: "#64748b" }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9aa3be" }}>
                    Password <span className="normal-case font-normal">(leave blank to keep)</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-[#81B71A]"
                    style={{ borderColor: "#e8edf5", color: "#374167" }}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "#9aa3be" }}>Role Tier *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserForm["role"] })}
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-[#81B71A]"
                style={{ borderColor: "#e8edf5", color: "#374167" }}
              >
                <option value="DATA_ENTRY">Data Entry</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="SUPERADMIN">SuperAdmin</option>
              </select>
            </div>
            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-opacity disabled:opacity-60"
              style={{ background: "#81B71A" }}
            >
              {isSubmitting
                ? editingUserId
                  ? "Saving..."
                  : "Creating..."
                : editingUserId
                  ? "Save User"
                  : "Add User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
