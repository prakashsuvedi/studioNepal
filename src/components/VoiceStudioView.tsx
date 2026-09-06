import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Play, Square, Volume2, Sparkles, Check, Download, Music, AlertCircle, 
  ArrowRight, Save, Library, Smile, Clock, FileText, RotateCcw, Compass, 
  UserCheck, HelpCircle, ChevronRight, VolumeX, Flame, Heart, Headphones
} from 'lucide-react';
import { UserSession, UserTrialQuota } from '../types';
import { apiGenerateAudio, apiGetAudioSuggestions } from '../lib/api';
import { VoiceWaveformVisualizer } from './VoiceWaveformVisualizer';

interface VoiceStudioViewProps {
  initialText?: string;
  onAttachAudioTrack?: (title: string, duration: number, audioUrl?: string, scriptText?: string) => void;
  user?: UserSession | null;
  onTriggerPaywall?: (reason: string) => void;
  onUsageUpdated?: (usage: UserTrialQuota, credits: number) => void;
  onStartGlobalLoading?: (info: { title: string; subtitle?: string; type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; progress?: number }) => void;
  onStopGlobalLoading?: () => void;
}

interface VoiceItem {
  id: string;
  name: string;
  demographic: 'children' | 'teen' | 'young_adult' | 'adult' | 'elderly' | 'ambient';
  gender: 'Female' | 'Male' | 'Neutral';
  language: 'Nepali' | 'English';
  role: 'Primary Narrator' | 'Secondary Character' | 'Ambient/Background';
  description: string;
  sampleText: string;
  pitchShift: string;
  speedShift: string;
}

