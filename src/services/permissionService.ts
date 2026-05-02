import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface Permission {
  permissionId: string;
  permissionName: string;
  module: string;
  description?: string;
  endpoint?: string;
  httpMethod?: string;
  grantedAt?: string;
  isActive?: boolean;
}

export interface EmployeePermission {
  permissionId: string;
  permissionName: string;
  module: string;
  grantedAt: string;
  isActive: boolean;
}

class PermissionService {
  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const data = await apiService.get<Permission[]>(
        API_ENDPOINTS.PERMISSION.ALL
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch permissions");
    }
  }

  /**
   * Get permissions for a specific employee
   */
  async getEmployeePermissions(employeeId: string): Promise<EmployeePermission[]> {
    try {
      const data = await apiService.get<EmployeePermission[]>(
        API_ENDPOINTS.PERMISSION.BY_EMPLOYEE(employeeId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Failed to fetch permissions for employee with ID: ${employeeId}`
      );
    }
  }
}

export const permissionService = new PermissionService();


