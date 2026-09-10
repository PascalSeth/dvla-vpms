"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";

interface Branch {
  id: string;
  name: string;
  code: string;
  type?: string;
}

interface User {
  id: string;
  username: string;
  email: string | null;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  role: "SUPERADMIN" | "SUPERVISOR" | "DATA_ENTRY";
  branchId?: string | null;
  organizationId?: string | null;
  mustResetPassword?: boolean;
  createdAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  organization?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface UserForm {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  role: "SUPERADMIN" | "SUPERVISOR" | "DATA_ENTRY";
  branchId: string;
  username?: string;
  password?: string;
}

const EMPTY_FORM: UserForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  role: "DATA_ENTRY",
  branchId: "",
  username: "",
  password: "",
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "SuperAdmin",
  SUPERVISOR: "Supervisor",
  DATA_ENTRY: "Data Entry",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("SUPERADMIN");

  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [alertBanner, setAlertBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resending invite state
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Filters
  const [filterOrg, setFilterOrg] = useState<string>("ALL");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resUsers, resBranches] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/branches"),
      ]);

      if (resUsers.ok && resBranches.ok) {
        const uData = await resUsers.json();
        const bData = await resBranches.json();
        setUsers(uData);
        setBranches(bData);
      }
    } catch (err) {
      console.error("Failed to load users or branches", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    try {
      const stored = localStorage.getItem("dvla_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserRole(parsed.role?.toUpperCase() || "SUPERADMIN");
      }
    } catch (e) {
      setUserRole("SUPERADMIN");
    }
  }, []);

  const openCreateModal = () => {
    setEditingUserId(null);
    setForm({
      ...EMPTY_FORM,
      branchId: branches[0]?.id || "",
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUserId(user.id);
    const parts = (user.name || "").trim().split(/\s+/);
    setForm({
      firstName: user.firstName || parts[0] || "",
      lastName: user.lastName || parts.slice(1).join(" ") || "",
      middleName: user.middleName || "",
      email: user.email || "",
      role: user.role,
      branchId: user.branchId || user.organizationId || (branches[0]?.id || ""),
      username: user.username,
      password: "",
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.branchId) {
      setErrorMsg("First Name, Last Name, Official Email, and Assigned Station are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : "/api/users";
      const method = editingUserId ? "PUT" : "POST";

      const fullName = `${form.firstName.trim()} ${form.middleName.trim() ? form.middleName.trim() + " " : ""}${form.lastName.trim()}`.trim();

      const payload: any = editingUserId
        ? {
            name: fullName,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            middleName: form.middleName.trim() || null,
            email: form.email.trim().toLowerCase(),
            role: form.role,
            branchId: form.branchId,
            ...(form.password?.trim() ? { password: form.password.trim() } : {}),
          }
        : {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            middleName: form.middleName.trim() || undefined,
            email: form.email.trim().toLowerCase(),
            role: form.role,
            branchId: form.branchId,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save officer account.");
      }

      setIsModalOpen(false);
      fetchData();
      setAlertBanner({
        type: "success",
        message: editingUserId
          ? `Officer account "${data.name}" updated successfully.`
          : `Officer account created for ${data.name} (@${data.username}). Onboarding email dispatched to ${data.email}.`,
      });
      setTimeout(() => setAlertBanner(null), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setAlertBanner({
          type: "error",
          message: data.error || "Failed to delete user.",
        });
        return;
      }
      fetchData();
      setAlertBanner({
        type: "success",
        message: `Officer account "${deleteTarget.name}" deleted successfully.`,
      });
      setDeleteTarget(null);
      setTimeout(() => setAlertBanner(null), 4000);
    } catch (err) {
      setAlertBanner({
        type: "error",
        message: "Failed to delete officer account.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendInvite = async (userId: string, name: string) => {
    try {
      setResendingId(userId);
      const res = await fetch(`/api/users/${userId}/resend-invite`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setAlertBanner({
          type: "success",
          message: data.message || `Activation invite re-dispatched to ${name}.`,
        });
        setTimeout(() => setAlertBanner(null), 5000);
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Failed to resend activation invite.",
        });
      }
    } catch (err) {
      setAlertBanner({
        type: "error",
        message: "Network error while resending activation email.",
      });
    } finally {
      setResendingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const branchId = u.branchId || u.organizationId;
      const matchesBranch = filterOrg === "ALL" || branchId === filterOrg;
      const matchesRole = filterRole === "ALL" || u.role === filterRole;

      let matchesStatus = true;
      if (filterStatus === "PENDING") {
        matchesStatus = Boolean(u.mustResetPassword);
      } else if (filterStatus === "ACTIVE") {
        matchesStatus = !u.mustResetPassword;
      }

      const q = searchQuery.toLowerCase().trim();
      const branchName = u.branch?.name || u.organization?.name || "";
      const branchCode = u.branch?.code || u.organization?.code || "";
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        branchName.toLowerCase().includes(q) ||
        branchCode.toLowerCase().includes(q);

      return matchesBranch && matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, filterOrg, filterRole, filterStatus, searchQuery]);

  if (userRole !== "SUPERADMIN") {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg mx-auto mb-3">
            🔒
          </div>
          <h2 className="text-base font-bold text-red-700">Access Restricted</h2>
          <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">
            Staff and officer management is strictly reserved for SuperAdministrator level authority.
          </p>
        </div>
      </div>
    );
  }

  const supervisorCount = users.filter((u) => u.role === "SUPERVISOR").length;
  const dataEntryCount = users.filter((u) => u.role === "DATA_ENTRY").length;
  const superAdminCount = users.filter((u) => u.role === "SUPERADMIN").length;
  const pendingCount = users.filter((u) => u.mustResetPassword).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── 1. Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#103014] text-[#81B71A]">
              SUPERADMIN CONTROL
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Identity &amp; Access Governance · Station Authority
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff &amp; Officer Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Provision officer credentials with automated username derivation, secure email onboarding, and regional station authority assignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Refresh officer list"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#103014] to-[#1a4a1f] hover:from-[#153e1a] hover:to-[#225c27] rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Register New Officer</span>
          </button>
        </div>
      </div>

      {/* ── Alert Notification ── */}
      {alertBanner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in duration-200 ${
            alertBanner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{alertBanner.type === "success" ? "✓" : "⚠️"}</span>
            <span>{alertBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertBanner(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 2. KPI Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Officers
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {pendingCount > 0 ? `${pendingCount} pending activation` : "All officers verified"}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>SuperAdmins</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{superAdminCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Full nationwide governance</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Supervisors</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{supervisorCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Station review &amp; verification</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Data Entry</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{dataEntryCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Booking &amp; processing desks</div>
        </div>
      </div>

      {/* ── 3. Filter and Search Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Field with Icon */}
        <div className="relative flex-1 w-full md:max-w-md">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by officer name, @username, email, station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters Group */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Stations</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPERADMIN">SuperAdmin</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="DATA_ENTRY">Data Entry</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Officers</option>
            <option value="PENDING">Pending Setup</option>
          </select>

          <div className="text-[11px] font-semibold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200/80 whitespace-nowrap">
            {filteredUsers.length} of {users.length}
          </div>
        </div>
      </div>

      {/* ── 4. Officers Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 text-center text-xs font-medium text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
            Loading officer records...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg font-bold">
              👥
            </div>
            <div className="text-xs font-bold text-slate-700">No officers found</div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              No staff records match your current search query or filter parameters.
            </p>
            {(searchQuery || filterOrg !== "ALL" || filterRole !== "ALL" || filterStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterOrg("ALL");
                  setFilterRole("ALL");
                  setFilterStatus("ALL");
                }}
                className="mt-2 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Officer Details</th>
                  <th className="py-3 px-4">Account ID</th>
                  <th className="py-3 px-4">Assigned Station</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const branchName = u.branch?.name || u.organization?.name || "DVLA HQ";
                  const branchCode = u.branch?.code || u.organization?.code || "DVLA-HQ";
                  const initials = (u.name || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Officer Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#103014] to-[#1a4a1f] text-emerald-200 font-bold flex items-center justify-center text-[11px] shadow-2xs shrink-0 border border-emerald-800/40">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {u.name}
                            </div>
                            {u.email ? (
                              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                {u.email}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic leading-tight mt-0.5">
                                No email configured
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Account ID / Username */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/80 inline-block">
                          @{u.username}
                        </span>
                      </td>

                      {/* Assigned Station */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 text-xs">{branchName}</span>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {branchCode}
                          </span>
                        </div>
                      </td>

                      {/* Role Tier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            u.role === "SUPERADMIN"
                              ? "bg-rose-50 text-rose-700 border-rose-200/80"
                              : u.role === "SUPERVISOR"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-blue-50 text-blue-700 border-blue-200/80"
                          }`}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>

                      {/* Dedicated Status Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.mustResetPassword ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Pending Setup</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Actions Group (No awkward wrapping!) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {u.email && (
                            <button
                              type="button"
                              onClick={() => handleResendInvite(u.id, u.name)}
                              disabled={resendingId === u.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Re-dispatch onboarding email with temporary password and setup link"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{resendingId === u.id ? "Sending..." : "Invite"}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. User Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    OFFICER PROVISIONING
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingUserId ? "Edit Officer Account" : "Register New Officer"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingUserId
                    ? "Update officer station authority and profile details."
                    : "Automated credentials generation with immediate email onboarding."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!editingUserId && (
                <div className="p-3 bg-gradient-to-r from-emerald-50/80 to-slate-50 border border-emerald-200/80 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <span>⚡ Automated Credentials &amp; Activation</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    The officer’s username will be generated as{" "}
                    <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 font-semibold">
                      firstname.lastname
                    </code>
                    . An email containing secure temporary credentials and a direct password setup link will be dispatched immediately.
                  </p>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwame"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mensah"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kofi"
                  value={form.middleName}
                  onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kwame.mensah@dvla.gov.gh"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The officer will receive their invitation and initial login credentials here.
                </p>
              </div>

              {editingUserId && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Username (System)</label>
                    <input
                      type="text"
                      disabled
                      value={`@${form.username}`}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned DVLA Station <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Role Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                >
                  <option value="DATA_ENTRY">Data Entry — Booking &amp; Vehicle Processing Desks</option>
                  <option value="SUPERVISOR">Supervisor — Station Review, Approvals &amp; Oversight</option>
                  <option value="SUPERADMIN">SuperAdmin — Full Nationwide Control &amp; System Configuration</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#103014] to-[#1a4a1f] hover:from-[#153e1a] hover:to-[#225c27] shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : editingUserId ? (
                    "Save Officer Changes"
                  ) : (
                    "Register & Dispatch Email"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-base">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Revoke Officer Access?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to delete officer account{" "}
                <strong className="text-slate-900 font-bold">{deleteTarget.name}</strong> (
                <span className="font-mono text-slate-700 font-semibold">@{deleteTarget.username}</span>)?
              </p>
              <p className="text-[11px] text-rose-600 mt-2 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                This will revoke their portal access immediately. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? "Revoking..." : "Yes, Delete Officer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
