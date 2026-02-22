import { type StudentSession } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

interface SessionLeaderboardProps {
  students: StudentSession[];
  limit?: number;
}

export function SessionLeaderboard({ students, limit = 10 }: SessionLeaderboardProps) {
  const sorted = [...students].sort((a, b) => b.score - a.score).slice(0, limit);

  const medalColor = ["#f5c000", "#9ca3af", "#cd7f32"];

  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
      >
        Leaderboard
      </p>
      {sorted.map((student, i) => (
        <div
          key={student.id}
          className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{
            backgroundColor: i === 0 ? "rgba(245, 192, 0, 0.08)" : "var(--color-surface)",
            border: `1px solid ${i === 0 ? "rgba(245, 192, 0, 0.3)" : "var(--color-border)"}`,
          }}
        >
          <span
            className="w-6 text-center font-bold text-sm flex-shrink-0"
            style={{
              color: medalColor[i] ?? "var(--color-muted)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {i + 1}
          </span>
          <Avatar seed={student.avatarSeed} name={student.displayName} size="sm" />
          <span
            className="flex-1 text-sm font-medium truncate"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-body)" }}
          >
            {student.displayName}
          </span>
          <span
            className="text-sm font-bold flex-shrink-0"
            style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
          >
            {student.score} pts
          </span>
        </div>
      ))}
      {students.length === 0 && (
        <div
          className="text-center py-4 text-sm"
          style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
        >
          No scores yet
        </div>
      )}
    </div>
  );
}
