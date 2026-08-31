/**
 * Frontend Tenant Utility
 */

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin"]);

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase());
}

export function extractSlugFromHost(host: string): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  if (parts.length >= 3 && !hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
    const subdomain = parts[0];
    if (!isReservedSubdomain(subdomain)) return subdomain;
  }
  return null;
}

export function getSchoolSlugClient(): string | null {
  if (typeof window !== "undefined") {
    // Check for query param bypass first
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get("school");
    if (querySlug) {
      const normalizedQuerySlug = querySlug.toLowerCase().trim();
      return normalizedQuerySlug === "__superadmin" || isReservedSubdomain(normalizedQuerySlug) ? null : normalizedQuerySlug;
    }

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
    return `https://${slug}.evalhive.ng/login`;
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
