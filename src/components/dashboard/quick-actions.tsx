import Link from "next/link";
import { Plus, Sparkles, AtSign, Building2 } from "lucide-react";
import clsx from "clsx";

const actions = [
  { label: "Add Gmail Account", icon: Plus, href: "/gmail-accounts/new", variant: "primary" as const },
  { label: "Generate Aliases", icon: Sparkles, href: "/generate", variant: "primary" as const },
  { label: "View Aliases", icon: AtSign, href: "/aliases", variant: "secondary" as const },
  { label: "Manage Providers", icon: Building2, href: "/providers", variant: "secondary" as const },
];

export function QuickActions() {
  return (
    <section>
      <h2 className="text-lg font-medium text-[var(--color-text)] mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={clsx(
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              action.variant === "primary" &&
                "bg-[var(--color-accent)] text-[var(--color-base)] hover:bg-[var(--color-accent-hover)]",
              action.variant === "secondary" &&
                "border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            <action.icon size={16} />
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
