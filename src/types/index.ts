// ─────────────────────────────────────────────────────────────────────────────
// Rekhachitra – Global TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "teacher" | "admin";
  createdAt: string;
  updatedAt: string;
}

// ── Graph State ───────────────────────────────────────────────────────────────

export type ExpressionType = "equation" | "inequality" | "point" | "segment" | "polygon";

export interface Expression {
  id: string;
  latex: string;
  type: ExpressionType;
  color?: string;
  hidden?: boolean;
  label?: string;
}

export interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface GraphSettings {
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  polarMode: boolean;
}

export interface GraphState {
  expressions: Expression[];
  viewport: Viewport;
  settings: GraphSettings;
}

// ── Checkpoint (Question) ─────────────────────────────────────────────────────

export type CheckpointType = "mcq" | "short_answer" | "graph" | "none";

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Checkpoint {
  type: CheckpointType;
  question: string;
  options?: MCQOption[]; // for MCQ
  correctAnswer?: string; // for short_answer
  timeLimit?: number; // seconds, 0 = unlimited
  points?: number;
}

// ── Slides ────────────────────────────────────────────────────────────────────

export type SlideType = "graph" | "mcq" | "short_answer" | "info";

export interface Slide {
  id: string;
  activityId: string;
  position: number;
  type: SlideType;
  title: string | null;
  instructions: string | null;
  graphState: GraphState | null;
  checkpoint: Checkpoint | null;
  createdAt: string;
}

// ── Activities ────────────────────────────────────────────────────────────────

export type ActivityStatus = "draft" | "active" | "archived";

export interface Activity {
  id: string;
  teacherId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  status: ActivityStatus;
  slides?: Slide[];
  createdAt: string;
  updatedAt: string;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export type SessionStatus = "waiting" | "active" | "paused" | "ended";

export interface Session {
  id: string;
  activityId: string;
  teacherId: string;
  joinCode: string;
  status: SessionStatus;
  currentSlide: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  activity?: Activity;
}

// ── Student Sessions ──────────────────────────────────────────────────────────

export interface StudentSession {
  id: string;
  sessionId: string;
  displayName: string;
  avatarSeed: string;
  score: number;
  joinedAt: string;
  lastSeen: string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export type AnswerValue =
  | { type: "mcq"; value: string } // option id
  | { type: "short_answer"; value: string }
  | { type: "graph"; state: GraphState };

export interface Response {
  id: string;
  sessionId: string;
  studentSessionId: string;
  slideId: string;
  answer: AnswerValue;
  isCorrect: boolean | null;
  pointsEarned: number;
  responseTimeMs: number;
  submittedAt: string;
}

// ── Live Session State ────────────────────────────────────────────────────────

export interface LiveSessionState {
  session: Session;
  activity: Activity;
  students: StudentSession[];
  responses: Response[];
  currentSlideData: Slide | null;
}

// ── API Response Wrappers ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: { message: string; code?: string };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;
