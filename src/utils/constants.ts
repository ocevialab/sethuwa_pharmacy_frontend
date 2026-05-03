// API Configuration
// Get API base URL from environment variables
// Fallback to default if not set
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "pharmacy_token",
  USER: "pharmacy_user",
  EMPLOYEE_ID: "pharmacy_employee_id",
  EMPLOYEE_NAME: "pharmacy_employee_name",
  ROLE: "pharmacy_role",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/Auth/login",
    LOGOUT: "/Auth/logout",
    REFRESH: "/Auth/refresh",
  },
  CUSTOMER: {
    BASE: "/Customer",
    BY_ID: (id: string) => `/Customer/${id}`,
    RESTORE: (id: string) => `/Customer/restore/${id}`,
  },
  EMPLOYEE: {
    ALL: "/Employee",
    BY_ID: (id: string) => `/Employee/${id}`,
    WITH_PERMISSIONS: (id: string) => `/Employee/${id}/with-permissions`,
    CHANGE_PASSWORD: (id: string) => `/Employee/${id}/change-password`,
    DEACTIVATE_ALL_EXCEPT_OWNER: "/Employee/deactivate-all-except-owner",
  },
  FINANCE: {
    REVENUE_TREND: (
      period: string,
      year: number,
      startYear?: number,
      endYear?: number
    ) => {
      if (period === "yearly") {
        const start = startYear || year - 4;
        const end = endYear || year;
        return `/Finance/revenue-trend?period=yearly&startYear=${start}&endYear=${end}`;
      }
      return `/Finance/revenue-trend?period=monthly&year=${year}`;
    },
    SUPPLIER_EXPENSES: (
      period: string,
      month: number,
      year: number,
      startYear?: number,
      endYear?: number
    ) => {
      if (period === "yearly") {
        const start = startYear || year - 4;
        const end = endYear || year;
        return `/Finance/supplier-expenses?period=yearly&startYear=${start}&endYear=${end}`;
      }
      return `/Finance/supplier-expenses?period=monthly&month=${month}&year=${year}`;
    },
    MOST_SELLING_ITEMS: (
      period: string,
      month: number,
      year: number,
      startYear?: number,
      endYear?: number
    ) => {
      if (period === "yearly") {
        const start = startYear || year - 4;
        const end = endYear || year;
        return `/Finance/most-selling-items?period=yearly&startYear=${start}&endYear=${end}`;
      }
      return `/Finance/most-selling-items?period=monthly&month=${month}&year=${year}`;
    },
    SUMMARY: (
      period: string,
      month: number,
      year: number,
      startYear?: number,
      endYear?: number
    ) => {
      if (period === "yearly") {
        const start = startYear || year - 4;
        const end = endYear || year;
        return `/Finance/summary?period=yearly&startYear=${start}&endYear=${end}`;
      }
      return `/Finance/summary?period=monthly&month=${month}&year=${year}`;
    },
    DAILY_REPORT: (date?: string) => {
      const dateParam = date ? `?date=${date}` : "";
      return `/Finance/report/daily${dateParam}`;
    },
    WEEKLY_REPORT: (startDate?: string) => {
      const dateParam = startDate ? `?startDate=${startDate}` : "";
      return `/Finance/report/weekly${dateParam}`;
    },
    MONTHLY_REPORT: (month: number, year: number) =>
      `/Finance/report/monthly?month=${month}&year=${year}`,
    YEARLY_REPORT: (year: number) => `/Finance/report/yearly?year=${year}`,
  },
  GLOSSARY: {
    BASE: "/Glossary",
    BY_ID: (id: string) => `/Glossary/${id}`,
    DELETED: "/Glossary/deleted",
    RESTORE: (id: string) => `/Glossary/restore/${id}`,
  },
  INVENTORY: {
    LIST: "/Inventory/all",
    ITEM_DETAILS: (productSku: string) =>
      `/Inventory/ItemDetails/${productSku}`,
    BATCHES: (productSku: string) => `/Inventory/batches/${productSku}`,
    BATCHES_FOR_SALE: "/Inventory/batches-for-sale",
    UPDATE_STOCK_PRICE: (stockId: number) => `/Inventory/stock/${stockId}/price`,
  },
  MEDICINE: {
    BASE: "/Medicine",
    BY_ID: (id: string) => `/Medicine/${id}`,
    DELETED: "/Medicine/deleted",
    RESTORE: (id: string) => `/Medicine/restore/${id}`,
    SUMMARY: "/Medicine/summary",
  },
  PURCHASING: {
    BASE: "/Purchasing",
    BY_ID: (id: string) => `/Purchasing/${id}`,
    BY_SUPPLIER: (supplierId: string) =>
      `/Purchasing/by-supplier/${supplierId}`,
    UPDATE_PAYMENT_STATUS: (id: string) => `/Purchasing/${id}/payment-status`,
    SUMMARY: (month: number, year: number) =>
      `/Purchasing/summary?month=${month}&year=${year}`,
    SEARCH: "/Purchasing/search",
  },
  SALES: {
    BASE: "/Sales",
    BY_ID: (id: string) => `/Sales/${id}`,
    CREATE_RECEIPT: "/Sales/create-receipt-with-items",
    GET_RECEIPT: (receiptNumber: string) =>
      `/Sales/by-receipt/${receiptNumber}`,
    FINALIZE: (receiptNumber: string) => `/Sales/finalize/${receiptNumber}`,
    COMPLETE_PAYLATER: (receiptNumber: string) =>
      `/Sales/paylater/complete/${receiptNumber}`,
    PAYLATER_LIST: "/Sales/paylater/list",
    CANCEL: (receiptNumber: string) => `/Sales/cancel/${receiptNumber}`,
    SUMMARY_TODAY: "/Sales/summary/today",
    SUMMARY_MONTH: "/Sales/summary/month",
    BY_CUSTOMER: (customerId: string) => `/Sales/customer/${customerId}`,
  },
  SUPPLIER: {
    BASE: "/Supplier",
    BY_ID: (id: string) => `/Supplier/${id}`,
    SEARCH: "/Supplier/search",
    ACTIVATE: (id: string) => `/Supplier/${id}/activate`,
    DEACTIVATE: (id: string) => `/Supplier/${id}/deactivate`,
  },
  PERMISSION: {
    ALL: "/Permission/all",
    BY_EMPLOYEE: (employeeId: string) => `/Permission/employee/${employeeId}`,
    ASSIGN: (employeeId: string) => `/Permission/employee/${employeeId}/assign`,
    UPDATE: (employeeId: string) => `/Permission/employee/${employeeId}/update`,
    REMOVE_ALL: (employeeId: string) =>
      `/Permission/employee/${employeeId}/remove-all`,
  },
} as const;
