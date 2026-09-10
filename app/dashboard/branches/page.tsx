"use client";

import { useState, useEffect } from "react";

interface Region {
  id: string;
  name: string;
  code: string;
  description: string | null;
  branches: Branch[];
}

interface Branch {
  id: string;
  name: string;
  slug: string;
  code: string;
  type: "HEADQUARTERS" | "REGIONAL" | "DISTRICT" | "SATELLITE";
  address: string | null;
  phone: string | null;
  regionId: string;
  region?: Region;
  _count?: {
    users: number;
    bookings: number;
    pickupRegistrations: number;
  };
}

export default function BranchesPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [seedingRegions, setSeedingRegions] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    code: "",
    type: "REGIONAL" as Branch["type"],
    regionId: "",
    address: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resReg, resBr] = await Promise.all([
        fetch("/api/regions"),
        fetch("/api/branches"),
      ]);

      if (resReg.ok && resBr.ok) {
        const regData = await resReg.json();
        const brData = await resBr.json();
        setRegions(regData);
        setBranches(brData);
        if (regData.length > 0 && !form.regionId) {
          setForm((prev) => ({ ...prev, regionId: regData[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load regions/branches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRegions = async () => {
    try {
      setSeedingRegions(true);
      const res = await fetch("/api/regions/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to seed regions");
      }
      triggerToast(`🇬🇭 ${data.message || "All 16 Ghana regions seeded successfully!"}`);
      await fetchData();
    } catch (err: any) {
      console.error("Seed error:", err);
      triggerToast(`❌ ${err.message || "Failed to seed regions"}`);
    } finally {
      setSeedingRegions(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    const code = "DVLA-" + val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    setForm((prev) => ({ ...prev, name: val, slug, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create branch");
      }

      triggerToast(`Branch "${form.name}" registered successfully!`);
      setShowModal(false);
      setForm({
        name: "",
        slug: "",
        code: "",
        type: "REGIONAL",
        regionId: regions[0]?.id || "",
        address: "",
        phone: "",
      });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBranches = selectedRegionId === "ALL"
    ? branches
    : branches.filter((b) => b.regionId === selectedRegionId);

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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Regional Stations &amp; Centers
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {branches.length} Operational Stations
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              DVLA Regional Stations &amp; District Centers
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Manage Driver and Vehicle Licensing Authority regional offices, district centers, and satellite inspection stations across Ghana.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSeedRegions}
              disabled={seedingRegions}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
              title="Seed all 16 administrative regions of Ghana into the database (no branches)"
            >
              {seedingRegions ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                  <span>Seeding Regions...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">🇬🇭</span>
                  <span>Seed Regions ({regions.length > 0 ? regions.length : "16"})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#81B71A] hover:bg-[#72a316] active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>+</span>
              <span>Register Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty Regions Alert Banner (Database formatted or unseeded) ── */}
      {regions.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              🇬🇭
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">No Administrative Regions in System</h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                The database has been formatted or is missing regional jurisdiction records. Click below to initialize the 16 official Ghana regions (no branches will be created).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSeedRegions}
            disabled={seedingRegions}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap flex items-center gap-2 disabled:opacity-60"
          >
            {seedingRegions ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Seeding 16 Regions...</span>
              </>
            ) : (
              <>
                <span>⚡ Auto-Fill 16 Regions</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Region Filter Pills Bar ── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        {regions.length === 0 ? (
          <div className="flex items-center justify-between py-1 px-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">No regions available in the database.</span>
            <button
              type="button"
              onClick={handleSeedRegions}
              disabled={seedingRegions}
              className="text-xs font-bold text-[#103014] hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <span>🇬🇭</span>
              <span>{seedingRegions ? "Seeding..." : "Auto-fill 16 Regions Now"}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setSelectedRegionId("ALL")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                selectedRegionId === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Regions ({branches.length})
            </button>

            {regions.map((reg) => {
              const count = branches.filter((b) => b.regionId === reg.id).length;
              return (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegionId(reg.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    selectedRegionId === reg.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {reg.name} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Branch Cards Grid ── */}
      {loading ? (
        <div className="p-12 text-center text-xs font-medium text-slate-400 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          Loading DVLA regional branches...
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-sm font-bold text-slate-900">No branches registered in this region</p>
          <p className="text-xs text-slate-400 mt-1">Register a new station or switch to another region.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {branch.type}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    {branch.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{branch.name}</h3>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {branch.region?.name || "DVLA Region"}
                </p>

                <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                  {branch.address && (
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400">📍</span>
                      <span className="truncate">{branch.address}</span>
                    </p>
                  )}
                  {branch.phone && (
                    <p className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span className="text-slate-400">📞</span>
                      <span>{branch.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 font-medium text-slate-500">
                  <span>{branch._count?.users || 0} Staff</span>
                  <span>•</span>
                  <span>{branch._count?.bookings || 0} Bookings</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Dialog for Registering Branch ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Register DVLA Branch</h2>
                <p className="text-[11px] text-slate-500">Assign regional location and authority tier</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Adenta Municipal Office"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Station Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Branch Tier Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="REGIONAL">Regional Center</option>
                    <option value="HEADQUARTERS">Headquarters (HQ)</option>
                    <option value="DISTRICT">District Office</option>
                    <option value="SATELLITE">Satellite Center</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Assigned Region *
                  </label>
                  {regions.length === 0 && (
                    <button
                      type="button"
                      onClick={handleSeedRegions}
                      disabled={seedingRegions}
                      className="text-[10px] font-bold text-[#81B71A] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>🇬🇭</span>
                      <span>{seedingRegions ? "Seeding..." : "Auto-fill 16 Regions"}</span>
                    </button>
                  )}
                </div>
                <select
                  required
                  value={form.regionId}
                  onChange={(e) => setForm((prev) => ({ ...prev, regionId: e.target.value }))}
                  disabled={regions.length === 0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {regions.length === 0 ? (
                    <option value="">No regions available — click Auto-fill 16 Regions above</option>
                  ) : (
                    regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name} ({reg.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Physical Location Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Near Barrier, Adenta Municipal"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Station Contact Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+233 30 200 0000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Registering..." : "Save Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
