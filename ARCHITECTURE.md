# Rekhachitra – Platform Architecture

## 1. Information Architecture & Sitemap

```
rekhachitra.app/
│
├── / (Landing)
│   ├── /about
│   ├── /pricing
│   └── /blog
│
├── /auth
│   ├── /auth/login          (magic link request)
│   └── /auth/verify         (magic link callback)
│
├── /dashboard               (teacher, protected)
│   ├── /dashboard/activities
│   │   ├── /dashboard/activities/new
│   │   ├── /dashboard/activities/[id]       (edit)
│   │   └── /dashboard/activities/[id]/preview
│   └── /dashboard/sessions
│       └── /dashboard/sessions/[id]         (live teacher view)
│
├── /join                    (public, students)
│   └── /join/[code]         (student session view)
│
└── /api
    ├── /api/activities
    ├── /api/sessions
    └── /api/responses
```

---

## 2. User Journey Maps

### A) Teacher Creates & Launches Activity

```
Teacher → Landing → Login (magic link) → Dashboard
  → "New Activity" → Activity Builder
    → Add slides (graph + questions) → Preview
      → "Launch Session" → Session code generated
        → Share code/link → Monitor live dashboard
          → End session → View results summary
```

### B) Student Joins & Submits

```
Student receives link/code → /join/[CODE]
  → Enter name (no account needed) → Connected
    → See current slide (graph or question) → Interact
      → Submit answer → See instant feedback
        → Wait for next slide → Repeat
          → Session ends → See score/summary
```

### C) Teacher Views Live Results

```
Teacher in session view → Live feed of student joins
  → Advance slides → See response grid update in real-time
    → Highlight interesting answers → See heatmap for MCQ
      → Spotlight student work → End slide → See summary
        → Advance to next → End session → Download report
```

---

## 3. Data Architecture

### Database: Supabase (PostgreSQL)

**Why Supabase over Firebase / PlanetScale:**
- Built-in Realtime (WebSocket subscriptions) — essential for live sessions
- PostgreSQL (relational) fits our relational data model perfectly
- Row-Level Security for tenant isolation without extra middleware
- Auth with magic link built-in
- Edge Functions for serverless compute
- Free tier generous for MVP

### Entity Schema

```sql
-- Users (teachers only; students are anonymous sessions)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'teacher',  -- 'teacher' | 'admin'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Activities (a collection of slides)
CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT false,
  status      TEXT DEFAULT 'draft',  -- 'draft' | 'active' | 'archived'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Slides (individual steps in an activity)
CREATE TABLE slides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id   UUID REFERENCES activities(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  type          TEXT NOT NULL,  -- 'graph' | 'mcq' | 'short_answer' | 'info'
  title         TEXT,
  instructions  TEXT,
  graph_state   JSONB,          -- GraphState blob
  checkpoint    JSONB,          -- Checkpoint config (question, options, answer)
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- GraphState (stored as JSONB in slides.graph_state)
-- {
--   expressions: Expression[],
--   viewport: { xMin, xMax, yMin, yMax },
--   settings: { showGrid, showAxes, ... }
-- }

-- Sessions (live instance of an activity)
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id   UUID REFERENCES activities(id),
  teacher_id    UUID REFERENCES users(id),
  join_code     TEXT UNIQUE NOT NULL,  -- 6-char alphanumeric
  status        TEXT DEFAULT 'waiting', -- 'waiting' | 'active' | 'paused' | 'ended'
  current_slide INTEGER DEFAULT 0,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- StudentSessions (anonymous student participants)
CREATE TABLE student_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES sessions(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  avatar_seed   TEXT,           -- For deterministic avatar generation
  score         INTEGER DEFAULT 0,
  joined_at     TIMESTAMPTZ DEFAULT now(),
  last_seen     TIMESTAMPTZ DEFAULT now()
);

-- Responses (student answers per slide)
CREATE TABLE responses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_session_id UUID REFERENCES student_sessions(id) ON DELETE CASCADE,
  slide_id          UUID REFERENCES slides(id),
  answer            JSONB,       -- { type: 'mcq', value: 'A' } or { type: 'graph', state: ... }
  is_correct        BOOLEAN,
  points_earned     INTEGER DEFAULT 0,
  response_time_ms  INTEGER,     -- Time to answer in ms
  submitted_at      TIMESTAMPTZ DEFAULT now()
);
```

### Relationships

```
User (1) ──── (∞) Activity
Activity (1) ── (∞) Slide
Activity (1) ── (∞) Session
Session (1) ─── (∞) StudentSession
Session (1) ─── (∞) Response
StudentSession (1) ─ (∞) Response
Slide (1) ────── (∞) Response
```

---

## 4. API Surface

### REST via Next.js API Routes + Supabase

**Authentication:** Supabase magic link → JWT in HTTP-only cookie
**Authorization:** Row-Level Security policies on all teacher-owned resources

