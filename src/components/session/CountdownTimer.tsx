"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface CountdownTimerProps {
  seconds: number;
  onExpire?: () => void;
  paused?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { container: "w-12 h-12", text: "text-sm", stroke: 2 },
  md: { container: "w-20 h-20", text: "text-2xl", stroke: 3 },
  lg: { container: "w-28 h-28", text: "text-4xl", stroke: 4 },
};

export function CountdownTimer({
  seconds,
  onExpire,
  paused = false,
  className,
  size = "md",
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { container, text, stroke } = sizeMap[size];

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, onExpire]);

  const progress = remaining / seconds;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  const color =
    remaining <= 5 ? "var(--color-brand-coral)" :
    remaining <= 10 ? "var(--color-brand-yellow)" :
    "var(--color-brand-mint)";

  return (
    <div className={cn("relative flex items-center justify-center", container, className)}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s ease" }}
        />
      </svg>
      <span
        className={cn("font-bold z-10", text)}
        style={{ color, fontFamily: "var(--font-heading)" }}
      >
        {remaining}
      </span>
    </div>
  );
}
