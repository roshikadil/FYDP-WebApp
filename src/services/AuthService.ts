import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'department' | 'driver' | 'hospital' | 'citizen';
  phone: string;
  cnic: string;
  department?: string;
  hospital?: string;
  ambulanceService?: string;
  drivingLicense?: string;
  status: 'active' | 'inactive' | 'suspended';
  restrictionEndDate?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
  fcmToken?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  // Impersonation fields
  isImpersonation?: boolean;
  originalUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  [x: string]: any; // This allows other string properties with any type
}

class AuthService {
  // Login user
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🌐 API URL:', axios.defaults.baseURL);
      
      const response = await axios.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      console.log('📥 Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Store auth data
        this.setAuthData(token, user);
        
        console.log('✅ Login successful for:', user.email);
        console.log('👤 User role:', user.role);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('💥 Login error:', error);
      console.error('💥 Error response:', error.response?.data);
      console.error('💥 Error status:', error.response?.status);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Bad request';
        } else if (error.response.status === 404) {
          errorMessage = 'Server endpoint not found. Please check API configuration.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check if the backend is running.';
      }
      
      throw new Error(errorMessage);
    }
  }
  
  // Impersonate user
  static async impersonateUser(userId: string): Promise<LoginResponse> {
    try {
      console.log('👑 Attempting to impersonate user:', userId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`/api/auth/impersonate/${userId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('👑 Impersonation response:', response.data);

      if (response.data.success) {
        const { token: newToken, user } = response.data;
        
        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Store auth data
        this.setAuthData(newToken, user);
        
        console.log('✅ Now impersonating:', user.email, 'Role:', user.role);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Impersonation failed');
      }
    } catch (error: any) {
      console.error('💥 Impersonation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to impersonate user');
    }
  }

  // Return to Super Admin
  static async returnToSuperAdmin(): Promise<LoginResponse> {
    try {
      console.log('👑 Returning to Super Admin...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post('/api/auth/return-to-admin', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔙 Return to admin response:', response.data);

      if (response.data.success) {
        const { token: newToken, user } = response.data;
        
        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Store auth data
        this.setAuthData(newToken, user);
        
        console.log('✅ Returned to Super Admin:', user.email);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to return to admin');
      }
    } catch (error: any) {
      console.error('💥 Return to admin error:', error);
      
      // If there's an authentication error, clear local storage
      if (error.response?.status === 401) {
        console.log('🔐 Clearing auth data due to 401 error');
        this.clearAuthData();
      }
      
      throw new Error(error.response?.data?.message || 'Failed to return to admin');
    }
  }

  // Check if current session is impersonation
  static isImpersonationSession(): boolean {
    const user = this.getStoredUser();
    return user?.isImpersonation === true;
  }

  // Get original admin info if impersonating
  static getImpersonationInfo(): { originalUser?: any } {
    const user = this.getStoredUser();
    return {
      originalUser: user?.originalUser
    };
  }

  // Get current user
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await axios.get('/api/auth/me');
      
      if (response.data.success) {
        const user = response.data.data;
        
        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Update stored user data
        localStorage.setItem('user', JSON.stringify(user));
        
        return user;
      } else {
        throw new Error('Failed to get current user');
      }
    } catch (error: any) {
      console.error('❌ Error getting current user:', error);
      throw error;
    }
  }

  // Update user details
  static async updateDetails(userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put('/api/auth/updatedetails', userData);
      
      if (response.data.success) {
        const user = response.data.data;
        
        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Update stored user data
        localStorage.setItem('user', JSON.stringify(user));
        
        return user;
      } else {
        throw new Error('Failed to update user details');
      }
    } catch (error: any) {
      console.error('❌ Error updating details:', error);
      throw error;
    }
  }

  // Update password
  static async updatePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
    try {
      const response = await axios.put('/api/auth/updatepassword', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Update stored auth data
        this.setAuthData(token, user);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update password');
      }
    } catch (error: any) {
      console.error('❌ Error updating password:', error);
      throw error;
    }
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Verify token
  static async verifyToken(): Promise<{ valid: boolean; user: Partial<User> }> {
    try {
      const response = await axios.get('/api/auth/verify');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error: any) {
      console.error('❌ Token verification error:', error);
      throw error;
    }
  }

  // Get accessible dashboards
  static async getAccessibleDashboards(): Promise<string[]> {
    try {
      const response = await axios.get('/api/auth/dashboards');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to get accessible dashboards');
      }
    } catch (error: any) {
      console.error('❌ Error getting dashboards:', error);
      throw error;
    }
  }

  // Get all users (for super admin)
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await axios.get('/api/users');
      
      if (response.data.success) {
        return response.data.data.map((user: any) => ({
          ...user,
          id: user._id || user.id,
          userId: user._id || user.id
        }));
      } else {
        throw new Error('Failed to get users');
      }
    } catch (error: any) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Create user
  static async createUser(userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.post('/api/users', userData);
      
      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      console.log('📝 Updating user:', userId, userData);
      const response = await axios.put(`/api/users/${userId}`, userData);
      
      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        console.log('✅ User updated successfully:', user);
        return user;
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('❌ Update user error:', error);
      console.error('❌ Error details:', error.response?.data);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(userId: string): Promise<void> {
    try {
      const response = await axios.delete(`/api/users/${userId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Restrict user
  static async restrictUser(userId: string, restrictionDays: number, reason: string): Promise<User> {
    try {
      const response = await axios.put(`/api/users/${userId}/restrict`, {
        restrictionDays,
        reason
      });
      
      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      } else {
        throw new Error(response.data.message || 'Failed to restrict user');
      }
    } catch (error: any) {
      console.error('Restrict user error:', error);
      throw error;
    }
  }

  // Helper method to set auth data
  private static setAuthData(token: string, user: User): void {
    try {
      console.log('📝 Setting auth data...');
      console.log('🔑 Token length:', token.length);
      console.log('👤 User role:', user.role);
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('✅ Auth data set successfully');
      
      // Dispatch auth change event
      window.dispatchEvent(new CustomEvent('authChange', { 
        detail: { 
          user, 
          token,
          timestamp: new Date().toISOString()
        } 
      }));
      
    } catch (error) {
      console.error('❌ Error setting auth data:', error);
      throw error;
    }
  }

  // Helper method to clear auth data
  private static clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    
    // Dispatch a custom event to notify components of auth change
    window.dispatchEvent(new CustomEvent('authChange', { 
      detail: { user: null, token: null } 
    }));
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Get stored user data
  static getStoredUser(): User | null {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      } catch (error) {
        console.error('❌ Error parsing stored user:', error);
        return null;
      }
    }
    return null;
  }

  // Get current token
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Debug method
  static async testBackend(): Promise<boolean> {
    try {
      const response = await axios.get('/api/health');
      console.log('✅ Backend health check:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  }

  // Get impersonation status
  static getImpersonationStatus(): {
    isImpersonating: boolean;
    originalUser?: User;
    currentUser?: User;
  } {
    const user = this.getStoredUser();
    return {
      isImpersonating: user?.isImpersonation === true,
      originalUser: user?.originalUser as User | undefined,
      currentUser: user || undefined
    };
  }

  // Check if should show back button
  static shouldShowBackToSuperAdmin(): boolean {
    const status = this.getImpersonationStatus();
    return status.isImpersonating && !window.location.pathname.includes('/superadmin');
  }

  // Navigate back to Super Admin
  static async navigateBackToSuperAdmin(): Promise<void> {
    try {
      console.log('=== RETURN TO SUPER ADMIN START ===');
      
      // Get current auth state
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No token found');
        await this.directLoginAsSuperAdmin();
        return;
      }

      // Try to call the return endpoint
      try {
        console.log('📤 Calling return-to-admin endpoint...');
        
        const response = await axios.post('/api/auth/return-to-admin', {}, {
          headers: { 
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });

        console.log('📥 Response received:', response.data.success);

        if (response.data.success && response.data.token) {
          console.log('✅ Token received, updating auth data...');
          
          // Update auth data
          this.setAuthData(response.data.token, response.data.user);
          
          // Add return-to-admin parameter to prevent auth clearing
          const superadminUrl = '/superadmin?return-to-admin=true';
          
          console.log(`📍 Redirecting to: ${superadminUrl}`);
          
          // Force redirect with parameter
          setTimeout(() => {
            window.location.href = superadminUrl;
          }, 100);
          
          return;
        } else {
          console.error('❌ Return endpoint failed');
          await this.directLoginAsSuperAdmin();
        }
      } catch (error: any) {
        console.error('❌ Return endpoint error:', error.message);
        await this.directLoginAsSuperAdmin();
      }
      
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      await this.directLoginAsSuperAdmin();
    }
  }

  // Direct login as superadmin (fallback)
  static async directLoginAsSuperAdmin(): Promise<void> {
    try {
      console.log('🔄 Attempting direct superadmin login...');
      
      const credentials = {
        email: 'superadmin@irs.com',
        password: '123456'
      };
      
      const response = await axios.post('/api/auth/login', credentials);
      
      if (response.data.success) {
        console.log('✅ Direct superadmin login successful');
        this.setAuthData(response.data.token, response.data.user);
        
        // Add return-to-admin parameter
        const superadminUrl = '/superadmin?return-to-admin=true';
        
        setTimeout(() => {
          window.location.href = superadminUrl;
        }, 100);
      } else {
        console.error('❌ Direct login failed');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('❌ Direct login error:', error);
      window.location.href = '/login';
    }
  }

  // Emergency login as superadmin
  static async emergencyLoginAsSuperAdmin(): Promise<void> {
    try {
      console.log('🚨 Emergency login as superadmin...');
      
      // Use default superadmin credentials
      const superadminCredentials = {
        email: 'superadmin@irs.com',
        password: '123456'
      };
      
      // Try to login directly as superadmin
      try {
        const response = await axios.post('/api/auth/login', superadminCredentials);
        
        if (response.data.success) {
          console.log('✅ Emergency login successful');
          this.setAuthData(response.data.token, response.data.user);
          
          // Force redirect to superadmin
          setTimeout(() => {
            window.location.href = '/superadmin';
            window.location.reload();
          }, 100);
          return;
        }
      } catch (loginError) {
        console.error('❌ Emergency login failed:', loginError);
      }
      
      // Last resort: redirect to login page
      console.log('📍 Redirecting to login page...');
      this.clearAuthData();
      window.location.href = '/login';
      
    } catch (error) {
      console.error('💥 Emergency method failed:', error);
      this.clearAuthData();
      window.location.href = '/login';
    }
  }

  static debugAuthStatus(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    console.log('=== AUTH DEBUG ===');
    console.log('🔑 Token exists:', !!token);
    if (token) {
      console.log('🔑 Token length:', token.length);
      console.log('🔑 Token preview:', token.substring(0, Math.min(20, token.length)) + '...');
    }
    
    console.log('👤 User data:', user);
    console.log('👤 User role:', user?.role);
    console.log('👤 User email:', user?.email);
    console.log('👤 Is impersonation:', user?.isImpersonation);
    console.log('👤 Backend URL:', axios.defaults.baseURL);
    console.log('=================');
  }
}

export default AuthService;