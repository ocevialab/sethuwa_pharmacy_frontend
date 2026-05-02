import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface Supplier {
  supplierId?: string;
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress?: string | null;
  address?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankBranchName?: string | null;
  /** e.g. "Active" | "Inactive" from list/detail API */
  supplierStatus?: string | null;
}

export interface CreateSupplierRequest {
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress?: string;
  address?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranchName?: string;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {}

export interface SupplierListResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Supplier[];
}

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  supplierId?: string;
  supplierName?: string;
  contactPerson?: string;
  contactNumber?: string;
  emailAddress?: string;
  address?: string;
  bankName?: string;
}

export interface SupplierSearchResult {
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress?: string | null;
}

class SupplierService {
  async getAllSuppliers(
    params?: SupplierListParams
  ): Promise<SupplierListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.pageSize)
          queryParams.append("pageSize", params.pageSize.toString());
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortDirection)
          queryParams.append("sortDirection", params.sortDirection);
        if (params.supplierId)
          queryParams.append("supplierId", params.supplierId);
        if (params.supplierName)
          queryParams.append("supplierName", params.supplierName);
        if (params.contactPerson)
          queryParams.append("contactPerson", params.contactPerson);
        if (params.contactNumber)
          queryParams.append("contactNumber", params.contactNumber);
        if (params.emailAddress)
          queryParams.append("emailAddress", params.emailAddress);
        if (params.address) queryParams.append("address", params.address);
        if (params.bankName) queryParams.append("bankName", params.bankName);
      }

      const queryString = queryParams.toString();
      const url = `${API_ENDPOINTS.SUPPLIER.BASE}${
        queryString ? `?${queryString}` : ""
      }`;

      const data = await apiService.get<SupplierListResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch suppliers");
    }
  }

  async getSupplierById(supplierId: string): Promise<Supplier> {
    try {
      const data = await apiService.get<Supplier>(
        API_ENDPOINTS.SUPPLIER.BY_ID(supplierId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch supplier with ID: ${supplierId}`);
    }
  }

  async createSupplier(supplierData: CreateSupplierRequest): Promise<Supplier> {
    try {
      const data = await apiService.post<Supplier>(
        API_ENDPOINTS.SUPPLIER.BASE,
        supplierData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create supplier");
    }
  }

  async updateSupplier(
    supplierId: string,
    supplierData: UpdateSupplierRequest
  ): Promise<Supplier> {
    try {
      const data = await apiService.put<Supplier>(
        API_ENDPOINTS.SUPPLIER.BY_ID(supplierId),
        supplierData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to update supplier with ID: ${supplierId}`);
    }
  }

  async searchSuppliers(
    query: string,
    limit: number = 20
  ): Promise<SupplierSearchResult[]> {
    try {
      const data = await apiService.get<SupplierSearchResult[]>(
        `${API_ENDPOINTS.SUPPLIER.SEARCH}?q=${encodeURIComponent(
          query
        )}&limit=${limit}`
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to search suppliers");
    }
  }

  async activateSupplier(supplierId: string): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.SUPPLIER.ACTIVATE(supplierId), {});
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to activate supplier: ${supplierId}`);
    }
  }

  async deactivateSupplier(supplierId: string): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.SUPPLIER.DEACTIVATE(supplierId), {});
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to deactivate supplier: ${supplierId}`);
    }
  }
}

export const supplierService = new SupplierService();
