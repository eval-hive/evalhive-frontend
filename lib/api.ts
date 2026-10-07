import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return config;
  const requestUrl = String(config.url || "");
  if (/[?&]organization=/i.test(requestUrl) || config.params?.organization) return config;
  try {
    const cached = sessionStorage.getItem("eval_hive_user");
    const slug = cached ? JSON.parse(cached)?.organization?.slug : null;
    if (slug) config.params = { ...config.params, organization: slug };
  } catch {
    // The authenticated backend session remains authoritative if the display cache is unavailable.
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      sessionStorage.removeItem("eval_hive_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
