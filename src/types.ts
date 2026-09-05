export type StudioTab = 
  | 'landing'
  | 'hamro_ai'
  | 'dashboard'
  | 'video_studio'
  | 'image_studio'
  | 'sora_studio'
  | 'tts_studio'
  | 'admin'
  | 'audit'
  | 'hf_deployment_kit'
  | 'faq'
  | 'about'
  | 'privacy'
  | 'contact';


export type HamroAiModel = 'gpt-4o' | 'gpt-5-mini';
export type HamroAiLanguage = 'ne' | 'hi' | 'en' | 'auto';

export interface HamroChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: HamroAiModel;
  language?: HamroAiLanguage;
  tokens?: number;
}

export interface HamroPromptTemplate {
  id: string;
  title: string;
  titleNe?: string;
  titleHi?: string;
  category: 
    | 'Content Writing' 
    | 'Business & Marketing' 
    | 'Nepali Law & Govt' 
    | 'Creative & Scriptwriting' 
    | 'Education & Academic' 
    | 'Coding & Tech' 
    | 'Social Media' 
    | 'Translation';
  description: string;
  language: 'ne' | 'hi' | 'en' | 'all';
  prompt: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  tier: 'free_trial' | 'starter' | 'creator' | 'pro_studio';
  credits: number;
}

export interface UserTrialQuota {
  userId: string;
  imagesCount: number;
  maxImages: number;
  videoCount: number;
  maxVideo: number;
  videoDurationSeconds: number;
  audioCount: number;
  maxAudio: number;
  audioDurationSeconds: number;
  rendersCount: number;
  maxRenders: number;
  totalTokensUsed: number;
  lastUsedAt: string;
  lastResetDate?: string;
  lastResetAt?: string;
}

export interface StripeTransactionItem {
  id: string;
  userId: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  amount: number;
  currency: string;
  creditsAdded: number;
  stripePaymentId: string;
  status: string;
  createdAt: string;
}

export type WorkflowStep = 'story' | 'polish' | 'export';

export type CameraMotion = 
  | 'static' 
  | 'pan_left' 
  | 'pan_right' 
  | 'zoom_in' 
  | 'zoom_out' 
  | 'dolly' 
  | 'orbit';

export type TransitionType = 
  | 'cut' 
  | 'fade' 
  | 'dissolve' 
  | 'wipe_left' 
  | 'wipe_right'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'slide_down'
  | 'zoom_in'
  | 'zoom_out'
  | 'flash_white'
  | 'blur_dissolve';

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // in seconds, e.g. 0.8
  easing?: 'linear' | 'ease-in-out' | 'ease-out';
}

export type ColorFilter = 
  | 'none' 
  | 'cinematic' 
  | 'warm' 
  | 'cool' 
  | 'vintage' 
  | 'vibrant';

export interface BrandOverlayConfig {
  enabled: boolean;
  logoUrl: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  scalePercent: number; // 5 to 50
  opacityPercent: number; // 10 to 100
  marginPx?: number;
  brandText?: string;
  showBrandText?: boolean;
}

export type TextStylePreset = 
  | 'default'
  | 'lower_third'
  | 'neon_glow'
  | 'gold_gradient'
  | 'devanagari_bold'
  | 'impact_caption'
  | 'minimal_serif'
  | 'glass_pill'
  | 'retro_crt';

export type TextAnimationOption = 
  | 'none'
  | 'typewriter'
  | 'fade_in'
  | 'slide_up'
  | 'bounce'
  | 'zoom_pop'
  | 'glitch'
  | 'wave_float'
  | 'kinetic_bounce'
  | 'kinetic_3d_zoom'
  | 'kinetic_glitch_split'
  | 'kinetic_stagger_slide'
  | 'kinetic_neon_pulse';

export interface KineticTypographyConfig {
  preset: 'kinetic_bounce' | 'kinetic_3d_zoom' | 'kinetic_glitch_split' | 'kinetic_stagger_slide' | 'kinetic_neon_pulse' | 'kinetic_typewriter';
  primaryText: string;
  secondaryTextNepali?: string;
  fontSize: number; // e.g. 28 to 72
  letterSpacing?: number; // e.g. 0 to 10
  glowColor?: string;
  shadowBlur?: number;
  strokeWidth?: number;
  strokeColor?: string;
  layersCount?: number;
  animationSpeed?: number; // 0.5 to 2.0
}

export interface TimelineValidationReport {
  isValid: boolean;
  targetDuration: number;
  actualDuration: number;
  durationMatch: boolean;
  errors: string[];
  warnings: string[];
  missingAssets: string[];
  audioOverrun: boolean;
  totalAssetsCount: number;
  sceneCount: number;
  audioTrackCount: number;
}

export interface TickerConfig {
  enabled: boolean;
  text: string;
  textNepali?: string;
  style: 'breaking_red' | 'gold_luxury' | 'neon_cyber' | 'nepal_heritage' | 'glass_modern';
  speed: 'slow' | 'medium' | 'fast';
  position: 'bottom' | 'top';
  badgeText?: string;
}

export interface SceneWatermark {
  assetId: string;
  name: string;
  url: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  opacity: number; // 0.1 to 1.0
  scale: number; // 0.1 to 0.5
}

