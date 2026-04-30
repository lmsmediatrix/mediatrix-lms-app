import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/SplashScreen";
import { motion } from "framer-motion";

const mediatrixTheme = {
  logoLight:
    "https://mediatrixmed.com.ph/wp-content/uploads/2023/08/MMMC_White-Header-2022-1024x165.png",
  logoDark:
    "https://res.cloudinary.com/dyal0wstg/image/upload/v1751945580/alma_nav_2_yobcpv.png",
  wave: "https://mediatrixmed.com.ph/wp-content/uploads/2023/09/MMMC-Wave.png",
};

export default function AuthLayout() {
  const { isAuthenticated, isInitialAuthCheck, currentUser } = useAuth();
  const location = useLocation();
  const role = currentUser?.user?.role;
  const orgCode = currentUser?.user?.organization?.code;
  const isLoginRoute = location.pathname === "/login";

  const destination =
    role === "superadmin"
      ? "/admin/dashboard"
      : role === "admin"
      ? orgCode
        ? `/${orgCode}/admin/dashboard`
        : "/login"
      : role === "instructor"
      ? orgCode
        ? `/${orgCode}/instructor/dashboard`
        : "/login"
      : role === "student"
      ? orgCode
        ? `/${orgCode}/student/dashboard`
        : "/login"
      : "/login";

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  if (isInitialAuthCheck) {
    return <LoadingSpinner />;
  }

  if (!isLoginRoute) {
    return (
      <div className="min-h-screen w-full">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden text-white">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #011A5D 0%, #01268F 48%, #1C7FC9 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(circle at 18% 15%, rgba(1,78,255,0.4) 0%, transparent 43%), radial-gradient(circle at 85% 10%, rgba(234,246,255,0.22) 0%, transparent 32%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.16) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-56 bg-bottom bg-contain bg-no-repeat opacity-70"
          style={{ backgroundImage: `url(${mediatrixTheme.wave})` }}
        />

        <div
          className="relative z-10 flex h-full flex-col justify-between px-12 py-12 xl:px-16"
          style={{ fontFamily: '"Proxima Nova", "Roboto", "Inter", sans-serif' }}
        >
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <img
              src={mediatrixTheme.logoLight}
              alt="Mary Mediatrix Medical Center"
              className="h-auto w-[280px] max-w-full"
            />
            <div className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]">
              Center of Excellence
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.55, ease: "easeOut" }}
            className="max-w-xl"
          >
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Patient-centered care is at the heart of everything we do.
            </h1>
            <p className="mt-6 max-w-lg text-base text-[#EAF6FF] xl:text-lg">
              Providing Better And Quality Healthcare For All through expert care, advanced technology, and efficient
              processes.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2.5 text-sm font-medium">
              <span className="rounded-full bg-[#014EFF]/35 px-3 py-1.5">Heart Institute</span>
              <span className="rounded-full bg-[#014EFF]/35 px-3 py-1.5">Cancer Institute</span>
              <span className="rounded-full bg-[#014EFF]/35 px-3 py-1.5">Renal &amp; Transplant</span>
            </div>
            <p className="text-sm text-[#EAF6FF]/90">J.P Laurel Highway, Lipa City, Batangas</p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        <nav className="flex lg:hidden items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <img src={mediatrixTheme.logoDark} alt="Logo" className="h-9 w-auto rounded-full" />
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

