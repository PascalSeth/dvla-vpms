"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StationSettings {
  stationName: string;
  stationCode: string;
  location: string;
  phone: string;
  email: string;
  superintendent: string;
  dailyQuota: number;
  operatingHours: string;
  // Plate sequence rules
  defaultPrefix: string;
  nextSequence: number;
  yearSuffix: string;
  fontStandard: string;
  // Security policies
  dualApprovalGovPlates: boolean;
  reservationExpiryDays: number;
  sessionTimeoutMinutes: number;
  autoAuditArchival: string;
  // Hardware & integration
  embosserIp: string;
  embosserPort: number;
  smsCitizenAlerts: boolean;
  duplicateVinAlerts: boolean;
}

const DEFAULT_SETTINGS: StationSettings = {
  stationName: "DVLA Adenta HQ & Municipal Center",
  stationCode: "DVLA-ADENTA-04",
  location: "Jawaharlal Nehru Rd, Adenta Municipal, Accra",
  phone: "030 274 6760",
  email: "adenta.station@dvla.gov.gh",
  superintendent: "Eric Ansah (Reg. Director)",
  dailyQuota: 250,
  operatingHours: "08:00 – 17:00 GMT (Mon–Fri)",

  defaultPrefix: "AD",
  nextSequence: 1092,
  yearSuffix: "26",
  fontStandard: "FE-Schrift Ghana Anti-Fraud",

  dualApprovalGovPlates: true,
  reservationExpiryDays: 60,
  sessionTimeoutMinutes: 30,
  autoAuditArchival: "Monthly",

  embosserIp: "192.168.4.120",
  embosserPort: 9100,
  smsCitizenAlerts: true,
  duplicateVinAlerts: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<StationSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"general" | "plates" | "security" | "hardware" | "backup">("general");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dvla_station_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Error reading settings", e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      localStorage.setItem("dvla_station_settings", JSON.stringify(settings));
      
      // Update session branch name if modified
      const currentSession = localStorage.getItem("dvla_session");
      if (currentSession) {
        const parsed = JSON.parse(currentSession);
        parsed.branch = { name: settings.stationName, code: settings.stationCode };
        localStorage.setItem("dvla_session", JSON.stringify(parsed));
        window.dispatchEvent(new Event("dvla_session_change"));
      }

      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }, 500);
    } catch (err) {
      setIsSaving(false);
      alert("Failed to save settings to local configuration storage.");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to reset all station configuration settings to DVLA factory defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem("dvla_station_settings", JSON.stringify(DEFAULT_SETTINGS));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      stationSettings: settings,
      sessionData: localStorage.getItem("dvla_session") ? JSON.parse(localStorage.getItem("dvla_session")!) : null,
      systemPlatform: "DVLA VPMS v2.4 Enterprise",
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DVLA_Station_Backup_${settings.stationCode}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto p-6">
      {/* Top Command Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              System Administration
            </span>
            <span className="text-xs text-slate-400 font-mono">DVLA Station Configuration Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Station Settings &amp; Global Parameters
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl font-normal">
            Configure regional station identities, alphanumeric numbering sequences, automated security policies, and hardware embossing dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Backup Config</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{isSaving ? "Applying..." : "Save Configuration"}</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Station configuration saved successfully and synchronized with station local storage!</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Updated</span>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: "general", label: "Station Identity", icon: "🏢" },
          { id: "plates", label: "Plate Series & Numbering", icon: "🔢" },
          { id: "security", label: "Security & Governance", icon: "🛡️" },
          { id: "hardware", label: "Embossing Hardware & Alerts", icon: "🖨️" },
          { id: "backup", label: "Data Backup & Maintenance", icon: "💾" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100/70"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Configuration Form Body */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General Station Identity */}
        {activeTab === "general" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Regional Station Identity &amp; Quota Controls</h3>
              <p className="text-xs text-slate-500 mt-0.5">Parameters identifying this workstation node across the national DVLA network.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Station Center Name</label>
                <input
                  type="text"
                  required
                  value={settings.stationName}
                  onChange={(e) => setSettings({ ...settings, stationName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Station Identifier Code</label>
                <input
                  type="text"
                  required
                  value={settings.stationCode}
                  onChange={(e) => setSettings({ ...settings, stationCode: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Station Address</label>
                <input
                  type="text"
                  required
                  value={settings.location}
                  onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Station Telephone Dispatch</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Superintending Certification Officer</label>
                <input
                  type="text"
                  value={settings.superintendent}
                  onChange={(e) => setSettings({ ...settings, superintendent: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Stamping Quota Allocation</label>
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={settings.dailyQuota}
                  onChange={(e) => setSettings({ ...settings, dailyQuota: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Plate Series & Generation Rules */}
        {activeTab === "plates" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Alphanumeric Plate Series Rules</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control automatic plate number generation and formatting across categories.</p>
              </div>
              <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono font-bold text-emerald-800">
                Next: {settings.defaultPrefix} {settings.nextSequence}-{settings.yearSuffix}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Regional Prefix</label>
                <input
                  type="text"
                  maxLength={3}
                  value={settings.defaultPrefix}
                  onChange={(e) => setSettings({ ...settings, defaultPrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">e.g. AD (Adenta), GC (Accra Central), AS (Kumasi)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Alphanumeric Sequence</label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={settings.nextSequence}
                  onChange={(e) => setSettings({ ...settings, nextSequence: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Next auto-assigned plate number</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Year Suffix</label>
                <input
                  type="text"
                  maxLength={2}
                  value={settings.yearSuffix}
                  onChange={(e) => setSettings({ ...settings, yearSuffix: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Statutory registration cycle year (26)</span>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Embossing Typography Standard</label>
                <select
                  value={settings.fontStandard}
                  onChange={(e) => setSettings({ ...settings, fontStandard: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="FE-Schrift Ghana Anti-Fraud">FE-Schrift Ghana Anti-Fraud (Mandatory National Standard)</option>
                  <option value="DIN 1451 Mittelschrift">DIN 1451 Mittelschrift (Diplomatic Format)</option>
                  <option value="Standard Pressed Sans">Standard Pressed Sans (Legacy Series)</option>
                </select>
              </div>
            </div>

            {/* Live Plate Number Preview Simulator */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Real-Time Generated Pattern Preview</span>
                <span className="text-xs text-slate-500">Live preview of the plate string generated for standard filings at this workstation.</span>
              </div>
              <div className="px-6 py-2.5 rounded-lg bg-white border-2 border-slate-800 shadow-md font-mono text-xl font-black tracking-widest text-slate-900 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>{settings.defaultPrefix} {settings.nextSequence} - {settings.yearSuffix}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Governance */}
        {activeTab === "security" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Security &amp; Authorization Governance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control threshold policies, dual-signoff rules, and automatic audit ledger lifecycles.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dualApprovalGovPlates}
                  onChange={(e) => setSettings({ ...settings, dualApprovalGovPlates: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Require Supervisor Dual-Approval on Government &amp; VIP Plates</span>
                  <span className="text-xs text-slate-500">
                    Mandates secondary verification sign-off before official release of Government Split (GV) and Prestige Reservation series.
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Block Reservation Maximum Hold Duration</label>
                  <select
                    value={settings.reservationExpiryDays}
                    onChange={(e) => setSettings({ ...settings, reservationExpiryDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={30}>30 Calendar Days</option>
                    <option value={60}>60 Calendar Days (Default Standard)</option>
                    <option value={90}>90 Calendar Days</option>
                    <option value={180}>180 Calendar Days (Institutional Extended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Station Inactivity Session Lockout</label>
                  <select
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={0}>Disable Automatic Lockout (High Security Workstation)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Hardware & Integrations */}
        {activeTab === "hardware" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Embossing Machine &amp; Gateway Dispatch</h3>
              <p className="text-xs text-slate-500 mt-0.5">Physical automated embossing press networking and citizen SMS alert notification gateways.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Station Embossing Press IPv4 Address</label>
                <input
                  type="text"
                  value={settings.embosserIp}
                  onChange={(e) => setSettings({ ...settings, embosserIp: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Network Socket Port</label>
                <input
                  type="number"
                  value={settings.embosserPort}
                  onChange={(e) => setSettings({ ...settings, embosserPort: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsCitizenAlerts}
                    onChange={(e) => setSettings({ ...settings, smsCitizenAlerts: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Dispatch Automated SMS when Plates are Embossed</span>
                    <span className="text-[11px] text-slate-500">Sends SMS notification to vehicle owner phone once physical stamping is stamped.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.duplicateVinAlerts}
                    onChange={(e) => setSettings({ ...settings, duplicateVinAlerts: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Real-Time Interpol &amp; VIN Duplicate Warning</span>
                    <span className="text-[11px] text-slate-500">Pops modal alert on booking desk if 17-character chassis has prior filing.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Data Backup & Maintenance */}
        {activeTab === "backup" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Station Maintenance &amp; Configuration Archival</h3>
              <p className="text-xs text-slate-500 mt-0.5">Export operational configuration backups and restore defaults.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Export Station Backup</span>
                <p className="text-xs text-slate-500">
                  Export complete configuration schema, active prefixes, and user profiles as an encrypted JSON archive.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                >
                  Download JSON Backup
                </button>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
                <span className="text-xs font-bold text-rose-900 block">Reset Station Parameters</span>
                <p className="text-xs text-rose-700">
                  Restore station identity, numbering prefixes, and security rules to default DVLA HQ national parameters.
                </p>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3.5 py-2 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition shadow-2xs cursor-pointer"
                >
                  Reset to Factory Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel &amp; Return
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving Configuration..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
