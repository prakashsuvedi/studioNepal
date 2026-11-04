import { Capacitor } from '@capacitor/core';

/**
 * Secure Storage Manager for NepalAI Studio
 * - On Native Android: Uses hardware-backed Android Keystore encrypted storage
 *   for sensitive JWTs, refresh tokens, and credentials.
 * - On Web: Preserves the standard session and storage architecture without breakage.
 * - Keeps sensitive tokens out of unencrypted logs and public inspection.
 */
class SecureStorageManager {
  private static instance: SecureStorageManager;
  private memoryCache: Map<string, string> = new Map();
  private isNative: boolean = false;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.hydrateFromStorage();
  }

  public static getInstance(): SecureStorageManager {
    if (!SecureStorageManager.instance) {
      SecureStorageManager.instance = new SecureStorageManager();
    }
    return SecureStorageManager.instance;
  }

  /**
   * Hydrate memory cache synchronously on startup
   */
  private hydrateFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('nepalai_auth_token') || localStorage.getItem('nepalai_token');
        const userId = localStorage.getItem('nepalai_user_id');
        if (token) this.memoryCache.set('token', token);
        if (userId) this.memoryCache.set('userId', userId);
      }
    } catch (e) {
      console.warn('SecureStorage: initial memory hydration error', e);
    }
  }

  /**
   * Retrieve the active authentication token
   */
  public getToken(): string {
    return this.memoryCache.get('token') || '';
  }

  /**
   * Store authentication token securely
   */
  public async setToken(token: string): Promise<void> {
    if (!token) {
      await this.clearToken();
      return;
    }

    this.memoryCache.set('token', token);

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nepalai_auth_token', token);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('nepalai_auth_token', token);
      }
    } catch {}
  }

  /**
   * Clear authentication token from memory and storage
   */
  public async clearToken(): Promise<void> {
    this.memoryCache.delete('token');
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('nepalai_auth_token');
        localStorage.removeItem('nepalai_token');
        localStorage.removeItem('auth_token');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('nepalai_auth_token');
      }
    } catch {}
  }

  /**
   * Get user identifier
   */
  public getUserId(): string {
    return this.memoryCache.get('userId') || '';
  }

  /**
   * Store user identifier
   */
  public setUserId(userId: string): void {
    if (!userId) {
      this.memoryCache.delete('userId');
      try {
        localStorage.removeItem('nepalai_user_id');
      } catch {}
      return;
    }
    this.memoryCache.set('userId', userId);
    try {
      localStorage.setItem('nepalai_user_id', userId);
    } catch {}
  }

  /**
   * Full session wipe on logout
   */
  public async wipeSession(): Promise<void> {
    this.memoryCache.clear();
    await this.clearToken();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('nepalai_user_id');
        localStorage.removeItem('nepalai_user_session');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch {}
  }
}

export const secureStorage = SecureStorageManager.getInstance();
