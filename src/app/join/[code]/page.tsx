"use client";

import { useState, use, useEffect, useRef, useCallback } from "react";
import { ArrowRight, CheckCircle, XCircle, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DesmosCalculator from "@/components/graph/DesmosCalculator";
import { Avatar } from "@/components/ui/Avatar";
import { useStudentSessionStore } from "@/lib/store/session.store";
import { LS_LIVE_SESSION_PREFIX, LS_STUDENT_PREFIX } from "@/lib/store/session.store";
import type { Session, Slide, Activity, ContentBlock } from "@/types";
import { cn } from "@/lib/utils/cn";
import { generateId } from "@/lib/utils/session";

// ── Option colours ───────────────────────────────────────────────────────────

const OPTION_COLORS = [
  { bg: "#1b7888", light: "rgba(27,120,136,0.08)" },
  { bg: "#f65e5d", light: "rgba(246,94,93,0.08)" },
  { bg: "#2db89e", light: "rgba(45,184,158,0.08)" },
  { bg: "#f5c000", light: "rgba(245,192,0,0.1)" },
];

type StudentStep = "join" | "playing" | "answered" | "ended";

// ── Student progress written to localStorage for teacher dashboard ────────────

interface StudentProgressData {
  id: string;
  name: string;
  avatarSeed: string;
  currentSlide: number;
  totalSlides: number;
  answers: Record<string, { type: string; value: string; correct?: boolean }>;
  score: number;
  joinedAt: string;
  lastSeen: string;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { studentSession, joinSession } = useStudentSessionStore();

  // Live session data read from localStorage (written by teacher's store)
  const [liveSession, setLiveSession] = useState<{ session: Session; activity: Activity } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Student's own navigation (self-paced)
  const [mySlide, setMySlide] = useState(0);

  // Per-slide answer state (keyed by slideId to survive slide changes)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, "correct" | "incorrect">>({});
  const [answeredSlides, setAnsweredSlides] = useState<Set<string>>(new Set());

  const [step, setStep] = useState<StudentStep>("join");
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);

  // Student ID and progress key (set once on join)
  const studentIdRef = useRef<string>("");
  const progressKeyRef = useRef<string>("");
  const scoreRef = useRef(0);
  const joinedAtRef = useRef<string>("");

  // ── Load session from localStorage on mount ──────────────────────────────
  useEffect(() => {
    const lsKey = `${LS_LIVE_SESSION_PREFIX}${code.toLowerCase()}`;
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try { setLiveSession(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setLoaded(true);
  }, [code]);

  // ── Poll every 2 s when session not found yet ────────────────────────────
  useEffect(() => {
    if (!loaded || liveSession) return;
    const lsKey = `${LS_LIVE_SESSION_PREFIX}${code.toLowerCase()}`;
    const interval = setInterval(() => {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        try { setLiveSession(JSON.parse(raw)); } catch { /* ignore */ }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [code, loaded, liveSession]);

  // ── Listen for session end from teacher ──────────────────────────────────
  useEffect(() => {
    const lsKey = `${LS_LIVE_SESSION_PREFIX}${code.toLowerCase()}`;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== lsKey || !e.newValue) return;
      try {
        const updated = JSON.parse(e.newValue) as { session: Session; activity: Activity };
        setLiveSession(updated);
        if (updated.session.status === "ended") setStep("ended");
      } catch { /* ignore */ }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [code]);

  // ── Write student progress to localStorage ───────────────────────────────
  const writeProgress = useCallback((patch: Partial<StudentProgressData>) => {
    const key = progressKeyRef.current;
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      const current: StudentProgressData = raw ? JSON.parse(raw) : {};
      localStorage.setItem(key, JSON.stringify({ ...current, ...patch, lastSeen: new Date().toISOString() }));
    } catch { /* quota */ }
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const activity = liveSession?.activity ?? null;
  const slides = activity?.slides ?? [];
  const slide: Slide | null = slides[mySlide] ?? null;
  const slideId = slide?.id ?? "";
  const isAnswered = answeredSlides.has(slideId);
  const selectedOption = selectedOptions[slideId] ?? null;
  const shortAnswer = shortAnswers[slideId] ?? "";
  const feedback = feedbacks[slideId] ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) { setNameError("Name must be at least 2 characters"); return; }
    setLoading(true);
    setNameError("");
    await new Promise((r) => setTimeout(r, 400));

    if (!liveSession) { setLoading(false); return; }

    const studentId = generateId();
    const avatarSeed = name + liveSession.session.id;
    const now = new Date().toISOString();

    studentIdRef.current = studentId;
    progressKeyRef.current = `${LS_STUDENT_PREFIX}${code.toLowerCase()}_${studentId}`;
    scoreRef.current = 0;
    joinedAtRef.current = now;

    joinSession(liveSession.session, name);

    // Write initial progress so teacher sees student immediately
    const initialProgress: StudentProgressData = {
      id: studentId,
      name,
      avatarSeed,
      currentSlide: 0,
      totalSlides: slides.length,
      answers: {},
      score: 0,
      joinedAt: now,
      lastSeen: now,
    };
    try {
      localStorage.setItem(progressKeyRef.current, JSON.stringify(initialProgress));
    } catch { /* quota */ }

    setLoading(false);
    setStep("playing");
  };

  const handleSlideChange = useCallback((newSlide: number) => {
    setMySlide(newSlide);
    setStep("playing");
    writeProgress({ currentSlide: newSlide });
  }, [writeProgress]);

  const handleSubmitMCQ = (optionId: string) => {
    if (isAnswered) return;
    const cp = slide?.checkpoint;
    if (cp?.type !== "mcq" || !cp.options) return;

    const opt = cp.options.find((o) => o.id === optionId);
    const isCorrect = opt?.isCorrect ?? false;
    const newFeedback = isCorrect ? "correct" : "incorrect";
    const newScore = isCorrect ? scoreRef.current + (cp.points ?? 10) : scoreRef.current;
    scoreRef.current = newScore;

    setSelectedOptions((prev) => ({ ...prev, [slideId]: optionId }));
    setFeedbacks((prev) => ({ ...prev, [slideId]: newFeedback }));
    setAnsweredSlides((prev) => new Set(prev).add(slideId));
    setStep("answered");

    writeProgress({
      answers: {
        ...getAnswers(),
        [slideId]: { type: "mcq", value: opt?.text ?? optionId, correct: isCorrect },
      },
      score: newScore,
    });
  };

  const handleSubmitShortAnswer = () => {
    if (isAnswered || !shortAnswer.trim()) return;
    setAnsweredSlides((prev) => new Set(prev).add(slideId));
    setStep("answered");

    writeProgress({
      answers: {
        ...getAnswers(),
        [slideId]: { type: "short_answer", value: shortAnswer.trim() },
      },
    });
  };

  const handleFreeResponseSubmit = (blockId: string, value: string) => {
    if (!value.trim()) return;
    const key = `free_${blockId}`;
    writeProgress({
      answers: {
        ...getAnswers(),
        [key]: { type: "free_response", value: value.trim() },
      },
    });
  };

  // Helper to get current answers from localStorage
  const getAnswers = (): Record<string, { type: string; value: string; correct?: boolean }> => {
    try {
      const raw = localStorage.getItem(progressKeyRef.current);
      return raw ? (JSON.parse(raw) as StudentProgressData).answers ?? {} : {};
    } catch { return {}; }
  };

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // ── No session yet (teacher hasn't launched or different origin) ──────────
  if (!liveSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-brand-teal)" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", fontFamily: "var(--font-heading)" }}>
            R
          </div>
          <p className="text-3xl font-bold tracking-[0.2em] mb-2"
            style={{ color: "white", fontFamily: "var(--font-heading)" }}>
            {code.slice(0, 3)}-{code.slice(3)}
          </p>
          <h2 className="text-xl font-bold mb-2 text-white" style={{ fontFamily: "var(--font-heading)" }}>
            Waiting for teacher…
          </h2>
          <p className="text-sm text-white/70 mb-6">
            The session will start automatically once the teacher opens it on this device.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
          </div>
          <p className="text-xs text-white/40 mt-6">Checking every 2 seconds…</p>
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
          {scoreRef.current > 0 && (
            <p className="text-lg font-bold mt-3" style={{ color: "var(--color-brand-teal)" }}>
              Your score: {scoreRef.current} pts
            </p>
          )}
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}>
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
              <Input label="Your name" placeholder="e.g. Alex" value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                error={nameError} autoFocus maxLength={30} />
              <Button type="submit" variant="primary" size="lg" loading={loading}
                disabled={displayName.trim().length < 2} className="w-full">
                Start Activity
                <ArrowRight size={18} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing / answered ────────────────────────────────────────────────────

  const checkpoint = slide?.checkpoint;
  const canGoPrev = mySlide > 0;
  const canGoNext = mySlide < slides.length - 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}>
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
          <span className="text-xs hidden sm:block" style={{ color: "var(--color-muted)" }}>
            {mySlide + 1} / {slides.length}
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

      {/* Slide progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => handleSlideChange(i)}
            className="rounded-full transition-all"
            style={{
              width: i === mySlide ? 20 : 8,
              height: 8,
              backgroundColor: answeredSlides.has(slides[i]?.id ?? "")
                ? "var(--color-brand-mint)"
                : i === mySlide
                  ? "var(--color-brand-teal)"
                  : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {/* Slide content */}
      <main className="flex-1 flex flex-col p-4 gap-4 max-w-2xl w-full mx-auto overflow-y-auto">
        {slide && (slide.title || slide.instructions) && (
          <div>
            {slide.title && (
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
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

        {/* Content blocks */}
        {(slide?.content?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-3">
            {slide!.content!.map((block) => (
              <StudentContentBlock key={block.id} block={block} onFreeResponseSubmit={handleFreeResponseSubmit} />
            ))}
          </div>
        )}

        {/* Legacy desmosState */}
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
            <p className="text-base font-semibold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
              {checkpoint.question}
            </p>

            {checkpoint.type === "mcq" && checkpoint.options && (
              <div className="grid grid-cols-1 gap-2">
                {checkpoint.options.map((opt, i) => {
                  const color = OPTION_COLORS[i % OPTION_COLORS.length];
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button key={opt.id} onClick={() => !isAnswered && handleSubmitMCQ(opt.id)}
                      disabled={isAnswered}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl text-left font-medium transition-all border-2",
                        !isAnswered && "hover:scale-[1.01] active:scale-[0.99]",
                        isSelected && opt.isCorrect && "border-[var(--color-brand-mint)]",
                        isSelected && !opt.isCorrect && "border-[var(--color-brand-coral)]",
                        !isSelected && isAnswered && opt.isCorrect && "border-[var(--color-brand-mint)]",
                        !isSelected && (!isAnswered || !opt.isCorrect) && "border-[var(--color-border)]"
                      )}
                      style={{
                        backgroundColor: isSelected
                          ? (isAnswered && opt.isCorrect ? "rgba(45,184,158,0.1)" : isAnswered ? "rgba(246,94,93,0.06)" : color.light)
                          : (isAnswered && opt.isCorrect ? "rgba(45,184,158,0.06)" : "var(--color-white)"),
                        fontFamily: "var(--font-body)",
                      }}>
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: isSelected ? color.bg : "var(--color-surface)", color: isSelected ? "white" : "var(--color-muted)" }}>
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

            {checkpoint.type === "short_answer" && (
              <div className="flex flex-col gap-2">
                <textarea value={shortAnswer}
                  onChange={(e) => setShortAnswers((prev) => ({ ...prev, [slideId]: e.target.value }))}
                  disabled={isAnswered}
                  placeholder="Type your answer here…" rows={3}
                  className="w-full text-sm rounded-xl border px-3 py-2 resize-none outline-none transition-colors"
                  style={{
                    borderColor: "var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-body)",
                    backgroundColor: isAnswered ? "var(--color-surface)" : "var(--color-white)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
                {!isAnswered && (
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
        {feedback === "correct" && (
          <div className="rounded-2xl border-2 p-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(45,184,158,0.08)", borderColor: "var(--color-brand-mint)" }}>
            <CheckCircle size={24} color="var(--color-brand-mint)" />
            <div>
              <p className="font-bold" style={{ color: "var(--color-brand-mint-dark)", fontFamily: "var(--font-heading)" }}>
                Correct! +{slide?.checkpoint?.points ?? 10} pts 🎉
              </p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>Keep going — next slide when ready.</p>
            </div>
          </div>
        )}
        {feedback === "incorrect" && (
          <div className="rounded-2xl border-2 p-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(246,94,93,0.06)", borderColor: "var(--color-brand-coral)" }}>
            <XCircle size={24} color="var(--color-brand-coral)" />
            <div>
              <p className="font-bold" style={{ color: "var(--color-brand-coral-dark)", fontFamily: "var(--font-heading)" }}>
                Not quite — check the answer above
              </p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>Move on when you&apos;re ready.</p>
            </div>
          </div>
        )}
        {isAnswered && !feedback && checkpoint?.type === "short_answer" && (
          <div className="rounded-2xl border-2 p-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(27,120,136,0.06)", borderColor: "var(--color-brand-teal)" }}>
            <CheckCircle size={20} color="var(--color-brand-teal)" />
            <p className="text-sm font-medium" style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-body)" }}>
              Answer submitted! Continue to the next slide.
            </p>
          </div>
        )}

        {/* No slide */}
        {!slide && (
          <p className="text-center py-12 text-sm" style={{ color: "var(--color-muted)" }}>
            No slides in this activity yet.
          </p>
        )}
      </main>

      {/* Self-navigation footer */}
      <footer className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <Button variant="outline" size="sm" onClick={() => handleSlideChange(mySlide - 1)}
          disabled={!canGoPrev} className="gap-1.5">
          <ChevronLeft size={16} />
          Back
        </Button>

        <span className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
          {mySlide + 1} / {slides.length}
        </span>

        {canGoNext ? (
          <Button variant="primary" size="sm" onClick={() => handleSlideChange(mySlide + 1)} className="gap-1.5">
            Next
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled className="gap-1.5 opacity-40">
            Done ✓
          </Button>
        )}
      </footer>
    </div>
  );
}

// ── StudentContentBlock ───────────────────────────────────────────────────────

function StudentContentBlock({
  block,
  onFreeResponseSubmit,
}: {
  block: ContentBlock;
  onFreeResponseSubmit: (blockId: string, value: string) => void;
}) {
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (block.type === "text") {
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl border px-4 py-3"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
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
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          disabled={submitted}
          placeholder={block.placeholder || "Type your response here…"}
          rows={3}
          className="w-full text-sm rounded-xl border px-3 py-2 resize-none outline-none transition-colors"
          style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-body)", backgroundColor: submitted ? "var(--color-surface)" : "var(--color-white)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
        {!submitted ? (
          <Button variant="primary" size="sm" className="self-start"
            disabled={!freeText.trim()}
            onClick={() => { onFreeResponseSubmit(block.id, freeText); setSubmitted(true); }}>
            Submit
          </Button>
        ) : (
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-brand-teal)" }}>
            <CheckCircle size={12} /> Submitted
          </span>
        )}
      </div>
    );
  }

  if (block.type === "graph") {
    return (
      <div className="relative rounded-xl overflow-hidden border" style={{ height: 320, borderColor: "var(--color-border)" }}>
        <DesmosCalculator key={`student-${block.id}`} readOnly initialState={block.desmosState ?? undefined} className="absolute inset-0" />
      </div>
    );
  }

  return null;
}
