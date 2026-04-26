import React from 'react';
import { Button, Box } from '@mui/material';
import { AdminPanelSettings as SuperAdminIcon } from '@mui/icons-material';
import AuthService from '../services/AuthService';

interface BackToSuperAdminButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const BackToSuperAdminButton: React.FC<BackToSuperAdminButtonProps> = ({ 
  variant = 'contained',
  size = 'medium',
  fullWidth = false
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleReturnToSuperAdmin = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Returning to Super Admin...');
      console.log('📍 Current URL:', window.location.href);
      
      // Use a direct approach - force clear and redirect
      await AuthService.navigateBackToSuperAdmin();
      
      // If still loading after 3 seconds, force redirect
      setTimeout(() => {
        if (isLoading) {
          console.log('⚠️ Timeout - forcing direct redirect');
          window.location.href = '/superadmin';
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error returning to super admin:', error);
      
      // Emergency fallback - clear everything and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/superadmin';
    } finally {
      setIsLoading(false);
    }
  };

  // Only show if we're in impersonation mode
  if (!AuthService.shouldShowBackToSuperAdmin()) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant={variant}
        color="secondary"
        startIcon={<SuperAdminIcon />}
        onClick={handleReturnToSuperAdmin}
        disabled={isLoading}
        size={size}
        fullWidth={fullWidth}
        sx={{
          background: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
          },
          boxShadow: 2
        }}
      >
        {isLoading ? 'Returning...' : 'Return to Super Admin'}
      </Button>
    </Box>
  );
};

export default BackToSuperAdminButton;