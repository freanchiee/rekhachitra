"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Play, Save } from "lucide-react";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { ExpressionPanel } from "@/components/graph/ExpressionPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useBuilderStore } from "@/lib/store/session.store";
import { generateId } from "@/lib/utils/session";
import { DEFAULT_GRAPH_STATE } from "@/lib/utils/graph";
import type { Activity, Slide, GraphState, CheckpointType } from "@/types";
import { cn } from "@/lib/utils/cn";

// ── Seed activity ──────────────────────────────────────────────────────────

const SEED_ACTIVITY: Activity = {
  id: generateId(),
  teacherId: "local-teacher",
  title: "Untitled Activity",
  description: "",
  isPublic: false,
  status: "draft",
  slides: [
    {
      id: generateId(),
      activityId: "seed",
      position: 0,
      type: "graph",
      title: "Introduction",
      instructions: "Explore the graph below.",
      graphState: DEFAULT_GRAPH_STATE,
      checkpoint: null,
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Checkpoint type options ─────────────────────────────────────────────────

const checkpointTypes: { value: CheckpointType; label: string; icon: string }[] = [
  { value: "none", label: "No question", icon: "—" },
  { value: "mcq", label: "Multiple choice", icon: "🔘" },
  { value: "short_answer", label: "Short answer", icon: "✏️" },
  { value: "graph", label: "Graph response", icon: "📈" },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function NewActivityPage() {
  const { activity, activeSlideIndex, isDirty, setActivity, setActiveSlide, updateSlide, addSlide, removeSlide, updateActivity } =
    useBuilderStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setActivity(SEED_ACTIVITY);
  }, [setActivity]);

  const slides = activity?.slides ?? [];
  const activeSlide = slides[activeSlideIndex] ?? null;

  const handleSave = async () => {
    setSaving(true);
    // In production: PATCH /api/activities/:id
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGraphChange = (state: GraphState) => {
    updateSlide(activeSlideIndex, { graphState: state });
  };

  const setCheckpointType = (type: CheckpointType) => {
    if (type === "none") {
      updateSlide(activeSlideIndex, { checkpoint: null });
      return;
    }
    updateSlide(activeSlideIndex, {
      checkpoint: {
        type,
        question: "",
        options:
          type === "mcq"
            ? [
                { id: generateId(), text: "", isCorrect: false },
                { id: generateId(), text: "", isCorrect: false },
                { id: generateId(), text: "", isCorrect: false },
                { id: generateId(), text: "", isCorrect: false },
              ]
            : undefined,
        timeLimit: 30,
        points: 10,
      },
    });
  };

  if (!activity) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-[var(--color-brand-teal)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <Link
          href="/dashboard/activities"
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
        >
          <ArrowLeft size={18} style={{ color: "var(--color-muted)" }} />
        </Link>

        <input
          type="text"
          value={activity.title}
          onChange={(e) => updateActivity({ title: e.target.value })}
          className="flex-1 text-lg font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-[var(--color-brand-teal)] px-1 transition-colors"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          placeholder="Activity title..."
        />

        {isDirty && (
          <Badge variant="neutral" className="text-xs">
            Unsaved
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          loading={saving}
          className="gap-1.5"
        >
          <Save size={15} />
          {saved ? "Saved!" : "Save"}
        </Button>

        <Link
          href={`/dashboard/sessions?activity=${activity.id}`}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <Play size={15} />
          Launch
        </Link>
      </header>

      {/* ── Main 3-column layout ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left: Slide list ──────────────────────────────────────── */}
        <aside
          className="w-44 flex-shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="p-2 flex-1">
            {slides.map((slide, i) => (
              <SlideThumb
                key={slide.id}
                slide={slide}
                index={i}
                isActive={i === activeSlideIndex}
                onSelect={() => setActiveSlide(i)}
                onRemove={slides.length > 1 ? () => removeSlide(i) : undefined}
              />
            ))}
            <button
              onClick={() => addSlide(slides.length - 1)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border-dashed border-2 text-xs font-medium transition-colors hover:bg-white"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-muted)",
              }}
            >
              <Plus size={14} />
              Add slide
            </button>
          </div>
        </aside>

        {/* ── Center: Graph canvas ──────────────────────────────────── */}
        <main
          className="flex-1 flex flex-col min-w-0"
          style={{ backgroundColor: "#f0f4f8" }}
        >
          {activeSlide ? (
            <div className="flex-1 flex flex-col p-4 gap-3 overflow-auto">
              {/* Slide meta */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={activeSlide.title ?? ""}
                    onChange={(e) => updateSlide(activeSlideIndex, { title: e.target.value })}
                    placeholder="Slide title (optional)"
                    className="w-full text-base font-semibold bg-white border-b-2 border-transparent focus:border-[var(--color-brand-teal)] outline-none px-2 py-1.5 rounded-t-lg transition-colors"
                    style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
                  />
                </div>
              </div>

              <input
                type="text"
                value={activeSlide.instructions ?? ""}
                onChange={(e) => updateSlide(activeSlideIndex, { instructions: e.target.value })}
                placeholder="Instructions for students (optional)"
                className="w-full text-sm bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--color-brand-teal)] transition-colors"
                style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}
              />

              {/* Graph canvas */}
              <GraphCanvas
                state={activeSlide.graphState ?? DEFAULT_GRAPH_STATE}
                onChange={handleGraphChange}
                className="flex-1 min-h-64"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: "var(--color-muted)" }}>Select a slide</p>
            </div>
          )}
        </main>

        {/* ── Right: Expression + Checkpoint panel ─────────────────── */}
        <aside
          className="w-64 flex-shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
        >
          {activeSlide ? (
            <>
              {/* Expressions */}
              <div className="flex-1 border-b" style={{ borderColor: "var(--color-border)" }}>
                <ExpressionPanel
                  state={activeSlide.graphState ?? DEFAULT_GRAPH_STATE}
                  onChange={handleGraphChange}
                />
              </div>

              {/* Checkpoint */}
              <div className="p-3 flex flex-col gap-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
                >
                  Checkpoint
                </p>

                {/* Type selector */}
                <div className="flex flex-col gap-1">
                  {checkpointTypes.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCheckpointType(opt.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                        (activeSlide.checkpoint?.type ?? "none") === opt.value
                          ? "text-white"
                          : "hover:bg-[var(--color-surface)]"
                      )}
                      style={{
                        backgroundColor:
                          (activeSlide.checkpoint?.type ?? "none") === opt.value
                            ? "var(--color-brand-teal)"
                            : "transparent",
                        color:
                          (activeSlide.checkpoint?.type ?? "none") === opt.value
                            ? "white"
                            : "var(--color-ink-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Checkpoint fields */}
                {activeSlide.checkpoint && activeSlide.checkpoint.type !== "none" && (
                  <CheckpointEditor
                    checkpoint={activeSlide.checkpoint}
                    onChange={(cp) => updateSlide(activeSlideIndex, { checkpoint: cp })}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="p-4 text-center" style={{ color: "var(--color-muted)" }}>
              Select a slide to edit
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── SlideThumb ─────────────────────────────────────────────────────────────

function SlideThumb({
  slide,
  index,
  isActive,
  onSelect,
  onRemove,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative group rounded-xl mb-1.5 cursor-pointer overflow-hidden border-2 transition-all",
        isActive
          ? "border-[var(--color-brand-teal)]"
          : "border-transparent hover:border-[var(--color-border)]"
      )}
      onClick={onSelect}
    >
      {/* Thumbnail preview */}
      <div
        className="w-full h-20 flex items-center justify-center text-2xl"
        style={{
          backgroundColor: isActive
            ? "rgba(27, 120, 136, 0.06)"
            : "var(--color-white)",
        }}
      >
        {slide.type === "graph" ? "📈" : slide.type === "mcq" ? "🔘" : "✏️"}
      </div>
      {/* Slide number label */}
      <div
        className="px-2 py-1 flex items-center justify-between"
        style={{ backgroundColor: isActive ? "rgba(27, 120, 136, 0.04)" : "var(--color-surface)" }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: isActive ? "var(--color-brand-teal)" : "var(--color-muted)", fontFamily: "var(--font-body)" }}
        >
          {index + 1}
        </span>
        {slide.checkpoint && (
          <span className="text-xs">💬</span>
        )}
      </div>
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-white shadow-sm transition-opacity"
          title="Remove slide"
        >
          <Trash2 size={12} color="#f65e5d" />
        </button>
      )}
    </div>
  );
}

// ── CheckpointEditor ───────────────────────────────────────────────────────

function CheckpointEditor({
  checkpoint,
  onChange,
}: {
  checkpoint: NonNullable<Slide["checkpoint"]>;
  onChange: (cp: NonNullable<Slide["checkpoint"]>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Input
        label="Question"
        placeholder="Type your question..."
        value={checkpoint.question}
        onChange={(e) => onChange({ ...checkpoint, question: e.target.value })}
      />

      {checkpoint.type === "mcq" && checkpoint.options && (
        <div className="flex flex-col gap-1.5">
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
          >
            Options (click ✓ = correct)
          </p>
          {checkpoint.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  onChange({
                    ...checkpoint,
                    options: checkpoint.options?.map((o) => ({ ...o, isCorrect: o.id === opt.id })),
                  })
                }
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors"
                style={{
                  borderColor: opt.isCorrect ? "var(--color-brand-mint)" : "var(--color-border)",
                  backgroundColor: opt.isCorrect ? "var(--color-brand-mint)" : "transparent",
                }}
              >
                {opt.isCorrect && <span className="text-white text-xs">✓</span>}
              </button>
              <span
                className="w-5 text-xs font-bold flex-shrink-0"
                style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <input
                type="text"
                value={opt.text}
                onChange={(e) =>
                  onChange({
                    ...checkpoint,
                    options: checkpoint.options?.map((o) =>
                      o.id === opt.id ? { ...o, text: e.target.value } : o
                    ),
                  })
                }
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none focus:border-[var(--color-brand-teal)] transition-colors min-w-0"
                style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-muted)" }}>
            Time limit (s)
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={checkpoint.timeLimit ?? 30}
            onChange={(e) => onChange({ ...checkpoint, timeLimit: Number(e.target.value) })}
            className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none focus:border-[var(--color-brand-teal)] transition-colors"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-muted)" }}>
            Points
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={checkpoint.points ?? 10}
            onChange={(e) => onChange({ ...checkpoint, points: Number(e.target.value) })}
            className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none focus:border-[var(--color-brand-teal)] transition-colors"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
          />
        </div>
      </div>
    </div>
  );
}
