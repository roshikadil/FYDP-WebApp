// src/pages/DriverIncidentDetail.tsx - COMPLETELY FIXED

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Snackbar,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  LocalHospital as HospitalIcon,
  Navigation as NavigationIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DriverService, { DriverIncident } from '../services/driverService';
import { useAuth } from '../contexts/AuthContext';
import { SocketService } from '../services/SocketService';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const driverIcon = new L.DivIcon({
  className: '',
  html: `<div style="display:flex; flex-direction:column; align-items:center; width:40px;">
    <div style="background:#C62828;width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(198,40,40,0.4);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
    </div><div style="background:#2E7D32;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:bold;color:white;text-align:center;margin-top:2px;">YOU</div>
  </div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 17],
});

const incidentIcon = new L.DivIcon({
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

// Hospital type
interface NearbyHospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  etaMinutes: number;
}

// Map bounds fitter component
const MapBoundsFitter: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [60, 60] });
      } catch (e) {
        if (points[0]) map.setView(points[0], 13);
      }
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [points, map]);
  return null;
};

// Haversine distance calculation
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Timeline steps
const TIMELINE_STEPS = [
  { label: 'Assigned', status: 'assigned', icon: <AssignmentIcon fontSize="small" /> },
  { label: 'Start Ride', status: 'en_route', icon: <CarIcon fontSize="small" /> },
  { label: 'Arrived at Scene', status: 'arrived', icon: <LocationIcon fontSize="small" /> },
  { label: 'Hospital Route', status: 'hospital_route', icon: <HospitalIcon fontSize="small" /> },
  { label: 'Transporting', status: 'transporting', icon: <CarIcon fontSize="small" /> },
  { label: 'Delivered', status: 'delivered', icon: <CheckIcon fontSize="small" /> },
];

const getTimelineIndex = (status: string): number => {
  switch (status) {
    case 'assigned': return 0;
    case 'en_route': return 1;
    case 'arrived': return 2;
    case 'awaiting_hospital': return 3;
    case 'transporting': return 4;
    case 'delivered': return 5;
    case 'completed': return 6;
    default: return 0;
  }
};

const getStatusBannerConfig = (status: string, hospitalName?: string) => {
  switch (status) {
    case 'assigned':
      return { color: '#C62828', message: 'Tap "Start Ride" to navigate to the incident scene.' };
    case 'en_route':
      return { color: '#C62828', message: 'Ambulance is en route to the incident scene.' };
    case 'arrived':
      return { color: '#C62828', message: 'Arrived at scene. Tap "Find Hospital" after patient pickup.' };
    case 'awaiting_hospital':
      return { color: '#E65100', message: `Waiting for ${hospitalName || 'hospital'} to accept the request...` };
    case 'transporting':
      return { color: '#C62828', message: `Patient on board. Navigate to ${hospitalName || 'hospital'}.` };
    case 'delivered':
      return { color: '#C62828', message: 'Patient delivered! Tap "Complete Mission" to close.' };
    default:
      return { color: '#757575', message: '' };
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'accident': return '🚗';
    case 'fire': return '🔥';
    case 'medical': return '🏥';
    default: return '⚠️';
  }
};

const DriverIncidentDetail: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<DriverIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>('assigned');
  const [isUpdating, setIsUpdating] = useState(false);

  // Location states - start with default Karachi then update to actual location
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const driverLocationRef = useRef<[number, number] | null>(null);
  
  const [incidentLocation, setIncidentLocation] = useState<[number, number] | null>(null);

  // Hospital states
  const [nearbyHospitals, setNearbyHospitals] = useState<NearbyHospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<NearbyHospital | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitalsLoaded, setHospitalsLoaded] = useState(false);
  const [hospitalDialog, setHospitalDialog] = useState(false);

  // Route mode
  const [routeMode, setRouteMode] = useState<'toIncident' | 'toHospital'>('toIncident');

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSimulatingRef = useRef(false);

  // Waiting states
  const [isWaitingForHospital, setIsWaitingForHospital] = useState(false);
  const [requestedHospital, setRequestedHospital] = useState<NearbyHospital | null>(null);
  const [hospitalResponse, setHospitalResponse] = useState<any>(null);
  const [isPatientPickedUp, setIsPatientPickedUp] = useState(false);

  // Watch position ID
  const watchIdRef = useRef<number | null>(null);
  const broadcastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

  // Map bounds
  const [mapBoundsPoints, setMapBoundsPoints] = useState<[number, number][]>([]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
    isSimulatingRef.current = false;
  }, []);

  // Start simulation from current actual location
  const startSimulation = useCallback((targetLat: number, targetLng: number, onComplete?: () => void) => {
    const beginSim = (startLat: number, startLng: number) => {
      stopSimulation();
      setIsSimulating(true);
      isSimulatingRef.current = true;
      
      const totalSteps = 30; // faster for demo
      let step = 0;

      simulationTimerRef.current = setInterval(() => {
        step++;
        
        if (step >= totalSteps) {
          stopSimulation();
          const finalPos: [number, number] = [targetLat, targetLng];
          setDriverLocation(finalPos);
          driverLocationRef.current = finalPos;
          
          if (incidentId) {
            SocketService.emitDriverLocation(incidentId, targetLat, targetLng);
          }
          
          if (onComplete) onComplete();
          return;
        }

        const t = step / totalSteps;
        const lat = startLat + (targetLat - startLat) * t;
        const lng = startLng + (targetLng - startLng) * t;
        const newPos: [number, number] = [lat, lng];

        setDriverLocation(newPos);
        driverLocationRef.current = newPos;

        if (incidentId) {
          SocketService.emitDriverLocation(incidentId, lat, lng);
        }
      }, 1000);
    };

    // Try to get fresh GPS first
    if (driverLocationRef.current) {
      console.log('📍 Starting from current driver location:', driverLocationRef.current);
      beginSim(driverLocationRef.current[0], driverLocationRef.current[1]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setDriverLocation(loc);
          driverLocationRef.current = loc;
          console.log('📍 Got fresh GPS for simulation:', loc);
          beginSim(loc[0], loc[1]);
        },
        () => {
          // GPS failed — use incident location as fallback (driver is at scene)
          const fallback = incidentLocation || [24.8607, 67.0011];
          console.warn('⚠️ GPS unavailable, using incident location as start');
          beginSim(fallback[0], fallback[1]);
        },
        { enableHighAccuracy: true, timeout: 3000 }
      );
    } else {
      const fallback = incidentLocation || [24.8607, 67.0011];
      beginSim(fallback[0], fallback[1]);
    }
  }, [incidentId, stopSimulation, incidentLocation]);

  // Get current location on mount and set initial position
  useEffect(() => {
    if (navigator.geolocation && !initialLocationSet) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLoc: [number, number] = [latitude, longitude];
          setDriverLocation(newLoc);
          driverLocationRef.current = newLoc;
          setInitialLocationSet(true);
          console.log('📍 Initial driver location set:', latitude, longitude);
        },
        (err) => {
          console.error('❌ Error getting initial location:', err);
          // Fallback to default Karachi
          const fallback: [number, number] = [24.8607, 67.0011];
          setDriverLocation(fallback);
          driverLocationRef.current = fallback;
          setInitialLocationSet(true);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [initialLocationSet]);

  // Watch location continuously
  useEffect(() => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          // Only update location from GPS if NOT currently simulating
          if (!isSimulatingRef.current) {
            const newLoc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setDriverLocation(newLoc);
            driverLocationRef.current = newLoc;
            console.log('📍 Location updated:', newLoc);
          }
        },
        (err) => {
          console.error('❌ Geolocation watch error:', err);
          if (err.code === 1) {
            showSnackbar('Location permission blocked. Please enable it in browser settings.', 'error');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Load incident data
  const loadIncident = useCallback(async () => {
    if (!incidentId) return;
    try {
      const result = await DriverService.getMyAssignedIncidents();
      if (result.success) {
        const found = result.data.find(i => i.id === incidentId || i._id === incidentId);
        if (found) {
          setIncident(found);
          const status = found.driverStatus || 'assigned';
          setCurrentStatus(status);
          
          if ((status as any) === 'awaiting_hospital') {
            setIsWaitingForHospital(true);
            if (found.patientStatus?.hospital) {
              setRequestedHospital({
                id: 'unknown',
                name: found.patientStatus.hospital,
                latitude: 0,
                longitude: 0,
                distance: 0,
                etaMinutes: 10
              } as any);
            }
          }
          
          // Extract incident location
          const loc = found.location;
          if (loc) {
            let lat: number | null = null;
            let lng: number | null = null;
            
            if ((loc as any).latitude != null && (loc as any).longitude != null) {
              lat = Number((loc as any).latitude);
              lng = Number((loc as any).longitude);
            } else if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
              const c0 = Number(loc.coordinates[0]);
              const c1 = Number(loc.coordinates[1]);
              // Robust check: Karachi region is Lat ~24-25, Lng ~67-68
              if (c0 > 40 && c1 < 40) {
                // It's [lng, lat], swap to [lat, lng]
                lng = c0;
                lat = c1;
              } else {
                // It's [lat, lng]
                lat = c0;
                lng = c1;
              }
            } else if (loc.coordinates && typeof loc.coordinates === 'object') {
              lat = Number((loc.coordinates as any).lat || (loc.coordinates as any).latitude);
              lng = Number((loc.coordinates as any).lng || (loc.coordinates as any).longitude);
            }
            
            if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
              console.log('📍 Extracted incident location:', [lat, lng]);
              setIncidentLocation([lat, lng]);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error loading incident:', e);
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  // Location broadcast every 10s
  useEffect(() => {
    const activeStatuses = ['en_route', 'arrived', 'transporting', 'delivered', 'awaiting_hospital'];
    if (incidentId && activeStatuses.includes(currentStatus)) {
      broadcastTimerRef.current = setInterval(() => {
        if (driverLocationRef.current) {
          SocketService.emitDriverLocation(incidentId, driverLocationRef.current[0], driverLocationRef.current[1]);
          console.log('📡 Broadcasting location to hospital...');
        }
      }, 10000);
    }
    return () => {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    };
  }, [incidentId, currentStatus]);

  // Hospital response listener
  useEffect(() => {
    const handleResponse = (data: any) => {
      console.log('🏥 Hospital response received:', data);
      setIsWaitingForHospital(false);
      setHospitalResponse(data);
      
      if (data.status === 'accepted' || data.response === 'accepted') {
        showSnackbar(`Hospital ${data.hospitalName} accepted!`, 'success');
      } else {
        showSnackbar(`Hospital ${data.hospitalName} rejected: ${data.message || data.reason}`, 'error');
        setRequestedHospital(null);
      }
      loadIncident();
    };

    SocketService.on('hospitalResponse', handleResponse);
    
    const handleIncidentUpdate = (data: any) => {
      console.log('🔄 Incident update received:', data);
      const incidentData = data.incident || data;
      if (incidentData.id === incidentId || incidentData._id === incidentId) {
        if (incidentData.driverStatus) setCurrentStatus(incidentData.driverStatus);
        loadIncident();
      }
    };
    SocketService.on('incidentUpdated', handleIncidentUpdate);

    return () => {
      SocketService.off('hospitalResponse', handleResponse);
      SocketService.off('incidentUpdated', handleIncidentUpdate);
    };
  }, [loadIncident, incidentId]);

  useEffect(() => { loadIncident(); }, [loadIncident]);

  // Auto-switch to hospital route mode when transporting starts
  useEffect(() => {
    if (currentStatus === 'transporting' && selectedHospital) {
      setRouteMode('toHospital');
    }
  }, [currentStatus, selectedHospital]);

  // Update map bounds
  useEffect(() => {
    const points: [number, number][] = [];
    if (driverLocation) points.push(driverLocation);
    if (incidentLocation) points.push(incidentLocation);
    if (routeMode === 'toHospital' && selectedHospital) {
      points.push([selectedHospital.latitude, selectedHospital.longitude]);
    }
    setMapBoundsPoints(points);
  }, [driverLocation, incidentLocation, selectedHospital, routeMode]);

  // Fetch nearest hospitals
  const fetchNearestHospitals = async () => {
    if (hospitalsLoaded) {
      setHospitalDialog(true);
      return;
    }
    if (!incidentLocation) {
      showSnackbar('Incident location not available', 'error');
      return;
    }
    setLoadingHospitals(true);
    try {
      const result = await DriverService.fetchNearestHospitals(incidentLocation[0], incidentLocation[1]);
      if (result.success && result.data.length > 0) {
        setNearbyHospitals(result.data);
        setHospitalsLoaded(true);
        setHospitalDialog(true);
      } else {
        const fallback: NearbyHospital[] = [
          { id: 'h1', name: 'Jinnah Hospital', latitude: 24.8615, longitude: 67.0315, distance: 2.5, etaMinutes: 8 },
          { id: 'h2', name: 'Aga Khan Hospital', latitude: 24.8834, longitude: 67.0768, distance: 4.1, etaMinutes: 12 },
          { id: 'h3', name: 'Civil Hospital', latitude: 24.8591, longitude: 67.0036, distance: 6.8, etaMinutes: 18 },
        ];
        setNearbyHospitals(fallback);
        setHospitalsLoaded(true);
        setHospitalDialog(true);
      }
    } catch {
      showSnackbar('Could not fetch nearby hospitals', 'error');
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Update driver status
  const updateStatus = async (newStatus: 'arrived' | 'transporting' | 'delivered' | 'completed') => {
    if (!incident) return;
    if ((newStatus === 'transporting' || newStatus === 'delivered') && !selectedHospital) {
      showSnackbar('Please select a hospital first', 'warning');
      await fetchNearestHospitals();
      return;
    }
    setIsUpdating(true);
    try {
      const result = await DriverService.updateDriverWorkflowStatus(
        incident.id,
        newStatus,
        selectedHospital?.name,
        newStatus === 'transporting' ? 'Patient being transported to hospital' :
        newStatus === 'delivered' ? 'Patient delivered to hospital' : 'Patient in transit'
      );
      if (result.success) {
        setCurrentStatus(newStatus);
        const messages: Record<string, string> = {
          arrived: 'Marked as arrived at scene',
          transporting: 'Transport started',
          delivered: 'Patient delivered!',
          completed: 'Mission completed!',
        };
        showSnackbar(messages[newStatus] || 'Status updated', 'success');
        if (newStatus === 'delivered' || newStatus === 'completed') {
          setTimeout(() => navigate('/driver'), 1500);
        }
      } else {
        showSnackbar(result.error || 'Failed to update status', 'error');
      }
    } catch (e: any) {
      showSnackbar(`Error: ${e.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle patient picked up
  const handlePatientPickedUp = async () => {
    if (!incidentId) return;
    
    setIsUpdating(true);
    try {
      const result = await DriverService.updatePatientPickupStatus(
        incidentId,
        'picked_up',
        'Patient picked up'
      );

      if (result.success) {
        showSnackbar('Patient picked up! Find nearest hospital.', 'success');
        setIsPatientPickedUp(true);
        fetchNearestHospitals();
      } else {
        showSnackbar(result.error || 'Failed to update patient status', 'error');
      }
    } catch (e: any) {
      showSnackbar(`Error: ${e.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle hospital selection confirm
  const handleHospitalConfirm = async () => {
    if (!selectedHospital || !incidentId) { 
      showSnackbar('Please select a hospital', 'warning'); 
      return; 
    }
    
    setHospitalDialog(false);
    setIsWaitingForHospital(true);
    setRequestedHospital(selectedHospital);

    try {
      const result = await DriverService.requestHospitalAssignment(
        incidentId,
        {
          hospitalId: selectedHospital.id,
          hospitalName: selectedHospital.name,
          eta: String(selectedHospital.etaMinutes),
          distance: String(selectedHospital.distance),
          hospitalLatitude: selectedHospital.latitude,
          hospitalLongitude: selectedHospital.longitude
        }
      );

      if (result.success) {
        showSnackbar(`Request sent to ${selectedHospital.name}`, 'info');
        await DriverService.updateDriverWorkflowStatus(incidentId, 'awaiting_hospital' as any, selectedHospital.name);
        setCurrentStatus('awaiting_hospital');
      } else {
        setIsWaitingForHospital(false);
        showSnackbar(result.error || 'Failed to request hospital', 'error');
      }
    } catch (e: any) {
      setIsWaitingForHospital(false);
      showSnackbar(`Error: ${e.message}`, 'error');
    }
  };

  // Open Google Maps navigation
  const openNavigation = (destLat: number, destLng: number) => {
    const originStr = driverLocation ? `${driverLocation[0]},${driverLocation[1]}` : '';
    const url = originStr
      ? `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destLat},${destLng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
    window.open(url, '_blank');
  };

  // Get route points
  const getRoutePoints = (): [number, number][] => {
    if (routeMode === 'toIncident' && driverLocation && incidentLocation) {
      return [driverLocation, incidentLocation];
    }
    if (routeMode === 'toHospital' && driverLocation && selectedHospital) {
      return [driverLocation, [selectedHospital.latitude, selectedHospital.longitude]];
    }
    return [];
  };

  // Get distance and ETA
  const getDistanceEta = () => {
    if (routeMode === 'toHospital' && incidentLocation && selectedHospital) {
      const dist = calculateDistance(incidentLocation[0], incidentLocation[1], selectedHospital.latitude, selectedHospital.longitude);
      return { dist: dist.toFixed(1), eta: Math.round((dist / 40) * 60), dest: selectedHospital.name };
    }
    if (driverLocation && incidentLocation) {
      const dist = calculateDistance(driverLocation[0], driverLocation[1], incidentLocation[0], incidentLocation[1]);
      return { dist: dist.toFixed(1), eta: Math.round((dist / 40) * 60), dest: 'Scene' };
    }
    return null;
  };

  const bannerConfig = getStatusBannerConfig(currentStatus, selectedHospital?.name);
  const timelineActiveIndex = getTimelineIndex(currentStatus);
  const routePoints = getRoutePoints();
  const distEta = getDistanceEta();
  const mapCenter: [number, number] = driverLocation || incidentLocation || [24.8607, 67.0011];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} sx={{ color: '#C62828' }} />
      </Box>
    );
  }

  if (!incident) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={2}>
        <WarningIcon sx={{ fontSize: 60, color: '#9E9E9E' }} />
        <Typography variant="h6" color="text.secondary">Incident not found</Typography>
        <Button variant="contained" onClick={() => navigate('/driver')}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* AppBar */}
      <Box sx={{ bgcolor: '#C62828', color: 'white', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100 }}>
        <IconButton onClick={() => navigate('/driver')} sx={{ color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white', lineHeight: 1.2 }}>
            Case #{incident.seqId || (incident.id || incident._id || '').substring(0, 8)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {currentStatus === 'assigned' ? 'Assigned' :
             currentStatus === 'arrived' ? 'Arrived at Scene' :
             currentStatus === 'transporting' ? 'Transporting' :
             currentStatus === 'delivered' ? 'Delivered' : currentStatus}
          </Typography>
        </Box>
        <IconButton
          onClick={() => {
            if (routeMode === 'toHospital' && selectedHospital) {
              openNavigation(selectedHospital.latitude, selectedHospital.longitude);
            } else if (incidentLocation) {
              openNavigation(incidentLocation[0], incidentLocation[1]);
            }
          }}
          sx={{ color: 'white' }}
          title={routeMode === 'toHospital' ? "Navigate to hospital" : "Navigate to incident"}
        >
          {routeMode === 'toHospital' ? <HospitalIcon /> : <NavigationIcon />}
        </IconButton>
      </Box>

      {/* Map Section */}
      <Box sx={{ mx: 2, mt: 2 }}>
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', height: 450, position: 'relative' }}>
          {/* Recenter button */}
          {driverLocation && (
            <IconButton
              onClick={() => setMapBoundsPoints([driverLocation])}
              sx={{
                position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
                bgcolor: 'white', color: '#C62828',
                '&:hover': { bgcolor: '#F5F5F5' },
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: 44, height: 44
              }}
            >
              <NavigationIcon sx={{ transform: 'rotate(-45deg)' }} />
            </IconButton>
          )}

          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapBoundsFitter points={mapBoundsPoints.length >= 2 ? mapBoundsPoints : []} />
            
            {/* Route polyline */}
            {routePoints.length >= 2 && (
              <Polyline
                positions={routePoints}
                color={routeMode === 'toHospital' ? '#1565C0' : '#C62828'}
                weight={4}
              />
            )}
            
            {/* Driver marker */}
            {driverLocation && (
              <Marker position={driverLocation} icon={driverIcon}>
                <Popup>Your Location</Popup>
              </Marker>
            )}
            
            {/* Incident marker */}
            {incidentLocation && (
              <Marker position={incidentLocation} icon={incidentIcon}>
                <Popup>{incident.location?.address || 'Incident Location'}</Popup>
              </Marker>
            )}
            
            {/* Hospital marker */}
            {selectedHospital && (
              <Marker position={[selectedHospital.latitude, selectedHospital.longitude]} icon={hospitalMarkerIcon}>
                <Popup>{selectedHospital.name}</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Route toggle */}
          {selectedHospital && (
            <Box sx={{
              position: 'absolute', top: 10, left: 10, zIndex: 500,
              bgcolor: 'white', borderRadius: 2, p: 0.75,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              display: 'flex', gap: 0.75,
            }}>
              {(['toIncident', 'toHospital'] as const).map(mode => (
                <Box
                  key={mode}
                  onClick={() => setRouteMode(mode)}
                  sx={{
                    px: 1, py: 0.5, borderRadius: 1, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                    bgcolor: routeMode === mode ? (mode === 'toIncident' ? '#E65100' : '#1565C0') : 'transparent',
                    color: routeMode === mode ? 'white' : '#757575',
                    transition: 'all 0.2s',
                  }}
                >
                  {mode === 'toIncident' ? 'To Scene' : 'To Hospital'}
                </Box>
              ))}
            </Box>
          )}

          {/* Distance/ETA chip */}
          {distEta && (
            <Box sx={{
              position: 'absolute', bottom: 10, right: 10, zIndex: 500,
              bgcolor: 'white', borderRadius: 2, px: 1.5, py: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              textAlign: 'right',
            }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#212121', fontSize: 14 }}>
                {distEta.dist} km
              </Typography>
              <Typography variant="caption" sx={{ color: '#9E9E9E', display: 'block' }}>
                ETA {distEta.eta} min
              </Typography>
              <Typography variant="caption" sx={{
                color: routeMode === 'toHospital' ? '#1565C0' : '#E65100',
                fontWeight: 600, maxWidth: 100, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                to {distEta.dest}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Status Banner */}
      {bannerConfig.message && (
        <Box sx={{ mx: 2, mt: 1.5 }}>
          <Paper sx={{
            p: 1.5, borderRadius: 2,
            bgcolor: `${bannerConfig.color}1A`,
            border: `1px solid ${bannerConfig.color}66`,
          }}>
            <Box display="flex" alignItems="center" gap={1.25}>
              {currentStatus === 'assigned' && <CarIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              {currentStatus === 'arrived' && <HospitalIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              {currentStatus === 'transporting' && <MedicalServicesIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              {currentStatus === 'delivered' && <CheckIcon sx={{ color: bannerConfig.color, flexShrink: 0 }} />}
              <Typography variant="body2" sx={{ color: bannerConfig.color, fontWeight: 500 }}>
                {bannerConfig.message}
              </Typography>
              {selectedHospital && (currentStatus === 'arrived' || currentStatus === 'transporting') && (
                <Box
                  onClick={() => openNavigation(selectedHospital.latitude, selectedHospital.longitude)}
                  sx={{
                    ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5,
                    bgcolor: '#1565C0', borderRadius: 1, px: 1, py: 0.5, cursor: 'pointer', flexShrink: 0
                  }}
                >
                  <NavigationIcon sx={{ color: 'white', fontSize: 14 }} />
                  <Typography variant="caption" sx={{ color: 'white' }}>Navigate</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Incident Info Card */}
      <Card sx={{ mx: 2, mt: 1.5, borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2.5}>
            <Box sx={{
              p: 1.25, borderRadius: 2, bgcolor: '#FFEBEE',
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Typography fontSize={24}>{getCategoryIcon(incident.category)}</Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#212121' }}>
                {incident.category || 'Incident'}
              </Typography>
              <Chip
                label={(incident.priority || 'Medium').toUpperCase()}
                size="small"
                sx={{
                  bgcolor: (incident.priority as string) === 'urgent' || (incident.priority as string) === 'critical' ? '#FFEBEE' : '#FFF3E0',
                  color: (incident.priority as string) === 'urgent' || (incident.priority as string) === 'critical' ? '#C62828' : '#E65100',
                  fontWeight: 700, fontSize: '0.65rem', height: 20,
                }}
              />
            </Box>
          </Box>

          <List dense disablePadding>
            <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
              <LocationIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
              <Box>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Location</Typography>
                <Typography variant="body2" sx={{ color: '#212121' }}>
                  {incident.location?.address || 'Unknown location'}
                </Typography>
              </Box>
            </ListItem>
            <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
              <AssignmentIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
              <Box>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Description</Typography>
                <Typography variant="body2" sx={{ color: '#212121' }}>
                  {incident.description || 'No description'}
                </Typography>
              </Box>
            </ListItem>
            {incident.patientStatus?.condition && (
              <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
                <MedicalServicesIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
                <Box>
                  <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Patient Condition</Typography>
                  <Typography variant="body2" sx={{ color: '#212121' }}>
                    {incident.patientStatus.condition}
                  </Typography>
                </Box>
              </ListItem>
            )}
            {selectedHospital && (
              <ListItem disableGutters sx={{ alignItems: 'flex-start', gap: 1 }}>
                <HospitalIcon sx={{ color: '#757575', mt: 0.25, flexShrink: 0 }} fontSize="small" />
                <Box>
                  <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 500 }}>Selected Hospital</Typography>
                  <Typography variant="body2" sx={{ color: '#212121' }}>
                    {selectedHospital.name} ({selectedHospital.distance.toFixed(1)} km)
                  </Typography>
                </Box>
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Journey Progress Timeline */}
      <Card sx={{ mx: 2, mt: 1.5, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Journey Progress
          </Typography>
          <Box mt={2}>
            {TIMELINE_STEPS.map((step, i) => {
              const isDone = i < timelineActiveIndex;
              const isActive = i === timelineActiveIndex;
              const isLast = i === TIMELINE_STEPS.length - 1;
              return (
                <Box key={step.status} display="flex" gap={1.5} sx={{ position: 'relative' }}>
                  {!isLast && (
                    <Box sx={{
                      position: 'absolute', left: 15, top: 32, width: 2, height: 28,
                      bgcolor: isDone ? '#C62828' : '#EEEEEE',
                      zIndex: 0,
                    }} />
                  )}
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    bgcolor: isDone ? '#C62828' : isActive ? '#FFEBEE' : '#F5F5F5',
                    border: isActive ? '2px solid #C62828' : isDone ? 'none' : '2px solid #EEEEEE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDone ? 'white' : isActive ? '#C62828' : '#9E9E9E',
                  }}>
                    {isDone ? <CheckIcon sx={{ fontSize: 16 }} /> : <Box sx={{ fontSize: 16, display: 'flex' }}>{step.icon}</Box>}
                  </Box>
                  <Box pb={isLast ? 0 : 3.5} pt={0.25}>
                    <Typography variant="body2" fontWeight={isActive ? 700 : isDone ? 600 : 400}
                      sx={{ color: isActive ? '#C62828' : isDone ? '#212121' : '#9E9E9E' }}>
                      {step.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ mx: 2, mt: 1.5, mb: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {isUpdating ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress sx={{ color: '#C62828' }} />
          </Box>
        ) : (
          <>
            {/* ASSIGNED → Start Ride */}
            {(currentStatus === 'assigned' || currentStatus === 'pending_acceptance') && (
              <Paper
                elevation={1}
                onClick={async () => {
                  if (isSimulating) return;
                  setCurrentStatus('en_route');
                  if (incidentLocation) {
                    startSimulation(incidentLocation[0], incidentLocation[1], () => updateStatus('arrived'));
                  } else {
                    updateStatus('arrived');
                  }
                }}
                sx={{
                  p: 2, borderRadius: 3, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 2,
                  bgcolor: '#C62828', color: 'white',
                  '&:hover': { bgcolor: '#B71C1C' },
                  transition: 'background-color 0.2s'
                }}
              >
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <CarIcon />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={700}>Start Ride to Scene</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {isSimulating ? 'Simulating journey...' : 'Tap to simulate journey to incident scene'}
                  </Typography>
                </Box>
                {isSimulating && <CircularProgress size={20} sx={{ color: 'white' }} />}
              </Paper>
            )}

            {/* ARRIVED → Enable Hospital Route */}
            {currentStatus === 'arrived' && (
              <>
                {!isPatientPickedUp ? (
                  <Paper
                    elevation={1}
                    onClick={handlePatientPickedUp}
                    sx={{
                      p: 2, borderRadius: 3, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 2,
                      bgcolor: '#E65100', color: 'white',
                      '&:hover': { bgcolor: '#EF6C00' },
                      mb: 2
                    }}
                  >
                    <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                      <MedicalServicesIcon />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={700}>Enable Hospital Route</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Confirm patient is in ambulance to find nearest hospital
                      </Typography>
                    </Box>
                  </Paper>
                ) : (
                  <Paper
                    elevation={1}
                    onClick={() => {
                      if (!selectedHospital) fetchNearestHospitals();
                      setHospitalDialog(true);
                    }}
                    sx={{
                      p: 2, borderRadius: 3, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 2,
                      bgcolor: '#C62828', color: 'white',
                      mt: 1,
                      '&:hover': { bgcolor: '#B71C1C' }
                    }}
                  >
                    <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                      <HospitalIcon />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {selectedHospital ? `Route to: ${selectedHospital.name}` : 'Find Nearest Hospital'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {loadingHospitals ? 'Searching hospitals...' : 'Select a destination hospital'}
                      </Typography>
                    </Box>
                    {loadingHospitals && <CircularProgress size={20} sx={{ color: 'white' }} />}
                  </Paper>
                )}
                
                {selectedHospital && (hospitalResponse?.status === 'accepted' || hospitalResponse?.response === 'accepted') && (
                  <Paper
                    elevation={1}
                    onClick={() => updateStatus('transporting')}
                    sx={{
                      p: 2, borderRadius: 3, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 2,
                      bgcolor: '#9C27B0', color: 'white',
                      mt: 1,
                      '&:hover': { bgcolor: '#7B1FA2' }
                    }}
                  >
                    <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                      <NavigationIcon />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={700}>Start Transport</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Confirm you are moving towards {selectedHospital.name}
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </>
            )}

            {/* TRANSPORTING → Simulate to Hospital */}
            {currentStatus === 'transporting' && (
              <Paper
                elevation={1}
                onClick={() => {
                  if (selectedHospital) {
                    // Force start from incident scene so path matches hospital's route line
                    if (incidentLocation) {
                      driverLocationRef.current = incidentLocation;
                      setDriverLocation(incidentLocation);
                    }
                    startSimulation(selectedHospital.latitude, selectedHospital.longitude, () => {
                      if (incidentId) {
                        SocketService.emitDriverArrivedAtHospital(incidentId, selectedHospital.name);
                        console.log('🏥 Emitted driverArrivedAtHospital for', selectedHospital.name);
                      }
                      updateStatus('delivered');
                    });
                  } else {
                    updateStatus('delivered');
                  }
                }}
                sx={{
                  p: 2, borderRadius: 3, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 2,
                  bgcolor: '#C62828', color: 'white',
                  '&:hover': { bgcolor: '#B71C1C' }
                }}
              >
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <HospitalIcon />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={700}>Transporting to Hospital</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {isSimulating ? 'Simulating journey to hospital...' : 'Tap to simulate arrival at hospital'}
                  </Typography>
                </Box>
                {isSimulating && <CircularProgress size={20} sx={{ color: 'white' }} />}
              </Paper>
            )}

            {/* DELIVERED → Complete */}
            {currentStatus === 'delivered' && (
              <Paper
                elevation={1}
                onClick={() => updateStatus('completed')}
                sx={{
                  p: 2, borderRadius: 3, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 2,
                  bgcolor: '#2E7D32', color: 'white',
                  '&:hover': { bgcolor: '#1B5E20' }
                }}
              >
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <CheckIcon />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={700}>Complete Mission</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    All done. Close this incident.
                  </Typography>
                </Box>
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* Hospital Selection Dialog */}
      <Dialog open={hospitalDialog} onClose={() => setHospitalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Destination Hospital</DialogTitle>
        <DialogContent>
          {loadingHospitals ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress sx={{ color: '#C62828' }} />
            </Box>
          ) : (
            <List>
              {nearbyHospitals.map(hospital => (
                <ListItem
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital)}
                  sx={{
                    borderRadius: 2, mb: 1, cursor: 'pointer',
                    border: selectedHospital?.id === hospital.id ? '2px solid #C62828' : '1px solid #EEEEEE',
                    bgcolor: selectedHospital?.id === hospital.id ? '#FFEBEE' : 'white',
                  }}
                >
                  <ListItemIcon>
                    <HospitalIcon sx={{ color: '#C62828' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={hospital.name}
                    secondary={`${hospital.distance.toFixed(1)} km • ${hospital.etaMinutes} min ETA`}
                  />
                  {selectedHospital?.id === hospital.id && <CheckIcon sx={{ color: '#C62828' }} />}
                </ListItem>
              ))}
            </List>
          )}
          <Alert severity="info" sx={{ mt: 1 }}>
            The selected hospital will be notified of your arrival
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setHospitalDialog(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleHospitalConfirm} 
            variant="contained" 
            color="error"
            disabled={!selectedHospital}
            sx={{ fontWeight: 700 }}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Waiting for Hospital Dialog */}
      <Dialog open={isWaitingForHospital} disableEscapeKeyDown>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(230,81,0,0.1)', display: 'flex' }}>
            <HospitalIcon sx={{ color: '#E65100' }} />
          </Box>
          Waiting for Hospital
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={40} sx={{ mb: 2, color: '#C62828' }} />
          <Typography variant="body1" fontWeight={600}>
            Waiting for {requestedHospital?.name} to respond...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ETA: {requestedHospital?.etaMinutes} minutes
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            onClick={() => {
              setIsWaitingForHospital(false);
              setRequestedHospital(null);
            }} 
            color="error"
            sx={{ fontWeight: 600 }}
          >
            Cancel Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DriverIncidentDetail;