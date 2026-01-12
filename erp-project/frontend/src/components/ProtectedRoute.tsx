import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { selectIsAuthenticated, selectUserRole } from '../store/slices/authSlice';
import { UserRole } from '../types';
import LoadingScreen from '../components/common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userRole = useAppSelector(selectUserRole);

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Role check if allowedRoles specified
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = getDefaultPath(userRole);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

const getDefaultPath = (role: UserRole): string => {
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

export const RoleRedirect: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userRole = useAppSelector(selectUserRole);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (userRole) {
    return <Navigate to={getDefaultPath(userRole)} replace />;
  }

  return <LoadingScreen message="Loading..." />;
};

export default ProtectedRoute;
