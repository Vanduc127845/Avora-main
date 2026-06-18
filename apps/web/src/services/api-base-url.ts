const LOCAL_API_PORT = '4000';
const LOCAL_API_URL = `http://127.0.0.1:${LOCAL_API_PORT}`;
const PRODUCTION_API_URL = 'https://avora-main.onrender.com';

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '0.0.0.0' ||
  /^192\.168\.\d+\.\d+$/.test(hostname) ||
  /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname);

export function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  const configuredUrl = envUrl || LOCAL_API_URL;

  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const { hostname } = window.location;

  // VITE_API_URL được set tường minh → luôn dùng, trừ khi là localhost URL trên production host
  if (envUrl) {
    if (!isLocalHostname(hostname)) {
      const normalizedUrl = envUrl.trim().replace(/\/$/, '');
      const lowerUrl = normalizedUrl.toLowerCase();
      const pointsToLocalhost =
        lowerUrl.includes('localhost') ||
        lowerUrl.includes('127.0.0.1') ||
        lowerUrl.includes('0.0.0.0');
      const isPlaceholder =
        !normalizedUrl ||
        lowerUrl.includes('api.example.com') ||
        lowerUrl.includes('link-api-render-cua-ban');
      return pointsToLocalhost || isPlaceholder ? PRODUCTION_API_URL : normalizedUrl;
    }
    return envUrl.trim().replace(/\/$/, '');
  }

  // Không có VITE_API_URL → suy ra từ hostname
  if (!isLocalHostname(hostname)) {
    return PRODUCTION_API_URL;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return LOCAL_API_URL;
  }

  return `http://${hostname}:${LOCAL_API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
