import Link from "next/link";
import { Plus, Clock, MoreVertical, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Activities" };

// Placeholder activities — replace with Supabase fetch
const mockActivities = [
  {
    id: "demo-1",
    title: "Linear Functions Explorer",
    description: "Students graph y = mx + b and explore slope and intercept.",
    status: "draft" as const,
    slideCount: 4,
    updatedAt: "2025-06-10",
  },
  {
    id: "demo-2",
    title: "Quadratic Curve Investigation",
    description: "Discover how a, b, c affect y = ax² + bx + c.",
    status: "active" as const,
    slideCount: 6,
    updatedAt: "2025-06-08",
  },
];

const statusVariant = {
  draft: "neutral" as const,
  active: "mint" as const,
  archived: "teal" as const,
};

export default function ActivitiesPage() {
  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            My Activities
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            {mockActivities.length} activit{mockActivities.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/activities/generate" className="btn btn-outline gap-2">
            <Sparkles size={16} />
            Generate with AI
          </Link>
          <Link href="/dashboard/activities/new" className="btn btn-primary gap-2">
            <Plus size={16} />
            New Activity
          </Link>
        </div>
      </div>

      {/* Activity grid */}
      {mockActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          {/* Create new card */}
          <Link
            href="/dashboard/activities/new"
            className="card flex flex-col items-center justify-center p-8 min-h-44 border-dashed hover:shadow-brand transition-shadow text-center group"
            style={{ borderStyle: "dashed" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: "rgba(27, 120, 136, 0.08)" }}
            >
              <Plus size={22} style={{ color: "var(--color-brand-teal)" }} />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-body)" }}
            >
              New activity
            </span>
          </Link>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📐</div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            No activities yet
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            Create your first graph activity to get started.
          </p>
          <Link href="/dashboard/activities/new" className="btn btn-primary">
            <Plus size={16} />
            Create activity
          </Link>
        </div>
      )}
    </div>
  );
}

function ActivityCard({
  activity,
}: {
  activity: (typeof mockActivities)[0];
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-brand transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <Badge variant={statusVariant[activity.status]}>
          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
        </Badge>
        <button
          className="p-1 rounded hover:bg-[var(--color-surface)] transition-colors"
          aria-label="More options"
        >
          <MoreVertical size={16} style={{ color: "var(--color-muted)" }} />
        </button>
      </div>

      <div>
        <h3
          className="font-bold mb-1 line-clamp-2"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
        >
          {activity.title}
        </h3>
        <p
          className="text-sm line-clamp-2"
          style={{ color: "var(--color-muted)" }}
        >
          {activity.description}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-subtle)" }}>
        <span>{activity.slideCount} slides</span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {activity.updatedAt}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <Link
          href={`/dashboard/activities/${activity.id}`}
          className="btn btn-outline btn-sm flex-1 text-center"
        >
          Edit
        </Link>
        <Link
          href={`/dashboard/activities/${activity.id}?launch=1`}
          className="btn btn-primary btn-sm flex-1 text-center"
        >
          Launch
        </Link>
      </div>
    </div>
  );
}
