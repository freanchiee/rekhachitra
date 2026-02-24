"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Play, Save,
  Eye, EyeOff, Type, Image as ImageIcon, MessageSquare, BarChart2,
  GripVertical, X, Monitor, Check, Clock, Upload, ChevronDown, ChevronUp,
} from "lucide-react";
import DesmosCalculator, { type DesmosHandle } from "@/components/graph/DesmosCalculator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useBuilderStore } from "@/lib/store/session.store";
import { generateId } from "@/lib/utils/session";
import type { Activity, Slide, CheckpointType, ContentBlock } from "@/types";
import { cn } from "@/lib/utils/cn";

// ── Constants ──────────────────────────────────────────────────────────────

const LS_AUTOSAVE_KEY = "rk_autosave_draft";

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
      type: "info",
      title: "Introduction",
      instructions: "Welcome! Add content blocks below.",
      graphState: null,
      desmosState: null,
      checkpoint: null,
      content: [],
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const checkpointTypes: { value: CheckpointType; label: string; icon: string }[] = [
  { value: "none", label: "No question", icon: "—" },
  { value: "mcq", label: "Multiple choice", icon: "🔘" },
  { value: "short_answer", label: "Short answer", icon: "✏️" },
  { value: "graph", label: "Graph response", icon: "📈" },
];

