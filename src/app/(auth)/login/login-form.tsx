"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { initialLoginActionState } from "@/lib/auth/action-state";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialLoginActionState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-[var(--color-text-dim)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          placeholder="admin@example.com"
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-[var(--color-text-dim)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 h-10 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-[var(--color-base)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:pointer-events-none"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
