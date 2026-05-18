"use client";

import { AuthProvider } from "@/lib/auth/auth-context";
import { GmailAccountsProvider } from "@/lib/mock-data/gmail-accounts-context";
import { ProvidersProvider } from "@/lib/mock-data/providers-context";
import type { User } from "@/lib/types";

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  return (
    <AuthProvider initialUser={initialUser}>
      <GmailAccountsProvider>
        <ProvidersProvider>{children}</ProvidersProvider>
      </GmailAccountsProvider>
    </AuthProvider>
  );
}
