"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Link2, X } from "lucide-react";
import {
  createAliasProviderLinkAction,
  type AliasLinkOption,
  type AliasProviderLinkOption,
  type ProviderLinkOption,
} from "@/lib/alias-provider-links/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LinkAliasProviderModalProps {
  mode: "link-provider" | "link-alias";
  aliases: AliasLinkOption[];
  providers: ProviderLinkOption[];
  existingLinks: AliasProviderLinkOption[];
  fixedAliasId?: string;
  fixedProviderId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LinkAliasProviderModal({
  mode,
  aliases,
  providers,
  existingLinks,
  fixedAliasId,
  fixedProviderId,
  onClose,
  onSuccess,
}: LinkAliasProviderModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedAliasId, setSelectedAliasId] = useState(fixedAliasId ?? "");
  const [selectedProviderId, setSelectedProviderId] = useState(
    fixedProviderId ?? ""
  );
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aliasesByAccount = useMemo(() => {
    const grouped: Record<string, AliasLinkOption[]> = {};
    for (const alias of aliases) {
      const accountId = alias.gmailAccountId;
      if (!grouped[accountId]) grouped[accountId] = [];
      grouped[accountId].push(alias);
    }
    return grouped;
  }, [aliases]);

  const isDuplicate = useMemo(() => {
    if (!selectedAliasId || !selectedProviderId) return false;
    return existingLinks.some(
      (link) =>
        link.aliasId === selectedAliasId &&
        link.providerId === selectedProviderId &&
        !link.archived
    );
  }, [existingLinks, selectedAliasId, selectedProviderId]);

  const hasArchivedLink = useMemo(() => {
    if (!selectedAliasId || !selectedProviderId) return false;
    return existingLinks.some(
      (link) =>
        link.aliasId === selectedAliasId &&
        link.providerId === selectedProviderId &&
        link.archived
    );
  }, [existingLinks, selectedAliasId, selectedProviderId]);

  const canSubmit =
    selectedAliasId && selectedProviderId && !isDuplicate && !success && !isPending;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function getAccountLabel(gmailAccountId: string) {
    return aliases.find((a) => a.gmailAccountId === gmailAccountId)?.accountLabel ?? "Unknown";
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);

    startTransition(async () => {
      const result = await createAliasProviderLinkAction({
        aliasId: selectedAliasId,
        providerId: selectedProviderId,
        accountIdentifier,
        notes,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      router.refresh();
      window.setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    });
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
            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
                {error}
              </p>
            )}

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
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                      {provider.category ? ` (${provider.category})` : ""}
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
                      <optgroup key={accountId} label={getAccountLabel(accountId)}>
                        {accountAliases.map((alias) => (
                          <option key={alias.id} value={alias.id}>
                            {alias.aliasEmail}
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

            {hasArchivedLink && !isDuplicate && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-3 py-2">
                <span className="text-xs text-[var(--color-accent)]">
                  This will restore a previously removed link.
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
              <Button variant="ghost" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                <Link2 size={14} className="mr-1" />
                {hasArchivedLink ? "Restore Link" : "Create Link"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
