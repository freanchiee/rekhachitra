/**
 * /api/live/[code] — Server-side live session relay
 *
 * Stores live session state in a module-level Map so teacher and students
 * on different browsers / devices can communicate without a database.
 *
 * Limitation: ephemeral within a single server process. Data is lost on
 * server restart / Vercel cold start. For production replace with Vercel KV:
 *   https://vercel.com/storage/kv
 *
 * Endpoints:
 *   GET    /api/live/[code]  → { session, activity, students }  (404 if not found)
 *   POST   /api/live/[code]  ← { session, activity }             (create / replace)
 *   PATCH  /api/live/[code]  ← { session?: partial, student?: StudentProgressData }
 */

interface LiveData {
  session: Record<string, unknown>;
  activity: Record<string, unknown>;
  students: Record<string, Record<string, unknown>>; // studentId → progress
  updatedAt: string;
}

// Module-level store — shared across requests in the same process instance
const store = new Map<string, LiveData>();

// Normalise join codes: strip dashes, lowercase  →  "9VX-6PY" and "9VX6PY" both become "9vx6py"
function norm(code: string) {
  return code.replace(/-/g, "").toLowerCase();
}

// Auto-expire sessions older than 4 hours to prevent unbounded memory growth
const EXPIRE_MS = 4 * 60 * 60 * 1000;
function gc() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now - new Date(v.updatedAt).getTime() > EXPIRE_MS) store.delete(k);
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  gc();
  const data = store.get(norm(code));
  if (!data) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(data);
}

// ── POST — create / replace full session ─────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = (await req.json()) as Partial<LiveData>;
  const existing = store.get(norm(code));
  store.set(norm(code), {
    session: body.session ?? existing?.session ?? {},
    activity: body.activity ?? existing?.activity ?? {},
    students: body.students ?? existing?.students ?? {},
    updatedAt: new Date().toISOString(),
  });
  return Response.json({ ok: true });
}

// ── PATCH — partial session update or upsert one student ─────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = (await req.json()) as {
    session?: Record<string, unknown>;
    student?: Record<string, unknown>;
  };

  const existing = store.get(norm(code));
  if (!existing) {
    // Create a skeleton entry if teacher hasn't posted yet
    // (shouldn't happen, but avoids a 404 race condition)
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if (body.session) {
    existing.session = { ...existing.session, ...body.session };
  }
  if (body.student && typeof body.student.id === "string") {
    existing.students[body.student.id] = body.student;
  }
  existing.updatedAt = new Date().toISOString();
  store.set(norm(code), existing);
  return Response.json({ ok: true });
}
