// src/services/hospitalService.ts - UPDATED VERSION
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Define the complete HospitalIncident interface
export interface HospitalIncident {
  _id: string;
  id: string;
  reportedBy: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  description: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  photos: Array<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    department: string;
    driver?: {
      _id: string;
      name: string;
      phone: string;
    };
    driverName?: string;
    assignedAt: string;
    assignedBy: string;
  };
  aiDetectionScore?: number;
  duplicateIncidents?: string[];
  patientStatus?: {
    condition?: string;
    hospital?: string;
    medicalNotes?: string;
    treatment?: string;
    doctor?: string;
    bedNumber?: string;
    arrivedAt?: string;
    deliveredAt?: string;
    completedAt?: string;
    updatedAt?: string;
  };
  hospitalRequest?: {
    hospitalId: string;
    hospitalName: string;
    requestedAt: string;
    status: 'pending' | 'accepted' | 'rejected';
    eta: number;
    distance: number;
    driverId: string;
    driverName: string;
    patientCondition: string;
  };
  timestamps?: {
    reportedAt: string;
    assignedAt?: string;
    arrivedAt?: string;
    transportingAt?: string;
    deliveredAt?: string;
    admittedAt?: string;
    dischargedAt?: string;
    completedAt?: string;
  };
  actions?: Array<{
    action: string;
    performedBy: {
      _id: string;
      name: string;
      role: string;
    };
    timestamp: string;
    details: any;
  }>;
  similarIncidents?: number;
  hospitalStatus?: 'incoming' | 'admitted' | 'discharged';
  driverStatus?: string;
}

export interface HospitalStats {
  incomingCases: number;
  receivedCases: number;
  hospitalStats: Array<{ _id: string; count: number }>;
  incomingIncidents: HospitalIncident[];
  hospitalName: string;
}

export interface HospitalIncidentsResponse {
  incoming: HospitalIncident[];
  admitted: HospitalIncident[];
  discharged: HospitalIncident[];
}

