import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import AuthService from "./services/AuthService";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

// Import all pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DriverIncidentDetail from "./pages/DriverIncidentDetail";
import Unauthorized from "./pages/Unauthorized";
import NavigateToDashboard from "./components/NavigateToDashboard";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#DC2626",
      light: "#EF4444",
      dark: "#991B1B",
    },
    secondary: {
      main: "#0F172A",
      light: "#1E293B",
      dark: "#020617",
    },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    button: {
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Define interface for impersonation info
interface ImpersonationInfo {
  isImpersonating: boolean;
  originalUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
}

// Impersonation Banner Component
const ImpersonationBanner = () => {
  const [isImpersonating, setIsImpersonating] = React.useState(false);
  const [impersonationInfo, setImpersonationInfo] = React.useState<ImpersonationInfo | null>(null);
  const [isReturning, setIsReturning] = React.useState(false);

  useEffect(() => {
    const checkImpersonation = () => {
      const status = AuthService.getImpersonationStatus();
      const shouldShow = AuthService.shouldShowBackToSuperAdmin();
      
      setIsImpersonating(shouldShow);
      if (status.isImpersonating) {
        setImpersonationInfo(status as ImpersonationInfo);
      }
    };

    // Initial check
    checkImpersonation();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkImpersonation();
    };

    window.addEventListener('authChange', handleAuthChange);
    
    // Check on route changes
    const handleRouteChange = () => {
      setTimeout(checkImpersonation, 100);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const handleReturnToSuperAdmin = async () => {
    try {
      setIsReturning(true);
      await AuthService.navigateBackToSuperAdmin();
    } catch (error) {
      console.error('Error returning to super admin:', error);
      window.location.href = '/superadmin';
    } finally {
      setIsReturning(false);
    }
  };

  if (!isImpersonating || !impersonationInfo) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FF3B30',
      color: 'white',
      padding: '8px 16px',
      textAlign: 'center',
      zIndex: 9999,
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ 

          background: 'white', 
          color: '#FF3B30', 
          borderRadius: '50%', 
          width: window.innerWidth < 600 ? '24px' : '20px',
          height: window.innerWidth < 600 ? '24px' : '20px',
          fontSize: window.innerWidth < 600 ? '14px' : '12px',
          marginRight: window.innerWidth < 600 ? '10px' : '8px', 
          alignItems: 'center', 
          justifyContent: 'center',
        }}>
          ⚠️
        </span>
        Viewing as <strong style={{ margin: '0 4px' }}>{impersonationInfo.currentUser?.name}</strong> ({impersonationInfo.currentUser?.role})
      </span>
      <button
        onClick={handleReturnToSuperAdmin}
        disabled={isReturning}
        style={{
          background: 'white',
          color: '#FF3B30',
          border: 'none',
          padding: '6px 16px',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
          opacity: isReturning ? 0.7 : 1,
          cursor: isReturning ? 'not-allowed' : 'pointer'
        }}
      >
        {isReturning ? (
          <>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid #ff304fcb', 
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '8px',
            }} />
            Returning...
          </>
        ) : 'Return to Super Admin'}
      </button>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Global Impersonation Status Checker
const ImpersonationStatusChecker = () => {
  useEffect(() => {
    const checkStatus = () => {
      const shouldShow = AuthService.shouldShowBackToSuperAdmin();
      
      if (shouldShow) {
  document.body.style.paddingTop = window.innerWidth < 600 ? '60px' : '48px';
} else {
  document.body.style.paddingTop = '0';
}}
    checkStatus();

    const handleAuthChange = () => {
      setTimeout(checkStatus, 100);
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      document.body.style.paddingTop = '0';
    };
  }, []);

  return null;
};

// Create protected route components with Layout
const ProtectedAdminRoute = () => (
  <PrivateRoute allowedRoles={["admin", "superadmin"]}>
    <Layout>
      <AdminDashboard />
    </Layout>
  </PrivateRoute>
);

const ProtectedDepartmentRoute = () => (
  <PrivateRoute allowedRoles={["department", "admin", "superadmin"]}>
    <Layout>
      <DepartmentDashboard />
    </Layout>
  </PrivateRoute>
);

const ProtectedDriverRoute = () => (
  <PrivateRoute allowedRoles={["driver", "admin", "superadmin"]}>
    <Layout>
      <DriverDashboard />
    </Layout>
  </PrivateRoute>
);

const ProtectedHospitalRoute = () => (
  <PrivateRoute allowedRoles={["hospital", "admin", "superadmin"]}>
    <Layout>
      <HospitalDashboard />
    </Layout>
  </PrivateRoute>
);

const ProtectedSuperAdminRoute = () => (
  <PrivateRoute allowedRoles={["superadmin"]}>
    <Layout>
      <SuperAdminDashboard />
    </Layout>
  </PrivateRoute>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ImpersonationBanner />
        <ImpersonationStatusChecker />
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Dashboard Routes */}
              <Route path="/admin" element={<ProtectedAdminRoute />} />
              <Route path="/department" element={<ProtectedDepartmentRoute />} />
              <Route path="/driver" element={<ProtectedDriverRoute />} />
              <Route path="/driver/incident/:incidentId" element={
                <PrivateRoute allowedRoles={["driver", "admin", "superadmin"]}>
                  <Layout>
                    <DriverIncidentDetail />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/hospital" element={<ProtectedHospitalRoute />} />
              <Route path="/superadmin" element={<ProtectedSuperAdminRoute />} />
              {/* Default Routes */}
              <Route path="/" element={<NavigateToDashboard />} />
              <Route path="/dashboard" element={<NavigateToDashboard />} />

              {/* Catch-all route */}
              <Route path="*" element={
                <PrivateRoute requireAuth={false}>
                  <NavigateToDashboard />
                </PrivateRoute>
              } />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;