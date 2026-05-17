import { Lock } from "lucide-react";

interface SidebarHeaderProps {
  collapsed: boolean;
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[var(--color-border)]">
      <Lock size={20} className="text-[var(--color-accent)] shrink-0" />
      {!collapsed && (
        <span className="text-base font-semibold text-[var(--color-text)] font-mono tracking-tight">
          DotVault
        </span>
      )}
    </div>
  );
}
