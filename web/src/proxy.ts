import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canRoleAccessApi,
  canRoleAccessPath,
  getRoleHomePath,
  isPublicApiPath,
  isPublicPath,
} from "@/lib/rbac";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const isAuthApi = pathname.startsWith("/api/auth/");
  if (isAuthApi || isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = getRoleHomePath(session.role);
    return NextResponse.redirect(homeUrl);
  }

  if (pathname.startsWith("/api/")) {
    if (canRoleAccessApi(session.role, pathname)) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (canRoleAccessPath(session.role, pathname)) {
    return NextResponse.next();
  }

  const unauthorizedUrl = request.nextUrl.clone();
  unauthorizedUrl.pathname = "/unauthorized";
  return NextResponse.redirect(unauthorizedUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
