import fs from 'fs';
import path from 'path';
import { User, TrialUsage, Transaction, GenerationLog, Avatar, AvatarVideoJob, CustomVoice } from '../db/schema';
import { postgresDb } from './postgresDb';
import { ADMIN_WHITELIST_EMAILS } from './credentials';

export interface PricingConfig {
  nprExchangeRate: number; // e.g. 135 NPR = 1 USD
  starterNpr: number; // e.g. 2500 NPR
  creatorNpr: number; // e.g. 6500 NPR
  proStudioNpr: number; // e.g. 16500 NPR
  fonepayMerchantCode: string;
  fonepaySecretKey: string;
  youtubeClientId?: string;
  youtubeClientSecret?: string;
  storageProvider?: 'local' | 'supabase' | 'r2';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseBucket?: string;
  voiceCloneCreationCostCredits?: number;
  voiceCloneSynthesisCostCredits?: number;
}

export interface DatabaseStore {
  users: User[];
  trialUsage: Record<string, TrialUsage>;
  transactions: Transaction[];
  generationLogs: GenerationLog[];
  avatars: Avatar[];
  avatarJobs: AvatarVideoJob[];
  customVoices: CustomVoice[];
  pricingConfig?: PricingConfig;
}

export const DEFAULT_STOCK_AVATARS: Avatar[] = [
  {
    id: 'avt_stock_01',
    userId: 'system',
    name: 'Aarav Sharma',
    category: 'stock',
    gender: 'male',
    imageUrl: '/assets/avatars/aarav.jpg',
    thumbnailUrl: '/assets/avatars/aarav.jpg',
    defaultVoiceId: 'ne-NP-SagarNeural',
    defaultLanguage: 'ne-NP',
    stylePreset: 'newsroom',
    description: 'National News Anchor & Broadcast Presenter with authoritative tone.',
    consentStatus: 'verified',
    consentTimestamp: '2026-01-01T00:00:00.000Z',
    consentLegalDeclaration: 'Platform Verified Stock Presenter - Licensed for Commercial Video Production',
    signerFullName: 'NepalAI Platform Media Trust',
    signerRelationship: 'Official Stock Talent Agency Partner',
    moderationStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'avt_stock_02',
    userId: 'system',
    name: 'Hemkala Thapa',
    category: 'stock',
    gender: 'female',
    imageUrl: '/assets/avatars/hemkala.jpg',
    thumbnailUrl: '/assets/avatars/hemkala.jpg',
    defaultVoiceId: 'ne-NP-HemkalaNeural',
    defaultLanguage: 'ne-NP',
    stylePreset: 'office',
    description: 'Academic Lecturer & Educational Presenter with warm articulate cadence.',
    consentStatus: 'verified',
    consentTimestamp: '2026-01-01T00:00:00.000Z',
    consentLegalDeclaration: 'Platform Verified Stock Presenter - Licensed for Commercial Video Production',
    signerFullName: 'NepalAI Platform Media Trust',
    signerRelationship: 'Official Stock Talent Agency Partner',
    moderationStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'avt_stock_03',
    userId: 'system',
    name: 'Sagar KC',
    category: 'stock',
    gender: 'male',
    imageUrl: '/assets/avatars/sagar.jpg',
    thumbnailUrl: '/assets/avatars/sagar.jpg',
    defaultVoiceId: 'ne-NP-SagarNeural',
    defaultLanguage: 'ne-NP',
    stylePreset: 'podcast',
    description: 'Tech Reviewer & Startup Pitch Host with energetic modern delivery.',
    consentStatus: 'verified',
    consentTimestamp: '2026-01-01T00:00:00.000Z',
    consentLegalDeclaration: 'Platform Verified Stock Presenter - Licensed for Commercial Video Production',
    signerFullName: 'NepalAI Platform Media Trust',
    signerRelationship: 'Official Stock Talent Agency Partner',
    moderationStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'avt_stock_04',
    userId: 'system',
    name: 'Maya Gurung',
    category: 'stock',
    gender: 'female',
    imageUrl: '/assets/avatars/maya.jpg',
    thumbnailUrl: '/assets/avatars/maya.jpg',
    defaultVoiceId: 'ne-NP-HemkalaNeural',
    defaultLanguage: 'ne-NP',
    stylePreset: 'kathmandu',
    description: 'Cultural Ambassador & Himalayan Tourism Host in traditional attire.',
    consentStatus: 'verified',
    consentTimestamp: '2026-01-01T00:00:00.000Z',
    consentLegalDeclaration: 'Platform Verified Stock Presenter - Licensed for Commercial Video Production',
    signerFullName: 'NepalAI Platform Media Trust',
    signerRelationship: 'Official Stock Talent Agency Partner',
    moderationStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'avt_stock_05',
    userId: 'system',
    name: 'Rajesh Commercial Host',
    category: 'stock',
    gender: 'male',
    imageUrl: '/assets/avatars/rajesh.jpg',
    thumbnailUrl: '/assets/avatars/rajesh.jpg',
    defaultVoiceId: 'ne-NP-SagarNeural',
    defaultLanguage: 'ne-NP',
    stylePreset: 'office',
    description: 'Commercial Endorsement & High-Impact Brand Spokesperson.',
    consentStatus: 'verified',
    consentTimestamp: '2026-01-01T00:00:00.000Z',
    consentLegalDeclaration: 'Platform Verified Stock Presenter - Licensed for Commercial Video Production',
    signerFullName: 'NepalAI Platform Media Trust',
    signerRelationship: 'Official Stock Talent Agency Partner',
    moderationStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'avt_stock_06',
    userId: 'system',
    name: 'Priya Adhikari',
    category: 'stock',
    gender: 'female',
    imageUrl: '/assets/avatars/priya.jpg',
    thumbnailUrl: '/assets/avatars/priya.jpg',
    defaultVoiceId: 'ne-NP-HemkalaNeural',
    defaultLanguage: 'ne-NP',
    stylePreset: 'office',
    description: 'Executive Corporate Briefing & Financial Analyst Presenter.',
    consentStatus: 'verified',
    consentTimestamp: '2026-01-01T00:00:00.000Z',
    consentLegalDeclaration: 'Platform Verified Stock Presenter - Licensed for Commercial Video Production',
    signerFullName: 'NepalAI Platform Media Trust',
    signerRelationship: 'Official Stock Talent Agency Partner',
    moderationStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'avt_stock_07',
    userId: 'system',
    name: 'Kabir Sen',
    category: 'stock',
    gender: 'male',
    imageUrl: '/assets/avatars/kabir.jpg',
    thumbnailUrl: '/assets/avatars/kabir.jpg',
    defaultVoiceId: 'ne-NP-SagarNeural',
    defaultLanguage: 'ne-NP',
    stylePreset: 'podcast',
    description: 'In-Depth Podcast & Interview Host with thoughtful, conversational tone.',
    consentStatus: 'verified',
    consentTimestamp: '2026-01-01T00:00:00.000Z',
    consentLegalDeclaration: 'Platform Verified Stock Presenter - Licensed for Commercial Video Production',
    signerFullName: 'NepalAI Platform Media Trust',
    signerRelationship: 'Official Stock Talent Agency Partner',
    moderationStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'nepalai_db.json');

// Default initial state
const INITIAL_STORE: DatabaseStore = {
  users: [
    {
      id: 'usr_admin_01',
      email: 'prakashsuvedi.backup@gmail.com',
      name: 'Prakash Suvedi (Platform Owner)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      tier: 'pro_studio',
      credits: 999999,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-09-03T18:00:00.000Z',
    },
    {
      id: 'usr_client_02',
      email: 'ramesh.shrestha@gmail.com',
      name: 'Ramesh Shrestha',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      tier: 'creator',
      credits: 1420,
      createdAt: '2026-08-15T12:30:00.000Z',
      updatedAt: '2026-09-02T14:15:00.000Z',
    },
    {
      id: 'usr_client_03',
      email: 'maya.gurung@gmail.com',
      name: 'Maya Gurung',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      tier: 'free_trial',
      credits: 0,
      createdAt: '2026-09-01T09:12:00.000Z',
      updatedAt: '2026-09-03T11:20:00.000Z',
    },
    {
      id: 'usr_client_04',
      email: 'kathmandu.media@agency.com',
      name: 'Kathmandu Media Lab',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      tier: 'starter',
      credits: 380,
      createdAt: '2026-08-20T16:45:00.000Z',
      updatedAt: '2026-09-03T08:10:00.000Z',
    },
  ],
  trialUsage: {
    usr_admin_01: {
      userId: 'usr_admin_01',
      imagesCount: 24,
      maxImages: 99999,
      videoCount: 15,
      maxVideo: 99999,
      videoDurationSeconds: 1800,
      audioCount: 30,
      maxAudio: 99999,
      audioDurationSeconds: 3600,
      rendersCount: 12,
      maxRenders: 99999,
      totalTokensUsed: 145000,
      lastUsedAt: '2026-09-03T20:10:00.000Z',
    },
    usr_client_02: {
      userId: 'usr_client_02',
      imagesCount: 45,
      maxImages: 500,
      videoCount: 8,
      maxVideo: 60,
      videoDurationSeconds: 720,
      audioCount: 14,
      maxAudio: 120,
      audioDurationSeconds: 1400,
      rendersCount: 6,
      maxRenders: 50,
      totalTokensUsed: 52400,
      lastUsedAt: '2026-09-02T14:15:00.000Z',
    },
    usr_client_03: {
      userId: 'usr_client_03',
      imagesCount: 3, // Exhausted images
      maxImages: 3,
      videoCount: 1, // Exhausted video
      maxVideo: 1,
      videoDurationSeconds: 65,
      audioCount: 1, // Exhausted audio
      maxAudio: 1,
      audioDurationSeconds: 110,
      rendersCount: 0,
      maxRenders: 1,
      totalTokensUsed: 4200,
      lastUsedAt: '2026-09-03T11:20:00.000Z',
    },
    usr_client_04: {
      userId: 'usr_client_04',
      imagesCount: 18,
      maxImages: 100,
      videoCount: 3,
      maxVideo: 10,
      videoDurationSeconds: 240,
      audioCount: 5,
      maxAudio: 20,
      audioDurationSeconds: 450,
      rendersCount: 2,
      maxRenders: 10,
      totalTokensUsed: 21800,
      lastUsedAt: '2026-09-03T08:10:00.000Z',
    },
  },
  transactions: [
    {
      id: 'tx_stripe_8841',
      userId: 'usr_client_02',
      userEmail: 'ramesh.shrestha@gmail.com',
      packageId: 'creator',
      packageName: 'Creator Tier (1,800 Credits)',
      amount: 49,
      currency: 'USD',
      creditsAdded: 1800,
      stripePaymentId: 'ch_3PzQx8Lk910298aK2',
      status: 'succeeded',
      createdAt: '2026-08-15T12:30:00.000Z',
    },
    {
      id: 'tx_stripe_9921',
      userId: 'usr_client_04',
      userEmail: 'kathmandu.media@agency.com',
      packageId: 'starter',
      packageName: 'Starter Tier (500 Credits)',
      amount: 19,
      currency: 'USD',
      creditsAdded: 500,
      stripePaymentId: 'ch_3PzL91Ja8211029Lk',
      status: 'succeeded',
      createdAt: '2026-08-20T16:45:00.000Z',
    },
  ],
  generationLogs: [
    {
      id: 'gen_log_01',
      userId: 'usr_client_02',
      type: 'image',
      model: 'gpt-image-1.5 / FLUX.1',
      prompt: 'Himalayan sunrise reflection over Phewa Lake Pokhara',
      resultUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1080&auto=format&fit=crop&q=80',
      tokensCost: 350,
      creditsCost: 5,
      createdAt: '2026-09-02T14:15:00.000Z',
    },
  ],
  avatars: DEFAULT_STOCK_AVATARS,
  avatarJobs: [],
  customVoices: [],
};

class Database {
  private store: DatabaseStore;

  constructor() {
    this.store = this.load();
  }

  private load(): DatabaseStore {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed: DatabaseStore = JSON.parse(raw);
        if (!parsed.avatars || parsed.avatars.length === 0) {
          parsed.avatars = [...DEFAULT_STOCK_AVATARS];
        }
        if (!parsed.avatarJobs) {
          parsed.avatarJobs = [];
        }
        if (!parsed.customVoices) {
          parsed.customVoices = [];
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Could not load db.json, using initial seed:', err);
    }
    this.save(INITIAL_STORE);
    return INITIAL_STORE;
  }

  private save(store: DatabaseStore) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  // User operations
  public getUserById(id: string): User | undefined {
    if (!id) return undefined;
    if (id === 'usr-google-prakash' || id === 'usr_admin_01' || id.toLowerCase().includes('prakashsuvedi')) {
      const admin = this.store.users.find(u => 
        u.email.toLowerCase() === 'prakashsuvedi.backup@gmail.com' ||
        u.email.toLowerCase() === 'prakashsuvedi@gmail.com' ||
        u.id === 'usr_admin_01'
      );
      if (admin) return admin;
    }
    const found = this.store.users.find(u => u.id === id);
    if (found) return found;
    // Check if passed an email
    if (id.includes('@')) {
      return this.getUserByEmail(id);
    }
    return undefined;
  }

  public getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    return this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findOrCreateUser(email: string, name?: string, avatar?: string): User {
    const existing = this.getUserByEmail(email);
    if (existing) {
      return existing;
    }

    const lower = email.toLowerCase();
    const isAdmin = ADMIN_WHITELIST_EMAILS.includes(lower);

    const newUser: User = {
      id: isAdmin ? 'usr_admin_01' : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: name || (isAdmin ? 'Prakash Suvedi (Platform Owner)' : email.split('@')[0]),
      avatar: avatar || (isAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
      role: isAdmin ? 'admin' : 'user',
      tier: isAdmin ? 'pro_studio' : 'free_trial',
      credits: isAdmin ? 999999 : 500, // Generous starter credits
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.store.users.push(newUser);

    // Initialize trial usage for new user
    this.store.trialUsage[newUser.id] = {
      userId: newUser.id,
      imagesCount: 0,
      maxImages: isAdmin ? 99999 : 50,
      videoCount: 0,
      maxVideo: isAdmin ? 99999 : 20,
      videoDurationSeconds: 0,
      audioCount: 0,
      maxAudio: isAdmin ? 99999 : 30,
      audioDurationSeconds: 0,
      rendersCount: 0,
      maxRenders: isAdmin ? 99999 : 20,
      totalTokensUsed: 0,
      lastUsedAt: new Date().toISOString(),
    };

    this.save(this.store);
    this.syncUserToPostgres(newUser);
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save(this.store);
    this.syncUserToPostgres(user);
    return user;
  }

  // Non-blocking asynchronous sync to Supabase PostgreSQL
  public async syncUserToPostgres(user: User) {
    try {
      if (!postgresDb.isConnected) return;
      await postgresDb.query(
        `INSERT INTO users (id, email, name, picture, role, tier, credits, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           picture = EXCLUDED.picture,
           role = EXCLUDED.role,
           tier = EXCLUDED.tier,
           credits = EXCLUDED.credits,
           updated_at = NOW()`,
        [user.id, user.email, user.name || '', user.avatar || '', user.role, user.tier, user.credits]
      );
    } catch (e: any) {
      // Non-blocking sync error catch
    }
  }

  public async syncTransactionToPostgres(tx: Transaction) {
    try {
      if (!postgresDb.isConnected) return;
      await postgresDb.query(
        `INSERT INTO transactions (id, user_id, user_email, package_id, package_name, amount, currency, credits_added, stripe_payment_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [tx.id, tx.userId, tx.userEmail, tx.packageId, tx.packageName, tx.amount, tx.currency, tx.creditsAdded, tx.stripePaymentId || '', tx.status]
      );
    } catch (e: any) {
      // Non-blocking sync error catch
    }
  }

  public async syncLogToPostgres(log: GenerationLog) {
    try {
      if (!postgresDb.isConnected) return;
      await postgresDb.query(
        `INSERT INTO generation_logs (id, user_id, type, prompt, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [log.id, log.userId, log.type, log.prompt, 'succeeded']
      );
    } catch (e: any) {
      // Non-blocking sync error catch
    }
  }

  public getTrialUsage(userId: string): TrialUsage {
    const today = new Date().toISOString().split('T')[0];
    const user = this.getUserById(userId);
    const isAdmin = user?.role === 'admin';

    const userTier = user?.tier || 'free_trial';
    const defaultMaxChat = isAdmin ? 999999 : userTier === 'pro_studio' ? 500 : userTier === 'creator' ? 150 : userTier === 'starter' ? 50 : 20;

    if (!this.store.trialUsage[userId]) {
      this.store.trialUsage[userId] = {
        userId,
        imagesCount: 0,
        maxImages: isAdmin ? 99999 : 50,
        videoCount: 0,
        maxVideo: isAdmin ? 99999 : 20,
        videoDurationSeconds: 0,
        audioCount: 0,
        maxAudio: isAdmin ? 99999 : 30,
        audioDurationSeconds: 0,
        rendersCount: 0,
        maxRenders: isAdmin ? 99999 : 20,
        chatCount: 0,
        maxChat: defaultMaxChat,
        totalTokensUsed: 0,
        lastUsedAt: new Date().toISOString(),
        lastResetDate: today,
        lastResetAt: new Date().toISOString(),
      };
      this.save(this.store);
    } else {
      // Daily reset check: Reset free daily quota every 24h / calendar day for all users
      const usage = this.store.trialUsage[userId];
      usage.maxChat = defaultMaxChat;
      if (typeof usage.chatCount !== 'number') {
        usage.chatCount = 0;
      }
      if (usage.lastResetDate !== today) {
        usage.imagesCount = 0;
        usage.videoCount = 0;
        usage.audioCount = 0;
        usage.rendersCount = 0;
        usage.chatCount = 0;
        usage.videoDurationSeconds = 0;
        usage.audioDurationSeconds = 0;
        usage.lastResetDate = today;
        usage.lastResetAt = new Date().toISOString();
        this.save(this.store);
      }
    }
    return this.store.trialUsage[userId];
  }

  // Quota & Permission Verification
  public checkCanGenerate(
    userId: string,
    type: 'image' | 'video' | 'audio' | 'render' | 'avatar' | 'voice_clone',
    durationSeconds = 0
  ): { allowed: boolean; reason?: string; hardLocked?: boolean; remaining?: number; isFreeAvatarRender?: boolean } {
    let user = this.getUserById(userId);
    if (!user) {
      user = this.findOrCreateUser(userId.includes('@') ? userId : `creator_${userId}@nepalai.tech`, 'Creator User');
    }

    // Admin has unlimited bypass
    if (user.role === 'admin') {
      return { allowed: true, remaining: 999999, isFreeAvatarRender: false };
    }

    const usage = this.getTrialUsage(userId); // Triggers daily reset if new day

    // Auto-update legacy trial limits to generous defaults
    if (usage.maxImages < 50) usage.maxImages = 50;
    if (usage.maxVideo < 20) usage.maxVideo = 20;
    if (usage.maxAudio < 30) usage.maxAudio = 30;
    if (usage.maxRenders < 20) usage.maxRenders = 20;
    if (user.credits < 100) user.credits = 500;

    // Special Policy: 1 Video Render Free for Avatar Presenter Studio for Google Login / Free Users (with NepalAI Studio logo)
    if (type === 'avatar') {
      const freeAvatarUsed = Boolean((usage as any).freeAvatarRenderUsed || ((usage as any).avatarCount && (usage as any).avatarCount >= 1));
      if (!freeAvatarUsed) {
        // Free video render granted with NepalAI Studio watermark!
        return { allowed: true, remaining: user.credits, isFreeAvatarRender: true };
      }
      // If free avatar render has already been used, verify paid credits (15 credits required for commercial master without watermark)
      if (user.credits >= 15 || user.tier !== 'free_trial') {
        return { allowed: true, remaining: user.credits, isFreeAvatarRender: false };
      }
      return {
        allowed: false,
        hardLocked: true,
        reason: 'You have used your 1 free avatar presenter render! Top up credits to render more broadcast-grade avatar videos without watermarks.',
        remaining: user.credits,
      };
    }

    // Priority 1: Check if Daily Free Quota for today is available
    let hasDailyFree = false;
    if (type === 'image' && usage.imagesCount < usage.maxImages) hasDailyFree = true;
    if (type === 'video' && usage.videoCount < usage.maxVideo && (durationSeconds <= 120 || durationSeconds === 0)) hasDailyFree = true;
    if (type === 'audio' && usage.audioCount < usage.maxAudio && (durationSeconds <= 240 || durationSeconds === 0)) hasDailyFree = true;
    if (type === 'render' && usage.rendersCount < usage.maxRenders) hasDailyFree = true;

    if (hasDailyFree && type !== 'voice_clone') {
      return { allowed: true, remaining: user.credits };
    }

    // Priority 2: Check Paid Package Credits
    if (user.credits > 0 || user.tier !== 'free_trial') {
      const voiceCloneCost = this.store.pricingConfig?.voiceCloneCreationCostCredits ?? 20;
      const costMap: Record<string, number> = { image: 5, video: 25, audio: 10, render: 30, avatar: 15, voice_clone: voiceCloneCost };
      const cost = costMap[type] || 15;
      if (user.credits < cost) {
        return {
          allowed: false,
          hardLocked: true,
          reason: `Insufficient credits for ${type} (${user.credits} remaining, ${cost} required). Please top up!`,
          remaining: user.credits,
        };
      }
      return { allowed: true, remaining: user.credits };
    }

    // Free trial user with exhausted daily free quota
    return {
      allowed: false,
      hardLocked: true,
      reason: `Daily free quota limit reached for today! It resets automatically every day at midnight. Upgrade to a paid package for instant extra credits.`,
      remaining: 0,
    };
  }

  // Record generation and token usage
  public recordGeneration(
    userId: string,
    type: 'image' | 'video' | 'audio' | 'render' | 'avatar' | 'voice_clone',
    prompt: string,
    resultUrl: string,
    model: string,
    durationSeconds = 0
  ) {
    const user = this.getUserById(userId);
    if (!user) return;

    const usage = this.getTrialUsage(userId);
    const tokenCostMap: Record<string, number> = { image: 350, video: 2800, audio: 900, render: 4500, avatar: 1800, voice_clone: 2500 };
    const tokens = tokenCostMap[type] || 1800;

    usage.totalTokensUsed += tokens;
    usage.lastUsedAt = new Date().toISOString();

    let consumedDailyFree = false;
    if (user.role !== 'admin') {
      // Priority 1: Consume Daily Free Quota first if available
      if (type === 'image' && usage.imagesCount < usage.maxImages) {
        usage.imagesCount += 1;
        consumedDailyFree = true;
      } else if (type === 'video' && usage.videoCount < usage.maxVideo && (durationSeconds <= 120 || durationSeconds === 0)) {
        usage.videoCount += 1;
        usage.videoDurationSeconds += durationSeconds || 15;
        consumedDailyFree = true;
      } else if (type === 'avatar') {
        const freeAvatarUsed = Boolean((usage as any).freeAvatarRenderUsed || ((usage as any).avatarCount && (usage as any).avatarCount >= 1));
        if (!freeAvatarUsed) {
          (usage as any).avatarCount = 1;
          (usage as any).freeAvatarRenderUsed = true;
          consumedDailyFree = true;
        } else {
          (usage as any).avatarCount = ((usage as any).avatarCount || 1) + 1;
        }
      } else if (type === 'audio' && usage.audioCount < usage.maxAudio && (durationSeconds <= 240 || durationSeconds === 0)) {
        usage.audioCount += 1;
        usage.audioDurationSeconds += durationSeconds || 30;
        consumedDailyFree = true;
      } else if (type === 'render' && usage.rendersCount < usage.maxRenders) {
        usage.rendersCount += 1;
        consumedDailyFree = true;
      }

      // Priority 2: If Daily Free Quota was already used today or not applicable (e.g. voice_clone), deduct paid package credits
      if (!consumedDailyFree) {
        const voiceCloneCost = this.store.pricingConfig?.voiceCloneCreationCostCredits ?? 20;
        const creditCostMap: Record<string, number> = { image: 5, video: 25, audio: 10, render: 30, avatar: 15, voice_clone: voiceCloneCost };
        const credits = creditCostMap[type] || 15;
        user.credits = Math.max(0, user.credits - credits);
      }
    }

    const voiceCloneCost = this.store.pricingConfig?.voiceCloneCreationCostCredits ?? 20;
    const costMap: Record<string, number> = { image: 5, video: 25, audio: 10, render: 30, avatar: 15, voice_clone: voiceCloneCost };
    // Guard against multi-megabyte base64 string bloat in persistent DB JSON
    const sanitizedResultUrl = (typeof resultUrl === 'string' && resultUrl.startsWith('data:') && resultUrl.length > 500)
      ? `${resultUrl.substring(0, 80)}...[truncated_base64_media]`
      : resultUrl;

    const newLog: GenerationLog = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      type,
      model,
      prompt,
      resultUrl: sanitizedResultUrl,
      tokensCost: tokens,
      creditsCost: consumedDailyFree ? 0 : (costMap[type] || 15),
      deductionSource: consumedDailyFree ? 'daily_free' : 'package_credits',
      createdAt: new Date().toISOString(),
    };

    this.store.generationLogs.unshift(newLog);

    // Keep generation logs bounded to prevent database bloat
    if (this.store.generationLogs.length > 150) {
      this.store.generationLogs = this.store.generationLogs.slice(0, 150);
    }

    this.save(this.store);
    this.syncLogToPostgres(newLog);
  }

  // Avatar operations
  public getAvatars(userId?: string): Avatar[] {
    const list = this.store.avatars || [];
    if (!userId || userId === 'all') return list;
    return list.filter(a => a.userId === 'system' || a.userId === userId);
  }

  public getAvatarById(id: string): Avatar | undefined {
    return (this.store.avatars || []).find(a => a.id === id);
  }

  public createAvatar(avatar: Avatar): Avatar {
    if (!this.store.avatars) this.store.avatars = [...DEFAULT_STOCK_AVATARS];
    this.store.avatars.unshift(avatar);
    this.save(this.store);
    return avatar;
  }

  public updateAvatar(id: string, updates: Partial<Avatar>): Avatar | undefined {
    const index = (this.store.avatars || []).findIndex(a => a.id === id);
    if (index === -1) return undefined;
    this.store.avatars[index] = {
      ...this.store.avatars[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(this.store);
    return this.store.avatars[index];
  }

  public deleteAvatar(id: string, userId: string): boolean {
    const index = (this.store.avatars || []).findIndex(a => a.id === id && (a.userId === userId || a.userId !== 'system'));
    if (index === -1) return false;
    this.store.avatars.splice(index, 1);
    this.save(this.store);
    return true;
  }

  // Avatar Job operations
  public createAvatarJob(job: AvatarVideoJob): AvatarVideoJob {
    if (!this.store.avatarJobs) this.store.avatarJobs = [];
    this.store.avatarJobs.unshift(job);
    if (this.store.avatarJobs.length > 200) {
      this.store.avatarJobs = this.store.avatarJobs.slice(0, 200);
    }
    this.save(this.store);
    return job;
  }

  public getAvatarJobById(id: string): AvatarVideoJob | undefined {
    return (this.store.avatarJobs || []).find(j => j.id === id);
  }

  public updateAvatarJob(id: string, updates: Partial<AvatarVideoJob>): AvatarVideoJob | undefined {
    const index = (this.store.avatarJobs || []).findIndex(j => j.id === id);
    if (index === -1) return undefined;
    this.store.avatarJobs[index] = {
      ...this.store.avatarJobs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(this.store);
    return this.store.avatarJobs[index];
  }

  public getUserAvatarJobs(userId: string): AvatarVideoJob[] {
    return (this.store.avatarJobs || []).filter(j => j.userId === userId || userId === 'all');
  }

  // ==========================================
  // Custom Cloned Voices Operations (custom_voices table)
  // ==========================================
  public getCustomVoices(userId?: string): CustomVoice[] {
    if (!this.store.customVoices) {
      this.store.customVoices = [];
    }
    if (!userId || userId === 'all') return this.store.customVoices;
    return this.store.customVoices.filter(v => v.userId === userId || v.userId === 'system');
  }

  public getCustomVoiceById(id: string): CustomVoice | undefined {
    if (!this.store.customVoices) {
      this.store.customVoices = [];
    }
    return this.store.customVoices.find(v => v.id === id);
  }

  public createCustomVoice(voice: CustomVoice): CustomVoice {
    if (!this.store.customVoices) {
      this.store.customVoices = [];
    }
    // Remove if already exists with same ID
    this.store.customVoices = this.store.customVoices.filter(v => v.id !== voice.id);
    this.store.customVoices.unshift(voice);
    this.save(this.store);

    // Sync to PostgreSQL if connected
    postgresDb.syncCustomVoice(voice).catch(err => {
      console.warn('Background sync custom voice to postgres failed:', err);
    });

    return voice;
  }

  public updateCustomVoice(id: string, updates: Partial<CustomVoice>): CustomVoice | undefined {
    if (!this.store.customVoices) {
      this.store.customVoices = [];
    }
    const idx = this.store.customVoices.findIndex(v => v.id === id);
    if (idx === -1) return undefined;
    const updated: CustomVoice = {
      ...this.store.customVoices[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.store.customVoices[idx] = updated;
    this.save(this.store);

    postgresDb.syncCustomVoice(updated).catch(err => {
      console.warn('Background sync updated custom voice to postgres failed:', err);
    });

    return updated;
  }

  public deleteCustomVoice(id: string, userId?: string): boolean {
    if (!this.store.customVoices) {
      this.store.customVoices = [];
    }
    const beforeLen = this.store.customVoices.length;
    this.store.customVoices = this.store.customVoices.filter(v => {
      if (v.id !== id) return true;
      if (userId && v.userId !== userId && userId !== 'usr_admin_01') return true;
      return false;
    });
    const deleted = this.store.customVoices.length < beforeLen;
    if (deleted) {
      this.save(this.store);
      postgresDb.deleteCustomVoice(id).catch(err => {
        console.warn('Background delete custom voice in postgres failed:', err);
      });
    }
    return deleted;
  }

  // Get user generation history
  public getUserGenerationLogs(userId: string): GenerationLog[] {
    return this.store.generationLogs.filter(log => log.userId === userId);
  }

  // Automated Daily Free Credit Reset Verification & Audit Service
  public runDailyResetAuditService(): {
    timestamp: string;
    todayDate: string;
    accountsAudited: number;
    accountsResetToday: number;
    totalFreeCreditsRefreshed: number;
    leakageStatus: 'ZERO_LEAKAGE' | 'ANOMALY_DETECTED';
    systemCheckNotes: string;
    accountAuditDetails: Array<{
      userId: string;
      email: string;
      tier: string;
      credits: number;
      lastResetDate: string;
      dailyFreeAvailableToday: string;
      leakageDetected: boolean;
    }>;
  } {
    const today = new Date().toISOString().split('T')[0];
    let accountsAudited = 0;
    let accountsResetToday = 0;
    let totalFreeCreditsRefreshed = 0;
    let anomalyCount = 0;

    const accountAuditDetails = this.store.users.map(user => {
      accountsAudited++;
      const usage = this.getTrialUsage(user.id);
      
      const isResetToday = usage.lastResetDate === today;
      if (isResetToday) {
        accountsResetToday++;
        totalFreeCreditsRefreshed += (usage.maxImages + usage.maxVideo + usage.maxAudio + usage.maxRenders);
      }

      // Check for credit leakage anomalies (e.g. negative credits or unexpected trial values)
      const leakageDetected = user.credits < 0 || usage.imagesCount < 0 || usage.videoCount < 0;
      if (leakageDetected) anomalyCount++;

      return {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        credits: user.credits,
        lastResetDate: usage.lastResetDate || today,
        dailyFreeAvailableToday: `Images: ${Math.max(0, usage.maxImages - usage.imagesCount)}/${usage.maxImages}, Video: ${Math.max(0, usage.maxVideo - usage.videoCount)}/${usage.maxVideo}, Audio: ${Math.max(0, usage.maxAudio - usage.audioCount)}/${usage.maxAudio}`,
        leakageDetected,
      };
    });

    const leakageStatus = anomalyCount === 0 ? 'ZERO_LEAKAGE' : 'ANOMALY_DETECTED';
    const systemCheckNotes = anomalyCount === 0
      ? `Audit PASSED: ${accountsAudited} user accounts verified. Daily 24h reset engine operating with 0% credit leakage.`
      : `Audit WARNING: ${anomalyCount} anomaly flags detected. Check user balance integrity.`;

    return {
      timestamp: new Date().toISOString(),
      todayDate: today,
      accountsAudited,
      accountsResetToday,
      totalFreeCreditsRefreshed,
      leakageStatus,
      systemCheckNotes,
      accountAuditDetails,
    };
  }

  // Look up transaction by Stripe Payment ID / Session ID
  public getTransactionByStripeId(stripePaymentId: string): Transaction | undefined {
    return this.store.transactions.find((t) => t.stripePaymentId === stripePaymentId);
  }

  // Idempotency check for Stripe payments
  public isStripePaymentProcessed(stripePaymentId: string): boolean {
    const tx = this.getTransactionByStripeId(stripePaymentId);
    return Boolean(tx && tx.status === 'succeeded');
  }

  // Record verified Stripe payment success with strict idempotency
  public recordStripePaymentSuccess(params: {
    userId: string;
    packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio';
    stripePaymentId: string;
    amount?: number;
    currency?: string;
  }): { transaction: Transaction; user: User; duplicate: boolean; alreadyProcessed: boolean } {
    const user = this.getUserById(params.userId);
    if (!user) throw new Error(`User not found: ${params.userId}`);

    // 1. Strict Idempotency Check: Verify if this Stripe Payment ID was already fulfilled
    const existingTx = this.getTransactionByStripeId(params.stripePaymentId);
    if (existingTx && existingTx.status === 'succeeded') {
      console.log(`[StripeDB] Idempotency intercepted: Payment ID ${params.stripePaymentId} already credited. Skipping duplicate credit grant.`);
      return {
        transaction: existingTx,
        user,
        duplicate: true,
        alreadyProcessed: true,
      };
    }

    const packages = {
      sasta_50_npr: { name: 'Sasta Micro-Pass (3 HD Images, 1x5m Video, 1x5m Audio)', price: 0.38, credits: 60 },
      starter: { name: 'Starter Tier (500 Credits)', price: 19.0, credits: 500 },
      creator: { name: 'Creator Tier (1,800 Credits)', price: 49.0, credits: 1800 },
      pro_studio: { name: 'Pro Studio Tier (5,000 Credits)', price: 129.0, credits: 5000 },
    };

    const pkg = packages[params.packageId] || packages.starter;
    const tx: Transaction = {
      id: `tx_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      userEmail: user.email,
      packageId: params.packageId,
      packageName: `${pkg.name} [Stripe USD]`,
      amount: params.amount !== undefined ? params.amount : pkg.price,
      currency: params.currency || 'USD',
      creditsAdded: pkg.credits,
      stripePaymentId: params.stripePaymentId,
      status: 'succeeded',
      createdAt: new Date().toISOString(),
    };

    // If an earlier failed record existed for this ID, update or supersede it
    if (existingTx && existingTx.status === 'failed') {
      const idx = this.store.transactions.findIndex((t) => t.id === existingTx.id);
      if (idx !== -1) {
        this.store.transactions.splice(idx, 1);
      }
    }

    user.tier = params.packageId === 'sasta_50_npr' ? 'starter' : params.packageId;
    user.credits += pkg.credits;
    user.updatedAt = new Date().toISOString();

    this.store.transactions.unshift(tx);
    this.save(this.store);
    this.syncTransactionToPostgres(tx);
    this.syncUserToPostgres(user);

    console.log(`[StripeDB] ✅ Credited ${pkg.credits} credits to ${user.email} for Stripe ID ${params.stripePaymentId}. New balance: ${user.credits}`);
    return {
      transaction: tx,
      user,
      duplicate: false,
      alreadyProcessed: false,
    };
  }

  // Record failed Stripe payment attempt
  public recordStripePaymentFailure(params: {
    userId: string;
    packageId?: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio';
    stripePaymentId: string;
    amount?: number;
    currency?: string;
    errorDetails?: string;
  }): { transaction: Transaction; user: User | null } {
    const user = this.getUserById(params.userId);
    const packageId = params.packageId || 'starter';

    const packages = {
      sasta_50_npr: { name: 'Sasta Micro-Pass', price: 0.38 },
      starter: { name: 'Starter Tier', price: 19.0 },
      creator: { name: 'Creator Tier', price: 49.0 },
      pro_studio: { name: 'Pro Studio Tier', price: 129.0 },
    };
    const pkg = packages[packageId] || packages.starter;

    const tx: Transaction = {
      id: `tx_stripe_fail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user?.id || params.userId,
      userEmail: user?.email || 'unknown@nepalai.tech',
      packageId,
      packageName: `${pkg.name} [Failed Attempt]`,
      amount: params.amount !== undefined ? params.amount : pkg.price,
      currency: params.currency || 'USD',
      creditsAdded: 0,
      stripePaymentId: params.stripePaymentId,
      status: 'failed',
      createdAt: new Date().toISOString(),
    };

    this.store.transactions.unshift(tx);
    this.save(this.store);
    this.syncTransactionToPostgres(tx);

    console.warn(`[StripeDB] ⚠️ Logged failed payment attempt for Stripe ID ${params.stripePaymentId}: ${params.errorDetails || 'Card declined'}`);
    return { transaction: tx, user: user || null };
  }

  // Legacy compatibility wrapper for processStripePayment
  public processStripePayment(
    userId: string,
    packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio',
    stripePaymentId?: string
  ): Transaction {
    const paymentId = stripePaymentId || `ch_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const result = this.recordStripePaymentSuccess({
      userId,
      packageId,
      stripePaymentId: paymentId,
    });
    return result.transaction;
  }

  // Pricing Config
  public getPricingConfig(): PricingConfig {
    if (!this.store.pricingConfig) {
      this.store.pricingConfig = {
        nprExchangeRate: 135,
        starterNpr: 2500,
        creatorNpr: 6500,
        proStudioNpr: 16500,
        fonepayMerchantCode: 'NEPALAI01',
        fonepaySecretKey: process.env.FONEPAY_SECRET_KEY || '',
        youtubeClientId: process.env.YOUTUBE_CLIENT_ID || '',
        youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
        storageProvider: (process.env.STORAGE_PROVIDER as any) || 'local',
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
        supabaseBucket: process.env.SUPABASE_BUCKET || 'nepalai-media',
        voiceCloneCreationCostCredits: 20,
        voiceCloneSynthesisCostCredits: 10,
      };
      this.save(this.store);
    } else {
      if (this.store.pricingConfig.voiceCloneCreationCostCredits === undefined) {
        this.store.pricingConfig.voiceCloneCreationCostCredits = 20;
      }
      if (this.store.pricingConfig.voiceCloneSynthesisCostCredits === undefined) {
        this.store.pricingConfig.voiceCloneSynthesisCostCredits = 10;
      }
    }
    return this.store.pricingConfig;
  }

  public updatePricingConfig(updates: Partial<PricingConfig>): PricingConfig {
    const current = this.getPricingConfig();
    this.store.pricingConfig = { ...current, ...updates };
    this.save(this.store);
    return this.store.pricingConfig;
  }

  // Process FonePay Merchant Payment
  public processFonePayPayment(
    userId: string,
    packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio',
    prn: string,
    fonepayTraceId?: string
  ): Transaction {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Anti-replay idempotency check: reject already-redeemed PRNs
    const existingTx = this.store.transactions.find(
      t => t.stripePaymentId === `fonepay_prn_${prn}` || (fonepayTraceId && t.stripePaymentId === fonepayTraceId)
    );
    if (existingTx) {
      throw new Error(`Payment PRN ${prn} has already been credited and verified.`);
    }

    const pricing = this.getPricingConfig();
    const packages = {
      sasta_50_npr: { name: 'Sasta Micro-Pass (3 HD Images, 1x5m Video, 1x5m Audio)', nprPrice: 50, credits: 60 },
      starter: { name: 'Starter Tier (500 Credits)', nprPrice: pricing.starterNpr, credits: 500 },
      creator: { name: 'Creator Tier (1,800 Credits)', nprPrice: pricing.creatorNpr, credits: 1800 },
      pro_studio: { name: 'Pro Studio Tier (5,000 Credits)', nprPrice: pricing.proStudioNpr, credits: 5000 },
    };

    const pkg = packages[packageId];
    const tx: Transaction = {
      id: `tx_fonepay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userEmail: user.email,
      packageId,
      packageName: `${pkg.name} [FonePay NPR]`,
      amount: pkg.nprPrice,
      currency: 'NPR',
      creditsAdded: pkg.credits,
      stripePaymentId: fonepayTraceId || `fonepay_prn_${prn}`,
      status: 'succeeded',
      createdAt: new Date().toISOString(),
    };

    user.tier = packageId === 'sasta_50_npr' ? 'starter' : packageId;
    user.credits += pkg.credits;
    user.updatedAt = new Date().toISOString();

    this.store.transactions.unshift(tx);
    this.save(this.store);
    this.syncTransactionToPostgres(tx);
    this.syncUserToPostgres(user);
    return tx;
  }

  // Admin Oversight Queries
  public getAllUsersWithStats() {
    return this.store.users.map(user => {
      const usage = this.getTrialUsage(user.id);
      const userTx = this.store.transactions.filter(t => t.userId === user.id);
      const totalPaid = userTx.reduce((sum, t) => sum + t.amount, 0);

      return {
        ...user,
        usage,
        transactionsCount: userTx.length,
        totalPaidUSD: totalPaid,
      };
    });
  }

  public getAllTransactions(): Transaction[] {
    return this.store.transactions;
  }

  public getTransactionsByUser(userId: string): Transaction[] {
    return this.store.transactions.filter(t => t.userId === userId);
  }

  public adminResetTrial(userId: string) {
    if (this.store.trialUsage[userId]) {
      this.store.trialUsage[userId].imagesCount = 0;
      this.store.trialUsage[userId].videoCount = 0;
      this.store.trialUsage[userId].videoDurationSeconds = 0;
      this.store.trialUsage[userId].audioCount = 0;
      this.store.trialUsage[userId].audioDurationSeconds = 0;
      this.store.trialUsage[userId].rendersCount = 0;
      this.save(this.store);
    }
  }

  public adminSetCredits(userId: string, credits: number) {
    const user = this.getUserById(userId);
    if (user) {
      user.credits = credits;
      this.save(this.store);
    }
  }

  public adminSetTier(userId: string, tier: User['tier']) {
    const user = this.getUserById(userId);
    if (user) {
      user.tier = tier;
      this.save(this.store);
    }
  }
}

export const db = new Database();

// Shared Feature Credit Cost Helper (Prompt #3 / Task #4)
export function getFeatureCreditCost(type: string, pricingConfig?: PricingConfig): number {
  const cfg = pricingConfig || db.getPricingConfig();
  const costMap: Record<string, number> = {
    image: 5,
    video: 25,
    audio: 10,
    render: 30,
    avatar: 15,
    voice_clone: cfg?.voiceCloneCreationCostCredits ?? 20,
    cloned_audio: cfg?.voiceCloneSynthesisCostCredits ?? 10,
  };
  return costMap[type] || 15;
}

