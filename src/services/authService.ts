import { apiService } from './api';
import { API_ENDPOINTS } from '@/utils/constants';
import { tokenManager, AuthUser } from '@/utils/tokenManager';

export interface LoginRequest {
    employeeId: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    employeeId: string;
    employeeName: string;
    role: string;
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
    /**
     * Login user with employee ID and password
     */
    async login(credentials: LoginRequest): Promise<AuthUser> {
        try {
            const response = await apiService.post<LoginResponse>(
                API_ENDPOINTS.AUTH.LOGIN,
                credentials,
                { skipAuth: true }
            );

            // Save authentication data
            const userData: AuthUser = {
                token: response.token,
                employeeId: response.employeeId,
                employeeName: response.employeeName,
                role: response.role,
            };

            tokenManager.saveAuthData(userData);
            return userData;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Login failed. Please try again.');
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            // Call logout endpoint if available
            await apiService.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => {
                // Ignore errors if endpoint doesn't exist
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage
            tokenManager.clearAuthData();
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return tokenManager.isAuthenticated();
    }

    /**
     * Get current user
     */
    getCurrentUser(): AuthUser | null {
        return tokenManager.getUser();
    }
}

// Export singleton instance
export const authService = new AuthService();

