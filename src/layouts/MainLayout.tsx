import { Outlet, useLocation, useNavigate } from "react-router-dom";
import TopNavigation from "../components/common/TopNavigation";
import SideNavigation from "../components/common/SideNavigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const role = currentUser.user.role;
  const orgCode = currentUser.user.organization?.code;
  const isTopNav = role === "student" || role === "instructor";
  const isSideNav = role === "admin" || role === "superadmin";
  const isAssessmentPage =
    role === "student" && location.pathname.includes("/assessment/");

  useEffect(() => {
    if (
      currentUser.user.isPasswordChanged === false &&
      currentUser.user.role !== "superadmin" &&
      orgCode
    ) {
      navigate(
        `/${orgCode}/${currentUser.user.role}/profile?change-password=true`
      );
    }
  }, [currentUser, navigate, orgCode]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {!isAssessmentPage && isTopNav && <TopNavigation />}
      <div
        className={`flex min-h-0 flex-1 ${
          isSideNav
            ? "gap-2 overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#dbeafe_0%,#f1f5f9_40%,#f8fafc_100%)] p-2 sm:gap-3 sm:p-3"
            : ""
        }`}
      >
        {isSideNav && (
          <SideNavigation
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        )}
        <main
          className={`min-h-0 flex-1 transition-all duration-300 ${
            isSideNav
              ? `${isCollapsed ? "lg:ml-[104px]" : "lg:ml-[276px]"} overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur`
              : "no-scrollbar overflow-y-auto overflow-x-hidden bg-gray-50"
          }`}
        >
          {isSideNav ? (
            <div className="admin-content-compact no-scrollbar h-full overflow-y-auto overscroll-contain">
              <Outlet />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default MainLayout;
