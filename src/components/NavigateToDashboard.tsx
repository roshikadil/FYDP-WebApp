import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const NavigateToDashboard: React.FC = () => {
  const { user, loading, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 NavigateToDashboard: Checking auth state...', {
      loading,
      isInitializing,
      user: user?.email,
      isAuthenticated,
      currentPath: location.pathname
    });
  }, [user, loading, isAuthenticated, isInitializing, location]);

  // Show loading spinner while checking authentication
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

  // If user is authenticated, redirect to their dashboard
  if (isAuthenticated && user) {
    console.log('✅ User authenticated, redirecting to dashboard...');
    
    // Define role-based dashboard routes
    const roleRoutes: Record<string, string> = {
      superadmin: '/superadmin',
      admin: '/admin',
      department: '/department',
      driver: '/driver',
      hospital: '/hospital',
      citizen: '/admin',
    };
    
    // Get the appropriate dashboard route
    const redirectTo = roleRoutes[user.role] || '/admin';
    
    console.log(`🎯 Redirecting to: ${redirectTo} (role: ${user.role})`);
    return <Navigate to={redirectTo} replace />;
  }

  // No user found, redirect to login
  console.log('❌ No user found, redirecting to login');
  return <Navigate to="/login" replace />;
};

export default NavigateToDashboard;