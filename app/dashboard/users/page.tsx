"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function UsersPageContent() {
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("SUPERADMIN");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

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

  useEffect(() => {
    if (userRole !== "SUPERADMIN") return;

    const fetchOrganizations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setOrganizations(list);

          const queryOrgId = searchParams.get("organizationId");
          if (queryOrgId && list.some((org: Organization) => org.id === queryOrgId)) {
            setSelectedOrgId(queryOrgId);
          } else if (list.length > 0) {
            setSelectedOrgId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [userRole, searchParams]);

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) || null,
    [organizations, selectedOrgId]
  );

  const handleUserCountChange = (organizationId: string, count: number) => {
    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === organizationId ? { ...org, _count: { users: count } } : org
      )
    );
  };

  if (userRole !== "SUPERADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="bg-white rounded-2xl border border-[#e8edf5] p-10 max-w-lg text-center"
          style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            🔒
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#374167" }}>
            Access Restricted
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6b7a99" }}>
            User management is restricted to <strong>SuperAdmin</strong> accounts only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(135deg, #0d1a03 0%, #1a2e05 50%, #2d5009 100%)",
        }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Users</h1>
        <p className="text-white/60 text-lg">Manage users by organization</p>
      </div>

      <div
        className="bg-white rounded-xl border border-[#e8edf5] p-6"
        style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}
      >
        <label
          className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
          style={{ color: "#9aa3be" }}
        >
          Organization
        </label>
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="w-full max-w-md px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-[#81B71A]"
          style={{ borderColor: "#e8edf5", color: "#374167" }}
          disabled={isLoading || organizations.length === 0}
        >
          {organizations.length === 0 ? (
            <option value="">No organizations found</option>
          ) : (
            organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.code})
              </option>
            ))
          )}
        </select>
      </div>

      {isLoading ? (
        <div
          className="bg-white rounded-xl border border-[#e8edf5] p-10 text-center text-sm"
          style={{ color: "#9aa3be", boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}
        >
          Loading organizations...
        </div>
      ) : selectedOrg ? (
        <OrganizationUsersPanel
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          onUserCountChange={handleUserCountChange}
        />
      ) : (
        <div
          className="bg-white rounded-xl border border-[#e8edf5] p-10 text-center text-sm"
          style={{ color: "#9aa3be", boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}
        >
          Select an organization to manage users.
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className="bg-white rounded-2xl border border-[#e8edf5] p-10 max-w-lg text-center"
            style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.045)" }}
          >
            <p className="text-sm text-slate-500">Loading users...</p>
          </div>
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
