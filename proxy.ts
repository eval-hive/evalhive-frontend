import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "eval_hive_session";
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin", "mail", "support", "status"]);

function organizationSlug(request: NextRequest) {
  const developmentSlug = request.nextUrl.searchParams.get("organization") ||
    request.cookies.get("eval_hive_organization")?.value ||
    process.env.DEV_ORGANIZATION_SLUG;
  if (developmentSlug && !RESERVED_SUBDOMAINS.has(developmentSlug.toLowerCase())) {
    return developmentSlug.toLowerCase().trim();
  }
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  if (parts.length >= 3 && !RESERVED_SUBDOMAINS.has(parts[0])) return parts[0];
  return null;
}

function dashboardForRole(role: string) {
  if (role === "super_admin") return "/admin/platform";
  if (role === "organization_admin") return "/admin/organization";
  if (role === "tutor") return "/teacher/dashboard";
  return "/student/dashboard";
}

function roleCanOpen(role: string, pathname: string) {
  if (pathname.startsWith("/admin/platform")) return role === "super_admin";
  if (pathname.startsWith("/admin/organization")) {
    return role === "organization_admin";
  }
  if (pathname.startsWith("/teacher")) return role === "tutor" || role === "organization_admin";
  if (pathname.startsWith("/student")) return role === "student";
  return true;
}

async function authenticatedUser(request: NextRequest, slug: string | null) {
  const base = process.env.INTERNAL_API_URL || "http://127.0.0.1:5000/api/";
  const url = new URL("auth/me", base.endsWith("/") ? base : `${base}/`);
  if (process.env.NODE_ENV !== "production" && slug) url.searchParams.set("organization", slug);
  const headers = new Headers({
    cookie: request.headers.get("cookie") || "",
    "x-forwarded-host": request.headers.get("host") || request.nextUrl.host,
    "x-forwarded-proto": request.nextUrl.protocol.replace(":", ""),
  });
  if (slug) headers.set("x-organization-slug", slug);
  if (process.env.INTERNAL_PROXY_SECRET) {
    headers.set("x-evalhive-proxy-secret", process.env.INTERNAL_PROXY_SECRET);
  }
  const response = await fetch(url, { headers, cache: "no-store" });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.user as { role: string; mustChangePassword?: boolean };
}

function loginRedirect(request: NextRequest, slug: string | null, clearSession = false) {
  const url = new URL("/login", request.url);
  if (slug) url.searchParams.set("organization", slug);
  const response = NextResponse.redirect(url);
  if (clearSession) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const publicPaths = new Set(["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"]);
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const slug = organizationSlug(request);

  if (pathname === "/") {
    const url = new URL("/login", request.url);
    if (slug) url.searchParams.set("organization", slug);
    return NextResponse.redirect(url);
  }

  if (!publicPaths.has(pathname) && !session) {
    return loginRedirect(request, slug);
  }

  if (!publicPaths.has(pathname) && session) {
    const user = await authenticatedUser(request, slug).catch(() => null);
    if (!user) return loginRedirect(request, slug, true);
    if (user.mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    if (!user.mustChangePassword && pathname === "/change-password") {
      return NextResponse.redirect(new URL(dashboardForRole(user.role), request.url));
    }
    if (!roleCanOpen(user.role, pathname)) {
      return NextResponse.redirect(new URL(dashboardForRole(user.role), request.url));
    }
  }

  const headers = new Headers(request.headers);
  if (slug) headers.set("x-organization-slug", slug);
  return NextResponse.next({ request: { headers } });
}
