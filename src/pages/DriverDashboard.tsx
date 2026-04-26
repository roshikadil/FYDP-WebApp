// src/pages/DriverDashboard.tsx - SYNCED WITH MOBILE APP (driver_screen.dart)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  TextField,
  CircularProgress,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Snackbar,
  LinearProgress,
  Tooltip,
  Paper,
  Collapse,
  Menu,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  LocalHospital as HospitalIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  MicNone as MicIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Image as ImageIcon,
  Chat as ChatIcon,
  ArrowForward as ArrowForwardIcon,
  Task as TaskIcon,
  NavigateBefore as NavigateBeforeIcon,
  AccessTime as AccessTimeIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Schedule as ScheduleIcon,
  MedicalServices as MedicalServicesIcon,
  GpsFixed as GpsFixedIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import DriverService, { DriverIncident } from '../services/driverService';
import AnalyticsConsole from '../components/AnalyticsConsole';
import { useRealtimeIncidents } from '../hooks/useRealtimeIncidents';
import { SocketService } from '../services/SocketService';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Map Icons
const driverMarkerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204121.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const incidentMarkerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const hospitalMarkerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063206.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Types
interface CurrentJob {
  id: string;
  incident: DriverIncident;
  status: 'pending_acceptance' | 'assigned' | 'arrived' | 'awaiting_hospital' | 'transporting' | 'delivered' | 'completed';
  assignedTime: string;
  estimatedArrival?: string;
  timeRemaining?: number;
}

interface Hospital {
  id: string;
  name: string;
  type: string;
  distance: string;
  etaMinutes: number;
  latitude: number;
  longitude: number;
  isPinned: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'incident_alert' | 'assignment' | 'status_update' | 'system' | 'emergency';
  isRead: boolean;
  timestamp: Date;
  relatedIncidentId?: string;
}

// Constants
const STATUS_MAPPING: Record<string, string> = {
  'pending_acceptance': 'pending_acceptance',
  'assigned': 'assigned',
  'arrived': 'arrived',
  'awaiting_hospital': 'awaiting_hospital',
  'transporting': 'transporting',
  'delivered': 'delivered',
  'completed': 'completed'
};

const STATUS_STEPS = ['pending_acceptance', 'assigned', 'en_route', 'arrived', 'awaiting_hospital', 'transporting', 'delivered', 'completed'];
const STEP_LABELS = ['Pending', 'Assigned', 'En Route', 'Arrived', 'Waiting Hospital', 'Transporting', 'Delivered', 'Completed'];

