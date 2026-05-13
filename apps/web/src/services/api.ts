import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        error: 'Cannot connect to Avora API. Check that the API is running and VITE_API_URL is correct.',
      };
    }

    return {
      error: error.response?.data?.error || error.message,
      message: error.response?.data?.message,
      statusCode: error.response?.status,
    };
  }
  return {
    error: 'An unexpected error occurred',
  };
}
