import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "yellow" | "mint" | "teal" | "coral" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClass: Record<BadgeVariant, string> = {
  yellow: "badge-yellow",
  mint: "badge-mint",
  teal: "badge-teal",
  coral: "badge-coral",
  neutral: "bg-gray-100 text-gray-600",
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span className={cn("badge", variantClass[variant], className)} {...props}>
      {children}
    </span>
  );
}
