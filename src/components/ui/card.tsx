import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6",
        className
      )}
      {...props}
    />
  );
}
