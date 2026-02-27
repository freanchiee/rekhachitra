"use client";

import { useState, use, useEffect } from "react";
import { ArrowRight, CheckCircle, XCircle, Clock, WifiOff, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DesmosCalculator from "@/components/graph/DesmosCalculator";
import { CountdownTimer } from "@/components/session/CountdownTimer";
import { Avatar } from "@/components/ui/Avatar";
import { useStudentSessionStore } from "@/lib/store/session.store";
import { LS_LIVE_SESSION_PREFIX } from "@/lib/store/session.store";
import type { Session, Slide, Activity, ContentBlock } from "@/types";
import { cn } from "@/lib/utils/cn";

// ── Option colours ───────────────────────────────────────────────────────────

const OPTION_COLORS = [
  { bg: "#1b7888", light: "rgba(27,120,136,0.08)" },
  { bg: "#f65e5d", light: "rgba(246,94,93,0.08)" },
  { bg: "#2db89e", light: "rgba(45,184,158,0.08)" },
  { bg: "#f5c000", light: "rgba(245,192,0,0.1)" },
];

type StudentStep = "join" | "waiting" | "playing" | "answered" | "ended";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { studentSession, joinSession, hasAnswered, markAnswered, addPoints, updateCurrentSlide } =
    useStudentSessionStore();

  // Live session data read from localStorage (written by teacher's store)
  const [liveSession, setLiveSession] = useState<{ session: Session; activity: Activity } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [step, setStep] = useState<StudentStep>("join");
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Load session from localStorage on mount ──────────────────────────────
  useEffect(() => {
    const lsKey = `${LS_LIVE_SESSION_PREFIX}${code.toLowerCase()}`;
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        setLiveSession(JSON.parse(raw));
      } catch {
        setLoadError(true);
      }
    } else {
      setLoadError(true);
    }
    setLoaded(true);
  }, [code]);

  // ── Listen for slide advances from teacher (storage event = cross-tab) ───
  useEffect(() => {
    const lsKey = `${LS_LIVE_SESSION_PREFIX}${code.toLowerCase()}`;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== lsKey || !e.newValue) return;
      try {
        const updated = JSON.parse(e.newValue) as { session: Session; activity: Activity };
        setLiveSession(updated);
        // If session ended, show the end screen
        if (updated.session.status === "ended") {
          setStep("ended");
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [code]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const activity = liveSession?.activity ?? null;
  const currentSlideIndex = liveSession?.session.currentSlide ?? 0;
  const slides = activity?.slides ?? [];
  const slide: Slide | null = slides[currentSlideIndex] ?? null;

  // When teacher advances the slide, reset per-slide state
  useEffect(() => {
    if (step !== "playing" && step !== "answered") return;
    setSelectedOption(null);
    setShortAnswer("");
    setFeedback(null);
    if (slide) updateCurrentSlide(slide);
    // If we were "answered" on the previous slide, go back to "playing" on the new one
    setStep("playing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlideIndex]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) { setNameError("Name must be at least 2 characters"); return; }
    setLoading(true);
    setNameError("");
    await new Promise((r) => setTimeout(r, 600));
    if (liveSession) {
      joinSession(liveSession.session, name);
      if (slide) updateCurrentSlide(slide);
    }
    setLoading(false);
    setStep("waiting");
    setTimeout(() => setStep("playing"), 1200);
  };

  const handleSubmitMCQ = (optionId: string) => {
    if (hasAnswered) return;
    setSelectedOption(optionId);
    const cp = slide?.checkpoint;
    if (cp?.type === "mcq" && cp.options) {
      const opt = cp.options.find((o) => o.id === optionId);
      const isCorrect = opt?.isCorrect ?? false;
      setFeedback(isCorrect ? "correct" : "incorrect");
      if (isCorrect && cp.points) addPoints(cp.points);
    }
    markAnswered();
    setStep("answered");
  };

  const handleSubmitShortAnswer = () => {
    if (hasAnswered || !shortAnswer.trim()) return;
    markAnswered();
    setStep("answered");
  };

  // ── Loading / not-found states ────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (loadError || !liveSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="text-center max-w-sm">
          <WifiOff size={40} className="mx-auto mb-4" style={{ color: "var(--color-muted)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            Session not found
          </h2>
          <p className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
            No live session found for code <span className="font-bold tracking-wider" style={{ color: "var(--color-brand-teal)" }}>{code.slice(0,3)}-{code.slice(3)}</span>.
          </p>
          <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
            Make sure the teacher has launched the session on this device, or ask for the correct code.
          </p>
        </div>
      </div>
    );
  }

  // ── Session ended ─────────────────────────────────────────────────────────

  if (step === "ended" || liveSession.session.status === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            Session ended
          </h2>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Thanks for participating in <strong>{activity?.title}</strong>!
          </p>
        </div>
      </div>
    );
  }

  // ── Join form ─────────────────────────────────────────────────────────────

  if (step === "join") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
              R
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
              {activity?.title ?? "Joining session…"}
            </h1>
            {activity?.description && (
              <p className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>{activity.description}</p>
            )}
            <p className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>Session code:</p>
            <p className="text-2xl font-bold mb-6 tracking-widest" style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}>
              {code.slice(0, 3)}-{code.slice(3)}
            </p>
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <Input
                label="Your name"
                placeholder="e.g. Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                error={nameError}
                autoFocus
                maxLength={30}
              />
              <Button type="submit" variant="primary" size="lg" loading={loading}
                disabled={displayName.trim().length < 2} className="w-full">
                Join
                <ArrowRight size={18} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting room ──────────────────────────────────────────────────────────

  if (step === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-brand-teal)" }}>
        <div className="text-center">
          {studentSession && (
            <div className="flex justify-center mb-4">
              <Avatar seed={studentSession.avatarSeed} name={studentSession.displayName} size="lg" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Hi, {displayName}! 👋
          </h2>
          <p className="text-white/80 mb-6">You&apos;re in. Waiting for the teacher…</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Playing (and answered) ────────────────────────────────────────────────

  const checkpoint = slide?.checkpoint;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}>
            R
          </div>
          <span className="text-sm font-semibold truncate max-w-[160px]"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            {activity?.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Slide progress */}
          <span className="text-xs hidden sm:block" style={{ color: "var(--color-muted)" }}>
            {currentSlideIndex + 1} / {slides.length}
          </span>
          {studentSession && (
            <div className="flex items-center gap-2">
              <Avatar seed={studentSession.avatarSeed} name={studentSession.displayName} size="sm" />
              <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--color-ink-soft)" }}>
                {studentSession.displayName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(45,184,158,0.1)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-mint)] animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: "var(--color-brand-mint)" }}>LIVE</span>
          </div>
        </div>
      </header>

      {/* Slide content */}
      <main className="flex-1 flex flex-col p-4 gap-4 max-w-2xl w-full mx-auto overflow-y-auto">
        {/* Slide title + instructions */}
        {slide && (slide.title || slide.instructions) && (
          <div>
            {slide.title && (
              <h2 className="text-xl font-bold mb-1"
                style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
                {slide.title}
              </h2>
            )}
            {slide.instructions && (
              <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
                {slide.instructions}
              </p>
            )}
          </div>
        )}

        {/* Content blocks (new block-based slides) */}
        {(slide?.content?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-3">
            {slide!.content!.map((block) => (
              <StudentContentBlock key={block.id} block={block} />
            ))}
          </div>
        )}

        {/* Legacy desmosState (AI-generated activities before migration) */}
        {(slide?.content?.length ?? 0) === 0 && slide?.desmosState && (
          <div className="relative w-full rounded-xl overflow-hidden border"
            style={{ height: 320, borderColor: "var(--color-border)" }}>
            <DesmosCalculator key={slide.id} readOnly initialState={slide.desmosState} className="absolute inset-0" />
          </div>
        )}

        {/* Checkpoint */}
        {checkpoint && checkpoint.type !== "none" && (
          <div className="rounded-2xl border p-4 flex flex-col gap-3"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}>

            {/* Question + timer */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold flex-1"
                style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
                {checkpoint.question}
              </p>
              {checkpoint.timeLimit && step !== "answered" && (
                <CountdownTimer seconds={checkpoint.timeLimit} size="sm" />
              )}
            </div>

            {/* MCQ */}
            {checkpoint.type === "mcq" && checkpoint.options && (
              <div className="grid grid-cols-1 gap-2">
                {checkpoint.options.map((opt, i) => {
                  const color = OPTION_COLORS[i % OPTION_COLORS.length];
                  const isSelected = selectedOption === opt.id;
                  const isAnswered = step === "answered";
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !hasAnswered && handleSubmitMCQ(opt.id)}
                      disabled={hasAnswered}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl text-left font-medium transition-all border-2",
                        !hasAnswered && "hover:scale-[1.01] active:scale-[0.99]",
                        isSelected && opt.isCorrect && "border-[var(--color-brand-mint)]",
                        isSelected && !opt.isCorrect && "border-[var(--color-brand-coral)]",
                        !isSelected && isAnswered && opt.isCorrect && "border-[var(--color-brand-mint)]",
                        !isSelected && (!isAnswered || !opt.isCorrect) && "border-[var(--color-border)]"
                      )}
                      style={{
                        backgroundColor: isSelected
                          ? isAnswered && opt.isCorrect ? "rgba(45,184,158,0.1)" : isAnswered ? "rgba(246,94,93,0.06)" : color.light
                          : isAnswered && opt.isCorrect ? "rgba(45,184,158,0.06)" : "var(--color-white)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: isSelected ? color.bg : "var(--color-surface)", color: isSelected ? "white" : "var(--color-muted)" }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ color: "var(--color-ink)" }}>{opt.text}</span>
                      {isAnswered && isSelected && (
                        <span className="ml-auto">
                          {opt.isCorrect ? <CheckCircle size={20} color="var(--color-brand-mint)" /> : <XCircle size={20} color="var(--color-brand-coral)" />}
                        </span>
                      )}
                      {isAnswered && !isSelected && opt.isCorrect && (
                        <span className="ml-auto"><CheckCircle size={20} color="var(--color-brand-mint)" /></span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short answer */}
            {checkpoint.type === "short_answer" && (
              <div className="flex flex-col gap-2">
                <textarea
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  disabled={step === "answered"}
                  placeholder="Type your answer here…"
                  rows={3}
                  className="w-full text-sm rounded-xl border px-3 py-2 resize-none outline-none transition-colors"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-ink)",
                    fontFamily: "var(--font-body)",
                    backgroundColor: step === "answered" ? "var(--color-surface)" : "var(--color-white)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
                {step !== "answered" && (
                  <Button variant="primary" onClick={handleSubmitShortAnswer}
                    disabled={!shortAnswer.trim()} className="self-start">
                    Submit
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback banner */}
        {step === "answered" && feedback && (
          <div className="rounded-2xl border-2 p-4 flex items-center gap-3"
            style={{
              backgroundColor: feedback === "correct" ? "rgba(45,184,158,0.08)" : "rgba(246,94,93,0.06)",
              borderColor: feedback === "correct" ? "var(--color-brand-mint)" : "var(--color-brand-coral)",
            }}
          >
            {feedback === "correct"
              ? <CheckCircle size={24} color="var(--color-brand-mint)" />
              : <XCircle size={24} color="var(--color-brand-coral)" />}
            <div>
              <p className="font-bold"
                style={{ color: feedback === "correct" ? "var(--color-brand-mint-dark)" : "var(--color-brand-coral-dark)", fontFamily: "var(--font-heading)" }}>
                {feedback === "correct" ? "Correct! +10 pts 🎉" : "Not quite — check the answer above"}
              </p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Waiting for the next slide…
              </p>
            </div>
          </div>
        )}

        {step === "answered" && !feedback && (
          <div className="rounded-2xl border-2 p-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(27,120,136,0.06)", borderColor: "var(--color-brand-teal)" }}>
            <Clock size={20} color="var(--color-brand-teal)" />
            <p className="text-sm font-medium" style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-body)" }}>
              Answer submitted! Waiting for the next slide…
            </p>
          </div>
        )}

        {/* No content */}
        {!slide && (
          <p className="text-center py-12 text-sm" style={{ color: "var(--color-muted)" }}>
            Waiting for the teacher to start the activity…
          </p>
        )}
      </main>
    </div>
  );
}

// ── StudentContentBlock ───────────────────────────────────────────────────────

function StudentContentBlock({ block }: { block: ContentBlock }) {
  if (block.type === "text") {
    return (
      <div
        className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl border px-4 py-3"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-white)",
          color: "var(--color-ink)",
          fontFamily: "var(--font-body)",
        }}
      >
        {block.content}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
        {block.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.url} alt={block.caption ?? ""} className="w-full object-contain max-h-64"
            style={{ backgroundColor: "var(--color-surface)" }} />
        ) : (
          <div className="flex items-center justify-center py-10 gap-2 text-sm"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-subtle)" }}>
            <ImageIcon size={18} /> No image
          </div>
        )}
        {block.caption && (
          <p className="text-xs text-center py-2" style={{ color: "var(--color-muted)" }}>{block.caption}</p>
        )}
      </div>
    );
  }

  if (block.type === "free_response") {
    return (
      <div className="rounded-xl border p-4 flex flex-col gap-2"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}>
        {block.prompt && (
          <p className="text-sm font-semibold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
            {block.prompt}
          </p>
        )}
        <textarea
          placeholder={block.placeholder || "Type your response here…"}
          rows={3}
          className="w-full text-sm rounded-xl border px-3 py-2 resize-none outline-none transition-colors"
          style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-body)", backgroundColor: "var(--color-surface)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>
    );
  }

  if (block.type === "graph") {
    return (
      <div className="relative rounded-xl overflow-hidden border" style={{ height: 320, borderColor: "var(--color-border)" }}>
        <DesmosCalculator
          key={`student-${block.id}`}
          readOnly
          initialState={block.desmosState ?? undefined}
          className="absolute inset-0"
        />
      </div>
    );
  }

  return null;
}
