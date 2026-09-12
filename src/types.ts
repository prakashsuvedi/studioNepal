export type StudioTab = 
  | 'landing'
  | 'hamro_ai'
  | 'dashboard'
  | 'video_studio'
  | 'image_studio'
  | 'sora_studio'
  | 'character_studio'
  | 'ad_builder'
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
  imageUrl?: string;
  imageMetadata?: {
    model?: string;
    resolution?: string;
    engine?: string;
  };
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
  | 'fade_to_black'
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
  badgeColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  textColor?: string;
  speedPx?: number;
  backgroundStyle?: 'solid' | 'glass' | 'gradient' | 'neon';
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
  assetId?: string; // Stable reference to MediaItem id in persistent MediaLibrary
  title: string;
  duration: number; // in seconds (e.g. 3, 4, 5)
  startTime?: number; // timeline start offset in seconds
  sourceStart?: number; // media source offset in seconds (default 0)
  sourceDuration?: number; // media source duration in seconds
  playbackRate?: number; // playback rate multiplier (default 1)
  prompt: string;
  promptNepali?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  speed?: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  motion: CameraMotion;
  transition: TransitionType;
  transitionDuration?: number; // duration of transition to next scene in seconds (default 0.8s)
  textOverlay: string;
  textNepali?: string;
  textPosition: 'bottom' | 'center' | 'top' | 'lower_third' | 'bottom_lifted';
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
  isMuted?: boolean; // mute clip audio
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

export type FrameOverlayType = 'none' | 'letterbox_cinematic' | 'academy_4_3' | 'safe_zone_9_16' | 'vintage_border';

export interface VfxConfig {
  filmGrain: boolean;
  filmGrainIntensity?: number; // 0.1 to 1.0
  lightLeaks: boolean;
  rgbGlitch: boolean;
  vignette: boolean;
  goldenHour: boolean;
  dreamyGlow: boolean;
  frameType: FrameOverlayType;
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
  tier?: 'standard' | 'premium';
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

// ==========================================
// MODULE 1: Character Consistency & Biometrics
// ==========================================
export interface BiometricParameters {
  // Facial Angles
  pitchAngle: number; // -45 to +45 deg (up/down)
  yawAngle: number;   // -45 to +45 deg (left/right profile)
  rollAngle: number;  // -30 to +30 deg (tilt)
  
  // Eye Structure
  eyeShape: 'almond' | 'round' | 'hooded' | 'monolid' | 'deep_set' | 'upturned';
  eyeColor: 'deep_brown' | 'amber' | 'hazel' | 'emerald_green' | 'ice_blue' | 'charcoal';
  interpupillaryDistance: number; // 0.8 to 1.3 (spacing ratio)
  eyebrowArch: 'soft_curve' | 'high_arch' | 'straight' | 'feathered' | 'bold_defined';

  // Nose Structure
  noseBridgeHeight: number; // 0.7 to 1.4
  noseTipAngle: 'upturned' | 'straight' | 'button' | 'aquiline' | 'refined';
  alarBaseWidth: number;   // 0.8 to 1.3 (nostril width ratio)

  // Ears & Cranial Gaps
  earPlacementRatio: number; // 0.85 to 1.15 (ear-to-nose vertical gap)
  earLobeType: 'attached' | 'free' | 'prominent';

  // Hair & Facial Contours
  hairStyle: 'slicked_back' | 'wavy_shoulder' | 'buzz_cut' | 'layered_fringe' | 'classic_part' | 'curly_afro' | 'top_knot' | 'traditional_dhaka_topi';
  hairColor: 'jet_black' | 'dark_espresso' | 'chestnut_brown' | 'silver_slate' | 'golden_amber';
  hairlineHeight: number; // 0.8 to 1.2
  
  // Jawline, Chin & Cheeks
  jawlineAngle: number; // 90 to 135 deg (sharp vs soft)
  chinProminence: 'pointed' | 'square' | 'cleft' | 'rounded' | 'dimpled';
  cheekboneProminence: number; // 0.8 to 1.4 (high vs flat)
  neckLengthRatio: number; // 0.85 to 1.2

