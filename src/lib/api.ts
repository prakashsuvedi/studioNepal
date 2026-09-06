import type { UserSession, UserTrialQuota, StripeTransactionItem } from '../types';

export interface AdminUsersResponse {
  success: boolean;
  users: Array<UserSession & {
    usage: UserTrialQuota;
    transactionsCount: number;
    totalPaidUSD: number;
  }>;
  transactions: StripeTransactionItem[];
  metrics: {
    totalUsers: number;
    totalTokensUsed: number;
    totalRevenueUSD: number;
    activePaidSubscribers: number;
  };
}

export async function apiGetGoogleConfig(): Promise<{ clientId: string; configured: boolean }> {
  try {
    const res = await fetch('/api/auth/google-config');
    if (!res.ok) return { clientId: '', configured: false };
    return res.json();
  } catch {
    return { clientId: '', configured: false };
  }
}

export async function loginWithGoogle(params: {
  credential?: string;
  accessToken?: string;
}): Promise<{ user: UserSession; trialUsage: UserTrialQuota; token: string }> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Google Login verification failed');
  }
  return res.json();
}

export async function apiGetHfStatus(): Promise<{
  connected: boolean;
  username?: string;
  email?: string;
  tokenPrefix?: string;
  plan?: string;
}> {
  try {
    const res = await fetch('/api/hf/status');
    if (!res.ok) return { connected: false };
    return res.json();
  } catch {
    return { connected: false };
  }
}

/**
 * Sora-2 & Hugging Face Diagnostic Utility
 * Tests connection to the Sora-2 / Hugging Face status endpoint
 * and logs exact reasons for any failure.
 */
export async function apiCheckSoraStatus(): Promise<{
  success: boolean;
  model: string;
  connected: boolean;
  endpoint: string;
  statusCode?: number;
  details: string;
  rawResponse?: any;
}> {
  const endpoint = 'https://prakashsuvedi-nepalai-studio.hf.space/api/health';
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const statusCode = res.status;
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.ok && data) {
      console.log('[Sora-2 Diagnostic] Connection test SUCCESS:', data);
      return {
        success: true,
        model: 'sora-2',
        connected: true,
        endpoint,
        statusCode,
        details: `Connected to NepalAI Studio Space v${data.version || '1.0'}. Active Providers: ${Object.keys(data.providers || {}).filter(p => data.providers[p]).join(', ')}`,
        rawResponse: data,
      };
    } else {
      const reason = data?.error || `HTTP ${statusCode} ${res.statusText}`;
      console.error('[Sora-2 Diagnostic] Connection test FAILED:', reason);
      return {
        success: false,
        model: 'sora-2',
        connected: false,
        endpoint,
        statusCode,
        details: `Hugging Face Sora-2 endpoint returned status ${statusCode}: ${reason}`,
        rawResponse: data,
      };
    }
  } catch (err: any) {
    const reason = err.message || 'Network unreachable or fetch failed';
    console.error('[Sora-2 Diagnostic] Connection EXCEPTION:', reason);
    return {
      success: false,
      model: 'sora-2',
      connected: false,
      endpoint,
      details: `Failed to reach Hugging Face Sora-2 health endpoint: ${reason}`,
    };
  }
}

export async function loginAdmin(
  email: string,
  password?: string,
  adminKey?: string
): Promise<{ user: UserSession; trialUsage: UserTrialQuota; token: string }> {
  const res = await fetch('/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, adminKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Admin authentication failed' }));
    throw new Error(err.error || 'Admin login failed');
  }
  return res.json();
}

export async function fetchCurrentUser(
  userId: string
): Promise<{ user: UserSession; trialUsage: UserTrialQuota }> {
  const res = await fetch(`/api/auth/me?userId=${encodeURIComponent(userId)}`, {
    headers: { 'x-user-id': userId },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return res.json();
}

export const apiGetMe = fetchCurrentUser;

export async function apiLogout(): Promise<{ success: boolean }> {
  return { success: true };
}

export async function apiGenerateImage(
  userId: string,
  prompt: string,
  model = 'black-forest-labs/FLUX.1-schnell',
  quality = 'standard'
): Promise<{
  success: boolean;
  result: { url: string; model: string; resolution: string; engine: string };
  trialUsage: UserTrialQuota;
  remainingCredits: number;
}> {
  const res = await fetch('/api/generate/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId, prompt, model, quality }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Image generation failed');
  }
  return data;
}

export async function apiGenerateVideo(
  userId: string,
  prompt: string,
  durationSeconds = 15,
  model = 'openai/sora-2'
): Promise<{
  success: boolean;
  result: {
    url: string;
    model: string;
    duration: number;
    resolution: string;
    fps: number;
    jobId?: string;
    status?: string;
    progress?: number;
    engine?: string;
  };
  trialUsage: UserTrialQuota;
  remainingCredits: number;
}> {
  const res = await fetch('/api/generate/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId, prompt, durationSeconds, model }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Video generation failed');
  }
  return data;
}

export async function apiCheckVideoStatus(jobId: string): Promise<{
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
}> {
  const res = await fetch(`/api/video/status/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error('Failed to check video status');
  }
  return res.json();
}

export async function apiGenerateAudio(
  userId: string,
  text: string,
  voiceId = 'aakash_ne',
  language: 'ne-NP' | 'en-US' = 'ne-NP'
): Promise<{
  success: boolean;
  result: { url: string; duration: number; voice: string; language: string; format: string };
  trialUsage: UserTrialQuota;
  remainingCredits: number;
}> {
  const res = await fetch('/api/generate/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId, text, voiceId, language }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Audio generation failed');
  }
  return data;
}

export async function apiRenderVideo(
  userId: string,
  projectName: string,
  scenesCount: number,
  totalDurationSeconds: number
): Promise<{
  success: boolean;
  result: { renderId: string; downloadUrl: string; duration: number; sizeMb: number; format: string };
  trialUsage: UserTrialQuota;
  remainingCredits: number;
}> {
  const res = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId, projectName, scenesCount, totalDurationSeconds }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Video rendering failed');
  }
  return data;
}

export async function apiCheckoutStripe(
  userId: string,
  packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio'
): Promise<{ success: boolean; transaction: StripeTransactionItem; user: UserSession; message: string }> {
  const res = await fetch('/api/payment/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId, packageId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Payment checkout failed');
  }
  return data;
}

export async function apiGetAdminUsers(): Promise<AdminUsersResponse> {
  const res = await fetch('/api/admin/users');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch admin users');
  }
  return data;
}

export async function apiAdminUpdateUser(
  userId: string,
  updates: { credits?: number; tier?: string; resetTrial?: boolean }
): Promise<{ success: boolean; user: UserSession; trialUsage: UserTrialQuota }> {
  const res = await fetch(`/api/admin/user/${encodeURIComponent(userId)}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Admin update failed');
  }
  return data;
}

export async function apiSendHamroAiChat(params: {
  userId: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model: 'gpt-4o' | 'gpt-5-mini';
  language: 'ne' | 'hi' | 'en' | 'auto';
  systemInstruction?: string;
}): Promise<{
  success: boolean;
  reply: string;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  model: string;
  language: string;
}> {
  const res = await fetch('/api/hamroai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'HamroAI chat request failed');
  }
  return data;
}
