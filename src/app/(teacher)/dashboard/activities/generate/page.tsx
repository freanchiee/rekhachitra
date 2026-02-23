"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, ChevronRight, BarChart2, MessageSquare,
  CheckSquare, ChevronDown, Eye, EyeOff, ExternalLink, KeyRound,
} from "lucide-react";
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

const PROVIDERS = [
  {
    id: "anthropic" as const,
    name: "Anthropic (Claude)",
    model: "claude-sonnet-4-6",
    keyHint: "Starts with sk-ant-",
    keyPlaceholder: "sk-ant-api03-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "gemini" as const,
    name: "Google Gemini",
    model: "gemini-2.0-flash",
    keyHint: "Starts with AIza",
    keyPlaceholder: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "deepseek" as const,
    name: "DeepSeek",
    model: "deepseek-chat",
    keyHint: "Starts with sk-",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "minimax" as const,
    name: "Minimax",
    model: "MiniMax-Text-01",
    keyHint: "Bearer token from Minimax dashboard",
    keyPlaceholder: "eyJ...",
    docsUrl: "https://platform.minimaxi.com/user-center/basic-information/interface-key",
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

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

  // Provider / API key state
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Page state
  const [phase, setPhase] = useState<Phase>("form");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Activity | null>(null);

  // ── Persist provider config in localStorage ────────────────────────────────

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rk_ai_config");
      if (saved) {
        const { provider: p, apiKey: k } = JSON.parse(saved) as { provider?: string; apiKey?: string };
        const validProvider = PROVIDERS.find((pr) => pr.id === p);
        if (validProvider) setProvider(validProvider.id);
        if (k) setApiKey(k);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("rk_ai_config", JSON.stringify({ provider, apiKey }));
    } catch {
      // ignore storage errors
    }
  }, [provider, apiKey]);

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
        body: JSON.stringify({ description, objectives, gradeLevel, numSlides, style, provider, apiKey }),
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
            provider={provider} setProvider={setProvider}
            apiKey={apiKey} setApiKey={setApiKey}
            showKey={showKey} setShowKey={setShowKey}
            showProviderConfig={showProviderConfig} setShowProviderConfig={setShowProviderConfig}
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
  provider, setProvider,
  apiKey, setApiKey,
  showKey, setShowKey,
  showProviderConfig, setShowProviderConfig,
  error, onGenerate,
}: {
  description: string; setDescription: (v: string) => void;
  objectives: string; setObjectives: (v: string) => void;
  gradeLevel: string; setGradeLevel: (v: string) => void;
  numSlides: number; setNumSlides: (v: number) => void;
  style: string; setStyle: (v: string) => void;
  provider: ProviderId; setProvider: (v: ProviderId) => void;
  apiKey: string; setApiKey: (v: string) => void;
  showKey: boolean; setShowKey: (v: boolean) => void;
  showProviderConfig: boolean; setShowProviderConfig: (v: boolean) => void;
  error: string | null;
  onGenerate: () => void;
}) {
  const activeProvider = PROVIDERS.find((p) => p.id === provider)!;
  const needsKey = provider !== "anthropic" && !apiKey.trim();

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

      {/* ── AI Provider config ────────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}
      >
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => setShowProviderConfig(!showProviderConfig)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
          style={{ color: "var(--color-ink)" }}
        >
          <div className="flex items-center gap-2">
            <KeyRound size={15} style={{ color: "var(--color-muted)" }} />
            <span>AI Provider</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(27,120,136,0.1)", color: "var(--color-brand-teal)" }}
            >
              {activeProvider.name}
            </span>
          </div>
          <ChevronDown
            size={16}
            style={{
              color: "var(--color-muted)",
              transform: showProviderConfig ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {/* Expanded panel */}
        {showProviderConfig && (
          <div
            className="px-4 pb-4 flex flex-col gap-4 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p className="text-xs pt-3" style={{ color: "var(--color-muted)" }}>
              Bring your own API key. Your key is stored only in this browser and sent to our server solely to make this request.
            </p>

            {/* Provider selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className="flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all"
                    style={{
                      borderColor: provider === p.id ? "var(--color-brand-teal)" : "var(--color-border)",
                      backgroundColor: provider === p.id ? "rgba(27,120,136,0.06)" : "var(--color-surface)",
                      color: "var(--color-ink)",
                    }}
                  >
                    <span className="text-xs font-semibold">{p.name}</span>
                    <span className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{p.model}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* API key input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                  API Key
                </label>
                <a
                  href={activeProvider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--color-brand-teal)" }}
                >
                  Get your key <ExternalLink size={11} />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={activeProvider.keyPlaceholder}
                  className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none font-mono"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-ink)",
                    backgroundColor: "var(--color-surface)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-muted)" }}
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
                {activeProvider.keyHint}
              </p>
            </div>

            {/* Warning if non-Anthropic provider has no key */}
            {needsKey && (
              <div
                className="rounded-lg px-3 py-2 text-xs"
                style={{ backgroundColor: "rgba(246,165,0,0.1)", color: "#b45309" }}
              >
                An API key is required to use {activeProvider.name}. Paste it above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "rgba(246,94,93,0.08)", color: "var(--color-brand-coral)" }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={onGenerate}
        disabled={!description.trim() || needsKey}
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
