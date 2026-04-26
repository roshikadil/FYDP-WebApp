import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface DepartmentStats {
  activeIncidents: number;
  availableDrivers: number;
  completedToday: number;
  totalAssigned: number;
  successRate: number;
}

class DepartmentService {
  private static getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  static async getDepartmentDrivers(): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const response = await axios.get(`${API_URL}/api/users/department/drivers`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting department drivers:', error);
      return { 
        success: false, 
        data: [], 
        error: error.response?.data?.message || 'Failed to fetch drivers' 
      };
    }
  }

  static async assignDriverToIncident(incidentId: string, driverId: string, department: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await axios.put(`${API_URL}/api/incidents/${incidentId}/assign`, {
        driverId,
        department
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error assigning driver:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to assign driver' 
      };
    }
  }

  static async createDirectEmergency(data: { location: any, description?: string, driverId?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.post(`${API_URL}/api/incidents/direct-emergency`, {
        ...data,
        category: 'Emergency',
        priority: 'high'
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating direct emergency:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create emergency' 
      };
    }
  }

  static async getDepartmentIncidents(): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const response = await axios.get(`${API_URL}/api/incidents`, {
        headers: this.getHeaders()
      });
      
      if (response.data.success) {
        let allIncidents = [];
        const responseData = response.data.data;
        
        if (responseData && responseData.data) {
          allIncidents = responseData.data;
        } else if (Array.isArray(responseData)) {
          allIncidents = responseData;
        }
        
        return { success: true, data: allIncidents };
      }
      return { success: false, data: [], error: 'Failed to fetch incidents' };
    } catch (error: any) {
      console.error('❌ Error getting department incidents:', error);
      return { success: false, data: [], error: 'Network error' };
    }
  }

  static async getStats(department: string): Promise<DepartmentStats> {
    try {
      const incidentsResponse = await this.getDepartmentIncidents();
      const driversResponse = await this.getDepartmentDrivers();
      
      if (!incidentsResponse.success || !driversResponse.success) {
        throw new Error('Failed to fetch data for stats');
      }

      const allIncidents = incidentsResponse.data;
      const drivers = driversResponse.data;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeIncidents = allIncidents.filter((inc: any) => 
        inc.assignedTo?.department === department && 
        inc.status === 'assigned' && 
        !inc.assignedTo?.driver
      ).length;

      const availableDrivers = drivers.filter((d: any) => d.status === 'active').length;

      const completedToday = allIncidents.filter((inc: any) => {
        const assignedDept = inc.assignedTo?.department;
        const isCompleted = inc.status === 'completed';
        const updatedToday = new Date(inc.updatedAt) >= today;
        return isCompleted && updatedToday && assignedDept === department;
      }).length;

      const totalAssigned = allIncidents.filter((inc: any) => 
        inc.assignedTo?.department === department
      ).length;

      const successRate = totalAssigned > 0 ? Math.round((completedToday / totalAssigned) * 100) : 0;

      return {
        activeIncidents,
        availableDrivers,
        completedToday,
        totalAssigned,
        successRate
      };
    } catch (error) {
      console.error('❌ Error calculating department stats:', error);
      return {
        activeIncidents: 0,
        availableDrivers: 0,
        completedToday: 0,
        totalAssigned: 0,
        successRate: 0
      };
    }
  }
}

export default DepartmentService;
