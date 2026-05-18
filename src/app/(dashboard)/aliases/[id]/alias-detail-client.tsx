"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { LinkAliasProviderModal } from "@/components/link-alias-provider-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateAliasAction, type AliasDetail } from "@/lib/aliases/actions";
import {
  updateAliasProviderLinkAction,
  type AliasProviderLinkOptions,
} from "@/lib/alias-provider-links/actions";

type Props = {
  alias: AliasDetail | null;
  linkOptions: AliasProviderLinkOptions;
};

export function AliasDetailClient({ alias, linkOptions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<"alias" | string | null>(
    null
  );
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkIdentifier, setLinkIdentifier] = useState("");
  const [linkNotes, setLinkNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const detail = alias;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(detail.aliasEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  function startEditNotes() {
    setEditingNotes(true);
    setNotesValue(detail.notes ?? "");
    setError(null);
  }

  function saveNotes() {
    setError(null);
    startTransition(async () => {
      const result = await updateAliasAction({ id: detail.id, notes: notesValue });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingNotes(false);
      router.refresh();
    });
  }

  function startEditLink(linkId: string) {
    const link = detail.links.find((item) => item.id === linkId);
    if (!link) return;
    setEditingLinkId(linkId);
    setLinkIdentifier(link.accountIdentifier ?? "");
    setLinkNotes(link.notes ?? "");
    setError(null);
  }

  function saveLink() {
    if (!editingLinkId) return;
    setError(null);
    startTransition(async () => {
      const result = await updateAliasProviderLinkAction({
        id: editingLinkId,
        accountIdentifier: linkIdentifier,
        notes: linkNotes,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingLinkId(null);
      router.refresh();
    });
  }

  function confirmArchive() {
    if (!archiveTarget) return;
    setError(null);

    startTransition(async () => {
      const result =
        archiveTarget === "alias"
          ? await updateAliasAction({ id: detail.id, archived: true })
          : await updateAliasProviderLinkAction({ id: archiveTarget, archived: true });

      if (result.error) {
        setError(result.error);
        return;
      }

      setArchiveTarget(null);
      router.refresh();
    });
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

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-mono text-[var(--color-accent)]">
              {detail.aliasEmail}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]">
                {detail.account.label}
              </span>
              <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]">
                {detail.dotCount} {detail.dotCount === 1 ? "dot" : "dots"}
              </span>
              {detail.isOriginal && (
                <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  original
                </span>
              )}
              {detail.archived && (
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
            {!detail.archived && (
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
          <h2 className="text-sm font-medium text-[var(--color-text)]">Notes</h2>
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
              <Button variant="primary" onClick={saveNotes} disabled={isPending}>
                <Check size={14} className="mr-1" />
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditingNotes(false)}
                disabled={isPending}
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm ${detail.notes ? "text-[var(--color-text-dim)]" : "text-[var(--color-muted)] italic"}`}
          >
            {detail.notes ?? "No notes"}
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--color-text)]">
            Linked Providers
          </h2>
          {!detail.archived && (
            <Button variant="secondary" onClick={() => setShowLinkModal(true)}>
              <Link2 size={14} className="mr-1" />
              Link Provider
            </Button>
          )}
        </div>

        {detail.links.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No providers linked yet.
            </p>
            {!detail.archived && (
              <button
                onClick={() => setShowLinkModal(true)}
                className="mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
              >
                Link your first provider
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {detail.links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                {editingLinkId === link.id ? (
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={linkIdentifier}
                        onChange={(e) => setLinkIdentifier(e.target.value)}
                        placeholder="Account identifier"
                        className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                      <input
                        value={linkNotes}
                        onChange={(e) => setLinkNotes(e.target.value)}
                        placeholder="Link notes"
                        className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={saveLink} disabled={isPending}>
                        <Check size={14} className="mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setEditingLinkId(null)}
                        disabled={isPending}
                      >
                        <X size={14} className="mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/providers/${link.provider.id}`}
                          className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
                        >
                          {link.provider.name}
                        </Link>
                        {link.provider.category && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
                            {link.provider.category}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-muted)]">
                        {link.accountIdentifier && (
                          <span className="font-mono">{link.accountIdentifier}</span>
                        )}
                        {link.notes && <span>{link.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditLink(link.id)}
                        className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                        aria-label={`Edit ${link.provider.name} link`}
                      >
                        <Pencil size={14} />
                      </button>
                      <Link
                        href={`/providers/${link.provider.id}`}
                        className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                        aria-label={`View ${link.provider.name}`}
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        onClick={() => setArchiveTarget(link.id)}
                        className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-red-400 transition-colors"
                        aria-label={`Unlink ${link.provider.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
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
                disabled={isPending}
              >
                {archiveTarget === "alias" ? "Archive" : "Remove"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showLinkModal && !detail.archived && (
        <LinkAliasProviderModal
          mode="link-provider"
          fixedAliasId={detail.id}
          aliases={linkOptions.aliases}
          providers={linkOptions.providers}
          existingLinks={linkOptions.existingLinks}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
