import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/SplashScreen";

export default function AuthLayout () {
  const { isAuthenticated, isInitialAuthCheck, currentUser } = useAuth();
  const role = currentUser?.user?.role;
  const orgCode = currentUser?.user?.organization?.code;

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

  return (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  );
};

