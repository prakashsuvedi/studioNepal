import type { UserSession, UserTrialQuota, StripeTransactionItem, CustomVoice } from '../types';
export { apiClient, ApiClient, ApiClientError, isBrowserOffline } from './apiClient';
export type { ApiClientRequestOptions, ApiErrorCode } from './apiClient';

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

export function extractErrorText(data: any, fallback = 'Request failed'): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.error === 'object' && data.error !== null) {
    return data.error.message || data.error.type || JSON.stringify(data.error);
  }
  if (typeof data.message === 'string') return data.message;
  return fallback;
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
    throw new Error(extractErrorText(err, 'Google Login verification failed'));
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
    throw new Error(extractErrorText(err, 'Admin login failed'));
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
  quality = 'hd',
  options?: {
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
    negativePrompt?: string;
    stylePreset?: string;
    cameraAngle?: string;
  }
): Promise<{
  success: boolean;
  result: { url: string; model: string; resolution: string; engine: string };
  trialUsage: UserTrialQuota;
  remainingCredits: number;
}> {
  const res = await fetch('/api/generate/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({
      userId,
      prompt,
      model,
      quality,
      aspectRatio: options?.aspectRatio,
      negativePrompt: options?.negativePrompt,
      stylePreset: options?.stylePreset,
      cameraAngle: options?.cameraAngle,
    }),
  });
  const data = await res.json().catch(() => ({ error: 'Image generation failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Image generation failed'));
  }
  return data;
}

/**
 * Normalizes input duration to Azure OpenAI Sora-2 strictly supported values: '4', '8', and '12'.
 */
export function normalizeSoraDuration(durationSeconds?: number | string): '4' | '8' | '12' {
  const d = typeof durationSeconds === 'string' ? parseInt(durationSeconds, 10) : durationSeconds;
  if (!d) return '8';
  if (d <= 5) return '4';
  if (d <= 9) return '8';
  return '12';
}

export async function apiGenerateVideo(
  userId: string,
  prompt: string,
  durationSeconds = 8,
  model = 'openai/sora-2',
  options?: {
    resolution?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    quality?: string;
    motion?: string;
    style?: string;
    lockedSubjectToken?: string;
    lockedSubjectDescription?: string;
    frameOneSeedPrompt?: string;
    continuationOf?: string;
  }
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
    body: JSON.stringify({
      userId,
      prompt,
      durationSeconds,
      model,
      resolution: options?.resolution,
      aspectRatio: options?.aspectRatio,
      quality: options?.quality,
      motion: options?.motion,
      style: options?.style,
      lockedSubjectToken: options?.lockedSubjectToken,
      lockedSubjectDescription: options?.lockedSubjectDescription,
      frameOneSeedPrompt: options?.frameOneSeedPrompt,
      continuationOf: options?.continuationOf,
    }),
  });
  const data = await res.json().catch(() => ({ error: 'Video generation failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Video generation failed'));
  }
  return data;
}

export { pollSoraJobStatus, fetchVideoStatus } from './soraPoller';
export type { SoraJobStatusResult, SoraPollingOptions } from './soraPoller';

export async function apiCheckVideoStatus(jobId: string): Promise<{
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
}> {
  const { fetchVideoStatus } = await import('./soraPoller');
  return fetchVideoStatus(jobId);
}

export async function apiGenerateAudio(
  userId: string,
  text: string,
  voiceId = 'aakash_ne',
  language: 'ne-NP' | 'en-US' = 'ne-NP',
  emotion = 'neutral',
  deliveryStyle = 'general',
  speed?: string,
  volume?: string,
  pitch?: string,
  phoneticDict?: string,
  customVoiceId?: string
): Promise<{
  success: boolean;
  result: { url: string; duration: number; voice: string; language: string; format: string; customVoiceId?: string; cloned?: boolean };
  trialUsage: UserTrialQuota;
  remainingCredits: number;
}> {
  const res = await fetch('/api/generate/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId, text, voiceId, language, emotion, deliveryStyle, speed, volume, pitch, phoneticDict, customVoiceId }),
  });
  const data = await res.json().catch(() => ({ error: 'Audio generation failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Audio generation failed'));
  }
  return data;
}

