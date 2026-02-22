"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parseJoinCode } from "@/lib/utils/session";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseJoinCode(code);
    if (parsed.length !== 6) {
      setError("Please enter a valid 6-character join code");
      return;
    }
    setLoading(true);
    setError("");
    // Navigate to the session join page
    router.push(`/join/${parsed}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-muted)" }}
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <div className="card p-8 text-center">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6"
            style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
          >
            R
          </div>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            Join a session
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            Enter the code your teacher showed you
          </p>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
              placeholder="ABC-123"
              maxLength={7}
              className="w-full text-center text-3xl font-bold tracking-[0.2em] py-4 px-3 border-2 rounded-xl outline-none transition-colors focus:border-[var(--color-brand-teal)]"
              style={{
                borderColor: error ? "var(--color-brand-coral)" : "var(--color-border)",
                color: "var(--color-brand-teal)",
                fontFamily: "var(--font-heading)",
                backgroundColor: "var(--color-white)",
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {error && (
              <p className="text-sm" style={{ color: "var(--color-brand-coral)" }}>
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={code.replace(/[-\s]/g, "").length < 6}
              className="w-full"
            >
              Join session
              <ArrowRight size={18} />
            </Button>
          </form>

          <p className="text-xs mt-6" style={{ color: "var(--color-subtle)" }}>
            Are you a teacher?{" "}
            <Link
              href="/auth/login"
              className="font-medium hover:underline"
              style={{ color: "var(--color-brand-teal)" }}
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
