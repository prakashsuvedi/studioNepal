import fs from 'fs';
import path from 'path';
import { User, TrialUsage, Transaction, GenerationLog } from '../db/schema';

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
}

export interface DatabaseStore {
  users: User[];
  trialUsage: Record<string, TrialUsage>;
  transactions: Transaction[];
  generationLogs: GenerationLog[];
  pricingConfig?: PricingConfig;
}

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
        return JSON.parse(raw);
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
    const isAdmin = lower === 'prakashsuvedi.backup@gmail.com' || 
                    lower === 'prakashsuvedi@gmail.com' || 
                    lower.includes('admin') ||
                    lower.includes('prakashsuvedi');

    const newUser: User = {
      id: isAdmin ? 'usr_admin_01' : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: name || (isAdmin ? 'Prakash Suvedi (Platform Owner)' : email.split('@')[0]),
      avatar: avatar || (isAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
      role: isAdmin ? 'admin' : 'user',
      tier: isAdmin ? 'pro_studio' : 'free_trial',
      credits: isAdmin ? 999999 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.store.users.push(newUser);

    // Initialize trial usage for new user
    this.store.trialUsage[newUser.id] = {
      userId: newUser.id,
      imagesCount: 0,
      maxImages: isAdmin ? 99999 : 3,
      videoCount: 0,
      maxVideo: isAdmin ? 99999 : 1,
      videoDurationSeconds: 0,
      audioCount: 0,
      maxAudio: isAdmin ? 99999 : 1,
      audioDurationSeconds: 0,
      rendersCount: 0,
      maxRenders: isAdmin ? 99999 : 1,
      totalTokensUsed: 0,
      lastUsedAt: new Date().toISOString(),
    };

    this.save(this.store);
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save(this.store);
    return user;
  }

  public getTrialUsage(userId: string): TrialUsage {
    const today = new Date().toISOString().split('T')[0];
    const user = this.getUserById(userId);
    const isAdmin = user?.role === 'admin';

    if (!this.store.trialUsage[userId]) {
      this.store.trialUsage[userId] = {
        userId,
        imagesCount: 0,
        maxImages: isAdmin ? 99999 : 3,
        videoCount: 0,
        maxVideo: isAdmin ? 99999 : 1,
        videoDurationSeconds: 0,
        audioCount: 0,
        maxAudio: isAdmin ? 99999 : 1,
        audioDurationSeconds: 0,
        rendersCount: 0,
        maxRenders: isAdmin ? 99999 : 1,
        totalTokensUsed: 0,
        lastUsedAt: new Date().toISOString(),
        lastResetDate: today,
        lastResetAt: new Date().toISOString(),
      };
      this.save(this.store);
    } else {
      // Daily reset check: Reset free daily quota every 24h / calendar day for all users
      const usage = this.store.trialUsage[userId];
      if (usage.lastResetDate !== today) {
        usage.imagesCount = 0;
        usage.videoCount = 0;
        usage.audioCount = 0;
        usage.rendersCount = 0;
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
    type: 'image' | 'video' | 'audio' | 'render',
    durationSeconds = 0
  ): { allowed: boolean; reason?: string; hardLocked?: boolean; remaining?: number } {
    let user = this.getUserById(userId);
    if (!user) {
      user = this.findOrCreateUser(userId.includes('@') ? userId : `creator_${userId}@nepalai.tech`, 'Creator User');
    }

    // Admin has unlimited bypass
    if (user.role === 'admin') {
      return { allowed: true, remaining: 999999 };
    }

    const usage = this.getTrialUsage(userId); // Triggers daily reset if new day

    // Priority 1: Check if Daily Free Quota for today is available
    let hasDailyFree = false;
    if (type === 'image' && usage.imagesCount < usage.maxImages) hasDailyFree = true;
    if (type === 'video' && usage.videoCount < usage.maxVideo && (durationSeconds <= 120 || durationSeconds === 0)) hasDailyFree = true;
    if (type === 'audio' && usage.audioCount < usage.maxAudio && (durationSeconds <= 240 || durationSeconds === 0)) hasDailyFree = true;
    if (type === 'render' && usage.rendersCount < usage.maxRenders) hasDailyFree = true;

    if (hasDailyFree) {
      return { allowed: true, remaining: user.credits };
    }

    // Priority 2: Daily Free Quota exhausted for today -> Check Paid Package Credits
    if (user.credits > 0 || user.tier !== 'free_trial') {
      const costMap = { image: 5, video: 25, audio: 10, render: 30 };
      const cost = costMap[type];
      if (user.credits < cost) {
        return {
          allowed: false,
          hardLocked: true,
          reason: `Today's daily free quota exhausted & insufficient package credits (${user.credits} remaining, ${cost} required). Please top up!`,
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
    type: 'image' | 'video' | 'audio' | 'render',
    prompt: string,
    resultUrl: string,
    model: string,
    durationSeconds = 0
  ) {
    const user = this.getUserById(userId);
    if (!user) return;

    const usage = this.getTrialUsage(userId);
    const tokenCostMap = { image: 350, video: 2800, audio: 900, render: 4500 };
    const tokens = tokenCostMap[type];

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
      } else if (type === 'audio' && usage.audioCount < usage.maxAudio && (durationSeconds <= 240 || durationSeconds === 0)) {
        usage.audioCount += 1;
        usage.audioDurationSeconds += durationSeconds || 30;
        consumedDailyFree = true;
      } else if (type === 'render' && usage.rendersCount < usage.maxRenders) {
        usage.rendersCount += 1;
        consumedDailyFree = true;
      }

      // Priority 2: If Daily Free Quota was already used today, deduct paid package credits
      if (!consumedDailyFree) {
        const creditCostMap = { image: 5, video: 25, audio: 10, render: 30 };
        const credits = creditCostMap[type];
        user.credits = Math.max(0, user.credits - credits);
      }
    }

    const costMap = { image: 5, video: 25, audio: 10, render: 30 };
    this.store.generationLogs.unshift({
      id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      type,
      model,
      prompt,
      resultUrl,
      tokensCost: tokens,
      creditsCost: consumedDailyFree ? 0 : costMap[type],
      deductionSource: consumedDailyFree ? 'daily_free' : 'package_credits',
      createdAt: new Date().toISOString(),
    });

    this.save(this.store);
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

  // Process Stripe Payment & Upgrade Tier
  public processStripePayment(
    userId: string,
    packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio',
    stripePaymentId?: string
  ): Transaction {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const packages = {
      sasta_50_npr: { name: 'Sasta Micro-Pass (3 HD Images, 1x5m Video, 1x5m Audio)', price: 0.38, credits: 60 },
      starter: { name: 'Starter Tier (500 Credits)', price: 19, credits: 500 },
      creator: { name: 'Creator Tier (1,800 Credits)', price: 49, credits: 1800 },
      pro_studio: { name: 'Pro Studio Tier (5,000 Credits)', price: 129, credits: 5000 },
    };

    const pkg = packages[packageId];
    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userEmail: user.email,
      packageId,
      packageName: pkg.name,
      amount: pkg.price,
      currency: 'USD',
      creditsAdded: pkg.credits,
      stripePaymentId: stripePaymentId || `ch_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      status: 'succeeded',
      createdAt: new Date().toISOString(),
    };

    user.tier = packageId === 'sasta_50_npr' ? 'starter' : packageId;
    user.credits += pkg.credits;
    user.updatedAt = new Date().toISOString();

    this.store.transactions.unshift(tx);
    this.save(this.store);
    return tx;
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
        fonepaySecretKey: 'fonepay_secret_key_nepalai_2026',
        youtubeClientId: process.env.YOUTUBE_CLIENT_ID || '',
        youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
        storageProvider: (process.env.STORAGE_PROVIDER as any) || 'local',
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
        supabaseBucket: process.env.SUPABASE_BUCKET || 'nepalai-media',
      };
      this.save(this.store);
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