```
POST   /api/activities
  Body: { title, description }
  Auth: Teacher JWT required
  Returns: Activity

GET    /api/activities/:id
  Auth: Owner or public (if is_public)
  Returns: Activity + Slides

PATCH  /api/activities/:id
  Body: Partial<Activity & { slides: Slide[] }>
  Auth: Owner only
  Returns: Updated Activity

DELETE /api/activities/:id
  Auth: Owner only

POST   /api/sessions/start
  Body: { activityId }
  Auth: Teacher JWT required
  Returns: Session with join_code

GET    /api/sessions/:code
  Auth: Public (student lookup by code)
  Returns: Session status + current slide (no answers)

POST   /api/sessions/:code/join
  Body: { displayName }
  Auth: Public
  Returns: StudentSession token

POST   /api/sessions/:id/advance
  Body: { slideIndex }
  Auth: Session teacher only
  Returns: Updated session

POST   /api/responses
  Body: { sessionId, slideId, studentSessionId, answer }
  Auth: StudentSession token
  Returns: Response (with isCorrect if applicable)

GET    /api/sessions/:id/live
  Auth: Session teacher only
  Returns: { students, responses, currentSlide }
  Note: Use Supabase Realtime subscription instead for live updates

POST   /api/sessions/:id/end
  Auth: Session teacher only
  Returns: Session summary
```

---

## 5. Component Inventory

### UI Primitives (`/components/ui/`)

| Component | Purpose |
|---|---|
| `Button` | Brand-styled button with variants (primary, yellow, coral, mint, outline, ghost) |
| `Input` | Text input with brand focus ring |
| `Badge` | Status labels with color variants |
| `Card` | White card with shadow and border |
| `Modal` | Accessible overlay dialog |
| `Toast` | Notification system (success, error, info) |
| `Spinner` | Loading indicator |
| `Avatar` | Deterministic color avatar by seed |
| `Tooltip` | Hover information label |
| `Tabs` | Segmented tab navigation |

### Graph Components (`/components/graph/`)

| Component | Purpose |
|---|---|
| `GraphCanvas` | SVG-based coordinate plane renderer |
| `GraphToolbar` | Expression type selector (line, curve, point, shape) |
| `ExpressionPanel` | List of expressions with edit/delete |
| `ExpressionInput` | Math expression text input |
| `GraphViewport` | Pan/zoom controller |
| `GridLayer` | Renders grid lines and axes |
| `PlotLayer` | Renders mathematical expressions |
| `PointLayer` | Renders draggable points |
| `StudentGraphOverlay` | Shows student graph responses overlaid |

### Session Components (`/components/session/`)

| Component | Purpose |
|---|---|
| `CountdownTimer` | Animated circular timer |
| `JoinCodeDisplay` | Large join code with copy button |
| `JoinCodeInput` | Student code entry field |
| `LiveParticipantBar` | Shows connected student count |
| `SlideNavigator` | Previous/next slide controls |
| `ResponseGrid` | Grid showing student submission status |
| `ResponseHeatmap` | Color-coded MCQ answer distribution |
| `SessionLeaderboard` | Ranked student scores |
| `SlideProgressBar` | Current slide position indicator |
| `StudentCard` | Individual student status card |

### Teacher Components (`/components/teacher/`)

| Component | Purpose |
|---|---|
| `ActivityCard` | Dashboard activity preview card |
| `TeacherControlBar` | Session control strip (advance, pause, end) |
| `SlideEditor` | Full slide editing interface |
| `CheckpointEditor` | Question/answer configuration panel |
| `ActivityPreview` | Full-screen activity preview modal |
| `SharePanel` | Link + QR code sharing for session |

### Student Components (`/components/student/`)

| Component | Purpose |
|---|---|
| `StudentJoinForm` | Name entry form for joining |
| `WaitingRoom` | Pre-session lobby view |
| `StudentSlideView` | Student-facing slide display |
| `MCQOptions` | Multiple choice answer buttons |
| `AnswerSubmitButton` | Prominent submit action |
| `FeedbackBanner` | Correct/incorrect instant feedback |

---

## 6. Page Blueprints

### Landing Page (`/`)

```
┌─────────────────────────────────────────────┐
│ NAV: Logo | Features | Pricing | Login [CTA] │
├─────────────────────────────────────────────┤
│                                             │
│   HERO: Large headline + sub                │
│   "Math comes alive in your classroom"      │
│                                             │
│   [Start for Free]   [See Demo]             │
│                                             │
│   Hero illustration: graph + students       │
│                                             │
├─────────────────────────────────────────────┤
│ FEATURE GRID (3 cols on desktop, 1 on mobile)│
│ [Graph]  [Live Q&A]  [Instant Analytics]    │
├─────────────────────────────────────────────┤
│ HOW IT WORKS: 3-step teacher flow           │
├─────────────────────────────────────────────┤
│ TESTIMONIALS                                │
├─────────────────────────────────────────────┤
│ FOOTER: Links | Social | Copyright          │
└─────────────────────────────────────────────┘
Mobile: Single column, hamburger nav
```

### Teacher Dashboard (`/dashboard`)

