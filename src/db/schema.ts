/**
 * studio.nepalai.tech Database Schema
 * Production-ready PostgreSQL Schema using Drizzle ORM
 * Tracks user identities, trial quotas, token usage, and Stripe transactions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  tier: 'free_trial' | 'starter' | 'creator' | 'pro_studio';
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrialUsage {
  userId: string;
  // Free Trial Limits:
  // - Max 3 low-quality image generations
  // - Max 1 video generation (capped at 2 minutes)
  // - Max 1 audio generation (capped at 4 minutes)
  // - Max 1 full video rendering
  imagesCount: number;
  maxImages: number;
  videoCount: number;
  maxVideo: number;
  videoDurationSeconds: number; // max 120s
  audioCount: number;
  maxAudio: number;
  audioDurationSeconds: number; // max 240s
  rendersCount: number;
  maxRenders: number;
  chatCount?: number;
  maxChat?: number;
  totalTokensUsed: number;
  lastUsedAt: string;
  lastResetDate?: string; // YYYY-MM-DD
  lastResetAt?: string; // ISO timestamp
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  packageId: 'sasta_50_npr' | 'pack_100_npr' | 'pack_200_npr' | 'pack_300_npr' | 'starter' | 'creator' | 'pro_studio' | string;
  packageName: string;
  amount: number; // USD
  currency: string;
  creditsAdded: number;
  stripePaymentId: string;
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: string;
}

export interface GenerationLog {
  id: string;
  userId: string;
  type: 'image' | 'video' | 'audio' | 'render' | 'avatar' | 'voice_clone';
  model: string;
  prompt: string;
  resultUrl: string;
  tokensCost: number;
  creditsCost: number;
  deductionSource?: 'daily_free' | 'package_credits';
  createdAt: string;
}

export interface CustomVoice {
  id: string; // e.g. "voice_clone_178965..."
  userId: string;
  name: string; // e.g. "Maya Custom Clone"
  gender?: 'male' | 'female' | 'non-binary' | 'unspecified';
  language?: string; // 'ne-NP' | 'en-US'
  description?: string;
  sampleAudioUrl: string; // Storage URL of the uploaded reference sample
  sampleAudioFilename?: string;
  sampleDurationSeconds?: number;
  sampleFormat?: string; // 'mp3' | 'wav'
  sampleSizeBytes?: number;
  // Acoustic characteristics extracted from the reference sample
  speakerEmbedding?: number[];
  acousticCharacteristics?: {
    pitchMeanHz?: number;
    pitchRangeHz?: [number, number];
    speakingRateWpm?: number;
    timbreDescriptor?: string;
    pitchShiftPercent?: string;
    formantShiftPercent?: string;
    eqBassGainDb?: number;
    eqTrebleGainDb?: number;
  };
  modelEngine: 'azure_custom_neural' | 'hf_speecht5_speaker_clone' | 'neural_acoustic_clone';
  // Likeness & Voice Rights Consent (Prompt #6 pattern)
  consentStatus: 'verified' | 'pending' | 'rejected';
  consentTimestamp: string;
  consentLegalDeclaration: string;
  signerFullName: string;
  signerRelationship?: string;
  consentAudit?: {
    confirmed: boolean;
    signerFullName: string;
    signerRelationship: string;
    timestamp: string;
    statement?: string;
    verified?: boolean;
  };
  acousticProfile?: {
    pitchMeanHz?: number;
    pitchRangeHz?: [number, number];
    speakingRateWpm?: number;
    timbreDescriptor?: string;
  };
  moderationStatus: 'approved' | 'in_review' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

export interface Avatar {
  id: string;
  userId: string; // 'system' for stock avatars or specific userId for custom avatars
  name: string;
  category: 'stock' | 'custom';
  gender: 'male' | 'female' | 'non-binary';
  imageUrl: string;
  thumbnailUrl?: string;
  defaultVoiceId?: string;
  defaultLanguage?: string;
  stylePreset?: string;
  description?: string;
  consentStatus: 'verified' | 'pending' | 'rejected';
  consentTimestamp?: string;
  consentLegalDeclaration?: string;
  signerFullName?: string;
  signerRelationship?: string;
  moderationStatus: 'approved' | 'in_review' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

export interface AvatarVideoJob {
  id: string;
  userId: string;
  avatarId: string;
  avatarName: string;
  avatarImageUrl: string;
  script: string;
  language: string;
  voiceId: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  backgroundStyle?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  audioUrl?: string;
  durationSeconds?: number;
  creditsDeducted?: number;
  watermark?: boolean;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyResetAuditLog {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  accountsAudited: number;
  accountsReset: number;
  totalFreeCreditsRefreshed: number;
  leakageStatus: 'ZERO_LEAKAGE' | 'ANOMALY_DETECTED';
  systemCheckNotes: string;
}

/**
 * Theoretical Drizzle ORM Schema definition for PostgreSQL migration:
 * 
 * import { pgTable, text, integer, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
 * 
 * export const roleEnum = pgEnum('user_role', ['user', 'admin']);
 * export const tierEnum = pgEnum('subscription_tier', ['free_trial', 'starter', 'creator', 'pro_studio']);
 * 
 * export const usersTable = pgTable('users', {
 *   id: uuid('id').defaultRandom().primaryKey(),
 *   email: text('email').notNull().unique(),
 *   name: text('name').notNull(),
 *   avatar: text('avatar'),
 *   role: roleEnum('role').default('user').notNull(),
 *   tier: tierEnum('tier').default('free_trial').notNull(),
 *   credits: integer('credits').default(0).notNull(),
 *   createdAt: timestamp('created_at').defaultNow().notNull(),
 *   updatedAt: timestamp('updated_at').defaultNow().notNull(),
 * });
 * 
 * export const trialUsageTable = pgTable('trial_usage', {
 *   id: uuid('id').defaultRandom().primaryKey(),
 *   userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull().unique(),
 *   imagesCount: integer('images_count').default(0).notNull(),
 *   videoCount: integer('video_count').default(0).notNull(),
 *   videoDurationSeconds: integer('video_duration_seconds').default(0).notNull(),
 *   audioCount: integer('audio_count').default(0).notNull(),
 *   audioDurationSeconds: integer('audio_duration_seconds').default(0).notNull(),
 *   rendersCount: integer('renders_count').default(0).notNull(),
 *   totalTokensUsed: integer('total_tokens_used').default(0).notNull(),
 *   lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
 * });
 * 
 * export const transactionsTable = pgTable('transactions', {
 *   id: uuid('id').defaultRandom().primaryKey(),
 *   userId: uuid('user_id').references(() => usersTable.id).notNull(),
 *   userEmail: text('user_email').notNull(),
 *   packageId: text('package_id').notNull(),
 *   packageName: text('package_name').notNull(),
 *   amount: integer('amount_cents').notNull(),
 *   currency: text('currency').default('usd').notNull(),
 *   creditsAdded: integer('credits_added').notNull(),
 *   stripePaymentId: text('stripe_payment_id').notNull(),
 *   status: text('status').default('succeeded').notNull(),
 *   createdAt: timestamp('created_at').defaultNow().notNull(),
 * });
 */