// ==========================================
// Custom Voice Cloning Client APIs
// ==========================================

export async function apiCreateCustomVoice(payload: {
  userId: string;
  name: string;
  sampleAudio: string;
  sampleFilename?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'unspecified';
  language?: 'ne-NP' | 'en-US';
  description?: string;
  consentConfirmed: boolean;
  signerFullName: string;
  signerRelationship?: string;
  consentStatement?: string;
}): Promise<{
  success: boolean;
  voice: CustomVoice;
  analysis: any;
  remainingCredits: number;
  trialUsage: UserTrialQuota;
}> {
  const res = await fetch('/api/voice/clone/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': payload.userId },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ error: 'Voice clone creation failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Voice clone creation failed'));
  }
  return data;
}

export async function apiGetCustomVoices(userId: string): Promise<CustomVoice[]> {
  const res = await fetch(`/api/voice/clone/list?userId=${encodeURIComponent(userId)}`, {
    headers: { 'x-user-id': userId },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ voices: [] }));
  return data.voices || [];
}

export async function apiDeleteCustomVoice(id: string, userId: string): Promise<boolean> {
  const res = await fetch(`/api/voice/clone/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId }),
  });
  return res.ok;
}

export async function apiPreviewVoiceSample(sampleAudio: string, filename?: string): Promise<{
  durationSec: number;
  pitchMeanHz: number;
  timbreDescriptor: string;
  detectedGender: string;
  sampleRate: number;
}> {
  const res = await fetch('/api/voice/clone/sample/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sampleAudio, filename }),
  });
  const data = await res.json().catch(() => ({ error: 'Preview failed' }));
  if (!res.ok) throw new Error(extractErrorText(data, 'Preview failed'));
  return data.analysis;
}

export async function apiGetAudioSuggestions(
  text: string,
  language: 'ne' | 'en' = 'ne'
): Promise<{
  success: boolean;
  suggestions: {
    recommendedVoice: string;
    recommendedDemographic: string;
    recommendedEmotion: string;
    recommendedFormat: string;
    analysis: string;
    suggestions: { originalText: string; suggestedText: string; explanation: string }[];
    formattedScript: string;
  };
}> {
  const res = await fetch('/api/generate/audio-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  const data = await res.json().catch(() => ({ error: 'Smart script analysis failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Smart script analysis failed'));
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
  const data = await res.json().catch(() => ({ error: 'Video rendering failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Video rendering failed'));
  }
  return data;
}

export async function apiCheckoutStripe(
  userId: string,
  packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio'
): Promise<{
  success: boolean;
  sessionId: string;
  url: string | null;
  amount: number;
  currency: string;
  credits: number;
  packageName: string;
  mode: string;
}> {
  const res = await fetch('/api/payment/stripe/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ userId, packageId }),
  });
  const data = await res.json().catch(() => ({ error: 'Payment checkout session creation failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Payment checkout session creation failed'));
  }
  return data;
}

export async function apiGetStripePaymentStatus(
  paymentId: string
): Promise<{
  success: boolean;
  status: 'succeeded' | 'pending' | 'failed';
  transaction: StripeTransactionItem | null;
  user: UserSession | null;
  message?: string;
}> {
  const res = await fetch(`/api/payment/stripe/status/${encodeURIComponent(paymentId)}`);
  const data = await res.json().catch(() => ({ error: 'Failed to fetch Stripe payment status' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Failed to fetch Stripe payment status'));
  }
  return data;
}

export async function apiGetAdminUsers(): Promise<AdminUsersResponse> {
  const adminId = localStorage.getItem('nepalai_user_id') || '';
  const res = await fetch('/api/admin/users', {
    headers: { 'x-user-id': adminId },
  });
  const data = await res.json().catch(() => ({ error: 'Failed to fetch admin users' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Failed to fetch admin users'));
  }
  return data;
}

export async function apiAdminUpdateUser(
  userId: string,
  updates: { credits?: number; tier?: string; resetTrial?: boolean }
): Promise<{ success: boolean; user: UserSession; trialUsage: UserTrialQuota }> {
  const adminId = localStorage.getItem('nepalai_user_id') || '';
  const res = await fetch(`/api/admin/user/${encodeURIComponent(userId)}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': adminId,
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json().catch(() => ({ error: 'Admin update failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'Admin update failed'));
  }
  return data;
}

export async function apiSendHamroAiChat(params: {
  userId: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  attachments?: Array<{ name: string; type: string; dataUrl?: string; content?: string }>;
  model: 'gpt-4o' | 'gpt-5-mini';
  language: 'ne' | 'hi' | 'en' | 'auto';
  systemInstruction?: string;
}): Promise<{
  success: boolean;
  reply: string;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  model: string;
  language: string;
  remainingCredits?: number;
  dailyUsed?: number;
  maxDailyChats?: number | string;
  remainingDailyChats?: number | string;
}> {
  const res = await fetch('/api/hamroai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({ error: 'HamroAI chat request failed' }));
  if (!res.ok) {
    throw new Error(extractErrorText(data, 'HamroAI chat request failed'));
  }
  return data;
}

export async function apiTranslatePrompt(text: string, targetLang: 'en' | 'ne'): Promise<string> {
  try {
    const res = await fetch('/api/ai/translate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.translatedText || text;
  } catch {
    return text;
  }
}

export interface SafeR2Config {
  bucket: string;
  region: string;
  endpoint: string;
  endpointConfigured: boolean;
  credentialsConfigured: boolean;
  accessKeyMasked: string;
  secretKeyConfigured: boolean;
  provider: string;
}

/**
 * Safely retrieves Cloudflare R2 storage configuration from server diagnostics,
 * ensuring secret keys are masked in logs and only non-sensitive metadata is exposed.
 */
export async function getSafeR2Config(): Promise<SafeR2Config> {
  const savedUserId = localStorage.getItem('nepalai_user_id') || '';
  const token = localStorage.getItem('nepalai_auth_token') || '';

  try {
    const res = await fetch('/api/diagnostic/storage/r2', {
      method: 'GET',
      headers: {
        'x-user-id': savedUserId,
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return {
        bucket: 'nepalai',
        region: 'auto',
        endpoint: '',
        endpointConfigured: false,
        credentialsConfigured: false,
        accessKeyMasked: '****',
        secretKeyConfigured: false,
        provider: 'r2',
      };
    }

    const data = await res.json();
    const endpointStr: string = data.endpoint || '';
    
    // Mask endpoint account ID if present
    const maskedEndpoint = endpointStr.replace(/https:\/\/([a-zA-Z0-9]{4})[a-zA-Z0-9]+(\.r2\.cloudflarestorage\.com.*)/, 'https://$1****$2');

    return {
      bucket: data.bucket || 'nepalai',
      region: data.region || 'auto',
      endpoint: maskedEndpoint || endpointStr,
      endpointConfigured: Boolean(data.endpointConfigured),
      credentialsConfigured: Boolean(data.credentialsConfigured),
      accessKeyMasked: data.credentialsConfigured ? '••••••••••••••••' : 'Not configured',
      secretKeyConfigured: Boolean(data.credentialsConfigured),
      provider: data.provider || 'r2',
    };
  } catch (err) {
    console.warn('[SafeR2Config] Failed to retrieve masked R2 config:', err);
    return {
      bucket: 'nepalai',
      region: 'auto',
      endpoint: '',
      endpointConfigured: false,
      credentialsConfigured: false,
      accessKeyMasked: '****',
      secretKeyConfigured: false,
      provider: 'r2',
    };
  }
}

// ==========================================
// AVATAR STUDIO CLIENT API METHODS
// ==========================================

export async function apiGetAvatars(userId?: string): Promise<{ success: boolean; avatars: any[] }> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const savedUserId = userId || localStorage.getItem('nepalai_user_id') || '';
  const res = await fetch(`/api/avatar/list?userId=${encodeURIComponent(savedUserId)}`, {
    headers: {
      'x-user-id': savedUserId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch avatars' }));
    throw new Error(extractErrorText(err, 'Failed to fetch avatar presenters'));
  }
  return res.json();
}

export async function apiGetAvatarVoices(): Promise<{ success: boolean; voices: any[] }> {
  const res = await fetch('/api/avatar/voices');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch avatar voices' }));
    throw new Error(extractErrorText(err, 'Failed to fetch presenter voices'));
  }
  return res.json();
}

export async function apiSubmitAvatarConsent(params: {
  userId: string;
  avatarId?: string;
  consentStatement?: string;
  signerFullName: string;
  signerRelationship?: string;
}): Promise<{ success: boolean; consentTimestamp: string }> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const res = await fetch('/api/avatar/consent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to log consent' }));
    throw new Error(extractErrorText(err, 'Likeness consent logging failed'));
  }
  return res.json();
}

export async function apiCreateCustomAvatar(params: {
  userId: string;
  name: string;
  gender?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  defaultVoiceId?: string;
  defaultLanguage?: string;
  stylePreset?: string;
  description?: string;
  signerFullName: string;
  signerRelationship?: string;
  consentConfirmed: boolean;
}): Promise<{ success: boolean; avatar: any }> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const res = await fetch('/api/avatar/custom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create avatar' }));
    throw new Error(extractErrorText(err, 'Failed to create custom presenter avatar'));
  }
  return res.json();
}

