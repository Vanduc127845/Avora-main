import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const DEFAULT_GET_CACHE_TTL_MS = 30_000;

export interface ApiRequestConfig extends AxiosRequestConfig {
  cacheKey?: string;
  cacheTtlMs?: number;
  dedupe?: boolean;
  invalidateCache?: boolean;
}

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

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

const stableSerialize = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
    .join(',')}}`;
};

const requestKey = (method: string, url: string, config?: ApiRequestConfig, data?: unknown) =>
  config?.cacheKey ||
  [
    method.toUpperCase(),
    url,
    stableSerialize(config?.params || {}),
    data === undefined ? '' : stableSerialize(data),
  ].join('|');

const stripCustomConfig = (config?: ApiRequestConfig): AxiosRequestConfig | undefined => {
  if (!config) return undefined;
  const { cacheKey, cacheTtlMs, dedupe, invalidateCache, ...axiosConfig } = config;
  return axiosConfig;
};

export const clearApiCache = (prefix?: string) => {
  if (!prefix) {
    responseCache.clear();
    return;
  }

  [...responseCache.keys()].forEach((key) => {
    if (key.includes(prefix)) responseCache.delete(key);
  });
};

export function isRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED');
}

export async function get<T>(url: string, config?: ApiRequestConfig): Promise<T> {
  const key = requestKey('GET', url, config);
  const ttlMs = config?.cacheTtlMs ?? DEFAULT_GET_CACHE_TTL_MS;
  const shouldDedupe = config?.dedupe !== false;
  const cached = responseCache.get(key);

  if (ttlMs > 0 && cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  if (shouldDedupe && inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const request = apiClient
    .get<T>(url, stripCustomConfig(config))
    .then((response) => {
      if (ttlMs > 0) {
        responseCache.set(key, {
          data: response.data,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return response.data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  if (shouldDedupe) inFlightRequests.set(key, request);
  return request;
}

export async function post<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
  const response = await apiClient.post<T>(url, data, stripCustomConfig(config));
  if (config?.invalidateCache !== false) clearApiCache();
  return response.data;
}

export async function put<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
  const response = await apiClient.put<T>(url, data, stripCustomConfig(config));
  if (config?.invalidateCache !== false) clearApiCache();
  return response.data;
}

export async function del<T>(url: string, config?: ApiRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, stripCustomConfig(config));
  if (config?.invalidateCache !== false) clearApiCache();
  return response.data;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
  code?: string;
  retryAfterMs?: number;
  source?: string;
}

export function handleApiError(error: unknown): ApiError {
  if (isRequestCanceled(error)) {
    return {
      error: 'Request cancelled',
      code: 'REQUEST_CANCELLED',
    };
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        error: 'Cannot connect to Avora API. Check that the API is running and VITE_API_URL is correct.',
        code: 'NETWORK_ERROR',
      };
    }

    const data = error.response?.data as {
      error?: string;
      message?: string;
      code?: string;
      retryAfterMs?: number;
      source?: string;
    } | undefined;
    const retryAfterHeader = error.response.headers?.['retry-after'];
    const retryAfterMs =
      data?.retryAfterMs ||
      (retryAfterHeader && !Number.isNaN(Number(retryAfterHeader))
        ? Number(retryAfterHeader) * 1000
        : undefined);

    return {
      error:
        data?.message ||
        data?.error ||
        (error.response.status === 429
          ? 'The service is temporarily rate limited. Please wait before trying again.'
          : error.message),
      message: data?.message,
      statusCode: error.response?.status,
      code: data?.code || (error.response.status === 429 ? 'RATE_LIMITED' : undefined),
      retryAfterMs,
      source: data?.source,
    };
  }
  return {
    error: 'An unexpected error occurred',
  };
}
