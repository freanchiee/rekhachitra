import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Users, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Rekhachitra – Live Math Classroom",
  description:
    "Create interactive graph-based math activities. Launch live sessions. See instant student responses. Built for IB MYP teachers.",
};

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "📈",
    color: "var(--color-brand-teal)",
    bg: "rgba(27, 120, 136, 0.08)",
    title: "Graphing Canvas",
    description:
      "Build interactive graph activities with expressions, points, and functions. Students explore math visually.",
  },
  {
    icon: "⚡",
    color: "var(--color-brand-coral)",
    bg: "rgba(246, 94, 93, 0.08)",
    title: "Live Sessions",
    description:
      "Share a 6-digit code. Students join instantly — no app download, no account needed. Kahoot-style engagement.",
  },
  {
    icon: "📊",
    color: "var(--color-brand-yellow)",
    bg: "rgba(245, 192, 0, 0.1)",
    title: "Instant Analytics",
    description:
      "Watch responses arrive in real time. See who's stuck, who's flying, and adjust your teaching on the spot.",
  },
];

const steps = [
  {
    number: "01",
    color: "var(--color-brand-yellow)",
    title: "Build your activity",
    description: "Add graph slides and checkpoint questions in the drag-and-drop builder.",
  },
  {
    number: "02",
    color: "var(--color-brand-mint)",
    title: "Launch & share",
    description: "Hit Launch — get a join code. Students enter it on any device.",
  },
  {
    number: "03",
    color: "var(--color-brand-coral)",
    title: "See results live",
    description: "Watch the response grid fill up. Spot misconceptions instantly.",
  },
];

const testimonials = [
  {
    quote: "My IB MYP students actually ask to do Rekhachitra sessions now. The graph activities are genuinely engaging.",
    name: "Sarah K.",
    role: "IB MYP Mathematics Teacher",
    seed: "sarah",
  },
  {
    quote:
      "Setup takes 2 minutes. Students join on their phones with no login. It just works — that's all I needed.",
    name: "Mr. Patel",
    role: "Grade 9 Math, International School",
    seed: "patel",
  },
];

