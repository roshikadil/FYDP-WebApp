import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Tab,
  Tabs,
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  InputAdornment,
  TableHead,
  Snackbar,
} from "@mui/material";
import {
  LocalHospital as HospitalIcon,
  DirectionsCar as AmbulanceIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  NotificationsActive as NotificationIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MedicalServices as MedicalIcon,
  Visibility as ViewIcon,
  MedicalServices as AdmitIcon,
  ExitToApp as DischargeIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Map as MapIcon,
  Navigation as NavigationIcon,
  Warning as EmergencyIcon,
} from "@mui/icons-material";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from "../contexts/AuthContext";
import HospitalService, {
  HospitalIncident,
  HospitalStats,
  JINNAH_HOSPITAL_COORDS,
  getSafeCoordinates
} from "../services/hospitalService";
import PatientDetailsDialog from "../components/PatientDetailsDialog";
import { SocketService } from '../services/SocketService';
import AnalyticsConsole from '../components/AnalyticsConsole';
import { BarChart as StatsIcon } from '@mui/icons-material';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom DivIcon markers - EXACT SAME as DriverIncidentDetail
const driverMarkerIcon = new L.DivIcon({
  className: '',
  html: `<div style="display:flex; flex-direction:column; align-items:center; width:40px;">
    <div style="background:#C62828;width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(198,40,40,0.4);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
    </div><div style="background:#C62828;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:bold;color:white;text-align:center;margin-top:2px;">DRIVER</div>
  </div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 17],
});

const incidentMarkerIcon = new L.DivIcon({
  className: '',
  html: `<div style="display:flex; flex-direction:column; align-items:center; width:40px;">
    <div style="background:#E65100;width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(230,81,0,0.4);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
    </div><div style="background:#E65100;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:bold;color:white;text-align:center;margin-top:2px;">SCENE</div>
  </div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 17],
});

