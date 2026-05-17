"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Copy,
  Check,
  Pencil,
  Archive,
  X,
  Link2,
  ExternalLink,
} from "lucide-react";
import { useGmailAccounts } from "@/lib/mock-data/gmail-accounts-context";
import { useProviders } from "@/lib/mock-data/providers-context";
import { LinkAliasProviderModal } from "@/components/link-alias-provider-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AliasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { aliases, accounts, updateAlias } = useGmailAccounts();
  const { providers, getLinksForAlias, archiveLink } = useProviders();

  const alias = aliases.find((a) => a.id === id);
  const account = alias
    ? accounts.find((a) => a.id === alias.gmailAccountId)
    : null;
  const aliasLinks = alias ? getLinksForAlias(alias.id) : [];

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<"alias" | string | null>(
    null
  );
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (!archiveTarget) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setArchiveTarget(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [archiveTarget]);

  if (!alias) {
    return (
      <div className="space-y-4">
        <Link
          href="/aliases"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Aliases
        </Link>
        <Card className="py-12 text-center">
          <p className="text-[var(--color-text-dim)]">Alias not found.</p>
        </Card>
      </div>
    );
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(alias!.aliasEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  function startEditNotes() {
    setEditingNotes(true);
    setNotesValue(alias!.notes ?? "");
  }

  function saveNotes() {
    updateAlias(alias!.id, { notes: notesValue.trim() || null });
    setEditingNotes(false);
  }

  function confirmArchive() {
    if (archiveTarget === "alias") {
      updateAlias(alias!.id, { archived: true });
    } else if (archiveTarget) {
      archiveLink(archiveTarget);
    }
    setArchiveTarget(null);
  }

  function getProvider(providerId: string) {
    return providers.find((p) => p.id === providerId);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/aliases"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Aliases
      </Link>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-mono text-[var(--color-accent)]">
              {alias.aliasEmail}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {account && (
                <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]">
                  {account.label}
                </span>
              )}
              <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]">
                {alias.dotCount} {alias.dotCount === 1 ? "dot" : "dots"}
              </span>
              {alias.isOriginal && (
                <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  original
                </span>
              )}
              {alias.archived && (
                <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                  archived
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyEmail}
              className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Copy email"
            >
              {copiedEmail ? (
                <Check size={16} className="text-[var(--color-accent)]" />
              ) : (
                <Copy size={16} />
              )}
            </button>
            {!alias.archived && (
              <button
                onClick={() => setArchiveTarget("alias")}
                className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-red-400 transition-colors"
                aria-label="Archive alias"
              >
                <Archive size={16} />
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[var(--color-text)]">
            Notes
          </h2>
          {!editingNotes && (
            <button
              onClick={startEditNotes}
              className="rounded-lg p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Edit notes"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              placeholder="Add notes about this alias..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={saveNotes}>
                <Check size={14} className="mr-1" />
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditingNotes(false)}>
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm ${alias.notes ? "text-[var(--color-text-dim)]" : "text-[var(--color-muted)] italic"}`}
          >
            {alias.notes ?? "No notes"}
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--color-text)]">
            Linked Providers
          </h2>
          <Button
            variant="secondary"
            onClick={() => setShowLinkModal(true)}
          >
            <Link2 size={14} className="mr-1" />
            Link Provider
          </Button>
        </div>

        {aliasLinks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No providers linked yet.
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
            >
              Link your first provider
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {aliasLinks.map((link) => {
              const provider = getProvider(link.providerId);
              if (!provider) return null;
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/providers/${provider.id}`}
                        className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {provider.name}
                      </Link>
                      {provider.category && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
                          {provider.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-muted)]">
                      {link.accountIdentifier && (
                        <span className="font-mono">
                          {link.accountIdentifier}
                        </span>
                      )}
                      {link.notes && <span>{link.notes}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/providers/${provider.id}`}
                      className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                      aria-label={`View ${provider.name}`}
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <button
                      onClick={() => setArchiveTarget(link.id)}
                      className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-red-400 transition-colors"
                      aria-label={`Unlink ${provider.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
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
              {archiveTarget === "alias" ? "Archive Alias" : "Remove Link"}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-dim)]">
              {archiveTarget === "alias"
                ? "This alias will be hidden from the default view. Provider links will remain intact."
                : "This will remove the link between this alias and the provider."}
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
                {archiveTarget === "alias" ? "Archive" : "Remove"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showLinkModal && (
        <LinkAliasProviderModal
          mode="link-provider"
          fixedAliasId={alias.id}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
