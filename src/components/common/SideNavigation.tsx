import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { UserIcon } from "@/components/ui/user-icon";
import { SettingsIcon } from "@/components/ui/settings-icon";
import { LogoutIcon } from "@/components/ui/logout-icon";
import { PanelLeft } from "@/components/ui/panel-left";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { BASE_NAVIGATION } from "../../config/common";
import { getTerm } from "../../lib/utils";
import { motion as m, AnimatePresence } from "framer-motion";

interface NavItem {
  LABEL: string;
  PATH?: string;
  ICON?: React.ComponentType<{ size?: number }>;
  SUBMENU?: NavItem[];
}

interface SideNavigationProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

// ── Animated icon wrapper ──────────────────────────────────────────────────
interface AnimIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

const FORWARD_REF_SYMBOL = Symbol.for("react.forward_ref");
const MEMO_SYMBOL = Symbol.for("react.memo");

const isAnimatedIconRefCompatible = (
  Icon: React.ComponentType<{ size?: number }>,
): Icon is React.ForwardRefExoticComponent<
  { size?: number } & React.RefAttributes<AnimIconHandle>
> => {
  const maybeIcon = Icon as unknown as {
    $$typeof?: symbol;
    type?: { $$typeof?: symbol };
  };

  return (
    maybeIcon.$$typeof === FORWARD_REF_SYMBOL ||
    (maybeIcon.$$typeof === MEMO_SYMBOL &&
      maybeIcon.type?.$$typeof === FORWARD_REF_SYMBOL)
  );
};

