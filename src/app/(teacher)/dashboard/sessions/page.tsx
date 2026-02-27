"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Square, Users, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JoinCodeDisplay } from "@/components/session/JoinCodeDisplay";
import { ResponseGrid } from "@/components/session/ResponseGrid";
import { SessionLeaderboard } from "@/components/session/SessionLeaderboard";
import { CountdownTimer } from "@/components/session/CountdownTimer";
import DesmosCalculator from "@/components/graph/DesmosCalculator";
import { useTeacherSessionStore } from "@/lib/store/session.store";
import type { Activity, Slide, StudentSession, ContentBlock } from "@/types";
import { Badge } from "@/components/ui/Badge";

const LS_ACTIVITIES_KEY = "rk_activities";

// ── Demo fallback (used only when no ?activity= param) ──────────────────────

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
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_STUDENTS: StudentSession[] = [
  { id: "st1", sessionId: "s", displayName: "Alex Chen", avatarSeed: "alex", score: 10, joinedAt: "", lastSeen: "" },
  { id: "st2", sessionId: "s", displayName: "Priya M", avatarSeed: "priya", score: 0, joinedAt: "", lastSeen: "" },
  { id: "st3", sessionId: "s", displayName: "Jonas K", avatarSeed: "jonas", score: 10, joinedAt: "", lastSeen: "" },
  { id: "st4", sessionId: "s", displayName: "Amara L", avatarSeed: "amara", score: 0, joinedAt: "", lastSeen: "" },
  { id: "st5", sessionId: "s", displayName: "Seo-Yeon", avatarSeed: "seoyeon", score: 10, joinedAt: "", lastSeen: "" },
];

// ── Root export (Suspense wrapper required for useSearchParams) ──────────────