const VOICES: VoiceItem[] = [
  // Children
  { id: 'kanti_child_ne', name: 'Kanti (Nepali Girl)', demographic: 'children', gender: 'Female', language: 'Nepali', role: 'Secondary Character', description: 'Sweet, bright, authentic child voiceover.', sampleText: 'सानी नानी कान्ति ! नेपाली बाल कथा वाचनको लागि उत्तम।', pitchShift: '+30%', speedShift: '1.06x' },
  { id: 'sanjok_child_ne', name: 'Sanjok (Nepali Boy)', demographic: 'children', gender: 'Male', language: 'Nepali', role: 'Secondary Character', description: 'Energetic, cheerful young boy voice.', sampleText: 'नमस्ते अंकल, नमस्ते आन्टी ! म नयाँ कथा सुनाउँछु है।', pitchShift: '+30%', speedShift: '1.06x' },
  { id: 'ana_child_en', name: 'Ana (English Child)', demographic: 'children', gender: 'Female', language: 'English', role: 'Secondary Character', description: 'Natural young English girl voice.', sampleText: 'Hi, I am Ana! I love reading magical fairy tales.', pitchShift: '+25%', speedShift: '1.05x' },

  // Teens
  { id: 'rohan_teen_ne', name: 'Rohan (Nepali Teen)', demographic: 'teen', gender: 'Male', language: 'Nepali', role: 'Secondary Character', description: 'Relatable, casual Nepali teenager.', sampleText: 'के छ साथीहरू? आज हामी नेपालएआई स्टुडियोको बारेमा कुरा गर्दैछौं।', pitchShift: '+12%', speedShift: '1.03x' },
  { id: 'emily_teen_en', name: 'Emily (English Teen)', demographic: 'teen', gender: 'Female', language: 'English', role: 'Secondary Character', description: 'Bouncy, enthusiastic English teen voice.', sampleText: 'Hey guys! Welcome back to my lifestyle channel.', pitchShift: '+12%', speedShift: '1.03x' },

  // Young Adults
  { id: 'sita_ne', name: 'Sita (Nepali Natural)', demographic: 'young_adult', gender: 'Female', language: 'Nepali', role: 'Primary Narrator', description: 'Clear, elegant, and highly articulate.', sampleText: 'नमस्ते ! नेपालएआई स्टुडियोको नेपाली संवादात्मक वाचन केन्द्रमा स्वागत छ।', pitchShift: 'Default', speedShift: 'Default' },
  { id: 'maya_en', name: 'Maya (English US)', demographic: 'young_adult', gender: 'Female', language: 'English', role: 'Primary Narrator', description: 'Professional, confident, clear presentation.', sampleText: 'Welcome to NepalAI Studio, the premier video production platform powered by AI.', pitchShift: 'Default', speedShift: 'Default' },
  { id: 'jenny_en', name: 'Jenny (English Conversational)', demographic: 'young_adult', gender: 'Female', language: 'English', role: 'Secondary Character', description: 'Warm, conversational, and energetic.', sampleText: 'Awesome! Let\'s build the next-generation voice script together.', pitchShift: 'Default', speedShift: 'Default' },

  // Adults
  { id: 'aarav_ne', name: 'Aarav (Nepali Warm)', demographic: 'adult', gender: 'Male', language: 'Nepali', role: 'Primary Narrator', description: 'Warm, deep, baritone commercial narrator.', sampleText: 'नेपाली कला, संस्कृति र प्रविधि सँगै अगाडि बढ्दैछन्।', pitchShift: 'Default', speedShift: 'Default' },
  { id: 'david_en', name: 'David (English Cinematic)', demographic: 'adult', gender: 'Male', language: 'English', role: 'Primary Narrator', description: 'Deep, dramatic storytelling voice.', sampleText: 'In a world where intelligence meets creativity, a new dawn arises.', pitchShift: 'Default', speedShift: 'Default' },
  { id: 'emma_en', name: 'Emma (English Corporate)', demographic: 'adult', gender: 'Female', language: 'English', role: 'Primary Narrator', description: 'Corporate, professional corporate trainer.', sampleText: 'Our quarterly goals are highly aligned with the latest market indicators.', pitchShift: 'Default', speedShift: 'Default' },

  // Elderly
  { id: 'guru_elder_ne', name: 'Guru-ba (Nepali Elder)', demographic: 'elderly', gender: 'Male', language: 'Nepali', role: 'Primary Narrator', description: 'Wise, slow, grandfatherly heritage tone.', sampleText: 'धेरै वर्ष पहिलेको कुरा हो... सुन्नुहोस् है त नानी बाबुहरू।', pitchShift: '-18%', speedShift: '0.86x' },
  { id: 'aama_elder_ne', name: 'Aama (Grandmother)', demographic: 'elderly', gender: 'Female', language: 'Nepali', role: 'Secondary Character', description: 'Nurturing, traditional, grandmother tone.', sampleText: 'बाबु, स्वस्थ बस, खुसी बस। आजको दिन धेरै राम्रो छ।', pitchShift: '-12%', speedShift: '0.85x' },
  { id: 'arthur_elder_en', name: 'Arthur (English Senior)', demographic: 'elderly', gender: 'Male', language: 'English', role: 'Primary Narrator', description: 'Distinguished, classic, rich history voice.', sampleText: 'Let me share a story from the days of long ago.', pitchShift: '-18%', speedShift: '0.86x' },

  // Background Ambient
  { id: 'ambient_cafe', name: 'Kathmandu Ambient Cafe', demographic: 'ambient', gender: 'Neutral', language: 'Nepali', role: 'Ambient/Background', description: 'Muffled ambient background tea-shop chatter.', sampleText: '[Ambient tea shop background chat scene]', pitchShift: '-8%', speedShift: '0.95x' },
  { id: 'ambient_wind', name: 'Himalayan Wind Chimes', demographic: 'ambient', gender: 'Neutral', language: 'English', role: 'Ambient/Background', description: 'Soothing mountain wind backdrop.', sampleText: '[Mountain wind background blowing softly]', pitchShift: 'Softer', speedShift: 'Slow' },
];

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({ 
  initialText,
  onAttachAudioTrack,
  user,
  onTriggerPaywall,
  onUsageUpdated,
  onStartGlobalLoading,
  onStopGlobalLoading,
}) => {
  const [text, setText] = useState(() => initialText || 'नमस्ते! नेपालएआई स्टुडियोमा तपाईंलाई हार्दिक स्वागत छ।');

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const [language, setLanguage] = useState<'ne' | 'en'>('ne');
  const [selectedVoiceId, setSelectedVoiceId] = useState('sita_ne');
  const [activeDemographicTab, setActiveDemographicTab] = useState<'all' | 'children' | 'teen' | 'young_adult' | 'adult' | 'elderly' | 'ambient'>('all');
  
  // Emotional and Genre toggles
  const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'sad' | 'energetic' | 'horror'>('neutral');
  const [formatStyle, setFormatStyle] = useState<'general' | 'drama' | 'documentary' | 'story' | 'talk' | 'quick_talk'>('general');
  
  // Custom project and folder workspaces
  const [projects, setProjects] = useState<string[]>(['Main Commercial', 'Himalayan Documentary', 'Personal Scratchpad']);
  const [selectedProject, setSelectedProject] = useState('Main Commercial');
  const [newProjectName, setNewProjectName] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [syncedAssets, setSyncedAssets] = useState<{ id: string; title: string; project: string; voice: string; url: string; date: string }[]>([]);

  // Sliders
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [attachedSuccess, setAttachedSuccess] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // Dub features
  const [dubTargetLang, setDubTargetLang] = useState<'ne' | 'hi'>('ne');
  const [isAutoDubbing, setIsAutoDubbing] = useState(false);
  const [autoDubSuccess, setAutoDubSuccess] = useState(false);
  
  // Audio state
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);

  // AI Assistant Suggestions State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    recommendedVoice: string;
    recommendedDemographic: string;
    recommendedEmotion: string;
    recommendedFormat: string;
    analysis: string;
    suggestions: { originalText: string; suggestedText: string; explanation: string }[];
    formattedScript: string;
  } | null>(null);

  const selectedVoice = VOICES.find(v => v.id === selectedVoiceId) || VOICES[5]; // defaults to Sita

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      setProjects(prev => [...prev, newProjectName.trim()]);
      setSelectedProject(newProjectName.trim());
      setNewProjectName('');
      setShowAddProject(false);
    }
  };

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    setAiSuggestions(null);
    try {
      const data = await apiGetAudioSuggestions(text, language);
      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
        
        // Auto-recommend settings
        const foundVoice = VOICES.find(v => 
          v.name.toLowerCase().includes(data.suggestions.recommendedVoice.toLowerCase()) || 
          data.suggestions.recommendedVoice.toLowerCase().includes(v.name.toLowerCase())
        );
        if (foundVoice) {
          setSelectedVoiceId(foundVoice.id);
          setLanguage(foundVoice.language === 'Nepali' ? 'ne' : 'en');
        }
        
        const recEmotion = data.suggestions.recommendedEmotion.toLowerCase();
        if (['neutral', 'happy', 'sad', 'energetic', 'horror'].includes(recEmotion)) {
          setEmotion(recEmotion as any);
        }
        
        const recFormat = data.suggestions.recommendedFormat.toLowerCase().replace(' ', '_');
        if (['general', 'drama', 'documentary', 'story', 'talk', 'quick_talk'].includes(recFormat)) {
          setFormatStyle(recFormat as any);
        }
      }
    } catch (err: any) {
      console.error('Smart prompt analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyOptimizedScript = () => {
    if (aiSuggestions?.formattedScript) {
      setText(aiSuggestions.formattedScript);
    }
  };

  const insertMarkupTag = (tagText: string) => {
    const textarea = document.getElementById('tts-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selText = text.substring(start, end);
    
    let insertion = tagText;
    if (tagText.includes('[/')) {
      // Wrap highlighted script selection
      const parts = tagText.split('...');
      insertion = parts[0] + (selText || 'text') + parts[1];
    }
    
    const updatedText = text.substring(0, start) + insertion + text.substring(end);
    setText(updatedText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertion.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleSpeak = async () => {
    setAudioError(null);
    setIsSynthesizing(true);

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'voice',
        title: 'Synthesizing Neural Speech...',
        subtitle: `Rendering: ${selectedVoice.name} | Style: ${formatStyle} | Emotion: ${emotion}`,
        progress: 40,
      });
    }

    try {
      const targetUserId = user?.id || 'usr_guest_' + Date.now();
      const voiceIdParam = selectedVoice.id;
      
      const data = await apiGenerateAudio(
        targetUserId,
        text,
        voiceIdParam,
        language === 'ne' ? 'ne-NP' : 'en-US',
        emotion,
        formatStyle
      );

      if (onUsageUpdated && data.trialUsage) {
        onUsageUpdated(data.trialUsage, data.remainingCredits);
      }

      if (data?.result?.url) {
        setGeneratedAudioUrl(data.result.url);

        if (activeAudioElement) {
          activeAudioElement.pause();
        }

        const audio = new Audio(data.result.url);
        audio.playbackRate = rate;

        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          fallbackWebSpeech();
        };

        setActiveAudioElement(audio);
        await audio.play().catch(e => {
          console.warn('Audio play notice:', e);
          fallbackWebSpeech();
        });
        setIsPlaying(true);

        // Sync Asset to user Project automatically
        const newAsset = {
          id: 'asset_' + Date.now(),
          title: `Voiceover: ${text.slice(0, 20)}...`,
          project: selectedProject,
          voice: selectedVoice.name,
          url: data.result.url,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSyncedAssets(prev => [newAsset, ...prev]);

      }
    } catch (e: any) {
      console.error(e);
      fallbackWebSpeech();
      if (e.message?.includes('trial') || e.message?.includes('credit') || e.message?.includes('limit')) {
        if (onTriggerPaywall) onTriggerPaywall(e.message);
      }
    } finally {
      setIsSynthesizing(false);
      if (onStopGlobalLoading) {
        onStopGlobalLoading();
      }
    }
  };

  const fallbackWebSpeech = () => {
    if ('speechSynthesis' in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, ''));
        utterance.lang = language === 'ne' ? 'ne-NP' : 'en-US';
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis fallback error:', err);
      }
    }
  };

  const handleStop = () => {
    if (activeAudioElement) {
      activeAudioElement.pause();
      setIsPlaying(false);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleAttachToVideo = () => {
    if (onAttachAudioTrack) {
      const estimatedDuration = Math.max(4, Math.ceil(text.length / 14));
      onAttachAudioTrack(
        `[${selectedProject}] ${selectedVoice.name}: ${text.replace(/\[.*?\]/g, '').slice(0, 20)}...`,
        estimatedDuration,
        generatedAudioUrl || undefined,
        text
      );
    }
    setAttachedSuccess(true);
    setTimeout(() => setAttachedSuccess(false), 3000);
  };

  const handleAutoDubbing = () => {
    setIsAutoDubbing(true);
    setAutoDubSuccess(false);
    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'voice',
        title: `Auto-Dubbing Audio to ${dubTargetLang === 'ne' ? 'Nepali' : 'Hindi'}...`,
        subtitle: 'Analyzing timeline pauses & synthesizing synced dub tracks',
        progress: 35,
      });
    }

    setTimeout(() => {
      setIsAutoDubbing(false);
      setAutoDubSuccess(true);
      if (onStopGlobalLoading) onStopGlobalLoading();
      setTimeout(() => setAutoDubSuccess(false), 4000);
    }, 2500);
  };

  // Filter voices based on active demographic tab
  const filteredVoices = VOICES.filter(voice => {
    if (activeDemographicTab !== 'all' && voice.demographic !== activeDemographicTab) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Premium Hub Header with project workspace context */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/25 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Headphones className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Context-Aware Neural TTS Studio</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Design custom age-categorized voices with deep emotional resonance, pacing controls, and AI auto-pushed assets.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Project Workspace Synchronizer */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 z-10 shrink-0 w-full md:w-auto">
          <div className="space-y-1 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Active Project Workspace</span>
            <div className="flex items-center gap-2">
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {projects.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddProject(!showAddProject)}
                className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition font-bold"
                title="Create Project"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Creator Popover */}
      {showAddProject && (
        <form onSubmit={handleCreateProject} className="p-4 bg-slate-900 border border-slate-800 rounded-xl max-w-sm flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            required
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            placeholder="New Project Name"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs">
            Save
          </button>
          <button type="button" onClick={() => setShowAddProject(false)} className="text-xs text-slate-400 hover:text-white px-1">
            Cancel
          </button>
        </form>
      )}

      {/* Grid Layout: Main Studio on Left, Directory/Assistant on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7/12): Synthesis Engine & Markup Control */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-sm">
            
            {/* Header: Script Selection & Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  Voiceover Script Screenwriter
                </span>
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                  <button
                    onClick={() => {
                      setLanguage('ne');
                      setSelectedVoiceId('sita_ne');
                      setText('नमस्ते! नेपालएआई स्टुडियोमा तपाईंलाई हार्दिक स्वागत छ।');
                    }}
                    className={`text-[10px] px-3 py-1 rounded-md font-semibold transition-all ${
                      language === 'ne' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    नेपाली (Nepali)
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setSelectedVoiceId('maya_en');
                      setText('Welcome to NepalAI Studio, the premier video production platform powered by AI.');
                    }}
                    className={`text-[10px] px-3 py-1 rounded-md font-semibold transition-all ${
                      language === 'en' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Granular Audio Direction Controls (Markup Toolbar) */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-[10px] uppercase text-indigo-500 pr-1 tracking-wider border-r border-slate-200 dark:border-slate-800 mr-1.5">
                  Direct Cues
                </span>
                
                <button
                  onClick={() => insertMarkupTag('[Pause: 1s]')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium flex items-center gap-1"
                  title="Insert 1s Pause Cue"
                >
                  <Clock className="w-3 h-3 text-indigo-500" />
                  +1s Pause
                </button>
                <button
                  onClick={() => insertMarkupTag('[Pause: 500ms]')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium"
                  title="Insert 0.5s Pause Cue"
                >
                  +0.5s Pause
                </button>
                <button
                  onClick={() => insertMarkupTag('[Speed: Fast]...[/Speed]')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-amber-600 dark:text-amber-400"
                  title="Wrap Selection in Fast Pacing"
                >
                  🏃 Fast
                </button>
                <button
                  onClick={() => insertMarkupTag('[Speed: Slow]...[/Speed]')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-indigo-600 dark:text-indigo-400"
                  title="Wrap Selection in Slow Pacing"
                >
                  🐢 Slow
                </button>
                <button
                  onClick={() => insertMarkupTag('[Volume: Loud]...[/Volume]')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-rose-600 dark:text-rose-400"
                  title="Wrap Selection with Raised Volume"
                >
                  🔊 Raise Vol
                </button>
                <button
                  onClick={() => insertMarkupTag('[Emphasis: Strong]...[/Emphasis]')}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-emerald-600 dark:text-emerald-400"
                  title="Wrap Selection in Emphasis"
                >
                  🎭 Emphasize
                </button>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  id="tts-textarea"
                  rows={6}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type script here. Insert pause and pacing tags from the bar above for premium performance..."
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white font-['Mukta'] focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
                />
                
                {/* Length Indicator */}
                <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono select-none">
                  {text.length} Chars
                </span>
              </div>
            </div>

            {/* Emotional and Genre Style Selections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Emotion Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-amber-500" />
                  Emotional Delivery Tone
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['neutral', 'happy', 'sad', 'energetic', 'horror'] as const).map(emo => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setEmotion(emo)}
                      className={`py-2 rounded-lg text-[10px] font-semibold border capitalize transition ${
                        emotion === emo
                          ? 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre / Format Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  Delivery Genre Style Format
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['general', 'drama', 'documentary', 'story', 'talk', 'quick_talk'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormatStyle(fmt)}
                      className={`py-1.5 rounded-lg text-[10px] font-semibold border capitalize transition ${
                        formatStyle === fmt
                          ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {fmt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sliders Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Speech Speed Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{rate}x</span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.5}
                  step={0.1}
                  value={rate}
                  onChange={e => setRate(parseFloat(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Vocal Pitch Scale</span>
                  <span className="font-bold text-slate-900 dark:text-white">{pitch}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.3}
                  step={0.1}
                  value={pitch}
                  onChange={e => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={isPlaying ? handleStop : handleSpeak}
                disabled={isSynthesizing}
                className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                } disabled:opacity-50`}
              >
                {isSynthesizing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Synthesizing...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Playback</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Preview Neural TTS</span>
                  </>
                )}
              </button>

              <button
                onClick={handleAttachToVideo}
                disabled={!generatedAudioUrl}
                className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  generatedAudioUrl
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                }`}
                title={!generatedAudioUrl ? "Please click 'Preview Neural TTS' first" : "Attach directly to active video storyboard track"}
              >
                <Music className="w-4 h-4" />
                <span>Attach Track to Video Editor</span>
              </button>
            </div>

            {/* Output & Synced Project Banner */}
            {generatedAudioUrl && (
              <div className="p-4 bg-slate-950 text-white rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                    <Volume2 className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-rose-300">Generated Voice Asset</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-indigo-900 border border-indigo-700 rounded text-indigo-200 font-semibold uppercase">
                        Synced to: {selectedProject}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{generatedAudioUrl}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <audio src={generatedAudioUrl} controls autoPlay className="h-8 w-44 md:w-48 accent-rose-500" />
                  <a
                    href={generatedAudioUrl}
                    download={`nepalai_voiceover_${Date.now()}.mp3`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
                    title="Download MP3"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {attachedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-600 flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span className="font-semibold">Successfully attached track to Video Studio! Navigate to Video Studio to edit.</span>
              </div>
            )}

          </div>

          {/* Waveform Visualizer Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-rose-500" />
              Real-time Speech Audio Waveform Playhead
            </h3>
            <p className="text-xs text-slate-500">
              Interactive timeline scrubbing visualization. Drag or pause to align script cue pauses accurately.
            </p>
            <VoiceWaveformVisualizer
              audioTitle={`Speech: ${selectedVoice.name} (${selectedVoice.language})`}
              duration={Math.max(4, Math.ceil(text.length / 14))}
              isPlaying={isPlaying}
              onPlayToggle={isPlaying ? handleStop : handleSpeak}
            />
          </div>

          {/* AI Neural Dub Integration */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-rose-50/50 dark:from-indigo-950/20 dark:to-rose-950/10 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">Auto-Dub Language Synchronizer</h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold shadow-xs">
                AI Timeline Sync
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Instantly dub generated audio tracks into another dialect with full pause duration and synchronization alignment.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <select
                value={dubTargetLang}
                onChange={e => setDubTargetLang(e.target.value as 'ne' | 'hi')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="ne">Nepali Dub (नेपाली)</option>
                <option value="hi">Hindi Dub (हिन्दी)</option>
              </select>
              <button
                onClick={handleAutoDubbing}
                disabled={isAutoDubbing}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                {isAutoDubbing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Dubbing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Neural Dub</span>
                  </>
                )}
              </button>
            </div>
            {autoDubSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-600 flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">Successfully synchronized and dubbed voiceover attached to active project timeline!</span>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5/12): Voice Directory & AI Assistant */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Demographic Voice Selection Drawer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5 text-indigo-500" />
                Neural Voice Directory
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {VOICES.length} Profiles Available
              </span>
            </div>

            {/* Demographic Category Tab Pill Selection */}
            <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
              {([
                { id: 'all', label: 'All' },
                { id: 'children', label: 'Children' },
                { id: 'teen', label: 'Teens' },
                { id: 'young_adult', label: 'Mid-20s' },
                { id: 'adult', label: '30s-40s' },
                { id: 'elderly', label: 'Senior' },
                { id: 'ambient', label: 'Ambient' }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemographicTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                    activeDemographicTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Voice Cards Grid */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredVoices.map(voice => (
                <div
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoiceId(voice.id);
                    setLanguage(voice.language === 'Nepali' ? 'ne' : 'en');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition text-left flex items-start gap-3 relative overflow-hidden ${
                    selectedVoiceId === voice.id
                      ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Select check badge */}
                  {selectedVoiceId === voice.id && (
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 text-white flex items-center justify-center rounded-bl-lg">
                      <Check className="w-2.5 h-2.5 stroke-[3px]" />
                    </div>
                  )}

                  {/* Icon Representation */}
                  <div className={`p-2 rounded-lg shrink-0 ${
                    voice.demographic === 'children' ? 'bg-amber-100 text-amber-700' :
                    voice.demographic === 'teen' ? 'bg-indigo-100 text-indigo-700' :
                    voice.demographic === 'elderly' ? 'bg-emerald-100 text-emerald-700' :
                    voice.demographic === 'ambient' ? 'bg-slate-100 text-slate-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    <Mic className="w-4 h-4" />
                  </div>

                  {/* Voice Details */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{voice.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                        voice.language === 'Nepali' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                      }`}>
                        {voice.language}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {voice.description}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[8px] font-bold text-slate-400">
                      <span className="uppercase text-indigo-500 bg-indigo-500/5 px-1 py-0.2 rounded">{voice.role}</span>
                      <span>•</span>
                      <span>Pitch: {voice.pitchShift}</span>
                      <span>•</span>
                      <span>Speed: {voice.speedShift}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: AI "Smart Prompt" Audio Assistant */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Smart Prompt Assistant
              </h3>
              <span className="text-[9px] font-semibold bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-inner animate-pulse">
                Gemini 2.5 Flash
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Analyze your script context to recommend matching demographics, emotions, pacing layouts, and markup optimizations.
            </p>

            <button
              onClick={handleAIAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Analyzing Script Context...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>AI Smart Analyze & Optimize Script</span>
                </>
              )}
            </button>

            {/* Recommendations Output Block */}
            {aiSuggestions && (
              <div className="space-y-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 animate-in zoom-in-95 duration-200">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-wider">Contextual Analysis</span>
                  <p className="text-slate-300 leading-relaxed text-[11px] font-medium italic">{aiSuggestions.analysis}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Recommended Voice</span>
                    <strong className="text-white text-[11px] font-bold">{aiSuggestions.recommendedVoice}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Demographic Group</span>
                    <strong className="text-white text-[11px] font-bold">{aiSuggestions.recommendedDemographic}</strong>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 block">Emotion Tone</span>
                    <strong className="text-white text-[11px] font-bold">{aiSuggestions.recommendedEmotion}</strong>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 block">Format Style</span>
                    <strong className="text-white text-[11px] font-bold">{aiSuggestions.recommendedFormat}</strong>
                  </div>
                </div>

                {/* Optimizations & suggestions */}
                {aiSuggestions.suggestions && aiSuggestions.suggestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-wider block">Pacing Adjustments Suggestions</span>
                    {aiSuggestions.suggestions.slice(0, 2).map((sug, idx) => (
                      <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                          <span className="text-red-400 line-through truncate max-w-[120px]">"{sug.originalText}"</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                          <span className="text-emerald-400 truncate max-w-[120px]">"{sug.suggestedText}"</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed">{sug.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Apply Suggestion button */}
                <button
                  onClick={applyOptimizedScript}
                  className="w-full mt-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold shadow tracking-wider uppercase transition"
                >
                  Apply AI Annotated Script Optimization
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Synced Assets & Projects Portfolio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-indigo-500" />
              Project Assets Portfolio
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every successfully synthesized audio file is saved and auto-synced with the active workspace's video asset database.
            </p>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {syncedAssets.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center text-slate-400 border border-dashed border-slate-200 text-xs">
                  No assets saved in this session. Generate voice previews to compile your portfolio.
                </div>
              ) : (
                syncedAssets.map(asset => (
                  <div key={asset.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="overflow-hidden">
                      <span className="font-bold text-slate-800 dark:text-white block truncate">{asset.title}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {asset.voice} • {asset.date}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (onAttachAudioTrack) {
                          onAttachAudioTrack(asset.title, 8, asset.url, text);
                        }
                      }}
                      className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] rounded"
                      title="Push track as active video background track"
                    >
                      Use
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
