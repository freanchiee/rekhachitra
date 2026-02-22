import { cn } from "@/lib/utils/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "teal" | "yellow" | "white";
}

const sizeMap = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-3", lg: "w-12 h-12 border-4" };
const colorMap = {
  teal: "border-[var(--color-brand-teal)] border-t-transparent",
  yellow: "border-[var(--color-brand-yellow)] border-t-transparent",
  white: "border-white border-t-transparent",
};

export function Spinner({ size = "md", color = "teal", className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("rounded-full animate-spin", sizeMap[size], colorMap[color], className)}
    />
  );
}
