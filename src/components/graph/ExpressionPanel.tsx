"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { type Expression, type GraphState } from "@/types";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/utils/session";
import { cn } from "@/lib/utils/cn";

const COLORS = ["#1b7888", "#f65e5d", "#2db89e", "#f5c000", "#8b5cf6", "#f97316"];

interface ExpressionPanelProps {
  state: GraphState;
  onChange: (state: GraphState) => void;
  readOnly?: boolean;
}

export function ExpressionPanel({ state, onChange, readOnly = false }: ExpressionPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addExpression = () => {
    const newExpr: Expression = {
      id: generateId(),
      latex: "",
      type: "equation",
      color: COLORS[state.expressions.length % COLORS.length],
      hidden: false,
    };
    onChange({ ...state, expressions: [...state.expressions, newExpr] });
    setEditingId(newExpr.id);
  };

  const updateExpression = (id: string, patch: Partial<Expression>) => {
    onChange({
      ...state,
      expressions: state.expressions.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const removeExpression = (id: string) => {
    onChange({ ...state, expressions: state.expressions.filter((e) => e.id !== id) });
    if (editingId === id) setEditingId(null);
  };

  const toggleHidden = (id: string, current?: boolean) => {
    updateExpression(id, { hidden: !current });
  };

  return (
    <div className="flex flex-col gap-2 p-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
        >
          Expressions
        </span>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={addExpression} className="gap-1 px-2 py-1">
            <Plus size={14} />
            Add
          </Button>
        )}
      </div>

      {state.expressions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "var(--color-surface)" }}>
            <span className="text-xl">📈</span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
            No expressions yet
          </p>
          {!readOnly && (
            <p className="text-xs mt-1" style={{ color: "var(--color-subtle)" }}>
              Click &ldquo;+ Add&rdquo; to plot a function
            </p>
          )}
        </div>
      )}

      {state.expressions.map((expr) => (
        <ExpressionRow
          key={expr.id}
          expression={expr}
          isEditing={editingId === expr.id}
          readOnly={readOnly}
          onEdit={() => setEditingId(expr.id)}
          onBlur={() => setEditingId(null)}
          onUpdate={(patch) => updateExpression(expr.id, patch)}
          onRemove={() => removeExpression(expr.id)}
          onToggleHidden={() => toggleHidden(expr.id, expr.hidden)}
        />
      ))}
    </div>
  );
}

interface ExpressionRowProps {
  expression: Expression;
  isEditing: boolean;
  readOnly: boolean;
  onEdit: () => void;
  onBlur: () => void;
  onUpdate: (patch: Partial<Expression>) => void;
  onRemove: () => void;
  onToggleHidden: () => void;
}

function ExpressionRow({
  expression,
  isEditing,
  readOnly,
  onEdit,
  onBlur,
  onUpdate,
  onRemove,
  onToggleHidden,
}: ExpressionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
        isEditing
          ? "border-[var(--color-brand-teal)] bg-white"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      )}
    >
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: expression.color ?? "#1b7888" }}
      />

      {/* Input or display */}
      {isEditing && !readOnly ? (
        <input
          type="text"
          value={expression.latex}
          onChange={(e) => onUpdate({ latex: e.target.value })}
          onBlur={onBlur}
          autoFocus
          placeholder="e.g. y = 2x + 1"
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}
        />
      ) : (
        <button
          onClick={readOnly ? undefined : onEdit}
          className={cn(
            "flex-1 text-left text-sm truncate",
            !expression.latex && "italic",
            expression.hidden && "opacity-40"
          )}
          style={{ color: expression.latex ? "var(--color-ink)" : "var(--color-subtle)", fontFamily: "var(--font-body)" }}
          disabled={readOnly}
        >
          {expression.latex || "Empty expression"}
        </button>
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleHidden}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title={expression.hidden ? "Show" : "Hide"}
          >
            {expression.hidden ? <EyeOff size={13} color="#9ca3af" /> : <Eye size={13} color="#9ca3af" />}
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-50 transition-colors"
            title="Remove expression"
          >
            <Trash2 size={13} color="#f65e5d" />
          </button>
        </div>
      )}
    </div>
  );
}