// Migrate legacy slides that only have desmosState (from AI generator)
function migrateActivity(activity: Activity): Activity {
  return {
    ...activity,
    slides: (activity.slides ?? []).map((slide) => {
      if (!slide.content?.length && slide.desmosState) {
        return {
          ...slide,
          content: [
            { id: generateId(), type: "graph" as const, desmosState: slide.desmosState },
          ],
        };
      }
      if (!slide.content) {
        return { ...slide, content: [] };
      }
      return slide;
    }),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function NewActivityPage() {
  const {
    activity,
    activeSlideIndex,
    isDirty,
    setActivity,
    setActiveSlide,
    updateSlide,
    addSlide,
    removeSlide,
    updateActivity,
    addBlock,
    replaceBlock,
    removeBlock,
    reorderBlocks,
    pendingActivity,
    clearPendingActivity,
    markSaved,
  } = useBuilderStore();

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "pending" | "saved">("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [leftWidth, setLeftWidth] = useState(176);
  const [rightWidth, setRightWidth] = useState(260);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mount: load pending activity or autosave ───────────────────────────
  useEffect(() => {
    if (pendingActivity) {
      setActivity(migrateActivity(pendingActivity));
      clearPendingActivity();
    } else {
      const saved = localStorage.getItem(LS_AUTOSAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Activity;
          setActivity(migrateActivity(parsed));
        } catch {
          setActivity(SEED_ACTIVITY);
        }
      } else {
        setActivity(SEED_ACTIVITY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autosave to localStorage ───────────────────────────────────────────
  useEffect(() => {
    if (!isDirty || !activity) return;
    setAutosaveStatus("pending");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(LS_AUTOSAVE_KEY, JSON.stringify(activity));
        setLastSaved(new Date());
        setAutosaveStatus("saved");
        markSaved();
      } catch {
        // Storage quota exceeded (large images)
        setAutosaveStatus("idle");
      }
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [activity, isDirty, markSaved]);

  const slides = activity?.slides ?? [];
  const activeSlide = slides[activeSlideIndex] ?? null;

  // ── Manual save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!activity) return;
    setSaving(true);
    try {
      localStorage.setItem(LS_AUTOSAVE_KEY, JSON.stringify(activity));
      setLastSaved(new Date());
      setAutosaveStatus("saved");
      markSaved();
    } finally {
      setSaving(false);
    }
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
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand-teal)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 py-2.5 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <Link
          href="/dashboard/activities"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-muted)" }}
        >
          <ArrowLeft size={18} />
        </Link>

        <input
          type="text"
          value={activity.title}
          onChange={(e) => updateActivity({ title: e.target.value })}
          className="flex-1 text-lg font-bold bg-transparent outline-none border-b-2 border-transparent px-1 transition-colors"
          style={{
            color: "var(--color-ink)",
            fontFamily: "var(--font-heading)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-brand-teal)")}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
          placeholder="Activity title..."
        />

        {/* Autosave status */}
        <AutosaveIndicator status={autosaveStatus} lastSaved={lastSaved} isDirty={isDirty} />

        <Button variant="ghost" size="sm" onClick={handleSave} loading={saving} className="gap-1.5">
          <Save size={15} />
          Save
        </Button>

        {/* Preview button */}
        <button
          onClick={() => { setPreviewSlideIndex(activeSlideIndex); setShowPreview(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
          style={{
            borderColor: "var(--color-brand-teal)",
            color: "var(--color-brand-teal)",
            fontFamily: "var(--font-body)",
          }}
        >
          <Monitor size={15} />
          Preview
        </button>

        <Link
          href={`/dashboard/sessions?activity=${activity.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-body)" }}
        >
          <Play size={15} />
          Launch
        </Link>
      </header>

      {/* ── Main 3-column layout ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* ── Left: Slide list ─────────────────────────────────────── */}
        {leftCollapsed ? (
          <aside
            className="flex-shrink-0 flex flex-col items-center pt-2 border-r"
            style={{ width: 28, backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <button
              onClick={() => setLeftCollapsed(false)}
              title="Expand slides panel"
              className="p-1 rounded hover:bg-[var(--color-border)] transition-colors"
              style={{ color: "var(--color-muted)" }}
            >
              <ChevronRight size={14} />
            </button>
          </aside>
        ) : (
          <aside
            className="flex-shrink-0 flex flex-col border-r overflow-y-auto"
            style={{ width: leftWidth, backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div
              className="flex items-center justify-between px-2 py-1.5 border-b flex-shrink-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                Slides
              </span>
              <button
                onClick={() => setLeftCollapsed(true)}
                className="p-0.5 rounded hover:bg-[var(--color-border)] transition-colors"
                style={{ color: "var(--color-muted)" }}
              >
                <ChevronLeft size={14} />
              </button>
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
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
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border-dashed border-2 text-xs font-medium transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-white)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Plus size={14} />
                Add slide
              </button>
            </div>
          </aside>
        )}

        {/* Resize handle: left */}
        {!leftCollapsed && (
          <ResizeHandle
            onMouseDown={(e) => startResize(e, leftWidth, setLeftWidth, 120, 320, 1)}
          />
        )}

        {/* ── Center: Block editor ─────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          {activeSlide ? (
            <>
              {/* Slide meta */}
              <div
                className="flex-shrink-0 flex gap-3 px-4 pt-3 pb-2 border-b"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}
              >
                <input
                  type="text"
                  value={activeSlide.title ?? ""}
                  onChange={(e) => updateSlide(activeSlideIndex, { title: e.target.value })}
                  placeholder="Slide title (optional)"
                  className="flex-1 text-sm font-semibold bg-transparent outline-none border-b-2 border-transparent px-1 py-0.5 transition-colors"
                  style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-brand-teal)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
                />
                <input
                  type="text"
                  value={activeSlide.instructions ?? ""}
                  onChange={(e) => updateSlide(activeSlideIndex, { instructions: e.target.value })}
                  placeholder="Instructions for students (optional)"
                  className="flex-1 text-sm bg-transparent outline-none border-b-2 border-transparent px-1 py-0.5 transition-colors"
                  style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-brand-teal)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
                />
              </div>

              {/* Block list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {(activeSlide.content ?? []).length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <p className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>
                      This slide is empty
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
                      Add blocks from the panel on the right →
                    </p>
                  </div>
                )}

                {(activeSlide.content ?? []).map((block, blockIndex) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    index={blockIndex}
                    total={(activeSlide.content ?? []).length}
                    onReplace={(newBlock) => replaceBlock(activeSlideIndex, block.id, newBlock)}
                    onRemove={() => removeBlock(activeSlideIndex, block.id)}
                    onMoveUp={blockIndex > 0 ? () => reorderBlocks(activeSlideIndex, blockIndex, blockIndex - 1) : undefined}
                    onMoveDown={blockIndex < (activeSlide.content ?? []).length - 1 ? () => reorderBlocks(activeSlideIndex, blockIndex, blockIndex + 1) : undefined}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: "var(--color-muted)" }}>Select a slide</p>
            </div>
          )}

          {/* ── Floating transparent preview widget (top-right of center) ── */}
          {activeSlide && (
            <button
              onClick={() => { setPreviewSlideIndex(activeSlideIndex); setShowPreview(true); }}
              className="absolute top-14 right-3 group"
              title="Click to preview this slide as a student"
            >
              <div
                className="rounded-xl border overflow-hidden shadow-lg transition-all group-hover:shadow-xl group-hover:scale-105"
                style={{
                  width: 120,
                  height: 80,
                  backgroundColor: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                  borderColor: "var(--color-border)",
                }}
              >
                {/* Mini preview content */}
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {(activeSlide.content ?? []).slice(0, 4).map((b) => (
                      <BlockTypePill key={b.id} type={b.type} />
                    ))}
                    {(activeSlide.content ?? []).length === 0 && (
                      <span className="text-xs" style={{ color: "var(--color-subtle)" }}>Empty</span>
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold mt-1"
                    style={{ color: "var(--color-brand-teal)" }}
                  >
                    <Eye size={10} className="inline mr-0.5" />
                    Preview
                  </span>
                </div>
              </div>
            </button>
          )}
        </main>

        {/* Resize handle: right */}
        <ResizeHandle
          onMouseDown={(e) => startResize(e, rightWidth, setRightWidth, 200, 420, -1)}
        />

        {/* ── Right: Block palette + Checkpoint ───────────────────── */}
        <aside
          className="flex-shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ width: rightWidth, backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
        >
          {activeSlide ? (
            <>
              {/* Block palette */}
              <div className="p-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
                >
                  Add Block
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <BlockPaletteBtn
                    icon={<Type size={15} />}
                    label="Text"
                    color="var(--color-brand-teal)"
                    onClick={() =>
                      addBlock(activeSlideIndex, { id: generateId(), type: "text", content: "" })
                    }
                  />
                  <BlockPaletteBtn
                    icon={<ImageIcon size={15} />}
                    label="Image"
                    color="var(--color-brand-mint)"
                    onClick={() =>
                      addBlock(activeSlideIndex, { id: generateId(), type: "image", url: "", caption: "" })
                    }
                  />
                  <BlockPaletteBtn
                    icon={<MessageSquare size={15} />}
                    label="Free Response"
                    color="var(--color-brand-coral)"
                    onClick={() =>
                      addBlock(activeSlideIndex, {
                        id: generateId(),
                        type: "free_response",
                        prompt: "",
                        placeholder: "Type your answer here…",
                      })
                    }
                  />
                  <BlockPaletteBtn
                    icon={<BarChart2 size={15} />}
                    label="Graph"
                    color="var(--color-brand-yellow-dark)"
                    onClick={() =>
                      addBlock(activeSlideIndex, { id: generateId(), type: "graph", desmosState: null })
                    }
                  />
                </div>
              </div>

              {/* Checkpoint section */}
              <div className="p-3 flex flex-col gap-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
                >
                  Checkpoint
                </p>
                <div className="flex flex-col gap-1">
                  {checkpointTypes.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCheckpointType(opt.value)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors"
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

      {/* ── Preview Modal ────────────────────────────────────────────── */}
      {showPreview && (
        <PreviewModal
          activity={activity}
          initialSlide={previewSlideIndex}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ── AutosaveIndicator ──────────────────────────────────────────────────────

function AutosaveIndicator({
  status,
  lastSaved,
  isDirty,
}: {
  status: "idle" | "pending" | "saved";
  lastSaved: Date | null;
  isDirty: boolean;
}) {
  if (!isDirty && !lastSaved) return null;

  if (status === "pending" || isDirty) {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-subtle)" }}>
        <Clock size={12} />
        Saving…
      </span>
    );
  }
  if (lastSaved) {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-brand-mint-dark)" }}>
        <Check size={12} />
        Autosaved
      </span>
    );
  }
  return null;
}

// ── BlockTypePill ──────────────────────────────────────────────────────────

function BlockTypePill({ type }: { type: ContentBlock["type"] }) {
  const map: Record<ContentBlock["type"], { label: string; color: string }> = {
    text: { label: "T", color: "var(--color-brand-teal)" },
    image: { label: "IMG", color: "var(--color-brand-mint)" },
    free_response: { label: "FR", color: "var(--color-brand-coral)" },
    graph: { label: "G", color: "var(--color-brand-yellow-dark)" },
  };
  const { label, color } = map[type];
  return (
    <span
      className="text-[9px] font-bold px-1 py-0.5 rounded"
      style={{ backgroundColor: color + "22", color }}
    >
      {label}
    </span>
  );
}

// ── BlockPaletteBtn ────────────────────────────────────────────────────────

function BlockPaletteBtn({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm active:scale-95"
      style={{
        borderColor: color + "55",
        color,
        backgroundColor: color + "0d",
        fontFamily: "var(--font-body)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = color + "22")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = color + "0d")}
    >
      {icon}
      {label}
    </button>
  );
}

// ── BlockEditor ────────────────────────────────────────────────────────────

function BlockEditor({
  block,
  index,
  total,
  onReplace,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  onReplace: (b: ContentBlock) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const blockColors: Record<ContentBlock["type"], string> = {
    text: "var(--color-brand-teal)",
    image: "var(--color-brand-mint)",
    free_response: "var(--color-brand-coral)",
    graph: "var(--color-brand-yellow-dark)",
  };
  const color = blockColors[block.type];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-white)" }}
    >
      {/* Block header bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 border-b"
        style={{ borderColor: "var(--color-border)", backgroundColor: color + "0a" }}
      >
        <GripVertical size={14} style={{ color: "var(--color-subtle)" }} />
        <span
          className="text-xs font-bold uppercase tracking-wide flex-1"
          style={{ color, fontFamily: "var(--font-body)" }}
        >
          {block.type === "free_response" ? "Free Response" : block.type.charAt(0).toUpperCase() + block.type.slice(1)}
        </span>
        {/* Move up/down */}
        <button
          onClick={onMoveUp}
          disabled={!onMoveUp}
          className="p-0.5 rounded transition-colors disabled:opacity-30"
          style={{ color: "var(--color-muted)" }}
          title="Move up"
        >
          <ChevronUp size={13} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!onMoveDown}
          className="p-0.5 rounded transition-colors disabled:opacity-30"
          style={{ color: "var(--color-muted)" }}
          title="Move down"
        >
          <ChevronDown size={13} />
        </button>
        <button
          onClick={onRemove}
          className="p-0.5 rounded transition-colors"
          style={{ color: "var(--color-brand-coral)" }}
          title="Remove block"
        >
          <X size={13} />
        </button>
      </div>

      {/* Block body */}
      <div className="p-3">
        {block.type === "text" && (
          <TextBlockEditor block={block} onReplace={onReplace} />
        )}
        {block.type === "image" && (
          <ImageBlockEditor block={block} onReplace={onReplace} />
        )}
        {block.type === "free_response" && (
          <FreeResponseBlockEditor block={block} onReplace={onReplace} />
        )}
        {block.type === "graph" && (
          <GraphBlockEditor block={block} onReplace={onReplace} />
        )}
      </div>
    </div>
  );
}

// ── TextBlockEditor ────────────────────────────────────────────────────────

function TextBlockEditor({
  block,
  onReplace,
}: {
  block: Extract<ContentBlock, { type: "text" }>;
  onReplace: (b: ContentBlock) => void;
}) {
  return (
    <textarea
      value={block.content}
      onChange={(e) => onReplace({ ...block, content: e.target.value })}
      placeholder="Enter text content for students to read…"
      rows={4}
      className="w-full text-sm rounded-lg border px-3 py-2 outline-none resize-y transition-colors"
      style={{
        borderColor: "var(--color-border)",
        color: "var(--color-ink)",
        fontFamily: "var(--font-body)",
        backgroundColor: "var(--color-surface)",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    />
  );
}

// ── ImageBlockEditor ───────────────────────────────────────────────────────

function ImageBlockEditor({
  block,
  onReplace,
}: {
  block: Extract<ContentBlock, { type: "image" }>;
  onReplace: (b: ContentBlock) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onReplace({ ...block, url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={block.url.startsWith("data:") ? "" : block.url}
          onChange={(e) => onReplace({ ...block, url: e.target.value })}
          placeholder="Paste image URL… or upload below"
          className="flex-1 text-sm rounded-lg border px-3 py-2 outline-none transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-ink)",
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--color-surface)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-mint)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
          style={{
            borderColor: "var(--color-brand-mint)",
            color: "var(--color-brand-mint)",
            backgroundColor: "var(--color-surface)",
          }}
          title="Upload image"
        >
          <Upload size={14} />
          Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Preview */}
      {block.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.url}
          alt={block.caption ?? "Slide image"}
          className="rounded-lg object-contain max-h-48 w-full"
          style={{ backgroundColor: "var(--color-surface)" }}
          onError={(e) => (e.currentTarget.style.display = "none")}
          onLoad={(e) => (e.currentTarget.style.display = "block")}
        />
      )}

      {/* Caption */}
      <input
        type="text"
        value={block.caption ?? ""}
        onChange={(e) => onReplace({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)"
        className="text-xs rounded-lg border px-3 py-1.5 outline-none transition-colors"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-ink-soft)",
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-surface)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-mint)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      />
    </div>
  );
}

// ── FreeResponseBlockEditor ────────────────────────────────────────────────

function FreeResponseBlockEditor({
  block,
  onReplace,
}: {
  block: Extract<ContentBlock, { type: "free_response" }>;
  onReplace: (b: ContentBlock) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={block.prompt}
        onChange={(e) => onReplace({ ...block, prompt: e.target.value })}
        placeholder="Question or prompt for students…"
        className="text-sm rounded-lg border px-3 py-2 outline-none transition-colors font-semibold"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-ink)",
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-surface)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-coral)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      />
      <input
        type="text"
        value={block.placeholder ?? ""}
        onChange={(e) => onReplace({ ...block, placeholder: e.target.value })}
        placeholder="Placeholder text inside the input box (optional)"
        className="text-xs rounded-lg border px-3 py-1.5 outline-none transition-colors"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-ink-soft)",
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-surface)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-coral)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      />
      {/* Student preview of the response box */}
      <div
        className="rounded-lg border-2 border-dashed px-3 py-2 text-xs"
        style={{ borderColor: "var(--color-border)", color: "var(--color-subtle)" }}
      >
        {block.placeholder || "Student types here…"}
      </div>
    </div>
  );
}

// ── GraphBlockEditor ───────────────────────────────────────────────────────

function GraphBlockEditor({
  block,
  onReplace,
}: {
  block: Extract<ContentBlock, { type: "graph" }>;
  onReplace: (b: ContentBlock) => void;
}) {
  const desmosRef = useRef<DesmosHandle>(null);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ height: 340, position: "relative" }}
    >
      <DesmosCalculator
        key={block.id}
        ref={desmosRef}
        initialState={block.desmosState ?? undefined}
        onStateChange={(state) => onReplace({ ...block, desmosState: state })}
        className="absolute inset-0"
      />
    </div>
  );
}

// ── PreviewModal ───────────────────────────────────────────────────────────

function PreviewModal({
  activity,
  initialSlide,
  onClose,
}: {
  activity: Activity;
  initialSlide: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialSlide);
  const slides = activity.slides ?? [];
  const slide = slides[currentIndex];

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [slides.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(26,26,46,0.85)", backdropFilter: "blur(4px)" }}
    >
      {/* Preview header */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <Monitor size={18} style={{ color: "var(--color-brand-teal)" }} />
          <span className="font-bold text-sm" style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}>
            Student Preview — {activity.title}
          </span>
          <Badge variant="neutral" className="text-xs">
            Slide {currentIndex + 1} / {slides.length}
          </Badge>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-lg border transition-colors disabled:opacity-30"
            style={{ borderColor: "var(--color-border)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i === currentIndex
                    ? "var(--color-brand-teal)"
                    : "var(--color-border)",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))}
            disabled={currentIndex === slides.length - 1}
            className="p-1.5 rounded-lg border transition-colors disabled:opacity-30"
            style={{ borderColor: "var(--color-border)" }}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto flex justify-center py-8 px-4">
        <div
          className="w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl"
          style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
        >
          {slide ? (
            <StudentSlideView slide={slide} />
          ) : (
            <div className="flex items-center justify-center py-24" style={{ color: "var(--color-muted)" }}>
              No slides yet
            </div>
          )}
        </div>
      </div>

      <div
        className="text-center py-2 text-xs"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        Press ← → to navigate • Esc to close
      </div>
    </div>
  );
}

// ── StudentSlideView ────────────────────────────────────────────────────────

function StudentSlideView({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col">
      {/* Slide header */}
      {(slide.title || slide.instructions) && (
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          {slide.title && (
            <h2
              className="text-xl font-bold mb-1"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
            >
              {slide.title}
            </h2>
          )}
          {slide.instructions && (
            <p className="text-sm" style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}>
              {slide.instructions}
            </p>
          )}
        </div>
      )}

      {/* Blocks */}
      <div className="p-6 flex flex-col gap-4">
        {(slide.content ?? []).length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "var(--color-subtle)" }}>
            This slide has no content yet.
          </p>
        ) : (
          (slide.content ?? []).map((block) => (
            <StudentBlock key={block.id} block={block} />
          ))
        )}
      </div>

      {/* Checkpoint in student view */}
      {slide.checkpoint && slide.checkpoint.type !== "none" && (
        <div
          className="px-6 pb-6 border-t pt-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <StudentCheckpoint checkpoint={slide.checkpoint} />
        </div>
      )}
    </div>
  );
}

// ── StudentBlock ───────────────────────────────────────────────────────────

function StudentBlock({ block }: { block: ContentBlock }) {
  if (block.type === "text") {
    return (
      <div
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
      >
        {block.content || <span style={{ color: "var(--color-subtle)" }}>[Empty text block]</span>}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="flex flex-col gap-1">
        {block.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.url}
            alt={block.caption ?? ""}
            className="rounded-xl object-contain w-full max-h-64"
            style={{ backgroundColor: "var(--color-surface)" }}
          />
        ) : (
          <div
            className="rounded-xl flex items-center justify-center py-12 text-sm"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-subtle)" }}
          >
            <ImageIcon size={24} className="mr-2" />
            No image set
          </div>
        )}
        {block.caption && (
          <p className="text-xs text-center" style={{ color: "var(--color-muted)" }}>
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "free_response") {
    return (
      <div className="flex flex-col gap-2">
        {block.prompt && (
          <p className="text-sm font-semibold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
            {block.prompt}
          </p>
        )}
        <textarea
          disabled
          placeholder={block.placeholder || "Type your answer here…"}
          rows={3}
          className="w-full text-sm rounded-xl border px-3 py-2 resize-none"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-ink-soft)",
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--color-surface)",
            cursor: "default",
          }}
        />
        <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
          Student text input (disabled in preview)
        </p>
      </div>
    );
  }

  if (block.type === "graph") {
    return (
      <div className="rounded-xl overflow-hidden border" style={{ height: 340, position: "relative", borderColor: "var(--color-border)" }}>
        <DesmosCalculator
          key={`preview-${block.id}`}
          initialState={block.desmosState ?? undefined}
          className="absolute inset-0"
        />
      </div>
    );
  }

  return null;
}

// ── StudentCheckpoint ──────────────────────────────────────────────────────

function StudentCheckpoint({ checkpoint }: { checkpoint: NonNullable<Slide["checkpoint"]> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold" style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
        {checkpoint.question || "Question"}
      </p>
      {checkpoint.type === "mcq" && checkpoint.options && (
        <div className="flex flex-col gap-2">
          {checkpoint.options.map((opt, i) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm text-left transition-all"
              style={{
                borderColor: selected === opt.id ? "var(--color-brand-teal)" : "var(--color-border)",
                backgroundColor: selected === opt.id ? "rgba(27,120,136,0.07)" : "var(--color-surface)",
                color: "var(--color-ink)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  borderColor: selected === opt.id ? "var(--color-brand-teal)" : "var(--color-border)",
                  color: selected === opt.id ? "var(--color-brand-teal)" : "var(--color-muted)",
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt.text || `Option ${String.fromCharCode(65 + i)}`}
            </button>
          ))}
        </div>
      )}
      {checkpoint.type === "short_answer" && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer…"
          rows={3}
          className="w-full text-sm rounded-xl border px-3 py-2 resize-none outline-none transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-ink)",
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--color-surface)",
          }}
        />
      )}
      <button
        className="self-start px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-body)" }}
      >
        Submit
      </button>
    </div>
  );
}

// ── Panel resize helpers ───────────────────────────────────────────────────

function startResize(
  e: React.MouseEvent,
  startWidth: number,
  setWidth: (w: number) => void,
  min: number,
  max: number,
  direction: 1 | -1
) {
  e.preventDefault();
  const startX = e.clientX;
  const onMove = (ev: MouseEvent) =>
    setWidth(Math.max(min, Math.min(max, startWidth + (ev.clientX - startX) * direction)));
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="relative flex-shrink-0 cursor-col-resize group"
      style={{ width: 4, backgroundColor: "var(--color-border)" }}
      onMouseDown={onMouseDown}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "var(--color-brand-teal)" }}
      />
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
  const blocks = slide.content ?? [];
  return (
    <div
      className={cn(
        "relative group rounded-xl mb-1.5 cursor-pointer overflow-hidden border-2 transition-all"
      )}
      style={{
        borderColor: isActive ? "var(--color-brand-teal)" : "transparent",
      }}
      onClick={onSelect}
    >
      <div
        className="w-full h-20 flex flex-col items-start justify-start p-2 gap-1 overflow-hidden"
        style={{
          backgroundColor: isActive ? "rgba(27, 120, 136, 0.06)" : "var(--color-white)",
        }}
      >
        {slide.title && (
          <span
            className="text-[9px] font-bold truncate w-full leading-tight"
            style={{ color: isActive ? "var(--color-brand-teal)" : "var(--color-ink)", fontFamily: "var(--font-heading)" }}
          >
            {slide.title}
          </span>
        )}
        {blocks.length === 0 && !slide.title && (
          <span className="text-xs" style={{ color: "var(--color-subtle)" }}>Empty</span>
        )}
        <div className="flex flex-wrap gap-0.5">
          {blocks.slice(0, 6).map((b) => (
            <BlockTypePill key={b.id} type={b.type} />
          ))}
        </div>
      </div>
      <div
        className="px-2 py-1 flex items-center justify-between"
        style={{
          backgroundColor: isActive ? "rgba(27, 120, 136, 0.04)" : "var(--color-surface)",
        }}
      >
        <span
          className="text-xs font-medium"
          style={{
            color: isActive ? "var(--color-brand-teal)" : "var(--color-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {index + 1}
        </span>
        {slide.checkpoint && <span className="text-xs">💬</span>}
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded shadow-sm transition-opacity"
          style={{ backgroundColor: "var(--color-white)" }}
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
      <input
        type="text"
        placeholder="Type your question..."
        value={checkpoint.question}
        onChange={(e) => onChange({ ...checkpoint, question: e.target.value })}
        className="w-full text-xs px-3 py-2 rounded-lg border outline-none transition-colors"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-ink)",
          fontFamily: "var(--font-body)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      />

      {checkpoint.type === "mcq" && checkpoint.options && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
            Options (click ✓ = correct)
          </p>
          {checkpoint.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  onChange({
                    ...checkpoint,
                    options: checkpoint.options?.map((o) => ({
                      ...o,
                      isCorrect: o.id === opt.id,
                    })),
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
                className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none transition-colors min-w-0"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-ink)",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-teal)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-muted)" }}>
            Time (s)
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={checkpoint.timeLimit ?? 30}
            onChange={(e) => onChange({ ...checkpoint, timeLimit: Number(e.target.value) })}
            className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none transition-colors"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)" }}
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
            className="w-full text-xs px-2 py-1.5 rounded-lg border outline-none transition-colors"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)" }}
          />
        </div>
      </div>
    </div>
  );
}