function AnimatedNavIcon({
  Icon,
  isHovered,
  isActive = false,
  size = 20,
}: {
  Icon: React.ComponentType<{ size?: number }>;
  isHovered: boolean;
  isActive?: boolean;
  size?: number;
}) {
  const iconRef = useRef<AnimIconHandle>(null);
  const isRefCompatible = isAnimatedIconRefCompatible(Icon);

  useEffect(() => {
    if (!isRefCompatible) return;
    if (isHovered) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [isHovered, isRefCompatible]);

  const IconWithRef = Icon as React.ForwardRefExoticComponent<
    { size?: number } & React.RefAttributes<AnimIconHandle>
  >;

  return (
    <span
      className={`shrink-0 transition-colors ${isActive ? "text-primary" : "text-gray-500"}`}
    >
      {isRefCompatible ? (
        <IconWithRef ref={iconRef} size={size} />
      ) : (
        <Icon size={size} />
      )}
    </span>
  );
}

// ── NavLink item (leaf node) ───────────────────────────────────────────────
function NavLinkItem({
  item,
  path,
  displayName,
  isSubmenu,
  isCollapsed,
  isMobileMenuOpen,
  onClose,
}: {
  item: NavItem;
  path: string;
  displayName: string;
  isSubmenu: boolean;
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
  onClose: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 text-base rounded-lg transition-all ${
          isActive
            ? "bg-gray-100 gap-4"
            : "text-gray-600 hover:bg-gray-100 hover:gap-4"
        } ${isSubmenu && (!isCollapsed || isMobileMenuOpen) ? "pl-4" : ""} ${
          isCollapsed && !isMobileMenuOpen ? "justify-center" : ""
        }`
      }
      end
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClose}
    >
      {({ isActive }) => (
        <>
          {item.ICON && !isSubmenu && (
            <AnimatedNavIcon
              Icon={item.ICON}
              isHovered={isHovered}
              isActive={isActive}
            />
          )}
          <AnimatePresence>
            {(!isCollapsed || isMobileMenuOpen) && (
              <m.span
                className={`font-semibold ${isActive ? "text-primary" : "text-gray-600"}`}
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
}

// ── Submenu parent button ──────────────────────────────────────────────────
function NavMenuButton({
  item,
  displayName,
  isOpen,
  isCollapsed,
  isMobileMenuOpen,
  onToggle,
  children,
}: {
  item: NavItem;
  displayName: string;
  isOpen: boolean;
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div>
      <button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-3 px-4 py-2 text-base rounded-lg transition-all w-full text-left text-gray-600 hover:bg-gray-100 hover:gap-4 ${
          isCollapsed && !isMobileMenuOpen ? "justify-center" : ""
        }`}
      >
        {item.ICON && (
          <AnimatedNavIcon Icon={item.ICON} isHovered={isHovered} />
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
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  const logoMenuRef = useRef<HTMLDivElement>(null);

  const role = currentUser?.user.role?.toUpperCase() as
    | keyof typeof BASE_NAVIGATION
    | undefined;
  const code =
    role !== "SUPERADMIN" ? currentUser?.user.organization.code : undefined;
  const orgType =
    role !== "SUPERADMIN" ? currentUser?.user.organization.type : undefined;

  const learnerTerm = orgType ? getTerm("learner", orgType) : "Student";
  const groupTermPlural = orgType
    ? getTerm("group", orgType, true)
    : "Sections";

  const toggleSubmenu = (label: string) => {
    if (!isCollapsed || isMobileMenuOpen) {
      setOpenMenus((prev) =>
        prev.includes(label)
          ? prev.filter((item) => item !== label)
          : [...prev, label],
      );
    }
  };

  const transformItem = (item: NavItem) => {
    let displayName = item.LABEL;
    if (orgType === "corporate") {
      if (item.LABEL === "Student") displayName = learnerTerm;
      if (item.LABEL === "Student Database")
        displayName = `${learnerTerm} Database`;
      if (item.LABEL === "Sections" || item.LABEL === "My Sections")
        displayName = groupTermPlural;
    }
    return { displayName };
  };

  const renderNavItem = useCallback(
    (item: NavItem, isSubmenu = false) => {
      const isOpen = openMenus.includes(item.LABEL);
      const { displayName } = transformItem(item);
      const path = item.PATH
        ? role !== "SUPERADMIN" && code && item.PATH.includes(":code")
          ? item.PATH.replace(":code", code)
          : item.PATH
        : "#";

      if (item.SUBMENU && !item.PATH) {
        return (
          <NavMenuButton
            key={item.LABEL}
            item={item}
            displayName={displayName}
            isOpen={isOpen}
            isCollapsed={isCollapsed}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggle={() => toggleSubmenu(item.LABEL)}
          >
            {item.SUBMENU.map((subItem) => renderNavItem(subItem, true))}
          </NavMenuButton>
        );
      }

      return (
        <NavLinkItem
          key={path}
          item={item}
          path={path}
          displayName={displayName}
          isSubmenu={isSubmenu}
          isCollapsed={isCollapsed}
          isMobileMenuOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [openMenus, isCollapsed, isMobileMenuOpen, role, code, orgType],
  );

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

  const handleLogoClick = () => {
    navigateToHome();
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
                subItem.LABEL !== "TNA Execution",
            );

            if (schoolSubmenu.length === 0 && !item.PATH) {
              return null;
            }

            return { ...item, SUBMENU: schoolSubmenu };
          }

          const filteredSubmenu = item.SUBMENU.filter(
            (subItem: NavItem) =>
              subItem.LABEL !== "Category" && subItem.LABEL !== "Faculty",
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
      <button
        className={`lg:hidden fixed top-6 left-4 z-50 ${
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
        className={`fixed left-2 top-2 z-40 flex h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.4)] backdrop-blur sm:left-3 sm:top-3 sm:h-[calc(100vh-1.5rem)] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        animate={{ width: isCollapsed && !isMobileMenuOpen ? 80 : 250 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div
          className={`relative border-b border-gray-200 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent_90%)] px-3 pr-12 ${
            isCollapsed && !isMobileMenuOpen ? "min-h-[48px] py-2" : "py-4"
          }`}
        >
          <button
            className={`absolute z-20 hidden size-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-[0_8px_16px_-10px_rgba(15,23,42,0.45)] transition-colors hover:border-primary/40 hover:text-primary lg:flex ${
              isCollapsed && !isMobileMenuOpen
                ? "left-1/2 top-2 -translate-x-1/2"
                : "right-2 top-1/2 -translate-y-1/2"
            }`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft
              animateOnHover
              size={18}
              className={`transition-transform duration-200 ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
          {(!isCollapsed || isMobileMenuOpen) && (
            <div ref={logoMenuRef} className="relative">
              <button
                onClick={handleLogoClick}
                className="flex w-full items-center gap-3 text-left focus:outline-none"
                aria-label="Open logo menu"
              >
                {role === "SUPERADMIN" ||
                !currentUser.user.organization.branding?.logo ? (
                  <img
                    src="https://res.cloudinary.com/dyal0wstg/image/upload/v1751936802/alma_new_circle_idxrmk.png"
                    className="size-10 text-primary cursor-pointer rounded-lg border border-slate-200 bg-white object-cover"
                    alt="Logo"
                  />
                ) : (
                  <img
                    src={currentUser.user.organization.branding.logo}
                    alt="Organization Logo"
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white object-cover h-10 w-10"
                  />
                )}
                <AnimatePresence>
                  <m.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-0 flex-1 overflow-hidden"
                  >
                    {currentUser.user.organization ? (
                      <p className="text-sm font-semibold leading-tight text-gray-800">
                        {currentUser.user.organization?.name}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-primary">ALMA</p>
                    )}
                  </m.div>
                </AnimatePresence>
              </button>
            </div>
          )}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-1 pr-1">
            {navigationItems.map((item: NavItem) => (
              <div key={item.PATH || item.LABEL}>{renderNavItem(item)}</div>
            ))}
          </div>
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
