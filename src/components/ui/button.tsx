import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-[var(--color-accent)] text-[var(--color-base)] hover:bg-[var(--color-accent-hover)]",
        variant === "secondary" &&
          "border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
        variant === "ghost" &&
          "text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
        className
      )}
      {...props}
    />
  );
}
