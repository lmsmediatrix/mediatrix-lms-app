import type { ICurrentUser } from "../types/interfaces";
import { getStoredAuthToken } from "./authToken";

const LOCAL_PERFORMANCE_APP_URL = "http://localhost:5181";

const isLocalHost = () => {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
};

const toAbsoluteUrl = (url: string) => {
  try {
    return new URL(url).toString();
  } catch {
    return new URL(url, window.location.origin).toString();
  }
};

export const getPerformanceAppBaseUrl = () => {
  if (import.meta.env.VITE_PERFORMANCE_APP_URL) {
    return import.meta.env.VITE_PERFORMANCE_APP_URL;
  }

  if (isLocalHost()) {
    return LOCAL_PERFORMANCE_APP_URL;
  }

  return "https://mediatrix-performance-app-dev.web.app";
};

export const buildPerformanceSystemUrl = (currentUser?: ICurrentUser) => {
  const user = currentUser?.user;
  const role = user?.role || "admin";
  const orgCode = user?.organization?.code || "";
  const fallbackPath =
    orgCode && role ? `/${orgCode}/${role}/dashboard` : "/admin/dashboard";
  const returnTo =
    typeof window !== "undefined"
      ? `${window.location.origin}${fallbackPath}`
      : fallbackPath;

  const url = new URL(toAbsoluteUrl(getPerformanceAppBaseUrl()));
  const authToken = getStoredAuthToken() || currentUser?.token;

  url.searchParams.set("source", "lms");
  url.searchParams.set("returnTo", returnTo);
  if (authToken) url.searchParams.set("accessToken", authToken);
  if (orgCode) url.searchParams.set("orgCode", orgCode);
  if (role) url.searchParams.set("role", role);

  return url.toString();
};

export const openPerformanceSystem = (currentUser?: ICurrentUser) => {
  window.location.assign(buildPerformanceSystemUrl(currentUser));
};
