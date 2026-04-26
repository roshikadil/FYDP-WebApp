// src/hooks/useRealtimeIncidents.ts - UPDATED WITH AUTO-REFRESH

import { useEffect, useState, useCallback, useRef } from 'react';
import { SocketService } from '../services/SocketService';
import { Incident } from '../contexts/AuthContext';

interface UseRealtimeIncidentsProps {
  onNewIncident?: (incident: Incident) => void;
  onIncidentUpdated?: (incident: Incident) => void;
  onIncidentApproved?: (incident: Incident) => void;
  onIncidentAssigned?: (data: any) => void;
  onIncidentAvailable?: (data: any) => void;
  onIncidentClaimed?: (data: any) => void;
  onIncidentAutoAssigned?: (data: any) => void;
  onDriverAssigned?: (data: any) => void;
  onDriverRejected?: (data: any) => void;
  onAssignmentCountdown?: (data: any) => void;
  onAssignmentExpired?: (data: any) => void;
  onRejectionConfirmed?: (data: any) => void;
  playSound?: boolean;
  soundType?: 'new' | 'assignment' | 'countdown' | 'default';
  role?: 'admin' | 'department' | 'driver' | 'hospital' | 'superadmin';
  autoRefresh?: boolean;
  refreshCallback?: () => void;
}

