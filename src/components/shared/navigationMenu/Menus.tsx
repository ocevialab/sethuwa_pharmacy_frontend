import React, { Fragment, useEffect, useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { menuList } from "@/utils/fackData/menuList";
import getIcon from "@/utils/getIcon";
import { tokenManager } from "@/utils/tokenManager";
import { permissionService } from "@/services/permissionService";
import {
  hasPermissionForRoute,
  hasAnyModulePermission,
} from "@/utils/menuPermissions";

// Module mapping for menu sections
const menuModuleMap: Record<string, string> = {
  dashboards: "dashboard",
  inventory: "Inventory",
  stock: "Stock",
  medicine: "Medicine",
  glossaries: "Groceries",
  customers: "Customer",
  employees: "Employee",
  finance: "Finance",
  purchasing: "Purchasing",
  sales: "Sales",
  suppliers: "Supplier",
};

const Menus = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(null);
  const [activeParent, setActiveParent] = useState("");
  const [activeChild, setActiveChild] = useState("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const pathName = useLocation().pathname;

  const handleMainMenu = (e: React.MouseEvent, name: string) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
    }
  };

  const handleDropdownMenu = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (openSubDropdown === name) {
      setOpenSubDropdown(null);
    } else {
      setOpenSubDropdown(name);
    }
  };

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const user = tokenManager.getUser();

        if (!user?.employeeId) {
          console.warn("[Menus] No employee ID found in user token");
          setUserPermissions([]);
          setLoadingPermissions(false);
          return;
        }

        console.log(
          "[Menus] Fetching permissions for employee:",
          user.employeeId
        );

        // Get permissions using the permission service endpoint
        // This endpoint: /Permission/employee/{employeeId}
        const permissions = await permissionService.getEmployeePermissions(
          user.employeeId
        );

        console.log("[Menus] Permissions API response:", permissions);
        console.log(
          "[Menus] Permissions array type:",
          Array.isArray(permissions)
        );
        console.log(
          "[Menus] Permissions array length:",
          permissions?.length || 0
        );

        // Ensure permissions is an array
        if (!Array.isArray(permissions)) {
          console.error(
            "[Menus] Permissions response is not an array:",
            permissions
          );
          setUserPermissions([]);
          setLoadingPermissions(false);
          return;
        }

        // Get active permission IDs from the permissions array
        const activePermissionIds = permissions
          .filter((p) => {
            // Check if permission object exists and is active
            if (!p) return false;
            // isActive is a boolean, so we just check for truthiness
            return p.isActive === true;
          })
          .map((p) => p?.permissionId)
          .filter((id) => id && typeof id === "string"); // Filter out invalid IDs

        console.log("[Menus] Employee permissions processed:", {
          employeeId: user.employeeId,
          totalPermissions: permissions.length,
          activePermissions: activePermissionIds.length,
          permissionIds: activePermissionIds,
        });

        setUserPermissions(activePermissionIds);
      } catch (error) {
        console.error("[Menus] Failed to fetch user permissions:", error);
        console.error("[Menus] Error details:", {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Set empty array on error (menus will be hidden)
        setUserPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchUserPermissions();
  }, []);

  useEffect(() => {
    if (pathName !== "/") {
      const x = pathName.split("/");
      setActiveParent(x[1]);
      setActiveChild(x[2]);
      setOpenDropdown(x[1]);
      setOpenSubDropdown(x[2]);
    } else {
      setActiveParent("dashboards");
      setOpenDropdown("dashboards");
    }
  }, [pathName]);

  // Filter menu items based on permissions
  const filterMenuItems = () => {
    if (loadingPermissions) {
      // Show at least dashboard while loading
      return menuList.filter(({ name }) => name === "dashboards");
    }

    return menuList.filter(({ name, dropdownMenu }) => {
      // Dashboard is always accessible to all users
      // Individual dashboard components will check permissions internally
      if (name === "dashboards") {
        return true;
      }

      // Special handling for Employee module: only show if user has create or update permissions
      // Hide Employee menu if user only has view permissions or change_password permission
      let hasModuleAccess: boolean;
      if (name === "employees") {
        // Only show Employee menu if user has create or update permissions
        // Check for: create, add, update, edit, permission permissions
        const hasCreateOrUpdatePermission = userPermissions.some((perm) => {
          return (
            perm.startsWith("employee:create") ||
            perm.startsWith("employee:add") ||
            perm.startsWith("employee:update") ||
            perm.startsWith("employee:edit") ||
            perm.startsWith("employee:permission")
          );
        });
        hasModuleAccess = hasCreateOrUpdatePermission;
      } else {
        // For other modules, use standard check
        // For permission checking, use original module name (not display name)
        // "glossaries" should check "Glossary" permissions, not "Groceries"
        let moduleForPermission: string;
        if (name === "glossaries") {
          moduleForPermission = "Glossary"; // Use "Glossary" for permission checks
        } else {
          moduleForPermission = menuModuleMap[name] || name;
        }
        hasModuleAccess = hasAnyModulePermission(
          userPermissions,
          moduleForPermission
        );
      }

      // Debug logging for Sales module
      if (name === "sales") {
        console.log(`[Menus] Checking Sales module access:`, {
          module: menuModuleMap[name] || name,
          userPermissionsCount: userPermissions.length,
          userPermissions,
          hasModuleAccess,
        });
      }

      if (!hasModuleAccess) {
        return false; // Hide entire section if no module access
      }

      // If section has dropdown menu, check if at least one submenu item is accessible
      if (dropdownMenu && dropdownMenu.length > 0) {
        const hasAccessibleSubmenu = dropdownMenu.some((item) =>
          hasPermissionForRoute(userPermissions, item.path)
        );

        // Debug logging for Sales module
        if (name === "sales") {
          console.log(`[Menus] Sales submenu accessibility:`, {
            submenuPaths: dropdownMenu.map((item) => item.path),
            hasAccessibleSubmenu,
            userPermissions,
          });
        }

        return hasAccessibleSubmenu;
      }

      // If section itself has a path, check permission for that path
      return true;
    });
  };

  // Filter submenu items based on permissions
  const filterSubmenuItems = (dropdownMenu: any[]) => {
    if (!dropdownMenu || dropdownMenu.length === 0) return [];

    return dropdownMenu.filter((item) => {
      // Check if user has permission for this route
      if (item.path && item.path !== "#") {
        return hasPermissionForRoute(userPermissions, item.path);
      }

      // If item has subdropdownMenu, check if at least one is accessible
      if (item.subdropdownMenu && item.subdropdownMenu.length > 0) {
        return item.subdropdownMenu.some((subItem: any) =>
          hasPermissionForRoute(userPermissions, subItem.path)
        );
      }

      return true;
    });
  };

  const filteredMenuList = filterMenuItems();

  return (
    <>
      {filteredMenuList.map(({ dropdownMenu, id, name, path, icon }) => {
        const filteredDropdownMenu = filterSubmenuItems(dropdownMenu);

        // Don't render menu item if no accessible submenu items (except for dashboards)
        if (filteredDropdownMenu.length === 0 && name !== "dashboards") {
          return null;
        }

        return (
          <li
            key={id}
            onClick={(e) => handleMainMenu(e, name)}
            className={`nxl-item nxl-hasmenu ${
              activeParent === name ? "active nxl-trigger" : ""
            }`}
          >
            <Link to={path} className="nxl-link text-capitalize">
              <span className="nxl-micon"> {getIcon(icon)} </span>
              <span className="nxl-mtext" style={{ paddingLeft: "2.5px" }}>
                {menuModuleMap[name] || name}
              </span>
              <span className="nxl-arrow fs-16">
                <FiChevronRight />
              </span>
            </Link>
            <ul
              className={`nxl-submenu ${
                openDropdown === name ? "nxl-menu-visible" : "nxl-menu-hidden"
              }`}
            >
              {filteredDropdownMenu.map(
                ({ id, name, path, subdropdownMenu }, dropdownIndex) => {
                  const x = name;
                  const uniqueKey = `${id}-${dropdownIndex}`;

                  // Filter subdropdownMenu items (handle false value)
                  const hasSubdropdown =
                    subdropdownMenu &&
                    Array.isArray(subdropdownMenu) &&
                    subdropdownMenu.length > 0;
                  const filteredSubdropdownMenu = hasSubdropdown
                    ? subdropdownMenu.filter((subItem: any) =>
                        hasPermissionForRoute(userPermissions, subItem.path)
                      )
                    : [];

                  return (
                    <Fragment key={uniqueKey}>
                      {hasSubdropdown && filteredSubdropdownMenu.length > 0 ? (
                        <li
                          className={`nxl-item nxl-hasmenu ${
                            activeChild === name ? "active" : ""
                          }`}
                          onClick={(e) => handleDropdownMenu(e, x)}
                        >
                          <Link
                            to={path}
                            className={`nxl-link text-capitalize`}
                          >
                            <span className="nxl-mtext">{name}</span>
                            <span className="nxl-arrow">
                              <i>
                                {" "}
                                <FiChevronRight />
                              </i>
                            </span>
                          </Link>
                          {filteredSubdropdownMenu.map(
                            ({ id: subId, name, path }, subIndex) => {
                              const subUniqueKey = `${id}-${dropdownIndex}-${subId}-${subIndex}`;
                              return (
                                <ul
                                  key={subUniqueKey}
                                  className={`nxl-submenu ${
                                    openSubDropdown === x
                                      ? "nxl-menu-visible"
                                      : "nxl-menu-hidden "
                                  }`}
                                >
                                  <li
                                    className={`nxl-item ${
                                      pathName === path ? "active" : ""
                                    }`}
                                  >
                                    <Link
                                      className="nxl-link text-capitalize"
                                      to={path}
                                    >
                                      {name}
                                    </Link>
                                  </li>
                                </ul>
                              );
                            }
                          )}
                        </li>
                      ) : (
                        <li
                          className={`nxl-item ${
                            pathName === path ? "active" : ""
                          }`}
                        >
                          <Link className="nxl-link" to={path}>
                            {name}
                          </Link>
                        </li>
                      )}
                    </Fragment>
                  );
                }
              )}
            </ul>
          </li>
        );
      })}
    </>
  );
};

export default Menus;
