"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* ─── Falling icon config ─── */
type IconType = "car" | "plate" | "key" | "doc" | "badge";
type FallingItem = {
  icon: IconType; left: string; delay: string; duration: string;
  size: number; rotS: string; rotE: string;
};

const FALLING: FallingItem[] = [
  { icon: "car", left: "6%", delay: "0s", duration: "16s", size: 32, rotS: "-6deg", rotE: "8deg" },
  { icon: "plate", left: "18%", delay: "4.5s", duration: "14s", size: 26, rotS: "10deg", rotE: "-5deg" },
  { icon: "key", left: "30%", delay: "8s", duration: "17s", size: 24, rotS: "-15deg", rotE: "10deg" },
  { icon: "doc", left: "44%", delay: "2s", duration: "15s", size: 28, rotS: "5deg", rotE: "-9deg" },
  { icon: "badge", left: "57%", delay: "10s", duration: "13s", size: 30, rotS: "-8deg", rotE: "12deg" },
  { icon: "car", left: "68%", delay: "6s", duration: "18s", size: 26, rotS: "4deg", rotE: "-6deg" },
  { icon: "plate", left: "80%", delay: "1s", duration: "14s", size: 24, rotS: "-12deg", rotE: "7deg" },
  { icon: "key", left: "90%", delay: "7.5s", duration: "16s", size: 22, rotS: "9deg", rotE: "-14deg" },
  { icon: "doc", left: "12%", delay: "12s", duration: "15s", size: 26, rotS: "-4deg", rotE: "10deg" },
  { icon: "badge", left: "38%", delay: "5s", duration: "17s", size: 28, rotS: "7deg", rotE: "-8deg" },
  { icon: "car", left: "74%", delay: "9s", duration: "13s", size: 30, rotS: "-10deg", rotE: "6deg" },
  { icon: "plate", left: "52%", delay: "14s", duration: "16s", size: 22, rotS: "6deg", rotE: "-11deg" },
];

