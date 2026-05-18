import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionValue,
} from "@/lib/auth/session-cookie";

const protectedRoutePrefixes = [
  "/dashboard",
  "/gmail-accounts",
  "/generate",
  "/aliases",
  "/providers",
  "/settings",
];

export function isProtectedPath(pathname: string): boolean {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getProxyRedirectPath(
  pathname: string,
  sessionValue: string | undefined,
  authSecret: string | undefined
): string | null {
  const hasValidSession = Boolean(verifySessionValue(sessionValue, authSecret));

  if (pathname === "/login") return null;
  if (isProtectedPath(pathname) && !hasValidSession) return "/login";
  return null;
}

export function proxy(request: NextRequest) {
  const redirectPath = getProxyRedirectPath(
    request.nextUrl.pathname,
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    process.env.AUTH_SECRET
  );

  if (!redirectPath) return NextResponse.next();
  return NextResponse.redirect(new URL(redirectPath, request.url));
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/gmail-accounts/:path*",
    "/generate",
    "/aliases/:path*",
    "/providers/:path*",
    "/settings",
  ],
};
