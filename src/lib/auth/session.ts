import "server-only";

import { cookies } from "next/headers";
import { getAuthSecret, isProduction } from "@/lib/env";
import {
  createSessionValue,
  getExpiredSessionCookieOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifySessionValue,
} from "./session-cookie";

export async function readSessionCookie() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionValue(rawValue, getAuthSecret());
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionValue(userId, getAuthSecret()),
    ...getSessionCookieOptions(isProduction()),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    ...getExpiredSessionCookieOptions(isProduction()),
  });
}
