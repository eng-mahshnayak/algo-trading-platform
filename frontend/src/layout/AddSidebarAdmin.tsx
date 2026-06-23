import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { Settings } from "lucide-react";


import {
  LayoutDashboard,

  BarChart2,


  History,
  Users as UsersIcon,
  TrendingUp,
  Activity,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

type Role = "admin" | "user";

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  roles?: Role[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: Role[];
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    name: "Overview",
    path: "/admin/deshboard",
    roles: ["admin", "user"],
  },
  {
    icon: <Activity size={20} />,
    name: "Active Positions",
    path: "/admin/order",
    roles: ["admin", "user"],
  },
  {
    icon: <TrendingUp size={20} />,
    name: "Portfolio Holdings",
    path: "/admin/holding/order",
    roles: ["admin", "user"],
  },
  {
    icon: <BarChart2 size={20} />,
    name: "Instrument Library",
    path: "/admin/instrument",
    roles: ["admin", "user"],
  },
  {
    icon: <History size={20} />,
    name: "Trade History",
    path: "/admin/trades",
    roles: ["admin", "user"],
  },
  {
    icon: <UsersIcon size={20} />,
    name: "User Management",
    roles: ["admin", "user"],
    subItems: [
      {
        name: "All Users",
        path: "/admin/usertable",
        roles: ["admin", "user"],
      },
      {
        name: "Dummy User",
        path: "/admin/user-clone",
        roles: ["admin"],
      },
      {
        name: "Active Sessions",
        path: "/admin/user-session",
        roles: ["admin"],
      },
     
      {
        name: "PnL Analysis",
        path: "/admin/check/userpnl",
        roles: ["admin"],
      },
    ],
  },
  {
    icon: <Settings size={20} />,
    name: "System Configuration",
    roles: ["admin", "user"],
    subItems: [
      {
        name: "Broker Integration",
        path: "/admin/broker",
        roles: ["admin", "user"],
      },
      {
        name: "Group Assignment",
        path: "/admin/strategy",
        roles: ["admin"],
      },
     
    ],
  },
  {
    icon: <UserCheck size={20} />,
    name: "Position Tracker",
    path: "/admin/cehckuserposition",
    roles: ["admin", "user"],
  },
  {
    icon: <AlertCircle size={20} />,
    name: "Rejected Orders",
    path: "/admin/rejected/history",
    roles: ["admin", "user"],
  },
 
];

const othersItems: NavItem[] = [];

const filterNavItems = (items: NavItem[], role: Role): NavItem[] => {
  return items
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
      const subItems = item.subItems?.filter(
        (sub) => !sub.roles || sub.roles.includes(role)
      );
      return { ...item, subItems };
    })
    .filter((item) => item.path || (item.subItems && item.subItems.length > 0));
};

const AddAppSidebarAdmin: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [userRole, setUserRole] = useState<Role>("user");

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.role === "admin" || parsedUser?.role === "user") {
          setUserRole(parsedUser.role);
        }
      } catch {
        console.error("Invalid user data in localStorage");
      }
    }
  }, []);

  const filteredNavItems = filterNavItems(navItems, userRole);
  const filteredOthersItems = filterNavItems(othersItems, userRole);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const isOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className="w-full text-left"
                >
                  <div
                    className={`menu-item group ${
                      isOpen ? "menu-item-active" : "menu-item-inactive"
                    } cursor-pointer ${
                      !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "lg:justify-start"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        isOpen
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <ChevronDownIcon
                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-brand-500" : ""
                        }`}
                      />
                    )}
                  </div>
                </button>

                {(isExpanded || isHovered || isMobileOpen) && isOpen && (
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          onClick={() => {
                            setOpenSubmenu(null);
                          }}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 px-5 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[270px]"
            : isHovered
            ? "w-[270px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/admin/deshboard">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-[#FB3800] to-orange-500 bg-clip-text text-transparent">
                AI Trading
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FB3800] to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav>
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Main Navigation"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>

            {filteredOthersItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Additional Tools"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(filteredOthersItems, "others")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AddAppSidebarAdmin;