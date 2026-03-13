import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/SplashScreen";

export default function AuthLayout () {
  const { isAuthenticated, isInitialAuthCheck, currentUser } = useAuth();
  const role = currentUser?.user.role;
  const orgCode = role !== "superadmin" ? currentUser?.user.organization.code : "";

  const destination =
    role === "superadmin"
      ? "/admin/dashboard"
      : role === "admin"
      ? `/${orgCode}/admin/dashboard`
      : role === "instructor"
      ? `/${orgCode}/instructor/dashboard`
      : role === "student"
      ? `/${orgCode}/student/dashboard`
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

