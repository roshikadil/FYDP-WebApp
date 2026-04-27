// src/pages/AdminDashboard.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  CircularProgress,
  Fab,
  Divider,
  LinearProgress,
  CardMedia,
  Badge,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Warning as DuplicateIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  SmartToy as AIIcon,
  Pending as PendingIcon,
  Block as BlockIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  GetApp as ExportIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CancelOutlined as CancelOutlinedIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  MedicalServices as MedicalIcon,
  Traffic as TrafficIcon,
  Public as PublicIcon,
  Assignment as TotalIcon,
  People as PeopleIcon,
  DoneAll as DoneAllIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as DepartmentIcon,
  LocalHospital as HospitalIcon,
  DirectionsCar as CarIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import axios from "axios";

import {
  useAuth,
  type Incident,
  type DashboardStats,
  type User,
} from "../contexts/AuthContext";
import IncidentMap from "../components/IncidentMap";
import { useRealtimeIncidents } from "../hooks/useRealtimeIncidents";
import { SocketService } from "../services/SocketService";
import AnalyticsConsole from "../components/AnalyticsConsole";
import LocationDisplay from "../components/LocationDisplay";

// Date utilities
import { format, formatDistanceToNow, parseISO } from "date-fns";

// Add API URL constant
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Add getPhotoUrl function
const getPhotoUrl = (photo: any): string => {
  if (!photo) return "";

  console.log("📷 Processing photo:", photo);

  if (photo.url && typeof photo.url === "string") {
    console.log("📷 Using photo.url:", photo.url);
    return photo.url;
  }

  if (photo.filename && typeof photo.filename === "string") {
    const url = `/api/upload/image/${photo.filename}`;
    console.log("📷 Generated URL from filename:", url);
    return url;
  }

  if (photo._id || photo.id) {
    const fileId = photo._id || photo.id;
    const url = `/api/upload/image/${fileId}`;
    console.log("📷 Generated URL from ID:", url);
    return url;
  }

  console.log("📷 No valid photo data found");
  return "";
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 4 }}>{children}</Box>}
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#10B981",
  rejected: "#EF4444",
  assigned: "#3B82F6",
  in_progress: "#8B5CF6",
  completed: "#8B5CF6",
  cancelled: "#6B7280",
  verification_needed: "#EF4444",
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Accident":
      return <TrafficIcon />;
    case "Medical Emergency":
      return <MedicalIcon />;
    default:
      return <PublicIcon />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <PendingIcon />;
    case "approved":
      return <ApproveIcon />;
    case "rejected":
      return <RejectIcon />;
    case "assigned":
      return <AssignmentTurnedInIcon />;
    case "in_progress":
      return <TimelineIcon />;
    case "completed":
      return <DoneAllIcon />;
    case "cancelled":
      return <CancelOutlinedIcon />;
    default:
      return <InfoIcon />;
  }
};

const getRoleColor = (role: string) => {
  const colors: { [key: string]: any } = {
    admin: "error",
    department: "primary",
    driver: "info",
    hospital: "success",
    citizen: "default",
    superadmin: "error",
  };
  return colors[role] || "default";
};

const getStatusColor = (status: string) => {
  const colors: { [key: string]: any } = {
    active: "success",
    inactive: "warning",
    suspended: "error",
  };
  return colors[status] || "default";
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case "admin":
    case "superadmin":
      return <SecurityIcon />;
    case "department":
      return <DepartmentIcon />;
    case "driver":
      return <CarIcon />;
    case "hospital":
      return <HospitalIcon />;
    default:
      return <PersonIcon />;
  }
};

const StatCard = ({ title, value, icon, subtitle }: any) => (
  <Card
    sx={{
      background: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)",
      color: "#fff",
      borderRadius: 3,
      height: "100%",
      display: "flex",
      alignItems: "center",
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      px: 2,
      py: 2,
      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
      },
    }}
  >
    <Avatar
      sx={{
        bgcolor: "rgba(255,255,255,0.12)",
        width: 56,
        height: 56,
        mr: 2,
      }}
    >
      {icon}
    </Avatar>
    <Box>
      <Typography variant="subtitle2" sx={{ opacity: 0.92, fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={800}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Card>
);

const IncidentCard = ({
  incident,
  onView,
  onApprove,
  onReject,
  selected = false,
  onSelect,
}: any) => {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        background: 'transparent',
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 320,
        border: selected ? "2px solid #3B82F6" : "none",
        boxShadow: "0 8px 28px rgba(15, 23, 42, 0.04)",
        cursor: "pointer",
        "&:hover": {
          boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
          transform: "translateY(-6px)",
        },
      }}
      onClick={() => onSelect && onSelect(incident._id)}
    >
      <CardContent
        sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box sx={{ pr: 1, minWidth: 0 }}>
            <Typography
              noWrap
              variant="subtitle2"
              sx={{ color: "#6b7280", fontWeight: 600 }}
            >
              {incident.reportedBy?.name || "Unknown"}
            </Typography>
            <Typography noWrap variant="caption" sx={{ color: "#9ca3af" }}>
              Case #{incident.seqId || (incident._id || incident.id || "").substring(0, 8)} •{" "}
              {incident.reportedBy?.phone || ""}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center" flexShrink={0}>
            {(incident.status === "rejected" || incident.status === "verification_needed") && (
              <Chip
                label={incident.status === 'verification_needed' ? "Dual Verification Required" : "Admin Final Decision"}
                color="error"
                size="small"
                variant="filled"
                sx={{ fontWeight: 800, borderRadius: 1 }}
              />
            )}
            {incident.aiDetectionScore !== undefined && (
              <Chip
                icon={<AIIcon sx={{ color: (incident.status === 'rejected' || incident.status === 'verification_needed') ? "#fff !important" : "#b91c1c !important" }} />}
                label={(incident.status === 'rejected' || incident.status === 'verification_needed') && incident.aiDetectionScore < 40 ? `AI Suggested Reject (${incident.aiDetectionScore}%)` : `AI ${incident.aiDetectionScore}%`}
                variant={(incident.status === 'rejected' || incident.status === 'verification_needed') ? "filled" : "outlined"}
                size="small"
                sx={{
                  borderColor: "#f87171",
                  color: (incident.status === 'rejected' || incident.status === 'verification_needed') ? "#fff" : "#b91c1c",
                  bgcolor: (incident.status === 'rejected' || incident.status === 'verification_needed') ? "#b91c1c" : "rgba(255,0,0,0.04)",
                  fontWeight: 700,
                }}
              />
            )}
            {incident.similarIncidents && incident.similarIncidents > 0 && (
              <Chip
                icon={<DuplicateIcon />}
                label="Possible Duplicate"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        
        {incident.aiDetectionScore !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#4b5563", letterSpacing: 0.5 }}>
                AI IDENTIFICATION CONFIDENCE
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: incident.aiDetectionScore >= 70 ? "#10b981" : incident.aiDetectionScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                {incident.aiDetectionScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={incident.aiDetectionScore}
              sx={{
                height: 8,
                borderRadius: 5,
                bgcolor: "#f3f4f6",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  bgcolor: incident.aiDetectionScore >= 70 ? "#10b981" : incident.aiDetectionScore >= 40 ? "#f59e0b" : "#ef4444",
                  boxShadow: incident.aiDetectionScore >= 70 ? "0 0 10px rgba(16, 185, 129, 0.4)" : "none"
                }
              }}
            />
          </Box>
        )}

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "#111827",
            fontWeight: 700,
            lineHeight: 1.35,
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            minHeight: "3.6em",
          }}
        >
          {incident.description || "No description"}
        </Typography>

        <Box sx={{ mt: "auto" }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar
              sx={{
                bgcolor: "#fff0f0",
                color: "#991b1b",
                width: 32,
                height: 32,
              }}
            >
              <LocationIcon fontSize="small" />
            </Avatar>
            <LocationDisplay 
              address={incident.location?.address} 
              coordinates={incident.location?.coordinates}
              noWrap
            />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{
                bgcolor: "#fff0f0",
                color: "#991b1b",
                width: 32,
                height: 32,
              }}
            >
              <AccessTimeIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {formatDistanceToNow(parseISO(incident.createdAt), {
                addSuffix: true,
              })}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Box
        sx={{
          p: 2,
          pt: 0,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onView(incident);
          }}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          View
        </Button>
        {(incident.status === "pending" || incident.status === "verification_needed") && (
          <>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onApprove(incident);
              }}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<RejectIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onReject(incident);
              }}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {incident.status === "verification_needed" ? "Confirm Reject" : "Reject"}
            </Button>
          </>
        )}
      </Box>
    </Card>
  );
};

