"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, ChevronRight, BarChart2, MessageSquare, CheckSquare } from "lucide-react";
import { useBuilderStore } from "@/lib/store/session.store";
import type { Activity } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_LEVELS = [
  "Middle School (Grades 6–8)",
  "High School (Grades 9–10)",
  "High School Advanced (Grades 11–12)",
  "University / College",
];

const STYLES = [
  { value: "exploration", label: "Exploration", desc: "Students discover concepts by manipulating graphs" },
  { value: "guided", label: "Guided Practice", desc: "Step-by-step scaffolded problem solving" },
  { value: "assessment", label: "Assessment", desc: "Mix of questions to check understanding" },
];

const LOADING_MESSAGES = [
  "Reading your objectives...",
  "Designing the activity flow...",
  "Writing Desmos graph states...",
  "Crafting student instructions...",
  "Building checkpoint questions...",
  "Polishing the activity...",
];

type Phase = "form" | "loading" | "preview";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GenerateActivityPage() {
  const router = useRouter();
  const { setPendingActivity } = useBuilderStore();

  // Form state
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [gradeLevel, setGradeLevel] = useState(GRADE_LEVELS[1]);
  const [numSlides, setNumSlides] = useState(5);
  const [style, setStyle] = useState("exploration");

  // Page state
  const [phase, setPhase] = useState<Phase>("form");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Activity | null>(null);

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setError(null);
    setPhase("loading");

    // Cycle through loading messages while waiting
    let msgIdx = 0;
    const ticker = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 1800);

    try {
      const res = await fetch("/api/activities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, objectives, gradeLevel, numSlides, style }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Generation failed");
      }

      setGenerated(data.activity as Activity);
      setPhase("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("form");
    } finally {
      clearInterval(ticker);
    }
  };

  const handleOpenInBuilder = () => {
    if (!generated) return;
    setPendingActivity(generated);
    router.push("/dashboard/activities/new");
  };

  // ── Render phases ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3 border-b"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <Link href="/dashboard/activities" className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-muted)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: "var(--color-brand-yellow)" }} />
          <span className="text-base font-bold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            Generate Activity with AI
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {phase === "form" && (
          <FormPhase
            description={description} setDescription={setDescription}
            objectives={objectives} setObjectives={setObjectives}
            gradeLevel={gradeLevel} setGradeLevel={setGradeLevel}
            numSlides={numSlides} setNumSlides={setNumSlides}
            style={style} setStyle={setStyle}
            error={error}
            onGenerate={handleGenerate}
          />
        )}

        {phase === "loading" && <LoadingPhase message={loadingMsg} numSlides={numSlides} />}

        {phase === "preview" && generated && (
          <PreviewPhase activity={generated} onOpenInBuilder={handleOpenInBuilder} onRegenerate={() => setPhase("form")} />
        )}
      </div>
    </div>
  );
}

// ── Form phase ────────────────────────────────────────────────────────────────

function FormPhase({
  description, setDescription,
  objectives, setObjectives,
  gradeLevel, setGradeLevel,
  numSlides, setNumSlides,
  style, setStyle,
  error, onGenerate,
}: {
  description: string; setDescription: (v: string) => void;
  objectives: string; setObjectives: (v: string) => void;
  gradeLevel: string; setGradeLevel: (v: string) => void;
  numSlides: number; setNumSlides: (v: number) => void;
  style: string; setStyle: (v: string) => void;
  error: string | null;
  onGenerate: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Intro */}
      <div className="text-center pb-2">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ backgroundColor: "rgba(245, 192, 0, 0.12)" }}
        >
          <Sparkles size={28} style={{ color: "var(--color-brand-yellow)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
          Describe your activity
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Tell the AI what you want to teach. It will generate a complete multi-slide Desmos activity — sliders, equations, questions and all.
        </p>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
          What is this activity about? <span style={{ color: "var(--color-brand-coral)" }}>*</span>
        </label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`e.g. "Exploring rest vs motion — students place a point (a,b) on a graph, use sliders to move it, and discover what motion means in terms of changing coordinates. Then animate 1D motion with x = x₀ + vt."`}
          className="w-full rounded-xl border p-3 text-sm resize-none outline-none transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-ink)",
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--color-white)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* Objectives */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
          Learning objectives <span className="font-normal" style={{ color: "var(--color-muted)" }}>(optional)</span>
        </label>
        <textarea
          rows={3}
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          placeholder={`e.g. "Students can define rest and motion using coordinates. Students can describe the effect of changing x and y values on position."`}
          className="w-full rounded-xl border p-3 text-sm resize-none outline-none transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-ink)",
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--color-white)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* Options row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Grade */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            Grade level
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", backgroundColor: "var(--color-white)" }}
          >
            {GRADE_LEVELS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>

        {/* Slides */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            Slides
          </label>
          <input
            type="number" min={3} max={10}
            value={numSlides}
            onChange={(e) => setNumSlides(Math.max(3, Math.min(10, Number(e.target.value))))}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", backgroundColor: "var(--color-white)" }}
          />
        </div>

        {/* Style */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            Style
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", backgroundColor: "var(--color-white)" }}
          >
            {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Style description */}
      <p className="text-xs -mt-3" style={{ color: "var(--color-muted)" }}>
        {STYLES.find((s) => s.value === style)?.desc}
      </p>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "rgba(246,94,93,0.08)", color: "var(--color-brand-coral)" }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={onGenerate}
        disabled={!description.trim()}
        className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "var(--color-brand-teal)", color: "white", fontFamily: "var(--font-body)" }}
      >
        <Sparkles size={16} />
        Generate Activity
      </button>
    </div>
  );
}

