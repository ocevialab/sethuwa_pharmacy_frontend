import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface Glossary {
  glossaryId?: string;
  name: string;
  brandName: string;
  lowStockThreshold: number;
  isDeleted: boolean;
  productSku?: string;
}

export interface CreateGlossaryRequest {
  name: string;
  brandName: string;
  lowStockThreshold: number;
  isDeleted: boolean;
}

export interface UpdateGlossaryRequest {
  name: string;
  brandName: string;
  lowStockThreshold: number;
}

export interface GlossaryListResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Glossary[];
}

export interface GlossaryListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  name?: string;
  brandName?: string;
  productSku?: string;
  glossaryId?: string;
  minLowStockThreshold?: number;
  maxLowStockThreshold?: number;
}

class GlossaryService {
  async getAllGlossaries(
    params?: GlossaryListParams
  ): Promise<GlossaryListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.pageSize)
          queryParams.append("pageSize", params.pageSize.toString());
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortDirection)
          queryParams.append("sortDirection", params.sortDirection);
        if (params.name) queryParams.append("name", params.name);
        if (params.brandName) queryParams.append("brandName", params.brandName);
        if (params.productSku)
          queryParams.append("productSku", params.productSku);
        if (params.glossaryId)
          queryParams.append("glossaryId", params.glossaryId);
        if (params.minLowStockThreshold !== undefined)
          queryParams.append(
            "minLowStockThreshold",
            params.minLowStockThreshold.toString()
          );
        if (params.maxLowStockThreshold !== undefined)
          queryParams.append(
            "maxLowStockThreshold",
            params.maxLowStockThreshold.toString()
          );
      }

      const queryString = queryParams.toString();
      const url = `${API_ENDPOINTS.GLOSSARY.BASE}${
        queryString ? `?${queryString}` : ""
      }`;

      const data = await apiService.get<GlossaryListResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch glossaries");
    }
  }

  async getGlossaryById(glossaryId: string): Promise<Glossary> {
    try {
      const data = await apiService.get<Glossary>(
        API_ENDPOINTS.GLOSSARY.BY_ID(glossaryId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch glossary with ID: ${glossaryId}`);
    }
  }

  async createGlossary(glossaryData: CreateGlossaryRequest): Promise<Glossary> {
    try {
      const data = await apiService.post<Glossary>(
        API_ENDPOINTS.GLOSSARY.BASE,
        glossaryData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create glossary");
    }
  }

  async deleteGlossary(glossaryId: string): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.GLOSSARY.BY_ID(glossaryId));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to delete glossary with ID: ${glossaryId}`);
    }
  }

  async getDeletedGlossaries(): Promise<Glossary[]> {
    try {
      const data = await apiService.get<Glossary[]>(
        API_ENDPOINTS.GLOSSARY.DELETED
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch deleted glossaries");
    }
  }

  async restoreGlossary(glossaryId: string): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.GLOSSARY.RESTORE(glossaryId), {});
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to restore glossary with ID: ${glossaryId}`);
    }
  }

  async updateGlossary(
    glossaryId: string,
    glossaryData: UpdateGlossaryRequest
  ): Promise<Glossary> {
    try {
      const data = await apiService.put<Glossary>(
        API_ENDPOINTS.GLOSSARY.BY_ID(glossaryId),
        glossaryData
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to update glossary with ID: ${glossaryId}`);
    }
  }
}

export const glossaryService = new GlossaryService();
