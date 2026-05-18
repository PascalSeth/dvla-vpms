"use client";

import { useState } from "react";

const RECENT_CUSTOM_PLATES = [
  { id: "BOSS 1",   owner: "Ibrahim Mahama", region: "Greater Accra", date: "15 May 2026", cost: "GHS 15,000" },
  { id: "GIFTY 1",  owner: "Gifty Mensah",   region: "Ashanti",       date: "17 May 2026", cost: "GHS 15,000" },
  { id: "KING 99",  owner: "Nana Osei Tutu", region: "Ashanti",       date: "12 Apr 2026", cost: "GHS 15,000" },
  { id: "PRINCE 7", owner: "Prince Emmanuel", region: "Eastern",       date: "29 Mar 2026", cost: "GHS 15,000" },
  { id: "VIP 2026", owner: "Alhaji Collins", region: "Greater Accra", date: "10 Jan 2026", cost: "GHS 15,000" },
];

const FORBIDDEN_WORDS = ["BAD", "KILL", "DEAD", "HELL", "FOOL", "CRIME", "POLICE", "DVLA"];

export default function CustomPlatesPage() {
  const [customText, setCustomText] = useState("GHANA 1");
  const [plateStyle, setPlateStyle] = useState<"Private" | "Commercial" | "Government" | "Equipment">("Private");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("Greater Accra");
  const [submitted, setSubmitted] = useState(false);

  // Validations
  const textClean = customText.trim().toUpperCase();
  const tooLong = textClean.length > 8;
  const tooShort = textClean.length < 2;
  const isForbidden = FORBIDDEN_WORDS.some(word => textClean.includes(word));
  const hasInvalidChars = !/^[A-Z0-9\-\s]+$/.test(textClean) && textClean.length > 0;
  const isValid = !tooLong && !tooShort && !isForbidden && !hasInvalidChars;

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !ownerName || !email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCustomText("GHANA 1");
      setOwnerName("");
      setEmail("");
      alert("Custom plate application successfully queued for supervisor review!");
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* ── Page Header ── */}
      <div className="relative rounded-2xl overflow-hidden p-6 mb-2"
        style={{ background: "linear-gradient(115deg, #0d1a03 0%, #1a2e05 18%, #2d5009 48%, #4a7c10 74%, #81B71A 100%)" }}>
        
        {/* Grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} preserveAspectRatio="none">
          <defs>
            <pattern id="headergrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#headergrid)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.6)" }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
                DVLA VEHICLE PLATE MANAGEMENT SYSTEM
              </p>
            </div>
            <h2 className="font-extrabold tracking-tight text-white text-2xl">
              Custom &amp; Vanity Plates
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Design, validate, and issue premium custom or vanity license plates for prominent clients.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Interactive Custom Plate Designer */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#e8edf5] shadow-sm space-y-6">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#1a2e05]">Real-Time Custom Designer</h2>

            {/* Simulated Embossed Metal License Plate */}
            <div className="relative w-full max-w-[420px] mx-auto aspect-[4.2/1] rounded-2xl border-[5px] border-slate-900 p-1 shadow-2xl overflow-hidden select-none flex items-center"
                 style={{
                   background: plateStyle === "Commercial" 
                     ? "linear-gradient(180deg, #ffe066 0%, #fcc419 60%, #fab005 100%)" 
                     : plateStyle === "Government"
                     ? "linear-gradient(180deg, #2f9e44 0%, #2b8a3e 60%, #1e702e 100%)"
                     : "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 60%, #dee2e6 100%)",
                   boxShadow: "0 25px 50px -12px rgba(0,0,0,0.22), inset 0 3px 6px rgba(255,255,255,0.85), inset 0 -4px 6px rgba(0,0,0,0.25)"
                 }}>
              
              {/* Embossed inner rim */}
              <div className="absolute inset-[3px] rounded-xl border-2 border-slate-950/15 pointer-events-none" />

              {/* Reflective light shine overlay */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-white/40 z-10 animate-pulse" style={{ animationDuration: '4s' }} />

              {/* Left Blue Country Section */}
              <div className="w-[12%] h-full shrink-0 flex flex-col items-center justify-between py-2 bg-[#0c3b87] rounded-l-[7px] relative overflow-hidden z-20"
                   style={{ boxShadow: "1px 0 4px rgba(0,0,0,0.15)" }}>
                
                {/* Tiny Flag of Ghana */}
                <div className="w-[85%] aspect-[3/2] flex flex-col rounded-sm overflow-hidden border border-white/15 shrink-0">
                  <div className="flex-1 bg-red-600"></div>
                  <div className="flex-1 bg-yellow-400 flex items-center justify-center relative">
                    <span className="absolute text-[5px] text-black leading-none -top-[2px]">★</span>
                  </div>
                  <div className="flex-1 bg-green-600"></div>
                </div>
                
                {/* GH Country letters */}
                <span className="text-[12px] font-black text-white leading-none tracking-tighter">GH</span>
              </div>

              {/* Embossed Letter Content */}
              <div className="flex-1 flex items-center justify-center px-4 relative h-full z-20">
                {/* Hologram security mark */}
                <div className="absolute right-4 top-2 w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 opacity-60 flex items-center justify-center"
                     style={{ boxShadow: "0 0 6px rgba(245,158,11,0.6)", border: "0.5px solid rgba(255,255,255,0.25)" }}>
                  <span className="text-[6.5px] font-black text-amber-950 select-none tracking-tight">DVLA</span>
                </div>

                <span className="font-mono text-[22px] md:text-[26px] font-black tracking-wide whitespace-nowrap uppercase"
                      style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        letterSpacing: "3.5px",
                        color: plateStyle === "Government"
                          ? "#ffffff"
                          : plateStyle === "Equipment"
                          ? "#1b8a3e"
                          : "#1e293b",
                        textShadow: plateStyle === "Government"
                          ? "2px 2px 2px rgba(0,0,0,0.5), -1px -1px 0px rgba(0,0,0,0.3)"
                          : "1.5px 1.5px 1px rgba(255,255,255,0.85), -1.5px -1.5px 1px rgba(0,0,0,0.5)"
                      }}>
                  {textClean || "CUSTOM 1"}
                </span>
              </div>
            </div>

            {/* Design Inputs Form */}
            <form onSubmit={handleSubmitCustom} className="space-y-4 pt-4 border-t border-[#f0f4f8]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                    Custom Plate Text
                  </label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g. BOSS-1"
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm font-bold text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition"
                  />
                  {/* Realtime Validation Messages */}
                  <div className="mt-2 space-y-1">
                    {tooLong && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <span>⚠️</span> Custom plate text must not exceed 8 characters.
                      </p>
                    )}
                    {tooShort && (
                      <p className="text-xs text-[#6b7a99] font-medium flex items-center gap-1">
                        <span>💡</span> Custom plate must be at least 2 characters.
                      </p>
                    )}
                    {hasInvalidChars && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <span>⚠️</span> Only letters, numbers, spaces, and dashes are allowed.
                      </p>
                    )}
                    {isForbidden && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1 bg-red-50 p-1.5 rounded border border-red-200">
                        <span>❌</span> Proposed text contains forbidden phrases.
                      </p>
                    )}
                    {isValid && customText.length > 0 && (
                      <p className="text-xs text-[#81B71A] font-bold flex items-center gap-1">
                        <span>✓</span> Proposed plate text is valid and available!
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                    Plate Category Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlateStyle("Private")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition duration-200 hover:scale-[1.02] cursor-pointer ${
                        plateStyle === "Private"
                          ? "bg-white border-slate-900 text-[#1a2e05] shadow-md"
                          : "bg-[#f8faff] border-[#e2e8f0] text-[#6b7a99]"
                      }`}
                    >
                      ⚪ Private
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlateStyle("Commercial")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition duration-200 hover:scale-[1.02] cursor-pointer ${
                        plateStyle === "Commercial"
                          ? "bg-amber-50 border-amber-400 text-amber-900 shadow-md"
                          : "bg-[#f8faff] border-[#e2e8f0] text-[#6b7a99]"
                      }`}
                    >
                      🟡 Commercial
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlateStyle("Government")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition duration-200 hover:scale-[1.02] cursor-pointer ${
                        plateStyle === "Government"
                          ? "bg-green-50 border-green-400 text-green-900 shadow-md"
                          : "bg-[#f8faff] border-[#e2e8f0] text-[#6b7a99]"
                      }`}
                    >
                      🟢 Government
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlateStyle("Equipment")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition duration-200 hover:scale-[1.02] cursor-pointer ${
                        plateStyle === "Equipment"
                          ? "bg-purple-50 border-purple-400 text-purple-900 shadow-md"
                          : "bg-[#f8faff] border-[#e2e8f0] text-[#6b7a99]"
                      }`}
                    >
                      🚜 Equipment
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Enter owner name"
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@domain.com"
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] placeholder-[#9aa3be] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374167] uppercase tracking-wider mb-2">
                    Region of Issue
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg text-sm text-[#1a2e05] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition font-semibold"
                  >
                    <option value="Greater Accra">Greater Accra</option>
                    <option value="Ashanti">Ashanti</option>
                    <option value="Western">Western</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Northern">Northern</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isValid || !ownerName || !email || submitted}
                  className="w-full py-3 rounded-xl bg-[#81B71A] hover:bg-[#6a9a15] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg transition duration-200 cursor-pointer"
                >
                  {submitted ? "Submitting Request..." : "Apply for Custom Plate (GHS 15,000)"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Guidelines & Recent Custom Plates */}
        <div className="space-y-6">
          {/* Custom Guidelines */}
          <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
            <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider">Custom Plate Rules</h3>
            <ul className="text-xs text-[#52607a] space-y-2.5 list-disc pl-4 font-medium">
              <li>Must contain between 2 and 8 characters.</li>
              <li>Only uppercase letters, digits, single spaces, and hyphens allowed.</li>
              <li>Cannot begin or end with a space or hyphen.</li>
              <li>Vulgar, offensive, political, or institutional words (e.g. POLICE, DVLA) are forbidden.</li>
              <li>Premium registration fee is <strong>GHS 15,000</strong>, renewable annually at <strong>GHS 5,000</strong>.</li>
            </ul>
          </div>

          {/* Recently Issued Custom Plates */}
          <div className="bg-white p-5 rounded-xl border border-[#e8edf5] shadow-sm space-y-4">
            <h3 className="font-bold text-[#1a2e05] text-xs uppercase tracking-wider">Recently Issued Vanity</h3>
            <div className="space-y-3">
              {RECENT_CUSTOM_PLATES.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-[#f8faff] rounded-xl border border-[#f0f3f8] hover:shadow-sm transition duration-150">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-slate-800 tracking-widest uppercase border-[2.5px] border-slate-900 px-2 py-0.5 rounded bg-white shadow-sm"
                          style={{
                            textShadow: "0.5px 0.5px 0px rgba(255,255,255,0.8), -0.5px -0.5px 0px rgba(0,0,0,0.3)"
                          }}>
                      {item.id}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1a2e05]">{item.owner}</p>
                      <p className="text-[10px] text-[#6b7a99] font-medium">{item.region} • {item.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#81B71A]">{item.cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
