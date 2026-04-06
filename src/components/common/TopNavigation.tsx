import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaGraduationCap, FaRegBell, FaBars } from "react-icons/fa";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { BASE_NAVIGATION } from "../../config/common";
import { useNotification } from "../../hooks/useNotification";
import { getTerm } from "../../lib/utils";
import NotificationMenu from "./NotificationMenu";
import AvatarDropdown from "./AvatarDropdown";

interface NavItem {
  LABEL: string;
  PATH?: string;
  ICON?: React.ComponentType;
  SUBMENU?: NavItem[];
}

export default function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { data } = useNotification({ count: true, document: false, status: "unread" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  const role = currentUser?.user.role?.toUpperCase() as
    | keyof typeof BASE_NAVIGATION
    | undefined;
  const code =
    role !== "SUPERADMIN" ? currentUser?.user.organization.code : undefined;
  const orgType =
    role !== "SUPERADMIN" ? currentUser?.user.organization.type : undefined;

  const learnerTerm = orgType ? getTerm("learner", orgType) : "Student";

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);

  const performancePath =
    role === "ADMIN" && code
      ? `/${code}/admin/performance-system`
      : role === "INSTRUCTOR" && code
        ? `/${code}/instructor/performance-system`
        : role === "STUDENT" && code
          ? `/${code}/student/performance-system`
          : null;

  const toggleSubmenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const transformItem = (item: NavItem) => {
    let displayName = item.LABEL === "Schedule" ? "Calendar" : item.LABEL;
    if (orgType === "corporate") {
      if (item.LABEL === "Student Database")
        displayName = `${learnerTerm} Database`;
      if (item.LABEL === "Sections" || item.LABEL === "My Sections")
        displayName = "Program";
    }
    return { displayName };
  };

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const isOpen = openMenus.includes(item.LABEL);
    const { displayName } = transformItem(item);
    const path = item.PATH
      ? role !== "SUPERADMIN" && code && item.PATH.includes(":code")
        ? item.PATH.replace(":code", code)
        : item.PATH
      : "#";

    if (item.SUBMENU && !item.PATH) {
      return (
        <div key={item.LABEL}>
          <button
            onClick={() => toggleSubmenu(item.LABEL)}
            className={
              isMobile
                ? "py-4 text-lg font-medium border-b border-gray-100 transition-colors duration-200 ease-in-out text-gray-600 w-full text-left"
                : "inline-flex items-center px-4 py-3 font-medium text-gray-500 hover:text-gray-700 transition-all w-full text-left"
            }
          >
            <span>{displayName}</span>
            <span className="ml-auto">
              {isOpen ? (
                <MdKeyboardArrowDown className="text-[20px]" />
              ) : (
                <MdKeyboardArrowRight className="text-[20px]" />
              )}
            </span>
          </button>
          {isOpen && (
            <div
              className={
                isMobile ? "ml-4" : "ml-6 px-4 border-l-2 border-gray-200"
              }
            >
              {item.SUBMENU.map((subItem) => renderNavItem(subItem, isMobile))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={path}
        key={path}
        className={({ isActive }) =>
          isMobile
            ? `py-4 text-lg font-medium border-b border-gray-100 transition-colors duration-200 ease-in-out ${
                isActive ? `text-primary` : `text-gray-600 hover:text-primary`
              }`
            : `inline-flex items-center px-4 py-3 font-medium border-b-[3px] ${
                isActive
                  ? `border-primary text-primary`
                  : `border-transparent text-gray-500 hover:text-gray-700 hover:border-primary transition-all`
              }`
        }
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span className={isMobile ? "text-lg" : "text-base"}>
          {displayName}
        </span>
      </NavLink>
    );
  };

  const navigateToHome = () => {
    const homePath =
      (role &&
        BASE_NAVIGATION[role]
          ?.find((item) => item.LABEL === "Dashboard")
          ?.PATH?.replace(":code", code || "")) ||
      "/";
    navigate(homePath);
    setIsMobileMenuOpen(false);
    setIsLogoMenuOpen(false);
  };

  const navigateToPerformance = () => {
    if (!performancePath) return;
    navigate(performancePath);
    setIsMobileMenuOpen(false);
    setIsLogoMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (!performancePath) {
      navigateToHome();
      return;
    }
    setIsLogoMenuOpen((prev) => !prev);
  };

  const navigateToProfile = () => {
    navigate(`${location.pathname.split("/").slice(0, 3).join("/")}/profile`);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
      setIsMobileMenuOpen(false);
      setIsLogoMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        logoMenuRef.current &&
        !logoMenuRef.current.contains(event.target as Node)
      ) {
        setIsLogoMenuOpen(false);
      }
    };

    if (isLogoMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLogoMenuOpen]);

  const navigationItems: NavItem[] = role
    ? BASE_NAVIGATION[role]
        .map((item: NavItem) => {
          if (orgType !== "corporate" || !item.SUBMENU) {
            if (!item.SUBMENU) {
              return item;
            }

            const schoolSubmenu = item.SUBMENU.filter(
              (subItem: NavItem) =>
                subItem.LABEL !== "Department" &&
                subItem.LABEL !== "Batch" &&
                subItem.LABEL !== "Skill and Role" &&
                subItem.LABEL !== "Training Needs" &&
                subItem.LABEL !== "TNA Deployment"
            );

            if (schoolSubmenu.length === 0 && !item.PATH) {
              return null;
            }

            return { ...item, SUBMENU: schoolSubmenu };
          }

          const filteredSubmenu = item.SUBMENU.filter(
            (subItem: NavItem) =>
              subItem.LABEL !== "Category" && subItem.LABEL !== "Faculty"
          );

          if (filteredSubmenu.length === 0 && !item.PATH) {
            return null;
          }

          return { ...item, SUBMENU: filteredSubmenu };
        })
        .filter((item): item is NavItem => item !== null)
    : [];

  return (
    <>
      <nav className="bg-white border-b-[1px] border-gray-200 relative z-50">
        <div className="max-w-8xl mx-auto flex justify-between items-center px-2 md:px-8 h-[50px]">
          {/* Left side */}
          <div className="flex items-center gap-2 sm:gap-[5vw] md:gap-[10vw]">
            <div ref={logoMenuRef} className="flex-shrink-0 flex items-center relative">
              <button
                onClick={handleLogoClick}
                className="focus:outline-none"
                aria-label="Open logo menu"
              >
                {role === "SUPERADMIN" ? (
                  <FaGraduationCap
                    className="h-10 w-10 cursor-pointer hover:scale-105 transition-transform text-primary"
                  />
                ) : (
                  <img
                    src={currentUser.user.organization.branding.logo}
                    alt="Organization Logo"
                    className="h-10 w-10 cursor-pointer hover:scale-105 transition-transform rounded-full"
                  />
                )}
              </button>
              {isLogoMenuOpen && performancePath && (
                <div className="absolute top-12 left-0 min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={navigateToPerformance}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Performance Management
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:space-x-4">
              {navigationItems.map((item) => renderNavItem(item, false))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-6">
            <div className="relative md:px-0">
              <button
                ref={notificationButtonRef}
                className="text-gray-500 hover:text-gray-700 relative"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              >
                <FaRegBell className="h-5 w-5 mt-2" />
                {data?.count > 0 && (
                  <span className={`${data?.count > 9 ? "text-[10px]" : "text-xs"} absolute top-0 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center`}>
                    {data?.count > 9 ? "9+" : data?.count}
                  </span>
                )}
              </button>
              <NotificationMenu
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notificationButtonRef={notificationButtonRef}
              />
            </div>
            <div className="hidden md:block">
              <AvatarDropdown />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-500 hover:text-gray-700 relative z-50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <IoClose className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-[50px] inset-x-0 bottom-0 bg-white z-40 h-[calc(100vh-50px)]">
            <div className="flex flex-col h-full px-8 pt-6 max-w-md mx-auto w-full">
              {role &&
                navigationItems.map((item) => renderNavItem(item, true))}

              {/* User Profile and Logout Section */}
              <div className="mt-auto border-t">
                <div className="py-4 border-b">
                  <button
                    className="flex items-center gap-4"
                    onClick={navigateToProfile}
                  >
                    {currentUser.user.avatar ? (
                      <img
                        src={currentUser.user.avatar}
                        alt="Profile"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {`${
                            currentUser.user.firstname?.[0]?.toUpperCase() || ""
                          }${
                            currentUser.user.lastname?.[0]?.toUpperCase() || ""
                          }`}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-left">
                        {currentUser.user.firstname} {currentUser.user.lastname}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentUser.user.email}
                      </p>
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-lg font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg mt-4 mb-6"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {isMobileMenuOpen && (
        <div
          className="md:hidden absolute inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
