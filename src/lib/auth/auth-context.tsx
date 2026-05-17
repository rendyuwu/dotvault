"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { User } from "@/lib/types";
import { validateCredentials } from "./mock-credentials";

const STORAGE_KEY = "dotvault-auth-user";

function parseStoredUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.isActive === "boolean"
    ) {
      return parsed as User;
    }
  } catch {}
  return null;
}

function readStoredAuth(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function emitAuthChange() {
  window.dispatchEvent(new Event("dotvault-auth-change"));
}

function subscribeToAuthChange(onStoreChange: () => void) {
  window.addEventListener("dotvault-auth-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("dotvault-auth-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const storedAuth = useSyncExternalStore(subscribeToAuthChange, readStoredAuth, () => "");
  const user = useMemo(() => parseStoredUser(storedAuth), [storedAuth]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const result = validateCredentials(email, password);
      if (!result) return false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      emitAuthChange();
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitAuthChange();
  }, []);

  return (
    <AuthContext value={{ user, isLoading: false, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
