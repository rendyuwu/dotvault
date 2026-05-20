import { Mail, AtSign, Building2, Link2 } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { requireUser } from "@/lib/auth/server";
import { getDashboardSummary } from "@/lib/dashboard/actions";

export default async function DashboardPage() {
  const [user, summary] = await Promise.all([
    requireUser(),
    getDashboardSummary(),
  ]);

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
          count={summary.gmailAccountCount}
          icon={Mail}
          href="/gmail-accounts"
        />
        <SummaryCard
          title="Aliases"
          count={summary.activeAliasCount}
          subtitle={`${summary.archivedAliasCount} archived`}
          icon={AtSign}
          href="/aliases"
        />
        <SummaryCard
          title="Providers"
          count={summary.activeProviderCount}
          icon={Building2}
          href="/providers"
        />
        <SummaryCard
          title="Links"
          count={summary.activeAliasProviderLinkCount}
          icon={Link2}
          href="/aliases"
        />
      </div>

      <QuickActions />
    </div>
  );
}
