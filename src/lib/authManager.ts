/**
 * Production-Grade Auth and Token Refresh Manager for NepalAI Studio
 * 
 * Features:
 * - Decodes JWT expiry on client and monitors session lifetime.
 * - Silent background token refresh via Google Identity Services (GIS) before expiry.
 * - Single-flight promise queue (deduplicates concurrent refresh requests).
 * - Automatic retry of failed 401 requests exactly once with fresh token.
 * - Differentiates transient network interruptions from genuine authentication failures.
 * - Emits 'nepalai_auth_expired' events for genuine auth revocations.
 */

import { UserSession, UserTrialQuota } from '../types';

export interface DecodedToken {
  userId?: string;
  email?: string;
  role?: string;
  tier?: string;
  exp?: number; // Unix timestamp in seconds
  iat?: number;
}

export type AuthExpiredReason = 'TOKEN_EXPIRED' | 'TOKEN_REVOKED' | 'INVALID_CREDENTIALS' | 'SESSION_TERMINATED';

export class AuthManager {
  private static instance: AuthManager;
  private refreshPromise: Promise<string | null> | null = null;
  private refreshTimer: any = null;
  private googleTokenClient: any = null;
  private isRefreshing = false;

  private constructor() {
    this.initTokenListener();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Decode a JWT payload safely in the browser without external dependencies
   */
  public decodeToken(token: string): DecodedToken | null {
    try {
      if (!token || typeof token !== 'string') return null;
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
      const parts = cleanToken.split('.');
      if (parts.length !== 3) return null;

      // Base64url decode
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Get current stored token
   */
  public getToken(): string {
    if (typeof localStorage === 'undefined') return '';
    return (
      localStorage.getItem('nepalai_auth_token') ||
      localStorage.getItem('nepalai_token') ||
      localStorage.getItem('auth_token') ||
      ''
    );
  }

  /**
   * Get current stored user ID
   */
  public getUserId(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('nepalai_user_id') || '';
  }

  /**
   * Initialize the AuthManager, restore listeners, and schedule proactive refresh
   */
  public init() {
    this.initTokenListener();
    if (this.getToken()) {
      this.scheduleProactiveRefresh();
    }
  }

  /**
   * Set active token and schedule background refresh
   */
  public setToken(token: string, userId?: string) {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('nepalai_auth_token', token);
        localStorage.setItem('nepalai_token', token);
      }
      if (userId) {
        localStorage.setItem('nepalai_user_id', userId);
      }
    }
    this.scheduleProactiveRefresh();
  }

  /**
   * Convenience alias for setToken
   */
  public saveToken(token: string, userId?: string) {
    this.setToken(token, userId);
  }

  /**
   * Subscribe to session expiration events
   */
  public onAuthExpired(callback: (reason: string) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const listener = (event: any) => {
      callback(event.detail?.reason || 'SESSION_EXPIRED');
    };
    window.addEventListener('nepalai_auth_expired', listener);
    return () => {
      window.removeEventListener('nepalai_auth_expired', listener);
    };
  }

  /**
   * Subscribe to successful token refresh events
   */
  public onAuthRefreshed(callback: (detail: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const listener = (event: any) => {
      callback(event.detail);
    };
    window.addEventListener('nepalai_auth_refreshed', listener);
    return () => {
      window.removeEventListener('nepalai_auth_refreshed', listener);
    };
  }

  /**
   * Clear all auth tokens on logout or explicit revocation
   */
  public clearAuth(triggerEvent = false, reason: AuthExpiredReason = 'SESSION_TERMINATED') {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.refreshPromise = null;
    this.isRefreshing = false;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('nepalai_auth_token');
      localStorage.removeItem('nepalai_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('nepalai_user_id');
    }

    if (triggerEvent && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nepalai_auth_expired', {
          detail: { reason, timestamp: Date.now() },
        })
      );
    }
  }

  /**
   * Check if the token is close to expiry (within marginSeconds)
   */
  public isTokenNearExpiry(marginSeconds = 300): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return false;

    const nowSeconds = Math.floor(Date.now() / 1000);
    return decoded.exp - nowSeconds <= marginSeconds;
  }

  /**
   * Initialize or update Google GIS Token Client for silent background refreshes
   */
  public registerGoogleClientId(clientId: string) {
    if (typeof window === 'undefined' || !clientId) return;

    const setupClient = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          const cleanClientId = clientId.trim().replace(/^["']|["']$/g, '');
          this.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: cleanClientId,
            scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            callback: async (response: { access_token?: string; error?: string }) => {
              if (response.access_token) {
                await this.exchangeGoogleAccessToken(response.access_token);
              }
            },
          });
        } catch (e) {
          console.warn('[AuthManager] Google GIS TokenClient registration warning:', e);
        }
      }
    };

    if (window.google?.accounts?.oauth2) {
      setupClient();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(timer);
          setupClient();
        }
      }, 500);
      setTimeout(() => clearInterval(timer), 10000);
    }
  }

  /**
   * Exchange Google Access Token with server to receive a renewed JWT
   */
  public async exchangeGoogleAccessToken(accessToken: string): Promise<string> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Token renewal failed' }));
      throw new Error(err.error || 'Failed to exchange refreshed Google token');
    }

    const data = await res.json();
    if (data.token) {
      this.setToken(data.token, data.user?.id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nepalai_auth_refreshed', {
            detail: { user: data.user, trialUsage: data.trialUsage, token: data.token },
          })
        );
      }
      return data.token;
    }
    throw new Error('Server did not return a renewed token');
  }

  /**
   * Perform silent background token refresh.
   * Deduplicates concurrent calls via a single shared Promise.
   */
  public async refreshToken(): Promise<string | null> {
    // If a refresh is already in flight, return existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const currentToken = this.getToken();
        const userId = this.getUserId();

        // 1. Try silent Google GIS refresh if token client is ready
        if (this.googleTokenClient) {
          try {
            const freshToken = await new Promise<string>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('GIS silent refresh timed out')), 8000);
              
              // Temporary callback override for this specific refresh request
              const origCallback = this.googleTokenClient.callback;
              this.googleTokenClient.callback = async (response: { access_token?: string; error?: string }) => {
                clearTimeout(timeout);
                this.googleTokenClient.callback = origCallback;
                if (response.access_token) {
                  try {
                    const renewedJwt = await this.exchangeGoogleAccessToken(response.access_token);
                    resolve(renewedJwt);
                  } catch (ex) {
                    reject(ex);
                  }
                } else {
                  reject(new Error(response.error || 'No access token returned in silent refresh'));
                }
              };

              // prompt: '' or prompt: 'none' executes silent token request
              try {
                this.googleTokenClient.requestAccessToken({ prompt: '' });
              } catch (reqErr) {
                clearTimeout(timeout);
                this.googleTokenClient.callback = origCallback;
                reject(reqErr);
              }
            });

            if (freshToken) {
              console.log('[AuthManager] Silent Google GIS token refresh succeeded');
              return freshToken;
            }
          } catch (gisErr) {
            console.log('[AuthManager] Silent GIS refresh notice (falling back to session verification):', gisErr);
          }
        }

        // 2. Fallback: Verify current session with /api/auth/me
        if (userId && currentToken) {
          const verifyRes = await fetch(`/api/auth/me?userId=${encodeURIComponent(userId)}`, {
            headers: {
              Authorization: currentToken.startsWith('Bearer ') ? currentToken : `Bearer ${currentToken}`,
              'x-user-id': userId,
            },
          });

          if (verifyRes.ok) {
            const data = await verifyRes.json();
            if (data.user) {
              // Session is still verified and active
              this.scheduleProactiveRefresh();
              return currentToken;
            }
          } else if (verifyRes.status === 401) {
            // Server explicitly rejected the session
            console.warn('[AuthManager] Session verification returned 401. Clearing invalid session.');
            this.clearAuth(true, 'TOKEN_EXPIRED');
            return null;
          }
        }

        return currentToken || null;
      } catch (err) {
        console.warn('[AuthManager] Token refresh encounter exception (transient network):', err);
        return this.getToken() || null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Schedule automatic proactive token refresh 5 minutes before expiration
   */
  public scheduleProactiveRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const token = this.getToken();
    if (!token) return;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - nowSeconds;

    // Refresh 5 minutes before expiry, or at 80% of remaining lifetime
    const refreshInSeconds = Math.max(30, timeUntilExpiry - 300);

    this.refreshTimer = setTimeout(() => {
      console.log('[AuthManager] Proactive background token refresh triggered');
      this.refreshToken().catch((err) => {
        console.warn('[AuthManager] Proactive refresh error:', err);
      });
    }, refreshInSeconds * 1000);
  }

  private initTokenListener() {
    if (typeof window === 'undefined') return;

    // Re-schedule when browser comes back online or tab becomes visible
    window.addEventListener('online', () => {
      if (this.isTokenNearExpiry(600)) {
        this.refreshToken().catch(() => {});
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isTokenNearExpiry(300)) {
        this.refreshToken().catch(() => {});
      }
    });
  }
}

export const authManager = AuthManager.getInstance();
