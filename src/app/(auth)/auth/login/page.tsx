"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthMode = "password" | "otp";
type OtpStep  = "email" | "verify";

// ── Google icon (inline SVG so no extra dependency) ───────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2582h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.6151z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1804l-2.9087-2.2582c-.8059.54-1.8368.859-3.0477.859-2.3441 0-4.3282-1.5832-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.5482 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5814-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode]         = useState<AuthMode>("password");
  const [otpStep, setOtpStep]   = useState<OtpStep>("email");

  // Shared
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Password mode
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);

  // OTP mode
  const [otp, setOtp]           = useState("");

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearError = () => setError("");

  async function simulateRequest(ms = 900) {
    await new Promise((r) => setTimeout(r, ms));
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  // ── Google sign-in ────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    setLoading(true);
    clearError();
    await simulateRequest(800);
    // In production: redirect to /api/auth/google or supabase signInWithOAuth
    setLoading(false);
    goToDashboard();
  };

  // ── Email + password ──────────────────────────────────────────────────────

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    clearError();
    await simulateRequest();
    // In production: POST /api/auth/login { email, password }
    setLoading(false);
    goToDashboard();
  };

  // ── OTP: send code ────────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    setLoading(true);
    clearError();
    await simulateRequest();
    // In production: POST /api/auth/otp/send { email }
    setLoading(false);
    setOtpStep("verify");
  };

  // ── OTP: verify code ──────────────────────────────────────────────────────

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length < 4) { setError("Enter the full code from your email"); return; }
    setLoading(true);
    clearError();
    await simulateRequest();
    // In production: POST /api/auth/otp/verify { email, token: otp }
    setLoading(false);
    goToDashboard();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-muted)" }}
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-7">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
              R
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
            >
              Rekhachitra
            </span>
          </div>

          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            Teacher sign in
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            Welcome back. Choose how you&apos;d like to sign in.
          </p>

          {/* ── Google ── */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-body)",
              backgroundColor: "var(--color-white)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4285F4")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--color-subtle)" }}>
              or continue with email
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
          </div>

          {/* ── Mode tabs ── */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            {(["password", "otp"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setOtpStep("email"); }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: mode === m ? "var(--color-white)" : "transparent",
                  color: mode === m ? "var(--color-brand-teal)" : "var(--color-muted)",
                  fontFamily: "var(--font-body)",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {m === "password" ? "Password" : "One-time code"}
              </button>
            ))}
          </div>

          {/* ── Password form ── */}
          {mode === "password" && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                label="Email address"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                autoComplete="email"
                autoFocus
                required
              />

              {/* Password with show/hide */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full text-sm rounded-xl border px-3 py-2.5 pr-10 outline-none transition-colors"
                    style={{
                      borderColor: error ? "var(--color-brand-coral)" : "var(--color-border)",
                      color: "var(--color-ink)",
                      fontFamily: "var(--font-body)",
                      backgroundColor: "var(--color-white)",
                    }}
                    onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "var(--color-brand-teal)"; }}
                    onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "var(--color-border)"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
                    style={{ color: "var(--color-muted)" }}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs" style={{ color: "var(--color-brand-coral)" }}>{error}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs hover:underline"
                  style={{ color: "var(--color-brand-teal)" }}
                  onClick={() => { setMode("otp"); clearError(); }}
                >
                  Forgot password? Use a code →
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full mt-1 gap-2 justify-center"
              >
                <Lock size={15} />
                Sign in
              </Button>
            </form>
          )}

          {/* ── OTP form ── */}
          {mode === "otp" && (
            <>
              {otpStep === "email" ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                  <Input
                    type="email"
                    label="Email address"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                  {error && (
                    <p className="text-xs" style={{ color: "var(--color-brand-coral)" }}>{error}</p>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full gap-2 justify-center"
                  >
                    <Mail size={15} />
                    Send one-time code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                  <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                    We sent a 6-digit code to{" "}
                    <strong style={{ color: "var(--color-ink)" }}>{email}</strong>.
                  </p>

                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
                    >
                      One-time code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                        clearError();
                      }}
                      placeholder="123456"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      maxLength={6}
                      className="w-full text-center text-2xl font-bold tracking-[0.4em] rounded-xl border px-3 py-3 outline-none transition-colors"
                      style={{
                        borderColor: error ? "var(--color-brand-coral)" : "var(--color-border)",
                        color: "var(--color-brand-teal)",
                        fontFamily: "var(--font-heading)",
                        backgroundColor: "var(--color-white)",
                      }}
                      onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "var(--color-brand-teal)"; }}
                      onBlur={(e)  => { if (!error) e.currentTarget.style.borderColor = "var(--color-border)"; }}
                    />
                  </div>

                  {error && (
                    <p className="text-xs" style={{ color: "var(--color-brand-coral)" }}>{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={otp.length < 6}
                    className="w-full gap-2 justify-center"
                  >
                    <ArrowRight size={15} />
                    Verify &amp; sign in
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setOtpStep("email"); setOtp(""); clearError(); }}
                    className="flex items-center justify-center gap-1.5 text-xs hover:underline mx-auto"
                    style={{ color: "var(--color-muted)" }}
                  >
                    <RefreshCw size={12} />
                    Use a different email or resend code
                  </button>
                </form>
              )}
            </>
          )}

          {/* ── Footer ── */}
          <p className="text-xs text-center mt-6" style={{ color: "var(--color-subtle)" }}>
            Students don&apos;t need an account.{" "}
            <Link
              href="/join"
              className="font-medium hover:underline"
              style={{ color: "var(--color-brand-teal)" }}
            >
              Join a session →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
