/**
 * Permission Matrix
 *
 * This file contains all available permissions organized by module.
 * Each permission includes:
 * - permissionId: Unique identifier for the permission
 * - permissionName: Human-readable name
 * - description: What the permission allows
 * - endpoint: API endpoint associated with the permission
 * - httpMethod: HTTP method used for the endpoint
 */

export interface Permission {
  permissionId: string;
  permissionName: string;
  description: string;
  endpoint: string;
  httpMethod: string;
}

export interface ModulePermissions {
  [module: string]: Permission[];
}

/**
 * Permission Matrix organized by module
 */
export const PERMISSION_MATRIX: ModulePermissions = {
  Customer: [
    {
      permissionId: "customer:create",
      permissionName: "Create Customer",
      description: "Allows creating a new customer",
      endpoint: "/api/Customer",
      httpMethod: "POST",
    },
    {
      permissionId: "customer:delete",
      permissionName: "Delete Customer",
      description: "Allows soft deleting a customer",
      endpoint: "/api/Customer/{id}",
      httpMethod: "DELETE",
    },
    {
      permissionId: "customer:get_by_id",
      permissionName: "View Customer",
      description: "Get customer by ID",
      endpoint: "GET /api/Customer/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "customer:list_all",
      permissionName: "List All Customers",
      description: "Get all customers",
      endpoint: "GET /api/Customer",
      httpMethod: "GET",
    },
    {
      permissionId: "customer:restore",
      permissionName: "Restore Customer",
      description: "Allows restoring a deleted customer",
      endpoint: "/api/Customer/{id}/restore",
      httpMethod: "PUT",
    },
    {
      permissionId: "customer:search",
      permissionName: "Search Customers",
      description: "Allows searching for customers",
      endpoint: "/api/Customer/search",
      httpMethod: "GET",
    },
    {
      permissionId: "customer:update",
      permissionName: "Update Customer",
      description: "Allows updating customer information",
      endpoint: "/api/Customer/{id}",
      httpMethod: "PUT",
    },
    {
      permissionId: "customer:view",
      permissionName: "View Customer",
      description: "Allows viewing customer details",
      endpoint: "/api/Customer/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "customer:view_all",
      permissionName: "View All Customers",
      description: "Allows viewing list of all customers",
      endpoint: "/api/Customer",
      httpMethod: "GET",
    },
  ],

  Employee: [
    {
      permissionId: "employee:change_password",
      permissionName: "Change Employee Password",
      description: "Allows changing employee password",
      endpoint: "/api/Employee/{id}/change-password",
      httpMethod: "PUT",
    },
    {
      permissionId: "employee:create",
      permissionName: "Create Employee",
      description: "Allows creating a new employee",
      endpoint: "/api/Employee",
      httpMethod: "POST",
    },
    {
      permissionId: "employee:delete",
      permissionName: "Delete Employee",
      description: "Allows soft deleting an employee",
      endpoint: "/api/Employee/{id}",
      httpMethod: "DELETE",
    },
    {
      permissionId: "employee:get_by_id",
      permissionName: "View Employee",
      description: "Get employee by ID",
      endpoint: "GET /api/Employee/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "employee:list_all",
      permissionName: "List All Employees",
      description: "Get all employees",
      endpoint: "GET /api/Employee",
      httpMethod: "GET",
    },
    {
      permissionId: "employee:update",
      permissionName: "Update Employee",
      description: "Allows updating employee information",
      endpoint: "/api/Employee/{id}",
      httpMethod: "PUT",
    },
    {
      permissionId: "employee:view",
      permissionName: "View Employee",
      description: "Allows viewing employee details",
      endpoint: "/api/Employee/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "employee:view_all",
      permissionName: "View All Employees",
      description: "Allows viewing list of all employees",
      endpoint: "/api/Employee",
      httpMethod: "GET",
    },
    {
      permissionId: "employee:view_permissions",
      permissionName: "View Employee Permissions",
      description: "Allows viewing permissions assigned to an employee",
      endpoint: "/api/Employee/{id}/permissions",
      httpMethod: "GET",
    },
  ],

  Finance: [
    {
      permissionId: "finance:get_expiry_alerts",
      permissionName: "View Expiry Alerts",
      description: "Get products expiring soon",
      endpoint: "GET /api/Finance/expiry-alerts",
      httpMethod: "GET",
    },
    {
      permissionId: "finance:get_most_selling_items",
      permissionName: "View Most Selling Items",
      description: "Get most selling items by month",
      endpoint: "GET /api/Finance/most-selling-items",
      httpMethod: "GET",
    },
    {
      permissionId: "finance:get_revenue_trend",
      permissionName: "View Revenue Trends",
      description: "Get monthly revenue trends",
      endpoint: "GET /api/Finance/revenue-trend",
      httpMethod: "GET",
    },
    {
      permissionId: "finance:get_summary",
      permissionName: "View Finance Summary",
      description: "Get finance summary",
      endpoint: "GET /api/Finance/summary",
      httpMethod: "GET",
    },
    {
      permissionId: "finance:get_supplier_expenses",
      permissionName: "View Supplier Expenses",
      description: "Get supplier expenses by month",
      endpoint: "GET /api/Finance/supplier-expenses",
      httpMethod: "GET",
    },
    {
      permissionId: "finance:view_reports",
      permissionName: "View Finance Reports",
      description: "Allows viewing financial reports and analytics",
      endpoint: "/api/Finance/*",
      httpMethod: "GET",
    },
  ],

  Glossary: [
    {
      permissionId: "glossary:create",
      permissionName: "Create Groceries",
      description: "Allows creating a new grocery item",
      endpoint: "/api/Glossary",
      httpMethod: "POST",
    },
    {
      permissionId: "glossary:delete",
      permissionName: "Delete Groceries",
      description: "Allows soft deleting a grocery item",
      endpoint: "/api/Glossary/{id}",
      httpMethod: "DELETE",
    },
    {
      permissionId: "glossary:get_by_id",
      permissionName: "View Grocery Item",
      description: "Get grocery item by ID",
      endpoint: "GET /api/Glossary/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "glossary:get_deleted",
      permissionName: "View Deleted Grocery Items",
      description: "Get all deleted grocery items",
      endpoint: "GET /api/Glossary/deleted",
      httpMethod: "GET",
    },
    {
      permissionId: "glossary:list_all",
      permissionName: "List All Grocery Items",
      description: "Get all grocery items with filters",
      endpoint: "GET /api/Glossary",
      httpMethod: "GET",
    },
    {
      permissionId: "glossary:restore",
      permissionName: "Restore Groceries",
      description: "Allows restoring a deleted grocery item",
      endpoint: "/api/Glossary/{id}/restore",
      httpMethod: "PUT",
    },
    {
      permissionId: "glossary:update",
      permissionName: "Update Groceries",
      description: "Allows updating grocery information",
      endpoint: "/api/Glossary/{id}",
      httpMethod: "PUT",
    },
    {
      permissionId: "glossary:view",
      permissionName: "View Groceries",
      description: "Allows viewing grocery details",
      endpoint: "/api/Glossary/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "glossary:view_deleted",
      permissionName: "View Deleted Groceries",
      description: "Allows viewing soft-deleted grocery items",
      endpoint: "/api/Glossary/deleted",
      httpMethod: "GET",
    },
  ],

  Inventory: [
    {
      permissionId: "inventory:get_all_inventory",
      permissionName: "View All Inventory",
      description: "Get all inventory with pagination",
      endpoint: "GET /api/Inventory/all",
      httpMethod: "GET",
    },
    {
      permissionId: "inventory:get_item_details",
      permissionName: "View Item Details",
      description: "Get detailed item information with stock",
      endpoint: "GET /api/Inventory/ItemDetails/{sku}",
      httpMethod: "GET",
    },
    {
      permissionId: "inventory:get_product_list",
      permissionName: "View Product List",
      description: "Get product list with search",
      endpoint: "GET /api/Inventory/list",
      httpMethod: "GET",
    },
    {
      permissionId: "inventory:view_all",
      permissionName: "View All Inventory",
      description: "Allows viewing all inventory items",
      endpoint: "/api/Inventory/all",
      httpMethod: "GET",
    },
    {
      permissionId: "inventory:view_details",
      permissionName: "View Item Details",
      description: "Allows viewing detailed item information including stock",
      endpoint: "/api/Inventory/ItemDetails/{sku}",
      httpMethod: "GET",
    },
    {
      permissionId: "inventory:view_list",
      permissionName: "View Inventory List",
      description: "Allows viewing list of inventory items",
      endpoint: "/api/Inventory",
      httpMethod: "GET",
    },
  ],

  Medicine: [
    {
      permissionId: "medicine:create",
      permissionName: "Create Medicine",
      description: "Allows creating a new medicine",
      endpoint: "/api/Medicine",
      httpMethod: "POST",
    },
    {
      permissionId: "medicine:delete",
      permissionName: "Delete Medicine",
      description: "Allows soft deleting a medicine",
      endpoint: "/api/Medicine/{id}",
      httpMethod: "DELETE",
    },
    {
      permissionId: "medicine:get_by_id",
      permissionName: "View Medicine",
      description: "Get medicine by ID",
      endpoint: "GET /api/Medicine/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "medicine:get_deleted",
      permissionName: "View Deleted Medicines",
      description: "Get all deleted medicines",
      endpoint: "GET /api/Medicine/deleted",
      httpMethod: "GET",
    },
    {
      permissionId: "medicine:get_summary",
      permissionName: "View Medicine Summary",
      description: "Get medicine summary statistics",
      endpoint: "GET /api/Medicine/summary",
      httpMethod: "GET",
    },
    {
      permissionId: "medicine:list_all",
      permissionName: "List All Medicines",
      description: "Get all medicines with filters",
      endpoint: "GET /api/Medicine",
      httpMethod: "GET",
    },
    {
      permissionId: "medicine:restore",
      permissionName: "Restore Medicine",
      description: "Allows restoring a deleted medicine",
      endpoint: "/api/Medicine/{id}/restore",
      httpMethod: "PUT",
    },
    {
      permissionId: "medicine:update",
      permissionName: "Update Medicine",
      description: "Allows updating medicine information",
      endpoint: "/api/Medicine/{id}",
      httpMethod: "PUT",
    },
    {
      permissionId: "medicine:view",
      permissionName: "View Medicine",
      description: "Allows viewing medicine details",
      endpoint: "/api/Medicine/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "medicine:view_all",
      permissionName: "View All Medicines",
      description: "Allows viewing list of all medicines",
      endpoint: "/api/Medicine",
      httpMethod: "GET",
    },
    {
      permissionId: "medicine:view_deleted",
      permissionName: "View Deleted Medicines",
      description: "Allows viewing soft-deleted medicines",
      endpoint: "/api/Medicine/deleted",
      httpMethod: "GET",
    },
    {
      permissionId: "medicine:view_summary",
      permissionName: "View Medicine Summary",
      description: "Allows viewing medicine summary and statistics",
      endpoint: "/api/Medicine/summary",
      httpMethod: "GET",
    },
  ],

  Permission: [
    {
      permissionId: "permission:assign",
      permissionName: "Assign Permissions",
      description: "Allows assigning new permissions to an employee",
      endpoint: "/api/Permission/employee/{employeeId}/assign",
      httpMethod: "POST",
    },
    {
      permissionId: "permission:remove",
      permissionName: "Remove All Permissions",
      description: "Allows removing all permissions from an employee",
      endpoint: "/api/Permission/employee/{employeeId}/remove-all",
      httpMethod: "DELETE",
    },
    {
      permissionId: "permission:update",
      permissionName: "Update Employee Permissions",
      description:
        "Allows updating (replacing) all permissions for an employee",
      endpoint: "/api/Permission/employee/{employeeId}/update",
      httpMethod: "PUT",
    },
    {
      permissionId: "permission:view",
      permissionName: "View Employee Permissions",
      description: "Allows viewing permissions assigned to a specific employee",
      endpoint: "/api/Permission/employee/{employeeId}",
      httpMethod: "GET",
    },
    {
      permissionId: "permission:view_all",
      permissionName: "View All Permissions",
      description: "Allows viewing all available permissions in the system",
      endpoint: "/api/Permission/all",
      httpMethod: "GET",
    },
  ],

  Purchasing: [
    {
      permissionId: "purchasing:create",
      permissionName: "Create Purchase",
      description: "Allows creating a new purchase order",
      endpoint: "/api/Purchasing",
      httpMethod: "POST",
    },
    {
      permissionId: "purchasing:get_by_id",
      permissionName: "View Purchase Details",
      description: "Get purchase by ID",
      endpoint: "GET /api/Purchasing/{purchaseId}",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:get_by_supplier",
      permissionName: "Get Purchases by Supplier",
      description: "Get purchases by supplier ID",
      endpoint: "GET /api/Purchasing/by-supplier/{supplierId}",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:get_payment_summary",
      permissionName: "View Payment Summary",
      description: "Get payment summary",
      endpoint: "GET /api/Purchasing/payment-summary",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:get_summary",
      permissionName: "View Purchasing Summary",
      description: "Get purchasing summary by month",
      endpoint: "GET /api/Purchasing/summary",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:list_all",
      permissionName: "List All Purchases",
      description: "Get all purchases with pagination",
      endpoint: "GET /api/Purchasing",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:search_products",
      permissionName: "Search Products for Purchase",
      description: "Allows searching products when creating purchases",
      endpoint: "/api/Purchasing/search-products",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:update_payment_status",
      permissionName: "Update Payment Status",
      description: "Allows updating payment status of a purchase",
      endpoint: "/api/Purchasing/{id}/payment-status",
      httpMethod: "PUT",
    },
    {
      permissionId: "purchasing:view",
      permissionName: "View Purchase",
      description: "Allows viewing purchase details",
      endpoint: "/api/Purchasing/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:view_all",
      permissionName: "View All Purchases",
      description: "Allows viewing list of all purchases",
      endpoint: "/api/Purchasing",
      httpMethod: "GET",
    },
    {
      permissionId: "purchasing:view_summary",
      permissionName: "View Purchase Summary",
      description: "Allows viewing purchase summary and reports",
      endpoint: "/api/Purchasing/summary",
      httpMethod: "GET",
    },
  ],

  Sales: [
    {
      permissionId: "sales:cancel_receipt",
      permissionName: "Cancel Receipt",
      description: "Allows canceling a sales receipt",
      endpoint: "/api/Sales/cancel/{receiptNumber}",
      httpMethod: "PUT",
    },
    {
      permissionId: "sales:complete_paylater",
      permissionName: "Complete Pay Later",
      description: "Allows completing payment for pay-later sales",
      endpoint: "/api/Sales/complete-paylater/{receiptNumber}",
      httpMethod: "PUT",
    },
    {
      permissionId: "sales:create_receipt",
      permissionName: "Create Receipt",
      description: "Allows creating a new sales receipt",
      endpoint: "/api/Sales/create-receipt-with-items",
      httpMethod: "POST",
    },
    {
      permissionId: "sales:edit_draft",
      permissionName: "Edit Draft Receipt",
      description: "Allows editing items on a draft sales receipt (Admin/Owner only)",
      endpoint: "/api/Sales/draft/{receiptNumber}",
      httpMethod: "PUT",
    },
    {
      permissionId: "sales:finalize_sale",
      permissionName: "Finalize Sale",
      description: "Allows finalizing a draft sale",
      endpoint: "/api/Sales/finalize/{receiptNumber}",
      httpMethod: "PUT",
    },
    {
      permissionId: "sales:get_monthly_summary",
      permissionName: "View Monthly Summary",
      description: "Get monthly revenue summary",
      endpoint: "GET /api/Sales/summary/month",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:get_paylater_receipt",
      permissionName: "View Pay Later Receipt",
      description: "Get pay later receipt details",
      endpoint: "GET /api/Sales/paylater/{receiptNumber}",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:get_receipt",
      permissionName: "View Receipt",
      description: "Get receipt details for cashier",
      endpoint: "GET /api/Sales/receipt/{receiptNumber}",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:get_sale_by_receipt",
      permissionName: "Get Sale by Receipt",
      description: "Get sale details by receipt number",
      endpoint: "GET /api/Sales/by-receipt/{receiptNumber}",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:get_today_summary",
      permissionName: "View Today's Summary",
      description: "Get today's sales summary",
      endpoint: "GET /api/Sales/summary/today",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:list_all_sales",
      permissionName: "List All Sales",
      description: "Get all sales with filters and pagination",
      endpoint: "GET /api/Sales",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:list_paylater",
      permissionName: "List Pay Later Sales",
      description: "List all unpaid sales (pay later)",
      endpoint: "GET /api/Sales/paylater/list",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:view_list",
      permissionName: "View Sales List",
      description: "Allows viewing list of all sales",
      endpoint: "/api/Sales",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:view_paylater_list",
      permissionName: "View Pay Later List",
      description: "Allows viewing list of pay-later sales",
      endpoint: "/api/Sales/paylater-list",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:view_paylater_receipt",
      permissionName: "View Pay Later Receipt",
      description: "Allows viewing a pay-later receipt",
      endpoint: "/api/Sales/paylater/{receiptNumber}",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:view_receipt",
      permissionName: "View Receipt",
      description: "Allows viewing a sales receipt by receipt number",
      endpoint: "/api/Sales/receipt/{receiptNumber}",
      httpMethod: "GET",
    },
    {
      permissionId: "sales:view_summary",
      permissionName: "View Sales Summary",
      description: "Allows viewing sales summary and reports",
      endpoint: "/api/Sales/summary",
      httpMethod: "GET",
    },
  ],

  Supplier: [
    {
      permissionId: "supplier:create",
      permissionName: "Create Supplier",
      description: "Allows creating a new supplier",
      endpoint: "/api/Supplier",
      httpMethod: "POST",
    },
    {
      permissionId: "supplier:get_by_id",
      permissionName: "View Supplier",
      description: "Get supplier by ID",
      endpoint: "GET /api/Supplier/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "supplier:list_all",
      permissionName: "List All Suppliers",
      description: "Get all suppliers with filters",
      endpoint: "GET /api/Supplier",
      httpMethod: "GET",
    },
    {
      permissionId: "supplier:search",
      permissionName: "Search Suppliers",
      description: "Allows searching for suppliers",
      endpoint: "/api/Supplier/search",
      httpMethod: "GET",
    },
    {
      permissionId: "supplier:update",
      permissionName: "Update Supplier",
      description: "Allows updating supplier information",
      endpoint: "/api/Supplier/{id}",
      httpMethod: "PUT",
    },
    {
      permissionId: "supplier:view",
      permissionName: "View Supplier",
      description: "Allows viewing supplier details",
      endpoint: "/api/Supplier/{id}",
      httpMethod: "GET",
    },
    {
      permissionId: "supplier:view_all",
      permissionName: "View All Suppliers",
      description: "Allows viewing list of all suppliers",
      endpoint: "/api/Supplier",
      httpMethod: "GET",
    },
  ],
};

/**
 * Get all permissions for a specific module
 */
export function getPermissionsByModule(module: string): Permission[] {
  return PERMISSION_MATRIX[module] || [];
}

/**
 * Get all available modules
 */
export function getAvailableModules(): string[] {
  return Object.keys(PERMISSION_MATRIX);
}

/**
 * Get a permission by its ID
 */
export function getPermissionById(
  permissionId: string
): Permission | undefined {
  for (const module of Object.values(PERMISSION_MATRIX)) {
    const permission = module.find((p) => p.permissionId === permissionId);
    if (permission) {
      return permission;
    }
  }
  return undefined;
}

/**
 * Get all permissions as a flat array
 */
export function getAllPermissions(): Permission[] {
  return Object.values(PERMISSION_MATRIX).flat();
}

/**
 * Check if a permission exists
 */
export function hasPermission(permissionId: string): boolean {
  return getPermissionById(permissionId) !== undefined;
}
