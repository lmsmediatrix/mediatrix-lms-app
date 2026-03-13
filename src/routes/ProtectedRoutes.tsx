import React, { Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";

interface RouteProps {
  element: React.ReactElement;
  allowedRoles: string[];
}

export const ProtectedRoutes = ({ element, allowedRoles }: RouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isInitialAuthCheck, currentUser } = useAuth();
  const userRole = currentUser?.user.role;
  if (isInitialAuthCheck) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/notfound" replace />; // Redirect if unauthorized
  }

  

  return <Suspense fallback={<SplashScreen />}>{element}</Suspense>;
};