// ── Loading phase ─────────────────────────────────────────────────────────────

function LoadingPhase({ message, numSlides }: { message: string; numSlides: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
      {/* Animated spinner */}
      <div className="relative w-20 h-20">
        <div
          className="absolute inset-0 rounded-full border-4 animate-spin"
          style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={28} style={{ color: "var(--color-brand-yellow)" }} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
          Building your activity...
        </h2>
        <p className="text-sm transition-all" style={{ color: "var(--color-muted)" }}>{message}</p>
      </div>

      {/* Slide count preview */}
      <div className="flex gap-2">
        {Array.from({ length: numSlides }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-10 rounded-lg animate-pulse"
            style={{
              backgroundColor: "var(--color-border)",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
        This usually takes 10–20 seconds
      </p>
    </div>
  );
}

// ── Preview phase ─────────────────────────────────────────────────────────────

function PreviewPhase({
  activity,
  onOpenInBuilder,
  onRegenerate,
}: {
  activity: Activity;
  onOpenInBuilder: () => void;
  onRegenerate: () => void;
}) {
  const slides = activity.slides ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
          style={{ backgroundColor: "rgba(45, 184, 158, 0.12)" }}
        >
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
          {activity.title}
        </h1>
        {activity.description && (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>{activity.description}</p>
        )}
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
            {slides.length} slides
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
            {slides.filter((s) => s.desmosState).length} with Desmos
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
            {slides.filter((s) => s.checkpoint).length} questions
          </span>
        </div>
      </div>

      {/* Slide cards */}
      <div className="flex flex-col gap-3">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: "var(--color-brand-teal)" }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
                  {slide.title}
                </p>
                <p className="text-xs line-clamp-2" style={{ color: "var(--color-muted)" }}>
                  {slide.instructions}
                </p>
                <div className="flex gap-2 mt-2">
                  {slide.desmosState && (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "rgba(27,120,136,0.1)", color: "var(--color-brand-teal)" }}
                    >
                      <BarChart2 size={10} /> Desmos
                    </span>
                  )}
                  {slide.checkpoint?.type === "mcq" && (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "rgba(45,184,158,0.1)", color: "var(--color-brand-mint)" }}
                    >
                      <CheckSquare size={10} /> MCQ
                    </span>
                  )}
                  {slide.checkpoint?.type === "short_answer" && (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "rgba(246,94,93,0.1)", color: "var(--color-brand-coral)" }}
                    >
                      <MessageSquare size={10} /> Free response
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRegenerate}
          className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-ink-soft)",
            backgroundColor: "var(--color-white)",
          }}
        >
          ↺ Regenerate
        </button>
        <button
          onClick={onOpenInBuilder}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--color-brand-teal)" }}
        >
          Open in Builder
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="text-xs text-center" style={{ color: "var(--color-subtle)" }}>
        You can edit every slide, swap questions, and adjust Desmos states in the builder before publishing.
      </p>
    </div>
  );
}
