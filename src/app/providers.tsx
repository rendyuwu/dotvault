"use client";

import { AuthProvider } from "@/lib/auth/auth-context";
import { GmailAccountsProvider } from "@/lib/mock-data/gmail-accounts-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GmailAccountsProvider>{children}</GmailAccountsProvider>
    </AuthProvider>
  );
}
