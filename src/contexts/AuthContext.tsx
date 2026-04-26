import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketService } from "../services/SocketService";

// Set base URL for API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.baseURL = API_URL;

export interface User {
  _id: string;
  id: string;
  userId: string;
  name: string;
  email: string;
  role:
    | "superadmin"
    | "admin"
    | "department"
    | "driver"
    | "hospital"
    | "citizen";
  phone: string;
  cnic: string;
  department?: string;
  hospital?: string;
  ambulanceService?: string;
  drivingLicense?: string;
  status: "active" | "inactive" | "suspended";
  restrictionEndDate?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  fcmToken?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  isImpersonation?: boolean;
  originalUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DashboardStats {
  totalIncidents: number;
  pendingIncidents: number;
  approvedIncidents: number;
  completedIncidents: number;
  avgResponseTime: number;
}

export interface Incident {
  seqId?: number;
  additionalInfo: string;
  media: boolean;
  severity: any;
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
    address: string;
    coordinates:
      | {
          lat: number;
          lng: number;
        }
      | [number, number]; // Accepts both object and array formats
  };
  photos: Array<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
  }>;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "verification_needed";
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
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
    assignedBy?: string;
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
    updatedAt?: string;
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
  hospitalStatus?: string;
  driverStatus?: string;
  verificationNeeded?: boolean;
}

interface AdminDashboardData {
  overview: DashboardStats;
  recentIncidents: Incident[];
  userStats: Array<{
    _id: string;
    count: number;
    active: number;
  }>;
  categoryStats: Array<{
    _id: string;
    count: number;
  }>;
  departmentStats: Array<{
    _id: string;
    count: number;
    completed: number;
  }>;
  analytics: {
    dailyIncidents: any[];
    monthlyTrends: any[];
    priorityDistribution: any[];
  };
}

interface DashboardAccess {
  admin: boolean;
  hospital: boolean;
  department: boolean;
  driver: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isImpersonating: boolean;
  originalUser: User | null;

  // Authentication methods
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; user: User }>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User>;

  // Impersonation methods
  impersonateUser: (
    userId: string,
  ) => Promise<{ success: boolean; user: User }>;
  returnToSuperAdmin: () => Promise<void>;

  // Dashboard access methods
  getAccessibleDashboards: () => string[];
  updateDashboardAccess: (access: DashboardAccess) => void;

  // User Management Methods (for super admin)
  getUsers: () => Promise<User[]>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  restrictUser: (
    userId: string,
    restrictionDays: number,
    reason: string,
  ) => Promise<User>;

  // Admin Dashboard Methods
  getAdminDashboardData: () => Promise<AdminDashboardData>;
  getAdminIncidents: (params?: any) => Promise<any>;
  approveIncident: (incidentId: string, department: string) => Promise<any>;
  rejectIncident: (incidentId: string, reason: string) => Promise<any>;
  bulkApproveIncidents: (
    incidentIds: string[],
    department: string,
  ) => Promise<any>;
  bulkRejectIncidents: (incidentIds: string[], reason: string) => Promise<any>;
  bulkAssignDepartment: (
    incidentIds: string[],
    department: string,
  ) => Promise<any>;
  getSystemAnalytics: (period?: string) => Promise<any>;
  getUserStats: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ====================================================================
// 🔥 GLOBAL AXIOS INTERCEPTORS (outside component to fix Fast Refresh)
// ====================================================================

