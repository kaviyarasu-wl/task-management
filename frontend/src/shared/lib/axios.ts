import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/shared/constants/config';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (axiosConfig: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && axiosConfig.headers) {
      axiosConfig.headers.Authorization = `Bearer ${token}`;
    }

    // Add header if this is an impersonation session
    const originalToken = localStorage.getItem('originalAccessToken');
    if (originalToken && axiosConfig.headers) {
      // This tells the backend it's an impersonation request
      axiosConfig.headers['X-Impersonation'] = 'true';
    }

    return axiosConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token = not logged in. Don't redirect, let calling code handle it.
        return Promise.reject(error);
      }

      try {
        const isSuperAdmin = useAuthStore.getState().user?.role === 'superadmin';
        const refreshEndpoint = isSuperAdmin ? '/admin/auth/refresh' : '/auth/refresh';

        const response = await axios.post(`${config.apiUrl}${refreshEndpoint}`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch {
        // Refresh failed - clear tokens and redirect to login
        const isSuperAdmin = useAuthStore.getState().user?.role === 'superadmin';
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = isSuperAdmin ? '/admin/login' : '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
