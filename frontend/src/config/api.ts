// API Configuration for different environments
const getApiUrl = () => {
  // Check if we're in production (Vercel deployment)
  if (process.env.NODE_ENV === 'production') {
    // Use the Vercel app URL or provided production URL
    return process.env.REACT_APP_API_URL || 'https://your-app-name.vercel.app';
  }
  
  // Development environment
  return process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();
export const SOCKET_URL = API_BASE_URL;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_TOKEN: '/api/auth/verify-token',
    LOGOUT: '/api/auth/logout'
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`
  },
  APPOINTMENTS: {
    BASE: '/api/appointments',
    BY_ID: (id: string) => `/api/appointments/${id}`,
    BY_USER: (userId: string) => `/api/appointments/user/${userId}`,
    UPDATE_STATUS: (id: string) => `/api/appointments/${id}/status`
  },
  DEPARTMENTS: {
    BASE: '/api/departments',
    BY_ID: (id: string) => `/api/departments/${id}`,
    BY_HOSPITAL: (hospitalId: string) => `/api/departments/hospital/${hospitalId}`
  },
  PRESCRIPTIONS: {
    BASE: '/api/prescriptions',
    BY_ID: (id: string) => `/api/prescriptions/${id}`,
    BY_APPOINTMENT: (appointmentId: string) => `/api/prescriptions/appointment/${appointmentId}`
  },
  SCHEDULES: {
    BASE: '/api/schedules',
    BY_DOCTOR: (doctorId: string) => `/api/schedules/doctor/${doctorId}`
  },
  HOSPITALS: {
    BASE: '/api/hospitals',
    BY_ID: (id: string) => `/api/hospitals/${id}`
  },
  MESSAGES: {
    BASE: '/api/messages',
    BY_APPOINTMENT: (appointmentId: string) => `/api/messages/${appointmentId}`
  },
  VIDEO_CALLS: {
    BASE: '/api/videocalls'
  },
  ANALYTICS: {
    BASE: '/api/analytics'
  },
  SUPERADMIN: {
    BASE: '/api/superadmin'
  }
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  API_ENDPOINTS
};
