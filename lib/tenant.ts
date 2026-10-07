const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin", "mail", "support", "status"]);

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase());
}

export function extractSlugFromHost(host: string): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  if (parts.length >= 3 && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return isReservedSubdomain(parts[0]) ? null : parts[0];
  }
  return null;
}

export function getOrganizationSlugClient(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get("organization");
  if (querySlug) {
    const slug = querySlug.toLowerCase().trim();
    return slug === "__superadmin" || isReservedSubdomain(slug) ? null : slug;
  }
  const configured = process.env.NEXT_PUBLIC_DEV_ORGANIZATION_SLUG;
  if (configured && configured !== "__superadmin" && !isReservedSubdomain(configured)) return configured;
  return extractSlugFromHost(window.location.host);
}

export const isSuperAdminContextClient = () => getOrganizationSlugClient() === null;

export function getOrganizationLoginUrl(slug: string): string {
  if (process.env.NODE_ENV === "production") return `https://${slug}.evalhive.ng/login`;
  return `http://localhost:3000/login?organization=${encodeURIComponent(slug)}`;
}
