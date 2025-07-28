import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service methods
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials: any) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    register: (userData: any) => apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
    verifyToken: () => apiClient.get(API_ENDPOINTS.AUTH.VERIFY_TOKEN),
    logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  },

  // Users endpoints
  users: {
    getAll: () => apiClient.get(API_ENDPOINTS.USERS.BASE),
    getById: (id: string) => apiClient.get(API_ENDPOINTS.USERS.BY_ID(id)),
    update: (id: string, data: any) => apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), data),
    delete: (id: string) => apiClient.delete(API_ENDPOINTS.USERS.DELETE(id)),
  },

  // Appointments endpoints
  appointments: {
    getAll: () => apiClient.get(API_ENDPOINTS.APPOINTMENTS.BASE),
    getById: (id: string) => apiClient.get(API_ENDPOINTS.APPOINTMENTS.BY_ID(id)),
    getByUser: (userId: string) => apiClient.get(API_ENDPOINTS.APPOINTMENTS.BY_USER(userId)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.APPOINTMENTS.BASE, data),
    update: (id: string, data: any) => apiClient.put(API_ENDPOINTS.APPOINTMENTS.BY_ID(id), data),
    updateStatus: (id: string, status: string) => apiClient.patch(API_ENDPOINTS.APPOINTMENTS.UPDATE_STATUS(id), { status }),
    delete: (id: string) => apiClient.delete(API_ENDPOINTS.APPOINTMENTS.BY_ID(id)),
  },

  // Departments endpoints
  departments: {
    getAll: () => apiClient.get(API_ENDPOINTS.DEPARTMENTS.BASE),
    getById: (id: string) => apiClient.get(API_ENDPOINTS.DEPARTMENTS.BY_ID(id)),
    getByHospital: (hospitalId: string) => apiClient.get(API_ENDPOINTS.DEPARTMENTS.BY_HOSPITAL(hospitalId)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.DEPARTMENTS.BASE, data),
    update: (id: string, data: any) => apiClient.put(API_ENDPOINTS.DEPARTMENTS.BY_ID(id), data),
    delete: (id: string) => apiClient.delete(API_ENDPOINTS.DEPARTMENTS.BY_ID(id)),
  },

  // Prescriptions endpoints
  prescriptions: {
    getAll: () => apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.BASE),
    getById: (id: string) => apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.BY_ID(id)),
    getByAppointment: (appointmentId: string) => apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.BY_APPOINTMENT(appointmentId)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.PRESCRIPTIONS.BASE, data),
    update: (id: string, data: any) => apiClient.put(API_ENDPOINTS.PRESCRIPTIONS.BY_ID(id), data),
    delete: (id: string) => apiClient.delete(API_ENDPOINTS.PRESCRIPTIONS.BY_ID(id)),
  },

  // Schedules endpoints
  schedules: {
    getAll: () => apiClient.get(API_ENDPOINTS.SCHEDULES.BASE),
    getByDoctor: (doctorId: string) => apiClient.get(API_ENDPOINTS.SCHEDULES.BY_DOCTOR(doctorId)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.SCHEDULES.BASE, data),
    update: (id: string, data: any) => apiClient.put(`${API_ENDPOINTS.SCHEDULES.BASE}/${id}`, data),
    delete: (id: string) => apiClient.delete(`${API_ENDPOINTS.SCHEDULES.BASE}/${id}`),
  },

  // Hospitals endpoints
  hospitals: {
    getAll: () => apiClient.get(API_ENDPOINTS.HOSPITALS.BASE),
    getById: (id: string) => apiClient.get(API_ENDPOINTS.HOSPITALS.BY_ID(id)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.HOSPITALS.BASE, data),
    update: (id: string, data: any) => apiClient.put(API_ENDPOINTS.HOSPITALS.BY_ID(id), data),
    delete: (id: string) => apiClient.delete(API_ENDPOINTS.HOSPITALS.BY_ID(id)),
  },

  // Messages endpoints
  messages: {
    getByAppointment: (appointmentId: string) => apiClient.get(API_ENDPOINTS.MESSAGES.BY_APPOINTMENT(appointmentId)),
    create: (data: any) => apiClient.post(API_ENDPOINTS.MESSAGES.BASE, data),
  },

  // Video calls endpoints
  videoCalls: {
    getAll: () => apiClient.get(API_ENDPOINTS.VIDEO_CALLS.BASE),
    create: (data: any) => apiClient.post(API_ENDPOINTS.VIDEO_CALLS.BASE, data),
  },

  // Analytics endpoints
  analytics: {
    getAll: () => apiClient.get(API_ENDPOINTS.ANALYTICS.BASE),
  },

  // Superadmin endpoints
  superadmin: {
    getAll: () => apiClient.get(API_ENDPOINTS.SUPERADMIN.BASE),
  },
};

export default apiService;

// Export the configured axios instance for direct use if needed
export { apiClient };