export async function apiGenerateAIAvatar(params: {
  userId: string;
  prompt: string;
  referenceImageUrl?: string;
  name?: string;
  gender?: 'male' | 'female' | 'non-binary';
  defaultVoiceId?: string;
  defaultLanguage?: string;
  stylePreset?: string;
  signerFullName?: string;
}): Promise<{ success: boolean; avatar: any }> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const res = await fetch('/api/avatar/ai-create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'AI avatar creation failed' }));
    throw new Error(extractErrorText(err, 'Failed to generate AI presenter avatar'));
  }
  return res.json();
}

export async function apiGenerateAvatarVideo(params: {
  userId: string;
  avatarId: string;
  script: string;
  language?: string;
  voiceId?: string;
  speed?: string;
  pitch?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  backgroundPreset?: string;
  customBackgroundUrl?: string;
  pose?: 'seated' | 'standing';
  consentConfirmed: boolean;
  signerFullName?: string;
}): Promise<{
  success: boolean;
  jobId: string;
  videoUrl: string;
  audioUrl: string;
  durationSeconds: number;
  avatarId: string;
  avatarName: string;
  aspectRatio: string;
  creditsDeducted: number;
  remainingCredits: number;
  trialUsage?: any;
}> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const res = await fetch('/api/avatar/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Avatar video generation failed' }));
    throw new Error(extractErrorText(err, 'Failed to generate avatar presenter video'));
  }
  return res.json();
}

export async function apiGetAvatarJobStatus(jobId: string): Promise<{ success: boolean; job: any }> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const res = await fetch(`/api/avatar/status/${encodeURIComponent(jobId)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get job status' }));
    throw new Error(extractErrorText(err, 'Failed to get avatar job status'));
  }
  return res.json();
}

export async function apiGetAvatarHistory(userId?: string): Promise<{ success: boolean; jobs: any[] }> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const savedUserId = userId || localStorage.getItem('nepalai_user_id') || '';
  const res = await fetch(`/api/avatar/history?userId=${encodeURIComponent(savedUserId)}`, {
    headers: {
      'x-user-id': savedUserId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch history' }));
    throw new Error(extractErrorText(err, 'Failed to fetch avatar history'));
  }
  return res.json();
}

export async function apiDeleteAvatar(avatarId: string, userId: string): Promise<{ success: boolean }> {
  const token = localStorage.getItem('nepalai_auth_token') || '';
  const res = await fetch(`/api/avatar/${encodeURIComponent(avatarId)}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete avatar' }));
    throw new Error(extractErrorText(err, 'Failed to delete avatar'));
  }
  return res.json();
}

