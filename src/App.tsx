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

import { apiGetMe, apiLogout } from './lib/api';
import { Lock, Sparkles, ShieldAlert } from 'lucide-react';

export default function App() {
  // Navigation & studio state
  const [activeTab, setActiveTab] = useState<StudioTab>('landing');
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(INITIAL_AUDIO_TRACKS);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [sharedVoiceText, setSharedVoiceText] = useState<string>('');
  const [sharedSoraPrompt, setSharedSoraPrompt] = useState<string>('');
  const [sharedImagePrompt, setSharedImagePrompt] = useState<string>('');

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
    progress?: number;
  }) => {
    setGlobalLoading({
      active: true,
      title: loading.title,
      subtitle: loading.subtitle,
      type: loading.type || 'general',
      progress: loading.progress,
      onCancel: () => setGlobalLoading(prev => ({ ...prev, active: false })),
    });
  };

  const handleStopGlobalLoading = () => {
    setGlobalLoading(prev => ({ ...prev, active: false }));
  };

  // Initial user session restore (Strictly respects stored user - does NOT auto-login fallback)
  useEffect(() => {
    const savedUserId = localStorage.getItem('nepalai_user_id');
    if (savedUserId) {
      apiGetMe(savedUserId)
        .then(data => {
          setUser(data.user);
          setTrialUsage(data.trialUsage);
        })
        .catch(() => {
          localStorage.removeItem('nepalai_user_id');
          setUser(null);
          setTrialUsage(null);
          setActiveTab('landing');
        });
    } else {
      setUser(null);
      setTrialUsage(null);
      setActiveTab('landing');
    }
  }, []);

  const handleOpenAuth = (mode: 'user' | 'admin' = 'user') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (newUser: UserSession, newUsage: UserTrialQuota) => {
    setUser(newUser);
    setTrialUsage(newUsage);
    localStorage.setItem('nepalai_user_id', newUser.id);
    if (activeTab === 'landing') {
      setActiveTab('video_studio');
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    localStorage.removeItem('nepalai_user_id');
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-rose-600 selection:text-white relative">
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
        activeWorkspaceName={globalWorkspace.name}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 pb-16">
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

        {user && activeTab === 'video_studio' && (
          <VideoStudioView
            scenes={scenes}
            setScenes={setScenes}
            currentUser={user}
            onOpenImageStudio={() => handleSelectTab('image_studio')}
            onOpenSoraStudio={() => handleSelectTab('sora_studio')}
            onStartGlobalLoading={handleStartGlobalLoading}
            onStopGlobalLoading={handleStopGlobalLoading}
            audioTracks={audioTracks}
            setAudioTracks={setAudioTracks}
            subtitles={subtitles}
            setSubtitles={setSubtitles}
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

        {/* Public Pages: FAQ, About, Privacy, Contact */}
        {(activeTab === 'faq' || activeTab === 'about' || activeTab === 'privacy' || activeTab === 'contact') && (
          <PublicPagesView initialTab={activeTab as 'faq' | 'about' | 'privacy' | 'contact'} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700">NepalAI Studio Pro</span> • studio.nepalai.tech • Full-Stack AI Media Platform
          </div>
          <div className="flex flex-wrap items-center gap-3 text-slate-500">
            <button onClick={() => setActiveTab('faq')} className="hover:text-slate-900 transition cursor-pointer">FAQ</button>
            <span>•</span>
            <button onClick={() => setActiveTab('about')} className="hover:text-slate-900 transition cursor-pointer">About</button>
            <span>•</span>
            <button onClick={() => setActiveTab('privacy')} className="hover:text-slate-900 transition cursor-pointer">Privacy</button>
            <span>•</span>
            <button onClick={() => setActiveTab('contact')} className="hover:text-slate-900 transition cursor-pointer">Contact</button>
            <span>•</span>
            <button 
              onClick={() => handleOpenAuth('admin')} 
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>


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
    </div>
  );
}
