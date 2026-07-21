import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface PurchaseItem {
  purchaseItemId?: number; // Present on items loaded from an existing purchase; omitted for newly added items
  productSKU: string;
  productName?: string; // Optional: for display purposes only, not sent to API
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  expireDate: string;
}

export interface Purchase {
  purchaseId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentStatus: "Complete" | "Pending" | "Overdue";
  paymentDueDate: string;
  paymentMethod?: string;
  totalAmount: number;
  supplierId: string;
  purchaseItems: PurchaseItem[];
}

export interface CreatePurchaseRequest {
  invoiceNumber: string;
  invoiceDate: string;
  paymentStatus: "Complete" | "Pending" | "Overdue";
  paymentDueDate: string | null;
  paymentMethod: string;
  totalAmount: number;
  supplierId: string;
  items: PurchaseItem[];
}

export interface EditPurchaseItemRequest {
  purchaseItemId?: number; // omit/undefined to add a brand-new line item
  productSKU: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  expireDate: string;
}

export interface EditPurchaseRequest {
  invoiceNumber: string;
  invoiceDate: string;
  paymentDueDate: string | null;
  supplierId: string;
  totalAmount: number;
  items: EditPurchaseItemRequest[];
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: "Complete" | "Pending" | "Overdue";
}

export interface UpdatePaymentStatusResponse {
  message: string;
  purchaseId: string;
  paymentStatus: string;
}

export interface PurchaseListResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Purchase[];
  supplierId?: string;
}

export interface PurchaseListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  invoiceNumber?: string;
  paymentStatus?: string;
  supplierId?: string;
  supplierName?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
}

export interface PurchaseSummary {
  pendingPayments: {
    totalAmount: number;
    invoiceCount: number;
  };
  monthlyPurchases: {
    totalAmount: number;
    invoiceCount: number;
  };
  itemsReceived: {
    totalQuantity: number;
    batches: number;
  };
  activeSuppliers: number;
}

export interface ProductSearchResult {
  productSku: string;
  name: string;
  strength: string;
  productType: "Medicine" | "Glossary";
  sellingPrice: number;
  totalQuantityOnHand: number;
}

export interface ProductSearchParams {
  q: string;
  limit?: number;
}

class PurchasingService {
  async getAllPurchases(
    params?: PurchaseListParams
  ): Promise<PurchaseListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.pageSize)
          queryParams.append("pageSize", params.pageSize.toString());
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortDirection) queryParams.append("sortDirection", params.sortDirection);
        if (params.invoiceNumber) queryParams.append("invoiceNumber", params.invoiceNumber);
        if (params.paymentStatus) queryParams.append("paymentStatus", params.paymentStatus);
        if (params.supplierId) queryParams.append("supplierId", params.supplierId);
        if (params.supplierName) queryParams.append("supplierName", params.supplierName);
        if (params.fromDate) queryParams.append("fromDate", params.fromDate);
        if (params.toDate) queryParams.append("toDate", params.toDate);
        if (params.minAmount !== undefined) queryParams.append("minAmount", params.minAmount.toString());
        if (params.maxAmount !== undefined) queryParams.append("maxAmount", params.maxAmount.toString());
        if (params.paymentMethod) queryParams.append("paymentMethod", params.paymentMethod);
      }

      const queryString = queryParams.toString();
      const url = `${API_ENDPOINTS.PURCHASING.BASE}${
        queryString ? `?${queryString}` : ""
      }`;

      const data = await apiService.get<PurchaseListResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch purchases");
    }
  }

  async getPurchaseById(purchaseId: string): Promise<Purchase> {
    try {
      const data = await apiService.get<Purchase>(
        API_ENDPOINTS.PURCHASING.BY_ID(purchaseId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch purchase with ID: ${purchaseId}`);
    }
  }

  async createPurchase(purchaseData: CreatePurchaseRequest): Promise<Purchase> {
    try {
      const data = await apiService.post<Purchase>(
        API_ENDPOINTS.PURCHASING.BASE,
        purchaseData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create purchase");
    }
  }

  async editPurchase(
    purchaseId: string,
    purchaseData: EditPurchaseRequest
  ): Promise<{ message: string; purchaseId: string }> {
    try {
      const data = await apiService.put<{ message: string; purchaseId: string }>(
        API_ENDPOINTS.PURCHASING.EDIT_PURCHASE(purchaseId),
        purchaseData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to update purchase with ID: ${purchaseId}`);
    }
  }

  async updatePaymentStatus(
    purchaseId: string,
    statusData: UpdatePaymentStatusRequest
  ): Promise<UpdatePaymentStatusResponse> {
    try {
      const data = await apiService.put<UpdatePaymentStatusResponse>(
        API_ENDPOINTS.PURCHASING.UPDATE_PAYMENT_STATUS(purchaseId),
        statusData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Failed to update payment status for purchase ID: ${purchaseId}`
      );
    }
  }

  async getPurchaseSummary(
    month: number,
    year: number
  ): Promise<PurchaseSummary> {
    try {
      const data = await apiService.get<PurchaseSummary>(
        API_ENDPOINTS.PURCHASING.SUMMARY(month, year)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch purchase summary for ${month}/${year}`);
    }
  }

  async searchProducts(
    params: ProductSearchParams
  ): Promise<ProductSearchResult[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("q", params.q);
      if (params.limit) {
        queryParams.append("limit", params.limit.toString());
      }

      const url = `${
        API_ENDPOINTS.PURCHASING.SEARCH
      }?${queryParams.toString()}`;
      const data = await apiService.get<ProductSearchResult[]>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to search products");
    }
  }

  async getPurchasesBySupplier(
    supplierId: string,
    params?: PurchaseListParams
  ): Promise<PurchaseListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.pageSize)
          queryParams.append("pageSize", params.pageSize.toString());
      }

      const queryString = queryParams.toString();
      const url = `${API_ENDPOINTS.PURCHASING.BY_SUPPLIER(supplierId)}${
        queryString ? `?${queryString}` : ""
      }`;

      const data = await apiService.get<PurchaseListResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch purchases for supplier: ${supplierId}`);
    }
  }
}

export const purchasingService = new PurchasingService();
