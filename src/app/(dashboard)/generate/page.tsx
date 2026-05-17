"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Save,
  AlertTriangle,
  ChevronDown,
  Hash,
  Mail,
  CircleDot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGmailAccounts } from "@/lib/mock-data/gmail-accounts-context";
import { maxAliasCount } from "@/lib/gmail/normalize";
import { generateDotAliases } from "@/lib/gmail/generate";
import type { DotAlias } from "@/lib/types/alias";
import type { GeneratedAlias } from "@/lib/gmail/generate";

export default function GeneratePage() {
  const { accounts, aliases, addAliases } = useGmailAccounts();

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [count, setCount] = useState(10);
  const [preview, setPreview] = useState<GeneratedAlias[]>([]);
  const [showShortage, setShowShortage] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    saved: number;
    skipped: number;
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.archived),
    [accounts]
  );

  const selectedAccount = useMemo(
    () => activeAccounts.find((a) => a.id === selectedAccountId),
    [activeAccounts, selectedAccountId]
  );

  const accountAliases = useMemo(
    () => aliases.filter((a) => a.gmailAccountId === selectedAccountId),
    [aliases, selectedAccountId]
  );

  const existingLocalParts = useMemo(
    () => new Set(accountAliases.map((a) => a.localPartWithDots)),
    [accountAliases]
  );

  const totalPossible = selectedAccount
    ? maxAliasCount(selectedAccount.localPart.length)
    : 0;
  const alreadySaved = accountAliases.length;
  const remaining = totalPossible - alreadySaved;
  const maxCount = Math.min(remaining, 500);

  function handleGenerate() {
    if (!selectedAccount) return;
    const requested = count;
    setShowShortage(requested > remaining);
    const actual = Math.min(requested, remaining);
    const results = generateDotAliases(
      selectedAccount.localPart,
      selectedAccount.domain,
      actual,
      existingLocalParts
    );
    setPreview(results);
    setSaveResult(null);
  }

  function handleSave() {
    if (!selectedAccount || preview.length === 0) return;
    const now = new Date().toISOString();
    const newAliases: DotAlias[] = preview.map((p) => ({
      id: `ali-${crypto.randomUUID().slice(0, 8)}`,
      userId: selectedAccount.userId,
      gmailAccountId: selectedAccount.id,
      aliasEmail: p.aliasEmail,
      localPartWithDots: p.localPartWithDots,
      dotCount: p.dotCount,
      isOriginal: false,
      notes: null,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }));
    const result = addAliases(newAliases);
    setSaveResult(result);
    setPreview([]);
  }

  async function handleCopySingle(index: number) {
    try {
      await navigator.clipboard.writeText(preview[index].aliasEmail);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }

  async function handleCopyAll() {
    try {
      const text = preview.map((p) => p.aliasEmail).join("\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      setCopiedAll(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Generate Aliases
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-dim)]">
          Generate sequential dot aliases for a selected Gmail account.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="account"
                className="text-sm text-[var(--color-text-dim)]"
              >
                Gmail Account
              </label>
              <div className="relative">
                <select
                  id="account"
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    setPreview([]);
                    setSaveResult(null);
                    setShowShortage(false);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 pr-8 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                >
                  <option value="">Select an account...</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.label} — {account.originalEmail}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="count"
                className="text-sm text-[var(--color-text-dim)]"
              >
                Number to Generate
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={maxCount}
                value={count}
                onChange={(e) =>
                  setCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                disabled={!selectedAccount}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!selectedAccount || count < 1 || remaining <= 0}
            className="gap-1.5"
          >
            <Sparkles size={14} />
            Generate Preview
          </Button>
        </div>
      </Card>

      {selectedAccount && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            label="Total Possible"
            value={totalPossible.toLocaleString()}
            icon={<Hash size={14} />}
          />
          <StatBox
            label="Already Saved"
            value={alreadySaved.toLocaleString()}
            icon={<CircleDot size={14} />}
          />
          <StatBox
            label="Remaining"
            value={remaining.toLocaleString()}
            icon={<Mail size={14} />}
            accent
          />
          <StatBox
            label="Requested"
            value={count.toLocaleString()}
            icon={<Sparkles size={14} />}
          />
        </div>
      )}

      {showShortage && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-amber-400"
          />
          <p className="text-sm text-amber-400">
            Only {remaining.toLocaleString()} aliases available.{" "}
            Showing {Math.min(count, remaining).toLocaleString()} instead of{" "}
            {count.toLocaleString()} requested.
          </p>
        </div>
      )}

      {saveResult && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-3">
          <Check size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-accent)]">
            {saveResult.saved} alias{saveResult.saved !== 1 ? "es" : ""} saved
            {saveResult.skipped > 0 && (
              <span className="text-[var(--color-text-dim)]">
                {" "}
                · {saveResult.skipped} skipped (already exist)
              </span>
            )}
          </p>
        </div>
      )}

      {preview.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Preview{" "}
              <span className="text-[var(--color-text-dim)]">
                ({preview.length} alias{preview.length !== 1 ? "es" : ""})
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCopyAll}
                className="gap-1.5 text-xs h-8 px-3"
              >
                {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                {copiedAll ? "Copied!" : "Copy All"}
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                className="gap-1.5 text-xs h-8 px-3"
              >
                <Save size={12} />
                Save Aliases
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted)]">
                  <th className="px-6 py-3 font-medium w-12">#</th>
                  <th className="px-6 py-3 font-medium">Alias Email</th>
                  <th className="px-6 py-3 font-medium w-20 text-center">
                    Dots
                  </th>
                  <th className="px-6 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {preview.map((alias, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <td className="px-6 py-2.5 text-[var(--color-muted)] tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-6 py-2.5 font-mono text-[var(--color-text)]">
                      {alias.aliasEmail}
                    </td>
                    <td className="px-6 py-2.5 text-center text-[var(--color-text-dim)] tabular-nums">
                      {alias.dotCount}
                    </td>
                    <td className="px-6 py-2.5">
                      <button
                        onClick={() => handleCopySingle(i)}
                        className="inline-flex items-center justify-center rounded p-1.5 text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
                        title="Copy alias"
                      >
                        {copiedIndex === i ? (
                          <Check size={14} className="text-[var(--color-accent)]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div
        className={`flex items-center gap-1.5 text-xs ${accent ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`}
      >
        {icon}
        {label}
      </div>
      <p
        className={`mt-1 text-lg font-semibold font-mono ${accent ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"}`}
      >
        {value}
      </p>
    </div>
  );
}
