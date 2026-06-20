import { apiService } from './api';
import { API_ENDPOINTS } from '@/utils/constants';

export interface Medicine {
    medicineId?: string;
    name: string;
    brandName: string;
    genericName: string;
    manufacture: string;
    category: string;
    strength: string;
    requiredPrescription: boolean;
    lowStockThreshold: number;
    isDeleted: boolean;
    productSku?: string;
    barcode?: string;
    products?: any[];
}

export interface CreateMedicineRequest {
    name: string;
    brandName: string;
    genericName: string;
    manufacture: string;
    category: string;
    strength: string;
    requiredPrescription: boolean;
    lowStockThreshold: number;
    isDeleted: boolean;
    barcode?: string;
}

export interface UpdateMedicineRequest extends CreateMedicineRequest {}

export interface MedicineListResponse {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    data: Medicine[];
}

export interface MedicineListParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: string;
    medicineId?: string;
    name?: string;
    brandName?: string;
    genericName?: string;
    manufacture?: string;
    category?: string;
    strength?: string;
    productSku?: string;
    requiredPrescription?: boolean;
    minLowStockThreshold?: number;
    maxLowStockThreshold?: number;
}

export interface MedicineSummary {
    totalMedicines: number;
    activeMedicines: number;
    deletedMedicines: number;
    prescriptionRequired: number;
    nonPrescription: number;
}

export interface MedicineExcelBulkUpdateRowResult {
    rowNumber: number;
    medicineId?: string | null;
    status: string;
    message: string;
}

export interface MedicineExcelBulkUpdateSummary {
    totalRows: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    rows: MedicineExcelBulkUpdateRowResult[];
}

export interface MedicineBarcodeResult {
    medicineId: string;
    productSku: string;
    barcode: string;
    medicineName?: string;
}

class MedicineService {
    async getAllMedicines(params?: MedicineListParams): Promise<MedicineListResponse> {
        try {
            const queryParams = new URLSearchParams();
            
            if (params) {
                if (params.page) queryParams.append('page', params.page.toString());
                if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
                if (params.sortBy) queryParams.append('sortBy', params.sortBy);
                if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
                if (params.medicineId) queryParams.append('medicineId', params.medicineId);
                if (params.name) queryParams.append('name', params.name);
                if (params.brandName) queryParams.append('brandName', params.brandName);
                if (params.genericName) queryParams.append('genericName', params.genericName);
                if (params.manufacture) queryParams.append('manufacture', params.manufacture);
                if (params.category) queryParams.append('category', params.category);
                if (params.strength) queryParams.append('strength', params.strength);
                if (params.productSku) queryParams.append('productSku', params.productSku);
                if (params.requiredPrescription !== undefined) queryParams.append('requiredPrescription', params.requiredPrescription.toString());
                if (params.minLowStockThreshold !== undefined) queryParams.append('minLowStockThreshold', params.minLowStockThreshold.toString());
                if (params.maxLowStockThreshold !== undefined) queryParams.append('maxLowStockThreshold', params.maxLowStockThreshold.toString());
            }

            const queryString = queryParams.toString();
            const url = `${API_ENDPOINTS.MEDICINE.BASE}${queryString ? `?${queryString}` : ''}`;
            
            const data = await apiService.get<MedicineListResponse>(url);
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to fetch medicines');
        }
    }

    async getMedicineById(medicineId: string): Promise<Medicine> {
        try {
            const data = await apiService.get<Medicine>(API_ENDPOINTS.MEDICINE.BY_ID(medicineId));
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to fetch medicine with ID: ${medicineId}`);
        }
    }

    async createMedicine(medicineData: CreateMedicineRequest): Promise<Medicine> {
        try {
            const data = await apiService.post<Medicine>(API_ENDPOINTS.MEDICINE.BASE, medicineData);
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create medicine');
        }
    }

    async updateMedicine(medicineId: string, medicineData: UpdateMedicineRequest): Promise<Medicine> {
        try {
            const data = await apiService.put<Medicine>(API_ENDPOINTS.MEDICINE.BY_ID(medicineId), medicineData);
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to update medicine with ID: ${medicineId}`);
        }
    }

    async deleteMedicine(medicineId: string): Promise<void> {
        try {
            await apiService.delete(API_ENDPOINTS.MEDICINE.BY_ID(medicineId));
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to delete medicine with ID: ${medicineId}`);
        }
    }

    async getDeletedMedicines(): Promise<Medicine[]> {
        try {
            const data = await apiService.get<Medicine[]>(API_ENDPOINTS.MEDICINE.DELETED);
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to fetch deleted medicines');
        }
    }

    async restoreMedicine(medicineId: string): Promise<void> {
        try {
            await apiService.post(API_ENDPOINTS.MEDICINE.RESTORE(medicineId), {});
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to restore medicine with ID: ${medicineId}`);
        }
    }

    async getSummary(): Promise<MedicineSummary> {
        try {
            const data = await apiService.get<MedicineSummary>(API_ENDPOINTS.MEDICINE.SUMMARY);
            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to fetch medicine summary');
        }
    }

    async bulkUpdateFromExcel(file: File): Promise<MedicineExcelBulkUpdateSummary> {
        const formData = new FormData();
        formData.append('file', file);
        try {
            return await apiService.postMultipart<MedicineExcelBulkUpdateSummary>(
                API_ENDPOINTS.MEDICINE.BULK_UPDATE_EXCEL,
                formData
            );
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to import medicines from Excel');
        }
    }

    async generateBarcode(medicineId: string): Promise<MedicineBarcodeResult> {
        try {
            return await apiService.post<MedicineBarcodeResult>(
                API_ENDPOINTS.MEDICINE.GENERATE_BARCODE(medicineId),
                {}
            );
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to generate barcode');
        }
    }

    private pdfDownloadPromise: Promise<void> | null = null;

    async downloadBarcodeLabelsPdf(medicineId: string, fallbackName: string): Promise<void> {
        if (this.pdfDownloadPromise) {
            return this.pdfDownloadPromise;
        }

        this.pdfDownloadPromise = this.downloadBarcodeLabelsPdfInternal(
            medicineId,
            fallbackName
        ).finally(() => {
            this.pdfDownloadPromise = null;
        });

        return this.pdfDownloadPromise;
    }

    private async downloadBarcodeLabelsPdfInternal(
        medicineId: string,
        fallbackName: string
    ): Promise<void> {
        try {
            const blob = await apiService.getBlob(
                API_ENDPOINTS.MEDICINE.BARCODE_LABELS_PDF(medicineId)
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safe = fallbackName.replace(/[^\w\s-]/g, '').trim() || 'medicine';
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
            throw new Error('Failed to download barcode labels');
        }
    }
}

export const medicineService = new MedicineService();

