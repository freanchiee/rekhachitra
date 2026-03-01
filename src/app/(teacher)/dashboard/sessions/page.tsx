"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Square, Users, Image as ImageIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JoinCodeDisplay } from "@/components/session/JoinCodeDisplay";
import DesmosCalculator from "@/components/graph/DesmosCalculator";
import { useTeacherSessionStore } from "@/lib/store/session.store";
import { LS_LIVE_SESSION_PREFIX, LS_STUDENT_PREFIX } from "@/lib/store/session.store";
import type { Activity, Slide, ContentBlock } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

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

// ── Student progress shape (written by student, read here) ───────────────────

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
  const { session, startSession, endSession, advanceSlide } = useTeacherSessionStore();

  const startedRef = useRef(false);
  const [timerKey, setTimerKey] = useState(0);

  // Auto-launch session on mount — no manual "Launch" button needed
  useEffect(() => {
    if (session || startedRef.current) return;
    startedRef.current = true;

    const activityId = searchParams.get("activity");
    let activityToStart = DEMO_ACTIVITY;
    if (activityId) {
      try {
        const raw = localStorage.getItem(LS_ACTIVITIES_KEY);
        if (raw) {
          const map: Record<string, Activity> = JSON.parse(raw);
          if (map[activityId]) activityToStart = map[activityId];
        }
      } catch { /* fall through to demo */ }
    }

    const newSession = startSession(activityToStart);
    // Belt-and-suspenders: write directly with status "active"
    try {
      localStorage.setItem(
        `${LS_LIVE_SESSION_PREFIX}${newSession.joinCode.toLowerCase()}`,
        JSON.stringify({ session: { ...newSession, status: "active" }, activity: activityToStart })
      );
    } catch { /* storage quota */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdvance = useCallback((dir: 1 | -1) => {
    advanceSlide(dir);
    setTimerKey((k) => k + 1);
  }, [advanceSlide]);

  const currentSlide: Slide | null = session?.activity?.slides?.[session.currentSlide] ?? null;
  const totalSlides = session?.activity?.slides?.length ?? 0;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Show loading spinner until session is created
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // ── Live session view ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* Session header */}
      <header
        className="flex items-center gap-4 px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <JoinCodeDisplay code={session.joinCode} url={`${appUrl}/join/${session.joinCode}`} />

        <div className="flex items-center gap-2 ml-2 flex-1 min-w-0">
          <span className="text-sm font-bold truncate"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            {session.activity?.title}
          </span>
        </div>

        <Badge variant={session.status === "active" ? "mint" : session.status === "paused" ? "yellow" : "coral"}>
          {session.status.toUpperCase()}
        </Badge>

        <Button variant="coral" size="sm" onClick={endSession} className="gap-1.5 flex-shrink-0">
          <Square size={14} />
          End
        </Button>
      </header>

      {/* Main body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: slide content (teacher's reference view) */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
          {currentSlide ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-muted)" }}>
                  Slide {(session.currentSlide ?? 0) + 1} of {totalSlides}
                </p>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
                  {currentSlide.title ?? `Slide ${(session.currentSlide ?? 0) + 1}`}
                </h2>
                {currentSlide.instructions && (
                  <p className="text-sm mt-1" style={{ color: "var(--color-ink-soft)" }}>
                    {currentSlide.instructions}
                  </p>
                )}
              </div>

              {(currentSlide.content?.length ?? 0) > 0 ? (
                <div className="flex flex-col gap-3">
                  {currentSlide.content!.map((block) => (
                    <SessionBlock key={block.id} block={block} />
                  ))}
                </div>
              ) : currentSlide.desmosState ? (
                <div className="relative flex-1 min-h-52 rounded-xl overflow-hidden border"
                  style={{ borderColor: "var(--color-border)" }}>
                  <DesmosCalculator key={currentSlide.id} readOnly initialState={currentSlide.desmosState}
                    className="absolute inset-0" />
                </div>
              ) : null}

              {currentSlide.checkpoint?.type === "mcq" && currentSlide.checkpoint.options && (
                <div className="rounded-xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-ink)" }}>
                    {currentSlide.checkpoint.question}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentSlide.checkpoint.options.map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                        style={{
                          borderColor: opt.isCorrect ? "var(--color-brand-mint)" : "var(--color-border)",
                          backgroundColor: opt.isCorrect ? "rgba(45,184,158,0.06)" : "var(--color-surface)",
                          color: "var(--color-ink-soft)",
                        }}>
                        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: opt.isCorrect ? "var(--color-brand-mint)" : "var(--color-border)",
                            color: opt.isCorrect ? "white" : "var(--color-muted)",
                          }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSlide.checkpoint?.type === "short_answer" && (
                <div className="rounded-xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                    {currentSlide.checkpoint.question || "Short answer question"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>Students type their answer.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: "var(--color-muted)" }}>No slide selected</p>
            </div>
          )}
        </div>

        {/* Right sidebar: live student roster */}
        <aside className="w-80 flex-shrink-0 flex flex-col border-l overflow-hidden"
          style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}>
          <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0"
            style={{ borderColor: "var(--color-border)" }}>
            <Users size={16} style={{ color: "var(--color-muted)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>Students</span>
            <span className="text-xs font-medium ml-auto px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(27,120,136,0.1)", color: "var(--color-brand-teal)" }}>
              LIVE
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LiveRoster joinCode={session.joinCode} totalSlides={totalSlides} key={timerKey} />
          </div>
        </aside>
      </div>

      {/* Navigation footer */}
      <footer className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <Button variant="outline" size="sm" onClick={() => handleAdvance(-1)}
          disabled={(session.currentSlide ?? 0) === 0} className="gap-1.5">
          <ChevronLeft size={16} />
          Previous
        </Button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ backgroundColor: i === session.currentSlide ? "var(--color-brand-teal)" : "var(--color-border)" }} />
          ))}
        </div>

        <Button variant="primary" size="sm" onClick={() => handleAdvance(1)}
          disabled={(session.currentSlide ?? 0) >= totalSlides - 1} className="gap-1.5">
          Next
          <ChevronRight size={16} />
        </Button>
      </footer>
    </div>
  );
}

