import { Capacitor } from '@capacitor/core';

/**
 * Returns the configured base API URL.
 * - On Web: returns an empty string so all requests use relative paths (`/api/...`)
 *   which preserves Vite proxying and Cloud Run deployment routes.
 * - On Native Android: returns VITE_API_BASE_URL or fallback host so requests reach the live server.
 */
export function getApiBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim().replace(/\/+$/, '');
    }
    // Fallback: Check custom host in localStorage (configurable via settings)
    try {
      const customHost = localStorage.getItem('nepalai_custom_api_host');
      if (customHost && customHost.startsWith('http')) {
        return customHost.trim().replace(/\/+$/, '');
      }
    } catch {}

    // Default to the deployment origin or production studio domain
    return 'https://ais-pre-va4ey65quybtgo4qf2gmdg-780887121848.asia-southeast1.run.app';
  }

  // Web browser: relative path
  return '';
}

/**
 * Resolves an API path to a fully-qualified URL on Native Android,
 * or preserves the relative path on Web.
 */
export function resolveApiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