export interface ColorAdjustments {
  exposure?: number; // -100 to +100
  colorTemp?: number; // -100 (cool) to +100 (warm)
  contrast?: number; // -100 to +100
  saturation?: number; // -100 to +100
  brightness?: number; // -100 to +100
  tint?: number; // -100 to +100
}

export interface SavedSceneTemplate {
  id: string;
  name: string;
  category: string;
  savedAt: string;
  sceneData: Omit<Scene, 'id'>;
}

export interface Scene {
  id: string;
  title: string;
  duration: number; // in seconds (e.g. 3, 4, 5)
  prompt: string;
  promptNepali?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  aspectRatio: '16:9' | '9:16' | '1:1';
  motion: CameraMotion;
  transition: TransitionType;
  transitionDuration?: number; // duration of transition to next scene in seconds (default 0.8s)
  textOverlay: string;
  textNepali?: string;
  textPosition: 'bottom' | 'center' | 'top' | 'lower_third';
  textColor: string;
  textFont: 'sans' | 'devanagari' | 'mono';
  textStyle?: TextStylePreset;
  textAnimation?: TextAnimationOption;
  kineticConfig?: KineticTypographyConfig;
  tickerConfig?: TickerConfig;
  brandLogo?: SceneWatermark;
  filter: ColorFilter;
  colorAdjustments?: ColorAdjustments;
  volume: number; // 0 - 100
  watermark?: SceneWatermark;
  colorTag?: 'b_roll' | 'a_roll' | 'ai_gen' | 'interview' | 'bramhanand' | 'custom';
  tagColor?: string; // hex color or tailwind badge color
  notes?: string; // production notes & instructions
  tags?: string[]; // batch tags e.g. ['Draft', 'Needs Review', 'Final']
  scriptText?: string;
  narrationVoice?: string;
  devanagariSubtitle?: string;
}

export interface RenderQueueItem {
  id: string;
  projectId?: string;
  title: string;
  type: 'project' | 'scene_batch' | 'single_scene';
  scenesCount: number;
  totalDuration: number;
  resolution: '1080p' | '4k' | '720p';
  aspectRatio: '16:9' | '9:16' | '1:1';
  status: 'pending' | 'rendering' | 'completed' | 'failed' | 'paused';
  progress: number; // 0 - 100
  stepDescription?: string;
  createdAt: number;
  completedAt?: number;
  downloadUrl?: string;
  thumbnailUrl?: string;
  fileSizeMb?: number;
  error?: string;
  sceneIds?: string[];
}

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  summary: string;
  visualPrompt: string;
  cameraMotion: CameraMotion;
  suggestedTransition: TransitionType;
  estimatedDuration: number;
  voiceoverDialogue: string;
  voiceoverNepali?: string;
  textOverlay: string;
}

export type ThemeMode = 'dark' | 'light';

export interface BrandAsset {
  id: string;
  name: string;
  category: 'watermark' | 'logo' | 'badge' | 'devanagari' | 'stamp';
  url: string;
  isCustom?: boolean;
  aspectRatio?: string;
  defaultPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  createdAt?: string;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  color?: string;
  projectCount?: number;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'reviewer';
  status: 'active' | 'invited';
  lastActive?: string;
}

export interface StudioWorkspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  folders: WorkspaceFolder[];
  members: WorkspaceMember[];
  isDefault?: boolean;
  createdAt: string;
}

export interface KeyboardShortcutItem {
  key: string;
  label: string;
  action: string;
  category: 'Playback' | 'Timeline & Editing' | 'Project & System' | 'Navigation';
}

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  duration: number;
  volume: number;
  genre?: string;
  startTime?: number;
  type?: 'bgm' | 'sfx' | 'voiceover';
}

export interface GenerationJob {
  id: string;
  type: 'image' | 'video' | 'tts';
  prompt: string;
  model: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
  timestamp: number;
  durationSeconds?: number;
}

export interface StarterTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  scenesCount: number;
  totalDuration: number;
  scenes: Omit<Scene, 'id'>[];
}

export interface AdminSettings {
  isAdmin: boolean;
  adminPassword: string;
  bypassControlledMode: boolean;
  azureEndpoint: string;
  azureApiKey: string;
  azureImageDeployment: string;
  azureSoraDeployment: string;
  azureLocation: string;
  azureProjectId: string;
  hfBackendUrl: string;
  hfToken: string;
  creditsRemaining: number;
}

export interface UserGenerationTaskLog {
  id: string;
  userId: string;
  type: 'image' | 'video' | 'audio' | 'render';
  model: string;
  prompt: string;
  resultUrl: string;
  tokensCost: number;
  creditsCost: number;
  deductionSource: 'daily_free' | 'package_credits';
  createdAt: string;
}

export interface DailyResetAuditLog {
  id: string;
  timestamp: string;
  date: string;
  accountsAudited: number;
  accountsReset: number;
  totalFreeCreditsRefreshed: number;
  leakageStatus: 'ZERO_LEAKAGE' | 'ANOMALY_DETECTED';
  systemCheckNotes: string;
}

export interface RouteAuditStatus {
  route: string;
  method: 'GET' | 'POST';
  status: 'operational' | 'degraded' | 'broken_upstream' | 'fixed_locally';
  reportedErrorCode?: string;
  rootCause: string;
  solution: string;
}
