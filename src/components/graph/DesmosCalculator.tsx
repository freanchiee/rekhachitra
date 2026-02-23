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
  /** Loaded once on mount. Switch slides by changing the `key` prop. */
  initialState?: Record<string, unknown> | null;
  onStateChange?: (state: Record<string, unknown>) => void;
}

const SCRIPT_ID = "desmos-api-v18";
const SCRIPT_SRC =
  "https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";

// ── Component ─────────────────────────────────────────────────────────────────

const DesmosCalculator = forwardRef<DesmosHandle, Props>(
  ({ className, style, readOnly = false, initialState, onStateChange }, ref) => {
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

        const calc = (window as any).Desmos.GraphingCalculator(containerRef.current, {
          readOnly,
          settingsMenu: !readOnly,
          expressionsTopbar: !readOnly,
          expressions: !readOnly,
          zoomButtons: true,
          keypad: !readOnly,
          border: false,
          images: !readOnly,
          notes: !readOnly,
          lockViewport: readOnly,
          administerSecretFolders: false,
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