/* ─── Left panel particles (reduced) ─── */
type Particle = { left: string; bottom: string; size: number; delay: string; duration: string; drift: string };
const PARTICLES: Particle[] = [
  { left: "10%", bottom: "5%", size: 2, delay: "0s", duration: "10s", drift: "12px" },
  { left: "28%", bottom: "3%", size: 3, delay: "2.4s", duration: "13s", drift: "-16px" },
  { left: "47%", bottom: "8%", size: 2, delay: "5s", duration: "9s", drift: "10px" },
  { left: "63%", bottom: "4%", size: 3, delay: "1.2s", duration: "12s", drift: "-12px" },
  { left: "79%", bottom: "6%", size: 2, delay: "7s", duration: "11s", drift: "14px" },
  { left: "88%", bottom: "2%", size: 3, delay: "3.8s", duration: "10s", drift: "-10px" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (username === "admin" && password === "1234") {
        router.push("/dashboard");
      } else {
        setLoading(false);
        setError("Invalid username or password. Please try again.");
      }
    }, 800);
  }

  return (
    <div className="min-h-screen flex">

      {/* ══════════════ LEFT BRAND PANEL ══════════════ */}
      <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden bg-[#1a2e05]">

        {/* background photo */}
        <Image src="/login-bg.png" alt="" fill priority
          className="object-cover opacity-40 select-none pointer-events-none" />

        {/* gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a2e05]/90 via-[#81B71A]/30 to-[#81B71A]/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a2e05]/10 to-[#1a2e05]/85 pointer-events-none" />

        {/* aurora blobs */}
        <div className="absolute rounded-full pointer-events-none" style={{
          width: 400, height: 400, top: -80, left: -70,
          background: "radial-gradient(circle, rgba(129,183,26,0.45) 0%, transparent 70%)",
          filter: "blur(80px)", animation: "aurora-1 18s ease-in-out infinite",
        }} />
        <div className="absolute rounded-full pointer-events-none" style={{
          width: 320, height: 320, top: "30%", right: -80,
          background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
          filter: "blur(70px)", animation: "aurora-2 22s ease-in-out infinite",
        }} />
        <div className="absolute rounded-full pointer-events-none" style={{
          width: 270, height: 270, bottom: -50, left: "32%",
          background: "radial-gradient(circle, rgba(129,183,26,0.38) 0%, transparent 70%)",
          filter: "blur(65px)", animation: "aurora-3 16s ease-in-out infinite",
        }} />

        {/* diagonal grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.05 }}>
          <svg width="200%" height="200%" style={{
            position: "absolute", top: "-50%", left: "-50%",
            animation: "scroll-lines 28s linear infinite",
          }}>
            <defs>
              <pattern id="lg" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="60" stroke="white" strokeWidth="0.8" />
                <line x1="0" y1="0" x2="60" y2="0" stroke="white" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lg)" />
          </svg>
        </div>

        {/* pulsing rings */}
        {([0, 2, 4] as number[]).map((d) => (
          <div key={d} className="absolute rounded-full border pointer-events-none" style={{
            width: 160, height: 160,
            top: "52%", left: "38%", marginLeft: -80, marginTop: -80,
            borderColor: "rgba(129,183,26,0.28)",
            animation: `ring-pulse 5s ease-out ${d}s infinite backwards`,
          }} />
        ))}

        {/* particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full bg-white pointer-events-none" style={{
            left: p.left, bottom: p.bottom, width: p.size, height: p.size,
            animationName: "float-particle", animationDuration: p.duration,
            animationDelay: p.delay, animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationFillMode: "backwards",
            opacity: 0,
            "--px-drift": p.drift,
          } as React.CSSProperties} />
        ))}

        {/* vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(26,46,5,0.5) 100%)" }} />

        {/* content */}
        <div className="relative z-10 flex flex-col flex-1 justify-between px-14 py-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-md" style={{ background: "rgba(129,183,26,0.45)" }} />
              <Image src="/dvla-bg.png" alt="DVLA Logo" width={56} height={56} priority
                className="relative rounded-xl object-contain p-1"
                style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-widest uppercase drop-shadow">DVLA</p>
              <p className="text-white/70 text-[10px] tracking-[0.2em] uppercase font-medium">
                Driver &amp; Vehicle Licensing Authority
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="w-12 h-1 rounded-full bg-[#81B71A]"
              style={{ boxShadow: "0 0 10px #81B71A, 0 0 24px rgba(129,183,26,0.45)" }} />
            <h1 className="text-white text-4xl font-bold leading-tight tracking-tight drop-shadow-lg">
              Vehicle Plate<br />Management<br />System
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Centralised platform for managing vehicle plate registration,
              workflows and oprations across all regions.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <span className="block w-5 h-1.5 rounded-full bg-[#81B71A]"
                style={{ boxShadow: "0 0 8px #81B71A" }} />
              <span className="block w-5 h-1.5 rounded-full bg-white/30" />
              <span className="block w-5 h-1.5 rounded-full bg-white/30" />
            </div>
            <p className="text-white/60 text-xs tracking-wide">Secure Government Portal</p>
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT FORM PANEL ══════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #d6edb8 0%, #eef6df 35%, #c8e6a0 70%, #dff0c4 100%)" }}>

        {/* falling SVG icons */}
        {FALLING.map((item, i) => (
          <div key={i} className="absolute pointer-events-none" style={{
            left: item.left, top: 0,
            animationName: "fall-icon",
            animationDuration: item.duration,
            animationDelay: item.delay,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationFillMode: "backwards",
            opacity: 0,
            color: "#81B71A",
            "--rot-s": item.rotS,
            "--rot-e": item.rotE,
          } as React.CSSProperties}>
            <SystemIcon type={item.icon} size={item.size} />
          </div>
        ))}

        {/* subtle radial glow so card pops */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(129,183,26,0.06) 0%, transparent 65%)" }} />

        {/* mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10 relative z-10">
          <Image src="/dvla.jpg" alt="DVLA Logo" width={40} height={40} className="rounded-md object-contain" priority />
          <div>
            <p className="text-[#81B71A] font-bold text-lg tracking-widest uppercase">DVLA</p>
            <p className="text-[#81B71A]/70 text-[9px] tracking-[0.18em] uppercase font-medium">
              Driver &amp; Vehicle Licensing Authority
            </p>
          </div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="rounded-2xl px-10 py-10" style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.55)",
            boxShadow: "0 8px 48px rgba(129,183,26,0.13), 0 1px 0 rgba(255,255,255,0.9) inset",
          }}>

            <div className="mb-8">
              <h2 className="text-[#1a2e05] text-2xl font-bold tracking-tight">Sign In</h2>
              <p className="text-[#6b7a99] text-sm mt-1">Enter your credentials to access the portal</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username"
                  className="block text-xs font-semibold text-[#374167] uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa3be]"><UserIcon /></span>
                  <input id="username" type="text" autoComplete="username"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-[#1a2e05] text-sm placeholder-[#8fa878] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition"
                    style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.65)" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password"
                    className="block text-xs font-semibold text-[#374167] uppercase tracking-wider">
                    Password
                  </label>
                  <button type="button" className="text-[#81B71A] text-xs font-medium hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa3be]"><LockIcon /></span>
                  <input id="password" type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 rounded-lg text-[#1a2e05] text-sm placeholder-[#8fa878] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/30 transition"
                    style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.65)" }} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa3be] hover:text-[#81B71A] transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-4 h-4 rounded peer-checked:bg-[#81B71A] transition" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }} />
                  <svg className="absolute inset-0 m-auto w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                    fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[#6b7a99] text-sm">Keep me signed in</span>
              </label>

              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
                  style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#b91c1c" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="currentColor" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-[#81B71A] hover:bg-[#6a9a15] active:scale-[0.99] text-white font-semibold text-sm tracking-wide transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ boxShadow: "0 4px 18px rgba(129,183,26,0.40)" }}>
                {loading && (
                  <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? "Signing in…" : "Sign In to Portal"}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center space-y-1">
            <p className="text-[#9aa3be] text-xs">Authorised users only. All access is monitored and logged.</p>
            <p className="text-[#b0bbd6] text-xs">
              &copy; {new Date().getFullYear()} Driver &amp; Vehicle Licensing Authority
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── System-themed falling icons ─── */
function SystemIcon({ type, size }: { type: IconType; size: number }) {
  const s = size;
  switch (type) {
    case "car":
      return (
        <svg width={s} height={s} viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h40M8 20l5-10h22l5 10" />
          <rect x="2" y="20" width="44" height="8" rx="2" />
          <circle cx="12" cy="28" r="3" fill="currentColor" stroke="none" />
          <circle cx="36" cy="28" r="3" fill="currentColor" stroke="none" />
          <path d="M14 13h8M26 13h8" strokeWidth={1.5} />
        </svg>
      );
    case "plate":
      return (
        <svg width={s} height={Math.round(s * 0.55)} viewBox="0 0 56 30" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <rect x="1" y="1" width="54" height="28" rx="4" />
          <rect x="5" y="5" width="46" height="20" rx="2" strokeWidth={1} strokeDasharray="2 2" />
          <line x1="12" y1="15" x2="44" y2="15" strokeWidth={3} strokeLinecap="round" />
          <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
          <circle cx="48" cy="8" r="2" fill="currentColor" stroke="none" />
          <circle cx="8" cy="22" r="2" fill="currentColor" stroke="none" />
          <circle cx="48" cy="22" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "key":
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="14" cy="14" r="10" />
          <circle cx="14" cy="14" r="5" strokeWidth={1.5} />
          <line x1="24" y1="20" x2="38" y2="34" />
          <line x1="31" y1="27" x2="34" y2="30" />
          <line x1="34" y1="30" x2="36" y2="28" />
        </svg>
      );
    case "doc":
      return (
        <svg width={Math.round(s * 0.75)} height={s} viewBox="0 0 36 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 2h20l8 8v36a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M24 2v8h8" strokeLinejoin="round" />
          <line x1="8" y1="20" x2="28" y2="20" />
          <line x1="8" y1="28" x2="28" y2="28" />
          <line x1="8" y1="36" x2="18" y2="36" />
        </svg>
      );
    case "badge":
      return (
        <svg width={s} height={s} viewBox="0 0 40 44" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 2L4 8v12c0 10 6.8 19.4 16 22 9.2-2.6 16-12 16-22V8L20 2z" />
          <path d="M13 22l5 5 9-10" strokeWidth={2.5} />
        </svg>
      );
  }
}

/* ─── Form icons ─── */
function UserIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