// Request interceptor: always attach the latest token from localStorage
axios.interceptors.request.use((config) => {
  const currentToken = localStorage.getItem('token');
  if (currentToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return config;
});

// Response interceptor: on 401/403, clear session and redirect to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized — session expired, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      console.error(
        `❌ 403 Forbidden — current role: "${parsedUser?.role || 'none'}" is not authorized for this action. ` +
        `Access denied for: ${error.config?.url}`
      );
    }
    return Promise.reject(error);
  }
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔑 Initializing auth state...");

        // Get stored auth data
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          console.log("🔄 Found stored auth data");

          try {
            // Parse user data
            const parsedUser = JSON.parse(storedUser);

            // Set token and user immediately for better UX
            setToken(storedToken);
            setUser(parsedUser);
            axios.defaults.headers.common["Authorization"] =
              `Bearer ${storedToken}`;

            // Check if this is an impersonation session
            if (parsedUser.isImpersonation && parsedUser.originalUser) {
              setIsImpersonating(true);
              setOriginalUser(parsedUser.originalUser);
            }

            console.log("👤 Set user from localStorage:", parsedUser.email);
            console.log("🎯 User role:", parsedUser.role);

            // Initialize socket on refresh
            SocketService.initialize(
              storedToken,
              parsedUser.id || parsedUser._id,
              parsedUser.role,
              parsedUser.department,
            );

            // Verify token with backend in background (silent refresh)
            setTimeout(async () => {
              try {
                console.log("🔍 Verifying token in background...");
                const response = await axios.get("/api/auth/verify", {
                  headers: { Authorization: `Bearer ${storedToken}` },
                  timeout: 5000,
                });

                if (response.data.success) {
                  console.log("✅ Token verified successfully");
                  // Update user data from backend if needed
                  const updatedUser = response.data.data?.user;
                  if (updatedUser) {
                    updatedUser.id = updatedUser._id || updatedUser.id;
                    updatedUser.userId = updatedUser._id || updatedUser.id;

                    // Check if this is an impersonation session
                    if (
                      updatedUser.isImpersonation &&
                      updatedUser.originalUser
                    ) {
                      setIsImpersonating(true);
                      setOriginalUser(updatedUser.originalUser);
                    }

                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                  }
                } else {
                  console.warn(
                    "⚠️ Token verification failed - keeping cached session",
                  );
                  // Keep using cached session - token will fail on next API call
                }
              } catch (verifyError) {
                console.warn(
                  "⚠️ Token verification error (network or timeout):",
                  verifyError,
                );
                // Continue with cached session
              }
            }, 1000);
          } catch (parseError) {
            console.error("❌ Error parsing stored user:", parseError);
            // Clear invalid data
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          }
        } else {
          console.log("ℹ️ No stored auth data found");
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear all auth data on error
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("🔐 Attempting login for:", email);

      const response = await axios.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data;

        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Store auth data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        setUser(user);
        setToken(token);
        setIsImpersonating(false);
        setOriginalUser(null);

        console.log("✅ Login successful for:", user.email);
        console.log("🎯 User role:", user.role);
        SocketService.initialize(
          token,
          user.id || user._id,
          user.role,
          user.department,
        );

        // Return success, let component handle navigation
        return { success: true, user };
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please check your credentials.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes("Network Error")) {
        errorMessage =
          "Cannot connect to server. Please check if backend is running.";
      }

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        try {
          await axios.post(
            "/api/auth/logout",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 3000,
            },
          );
        } catch (error) {
          console.warn("Logout API call failed:", error);
          // Continue with local logout even if API fails
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      SocketService.disconnect();
      // Always clear local auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      setToken(null);
      setIsImpersonating(false);
      setOriginalUser(null);

      // Redirect to login page
      navigate("/login");

    }
  };

  // Get current user
  const getCurrentUser = async (): Promise<User> => {
    try {
      const response = await axios.get("/api/auth/me");

      if (response.data.success) {
        const user = response.data.data;

        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);

        return user;
      } else {
        throw new Error("Failed to get current user");
      }
    } catch (error: any) {
      console.error("Get current user error:", error);

      // If the error is 401 (unauthorized), logout the user
      if (error.response?.status === 401) {
        await logout();
      }

      throw error;
    }
  };

  // Impersonate user
  const impersonateUser = async (
    userId: string,
  ): Promise<{ success: boolean; user: User }> => {
    try {
      setLoading(true);

      // Call backend API to get impersonation token
      const response = await axios.post(`/api/auth/impersonate/${userId}`);

      if (response.data.success) {
        const { token, user } = response.data;

        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Store the original user if this is the first impersonation
        if (!isImpersonating && !originalUser) {
          setOriginalUser(user);
        }

        // Store auth data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        setUser(user);
        setToken(token);
        setIsImpersonating(true);

        console.log(`✅ Impersonating user: ${user.email}`);

        return { success: true, user };
      } else {
        throw new Error(response.data.message || "Impersonation failed");
      }
    } catch (error: any) {
      console.error("Impersonate user error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to impersonate user",
      );
    } finally {
      setLoading(false);
    }
  };

  // Return to super admin
  const returnToSuperAdmin = async (): Promise<void> => {
    try {
      setLoading(true);

      if (!originalUser) {
        throw new Error("No original user found");
      }

      // Call backend API to return to super admin
      const response = await axios.post("/api/auth/return-to-superadmin");

      if (response.data.success) {
        const { token, user } = response.data;

        // Ensure consistent ID fields
        user.id = user._id || user.id;
        user.userId = user._id || user.id;

        // Store auth data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        setUser(user);
        setToken(token);
        setIsImpersonating(false);
        setOriginalUser(null);

        console.log(`✅ Returned to super admin: ${user.email}`);
      } else {
        throw new Error(
          response.data.message || "Failed to return to super admin",
        );
      }
    } catch (error: any) {
      console.error("Return to super admin error:", error);
      // Fallback to logout if API fails
      await logout();
    } finally {
      setLoading(false);
    }
  };

  // ========== DASHBOARD ACCESS METHODS ==========
  const getAccessibleDashboards = (): string[] => {
    if (!user) return [];

    const accessibleDashboards: string[] = [];

    if (user.role === "superadmin") {
      accessibleDashboards.push(
        "superadmin",
        "admin",
        "department",
        "driver",
        "hospital",
      );
    } else if (user.role === "admin") {
      accessibleDashboards.push("admin", "department");
    } else if (user.role === "department") {
      accessibleDashboards.push("department");
    } else if (user.role === "driver") {
      accessibleDashboards.push("driver");
    } else if (user.role === "hospital") {
      accessibleDashboards.push("hospital");
    }

    return accessibleDashboards;
  };

  const updateDashboardAccess = (access: DashboardAccess): void => {
    console.log("Dashboard access updated:", access);
  };

  // ========== ADMIN DASHBOARD METHODS ==========
  const getAdminDashboardData = async (): Promise<AdminDashboardData> => {
    try {
      const response = await axios.get("/api/admin/dashboard");

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to get dashboard data");
      }
    } catch (error: any) {
      console.error("Get dashboard data error:", error);
      throw error;
    }
  };

  const getAdminIncidents = async (params = {}): Promise<any> => {
    try {
      const response = await axios.get("/api/admin/incidents", { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('❌ Unauthorized (401) fetching admin incidents — clearing session and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        const storedUser = localStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        console.error(`❌ Forbidden (403) — current user role: ${parsedUser?.role || 'unknown'}. Admin or superadmin role required.`);
      }
      throw error;
    }
  };

  const approveIncident = async (
    incidentId: string,
    department: string,
  ): Promise<any> => {
    try {
      const response = await axios.put(`/api/incidents/${incidentId}/approve`, {
        department,
      });

      return response.data;
    } catch (error: any) {
      console.error("Approve incident error:", error);
      throw error;
    }
  };

  const rejectIncident = async (
    incidentId: string,
    reason: string,
  ): Promise<any> => {
    try {
      const response = await axios.put(`/api/incidents/${incidentId}/reject`, {
        reason,
      });

      return response.data;
    } catch (error: any) {
      console.error("Reject incident error:", error);
      throw error;
    }
  };

  const bulkApproveIncidents = async (
    incidentIds: string[],
    department: string,
  ): Promise<any> => {
    try {
      const response = await axios.post("/api/admin/incidents/bulk-actions", {
        incidentIds,
        action: "approve",
        department,
      });

      return response.data;
    } catch (error: any) {
      console.error("Bulk approve error:", error);
      throw error;
    }
  };

  const bulkRejectIncidents = async (
    incidentIds: string[],
    reason: string,
  ): Promise<any> => {
    try {
      const response = await axios.post("/api/admin/incidents/bulk-actions", {
        incidentIds,
        action: "reject",
        reason,
      });

      return response.data;
    } catch (error: any) {
      console.error("Bulk reject error:", error);
      throw error;
    }
  };

  const bulkAssignDepartment = async (
    incidentIds: string[],
    department: string,
  ): Promise<any> => {
    try {
      const response = await axios.post("/api/admin/incidents/bulk-actions", {
        incidentIds,
        action: "assign_department",
        department,
      });

      return response.data;
    } catch (error: any) {
      console.error("Bulk assign error:", error);
      throw error;
    }
  };

  const getSystemAnalytics = async (period = "30d"): Promise<any> => {
    try {
      const response = await axios.get("/api/admin/analytics", {
        params: { period },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to get analytics");
      }
    } catch (error: any) {
      console.error("Get analytics error:", error);
      throw error;
    }
  };

  // ========== USER MANAGEMENT METHODS ==========
  const getUsers = async (): Promise<User[]> => {
    try {
      const response = await axios.get("/api/users");

      if (response.data.success) {
        return response.data.data.map((user: User) => ({
          ...user,
          id: user._id || user.id,
          userId: user._id || user.id,
        }));
      } else {
        throw new Error("Failed to get users");
      }
    } catch (error: any) {
      console.error("Get users error:", error);
      throw error;
    }
  };

  const createUser = async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await axios.post("/api/users", userData);

      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      } else {
        throw new Error(response.data.message || "Failed to create user");
      }
    } catch (error: any) {
      console.error("Create user error:", error);
      throw error;
    }
  };

  const updateUser = async (
    userId: string,
    userData: Partial<User>,
  ): Promise<User> => {
    try {
      const response = await axios.put(`/api/users/${userId}`, userData);

      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      } else {
        throw new Error(response.data.message || "Failed to update user");
      }
    } catch (error: any) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      const response = await axios.delete(`/api/users/${userId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Delete user error:", error);
      throw error;
    }
  };

  const restrictUser = async (
    userId: string,
    restrictionDays: number,
    reason: string,
  ): Promise<User> => {
    try {
      const response = await axios.put(`/api/users/${userId}/restrict`, {
        restrictionDays,
        reason,
      });

      if (response.data.success) {
        const user = response.data.data;
        user.id = user._id || user.id;
        user.userId = user._id || user.id;
        return user;
      } else {
        throw new Error(response.data.message || "Failed to restrict user");
      }
    } catch (error: any) {
      console.error("Restrict user error:", error);
      throw error;
    }
  };

  const getUserStats = async (): Promise<any> => {
    try {
      const response = await axios.get("/api/users/stats");

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to get user stats");
      }
    } catch (error: any) {
      console.error("Get user stats error:", error);
      throw error;
    }
  };

  // Create the context value
  const value: AuthContextType = {
    user,
    token,
    loading: loading || isInitializing,
    isAuthenticated: !!user && !!token,
    isInitializing,
    isImpersonating,
    originalUser,
    login,
    logout,
    getCurrentUser,
    // Impersonation methods
    impersonateUser,
    returnToSuperAdmin,
    // Dashboard access methods
    getAccessibleDashboards,
    updateDashboardAccess,
    // User Management Methods
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    restrictUser,
    // Admin Dashboard Methods
    getAdminDashboardData,
    getAdminIncidents,
    approveIncident,
    rejectIncident,
    bulkApproveIncidents,
    bulkRejectIncidents,
    bulkAssignDepartment,
    getSystemAnalytics,
    getUserStats,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
