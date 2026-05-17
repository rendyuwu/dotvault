"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-1 font-mono">
          DotVault
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] mb-8">
          Sign in to your account
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm text-[var(--color-text-dim)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              placeholder="admin@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm text-[var(--color-text-dim)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="mt-2 h-10 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-[var(--color-base)] transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