```
┌──────────────────────────────────────────────┐
│ Sidebar: Logo, Nav items, User avatar        │
├──────┬───────────────────────────────────────┤
│ Side │ Header: "My Activities" + [New +]     │
│ bar  ├───────────────────────────────────────┤
│      │ Activity Cards Grid (2-3 cols)        │
│      │ [Card][Card][Card]                    │
│      │ [Card][Card][Card]                    │
│      │                                       │
│      │ Empty state when no activities        │
└──────┴───────────────────────────────────────┘
Mobile: Bottom tab nav, full-width cards
```

### Activity Builder (`/dashboard/activities/[id]`)

```
┌──────────────────────────────────────────────┐
│ Top bar: ← Back | Activity title | [Preview] [Launch] │
├───────────┬──────────────────┬───────────────┤
│ Slide     │  Graph Canvas    │ Checkpoint    │
│ List      │  (SVG renderer)  │ Panel         │
│           │                  │               │
│ [Slide 1] │  ┌──────────┐   │ Question:     │
│ [Slide 2] │  │ y = mx+b │   │ [Input field] │
│ [+ Add]   │  └──────────┘   │               │
│           │  Tool: Line/Pt  │ Options: A-D  │
│           │                  │ Answer: [A]   │
│           │  [Expression]    │               │
└───────────┴──────────────────┴───────────────┘
Mobile: Tabs: Slides | Canvas | Checkpoint
```

### Live Session – Teacher View (`/dashboard/sessions/[id]`)

```
┌──────────────────────────────────────────────┐
│ JOIN CODE: [ABC123]  Students: 24  [End]     │
├──────────────────────────────────────────────┤
│ Current Slide preview (left, 40%)            │
│                    │ Response Grid (right)   │
│                    │ ████ 18/24 answered     │
│                    │ [Grid of student tiles] │
├──────────────────────────────────────────────┤
│ [◀ Prev]  Slide 2 / 5  [Next ▶]   Timer: 45s│
└──────────────────────────────────────────────┘
```

### Student View (`/join/[code]`)

```
┌──────────────────────────────────────────────┐
│ Logo        Hi, Alex!        ● Connected     │
├──────────────────────────────────────────────┤
│                                              │
│   GRAPH or QUESTION fills this area          │
│                                              │
│   MCQ: Large touch-friendly option buttons   │
│   [A] Option text                            │
│   [B] Option text                            │
│   [C] Option text                            │
│   [D] Option text                            │
│                                              │
│         [Submit Answer]                      │
│                                              │
└──────────────────────────────────────────────┘
Mobile: Full viewport, large tap targets (48px+)
```

---

## 7. Performance Benchmarks

### Targets

| Metric | Target | Strategy |
|---|---|---|
| LCP | < 1.8s | Static hero, font preload, image optimization |
| CLS | < 0.05 | Fixed dimensions on all images/embeds |
| TTI | < 2.5s | Minimal JS on landing, code splitting |
| Initial Bundle | < 200kb | Tree-shaking, dynamic imports for graph |
| Supabase Realtime | < 100ms | WebSocket subscription, edge region |

### How Achieved

1. **Static-first:** Landing page is fully static (React Server Components)
2. **Dynamic imports:** `GraphCanvas` loaded only in builder/session
3. **Font strategy:** Google Fonts preconnect + display=swap
4. **Image optimization:** Next.js Image component, WebP/AVIF
5. **Edge deployment:** Vercel Edge Network (IAD1, SFO1, LHR1)
6. **Realtime via WebSocket:** No polling — Supabase Realtime channels
7. **Zustand:** 800b store vs Redux's 15kb

---

## 8. SEO Framework

### URL Patterns

```
/                          → Landing
/about                     → About page
/pricing                   → Pricing
/blog/[slug]               → Blog posts
/join/[code]               → noindex (dynamic session)
/dashboard/*               → noindex (authenticated)
```

### Meta Structure

```tsx
// Root layout metadata
export const metadata: Metadata = {
  title: { default: "Rekhachitra", template: "%s | Rekhachitra" },
  description: "Live interactive math classroom for IB MYP teachers. Create graph-based activities, run live sessions, see instant results.",
  openGraph: {
    type: "website",
    siteName: "Rekhachitra",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
```

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Rekhachitra",
  "applicationCategory": "EducationalApplication",
  "audience": { "@type": "EducationalAudience", "educationalRole": "teacher" },
  "offers": { "@type": "Offer", "price": "0" }
}
```

### robots.txt

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /join/

Sitemap: https://rekhachitra.app/sitemap.xml
```

---

## 9. Phase 2+ Extension Points

The architecture is designed to accommodate:

- **Video Checkpoints:** `slides.type = 'video'` + `slides.video_url` column. VideoPlayer component injected into StudentSlideView.
- **Advanced Analytics:** `responses` table is already rich enough. Add `analytics_snapshots` table for computed aggregates.
- **AI Questions:** API route `POST /api/activities/[id]/generate` calls Claude API with graph context.
- **Class Grouping:** Add `classes` table, `class_members` junction. Filter dashboard by class.
- **CSV Export:** Server-side route `GET /api/sessions/[id]/export.csv` using Supabase admin queries.
