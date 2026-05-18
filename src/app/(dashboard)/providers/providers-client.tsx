"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Archive,
  X,
  Check,
  ExternalLink,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createProviderAction,
  updateProviderAction,
  type ProviderListItem,
} from "@/lib/providers/actions";

type Props = {
  providers: ProviderListItem[];
  archivedCount: number;
  includeArchived: boolean;
};

export function ProvidersClient({
  providers,
  archivedCount,
  includeArchived,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const existingCategories = useMemo(() => {
    const categories = new Set<string>();
    providers.forEach((provider) => {
      if (provider.category) categories.add(provider.category);
    });
    return Array.from(categories).sort();
  }, [providers]);

  useEffect(() => {
    if (!archiveTarget) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setArchiveTarget(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [archiveTarget]);

  function setArchivedFilter(next: boolean) {
    router.push(next ? "/providers?archived=1" : "/providers");
  }

  function isDuplicateProvider(name: string, excludeId?: string) {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return false;
    return providers.some(
      (provider) =>
        provider.id !== excludeId &&
        !provider.archived &&
        provider.name.toLowerCase() === normalized
    );
  }

  function handleCreate() {
    if (!newName.trim() || isDuplicateProvider(newName)) return;
    setError(null);

    startTransition(async () => {
      const result = await createProviderAction({
        name: newName,
        website: newWebsite,
        category: newCategory,
        notes: newNotes,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setNewName("");
      setNewWebsite("");
      setNewCategory("");
      setNewNotes("");
      setShowCreateForm(false);
      router.refresh();
    });
  }

  function startEdit(id: string) {
    const provider = providers.find((p) => p.id === id);
    if (!provider) return;
    setError(null);
    setEditingId(id);
    setEditName(provider.name);
    setEditWebsite(provider.website ?? "");
    setEditCategory(provider.category ?? "");
    setEditNotes(provider.notes ?? "");
  }

  function saveEdit() {
    if (!editingId || !editName.trim() || isDuplicateProvider(editName, editingId)) {
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateProviderAction({
        id: editingId,
        name: editName,
        website: editWebsite,
        category: editCategory,
        notes: editNotes,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setEditingId(null);
      router.refresh();
    });
  }

  function confirmArchive() {
    if (!archiveTarget) return;
    setError(null);

    startTransition(async () => {
      const result = await updateProviderAction({
        id: archiveTarget,
        archived: true,
      });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Providers
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            Manage service providers linked to your aliases.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus size={16} className="mr-1.5" />
          Add Provider
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {showCreateForm && (
        <Card className="border-[var(--color-accent)]/30">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-provider-name"
                  className="text-xs text-[var(--color-text-dim)]"
                >
                  Name *
                </label>
                <input
                  id="new-provider-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. GitHub"
                  className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-provider-website"
                  className="text-xs text-[var(--color-text-dim)]"
                >
                  Website
                </label>
                <input
                  id="new-provider-website"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  placeholder="e.g. github.com"
                  className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-provider-category"
                className="text-xs text-[var(--color-text-dim)]"
              >
                Category
              </label>
              <input
                id="new-provider-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Developer Tools"
                list="category-suggestions"
                className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-provider-notes"
                className="text-xs text-[var(--color-text-dim)]"
              >
                Notes
              </label>
              <textarea
                id="new-provider-notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
              />
            </div>
            {newName.trim() && isDuplicateProvider(newName) && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/5 px-3 py-2">
                <span className="text-xs text-[var(--color-secondary)]">
                  A provider named &ldquo;{newName.trim()}&rdquo; already exists.
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={!newName.trim() || isDuplicateProvider(newName) || isPending}
              >
                <Check size={14} className="mr-1" />
                Create
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCreateForm(false)}
                disabled={isPending}
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {(archivedCount > 0 || includeArchived) && (
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-dim)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setArchivedFilter(e.target.checked)}
            className="rounded border-[var(--color-border)] bg-[var(--color-base)] accent-[var(--color-accent)]"
          />
          Show archived ({archivedCount})
        </label>
      )}

      {providers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10 mb-4">
            <Building2 size={24} className="text-[var(--color-accent)]" />
          </div>
          <p className="text-[var(--color-text)] font-medium">No providers yet</p>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            Add your first provider to start tracking which services use your aliases.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            className="mt-4"
          >
            <Plus size={16} className="mr-1.5" />
            Add Provider
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className={provider.archived ? "opacity-60" : undefined}
            >
              {editingId === provider.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`edit-name-${provider.id}`}
                        className="text-xs text-[var(--color-text-dim)]"
                      >
                        Name *
                      </label>
                      <input
                        id={`edit-name-${provider.id}`}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`edit-website-${provider.id}`}
                        className="text-xs text-[var(--color-text-dim)]"
                      >
                        Website
                      </label>
                      <input
                        id={`edit-website-${provider.id}`}
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`edit-category-${provider.id}`}
                      className="text-xs text-[var(--color-text-dim)]"
                    >
                      Category
                    </label>
                    <input
                      id={`edit-category-${provider.id}`}
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      list="category-suggestions"
                      className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`edit-notes-${provider.id}`}
                      className="text-xs text-[var(--color-text-dim)]"
                    >
                      Notes
                    </label>
                    <textarea
                      id={`edit-notes-${provider.id}`}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
                    />
                  </div>
                  {editName.trim() && isDuplicateProvider(editName, provider.id) && (
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/5 px-3 py-2">
                      <span className="text-xs text-[var(--color-secondary)]">
                        A provider named &ldquo;{editName.trim()}&rdquo; already exists.
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={saveEdit}
                      disabled={
                        !editName.trim() ||
                        isDuplicateProvider(editName, provider.id) ||
                        isPending
                      }
                    >
                      <Check size={14} className="mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                    >
                      <X size={14} className="mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Link href={`/providers/${provider.id}`} className="block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--color-text)]">
                          {provider.name}
                        </span>
                        {provider.category && (
                          <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
                            {provider.category}
                          </span>
                        )}
                        {provider.archived && (
                          <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                            Archived
                          </span>
                        )}
                      </div>
                      {provider.website && (
                        <p className="mt-1 text-sm text-[var(--color-text-dim)] flex items-center gap-1">
                          <ExternalLink size={12} />
                          {provider.website}
                        </p>
                      )}
                      {provider.notes && (
                        <p className="mt-1.5 text-xs text-[var(--color-text-dim)] line-clamp-1">
                          {provider.notes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-muted)]">
                        <span>{provider.linkCount} linked aliases</span>
                        <span>
                          Added {new Date(provider.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!provider.archived && (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.preventDefault()}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            startEdit(provider.id);
                          }}
                          className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                          aria-label={`Edit ${provider.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setArchiveTarget(provider.id);
                          }}
                          className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-red-400 transition-colors"
                          aria-label={`Archive ${provider.name}`}
                        >
                          <Archive size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}

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
              Archive Provider
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-dim)]">
              This provider will be hidden from the default view. Existing alias links will remain intact.
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
                Archive
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
