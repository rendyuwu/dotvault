"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { normalizeGmail, maxAliasCount } from "@/lib/gmail/normalize";
import { useGmailAccounts } from "@/lib/mock-data/gmail-accounts-context";

export default function NewGmailAccountPage() {
  const router = useRouter();
  const { addAccount, isDuplicate } = useGmailAccounts();

  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validation = email.trim() ? normalizeGmail(email) : null;
  const duplicate =
    validation?.ok ? isDuplicate(validation.canonicalEmail) : false;
  const isValid = validation?.ok && !duplicate;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);

    if (!isValid || !validation.ok || !label.trim()) return;

    addAccount({
      originalEmail: validation.originalEmail,
      canonicalEmail: validation.canonicalEmail,
      localPart: validation.localPart,
      domain: validation.domain,
      label: label.trim(),
      notes: notes.trim() || null,
    });

    router.replace("/gmail-accounts");
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link
          href="/gmail-accounts"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to accounts
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Add Gmail Account
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-dim)]">
          Add a new Gmail account to generate dot aliases for.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm text-[var(--color-text-dim)]"
            >
              Gmail Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@gmail.com"
              autoComplete="email"
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            {validation && !validation.ok && (
              <p className="flex items-center gap-1 text-sm text-red-400" role="alert">
                <AlertCircle size={14} />
                {validation.error}
              </p>
            )}
            {duplicate && (
              <p className="flex items-center gap-1 text-sm text-red-400" role="alert">
                <AlertCircle size={14} />
                This Gmail account already exists
              </p>
            )}
            {submitted && !email.trim() && (
              <p className="text-sm text-red-400" role="alert">
                Email is required
              </p>
            )}
          </div>

          {isValid && validation.ok && (
            <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-accent)]">
                <CheckCircle2 size={14} />
                Valid Gmail address
              </div>
              <p className="text-xs text-[var(--color-text-dim)]">
                Canonical:{" "}
                <span className="font-mono text-[var(--color-text)]">
                  {validation.canonicalEmail}
                </span>
              </p>
              <p className="text-xs text-[var(--color-text-dim)]">
                Max possible aliases:{" "}
                <span className="font-mono text-[var(--color-text)]">
                  {maxAliasCount(validation.localPart.length).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="label"
              className="text-sm text-[var(--color-text-dim)]"
            >
              Label
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Personal, Work, Testing"
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            {submitted && !label.trim() && (
              <p className="text-sm text-red-400" role="alert">
                Label is required
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-sm text-[var(--color-text-dim)]"
            >
              Notes{" "}
              <span className="text-[var(--color-muted)]">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this account..."
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary">
              Add Account
            </Button>
            <Link
              href="/gmail-accounts"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
