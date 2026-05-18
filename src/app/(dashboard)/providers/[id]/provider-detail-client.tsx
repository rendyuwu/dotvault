"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  Archive,
  X,
  Check,
  Link2,
  ExternalLink,
} from "lucide-react";
import { LinkAliasProviderModal } from "@/components/link-alias-provider-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  updateAliasProviderLinkAction,
  type AliasProviderLinkOptions,
} from "@/lib/alias-provider-links/actions";
import { updateProviderAction, type ProviderDetail } from "@/lib/providers/actions";

type Props = {
  provider: ProviderDetail | null;
  linkOptions: AliasProviderLinkOptions;
};

export function ProviderDetailClient({ provider, linkOptions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingField, setEditingField] = useState<"info" | "notes" | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<"provider" | string | null>(
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

  const detail = provider;

  function startEditInfo() {
    setEditingField("info");
    setEditName(detail.name);
    setEditWebsite(detail.website ?? "");
    setEditCategory(detail.category ?? "");
    setError(null);
  }

  function startEditNotes() {
    setEditingField("notes");
    setEditNotes(detail.notes ?? "");
    setError(null);
  }

  function saveInfo() {
    setError(null);
    startTransition(async () => {
      const result = await updateProviderAction({
        id: detail.id,
        name: editName,
        website: editWebsite,
        category: editCategory,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingField(null);
      router.refresh();
    });
  }

  function saveNotes() {
    setError(null);
    startTransition(async () => {
      const result = await updateProviderAction({ id: detail.id, notes: editNotes });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingField(null);
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
        archiveTarget === "provider"
          ? await updateProviderAction({ id: detail.id, archived: true })
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
        href="/providers"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Providers
      </Link>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

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
              <Button variant="primary" onClick={saveInfo} disabled={isPending}>
                <Check size={14} className="mr-1" />
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditingField(null)}
                disabled={isPending}
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                {detail.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {detail.website && (
                  <span className="flex items-center gap-1 text-sm text-[var(--color-text-dim)]">
                    <ExternalLink size={12} />
                    {detail.website}
                  </span>
                )}
                {detail.category && (
                  <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
                    {detail.category}
                  </span>
                )}
                {detail.archived && (
                  <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                    archived
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-muted)]">
                <span>{detail.links.length} linked aliases</span>
                <span>Added {new Date(detail.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!detail.archived && (
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
          <h2 className="text-sm font-medium text-[var(--color-text)]">Notes</h2>
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
              <Button variant="primary" onClick={saveNotes} disabled={isPending}>
                <Check size={14} className="mr-1" />
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditingField(null)}
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
            Linked Aliases
          </h2>
          {!detail.archived && (
            <Button variant="secondary" onClick={() => setShowLinkModal(true)}>
              <Link2 size={14} className="mr-1" />
              Link Alias
            </Button>
          )}
        </div>

        {detail.links.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No aliases linked yet.
            </p>
            {!detail.archived && (
              <button
                onClick={() => setShowLinkModal(true)}
                className="mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
              >
                Link your first alias
              </button>
            )}
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
                {detail.links.map((link) => (
                  <tr
                    key={link.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/aliases/${link.alias.id}`}
                        className="font-mono text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                      >
                        {link.alias.aliasEmail}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]">
                        {link.account.label}
                      </span>
                    </td>
                    {editingLinkId === link.id ? (
                      <>
                        <td className="py-3 pr-4">
                          <input
                            value={linkIdentifier}
                            onChange={(e) => setLinkIdentifier(e.target.value)}
                            className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            value={linkNotes}
                            onChange={(e) => setLinkNotes(e.target.value)}
                            className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                          />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={saveLink}
                              disabled={isPending}
                              className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                              aria-label="Save link"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingLinkId(null)}
                              disabled={isPending}
                              className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                              aria-label="Cancel link edit"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
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
                            <button
                              onClick={() => startEditLink(link.id)}
                              className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                              aria-label="Edit link"
                            >
                              <Pencil size={14} />
                            </button>
                            <Link
                              href={`/aliases/${link.alias.id}`}
                              className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                              aria-label={`View ${link.alias.aliasEmail}`}
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
                      </>
                    )}
                  </tr>
                ))}
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
              {archiveTarget === "provider" ? "Archive Provider" : "Remove Link"}
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
                disabled={isPending}
              >
                {archiveTarget === "provider" ? "Archive" : "Remove"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showLinkModal && !detail.archived && (
        <LinkAliasProviderModal
          mode="link-alias"
          fixedProviderId={detail.id}
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
