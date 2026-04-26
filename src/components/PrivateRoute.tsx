import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  allowedRoles = [],
  requireAuth = true 
}) => {
  const { user, loading, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // Show loading indicator while initializing
  if (loading || isInitializing) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If auth is not required, just render the children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If not authenticated, redirect to login with return url
  if (!isAuthenticated || !user) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role);
    
    if (!hasRole) {
      console.log(`🚫 Role not allowed: ${user.role}, redirecting to unauthorized`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has required role (or no role restriction)
  return <>{children}</>;
};

export default PrivateRoute;