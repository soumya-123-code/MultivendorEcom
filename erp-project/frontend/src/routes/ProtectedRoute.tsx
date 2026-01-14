import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts';
import { UserRole } from '../types';
import LoadingScreen from '../components/common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
 

  const { isAuthenticated, user, isLoading } = useAuth();

if (isLoading) {
  return <LoadingScreen />;
}

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard based on role
    const redirectPath = getDefaultDashboard(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

// Helper function to get default dashboard based on role
export const getDefaultDashboard = (role: UserRole): string => {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'warehouse':
    case 'staff':
      return '/warehouse/dashboard';
    case 'delivery_agent':
      return '/delivery/dashboard';
    default:
      return '/';
  }
};

export default ProtectedRoute;
