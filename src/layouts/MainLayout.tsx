import { Outlet, useLocation, useNavigate } from "react-router-dom";
import TopNavigation from "../components/common/TopNavigation";
import SideNavigation from "../components/common/SideNavigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const role = currentUser.user.role;
  const isTopNav = role === "student" || role === "instructor";
  const isSideNav = role === "admin" || role === "superadmin";
  const isAssessmentPage =
    role === "student" && location.pathname.includes("/assessment/");

  useEffect(() => {
    if (
      currentUser.user.isPasswordChanged === false &&
      currentUser.user.role !== "superadmin"
    ) {
      navigate(
        `/${currentUser.user.organization.code}/${currentUser.user.role}/profile?change-password=true`
      );
    }
  }, [currentUser, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isAssessmentPage && isTopNav && <TopNavigation />}
      <div className="flex flex-1">
        {isSideNav && (
          <SideNavigation
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        )}
        <main
          className={`flex-1 bg-gray-50 overflow-auto transition-all duration-300 ${
            isSideNav ? (isCollapsed ? "lg:ml-[80px]" : "lg:ml-[250px]") : ""
          }`}
        >
          <Outlet />
        </main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />
      <Footer />
    </div>
  );
};

export default MainLayout;
