import React, { useState, useEffect } from 'react';
import { StudioTab, Scene, UserSession, UserTrialQuota, StripeTransactionItem, AudioTrack } from './types';
import { INITIAL_SCENES, INITIAL_AUDIO_TRACKS } from './data';
import { SubtitleItem } from './components/SubtitleEditorModal';
import { Header } from './components/Header';
import { LandingPageView } from './components/LandingPageView';
import { AuditReportView } from './components/AuditReportView';
import { VideoStudioView } from './components/VideoStudioView';
import { ImageStudioView } from './components/ImageStudioView';
import { SoraStudioView } from './components/SoraStudioView';
import { VoiceStudioView } from './components/VoiceStudioView';
import { AvatarStudioView } from './components/AvatarStudioView';
import { HamroAiStudio } from './components/HamroAiStudio';
import { AdminDashboardView } from './components/AdminDashboardView';
import { HfDeploymentKitView } from './components/HfDeploymentKitView';
import { AuthModal } from './components/AuthModal';
import { PaywallModal } from './components/PaywallModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { WorkspacesModal, Workspace, DEFAULT_WORKSPACES } from './components/WorkspacesModal';
import { UsageHistoryModal } from './components/UsageHistoryModal';
import { PublicPagesView } from './components/PublicPagesView';
import { GlobalLoadingOverlay, GlobalLoadingState } from './components/GlobalLoadingOverlay';
import { MobileBottomNav } from './components/MobileBottomNav';
import { UserDashboardView } from './components/UserDashboardView';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { SystemFeedbackModal } from './components/SystemFeedbackModal';
import { ViralTemplate } from './data/viralTemplates';
import { NepalAiLogo } from './components/NepalAiLogo';

import { apiGetMe, apiLogout } from './lib/api';
import { authManager } from './lib/authManager';
import { purgeLegacyStorageUrls, sanitizeScenes } from './lib/mediaUrlSanitizer';
import { Lock, Sparkles, ShieldAlert, MessageSquare } from 'lucide-react';

