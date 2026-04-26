import React, { useState, useEffect } from "react";
import {
  Grid,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Paper,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination,
  CircularProgress,
  Snackbar,
  Fab,
  Badge,
  ListItemIcon,
  Switch,
  Menu,
} from "@mui/material";
import {
  People as PeopleIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  LocalHospital as HospitalIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Block as BlockIcon,
  Analytics as AnalyticsIcon,
  AdminPanelSettings as AdminIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  GetApp as ExportIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  VpnKey as KeyIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  WarningAmber as WarningAmberIcon,
  History as HistoryIcon,
  LocalShipping as ShippingIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  DirectionsCarFilled as CarIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  KeyboardBackspace as BackIcon,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Legend,
  ArcElement,
} from "chart.js";
import { useAuth } from "../contexts/AuthContext";
import SuperAdminService, {
  SystemStats,
  Activity,
} from "../services/SuperAdminService";
import AuthService, { User } from "../services/AuthService";
import { useNavigate } from "react-router-dom";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Legend,
  ArcElement
);

interface DashboardAccess {
  admin: boolean;
  hospital: boolean;
  department: boolean;
  driver: boolean;
}

const SuperAdminDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loginAsUserDialog, setLoginAsUserDialog] = useState(false);
  const [userToLoginAs, setUserToLoginAs] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [localAccess, setLocalAccess] = useState<DashboardAccess>({
    admin: true,
    hospital: true,
    department: true,
    driver: true,
  });
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedActionUser, setSelectedActionUser] = useState<User | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [refreshPulse, setRefreshPulse] = useState(false);

  // New states for driver incident viewing
  const [driverIncidents, setDriverIncidents] = useState<any[]>([]);
  const [currentViewingDriver, setCurrentViewingDriver] = useState<User | null>(null);
  const [driverTabValue, setDriverTabValue] = useState(0);
  const [isLoadingDriverIncidents, setIsLoadingDriverIncidents] = useState(false);

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalIncidents: 0,
    totalDepartments: 0,
    totalHospitals: 0,
    activeIncidents: 0,
    pending: 0,
    completed: 0,
    systemUptime: "0%",
    avgResponseTime: "0 mins",
    successRate: "0%",
    activeUsers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("Today");

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    cnic: "",
    ambulanceService: "",
    drivingLicense: "",
    hospital: "",
    department: "",
    role: "citizen",
    password: "123456",
  });

  // Check impersonation status
  const isImpersonating = AuthService.isImpersonationSession();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadSystemStats(),
        loadRecentActivities(),
      ]);
      showSnackbar("Data loaded successfully", "success");
    } catch (error) {
      console.error("Error loading super admin data:", error);
      showSnackbar("Error loading data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validateUserData = (
    user: Partial<User>
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!user.name?.trim()) errors.push("Name is required");
    if (!user.email?.trim()) errors.push("Email is required");
    if (!user.phone?.trim()) errors.push("Phone is required");
    if (!user.cnic?.trim()) errors.push("CNIC is required");
    if (!user.role) errors.push("Role is required");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user.email && !emailRegex.test(user.email)) {
      errors.push("Invalid email format");
    }

    // Phone validation (basic)
    if (user.phone && !/^\d{10,15}$/.test(user.phone.replace(/\D/g, ""))) {
      errors.push("Phone number must be 10-15 digits");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Login as user function
  const handleLoginAsUser = async (user: User) => {
    try {
      setIsLoggingIn(true);
      console.log(`👑 Super Admin logging in as: ${user.name} (${user.email})`);

      // Use the impersonate endpoint
      const response = await AuthService.impersonateUser(user.id);
      
      if (response.success) {
        showSnackbar(`Now logged in as ${user.name} (${user.role})`, "success");
        
        // Navigate to the appropriate dashboard based on the user's role
        setTimeout(() => {
          const roleRoutes: Record<string, string> = {
            'admin': '/admin',
            'department': '/department',
            'driver': '/driver',
            'hospital': '/hospital',
            'citizen': '/admin'
          };
          
          const dashboardPath = roleRoutes[user.role] || '/admin';
          navigate(dashboardPath);
        }, 1000);
      } else {
        showSnackbar(`Failed to login as ${user.name}: ${response.error || 'Unknown error'}`, "error");
      }
    } catch (error: any) {
      console.error('❌ Error logging in as user:', error);
      showSnackbar(`Failed to login as user: ${error.message}`, "error");
    } finally {
      setIsLoggingIn(false);
      setLoginAsUserDialog(false);
    }
  };

  // Return to super admin
  const handleReturnToSuperAdmin = async () => {
    try {
      setIsLoggingIn(true);
      console.log('🔄 Return to Super Admin clicked...');
      
      // First, check current auth status
      const currentUser = AuthService.getStoredUser();
      console.log('👤 Current user before return:', currentUser?.email);
      
      // Use AuthService method
      await AuthService.navigateBackToSuperAdmin();
      
      // Note: The redirect happens in the AuthService method
      // Don't set loading to false here as we're redirecting
      
    } catch (error) {
      console.error('💥 Error in return handler:', error);
      setIsLoggingIn(false);
      
      // Fallback: Clear everything and go to superadmin
      localStorage.clear();
      window.location.href = '/superadmin';
    }
  };

  // Open login confirmation dialog
  const handleOpenLoginAsDialog = (user: User) => {
    // Check if user is eligible for login
    const eligibleRoles = ['admin', 'department', 'driver', 'hospital'];
    
    if (!eligibleRoles.includes(user.role)) {
      showSnackbar(`Cannot login as ${user.role} role`, "error");
      return;
    }
    
    if (user.status !== 'active') {
      showSnackbar(`User ${user.name} is not active`, "error");
      return;
    }
    
    setUserToLoginAs(user);
    setLoginAsUserDialog(true);
  };

  const handleViewAllIncidents = async () => {
    try {
      setIsLoadingDriverIncidents(true);
      
      // Use the updated SuperAdminService method to get all driver incidents
      const incidentsResponse = await SuperAdminService.getAllDriverIncidents();
      
      if (incidentsResponse.success) {
        setDriverIncidents(incidentsResponse.data);
        setCurrentViewingDriver(null);
        
        // Calculate statistics
        const completedCount = incidentsResponse.data.filter((i: any) => i.status === 'completed').length;
        const activeCount = incidentsResponse.data.filter((i: any) => 
          i.status === 'assigned' || i.status === 'in_progress'
        ).length;
        
        showSnackbar(
          `Loaded ${incidentsResponse.data.length} driver incidents (${activeCount} active, ${completedCount} completed)`, 
          "success"
        );
        
        console.log('📊 Incidents loaded:', {
          total: incidentsResponse.data.length,
          completed: completedCount,
          active: activeCount,
          drivers: drivers.length
        });
        
        // Debug log for incident details
        incidentsResponse.data.forEach((incident: any, index: number) => {
          console.log(`Incident ${index + 1}:`, {
            id: incident.id,
            status: incident.status,
            driverName: incident.driverName,
            description: incident.description?.substring(0, 30)
          });
        });
      } else {
        showSnackbar(incidentsResponse.error || 'Failed to load incidents', "error");
        setDriverIncidents([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading all incidents:', error);
      showSnackbar('Failed to load incidents: ' + error.message, "error");
      setDriverIncidents([]);
    } finally {
      setIsLoadingDriverIncidents(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await SuperAdminService.getAllUsers();
      setUsers(usersData);

      // Filter users by role
      const driversData = usersData.filter((u) => u.role === "driver");
      const departmentsData = usersData.filter((u) => u.role === "department");
      const hospitalsData = usersData.filter((u) => u.role === "hospital");
      const adminsData = usersData.filter(
        (u) => u.role === "admin" || u.role === "superadmin"
      );

      setDrivers(driversData);
      setDepartments(departmentsData);
      setHospitals(hospitalsData);
      setAdmins(adminsData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadSystemStats = async () => {
    try {
      const stats = await SuperAdminService.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error("Error loading system stats:", error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const activities = await SuperAdminService.getRecentActivities();
      setRecentActivities(activities);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const refreshData = async () => {
    setRefreshPulse(true);
    await loadAllData();
    setTimeout(() => setRefreshPulse(false), 1000);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, 3000);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.role?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.phone?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserDialog(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewUserDialog(true);
  };

  const handleAddUser = () => {
    setNewUser({
      name: "",
      email: "",
      phone: "",
      cnic: "",
      ambulanceService: "",
      drivingLicense: "",
      hospital: "",
      department: "",
      role: "citizen",
      password: "123456",
    });
    setAddUserDialog(true);
  };

  const handleSaveNewUser = async () => {
    try {
      // Validate required fields
      if (
        !newUser.name ||
        !newUser.email ||
        !newUser.phone ||
        !newUser.cnic ||
        !newUser.role
      ) {
        showSnackbar("Please fill all required fields", "error");
        return;
      }

      const userData: Partial<User> = {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        cnic: newUser.cnic,
        password: newUser.password,
        role: newUser.role as User["role"],
        status: "active" as const,
      };

      // Add role-specific fields
      if (newUser.role === "driver") {
        userData.department = newUser.department || "Edhi Foundation";
        userData.ambulanceService =
          newUser.ambulanceService || "Edhi Foundation";
        userData.drivingLicense = newUser.drivingLicense || "";
      } else if (newUser.role === "department") {
        userData.department = newUser.department || "Edhi Foundation";
      } else if (newUser.role === "hospital") {
        userData.hospital = newUser.hospital || "Jinnah Hospital";
      }

      const createdUser = await SuperAdminService.createUser(userData);

      if (createdUser) {
        showSnackbar(`User ${newUser.name} created successfully`, "success");
        setAddUserDialog(false);
        loadUsers();
      } else {
        showSnackbar("Failed to create user", "error");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      showSnackbar("Error creating user", "error");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user ${user.name}?`)) return;

    try {
      const success = await SuperAdminService.deleteUser(user.id);
      if (success) {
        showSnackbar(`User ${user.name} deleted successfully`, "success");
        loadUsers();
      } else {
        showSnackbar("Failed to delete user", "error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showSnackbar("Error deleting user", "error");
    }
  };

  const handleRestrictUser = async (user: User, days: number) => {
    try {
      const restrictedUser = await SuperAdminService.restrictUser(
        user.id,
        days,
        "System restriction"
      );
      if (restrictedUser) {
        showSnackbar(
          `User ${user.name} restricted for ${days} days`,
          "success"
        );
        loadUsers();
      } else {
        showSnackbar("Failed to restrict user", "error");
      }
    } catch (error) {
      console.error("Error restricting user:", error);
      showSnackbar("Error restricting user", "error");
    }
  };

  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    user: User
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedActionUser(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedActionUser(null);
  };

  const handleExportData = () => {
    SuperAdminService.exportUsersToCSV(users);
    showSnackbar("Data exported successfully", "success");
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRoleColor = (role: string) => {
    const colors: {
      [key: string]:
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";
    } = {
      superadmin: "secondary",
      admin: "error",
      department: "primary",
      driver: "info",
      hospital: "success",
      citizen: "default",
    };
    return colors[role] || "default";
  };

  const getStatusColor = (status: string) => {
    const colors: {
      [key: string]:
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";
    } = {
      active: "success",
      inactive: "warning",
      suspended: "error",
    };
    return colors[status] || "default";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
      case "admin":
        return <AdminIcon />;
      case "department":
        return <BusinessIcon />;
      case "driver":
        return <CarIcon />;
      case "hospital":
        return <HospitalIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Stats cards data
  const statCards = [
    {
      title: "Total Users",
      value: systemStats.totalUsers,
      color: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
      icon: <PeopleIcon sx={{ color: "#fff", fontSize: "2rem" }} />,
    },
    {
      title: "Total Incidents",
      value: systemStats.totalIncidents,
      color: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
      icon: <DashboardIcon sx={{ color: "#fff", fontSize: "2rem" }} />,
    },
    {
      title: "Departments",
      value: systemStats.totalDepartments,
      color: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
      icon: <BusinessIcon sx={{ color: "#fff", fontSize: "2rem" }} />,
    },
    {
      title: "Hospitals",
      value: systemStats.totalHospitals,
      color: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
      icon: <HospitalIcon sx={{ color: "#fff", fontSize: "2rem" }} />,
    },
  ];

  const dashboardConfigs = [
    {
      key: "admin" as keyof DashboardAccess,
      title: "Admin Dashboard",
      description: "Control access to the Admin dashboard",
      icon: <AdminIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      color: "#1976d2",
    },
    {
      key: "hospital" as keyof DashboardAccess,
      title: "Hospital Dashboard",
      description: "Control access to the Hospital dashboard",
      icon: <HospitalIcon sx={{ fontSize: 40, color: "success.main" }} />,
      color: "#2e7d32",
    },
    {
      key: "department" as keyof DashboardAccess,
      title: "Department Dashboard",
      description: "Control access to the Department dashboard",
      icon: <BusinessIcon sx={{ fontSize: 40, color: "warning.main" }} />,
      color: "#ed6c02",
    },
    {
      key: "driver" as keyof DashboardAccess,
      title: "Driver Dashboard",
      description: "Control access to the Driver dashboard",
      icon: <CarIcon sx={{ fontSize: 40, color: "info.main" }} />,
      color: "#0288d1",
    },
  ];

  // Quick stats grid data
  const quickStats = [
    { title: "Users", value: users.length, icon: PeopleIcon, color: "#3B82F6" },
    {
      title: "Drivers",
      value: drivers.length,
      icon: ShippingIcon,
      color: "#10B981",
    },
    {
      title: "Departments",
      value: departments.length,
      icon: BusinessIcon,
      color: "#8B5CF6",
    },
    {
      title: "Hospitals",
      value: hospitals.length,
      icon: HospitalIcon,
      color: "#EF4444",
    },
    {
      title: "Admins",
      value: admins.length,
      icon: AdminIcon,
      color: "#F59E0B",
    },
    {
      title: "Pending Incidents",
      value: systemStats.pending,
      icon: PendingIcon,
      color: "#F59E0B",
    },
  ];

  // Role overview data
  const roleStats = [
    {
      title: "Citizens/Reporters",
      total: users.filter((u) => u.role === "citizen").length,
      active: users.filter((u) => u.role === "citizen" && u.status === "active")
        .length,
      color: "#3B82F6",
      icon: PersonIcon,
    },
    {
      title: "Drivers",
      total: drivers.length,
      active: drivers.filter((d) => d.status === "active").length,
      color: "#10B981",
      icon: CarIcon,
    },
    {
      title: "Departments",
      total: departments.length,
      active: departments.filter((d) => d.status === "active").length,
      color: "#8B5CF6",
      icon: BusinessIcon,
    },
    {
      title: "Hospitals",
      total: hospitals.length,
      active: hospitals.filter((h) => h.status === "active").length,
      color: "#EF4444",
      icon: HospitalIcon,
    },
    {
      title: "Admins",
      total: admins.length,
      active: admins.filter((a) => a.status === "active").length,
      color: "#F59E0B",
      icon: AdminIcon,
    },
  ];

  // Handle navigation to different dashboards
  const handleNavigateToDashboard = (dashboardType: string) => {
    switch (dashboardType) {
      case 'admin':
        navigate('/admin');
        break;
      case 'department':
        navigate('/department');
        break;
      case 'driver':
        navigate('/driver');
        break;
      case 'hospital':
        navigate('/hospital');
        break;
      default:
        navigate('/superadmin');
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "grey.50", p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mb: 4,
          position: "relative",
          width: "100%"
        }}
      >
        <Box sx={{ textAlign: "center" }}>
    <Typography variant="h3" fontWeight={700} color="text.primary">
      {isImpersonating ? 'User Dashboard' : 'SUPERADMIN DASHBOARD'}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {isImpersonating 
        ? `Viewing as ${currentUser?.name} (${currentUser?.role})`
        : 'Complete System Management'}
    </Typography>
  </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* Show "Return to Super Admin" button if currently impersonating */}
          {isImpersonating && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<BackIcon />}
              onClick={handleReturnToSuperAdmin}
              disabled={isLoggingIn}
              sx={{
                background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)",
                color: "white",
                "&:hover": {
                  background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)",
                },
              }}
            >
              {isLoggingIn ? 'Returning...' : 'Return to Super Admin'}
            </Button>
          )}
          <Badge badgeContent={systemStats.pending} color="error">
            <IconButton>
              <NotificationsIcon />
            </IconButton>
          </Badge>
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Impersonation Alert Banner */}
      {isImpersonating && (
        <Alert
          severity="info"
          icon={<AdminIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleReturnToSuperAdmin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Returning...' : 'Return Now'}
            </Button>
          }
        >
          <Typography fontWeight={600}>You are viewing as another user</Typography>
          <Typography variant="body2">
            Currently impersonating: <strong>{currentUser?.name}</strong> ({currentUser?.role})
          </Typography>
        </Alert>
      )}

      {/* Alert Banner for High System Activity */}
      {!isImpersonating && systemStats.activeIncidents > 5 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <IconButton color="inherit" size="small">
              <ArrowForwardIcon />
            </IconButton>
          }
        >
          <Typography fontWeight={600}>High System Activity</Typography>
          <Typography variant="body2">
            {systemStats.activeIncidents} active incidents requiring attention
          </Typography>
        </Alert>
      )}

      {/* System Overview - Only show when NOT impersonating */}
      {!isImpersonating && (
        <>
          {/* System Overview */}
          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  System Overview
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedTimeFrame}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="Today">Today</MenuItem>
                    <MenuItem value="Week">Week</MenuItem>
                    <MenuItem value="Month">Month</MenuItem>
                    <MenuItem value="Year">Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Grid container spacing={3}>
                {statCards.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)",
                        backgroundColor: "linear-gradient(180deg, #fffffff0 0%, #fef2f2 100%)",
                        borderRadius: 2,
                        height: "100%",
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.2)",
                              borderRadius: "50%",
                              p: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {stat.icon}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              {stat.title}
                            </Typography>
                            <Typography variant="h4" fontWeight={700}>
                              {stat.value}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                {quickStats.map((stat, index) => (
                  <Grid item xs={6} sm={4} md={2} key={index}>
                    <Card
                      sx={{
                        textAlign: "center",
                        p: 2,
                        borderRadius: 2,
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Box sx={{ color: stat.color, mb: 1 }}>
                        <stat.icon />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {stat.value}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Roles Overview */}
          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                All Roles Overview
              </Typography>
              {roleStats.map((role, index) => (
                <Card
                  key={index}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{ bgcolor: `${role.color}20`, color: role.color }}
                      >
                        <role.icon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>{role.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total: {role.total} • Active: {role.active}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="h6"
                          color={role.color}
                          fontWeight={700}
                        >
                          {role.active}/{role.total}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Active
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Tabs - Only show when NOT impersonating */}
      {!isImpersonating && (
        <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.9rem",
              },
            }}
          >
            <Tab
              label="Users Management"
              icon={<PeopleIcon />}
              iconPosition="start"
            />
            <Tab label="Drivers" icon={<CarIcon />} iconPosition="start" />
            <Tab
              label="Departments"
              icon={<BusinessIcon />}
              iconPosition="start"
            />
            <Tab label="Hospitals" icon={<HospitalIcon />} iconPosition="start" />
            <Tab label="Admins" icon={<AdminIcon />} iconPosition="start" />
            <Tab
              label="Dashboard Access"
              icon={<SecurityIcon />}
              iconPosition="start"
            />
            <Tab
              label="Analytics"
              icon={<AnalyticsIcon />}
              iconPosition="start"
            />
            <Tab label="Driver Dashboard" icon={<DashboardIcon />} iconPosition="start" />
          </Tabs>
        </Paper>
      )}

      {/* Tab Content Area */}
      <div className="tab-content-area">
        {/* Users Management Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  System Users
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    size="small"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 250 }}
                  />
                  <Tooltip title="Export Data">
                    <IconButton onClick={handleExportData}>
                      <ExportIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddUser}
                    sx={{
                      background:
                        "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                      color: "#fff",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                      },
                    }}
                  >
                    Add User
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "grey.50" }}>
                      <TableCell>
                        <Typography fontWeight={600}>Name</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>Email</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>Phone</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>Role</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>Status</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>Actions</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: SuperAdminService.getRoleColor(
                                    user.role
                                  ),
                                }}
                              >
                                {user.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography>{user.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              color={getRoleColor(user.role)}
                              size="small"
                              icon={getRoleIcon(user.role)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status}
                              color={getStatusColor(user.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {/* Login as user button for eligible roles */}
                            {(user.role === 'admin' || user.role === 'department' || 
                              user.role === 'driver' || user.role === 'hospital') && (
                              <Tooltip title={`Login as ${user.name}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenLoginAsDialog(user)}
                                  color="primary"
                                >
                                  <LoginIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewUser(user)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit User">
                              <IconButton
                                size="small"
                                onClick={() => handleEditUser(user)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More Actions">
                              <IconButton
                                size="small"
                                onClick={(e) => handleActionMenuOpen(e, user)}
                              >
                                <MoreIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        )}

        {/* Drivers Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 1 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Drivers Management
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" color="text.secondary">
                    Manage drivers and view their assigned incidents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Drivers: {drivers.length} • Active: {drivers.filter(d => d.status === 'active').length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DashboardIcon />}
                    onClick={() => handleNavigateToDashboard('driver')}
                  >
                    Go to Driver Dashboard
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddUser}
                    sx={{
                      background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                    }}
                  >
                    Add Driver
                  </Button>
                </Box>
              </Box>
              
              {currentViewingDriver ? (
                <Box>
                  <Alert 
                    severity="info" 
                    sx={{ mb: 3 }}
                    action={
                      <IconButton
                        size="small"
                        onClick={() => setCurrentViewingDriver(null)}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <Typography>
                      Viewing incidents for: <strong>{currentViewingDriver.name}</strong>
                      <Button 
                        size="small" 
                        onClick={() => setCurrentViewingDriver(null)}
                        sx={{ ml: 2 }}
                      >
                        View All Drivers
                      </Button>
                    </Typography>
                  </Alert>
                  
                  {/* Driver incidents tabs */}
                  <Paper sx={{ mb: 3 }}>
                    <Tabs value={driverTabValue} onChange={(_e, v) => setDriverTabValue(v)}>
                      <Tab label={`Assigned (${driverIncidents.filter((i: any) => i.status !== 'completed').length})`} />
                      <Tab label={`Completed (${driverIncidents.filter((i: any) => i.status === 'completed').length})`} />
                    </Tabs>
                  </Paper>
                  
                  {driverTabValue === 0 ? (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Assigned & In-Progress Incidents
                      </Typography>
                      {driverIncidents
                        .filter((incident: any) => incident.status !== 'completed')
                        .length === 0 ? (
                        <Alert severity="info">No assigned incidents for this driver</Alert>
                      ) : (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Incident ID</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Priority</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {driverIncidents
                                .filter((incident: any) => incident.status !== 'completed')
                                .map((incident: any) => (
                                  <TableRow key={incident.id} hover>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {incident.id.substring(0, 8)}...
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {incident.description?.substring(0, 50) || 'No description'}...
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {incident.location?.address?.split(',')[0] || 'Unknown'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={incident.status}
                                        color={
                                          incident.status === 'in_progress' ? 'warning' :
                                          incident.status === 'assigned' ? 'info' :
                                          'default'
                                        }
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={incident.priority}
                                        color={
                                          incident.priority === 'urgent' ? 'error' :
                                          incident.priority === 'high' ? 'warning' :
                                          'default'
                                        }
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="caption">
                                        {new Date(incident.createdAt).toLocaleDateString()}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                          // View incident details
                                          showSnackbar(`Viewing incident details`, "success");
                                        }}
                                      >
                                        View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Completed Incidents ({driverIncidents.filter((i: any) => i.status === 'completed').length})
                      </Typography>
                      {driverIncidents
                        .filter((incident: any) => incident.status === 'completed')
                        .length === 0 ? (
                        <Alert severity="info">No completed incidents for this driver</Alert>
                      ) : (
                        <Grid container spacing={2}>
                          {driverIncidents
                            .filter((incident: any) => incident.status === 'completed')
                            .map((incident: any) => (
                              <Grid item xs={12} sm={6} md={4} key={incident.id}>
                                <Card>
                                  <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#10B98120', color: '#10B981' }}>
                                        <CarIcon fontSize="small" />
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                          Case #{incident.seqId || (incident.id || "").substring(0, 8)} • {currentViewingDriver.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {incident.location?.address?.split(',')[0] || 'Unknown'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {incident.description?.substring(0, 50) || 'No description'}...
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                      <Chip
                                        label="Completed"
                                        color="success"
                                        size="small"
                                      />
                                      {incident.patientStatus?.hospital && (
                                        <Chip
                                          label={incident.patientStatus.hospital}
                                          size="small"
                                          variant="outlined"
                                        />
                                      )}
                                      {incident.patientStatus?.condition && (
                                        <Chip
                                          label={incident.patientStatus.condition}
                                          size="small"
                                          variant="outlined"
                                          color="primary"
                                        />
                                      )}
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Created: {new Date(incident.createdAt).toLocaleDateString()}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Completed: {new Date(incident.updatedAt).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                        </Grid>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                // Original drivers grid view when not viewing a specific driver
                <Grid container spacing={3}>
                  {/* Statistics cards */}
                  <Grid item xs={12}>
                    <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="primary">
                                {drivers.length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Drivers
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="success.main">
                                {drivers.filter(d => d.status === 'active').length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Active
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="warning.main">
                                {driverIncidents.filter((i: any) => i.status !== 'completed').length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Active Incidents
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                              <Typography variant="h6" color="info.main">
                                {driverIncidents.filter((i: any) => i.status === 'completed').length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Completed
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Drivers List */}
                  {drivers.map((driver) => (
                    <Grid item xs={12} sm={6} md={4} key={driver.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: '#10B98120', color: '#10B981', width: 50, height: 50 }}>
                              <CarIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography fontWeight={600}>{driver.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {driver.department || 'No Department'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {driver.email}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {driver.phone}
                          </Typography>
                          
                          {driver.drivingLicense && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <KeyIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              License: {driver.drivingLicense}
                            </Typography>
                          )}
                          
                          {driver.ambulanceService && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              <ShippingIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              Service: {driver.ambulanceService}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip
                              label={driver.status}
                              color={getStatusColor(driver.status)}
                              size="small"
                            />
                            <Chip
                              label={driver.role}
                              color={getRoleColor(driver.role)}
                              size="small"
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<LoginIcon />}
                              onClick={() => handleOpenLoginAsDialog(driver)}
                              fullWidth
                            >
                              Login as Driver
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditUser(driver)}
                            >
                              Edit
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        )}

        {/* Departments Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 2 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Departments Management
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<BusinessIcon />}
                  onClick={() => handleNavigateToDashboard('department')}
                  sx={{
                    background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                  }}
                >
                  Go to Department Dashboard
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {departments.map((dept) => (
                  <Grid item xs={12} sm={6} md={4} key={dept.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Avatar sx={{ bgcolor: "#8B5CF620", color: "#8B5CF6" }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>{dept.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {dept.department || "No Department"}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Email: {dept.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {dept.phone}
                        </Typography>
                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                          <Chip
                            label={dept.status}
                            color={getStatusColor(dept.status)}
                            size="small"
                          />
                          <Chip label="Department" color="primary" size="small" />
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<LoginIcon />}
                            onClick={() => handleOpenLoginAsDialog(dept)}
                            fullWidth
                          >
                            Login as Department
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Hospitals Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 3 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Hospitals Management
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<HospitalIcon />}
                  onClick={() => handleNavigateToDashboard('hospital')}
                  sx={{
                    background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                  }}
                >
                  Go to Hospital Dashboard
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {hospitals.map((hospital) => (
                  <Grid item xs={12} sm={6} md={4} key={hospital.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Avatar sx={{ bgcolor: "#EF444420", color: "#EF4444" }}>
                            <HospitalIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>{hospital.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {hospital.hospital || "General Hospital"}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Email: {hospital.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {hospital.phone}
                        </Typography>
                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                          <Chip
                            label={hospital.status}
                            color={getStatusColor(hospital.status)}
                            size="small"
                          />
                          <Chip label="Hospital" color="success" size="small" />
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<LoginIcon />}
                            onClick={() => handleOpenLoginAsDialog(hospital)}
                            fullWidth
                          >
                            Login as Hospital
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Admins Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 4 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Admins Management
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AdminIcon />}
                  onClick={() => handleNavigateToDashboard('admin')}
                  sx={{
                    background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                  }}
                >
                  Go to Admin Dashboard
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {admins.map((admin) => (
                  <Grid item xs={12} sm={6} md={4} key={admin.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Avatar sx={{ bgcolor: "#F59E0B20", color: "#F59E0B" }}>
                            <AdminIcon />
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>{admin.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Role: {admin.role}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Email: {admin.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {admin.phone}
                        </Typography>
                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                          <Chip
                            label={admin.status}
                            color={getStatusColor(admin.status)}
                            size="small"
                          />
                          <Chip label={admin.role} color="warning" size="small" />
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          {admin.role === 'superadmin' ? (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              This is a Super Admin account
                            </Alert>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<LoginIcon />}
                              onClick={() => handleOpenLoginAsDialog(admin)}
                              fullWidth
                            >
                              Login as Admin
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Access Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 5 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Dashboard Access Control
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setIsSaving(true);
                    setTimeout(() => {
                      setIsSaving(false);
                      showSnackbar("Access settings saved successfully", "success");
                    }, 1000);
                  }}
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{
                    background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                  }}
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={3}>
                Control which dashboards are accessible to different user roles.
                Changes take effect immediately for all users.
              </Typography>

              <Grid container spacing={3}>
                {dashboardConfigs.map((config) => (
                  <Grid item xs={12} md={6} key={config.key}>
                    <Card
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              backgroundColor: `${config.color}20`,
                              borderRadius: "50%",
                              p: 1,
                            }}
                          >
                            {config.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                              {config.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {config.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body1" fontWeight={500}>
                            Enable Access
                          </Typography>
                          <Switch
                            checked={localAccess[config.key]}
                            onChange={(e) =>
                              setLocalAccess({
                                ...localAccess,
                                [config.key]: e.target.checked,
                              })
                            }
                            color="primary"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Current status:{" "}
                          {localAccess[config.key] ? "Enabled" : "Disabled"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Alert severity="info" sx={{ mt: 4, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> These settings control which dashboards
                  appear in the navigation menu. Super Admin has access to all
                  dashboards regardless of these settings.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 6 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                System Analytics
              </Typography>
              
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AnalyticsIcon sx={{ fontSize: 64, color: 'grey.400', mb: 3 }} />
                <Typography variant="h6" color="grey.600" gutterBottom>
                  Analytics Dashboard Coming Soon
                </Typography>
                <Typography variant="body2" color="grey.500" paragraph>
                  Advanced analytics, charts, and insights will be available here.
                </Typography>
                <Typography variant="caption" color="grey.500">
                  Includes performance metrics, trend analysis, and detailed reporting.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Driver Dashboard Tab - Only show when NOT impersonating */}
        {!isImpersonating && tabValue === 7 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Driver Dashboard View (Super Admin Mode)
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<CarIcon />}
                  onClick={() => handleNavigateToDashboard('driver')}
                  sx={{
                    background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                  }}
                >
                  Go to Driver Dashboard
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography>
                  You are viewing driver incidents in Super Admin mode. You can see all incidents assigned to drivers.
                </Typography>
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          All Driver Incidents
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={handleViewAllIncidents}
                          disabled={isLoadingDriverIncidents}
                          startIcon={<RefreshIcon />}
                        >
                          {isLoadingDriverIncidents ? 'Loading...' : 'Refresh Incidents'}
                        </Button>
                      </Box>
                      
                      {isLoadingDriverIncidents ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : driverIncidents.length === 0 ? (
                        <Alert severity="info">
                          No driver incidents found. Click "Refresh Incidents" to load.
                        </Alert>
                      ) : (
                        <Box>
                          <Tabs value={driverTabValue} onChange={(_e, v) => setDriverTabValue(v)} sx={{ mb: 3 }}>
                            <Tab label={`Active (${driverIncidents.filter((i: any) => i.status !== 'completed').length})`} />
                            <Tab label={`Completed (${driverIncidents.filter((i: any) => i.status === 'completed').length})`} />
                          </Tabs>
                          
                          {driverTabValue === 0 ? (
                            <TableContainer>
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Driver</TableCell>
                                    <TableCell>Incident Description</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {driverIncidents
                                    .filter((incident: any) => incident.status !== 'completed')
                                    .map((incident: any) => {
                                      const driver = drivers.find(d => 
                                        d.id === incident.assignedTo?.driver?._id || 
                                        d.id === incident.assignedTo?.driver
                                      );
                                      
                                      return (
                                        <TableRow key={incident.id} hover>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#10B98120', color: '#10B981' }}>
                                                <CarIcon fontSize="small" />
                                              </Avatar>
                                              <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                  {driver?.name || 'Unknown Driver'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                  {driver?.department || 'No department'}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {incident.description?.substring(0, 50) || 'No description'}...
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {incident.location?.address?.split(',')[0] || 'Unknown'}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Chip
                                              label={incident.status}
                                              color={
                                                incident.status === 'in_progress' ? 'warning' :
                                                incident.status === 'assigned' ? 'info' :
                                                'default'
                                              }
                                              size="small"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Chip
                                              label={incident.priority}
                                              color={
                                                incident.priority === 'urgent' ? 'error' :
                                                incident.priority === 'high' ? 'warning' :
                                                'default'
                                              }
                                              size="small"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="caption">
                                              {new Date(incident.createdAt).toLocaleDateString()}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={() => {
                                                // You can implement a detailed view modal here
                                                showSnackbar(`Viewing incident details for ${driver?.name || 'driver'}`, "success");
                                              }}
                                            >
                                              View Details
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Grid container spacing={2}>
                              {driverIncidents
                                .filter((incident: any) => incident.status === 'completed')
                                .map((incident: any) => {
                                  const driver = drivers.find(d => 
                                    d.id === incident.assignedTo?.driver?._id || 
                                    d.id === incident.assignedTo?.driver
                                  );
                                  
                                  return (
                                    <Grid item xs={12} sm={6} md={4} key={incident.id}>
                                      <Card>
                                        <CardContent>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#10B98120', color: '#10B981' }}>
                                              <CarIcon fontSize="small" />
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={600}>
                                              {driver?.name || 'Unknown Driver'}
                                            </Typography>
                                          </Box>
                                          <Typography variant="body2" sx={{ mb: 1 }}>
                                            {incident.description?.substring(0, 30) || 'No description'}...
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                            {incident.location?.address?.split(',')[0] || 'Unknown'}
                                          </Typography>
                                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                              label="Completed"
                                              color="success"
                                              size="small"
                                            />
                                            {incident.patientStatus?.hospital && (
                                              <Chip
                                                label={incident.patientStatus.hospital}
                                                size="small"
                                                variant="outlined"
                                              />
                                            )}
                                          </Box>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                            Completed: {new Date(incident.updatedAt).toLocaleDateString()}
                                          </Typography>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  );
                                })}
                            </Grid>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* When impersonating, show current dashboard info */}
        {isImpersonating && tabValue === 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    // mx: 'auto',
                    mb: 3,
                    bgcolor: '#FF3B30',
                  }}
                >
                  <AdminIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Currently Viewing as {currentUser?.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Role: <strong>{currentUser?.role}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email: {currentUser?.email}
                </Typography>
                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<BackIcon />}
                    onClick={handleReturnToSuperAdmin}
                    disabled={isLoggingIn}
                    sx={{
                      background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                      color: "white",
                      py: 1.5,
                      px: 4,
                      "&:hover": {
                        background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                      },
                    }}
                  >
                    {isLoggingIn ? 'Returning...' : 'Return to Super Admin Dashboard'}
                  </Button>
                </Box>
                <Alert severity="info" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
                  <Typography variant="body2">
                    You are currently impersonating another user. All actions will be performed as this user.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity - Only show when NOT impersonating */}
      {!isImpersonating && (
        <Card sx={{ mt: 4, borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Recent System Activity
              </Typography>
              <Button onClick={loadRecentActivities} startIcon={<RefreshIcon />}>
                Refresh
              </Button>
            </Box>

            {recentActivities.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <HistoryIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                <Typography color="grey.600">No recent activity</Typography>
              </Box>
            ) : (
              recentActivities.map((activity, index) => (
                <Card key={index} sx={{ mb: 2, borderRadius: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor:
                            activity.color === "orange"
                              ? "#F59E0B20"
                              : activity.color === "blue"
                              ? "#3B82F620"
                              : activity.color === "green"
                              ? "#10B98120"
                              : "#6B728020",
                          color:
                            activity.color === "orange"
                              ? "#F59E0B"
                              : activity.color === "blue"
                              ? "#3B82F6"
                              : activity.color === "green"
                              ? "#10B981"
                              : "#6B7280",
                        }}
                      >
                        {activity.icon === "warning" && <WarningIcon />}
                        {activity.icon === "person_add" && <PersonIcon />}
                        {activity.icon === "check_circle" && <CheckIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>
                          {activity.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.details}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            mt: 1,
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={activity.role}
                            size="small"
                            sx={{
                              bgcolor:
                                activity.color === "orange"
                                  ? "#F59E0B20"
                                  : activity.color === "blue"
                                  ? "#3B82F620"
                                  : activity.color === "green"
                                  ? "#10B98120"
                                  : "#6B728020",
                              color:
                                activity.color === "orange"
                                  ? "#F59E0B"
                                  : activity.color === "blue"
                                  ? "#3B82F6"
                                  : activity.color === "green"
                                  ? "#10B981"
                                  : "#6B7280",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {activity.user} • {activity.time}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* FAB Refresh Button - Only show when NOT impersonating */}
      {!isImpersonating && (
        <Fab
          color="primary"
          aria-label="refresh"
          onClick={refreshData}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%",
            animation: refreshPulse ? "pulse 1s infinite" : "none",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)" },
              "50%": { transform: "scale(1.1)" },
              "100%": { transform: "scale(1)" },
            },
            "&:hover": {
              background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)",
            },
          }}
        >
          {refreshPulse ? (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
          ) : (
            <RefreshIcon />
          )}
        </Fab>
      )}

      {/* Login as User Confirmation Dialog */}
      <Dialog
        open={loginAsUserDialog}
        onClose={() => setLoginAsUserDialog(false)}
      >
        <DialogTitle>
          Login as User
        </DialogTitle>
        <DialogContent>
          {userToLoginAs && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  You are about to login as:
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ 
                  width: 60, 
                  height: 60,
                  bgcolor: SuperAdminService.getRoleColor(userToLoginAs.role)
                }}>
                  {userToLoginAs.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{userToLoginAs.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userToLoginAs.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={userToLoginAs.role}
                      color={getRoleColor(userToLoginAs.role)}
                      size="small"
                    />
                    <Chip
                      label={userToLoginAs.status}
                      color={getStatusColor(userToLoginAs.status)}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary">
                You will be logged into the <strong>{userToLoginAs.role}</strong> dashboard with this user's permissions.
              </Typography>
              
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> You can return to Super Admin dashboard anytime using the "Return to Super Admin" button.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginAsUserDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => userToLoginAs && handleLoginAsUser(userToLoginAs)}
            disabled={isLoggingIn}
            startIcon={<LoginIcon />}
          >
            {isLoggingIn ? 'Logging in...' : 'Login as SuperAdmin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={addUserDialog}
        onClose={() => setAddUserDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name *"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number *"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNIC *"
                value={newUser.cnic}
                onChange={(e) =>
                  setNewUser({ ...newUser, cnic: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role *</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role *"
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <MenuItem value="citizen">Citizen</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="department">Department</MenuItem>
                  <MenuItem value="hospital">Hospital</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {newUser.role === "driver" && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={newUser.department}
                      label="Department"
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
                    >
                      <MenuItem value="Edhi Foundation">
                        Edhi Foundation
                      </MenuItem>
                      <MenuItem value="Chippa Ambulance">
                        Chippa Ambulance
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ambulance Service"
                    value={newUser.ambulanceService}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        ambulanceService: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Driving License"
                    value={newUser.drivingLicense}
                    onChange={(e) =>
                      setNewUser({ ...newUser, drivingLicense: e.target.value })
                    }
                  />
                </Grid>
              </>
            )}
            {newUser.role === "department" && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={newUser.department}
                    label="Department"
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                  >
                    <MenuItem value="Edhi Foundation">Edhi Foundation</MenuItem>
                    <MenuItem value="Chippa Ambulance">
                      Chippa Ambulance
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {newUser.role === "hospital" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hospital"
                  value={newUser.hospital}
                  onChange={(e) =>
                    setNewUser({ ...newUser, hospital: e.target.value })
                  }
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveNewUser}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)",
            }}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog
        open={viewUserDialog}
        onClose={() => setViewUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: SuperAdminService.getRoleColor(selectedUser.role),
                  }}
                >
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                  <Chip
                    label={selectedUser.role}
                    color={getRoleColor(selectedUser.role)}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography>{selectedUser.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    CNIC
                  </Typography>
                  <Typography>{selectedUser.cnic}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedUser.status}
                    color={getStatusColor(selectedUser.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Login
                  </Typography>
                  <Typography>
                    {selectedUser.lastLogin
                      ? SuperAdminService.formatDate(selectedUser.lastLogin)
                      : "Never"}
                  </Typography>
                </Grid>
                {selectedUser.department && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography>{selectedUser.department}</Typography>
                  </Grid>
                )}
                {selectedUser.hospital && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Hospital
                    </Typography>
                    <Typography>{selectedUser.hospital}</Typography>
                  </Grid>
                )}
                {selectedUser.ambulanceService && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Ambulance Service
                    </Typography>
                    <Typography>{selectedUser.ambulanceService}</Typography>
                  </Grid>
                )}
                {selectedUser.drivingLicense && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Driving License
                    </Typography>
                    <Typography>{selectedUser.drivingLicense}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography>
                    {SuperAdminService.formatDate(selectedUser.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewUserDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editUserDialog}
        onClose={() => setEditUserDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
        <DialogContent>
          {editingUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={editingUser.name || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editingUser.email || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editingUser.phone || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CNIC"
                  value={editingUser.cnic || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, cnic: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editingUser.role || "citizen"}
                    label="Role"
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        role: e.target.value as User["role"],
                      })
                    }
                  >
                    <MenuItem value="citizen">Citizen</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="department">Department</MenuItem>
                    <MenuItem value="hospital">Hospital</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editingUser.status || "active"}
                    label="Status"
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        status: e.target.value as User["status"],
                      })
                    }
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Role-specific fields */}
              {(editingUser.role === "driver" ||
                editingUser.role === "department") && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={editingUser.department || ""}
                      label="Department"
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          department: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="Edhi Foundation">
                        Edhi Foundation
                      </MenuItem>
                      <MenuItem value="Chippa Ambulance">
                        Chippa Ambulance
                      </MenuItem>
                      <MenuItem value="Rescue 1122">Rescue 1122</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {editingUser.role === "driver" && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ambulance Service"
                      value={editingUser.ambulanceService || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          ambulanceService: e.target.value,
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Driving License"
                      value={editingUser.drivingLicense || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          drivingLicense: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </>
              )}

              {editingUser.role === "hospital" && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hospital"
                    value={editingUser.hospital || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        hospital: e.target.value,
                      })
                    }
                  />
                </Grid>
              )}

              {/* Password reset section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Password Management
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password (Leave empty to keep current)"
                  onChange={(e) => {
                    if (e.target.value) {
                      setEditingUser({
                        ...editingUser,
                        password: e.target.value,
                      });
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm Password"
                  onChange={() => {
                    // You can add password confirmation logic here
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (editingUser) {
                // Validate data
                const validation = validateUserData(editingUser);
                if (!validation.isValid) {
                  showSnackbar(validation.errors[0], "error");
                  return;
                }

                setIsSaving(true);

                try {
                  // Prepare update data
                  const updateData: Partial<User> = {
                    name: editingUser.name,
                    email: editingUser.email,
                    phone: editingUser.phone,
                    cnic: editingUser.cnic,
                    role: editingUser.role,
                    status: editingUser.status,
                  };

                  // Add role-specific fields only if they exist
                  if (editingUser.department)
                    updateData.department = editingUser.department;
                  if (editingUser.hospital)
                    updateData.hospital = editingUser.hospital;
                  if (editingUser.ambulanceService)
                    updateData.ambulanceService = editingUser.ambulanceService;
                  if (editingUser.drivingLicense)
                    updateData.drivingLicense = editingUser.drivingLicense;

                  // Add password only if provided
                  if (
                    editingUser.password &&
                    editingUser.password.trim() !== ""
                  ) {
                    updateData.password = editingUser.password;
                  }

                  const updatedUser = await SuperAdminService.updateUser(
                    editingUser.id,
                    updateData
                  );

                  if (updatedUser) {
                    showSnackbar(
                      `User ${editingUser.name} updated successfully`,
                      "success"
                    );
                    setEditUserDialog(false);
                    setEditingUser(null);
                    loadUsers(); // Refresh the user list
                  } else {
                    showSnackbar("Failed to update user", "error");
                  }
                } catch (error: any) {
                  console.error("Error updating user:", error);
                  showSnackbar(error.message || "Error updating user", "error");
                } finally {
                  setIsSaving(false);
                }
              }
            }}
            variant="contained"
            disabled={isSaving}
            sx={{
              background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)",
              "&:disabled": {
                background: "grey.300",
              },
            }}
          >
            {isSaving ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        {selectedActionUser && (
          <>
            <MenuItem
              onClick={() => {
                handleActionMenuClose();
                setTimeout(() => handleEditUser(selectedActionUser), 100); // Small delay for smooth transition
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Edit User
            </MenuItem>

            <MenuItem
              onClick={() => {
                if (selectedActionUser.status === "active") {
                  if (selectedActionUser) {
                    handleRestrictUser(selectedActionUser, 7);
                  }
                } else {
                  // If user is restricted, show option to activate
                  const activateUser = async () => {
                    try {
                      const updatedUser = await SuperAdminService.updateUser(
                        selectedActionUser.id,
                        { status: "active" }
                      );
                      if (updatedUser) {
                        showSnackbar(
                          `User ${selectedActionUser.name} activated`,
                          "success"
                        );
                        loadUsers();
                      }
                    } catch (error) {
                      showSnackbar("Error activating user", "error");
                    }
                  };
                  activateUser();
                }
                handleActionMenuClose();
              }}
            >
              <ListItemIcon>
                <BlockIcon fontSize="small" />
              </ListItemIcon>
              {selectedActionUser.status === "active"
                ? "Restrict for 7 days"
                : "Activate User"}
            </MenuItem>

            <MenuItem
              onClick={() => {
                if (selectedActionUser) {
                  handleRestrictUser(selectedActionUser, 30);
                }
                handleActionMenuClose();
              }}
            >
              <ListItemIcon>
                <BlockIcon fontSize="small" />
              </ListItemIcon>
              Restrict for 30 days
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => {
                if (selectedActionUser) {
                  handleDeleteUser(selectedActionUser);
                }
                handleActionMenuClose();
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Delete User</Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SuperAdminDashboard;