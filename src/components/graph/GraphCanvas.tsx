"use client";

import { useRef, useCallback, useMemo, useState } from "react";
import { type GraphState } from "@/types";
import {
  graphToPixel,
  parseSimpleExpression,
  DEFAULT_GRAPH_STATE,
} from "@/lib/utils/graph";
import { cn } from "@/lib/utils/cn";

// ── Color palette for expressions ────────────────────────────────────────────
const EXPRESSION_COLORS = [
  "#1b7888", // teal
  "#f65e5d", // coral
  "#2db89e", // mint
  "#f5c000", // yellow
  "#8b5cf6", // purple
  "#f97316", // orange
];

interface GraphCanvasProps {
  state?: GraphState;
  onChange?: (state: GraphState) => void;
  readOnly?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export function GraphCanvas({
  state = DEFAULT_GRAPH_STATE,
  onChange,
  readOnly = false,
  className,
  width = 600,
  height = 420,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vp: state.viewport });

  // ── Grid lines ─────────────────────────────────────────────────────────────
  const gridLines = useMemo(() => {
    const { viewport, settings } = state;
    if (!settings.showGrid) return null;

    const lines: { x1: number; y1: number; x2: number; y2: number; isAxis: boolean }[] = [];

    // Vertical grid lines
    for (let gx = Math.ceil(viewport.xMin); gx <= viewport.xMax; gx++) {
      const { x: px } = graphToPixel(gx, 0, viewport, width, height);
      lines.push({ x1: px, y1: 0, x2: px, y2: height, isAxis: gx === 0 });
    }

    // Horizontal grid lines
    for (let gy = Math.ceil(viewport.yMin); gy <= viewport.yMax; gy++) {
      const { y: py } = graphToPixel(0, gy, viewport, width, height);
      lines.push({ x1: 0, y1: py, x2: width, y2: py, isAxis: gy === 0 });
    }

    return lines;
  }, [state, width, height]);

  // ── Axis labels ────────────────────────────────────────────────────────────
  const axisLabels = useMemo(() => {
    if (!state.settings.showLabels) return [];
    const { viewport } = state;
    const labels: { x: number; y: number; text: string }[] = [];

    // X axis numbers
    for (let gx = Math.ceil(viewport.xMin); gx <= viewport.xMax; gx++) {
      if (gx === 0) continue;
      const { x: px, y: py } = graphToPixel(gx, 0, viewport, width, height);
      const labelY = Math.min(Math.max(py + 14, 14), height - 4);
      labels.push({ x: px, y: labelY, text: String(gx) });
    }

    // Y axis numbers
    for (let gy = Math.ceil(viewport.yMin); gy <= viewport.yMax; gy++) {
      if (gy === 0) continue;
      const { x: px, y: py } = graphToPixel(0, gy, viewport, width, height);
      const labelX = Math.min(Math.max(px - 10, 4), width - 4);
      labels.push({ x: labelX, y: py + 4, text: String(gy) });
    }

    return labels;
  }, [state, width, height]);

  // ── Expression paths ───────────────────────────────────────────────────────
  const expressionPaths = useMemo(() => {
    return state.expressions.map((expr, i) => {
      const color = expr.color ?? EXPRESSION_COLORS[i % EXPRESSION_COLORS.length];
      const fn = parseSimpleExpression(expr.latex);
      if (!fn) return { id: expr.id, color, path: "", points: [] as [number, number][] };

      const samples = 300;
      const points: [number, number][] = [];
      const step = (state.viewport.xMax - state.viewport.xMin) / samples;

      for (let j = 0; j <= samples; j++) {
        const x = state.viewport.xMin + j * step;
        const y = fn(x);
        if (isFinite(y) && y >= state.viewport.yMin - 1 && y <= state.viewport.yMax + 1) {
          points.push([x, y]);
        } else if (points.length > 0) {
          points.push([NaN, NaN]); // break the path
        }
      }

      const path = points
        .reduce((acc, [gx, gy], idx) => {
          if (isNaN(gx)) return acc + " ";
          const { x, y } = graphToPixel(gx, gy, state.viewport, width, height);
          const prev = points[idx - 1];
          const isStart = !prev || isNaN(prev[0]);
          return acc + `${isStart ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
        }, "")
        .trim();

      return { id: expr.id, color, path, points };
    });
  }, [state, width, height]);

  // ── Panning ────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (readOnly || e.button !== 0) return;
      isPanning.current = true;
      setIsCursorGrabbing(true);
      panStart.current = { x: e.clientX, y: e.clientY, vp: state.viewport };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [readOnly, state.viewport]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isPanning.current || readOnly || !onChange) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const vp = panStart.current.vp;
      const rangeX = vp.xMax - vp.xMin;
      const rangeY = vp.yMax - vp.yMin;
      const shiftX = -(dx / width) * rangeX;
      const shiftY = (dy / height) * rangeY;
      onChange({
        ...state,
        viewport: {
          xMin: vp.xMin + shiftX,
          xMax: vp.xMax + shiftX,
          yMin: vp.yMin + shiftY,
          yMax: vp.yMax + shiftY,
        },
      });
    },
    [readOnly, onChange, state, width, height]
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
    setIsCursorGrabbing(false);
  }, []);

  // ── Wheel zoom ─────────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      if (readOnly || !onChange) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const vp = state.viewport;
      const centerX = (vp.xMin + vp.xMax) / 2;
      const centerY = (vp.yMin + vp.yMax) / 2;
      const rangeX = (vp.xMax - vp.xMin) * factor;
      const rangeY = (vp.yMax - vp.yMin) * factor;
      onChange({
        ...state,
        viewport: {
          xMin: centerX - rangeX / 2,
          xMax: centerX + rangeX / 2,
          yMin: centerY - rangeY / 2,
          yMax: centerY + rangeY / 2,
        },
      });
    },
    [readOnly, onChange, state]
  );

  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-white", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ cursor: readOnly ? "default" : isCursorGrabbing ? "grabbing" : "grab", display: "block" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        aria-label="Mathematical graph canvas"
      >
        {/* Background */}
        <rect width={width} height={height} fill="#fafafa" />

        {/* Grid */}
        {gridLines?.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.isAxis ? "#1a1a2e" : "#e5e7eb"}
            strokeWidth={line.isAxis ? 1.5 : 0.8}
            strokeOpacity={line.isAxis ? 0.7 : 1}
          />
        ))}

        {/* Axis labels */}
        {axisLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            fontSize={10}
            textAnchor="middle"
            fill="#6b7280"
            style={{ userSelect: "none", fontFamily: "var(--font-body)" }}
          >
            {label.text}
          </text>
        ))}

        {/* Origin label */}
        {state.settings.showLabels && (() => {
          const origin = graphToPixel(0, 0, state.viewport, width, height);
          if (origin.x > 4 && origin.x < width - 4 && origin.y > 4 && origin.y < height - 14) {
            return (
              <text x={origin.x - 10} y={origin.y + 14} fontSize={10} fill="#6b7280" style={{ userSelect: "none" }}>
                0
              </text>
            );
          }
          return null;
        })()}

        {/* Expressions */}
        {expressionPaths.map((ep) =>
          ep.path ? (
            <path
              key={ep.id}
              d={ep.path}
              fill="none"
              stroke={ep.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null
        )}
      </svg>
    </div>
  );
}
