import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { UserIcon } from "@/components/ui/user-icon";
import { SettingsIcon } from "@/components/ui/settings-icon";
import { LogoutIcon } from "@/components/ui/logout-icon";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { BASE_NAVIGATION } from "../../config/common";
import { getTerm } from "../../lib/utils";
import { motion as m, AnimatePresence } from "framer-motion";

interface NavItem {
  LABEL: string;
  PATH?: string;
  ICON?: React.ComponentType;
  SUBMENU?: NavItem[];
}

interface SideNavigationProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function SideNavigation({
  isCollapsed,
  setIsCollapsed,
}: SideNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = currentUser?.user.role?.toUpperCase() as
    | keyof typeof BASE_NAVIGATION
    | undefined;
  const code =
    role !== "SUPERADMIN" ? currentUser?.user.organization.code : undefined;
  const orgType =
    role !== "SUPERADMIN" ? currentUser?.user.organization.type : undefined;

  const learnerTerm = orgType ? getTerm("learner", orgType) : "Student";
  const groupTerm = orgType ? getTerm("group", orgType) : "Section";

  const toggleSubmenu = (label: string) => {
    if (!isCollapsed || isMobileMenuOpen) {
      setOpenMenus((prev) =>
        prev.includes(label)
          ? prev.filter((item) => item !== label)
          : [...prev, label]
      );
    }
  };

  const transformItem = (item: NavItem) => {
    let displayName = item.LABEL;
    if (orgType === "corporate") {
      if (item.LABEL === "Student")
        displayName = learnerTerm;
      if (item.LABEL === "Student Database")
        displayName = `${learnerTerm} Database`;
      if (item.LABEL === "Sections" || item.LABEL === "My Sections")
        displayName = `${groupTerm}s`;
    }
    return { displayName };
  };

  const renderNavItem = (item: NavItem, isSubmenu = false) => {
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
            className={`flex items-center gap-3 hover:gap-4 px-4 py-2 text-base rounded-lg transition-all w-full text-left text-gray-600 hover:bg-gray-100 ${
              isCollapsed && !isMobileMenuOpen ? "justify-center" : ""
            }`}
          >
            {item.ICON && !isSubmenu && (
              <span className="text-[20px] text-gray-600">
                <item.ICON />
              </span>
            )}
            <AnimatePresence>
              {(!isCollapsed || isMobileMenuOpen) && (
                <m.span
                  className="font-medium"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {displayName}
                </m.span>
              )}
            </AnimatePresence>
            {(!isCollapsed || isMobileMenuOpen) && (
              <span className="ml-auto">
                {isOpen ? (
                  <MdKeyboardArrowDown className="text-[20px]" />
                ) : (
                  <MdKeyboardArrowRight className="text-[20px]" />
                )}
              </span>
            )}
          </button>
          <AnimatePresence>
            {isOpen && (!isCollapsed || isMobileMenuOpen) && (
              <m.div
                className="ml-6 px-4 border-l-2 border-gray-200"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {item.SUBMENU.map((subItem) => renderNavItem(subItem, true))}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <NavLink
        to={path}
        key={path}
        className={({ isActive }) =>
          `flex items-center gap-3 hover:gap-4 px-4 py-2 text-base rounded-lg transition-all ${
            isActive ? "bg-gray-100 gap-4" : "text-gray-600 hover:bg-gray-100"
          } ${isSubmenu && (!isCollapsed || isMobileMenuOpen) ? "pl-4" : ""} ${
            isCollapsed && !isMobileMenuOpen ? "justify-center" : ""
          }`
        }
        end
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {({ isActive }) => (
          <>
            {item.ICON && !isSubmenu && (
              <span
                className={`text-[20px] ${
                  isActive ? "text-primary" : "text-gray-600"
                }`}
              >
                <item.ICON />
              </span>
            )}
            <AnimatePresence>
              {(!isCollapsed || isMobileMenuOpen) && (
                <m.span
                  className={`font-semibold ${
                    isActive ? "text-primary" : "text-gray-600"
                  }`}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {displayName}
                </m.span>
              )}
            </AnimatePresence>
          </>
        )}
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
  };

  const navigateToProfile = () => {
    if (role === "SUPERADMIN") return;
    navigate(`${location.pathname.split("/").slice(0, 3).join("/")}/profile`);
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
  };

  const navigateToSettings = () => {
    if (role === "SUPERADMIN") return;
    navigate(`${location.pathname.split("/").slice(0, 3).join("/")}/settings`);
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
      setIsMobileMenuOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <button
        className={`lg:hidden fixed top-4 left-4 z-50 ${
          isMobileMenuOpen
            ? "hover:text-gray-600"
            : "text-white hover:text-gray-200"
        }`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <IoClose className="h-8 w-8 rounded bg-white border-2 border-primary text-primary" />
        ) : (
          <FaBars className="h-8 w-8 p-1 rounded bg-white bg-opacity-80 border-2 border-primary text-primary" />
        )}
      </button>

      <m.nav
        className={`bg-white border-r border-gray-200 fixed h-full left-0 z-40 flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        animate={{ width: isCollapsed && !isMobileMenuOpen ? 80 : 250 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="relative bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent_90%)] flex flex-col items-center justify-center py-6 px-4">
          <button
            className="absolute top-48 -right-5 bg-white rounded-full border hidden lg:block text-gray-600 hover:text-primary"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <MdChevronRight className="size-8" />
            ) : (
              <MdChevronLeft className="size-8" />
            )}
          </button>
          <div>
            {role === "SUPERADMIN" ||
            !currentUser.user.organization.branding?.logo ? (
              <img
                src="https://res.cloudinary.com/dyal0wstg/image/upload/v1751936802/alma_new_circle_idxrmk.png"
                onClick={navigateToHome}
                className={`${
                  isCollapsed ? "size-10" : "size-24"
                } text-primary cursor-pointer rounded-full`}
                alt="Logo"
              />
            ) : (
              <div
                className={`p-1 rounded-full hover:scale-105 transition-transform shadow-lg ${
                  role === "SUPERADMIN"
                    ? ""
                    : "bg-gradient-to-br from-primary to-secondary"
                }`}
              >
                <img
                  src={currentUser.user.organization.branding.logo}
                  onClick={navigateToHome}
                  alt="Organization Logo"
                  className={`cursor-pointer object-cover rounded-full ${
                    isCollapsed && !isMobileMenuOpen ? "h-10 w-10" : "h-24 w-24"
                  }`}
                />
              </div>
            )}
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobileMenuOpen) && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {currentUser.user.organization ? (
                  <>
                    <h1 className="font-bold text-xl mt-2 text-gray-800 text-center">
                      {currentUser.user.organization?.name}
                    </h1>
                    <p className="bg-gray-100 rounded-full w-fit mx-auto px-2 py-1 text-xs text-center">
                      {currentUser.user.organization?.code}
                    </p>
                  </>
                ) : (<>
                <h1 className="font-bold text-xl text-primary text-center">
                      ALMA
                    </h1>
                </>)}
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 px-2 py-2 space-y-1">
          {role &&
            BASE_NAVIGATION[role]
              .filter((item: NavItem) => {
                if (orgType === "corporate") {
                  return item.LABEL !== "Faculty" && item.LABEL !== "Program";
                }
                return true;
              })
              .map((item: NavItem) => (
                <div key={item.PATH || item.LABEL}>{renderNavItem(item)}</div>
              ))}
        </div>

        <div className="border-t border-gray-200 relative">
          <div
            className={`flex items-center gap-3 w-full text-gray-600 hover:bg-gray-100 p-3 rounded-lg cursor-pointer ${
              isCollapsed && !isMobileMenuOpen ? "justify-center" : ""
            }`}
            onClick={() => {
              isCollapsed ? setIsCollapsed(false) : setIsMenuOpen(!isMenuOpen);
            }}
          >
            {currentUser.user.avatar ? (
              <img
                src={currentUser.user.avatar}
                alt="Profile"
                className={`object-cover rounded-full ${
                  isCollapsed && !isMobileMenuOpen ? "h-8 w-8" : "h-10 w-10"
                }`}
              />
            ) : (
              <div
                className={`rounded-full bg-gray-200 flex items-center justify-center text-gray-600 ${
                  isCollapsed && !isMobileMenuOpen
                    ? "h-8 w-8 text-sm"
                    : "h-10 w-10"
                }`}
              >
                {`${currentUser.user.firstname?.[0]?.toUpperCase() || ""}${
                  currentUser.user.lastname?.[0]?.toUpperCase() || ""
                }`}
              </div>
            )}
            <AnimatePresence>
              {(!isCollapsed || isMobileMenuOpen) && (
                <m.div
                  className="text-left flex-1"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm font-medium">
                    {currentUser.user.firstname} {currentUser.user.lastname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentUser.user.role}
                  </p>
                </m.div>
              )}
            </AnimatePresence>
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="text-gray-500 hover:text-primary p-2"
              >
                <IoEllipsisVerticalSharp className="h-5 w-5" />
              </button>
            )}
          </div>
          <AnimatePresence>
            {isMenuOpen && (!isCollapsed || isMobileMenuOpen) && (
              <m.div
                ref={menuRef}
                className="absolute bottom-full left-0 ml-[14px] w-[220px] bg-white border rounded-md border-gray-200 shadow-lg"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: "top right" }}
              >
                {role !== "SUPERADMIN" && (
                  <button
                    onClick={navigateToProfile}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <UserIcon size={16} />
                    Profile
                  </button>
                )}
                {role !== "SUPERADMIN" && (
                  <button
                    onClick={navigateToSettings}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <SettingsIcon size={16} />
                    Settings
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogoutIcon size={16} />
                  Logout
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.nav>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
