import { apiService } from './api';
import { API_ENDPOINTS } from '@/utils/constants';

export interface Customer {
    customerId?: string;
    customerName: string;
    contactNumber: string;
    emailAddress: string | null;
    address: string;
    discount: number;
    customerStatus: 'Active' | 'Inactive';
}

export interface CreateCustomerRequest {
    customerName: string;
    contactNumber: string;
    emailAddress: string | null;
    address: string;
    discount: number;
    customerStatus: 'Active' | 'Inactive';
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {}

/**
 * Customer Service
 * Handles all customer-related API calls
 */
class CustomerService {
    /**
     * Get all customers
     */
    async getAllCustomers(): Promise<Customer[]> {
        try {
            return await apiService.get<Customer[]>(API_ENDPOINTS.CUSTOMER.BASE);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to fetch customers');
        }
    }

    /**
     * Get customer by ID
     */
    async getCustomerById(customerId: string): Promise<Customer> {
        try {
            return await apiService.get<Customer>(API_ENDPOINTS.CUSTOMER.BY_ID(customerId));
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to fetch customer with ID: ${customerId}`);
        }
    }

    /**
     * Create a new customer
     */
    async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
        try {
            return await apiService.post<Customer>(
                API_ENDPOINTS.CUSTOMER.BASE,
                customerData
            );
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create customer');
        }
    }

    /**
     * Update an existing customer
     */
    async updateCustomer(
        customerId: string,
        customerData: UpdateCustomerRequest
    ): Promise<Customer> {
        try {
            return await apiService.put<Customer>(
                API_ENDPOINTS.CUSTOMER.BY_ID(customerId),
                customerData
            );
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to update customer with ID: ${customerId}`);
        }
    }

    /**
     * Delete a customer
     */
    async deleteCustomer(customerId: string): Promise<void> {
        try {
            await apiService.delete(API_ENDPOINTS.CUSTOMER.BY_ID(customerId));
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to delete customer with ID: ${customerId}`);
        }
    }

    /**
     * Restore a deleted customer
     */
    async restoreCustomer(customerId: string): Promise<void> {
        try {
            await apiService.post<void>(API_ENDPOINTS.CUSTOMER.RESTORE(customerId), {});
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to restore customer with ID: ${customerId}`);
        }
    }
}

// Export singleton instance
export const customerService = new CustomerService();

