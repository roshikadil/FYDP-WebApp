import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.100.22:5000';

class SocketServiceClass {
  private socket: Socket | null = null;
  private isConnected = false;
  private token: string | null = null;
  private userId: string | null = null;
  private userRole: string | null = null;
  private department: string | null = null;

  // Audio for notifications
  private notificationSound: HTMLAudioElement | null = null;

  // Event handlers map
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.initSounds();
  }

  private initSounds() {
    try {
      this.notificationSound = new Audio('/notification.mp3');
      this.notificationSound.load();
    } catch (error) {
      console.warn('Could not load notification sound:', error);
    }
  }

  public playNotification() {
    this.playNotificationSound('default');
  }

  public playNotificationSound(type: 'new' | 'assignment' | 'countdown' | 'default' = 'default') {
    try {
      console.log(`🔊 Playing notification sound: ${type}`);
      if (this.notificationSound) {
        this.notificationSound.currentTime = 0;
        this.notificationSound.play().catch(e => console.warn('Sound play failed:', e));
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Initialize socket connection
  public initialize(token: string, userId: string, role: string, department?: string) {
    this.token = token;
    this.userId = userId;
    this.userRole = role;
    this.department = department || null;

    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    console.log('🔌 Initializing socket connection to:', API_URL);

    this.socket = io(API_URL, {
      transports: ['websocket'], // Use websocket as primary
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.joinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.isConnected = false;
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      this.isConnected = true;
      this.joinRooms();
    });

    // ========== EVENT FORWARDING ==========
    
    // Admin / SuperAdmin
    this.socket.on('newIncident', (data) => {
      console.log('🚨 New incident received!');
      this.playNotification();
      this.emit('newIncident', data);
    });

    this.socket.on('incidentUpdated', (data) => {
      this.emit('incidentUpdated', data);
    });

    this.socket.on('driverAssigned', (data) => {
      console.log('👨‍✈️ Driver assigned');
      this.playNotification();
      this.emit('driverAssigned', data);
    });

    // Department
    this.socket.on('incidentApproved', (data) => {
      console.log('✅ Incident approved');
      this.playNotification();
      this.emit('incidentApproved', data);
    });

    this.socket.on('incidentAvailable', (data) => {
      console.log('📊 Incident available');
      this.playNotification();
      this.emit('incidentAvailable', data);
    });

    this.socket.on('incidentClaimed', (data) => {
      console.log('🔒 Incident claimed');
      this.emit('incidentClaimed', data);
    });

    this.socket.on('incidentOpenToAll', (data) => {
      console.log('🔓 Incident open to all');
      this.emit('incidentOpenToAll', data);
    });

    this.socket.on('incidentAutoAssigned', (data) => {
      console.log('🤖 Incident auto-assigned');
      this.emit('incidentAutoAssigned', data);
    });

    this.socket.on('driverRejected', (data) => {
      this.emit('driverRejected', data);
    });

    // Driver
    this.socket.on('incidentAssigned', (data) => {
      console.log('🚗 Incident assigned');
      this.playNotification();
      this.emit('incidentAssigned', data);
    });

    this.socket.on('assignmentCountdown', (data) => {
      this.playNotification();
      this.emit('assignmentCountdown', data);
    });

    this.socket.on('assignmentExpired', (data) => {
      this.emit('assignmentExpired', data);
    });

    this.socket.on('rejectionConfirmed', (data) => {
      this.emit('rejectionConfirmed', data);
    });

    // Hospital
    this.socket.on('hospitalRequest', (data) => {
      console.log('🏥 Hospital request received!');
      this.playNotification();
      this.emit('hospitalRequest', data);
    });

    this.socket.on('hospitalResponse', (data) => {
      console.log('🏥 Hospital response received!', data);
      this.playNotification();
      this.emit('hospitalResponse', data);
    });

    this.socket.on('driverLocationUpdate', (data) => {
      this.emit('driverLocationUpdate', data);
    });

    this.socket.on('driverArrivedAtHospital', (data) => {
      console.log('🏥 Driver arrived at hospital');
      this.playNotification();
      this.emit('driverArrivedAtHospital', data);
    });

    // Citizen
    this.socket.on('incidentStatusUpdate', (data) => {
      this.playNotification();
      this.emit('incidentStatusUpdate', data);
    });
  }

  private joinRooms() {
    if (!this.socket || !this.userId) return;

    if (this.userRole === 'admin' || this.userRole === 'superadmin') {
      this.socket.emit('join_admin', this.userId);
    }
    if (this.userRole === 'department' && this.department) {
      this.socket.emit('join_department', this.department);
    }
    if (this.userRole === 'driver') {
      this.socket.emit('join_driver', this.userId);
    }
    if (this.userRole === 'hospital') {
      this.socket.emit('join_hospital', this.userId);
    }
  }

  // Register event handler
  public on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  // Remove event handler
  public off(event: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) handlers.splice(index, 1);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // ========== CONVENIENCE METHODS ==========
  
  public joinAdminRoom(adminId: string) {
    if (this.socket?.connected) this.socket.emit('join_admin', adminId);
  }

  public joinDriverRoom(driverId: string) {
    if (this.socket?.connected) this.socket.emit('join_driver', driverId);
  }

  public joinDepartmentRoom(departmentName: string) {
    if (this.socket?.connected) this.socket.emit('join_department', departmentName);
  }

  public joinHospitalRoom(hospitalId: string) {
    if (this.socket?.connected) this.socket.emit('join_hospital', hospitalId);
  }

  public onNewIncident(handler: (data: any) => void) { this.on('newIncident', handler); }
  public onIncidentUpdated(handler: (data: any) => void) { this.on('incidentUpdated', handler); }
  public onDriverAssigned(handler: (data: any) => void) { this.on('driverAssigned', handler); }
  
  public onIncidentAssigned(handler: (data: any) => void) { this.on('incidentAssigned', handler); }
  public onAssignmentCountdown(handler: (data: any) => void) { this.on('assignmentCountdown', handler); }
  public onAssignmentExpired(handler: (data: any) => void) { this.on('assignmentExpired', handler); }
  public onRejectionConfirmed(handler: (data: any) => void) { this.on('rejectionConfirmed', handler); }

  // Department / Hospital
  public onIncidentApproved(handler: (data: any) => void) { this.on('incidentApproved', handler); }
  public onIncidentAvailable(handler: (data: any) => void) { this.on('incidentAvailable', handler); }
  public onIncidentClaimed(handler: (data: any) => void) { this.on('incidentClaimed', handler); }
  public onIncidentOpenToAll(handler: (data: any) => void) { this.on('incidentOpenToAll', handler); }
  public onIncidentAutoAssigned(handler: (data: any) => void) { this.on('incidentAutoAssigned', handler); }
  public onDriverRejected(handler: (data: any) => void) { this.on('driverRejected', handler); }

  public emitDriverResponse(data: any) {
    if (this.socket?.connected) {
      this.socket.emit('driverResponse', data);
    }
  }

  public emitDriverLocation(incidentId: string, latitude: number, longitude: number) {
    if (this.socket?.connected) {
      this.socket.emit('driverLocationUpdate', { incidentId, latitude, longitude });
    }
  }

  public emitDriverArrivedAtHospital(incidentId: string, hospitalName: string) {
    if (this.socket?.connected) {
      this.socket.emit('driverArrivedAtHospital', { incidentId, hospitalName });
    }
  }

  public onHospitalRequest(handler: (data: any) => void) { this.on('hospitalRequest', handler); }
  public onHospitalResponse(handler: (data: any) => void) { this.on('hospitalResponse', handler); }
  public onDriverLocationUpdate(handler: (data: any) => void) { this.on('driverLocationUpdate', handler); }
  public onDriverArrivedAtHospital(handler: (data: any) => void) { this.on('driverArrivedAtHospital', handler); }

  public removeAdminListeners() {
    this.eventHandlers.delete('newIncident');
    this.eventHandlers.delete('incidentUpdated');
    this.eventHandlers.delete('driverAssigned');
  }

  public removeTimerListeners() {
    this.eventHandlers.delete('assignmentCountdown');
    this.eventHandlers.delete('assignmentExpired');
    this.eventHandlers.delete('rejectionConfirmed');
  }

  public removeDepartmentListeners() {
    this.eventHandlers.delete('incidentApproved');
    this.eventHandlers.delete('incidentAvailable');
    this.eventHandlers.delete('incidentClaimed');
    this.eventHandlers.delete('incidentOpenToAll');
    this.eventHandlers.delete('incidentAutoAssigned');
    this.eventHandlers.delete('driverRejected');
  }

  public removeHospitalListeners() {
    this.eventHandlers.delete('hospitalRequest');
    this.eventHandlers.delete('hospitalResponse');
    this.eventHandlers.delete('driverLocationUpdate');
    this.eventHandlers.delete('driverArrivedAtHospital');
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public get connected(): boolean {
    return this.isConnected;
  }
}

export const SocketService = new SocketServiceClass();