export const useRealtimeIncidents = ({
  onNewIncident,
  onIncidentUpdated,
  onIncidentApproved,
  onIncidentAssigned,
  onIncidentAvailable,
  onIncidentClaimed,
  onIncidentAutoAssigned,
  onDriverAssigned,
  onDriverRejected,
  onAssignmentCountdown,
  onAssignmentExpired,
  onRejectionConfirmed,
  playSound = true,
  soundType = 'default',
  role,
  autoRefresh = true,
  refreshCallback
}: UseRealtimeIncidentsProps = {}) => {
  const [lastEvent, setLastEvent] = useState<{type: string; data: any; timestamp: Date} | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-refresh helper
  const triggerAutoRefresh = useCallback(() => {
    if (!autoRefresh || !refreshCallback) return;
    
    // Debounce refresh to avoid multiple rapid refreshes
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Auto-refreshing data due to real-time event');
      refreshCallback();
      refreshTimeoutRef.current = null;
    }, 500);
  }, [autoRefresh, refreshCallback]);

  const handleNewIncident = useCallback((data: any) => {
    console.log('🚨 New incident received:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('new');
    }
    
    setLastEvent({ type: 'newIncident', data, timestamp: new Date() });
    onNewIncident?.(data);
    triggerAutoRefresh();
  }, [onNewIncident, playSound, triggerAutoRefresh]);

  const handleIncidentUpdated = useCallback((data: any) => {
    console.log('🔄 Incident updated:', data);
    
    setLastEvent({ type: 'incidentUpdated', data, timestamp: new Date() });
    onIncidentUpdated?.(data);
    triggerAutoRefresh();
  }, [onIncidentUpdated, triggerAutoRefresh]);

  const handleIncidentApproved = useCallback((data: any) => {
    console.log('✅ Incident approved:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentApproved', data, timestamp: new Date() });
    onIncidentApproved?.(data);
    triggerAutoRefresh();
  }, [onIncidentApproved, playSound, triggerAutoRefresh]);

  const handleIncidentAssigned = useCallback((data: any) => {
    console.log('🚗 Incident assigned to driver:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentAssigned', data, timestamp: new Date() });
    onIncidentAssigned?.(data);
    triggerAutoRefresh();
  }, [onIncidentAssigned, playSound, triggerAutoRefresh]);

  const handleIncidentAvailable = useCallback((data: any) => {
    console.log('📊 Incident available:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentAvailable', data, timestamp: new Date() });
    onIncidentAvailable?.(data);
    triggerAutoRefresh();
  }, [onIncidentAvailable, playSound, triggerAutoRefresh]);

  const handleIncidentClaimed = useCallback((data: any) => {
    console.log('🔒 Incident claimed:', data);
    
    setLastEvent({ type: 'incidentClaimed', data, timestamp: new Date() });
    onIncidentClaimed?.(data);
    triggerAutoRefresh();
  }, [onIncidentClaimed, triggerAutoRefresh]);

  const handleIncidentOpenToAll = useCallback((data: any) => {
    console.log('🔓 Incident open to all:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentOpenToAll', data, timestamp: new Date() });
    // Note: If you need a callback prop for this, add it to the interface
    triggerAutoRefresh();
  }, [playSound, triggerAutoRefresh]);

  const handleIncidentAutoAssigned = useCallback((data: any) => {
    console.log('🤖 Incident auto-assigned:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'incidentAutoAssigned', data, timestamp: new Date() });
    onIncidentAutoAssigned?.(data);
    triggerAutoRefresh();
  }, [onIncidentAutoAssigned, playSound, triggerAutoRefresh]);

  const handleDriverAssigned = useCallback((data: any) => {
    console.log('👨‍✈️ Driver assigned:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('assignment');
    }
    
    setLastEvent({ type: 'driverAssigned', data, timestamp: new Date() });
    onDriverAssigned?.(data);
    triggerAutoRefresh();
  }, [onDriverAssigned, playSound, triggerAutoRefresh]);

  const handleDriverRejected = useCallback((data: any) => {
    console.log('🔁 Driver rejected:', data);
    
    setLastEvent({ type: 'driverRejected', data, timestamp: new Date() });
    onDriverRejected?.(data);
    triggerAutoRefresh();
  }, [onDriverRejected, triggerAutoRefresh]);

  const handleAssignmentCountdown = useCallback((data: any) => {
    console.log('⏱️ Assignment countdown:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('countdown');
    }
    
    setLastEvent({ type: 'assignmentCountdown', data, timestamp: new Date() });
    onAssignmentCountdown?.(data);
  }, [onAssignmentCountdown, playSound]);

  const handleAssignmentExpired = useCallback((data: any) => {
    console.log('⏰ Assignment expired:', data);
    
    setLastEvent({ type: 'assignmentExpired', data, timestamp: new Date() });
    onAssignmentExpired?.(data);
    triggerAutoRefresh();
  }, [onAssignmentExpired, triggerAutoRefresh]);

  const handleRejectionConfirmed = useCallback((data: any) => {
    console.log('✅ Rejection confirmed:', data);
    
    setLastEvent({ type: 'rejectionConfirmed', data, timestamp: new Date() });
    onRejectionConfirmed?.(data);
    triggerAutoRefresh();
  }, [onRejectionConfirmed, triggerAutoRefresh]);

  const handleHospitalRequest = useCallback((data: any) => {
    console.log('🏥 Hospital request received:', data);
    
    if (playSound) {
      SocketService.playNotificationSound('new');
    }
    
    setLastEvent({ type: 'hospitalRequest', data, timestamp: new Date() });
    triggerAutoRefresh();
  }, [playSound, triggerAutoRefresh]);

  useEffect(() => {
    // Register socket listeners based on role
    if (role === 'admin' || role === 'superadmin') {
      SocketService.on('newIncident', handleNewIncident);
      SocketService.on('incidentUpdated', handleIncidentUpdated);
      SocketService.on('driverAssigned', handleDriverAssigned);
    }

    if (role === 'department') {
      SocketService.on('incidentApproved', handleIncidentApproved);
      SocketService.on('incidentAvailable', handleIncidentAvailable);
      SocketService.on('incidentClaimed', handleIncidentClaimed);
      SocketService.on('incidentOpenToAll', handleIncidentOpenToAll);
      SocketService.on('incidentAutoAssigned', handleIncidentAutoAssigned);
      SocketService.on('incidentUpdated', handleIncidentUpdated);
      SocketService.on('driverRejected', handleDriverRejected);
    }

    if (role === 'driver') {
      SocketService.on('incidentAssigned', handleIncidentAssigned);
      SocketService.on('assignmentCountdown', handleAssignmentCountdown);
      SocketService.on('assignmentExpired', handleAssignmentExpired);
      SocketService.on('rejectionConfirmed', handleRejectionConfirmed);
      SocketService.on('incidentUpdated', handleIncidentUpdated);
    }

    if (role === 'hospital') {
      SocketService.on('hospitalRequest', handleHospitalRequest);
      SocketService.on('incidentUpdated', handleIncidentUpdated);
    }

    // Cleanup
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Unregister listeners to prevent duplicates and memory leaks
      if (role === 'admin' || role === 'superadmin') {
        SocketService.off('newIncident', handleNewIncident);
        SocketService.off('incidentUpdated', handleIncidentUpdated);
        SocketService.off('driverAssigned', handleDriverAssigned);
      }
      
      if (role === 'department') {
        SocketService.off('incidentApproved', handleIncidentApproved);
        SocketService.off('incidentAvailable', handleIncidentAvailable);
        SocketService.off('incidentClaimed', handleIncidentClaimed);
        SocketService.off('incidentOpenToAll', handleIncidentOpenToAll);
        SocketService.off('incidentAutoAssigned', handleIncidentAutoAssigned);
        SocketService.off('incidentUpdated', handleIncidentUpdated);
        SocketService.off('driverRejected', handleDriverRejected);
      }
      
      if (role === 'driver') {
        SocketService.off('incidentAssigned', handleIncidentAssigned);
        SocketService.off('assignmentCountdown', handleAssignmentCountdown);
        SocketService.off('assignmentExpired', handleAssignmentExpired);
        SocketService.off('rejectionConfirmed', handleRejectionConfirmed);
        SocketService.off('incidentUpdated', handleIncidentUpdated);
      }
      
      if (role === 'hospital') {
        SocketService.off('hospitalRequest', handleHospitalRequest);
        SocketService.off('incidentUpdated', handleIncidentUpdated);
      }
    };
  }, [
    role,
    handleNewIncident,
    handleIncidentUpdated,
    handleIncidentApproved,
    handleIncidentAssigned,
    handleIncidentAvailable,
    handleIncidentClaimed,
    handleIncidentOpenToAll,
    handleIncidentAutoAssigned,
    handleDriverAssigned,
    handleDriverRejected,
    handleAssignmentCountdown,
    handleAssignmentExpired,
    handleRejectionConfirmed,
    handleHospitalRequest
  ]);

  return { lastEvent };
};