class HospitalService {
  // Get hospital incidents (fixed structure like mobile)
  static async getHospitalIncidents(): Promise<{ 
    success: boolean; 
    data: HospitalIncidentsResponse 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🏥 Fetching hospital incidents...');
      
      const response = await axios.get(`${API_URL}/api/incidents/hospital/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 Hospital incidents response:', response.data);
      
      if (response.data.success) {
        // Transform the response to match our interface
        const transformedData: HospitalIncidentsResponse = {
          incoming: (response.data.data?.incoming || []).map((incident: any) => this.transformIncident(incident)),
          admitted: (response.data.data?.admitted || []).map((incident: any) => this.transformIncident(incident)),
          discharged: (response.data.data?.discharged || []).map((incident: any) => this.transformIncident(incident))
        };
        return { success: true, data: transformedData };
      }
      throw new Error('Failed to get hospital incidents');
    } catch (error: any) {
      console.error('❌ Error getting hospital incidents:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      // Return empty data structure
      return { 
        success: false, 
        data: { incoming: [], admitted: [], discharged: [] }
      };
    }
  }

  // Helper method to transform incident data
  private static transformIncident(data: any): HospitalIncident {
    return {
      _id: data._id || data.id || '',
      id: data._id || data.id || '',
      reportedBy: data.reportedBy || { _id: '', name: 'Unknown', email: '', phone: '' },
      description: data.description || 'No description provided',
      location: data.location || { type: 'Point', coordinates: [0, 0], address: 'Unknown location' },
      photos: data.photos || [],
      status: data.status || 'pending',
      category: data.category || 'Unknown',
      priority: data.priority || 'medium',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      assignedTo: data.assignedTo,
      aiDetectionScore: data.aiDetectionScore,
      duplicateIncidents: data.duplicateIncidents,
      patientStatus: data.patientStatus || {},
      timestamps: data.timestamps,
      actions: data.actions,
      similarIncidents: data.similarIncidents,
      hospitalStatus: data.hospitalStatus || 'pending',
      driverStatus: data.driverStatus
    };
  }

  // Get hospital dashboard stats
  static async getHospitalStats(): Promise<{ 
    success: boolean; 
    data: HospitalStats 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/dashboard/hospital`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return { 
          success: true, 
          data: {
            incomingCases: response.data.data?.incomingCases || 0,
            receivedCases: response.data.data?.receivedCases || 0,
            hospitalStats: response.data.data?.hospitalStats || [],
            incomingIncidents: (response.data.data?.incomingIncidents || []).map((incident: any) => this.transformIncident(incident)),
            hospitalName: response.data.data?.hospitalName || 'Hospital'
          }
        };
      }
      throw new Error('Failed to get hospital stats');
    } catch (error: any) {
      console.error('❌ Error getting hospital stats:', error);
      // Return default stats
      return { 
        success: false, 
        data: {
          incomingCases: 0,
          receivedCases: 0,
          hospitalStats: [],
          incomingIncidents: [],
          hospitalName: 'Hospital'
        }
      };
    }
  }

  // Update hospital workflow status
  static async updateHospitalWorkflowStatus(
  incidentId: string,
  status: 'admitted' | 'discharged',
  medicalNotes?: string,
  treatment?: string,
  doctor?: string,
  bedNumber?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    console.log(`🏥 Updating hospital status: ${incidentId} -> ${status}`);

    // Get current user data from localStorage instead of API call
    const userString = localStorage.getItem('user');
    let hospitalName = 'Jinnah Hospital'; // Default
    
    if (userString) {
      try {
        const user = JSON.parse(userString);
        hospitalName = user.hospital || 'Jinnah Hospital';
        console.log('👤 Got hospital from localStorage:', hospitalName);
      } catch (e) {
        console.warn('⚠️ Could not parse user data from localStorage');
      }
    }

    // IMPORTANT: Use the correct field names that the backend expects
    const updateData = {
      status: status, // This should be the hospital status
      medicalNotes: medicalNotes || 'Patient status updated',
      treatment: treatment || 'Standard treatment',
      doctor: doctor || `Dr. ${hospitalName}`,
      bedNumber: bedNumber || '',
      // Add patientStatus structure for compatibility
      patientStatus: {
        condition: 'Under treatment',
        hospital: hospitalName,
        medicalNotes: medicalNotes || 'Patient status updated',
        treatment: treatment || 'Standard treatment',
        doctor: doctor || `Dr. ${hospitalName}`,
        bedNumber: bedNumber,
        updatedAt: new Date().toISOString()
      }
    };

    console.log('📤 Sending update data:', updateData);

    const response = await axios.put(
      `${API_URL}/api/incidents/${incidentId}/hospital-status`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Hospital status update response:', response.data);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.message };
    }
  } catch (error: any) {
    console.error('❌ Error updating hospital status:', error);
    if (error.response) {
      console.error('Response error:', error.response.data);
      return { 
        success: false, 
        error: error.response.data?.message || 'Failed to update status' 
      };
    }
    return { success: false, error: 'Network error' };
  }
}

  // Respond to a hospital request (accept or reject) - NEW (Mobile Parity)
  static async respondToHospitalRequest(
    incidentId: string,
    response: 'accepted' | 'rejected',
    options?: {
      reason?: string;
      bedNumber?: string;
      doctorName?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      console.log(`🏥 Responding to hospital request: ${incidentId} -> ${response}`);

      const updateData = {
        response,
        reason: options?.reason,
        bedNumber: options?.bedNumber,
        doctorName: options?.doctorName
      };

      const apiResponse = await axios.put(
        `${API_URL}/api/incidents/${incidentId}/hospital-response`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Hospital response update result:', apiResponse.data);

      if (apiResponse.data.success) {
        return { success: true, data: apiResponse.data.data };
      } else {
        return { success: false, error: apiResponse.data.message };
      }
    } catch (error: any) {
      console.error('❌ Error responding to hospital request:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to respond to request' 
      };
    }
  }

  // Get all pending hospital requests - NEW (Mobile Parity)
  static async getPendingRequests(): Promise<{ 
    success: boolean; 
    data: any[] 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🏥 Fetching pending hospital requests...');
      
      const response = await axios.get(`${API_URL}/api/incidents/hospital/pending-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return { success: true, data: response.data.data || [] };
      }
      throw new Error('Failed to get pending requests');
    } catch (error: any) {
      console.error('❌ Error getting pending requests:', error);
      return { success: false, data: [] };
    }
  }

  // Get incidents by hospital status
  static async getIncidentsByHospitalStatus(status: string): Promise<{ 
    success: boolean; 
    data: HospitalIncident[] 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/incidents/hospital/status/${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const incidents = (response.data.data || []).map((incident: any) => this.transformIncident(incident));
        return { success: true, data: incidents };
      }
      throw new Error('Failed to get incidents by hospital status');
    } catch (error: any) {
      console.error('❌ Error getting incidents by hospital status:', error);
      return { success: false, data: [] };
    }
  }

  // Get hospital workflow dashboard
  static async getHospitalWorkflowDashboard(): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await axios.get(`${API_URL}/api/incidents/hospital/workflow`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting hospital workflow:', error);
      return { success: false, error: 'Failed to get workflow data' };
    }
  }

  // Debug hospital query
  static async debugHospitalQuery(): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await axios.get(`${API_URL}/api/incidents/debug/hospital-query`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error debugging hospital query:', error);
      return { success: false, error: 'Failed to debug hospital query' };
    }
  }

  // Fix hospital status
  static async fixHospitalStatus(): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await axios.put(
        `${API_URL}/api/incidents/fix-hospital-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      console.error('❌ Error fixing hospital status:', error);
      return { success: false, error: 'Failed to fix hospital status' };
    }
  }


}

export const JINNAH_HOSPITAL_COORDS: [number, number] = [24.8517, 67.0425];

export const getSafeCoordinates = (location: any): [number, number] | null => {
  if (!location || !location.coordinates || !Array.isArray(location.coordinates)) {
    return null;
  }
  // Backend GeoJSON is [longitude, latitude], Leaflet/Map expects [latitude, longitude]
  return [location.coordinates[1], location.coordinates[0]];
};

export default HospitalService;