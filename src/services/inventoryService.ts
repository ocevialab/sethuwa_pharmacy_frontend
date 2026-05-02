import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface InventoryItem {
  productSku: string;
  name: string;
  stock: number;
  unitPrice: number;
  lowStockThreshold: number;
  productType: string;
  stockBatches?: StockBatch[];
}

export interface StockBatch {
  stockId: number;
  quantityOnHand: number;
  expireDate: string;
  costPrice: number;
  sellingPrice: number;
  lotNumber: string;
}

export interface InventoryItemDetails {
  productSku: string;
  name: string;
  brandName: string;
  productType: string;
  lowStockThreshold: number;
  genericName?: string;
  strength?: string;
  requiredPrescription: boolean;
  totalQuantityOnHand: number;
  stockBatches: StockBatch[];
}

export interface InventoryListResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: InventoryItem[];
}

export interface InventoryListParams {
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface UpdateStockPriceRequest {
  costPrice: number;
  sellingPrice: number;
}

class InventoryService {
  async getInventoryList(
    params?: InventoryListParams
  ): Promise<InventoryListResponse> {
    try {
      const queryParams = new URLSearchParams();

      // Always include page and pageSize with defaults if not provided
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 10;
      
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pageSize.toString());
      
      // Only include q parameter if it's provided and not empty
      if (params?.q && params.q.trim()) {
        queryParams.append("q", params.q.trim());
      }

      const queryString = queryParams.toString();
      const url = `${API_ENDPOINTS.INVENTORY.LIST}?${queryString}`;
      const data = await apiService.get<InventoryListResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch inventory list");
    }
  }

  async getItemDetails(productSku: string): Promise<InventoryItemDetails> {
    try {
      const data = await apiService.get<InventoryItemDetails>(
        API_ENDPOINTS.INVENTORY.ITEM_DETAILS(productSku)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch item details for SKU: ${productSku}`);
    }
  }

  async updateStockPrice(
    stockId: number,
    request: UpdateStockPriceRequest
  ): Promise<void> {
    try {
      await apiService.put(
        API_ENDPOINTS.INVENTORY.UPDATE_STOCK_PRICE(stockId),
        request
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to update stock price for stock ID: ${stockId}`);
    }
  }
}

export const inventoryService = new InventoryService();
