"use client";

import { Mail, AtSign, Building2, Link2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  mockGmailAccounts,
  mockAliases,
  mockProviders,
  mockAliasProviderLinks,
} from "@/lib/mock-data";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  const { user } = useAuth();

  const activeAliases = mockAliases.filter((a) => !a.archived);
  const archivedAliases = mockAliases.filter((a) => a.archived);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Welcome back, {user?.displayName ?? "Admin"}
        </h1>
        <p className="mt-1 text-[var(--color-text-dim)]">
          Overview of your Gmail accounts, aliases, and providers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Gmail Accounts"
          count={mockGmailAccounts.length}
          icon={Mail}
          href="/gmail-accounts"
        />
        <SummaryCard
          title="Aliases"
          count={activeAliases.length}
          subtitle={`${archivedAliases.length} archived`}
          icon={AtSign}
          href="/aliases"
        />
        <SummaryCard
          title="Providers"
          count={mockProviders.length}
          icon={Building2}
          href="/providers"
        />
        <SummaryCard
          title="Links"
          count={mockAliasProviderLinks.length}
          icon={Link2}
          href="/aliases"
        />
      </div>

      <QuickActions />
    </div>
  );
}