export default function SessionsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }} />
      </div>
    }>
      <SessionsPage />
    </Suspense>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function SessionsPage() {
  const searchParams = useSearchParams();
  const { session, startSession, endSession, advanceSlide, students, responses } =
    useTeacherSessionStore();

  const [pendingActivity, setPendingActivity] = useState<Activity | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load the activity from localStorage using ?activity= param
  useEffect(() => {
    const activityId = searchParams.get("activity");
    if (activityId) {
      try {
        const raw = localStorage.getItem(LS_ACTIVITIES_KEY);
        if (raw) {
          const map: Record<string, Activity> = JSON.parse(raw);
          if (map[activityId]) {
            setPendingActivity(map[activityId]);
            setLoaded(true);
            return;
          }
        }
      } catch {
        // fall through to demo
      }
    }
    // No param or not found — use demo
    setPendingActivity(DEMO_ACTIVITY);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activityToLaunch = pendingActivity ?? DEMO_ACTIVITY;
  const isDemo = activityToLaunch.id === DEMO_ACTIVITY.id;

  const handleStart = useCallback(() => {
    const newSession = startSession(activityToLaunch);
    // Belt-and-suspenders: also write directly here in case the store's
    // writeLiveSession runs in a context where localStorage isn't available.
    try {
      localStorage.setItem(
        `rk_live_session_${newSession.joinCode.toLowerCase()}`,
        JSON.stringify({ session: { ...newSession, status: "active" }, activity: activityToLaunch })
      );
    } catch { /* storage quota */ }
    if (isDemo) {
      DEMO_STUDENTS.forEach((st) => useTeacherSessionStore.getState().addStudent(st));
    }
  }, [activityToLaunch, isDemo, startSession]);

  const handleAdvance = (dir: 1 | -1) => {
    advanceSlide(dir);
    setTimerKey((k) => k + 1);
    setTimerPaused(false);
  };

  const currentSlide: Slide | null =
    session?.activity?.slides?.[session.currentSlide] ?? null;
  const totalSlides = session?.activity?.slides?.length ?? 0;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  // ── Pre-session ────────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="p-8 max-w-2xl">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
        >
          Launch Session
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-muted)" }}>
          Students join at your classroom URL using the join code.
        </p>

        {!loaded ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6 mb-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ backgroundColor: "rgba(27,120,136,0.08)" }}
              >
                📐
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="text-lg font-bold truncate"
                  style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
                >
                  {activityToLaunch.title}
                </h2>
                {activityToLaunch.description && (
                  <p className="text-sm mt-0.5 line-clamp-2" style={{ color: "var(--color-muted)" }}>
                    {activityToLaunch.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--color-subtle)" }}>
                  <span>{activityToLaunch.slides?.length ?? 0} slides</span>
                  {isDemo && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: "rgba(246,94,93,0.1)", color: "var(--color-brand-coral)" }}
                    >
                      Demo
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Slide summary */}
            {(activityToLaunch.slides?.length ?? 0) > 0 && (
              <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                {(activityToLaunch.slides ?? []).slice(0, 4).map((slide, i) => {
                  const blockCount = slide.content?.length ?? 0;
                  return (
                    <div
                      key={slide.id}
                      className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 text-sm"
                      style={{ borderColor: "var(--color-border)", backgroundColor: i % 2 === 0 ? "var(--color-surface)" : "var(--color-white)" }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: "var(--color-brand-teal)", color: "white" }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate font-medium" style={{ color: "var(--color-ink)" }}>
                        {slide.title || `Slide ${i + 1}`}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-subtle)" }}>
                        {blockCount > 0 ? `${blockCount} block${blockCount !== 1 ? "s" : ""}` : slide.desmosState ? "graph" : ""}
                        {slide.checkpoint ? " · checkpoint" : ""}
                      </span>
                    </div>
                  );
                })}
                {(activityToLaunch.slides?.length ?? 0) > 4 && (
                  <div className="px-4 py-2 text-xs text-center" style={{ color: "var(--color-muted)", backgroundColor: "var(--color-surface)" }}>
                    + {(activityToLaunch.slides?.length ?? 0) - 4} more slides
                  </div>
                )}
              </div>
            )}

            <Button variant="primary" onClick={handleStart} className="gap-2 w-full justify-center">
              🚀 Launch Session
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Active session ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* Session header */}
      <header
        className="flex items-center gap-4 px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <JoinCodeDisplay code={session.joinCode} url={`${appUrl}/join/${session.joinCode}`} />

        <div className="flex items-center gap-2 ml-4 flex-1 min-w-0">
          <span
            className="text-sm font-bold truncate"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            {session.activity?.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "var(--color-muted)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
              {students.length}
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
          End
        </Button>
      </header>

      {/* Main body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: slide content */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
          {currentSlide ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-muted)" }}>
                  Slide {(session.currentSlide ?? 0) + 1} of {totalSlides}
                </p>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
                >
                  {currentSlide.title ?? `Slide ${(session.currentSlide ?? 0) + 1}`}
                </h2>
                {currentSlide.instructions && (
                  <p className="text-sm mt-1" style={{ color: "var(--color-ink-soft)" }}>
                    {currentSlide.instructions}
                  </p>
                )}
              </div>

              {/* Render content blocks if present, otherwise fall back to desmosState */}
              {(currentSlide.content?.length ?? 0) > 0 ? (
                <div className="flex flex-col gap-3">
                  {currentSlide.content!.map((block) => (
                    <SessionBlock key={block.id} block={block} />
                  ))}
                </div>
              ) : currentSlide.desmosState ? (
                <div className="relative flex-1 min-h-52 rounded-xl overflow-hidden border"
                  style={{ borderColor: "var(--color-border)" }}>
                  <DesmosCalculator
                    key={currentSlide.id}
                    readOnly
                    initialState={currentSlide.desmosState}
                    className="absolute inset-0"
                  />
                </div>
              ) : null}

              {/* Checkpoint display */}
              {currentSlide.checkpoint?.type === "mcq" && currentSlide.checkpoint.options && (
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}
                >
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
                          backgroundColor: opt.isCorrect ? "rgba(45,184,158,0.06)" : "var(--color-surface)",
                          color: "var(--color-ink-soft)",
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

              {currentSlide.checkpoint?.type === "short_answer" && (
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                    {currentSlide.checkpoint.question || "Short answer question"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    Students type their answer.
                  </p>
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

          <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <ResponseGrid students={students} responses={responses} slideId={currentSlide?.id} />
          </div>

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
                backgroundColor: i === session.currentSlide
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

// ── SessionBlock — renders a content block in read-only session mode ──────────

function SessionBlock({ block }: { block: ContentBlock }) {
  if (block.type === "text") {
    return (
      <div
        className="rounded-xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-white)",
          color: "var(--color-ink)",
          fontFamily: "var(--font-body)",
        }}
      >
        {block.content || <span style={{ color: "var(--color-subtle)" }}>(empty text block)</span>}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        {block.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.url}
            alt={block.caption ?? ""}
            className="w-full object-contain max-h-72"
            style={{ backgroundColor: "var(--color-surface)" }}
          />
        ) : (
          <div
            className="flex items-center justify-center py-10 text-sm gap-2"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-subtle)" }}
          >
            <ImageIcon size={18} />
            No image set
          </div>
        )}
        {block.caption && (
          <p className="text-xs text-center py-2" style={{ color: "var(--color-muted)" }}>
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "free_response") {
    return (
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}
      >
        {block.prompt && (
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
            {block.prompt}
          </p>
        )}
        <div
          className="rounded-lg border-2 border-dashed px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-subtle)" }}
        >
          {block.placeholder || "Students type their response here…"}
        </div>
      </div>
    );
  }

  if (block.type === "graph") {
    return (
      <div
        className="relative rounded-xl overflow-hidden border"
        style={{ height: 340, borderColor: "var(--color-border)" }}
      >
        <DesmosCalculator
          key={`session-${block.id}`}
          readOnly
          initialState={block.desmosState ?? undefined}
          className="absolute inset-0"
        />
      </div>
    );
  }

  return null;
}
