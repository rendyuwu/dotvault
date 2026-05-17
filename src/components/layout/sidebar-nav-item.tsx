import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface SidebarNavItemProps {
  label: string;
  icon: LucideIcon;
  path: string;
  active: boolean;
  collapsed: boolean;
}

export function SidebarNavItem({
  label,
  icon: Icon,
  path,
  active,
  collapsed,
}: SidebarNavItemProps) {
  return (
    <Link
      href={path}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-l-2 border-[var(--color-accent)]"
          : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