export default function App() {
  // Navigation & studio state
  const [activeTab, setActiveTab] = useState<StudioTab>('landing');
  const [scenes, setScenes] = useState<Scene[]>(() => {
    try {
      const saved = localStorage.getItem('nepalai_video_project_autosave') || sessionStorage.getItem('nepalai_video_project_autosave');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.scenes && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
          return sanitizeScenes(parsed.scenes);
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate scenes from autosave:', e);
    }
    return sanitizeScenes(INITIAL_SCENES);
  });
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(() => {
    try {
      const saved = localStorage.getItem('nepalai_video_project_autosave') || sessionStorage.getItem('nepalai_video_project_autosave');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.audioTracks && Array.isArray(parsed.audioTracks) && parsed.audioTracks.length > 0) {
          return parsed.audioTracks;
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate audioTracks from autosave:', e);
    }
    return INITIAL_AUDIO_TRACKS;
  });
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>(() => {
    try {
      const saved = localStorage.getItem('nepalai_video_project_autosave') || sessionStorage.getItem('nepalai_video_project_autosave');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.subtitles && Array.isArray(parsed.subtitles)) {
          return parsed.subtitles;
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate subtitles from autosave:', e);
    }
    return [];
  });
  const [sharedVoiceText, setSharedVoiceText] = useState<string>('');
  const [sharedSoraPrompt, setSharedSoraPrompt] = useState<string>('');
  const [sharedImagePrompt, setSharedImagePrompt] = useState<string>('');

  // Onboarding Walkthrough Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

  // User Feedback, Feature Requests & Bug Reporting Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Authentication & Paywall states
  const [user, setUser] = useState<UserSession | null>(null);
  const [trialUsage, setTrialUsage] = useState<UserTrialQuota | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'user' | 'admin'>('user');
  
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>('');

  // Global Workspaces & Shortcuts & Usage History
  const [showGlobalShortcuts, setShowGlobalShortcuts] = useState(false);
  const [showGlobalWorkspaces, setShowGlobalWorkspaces] = useState(false);
  const [isUsageHistoryOpen, setIsUsageHistoryOpen] = useState(false);
  const [globalWorkspace, setGlobalWorkspace] = useState<Workspace>(() => {
    try {
      const saved = localStorage.getItem('nepalai_active_workspace_id');
      if (saved) {
        const found = DEFAULT_WORKSPACES.find(w => w.id === saved);
        if (found) return found;
      }
    } catch (e) {}
    return DEFAULT_WORKSPACES[0];
  });

  // Global Loading Overlay State
  const [globalLoading, setGlobalLoading] = useState<GlobalLoadingState>({
    active: false,
    title: '',
  });

  const handleStartGlobalLoading = (loading: {
    title: string;
    subtitle?: string;
    type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai';
    subState?: 'transcoding' | 'generating' | 'encoding' | 'compositing' | 'syncing' | 'audio_mix' | string;
    progress?: number;
    currentStage?: number;
    totalStages?: number;
    stageTitle?: string;
    stageDetails?: string;
    stagesList?: any[];
    characterLockToken?: string;
  }) => {
    setGlobalLoading({
      active: true,
      title: loading.title,
      subtitle: loading.subtitle,
      type: loading.type || 'general',
      subState: loading.subState,
      progress: loading.progress,
      currentStage: loading.currentStage,
      totalStages: loading.totalStages,
      stageTitle: loading.stageTitle,
      stageDetails: loading.stageDetails,
      stagesList: loading.stagesList,
      characterLockToken: loading.characterLockToken,
      onCancel: () => setGlobalLoading(prev => ({ ...prev, active: false })),
    });
  };

  const handleStopGlobalLoading = () => {
    setGlobalLoading(prev => ({ ...prev, active: false }));
  };

  // Initial user session restore & background auth listener
  useEffect(() => {
    // Purge any outdated external URLs from storage
    purgeLegacyStorageUrls();

    // Initialize AuthManager
    authManager.init();

    // Listen for genuine token expiration (not transient network blips)
    const unsubscribeAuthExpired = authManager.onAuthExpired((reason) => {
      console.warn('[App] Session expired or invalid, requesting sign in:', reason);
      setUser(null);
      setTrialUsage(null);
      setIsAuthOpen(true);
    });

    const savedUserId = authManager.getUserId();
    if (savedUserId) {
      apiGetMe(savedUserId)
        .then(data => {
          setUser(data.user);
          setTrialUsage(data.trialUsage);
        })
        .catch(() => {
          authManager.clearAuth(false);
          setUser(null);
          setTrialUsage(null);
          setActiveTab('landing');
        });
    } else {
      setUser(null);
      setTrialUsage(null);
      setActiveTab('landing');
    }

    return () => {
      unsubscribeAuthExpired();
    };
  }, []);

  const handleOpenAuth = (mode: 'user' | 'admin' = 'user') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (newUser: UserSession, newUsage: UserTrialQuota) => {
    setUser(newUser);
    setTrialUsage(newUsage);
    if (newUser.token) {
      authManager.saveToken(newUser.token, newUser.id);
    } else {
      authManager.saveToken(authManager.getToken() || '', newUser.id);
    }
    if (activeTab === 'landing') {
      setActiveTab('video_studio');
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    authManager.clearAuth(false);
    setUser(null);
    setTrialUsage(null);
    setActiveTab('landing');
  };

  const handleTriggerPaywall = (reason: string) => {
    setPaywallReason(reason);
    setIsPaywallOpen(true);
  };

  const handleUsageUpdated = (usage: UserTrialQuota, remainingCredits: number) => {
    setTrialUsage(usage);
    if (user) {
      setUser({ ...user, credits: remainingCredits });
    }
  };

  const handlePaymentSuccess = (updatedUser: UserSession, transaction: StripeTransactionItem) => {
    setUser(updatedUser);
  };

  // Add a generated scene to the video studio timeline
  const handleAddSceneToVideo = (newScene: Scene) => {
    setScenes(prev => [...prev, newScene]);
  };

  // Apply a pre-set Viral Storyboard Template into the video editor
  const handleApplyTemplate = (template: ViralTemplate) => {
    const newScenes: Scene[] = template.scenes.map((s, idx) => ({
      id: `scn_tmpl_${Date.now()}_${idx}`,
      prompt: s.prompt,
      duration: s.duration,
      title: s.title,
      mediaUrl: template.coverImage || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1280&q=80',
      mediaType: s.mediaType || 'image',
      aspectRatio: template.aspectRatio,
      motion: s.motion,
      transition: s.transition,
      textOverlay: s.textOverlay,
      textPosition: s.textPosition || 'lower_third',
      textColor: s.textColor || '#ffffff',
      textFont: 'devanagari',
      filter: 'none',
      volume: 85,
    }));

    setScenes(newScenes);

    // Create synchronized subtitle cues from storyboard texts
    let cumulativeSec = 0;
    const newSubs: SubtitleItem[] = template.scenes.map((s, idx) => {
      const start = cumulativeSec;
      const end = cumulativeSec + s.duration;
      cumulativeSec = end;
      return {
        id: `sub_tmpl_${Date.now()}_${idx}`,
        index: idx + 1,
        startTimeSec: start,
        endTimeSec: end,
        text: s.textOverlay,
        devanagariText: s.textOverlay,
      };
    });
    setSubtitles(newSubs);

    if (template.suggestedVoiceover) {
      setSharedVoiceText(template.suggestedVoiceover);
    }

    if (!user) {
      handleOpenAuth('user');
    } else {
      handleSelectTab('video_studio');
    }
  };

  const handleSelectTab = (tab: StudioTab) => {
    if (tab !== 'landing' && !user) {
      handleOpenAuth(tab === 'admin' ? 'admin' : 'user');
      return;
    }
    // Gated admin views
    if ((tab === 'admin' || tab === 'audit' || tab === 'hf_deployment_kit') && user?.role !== 'admin') {
      handleOpenAuth('admin');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-rose-600 selection:text-white relative transition-colors duration-200">
      {/* Global Revolving Animation Loading Overlay */}
      <GlobalLoadingOverlay loading={globalLoading} />

      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        user={user}
        trialUsage={trialUsage}
        onOpenAuth={handleOpenAuth}
        onOpenPaywall={() => handleTriggerPaywall('Select a plan to top up generation credits.')}
        onLogout={handleLogout}
        onOpenShortcuts={() => setShowGlobalShortcuts(true)}
        onOpenWorkspaces={() => setShowGlobalWorkspaces(true)}
        onOpenUsageHistory={() => setIsUsageHistoryOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        activeWorkspaceName={globalWorkspace.name}
      />

      {/* Main Studio Viewport */}
      <main className={`flex-1 ${activeTab === 'video_studio' || activeTab === 'character_studio' || activeTab === 'ad_builder' ? 'pb-0 overflow-hidden' : 'pb-24 md:pb-16'}`}>
        {activeTab === 'landing' && (
          <LandingPageView
            user={user}
            onOpenAuth={handleOpenAuth}
            onLaunchStudio={() => {
              if (!user) {
                handleOpenAuth('user');
              } else {
                setActiveTab('video_studio');
              }
            }}
            onLaunchHamroAi={() => {
              if (!user) {
                handleOpenAuth('user');
              } else {
                setActiveTab('hamro_ai');
              }
            }}
            onSelectPlan={(plan) => {
              if (!user) {
                handleOpenAuth('user');
              } else {
                handleTriggerPaywall(`Upgrade to ${plan.toUpperCase()} tier`);
              }
            }}
            onSelectTemplate={handleApplyTemplate}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Auth Gate: Block all studio tools unless user is signed in */}
        {activeTab !== 'landing' && !user && (
          <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-rose-200">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Google Authentication Required</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                NepalAI Studio and HamroAI tools are protected. Please sign in with your real Google account to unlock <strong className="text-amber-600">HamroAI (GPT-4o & GPT-5-mini)</strong>, Azure <span className="font-semibold text-slate-800">gpt-image-1.5</span>, <span className="font-semibold text-slate-800">Sora-2 video generation</span>, timeline rendering, and Nepali neural speech.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleOpenAuth('user')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign In with Google</span>
              </button>
              <button
                onClick={() => setActiveTab('landing')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition cursor-pointer"
              >
                Back to Landing Overview
              </button>
            </div>
          </div>
        )}

        {/* Authenticated Studio Tools */}
        {user && activeTab === 'hamro_ai' && (
          <HamroAiStudio
            user={user}
            onOpenAuth={() => handleOpenAuth('user')}
            onNavigateTab={(tab) => handleSelectTab(tab)}
            onSendToVideoStudio={(scriptText) => {
              const newSceneId = `scn_${Date.now()}`;
              const firstLine = scriptText.split('\n')[0].replace(/^[#\*\-]+\s*/, '').slice(0, 50);
              setScenes((prev) => [
                ...prev,
                {
                  id: newSceneId,
                  prompt: scriptText.slice(0, 300),
                  duration: 10,
                  title: firstLine || 'HamroAI Scene',
                  status: 'draft',
                  mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1280&q=80',
                  mediaType: 'image',
                  aspectRatio: '16:9',
                  motion: 'zoom_in',
                  transition: 'dissolve',
                  textOverlay: firstLine || 'HamroAI Scene',
                  textPosition: 'lower_third',
                  textColor: '#ffffff',
                  textFont: 'devanagari',
                  volume: 80,
                },
              ]);

              const newSub: SubtitleItem = {
                id: 'sub_' + Date.now(),
                index: subtitles.length + 1,
                startTimeSec: 0,
                endTimeSec: 10,
                text: scriptText.slice(0, 160),
                devanagariText: scriptText.slice(0, 160),
              };
              setSubtitles((prev) => [...prev, newSub]);

              handleSelectTab('video_studio');
            }}
            onSendToVoiceStudio={(text) => {
              setSharedVoiceText(text);
              handleSelectTab('tts_studio');
            }}
            onSendToSoraStudio={(prompt) => {
              setSharedSoraPrompt(prompt);
              handleSelectTab('sora_studio');
            }}
            onSendToImageStudio={(prompt) => {
              setSharedImagePrompt(prompt);
              handleSelectTab('image_studio');
            }}
          />
        )}

        {/* Admin Dashboard: Gated strictly to superadmin */}
        {user && user.role === 'admin' && activeTab === 'admin' && (
          <AdminDashboardView
            currentUser={user}
            onOpenAuth={() => handleOpenAuth('admin')}
          />
        )}

        {user && (activeTab === 'video_studio' || activeTab === 'character_studio' || activeTab === 'ad_builder') && (
          <VideoStudioView
            scenes={scenes}
            setScenes={setScenes}
            currentUser={user}
            onOpenImageStudio={() => handleSelectTab('image_studio')}
            onOpenSoraStudio={() => handleSelectTab('sora_studio')}
            onOpenVoiceStudio={() => handleSelectTab('tts_studio')}
            onStartGlobalLoading={handleStartGlobalLoading}
            onStopGlobalLoading={handleStopGlobalLoading}
            audioTracks={audioTracks}
            setAudioTracks={setAudioTracks}
            subtitles={subtitles}
            setSubtitles={setSubtitles}
            initialOpenModal={activeTab === 'character_studio' ? 'character_studio' : activeTab === 'ad_builder' ? 'ad_builder' : null}
          />
        )}

        {user && activeTab === 'image_studio' && (
          <ImageStudioView
            initialPrompt={sharedImagePrompt}
            onAddSceneToVideo={handleAddSceneToVideo}
            onNavigateToTimeline={() => handleSelectTab('video_studio')}
            bypassControlledMode={user?.role === 'admin'}
            user={user}
            onTriggerPaywall={handleTriggerPaywall}
            onUsageUpdated={handleUsageUpdated}
            onStartGlobalLoading={handleStartGlobalLoading}
            onStopGlobalLoading={handleStopGlobalLoading}
          />
        )}

        {user && activeTab === 'sora_studio' && (
          <SoraStudioView
            initialPrompt={sharedSoraPrompt}
            onAddSceneToVideo={handleAddSceneToVideo}
            onNavigateToTimeline={() => handleSelectTab('video_studio')}
            bypassControlledMode={user?.role === 'admin'}
            user={user}
            onTriggerPaywall={handleTriggerPaywall}
            onUsageUpdated={handleUsageUpdated}
            onStartGlobalLoading={handleStartGlobalLoading}
            onStopGlobalLoading={handleStopGlobalLoading}
          />
        )}

        {user && activeTab === 'avatar_studio' && (
          <AvatarStudioView
            user={user}
            trialUsage={trialUsage}
            onOpenPaywall={() => handleTriggerPaywall('Top up generation credits to create Avatar Presenters')}
            onOpenAuth={handleOpenAuth}
            onAddMediaToProject={(clip) => {
              if (clip.url) {
                const newScene: Scene = {
                  id: `scene_${Date.now()}`,
                  prompt: clip.name || 'AI Avatar Presenter',
                  mediaUrl: clip.url,
                  duration: clip.duration || 5,
                  title: clip.name || 'Avatar Presenter',
                  mediaType: 'video',
                  aspectRatio: '16:9',
                  motion: 'static',
                  transition: 'fade',
                  textOverlay: '',
                  textColor: '#ffffff',
                  textFont: 'sans',
                  textPosition: 'bottom',
                  filter: 'none',
                  volume: 90,
                };
                setScenes((prev) => [...prev, newScene]);
                handleSelectTab('video_studio');
              }
            }}
          />
        )}

        {user && activeTab === 'tts_studio' && (
          <VoiceStudioView
            initialText={sharedVoiceText}
            user={user}
            onTriggerPaywall={handleTriggerPaywall}
            onUsageUpdated={handleUsageUpdated}
            onAttachAudioTrack={(title, duration, audioUrl, scriptText) => {
              const newTrack: AudioTrack = {
                id: 'voice-' + Date.now(),
                title: title || 'Nepali Neural Voiceover',
                artist: 'NepalAI Neural TTS (SpeechT5)',
                url: audioUrl || '',
                duration: duration || 8,
                volume: 95,
                genre: 'Voiceover',
                type: 'voiceover',
              };
              setAudioTracks(prev => [newTrack, ...prev.filter(t => t.id !== newTrack.id)]);

              if (scriptText) {
                const newSub: SubtitleItem = {
                  id: 'sub_' + Date.now(),
                  index: subtitles.length + 1,
                  startTimeSec: 0,
                  endTimeSec: duration || 8,
                  text: scriptText,
                  devanagariText: scriptText,
                };
                setSubtitles(prev => [...prev, newSub]);
              }

              handleSelectTab('video_studio');
            }}
            onStartGlobalLoading={handleStartGlobalLoading}
            onStopGlobalLoading={handleStopGlobalLoading}
          />
        )}

        {/* Audit & HF Deployment Kit: Gated strictly to superadmin */}
        {user && user.role === 'admin' && activeTab === 'audit' && (
          <AuditReportView
            onGoToVideoStudio={() => handleSelectTab('video_studio')}
            onGoToDeploymentKit={() => handleSelectTab('hf_deployment_kit')}
            onGoToAdmin={() => handleSelectTab('admin')}
          />
        )}

        {user && user.role === 'admin' && activeTab === 'hf_deployment_kit' && (
          <HfDeploymentKitView />
        )}

        {/* User Dashboard & Viral Referral Engine */}
        {user && activeTab === 'dashboard' && (
          <UserDashboardView
            user={user}
            trialUsage={trialUsage}
            onNavigateTab={handleSelectTab}
            onOpenPaywall={() => handleTriggerPaywall('Top up generation credits or upgrade your plan')}
            onCreditEarned={(newTotal) => {
              setUser(prev => prev ? { ...prev, credits: newTotal } : null);
            }}
            onOpenTour={() => setIsTourOpen(true)}
          />
        )}

        {/* Public Pages: FAQ, About, Privacy, Contact */}
        {(activeTab === 'faq' || activeTab === 'about' || activeTab === 'privacy' || activeTab === 'contact') && (
          <PublicPagesView initialTab={activeTab as 'faq' | 'about' | 'privacy' | 'contact'} />
        )}
      </main>

      {/* Unified Global Master Footer */}
      <footer className="border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#07080D] text-slate-600 dark:text-slate-400 py-8 px-4 text-xs transition-colors">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <NepalAiLogo size="sm" />
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                NepalAI Studio Pro <span className="text-slate-400 dark:text-slate-500 font-normal">· studio.nepalai.tech</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-slate-600 dark:text-slate-300 font-medium">
              <button 
                onClick={() => handleSelectTab('landing')} 
                className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
              >
                Home
              </button>
              <button 
                onClick={() => handleSelectTab('video_studio')} 
                className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
              >
                Studio
              </button>
              <button 
                onClick={() => handleSelectTab('hamro_ai')} 
                className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                <span>HamroAI</span>
              </button>
              <button 
                onClick={() => setActiveTab('faq')} 
                className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                FAQ
              </button>
              <button 
                onClick={() => setActiveTab('about')} 
                className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                About
              </button>
              <button 
                onClick={() => setActiveTab('privacy')} 
                className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Privacy
              </button>
              <button 
                onClick={() => setActiveTab('contact')} 
                className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Contact
              </button>
              <a 
                href="/sitemap.xml" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Sitemap
              </a>
              <button 
                onClick={() => handleOpenAuth('admin')} 
                className="text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer"
              >
                Admin Portal
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <div>
              Platform designed and created by{' '}
              <a
                href="https://scamspike.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                ScamSpike Solutions Pvt. Ltd. (scamspike.com)
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Founder:</span>
              <a
                href="https://prakashsuvedi.com.np"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Prakash Suvedi (prakashsuvedi.com.np)
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile & Tablet App Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        user={user}
        onOpenAuth={handleOpenAuth}
        onOpenPaywall={() => handleTriggerPaywall('Manage subscription & credits')}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        user={user}
        trialUsage={trialUsage}
        triggerReason={paywallReason}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Global Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showGlobalShortcuts}
        onClose={() => setShowGlobalShortcuts(false)}
      />

      {/* Global Team Workspaces Modal */}
      <WorkspacesModal
        isOpen={showGlobalWorkspaces}
        onClose={() => setShowGlobalWorkspaces(false)}
        activeWorkspace={globalWorkspace}
        onSelectWorkspace={(ws) => {
          setGlobalWorkspace(ws);
        }}
      />

      {/* User Generation History & Transparency Audit Ledger Modal */}
      <UsageHistoryModal
        isOpen={isUsageHistoryOpen}
        onClose={() => setIsUsageHistoryOpen(false)}
        user={user}
      />

      {/* Interactive Studio Onboarding Tour Walkthrough Modal */}
      <OnboardingTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={handleSelectTab}
      />

      {/* User Feature Request, Bug Report & System Comment Submission Modal */}
      <SystemFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentUser={user}
      />

      {/* Floating System Feedback & Issue Report Trigger Button */}
      <div className="fixed bottom-4 right-4 z-40 hidden sm:block">
        <button
          type="button"
          onClick={() => setIsFeedbackModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white dark:bg-white/90 dark:hover:bg-white dark:text-slate-900 shadow-xl backdrop-blur-md text-xs font-bold border border-slate-700/50 dark:border-slate-300 transition hover:scale-105 active:scale-95 cursor-pointer group"
          title="Submit Feature Request, Report Bugs, or Direct System Comments"
        >
          <MessageSquare className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
          <span>Feedback / Report Error</span>
        </button>
      </div>
    </div>
  );
}
