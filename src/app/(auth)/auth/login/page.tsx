"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Step = "email" | "sent";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    // In production: POST /api/auth/magic-link
    // For MVP: simulate delay then show sent state
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep("sent");
  };

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

        {/* Card */}
        <div className="card p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
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

          {step === "email" ? (
            <>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
              >
                Teacher login
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                Enter your email — we&apos;ll send you a magic link. No password needed.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  autoComplete="email"
                  autoFocus
                  required
                />
                <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
                  <Mail size={16} />
                  Send magic link
                </Button>
              </form>

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
            </>
          ) : (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                style={{ backgroundColor: "rgba(45, 184, 158, 0.1)" }}
              >
                📬
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
              >
                Check your inbox
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
                We sent a magic link to{" "}
                <strong style={{ color: "var(--color-ink)" }}>{email}</strong>.
                Click the link to sign in.
              </p>
              <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
                Didn&apos;t get it?{" "}
                <button
                  onClick={() => setStep("email")}
                  className="font-medium hover:underline"
                  style={{ color: "var(--color-brand-teal)" }}
                >
                  Try again
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
