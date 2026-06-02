const LOCAL_API_PORT = '4000';
const LOCAL_API_URL = `http://127.0.0.1:${LOCAL_API_PORT}`;

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '0.0.0.0' ||
  /^192\.168\.\d+\.\d+$/.test(hostname) ||
  /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname);

export function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL || LOCAL_API_URL;

  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const { hostname } = window.location;
  if (!isLocalHostname(hostname)) {
    return configuredUrl;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return LOCAL_API_URL;
  }

  return `http://${hostname}:${LOCAL_API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