const avatarColors = ["#1b7888", "#f65e5d", "#2db89e", "#f5c000"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
              R
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
            >
              Rekhachitra
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-ink-soft)" }}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-ink-soft)" }}
            >
              How it works
            </Link>
            <Link href="/auth/login" className="btn btn-outline btn-sm">
              Teacher Login
            </Link>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Get Started Free
            </Link>
          </div>

          {/* Mobile CTA */}
          <Link href="/dashboard" className="md:hidden btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6">
        {/* Background blobs */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.07] blur-3xl pointer-events-none"
          style={{ backgroundColor: "var(--color-brand-teal)" }}
        />
        <div
          className="absolute top-40 -left-20 w-72 h-72 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
          style={{ backgroundColor: "var(--color-brand-yellow)" }}
        />

        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border" style={{ borderColor: "rgba(27, 120, 136, 0.3)", backgroundColor: "rgba(27, 120, 136, 0.05)" }}>
            <Zap size={14} style={{ color: "var(--color-brand-coral)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-brand-teal)" }}>
              Now in Beta — Free for teachers
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}
          >
            Math that moves{" "}
            <span style={{ color: "var(--color-brand-teal)" }}>with your students</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Create graph-based activities, launch a live session in seconds, and watch student
            responses roll in — all in one lightweight classroom tool.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="btn btn-primary btn-lg w-full sm:w-auto">
              Start your first activity
              <ArrowRight size={18} />
            </Link>
            <Link href="/join" className="btn btn-outline btn-lg w-full sm:w-auto">
              I&apos;m a student →
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <div className="flex -space-x-2">
              {avatarColors.map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: c }}
                >
                  {["S", "M", "K", "A"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              <strong style={{ color: "var(--color-ink)" }}>200+ teachers</strong> already using Rekhachitra
            </p>
          </div>
        </div>

        {/* Hero preview card */}
        <div className="max-w-3xl mx-auto mt-16">
          <div
            className="rounded-2xl overflow-hidden shadow-float border border-[var(--color-border)]"
          >
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: "var(--color-surface)" }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-brand-coral)" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-brand-yellow)" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-brand-mint)" }} />
              <div className="flex-1 mx-4 h-5 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
            {/* Preview content */}
            <div
              className="p-6"
              style={{ backgroundColor: "var(--color-white)" }}
            >
              <div className="grid grid-cols-3 gap-4 h-48">
                {/* Left: slide list */}
                <div className="col-span-1 flex flex-col gap-2">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-14 rounded-lg flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: n === 1 ? "var(--color-brand-teal)" : "var(--color-surface)",
                        color: n === 1 ? "white" : "var(--color-muted)",
                        border: `1px solid ${n === 1 ? "transparent" : "var(--color-border)"}`,
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Slide {n}
                    </div>
                  ))}
                </div>
                {/* Middle: graph preview */}
                <div
                  className="col-span-2 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: "#fafafa", border: "1px solid var(--color-border)" }}
                >
                  {/* Fake graph grid */}
                  <svg width="100%" height="100%" viewBox="0 0 240 160">
                    {/* Grid lines */}
                    {[40, 80, 120, 160, 200].map((x) => (
                      <line key={x} x1={x} y1={0} x2={x} y2={160} stroke="#e5e7eb" strokeWidth={0.8} />
                    ))}
                    {[32, 64, 96, 128].map((y) => (
                      <line key={y} x1={0} y1={y} x2={240} y2={y} stroke="#e5e7eb" strokeWidth={0.8} />
                    ))}
                    {/* Axes */}
                    <line x1={120} y1={0} x2={120} y2={160} stroke="#1a1a2e" strokeWidth={1.5} strokeOpacity={0.5} />
                    <line x1={0} y1={80} x2={240} y2={80} stroke="#1a1a2e" strokeWidth={1.5} strokeOpacity={0.5} />
                    {/* Fake curve y = 0.02x^2 - 80 */}
                    <path
                      d="M 0 160 Q 60 20 120 80 Q 180 140 240 60"
                      fill="none"
                      stroke="#1b7888"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    {/* Second expression */}
                    <line x1={0} y1={120} x2={240} y2={40} stroke="#f65e5d" strokeWidth={2.5} strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}
            >
              Everything your math class needs
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--color-muted)" }}>
              Inspired by the best tools — built lighter, faster, and designed for the IB math classroom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: f.bg }}
                >
                  {f.icon}
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {/* Feature checklist */}
          <div className="mt-12 card p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                "No student login required",
                "Join by phone or Chromebook",
                "Instant answer feedback",
                "Live response heatmap",
                "Teacher control bar",
                "Shareable activity links",
                "Mobile-first design",
                "Works offline (partial)",
                "Export results (Phase 2)",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle size={16} style={{ color: "var(--color-brand-mint)", flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}
            >
              Ready in under 3 minutes
            </h2>
            <p className="text-lg" style={{ color: "var(--color-muted)" }}>
              No complex setup. No onboarding videos. Just teach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4"
                  style={{ backgroundColor: step.color, fontFamily: "var(--font-heading)", color: i === 1 ? "var(--color-ink)" : "white" }}
                >
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute"
                    style={{ width: "calc(33% - 2rem)", height: 2, backgroundColor: "var(--color-border)", top: "2rem", left: "calc(33% * " + (i + 1) + ")" }}
                  />
                )}
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-10"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}
          >
            Teachers love it
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <p
                  className="text-base leading-relaxed mb-4"
                  style={{ color: "var(--color-ink-soft)" }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      backgroundColor: "var(--color-brand-teal)",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section
        className="py-24 px-4 sm:px-6 text-center"
        style={{ background: `linear-gradient(135deg, var(--color-brand-teal) 0%, var(--color-brand-teal-dark) 100%)` }}
      >
        <h2
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ready to transform your classroom?
        </h2>
        <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
          Free during beta. No credit card. Cancel anytime. Start teaching better math today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="btn btn-yellow btn-lg w-full sm:w-auto"
          >
            Create your first activity
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/join"
            className="btn btn-lg w-full sm:w-auto text-white border-white/40 hover:bg-white/10"
            style={{ backgroundColor: "transparent", border: "2px solid rgba(255,255,255,0.4)" }}
          >
            <Users size={18} />
            Join as student
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 sm:px-6 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
              R
            </div>
            <span className="font-semibold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
              Rekhachitra
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Features", "Pricing", "Blog", "Contact"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: "var(--color-muted)" }}
              >
                {item}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
            © 2025 Rekhachitra. Built for teachers, with ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}
