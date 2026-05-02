import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";
import { EmployeePermission } from "./permissionService";

export interface Employee {
  employeeId?: string;
  employeeName: string;
  role: string;
  contactNumber: string;
  emailAddress: string | null;
  address: string | null;
  employeeStatus: "Active" | "Inactive";
}

export interface EmployeeWithPermissions extends Employee {
  permissions: EmployeePermission[];
}

export interface CreateEmployeeRequest {
  employeeName: string;
  role: string;
  contactNumber: string;
  emailAddress: string | null;
  address: string | null;
  employeeStatus: "Active" | "Inactive";
  password: string;
  permissionIds: string[];
}

export interface UpdateEmployeeRequest {
  employeeName: string;
  role: string;
  contactNumber: string;
  emailAddress: string | null;
  address: string | null;
  employeeStatus: "Active" | "Inactive";
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class EmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const data = await apiService.get<Employee[]>(API_ENDPOINTS.EMPLOYEE.ALL);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch employees");
    }
  }

  async getEmployeeById(employeeId: string): Promise<Employee> {
    try {
      const data = await apiService.get<Employee>(
        API_ENDPOINTS.EMPLOYEE.BY_ID(employeeId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch employee with ID: ${employeeId}`);
    }
  }

  async getEmployeeWithPermissions(
    employeeId: string
  ): Promise<EmployeeWithPermissions> {
    try {
      const data = await apiService.get<EmployeeWithPermissions>(
        API_ENDPOINTS.EMPLOYEE.WITH_PERMISSIONS(employeeId)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Failed to fetch employee with permissions for ID: ${employeeId}`
      );
    }
  }

  async createEmployee(employee: CreateEmployeeRequest): Promise<Employee> {
    try {
      const data = await apiService.post<Employee>(
        API_ENDPOINTS.EMPLOYEE.ALL,
        employee
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create employee");
    }
  }

  async updateEmployee(
    employeeId: string,
    employee: UpdateEmployeeRequest
  ): Promise<Employee> {
    try {
      const data = await apiService.put<Employee>(
        API_ENDPOINTS.EMPLOYEE.BY_ID(employeeId),
        employee
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to update employee with ID: ${employeeId}`);
    }
  }

  /**
   * Soft-delete an employee (DELETE /api/Employee/{id}).
   * - 204 No Content: success (empty body)
   * - 404: plain text "Employee not found."
   * - 500: plain text "An error occurred while deleting the employee."
   */
  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      await apiService.delete<void>(API_ENDPOINTS.EMPLOYEE.BY_ID(employeeId));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to delete employee with ID: ${employeeId}`);
    }
  }

  async changePassword(
    employeeId: string,
    payload: ChangePasswordRequest
  ): Promise<void> {
    try {
      await apiService.post(
        API_ENDPOINTS.EMPLOYEE.CHANGE_PASSWORD(employeeId),
        payload
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to change password");
    }
  }

  async updateEmployeePermissions(
    employeeId: string,
    permissionIds: string[]
  ): Promise<void> {
    try {
      await apiService.put(API_ENDPOINTS.PERMISSION.UPDATE(employeeId), {
        permissionIds,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Failed to update permissions for employee with ID: ${employeeId}`
      );
    }
  }

  async deactivateAllExceptOwner(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.EMPLOYEE.DEACTIVATE_ALL_EXCEPT_OWNER);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to deactivate all employees except owner");
    }
  }
}

export const employeeService = new EmployeeService();