const AdminDashboard: React.FC = () => {
  const {
    user,
    getAdminDashboardData,
    getAdminIncidents,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    restrictUser,
    getUserStats,
    rejectIncident,
    bulkRejectIncidents,
    bulkApproveIncidents,
    approveIncident,
  } = useAuth();

  // State management
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [assignDepartment, setAssignDepartment] = useState("");
  const [restrictDays, setRestrictDays] = useState(7);
  const [selectedActionUser, setSelectedActionUser] = useState<User | null>(
    null
  );
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalIncidents: 0,
    pendingIncidents: 0,
    approvedIncidents: 0,
    completedIncidents: 0,
    avgResponseTime: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  const [userStats, setUserStats] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    phone: "",
    role: "citizen",
    department: "",
    hospital: "",
    ambulanceService: "",
    drivingLicense: "",
    status: "active",
  });

  // Real-time notification states - FIXED: Added missing state variables
  const [showNewIncidentAlert, setShowNewIncidentAlert] = useState(false);
  const [newIncidentData, setNewIncidentData] = useState<Incident | null>(null);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Audio reference for playing sounds
  const audioContextRef = useRef<AudioContext | null>(null);

  // User Management States
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedUserForMenu, setSelectedUserForMenu] = useState<User | null>(
    null
  );

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play notification sound function
  const playNotificationSound = useCallback((type: 'new' | 'update' | 'assign' = 'new') => {
    try {
      const audioContext = initAudio();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const playBeep = (frequency: number, duration: number, delay: number = 0) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

          oscillator.start();
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };

      if (type === 'new') {
        // Three-beep pattern for new incident (urgent)
        playBeep(880, 0.15); // High beep
        playBeep(880, 0.15, 200);
        playBeep(880, 0.15, 400);
      } else if (type === 'assign') {
        // Two-beep pattern for assignments
        playBeep(660, 0.2);
        playBeep(660, 0.2, 300);
      } else {
        // Single beep for updates
        playBeep(440, 0.2);
      }
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, [initAudio]);

  // Handle new incident - FIXED: This function now automatically shows the incident
  const handleNewIncident = useCallback((incident: Incident) => {
    console.log('🚨 NEW INCIDENT RECEIVED:', incident);

    // Play urgent notification sound
    playNotificationSound('new');

    // Update state to show alert
    setNewIncidentData(incident);
    setShowNewIncidentAlert(true);
    setUnreadCount(prev => prev + 1);

    // Add to incidents list immediately
    setIncidents(prevIncidents => {
      // Check if incident already exists
      const exists = prevIncidents.some(inc => inc._id === incident._id);
      if (exists) {
        // Update existing incident
        return prevIncidents.map(inc =>
          inc._id === incident._id ? incident : inc
        );
      } else {
        // Add new incident to the top of the list
        return [incident, ...prevIncidents];
      }
    });

    // Update dashboard stats
    setStats(prevStats => ({
      ...prevStats,
      totalIncidents: prevStats.totalIncidents + 1,
      pendingIncidents: prevStats.pendingIncidents + 1,
    }));

    // Auto-hide alert after 10 seconds
    setTimeout(() => setShowNewIncidentAlert(false), 10000);

    // Show snackbar notification as well
    setSnackbar({
      open: true,
      message: `🚨 New ${incident.category} incident reported`,
      severity: "info"
    });
  }, [playNotificationSound]);

  // Handle incident update
  const handleIncidentUpdated = useCallback((incident: Incident) => {
    console.log('🔄 INCIDENT UPDATED:', incident);

    // Play update sound
    // playNotificationSound('update');

    // Update message
    setUpdateMessage(`Incident ${incident._id?.substring(0, 8)} was updated`);
    setShowUpdateAlert(true);

    // Update incidents list
    setIncidents(prevIncidents =>
      prevIncidents.map(inc =>
        inc._id === incident._id ? incident : inc
      )
    );

    // Update stats if status changed
    loadDashboardStats();

    setTimeout(() => setShowUpdateAlert(false), 5000);
  }, [playNotificationSound]);

  // Handle incident assigned
  const handleIncidentAssigned = useCallback((data: any) => {
    console.log('🚗 INCIDENT ASSIGNED:', data);

    // Play assignment sound
    playNotificationSound('assign');

    const message = data.message || 'New incident assigned to driver';
    setUpdateMessage(message);
    setShowUpdateAlert(true);

    // Refresh incidents to get updated data
    loadDashboardData();

    setTimeout(() => setShowUpdateAlert(false), 5000);
  }, [playNotificationSound]);

  // Handle driver assigned
  const handleDriverAssigned = useCallback((data: any) => {
    console.log('👨‍✈️ DRIVER ASSIGNED:', data);

    const message = `Driver ${data.driverName || ''} assigned to incident`;
    setUpdateMessage(message);
    setShowUpdateAlert(true);

    // Refresh incidents
    loadDashboardData();

    setTimeout(() => setShowUpdateAlert(false), 5000);
  }, []);

  // Initialize socket and real-time listeners
  useEffect(() => {
    if (user) {
      // Join admin room
      SocketService.joinAdminRoom(user.id || user._id);
    }

    // Cleanup on unmount
    return () => {
      SocketService.removeAdminListeners();
    };
  }, [user]);

  // Initialize real-time incidents hook with all callbacks
  useRealtimeIncidents({
    onNewIncident: handleNewIncident,
    onIncidentUpdated: handleIncidentUpdated,
    onIncidentAssigned: handleIncidentAssigned,
    onDriverAssigned: handleDriverAssigned,
    onIncidentApproved: (data) => {
      console.log('Incident approved:', data);
      loadDashboardData();
    },
    playSound: false, // We're handling sound manually in the callbacks
    role: 'admin',
    refreshCallback: () => loadDashboardData()
  });

  // Load dashboard stats helper
  const loadDashboardStats = useCallback(async () => {
    const storedUserStr = localStorage.getItem('user');
    const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
    
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return;
    if (!storedUser || (storedUser.role !== 'admin' && storedUser.role !== 'superadmin')) return;

    try {
      const dashboardResult = await getAdminDashboardData();
      setDashboardData(dashboardResult);
      setStats(dashboardResult.overview);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [getAdminDashboardData, user]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [user]); // Re-run if user changes

  const loadDashboardData = async () => {
    const storedUserStr = localStorage.getItem('user');
    const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return; // Prevent fetching admin data if not authorized
    }
    if (!storedUser || (storedUser.role !== 'admin' && storedUser.role !== 'superadmin')) {
      return; // Prevent fetching if another tab logged in as non-admin
    }
    
    try {
      setIsLoading(true);

      // Load dashboard data
      const dashboardResult = await getAdminDashboardData();
      setDashboardData(dashboardResult);
      setStats(dashboardResult.overview);

      // Load incidents
      const incidentsResult = await getAdminIncidents();
      setIncidents(incidentsResult.data || []);

      // Load users
      const usersList = await getUsers();
      setUsers(usersList);

      // Load user stats
      const statsResult = await getUserStats();
      setUserStats(statsResult);

      // Load analytics data
      const token = localStorage.getItem('token');
      const analyticsResponse = await axios.get(`${API_URL}/api/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analyticsResponse.data.success) {
        setAnalyticsData(analyticsResponse.data.data);
      }
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      showSnackbar(`Error loading data: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadDashboardData();
      showSnackbar("Dashboard refreshed successfully", "success");
    } catch (error: any) {
      showSnackbar(`Error refreshing: ${error.message}`, "error");
    }
  };

  // Direct approve function - matches mobile app behavior
  const confirmDirectApprove = async (incidentId: string) => {
    try {
      setIsLoading(true);
      console.log("✅ Approving incident directly:", incidentId);

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/incidents/${incidentId}/approve`,
        {}, // Empty body - no department needed, system assigns nearest driver
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        showSnackbar("✅ Incident approved and assigned to nearest driver", "success");
        await loadDashboardData();
      } else {
        showSnackbar(`Error: ${response.data.message}`, "error");
      }
    } catch (error: any) {
      console.error("Error approving incident:", error);
      showSnackbar(`Error: ${error.response?.data?.message || error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk approve function - approves all selected incidents at once
  const confirmBulkApprove = async () => {
    if (selectedIncidents.length === 0) {
      showSnackbar("No incidents selected", "warning");
      return;
    }

    try {
      setIsLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Approve each incident individually (system assigns nearest driver)
      for (const incidentId of selectedIncidents) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.put(
            `${API_URL}/api/incidents/${incidentId}/approve`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
          console.error(`Failed to approve incident ${incidentId}:`, err);
        }
      }

      showSnackbar(
        `✅ ${successCount} incidents approved, ${errorCount} failed`,
        successCount > 0 ? "success" : "error"
      );

      await loadDashboardData();
      setSelectedIncidents([]);

    } catch (error: any) {
      console.error("Error bulk approving incidents:", error);
      showSnackbar(`Error: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual assign to department (optional, for when admin wants to override)
  const confirmManualAssign = async () => {
    if (!assignDepartment) {
      showSnackbar("Please select a department", "warning");
      return;
    }

    try {
      setIsLoading(true);

      // Call the bulk assign endpoint for manual override
      if (selectedIncidents.length > 0) {
        await bulkApproveIncidents(selectedIncidents, assignDepartment);
        showSnackbar(
          `${selectedIncidents.length} incidents manually assigned to ${assignDepartment}`,
          "success"
        );
        setSelectedIncidents([]);
      } else if (selectedIncident) {
        await approveIncident(selectedIncident._id, assignDepartment);
        showSnackbar(
          `Incident manually assigned to ${assignDepartment}`,
          "success"
        );
        setSelectedIncident(null);
      }

      await loadDashboardData();
      setAssignDialogOpen(false);
      setAssignDepartment("");

    } catch (error: any) {
      console.error("Error manually assigning incidents:", error);
      showSnackbar(`Error: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (incident: Incident) => {
    try {
      setSelectedIncident(incident);
      // Direct approval without department selection - matches mobile app
      await confirmDirectApprove(incident._id);
    } catch (error: any) {
      showSnackbar(`Error: ${error.message}`, "error");
    }
  };

  const handleReject = async (incident: Incident) => {
    setSelectedIncident(incident);
    setRejectDialogOpen(true);
  };

  const handleBulkAction = (action: string) => {
    if (selectedIncidents.length === 0) {
      showSnackbar("No incidents selected", "warning");
      return;
    }

    switch (action) {
      case "approve":
        confirmBulkApprove(); // Direct bulk approve without dialog
        break;
      case "reject":
        setRejectDialogOpen(true);
        break;
      case "clear":
        setSelectedIncidents([]);
        break;
    }
    setBulkMenuAnchor(null);
  };

  const handleIncidentSelect = (incidentId: string) => {
    setSelectedIncidents((prev) =>
      prev.includes(incidentId)
        ? prev.filter((id) => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // ========== INCIDENT REJECT FUNCTIONS ==========

  const confirmReject = async () => {
    if (!selectedIncident || !rejectReason) {
      showSnackbar("Please provide a rejection reason", "warning");
      return;
    }

    try {
      const incidentIds =
        selectedIncidents.length > 0
          ? selectedIncidents
          : [selectedIncident._id];

      if (selectedIncidents.length > 0) {
        await bulkRejectIncidents(incidentIds, rejectReason);
        showSnackbar(`${incidentIds.length} incidents rejected`, "success");
      } else {
        await rejectIncident(selectedIncident._id, rejectReason);
        showSnackbar("Incident rejected", "success");
      }

      await loadDashboardData();

      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectReason("");
      setSelectedIncidents([]);
      setSelectedIncident(null);
    } catch (error: any) {
      showSnackbar(`Error: ${error.message}`, "error");
    }
  };

  // ========== USER MANAGEMENT FUNCTIONS ==========

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setViewUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({
      ...user,
      id: user._id || user.id,
    });
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await deleteUser(userId);
        showSnackbar("User deleted successfully", "success");
        await loadDashboardData();
      } catch (error: any) {
        showSnackbar(`Error deleting user: ${error.message}`, "error");
      }
    }
  };

  const handleRestrictUser = async (userId: string, days: number) => {
    try {
      await restrictUser(userId, days, "Manual restriction by admin");
      showSnackbar(`User restricted for ${days} days`, "success");
      await loadDashboardData();
      setRestrictDialogOpen(false);
    } catch (error: any) {
      showSnackbar(`Error restricting user: ${error.message}`, "error");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser.id) return;

    try {
      await updateUser(editingUser.id, editingUser);
      showSnackbar("User updated successfully", "success");
      setEditUserDialogOpen(false);
      setEditingUser({});
      await loadDashboardData();
    } catch (error: any) {
      showSnackbar(`Error updating user: ${error.message}`, "error");
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.phone) {
        showSnackbar("Please fill all required fields", "warning");
        return;
      }

      const createdUser = await createUser(newUser);
      showSnackbar(`User ${createdUser.name} created successfully`, "success");
      setUserDialogOpen(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "citizen",
        department: "",
        hospital: "",
        ambulanceService: "",
        drivingLicense: "",
        status: "active",
      });
      await loadDashboardData();
    } catch (error: any) {
      showSnackbar(`Error creating user: ${error.message}`, "error");
    }
  };

  const handleUserMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    user: User
  ) => {
    setUserMenuAnchor(event.currentTarget);
    setSelectedUserForMenu(user);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setSelectedUserForMenu(null);
  };

  const handleUserMenuAction = (action: string) => {
    if (!selectedUserForMenu) return;

    switch (action) {
      case "view":
        handleViewUserDetails(selectedUserForMenu);
        break;
      case "edit":
        handleEditUser(selectedUserForMenu);
        break;
      case "delete":
        handleDeleteUser(selectedUserForMenu._id || selectedUserForMenu.id);
        break;
      case "restrict":
        setSelectedActionUser(selectedUserForMenu);
        setRestrictDialogOpen(true);
        break;
    }
    handleUserMenuClose();
  };

  const filteredIncidents = incidents;
  const pendingIncidents = filteredIncidents.filter(
    (inc) => inc.status === "pending" || inc.status === "verification_needed" || (inc.status === "rejected" && inc.verificationNeeded)
  );
  const processedIncidents = filteredIncidents.filter(
    (inc) => inc.status !== "pending" && inc.status !== "verification_needed" && !(inc.status === "rejected" && inc.verificationNeeded)
  );

  const statCards = [
    {
      title: "Total Reports",
      value: stats.totalIncidents,
      icon: <TotalIcon fontSize="large" />,
    },
    {
      title: "Pending Review",
      value: stats.pendingIncidents,
      icon: <PendingIcon fontSize="large" />,
    },
    {
      title: "Approved",
      value: stats.approvedIncidents,
      icon: <ApproveIcon fontSize="large" />,
    },
    {
      title: "Completed",
      value: stats.completedIncidents,
      icon: <DoneAllIcon fontSize="large" />,
    },
    {
      title: "Active Users",
      value: userStats?.total?.activeUsers || 0,
      icon: <PeopleIcon fontSize="large" />,
    },
  ];

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  if (isLoading && incidents.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        py: 6,
        px: { xs: 2, sm: 4, md: 6 },
        minHeight: "100vh",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <Box mb={6} textAlign="center">
        <Typography variant="h3" fontWeight={800} sx={{ color: "#111827" }}>
          ADMIN DASHBOARD
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Review and manage incident reports with AI-powered assistance
        </Typography>
      </Box>

      {/* Real-time Floating Alert Popup — fixed top-right, matches mobile instant notification */}
      {showNewIncidentAlert && newIncidentData && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 9999,
            width: { xs: 'calc(100% - 48px)', sm: 380 },
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(185,28,28,0.35)',
            '@keyframes adminAlertSlideIn': {
              from: { transform: 'translateX(120%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 },
            },
            animation: 'adminAlertSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Red header bar */}
          <Box sx={{
            background: 'linear-gradient(135deg, #7f1d1d, #B91C1C)',
            px: 2.5, py: 1.5,
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            {/* Pulsing dot */}
            <Box sx={{
              width: 10, height: 10, borderRadius: '50%', bgcolor: '#FCA5A5',
              '@keyframes adminPulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.5, transform: 'scale(1.4)' },
              },
              animation: 'adminPulse 1.2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <Typography variant="caption" fontWeight={800} letterSpacing={1}
              sx={{ color: 'white', flex: 1, textTransform: 'uppercase' }}>
              🚨 New Incident Reported
            </Typography>
            <Box
              onClick={() => setShowNewIncidentAlert(false)}
              sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1, px: 0.5, '&:hover': { color: 'white' } }}
            >
              ✕
            </Box>
          </Box>

          {/* Body */}
          <Box sx={{ bgcolor: 'white', px: 2.5, py: 2 }}>
            <Box display="flex" gap={1.5} mb={1.5}>
              <Box sx={{
                width: 42, height: 42, borderRadius: 2, bgcolor: '#FEF2F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <NotificationsIcon sx={{ color: '#B91C1C', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827', mb: 0.25 }}>
                  {newIncidentData.category || 'Emergency Incident'}
                  {newIncidentData.priority && (
                    <Box component="span" sx={{
                      ml: 1, px: 0.75, py: 0.2, borderRadius: 1, fontSize: '0.65rem',
                      bgcolor: newIncidentData.priority === 'urgent' ? '#FEE2E2' : '#FEF3C7',
                      color: newIncidentData.priority === 'urgent' ? '#B91C1C' : '#92400E',
                      fontWeight: 700, textTransform: 'uppercase',
                    }}>
                      {newIncidentData.priority}
                    </Box>
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {new Date(newIncidentData.createdAt).toLocaleTimeString()} • {newIncidentData.reportedBy?.name || 'Anonymous'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 1.5, px: 1.5, py: 1, mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.78rem' }}>
                📍 {newIncidentData.location?.address || 'Location unknown'}
              </Typography>
              {newIncidentData.description && (
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.25 }}>
                  {newIncidentData.description.substring(0, 100)}{newIncidentData.description.length > 100 ? '...' : ''}
                </Typography>
              )}
            </Box>

            <Box display="flex" gap={1}>
              <Button
                fullWidth variant="contained" size="small"
                onClick={() => {
                  setSelectedIncident(newIncidentData);
                  setViewDialogOpen(true);
                  setShowNewIncidentAlert(false);
                }}
                sx={{ bgcolor: '#B91C1C', '&:hover': { bgcolor: '#991B1B' }, borderRadius: 1.5, fontWeight: 700, py: 1 }}
              >
                VIEW NOW
              </Button>
              <Button
                fullWidth variant="outlined" size="small"
                onClick={() => setShowNewIncidentAlert(false)}
                sx={{ borderColor: '#D1D5DB', color: '#6B7280', borderRadius: 1.5, fontWeight: 600, py: 1 }}
              >
                DISMISS
              </Button>
            </Box>
          </Box>

          {/* Auto-dismiss countdown bar */}
          <Box sx={{
            height: 3, bgcolor: '#FEE2E2',
            '@keyframes adminCountdown': {
              from: { width: '100%' },
              to: { width: '0%' },
            },
            '& > div': {
              height: '100%', bgcolor: '#B91C1C',
              animation: 'adminCountdown 10s linear forwards',
            },
          }}>
            <div />
          </Box>
        </Box>
      )}

      {showUpdateAlert && (
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowUpdateAlert(false)}>
              DISMISS
            </Button>
          }
          onClose={() => setShowUpdateAlert(false)}
        >
          {updateMessage}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          mb: 5,
          alignItems: "stretch",
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        {statCards.map((stat, index) => (
          <Box key={index} sx={{ flex: "1 1 0", minWidth: 180 }}>
            <StatCard title={stat.title} value={stat.value} icon={stat.icon} />
          </Box>
        ))}
      </Box>

      {/* Tabs for different views */}
      <Paper
        sx={{
          width: "100%",
          mb: 4,
          borderRadius: 3,
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ "& .MuiTab-root": { fontSize: "1.1rem", fontWeight: 600 } }}
        >
          <Tab
            icon={
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <PendingIcon />
              </Badge>
            }
            label={`Pending Review (${pendingIncidents.length})`}
            iconPosition="start"
          />
          <Tab label={`Processed (${processedIncidents.length})`} />
          <Tab label={`Map View (${incidents.length})`} />
          <Tab label="System Analytics" />
          <Tab label="User Management" />
        </Tabs>
      </Paper>

      {/* Pending Review Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Alert Banner */}
        {stats.pendingIncidents > 5 && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            }
          >
            <Typography fontWeight={600}>
              High Priority Alert: {stats.pendingIncidents} incidents awaiting
              review
            </Typography>
          </Alert>
        )}

        {/* Bulk Actions Bar */}
        {selectedIncidents.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "#dbeafe" }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleOutlineIcon sx={{ color: "#1d4ed8" }} />
                <Box>
                  <Typography fontWeight={600} color="#1e40af">
                    {selectedIncidents.length} incidents selected
                  </Typography>
                  <Typography variant="body2" color="#3b82f6">
                    Choose an action to perform on all selected incidents
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleBulkAction("approve")}
                >
                  Approve Selected
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => handleBulkAction("reject")}
                >
                  Reject Selected
                </Button>
                <IconButton onClick={(e) => setBulkMenuAnchor(e.currentTarget)}>
                  <MoreIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}

        <Grid container spacing={3} alignItems="stretch">
          {pendingIncidents.map((incident) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={incident._id}
              sx={{ display: "flex" }}
            >
              <IncidentCard
                incident={incident}
                onView={() => {
                  setSelectedIncident(incident);
                  setViewDialogOpen(true);
                }}
                onApprove={() => handleApprove(incident)}
                onReject={() => handleReject(incident)}
                selected={selectedIncidents.includes(incident._id)}
                onSelect={handleIncidentSelect}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Processed Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>AI Score</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Reported By</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processedIncidents.map((incident) => (
                <TableRow key={incident._id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{incident._id?.substring(0, 8)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 300 }}>
                      {incident.description || "No description"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={incident.category} size="small" icon={getCategoryIcon(incident.category)} />
                  </TableCell>
                  <TableCell>{incident.assignedTo?.department || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status}
                      size="small"
                      sx={{
                        bgcolor: `${statusColors[incident.status] || "#6B7280"}20`,
                        color: statusColors[incident.status] || "#6B7280",
                        fontWeight: 600,
                      }}
                      icon={getStatusIcon(incident.status)}
                    />
                  </TableCell>
                  {/* AI Score Column */}
                  <TableCell>
                    {incident.aiDetectionScore !== undefined ? (
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#374151" }}>
                          {incident.aiDetectionScore}%
                        </Typography>
                        <Chip
                          icon={<AIIcon sx={{ fontSize: "14px !important", color: incident.aiDetectionScore >= 70 ? "#065f46 !important" : incident.aiDetectionScore >= 40 ? "#92400e !important" : "#7f1d1d !important" }} />}
                          label={
                            incident.aiDetectionScore >= 70
                              ? "Verified"
                              : incident.aiDetectionScore >= 40
                              ? "Manual Review"
                              : "Not Verified"
                          }
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            bgcolor:
                              incident.aiDetectionScore >= 70
                                ? "#d1fae5"
                                : incident.aiDetectionScore >= 40
                                ? "#fef3c7"
                                : "#fee2e2",
                            color:
                              incident.aiDetectionScore >= 70
                                ? "#065f46"
                                : incident.aiDetectionScore >= 40
                                ? "#92400e"
                                : "#7f1d1d",
                            border: `1px solid ${
                              incident.aiDetectionScore >= 70
                                ? "#6ee7b7"
                                : incident.aiDetectionScore >= 40
                                ? "#fcd34d"
                                : "#fca5a5"
                            }`,
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>{incident.reportedBy?.name || "Unknown"}</TableCell>
                  <TableCell>
                    {format(parseISO(incident.createdAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setViewDialogOpen(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Map View Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper
          sx={{
            height: "calc(100vh - 300px)",
            minHeight: 600,
            width: "100%",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 3,
          }}
        >
          <IncidentMap
            incidents={incidents}
            onIncidentClick={(incident) => {
              setSelectedIncident(incident);
              setViewDialogOpen(true);
            }}
            initialCenter={[24.8607, 67.0011]}
            initialZoom={12}
          />
        </Paper>

        {/* Map Statistics */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Incident Distribution by Area
              </Typography>
              <Box
                sx={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  Spatial analysis coming soon
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Response Time Heatmap
              </Typography>
              <Box
                sx={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  Response time visualization coming soon
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        {analyticsData ? (
          <AnalyticsConsole data={analyticsData} />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={400}
          >
            <CircularProgress />
          </Box>
        )}
      </TabPanel>

      {/* User Management Tab */}
      <TabPanel value={tabValue} index={4}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5" fontWeight={700} sx={{ color: "#111827" }}>
              User Management
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton>
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setUserDialogOpen(true)}
                sx={{
                  background:
                    "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
                  color: "white",
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

          {users.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography color="text.secondary" gutterBottom>
                No users found
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      User
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Phone Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Organization
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Last Login
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: getRoleColor(user.role),
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getRoleIcon(user.role)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>
                              {user.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ID: {user._id?.substring(0, 8)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.department ||
                            user.hospital ||
                            user.ambulanceService ||
                            "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.lastLogin
                            ? formatDistanceToNow(parseISO(user.lastLogin), {
                              addSuffix: true,
                            })
                            : "Never"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewUserDetails(user)}
                              sx={{ color: "#3B82F6" }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user)}
                              sx={{ color: "#10B981" }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleUserMenuOpen(e, user)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
          },
        }}
        onClick={handleRefresh}
      >
        <RefreshIcon />
      </Fab>

      {/* View Incident Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Incident Details</Typography>
            {selectedIncident && (
              <Chip
                label={selectedIncident.status}
                size="small"
                sx={{
                  bgcolor: `${statusColors[selectedIncident.status] || "#6B7280"
                    }20`,
                  color: statusColors[selectedIncident.status] || "#6B7280",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIncident && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedIncident.description || "No description"}
                  </Typography>

                  {/* Photo Display Section */}
                  {selectedIncident.photos && selectedIncident.photos.length > 0 ? (
                    <Box sx={{ mt: 2, mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Photos ({selectedIncident.photos.length}):
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedIncident.photos.map((photo, index) => {
                          const photoUrl = getPhotoUrl(photo);
                          const fullUrl = photoUrl
                            ? photoUrl.startsWith("http")
                              ? photoUrl
                              : `${API_URL}${photoUrl}`
                            : "";

                          return (
                            <Grid item xs={4} key={index}>
                              {fullUrl ? (
                                <Box sx={{ position: "relative" }}>
                                  <CardMedia
                                    component="img"
                                    height="140"
                                    image={fullUrl}
                                    alt={
                                      photo.originalName ||
                                      `Incident photo ${index + 1}`
                                    }
                                    sx={{
                                      borderRadius: 1,
                                      objectFit: "cover",
                                      width: "100%",
                                      cursor: 'pointer',
                                      '&:hover': { opacity: 0.9 }
                                    }}
                                    onClick={() => {
                                      setZoomedImage(fullUrl);
                                      setIsZoomOpen(true);
                                    }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const errorDiv = document.createElement("div");
                                        errorDiv.style.cssText = `
                                          height: 140px;
                                          display: flex;
                                          flex-direction: column;
                                          align-items: center;
                                          justify-content: center;
                                          background-color: #ffebee;
                                          border: 1px solid #ffcdd2;
                                          border-radius: 4px;
                                          padding: 8px;
                                          text-align: center;
                                        `;
                                        errorDiv.innerHTML = `
                                          <div style="color: #d32f2f; font-size: 14px; margin-bottom: 4px;">⚠️ Image failed to load</div>
                                          <div style="color: #757575; font-size: 12px;">${photo.filename || "Unknown file"
                                          }</div>
                                        `;
                                        parent.appendChild(errorDiv);
                                      }
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Paper
                                  sx={{
                                    height: 140,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "column",
                                    borderRadius: 1,
                                    bgcolor: "#f5f5f5",
                                    p: 2,
                                  }}
                                >
                                  <Typography
                                    color="text.secondary"
                                    variant="body2"
                                    align="center"
                                  >
                                    No Image URL
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    align="center"
                                  >
                                    {photo.filename || "No filename"}
                                  </Typography>
                                </Paper>
                              )}
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        mt: 2,
                        mb: 3,
                        p: 2,
                        bgcolor: "#f5f5f5",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        No photos available for this incident
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reported By
                  </Typography>
                  <Typography variant="body1">
                    {selectedIncident.reportedBy?.name || "Unknown"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedIncident.reportedBy?.email} •{" "}
                    {selectedIncident.reportedBy?.phone}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {selectedIncident.location?.address || "Unknown location"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip
                    label={selectedIncident.category}
                    icon={getCategoryIcon(selectedIncident.category)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {format(
                      parseISO(selectedIncident.createdAt),
                      "MMM dd, yyyy HH:mm:ss"
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {format(
                      parseISO(selectedIncident.updatedAt),
                      "MMM dd, yyyy HH:mm:ss"
                    )}
                  </Typography>
                </Grid>
                {selectedIncident.assignedTo && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {selectedIncident.assignedTo.department}
                      </Typography>
                      {selectedIncident.assignedTo.driverName && (
                        <Typography variant="body2" color="text.secondary">
                          • Driver: {selectedIncident.assignedTo.driverName}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}
                {selectedIncident.aiDetectionScore !== undefined && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                      AI IDENTIFICATION CONFIDENCE
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2} sx={{ p: 2, bgcolor: "#f9fafb", borderRadius: 3, border: "1px solid #e5e7eb" }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedIncident.aiDetectionScore}
                          sx={{
                            height: 12,
                            borderRadius: 6,
                            bgcolor: "#e5e7eb",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 6,
                              bgcolor: selectedIncident.aiDetectionScore >= 70 ? "#10b981" : selectedIncident.aiDetectionScore >= 40 ? "#f59e0b" : "#ef4444",
                              boxShadow: selectedIncident.aiDetectionScore >= 70 ? "0 0 15px rgba(16, 185, 129, 0.4)" : "none"
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ textAlign: "right", minWidth: 80 }}>
                        <Typography variant="h5" fontWeight={800} sx={{ color: selectedIncident.aiDetectionScore >= 70 ? "#059669" : selectedIncident.aiDetectionScore >= 40 ? "#d97706" : "#dc2626", lineHeight: 1 }}>
                          {selectedIncident.aiDetectionScore}%
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>
                          {selectedIncident.aiDetectionScore >= 70 ? "High Trust" : selectedIncident.aiDetectionScore >= 40 ? "Medium Trust" : "Low Trust"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* LIVE TRACKING STATUS PANEL                             */}
                {/* ═══════════════════════════════════════════════════════ */}
                {(selectedIncident.status !== "pending" && selectedIncident.status !== "rejected") && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: 1, color: "#374151", fontSize: "0.7rem" }}>
                      Live Tracking Status
                    </Typography>
                    <Grid container spacing={2}>
                      {/* Department Card */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{
                          p: 2, borderRadius: 3,
                          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                          border: "1px solid #bfdbfe",
                          textAlign: "center",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(59,130,246,0.15)" }
                        }}>
                          <DepartmentIcon sx={{ fontSize: 28, color: "#2563eb", mb: 0.5 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.5, display: "block", fontSize: "0.65rem" }}>
                            Department
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#1e3a5f", mt: 0.5 }}>
                            {selectedIncident.assignedTo?.department || "Not Assigned"}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Driver Card */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{
                          p: 2, borderRadius: 3,
                          background: selectedIncident.driverStatus === "transporting"
                            ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                            : selectedIncident.driverStatus === "delivered" || selectedIncident.driverStatus === "completed"
                              ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                              : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                          border: selectedIncident.driverStatus === "transporting"
                            ? "1px solid #fbbf24"
                            : selectedIncident.driverStatus === "delivered" || selectedIncident.driverStatus === "completed"
                              ? "1px solid #6ee7b7"
                              : "1px solid #d1d5db",
                          textAlign: "center",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }
                        }}>
                          <CarIcon sx={{
                            fontSize: 28, mb: 0.5,
                            color: selectedIncident.driverStatus === "transporting" ? "#d97706"
                              : selectedIncident.driverStatus === "delivered" || selectedIncident.driverStatus === "completed" ? "#059669"
                              : "#6b7280",
                            animation: selectedIncident.driverStatus === "transporting" ? "pulse 2s infinite" : "none",
                            "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } }
                          }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5, display: "block", fontSize: "0.65rem" }}>
                            Driver
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#111827", mt: 0.5 }}>
                            {selectedIncident.assignedTo?.driverName || "Not Assigned"}
                          </Typography>
                          <Chip
                            label={(selectedIncident.driverStatus || "pending").replace(/_/g, " ").toUpperCase()}
                            size="small"
                            sx={{
                              mt: 0.5, fontWeight: 700, fontSize: "0.6rem",
                              bgcolor: selectedIncident.driverStatus === "transporting" ? "#fbbf24"
                                : selectedIncident.driverStatus === "delivered" || selectedIncident.driverStatus === "completed" ? "#10b981"
                                : selectedIncident.driverStatus === "arrived" ? "#3b82f6"
                                : "#9ca3af",
                              color: "#fff"
                            }}
                          />
                        </Box>
                      </Grid>

                      {/* Hospital Card */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{
                          p: 2, borderRadius: 3,
                          background: selectedIncident.hospitalStatus === "admitted"
                            ? "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)"
                            : selectedIncident.hospitalStatus === "discharged"
                              ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                              : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                          border: selectedIncident.hospitalStatus === "admitted"
                            ? "1px solid #f9a8d4"
                            : selectedIncident.hospitalStatus === "discharged"
                              ? "1px solid #6ee7b7"
                              : "1px solid #d1d5db",
                          textAlign: "center",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }
                        }}>
                          <HospitalIcon sx={{
                            fontSize: 28, mb: 0.5,
                            color: selectedIncident.hospitalStatus === "admitted" ? "#db2777"
                              : selectedIncident.hospitalStatus === "discharged" ? "#059669"
                              : "#6b7280"
                          }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5, display: "block", fontSize: "0.65rem" }}>
                            Hospital
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#111827", mt: 0.5 }}>
                            {selectedIncident.patientStatus?.hospital || "Pending"}
                          </Typography>
                          <Chip
                            label={(selectedIncident.hospitalStatus || "pending").toUpperCase()}
                            size="small"
                            sx={{
                              mt: 0.5, fontWeight: 700, fontSize: "0.6rem",
                              bgcolor: selectedIncident.hospitalStatus === "admitted" ? "#ec4899"
                                : selectedIncident.hospitalStatus === "incoming" ? "#f59e0b"
                                : selectedIncident.hospitalStatus === "discharged" ? "#10b981"
                                : "#9ca3af",
                              color: "#fff"
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* PATIENT INFORMATION                                    */}
                {/* ═══════════════════════════════════════════════════════ */}
                {selectedIncident.patientStatus && (selectedIncident.patientStatus.condition || selectedIncident.patientStatus.hospital) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: 1, color: "#374151", fontSize: "0.7rem" }}>
                      Patient Information
                    </Typography>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#fdf2f8", border: "1px solid #fce7f3" }}>
                      <Grid container spacing={2}>
                        {selectedIncident.patientStatus.condition && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Condition</Typography>
                            <Typography variant="body2" fontWeight={700}>{selectedIncident.patientStatus.condition}</Typography>
                          </Grid>
                        )}
                        {selectedIncident.patientStatus.hospital && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Hospital</Typography>
                            <Typography variant="body2" fontWeight={700}>{selectedIncident.patientStatus.hospital}</Typography>
                          </Grid>
                        )}
                        {selectedIncident.patientStatus.doctor && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Doctor</Typography>
                            <Typography variant="body2" fontWeight={700}>{selectedIncident.patientStatus.doctor}</Typography>
                          </Grid>
                        )}
                        {selectedIncident.patientStatus.bedNumber && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Bed Number</Typography>
                            <Typography variant="body2" fontWeight={700}>{selectedIncident.patientStatus.bedNumber}</Typography>
                          </Grid>
                        )}
                        {selectedIncident.patientStatus.treatment && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Treatment</Typography>
                            <Typography variant="body2" fontWeight={700}>{selectedIncident.patientStatus.treatment}</Typography>
                          </Grid>
                        )}
                        {selectedIncident.patientStatus.medicalNotes && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Medical Notes</Typography>
                            <Typography variant="body2" sx={{ fontStyle: "italic", color: "#6b7280" }}>{selectedIncident.patientStatus.medicalNotes}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* INCIDENT TIMELINE                                      */}
                {/* ═══════════════════════════════════════════════════════ */}
                {selectedIncident.actions && selectedIncident.actions.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: 1, color: "#374151", fontSize: "0.7rem" }}>
                      Incident Timeline
                    </Typography>
                    <Box sx={{ position: "relative", pl: 4 }}>
                      {/* Vertical line */}
                      <Box sx={{
                        position: "absolute", left: 11, top: 8, bottom: 8, width: 2,
                        background: "linear-gradient(180deg, #3b82f6 0%, #8b5cf6 50%, #10b981 100%)",
                        borderRadius: 1
                      }} />

                      {[...selectedIncident.actions].reverse().map((act, idx) => {
                        const actionLabels: Record<string, { label: string; color: string; icon: string }> = {
                          created: { label: "Incident Reported", color: "#3b82f6", icon: "📋" },
                          approved: { label: "Approved by Admin", color: "#10b981", icon: "✅" },
                          approved_and_assigned: { label: "Approved & Assigned to Department", color: "#10b981", icon: "✅" },
                          rejected: { label: "Rejected", color: "#ef4444", icon: "❌" },
                          assigned: { label: "Assigned to Department", color: "#8b5cf6", icon: "🏢" },
                          department_assigned: { label: "Department Assigned", color: "#8b5cf6", icon: "🏢" },
                          driver_assigned: { label: "Driver Assigned", color: "#6366f1", icon: "🚗" },
                          driver_accepted: { label: "Driver Accepted Mission", color: "#059669", icon: "🤝" },
                          driver_rejected: { label: "Driver Declined", color: "#dc2626", icon: "🚫" },
                          driver_arrived: { label: "Driver Arrived at Scene", color: "#f59e0b", icon: "📍" },
                          driver_transporting: { label: "Patient Being Transported", color: "#d97706", icon: "🚑" },
                          driver_delivered: { label: "Patient Delivered to Hospital", color: "#10b981", icon: "🏥" },
                          status_update: { label: "Status Updated", color: "#6b7280", icon: "🔄" },
                          hospital_admitted: { label: "Patient Admitted to Hospital", color: "#ec4899", icon: "🏥" },
                          hospital_discharged: { label: "Patient Discharged", color: "#10b981", icon: "🎉" },
                          completed: { label: "Incident Completed", color: "#059669", icon: "🏁" },
                          dual_verification_required: { label: "AI Dual Verification Required", color: "#f59e0b", icon: "🤖" },
                          auto_approved: { label: "Auto-Approved by AI", color: "#10b981", icon: "🤖" },
                          admin_verification_required: { label: "Admin Verification Required", color: "#f59e0b", icon: "👁️" },
                        };

                        const info = actionLabels[act.action] || { label: act.action?.replace(/_/g, " ") || "Unknown", color: "#6b7280", icon: "📌" };

                        return (
                          <Box key={idx} sx={{ position: "relative", mb: 2.5, "&:last-child": { mb: 0 } }}>
                            {/* Dot */}
                            <Box sx={{
                              position: "absolute", left: -29, top: 4,
                              width: 14, height: 14, borderRadius: "50%",
                              bgcolor: info.color,
                              border: "3px solid #fff",
                              boxShadow: `0 0 0 2px ${info.color}40`,
                              zIndex: 1
                            }} />

                            {/* Content Card */}
                            <Box sx={{
                              p: 1.5, borderRadius: 2.5,
                              bgcolor: "#f9fafb", border: "1px solid #e5e7eb",
                              transition: "all 0.2s",
                              "&:hover": { bgcolor: "#f3f4f6", borderColor: info.color, boxShadow: `0 2px 8px ${info.color}15` }
                            }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography sx={{ fontSize: "1rem" }}>{info.icon}</Typography>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: "#111827" }}>
                                    {info.label}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500, whiteSpace: "nowrap" }}>
                                  {act.timestamp ? format(parseISO(act.timestamp), "MMM dd, HH:mm") : "—"}
                                </Typography>
                              </Box>
                              {act.performedBy?.name && (
                                <Typography variant="caption" sx={{ color: "#6b7280", mt: 0.3, display: "block" }}>
                                  by {act.performedBy.name} ({act.performedBy.role || "user"})
                                </Typography>
                              )}
                              {act.details && typeof act.details === "object" && (
                                <Box sx={{ mt: 0.5 }}>
                                  {act.details.department && (
                                    <Chip label={act.details.department} size="small" sx={{ mr: 0.5, mt: 0.5, fontWeight: 600, fontSize: "0.6rem", bgcolor: "#dbeafe", color: "#1e40af" }} />
                                  )}
                                  {act.details.reason && (
                                    <Typography variant="caption" sx={{ color: "#9ca3af", fontStyle: "italic", display: "block", mt: 0.3 }}>
                                      {act.details.reason}
                                    </Typography>
                                  )}
                                  {act.details.message && (
                                    <Typography variant="caption" sx={{ color: "#9ca3af", fontStyle: "italic", display: "block", mt: 0.3 }}>
                                      {act.details.message}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Grid>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* KEY TIMESTAMPS                                         */}
                {/* ═══════════════════════════════════════════════════════ */}
                {selectedIncident.timestamps && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: 1, color: "#374151", fontSize: "0.7rem" }}>
                      Key Timestamps
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {[
                        { label: "Reported", value: selectedIncident.timestamps.reportedAt, color: "#3b82f6" },
                        { label: "Assigned", value: selectedIncident.timestamps.assignedAt, color: "#8b5cf6" },
                        { label: "Arrived", value: selectedIncident.timestamps.arrivedAt, color: "#f59e0b" },
                        { label: "Transporting", value: selectedIncident.timestamps.transportingAt, color: "#d97706" },
                        { label: "Delivered", value: selectedIncident.timestamps.deliveredAt, color: "#10b981" },
                        { label: "Admitted", value: selectedIncident.timestamps.admittedAt, color: "#ec4899" },
                        { label: "Discharged", value: selectedIncident.timestamps.dischargedAt, color: "#059669" },
                        { label: "Completed", value: selectedIncident.timestamps.completedAt, color: "#059669" },
                      ].filter(t => t.value).map((t, i) => (
                        <Chip
                          key={i}
                          label={`${t.label}: ${format(parseISO(t.value as string), "MMM dd, HH:mm")}`}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: "0.65rem",
                            bgcolor: `${t.color}15`, color: t.color,
                            border: `1px solid ${t.color}30`,
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            width: '100%',
            m: 0,
            p: 0,
            background: 'transparent',
          }}
        >
          <Button
            onClick={() => setViewDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(218, 15, 32, 0.08)",
              },
            }}
          >
            Close
          </Button>
          {(selectedIncident?.status === "pending" || selectedIncident?.status === "verification_needed") && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => handleApprove(selectedIncident)}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleReject(selectedIncident)}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog
        open={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.85)',
            boxShadow: 'none',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            m: 0,
            maxWidth: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', width: 'auto', height: 'auto', p: 4 }}>
          <IconButton
            onClick={() => setIsZoomOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              zIndex: 10
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={zoomedImage || ''}
            alt="Zoomed Incident"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '4px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
            }}
          />
        </Box>
      </Dialog>

      {/* Manual Assign Department Dialog - Only for manual override */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setAssignDepartment("");
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          Manual Department Assignment
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom sx={{ mb: 2 }}>
            Select department to manually assign (optional - system normally auto-assigns nearest driver):
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Department *</InputLabel>
            <Select
              value={assignDepartment}
              label="Select Department *"
              onChange={(e) => setAssignDepartment(e.target.value)}
              required
            >
              <MenuItem value="Edhi Foundation">Edhi Foundation</MenuItem>
              <MenuItem value="Chippa Ambulance">Chippa Ambulance</MenuItem>
            </Select>
          </FormControl>
          {selectedIncidents.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This will manually assign {selectedIncidents.length} incidents to {assignDepartment || "selected department"}.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAssignDialogOpen(false);
              setAssignDepartment("");
            }}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmManualAssign}
            color="primary"
            variant="contained"
            disabled={!assignDepartment}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            {selectedIncidents.length > 0
              ? `Assign ${selectedIncidents.length} Incidents`
              : selectedIncident
                ? "Assign Incident"
                : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectReason("");
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          {selectedIncidents.length > 0
            ? "Reject Selected Incidents"
            : "Reject Incident"}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {selectedIncidents.length > 0
              ? `Please provide a reason for rejecting ${selectedIncidents.length} incidents:`
              : `Please provide a reason for rejecting incident ${selectedIncident?._id?.substring(
                0,
                8
              )}:`}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason *"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 2 }}
            error={rejectReason.length > 0 && rejectReason.trim() === ""}
            helperText={rejectReason.length > 0 && rejectReason.trim() === "" ? "Reason cannot be just whitespace" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectReason("");
            }}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmReject}
            color="error"
            variant="contained"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
              // Truly invisible and non-clickable when empty as requested
              opacity: rejectReason.trim() ? 1 : 0,
              pointerEvents: rejectReason.trim() ? 'auto' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: "#ef4444",
              "&:hover": {
                backgroundColor: "#dc2626",
              },
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog
        open={viewUserDialogOpen}
        onClose={() => setViewUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          User Details
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" gap={3} mb={3}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: getRoleColor(selectedUser.role),
                    fontSize: "2rem",
                  }}
                >
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip
                      label={selectedUser.role}
                      color={getRoleColor(selectedUser.role)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={selectedUser.status}
                      color={getStatusColor(selectedUser.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedUser.phone || "Not provided"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    CNIC
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedUser.cnic || "Not provided"}
                  </Typography>
                </Grid>

                {selectedUser.department && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.department}
                    </Typography>
                  </Grid>
                )}

                {selectedUser.hospital && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Hospital
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.hospital}
                    </Typography>
                  </Grid>
                )}

                {selectedUser.ambulanceService && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Ambulance Service
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.ambulanceService}
                    </Typography>
                  </Grid>
                )}

                {selectedUser.drivingLicense && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Driving License
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.drivingLicense}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {format(
                      parseISO(selectedUser.createdAt),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Login
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedUser.lastLogin
                      ? formatDistanceToNow(parseISO(selectedUser.lastLogin), {
                        addSuffix: true,
                      })
                      : "Never"}
                  </Typography>
                </Grid>

                {selectedUser.restrictionEndDate && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      <Typography variant="body2">
                        Restricted until:{" "}
                        {format(
                          parseISO(selectedUser.restrictionEndDate),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setViewUserDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editUserDialogOpen}
        onClose={() => {
          setEditUserDialogOpen(false);
          setEditingUser({});
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          Edit User: {editingUser.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={editingUser.name || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                margin="normal"
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
                margin="normal"
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
                margin="normal"
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
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
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
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
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

            {(editingUser.role === "driver" ||
              editingUser.role === "department") && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
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
                      <MenuItem value="Edhi Foundation">Edhi Foundation</MenuItem>
                      <MenuItem value="Chippa Ambulance">
                        Chippa Ambulance
                      </MenuItem>
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
                    margin="normal"
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
                    margin="normal"
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
                    setEditingUser({ ...editingUser, hospital: e.target.value })
                  }
                  margin="normal"
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
                margin="normal"
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditUserDialogOpen(false);
              setEditingUser({});
            }}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
              color: "white",
              borderRadius: "12px",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          Create New User
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name *"
                fullWidth
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email *"
                fullWidth
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
                label="Phone *"
                fullWidth
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
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
                    setNewUser({ ...newUser, role: e.target.value as any })
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
            {(newUser.role === "driver" || newUser.role === "department") && (
              <Grid item xs={12}>
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
            {newUser.role === "driver" && (
              <Grid item xs={12}>
                <TextField
                  label="Ambulance Service"
                  fullWidth
                  value={newUser.ambulanceService}
                  onChange={(e) =>
                    setNewUser({ ...newUser, ambulanceService: e.target.value })
                  }
                />
              </Grid>
            )}
            {newUser.role === "hospital" && (
              <Grid item xs={12}>
                <TextField
                  label="Hospital Name"
                  fullWidth
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
          <Button
            onClick={() => setUserDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)",
              color: "white",
              borderRadius: "12px",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              },
            }}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restrict User Dialog */}
      <Dialog
        open={restrictDialogOpen}
        onClose={() => setRestrictDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#111827" }}>
          Restrict User Access
        </DialogTitle>
        <DialogContent>
          {selectedActionUser && (
            <>
              <Typography gutterBottom>
                Restrict user <strong>{selectedActionUser.name}</strong> for:
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Restriction Period</InputLabel>
                <Select
                  value={restrictDays}
                  onChange={(e) => setRestrictDays(Number(e.target.value))}
                  label="Restriction Period"
                >
                  <MenuItem value={1}>1 Day</MenuItem>
                  <MenuItem value={7}>7 Days</MenuItem>
                  <MenuItem value={30}>30 Days</MenuItem>
                  <MenuItem value={90}>90 Days</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="warning" sx={{ mt: 2 }}>
                User will not be able to login during the restriction period.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setRestrictDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(100, 116, 139, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedActionUser) {
                handleRestrictUser(
                  selectedActionUser._id || selectedActionUser.id,
                  restrictDays
                );
              }
            }}
            variant="contained"
            color="warning"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Restrict User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkAction("approve")}>
          <ListItemIcon>
            <ApproveIcon fontSize="small" />
          </ListItemIcon>
          Approve Selected
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("reject")}>
          <ListItemIcon>
            <RejectIcon fontSize="small" />
          </ListItemIcon>
          Reject Selected
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("assign")}>
          <ListItemIcon>
            <DepartmentIcon fontSize="small" />
          </ListItemIcon>
          Manual Assign
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction("clear")}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Clear Selection
        </MenuItem>
      </Menu>

      {/* User Actions Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => handleUserMenuAction("view")}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuAction("edit")}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit User
        </MenuItem>
        <MenuItem onClick={() => handleUserMenuAction("restrict")}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          Restrict User
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (selectedUserForMenu) {
              handleUserMenuAction("delete");
            }
          }}
          sx={{ color: "#DC2626" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete User
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
