import Link from "next/link";
import { Plus, PlayCircle, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Placeholder stats for MVP (replace with real Supabase data)
const stats = [
  {
    label: "Activities",
    value: "0",
    icon: "📋",
    color: "var(--color-brand-teal)",
    bg: "rgba(27, 120, 136, 0.08)",
  },
  {
    label: "Sessions run",
    value: "0",
    icon: "⚡",
    color: "var(--color-brand-coral)",
    bg: "rgba(246, 94, 93, 0.08)",
  },
  {
    label: "Students reached",
    value: "0",
    icon: "👥",
    color: "var(--color-brand-mint)",
    bg: "rgba(45, 184, 158, 0.08)",
  },
];

export default function DashboardOverviewPage() {
  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            Welcome back 👋
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Here&apos;s your classroom overview
          </p>
        </div>
        <Link href="/dashboard/activities/new" className="btn btn-primary gap-2">
          <Plus size={16} />
          New Activity
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: stat.bg }}
            >
              {stat.icon}
            </div>
            <div>
              <p
                className="text-3xl font-bold"
                style={{ color: stat.color, fontFamily: "var(--font-heading)" }}
              >
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/activities/new"
          className="card p-6 flex items-center gap-4 hover:shadow-brand transition-shadow group"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(27, 120, 136, 0.1)" }}
          >
            <Plus size={22} style={{ color: "var(--color-brand-teal)" }} />
          </div>
          <div className="flex-1">
            <h3
              className="font-bold mb-0.5"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
            >
              Create activity
            </h3>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Build graph slides and checkpoint questions
            </p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--color-brand-teal)" }} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/activities"
          className="card p-6 flex items-center gap-4 hover:shadow-brand transition-shadow group"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(246, 94, 93, 0.08)" }}
          >
            <PlayCircle size={22} style={{ color: "var(--color-brand-coral)" }} />
          </div>
          <div className="flex-1">
            <h3
              className="font-bold mb-0.5"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
            >
              Launch session
            </h3>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Pick an activity and go live with your class
            </p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--color-brand-coral)" }} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Empty state for recent activity */}
      <div className="card p-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          📊
        </div>
        <h3
          className="text-lg font-bold mb-2"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
        >
          No sessions yet
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
          Create an activity and launch your first live session to see analytics here.
        </p>
        <Link href="/dashboard/activities/new" className="btn btn-primary btn-sm">
          <Plus size={14} />
          Create first activity
        </Link>
      </div>
    </div>
  );
}
