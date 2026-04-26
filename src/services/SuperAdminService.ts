import axios from 'axios';
import { User } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface SystemStats {
  totalUsers: number;
  totalIncidents: number;
  totalDepartments: number;
  totalHospitals: number;
  activeIncidents: number;
  pending: number;
  completed: number;
  systemUptime?: string;
  avgResponseTime?: string;
  successRate?: string;
  activeUsers: number;
}

export interface Activity {
  type: string;
  user: string;
  role: string;
  action: string;
  details: string;
  time: string;
  icon: string;
  color: string;
  severity: string;
}

export interface AnalyticsData {
  incidentTrends: any[];
  userGrowth: any[];
  departmentPerformance: any[];
  responseTimeAnalysis: any[];
  period: string;
}

class SuperAdminService {
  // Get comprehensive system statistics
  static async getSystemStats(): Promise<SystemStats> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First get user stats
      const usersResponse = await axios.get(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const users = usersResponse.data.success ? usersResponse.data.data : [];
      
      // Get dashboard stats
      const dashboardResponse = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const dashboardData = dashboardResponse.data.success ? dashboardResponse.data.data : {};

      // Calculate stats
      const activeUsers = users.filter((u: User) => u.status === 'active').length;
      const departments = users.filter((u: User) => u.role === 'department').length;
      const hospitals = users.filter((u: User) => u.role === 'hospital').length;

      return {
        totalUsers: users.length,
        totalIncidents: dashboardData.overview?.totalIncidents || 0,
        totalDepartments: departments,
        totalHospitals: hospitals,
        activeIncidents: dashboardData.overview?.pendingIncidents || 0,
        pending: dashboardData.overview?.pendingIncidents || 0,
        completed: dashboardData.overview?.completedIncidents || 0,
        systemUptime: '99.8%',
        avgResponseTime: dashboardData.overview?.avgResponseTime ? `${dashboardData.overview.avgResponseTime.toFixed(1)} mins` : '0 mins',
        successRate: '96%',
        activeUsers
      };
    } catch (error: any) {
      console.error('Error getting system stats:', error);
      // Return default stats
      return {
        totalUsers: 0,
        totalIncidents: 0,
        totalDepartments: 0,
        totalHospitals: 0,
        activeIncidents: 0,
        pending: 0,
        completed: 0,
        systemUptime: '0%',
        avgResponseTime: '0 mins',
        successRate: '0%',
        activeUsers: 0
      };
    }
  }

  // Get all users with filtering
  static async getAllUsers(): Promise<User[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data.map((user: any) => ({
          ...user,
          id: user._id || user.id,
          userId: user._id || user.id
        }));
      }
      return [];
    } catch (error: any) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Get recent system activities
  static async getRecentActivities(): Promise<Activity[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get recent incidents
      const incidentsResponse = await axios.get(`${API_URL}/api/incidents?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (incidentsResponse.data.success) {
        const incidents = incidentsResponse.data.data || [];
        
        return incidents.map((incident: any) => ({
          type: 'incident_reported',
          user: incident.reportedBy?.name || 'Unknown',
          role: 'Citizen',
          action: 'Reported incident',
          details: incident.description || 'No description',
          time: this.formatTime(new Date(incident.createdAt)),
          icon: 'warning',
          color: 'orange',
          severity: 'Normal'
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  // Get system analytics
  static async getSystemAnalytics(period: string = '30d'): Promise<AnalyticsData | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/admin/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }

  // Bulk user operations
  static async bulkUpdateUserStatus(userIds: string[], status: 'active' | 'inactive' | 'suspended'): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update each user
      const promises = userIds.map(userId => 
        axios.put(`${API_URL}/api/users/${userId}`, { status }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error in bulk update:', error);
      return false;
    }
  }

  // Create new user
  static async createUser(userData: Partial<User>): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_URL}/api/users`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  // Update user
  static async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_URL}/api/users/${userId}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Delete user
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.delete(`${API_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.success;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  static async getDriverIncidentsForSuperAdmin(driverId: string): Promise<{ 
  success: boolean; 
  data?: any; 
  driver?: any;
  error?: string 
}> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await axios.get(`${API_URL}/api/admin/driver-incidents/${driverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error getting driver incidents for super admin:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to get driver incidents' 
    };
  }
}
// Add this method to your SuperAdminService class
static async getAllDriverIncidents(): Promise<{ 
  success: boolean; 
  data: any[];
  error?: string 
}> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, data: [], error: 'No authentication token found' };
    }

    console.log('👑 Super Admin fetching all driver incidents...');
    
    // Try multiple endpoints to get driver incidents
    let incidents = [];
    
    // First try: Direct driver incidents endpoint (for superadmin)
    try {
      const response = await axios.get(`${API_URL}/api/incidents/driver/my-incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          viewAsDriver: 'true'
        }
      });

      console.log('📊 Direct driver incidents response:', response.data);

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          incidents = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data.data)) {
          incidents = response.data.data.data;
        }
        console.log(`✅ Found ${incidents.length} incidents via driver endpoint`);
      }
    } catch (directError) {
      console.log('⚠️ Direct driver endpoint failed, trying fallback...');
    }

    // Fallback: Get all incidents and filter
    if (incidents.length === 0) {
      const allIncidentsResponse = await axios.get(`${API_URL}/api/incidents?limit=200&status=assigned,in_progress,completed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 All incidents response:', allIncidentsResponse.data);

      if (allIncidentsResponse.data.success) {
        let allIncidents = [];
        
        if (Array.isArray(allIncidentsResponse.data.data)) {
          allIncidents = allIncidentsResponse.data.data;
        } else if (allIncidentsResponse.data.data && Array.isArray(allIncidentsResponse.data.data.data)) {
          allIncidents = allIncidentsResponse.data.data.data;
        }

        // Filter incidents assigned to drivers
        incidents = allIncidents.filter((incident: any) => {
          return incident.assignedTo && incident.assignedTo.driver;
        });

        console.log(`✅ Filtered ${incidents.length} driver incidents from all incidents`);
      }
    }

    // Transform incidents data
    const driverIncidents = incidents.map((incident: any) => {
      // Get driver details
      let driverName = 'Unknown Driver';
      let driverId = '';
      
      if (incident.assignedTo?.driver) {
        if (typeof incident.assignedTo.driver === 'object') {
          driverName = incident.assignedTo.driver.name || 'Unknown Driver';
          driverId = incident.assignedTo.driver._id || incident.assignedTo.driver.id || '';
        } else if (typeof incident.assignedTo.driver === 'string') {
          driverId = incident.assignedTo.driver;
        }
      }

      // Extract location
      let location = 'Unknown Location';
      if (incident.location) {
        if (typeof incident.location === 'string') {
          location = incident.location;
        } else if (incident.location.address) {
          location = incident.location.address;
        } else if (Array.isArray(incident.location.coordinates)) {
          location = `[${incident.location.coordinates[0]}, ${incident.location.coordinates[1]}]`;
        }
      }

      // Extract description
      const description = incident.description || 'No description available';

      return {
        ...incident,
        id: incident._id || incident.id || '',
        _id: incident._id || incident.id || '',
        driverName,
        driverId,
        location,
        description,
        status: incident.status || 'pending',
        driverStatus: incident.driverStatus || 'assigned',
        hospitalStatus: incident.hospitalStatus || 'pending',
        priority: incident.priority || 'medium',
        department: incident.assignedTo?.department || 'Unknown Department',
        patientHospital: incident.patientStatus?.hospital,
        patientCondition: incident.patientStatus?.condition,
        createdAt: incident.createdAt || new Date().toISOString(),
        updatedAt: incident.updatedAt || new Date().toISOString()
      };
    });

    console.log(`📊 Total driver incidents found: ${driverIncidents.length}`);
    console.log('📊 Breakdown:', {
      assigned: driverIncidents.filter((i: { status: string; }) => i.status === 'assigned').length,
      inProgress: driverIncidents.filter((i: { status: string; }) => i.status === 'in_progress').length,
      completed: driverIncidents.filter((i: { status: string; }) => i.status === 'completed').length
    });

    return { 
      success: true, 
      data: driverIncidents
    };
  } catch (error: any) {
    console.error('❌ Error getting driver incidents:', error);
    return { 
      success: false, 
      data: [], 
      error: error.response?.data?.message || error.message || 'Network error'
    };
  }
}
static async getDriverDashboardData(driverId: string): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string 
}> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    console.log(`👑 Super Admin fetching dashboard for driver: ${driverId}`);
    
    // First get the driver's incidents
    const incidentsResponse = await axios.get(`${API_URL}/api/admin/driver-incidents/${driverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (incidentsResponse.data.success) {
      // Get driver stats using the driver incidents
      const incidents = incidentsResponse.data.data || [];
      
      const completedToday = incidents.filter((inc: any) => {
        const today = new Date().toDateString();
        const incidentDate = new Date(inc.updatedAt).toDateString();
        return inc.status === 'completed' && incidentDate === today;
      }).length;

      const totalCompleted = incidents.filter((inc: any) => inc.status === 'completed').length;
      const activeAssignments = incidents.filter((inc: any) => 
        inc.status === 'assigned' || inc.status === 'in_progress'
      ).length;

      // Calculate average response time
      let totalResponseTime = 0;
      let validResponseTimes = 0;
      
      incidents.forEach((incident: any) => {
        if (incident.status === 'completed') {
          const startTime = new Date(incident.createdAt).getTime();
          const endTime = incident.updatedAt ? new Date(incident.updatedAt).getTime() : new Date().getTime();
          
          if (endTime > startTime) {
            const responseTime = Math.round((endTime - startTime) / (1000 * 60));
            totalResponseTime += responseTime;
            validResponseTimes++;
          }
        }
      });
      
      const avgResponseTime = validResponseTimes > 0 
        ? `${Math.round(totalResponseTime / validResponseTimes)} mins`
        : '0 mins';

      // Calculate success rate
      const totalAssigned = incidents.length;
      const successRate = totalAssigned > 0 
        ? `${Math.round((totalCompleted / totalAssigned) * 100)}%`
        : '0%';

      // Calculate total distance (estimated)
      const totalKm = totalCompleted * 15; // 15km per completed incident
      const totalDistance = `${totalKm} km`;

      return {
        success: true,
        data: {
          driver: incidentsResponse.data.driver,
          incidents: incidents,
          stats: {
            completedToday,
            totalCompleted,
            activeAssignments,
            totalDistance,
            avgResponseTime,
            successRate
          },
          categorizedIncidents: {
            assigned: incidents.filter((inc: any) => inc.status === 'assigned'),
            inProgress: incidents.filter((inc: any) => inc.status === 'in_progress'),
            completed: incidents.filter((inc: any) => inc.status === 'completed')
          }
        }
      };
    }
    
    return { success: false, error: incidentsResponse.data.message || 'Failed to get driver dashboard' };
  } catch (error: any) {
    console.error('❌ Error getting driver dashboard data:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Network error'
    };
  }
}
  // Restrict user
  static async restrictUser(userId: string, restrictionDays: number, reason: string): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_URL}/api/users/${userId}/restrict`, {
        restrictionDays,
        reason
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error restricting user:', error);
      return null;
    }
  }

  // Get user statistics by role
  static async getUserStats(): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/api/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Export users data to CSV
  static exportUsersToCSV(users: User[]): void {
    const headers = ['Name', 'Email', 'Phone', 'CNIC', 'Role', 'Department', 'Hospital', 'Status', 'Last Login', 'Created At'];
    const csvData = users.map(user => [
      user.name || '',
      user.email || '',
      user.phone || '',
      user.cnic || '',
      user.role || '',
      user.department || '',
      user.hospital || '',
      user.status || '',
      user.lastLogin || 'Never',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Format time helper
  private static formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }

  // Format date helper
  static formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }

  // Get role color
  static getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      superadmin: '#8B5CF6', // Purple
      admin: '#EF4444', // Red
      department: '#3B82F6', // Blue
      driver: '#10B981', // Green
      hospital: '#F59E0B', // Orange
      citizen: '#6B7280' // Gray
    };
    return colors[role] || '#6B7280';
  }

  // Get status color
  static getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: '#10B981', // Green
      inactive: '#6B7280', // Gray
      suspended: '#EF4444' // Red
    };
    return colors[status] || '#6B7280';
  }
}

export default SuperAdminService;