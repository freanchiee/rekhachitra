"use client";

import { useState, use } from "react";
import { ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { CountdownTimer } from "@/components/session/CountdownTimer";
import { Avatar } from "@/components/ui/Avatar";
import { useStudentSessionStore } from "@/lib/store/session.store";
import type { Session, Slide } from "@/types";
import { cn } from "@/lib/utils/cn";

// ── Demo session for local preview ─────────────────────────────────────────

const DEMO_SESSION: Session = {
  id: "demo-session",
  activityId: "demo-activity",
  teacherId: "teacher",
  joinCode: "DEMO01",
  status: "waiting",
  currentSlide: 0,
  startedAt: null,
  endedAt: null,
  createdAt: new Date().toISOString(),
  activity: {
    id: "demo-activity",
    teacherId: "teacher",
    title: "Linear Functions Explorer",
    description: "",
    isPublic: true,
    status: "active",
    slides: [
      {
        id: "s1",
        activityId: "demo-activity",
        position: 0,
        type: "graph",
        title: "Explore y = 2x + 1",
        instructions: "Look at the line. What is the slope? What is the y-intercept?",
        graphState: {
          expressions: [{ id: "e1", latex: "y = 2x + 1", type: "equation", color: "#1b7888" }],
          viewport: { xMin: -10, xMax: 10, yMin: -7, yMax: 7 },
          settings: { showGrid: true, showAxes: true, showLabels: true, polarMode: false },
        },
        checkpoint: {
          type: "mcq",
          question: "What is the slope of y = 2x + 1?",
          options: [
            { id: "a", text: "1", isCorrect: false },
            { id: "b", text: "2", isCorrect: true },
            { id: "c", text: "-1", isCorrect: false },
            { id: "d", text: "0.5", isCorrect: false },
          ],
          timeLimit: 30,
          points: 10,
        },
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// ── Option button colors ───────────────────────────────────────────────────

const OPTION_COLORS = [
  { bg: "#1b7888", light: "rgba(27, 120, 136, 0.08)" },
  { bg: "#f65e5d", light: "rgba(246, 94, 93, 0.08)" },
  { bg: "#2db89e", light: "rgba(45, 184, 158, 0.08)" },
  { bg: "#f5c000", light: "rgba(245, 192, 0, 0.1)" },
];

type StudentStep = "join" | "waiting" | "playing" | "answered" | "ended";

// ── Page ──────────────────────────────────────────────────────────────────

export default function StudentJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { studentSession, joinSession, session, hasAnswered, markAnswered, addPoints, updateCurrentSlide } =
    useStudentSessionStore();

  const [step, setStep] = useState<StudentStep>("join");
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [loading, setLoading] = useState(false);

  // Use demo session for MVP
  const activeSession = session ?? DEMO_SESSION;
  const slides = activeSession.activity?.slides ?? [];
  const slide: Slide | null = slides[0] ?? null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setLoading(true);
    setNameError("");
    // In production: POST /api/sessions/:code/join
    await new Promise((r) => setTimeout(r, 800));
    joinSession(activeSession, name);
    if (slide) updateCurrentSlide(slide);
    setLoading(false);
    setStep("waiting");
    // For demo: auto-advance to playing
    setTimeout(() => setStep("playing"), 1500);
  };

  const handleSubmit = (optionId: string) => {
    if (hasAnswered) return;
    setSelectedOption(optionId);
    const checkpoint = slide?.checkpoint;
    if (checkpoint?.type === "mcq" && checkpoint.options) {
      const opt = checkpoint.options.find((o) => o.id === optionId);
      const isCorrect = opt?.isCorrect ?? false;
      setFeedback(isCorrect ? "correct" : "incorrect");
      if (isCorrect && checkpoint.points) addPoints(checkpoint.points);
    }
    markAnswered();
    setStep("answered");
  };

  // ── Join step ────────────────────────────────────────────────────────────

  if (step === "join") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
              R
            </div>
            <h1
              className="text-xl font-bold mb-1"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
            >
              {activeSession.activity?.title ?? "Joining session..."}
            </h1>
            <p className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>
              Session code:
            </p>
            <p
              className="text-2xl font-bold mb-6 tracking-widest"
              style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={displayName.trim().length < 2}
                className="w-full"
              >
                Join
                <ArrowRight size={18} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting room ─────────────────────────────────────────────────────────

  if (step === "waiting") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--color-brand-teal)" }}
      >
        <div className="text-center">
          {studentSession && (
            <div className="flex justify-center mb-4">
              <Avatar seed={studentSession.avatarSeed} name={studentSession.displayName} size="lg" />
            </div>
          )}
          <h2
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Hi, {displayName}! 👋
          </h2>
          <p className="text-white/80 mb-6">
            You&apos;re in. Waiting for the teacher to start...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Playing (slide shown) ─────────────────────────────────────────────────

  const checkpoint = slide?.checkpoint;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
          >
            R
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            {activeSession.activity?.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {studentSession && (
            <div className="flex items-center gap-2">
              <Avatar seed={studentSession.avatarSeed} name={studentSession.displayName} size="sm" />
              <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--color-ink-soft)" }}>
                {studentSession.displayName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(45, 184, 158, 0.1)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-mint)] animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: "var(--color-brand-mint)" }}>
              LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-4 gap-4 max-w-2xl w-full mx-auto">
        {/* Slide info */}
        {slide && (
          <div>
            {slide.title && (
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
              >
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

        {/* Graph */}
        {slide?.graphState && (
          <GraphCanvas
            state={slide.graphState}
            readOnly
            className="min-h-52"
          />
        )}

        {/* Checkpoint / question */}
        {checkpoint && checkpoint.type !== "none" && (
          <div className="card p-4 flex flex-col gap-3">
            {/* Timer */}
            {checkpoint.timeLimit && step !== "answered" && (
              <div className="flex items-center justify-between">
                <p
                  className="text-base font-semibold"
                  style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
                >
                  {checkpoint.question}
                </p>
                <CountdownTimer seconds={checkpoint.timeLimit} size="sm" />
              </div>
            )}
            {(step === "answered" || !checkpoint.timeLimit) && (
              <p
                className="text-base font-semibold"
                style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
              >
                {checkpoint.question}
              </p>
            )}

            {/* MCQ options */}
            {checkpoint.type === "mcq" && checkpoint.options && (
              <div className="grid grid-cols-1 gap-2">
                {checkpoint.options.map((opt, i) => {
                  const color = OPTION_COLORS[i % OPTION_COLORS.length];
                  const isSelected = selectedOption === opt.id;
                  const isAnswered = step === "answered";
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !hasAnswered && handleSubmit(opt.id)}
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
                          ? isAnswered && opt.isCorrect
                            ? "rgba(45, 184, 158, 0.1)"
                            : isAnswered
                            ? "rgba(246, 94, 93, 0.06)"
                            : color.light
                          : isAnswered && opt.isCorrect
                          ? "rgba(45, 184, 158, 0.06)"
                          : "var(--color-white)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          backgroundColor: isSelected ? color.bg : "var(--color-surface)",
                          color: isSelected ? "white" : "var(--color-muted)",
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ color: "var(--color-ink)" }}>{opt.text}</span>
                      {isAnswered && isSelected && (
                        <span className="ml-auto">
                          {opt.isCorrect ? (
                            <CheckCircle size={20} color="var(--color-brand-mint)" />
                          ) : (
                            <XCircle size={20} color="var(--color-brand-coral)" />
                          )}
                        </span>
                      )}
                      {isAnswered && !isSelected && opt.isCorrect && (
                        <span className="ml-auto">
                          <CheckCircle size={20} color="var(--color-brand-mint)" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Feedback banner */}
        {step === "answered" && feedback && (
          <div
            className="card p-4 flex items-center gap-3"
            style={{
              backgroundColor: feedback === "correct" ? "rgba(45, 184, 158, 0.08)" : "rgba(246, 94, 93, 0.06)",
              borderColor: feedback === "correct" ? "var(--color-brand-mint)" : "var(--color-brand-coral)",
              borderWidth: 2,
            }}
          >
            {feedback === "correct" ? (
              <CheckCircle size={24} color="var(--color-brand-mint)" />
            ) : (
              <XCircle size={24} color="var(--color-brand-coral)" />
            )}
            <div>
              <p
                className="font-bold"
                style={{
                  color: feedback === "correct" ? "var(--color-brand-mint-dark)" : "var(--color-brand-coral-dark)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {feedback === "correct" ? "Correct! +10 pts 🎉" : "Not quite — check the answer"}
              </p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                {feedback === "correct"
                  ? "Great work! Waiting for the next question..."
                  : "Keep going — next question coming up!"}
              </p>
            </div>
          </div>
        )}

        {step === "answered" && !feedback && (
          <div
            className="card p-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(27, 120, 136, 0.06)", borderColor: "var(--color-brand-teal)", borderWidth: 2 }}
          >
            <Clock size={20} color="var(--color-brand-teal)" />
            <p className="text-sm font-medium" style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-body)" }}>
              Answer submitted! Waiting for next question...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
