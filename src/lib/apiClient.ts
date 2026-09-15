/**
 * Production-Grade Resilient API Client
 * Features:
 * - Automatic AbortController timeout handling (default 30s)
 * - Exponential backoff retry with jitter on network failures and 5xx / 429 errors
 * - Fast-failure on non-retryable 4xx client errors
 * - Automated Bearer token and userId header injection
 * - Structured ApiClientError classification (TIMEOUT, OFFLINE, NETWORK_ERROR, HTTP_ERROR)
 * - Support for JSON, Text, Blob, and ArrayBuffer responses
 */

export interface ApiClientRequestOptions extends Omit<RequestInit, 'body'> {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  token?: string;
  userId?: string;
  body?: any;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

export type ApiErrorCode = 'TIMEOUT' | 'NETWORK_ERROR' | 'OFFLINE' | 'HTTP_ERROR' | 'ABORTED' | 'PARSE_ERROR';

export class ApiClientError extends Error {
  public code: ApiErrorCode;
  public status?: number;
  public statusText?: string;
  public data?: any;
  public isTransient: boolean;

  constructor(
    message: string,
    code: ApiErrorCode,
    options?: { status?: number; statusText?: string; data?: any; isTransient?: boolean }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = options?.status;
    this.statusText = options?.statusText;
    this.data = options?.data;
    this.isTransient = options?.isTransient ?? (code === 'TIMEOUT' || code === 'NETWORK_ERROR' || (options?.status ? options.status >= 500 || options.status === 429 : false));
  }
}

/**
 * Utility delay with jitter
 */
function wait(ms: number): Promise<void> {
  const jitter = Math.random() * 50;
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

/**
 * Check if the browser is currently offline
 */
export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' && !navigator.onLine;
}

export class ApiClient {
  private defaultTimeoutMs: number;
  private defaultMaxRetries: number;
  private defaultRetryDelayMs: number;

  constructor(options?: { defaultTimeoutMs?: number; defaultMaxRetries?: number; defaultRetryDelayMs?: number }) {
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 30000;
    this.defaultMaxRetries = options?.defaultMaxRetries ?? 3;
    this.defaultRetryDelayMs = options?.defaultRetryDelayMs ?? 300;
  }

  /**
   * Resolve auth credentials from options or localStorage
   */
  private getAuthHeaders(options?: ApiClientRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {};

    let token = options?.token;
    let userId = options?.userId;

    if (typeof localStorage !== 'undefined') {
      if (!token) {
        token =
          localStorage.getItem('nepalai_auth_token') ||
          localStorage.getItem('nepalai_token') ||
          localStorage.getItem('auth_token') ||
          '';
      }
      if (!userId) {
        userId = localStorage.getItem('nepalai_user_id') || '';
      }
    }

    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    if (userId) {
      headers['x-user-id'] = userId;
    }

    return headers;
  }

  /**
   * Main resilient request execution method
   */
  public async request<T = any>(url: string, options: ApiClientRequestOptions = {}): Promise<T> {
    if (isBrowserOffline()) {
      throw new ApiClientError('No internet connection. Please check your network and retry.', 'OFFLINE', {
        isTransient: true,
      });
    }

    const {
      timeoutMs = this.defaultTimeoutMs,
      maxRetries = this.defaultMaxRetries,
      retryDelayMs = this.defaultRetryDelayMs,
      responseType = 'json',
      headers: customHeaders = {},
      body,
      method = 'GET',
      signal: externalSignal,
      ...fetchOptions
    } = options;

    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      attempt++;

      // Create AbortController for timeout linkage
      const controller = new AbortController();
      let isTimedOut = false;

      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        controller.abort();
      }, timeoutMs);

      // Link external abort signal if provided
      let onExternalAbort: (() => void) | null = null;
      if (externalSignal) {
        if (externalSignal.aborted) {
          clearTimeout(timeoutId);
          throw new ApiClientError('Request aborted by caller', 'ABORTED', { isTransient: false });
        }
        onExternalAbort = () => {
          controller.abort();
        };
        externalSignal.addEventListener('abort', onExternalAbort);
      }

      try {
        const authHeaders = this.getAuthHeaders(options);
        const headers: Record<string, string> = {
          ...authHeaders,
        };

        if (customHeaders) {
          if (typeof Headers !== 'undefined' && customHeaders instanceof Headers) {
            customHeaders.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(customHeaders)) {
            customHeaders.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else if (typeof customHeaders === 'object') {
            Object.assign(headers, customHeaders);
          }
        }

        let requestBody: BodyInit | undefined = undefined;
        if (body !== undefined && body !== null) {
          if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
            requestBody = JSON.stringify(body);
          } else {
            requestBody = body;
          }
        }

        const response = await fetch(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
          ...fetchOptions,
        });

        clearTimeout(timeoutId);
        if (externalSignal && onExternalAbort) {
          externalSignal.removeEventListener('abort', onExternalAbort);
        }

        // Handle HTTP error responses
        if (!response.ok) {
          let errorData: any = null;
          try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = { error: await response.text() };
            }
          } catch {
            errorData = { error: response.statusText };
          }

          const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
          const isTransient = response.status >= 500 || response.status === 429;

          const httpError = new ApiClientError(errorMessage, 'HTTP_ERROR', {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
            isTransient,
          });

          // Non-retryable 4xx client errors fast-fail immediately without burning retry loops
          if (!isTransient || attempt > maxRetries) {
            throw httpError;
          }

          lastError = httpError;
          const delay = retryDelayMs * Math.pow(2, attempt - 1);
          await wait(delay);
          continue;
        }

        // Parse successful response
        if (responseType === 'json') {
          try {
            const text = await response.text();
            return text ? (JSON.parse(text) as T) : ({} as T);
          } catch (parseErr: any) {
            throw new ApiClientError(`JSON Parse error: ${parseErr?.message}`, 'PARSE_ERROR', { isTransient: false });
          }
        } else if (responseType === 'text') {
          return (await response.text()) as unknown as T;
        } else if (responseType === 'blob') {
          return (await response.blob()) as unknown as T;
        } else if (responseType === 'arraybuffer') {
          return (await response.arrayBuffer()) as unknown as T;
        }

        return (await response.json()) as T;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (externalSignal && onExternalAbort) {
          externalSignal.removeEventListener('abort', onExternalAbort);
        }

        if (err instanceof ApiClientError && !err.isTransient) {
          throw err;
        }

        if (isTimedOut) {
          lastError = new ApiClientError(`Request timed out after ${timeoutMs}ms`, 'TIMEOUT', { isTransient: true });
        } else if (err?.name === 'AbortError') {
          if (externalSignal?.aborted) {
            throw new ApiClientError('Request was cancelled', 'ABORTED', { isTransient: false });
          }
          lastError = new ApiClientError('Request aborted or connection timed out', 'TIMEOUT', { isTransient: true });
        } else if (err instanceof ApiClientError) {
          lastError = err;
        } else {
          lastError = new ApiClientError(err?.message || 'Network connection failed', 'NETWORK_ERROR', {
            isTransient: true,
          });
        }

        if (attempt > maxRetries) {
          throw lastError;
        }

        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        await wait(delay);
      }
    }

    throw lastError || new ApiClientError('Request failed after max retries', 'NETWORK_ERROR');
  }

  public get<T = any>(url: string, options?: ApiClientRequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  public post<T = any>(url: string, body?: any, options?: ApiClientRequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  public put<T = any>(url: string, body?: any, options?: ApiClientRequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  public delete<T = any>(url: string, options?: ApiClientRequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
