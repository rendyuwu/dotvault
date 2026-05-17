"use client";

import { AuthProvider } from "@/lib/auth/auth-context";
import { GmailAccountsProvider } from "@/lib/mock-data/gmail-accounts-context";
import { ProvidersProvider } from "@/lib/mock-data/providers-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GmailAccountsProvider>
        <ProvidersProvider>{children}</ProvidersProvider>
      </GmailAccountsProvider>
    </AuthProvider>
  );
}