// DriverIncidentProgress Model
interface DriverIncidentProgress {
  incidentId: string;
  hasArrived: boolean;
  selectedHospital?: string;
  isTransporting: boolean;
  lastUpdated: string;
}

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check location permission
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setIsLocationBlocked(result.state === 'denied');
        result.onchange = () => setIsLocationBlocked(result.state === 'denied');
      });
    }
  }, []);
  
  // State declarations
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocationBlocked, setIsLocationBlocked] = useState<boolean>(false);
  // 0=Pending, 1=Active, 2=Completed — matches mobile 3-tab system
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [selectedHospitalObj, setSelectedHospitalObj] = useState<Hospital | null>(null);
  
  const [driverStats, setDriverStats] = useState({
    completedToday: 0,
    totalDistance: '0 km',
    avgResponseTime: '0 mins',
    successRate: '0%',
    activeAssignments: 0,
    totalCompleted: 0,
  });
  
  const [assignedIncidents, setAssignedIncidents] = useState<DriverIncident[]>([]);
  const [completedIncidents, setCompletedIncidents] = useState<DriverIncident[]>([]);
  const [pendingIncidents, setPendingIncidents] = useState<DriverIncident[]>([]);
  const [currentJob, setCurrentJob] = useState<CurrentJob | null>(null);
  
  const [hospitalDialog, setHospitalDialog] = useState<boolean>(false);
  const [feedbackDialog, setFeedbackDialog] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverAddress, setDriverAddress] = useState<string>('Loading location...');
  
  // Incident progress tracking
  const [incidentProgress, setIncidentProgress] = useState<Map<string, DriverIncidentProgress>>(new Map());
  
  // Assigned at map for countdown
  const [assignedAtMap, setAssignedAtMap] = useState<Map<string, Date>>(new Map());
  
  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  
  // Nearby hospitals
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState<boolean>(false);
  const [hospitalsLoaded, setHospitalsLoaded] = useState<boolean>(false);

  // Timer reference for countdown
  const timerRef = useRef<any>(null);

  // Real-time notification states
  const [showNewAssignmentAlert, setShowNewAssignmentAlert] = useState(false);
  const [newAssignmentData, setNewAssignmentData] = useState<any>(null);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Initialize driver data
  const initializeDriverData = async (silent = false): Promise<void> => {
    if (!user || user.role !== 'driver') {
      console.log('🚫 Skipping driver data initialization: User is not a driver');
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      console.log('🚗 Initializing driver data...');
      
      const incidentsResult = await DriverService.getMyAssignedIncidents();
      
      console.log('📊 Incidents result:', incidentsResult);

      if (incidentsResult.success) {
        const incidents = incidentsResult.data;
        
        let filteredIncidents = incidents;
        
        if ((user?.role as string) === 'superadmin' || (user?.role as string) === 'admin') {
          console.log('👑 Admin/SuperAdmin viewing all driver incidents');
        } else {
          filteredIncidents = incidents.filter((incident: DriverIncident) => 
            (incident.assignedTo?.driver as any) === user?.id ||
            (incident.assignedTo?.driver as any)?._id === user?.id
          );
        }
        
        // Separate pending, assigned, and completed incidents
        const pending = filteredIncidents.filter((incident: DriverIncident) => 
          incident.driverStatus === 'pending_acceptance'
        );
        
        const assigned = filteredIncidents.filter((incident: DriverIncident) => 
          incident.driverStatus === 'assigned' || 
          incident.driverStatus === 'arrived' || 
          incident.driverStatus === 'transporting' || 
          incident.driverStatus === 'delivered'
        );
        
        const completed = filteredIncidents.filter((incident: DriverIncident) => 
          incident.driverStatus === 'completed'
        );
        
        // Sync assignedAtMap for countdowns matching mobile
        const newAssignedAtMap = new Map<string, Date>();
        pending.forEach(incident => {
          if (incident.assignedTo?.assignedAt) {
            newAssignedAtMap.set(incident.id, new Date(incident.assignedTo.assignedAt));
          }
        });
        setAssignedAtMap(newAssignedAtMap);
        
        setPendingIncidents(pending);
        setAssignedIncidents(assigned);
        setCompletedIncidents(completed);
        
        console.log(`✅ Loaded: ${pending.length} pending, ${assigned.length} assigned, ${completed.length} completed`);
        
        const calculatedStats = calculateStats(assigned, completed, pending);
        setDriverStats(calculatedStats);
        console.log('📈 Calculated stats:', calculatedStats);
        
        // Set current job - prioritize pending, then assigned
        if (pending.length > 0) {
          const firstPending = pending[0];
          const savedProgress = incidentProgress.get(firstPending.id);
          
          setCurrentJob({
            id: firstPending.id,
            incident: firstPending,
            status: 'pending_acceptance',
            assignedTime: firstPending.createdAt || new Date().toISOString(),
            estimatedArrival: '5 mins',
            timeRemaining: 120
          });
          
          // Start countdown for pending incident
          startCountdown(firstPending.id, 120);
          
        } else if (assigned.length > 0) {
          const firstAssigned = assigned[0];
          const jobStatus = STATUS_MAPPING[firstAssigned.driverStatus] as any || 'assigned';
          
          setCurrentJob({
            id: firstAssigned.id,
            incident: firstAssigned,
            status: jobStatus,
            assignedTime: firstAssigned.createdAt || new Date().toISOString(),
            estimatedArrival: '5 mins',
          });
        } else {
          setCurrentJob(null);
        }
      } else {
        console.error('❌ Failed to load incidents:', incidentsResult.error);
        showSnackbar(`Failed to load incidents: ${incidentsResult.error}`, 'error');
      }
      
    } catch (error: any) {
      console.error('❌ Error initializing driver data:', error);
      showSnackbar(`Error loading data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setDriverAddress('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
      setDriverLocation({ lat: latitude, lng: longitude });
      setDriverAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

      // Try to get address from coordinates
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          setDriverAddress(data.display_name.split(',')[0]);
        }
      } catch (geoError) {
        console.log('Geocoding error:', geoError);
      }

      return { lat: latitude, lng: longitude };
    } catch (error: any) {
      console.error('Location error:', error);
      let errorMessage = 'Location unavailable';
      
      if (error.code === 1) { // PERMISSION_DENIED
        errorMessage = 'Location permission blocked. Please enable it in browser settings.';
        showSnackbar('Location permission blocked. Please click the lock icon in the URL bar to allow location.', 'error');
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = 'Location signal weak or unavailable.';
      } else if (error.code === 3) { // TIMEOUT
        errorMessage = 'Location request timed out.';
      }
      
      setDriverAddress(errorMessage);
      return null;
    }
  }, []);

  // Initialize socket when component mounts
  useEffect(() => {
    if (user && user.role === 'driver') {
      SocketService.joinDriverRoom(user.id || user._id);
      getCurrentLocation();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      SocketService.removeTimerListeners();
    };
  }, [user, getCurrentLocation]);

  // Location Broadcast Effect
  useEffect(() => {
    let locationTimer: any;
    
    if (currentJob && (currentJob.status === 'assigned' || currentJob.status === 'arrived' || currentJob.status === 'transporting')) {
      // Start broadcasting location every 10 seconds
      locationTimer = setInterval(() => {
        if (currentLocation) {
          SocketService.emitDriverLocation(
            currentJob.incident.id,
            currentLocation.lat,
            currentLocation.lng
          );
          console.log(`📍 Broadcasted driver location: ${currentLocation.lat}, ${currentLocation.lng}`);
        } else {
          getCurrentLocation();
        }
      }, 10000);
    }
    
    return () => {
      if (locationTimer) clearInterval(locationTimer);
    };
  }, [currentJob?.status, currentJob?.incident?.id, currentLocation, getCurrentLocation]);

  // Hospital Response listener
  useEffect(() => {
    const handleHospitalResponse = (data: any) => {
      console.log('🏥 Hospital Response Received:', data);
      
      if (data.response === 'accepted') {
        setHospitalDialog(false);
        showSnackbar(`Hospital ${data.hospitalName} ACCEPTED! Proceed to hospital.`, 'success');
        
        // Auto update to transporting
        if (currentJob?.incident?.id) {
          DriverService.updateDriverWorkflowStatus(
            currentJob.incident.id,
            'transporting',
            data.hospitalName,
            'Patient in transit'
          ).then(() => {
             initializeDriverData();
          });
        }
      } else {
        showSnackbar(`Hospital ${data.hospitalName} REJECTED. Reason: ${data.reason}`, 'error');
        // Let the driver pick another hospital
      }
    };
    
    SocketService.onHospitalResponse(handleHospitalResponse);
    
    return () => {
      // In a more complex app, we'd unsubscribe here.
    };
  }, [currentJob]);

  // Start countdown timer
  const startCountdown = useCallback((incidentId: string, initialSeconds: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    let seconds = initialSeconds;
    setCountdown(seconds);
    
    timerRef.current = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      
      if (seconds <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCountdown(null);
      }
    }, 1000);
  }, []);

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number | null): string => {
    if (seconds === null || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get countdown color
  const getCountdownColor = (seconds: number | null): string => {
    if (seconds === null) return '#757575';
    if (seconds > 60) return '#4CAF50';
    if (seconds > 30) return '#C62828';
    return '#F44336';
  };


  // Add notification
  const addNotification = (notification: Omit<NotificationItem, 'id' | 'isRead' | 'timestamp'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      isRead: false,
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Mark notification as read
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  // Calculate statistics from incidents
  const calculateStats = (assigned: DriverIncident[], completed: DriverIncident[], pending: DriverIncident[]) => {
    const today = new Date().toDateString();
    const completedToday = completed.filter(incident => {
      const incidentDate = new Date(incident.createdAt).toDateString();
      return incidentDate === today;
    }).length;

    let totalResponseTime = 0;
    let validResponseTimes = 0;
    
    completed.forEach(incident => {
      const startTime = new Date(incident.createdAt).getTime();
      const endTime = incident.updatedAt ? new Date(incident.updatedAt).getTime() : new Date().getTime();
      
      if (endTime > startTime) {
        const responseTime = Math.round((endTime - startTime) / (1000 * 60));
        totalResponseTime += responseTime;
        validResponseTimes++;
      }
    });
    
    const avgResponseTime = validResponseTimes > 0 
      ? `${Math.round(totalResponseTime / validResponseTimes)} mins`
      : '0 mins';

    const totalAssigned = assigned.length + completed.length + pending.length;
    const successRate = totalAssigned > 0 
      ? `${Math.round((completed.length / totalAssigned) * 100)}%`
      : '0%';

    const estimatedKmPerIncident = 15;
    const totalKm = completed.length * estimatedKmPerIncident;
    const totalDistance = `${totalKm} km`;

    return {
      completedToday,
      totalDistance,
      avgResponseTime,
      successRate,
      activeAssignments: assigned.length + pending.length,
      totalCompleted: completed.length,
    };
  };

  const analyticsData = React.useMemo(() => {
    return {}; // Use centralized fallback in AnalyticsConsole
  }, [assignedIncidents.length, completedIncidents.length, pendingIncidents.length, driverStats]);

  // Load saved progress from localStorage
  const loadSavedProgress = useCallback(() => {
    if (!user?.id) return;
    
    try {
      const savedProgress = localStorage.getItem(`driver_progress_${user.id}`);
      if (savedProgress) {
        const progressMap = new Map<string, DriverIncidentProgress>();
        const parsed = JSON.parse(savedProgress);
        Object.entries(parsed).forEach(([key, value]) => {
          progressMap.set(key, value as DriverIncidentProgress);
        });
        setIncidentProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  }, [user?.id]);

  // Save progress to localStorage
  const saveProgress = useCallback((incidentId: string, progress: DriverIncidentProgress) => {
    if (!user?.id) return;
    
    setIncidentProgress(prev => {
      const newMap = new Map(prev);
      newMap.set(incidentId, progress);
      
      // Save to localStorage
      const toStore: Record<string, DriverIncidentProgress> = {};
      newMap.forEach((value, key) => {
        toStore[key] = value;
      });
      localStorage.setItem(`driver_progress_${user.id}`, JSON.stringify(toStore));
      
      return newMap;
    });
  }, [user?.id]);

  // Fetch nearby hospitals
  const fetchNearestHospitals = async () => {
    if (hospitalsLoaded) {
      setHospitalDialog(true);
      return;
    }
    
    setLoadingHospitals(true);
    
    try {
      // Simulated hospital data with real Karachi coordinates
      const hospitalsData: Hospital[] = [
        { id: 'h1', name: 'Jinnah Hospital', type: 'General', distance: '2.5 km', etaMinutes: 8, latitude: 24.8615, longitude: 67.0315, isPinned: true },
        { id: 'h2', name: 'Aga Khan Hospital', type: 'Private', distance: '4.1 km', etaMinutes: 12, latitude: 24.8834, longitude: 67.0768, isPinned: true },
        { id: 'h3', name: 'Civil Hospital', type: 'General', distance: '6.8 km', etaMinutes: 18, latitude: 24.8591, longitude: 67.0036, isPinned: false },
        { id: 'h4', name: 'Indus Hospital', type: 'Emergency', distance: '3.2 km', etaMinutes: 10, latitude: 24.8929, longitude: 67.0701, isPinned: false },
        { id: 'h5', name: 'South City Hospital', type: 'Private', distance: '5.4 km', etaMinutes: 15, latitude: 24.8435, longitude: 67.0886, isPinned: false },
      ];
      
      setNearbyHospitals(hospitalsData);
      setHospitalsLoaded(true);
      setLoadingHospitals(false);
      setHospitalDialog(true);
      
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setLoadingHospitals(false);
      showSnackbar('Could not fetch nearby hospitals', 'error');
    }
  };

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    await initializeDriverData();
    showSnackbar('Data refreshed successfully', 'success');
  };

  // Get job status from incident
  const getJobStatus = (incident: DriverIncident): 'pending_acceptance' | 'assigned' | 'arrived' | 'transporting' | 'delivered' | 'completed' => {
    const status = incident.driverStatus;
    if (status === 'pending_acceptance') return 'pending_acceptance';
    if (status === 'assigned') return 'assigned';
    if (status === 'arrived') return 'arrived';
    if (status === 'transporting') return 'transporting';
    if (status === 'delivered') return 'delivered';
    if (status === 'completed') return 'completed';
    return 'assigned';
  };

  // Get status step for stepper
  const getStatusStep = (status: string): number => {
    if (status === 'pending_acceptance') return 0;
    if (status === 'assigned') return 1;
    if (status === 'en_route') return 2;
    if (status === 'arrived') return 3;
    if (status === 'transporting') return 4;
    if (status === 'delivered') return 5;
    if (status === 'completed') return 6;
    return 1;
  };

  // Handle accept incident — matches mobile: accept then navigate to detail screen
  const handleAcceptIncident = async (incident: any) => {
    try {
      const targetId = incident.id || incident._id;
      if (!targetId) {
         showSnackbar('Error: Invalid incident logic', 'error');
         return;
      }

      const result = await DriverService.acceptIncident(targetId);
      
      if (result.success) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCountdown(null);
        setAssignedAtMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(targetId);
          return newMap;
        });
        
        SocketService.emitDriverResponse({ incidentId: targetId, response: 'accept' });
        
        addNotification({
          title: 'Incident Accepted',
          message: `You have accepted the incident at ${incident.location?.address?.split(',')[0] || 'incident location'}`,
          type: 'assignment',
          relatedIncidentId: targetId
        });
        
        showSnackbar('Incident accepted! Opening incident details...', 'success');
        setShowNewAssignmentAlert(false);
        // Navigate to detail screen — matches mobile: Navigator.push(DriverIncidentDetailScreen)
        setTimeout(() => navigate(`/driver/incident/${targetId}`), 500);
      } else {
        showSnackbar(`Failed to accept: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  // Handle reject incident
  const handleRejectIncident = async (incident: any, reason?: string) => {
    try {
      const targetId = incident.id || incident._id;
      if (!targetId) return;

      const result = await DriverService.rejectIncident(targetId, reason || 'Driver rejected');
      
      if (result.success) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCountdown(null);
        setAssignedAtMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(targetId);
          return newMap;
        });
        
        SocketService.emitDriverResponse({ incidentId: targetId, response: 'reject' });
        
        showSnackbar('Incident rejected', 'info');
        await initializeDriverData();
        setShowNewAssignmentAlert(false);
      } else {
        showSnackbar(`Failed to reject: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: 'arrived' | 'transporting' | 'delivered' | 'completed') => {
    if (!currentJob || !currentJob.incident?.id) {
      console.error('❌ No current job or job ID found');
      showSnackbar('Please select an incident from the list below first', 'warning');
      return;
    }
    
    try {
      console.log('🚑 Updating status:', {
        incidentId: currentJob.incident.id,
        status: newStatus,
        hospital: selectedHospitalObj?.name || selectedHospital || 'Jinnah Hospital'
      });
      
      const hospitalName = selectedHospitalObj?.name || selectedHospital || 'Jinnah Hospital';
      
      const result = await DriverService.updateDriverWorkflowStatus(
        currentJob.incident.id,
        newStatus,
        hospitalName,
        newStatus === 'transporting' ? 'Patient being transported to hospital' : 
        newStatus === 'delivered' ? 'Patient delivered to hospital' : 
        'Patient in transit'
      );
      
      if (result.success) {
        // Update progress
        const progress: DriverIncidentProgress = {
          incidentId: currentJob.incident.id,
          hasArrived: newStatus === 'arrived' || true,
          selectedHospital: hospitalName,
          isTransporting: newStatus === 'transporting',
          lastUpdated: new Date().toISOString()
        };
        saveProgress(currentJob.incident.id, progress);
        
        addNotification({
          title: 'Status Updated',
          message: `Incident status updated to ${newStatus}`,
          type: 'status_update',
          relatedIncidentId: currentJob.incident.id
        });
        
        showSnackbar(`Status updated to ${newStatus} successfully!`, 'success');
        await initializeDriverData();
      } else {
        showSnackbar(`Failed to update status: ${result.error}`, 'error');
      }
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      showSnackbar(`Error: ${error.message || 'Failed to update status'}`, 'error');
    }
  };

  // Handle select incident from list
  const handleSelectIncident = (incident: DriverIncident) => {
    const jobStatus = getJobStatus(incident);
    const savedProgress = incidentProgress.get(incident.id);
    
    setCurrentJob({
      id: incident.id,
      incident,
      status: jobStatus,
      assignedTime: incident.createdAt || new Date().toISOString(),
      estimatedArrival: '5 mins',
      timeRemaining: jobStatus === 'pending_acceptance' ? 120 : undefined
    });
    
    if (savedProgress?.selectedHospital) {
      setSelectedHospital(savedProgress.selectedHospital);
      const hospital = nearbyHospitals.find(h => h.name === savedProgress.selectedHospital);
      if (hospital) setSelectedHospitalObj(hospital);
    }
    
    console.log('🎯 Selected incident:', incident.id);
    showSnackbar(`Selected incident: ${incident.description?.substring(0, 30)}...`, 'info');
  };

  // Handle patient pickup - UPDATED for mobile parity (direct to hospital)
  const handlePatientPickedUp = async () => {
    if (!currentJob?.id) return;

    try {
      // Direct pickup status matching mobile flow
      const result = await DriverService.updatePatientPickupStatus(
        currentJob.id,
        'picked_up',
        'Patient picked up'
      );

      if (result.success) {
        fetchNearestHospitals();
        setHospitalDialog(true);
        showSnackbar('Patient picked up! Please select a hospital.', 'success');
      } else {
        showSnackbar(`Error: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  // Handle hospital selection - UPDATED for mobile parity
  const handleHospitalSelection = async (): Promise<void> => {
    if (!currentJob?.id) return;

    const hospital = selectedHospitalObj || nearbyHospitals.find(h => h.name === selectedHospital);
    
    if (!hospital) {
      showSnackbar('Please select a hospital', 'warning');
      return;
    }

    try {
      setLoadingHospitals(true);
      
      // Call requestHospitalAssignment - matches mobile logic
      const result = await DriverService.requestHospitalAssignment(
        currentJob.id,
        {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          eta: `${hospital.etaMinutes} mins`,
          distance: hospital.distance,
          hospitalLatitude: hospital.latitude,
          hospitalLongitude: hospital.longitude
        }
      );

      if (result.success) {
        setSelectedHospitalObj(hospital);
        setHospitalDialog(false);
        showSnackbar(`Hospital ${hospital.name} requested successfully!`, 'success');
        
        // Then update status to transporting
        handleStatusUpdate('transporting');
      } else {
        showSnackbar(`Failed to request hospital: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Handle arrival at hospital
  const handleArrivalAtHospital = (): void => {
    if (!selectedHospitalObj && !selectedHospital) {
      setSelectedHospital('Jinnah Hospital');
      setSelectedHospitalObj(nearbyHospitals.find(h => h.name === 'Jinnah Hospital') || null);
    }
    handleStatusUpdate('delivered');
  };

  // Handle complete job
  const handleCompleteJob = (): void => {
    handleStatusUpdate('completed');
    setFeedbackDialog(false);
  };

  // Extract photo URL from incident
  const extractPhotoUrl = (incident: DriverIncident): string | null => {
    if (!incident.photos || incident.photos.length === 0) {
      return null;
    }

    const photo = incident.photos[0];
    
    if (typeof photo === 'string') {
      return photo;
    } else if (typeof photo === 'object' && photo !== null) {
      const photoObj = photo as any;
      
      if (photoObj.filename) {
        return photoObj.filename;
      } else if (photoObj.url) {
        return photoObj.url;
      } else if (photoObj.imageUrl) {
        return photoObj.imageUrl;
      }
    }
    
    return null;
  };

  // Generate image URLs to try
  const getImageUrlsToTry = (baseUrl: string | null): string[] => {
    if (!baseUrl) return [];
    
    const urls: string[] = [];
    
    let cleanUrl = baseUrl;
    if (cleanUrl.startsWith('/')) {
      cleanUrl = cleanUrl.substring(1);
    }
    
    if (cleanUrl.startsWith('http')) {
      urls.push(cleanUrl);
    } else {
      urls.push(`${API_URL}/api/upload/image/${cleanUrl}`);
      urls.push(`${API_URL}/api/uploads/image/${cleanUrl}`);
    }
    
    return urls.filter((url, index, self) => self.indexOf(url) === index);
  };

  // Render incident image with fallback
  const renderIncidentImage = (incident: DriverIncident) => {
    const imageUrl = extractPhotoUrl(incident);
    
    if (!imageUrl) {
      return (
        <Box
          sx={{
            width: '100%',
            height: 200,
            bgcolor: 'grey.100',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey.500',
          }}
        >
          <ImageIcon sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="body2">No image available</Typography>
        </Box>
      );
    }

    const urls = getImageUrlsToTry(imageUrl);
    const firstUrl = urls[0];

    return (
      <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
        <img
          src={firstUrl}
          alt="Incident"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 16,
            backgroundColor: '#f0f0f0',
          }}
        />
      </Box>
    );
  };

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Get status banner config
  const getStatusBannerConfig = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
      case 'assigned':
        return { color: '#C62828', icon: <CarIcon />, message: 'Tap "Start Ride" to navigate to the incident scene.' };
      case 'arrived':
        return { color: '#C62828', icon: <HospitalIcon />, message: 'Tap "Enable Hospital Route" to find the nearest hospital.' };
      case 'transporting':
        return { color: '#C62828', icon: <MedicalServicesIcon />, message: `Patient on board. Navigate to ${selectedHospitalObj?.name || selectedHospital || 'hospital'}.` };
      case 'delivered':
        return { color: '#4CAF50', icon: <CheckIcon />, message: 'Patient delivered! Tap "Complete Mission" to close.' };
      default:
        return { color: '#757575', icon: <TaskIcon />, message: '' };
    }
  };

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get formatted date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Stat cards — matches mobile exactly: Pending / Active / Completed (3 cards)
  const statCards = [
    { title: 'Pending', value: pendingIncidents.length, icon: <ScheduleIcon sx={{ color: '#fff' }} />, color: '#DC2626', bg: 'linear-gradient(135deg, #1a1a1a 0%, #DC2626 100%)' },
    { title: 'Active', value: assignedIncidents.length, icon: <AssignmentIcon sx={{ color: '#fff' }} />, color: '#DC2626', bg: 'linear-gradient(135deg, #1a1a1a 0%, #DC2626 100%)' },
    { title: 'Completed', value: completedIncidents.length, icon: <CheckIcon sx={{ color: '#fff' }} />, color: '#DC2626', bg: 'linear-gradient(135deg, #1a1a1a 0%, #DC2626 100%)' },
  ];

  // Initialize real-time incidents hook with driver-specific events
  useRealtimeIncidents({
    onIncidentAssigned: (data) => {
      console.log('🚨 INCIDENT ASSIGNED TO DRIVER!', data);
      
      setNewAssignmentData(data);
      setShowNewAssignmentAlert(true);
      setUnreadCount(prev => prev + 1);
      
      // Instantly show in Pending Tab matching mobile exactly
      if (data.incident) {
        const arrivalIncident = {
          ...data.incident,
          driverStatus: 'pending_acceptance',
          id: data.incident._id || data.incident.id,
          _id: data.incident._id || data.incident.id
        };
        
        setPendingIncidents(prev => {
          if (prev.some(i => i.id === arrivalIncident.id || i._id === arrivalIncident.id)) return prev;
          return [arrivalIncident, ...prev];
        });
        
        setCurrentTabIndex(0); // Switch to pending tab immediately
      }
      
      addNotification({
        title: 'New Incident Assigned',
        message: `You have been assigned to a ${data.incident?.category || 'new'} incident`,
        type: 'assignment',
        relatedIncidentId: data.incident?.id
      });
      
      // Delay full refresh to allow backend to finalize assignment and prevent UI wipe
      setTimeout(() => initializeDriverData(true), 2000);
      
      // Banner stays for 2 mins (120000ms) or until interacted with, matching mobile timeout
      setTimeout(() => setShowNewAssignmentAlert(false), 120000);
    },
    onAssignmentCountdown: (data) => {
      console.log('⏱️ 2-minute countdown started:', data);
        
        if (data.incidentId && data.assignedAt) {
          setAssignedAtMap(prev => new Map(prev).set(data.incidentId, new Date(data.assignedAt)));
          
          if (currentJob && currentJob.id === data.incidentId) {
            setCurrentJob(prev => prev ? { ...prev, timeRemaining: 120 } : null);
            startCountdown(data.incidentId, 120);
          }
        }
        // No popup alert needed here as the orange slide-in banner + cards show the countdown
      },
      onAssignmentExpired: (data) => {
        console.log('⏰ Assignment expired:', data);
        
        const incidentId = data.incidentId;
        if (incidentId) {
          setPendingIncidents(prev => prev.filter(i => i.id !== incidentId));
          setAssignedAtMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(incidentId);
            return newMap;
          });
          
          if (currentJob && currentJob.id === incidentId) {
            setCurrentJob(null);
          }
        }
        
        setUpdateMessage(data.message || 'Assignment expired and has been reassigned');
        setShowUpdateAlert(true);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCountdown(null);
        
        setTimeout(() => setShowUpdateAlert(false), 5000);
        initializeDriverData();
      },
      onRejectionConfirmed: (data) => {
        console.log('✅ Rejection confirmed:', data);
        
        const incidentId = data.incidentId;
        if (incidentId) {
          setPendingIncidents(prev => prev.filter(i => i.id !== incidentId));
          setAssignedAtMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(incidentId);
            return newMap;
          });
          
          if (currentJob && currentJob.id === incidentId) {
            setCurrentJob(null);
          }
        }
        
        setUpdateMessage(data.message || 'Your rejection has been processed');
        setShowUpdateAlert(true);
        setTimeout(() => setShowUpdateAlert(false), 5000);
        initializeDriverData();
      },
      onIncidentUpdated: (incident) => {
        setUpdateMessage(`Incident ${incident._id?.substring(0, 8)} was updated`);
        setShowUpdateAlert(true);
        setUnreadCount(prev => prev + 1);
        
        addNotification({
          title: 'Incident Updated',
          message: `Incident status has been updated`,
          type: 'status_update',
          relatedIncidentId: incident._id
        });
        
        initializeDriverData();
        setTimeout(() => setShowUpdateAlert(false), 5000);
      },
      playSound: true, // Enable sounds
      role: 'driver',
      autoRefresh: true, // Enable auto-refresh
      refreshCallback: initializeDriverData // Callback for auto-refresh
  });

  // Handle hospital response - MATCHES MOBILE parity
  useEffect(() => {
    const handleHospitalResponse = (data: any) => {
      console.log('🏥 Hospital response received:', data);
      
      const { status, hospitalName, message } = data;
      
      if (status === 'accepted') {
        showSnackbar(`Hospital ${hospitalName} accepted your request!`, 'success');
        setUpdateMessage(`Request accepted by ${hospitalName}`);
        setShowUpdateAlert(true);
      } else {
        showSnackbar(`Hospital ${hospitalName} rejected your request: ${message}`, 'error');
        setUpdateMessage(`Request rejected by ${hospitalName}. Please select another hospital.`);
        setShowUpdateAlert(true);
        // Reset status to picked_up so they can select again
        // In the backend it might still be transporting, but UI should allow re-selection
      }
      
      initializeDriverData();
      setTimeout(() => setShowUpdateAlert(false), 8000);
    };

    SocketService.on('hospitalResponse', handleHospitalResponse);
    return () => {
      SocketService.off('hospitalResponse', handleHospitalResponse);
    };
  }, [initializeDriverData]);

  // Real-time location broadcasting - MATCHES MOBILE parity
  useEffect(() => {
    let locationInterval: ReturnType<typeof setTimeout> | null = null;

    if (currentJob?.status === 'transporting' && currentJob.id) {
      console.log('📍 Starting real-time location broadcast for hospital tracking');
      
      const broadcastLocation = () => {
        // Use browser geolocation
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              console.log(`📡 Broadcasting location: ${latitude}, ${longitude}`);
              SocketService.emitDriverLocation(currentJob.id!, latitude, longitude);
            },
            (error) => console.error('❌ Geolocation error:', error),
            { enableHighAccuracy: true }
          );
        }
      };

      // Initial broadcast
      broadcastLocation();
      
      // Setup interval (10 seconds - same as mobile)
      locationInterval = setInterval(broadcastLocation, 10000);
    }

    return () => {
      if (locationInterval) {
        console.log('📍 Stopping real-time location broadcast');
        clearInterval(locationInterval);
      }
    };
  }, [currentJob?.status, currentJob?.id]);

  // Initialize on component mount
  useEffect(() => {
    if (user && user.role === 'driver') {
      loadSavedProgress();
      initializeDriverData();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const bannerConfig = currentJob ? getStatusBannerConfig(currentJob.status) : { color: '#757575', icon: <TaskIcon />, message: '' };

  // CSS keyframes for slide-in banner — matches mobile animate().slideY
  const bannerKeyframes = `
    @keyframes driverBannerSlideIn {
      from { transform: translateY(-100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `;

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, minHeight: '100vh', bgcolor: '#F5F5F5' }}>
      <style>{bannerKeyframes}</style>
      {/* Dashboard Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#111827' }}>
          DRIVER DASHBOARD
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {getGreeting()}, {user?.name || 'Driver'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.department || 'Emergency Services'} • {getFormattedDate()}
        </Typography>
        
        {/* Status Indicator */}
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: driverStats.activeAssignments === 0 ? '#4CAF50' : '#C62828',
                animation: driverStats.activeAssignments > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.2)' },
                  '100%': { transform: 'scale(1)' },
                }
              }}
            />
            <Typography variant="body2" fontWeight={600}>
              {driverStats.activeAssignments === 0 ? 'AVAILABLE' : 'ON DUTY'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {pendingIncidents.length} pending • {assignedIncidents.length} active
          </Typography>
          <IconButton size="small" onClick={refreshData} disabled={isRefreshing}>
            <RefreshIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => setNotificationAnchor(e.currentTarget)}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      {/* Status Indicator Bar */}
      {isLocationBlocked && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}
          icon={<GpsFixedIcon />}
        >
          LOCATION PERMISSION BLOCKED! Please click the LOCK icon (🔒) in your browser URL bar and set Location to "Allow", then refresh the page. This is required for real-time tracking.
        </Alert>
      )}

      {/* Real-time New Incident Banner — matches mobile orange animated banner */}
      {showNewAssignmentAlert && newAssignmentData && (
        <Box
          sx={{
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            boxShadow: '0 6px 20px rgba(220,38,38,0.4)',
            animation: 'driverBannerSlideIn 0.4s ease-out',
          }}
        >
          {/* Header bar */}
          <Box sx={{
            px: 2.5, py: 1.5,
            bgcolor: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Box sx={{
              p: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'driverBannerSlideIn 0.6s ease-out',
            }}>
              <Typography fontSize={16}>🚨</Typography>
            </Box>
            <Typography variant="caption" fontWeight={700} letterSpacing={0.5}
              sx={{ color: 'white', flex: 1, textTransform: 'uppercase' }}>
              New Incident Assigned To You
            </Typography>
            <Box onClick={() => setShowNewAssignmentAlert(false)}
              sx={{ cursor: 'pointer', p: 0.5, display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, lineHeight: 1 }}>✕</Typography>
            </Box>
          </Box>
          {/* Body */}
          <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <WarningIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box flex={1}>
              <Typography variant="body2" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>
                {newAssignmentData.incident?.category || 'Emergency Incident'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: 'block', mb: 0.5 }}>
                {newAssignmentData.incident?.location?.address?.split(',')[0] || 'Location unknown'}
              </Typography>
              {(newAssignmentData.eta || newAssignmentData.distance) && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  ETA: {newAssignmentData.eta} min{newAssignmentData.distance ? ` | Distance: ${newAssignmentData.distance} km` : ''}
                </Typography>
              )}
            </Box>
          </Box>
          {/* Accept / Reject buttons */}
          <Box sx={{ px: 2.5, pb: 2, display: 'flex', gap: 1.5 }}>
            <Button fullWidth variant="contained"
              onClick={() => { if (newAssignmentData.incident) handleAcceptIncident(newAssignmentData.incident); setShowNewAssignmentAlert(false); }}
              sx={{
                py: 1.25, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' },
                borderRadius: 2, fontWeight: 700,
              }}
            >
              ACCEPT
            </Button>
            <Button fullWidth variant="outlined"
              onClick={() => { if (newAssignmentData.incident) handleRejectIncident(newAssignmentData.incident); setShowNewAssignmentAlert(false); }}
              sx={{
                py: 1.25, borderColor: 'white', color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', borderColor: 'white' },
                borderRadius: 2, fontWeight: 700,
              }}
            >
              REJECT
            </Button>
          </Box>
        </Box>
      )}

      {showUpdateAlert && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setShowUpdateAlert(false)}>
          {updateMessage}
        </Alert>
      )}

      {/* Status Banner */}
      {currentJob && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: `${bannerConfig.color}10`, borderLeft: `4px solid ${bannerConfig.color}`, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ color: bannerConfig.color }}>{bannerConfig.icon}</Box>
            <Typography variant="body2" sx={{ color: bannerConfig.color, fontWeight: 500 }}>
              {bannerConfig.message}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Statistics Cards — 3 cards matching mobile (Pending/Active/Completed) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card sx={{
              background: stat.bg,
              color: '#fff',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>



      {/* Tabs Section — 3 tabs matching mobile: Pending / Active / Completed */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTabIndex} 
          onChange={(_, newValue) => setCurrentTabIndex(newValue)}
          sx={{ '& .MuiTab-root': { fontWeight: 600 } }}
        >
          <Tab 
            icon={<Badge badgeContent={pendingIncidents.length} color="error"><ScheduleIcon /></Badge>}
            label={`Pending (${pendingIncidents.length})`}
            iconPosition="start"
          />
          <Tab 
            icon={<AssignmentIcon />}
            label={`Active (${assignedIncidents.length})`}
            iconPosition="start"
          />
          <Tab 
            icon={<HistoryIcon />}
            label={`Completed (${completedIncidents.length})`}
            iconPosition="start"
          />
          <Tab 
            icon={<StatsIcon />}
            label="Analytics"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Content based on active tab — 0=Pending, 1=Active, 2=Completed */}
      {currentTabIndex === 1 ? (
        /* Active Incidents Tab — clicking card navigates to detail (matches mobile) */
        <Grid container spacing={3}>
          {assignedIncidents.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <AssignmentIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No active incidents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accept pending incidents to start working
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            assignedIncidents.map(incident => (
              <Grid item xs={12} md={6} key={incident.id}>
                <Card
                  sx={{
                    borderRadius: 3, cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '1px solid #EEEEEE',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
                  }}
                  onClick={() => navigate(`/driver/incident/${incident.id}`)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {incident.category || 'Incident'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Case #{incident.seqId || (incident.id || incident._id || '').substring(0, 8)}
                        </Typography>
                      </Box>
                      <Chip
                        label={incident.driverStatus?.replace('_', ' ').toUpperCase() || 'ASSIGNED'}
                        size="small"
                        sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                      <LocationIcon fontSize="small" sx={{ color: '#757575' }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {incident.location?.address || 'Unknown location'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <TimerIcon fontSize="small" sx={{ color: '#757575' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(incident.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Button
                      fullWidth variant="contained" size="small"
                      endIcon={<ArrowForwardIcon />}
                      sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, borderRadius: 2, fontWeight: 600 }}
                      onClick={e => { e.stopPropagation(); navigate(`/driver/incident/${incident.id}`); }}
                    >
                      View & Update Status
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      ) : currentTabIndex === 0 ? (
        /* Pending Incidents Tab — Accept/Reject per card, with countdown */
        <Grid container spacing={3}>
          {pendingIncidents.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <ScheduleIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No pending incidents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New incidents will appear here when assigned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            pendingIncidents.map(incident => {
              const assignedAt = assignedAtMap.get(incident.id);
              const timeRemaining = assignedAt ? Math.max(0, 120 - Math.floor((Date.now() - assignedAt.getTime()) / 1000)) : 120;
              return (
                <Grid item xs={12} md={6} key={incident.id}>
                  <Card sx={{ borderRadius: 3, border: '2px solid #C62828', bgcolor: '#FFEBEE' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {incident.category || 'Incident'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Case #{incident.seqId || (incident.id || incident._id || '').substring(0, 8)}
                          </Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                          <Chip label="Pending Acceptance" size="small" color="warning" sx={{ fontSize: '0.65rem', height: 20 }} />
                          <Chip
                            icon={<AccessTimeIcon style={{ fontSize: 12 }} />}
                            label={formatCountdown(timeRemaining)}
                            size="small"
                            sx={{ bgcolor: getCountdownColor(timeRemaining), color: 'white', fontSize: '0.65rem', height: 20 }}
                          />
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                        <LocationIcon fontSize="small" sx={{ color: '#757575' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {incident.location?.address || 'Unknown location'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                        <WarningIcon fontSize="small" sx={{ color: '#757575' }} />
                        <Typography variant="caption" color="text.secondary">
                          Priority: {incident.priority || 'Medium'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.78rem' }}>
                        {incident.description?.substring(0, 80)}...
                      </Typography>
                      {/* Countdown progress bar */}
                      {timeRemaining <= 120 && (
                        <LinearProgress
                          variant="determinate" value={(timeRemaining / 120) * 100}
                          sx={{ mb: 2, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: getCountdownColor(timeRemaining) } }}
                        />
                      )}
                      <Box display="flex" gap={1.5}>
                        <Button fullWidth variant="contained" color="success"
                          startIcon={<ThumbUpIcon />}
                          onClick={() => handleAcceptIncident(incident)}
                          sx={{ py: 1.25, borderRadius: 2, fontWeight: 700 }}
                        >
                          ACCEPT
                        </Button>
                        <Button fullWidth variant="contained" color="error"
                          startIcon={<ThumbDownIcon />}
                          onClick={() => handleRejectIncident(incident, 'Driver rejected')}
                          sx={{ py: 1.25, borderRadius: 2, fontWeight: 700 }}
                        >
                          REJECT
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      ) : currentTabIndex === 2 ? (
        /* Completed Incidents Tab */
        <Grid container spacing={3}>
          {completedIncidents.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <CheckIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No completed incidents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed incidents will appear here
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            completedIncidents.map((incident) => (
              <Grid item xs={12} md={6} lg={4} key={incident.id}>
                <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {renderIncidentImage(incident)}
                  <CardContent sx={{ flex: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {incident.location?.address?.split(',')[0] || 'Unknown Location'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(incident.createdAt).toLocaleDateString()} • {incident.patientStatus?.hospital || 'Hospital'}
                        </Typography>
                      </Box>
                      <Chip label="Completed" color="success" size="small" icon={<CheckIcon />} />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {incident.description?.substring(0, 100)}...
                    </Typography>
                    
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        icon={<TimerIcon />}
                        label={`${Math.round((new Date(incident.updatedAt).getTime() - new Date(incident.createdAt).getTime()) / 60000)} min`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<HospitalIcon />}
                        label={incident.patientStatus?.hospital || 'Hospital'}
                        size="small"
                        variant="outlined"
                      />
                      {incident.patientStatus?.condition && (
                        <Chip label={incident.patientStatus.condition} size="small" variant="outlined" color="primary" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      ) : null}
      
      {currentTabIndex === 3 && (
        /* Analytics Tab */
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AnalyticsConsole data={analyticsData} />
          </Grid>
        </Grid>
      )}

      {/* Hospital Selection Dialog */}
      <Dialog open={hospitalDialog} onClose={() => setHospitalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Destination Hospital</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Hospital</InputLabel>
            <Select
              value={selectedHospitalObj?.name || selectedHospital}
              onChange={(e) => {
                const hospital = nearbyHospitals.find(h => h.name === e.target.value);
                setSelectedHospitalObj(hospital || null);
                setSelectedHospital(e.target.value);
              }}
              label="Hospital"
            >
              {nearbyHospitals.map((hospital) => (
                <MenuItem key={hospital.id} value={hospital.name}>
                  {hospital.name} - {hospital.type} ({hospital.distance}) • {hospital.etaMinutes} min
                  {hospital.isPinned && ' ⭐'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="info">
            The selected hospital will be notified of your arrival
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHospitalDialog(false)}>Cancel</Button>
          <Button onClick={handleHospitalSelection} variant="contained" disabled={!selectedHospitalObj && !selectedHospital}>
            Confirm & Transport
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Job Completed - Feedback</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Patient successfully delivered to hospital
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Feedback (Optional)"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Any additional information about the incident..."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Hospital Patient ID (Optional)"
            placeholder="Enter patient ID from hospital"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)}>Skip</Button>
          <Button onClick={handleCompleteJob} variant="contained">
            Submit & Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{ sx: { maxHeight: 400, width: 350 } }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" p={1} borderBottom="1px solid #e0e0e0">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>Mark all as read</Button>
          )}
        </Box>
        {notifications.length === 0 ? (
          <MenuItem>No notifications</MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={() => markNotificationAsRead(notification.id)}
              sx={{ bgcolor: notification.isRead ? 'transparent' : 'action.hover' }}
            >
              <Box>
                <Typography variant="subtitle2">{notification.title}</Typography>
                <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DriverDashboard;