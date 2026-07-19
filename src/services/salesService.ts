import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface SalesItem {
  productSku: string;
  quantity: number;
  subTotal: number;
  stockId?: number;
}

export interface SalesItemDetail {
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  subTotal: number;
}

export interface CreateReceiptRequest {
  items: SalesItem[];
  totalAmount: number;
}

export interface Receipt {
  salesId: number;
  receiptNumber: string;
  date: string;
  time: string;
  saleStatus: "Paid" | "Unpaid" | "Cancelled" | "Draft";
  paymentMethod: string | null;
  paymentCompletedAt: string | null;
  totalAmount: number;
  finalAmountDue: number;
  customerDiscountPercent: number;
  roundingDiscount: number;
  issuedBy: string;
  customerName: string | null;
  items: SalesItemDetail[];
  payments?: SalesPayment[];
  totalPaidAmount?: number;
}

export interface CustomerSale {
  salesId: number;
  receiptNumber: string;
  date: string;
  time: string;
  saleStatus: "Paid" | "Unpaid" | "Cancelled" | "Draft";
  paymentMethod: string | null;
  paymentCompletedAt: string | null;
  totalAmount: number;
  finalAmountDue: number;
  customerDiscountPercent: number | null;
  roundingDiscount: number | null;
  issuedBy: string;
  customerName: string;
  items: SalesItemDetail[];
}

export interface CustomerSalesResponse {
  customerId: string;
  customerName: string;
  totalSales: number;
  totalSalesAmount: number;
  sales: CustomerSale[];
}

export interface PaymentEntry {
  paymentMethod: string;
  paymentAmount: number;
  paymentDate: string;
}

export interface FinalizeReceiptRequest {
  customerId?: string;
  customerName?: string;
  contactNumber?: string;
  emailAddress?: string;
  customerDiscountPercent?: number;
  roundingDiscount?: number;
  paymentMethod?: string;
  receivedAmount?: number;
  payments?: PaymentEntry[];
  saleStatus?: string;
}

export interface FinalizeReceiptResponse {
  message: string;
  receipt: string;
  status: string;
  amountDue: number;
}

export interface CompletePayLaterRequest {
  paymentMethod: string;
  receivedAmount: number;
  roundingDiscount?: number;
}

export interface SalesPayment {
  paymentId: number;
  salesId: number;
  paymentMethod: string;
  paymentAmount: number;
  paymentDate: string;
  createdAt: string;
}

export interface SalesListItem {
  salesId: number;
  receiptNumber: string;
  date: string;
  time: string;
  saleStatus: "Paid" | "Unpaid" | "Cancelled" | "Draft";
  paymentMethod: string | null;
  paymentCompletedAt: string | null;
  totalAmount: number;
  finalAmountDue: number;
  customerDiscountPercent: number | null;
  roundingDiscount: number | null;
  issuedBy: string;
  customerName: string;
  items: SalesItemDetail[];
  payments?: SalesPayment[];
  totalPaidAmount?: number;
}

export interface SalesListResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: SalesListItem[];
}

export interface SalesListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  receiptNumber?: string;
  saleStatus?: string;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
  customerId?: string;
  customerName?: string;
  issuedById?: string;
  issuedByName?: string;
  minAmount?: number;
  maxAmount?: number;
  q?: string;
}

export interface SupplierSalesSummaryItem {
  supplierId: string;
  supplierName: string;
  totalUnitsSold: number;
  totalRevenue: number;
  batchCount: number;
}

export interface SupplierSalesSummaryResponse {
  fromDate: string | null;
  toDate: string | null;
  data: SupplierSalesSummaryItem[];
}

export interface SalesSummaryToday {
  businessDate: string;
  totalSalesToday: number;
  totalReceiptsToday: number;
  totalSales: number;
  cashTotal: number;
  cardTotal: number;
  percentageChange: number;
}

export interface SalesSummaryMonth {
  totalSalesMonth: number;
  totalReceiptsMonth: number;
  percentageChange: number;
}

class SalesService {
  async createReceipt(receiptData: CreateReceiptRequest): Promise<Receipt> {
    try {
      const data = await apiService.post<Receipt>(
        API_ENDPOINTS.SALES.CREATE_RECEIPT,
        receiptData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create receipt");
    }
  }

  async updateDraftReceipt(
    receiptNumber: string,
    receiptData: CreateReceiptRequest
  ): Promise<{ message: string; salesId: number; receiptNumber: string }> {
    try {
      const data = await apiService.put<{
        message: string;
        salesId: number;
        receiptNumber: string;
      }>(API_ENDPOINTS.SALES.UPDATE_DRAFT(receiptNumber), receiptData);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to update draft receipt: ${receiptNumber}`);
    }
  }

  async getReceipt(receiptNumber: string): Promise<Receipt> {
    try {
      const data = await apiService.get<Receipt>(
        API_ENDPOINTS.SALES.GET_RECEIPT(receiptNumber)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch receipt: ${receiptNumber}`);
    }
  }

