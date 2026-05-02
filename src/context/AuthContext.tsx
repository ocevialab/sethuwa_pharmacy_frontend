import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, LoginRequest } from '@/services/authService';
import { tokenManager, AuthUser } from '@/utils/tokenManager';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state on mount
    useEffect(() => {
        const initializeAuth = () => {
            try {
                if (tokenManager.isAuthenticated()) {
                    const userData = tokenManager.getUser();
                    setUser(userData);
                } else {
                    tokenManager.clearAuthData();
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                tokenManager.clearAuthData();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for session expiration events from API service
        const handleSessionExpired = () => {
            tokenManager.clearAuthData();
            setUser(null);
        };

        window.addEventListener("sessionExpired", handleSessionExpired);

        return () => {
            window.removeEventListener("sessionExpired", handleSessionExpired);
        };
    }, []);

    const login = async (credentials: LoginRequest) => {
        try {
            setIsLoading(true);
            const userData = await authService.login(credentials);
            setUser(userData);
            // Navigation will be handled by the component calling login
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await authService.logout();
            setUser(null);
            // Navigation will be handled by the component calling logout
            window.location.href = '/authentication/login/cover';
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local state even if API call fails
            tokenManager.clearAuthData();
            setUser(null);
            window.location.href = '/authentication/login/cover';
        } finally {
            setIsLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user && tokenManager.isAuthenticated(),
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

