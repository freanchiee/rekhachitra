"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Square, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JoinCodeDisplay } from "@/components/session/JoinCodeDisplay";
import { ResponseGrid } from "@/components/session/ResponseGrid";
import { SessionLeaderboard } from "@/components/session/SessionLeaderboard";
import { CountdownTimer } from "@/components/session/CountdownTimer";
import DesmosCalculator from "@/components/graph/DesmosCalculator";
import { useTeacherSessionStore } from "@/lib/store/session.store";
import type { Activity, Slide, StudentSession } from "@/types";
import { Badge } from "@/components/ui/Badge";

// ── Demo data for local-first MVP ──────────────────────────────────────────

const DEMO_ACTIVITY: Activity = {
  id: "demo-session",
  teacherId: "local-teacher",
  title: "Linear Functions Explorer",
  description: "Explore y = mx + b",
  isPublic: false,
  status: "active",
  slides: [
    {
      id: "s1",
      activityId: "demo-session",
      position: 0,
      type: "graph",
      title: "Explore y = 2x + 1",
      instructions: "Look at the line. What is the slope? What is the y-intercept?",
      graphState: null,
      desmosState: {
        version: 11,
        graph: { viewport: { xmin: -10, ymin: -7, xmax: 10, ymax: 7 } },
        expressions: { list: [{ type: "expression", id: "1", color: "#1b7888", latex: "y=2x+1" }] },
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
    {
      id: "s2",
      activityId: "demo-session",
      position: 1,
      type: "graph",
      title: "Compare two lines",
      instructions: "Which line has a steeper slope?",
      graphState: null,
      desmosState: {
        version: 11,
        graph: { viewport: { xmin: -10, ymin: -7, xmax: 10, ymax: 7 } },
        expressions: {
          list: [
            { type: "expression", id: "1", color: "#1b7888", latex: "y=3x+1" },
            { type: "expression", id: "2", color: "#f65e5d", latex: "y=x-2" },
          ],
        },
      },
      checkpoint: {
        type: "mcq",
        question: "Which line is steeper?",
        options: [
          { id: "a", text: "y = 3x + 1 (teal)", isCorrect: true },
          { id: "b", text: "y = x − 2 (coral)", isCorrect: false },
          { id: "c", text: "They are the same", isCorrect: false },
          { id: "d", text: "Cannot tell", isCorrect: false },
        ],
        timeLimit: 30,
        points: 10,
      },
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Demo students
const DEMO_STUDENTS: StudentSession[] = [
  { id: "st1", sessionId: "s", displayName: "Alex Chen", avatarSeed: "alex", score: 10, joinedAt: "", lastSeen: "" },
  { id: "st2", sessionId: "s", displayName: "Priya M", avatarSeed: "priya", score: 0, joinedAt: "", lastSeen: "" },
  { id: "st3", sessionId: "s", displayName: "Jonas K", avatarSeed: "jonas", score: 10, joinedAt: "", lastSeen: "" },
  { id: "st4", sessionId: "s", displayName: "Amara L", avatarSeed: "amara", score: 0, joinedAt: "", lastSeen: "" },
  { id: "st5", sessionId: "s", displayName: "Seo-Yeon", avatarSeed: "seoyeon", score: 10, joinedAt: "", lastSeen: "" },
];

// ── Page ──────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { session, startSession, endSession, advanceSlide, students, responses } =
    useTeacherSessionStore();
  const [demoStarted, setDemoStarted] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);

  const handleStart = useCallback(() => {
    startSession(DEMO_ACTIVITY);
    // Inject demo students for local preview
    DEMO_STUDENTS.forEach((st) => useTeacherSessionStore.getState().addStudent(st));
    setDemoStarted(true);
  }, [startSession]);

  const handleAdvance = (dir: 1 | -1) => {
    advanceSlide(dir);
    setTimerKey((k) => k + 1);
    setTimerPaused(false);
  };

  const currentSlide: Slide | null =
    session?.activity?.slides?.[session.currentSlide] ?? null;

  const totalSlides = session?.activity?.slides?.length ?? 0;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://rekhachitra.vercel.app";

  // ── Pre-session ────────────────────────────────────────────────────────

  if (!demoStarted || !session) {
    return (
      <div className="p-8 max-w-2xl">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
        >
          Sessions
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-muted)" }}>
          Launch a live session from an activity to see the real-time dashboard.
        </p>

        <div className="card p-6 mb-4">
          <h2
            className="text-lg font-bold mb-1"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            {DEMO_ACTIVITY.title}
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            {DEMO_ACTIVITY.slides?.length} slides · Demo activity
          </p>
          <Button variant="coral" onClick={handleStart} className="gap-2">
            Launch demo session
          </Button>
        </div>

        <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
          Tip: In production, activities launch directly from the activity editor.
        </p>
      </div>
    );
  }

  // ── Active session ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* Session header */}
      <header
        className="flex items-center gap-4 px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <JoinCodeDisplay code={session.joinCode} url={`${appUrl}/join/${session.joinCode}`} />

        <div className="flex-1 flex items-center gap-6 ml-6">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "var(--color-muted)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
              {students.length} students
            </span>
          </div>
          <Badge
            variant={session.status === "active" ? "mint" : session.status === "paused" ? "yellow" : "coral"}
          >
            {session.status.toUpperCase()}
          </Badge>
        </div>

        <Button variant="coral" size="sm" onClick={endSession} className="gap-1.5">
          <Square size={14} />
          End session
        </Button>
      </header>

      {/* Main body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: slide + graph */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
          {currentSlide ? (
            <>
              {/* Slide header */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-muted)" }}>
                  Slide {(session.currentSlide ?? 0) + 1} of {totalSlides}
                </p>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
                >
                  {currentSlide.title ?? "Untitled slide"}
                </h2>
                {currentSlide.instructions && (
                  <p className="text-sm mt-1" style={{ color: "var(--color-ink-soft)" }}>
                    {currentSlide.instructions}
                  </p>
                )}
              </div>

              {/* Graph canvas (read-only in session) */}
              {currentSlide.desmosState && (
                <div className="relative flex-1 min-h-52 rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
                  <DesmosCalculator
                    key={currentSlide.id}
                    readOnly
                    initialState={currentSlide.desmosState}
                    className="absolute inset-0"
                  />
                </div>
              )}

              {/* MCQ options display */}
              {currentSlide.checkpoint?.type === "mcq" && currentSlide.checkpoint.options && (
                <div className="card p-4">
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-ink)" }}>
                    {currentSlide.checkpoint.question}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentSlide.checkpoint.options.map((opt, i) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                        style={{
                          borderColor: opt.isCorrect ? "var(--color-brand-mint)" : "var(--color-border)",
                          backgroundColor: opt.isCorrect ? "rgba(45, 184, 158, 0.06)" : "var(--color-surface)",
                          color: "var(--color-ink-soft)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: opt.isCorrect ? "var(--color-brand-mint)" : "var(--color-border)",
                            color: opt.isCorrect ? "white" : "var(--color-muted)",
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: "var(--color-muted)" }}>No slide selected</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside
          className="w-72 flex-shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
        >
          {/* Timer */}
          {currentSlide?.checkpoint?.timeLimit ? (
            <div className="p-4 border-b flex flex-col items-center gap-2" style={{ borderColor: "var(--color-border)" }}>
              <CountdownTimer
                key={`${timerKey}-${session.currentSlide}`}
                seconds={currentSlide.checkpoint.timeLimit}
                paused={timerPaused}
                size="md"
              />
              <button
                onClick={() => setTimerPaused((p) => !p)}
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--color-muted)" }}
              >
                {timerPaused ? "▶ Resume" : "⏸ Pause"}
              </button>
            </div>
          ) : null}

          {/* Response grid */}
          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <ResponseGrid
              students={students}
              responses={responses}
              slideId={currentSlide?.id}
            />
          </div>

          {/* Leaderboard */}
          <div className="p-4">
            <SessionLeaderboard students={students} limit={5} />
          </div>
        </aside>
      </div>

      {/* Navigation footer */}
      <footer
        className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAdvance(-1)}
          disabled={(session.currentSlide ?? 0) === 0}
          className="gap-1.5"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor:
                  i === session.currentSlide
                    ? "var(--color-brand-teal)"
                    : "var(--color-border)",
              }}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => handleAdvance(1)}
          disabled={(session.currentSlide ?? 0) >= totalSlides - 1}
          className="gap-1.5"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </footer>
    </div>
  );
}
