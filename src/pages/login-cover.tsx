import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoginForm from '@/components/authentication/LoginForm';
import { useAuth } from '@/context/AuthContext';

const LoginCover = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string>("");

    // Check for session expired message
    useEffect(() => {
        const sessionExpired = sessionStorage.getItem("sessionExpired");
        const expiredMessage = sessionStorage.getItem("sessionExpiredMessage");
        
        if (sessionExpired === "true" && expiredMessage) {
            // Clear the flag
            sessionStorage.removeItem("sessionExpired");
            sessionStorage.removeItem("sessionExpiredMessage");
            
            // Set the message to pass to LoginForm
            setSessionExpiredMessage(expiredMessage);
        }
    }, []);

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
        const from = (location.state as any)?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    return (
        <main className="auth-cover-wrapper">
            <div className="auth-cover-content-inner">
                <div className="auth-cover-content-wrapper">
                    <div className="auth-img">
                        <img src="/images/loginbgimage.png" alt="img" className="img-fluid" />
                    </div>
                </div>
            </div>
            <div className="auth-cover-sidebar-inner">
                <div className="auth-cover-card-wrapper">
                    <div className="auth-cover-card p-sm-5">
                        <div className="wd-50 mb-5">
                            <img src="/images/logo/lgo.png" alt='Pharmacy Logo' className="img-fluid" style={{ maxHeight: '60px', width: 'auto' }} />
                        </div>
                        <LoginForm initialError={sessionExpiredMessage} />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LoginCover;