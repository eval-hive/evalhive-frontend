/**
 * Frontend Tenant Utility
 */

export function extractSlugFromHost(host: string): string | null {
  if (!host) return null;
  const parts = host.split(".");
  if (parts.length >= 3 && !host.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
    const subdomain = parts[0];
    if (subdomain !== "www" && subdomain !== "admin") {
      return subdomain;
    } else if (subdomain === "admin") {
      return null; // Admin is super admin context
    }
  }
  return null;
}

export function getSchoolSlugClient(): string | null {
  if (typeof window !== "undefined") {
    // Check for query param bypass first
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get("school");
    if (querySlug) return querySlug === "__superadmin" ? null : querySlug;

    // Use DEV_SCHOOL_SLUG if defined in process.env
    if (
      process.env.NEXT_PUBLIC_DEV_SCHOOL_SLUG &&
      process.env.NEXT_PUBLIC_DEV_SCHOOL_SLUG !== "__superadmin"
    ) {
      return process.env.NEXT_PUBLIC_DEV_SCHOOL_SLUG;
    }

    return extractSlugFromHost(window.location.host);
  }

  return null;
}

export function isSuperAdminContextClient(): boolean {
  return getSchoolSlugClient() === null;
}

export function getSchoolLoginUrl(slug: string): string {
  // If production
  if (process.env.NODE_ENV === "production") {
    return `https://${slug}.evalhive.com/login`;
  }

  // Local development
  // Best effort for ngrok, or fallback to query param on localhost
  if (typeof window !== "undefined" && window.location.host.includes("ngrok")) {
    // This assumes they are using a wildcard/custom ngrok domain.
    // If not, they must rely on the query parameter fallback instead.
    const parts = window.location.host.split(".");
    parts[0] = slug;
    return `${window.location.protocol}//${parts.join(".")}/login`;
  }

  return `http://localhost:3000/login?school=${slug}`;
}