  // Mouth & Lips
  lipFullness: 'plump' | 'medium' | 'thin_refined' | 'cupid_bow';
  philtrumDepth: number; // 0.7 to 1.3 (nose-to-lip gap)
  expression: 'neutral_calm' | 'confident_smile' | 'thoughtful_focused' | 'charismatic_speaking' | 'heroic_serious';
}

export interface CharacterAvatar {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'non_binary';
  ageRange: 'early_20s' | 'mid_20s' | 'early_30s' | 'mid_40s' | 'elder_wise';
  ethnicityStyle: 'nepali_pahadi' | 'nepali_newari' | 'nepali_madhesi' | 'himalayan_sherpa' | 'south_asian' | 'east_asian' | 'caucasian' | 'global_hybrid';
  avatarImageUrl: string;
  referenceImages: string[];
  biometricAnchorToken: string; // e.g. [FaceID-Lock#0948-Maya]
  biometricParams: BiometricParameters;
  promptDescriptor: string;
  createdAt: string;
  scenesCountUsed?: number;
  isLocked: boolean;
}

// ==========================================
// MODULE 2: Sora-2 Script-to-Scene 12s Pipeline
// ==========================================
export type AudioRoutingOption = 
  | 'sync_ai_audio'    // Sora-2 Native synchronous neural audio & environment soundscape
  | 'layered_voiceover' // Silent video + SpeechT5 / Azure Neural Voiceover + BGM track
  | 'silent_broll';     // Pure visual B-roll for custom editing

export interface ScriptSceneInterval {
  sceneIndex: number;
  intervalRange: string; // e.g. "0:00 - 0:12"
  durationSeconds: 12;   // locked 12s interval
  synopsis: string;
  visualPrompt: string;
  visualPromptNepali?: string;
  cinematicCamera: CameraMotion;
  cameraMovementDetail: string; // e.g. "Anamorphic 35mm f/1.8 dolly-in with warm rim lighting"
  voiceoverDialogue: string;
  voiceoverNepali?: string;
  onscreenCaption: string;
  audioRouting: AudioRoutingOption;
  bgmGenreSuggested?: string;
  lightingStyle: 'golden_hour' | 'neon_cyber' | 'himalayan_mist' | 'studio_softbox' | 'dramatic_chiaroscuro';
  generatedMediaUrl?: string;
  jobId?: string;
  status: 'idle' | 'generating' | 'ready' | 'error';
}

export interface ScriptDecompositionResult {
  title: string;
  totalDurationSeconds: number;
  scenesCount: number;
  coreHook: string;
  callToAction: string;
  scenes: ScriptSceneInterval[];
}

// ==========================================
// MODULE 3: Pro-Grade NLE Studio Tools
// ==========================================
export interface BackgroundRemovalOptions {
  mode: 'transparent_png' | 'green_screen' | 'custom_color' | 'ai_depth_blur';
  customColorHex?: string;
  featherRadius: number; // 0 to 10
  edgeSmoothness: number; // 0 to 10
}

export interface SmartCropConfig {
  targetAspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
  focalTracking: 'auto_face' | 'action_center' | 'rule_of_thirds' | 'custom_box';
  focalPointX: number; // 0 to 100%
  focalPointY: number; // 0 to 100%
}

export interface UpscaleQualityConfig {
  targetResolution: '1080p_hdr' | '2k_super_res' | '4k_ultra_master';
  sharpening: number; // 0 to 100
  denoiseStrength: number; // 0 to 100
  colorVibranceBoost: boolean;
  frameStabilization: boolean;
}

// ==========================================
// MODULE 4: Automated Ad & Template Builder
// ==========================================
export type AdCategoryPreset = 
  | 'tech_product_launch'
  | 'food_hospitality'
  | 'ecommerce_flash_sale'
  | 'podcast_reel_highlight'
  | 'real_estate_luxury'
  | 'tourism_himalaya'
  | 'freelance_agency_pitch'
  | 'local_business_lead';

export interface BrandAdSpec {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  topicHook: string;
  coreValueProp: string;
  callToActionText: string;
  callToActionUrl?: string;
  targetPlatform: 'instagram_reels' | 'youtube_shorts' | 'tiktok' | 'facebook_ad' | 'pinterest_pin';
  categoryPreset: AdCategoryPreset;
  language: 'en' | 'ne' | 'hi';
}

export interface BrandAdScene {
  order: number;
  sceneTitle: string;
  durationSeconds: number;
  visualPrompt: string;
  scriptVoiceover: string;
  headlineOverlay: string;
  captionSubtext: string;
  brandBadgeStyle: 'floating_pill' | 'corner_stamp' | 'lower_third_bar' | 'full_end_card';
  suggestedTransition: TransitionType;
}

export interface BrandAdStoryboard {
  id: string;
  brandSpec: BrandAdSpec;
  totalDurationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  musicTrackTitle: string;
  scenes: BrandAdScene[];
  createdAt: string;
}

// ==========================================
// MODULE 5: Stock Assets & Social Publishing
// ==========================================
export interface UnsplashStockPhoto {
  id: string;
  title: string;
  description?: string;
  thumbUrl: string;
  fullUrl: string;
  downloadUrl: string;
  authorName: string;
  authorUrl: string;
  aspectRatio: 'landscape' | 'portrait' | 'square';
  tags: string[];
}

export interface SocialPublishPayload {
  platforms: ('youtube' | 'instagram' | 'facebook' | 'pinterest' | 'tiktok' | 'x')[];
  title: string;
  description: string;
  tags: string[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  mediaUrl: string;
  thumbnailUrl?: string;
  scheduledTime?: string; // ISO format or 'immediate'
  pinBoardId?: string;    // Pinterest specific
  instagramPlacement?: 'reels' | 'feed' | 'story';
  facebookPageId?: string;
  youtubePrivacy?: 'public' | 'unlisted' | 'private';
}

export interface PlatformPostResult {
  platform: string;
  status: 'published' | 'scheduled' | 'error';
  postUrl?: string;
  postId?: string;
  message?: string;
}

