import { cn } from "@/lib/utils/cn";

const COLORS = [
  "#f5c000", // yellow
  "#2db89e", // mint
  "#1b7888", // teal
  "#f65e5d", // coral
  "#8b5cf6", // purple (accent, not brand primary)
  "#f97316", // orange (accent)
];

function seedToIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % COLORS.length;
}

interface AvatarProps {
  seed: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-xl",
};

export function Avatar({ seed, name, size = "md", className }: AvatarProps) {
  const color = COLORS[seedToIndex(seed)];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white select-none",
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: color, fontFamily: "var(--font-heading)" }}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}
