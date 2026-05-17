"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Link2, X } from "lucide-react";
import { useGmailAccounts } from "@/lib/mock-data/gmail-accounts-context";
import { useProviders } from "@/lib/mock-data/providers-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LinkAliasProviderModalProps {
  mode: "link-provider" | "link-alias";
  fixedAliasId?: string;
  fixedProviderId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkAliasProviderModal({
  mode,
  fixedAliasId,
  fixedProviderId,
  onClose,
  onSuccess,
}: LinkAliasProviderModalProps) {
  const { aliases, accounts } = useGmailAccounts();
  const { providers, addLink, isDuplicateLink } = useProviders();

  const [selectedAliasId, setSelectedAliasId] = useState(fixedAliasId ?? "");
  const [selectedProviderId, setSelectedProviderId] = useState(
    fixedProviderId ?? ""
  );
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const activeAliases = useMemo(
    () => aliases.filter((a) => !a.archived),
    [aliases]
  );
  const activeProviders = useMemo(
    () => providers.filter((p) => !p.archived),
    [providers]
  );

  const aliasesByAccount = useMemo(() => {
    const grouped: Record<string, typeof activeAliases> = {};
    for (const alias of activeAliases) {
      const accountId = alias.gmailAccountId;
      if (!grouped[accountId]) grouped[accountId] = [];
      grouped[accountId].push(alias);
    }
    return grouped;
  }, [activeAliases]);

  const isDuplicate = useMemo(() => {
    if (!selectedAliasId || !selectedProviderId) return false;
    return isDuplicateLink(selectedAliasId, selectedProviderId);
  }, [selectedAliasId, selectedProviderId, isDuplicateLink]);

  const canSubmit =
    selectedAliasId && selectedProviderId && !isDuplicate && !success;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit() {
    if (!canSubmit) return;
    const result = addLink({
      aliasId: selectedAliasId,
      providerId: selectedProviderId,
      accountIdentifier: accountIdentifier.trim() || null,
      notes: notes.trim() || null,
    });
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    }
  }

  function getAccountLabel(gmailAccountId: string) {
    return accounts.find((a) => a.id === gmailAccountId)?.label ?? "Unknown";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="link-dialog-title"
            className="text-lg font-medium text-[var(--color-text)] flex items-center gap-2"
          >
            <Link2 size={18} className="text-[var(--color-accent)]" />
            {mode === "link-provider" ? "Link Provider" : "Link Alias"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-3">
            <Check size={16} className="text-[var(--color-accent)]" />
            <span className="text-sm text-[var(--color-accent)]">
              Link created
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {mode === "link-provider" ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="link-provider-select"
                  className="text-xs text-[var(--color-text-dim)]"
                >
                  Provider
                </label>
                <select
                  id="link-provider-select"
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                >
                  <option value="">Select a provider...</option>
                  {activeProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.category ? ` (${p.category})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="link-alias-select"
                  className="text-xs text-[var(--color-text-dim)]"
                >
                  Alias
                </label>
                <select
                  id="link-alias-select"
                  value={selectedAliasId}
                  onChange={(e) => setSelectedAliasId(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                >
                  <option value="">Select an alias...</option>
                  {Object.entries(aliasesByAccount).map(
                    ([accountId, accountAliases]) => (
                      <optgroup
                        key={accountId}
                        label={getAccountLabel(accountId)}
                      >
                        {accountAliases.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.aliasEmail}
                          </option>
                        ))}
                      </optgroup>
                    )
                  )}
                </select>
              </div>
            )}

            {isDuplicate && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/5 px-3 py-2">
                <AlertTriangle
                  size={14}
                  className="text-[var(--color-secondary)] shrink-0"
                />
                <span className="text-xs text-[var(--color-secondary)]">
                  This alias is already linked to this provider.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="link-identifier"
                className="text-xs text-[var(--color-text-dim)]"
              >
                Account Identifier
              </label>
              <input
                id="link-identifier"
                value={accountIdentifier}
                onChange={(e) => setAccountIdentifier(e.target.value)}
                placeholder="e.g. username, handle"
                className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="link-notes"
                className="text-xs text-[var(--color-text-dim)]"
              >
                Notes
              </label>
              <textarea
                id="link-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes about this link"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                <Link2 size={14} className="mr-1" />
                Create Link
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
