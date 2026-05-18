"use client";

import { useActionState, useState } from "react";
import { Info, User, Lock, ShieldCheck, Ban, Download, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { changePasswordAction } from "@/lib/auth/actions";
import { initialChangePasswordActionState } from "@/lib/auth/action-state";

const APP_VERSION = "0.1.0";
const APP_ENVIRONMENT = "Development (Mock Data)";
const APP_FRAMEWORK = "Next.js 16.2.6";

const ACCEPTABLE_USE_STATEMENT =
  "DotVault is intended for personal email alias organization, testing workflows, and tracking where Gmail dot aliases are used. It must not be used for spam, fraud, account abuse, ban evasion, automated signup, bypassing provider restrictions, or violating any third-party terms of service.";

const PROHIBITED_FEATURES = [
  "Automated account registration",
  "Provider signup bots",
  "CAPTCHA bypass",
  "Bulk account creation workflows",
  "Provider-specific evasion logic",
  "Tools designed to bypass bans or restrictions",
];

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: typeof Info;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/20">
        <Icon size={17} className="text-[var(--color-accent)]" />
      </div>
      <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
        {title}
      </h2>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-[var(--color-text-dim)]">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text)] tabular-nums">
        {value}
      </span>
    </div>
  );
}

function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialChangePasswordActionState
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validationError =
    newPassword && newPassword.length < 12
      ? "New password must be at least 12 characters"
      : confirmPassword && newPassword !== confirmPassword
        ? "New passwords do not match"
        : null;

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="currentPassword"
          className="text-xs text-[var(--color-text-dim)]"
        >
          Current Password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="newPassword"
            className="text-xs text-[var(--color-text-dim)]"
          >
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="••••••••"
            className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs text-[var(--color-text-dim)]"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {(validationError || state.error || state.success) && (
        <p
          className={state.success ? "text-sm text-green-400" : "text-sm text-red-400"}
          role="alert"
        >
          {validationError ?? state.error ?? state.success}
        </p>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" variant="primary" disabled={isPending || Boolean(validationError)}>
          {isPending ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-dim)]">
          Application configuration, account details, and usage policy.
        </p>
      </div>

      <Card>
        <SectionHeader icon={Info} title="Application" />
        <div className="divide-y divide-[var(--color-border)]/60">
          <InfoRow label="Version" value={APP_VERSION} />
          <InfoRow label="Environment" value={APP_ENVIRONMENT} />
          <InfoRow label="Framework" value={APP_FRAMEWORK} />
        </div>
      </Card>

      <Card>
        <SectionHeader icon={User} title="Account" />
        <div className="divide-y divide-[var(--color-border)]/60">
          <InfoRow label="Email" value={user?.email ?? "—"} />
          <InfoRow label="Display Name" value={user?.displayName ?? "—"} />
          <InfoRow label="User ID" value={user?.id ?? "—"} />
        </div>
      </Card>

      <Card>
        <SectionHeader icon={Lock} title="Change Password" />
        <ChangePasswordForm />
      </Card>

      <Card>
        <SectionHeader icon={ShieldCheck} title="Acceptable Use Policy" />
        <p className="text-sm leading-relaxed text-[var(--color-text-dim)] mb-5">
          {ACCEPTABLE_USE_STATEMENT}
        </p>
        <div className="rounded-lg border border-red-500/10 bg-red-500/[0.03] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400/80 mb-3">
            Prohibited Activities
          </h3>
          <ul className="space-y-2.5">
            {PROHIBITED_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <Ban
                  size={14}
                  className="mt-0.5 shrink-0 text-red-400/60"
                />
                <span className="text-sm text-[var(--color-text-dim)]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card>
        <SectionHeader icon={Download} title="Export & Import" />
        <p className="text-sm text-[var(--color-text-dim)] mb-4">
          Export your data as JSON for backup, or import from a previous export.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" disabled>
            <Download size={14} className="mr-1.5" />
            Export Data
          </Button>
          <Button variant="secondary" disabled>
            <Upload size={14} className="mr-1.5" />
            Import Data
          </Button>
        </div>
        <p className="mt-3 text-xs italic text-[var(--color-muted)]">
          Available when database integration is implemented.
        </p>
      </Card>
    </div>
  );
}