const hospitalMarkerIcon = new L.DivIcon({
  className: '',
  html: `<div style="display:flex; flex-direction:column; align-items:center; width:40px;">
    <div style="background:#1565C0;width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(21,101,192,0.4);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
    </div><div style="background:#1565C0;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:bold;color:white;text-align:center;margin-top:2px;">HOSPITAL</div>
  </div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 17],
});

// Helper component to fit map bounds
const MapBoundsFitter = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);
  return null;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hospital-tabpanel-${index}`}
      aria-labelledby={`hospital-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [incomingIncidents, setIncomingIncidents] = useState<
    HospitalIncident[]
  >([]);
  const [admittedIncidents, setAdmittedIncidents] = useState<
    HospitalIncident[]
  >([]);
  const [dischargedIncidents, setDischargedIncidents] = useState<
    HospitalIncident[]
  >([]);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats>({
    incomingCases: 0,
    receivedCases: 0,
    hospitalStats: [],
    incomingIncidents: [],
    hospitalName: user?.hospital || "Hospital",
  });
  const [selectedIncident, setSelectedIncident] =
    useState<HospitalIncident | null>(null);
  const [admitDialog, setAdmitDialog] = useState(false);
  const [dischargeDialog, setDischargeDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [admitForm, setAdmitForm] = useState({
    medicalNotes: "",
    treatment: "",
    doctor: "",
    bedNumber: "",
  });
  const [dischargeForm, setDischargeForm] = useState({
    medicalNotes: "",
    treatment: "",
  });
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Real-time tracking states
  const [ambulanceLocations, setAmbulanceLocations] = useState<Record<string, {lat: number, lng: number, timestamp: Date}>>({});
  const [trackingIncident, setTrackingIncident] = useState<HospitalIncident | null>(null);
  const [trackingDialog, setTrackingDialog] = useState(false);
  const [showArrivalAlert, setShowArrivalAlert] = useState(false);
  const [arrivalIncidentId, setArrivalIncidentId] = useState<string | null>(null);
  
  // Hospital Request states
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [currentRequest, setCurrentRequest] = useState<any | null>(null);
  const [requestDialog, setRequestDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' });
  const [arrivalDialog, setArrivalDialog] = useState(false);
  const [trackingRequestData, setTrackingRequestData] = useState<any>(null);

  // Simulation states (matches mobile parity logic)
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [simLocation, setSimLocation] = useState<[number, number] | null>(null);
  const autoSimulatedIdsRef = useRef<Set<string>>(new Set());
  const simulationStateRef = useRef<{
    startLat: number;
    startLng: number;
    targetLat: number;
    targetLng: number;
    step: number;
    totalSteps: number;
    incidentId: string;
  } | null>(null);

  // Statistics calculations
  const incomingCases = incomingIncidents.length;
  const admittedCases = admittedIncidents.length;
  const dischargedCases = dischargedIncidents.length;
  const totalCases = incomingCases + admittedCases + dischargedCases;
  const hospitalName = hospitalStats.hospitalName || user?.hospital || "Hospital";

  const analyticsData = React.useMemo(() => {
    return {}; // Use centralized fallback in AnalyticsConsole
  }, [incomingCases, admittedCases, dischargedCases, totalCases]);

  useEffect(() => {
    initializeHospitalData();
  }, []);

  const initializeHospitalData = async () => {
    console.log("🏥 Initializing hospital data...");
    setIsLoading(true);

    try {
      await loadHospitalData();
      await loadHospitalStats();
      await loadPendingRequests();
      console.log("✅ Hospital data loaded successfully");
    } catch (error) {
      console.error("❌ Error loading hospital data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHospitalData = async () => {
    try {
      const result = await HospitalService.getHospitalIncidents();
      if (result.success && result.data) {
        setIncomingIncidents(result.data.incoming || []);
        setAdmittedIncidents(result.data.admitted || []);
        setDischargedIncidents(result.data.discharged || []);
      }
    } catch (error) {
      console.error("❌ Error loading hospital incidents:", error);
    }
  };

  const loadHospitalStats = async () => {
    try {
      const result = await HospitalService.getHospitalStats();
      if (result.success && result.data) {
        setHospitalStats(result.data);
      }
    } catch (error) {
      console.error("❌ Error loading hospital stats:", error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const result = await HospitalService.getPendingRequests();
      if (result.success) {
        setPendingRequests(result.data);
        if (result.data.length > 0) {
          setCurrentRequest(result.data[0]);
        }
      }
    } catch (error) {
      console.error("❌ Error loading pending requests:", error);
    }
  };

  // Simulation Logic
  const stopSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    simulationStateRef.current = null;
    setIsSimulating(false);
  }, []);

  const startSimulation = useCallback((targetLat: number, targetLng: number, incidentId: string, forceStartLat?: number, forceStartLng?: number) => {
    stopSimulation();
    setIsSimulating(true);
    
    const currentLoc = ambulanceLocations[incidentId];
    let startLat = forceStartLat || currentLoc?.lat || 24.8607;
    let startLng = forceStartLng || currentLoc?.lng || 67.0011;

    const totalSteps = 30; // must match driver simulation speed
    
    simulationStateRef.current = {
      startLat,
      startLng,
      targetLat,
      targetLng,
      step: 0,
      totalSteps,
      incidentId
    };

    simulationTimerRef.current = setInterval(() => {
      if (!simulationStateRef.current) return;
      
      simulationStateRef.current.step++;
      const { step, totalSteps, startLat, startLng, targetLat, targetLng } = simulationStateRef.current;

      if (step >= totalSteps) {
        stopSimulation();
        setSimLocation([targetLat, targetLng]);
        setAmbulanceLocations(prev => ({
          ...prev,
          [incidentId]: { lat: targetLat, lng: targetLng, timestamp: new Date() }
        }));
        return;
      }

      const t = step / totalSteps;
      const lat = startLat + (targetLat - startLat) * t;
      const lng = startLng + (targetLng - startLng) * t;
      
      setSimLocation([lat, lng]);
      setAmbulanceLocations(prev => ({
        ...prev,
        [incidentId]: { lat, lng, timestamp: new Date() }
      }));
    }, 1000);
  }, [stopSimulation, ambulanceLocations]);

  // Respond to request
  const handleRespondToRequest = async (response: 'accepted' | 'rejected') => {
    if (!currentRequest) return;
    
    // Store request data before clearing
    const requestData = { ...currentRequest };
    
    try {
      const incidentId = currentRequest.incidentId;
      const result = await HospitalService.respondToHospitalRequest(incidentId, response);
      
      if (result.success) {
        setSnackbar({ 
          open: true, 
          message: `Request ${response === 'accepted' ? 'ACCEPTED' : 'REJECTED'} successfully!`, 
          severity: response === 'accepted' ? 'success' : 'info' 
        });
        
        setRequestDialog(false);
        setCurrentRequest(null);
        
        // Remove from pending list
        setPendingRequests(prev => prev.filter(r => r.incidentId !== incidentId));
        
        if (response === 'accepted') {
          // Store request data for tracking overlay
          setTrackingRequestData(requestData);
          
          // Reload data first, then open tracking
          await loadHospitalData();
          await loadPendingRequests();
          
          // Find the incident and open live tracking
          const updatedResult = await HospitalService.getHospitalIncidents();
          if (updatedResult.success) {
            const allIncidents = [...(updatedResult.data.incoming || []), ...(updatedResult.data.admitted || [])];
            const incident = allIncidents.find((i: any) => i.id === incidentId || i._id === incidentId);
            if (incident) {
              handleTrackPatient(incident);
            } else {
              // Create a minimal tracking incident from request data
              setTrackingIncident({
                id: incidentId, _id: incidentId,
                hospitalRequest: requestData,
                location: requestData.location,
              } as any);
              setTrackingDialog(true);
            }
          }
        } else {
          loadPendingRequests();
          loadHospitalData();
        }
      } else {
        setSnackbar({ open: true, message: `Error: ${result.error}`, severity: 'error' });
      }
    } catch (error) {
      console.error("Error responding to request:", error);
    }
  };

  // Socket Listeners
  useEffect(() => {
    if (!user) return;
    
    SocketService.joinHospitalRoom(user.id || user._id);
    
    const handleHospitalRequest = (data: any) => {
      console.log('🏥 NEW HOSPITAL REQUEST RECEIVED:', data);
      setCurrentRequest(data);
      setRequestDialog(true);
      loadPendingRequests();
      loadHospitalData();
    };

    const handleIncidentUpdated = (incident: HospitalIncident) => {
      console.log('🔄 INCIDENT UPDATED:', incident);
      loadHospitalData();
      
      // When driver starts transporting, run a MATCHING simulation (scene → hospital)
      if (incident.driverStatus === 'transporting') {
        const incidentId = incident.id || incident._id;
        if (incidentId && !autoSimulatedIdsRef.current.has(incidentId)) {
          autoSimulatedIdsRef.current.add(incidentId);
          const sceneCoords = getSafeCoordinates(incident.location);
          if (sceneCoords) {
            // Start simulation from scene to hospital — same 60 steps as driver
            startSimulation(JINNAH_HOSPITAL_COORDS[0], JINNAH_HOSPITAL_COORDS[1], incidentId, sceneCoords[0], sceneCoords[1]);
          }
          // Auto-open tracking dialog
          if (!trackingDialog) {
            const inc = incomingIncidents.find(i => i.id === incidentId || i._id === incidentId);
            if (inc) handleTrackPatient(inc);
          }
        }
      }
    };

    // During simulation, ignore socket updates so marker stays on the line
    const handleLocationUpdate = (data: any) => {
      if (isSimulating) return; // Don't override simulation position
      setAmbulanceLocations(prev => ({
        ...prev,
        [data.incidentId]: {
          lat: data.latitude,
          lng: data.longitude,
          timestamp: new Date()
        }
      }));
    };

    const handleArrival = (data: any) => {
      console.log('🏥 AMBULANCE ARRIVED:', data);
      setArrivalIncidentId(data.incidentId);
      stopSimulation();
      setTrackingDialog(false);
      // Show mobile-style "Patient Arriving!" dialog
      setArrivalDialog(true);
      setShowArrivalAlert(true);
      loadHospitalData();
      setTabValue(0);
    };

    SocketService.on('hospitalRequest', handleHospitalRequest);
    SocketService.on('incidentUpdated', handleIncidentUpdated);
    SocketService.on('driverLocationUpdate', handleLocationUpdate);
    SocketService.on('driverArrivedAtHospital', handleArrival);

    return () => {
      SocketService.off('hospitalRequest', handleHospitalRequest);
      SocketService.off('incidentUpdated', handleIncidentUpdated);
      SocketService.off('driverLocationUpdate', handleLocationUpdate);
      SocketService.off('driverArrivedAtHospital', handleArrival);
    };
  }, [user, isSimulating, startSimulation, stopSimulation, incomingIncidents]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await Promise.all([loadHospitalData(), loadHospitalStats(), loadPendingRequests()]);
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleViewDetails = (incident: HospitalIncident) => {
    setSelectedIncident(incident);
    setDetailsDialog(true);
  };

  const handleAdmitPatient = (incident: HospitalIncident) => {
    setSelectedIncident(incident);
    setAdmitForm({
      medicalNotes: incident.patientStatus?.medicalNotes || "Patient admitted for treatment",
      treatment: incident.patientStatus?.treatment || "Initial assessment and admission",
      doctor: incident.patientStatus?.doctor || `Dr. ${hospitalName}`,
      bedNumber: incident.patientStatus?.bedNumber || `${(admittedIncidents.length + 1).toString().padStart(2, "0")}`,
    });
    setAdmitDialog(true);
  };

  const handleDischargePatient = (incident: HospitalIncident) => {
    setSelectedIncident(incident);
    setDischargeForm({
      medicalNotes: incident.patientStatus?.medicalNotes || "Patient discharged after treatment",
      treatment: incident.patientStatus?.treatment || "Completed treatment and recovery",
    });
    setDischargeDialog(true);
  };

  const handleTrackPatient = (incident: HospitalIncident) => {
    setTrackingIncident(incident);
    setTrackingDialog(true);
  };

  const confirmAdmitPatient = async () => {
    if (!selectedIncident) return;
    try {
      const result = await HospitalService.updateHospitalWorkflowStatus(
        selectedIncident.id,
        "admitted",
        admitForm.medicalNotes,
        admitForm.treatment,
        admitForm.doctor,
        admitForm.bedNumber
      );
      if (result.success) {
        await loadHospitalData();
        await loadHospitalStats();
        setAdmitDialog(false);
        setDetailsDialog(false);
        setShowArrivalAlert(false);
      }
    } catch (error) {
      console.error("❌ Error admitting patient:", error);
    }
  };

  const confirmDischargePatient = async () => {
    if (!selectedIncident) return;
    try {
      const result = await HospitalService.updateHospitalWorkflowStatus(
        selectedIncident.id,
        "discharged",
        dischargeForm.medicalNotes,
        dischargeForm.treatment,
        admitForm.doctor || `Dr. ${hospitalName}`
      );
      if (result.success) {
        await loadHospitalData();
        await loadHospitalStats();
        setDischargeDialog(false);
        setDetailsDialog(false);
      }
    } catch (error) {
      console.error("❌ Error discharging patient:", error);
    }
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchor(null);
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    handleFilterMenuClose();
  };

  const getFilteredIncidents = (incidents: HospitalIncident[]) => {
    let filtered = incidents;
    if (searchQuery) {
      filtered = filtered.filter(incident =>
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.reportedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedFilter !== "all") {
      filtered = filtered.filter(incident =>
        incident.priority?.toLowerCase() === selectedFilter ||
        incident.patientStatus?.condition?.toLowerCase() === selectedFilter
      );
    }
    return filtered;
  };

  const filteredIncoming = getFilteredIncidents(incomingIncidents);
  const filteredAdmitted = getFilteredIncidents(admittedIncidents);
  const filteredDischarged = getFilteredIncidents(dischargedIncidents);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "incoming": return <Chip label="Incoming" color="warning" size="small" />;
      case "admitted": return <Chip label="Admitted" color="primary" size="small" />;
      case "discharged": return <Chip label="Discharged" color="success" size="small" />;
      default: return <Chip label="Pending" color="default" size="small" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent": return <Chip label="Urgent" color="error" size="small" />;
      case "high": return <Chip label="High" color="warning" size="small" />;
      case "medium": return <Chip label="Medium" color="info" size="small" />;
      case "low": return <Chip label="Low" color="success" size="small" />;
      default: return <Chip label="Medium" color="default" size="small" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return "Invalid date"; }
  };

  const statCards = [
    { title: "Today's Admissions", value: totalCases.toString(), icon: <HospitalIcon sx={{ color: "#fff" }} />, color: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)" },
    { title: "Incoming", value: incomingCases.toString(), icon: <AmbulanceIcon sx={{ color: "#fff" }} />, color: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)" },
    { title: "Admitted", value: admittedCases.toString(), icon: <PersonIcon sx={{ color: "#fff" }} />, color: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)" },
    { title: "Discharged", value: dischargedCases.toString(), icon: <CheckIcon sx={{ color: "#fff" }} />, color: "linear-gradient(135deg, #3f3938ce 0%, #DC2626 100%)" },
  ];

  const renderDischargedTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "none" }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ backgroundColor: "action.hover" }}>
          <TableRow>
            <TableCell><Typography variant="subtitle2" fontWeight={600}>Patient ID</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight={600}>Discharge Date</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight={600}>Condition</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight={600}>Treatment</Typography></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight={600}>Actions</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredDischarged.map((incident) => (
            <TableRow key={incident.id} sx={{ "&:hover": { backgroundColor: "action.hover" }, "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell><Typography variant="body2" fontWeight={500}>{incident.id.substring(0, 8)}</Typography></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{formatDate(incident.updatedAt)}</Typography></TableCell>
              <TableCell><Typography variant="body2">{incident.patientStatus?.condition || "Not specified"}</Typography></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{incident.patientStatus?.treatment?.substring(0, 50) || "No treatment specified"}...</Typography></TableCell>
              <TableCell><Button startIcon={<ViewIcon />} onClick={() => handleViewDetails(incident)} variant="outlined" size="small" sx={{ textTransform: "none" }}>View Record</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ py: 6, px: { xs: 2, sm: 4, md: 6 }, minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }} textAlign="center">
        <Typography variant="h3" fontWeight={800} sx={{ color: "#111827" }}>HOSPITAL DASHBOARD</Typography>
        <Typography variant="body1" color="text.secondary">{hospitalName} • Emergency notifications and patient management</Typography>
      </Box>

      {/* Pending Requests Banner (Mobile Parity) */}
      {pendingRequests.length > 0 && (
        <Alert
          severity="error"
          variant="filled"
          icon={<EmergencyIcon />}
          sx={{ mb: 3, py: 1.5, borderRadius: 2, backgroundColor: '#C62828' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              variant="outlined"
              onClick={() => {
                setCurrentRequest(pendingRequests[0]);
                setRequestDialog(true);
              }}
              sx={{ fontWeight: 'bold', border: '2px solid white' }}
            >
              RESPOND NOW ({pendingRequests.length})
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight="bold">
            NEW PATIENT ASSISTANCE REQUEST!
          </Typography>
          <Typography variant="body2">
            Driver {pendingRequests[0].driverName} is requesting admission for a patient in {pendingRequests[0].patientCondition} condition.
          </Typography>
        </Alert>
      )}

      {/* Arrival Alert */}
      {showArrivalAlert && (
        <Alert
          severity="error"
          variant="filled"
          icon={<AmbulanceIcon />}
          sx={{ mb: 3, py: 2, borderRadius: 2, backgroundColor: '#DC2626' }}
          action={
            <Button color="inherit" size="large" variant="outlined" onClick={() => {
              const inc = incomingIncidents.find(i => i.id === arrivalIncidentId || i._id === arrivalIncidentId);
              if (inc) handleAdmitPatient(inc);
            }} sx={{ fontWeight: 'bold', border: '2px solid white' }}>PREPARE ADMISSION</Button>
          }
        >
          <Typography variant="h5" fontWeight="bold">AMBULANCE ARRIVED!</Typography>
          <Typography variant="body1">An ambulance has arrived at the hospital. Prepare to receive the patient.</Typography>
        </Alert>
      )}

      {/* Statistics Section */}
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: "center" }}>
        {statCards.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ background: stat.color, color: "#fff", borderRadius: 3, position: "relative", overflow: "hidden", "&:before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.1)" } }}>
              <CardContent sx={{ position: "relative", zIndex: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", p: 1.5, display: "flex", justifyContent: "center", alignItems: "center" }}>{stat.icon}</Box>
                  <Box><Typography variant="h6">{stat.title}</Typography><Typography variant="h3" fontWeight={700}>{stat.value}</Typography></Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}><TextField fullWidth placeholder="Search patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <IconButton onClick={handleNotificationMenuOpen} sx={{ backgroundColor: "action.hover", "&:hover": { backgroundColor: "action.selected" } }}><Badge badgeContent={incomingCases + pendingRequests.length} color="error"><NotificationIcon /></Badge></IconButton>
              <IconButton onClick={handleRefresh} disabled={refreshLoading} sx={{ backgroundColor: "action.hover", "&:hover": { backgroundColor: "action.selected" } }}><RefreshIcon /></IconButton>
              <IconButton sx={{ backgroundColor: "action.hover", "&:hover": { backgroundColor: "action.selected" } }}><SettingsIcon /></IconButton>
              <Button startIcon={<FilterIcon />} onClick={handleFilterMenuOpen} variant="outlined" size="small">Filter</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Section */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ "& .MuiTab-root": { py: 2, fontSize: "0.95rem", fontWeight: 600 } }}>
            <Tab label={<Box display="flex" alignItems="center" gap={1}><span>Incoming</span>{incomingCases > 0 && (<Badge badgeContent={incomingCases} color="error" sx={{ ml: 1 }}><AmbulanceIcon fontSize="small" /></Badge>)}</Box>} />
            <Tab label={<Box display="flex" alignItems="center" gap={1}><span>Admitted</span>{admittedCases > 0 && (<Chip label={admittedCases} size="small" color="primary" sx={{ height: 20, fontSize: "0.75rem" }} />)}</Box>} />
            <Tab label={<Box display="flex" alignItems="center" gap={1}><span>Discharged</span>{dischargedCases > 0 && (<Chip label={dischargedCases} size="small" color="success" sx={{ height: 20, fontSize: "0.75rem" }} />)}</Box>} />
            <Tab label={<Box display="flex" alignItems="center" gap={1}><StatsIcon fontSize="small" /><span>Analytics</span></Box>} />
          </Tabs>
        </Box>

        {/* Incoming Tab */}
        <TabPanel value={tabValue} index={0}>
          {filteredIncoming.length === 0 ? (
            <Box sx={{ p: 8, textAlign: "center" }}>
              <HospitalIcon sx={{ fontSize: 80, color: "grey.300", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>No incoming patients</Typography>
              <Typography variant="body2" color="text.secondary">Patients arriving from ambulance services will appear here</Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ p: 2 }}>
              {filteredIncoming.map((incident) => (
                <Grid item xs={12} key={incident.id}>
                  <Card sx={{ borderRadius: 2, bgcolor: incident.priority === "urgent" ? "#ffebeb" : "background.paper" }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: "error.main" }}><AmbulanceIcon /></Avatar>
                            <Box>
                              <Typography variant="h6">Patient {incident.id.substring(0, 8)}</Typography>
                              <Typography variant="body2" color="text.secondary">{incident.description || "Medical emergency"}</Typography>
                              <Box display="flex" gap={1} mt={1}>{getStatusBadge(incident.hospitalStatus || "incoming")}{getPriorityBadge(incident.priority || "medium")}<Chip label={`ETA: ${"Soon"}`} color="warning" size="small" icon={<TimerIcon />} /></Box>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            <Button startIcon={<NavigationIcon />} onClick={() => handleTrackPatient(incident)} variant="outlined" color="primary" size="small" sx={{ fontWeight: 'bold' }}>Live Track</Button>
                            <Button startIcon={<ViewIcon />} onClick={() => handleViewDetails(incident)} variant="outlined" size="small">Details</Button>
                            <Button startIcon={<AdmitIcon />} onClick={() => handleAdmitPatient(incident)} variant="contained" color="error" size="small">Admit</Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Admitted & Discharged Tabs... */}
        <TabPanel value={tabValue} index={1}>
          {filteredAdmitted.length === 0 ? (
            <Box sx={{ p: 8, textAlign: "center" }}><MedicalIcon sx={{ fontSize: 80, color: "grey.300", mb: 2 }} /><Typography variant="h6" color="text.secondary" gutterBottom>No admitted patients</Typography></Box>
          ) : (
            <Grid container spacing={2} sx={{ p: 2 }}>
              {filteredAdmitted.map((incident) => (
                <Grid item xs={12} key={incident.id}>
                  <Card sx={{ borderRadius: 2 }}><CardContent><Grid container spacing={2} alignItems="center"><Grid item xs={12} md={8}><Box display="flex" alignItems="center" gap={2}><Avatar sx={{ bgcolor: "primary.main" }}><MedicalIcon /></Avatar><Box><Typography variant="h6">Patient {incident.id.substring(0, 8)}</Typography><Typography variant="body2" color="text.secondary">Bed {incident.patientStatus?.bedNumber || "Not assigned"} • {incident.patientStatus?.doctor || "No doctor assigned"}</Typography><Box display="flex" gap={1} mt={1}>{getStatusBadge(incident.hospitalStatus || "admitted")}{getPriorityBadge(incident.priority || "medium")}</Box></Box></Box></Grid><Grid item xs={12} md={4}><Box display="flex" justifyContent="flex-end" gap={1}><Button startIcon={<ViewIcon />} onClick={() => handleViewDetails(incident)} variant="outlined" size="small">Details</Button><Button startIcon={<DischargeIcon />} onClick={() => handleDischargePatient(incident)} variant="contained" color="secondary" size="small">Discharge</Button></Box></Grid></Grid></CardContent></Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {filteredDischarged.length === 0 ? (
            <Box sx={{ p: 8, textAlign: "center" }}><CheckIcon sx={{ fontSize: 80, color: "grey.300", mb: 2 }} /><Typography variant="h6" color="text.secondary" gutterBottom>No discharged patients</Typography></Box>
          ) : (<Box sx={{ p: 2 }}>{renderDischargedTable()}</Box>)}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <AnalyticsConsole data={analyticsData} />
          </Box>
        </TabPanel>
      </Paper>

      {/* Sidebar with Department Status... */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Department Status</Typography>
            <TableContainer><Table size="small"><TableBody>
              <TableRow><TableCell>Emergency</TableCell><TableCell align="right"><Chip size="small" label="Active" color="success" /></TableCell></TableRow>
              <TableRow><TableCell>ICU</TableCell><TableCell align="right"><Chip size="small" label={hospitalStats.hospitalStats.find((s) => s._id === "icu")?.count ? "Full" : "Available"} color={hospitalStats.hospitalStats.find((s) => s._id === "icu")?.count ? "error" : "success"} /></TableCell></TableRow>
              <TableRow><TableCell>Surgery</TableCell><TableCell align="right"><Chip size="small" label="Limited" color="warning" /></TableCell></TableRow>
            </TableBody></Table></TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Live Tracking Dialog (Exact Driver Dashboard Style) */}
      <Dialog open={trackingDialog} onClose={() => setTrackingDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogTitle sx={{ bgcolor: '#C62828', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1}><NavigationIcon /><Typography variant="h6">Live Driver Tracking</Typography></Box>
          <IconButton onClick={() => setTrackingDialog(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 500, position: 'relative' }}>
          {trackingIncident && (
            <>
              <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, right: 16 }}>
                <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2, boxShadow: 3 }}>
                  <Avatar sx={{ bgcolor: '#C62828' }}><AmbulanceIcon /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{trackingIncident.hospitalRequest?.driverName || 'Ambulance Unit'}</Typography>
                    <Typography variant="caption" color="text.secondary">En Route to {hospitalName} • ETA: {trackingIncident.hospitalRequest?.eta || '?'} mins</Typography>
                  </Box>
                  <Chip label="APPROACHING" color="error" size="small" sx={{ fontWeight: 'bold' }} />
                </Paper>
              </Box>
              <MapContainer center={getSafeCoordinates(trackingIncident.location) || [24.8607, 67.0011]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={getSafeCoordinates(trackingIncident.location)!} icon={incidentMarkerIcon}><Popup>Incident Scene</Popup></Marker>
                <Marker position={JINNAH_HOSPITAL_COORDS} icon={hospitalMarkerIcon}><Popup>{hospitalName}</Popup></Marker>
                {/* Ambulance marker — follows the simulation along the dotted line */}
                {(() => {
                  const loc = ambulanceLocations[trackingIncident.id || trackingIncident._id];
                  if (loc) return <Marker position={[loc.lat, loc.lng]} icon={driverMarkerIcon}><Popup>Ambulance</Popup></Marker>;
                  return null;
                })()}
                {/* Route line: scene → hospital (ambulance follows this) */}
                {getSafeCoordinates(trackingIncident.location) && (
                  <Polyline positions={[getSafeCoordinates(trackingIncident.location)!, JINNAH_HOSPITAL_COORDS]} color="#C62828" dashArray="10, 10" weight={4} />
                )}
                <MapBoundsFitter points={[getSafeCoordinates(trackingIncident.location) || [24.8607, 67.0011], JINNAH_HOSPITAL_COORDS, ...(ambulanceLocations[trackingIncident.id || trackingIncident._id] ? [[ambulanceLocations[trackingIncident.id || trackingIncident._id].lat, ambulanceLocations[trackingIncident.id || trackingIncident._id].lng] as [number, number]] : [])]} />
              </MapContainer>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setTrackingDialog(false)}>Close Tracking</Button><Button variant="contained" color="error" onClick={() => { setTrackingDialog(false); handleAdmitPatient(trackingIncident!); }}>Prepare Admission</Button></DialogActions>
      </Dialog>

      {/* Patient Arriving Dialog (Mobile Parity - like hospital_tracking_screen.dart) */}
      <Dialog open={arrivalDialog} onClose={() => setArrivalDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, textAlign: 'center' } }}>
        <DialogTitle sx={{ pt: 4 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <AmbulanceIcon sx={{ fontSize: 40, color: '#C62828' }} />
          </Box>
          <Typography variant="h4" fontWeight="bold" color="#C62828">Patient Arriving!</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            The ambulance has reached {hospitalName}.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Prepare the emergency team to receive the patient immediately.
          </Typography>
          {trackingRequestData && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2"><strong>Driver:</strong> {trackingRequestData.driverName || 'Ambulance Unit'}</Typography>
              <Typography variant="body2"><strong>Condition:</strong> {trackingRequestData.patientCondition || 'Emergency'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth variant="contained" size="large"
            onClick={() => {
              setArrivalDialog(false);
              const inc = incomingIncidents.find(i => i.id === arrivalIncidentId || i._id === arrivalIncidentId);
              if (inc) handleAdmitPatient(inc);
            }}
            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}
          >
            ADMIT PATIENT NOW
          </Button>
          <Button fullWidth onClick={() => setArrivalDialog(false)} color="inherit">Dismiss</Button>
        </DialogActions>
      </Dialog>

      {/* Hospital Request Response Dialog (Mobile Parity) */}
      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Avatar sx={{ bgcolor: '#C62828', width: 60, height: 60, margin: '0 auto', mb: 2 }}><EmergencyIcon sx={{ fontSize: 35 }} /></Avatar>
          <Typography variant="h5" fontWeight="bold">New Request</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {currentRequest && (
            <>
              <Typography variant="body1" gutterBottom>Driver <strong>{currentRequest.driverName}</strong> is requesting patient assistance.</Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2"><strong>Condition:</strong> {currentRequest.patientCondition}</Typography>
                <Typography variant="body2"><strong>ETA:</strong> {currentRequest.eta} mins</Typography>
                <Typography variant="body2"><strong>Priority:</strong> {currentRequest.priority}</Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="error" 
            fullWidth 
            onClick={() => handleRespondToRequest('rejected')}
            sx={{ borderRadius: 2, py: 1 }}
          >
            REJECT
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            fullWidth 
            onClick={() => handleRespondToRequest('accepted')}
            sx={{ borderRadius: 2, py: 1, backgroundColor: '#C62828' }}
          >
            ACCEPT
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Details & Admit/Discharge Dialogs... */}
      <PatientDetailsDialog open={detailsDialog} onClose={() => setDetailsDialog(false)} incident={selectedIncident} onAdmit={handleAdmitPatient} onDischarge={handleDischargePatient} />
      <Dialog open={admitDialog} onClose={() => setAdmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box display="flex" alignItems="center" gap={1}><AdmitIcon color="error" /><span>Admit Patient</span></Box></DialogTitle>
        <DialogContent>{selectedIncident && (<><Alert severity="error" sx={{ mb: 2 }}>{selectedIncident.patientStatus?.condition || "Medical Emergency"}</Alert><TextField fullWidth label="Assign Emergency Team" value={admitForm.doctor} onChange={(e) => setAdmitForm({ ...admitForm, doctor: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth label="Prepare Room/Bed" value={admitForm.bedNumber} onChange={(e) => setAdmitForm({ ...admitForm, bedNumber: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth label="Treatment Plan" multiline rows={3} value={admitForm.treatment} onChange={(e) => setAdmitForm({ ...admitForm, treatment: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth label="Medical Notes" multiline rows={3} value={admitForm.medicalNotes} onChange={(e) => setAdmitForm({ ...admitForm, medicalNotes: e.target.value })} /></>)}</DialogContent>
        <DialogActions><Button onClick={() => setAdmitDialog(false)}>Cancel</Button><Button onClick={confirmAdmitPatient} variant="contained" color="error">Confirm Admission</Button></DialogActions>
      </Dialog>
      <Dialog open={dischargeDialog} onClose={() => setDischargeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box display="flex" alignItems="center" gap={1}><DischargeIcon color="secondary" /><span>Discharge Patient</span></Box></DialogTitle>
        <DialogContent>{selectedIncident && (<><Alert severity="warning" sx={{ mb: 2 }}>Are you sure you want to discharge Patient {selectedIncident.id.substring(0, 8)}?</Alert><TextField fullWidth label="Final Medical Notes" multiline rows={3} value={dischargeForm.medicalNotes} onChange={(e) => setDischargeForm({ ...dischargeForm, medicalNotes: e.target.value })} sx={{ mb: 2 }} /><TextField fullWidth label="Completed Treatment" value={dischargeForm.treatment} onChange={(e) => setDischargeForm({ ...dischargeForm, treatment: e.target.value })} /></>)}</DialogContent>
        <DialogActions><Button onClick={() => setDischargeDialog(false)}>Cancel</Button><Button onClick={confirmDischargePatient} variant="contained" color="secondary">Confirm Discharge</Button></DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity as any} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default HospitalDashboard;
