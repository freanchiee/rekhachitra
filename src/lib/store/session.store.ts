"use client";

import { create } from "zustand";
import { type Activity, type Session, type SessionStatus, type Slide, type StudentSession, type Response, type ContentBlock } from "@/types";
import { generateJoinCode, generateId } from "@/lib/utils/session";

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Session Store
// Manages the teacher's live session state (local-first, later Supabase sync)
// ─────────────────────────────────────────────────────────────────────────────

/** localStorage key prefix for live sessions — students read from this */
export const LS_LIVE_SESSION_PREFIX = "rk_live_session_";

function writeLiveSession(session: Session, activity: Activity) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${LS_LIVE_SESSION_PREFIX}${session.joinCode.toLowerCase()}`,
      JSON.stringify({ session, activity })
    );
  } catch { /* quota exceeded */ }
}

function patchLiveSession(joinCode: string, patch: Partial<Session>) {
  if (typeof window === "undefined") return;
  try {
    const key = `${LS_LIVE_SESSION_PREFIX}${joinCode.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw) as { session: Session; activity: Activity };
    data.session = { ...data.session, ...patch };
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

interface TeacherSessionStore {
  session: Session | null;
  activity: Activity | null;
  students: StudentSession[];
  responses: Response[];
  isLoading: boolean;

  // Actions
  startSession: (activity: Activity) => Session;
  endSession: () => void;
  advanceSlide: (direction: 1 | -1) => void;
  goToSlide: (index: number) => void;
  updateStatus: (status: SessionStatus) => void;
  addStudent: (student: StudentSession) => void;
  addResponse: (response: Response) => void;
  reset: () => void;
}

