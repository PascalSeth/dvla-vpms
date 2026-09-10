"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const isRequired = searchParams.get("required") === "true";
  const usernameParam = searchParams.get("username") || "";

  const [manualUsername, setManualUsername] = useState("");
  const [manualTempPassword, setManualTempPassword] = useState("");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ username?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dvla_session");
      if (stored) {
        setSessionUser(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const effectiveUsername = usernameParam || sessionUser?.username || manualUsername.trim();
  const isMandatoryFirstLogin = isRequired || Boolean(sessionUser?.mustResetPassword);
  const hasContext = Boolean(token || isMandatoryFirstLogin || usernameParam || sessionUser?.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasContext && !effectiveUsername) {
      setError("Please enter your assigned Officer Username or Email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        newPassword: password,
        username: effectiveUsername || undefined,
        token: token || undefined,
        temporaryPassword: manualTempPassword.trim() || undefined,
        isRequired: Boolean(isRequired || isMandatoryFirstLogin),
      };

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update local session to clear mustResetPassword
        try {
          const stored = localStorage.getItem("dvla_session");
          if (stored) {
            const user = JSON.parse(stored);
            const updated = { ...user, mustResetPassword: false };
            localStorage.setItem("dvla_session", JSON.stringify(updated));
            window.dispatchEvent(new Event("dvla_session_change"));
          }
        } catch (e) {}

        setSuccessData({ username: data.username || effectiveUsername });
      } else {
        setError(data.error || "Failed to set permanent password.");
      }
    } catch (err: any) {
      setError("Network error. Please verify your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="text-center space-y-4 py-2 animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-base font-bold text-slate-900">Permanent Password Established!</h2>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Your DVLA VPMS officer credentials are now secured.
          {successData.username && (
            <span className="block mt-1.5 font-medium text-emerald-800">
              Officer Username:{" "}
              <code className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                @{successData.username}
              </code>
            </span>
          )}
        </p>
        <div className="pt-3">
          {sessionUser ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-block w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#81B71A] to-[#6FA818] hover:from-[#8ec91d] hover:to-[#78b71a] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#81B71A]/30 transition cursor-pointer"
            >
              Continue to Station Dashboard &rarr;
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-block w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#81B71A] to-[#6FA818] hover:from-[#8ec91d] hover:to-[#78b71a] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#81B71A]/30 transition"
            >
              Proceed to Sign In &rarr;
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isMandatoryFirstLogin && (
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/80 rounded-xl text-xs space-y-1">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
            <span>🛡️ First-Time Officer Activation</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            You authenticated using temporary credentials. For security compliance, please establish your permanent password before entering the station portal.
          </p>
        </div>
      )}

      {effectiveUsername && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <span className="text-slate-500 font-medium">Officer Account</span>
          <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-200">
            @{effectiveUsername}
          </span>
        </div>
      )}

      {!hasContext && (
        <div className="space-y-3 pt-1 border-b border-slate-100 pb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Username or Official Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              required
              placeholder="e.g. pascal.seth or pascalelikem@gmail.com"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#81B71A] focus:ring-2 focus:ring-[#81B71A]/20 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Temporary Password (from email)
            </label>
            <input
              type="password"
              value={manualTempPassword}
              onChange={(e) => setManualTempPassword(e.target.value)}
              placeholder="e.g. DVLA-6AD0C9!"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#81B71A] focus:ring-2 focus:ring-[#81B71A]/20 outline-none transition"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          New Secure Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter new permanent password (min. 4 characters)"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#81B71A] focus:ring-2 focus:ring-[#81B71A]/20 outline-none transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Confirm Permanent Password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Re-enter permanent password"
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#81B71A] focus:ring-2 focus:ring-[#81B71A]/20 outline-none transition"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#81B71A] to-[#6FA818] hover:from-[#8ec91d] hover:to-[#78b71a] text-white font-bold text-xs sm:text-sm tracking-wide transition shadow-md shadow-[#81B71A]/30 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Securing Password..." : "Set Password & Activate Portal"}
        </button>
      </div>

      <div className="text-center pt-2">
        <Link href="/login" className="text-xs text-slate-500 hover:text-slate-800 font-medium underline">
          &larr; Back to Sign In
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-screen relative font-sans antialiased flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#103014] via-[#1a4a1f] to-[#123817]">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <Image
          src="/login-bg.png"
          alt="DVLA Operations"
          fill
          priority
          className="object-cover mix-blend-overlay filter contrast-125 select-none"
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden">
          {/* Official DVLA Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#81B71A] via-[#9be226] to-[#FCD116]" />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-2.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-1.5 shadow-sm flex items-center justify-center">
                  <Image
                    src="/dvla-bg.png"
                    alt="DVLA Ghana Crest"
                    width={46}
                    height={46}
                    priority
                    className="object-contain"
                  />
                </div>
              </div>

              <span className="text-[10px] font-bold text-[#689414] tracking-[0.2em] uppercase">
                DVLA GHANA
              </span>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                Set Your Permanent Password
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Driver &amp; Vehicle Licensing Authority &bull; VPMS Portal
              </p>
            </div>

            <Suspense
              fallback={
                <div className="text-center py-8 text-xs text-slate-500">
                  Loading security gateway...
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-[11px] text-white/70 font-medium">
            &copy; {new Date().getFullYear()}&nbsp;Driver &amp; Vehicle Licensing Authority (DVLA) &bull; Ghana
          </p>
        </div>
      </div>
    </div>
  );
}
