import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "yellow" | "coral" | "mint" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  as?: "button";
}

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  yellow: "btn-yellow",
  coral: "btn-coral",
  mint: "btn-mint",
  outline: "btn-outline",
  ghost: "btn-ghost",
};

const sizeClass: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("btn", variantClass[variant], sizeClass[size], className)}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