export const useTeacherSessionStore = create<TeacherSessionStore>((set, get) => ({
  session: null,
  activity: null,
  students: [],
  responses: [],
  isLoading: false,

  startSession: (activity) => {
    const session: Session = {
      id: generateId(),
      activityId: activity.id,
      teacherId: "local-teacher",
      joinCode: generateJoinCode(),
      status: "waiting",
      currentSlide: 0,
      startedAt: new Date().toISOString(),
      endedAt: null,
      createdAt: new Date().toISOString(),
      activity,
    };
    set({ session, activity, students: [], responses: [] });
    // Publish to localStorage so students can read it by join code
    writeLiveSession(session, activity);
    return session;
  },

  endSession: () => {
    const { session } = get();
    const ended = session
      ? { ...session, status: "ended" as const, endedAt: new Date().toISOString() }
      : null;
    set({ session: ended });
    if (ended) patchLiveSession(ended.joinCode, { status: "ended", endedAt: ended.endedAt });
  },

  advanceSlide: (direction) => {
    const { session, activity } = get();
    if (!session || !activity?.slides) return;
    const next = session.currentSlide + direction;
    if (next < 0 || next >= activity.slides.length) return;
    const updated = { ...session, currentSlide: next, status: "active" as const };
    set({ session: updated });
    patchLiveSession(session.joinCode, { currentSlide: next, status: "active" });
  },

  goToSlide: (index) => {
    const { session, activity } = get();
    if (!session || !activity?.slides || index < 0 || index >= activity.slides.length) return;
    const updated = { ...session, currentSlide: index, status: "active" as const };
    set({ session: updated });
    patchLiveSession(session.joinCode, { currentSlide: index, status: "active" });
  },

  updateStatus: (status) => {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, status } });
    patchLiveSession(session.joinCode, { status });
  },

  addStudent: (student) => {
    set((state) => ({ students: [...state.students, student] }));
  },

  addResponse: (response) => {
    set((state) => ({ responses: [...state.responses, response] }));
  },

  reset: () => {
    set({ session: null, activity: null, students: [], responses: [], isLoading: false });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Student Session Store
// Manages the student's local session state
// ─────────────────────────────────────────────────────────────────────────────

interface StudentSessionStore {
  studentSession: StudentSession | null;
  session: Session | null;
  currentSlide: Slide | null;
  hasAnswered: boolean;
  score: number;

  // Actions
  joinSession: (session: Session, displayName: string) => StudentSession;
  updateCurrentSlide: (slide: Slide | null) => void;
  markAnswered: () => void;
  addPoints: (points: number) => void;
  reset: () => void;
}

export const useStudentSessionStore = create<StudentSessionStore>((set) => ({
  studentSession: null,
  session: null,
  currentSlide: null,
  hasAnswered: false,
  score: 0,

  joinSession: (session, displayName) => {
    const student: StudentSession = {
      id: generateId(),
      sessionId: session.id,
      displayName,
      avatarSeed: displayName + session.id,
      score: 0,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };
    set({ studentSession: student, session, hasAnswered: false, score: 0 });
    return student;
  },

  updateCurrentSlide: (slide) => {
    set({ currentSlide: slide, hasAnswered: false });
  },

  markAnswered: () => {
    set({ hasAnswered: true });
  },

  addPoints: (points) => {
    set((state) => ({ score: state.score + points }));
  },

  reset: () => {
    set({ studentSession: null, session: null, currentSlide: null, hasAnswered: false, score: 0 });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Activity Builder Store
// ─────────────────────────────────────────────────────────────────────────────

interface BuilderStore {
  activity: Activity | null;
  activeSlideIndex: number;
  isDirty: boolean;
  /** Activity queued by the AI generator — builder picks it up on mount then clears it. */
  pendingActivity: Activity | null;

  // Actions
  setActivity: (activity: Activity) => void;
  setActiveSlide: (index: number) => void;
  updateSlide: (index: number, slide: Partial<Slide>) => void;
  addSlide: (after?: number) => void;
  removeSlide: (index: number) => void;
  reorderSlide: (from: number, to: number) => void;
  updateActivity: (patch: Partial<Activity>) => void;
  markSaved: () => void;
  setPendingActivity: (activity: Activity) => void;
  clearPendingActivity: () => void;

  // Content block actions
  addBlock: (slideIndex: number, block: ContentBlock) => void;
  replaceBlock: (slideIndex: number, blockId: string, newBlock: ContentBlock) => void;
  removeBlock: (slideIndex: number, blockId: string) => void;
  reorderBlocks: (slideIndex: number, from: number, to: number) => void;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  activity: null,
  activeSlideIndex: 0,
  isDirty: false,
  pendingActivity: null,

  setActivity: (activity) => {
    set({ activity, activeSlideIndex: 0, isDirty: false });
  },

  setActiveSlide: (index) => {
    set({ activeSlideIndex: index });
  },

  updateSlide: (index, patch) => {
    const { activity } = get();
    if (!activity?.slides) return;
    const slides = [...activity.slides];
    slides[index] = { ...slides[index], ...patch } as Slide;
    set({ activity: { ...activity, slides }, isDirty: true });
  },

  addSlide: (after) => {
    const { activity } = get();
    if (!activity) return;
    const slides = activity.slides ?? [];
    const insertAt = after !== undefined ? after + 1 : slides.length;
    const newSlide: Slide = {
      id: generateId(),
      activityId: activity.id,
      position: insertAt,
      type: "graph",
      title: null,
      instructions: null,
      graphState: null,
      desmosState: null,
      checkpoint: null,
      createdAt: new Date().toISOString(),
    };
    const newSlides = [
      ...slides.slice(0, insertAt),
      newSlide,
      ...slides.slice(insertAt).map((s, i) => ({ ...s, position: insertAt + i + 1 })),
    ];
    set({
      activity: { ...activity, slides: newSlides },
      activeSlideIndex: insertAt,
      isDirty: true,
    });
  },

  removeSlide: (index) => {
    const { activity, activeSlideIndex } = get();
    if (!activity?.slides || activity.slides.length <= 1) return;
    const slides = activity.slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i }));
    const newActive = Math.min(activeSlideIndex, slides.length - 1);
    set({ activity: { ...activity, slides }, activeSlideIndex: newActive, isDirty: true });
  },

  reorderSlide: (from, to) => {
    const { activity } = get();
    if (!activity?.slides) return;
    const slides = [...activity.slides];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);
    const reindexed = slides.map((s, i) => ({ ...s, position: i }));
    set({ activity: { ...activity, slides: reindexed }, activeSlideIndex: to, isDirty: true });
  },

  updateActivity: (patch) => {
    const { activity } = get();
    if (!activity) return;
    set({ activity: { ...activity, ...patch }, isDirty: true });
  },

  markSaved: () => {
    set({ isDirty: false });
  },

  setPendingActivity: (activity) => {
    set({ pendingActivity: activity });
  },

  clearPendingActivity: () => {
    set({ pendingActivity: null });
  },

  addBlock: (slideIndex, block) => {
    const { activity } = get();
    if (!activity?.slides) return;
    const slides = [...activity.slides];
    const slide = slides[slideIndex];
    slides[slideIndex] = { ...slide, content: [...(slide.content ?? []), block] };
    set({ activity: { ...activity, slides }, isDirty: true });
  },

  replaceBlock: (slideIndex, blockId, newBlock) => {
    const { activity } = get();
    if (!activity?.slides) return;
    const slides = [...activity.slides];
    const slide = slides[slideIndex];
    slides[slideIndex] = {
      ...slide,
      content: (slide.content ?? []).map((b) => (b.id === blockId ? newBlock : b)),
    };
    set({ activity: { ...activity, slides }, isDirty: true });
  },

  removeBlock: (slideIndex, blockId) => {
    const { activity } = get();
    if (!activity?.slides) return;
    const slides = [...activity.slides];
    const slide = slides[slideIndex];
    slides[slideIndex] = {
      ...slide,
      content: (slide.content ?? []).filter((b) => b.id !== blockId),
    };
    set({ activity: { ...activity, slides }, isDirty: true });
  },

  reorderBlocks: (slideIndex, from, to) => {
    const { activity } = get();
    if (!activity?.slides) return;
    const slides = [...activity.slides];
    const slide = slides[slideIndex];
    const blocks = [...(slide.content ?? [])];
    const [moved] = blocks.splice(from, 1);
    blocks.splice(to, 0, moved);
    slides[slideIndex] = { ...slide, content: blocks };
    set({ activity: { ...activity, slides }, isDirty: true });
  },
}));
