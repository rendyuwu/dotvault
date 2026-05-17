import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface SummaryCardProps {
  title: string;
  count: number;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
}

export function SummaryCard({
  title,
  count,
  subtitle,
  icon: Icon,
  href,
}: SummaryCardProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6",
        "transition-all duration-200 hover:border-[var(--color-accent)]/50 hover:scale-[1.02]"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
          <Icon size={20} className="text-[var(--color-accent)]" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-semibold font-mono text-[var(--color-text)]">
          {count}
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-dim)]">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}
