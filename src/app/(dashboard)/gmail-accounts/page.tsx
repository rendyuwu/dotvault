"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Plus, Pencil, Archive, X, Check } from "lucide-react";
import { useGmailAccounts } from "@/lib/mock-data/gmail-accounts-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GmailAccountsPage() {
  const { accounts, aliases, updateAccount, archiveAccount } =
    useGmailAccounts();
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const filtered = showArchived
    ? accounts
    : accounts.filter((a) => !a.archived);

  const archivedCount = accounts.filter((a) => a.archived).length;

  useEffect(() => {
    if (!archiveTarget) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setArchiveTarget(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [archiveTarget]);

  function startEdit(id: string) {
    const account = accounts.find((a) => a.id === id);
    if (!account) return;
    setEditingId(id);
    setEditLabel(account.label);
    setEditNotes(account.notes ?? "");
  }

  function saveEdit() {
    if (!editingId) return;
    updateAccount(editingId, {
      label: editLabel.trim() || "Untitled",
      notes: editNotes.trim() || null,
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function confirmArchive() {
    if (!archiveTarget) return;
    archiveAccount(archiveTarget);
    setArchiveTarget(null);
  }

  function aliasCount(accountId: string) {
    return aliases.filter(
      (a) => a.gmailAccountId === accountId && !a.archived
    ).length;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Gmail Accounts
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            Manage your Gmail accounts and their dot alias configurations.
          </p>
        </div>
        <Link
          href="/gmail-accounts/new"
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-base)] hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus size={16} className="mr-1.5" />
          Add Account
        </Link>
      </div>

      {archivedCount > 0 && (
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-dim)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-[var(--color-border)] bg-[var(--color-base)] accent-[var(--color-accent)]"
          />
          Show archived ({archivedCount})
        </label>
      )}

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10 mb-4">
            <Mail size={24} className="text-[var(--color-accent)]" />
          </div>
          <p className="text-[var(--color-text)] font-medium">
            No Gmail accounts yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            Add your first Gmail account to start generating dot aliases.
          </p>
          <Link
            href="/gmail-accounts/new"
            className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-[var(--color-base)] hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Plus size={16} className="mr-1.5" />
            Add Account
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((account) => (
            <Card
              key={account.id}
              className={
                account.archived ? "opacity-60" : undefined
              }
            >
              {editingId === account.id ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`edit-label-${account.id}`}
                      className="text-xs text-[var(--color-text-dim)]"
                    >
                      Label
                    </label>
                    <input
                      id={`edit-label-${account.id}`}
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`edit-notes-${account.id}`}
                      className="text-xs text-[var(--color-text-dim)]"
                    >
                      Notes
                    </label>
                    <textarea
                      id={`edit-notes-${account.id}`}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={saveEdit}>
                      <Check size={14} className="mr-1" />
                      Save
                    </Button>
                    <Button variant="ghost" onClick={cancelEdit}>
                      <X size={14} className="mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">
                        {account.label}
                      </span>
                      {account.archived && (
                        <span className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-dim)] font-mono truncate">
                      {account.originalEmail}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] font-mono truncate">
                      canonical: {account.canonicalEmail}
                    </p>
                    {account.notes && (
                      <p className="mt-1.5 text-xs text-[var(--color-text-dim)]">
                        {account.notes}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-muted)]">
                      <span>{aliasCount(account.id)} aliases</span>
                      <span>
                        Added{" "}
                        {new Date(account.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {!account.archived && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(account.id)}
                        className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                        aria-label={`Edit ${account.label}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setArchiveTarget(account.id)}
                        className="rounded-lg p-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-red-400 transition-colors"
                        aria-label={`Archive ${account.label}`}
                      >
                        <Archive size={15} />
                      </button>
                    </div>
                  )}
                </div>
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
              Archive Account
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-dim)]">
              This account will be hidden from the default view. Its aliases
              will remain intact. You can reveal archived accounts using the
              toggle.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setArchiveTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmArchive}
                className="!bg-red-500 hover:!bg-red-600"
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
