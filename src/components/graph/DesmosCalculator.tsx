"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

// ── Desmos global type shim ───────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DesmosHandle {
  getState: () => Record<string, unknown>;
  setState: (state: Record<string, unknown>) => void;
}

interface Props {
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  /**
   * Student exploration mode: shows the expressions panel with draggable sliders
   * but hides formula-editing UI (no + button, no keypad, no settings menu).
   * Takes precedence over readOnly when both are set.
   */
  studentMode?: boolean;
  /** Loaded once on mount. Switch slides by changing the `key` prop. */
  initialState?: Record<string, unknown> | null;
  onStateChange?: (state: Record<string, unknown>) => void;
}

const SCRIPT_ID = "desmos-api-v18";
const SCRIPT_SRC =
  "https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";

// ── Slider-bounds injection ───────────────────────────────────────────────────
// AI-generated Desmos states often contain slider variables like `a=1` without
// `sliderBounds`. Desmos only shows the interactive slider track when the bounds
// are present in the loaded state. This helper detects those expressions and
// injects default bounds so sliders render immediately on load.

/** Returns true if `latex` looks like a bare variable assignment: `a=1`, `v_0=15`, `\theta=0.9` */
function isSliderLike(latex: string): boolean {
  const s = latex.trim().replace(/\s+/g, "");
  // LHS: plain identifier OR backslash-command (e.g. \theta), optional subscript
  // RHS: a plain number (integer or decimal, optionally negative)
  return /^(?:\\[a-zA-Z]+|[a-zA-Z][a-zA-Z0-9]*)(?:_\{?[a-zA-Z0-9]+\}?)?=-?\d+(?:\.\d+)?$/.test(s);
}

/** Inject `sliderBounds` into any expression that looks like a slider but is missing them. */
function injectSliderBounds(
  state: Record<string, unknown>,
  bounds = { min: "-10", max: "10", step: "" }
): Record<string, unknown> {
  try {
    const exprs = (state?.expressions as { list?: unknown[] } | undefined)?.list;
    if (!Array.isArray(exprs)) return state;
    let changed = false;
    const processed = exprs.map((raw) => {
      const expr = raw as Record<string, unknown>;
      if (
        expr.type === "expression" &&
        typeof expr.latex === "string" &&
        !expr.sliderBounds &&
        isSliderLike(expr.latex)
      ) {
        changed = true;
        return { ...expr, sliderBounds: bounds };
      }
      return expr;
    });
    if (!changed) return state;
    return {
      ...state,
      expressions: { ...(state.expressions as Record<string, unknown>), list: processed },
    };
  } catch {
    return state;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const DesmosCalculator = forwardRef<DesmosHandle, Props>(
  ({ className, style, readOnly = false, studentMode = false, initialState, onStateChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const calcRef = useRef<any>(null);
    const onChangeRef = useRef(onStateChange);
    onChangeRef.current = onStateChange;

    useImperativeHandle(ref, () => ({
      getState: () => calcRef.current?.getState() ?? {},
      setState: (state) => calcRef.current?.setState(state, { allowUndo: false }),
    }));

    useEffect(() => {
      const init = () => {
        if (!containerRef.current || !(window as any).Desmos) return;
        if (calcRef.current) return; // already mounted

        // Three display modes:
        //   edit    — full Desmos UI (teacher building an activity)
        //   student — expressions panel + sliders visible; no editing chrome
        //   display — completely read-only, no panel (teacher session preview)
        const isEdit    = !readOnly && !studentMode;
        const isStudent = studentMode;               // overrides readOnly
        const isDisplay = readOnly && !studentMode;

        const calc = (window as any).Desmos.GraphingCalculator(containerRef.current, {
          readOnly:          isDisplay,              // Desmos API level lock
          settingsMenu:      isEdit,
          expressionsTopbar: isEdit,                 // hides the "+" add-expression button
          expressions:       isEdit || isStudent,    // show panel in edit + student modes
          zoomButtons:       true,
          keypad:            isEdit,                 // hide formula keyboard in student mode
          border:            false,
          images:            isEdit,
          notes:             isEdit,
          folders:           isEdit,
          sliders:           isEdit || isStudent,    // enable "add slider: a b all" prompt
          links:             isEdit,
          distributions:     isEdit,
          lockViewport:      isDisplay,
          administerSecretFolders: false,
          autosize:          true,
        });

        // Pre-process the state to inject sliderBounds so that AI-generated
        // expressions like `a=1` render with interactive slider tracks.
        const stateToLoad =
          initialState && Object.keys(initialState).length > 0
            ? injectSliderBounds(initialState)
            : initialState;
        if (stateToLoad && Object.keys(stateToLoad).length > 0) {
          calc.setState(stateToLoad, { allowUndo: false });
        }

        calc.observeEvent("change", () => {
          onChangeRef.current?.(calc.getState());
        });

        calcRef.current = calc;
      };

      // Load or reuse the script
      const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (!existing) {
        const s = document.createElement("script");
        s.id = SCRIPT_ID;
        s.src = SCRIPT_SRC;
        s.async = true;
        s.onload = init;
        document.head.appendChild(s);
      } else if ((window as any).Desmos) {
        init();
      } else {
        existing.addEventListener("load", init, { once: true });
      }

      return () => {
        calcRef.current?.destroy();
        calcRef.current = null;
      };
      // deps intentionally empty — initialState & readOnly are mount-only
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width: "100%", height: "100%", ...style }}
      />
    );
  }
);

DesmosCalculator.displayName = "DesmosCalculator";
export default DesmosCalculator;
