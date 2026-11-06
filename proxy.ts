import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth/config";
import { verifyToken } from "@/lib/auth/token";
import { allowedAdminOrigin } from "@/lib/auth/origin";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const api = path.startsWith("/api/admin/");
  let response: NextResponse;
  if (
    api &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    !allowedAdminOrigin(req)
  ) {
    response = NextResponse.json(
      { error: "Request not allowed." },
      { status: 403 },
    );
  } else {
    const user = await verifyToken(req.cookies.get(sessionCookieName)?.value);
    if (
      path.startsWith("/secret-admin") &&
      path !== "/secret-admin/login" &&
      !user
    ) {
      response = NextResponse.redirect(new URL("/secret-admin/login", req.url));
    } else if (api && path !== "/api/admin/login" && !user) {
      response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      response = NextResponse.next();
    }
  }
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/secret-admin/:path*", "/api/admin/:path*"],
};
