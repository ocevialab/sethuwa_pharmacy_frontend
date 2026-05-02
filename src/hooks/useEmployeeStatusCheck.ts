import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { tokenManager } from '@/utils/tokenManager';
import { employeeService } from '@/services/employeeService';

/**
 * Hook to periodically check if the current employee's status is still active
 * If the employee is deactivated, automatically logs them out
 */
export const useEmployeeStatusCheck = () => {
    const { logout } = useAuth();

    useEffect(() => {
        const checkEmployeeStatus = async () => {
            const currentUser = tokenManager.getUser();
            if (!currentUser) return;

            try {
                const employee = await employeeService.getEmployeeById(currentUser.employeeId);
                
                // If employee is inactive, log them out
                if (employee.employeeStatus === 'Inactive') {
                    tokenManager.clearAuthData();
                    logout();
                }
            } catch (error) {
                // If we get 401, the token is already invalidated on backend
                // The API service will handle it automatically
                // For other errors, we don't want to log out the user
                if (error instanceof Error && error.message.includes('401')) {
                    // Token already invalidated, let the API service handle it
                    return;
                }
                console.error('Error checking employee status:', error);
            }
        };

        // Check immediately on mount
        checkEmployeeStatus();

        // Check every 5 minutes as a safety net
        const interval = setInterval(checkEmployeeStatus, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [logout]);
};


