import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { SocketService } from '../services/SocketService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  timestamp?: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  useEffect(() => {
    const handleNewIncident = (data: any) => {
      addNotification({
        title: 'New Incident',
        message: data.incidentType ? `New ${data.incidentType} incident reported` : 'A new incident has been reported',
        type: 'warning',
      });
    };

    const handleIncidentAssigned = (data: any) => {
      addNotification({
        title: 'Incident Assigned',
        message: 'You have been assigned to a new incident',
        type: 'info',
      });
    };

    const handleHospitalRequest = (data: any) => {
      addNotification({
        title: 'Hospital Request',
        message: 'An ambulance is requesting transport to your hospital',
        type: 'warning',
      });
    };

    const handleDriverArrived = (data: any) => {
      addNotification({
        title: 'Ambulance Arrived',
        message: 'An ambulance has arrived at your hospital',
        type: 'success',
      });
    };

    SocketService.onNewIncident(handleNewIncident);
    SocketService.onIncidentAssigned(handleIncidentAssigned);
    SocketService.onHospitalRequest(handleHospitalRequest);
    SocketService.onDriverArrivedAtHospital(handleDriverArrived);

    return () => {
      SocketService.off('newIncident', handleNewIncident);
      SocketService.off('incidentAssigned', handleIncidentAssigned);
      SocketService.off('hospitalRequest', handleHospitalRequest);
      SocketService.off('driverArrivedAtHospital', handleDriverArrived);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};