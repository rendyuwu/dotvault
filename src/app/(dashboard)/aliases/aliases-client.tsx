"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Copy, Check, ExternalLink, AtSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AliasAccountOption, AliasListItem } from "@/lib/aliases/actions";

type Props = {
  aliases: AliasListItem[];
  accounts: AliasAccountOption[];
  archivedCount: number;
  search: string;
  gmailAccountId: string;
  includeArchived: boolean;
};

export function AliasesClient({
  aliases,
  accounts,
  archivedCount,
  search,
  gmailAccountId,
  includeArchived,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(search);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function updateFilters(next: {
    search?: string;
    gmailAccountId?: string;
    includeArchived?: boolean;
  }) {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? searchQuery;
    const nextAccount = next.gmailAccountId ?? gmailAccountId;
    const nextArchived = next.includeArchived ?? includeArchived;

    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextAccount) params.set("account", nextAccount);
    if (nextArchived) params.set("archived", "1");

    startTransition(() => {
      router.push(`/aliases${params.size ? `?${params}` : ""}`);
    });
  }

  async function copyEmail(id: string, email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Aliases
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-dim)]">
          Browse, search, and manage your saved dot aliases.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateFilters({ search: searchQuery });
            }}
            onBlur={() => updateFilters({ search: searchQuery })}
            placeholder="Search by email..."
            aria-label="Search aliases by email"
            className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <select
          value={gmailAccountId}
          onChange={(e) => updateFilters({ gmailAccountId: e.target.value })}
          aria-label="Filter by Gmail account"
          className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          <option value="">All accounts</option>
          {accounts
            .filter((a) => !a.archived)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
        </select>
        {(archivedCount > 0 || includeArchived) && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-dim)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => updateFilters({ includeArchived: e.target.checked })}
              className="rounded border-[var(--color-border)] bg-[var(--color-base)] accent-[var(--color-accent)]"
            />
            Archived ({archivedCount})
          </label>
        )}
      </div>

      {aliases.length > 0 && (
        <p className="text-xs text-[var(--color-muted)]">
          Showing {aliases.length} aliases
        </p>
      )}

      {aliases.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10 mb-4">
            <AtSign size={24} className="text-[var(--color-accent)]" />
          </div>
          <p className="text-[var(--color-text)] font-medium">
            {searchQuery || gmailAccountId
              ? "No aliases match your filters"
              : "No aliases yet"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            {searchQuery || gmailAccountId
              ? "Try adjusting your search or filter criteria."
              : "Generate dot aliases from the Generate page."}
          </p>
          {!searchQuery && !gmailAccountId && (
            <Link
              href="/generate"
              className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-base)] hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Generate Aliases
            </Link>
          )}
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-dim)]">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-dim)]">
                  Account
                </th>
                <th className="px-4 py-3 text-center font-medium text-[var(--color-text-dim)]">
                  Dots
                </th>
                <th className="px-4 py-3 text-center font-medium text-[var(--color-text-dim)]">
                  Providers
                </th>
                <th className="px-4 py-3 text-right font-medium text-[var(--color-text-dim)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {aliases.map((alias) => (
                <tr
                  key={alias.id}
                  className={`border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors ${alias.archived ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[var(--color-accent)]">
                        {alias.localPartWithDots}
                      </span>
                      <span className="font-mono text-[var(--color-muted)]">
                        @gmail.com
                      </span>
                      {alias.isOriginal && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                          original
                        </span>
                      )}
                      {alias.archived && (
                        <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">
                          archived
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]">
                      {alias.accountLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[var(--color-text-dim)] tabular-nums">
                    {alias.dotCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-mono tabular-nums ${alias.linkCount > 0 ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`}
                    >
                      {alias.linkCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copyEmail(alias.id, alias.aliasEmail)}
                        className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                        aria-label={`Copy ${alias.aliasEmail}`}
                      >
                        {copiedId === alias.id ? (
                          <Check size={14} className="text-[var(--color-accent)]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <Link
                        href={`/aliases/${alias.id}`}
                        className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                        aria-label={`View ${alias.aliasEmail} details`}
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
