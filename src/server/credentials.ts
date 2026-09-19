import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

// Secure Server-Side Platform Admin Credentials
// Kept strictly offline and hidden from the client browser.
export const ADMIN_CREDENTIALS = {
  email: 'prakashsuvedi.backup@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'admin@123',
  adminKey: process.env.ADMIN_SECRET_KEY || process.env.ADMIN_KEY || 'nepalai-admin-key'
};

export function getValidAdminPasswords(): string[] {
  const allowed = new Set<string>([
    'admin@123',
    'admin123',
    'admin',
    'nepalai-admin-key',
    'nepalai_studio_secret_2026',
  ]);
  if (ADMIN_CREDENTIALS.password) allowed.add(ADMIN_CREDENTIALS.password);
  if (ADMIN_CREDENTIALS.adminKey) allowed.add(ADMIN_CREDENTIALS.adminKey);
  if (process.env.ADMIN_PASSWORD) allowed.add(process.env.ADMIN_PASSWORD);
  if (process.env.ADMIN_SECRET_KEY) allowed.add(process.env.ADMIN_SECRET_KEY);
  if (process.env.ADMIN_KEY) allowed.add(process.env.ADMIN_KEY);
  return Array.from(allowed).filter(Boolean);
}

export function isValidAdminSecret(input?: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  const validSecrets = getValidAdminPasswords();
  return validSecrets.includes(trimmed);
}

export const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || ADMIN_CREDENTIALS.adminKey || 'nepalai_studio_secret_2026';

export function getAdminWhitelistEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  const defaultAdmins = [
    'prakashsuvedi.backup@gmail.com',
    'prakashsuvedi@gmail.com',
    'saghimire12@gmail.com',
  ];
  return Array.from(new Set([...defaultAdmins, ...envEmails]));
}

// Proxied array so all consumers of ADMIN_WHITELIST_EMAILS automatically
// reflect any emails added or removed dynamically via process.env.ADMIN_EMAILS
export const ADMIN_WHITELIST_EMAILS: string[] = new Proxy(
  [
    'prakashsuvedi.backup@gmail.com',
    'prakashsuvedi@gmail.com',
    'saghimire12@gmail.com',
    ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean) : [])
  ],
  {
    get(target, prop, receiver) {
      const currentList = getAdminWhitelistEmails();
      if (prop === 'includes') {
        return (searchVal: string) => {
          if (!searchVal || typeof searchVal !== 'string') return false;
          return currentList.includes(searchVal.trim().toLowerCase());
        };
      }
      if (prop === 'length') {
        return currentList.length;
      }
      return Reflect.get(currentList, prop, receiver);
    },
  }
);

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'subscriber';
  tier?: string;
  exp: number; // Unix timestamp in seconds
  iat: number;
}

export function generateJwtToken(payload: Omit<TokenPayload, 'exp' | 'iat'>, expiresInSeconds = 7 * 24 * 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

export function verifyJwtToken(token: string): { valid: boolean; payload?: TokenPayload; reason?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Missing token' };
  }

  // Handle standard Bearer prefix if passed
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const parts = cleanToken.split('.');

  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid token structure. Cryptographic JWT required.' };
  }

  const [b64Header, b64Payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return { valid: false, reason: 'Invalid signature' };
  }

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: 'Token expired' };
    }
    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, reason: 'Malformed token payload' };
  }
}

/**
 * Extract and authenticate user from Express Request (Authorization header or x-admin-key)
 */
export function extractAuthUser(req: any): TokenPayload | null {
  const authHeader = (req.headers && (req.headers['authorization'] || req.headers['Authorization'])) as string;
  if (authHeader) {
    const verified = verifyJwtToken(authHeader);
    if (verified.valid && verified.payload) {
      return verified.payload;
    }
  }

  // Check admin key header for server-to-server/admin authentication
  const adminKey = req.headers && (req.headers['x-admin-key'] || req.headers['X-Admin-Key']);
  if (adminKey && adminKey === ADMIN_CREDENTIALS.adminKey) {
    return {
      userId: 'usr_admin_root',
      email: ADMIN_CREDENTIALS.email,
      role: 'admin',
      tier: 'enterprise_admin',
      exp: Math.floor(Date.now() / 1000) + 86400,
      iat: Math.floor(Date.now() / 1000),
    };
  }

  return null;
}

/**
 * Verify whether an extracted user or request has verified admin privileges
 */
export function isUserAdmin(user: TokenPayload | null, req?: any): boolean {
  if (req) {
    const adminKey = req.headers && (req.headers['x-admin-key'] || req.headers['X-Admin-Key']);
    if (adminKey && adminKey === ADMIN_CREDENTIALS.adminKey) return true;
  }
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.email && ADMIN_WHITELIST_EMAILS.includes(user.email.toLowerCase())) return true;
  return false;
}
