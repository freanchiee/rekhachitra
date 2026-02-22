# Rekhachitra

**Live interactive math classroom platform for IB MYP teachers and students.**

Inspired by Desmos Classroom's graph-based activities, Kahoot's live participation model, and built for the modern EdTech classroom.

> _Rekhachitra_ (रेखाचित्र) — Sanskrit for "diagram / graph". A fitting name for a graphing-first math platform.

---

## Features (Phase 1 MVP)

- **Graphing Canvas** — Desmos-style interactive graph builder
- **Live Sessions** — Real-time activity sharing via join code
- **Teacher Dashboard** — Create, launch, and monitor activities
- **Student Join Flow** — No login required for students
- **Magic Link Auth** — Passwordless teacher authentication
- **Mobile Responsive** — Works on phones and Chromebooks

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Edge-ready, RSC, file-based routing |
| Language | TypeScript (strict) | Type safety across the board |
| Styling | Tailwind CSS v4 | Utility-first, tiny bundle |
| State | Zustand | Lightweight, no boilerplate |
| Server State | TanStack Query | Caching, refetching, optimistic UI |
| Backend | Supabase | Realtime, auth, Postgres, Row-Level Security |
| Deployment | Vercel (primary) | Edge network, instant CI/CD |
| Package Manager | pnpm | Fast, disk-efficient |

---

## Brand Colors

| Name | Hex | Usage |
|---|---|---|
| Primary Yellow | `#f5c000` | CTAs, highlights, scores |
| Mint Green | `#2db89e` | Success, graph elements |
| Deep Teal | `#1b7888` | Primary actions, nav |
| Coral Red | `#f65e5d` | Alerts, timers, energy |

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/rekhachitra.git
cd rekhachitra

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See `.env.example` for all required variables.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Supabase service role (never expose client-side) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your deployment URL |

---

## Development Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm type-check   # TypeScript type checking
pnpm lint         # ESLint (zero warnings policy)
pnpm format       # Prettier formatting
pnpm ci           # Full CI pipeline (type-check + lint + build)
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Landing, about, pricing
│   ├── (auth)/             # Login, magic link
│   ├── (teacher)/          # Teacher dashboard, builder
│   │   ├── dashboard/
│   │   ├── activities/
│   │   └── session/
│   ├── join/               # Student join flow
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Design system primitives
│   ├── graph/              # GraphCanvas, tools
│   ├── session/            # Live session components
│   ├── teacher/            # Teacher-specific components
│   └── student/            # Student-specific components
├── lib/
│   ├── supabase/           # Supabase client + types
│   ├── store/              # Zustand stores
│   └── utils/              # Shared utilities
└── types/                  # Global TypeScript types
```

---

## Deployment

### Vercel (Primary)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy — Vercel auto-detects Next.js

### GitHub Pages (Static Fallback)

To enable static export, uncomment `output: "export"` in `next.config.ts`.

```bash
pnpm build  # Generates /out directory
```

---

## CI/CD Pipeline

GitHub Actions runs on every push:

1. **Type Check** — `tsc --noEmit`
2. **Lint** — ESLint (zero warnings)
3. **Build** — `next build`

Merge to `main` → Vercel auto-deploys to production.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- Information architecture & sitemap
- Data schema & entity relationships
- API surface
- Component inventory (30+)
- Performance strategy
- SEO framework

---

## Roadmap

| Phase | Status | Features |
|---|---|---|
| Phase 1 | 🚧 Building | Graphing, live sessions, basic auth |
| Phase 2 | 📋 Planned | Video checkpoints (Edpuzzle-style) |
| Phase 3 | 📋 Planned | Advanced analytics (AssessPrep-style) |
| Phase 4 | 📋 Planned | AI-generated questions, CSV export |

---

## License

MIT © Rekhachitra
