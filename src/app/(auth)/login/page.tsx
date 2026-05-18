import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-1 font-mono">
          DotVault
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] mb-8">
          Sign in to your account
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