  async finalizeReceipt(
    receiptNumber: string,
    finalizeData: FinalizeReceiptRequest
  ): Promise<FinalizeReceiptResponse> {
    try {
      const data = await apiService.put<FinalizeReceiptResponse>(
        API_ENDPOINTS.SALES.FINALIZE(receiptNumber),
        finalizeData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to finalize receipt: ${receiptNumber}`);
    }
  }

  async completePayLater(
    receiptNumber: string,
    completeData: CompletePayLaterRequest
  ): Promise<void> {
    try {
      await apiService.put(
        API_ENDPOINTS.SALES.COMPLETE_PAYLATER(receiptNumber),
        completeData
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Failed to complete pay-later payment for receipt: ${receiptNumber}`
      );
    }
  }

  async getPayLaterList(): Promise<SalesListItem[]> {
    try {
      const data = await apiService.get<SalesListItem[]>(
        API_ENDPOINTS.SALES.PAYLATER_LIST
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch pay-later list");
    }
  }

  async cancelReceipt(receiptNumber: string): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.SALES.CANCEL(receiptNumber));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to cancel receipt: ${receiptNumber}`);
    }
  }

  async getSummaryToday(): Promise<SalesSummaryToday> {
    try {
      const data = await apiService.get<SalesSummaryToday>(
        API_ENDPOINTS.SALES.SUMMARY_TODAY
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch today's summary");
    }
  }

  async getSummaryMonth(): Promise<SalesSummaryMonth> {
    try {
      const data = await apiService.get<SalesSummaryMonth>(
        API_ENDPOINTS.SALES.SUMMARY_MONTH
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch month's summary");
    }
  }

  async getSaleById(saleId: string): Promise<SalesListItem> {
    try {
      const data = await apiService.get<SalesListItem>(
        API_ENDPOINTS.SALES.BY_ID(saleId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch sale with ID: ${saleId}`);
    }
  }

  async getAllSales(params?: SalesListParams): Promise<SalesListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.pageSize)
          queryParams.append("pageSize", params.pageSize.toString());
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortDirection)
          queryParams.append("sortDirection", params.sortDirection);
        if (params.receiptNumber)
          queryParams.append("receiptNumber", params.receiptNumber);
        if (params.saleStatus)
          queryParams.append("saleStatus", params.saleStatus);
        if (params.paymentMethod)
          queryParams.append("paymentMethod", params.paymentMethod);
        if (params.fromDate) queryParams.append("fromDate", params.fromDate);
        if (params.toDate) queryParams.append("toDate", params.toDate);
        if (params.customerId)
          queryParams.append("customerId", params.customerId);
        if (params.customerName)
          queryParams.append("customerName", params.customerName);
        if (params.issuedById)
          queryParams.append("issuedById", params.issuedById);
        if (params.issuedByName)
          queryParams.append("issuedByName", params.issuedByName);
        if (params.minAmount !== undefined)
          queryParams.append("minAmount", params.minAmount.toString());
        if (params.maxAmount !== undefined)
          queryParams.append("maxAmount", params.maxAmount.toString());
        if (params.q) queryParams.append("q", params.q);
        if (params.q) queryParams.append("q", params.q);
      }

      const queryString = queryParams.toString();
      const url = `${API_ENDPOINTS.SALES.BASE}${
        queryString ? `?${queryString}` : ""
      }`;

      const data = await apiService.get<SalesListResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch sales");
    }
  }

  async getSalesBySupplier(
    fromDate?: string,
    toDate?: string
  ): Promise<SupplierSalesSummaryResponse> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      const url = `/Sales/summary/by-supplier${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await apiService.get<SupplierSalesSummaryResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Failed to fetch sales by supplier");
    }
  }

  async getCustomerSales(customerId: string): Promise<CustomerSalesResponse> {
    try {
      const data = await apiService.get<CustomerSalesResponse>(
        API_ENDPOINTS.SALES.BY_CUSTOMER(customerId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch customer sales for ID: ${customerId}`);
    }
  }
}

// Type alias for backward compatibility
export type Sale = SalesListItem;
export type SaleItem = SalesItemDetail;

export const salesService = new SalesService();