// ── Live student roster ───────────────────────────────────────────────────────

function LiveRoster({ joinCode, totalSlides }: { joinCode: string; totalSlides: number }) {
  const [students, setStudents] = useState<StudentProgressData[]>([]);
  const prefix = `${LS_STUDENT_PREFIX}${joinCode.toLowerCase()}_`;

  const refresh = useCallback(() => {
    const found: StudentProgressData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        try { found.push(JSON.parse(localStorage.getItem(key)!)); } catch { /* skip */ }
      }
    }
    found.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    setStudents(found);
  }, [prefix]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 1500);
    const handleStorage = (e: StorageEvent) => { if (e.key?.startsWith(prefix)) refresh(); };
    window.addEventListener("storage", handleStorage);
    return () => { clearInterval(interval); window.removeEventListener("storage", handleStorage); };
  }, [prefix, refresh]);

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--color-surface)" }}>
          <Users size={24} style={{ color: "var(--color-border)" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
          Waiting for students to join…
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-subtle)" }}>
          Share the join code or link. Students can start immediately after entering their name.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {students.map((s) => (
        <StudentCard key={s.id} student={s} totalSlides={totalSlides} />
      ))}
    </div>
  );
}

// ── Student card ──────────────────────────────────────────────────────────────

function StudentCard({ student, totalSlides }: { student: StudentProgressData; totalSlides: number }) {
  const total = totalSlides || student.totalSlides || 1;
  const current = student.currentSlide + 1; // 1-based for display
  const pct = Math.round((student.currentSlide / Math.max(total - 1, 1)) * 100);
  const answeredCount = Object.keys(student.answers).length;
  const correctCount = Object.values(student.answers).filter((a) => a.correct === true).length;

  // Latest answer
  const latestAnswerEntry = Object.entries(student.answers).at(-1);
  const latestAnswer = latestAnswerEntry?.[1];

  return (
    <div className="px-4 py-3 border-b hover:bg-[var(--color-surface)] transition-colors"
      style={{ borderColor: "var(--color-border)" }}>
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar seed={student.avatarSeed} name={student.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            {student.name}
          </p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            Slide {current}/{total} · {student.score} pts
          </p>
        </div>
        {answeredCount > 0 && (
          <div className="flex items-center gap-1 text-xs font-medium"
            style={{ color: correctCount === answeredCount ? "var(--color-brand-mint)" : "var(--color-muted)" }}>
            {correctCount > 0 ? <CheckCircle size={13} /> : <Clock size={13} />}
            {correctCount}/{answeredCount}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "var(--color-brand-mint)" : "var(--color-brand-teal)" }} />
      </div>

      {/* Latest answer pill */}
      {latestAnswer && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {latestAnswer.correct === true && (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(45,184,158,0.1)", color: "var(--color-brand-mint)" }}>
              <CheckCircle size={10} /> Correct
            </span>
          )}
          {latestAnswer.correct === false && (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(246,94,93,0.1)", color: "var(--color-brand-coral)" }}>
              <XCircle size={10} /> Incorrect
            </span>
          )}
          {latestAnswer.correct === undefined && (
            <span className="text-xs truncate max-w-[160px]" style={{ color: "var(--color-muted)" }}>
              &ldquo;{latestAnswer.value}&rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── SessionBlock — renders a content block in read-only session mode ──────────

function SessionBlock({ block }: { block: ContentBlock }) {
  if (block.type === "text") {
    return (
      <div className="rounded-xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
        {block.content || <span style={{ color: "var(--color-subtle)" }}>(empty text block)</span>}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        {block.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.url} alt={block.caption ?? ""} className="w-full object-contain max-h-72"
            style={{ backgroundColor: "var(--color-surface)" }} />
        ) : (
          <div className="flex items-center justify-center py-10 text-sm gap-2"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-subtle)" }}>
            <ImageIcon size={18} /> No image set
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
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}>
        {block.prompt && (
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-ink)" }}>{block.prompt}</p>
        )}
        <div className="rounded-lg border-2 border-dashed px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-subtle)" }}>
          {block.placeholder || "Students type their response here…"}
        </div>
      </div>
    );
  }

  if (block.type === "graph") {
    return (
      <div className="relative rounded-xl overflow-hidden border" style={{ height: 340, borderColor: "var(--color-border)" }}>
        <DesmosCalculator key={`session-${block.id}`} readOnly initialState={block.desmosState ?? undefined} className="absolute inset-0" />
      </div>
    );
  }

  return null;
}
