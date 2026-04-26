import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigateBasedOnRole: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes: Record<string, string> = {
    superadmin: '/superadmin',
    admin: '/admin',
    department: '/department',
    driver: '/driver',
    hospital: '/hospital',
    citizen: '/admin',
  };

  const redirectTo = roleRoutes[user.role] || '/admin';
  return <Navigate to={redirectTo} replace />;
};

export default NavigateBasedOnRole;