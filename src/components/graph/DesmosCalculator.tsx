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

        if (initialState && Object.keys(initialState).length > 0) {
          calc.setState(initialState, { allowUndo: false });
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
