import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface UserAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
    className?: string;
}

/**
 * User Avatar Component
 * Displays user profile icon with initials or default icon
 */
const UserAvatar: React.FC<UserAvatarProps> = ({ 
    size = 'md', 
    showName = false,
    className = '' 
}) => {
    const { user } = useAuth();

    // Get user initials for avatar
    const getInitials = (name: string): string => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get avatar size class
    const getSizeClass = (): string => {
        switch (size) {
            case 'sm':
                return 'avatar-sm';
            case 'lg':
                return 'avatar-lg';
            default:
                return 'avatar-md';
        }
    };

    // Get color based on user role or name
    const getAvatarColor = (): string => {
        if (!user?.employeeName) return 'bg-primary';
        
        const colors = [
            'bg-primary',
            'bg-success',
            'bg-info',
            'bg-warning',
            'bg-danger',
        ];
        
        const index = user.employeeName.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (user?.employeeName) {
        return (
            <div className={`d-flex align-items-center gap-2 ${className}`}>
                <div className={`text-white avatar-text user-avatar-text ${getSizeClass()} ${getAvatarColor()}`}>
                    {getInitials(user.employeeName)}
                </div>
                {showName && (
                    <span className="fw-medium">{user.employeeName}</span>
                )}
            </div>
        );
    }

    // Default profile icon
    return (
        <div className={`d-flex align-items-center gap-2 ${className}`}>
            <div className={`text-white avatar-text user-avatar-text ${getSizeClass()} bg-primary d-flex align-items-center justify-content-center`}>
                <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            {showName && (
                <span className="fw-medium">User</span>
            )}
        </div>
    );
};

export default UserAvatar;

