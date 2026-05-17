"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Sparkles,
  AtSign,
  Building2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/lib/auth/auth-context";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNavItem } from "./sidebar-nav-item";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Gmail Accounts", icon: Mail, path: "/gmail-accounts" },
  { label: "Generate", icon: Sparkles, path: "/generate" },
  { label: "Aliases", icon: AtSign, path: "/aliases" },
  { label: "Providers", icon: Building2, path: "/providers" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggle } = useSidebar();
  const { logout } = useAuth();

  function isActive(path: string) {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside
      className="flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200"
      style={{ width: isCollapsed ? 64 : 240 }}
    >
      <SidebarHeader collapsed={isCollapsed} />

      <nav className="flex-1 flex flex-col gap-1 px-2 py-2">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            label={item.label}
            icon={item.icon}
            path={item.path}
            active={isActive(item.path)}
            collapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-1 px-2 py-3 border-t border-[var(--color-border)]">
        <SidebarNavItem
          label="Logout"
          icon={LogOut}
          active={false}
          collapsed={isCollapsed}
          onClick={handleLogout}
        />
        <button
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <>
              <PanelLeftClose size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
