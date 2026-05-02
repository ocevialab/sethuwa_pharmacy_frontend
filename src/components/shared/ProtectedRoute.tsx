import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEmployeeStatusCheck } from '@/hooks/useEmployeeStatusCheck';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * Protected Route Component
 * Redirects unauthenticated users to login page
 * Also checks employee status periodically to ensure active employees only
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    
    // Periodically check if the current employee is still active
    useEmployeeStatusCheck();

    if (isLoading) {
        // Show loading spinner or skeleton
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login page with return url
        return <Navigate to="/authentication/login/cover" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

