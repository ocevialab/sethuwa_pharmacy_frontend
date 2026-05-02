/**
 * Menu Permission Mapping
 * Maps menu routes to permission patterns
 */

export interface MenuPermissionMapping {
  path: string;
  permissionPatterns: string[];
  module: string;
}

/**
 * Maps menu routes to permission patterns
 * Each route can have multiple permission patterns that grant access
 */
export const menuPermissionMap: MenuPermissionMapping[] = [
  // Dashboard - usually available to all authenticated users
  {
    path: "/",
    permissionPatterns: ["*"], // Allow all authenticated users
    module: "dashboard",
  },

  // Inventory
  {
    path: "/inventory/list",
    permissionPatterns: ["inventory:*", "inventory:view*", "inventory:get*"],
    module: "Inventory",
  },

  // Stock
  {
    path: "/stock/list",
    permissionPatterns: ["stock:*", "stock:view*", "stock:get*"],
    module: "Stock",
  },

  // Medicine
  {
    path: "/medicine/list",
    permissionPatterns: [
      "medicine:*",
      "medicine:view*",
      "medicine:get*",
      "medicine:list",
    ],
    module: "Medicine",
  },
  {
    path: "/medicine/create",
    permissionPatterns: ["medicine:create*", "medicine:add*"],
    module: "Medicine",
  },
  {
    path: "/medicine/restore",
    permissionPatterns: [
      "medicine:*",
      "medicine:restore*",
      "medicine:view_deleted*",
    ],
    module: "Medicine",
  },

  // Glossary
  {
    path: "/glossary/list",
    permissionPatterns: ["glossary:*", "glossary:view*", "glossary:get*"],
    module: "Glossary",
  },
  {
    path: "/glossary/create",
    permissionPatterns: ["glossary:create*", "glossary:add*"],
    module: "Glossary",
  },
  {
    path: "/glossary/restore",
    permissionPatterns: [
      "glossary:*",
      "glossary:restore*",
      "glossary:view_deleted*",
    ],
    module: "Glossary",
  },

  // Customers
  {
    path: "/customers/list",
    permissionPatterns: [
      "customer:*",
      "customer:view*",
      "customer:get*",
      "customer:list",
    ],
    module: "Customer",
  },
  {
    path: "/customers/create",
    permissionPatterns: ["customer:create*", "customer:add*"],
    module: "Customer",
  },
  {
    path: "/customers/restore",
    permissionPatterns: [
      "customer:*",
      "customer:restore*",
      "customer:view_deleted*",
    ],
    module: "Customer",
  },

  // Employees
  {
    path: "/employees/list",
    permissionPatterns: [
      "employee:*",
      "employee:view*",
      "employee:get*",
      "employee:list",
    ],
    module: "Employee",
  },
  {
    path: "/employees/create",
    permissionPatterns: ["employee:create*", "employee:add*", "employee:view*"],
    module: "Employee",
  },
  {
    path: "/employees/permissions/edit",
    permissionPatterns: [
      "employee:*",
      "employee:update*",
      "employee:edit*",
      "employee:permission*",
    ],
    module: "Employee",
  },

  // Finance
  {
    path: "/finance",
    permissionPatterns: ["finance:*", "finance:view*", "finance:get*"],
    module: "Finance",
  },

  // Purchasing
  {
    path: "/purchasing/list",
    permissionPatterns: [
      "purchasing:*",
      "purchasing:view*",
      "purchasing:get*",
      "purchasing:list",
    ],
    module: "Purchasing",
  },
  {
    path: "/purchasing/create",
    permissionPatterns: ["purchasing:create*", "purchasing:add*"],
    module: "Purchasing",
  },

  // Sales
  {
    path: "/sales/list",
    permissionPatterns: [
      "sales:*",
      "sales:view*",
      "sales:get*",
      "sales:list",
      "sales:view_list",
    ],
    module: "Sales",
  },
  {
    path: "/sales/create",
    permissionPatterns: ["sales:create*", "sales:add*", "sales:create_receipt"],
    module: "Sales",
  },
  {
    path: "/sales/paylater",
    permissionPatterns: [
      "sales:*",
      "sales:paylater*",
      "sales:view_paylater*",
      "sales:pay_later*",
      "sales:view_paylater_list",
    ],
    module: "Sales",
  },

  // Suppliers
  {
    path: "/supplier/list",
    permissionPatterns: [
      "supplier:*",
      "supplier:view*",
      "supplier:get*",
      "supplier:list",
    ],
    module: "Supplier",
  },
  {
    path: "/supplier/create",
    permissionPatterns: ["supplier:create*", "supplier:add*"],
    module: "Supplier",
  },
  {
    path: "/supplier/purchasing",
    permissionPatterns: [
      "supplier:*",
      "supplier:purchasing*",
      "supplier:view_purchasing*",
    ],
    module: "Supplier",
  },
];

/**
 * Check if a user has permission to access a route
 */
export function hasPermissionForRoute(
  userPermissions: string[],
  routePath: string
): boolean {
  // Dashboard is accessible to all authenticated users
  if (routePath === "/" || routePath === "#") {
    return true;
  }

  const mapping = menuPermissionMap.find((m) => m.path === routePath);
  if (!mapping) {
    // If no mapping found, deny access by default (strict permission model)
    return false;
  }

  // Check if user has any of the required permission patterns
  return mapping.permissionPatterns.some((pattern) => {
    if (pattern === "*") return true;

    // Check exact match
    if (userPermissions.includes(pattern)) return true;

    // Check prefix match (e.g., "sales:create*" matches "sales:create_receipt")
    // or module wildcard (e.g., "medicine:*" matches any "medicine:..." permission)
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      return userPermissions.some((perm) => perm.startsWith(prefix));
    }

    // Check if permission starts with the pattern
    return userPermissions.some((perm) => perm.startsWith(pattern));
  });
}

/**
 * Get all permissions for a module
 */
export function getModulePermissions(
  userPermissions: string[],
  module: string
): string[] {
  const moduleLower = module.toLowerCase();
  return userPermissions.filter((perm) =>
    perm.toLowerCase().startsWith(moduleLower + ":")
  );
}

/**
 * Check if user has any permission for a module
 */
export function hasAnyModulePermission(
  userPermissions: string[],
  module: string
): boolean {
  return getModulePermissions(userPermissions, module).length > 0;
}
