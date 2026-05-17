"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Pencil,
  Archive,
  X,
  Check,
  Link2,
  ExternalLink,
} from "lucide-react";
import { useGmailAccounts } from "@/lib/mock-data/gmail-accounts-context";
import { useProviders } from "@/lib/mock-data/providers-context";
import { LinkAliasProviderModal } from "@/components/link-alias-provider-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { aliases, accounts } = useGmailAccounts();
  const {
    providers,
    updateProvider,
    archiveProvider,
    getLinksForProvider,
    archiveLink,
  } = useProviders();

  const provider = providers.find((p) => p.id === id);
  const providerLinks = provider ? getLinksForProvider(provider.id) : [];

  const [editingField, setEditingField] = useState<
    "info" | "notes" | null
  >(null);
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<
    "provider" | string | null
  >(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (!archiveTarget) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setArchiveTarget(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [archiveTarget]);

  if (!provider) {
    return (
      <div className="space-y-4">
        <Link
          href="/providers"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Providers
        </Link>
        <Card className="py-12 text-center">
          <p className="text-[var(--color-text-dim)]">Provider not found.</p>
        </Card>
      </div>
    );
  }

  function startEditInfo() {
    setEditingField("info");
    setEditName(provider!.name);
    setEditWebsite(provider!.website ?? "");
    setEditCategory(provider!.category ?? "");
  }

  function startEditNotes() {
    setEditingField("notes");
    setEditNotes(provider!.notes ?? "");
  }

  function saveInfo() {
    updateProvider(provider!.id, {
      name: editName.trim() || provider!.name,
      website: editWebsite.trim() || null,
      category: editCategory.trim() || null,
    });
    setEditingField(null);
  }

  function saveNotes() {
    updateProvider(provider!.id, { notes: editNotes.trim() || null });
    setEditingField(null);
  }

  function confirmArchive() {
    if (archiveTarget === "provider") {
      archiveProvider(provider!.id);
    } else if (archiveTarget) {
      archiveLink(archiveTarget);
    }
    setArchiveTarget(null);
  }

  function getAlias(aliasId: string) {
    return aliases.find((a) => a.id === aliasId);
  }

  function getAccountLabel(gmailAccountId: string) {
    return accounts.find((a) => a.id === gmailAccountId)?.label ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <Link
        href="/providers"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Providers
      </Link>

      <Card>
        {editingField === "info" ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-provider-name" className="text-xs text-[var(--color-text-dim)]">
                Name
              </label>
              <input
                id="edit-provider-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-provider-website" className="text-xs text-[var(--color-text-dim)]">
                Website
              </label>
              <input
                id="edit-provider-website"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="e.g. github.com"
                className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-provider-category" className="text-xs text-[var(--color-text-dim)]">
                Category
              </label>
              <input
                id="edit-provider-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="e.g. Developer Tools"
                className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={saveInfo}>
                <Check size={14} className="mr-1" />
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditingField(null)}>
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                {provider.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {provider.website && (
                  <span className="flex items-center gap-1 text-sm text-[var(--color-text-dim)]">
                    <ExternalLink size={12} />
                    {provider.website}
                  </span>
                )}
                {provider.category && (
                  <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
                    {provider.category}
                  </span>
                )}
                {provider.archived && (
                  <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                    archived
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-muted)]">
                <span>{providerLinks.length} linked aliases</span>
                <span>
                  Added {new Date(provider.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!provider.archived && (
                <>
                  <button
                    onClick={startEditInfo}
                    className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                    aria-label="Edit provider"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setArchiveTarget("provider")}
                    className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-red-400 transition-colors"
                    aria-label="Archive provider"
                  >
                    <Archive size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[var(--color-text)]">
            Notes
          </h2>
          {editingField !== "notes" && (
            <button
              onClick={startEditNotes}
              className="rounded-lg p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Edit notes"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        {editingField === "notes" ? (
          <div className="space-y-3">
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this provider..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={saveNotes}>
                <Check size={14} className="mr-1" />
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditingField(null)}>
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm ${provider.notes ? "text-[var(--color-text-dim)]" : "text-[var(--color-muted)] italic"}`}
          >
            {provider.notes ?? "No notes"}
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--color-text)]">
            Linked Aliases
          </h2>
          <Button
            variant="secondary"
            onClick={() => setShowLinkModal(true)}
          >
            <Link2 size={14} className="mr-1" />
            Link Alias
          </Button>
        </div>

        {providerLinks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No aliases linked yet.
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
            >
              Link your first alias
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-2 text-left font-medium text-[var(--color-text-dim)]">
                    Alias
                  </th>
                  <th className="pb-2 text-left font-medium text-[var(--color-text-dim)]">
                    Account
                  </th>
                  <th className="pb-2 text-left font-medium text-[var(--color-text-dim)]">
                    Identifier
                  </th>
                  <th className="pb-2 text-left font-medium text-[var(--color-text-dim)]">
                    Notes
                  </th>
                  <th className="pb-2 text-right font-medium text-[var(--color-text-dim)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {providerLinks.map((link) => {
                  const linkedAlias = getAlias(link.aliasId);
                  if (!linkedAlias) return null;
                  return (
                    <tr
                      key={link.id}
                      className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/aliases/${linkedAlias.id}`}
                          className="font-mono text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                        >
                          {linkedAlias.aliasEmail}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]">
                          {getAccountLabel(linkedAlias.gmailAccountId)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {link.accountIdentifier ? (
                          <span className="font-mono text-[var(--color-text-dim)]">
                            {link.accountIdentifier}
                          </span>
                        ) : (
                          <span className="text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {link.notes ? (
                          <span className="text-[var(--color-text-dim)]">
                            {link.notes}
                          </span>
                        ) : (
                          <span className="text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/aliases/${linkedAlias.id}`}
                            className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                            aria-label={`View ${linkedAlias.aliasEmail}`}
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            onClick={() => setArchiveTarget(link.id)}
                            className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-red-400 transition-colors"
                            aria-label="Remove link"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {archiveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setArchiveTarget(null);
          }}
        >
          <Card className="w-full max-w-sm">
            <h2
              id="archive-dialog-title"
              className="text-lg font-medium text-[var(--color-text)]"
            >
              {archiveTarget === "provider"
                ? "Archive Provider"
                : "Remove Link"}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-dim)]">
              {archiveTarget === "provider"
                ? "This provider will be hidden from the default view. Alias links will remain intact."
                : "This will remove the link between this provider and the alias."}
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setArchiveTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmArchive}
                className="!bg-red-500 hover:!bg-red-600"
              >
                {archiveTarget === "provider" ? "Archive" : "Remove"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showLinkModal && (
        <LinkAliasProviderModal
          mode="link-alias"
          fixedProviderId={provider.id}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
