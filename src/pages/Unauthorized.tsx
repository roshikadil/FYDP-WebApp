import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    if (!user) return;
    
    const roleRoutes: Record<string, string> = {
      superadmin: '/superadmin',
      admin: '/admin',
      department: '/department',
      driver: '/driver',
      hospital: '/hospital',
      citizen: '/',
    };
    
    const redirectTo = roleRoutes[user.role] || '/';
    navigate(redirectTo);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
            border: '2px solid #ff6b6b',
          }}
        >
          <WarningIcon
            sx={{
              fontSize: 64,
              color: 'warning.main',
              mb: 2,
            }}
          />
          
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              mb: 2,
            }}
          >
            Access Denied
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 3,
            }}
          >
            Dear {user?.name}, you don't have permission to access this page.
            Your role ({user?.role}) doesn't have the required permissions.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleGoToDashboard}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Go to My Dashboard
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Unauthorized;