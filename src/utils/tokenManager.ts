import { STORAGE_KEYS } from './constants';

export interface AuthUser {
    token: string;
    employeeId: string;
    employeeName: string;
    role: string;
}

/**
 * Token Manager - Handles JWT token storage and retrieval
 * Best practices for secure token management
 */
class TokenManager {
    /**
     * Save authentication data to localStorage
     */
    saveAuthData(userData: AuthUser): void {
        try {
            localStorage.setItem(STORAGE_KEYS.TOKEN, userData.token);
            localStorage.setItem(STORAGE_KEYS.EMPLOYEE_ID, userData.employeeId);
            localStorage.setItem(STORAGE_KEYS.EMPLOYEE_NAME, userData.employeeName);
            localStorage.setItem(STORAGE_KEYS.ROLE, userData.role);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        } catch (error) {
            console.error('Error saving auth data:', error);
            throw new Error('Failed to save authentication data');
        }
    }

    /**
     * Get JWT token from localStorage
     */
    getToken(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    /**
     * Get user data from localStorage
     */
    getUser(): AuthUser | null {
        try {
            const userStr = localStorage.getItem(STORAGE_KEYS.USER);
            if (!userStr) return null;
            return JSON.parse(userStr) as AuthUser;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    /**
     * Get employee ID from localStorage
     */
    getEmployeeId(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID);
        } catch (error) {
            console.error('Error getting employee ID:', error);
            return null;
        }
    }

    /**
     * Get employee name from localStorage
     */
    getEmployeeName(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEYS.EMPLOYEE_NAME);
        } catch (error) {
            console.error('Error getting employee name:', error);
            return null;
        }
    }

    /**
     * Get role from localStorage
     */
    getRole(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEYS.ROLE);
        } catch (error) {
            console.error('Error getting role:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired
        try {
            const payload = this.decodeToken(token);
            if (!payload || !payload.exp) return false;
            
            // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp > currentTime;
        } catch (error) {
            console.error('Error validating token:', error);
            return false;
        }
    }

    /**
     * Decode JWT token (without verification - for client-side checks only)
     * Note: This does NOT verify the token signature. Server-side verification is required.
     */
    private decodeToken(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Clear all authentication data
     */
    clearAuthData(): void {
        try {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.EMPLOYEE_ID);
            localStorage.removeItem(STORAGE_KEYS.EMPLOYEE_NAME);
            localStorage.removeItem(STORAGE_KEYS.ROLE);
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }
}

// Export singleton instance
export const tokenManager = new TokenManager();

