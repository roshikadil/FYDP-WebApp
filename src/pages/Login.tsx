import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Container,
  Grid,
  Divider,
  Card,
  CardContent,
  alpha,
  IconButton,
  Fade,
  Zoom,
  Slide,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Security,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  RocketLaunch,
  TrendingUp,
  CheckCircle,
  ArrowForward,
  Fingerprint,
  SmartToy,
  Warning as WarningIcon,
  Timeline,
} from '@mui/icons-material';
import { keyframes, styled } from '@mui/material/styles';

// Styled Components
const FloatingAnimation = styled(Box)(({ }) => ({
  animation: `${keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  `} 6s ease-in-out infinite`,
}));

const GradientButton = styled(Button)(() => ({
  background: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)',
  color: 'white',
  fontWeight: 700,
  padding: '12px 28px',
  borderRadius: '12px',
  boxShadow: '0 6px 24px rgba(255, 59, 48, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 32px rgba(255, 59, 48, 0.4)',
    background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  fontSize: '1rem',
}));

const GlassCard = styled(Card)(() => ({
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  overflow: 'hidden',
}));

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  // Get the redirect path from location state or default to home

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setError('Please enter both email and password.');
        return;
      }

      console.log('🔐 Attempting login for:', email);
      
      // Call the login function from AuthContext
      const result = await login(email, password);
      
      if (result.success) {
        // Get the user from the result
        const user = result.user;
        
        // Navigate based on role
        const roleRoutes: Record<string, string> = {
          superadmin: '/superadmin',
          admin: '/admin',
          department: '/department',
          driver: '/driver',
          hospital: '/hospital',
          citizen: '/admin',
        };
        
        const redirectTo = roleRoutes[user.role] || '/admin';
        console.log(`✅ Login successful, navigating to: ${redirectTo}`);
        navigate(redirectTo, { replace: true });
      }
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      // Show specific error messages for common failures
      const rawMsg: string = err.message || '';
      let displayError = 'Login failed. Please check your credentials and try again.';
      if (rawMsg.toLowerCase().includes('password') || rawMsg.toLowerCase().includes('invalid') || rawMsg.toLowerCase().includes('incorrect')) {
        displayError = 'Incorrect password. Please try again.';
      } else if (rawMsg.toLowerCase().includes('user') || rawMsg.toLowerCase().includes('email') || rawMsg.toLowerCase().includes('not found')) {
        displayError = 'No account found with this email address.';
      } else if (rawMsg.toLowerCase().includes('network') || rawMsg.toLowerCase().includes('connect')) {
        displayError = 'Cannot connect to server. Please check your internet connection.';
      } else if (rawMsg.length > 0) {
        displayError = rawMsg;
      }
      setError(displayError);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <SmartToy />, title: 'AI Incident Detection', desc: 'Real-time AI-powered incident recognition' },
    { icon: <Timeline />, title: 'Live Tracking', desc: 'Real-time emergency vehicle tracking' },
    { icon: <WarningIcon />, title: 'Rapid Response', desc: 'Average response time under 8 minutes' },
    { icon: <TrendingUp />, title: 'Analytics Dashboard', desc: 'Comprehensive incident analytics' },
  ];

  const FloatingIcon = ({ icon, position }: { icon: React.ReactNode, position: any }) => (
    <FloatingAnimation sx={position}>
      {icon}
    </FloatingAnimation>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A0F0F 0%, #2C1A1A 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 20% 50%, ${alpha('#FF3B30', 0.2)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${alpha('#DC2626', 0.15)} 0%, transparent 50%)`,
        },
      }}
    >
      {/* Animated Background Elements */}
      <FloatingIcon
        icon={<WarningIcon sx={{ fontSize: 48, color: alpha('#FF3B30', 0.2) }} />}
        position={{ position: 'absolute', top: 30, left: 30 }}
      />
      
      <FloatingIcon
        icon={<Security sx={{ fontSize: 32, color: alpha('#DC2626', 0.15) }} />}
        position={{ position: 'absolute', bottom: 80, right: 80 }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container sx={{ minHeight: '100vh', py: { xs: 2, md: 3 } }}>
          {/* Left Side - Branding & Features */}
          <Grid item xs={12} md={6} lg={7}>
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: 2, md: 3, lg: 4 },
              py: { xs: 2, md: 3 }
            }}>
              <Slide direction="right" in timeout={800}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      component="img"
                      src="/logo.png"
                      alt="KHIVISION Logo"
                      sx={{
                        height: { xs: 80, md: 100 },
                        mr: 2,
                        filter: 'drop-shadow(0 0 12px rgba(255, 59, 48, 0.4))',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}
                    />
                    <Box>
                      <Typography
                        variant="h1"
                        sx={{
                          fontWeight: 900,
                          fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem', lg: '3rem' },
                          lineHeight: 1.1,
                          background: 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                        }}
                      >
                        KHIVISION
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#FF3B30',
                          fontWeight: 800,
                          letterSpacing: 2,
                          fontSize: '0.8rem',
                          mt: -0.5
                        }}
                      >
                        AI ACCIDENT DETECTION
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      mb: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    Incident Detection & Reporting System
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 400,
                      color: alpha('#FFFFFF', 0.9),
                      mb: 4,
                      maxWidth: 600,
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    AI-powered emergency response platform for rapid incident detection, 
                    real-time tracking, and coordinated emergency management.
                  </Typography>

                  {/* Features Grid */}
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    {features.map((feature, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Fade in timeout={1000 + index * 200}>
                          <GlassCard>
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <Box sx={{ 
                                  p: 1, 
                                  borderRadius: 2,
                                  background: `linear-gradient(135deg, ${alpha('#FF3B30', 0.2)} 0%, transparent 100%)`,
                                  mr: 1.5,
                                  border: '1px solid rgba(255, 59, 48, 0.3)',
                                }}>
                                  {React.cloneElement(feature.icon as React.ReactElement<any>, { 
                                    sx: { color: '#FF3B30', fontSize: 20 }
                                  })}
                                </Box>
                                <Typography variant="h6" sx={{ 
                                  color: 'white', 
                                  fontWeight: 600, 
                                  fontSize: '0.95rem',
                                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                                }}>
                                  {feature.title}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ 
                                color: alpha('#FFFFFF', 0.8), 
                                fontSize: '0.8rem',
                                textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                              }}>
                                {feature.desc}
                              </Typography>
                            </CardContent>
                          </GlassCard>
                        </Fade>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {[
                      { 
                        value: '99.8%', 
                        label: 'System Uptime', 
                        icon: <CheckCircle sx={{ color: '#FF3B30', fontSize: 20, filter: 'drop-shadow(0 0 4px rgba(255, 59, 48, 0.5))' }} /> 
                      },
                      { 
                        value: '< 8min', 
                        label: 'Avg Response', 
                        icon: <RocketLaunch sx={{ color: '#DC2626', fontSize: 20, filter: 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.5))' }} /> 
                      },
                      { 
                        value: '24/7', 
                        label: 'Monitoring', 
                        icon: <Timeline sx={{ color: '#FF6B6B', fontSize: 20, filter: 'drop-shadow(0 0 4px rgba(255, 107, 107, 0.5))' }} /> 
                      },
                    ].map((stat, index) => (
                      <Fade in timeout={1600 + index * 200} key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {stat.icon}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="h5" sx={{ 
                              color: 'white', 
                              fontWeight: 700, 
                              fontSize: '1.1rem',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: alpha('#FFFFFF', 0.8), 
                              fontSize: '0.75rem',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                            }}>
                              {stat.label}
                            </Typography>
                          </Box>
                        </Box>
                      </Fade>
                    ))}
                  </Box>
                </Box>
              </Slide>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6} lg={5}>
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              px: { xs: 2, md: 3 }
            }}>
              <Zoom in timeout={1000}>
                <Paper
                  elevation={24}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: 'rgba(26, 15, 15, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 59, 48, 0.3)',
                    maxWidth: 440,
                    width: '100%',
                    transform: isHovered ? 'translateY(-4px)' : 'none',
                    transition: 'transform 0.3s ease',
                    boxShadow: '0 20px 40px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Header */}
                  <Box textAlign="center" mb={3}>
                      <Box
                        component="img"
                        src="/logo.png"
                        alt="Logo"
                        sx={{ 
                          height: 110, 
                          width: 'auto',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}
                      />
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 1, 
                      fontSize: '1.5rem',
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #FF3B30 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Welcome Back
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: alpha('#FFFFFF', 0.8), 
                      fontSize: '0.9rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                    }}>
                      Sign in to your KHIVISION dashboard
                    </Typography>
                  </Box>

                  {/* Removed Backend Status Check Section */}

                  {/* Login Form */}
                  {error && (
                    <Alert
                      severity="error"
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2, 
                        fontSize: '0.875rem',
                        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        color: '#FF6B6B',
                      }}
                      onClose={() => setError('')}
                    >
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      margin="normal"
                      required
                      disabled={loading}
                      size="small"
                      InputProps={{
                        sx: { 
                          borderRadius: 2, 
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.9rem',
                          color: 'white',
                          border: '1px solid rgba(255, 59, 48, 0.3)',
                          '&:hover': {
                            borderColor: 'rgba(255, 59, 48, 0.5)',
                          },
                          '&.Mui-focused': {
                            borderColor: '#FF3B30',
                            boxShadow: '0 0 0 2px rgba(255, 59, 48, 0.2)',
                          },
                        },
                        startAdornment: (
                          <InputAdornment position="start">
                            <Fingerprint sx={{ fontSize: 18, color: alpha('#FF6B6B', 0.7) }} />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        sx: { 
                          fontSize: '0.9rem',
                          color: alpha('#FFFFFF', 0.7),
                          '&.Mui-focused': {
                            color: '#FF6B6B',
                          },
                        }
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      margin="normal"
                      required
                      disabled={loading}
                      size="small"
                      InputProps={{
                        sx: { 
                          borderRadius: 2, 
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.9rem',
                          color: 'white',
                          border: '1px solid rgba(255, 59, 48, 0.3)',
                          '&:hover': {
                            borderColor: 'rgba(255, 59, 48, 0.5)',
                          },
                          '&.Mui-focused': {
                            borderColor: '#FF3B30',
                            boxShadow: '0 0 0 2px rgba(255, 59, 48, 0.2)',
                          },
                        },
                        startAdornment: (
                          <InputAdornment position="start">
                            <Security sx={{ fontSize: 18, color: alpha('#FF6B6B', 0.7) }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                              sx={{ color: alpha('#FF6B6B', 0.7) }}
                            >
                              {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        sx: { 
                          fontSize: '0.9rem',
                          color: alpha('#FFFFFF', 0.7),
                          '&.Mui-focused': {
                            color: '#FF6B6B',
                          },
                        }
                      }}
                    />

                    <GradientButton
                      type="submit"
                      fullWidth
                      size="medium"
                      disabled={loading}
                      sx={{ 
                        mt: 3,
                        '&:disabled': {
                          background: 'rgba(255, 59, 48, 0.3)',
                          color: alpha('#FFFFFF', 0.5),
                        }
                      }}
                      endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                    >
                      {loading ? (
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                      ) : (
                        'Access Dashboard'
                      )}
                    </GradientButton>
                  </Box>

                  <Divider sx={{ 
                    my: 3,
                    borderColor: 'rgba(255, 59, 48, 0.3)',
                  }}>
                    <Typography variant="body2" sx={{ 
                      px: 1.5, 
                      fontSize: '0.8rem',
                      color: alpha('#FFFFFF', 0.6),
                      textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                    }}>
                      Database Authentication
                    </Typography>
                  </Divider>

                  <Typography variant="body2" align="center" sx={{ 
                    mb: 1.5, 
                    fontSize: '0.8rem',
                    color: alpha('#FFFFFF', 0.7),
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                  }}>
                    Please use your registered email and password to login.
                    Contact administrator if you need account access.
                  </Typography>

                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(255, 59, 48, 0.1)',
                      border: '1px solid rgba(255, 59, 48, 0.2)',
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography variant="caption" align="center" sx={{ 
                      fontSize: '0.75rem',
                      color: alpha('#FF6B6B', 0.8),
                      textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                    }}>
                      Ensure your credentials match the users registered in the database.
                    </Typography>
                  </Paper>
                </Paper>
              </Zoom>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* CSS Animations - Removed unused animations */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default Login;