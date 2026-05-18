"use client";

import { createContext, useContext, useMemo } from "react";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: false;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({ user: initialUser, isLoading: false }),
    [initialUser]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
