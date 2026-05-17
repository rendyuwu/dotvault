"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { mockGmailAccounts } from "@/lib/mock-data/gmail-accounts";
import { mockAliases } from "@/lib/mock-data/aliases";
import type { GmailAccount } from "@/lib/types/gmail-account";
import type { DotAlias } from "@/lib/types/alias";

interface AddAccountData {
  originalEmail: string;
  canonicalEmail: string;
  localPart: string;
  domain: string;
  label: string;
  notes: string | null;
}

interface GmailAccountsContextValue {
  accounts: GmailAccount[];
  aliases: DotAlias[];
  addAccount: (data: AddAccountData) => GmailAccount;
  addAliases: (newAliases: DotAlias[]) => { saved: number; skipped: number };
  updateAccount: (
    id: string,
    data: Partial<Pick<GmailAccount, "label" | "notes">>
  ) => void;
  updateAlias: (
    id: string,
    data: Partial<Pick<DotAlias, "notes" | "archived">>
  ) => void;
  archiveAccount: (id: string) => void;
  isDuplicate: (canonicalEmail: string) => boolean;
}

const GmailAccountsContext = createContext<GmailAccountsContextValue | null>(
  null
);

export function GmailAccountsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<GmailAccount[]>(mockGmailAccounts);
  const [aliases, setAliases] = useState<DotAlias[]>(mockAliases);

  const userId = user?.id;
  const userAccounts = useMemo(
    () => accounts.filter((a) => a.userId === userId),
    [accounts, userId]
  );
  const userAliases = useMemo(
    () => aliases.filter((a) => a.userId === userId),
    [aliases, userId]
  );

  const isDuplicate = useCallback(
    (canonicalEmail: string) => {
      return accounts.some(
        (a) => a.userId === userId && a.canonicalEmail === canonicalEmail
      );
    },
    [accounts, userId]
  );

  const addAliases = useCallback(
    (newAliases: DotAlias[]): { saved: number; skipped: number } => {
      let saved = 0;
      let skipped = 0;
      const toAdd: DotAlias[] = [];
      setAliases((prev) => {
        for (const alias of newAliases) {
          const exists = prev.some(
            (a) =>
              a.gmailAccountId === alias.gmailAccountId &&
              a.aliasEmail === alias.aliasEmail
          );
          if (exists) {
            skipped++;
          } else {
            toAdd.push(alias);
            saved++;
          }
        }
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
      return { saved, skipped };
    },
    []
  );

  const addAccount = useCallback(
    (data: AddAccountData): GmailAccount => {
      if (!userId) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      const accountId = `gma-${crypto.randomUUID().slice(0, 8)}`;
      const aliasId = `ali-${crypto.randomUUID().slice(0, 8)}`;

      const newAccount: GmailAccount = {
        id: accountId,
        userId,
        originalEmail: data.originalEmail,
        canonicalEmail: data.canonicalEmail,
        localPart: data.localPart,
        domain: data.domain,
        label: data.label,
        notes: data.notes,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };

      const originalAlias: DotAlias = {
        id: aliasId,
        userId,
        gmailAccountId: accountId,
        aliasEmail: data.canonicalEmail,
        localPartWithDots: data.localPart,
        dotCount: 0,
        isOriginal: true,
        notes: null,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };

      setAccounts((prev) => [...prev, newAccount]);
      setAliases((prev) => [...prev, originalAlias]);
      return newAccount;
    },
    [userId]
  );

  const updateAccount = useCallback(
    (id: string, data: Partial<Pick<GmailAccount, "label" | "notes">>) => {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id && a.userId === userId
            ? { ...a, ...data, updatedAt: new Date().toISOString() }
            : a
        )
      );
    },
    [userId]
  );

  const updateAlias = useCallback(
    (id: string, data: Partial<Pick<DotAlias, "notes" | "archived">>) => {
      setAliases((prev) =>
        prev.map((a) =>
          a.id === id && a.userId === userId
            ? { ...a, ...data, updatedAt: new Date().toISOString() }
            : a
        )
      );
    },
    [userId]
  );

  const archiveAccount = useCallback(
    (id: string) => {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === id && a.userId === userId
            ? { ...a, archived: true, updatedAt: new Date().toISOString() }
            : a
        )
      );
    },
    [userId]
  );

  return (
    <GmailAccountsContext.Provider
      value={{
        accounts: userAccounts,
        aliases: userAliases,
        addAccount,
        addAliases,
        updateAccount,
        updateAlias,
        archiveAccount,
        isDuplicate,
      }}
    >
      {children}
    </GmailAccountsContext.Provider>
  );
}

export function useGmailAccounts(): GmailAccountsContextValue {
  const ctx = useContext(GmailAccountsContext);
  if (!ctx) {
    throw new Error(
      "useGmailAccounts must be used within GmailAccountsProvider"
    );
  }
  return ctx;
}
