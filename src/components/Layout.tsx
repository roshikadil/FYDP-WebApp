import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SuperAdminIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import BackToSuperAdminButton from './BackToSuperAdminButton';
import AuthService from '../services/AuthService';

const drawerWidth = 280;

// Define types for menu items
interface MenuItemConfig {
  text: string;
  icon: React.ReactElement;
  path: string;
}

interface MenuItemsConfig {
  [key: string]: MenuItemConfig;
}

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();

  // For now, we'll calculate unreadCount from notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
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
      citizen: '/admin',
    };
    
    const redirectTo = roleRoutes[user.role] || '/admin';
    navigate(redirectTo);
  };

  // Define all menu items with their configurations
  const menuItemsConfig: MenuItemsConfig = {
    'admin': { text: 'Admin Panel', icon: <AdminIcon />, path: '/admin' },
    'superadmin': { text: 'Super Admin', icon: <SuperAdminIcon />, path: '/superadmin' },
    // REMOVED: 'department', 'driver', 'hospital' from the sidebar
  };

  const getMenuItems = () => {
    if (!user) return [];
    
    // Based on user role, determine which dashboards they can access
    const accessibleDashboards: string[] = [];
    
    // Super Admin can ONLY access superadmin dashboard from sidebar
    if (user.role === 'superadmin') {
      accessibleDashboards.push('superadmin');
    }
    // Admin can access admin dashboard only
    else if (user.role === 'admin') {
      accessibleDashboards.push('admin');
    }
    // Department users can access department dashboard
    else if (user.role === 'department') {
      accessibleDashboards.push('department');
    }
    // Driver users can access driver dashboard
    else if (user.role === 'driver') {
      accessibleDashboards.push('driver');
    }
    // Hospital users can access hospital dashboard
    else if (user.role === 'hospital') {
      accessibleDashboards.push('hospital');
    }
    // Citizen users might not have any dashboard access
    else if (user.role === 'citizen') {
      // Citizens typically don't have dashboard access in this system
      // They only report incidents
      return [];
    }
    
    // Filter menu items based on accessible dashboards
    return accessibleDashboards
      .map((dashboardKey: string) => menuItemsConfig[dashboardKey])
      .filter((item): item is MenuItemConfig => item !== undefined);
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      background: 'transparent',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Cpath d="M0 40L40 0H20L0 20M40 40V20L20 40"/%3E%3C/g%3E%3C/svg%3E")',
        pointerEvents: 'none',
      }
    }}>
      <Toolbar sx={{ 
        minHeight: '100px !important',
        px: 3,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="KHIVISION Logo"
            sx={{
              width: 80,
              height: 'auto',
              mx: 'auto',
              mb: 1,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              }
            }}
          />
        </Box>
      </Toolbar>
      <Box sx={{ px: 2, py: 3 }}>
        <List>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={handleGoToDashboard}
              sx={{
                borderRadius: 2,
                color: 'rgba(252, 255, 250, 1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: location.pathname === '/' ? 'rgba(227, 15, 15, 0.72)' : 'transparent',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: location.pathname === '/' ? 4 : 0,
                  height: '70%',
                  backgroundColor: '#ad2a23e3',
                  borderRadius: '0 4px 4px 0',
                  transition: 'width 0.2s ease',
                },
                '&:hover': {
                  backgroundColor: location.pathname === '/' ? 'rgba(145, 33, 33, 0.76)' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  '&::before': {
                    width: 4,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: 'inherit',
                minWidth: 40,
                ml: 1,
              }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: location.pathname === '/' ? 'rgba(195, 77, 108, 0.91)' : 'rgba(255,255,255,0.05)',
                  transition: 'all 0.2s ease',
                }}>
                  <DashboardIcon fontSize="small" />
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === '/' ? 600 : 500,
                  letterSpacing: '0.01em',
                }}
              />
            </ListItemButton>
          </ListItem>
          
          {getMenuItems().map((item: MenuItemConfig) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    color: isActive ? 'white' : 'rgba(252, 255, 250, 1)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: isActive ? 'rgba(246, 92, 113, 0.88)' : 'transparent',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: isActive ? 4 : 0,
                      height: '70%',
                      backgroundColor: '#fF3B30',
                      borderRadius: '0 4px 4px 0',
                      transition: 'width 0.2s ease',
                    },
                    '&:hover': {
                      backgroundColor: isActive ? 'rgba(233, 31, 109, 0.99)' : 'rgba(219, 96, 96, 0.87)',
                      color: 'white',
                      '&::before': {
                        width: 4,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'inherit',
                    minWidth: 40,
                    ml: 1,
                  }}>
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isActive ? 'rgba(187, 24, 59, 0.76)' : 'rgba(255,255,255,0.05)',
                      transition: 'all 0.2s ease',
                    }}>
                      {React.cloneElement(item.icon as React.ReactElement<any>, { 
                        fontSize: 'small' as const 
                      })}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500,
                      letterSpacing: '0.01em',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      
      <Box sx={{ p: 2, position: 'absolute', bottom: 0, width: '100%' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
  <Box
    sx={{
      display: 'flex',
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 20% 20%, rgba(209, 74, 70, 0.74), transparent 40%),
        radial-gradient(circle at 80% 30%, rgba(129, 33, 28, 0.25), transparent 40%),
        linear-gradient(135deg, #1c1c1c 0%, #3a0d1d 40%, #7a1f1f 75%, #712622e6 100%)
      `,
      backgroundAttachment: 'fixed'
    }}
  >
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(16px)',
          color: 'white',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important', px: 3 }}>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'w' }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* ADD BACK BUTTON HERE */}
          {AuthService.shouldShowBackToSuperAdmin() && (
            <Box sx={{ mr: 2 }}>
              <BackToSuperAdminButton variant="contained" size="small" />
            </Box>
          )}
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" noWrap component="div" sx={{ 
              fontWeight: 600,
              color: 'white',
              mb: 0.5
            }}>
              {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard` : 'Dashboard'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'white' }}>
              Welcome back, {user?.name || 'User'}
              {user?.isImpersonation && (
                <span style={{ color: '#FF3B30', fontWeight: 'bold', marginLeft: '8px' }}>
                  (Impersonating)
                </span>
              )}
            </Typography>
          </Box>
          
          <IconButton
            sx={{ 
              mr: 2,
              backgroundColor: 'action.hover',
              '&:hover': {
                backgroundColor: 'action.selected',
              }
            }}
            onClick={handleNotificationMenuOpen}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: '18px',
                  minWidth: '18px',
                }
              }}
            >
              <NotificationsIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
            </Badge>
          </IconButton>
          
          <IconButton
            edge="end"
            onClick={handleProfileMenuOpen}
            sx={{ p: 0 }}
          >
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                background: 'linear-gradient(135deg, rgb(250, 44, 44) 0%, #FF3B30 100%)',
                fontWeight: 600,
                boxShadow: '0 4px 14px 0 rgba(194, 30, 30, 0.09)',
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 350,
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem>No new notifications</MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem key={notification.id} onClick={handleNotificationMenuClose}>
              <Box>
                <Typography variant="subtitle2">{notification.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="body2">{user?.name}</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            background: 'transparent',
            borderRight: '1px solid rgba(255,255,255,0.08)'
},
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'transparent',
              borderRight: '1px solid rgba(255,255,255,0.08)'
},
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
  component="main"
  sx={{
    flexGrow: 1,
    p: 0,           // padding zero
    mt: 0,          // top margin remove
    background: 'transparent',
    minHeight: '100vh',
    // width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
    width: '100%',
      // ml: { sm: `${drawerWidth}px` },
  }}
>
  {/* Inner Box for spacing content below AppBar */}
  <Box sx={{ pt: '72px', px: { xs: 2, sm: 3 } }}>
    {children || <Outlet />}
  </Box>
</Box>
      </Box>

      
  );
};

export default Layout;