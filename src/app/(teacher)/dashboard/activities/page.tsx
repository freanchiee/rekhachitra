"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, Sparkles, Layers, Trash2, Edit2, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Activity, ActivityStatus } from "@/types";

const LS_ACTIVITIES_KEY = "rk_activities";

const statusVariant: Record<ActivityStatus, "neutral" | "mint" | "teal"> = {
  draft: "neutral",
  active: "mint",
  archived: "teal",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ACTIVITIES_KEY);
      if (raw) {
        const map: Record<string, Activity> = JSON.parse(raw);
        // Sort newest first by updatedAt
        const sorted = Object.values(map).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setActivities(sorted);
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  const handleDelete = (id: string) => {
    try {
      const raw = localStorage.getItem(LS_ACTIVITIES_KEY);
      if (!raw) return;
      const map: Record<string, Activity> = JSON.parse(raw);
      delete map[id];
      localStorage.setItem(LS_ACTIVITIES_KEY, JSON.stringify(map));
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
  };

  const handleStatusChange = (id: string, status: ActivityStatus) => {
    try {
      const raw = localStorage.getItem(LS_ACTIVITIES_KEY);
      if (!raw) return;
      const map: Record<string, Activity> = JSON.parse(raw);
      if (!map[id]) return;
      map[id] = { ...map[id], status, updatedAt: new Date().toISOString() };
      localStorage.setItem(LS_ACTIVITIES_KEY, JSON.stringify(map));
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch { /* ignore */ }
  };

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
            {loaded ? (
              activities.length === 0
                ? "No activities yet — create one below"
                : `${activities.length} activit${activities.length === 1 ? "y" : "ies"} saved locally`
            ) : (
              "Loading…"
            )}
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
      {!loaded ? (
        <div className="flex justify-center py-24">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }}
          />
        </div>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onDelete={() => handleDelete(activity.id)}
              onStatusChange={(status) => handleStatusChange(activity.id, status)}
            />
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
            Activities you create or generate with AI will appear here.
            They&apos;re saved automatically in your browser.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard/activities/generate" className="btn btn-outline gap-2">
              <Sparkles size={16} />
              Generate with AI
            </Link>
            <Link href="/dashboard/activities/new" className="btn btn-primary gap-2">
              <Plus size={16} />
              Create activity
            </Link>
          </div>
        </div>
      )}

      {/* Storage notice */}
      {loaded && activities.length > 0 && (
        <p className="mt-6 text-xs text-center" style={{ color: "var(--color-subtle)" }}>
          Activities are saved in your browser&apos;s local storage. They persist across sessions on this device.
        </p>
      )}
    </div>
  );
}

function ActivityCard({
  activity,
  onDelete,
  onStatusChange,
}: {
  activity: Activity;
  onDelete: () => void;
  onStatusChange: (status: ActivityStatus) => void;
}) {
  const slideCount = activity.slides?.length ?? 0;
  const blockCount = activity.slides?.reduce((sum, s) => sum + (s.content?.length ?? 0), 0) ?? 0;
  const isDraft = activity.status === "draft";

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-brand transition-shadow group">
      {/* Top row: status badge + delete */}
      <div className="flex items-start justify-between gap-2">
        <Badge variant={statusVariant[activity.status] ?? "neutral"}>
          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
        </Badge>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm("Delete this activity? This cannot be undone.")) onDelete();
          }}
          className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete activity"
          title="Delete activity"
        >
          <Trash2 size={15} style={{ color: "var(--color-brand-coral)" }} />
        </button>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="font-bold mb-1 line-clamp-2"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
          {activity.title || "Untitled Activity"}
        </h3>
        {activity.description && (
          <p className="text-sm line-clamp-2" style={{ color: "var(--color-muted)" }}>
            {activity.description}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-subtle)" }}>
        <span className="flex items-center gap-1">
          <Layers size={11} />
          {slideCount} slide{slideCount !== 1 ? "s" : ""}
        </span>
        {blockCount > 0 && (
          <span>{blockCount} block{blockCount !== 1 ? "s" : ""}</span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={11} />
          {formatDate(activity.updatedAt)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <Link href={`/dashboard/activities/new?id=${activity.id}`}
          className="btn btn-outline btn-sm gap-1.5">
          <Edit2 size={13} />
          Edit
        </Link>

        {isDraft ? (
          <button
            onClick={() => onStatusChange("active")}
            className="btn btn-sm gap-1.5 flex-1 text-center"
            style={{ backgroundColor: "rgba(245,192,0,0.12)", color: "#92740a", border: "1px solid rgba(245,192,0,0.35)", fontFamily: "var(--font-body)", borderRadius: "var(--radius-md)" }}
          >
            <Rocket size={13} />
            Publish
          </button>
        ) : (
          <button
            onClick={() => onStatusChange("draft")}
            className="btn btn-sm gap-1.5 flex-1 text-center"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border)", fontFamily: "var(--font-body)", borderRadius: "var(--radius-md)" }}
          >
            Unpublish
          </button>
        )}

        <Link href={`/dashboard/sessions?activity=${activity.id}`}
          className="btn btn-primary btn-sm gap-1.5">
          Launch
        </Link>
      </div>
    </div>
  );
}
