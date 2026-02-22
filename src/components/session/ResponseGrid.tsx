"use client";

import { type StudentSession, type Response } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";

interface ResponseGridProps {
  students: StudentSession[];
  responses: Response[];
  slideId?: string;
}

export function ResponseGrid({ students, responses, slideId }: ResponseGridProps) {
  const answeredIds = new Set(
    responses
      .filter((r) => !slideId || r.slideId === slideId)
      .map((r) => r.studentSessionId)
  );

  const answered = students.filter((s) => answeredIds.has(s.id));

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: students.length > 0 ? `${(answered.length / students.length) * 100}%` : "0%",
              backgroundColor: "var(--color-brand-mint)",
            }}
          />
        </div>
        <span
          className="text-sm font-semibold whitespace-nowrap"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
        >
          {answered.length} / {students.length}
        </span>
      </div>

      {/* Student tiles */}
      <div className="flex flex-wrap gap-2">
        {students.map((student) => {
          const hasAnswered = answeredIds.has(student.id);
          return (
            <div
              key={student.id}
              title={student.displayName}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                hasAnswered
                  ? "border-[var(--color-brand-mint)] bg-[rgba(45,184,158,0.08)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60"
              )}
            >
              <div className="relative">
                <Avatar seed={student.avatarSeed} name={student.displayName} size="sm" />
                {hasAnswered && (
                  <div
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: "var(--color-brand-mint)", fontSize: 8 }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <span
                className="text-xs max-w-[56px] truncate text-center"
                style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}
              >
                {student.displayName.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div
          className="text-center py-6 text-sm"
          style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
        >
          Waiting for students to join...
        </div>
      )}
    </div>
  );
}
