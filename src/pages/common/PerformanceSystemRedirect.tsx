import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SystemBridgeLoader from "../../components/common/SystemBridgeLoader";
import { getStoredAuthToken } from "../../lib/authToken";

const PERFORMANCE_SYSTEM_URL =
  import.meta.env.VITE_PERFORMANCE_APP_URL || "http://localhost:5181";

const toAbsoluteUrl = (url: string) => {
  try {
    return new URL(url).toString();
  } catch {
    return new URL(url, window.location.origin).toString();
  }
};

export default function PerformanceSystemRedirect() {
  const { currentUser } = useAuth();
  const { orgCode } = useParams();

  const role = currentUser?.user?.role || "admin";
  const resolvedOrgCode = orgCode || currentUser?.user?.organization?.code || "";

  const lmsReturnUrl = useMemo(() => {
    const fallbackPath =
      resolvedOrgCode && role ? `/${resolvedOrgCode}/${role}/dashboard` : "/admin/dashboard";
    return `${window.location.origin}${fallbackPath}`;
  }, [resolvedOrgCode, role]);

  const targetUrl = useMemo(() => {
    const url = new URL(toAbsoluteUrl(PERFORMANCE_SYSTEM_URL));
    const authToken = getStoredAuthToken() || currentUser?.token;
    url.searchParams.set("source", "lms");
    url.searchParams.set("returnTo", lmsReturnUrl);
    if (authToken) {
      url.searchParams.set("accessToken", authToken);
    }
    if (resolvedOrgCode) {
      url.searchParams.set("orgCode", resolvedOrgCode);
    }
    if (role) {
      url.searchParams.set("role", role);
    }
    return url.toString();
  }, [lmsReturnUrl, resolvedOrgCode, role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.assign(targetUrl);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [targetUrl]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50 px-6 py-12">
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl space-y-4">
        <SystemBridgeLoader
          title="Connecting to Performance System"
          subtitle="Verifying session and opening your performance workspace."
          fromLabel="ALMA LMS"
          toLabel="Performance System"
        />

        <div className="text-center">
          <a
            href={targetUrl}
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Continue Now
          </a>
        </div>
      </div>
    </div>
  );
}
