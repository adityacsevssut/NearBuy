import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Ensures COOP allows Google's Sign-In iframe/popup to postMessage back to this origin.
 * next.config.ts sets the same header; middleware guarantees it on every matched route.
 */
export function middleware(_request: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next internals and static files (same defaults as Next middleware docs).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
