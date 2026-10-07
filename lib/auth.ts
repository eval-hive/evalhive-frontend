import api from "./api";

export interface User {
  id: string;
  email: string;
  role: "super_admin" | "organization_admin" | "tutor" | "student";
  organizationId: string | null;
  mustChangePassword: boolean;
  displayName: string;
  avatarUrl?: string | null;
  canTutor?: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
}

const USER_CACHE_KEY = "eval_hive_user";

export const getAuthToken = () => null;

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(USER_CACHE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    sessionStorage.removeItem(USER_CACHE_KEY);
    return null;
  }
};

export const cacheUser = (user: User) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    if (user.organization?.slug) {
      document.cookie = `eval_hive_organization=${encodeURIComponent(user.organization.slug)}; Path=/; SameSite=Lax`;
    }
  }
};

export const refreshUser = async () => {
  const response = await api.get<{ user: User }>("/auth/me");
  cacheUser(response.data.user);
  return response.data.user;
};

export const isAuthenticated = () => Boolean(getUser());
export const getRole = () => getUser()?.role || null;
export const loginAuth = (userOrLegacyToken: User | string | null, legacyUser?: User) => {
  const user = typeof userOrLegacyToken === "object" && userOrLegacyToken
    ? userOrLegacyToken
    : legacyUser;
  if (user) cacheUser(user);
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(USER_CACHE_KEY);
      document.cookie = "eval_hive_organization=; Path=/; SameSite=Lax; Max-Age=0";
      window.location.href = "/login";
    }
  }
};
