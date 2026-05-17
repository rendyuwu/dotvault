"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { mockProviders } from "@/lib/mock-data/providers";
import { mockAliasProviderLinks } from "@/lib/mock-data/alias-provider-links";
import type { Provider } from "@/lib/types/provider";
import type { AliasProviderLink } from "@/lib/types/alias-provider-link";

interface AddProviderData {
  name: string;
  website: string | null;
  category: string | null;
  notes: string | null;
}

interface AddLinkData {
  aliasId: string;
  providerId: string;
  accountIdentifier: string | null;
  notes: string | null;
}

interface ProvidersContextValue {
  providers: Provider[];
  links: AliasProviderLink[];
  addProvider: (data: AddProviderData) => Provider | null;
  updateProvider: (
    id: string,
    data: Partial<Pick<Provider, "name" | "website" | "category" | "notes">>
  ) => void;
  archiveProvider: (id: string) => void;
  addLink: (data: AddLinkData) => AliasProviderLink | null;
  updateLink: (
    id: string,
    data: Partial<Pick<AliasProviderLink, "accountIdentifier" | "notes">>
  ) => void;
  archiveLink: (id: string) => void;
  isDuplicateLink: (aliasId: string, providerId: string) => boolean;
  isDuplicateProvider: (name: string) => boolean;
  getLinksForAlias: (aliasId: string) => AliasProviderLink[];
  getLinksForProvider: (providerId: string) => AliasProviderLink[];
}

const ProvidersContext = createContext<ProvidersContextValue | null>(null);

export function ProvidersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>(mockProviders);
  const [links, setLinks] = useState<AliasProviderLink[]>(
    mockAliasProviderLinks
  );

  const userId = user?.id;
  const userProviders = useMemo(
    () => providers.filter((p) => p.userId === userId),
    [providers, userId]
  );
  const userLinks = useMemo(
    () => links.filter((l) => l.userId === userId),
    [links, userId]
  );

  const isDuplicateLink = useCallback(
    (aliasId: string, providerId: string) => {
      return userLinks.some(
        (l) =>
          l.aliasId === aliasId &&
          l.providerId === providerId &&
          !l.archived
      );
    },
    [userLinks]
  );

  const isDuplicateProvider = useCallback(
    (name: string) => {
      return userProviders.some(
        (p) => p.name.toLowerCase() === name.toLowerCase() && !p.archived
      );
    },
    [userProviders]
  );

  const addProvider = useCallback(
    (data: AddProviderData): Provider | null => {
      if (!userId) throw new Error("Not authenticated");
      if (isDuplicateProvider(data.name)) return null;
      const now = new Date().toISOString();
      const newProvider: Provider = {
        id: `prv-${crypto.randomUUID().slice(0, 8)}`,
        userId,
        name: data.name,
        website: data.website,
        category: data.category,
        notes: data.notes,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      setProviders((prev) => [...prev, newProvider]);
      return newProvider;
    },
    [userId, isDuplicateProvider]
  );

  const updateProvider = useCallback(
    (
      id: string,
      data: Partial<Pick<Provider, "name" | "website" | "category" | "notes">>
    ) => {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === id && p.userId === userId
            ? { ...p, ...data, updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [userId]
  );

  const archiveProvider = useCallback(
    (id: string) => {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === id && p.userId === userId
            ? { ...p, archived: true, updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [userId]
  );

  const addLink = useCallback(
    (data: AddLinkData): AliasProviderLink | null => {
      if (!userId) throw new Error("Not authenticated");
      if (isDuplicateLink(data.aliasId, data.providerId)) return null;
      const now = new Date().toISOString();
      const newLink: AliasProviderLink = {
        id: `lnk-${crypto.randomUUID().slice(0, 8)}`,
        userId,
        aliasId: data.aliasId,
        providerId: data.providerId,
        accountIdentifier: data.accountIdentifier,
        notes: data.notes,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      setLinks((prev) => [...prev, newLink]);
      return newLink;
    },
    [userId, isDuplicateLink]
  );

  const updateLink = useCallback(
    (
      id: string,
      data: Partial<Pick<AliasProviderLink, "accountIdentifier" | "notes">>
    ) => {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === id && l.userId === userId
            ? { ...l, ...data, updatedAt: new Date().toISOString() }
            : l
        )
      );
    },
    [userId]
  );

  const archiveLink = useCallback(
    (id: string) => {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === id && l.userId === userId
            ? { ...l, archived: true, updatedAt: new Date().toISOString() }
            : l
        )
      );
    },
    [userId]
  );

  const getLinksForAlias = useCallback(
    (aliasId: string) => {
      return userLinks.filter((l) => l.aliasId === aliasId && !l.archived);
    },
    [userLinks]
  );

  const getLinksForProvider = useCallback(
    (providerId: string) => {
      return userLinks.filter(
        (l) => l.providerId === providerId && !l.archived
      );
    },
    [userLinks]
  );

  return (
    <ProvidersContext.Provider
      value={{
        providers: userProviders,
        links: userLinks,
        addProvider,
        updateProvider,
        archiveProvider,
        addLink,
        updateLink,
        archiveLink,
        isDuplicateLink,
        isDuplicateProvider,
        getLinksForAlias,
        getLinksForProvider,
      }}
    >
      {children}
    </ProvidersContext.Provider>
  );
}

export function useProviders(): ProvidersContextValue {
  const ctx = useContext(ProvidersContext);
  if (!ctx) {
    throw new Error("useProviders must be used within ProvidersProvider");
  }
  return ctx;
}
