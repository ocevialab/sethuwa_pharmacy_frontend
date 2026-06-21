import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface InventoryItem {
  productSku: string;
  name: string;
  stock: number;
  unitPrice: number;
  lowStockThreshold: number;
  productType: string;
  /** Distinct suppliers from in-stock batches (comma-separated), when returned by list API */
  supplierSummary?: string;
  barcode?: string;
  stockBatches?: StockBatch[];
}

export interface StockBatch {
  stockId: number;
  quantityOnHand: number;
  expireDate: string;
  costPrice: number;
  sellingPrice: number;
  lotNumber: string;
  supplierId?: string;
  supplierName?: string;
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

export interface ProductBarcodeResult {
  productSku: string;
  barcode?: string | null;
  productName?: string;
  productType?: string;
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

  async getStockBatches(productSku: string): Promise<StockBatch[]> {
    try {
      const data = await apiService.get<StockBatch[]>(
        API_ENDPOINTS.INVENTORY.BATCHES(productSku)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch stock batches for SKU: ${productSku}`);
    }
  }

  /** In-stock batches per SKU for POS (FEFO order). Empty SKUs omitted from the map. */
  async getStockBatchesForSale(
    productSkus: string[]
  ): Promise<Record<string, StockBatch[]>> {
    const distinct = [...new Set(productSkus.filter(Boolean))];
    if (distinct.length === 0) {
      return {};
    }
    try {
      const data = await apiService.post<Record<string, StockBatch[]>>(
        API_ENDPOINTS.INVENTORY.BATCHES_FOR_SALE,
        distinct
      );
      return data ?? {};
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch stock batches for sale");
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

  async updateProductBarcode(
    productSku: string,
    barcode: string | null
  ): Promise<ProductBarcodeResult> {
    try {
      return await apiService.put<ProductBarcodeResult>(
        API_ENDPOINTS.INVENTORY.UPDATE_BARCODE(productSku),
        { barcode: barcode?.trim() || null }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update product barcode");
    }
  }

  async generateProductBarcode(
    productSku: string
  ): Promise<ProductBarcodeResult> {
    try {
      return await apiService.post<ProductBarcodeResult>(
        API_ENDPOINTS.INVENTORY.GENERATE_BARCODE(productSku),
        {}
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to generate product barcode");
    }
  }

  private pdfDownloadPromise: Promise<void> | null = null;

  async downloadProductBarcodeLabelsPdf(
    productSku: string,
    fallbackName: string
  ): Promise<void> {
    if (this.pdfDownloadPromise) {
      return this.pdfDownloadPromise;
    }

    this.pdfDownloadPromise = this.downloadProductBarcodeLabelsPdfInternal(
      productSku,
      fallbackName
    ).finally(() => {
      this.pdfDownloadPromise = null;
    });

    return this.pdfDownloadPromise;
  }

  private async downloadProductBarcodeLabelsPdfInternal(
    productSku: string,
    fallbackName: string
  ): Promise<void> {
    try {
      const blob = await apiService.getBlob(
        API_ENDPOINTS.INVENTORY.BARCODE_LABELS_PDF(productSku)
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = fallbackName.replace(/[^\w\s-]/g, "").trim() || "product";
      a.href = url;
      a.download = `${safe}-barcode-labels.pdf`;
      document.body.appendChild(a);
      a.click();
      window.setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 250);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to download barcode labels");
    }
  }
}

export const inventoryService = new InventoryService();
