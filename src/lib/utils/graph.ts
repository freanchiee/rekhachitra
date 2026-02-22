import { type GraphState, type Viewport } from "@/types";

export const DEFAULT_VIEWPORT: Viewport = {
  xMin: -10,
  xMax: 10,
  yMin: -7,
  yMax: 7,
};

export const DEFAULT_GRAPH_STATE: GraphState = {
  expressions: [],
  viewport: DEFAULT_VIEWPORT,
  settings: {
    showGrid: true,
    showAxes: true,
    showLabels: true,
    polarMode: false,
  },
};

/**
 * Convert graph coordinates to SVG pixel coordinates.
 */
export function graphToPixel(
  graphX: number,
  graphY: number,
  viewport: Viewport,
  svgWidth: number,
  svgHeight: number
): { x: number; y: number } {
  const rangeX = viewport.xMax - viewport.xMin;
  const rangeY = viewport.yMax - viewport.yMin;
  return {
    x: ((graphX - viewport.xMin) / rangeX) * svgWidth,
    y: ((viewport.yMax - graphY) / rangeY) * svgHeight,
  };
}

/**
 * Convert SVG pixel coordinates to graph coordinates.
 */
export function pixelToGraph(
  pixelX: number,
  pixelY: number,
  viewport: Viewport,
  svgWidth: number,
  svgHeight: number
): { x: number; y: number } {
  const rangeX = viewport.xMax - viewport.xMin;
  const rangeY = viewport.yMax - viewport.yMin;
  return {
    x: viewport.xMin + (pixelX / svgWidth) * rangeX,
    y: viewport.yMax - (pixelY / svgHeight) * rangeY,
  };
}

/**
 * Evaluate a simple linear equation y = mx + b for plotting.
 * Returns an array of [x, y] sample points.
 */
export function sampleLinear(
  m: number,
  b: number,
  viewport: Viewport,
  samples = 100
): [number, number][] {
  const points: [number, number][] = [];
  const step = (viewport.xMax - viewport.xMin) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = viewport.xMin + i * step;
    const y = m * x + b;
    if (y >= viewport.yMin && y <= viewport.yMax) {
      points.push([x, y]);
    }
  }
  return points;
}

/**
 * Parse a simple "y = mx + b" or "y = ax^2 + bx + c" expression.
 * Returns a function x → y for plotting, or null if unparseable.
 */
export function parseSimpleExpression(latex: string): ((x: number) => number) | null {
  // Strip whitespace and normalize
  const expr = latex.replace(/\s+/g, "").toLowerCase();

  // Match y = mx + b  (e.g., y=2x+3, y=-x+1, y=x, y=3)
  const linearMatch = expr.match(/^y=(-?\d*\.?\d*)x([+-]\d*\.?\d*)?$/);
  if (linearMatch) {
    const m = linearMatch[1] === "" || linearMatch[1] === "-" ? (linearMatch[1] === "-" ? -1 : 1) : parseFloat(linearMatch[1]);
    const b = linearMatch[2] ? parseFloat(linearMatch[2]) : 0;
    if (!isNaN(m) && !isNaN(b)) return (x) => m * x + b;
  }

  // Match y = c (constant)
  const constMatch = expr.match(/^y=(-?\d+\.?\d*)$/);
  if (constMatch) {
    const c = parseFloat(constMatch[1]);
    if (!isNaN(c)) return () => c;
  }

  // Match x = c (vertical line)
  const vertMatch = expr.match(/^x=(-?\d+\.?\d*)$/);
  if (vertMatch) {
    // Return null - vertical lines are handled separately
    return null;
  }

  return null;
}

/**
 * Generate SVG path data from a series of [x, y] graph points.
 */
export function pointsToSvgPath(
  points: [number, number][],
  viewport: Viewport,
  svgWidth: number,
  svgHeight: number
): string {
  if (points.length === 0) return "";
  return points
    .map(([gx, gy], i) => {
      const { x, y } = graphToPixel(gx, gy, viewport, svgWidth, svgHeight);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
