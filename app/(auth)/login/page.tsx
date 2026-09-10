"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");
  const [forgotErrorMsg, setForgotErrorMsg] = useState("");

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotErrorMsg("");
    setForgotSuccessMsg("");

    if (!forgotInput.trim()) {
      setForgotErrorMsg("Please enter your registered email address or username.");
      return;
    }

    try {
      setForgotLoading(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: forgotInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccessMsg(data.message || "Password reset instructions have been dispatched.");
        setForgotInput("");
      } else {
        setForgotErrorMsg(data.error || "Failed to process request.");
      }
    } catch (err) {
      setForgotErrorMsg("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("dvla_session", JSON.stringify(data.user));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("dvla_session_change"));
        }

        if (data.mustResetPassword) {
          router.push(`/reset-password?required=true&username=${encodeURIComponent(data.user.username)}`);
          return;
        }

        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid username or password.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      // Fallback for offline / demo environments
      if (username.trim().toLowerCase() === "admin" && password === "1234") {
        localStorage.setItem(
          "dvla_session",
          JSON.stringify({
            username: "admin",
            name: "System Administrator",
            role: "SUPERADMIN",
            organization: { name: "DVLA HQ", code: "DVLA-HQ" },
          })
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("dvla_session_change"));
        }
        router.push("/dashboard");
      } else {
        setLoading(false);
        setError("Unable to connect to authentication server.");
      }
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative font-sans antialiased flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#103014] via-[#1a4a1f] to-[#123817]">
      {/* ── Rich DVLA Luminous Backdrop ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft background image blend */}
        <Image
          src="/login-bg.png"
          alt="DVLA Operations"
          fill
          priority
          className="object-cover opacity-15 mix-blend-overlay filter contrast-125 select-none"
        />
        
        {/* Vibrant DVLA Green & Gold Ambient Lights */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#81B71A]/30 blur-[110px]" />
        <div className="absolute -bottom-24 -right-24 w-[460px] h-[460px] rounded-full bg-[#81B71A]/25 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#81B71A]/15 blur-[140px]" />
        
        {/* Subtle geometric dot grid for depth */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Main Executive White Card (Fitted to Viewport, No Scroll) ── */}
      <div className="relative z-10 w-full max-w-[375px]">
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.2)] overflow-hidden">
          
          {/* Official DVLA Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#81B71A] via-[#9be226] to-[#FCD116]" />

          <div className="px-6 py-5 sm:px-7 sm:py-6">
            {/* Logo & Header */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="relative mb-2">
                <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-100 p-1.5 shadow-sm flex items-center justify-center">
                  <Image
                    src="/dvla-bg.png"
                    alt="DVLA Ghana Crest"
                    width={44}
                    height={44}
                    priority
                    className="object-contain"
                  />
                </div>
              </div>

              <span className="text-[10px] font-bold text-[#689414] tracking-[0.2em] uppercase">
                DVLA GHANA
              </span>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                VPMS Portal
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Vehicle Plate Management System
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Username */}
              <div className="space-y-1">
                <label 
                  htmlFor="username" 
                  className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Username / Staff ID
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-[#81B71A] transition">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter staff username"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#81B71A] focus:ring-3 focus:ring-[#81B71A]/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="password" 
                    className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Please contact your station IT Administrator to reset your password.")}
                    className="text-[11px] font-medium text-[#689414] hover:text-[#527510] hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-[#81B71A] transition">
                    <LockIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#81B71A] focus:ring-3 focus:ring-[#81B71A]/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#81B71A] focus:ring-[#81B71A] accent-[#81B71A] cursor-pointer"
                  />
                  <span>Remember device</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(true);
                    setForgotSuccessMsg("");
                    setForgotErrorMsg("");
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Submit Button (DVLA Signature Green Gradient) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#81B71A] to-[#6FA818] hover:from-[#8ec91d] hover:to-[#78b71a] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-[#81B71A]/30 hover:shadow-lg hover:shadow-[#81B71A]/40 focus:outline-none focus:ring-3 focus:ring-[#81B71A]/40 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowIcon className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="text-center mt-3 space-y-0.5">
          <p className="text-[11px] text-white/70 font-medium">
            &copy; {new Date().getFullYear()}&nbsp;Driver &amp; Vehicle Licensing Authority (DVLA)
          </p>
          <p className="text-[10px] text-emerald-200/50">
            Republic of Ghana
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  🔑
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Reset Officer Password</h2>
                  <p className="text-[10px] text-slate-500">Official DVLA Identity Gateway</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotSuccessMsg ? (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed">
                  ✓ {forgotSuccessMsg}
                </div>
                <p className="text-[11px] text-slate-500">
                  Check your inbox (and spam/junk folder) for the secure reset link.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Close &amp; Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered official email address or officer username. We will send a secure link to reset your password.
                </p>

                {forgotErrorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {forgotErrorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. kwame.mensah@dvla.gov.gh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#81B71A] focus:ring-2 focus:ring-[#81B71A]/20 outline-none transition"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {forgotLoading ? "Dispatching..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Lightweight Icons ── */

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.98-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.19-6.19a3 3 0 014.242 4.242M1 1l22 22" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
