"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "dotvault-sidebar-collapsed";

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useSidebar() {
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !getSnapshot();
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  return { isCollapsed, toggle };
}
