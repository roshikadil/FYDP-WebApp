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

const DashboardDisabled: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              color: 'text.primary',
              mb: 2,
            }}
          >
            Dashboard Access Disabled
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 3,
            }}
          >
            Dear {user?.name}, access to your {user?.role} dashboard has been temporarily disabled 
            by the system administrator. Please contact support or try again later.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{
                backgroundColor: '#ff3b30',
                '&:hover': {
                  backgroundColor: '#d32f2f',
                },
              }}
            >
              Logout
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardDisabled;