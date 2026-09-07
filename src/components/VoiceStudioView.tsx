import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Play, Pause, Square, Volume2, Volume1, Sparkles, Check, Download, Music, AlertCircle, 
  ArrowRight, Save, Library, Smile, Clock, FileText, RotateCcw, Compass, 
  UserCheck, HelpCircle, ChevronRight, VolumeX, Flame, Heart, Headphones, Scissors, Upload
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

const getVoiceSampleText = (voice: VoiceItem, lang: 'ne' | 'en'): string => {
  const sampleMap: Record<string, { ne: string, en: string }> = {
    kanti_child_ne: {
      ne: 'सानी नानी कान्ति ! नेपाली बाल कथा वाचनको लागि उत्तम।',
      en: 'Little girl Kanti! Perfect for Nepali children story reading.'
    },
    sanjok_child_ne: {
      ne: 'नमस्ते अंकल, नमस्ते आन्टी ! म नयाँ कथा सुनाउँछु है।',
      en: 'Hello uncle, hello auntie! Let me tell you a new story.'
    },
    ana_child_en: {
      ne: 'नमस्ते, म एना हुँ ! मलाई जादुई परीका कथाहरू मन पर्छ।',
      en: 'Hi, I am Ana! I love reading magical fairy tales.'
    },
    rohan_teen_ne: {
      ne: 'के छ साथीहरू? आज हामी नेपालएआई स्टुडियोको बारेमा कुरा गर्दैछौं।',
      en: 'What\'s up friends? Today we are talking about NepalAI Studio.'
    },
    emily_teen_en: {
      ne: 'हे साथीहरू! मेरो च्यानलमा तपाईंहरूलाई स्वागत छ।',
      en: 'Hey guys! Welcome back to my lifestyle channel.'
    },
    sita_ne: {
      ne: 'नमस्ते ! नेपालएआई स्टुडियोको नेपाली संवादात्मक वाचन केन्द्रमा स्वागत छ।',
      en: 'Hello! Welcome to the NepalAI Studio conversational voiceover workspace.'
    },
    maya_en: {
      ne: 'नमस्ते ! नेपालएआई स्टुडियोमा तपाईंलाई स्वागत छ, जुन एआईद्वारा सञ्चालित छ।',
      en: 'Welcome to NepalAI Studio, the premier video production platform powered by AI.'
    },
    jenny_en: {
      ne: 'अद्भूत ! आउनुहोस् सँगै नयाँ पुस्ताको आवाज स्क्रिप्ट निर्माण गरौं।',
      en: 'Awesome! Let\'s build the next-generation voice script together.'
    },
    aarav_ne: {
      ne: 'नेपाली कला, संस्कृति र प्रविधि सँगै अगाडि बढ्दैछन्।',
      en: 'Nepali art, culture, and technology are moving forward together.'
    },
    david_en: {
      ne: 'एउटा संसार जहाँ बुद्धिमत्ता र सिर्जनशीलता मिल्छन्, नयाँ बिहानी आउँछ।',
      en: 'In a world where intelligence meets creativity, a new dawn arises.'
    },
    emma_en: {
      ne: 'हाम्रो त्रैमासिक लक्ष्यहरू पछिल्लो बजार सूचकहरूसँग मिलेका छन्।',
      en: 'Our quarterly goals are highly aligned with the latest market indicators.'
    },
    guru_elder_ne: {
      ne: 'धेरै वर्ष पहिलेको कुरा हो... सुन्नुहोस् है त नानी बाबुहरू।',
      en: 'A long long time ago... Listen carefully, dear children.'
    },
    aama_elder_ne: {
      ne: 'बाबु, स्वस्थ बस, खुसी बस। आजको दिन धेरै राम्रो छ।',
      en: 'My child, stay healthy and happy. Today is a beautiful day.'
    },
    arthur_elder_en: {
      ne: 'मलाई पुरानो जमानाको एउटा कथा सुनाउन दिनुहोस्।',
      en: 'Let me share a story from the days of long ago.'
    },
    ambient_cafe: {
      ne: 'पसलको चहलपहल र नेपाली संवादको पृष्ठभूमि आवाज।',
      en: 'Teashop chatter and background conversational sounds.'
    },
    ambient_wind: {
      ne: 'हिमालयको चिसो हावा र घन्टीको मधुर धुन।',
      en: 'Chilly Himalayan wind and soothing sound of bells.'
    }
  };

  const entry = sampleMap[voice.id];
  if (entry) {
    return lang === 'ne' ? entry.ne : entry.en;
  }
  return voice.sampleText;
};

interface ToneAnalysisResult {
  tone: string;
  description: string;
  matchedKeywords: string[];
  recommendedVoiceId: string;
  recommendedStyle: string;
  recommendedEmotion: string;
}

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
  const [pitchVal, setPitchVal] = useState(0); // dynamic pitch tag slider (-30% to +30%)
  const [phoneticDict, setPhoneticDict] = useState<'ne-deva' | 'en-ipa'>('ne-deva');
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

  // Native Audio Player preview component states
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerVolume, setPlayerVolume] = useState(1.0);
  const [playerIsMuted, setPlayerIsMuted] = useState(false);
  const [playerPlaybackRate, setPlayerPlaybackRate] = useState(1.0);

  // Tag Cloud and active selected descriptor state
  const [selectedDescriptor, setSelectedDescriptor] = useState<string | null>(null);

  const DESCRIPTORS = [
    { label: 'Happy', value: 'happy', style: 'talk', rate: 1.1, textAdj: '[Speed: Fast][Emphasis: Strong]', desc: 'Cheerful, optimistic vlogging tone.' },
    { label: 'Suspense', value: 'horror', style: 'drama', rate: 0.85, textAdj: '[Speed: Slow][Volume: Soft]', desc: 'Tense, whispering suspense.' },
    { label: 'Calm', value: 'neutral', style: 'story', rate: 0.9, textAdj: '[Pause: 1s]', desc: 'Relaxed, tranquil pacing.' },
    { label: 'Energetic', value: 'energetic', style: 'quick_talk', rate: 1.2, textAdj: '[Emphasis: Strong][Speed: Fast]', desc: 'High-impact promo & marketing.' },
    { label: 'Sad', value: 'sad', style: 'drama', rate: 0.8, textAdj: '[Pause: 2s][Speed: Slow]', desc: 'Solemn, reflective, deep drama.' },
    { label: 'Cinematic', value: 'energetic', style: 'documentary', rate: 1.05, textAdj: '[Emphasis: Strong]', desc: 'Epic narration with cinematic depth.' },
    { label: 'Corporate', value: 'neutral', style: 'general', rate: 1.0, textAdj: '[Emphasis: Reduced]', desc: 'Credible, professional corporate voice.' },
    { label: 'Soft/Whisper', value: 'sad', style: 'drama', rate: 0.9, textAdj: '[Volume: Soft]', desc: 'Intimate storytelling whisper.' }
  ];

  // AI Tone Analysis state
  const [autoAnalysis, setAutoAnalysis] = useState<ToneAnalysisResult | null>(null);

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

  const [voicesList, setVoicesList] = useState<VoiceItem[]>(VOICES);
  const [activeEditorTab, setActiveEditorTab] = useState<'single' | 'batch' | 'clone'>('single');

  // Batch Processing State
  const [batchText, setBatchText] = useState<string>('');
  const [batchItems, setBatchItems] = useState<{
    id: string;
    text: string;
    title: string;
    isProcessing: boolean;
    audioUrl?: string;
    isSuccess: boolean;
    isError: boolean;
  }[]>([]);

  // Voice Cloner State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [clonedAudioUrl, setClonedAudioUrl] = useState<string | null>(null);
  const [newClonedVoiceName, setNewClonedVoiceName] = useState('');
  const [clonedVoiceDemographic, setClonedVoiceDemographic] = useState<'children' | 'teen' | 'young_adult' | 'adult' | 'elderly' | 'ambient'>('young_adult');
  const [clonedVoiceGender, setClonedVoiceGender] = useState<'Female' | 'Male' | 'Neutral'>('Female');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Sample playback states & features
  const [samplePhoneticLang, setSamplePhoneticLang] = useState<'ne' | 'en'>('ne');
  const [comparedVoiceIds, setComparedVoiceIds] = useState<string[]>([]);
  const [playingSampleVoiceIds, setPlayingSampleVoiceIds] = useState<Record<string, boolean>>({});
  const playingAudiosRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Cleanup playing audios on unmount
    return () => {
      Object.keys(playingAudiosRef.current).forEach(key => {
        playingAudiosRef.current[key]?.pause();
      });
      playingAudiosRef.current = {};
    };
  }, []);

  const selectedVoice = voicesList.find(v => v.id === selectedVoiceId) || voicesList[5]; // defaults to Sita

  const stopAllSamples = () => {
    Object.keys(playingAudiosRef.current).forEach(key => {
      playingAudiosRef.current[key]?.pause();
    });
    playingAudiosRef.current = {};
    setPlayingSampleVoiceIds({});
  };

  const playVoiceSample = async (voice: VoiceItem, e?: React.MouseEvent, overrideLang?: 'ne' | 'en') => {
    if (e) e.stopPropagation();
    
    const playLang = overrideLang || samplePhoneticLang;
    const playKey = `${voice.id}_${playLang}`;

    if (playingSampleVoiceIds[playKey]) {
      const existing = playingAudiosRef.current[playKey];
      if (existing) {
        existing.pause();
        delete playingAudiosRef.current[playKey];
      }
      setPlayingSampleVoiceIds(prev => ({ ...prev, [playKey]: false }));
      return;
    }

    // Pause active timeline synthesis voiceover if playing
    if (activeAudioElement) {
      activeAudioElement.pause();
      setIsPlaying(false);
    }

    setPlayingSampleVoiceIds(prev => ({ ...prev, [playKey]: true }));

    try {
      const targetUserId = user?.id || 'usr_guest_' + Date.now();
      const sampleTextToSynthesize = getVoiceSampleText(voice, playLang);
      
      const data = await apiGenerateAudio(
        targetUserId,
        sampleTextToSynthesize,
        voice.id,
        playLang === 'ne' ? 'ne-NP' : 'en-US',
        'neutral',
        'general'
      );

      if (data?.result?.url) {
        const audio = new Audio(data.result.url);
        playingAudiosRef.current[playKey] = audio;

        const stopAudio = () => {
          audio.pause();
          delete playingAudiosRef.current[playKey];
          setPlayingSampleVoiceIds(prev => ({ ...prev, [playKey]: false }));
        };

        const timeoutId = setTimeout(stopAudio, 5000);

        audio.onended = stopAudio;
        audio.onerror = stopAudio;
        audio.ontimeupdate = () => {
          if (audio.currentTime >= 5) {
            stopAudio();
            clearTimeout(timeoutId);
          }
        };

        await audio.play().catch(err => {
          console.warn('Sample playback failed:', err);
          stopAudio();
          clearTimeout(timeoutId);
        });
      } else {
        setPlayingSampleVoiceIds(prev => ({ ...prev, [playKey]: false }));
      }
    } catch (err) {
      console.error('Failed to generate sample voiceover:', err);
      setPlayingSampleVoiceIds(prev => ({ ...prev, [playKey]: false }));
    }
  };

  const toggleVoiceComparison = (id: string) => {
    setComparedVoiceIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(vid => vid !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const validateSsmlAndMarkup = (scriptText: string): string[] => {
    const warnings: string[] = [];

    // 1. Validate custom bracket tags
    const bracketMatches = scriptText.match(/\[([^\]]+)\]/g) || [];
    for (const match of bracketMatches) {
      const inner = match.slice(1, -1).trim();
      const lower = inner.toLowerCase();

      if (['/speed', '/volume', '/emphasis', '/pitch'].includes(lower)) {
        continue;
      }

      if (lower.startsWith('pause:')) {
        const val = inner.split(':')[1]?.trim() || '';
        if (/^[0-9\.]+(s|ms)$/i.test(val)) {
          continue;
        } else {
          warnings.push(`Invalid pause value in '${match}' (Format should be e.g. [Pause: 1s] or [Pause: 500ms])`);
          continue;
        }
      }

      if (lower.startsWith('speed:')) {
        const val = lower.split(':')[1]?.trim() || '';
        if (['slow', 'fast', 'medium', 'x-fast', 'x-slow'].includes(val)) {
          continue;
        } else {
          warnings.push(`Unsupported speed value in '${match}' (Supported: slow, fast, medium, x-fast, x-slow)`);
          continue;
        }
      }

      if (lower.startsWith('volume:')) {
        const val = lower.split(':')[1]?.trim() || '';
        if (['loud', 'soft', 'medium', 'x-loud', 'x-soft'].includes(val)) {
          continue;
        } else {
          warnings.push(`Unsupported volume value in '${match}' (Supported: loud, soft, medium, x-loud, x-soft)`);
          continue;
        }
      }

      if (lower.startsWith('emphasis:')) {
        const val = lower.split(':')[1]?.trim() || '';
        if (['strong', 'moderate', 'reduced'].includes(val)) {
          continue;
        } else {
          warnings.push(`Unsupported emphasis level in '${match}' (Supported: strong, moderate, reduced)`);
          continue;
        }
      }

      if (lower.startsWith('pitch:')) {
        const val = lower.split(':')[1]?.trim() || '';
        if (/^[+\-]?[0-9\.]+%$/i.test(val) || ['low', 'high', 'medium', 'x-low', 'x-high', 'default'].includes(val)) {
          continue;
        } else {
          warnings.push(`Unsupported pitch level or percentage in '${match}' (Supported: high, low, medium, x-high, x-low, or e.g. +10%, -15%)`);
          continue;
        }
      }

      warnings.push(`Unrecognized markup instruction: '${match}'`);
    }

    // 2. Validate SSML XML tags
    const xmlTagRegex = /<([^>]+)>/g;
    let xmlMatch;
    while ((xmlMatch = xmlTagRegex.exec(scriptText)) !== null) {
      const fullTag = xmlMatch[0];
      const tagContent = xmlMatch[1].trim();
      const isClosing = tagContent.startsWith('/');
      const tagName = (isClosing ? tagContent.slice(1) : tagContent.split(/\s+/)[0]).toLowerCase().replace(/\/$/, '');

      const allowedTags = ['speak', 'voice', 'break', 'prosody', 'emphasis'];
      if (!allowedTags.includes(tagName)) {
        warnings.push(`Unsupported SSML XML tag: '${fullTag}' (Only standard tags like <break/>, <prosody>, <emphasis> are supported)`);
        continue;
      }

      if (!isClosing && tagName !== 'speak' && tagName !== 'voice') {
        const attrsString = tagContent.slice(tagName.length).trim().replace(/\/$/, '').trim();
        if (attrsString) {
          const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
            const attrName = attrMatch[1].toLowerCase();
            if (tagName === 'break' && attrName !== 'time') {
              warnings.push(`Unsupported attribute '${attrName}' in SSML tag '${fullTag}' (Only 'time' is supported for <break>)`);
            } else if (tagName === 'prosody' && !['rate', 'volume', 'pitch'].includes(attrName)) {
              warnings.push(`Unsupported attribute '${attrName}' in SSML tag '${fullTag}' (Only 'rate', 'volume', and 'pitch' are supported for <prosody>)`);
            } else if (tagName === 'emphasis' && attrName !== 'level') {
              warnings.push(`Unsupported attribute '${attrName}' in SSML tag '${fullTag}' (Only 'level' is supported for <emphasis>)`);
            }
          }
        }
      }
    }

    return warnings;
  };

  const unrecognizedTags = validateSsmlAndMarkup(text);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      setProjects(prev => [...prev, newProjectName.trim()]);
      setSelectedProject(newProjectName.trim());
      setNewProjectName('');
      setShowAddProject(false);
    }
  };

  const analyzeToneAndRecommendProfile = (scriptText: string): ToneAnalysisResult => {
    const lowercaseText = scriptText.toLowerCase();
    
    // Documentary rules
    const documentaryKeywords = [
      'history', 'ancient', 'heritage', 'nature', 'documentary', 'journey', 'mountains', 'himalaya', 
      'culture', 'valley', 'kathmandu', 'nepal', 'evolution', 'science', 'universe', 'planet',
      'इतिहास', 'संस्कृति', 'नेपाल', 'हिमालय', 'सभ्यता', 'पुराना', 'संसार'
    ];
    
    // Casual / Vlog rules
    const casualKeywords = [
      'hey', 'what\'s up', 'welcome back', 'guys', 'vlog', 'today', 'channel', 'lifestyle', 'awesome', 
      'cool', 'subscribe', 'casual', 'hey guys', 'साथीहरु', 'के छ', 'युट्युब', 'आजको', 'रमाइलो'
    ];
    
    // Storytelling rules
    const storyKeywords = [
      'once upon a time', 'story', 'magical', 'fairy', 'tale', 'princess', 'forest', 'king', 'queen', 
      'children', 'kid', 'dream', 'adventure', 'fable', 'कथा', 'एकादेशमा', 'नानी', 'बाबु', 'राजा'
    ];
    
    // Corporate rules
    const corporateKeywords = [
      'welcome to', 'presentation', 'corporate', 'business', 'strategy', 'results', 'market', 'financial',
      'growth', 'innovation', 'quarterly', 'management', 'professional', 'development',
      'कार्यालय', 'प्रविधि', 'विकास', 'वित्त', 'लगानी', 'प्रतिवेदन'
    ];
    
    // High energy / Promo rules
    const promoKeywords = [
      'sale', 'discount', 'limited time', 'hurry', 'exclusive', 'offer', 'best price', 'deal', 'promo',
      'supercharge', 'empower', 'now', 'धमाका', 'छुट', 'सस्तो', 'अवसर', 'महत्वपूर्ण'
    ];

    // Dramatic / Melancholic rules
    const dramaKeywords = [
      'deep', 'sad', 'love', 'cry', 'pain', 'lonely', 'dark', 'shadow', 'silence', 'fear', 'lost',
      'माया', 'पीडा', 'आँसु', 'दुःख', 'अँध्यारो', 'त्रास', 'मौन'
    ];

    // Count matches
    const counts = {
      documentary: documentaryKeywords.filter(k => lowercaseText.includes(k)),
      casual: casualKeywords.filter(k => lowercaseText.includes(k)),
      story: storyKeywords.filter(k => lowercaseText.includes(k)),
      corporate: corporateKeywords.filter(k => lowercaseText.includes(k)),
      promo: promoKeywords.filter(k => lowercaseText.includes(k)),
      drama: dramaKeywords.filter(k => lowercaseText.includes(k))
    };

    // Find category with most matches
    let maxCategory = 'casual';
    let maxCount = 0;
    
    Object.entries(counts).forEach(([category, list]) => {
      if (list.length > maxCount) {
        maxCount = list.length;
        maxCategory = category;
      }
    });

    if (maxCount === 0) {
      return {
        tone: 'Conversational / Neutral',
        description: 'Standard conversational reading tone.',
        matchedKeywords: [],
        recommendedVoiceId: 'sita_ne',
        recommendedStyle: 'general',
        recommendedEmotion: 'neutral'
      };
    }

    switch (maxCategory) {
      case 'documentary':
        return {
          tone: 'Historical / Documentary',
          description: 'Deep, slow, cinematic and highly authoritative tone with pacing pauses.',
          matchedKeywords: counts.documentary,
          recommendedVoiceId: 'david_en',
          recommendedStyle: 'documentary',
          recommendedEmotion: 'neutral'
        };
      case 'story':
        return {
          tone: 'Folk & Storytelling',
          description: 'Warm, highly expressive tone perfect for young narratives and bedtime fables.',
          matchedKeywords: counts.story,
          recommendedVoiceId: 'guru_elder_ne',
          recommendedStyle: 'story',
          recommendedEmotion: 'happy'
        };
      case 'corporate':
        return {
          tone: 'Professional Corporate',
          description: 'Formal and clear presentation designed for corporate, professional, and educational scripts.',
          matchedKeywords: counts.corporate,
          recommendedVoiceId: 'emma_en',
          recommendedStyle: 'general',
          recommendedEmotion: 'neutral'
        };
      case 'promo':
        return {
          tone: 'Exciting / Promotional',
          description: 'High-impact, fast-paced marketing and sales delivery that captures direct focus.',
          matchedKeywords: counts.promo,
          recommendedVoiceId: 'maya_en',
          recommendedStyle: 'quick_talk',
          recommendedEmotion: 'energetic'
        };
      case 'drama':
        return {
          tone: 'Dramatic / Melancholic',
          description: 'Solemn pacing with profound pauses and empathetic pitch modulation.',
          matchedKeywords: counts.drama,
          recommendedVoiceId: 'aama_elder_ne',
          recommendedStyle: 'drama',
          recommendedEmotion: 'sad'
        };
      case 'casual':
      default:
        return {
          tone: 'Vlog & Casual Conversational',
          description: 'Friendly, relatable young-adult and teenage vocal delivery style.',
          matchedKeywords: counts.casual,
          recommendedVoiceId: 'rohan_teen_ne',
          recommendedStyle: 'talk',
          recommendedEmotion: 'neutral'
        };
    }
  };

  // Run auto keyword analysis on script text changes
  useEffect(() => {
    const handler = setTimeout(() => {
      const res = analyzeToneAndRecommendProfile(text);
      setAutoAnalysis(res);
    }, 400);
    return () => clearTimeout(handler);
  }, [text]);

  // Synchronize activeAudioElement with custom native playback state
  useEffect(() => {
    if (!activeAudioElement) return;

    const handleTimeUpdate = () => {
      setPlayerCurrentTime(activeAudioElement.currentTime);
    };

    const handleDurationChange = () => {
      setPlayerDuration(activeAudioElement.duration || 0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlayerCurrentTime(0);
    };

    activeAudioElement.addEventListener('timeupdate', handleTimeUpdate);
    activeAudioElement.addEventListener('durationchange', handleDurationChange);
    activeAudioElement.addEventListener('play', handlePlay);
    activeAudioElement.addEventListener('pause', handlePause);
    activeAudioElement.addEventListener('ended', handleEnded);

    // Initial load sync
    setPlayerDuration(activeAudioElement.duration || 0);
    setPlayerCurrentTime(activeAudioElement.currentTime || 0);
    setPlayerPlaybackRate(activeAudioElement.playbackRate || 1.0);
    setPlayerVolume(activeAudioElement.volume);
    setPlayerIsMuted(activeAudioElement.muted);

    return () => {
      activeAudioElement.removeEventListener('timeupdate', handleTimeUpdate);
      activeAudioElement.removeEventListener('durationchange', handleDurationChange);
      activeAudioElement.removeEventListener('play', handlePlay);
      activeAudioElement.removeEventListener('pause', handlePause);
      activeAudioElement.removeEventListener('ended', handleEnded);
    };
  }, [activeAudioElement]);

  const togglePlayerPlay = () => {
    if (!activeAudioElement) return;
    if (isPlaying) {
      activeAudioElement.pause();
    } else {
      activeAudioElement.play().catch(console.warn);
    }
  };

  const handlePlayerSeek = (newTime: number) => {
    if (!activeAudioElement) return;
    activeAudioElement.currentTime = newTime;
    setPlayerCurrentTime(newTime);
  };

  const handlePlayerVolumeChange = (newVol: number) => {
    if (!activeAudioElement) return;
    activeAudioElement.volume = newVol;
    setPlayerVolume(newVol);
    if (newVol > 0 && playerIsMuted) {
      activeAudioElement.muted = false;
      setPlayerIsMuted(false);
    }
  };

  const togglePlayerMute = () => {
    if (!activeAudioElement) return;
    const nextMute = !playerIsMuted;
    activeAudioElement.muted = nextMute;
    setPlayerIsMuted(nextMute);
  };

  const handlePlayerRateChange = (newRate: number) => {
    if (!activeAudioElement) return;
    activeAudioElement.playbackRate = newRate;
    setPlayerPlaybackRate(newRate);
  };

  const handleSelectDescriptor = (desc: typeof DESCRIPTORS[0]) => {
    setSelectedDescriptor(desc.label);
    setEmotion(desc.value as any);
    setFormatStyle(desc.style as any);
    setRate(desc.rate);
    
    // Automatically adjust the underlying script prompt by wrapping/prepending the emotional descriptors markup tag
    let cleanedText = text;
    // Strip previous tag matches
    DESCRIPTORS.forEach(d => {
      if (cleanedText.startsWith(d.textAdj)) {
        cleanedText = cleanedText.replace(d.textAdj, '').trim();
      }
    });
    
    const adjustedText = `${desc.textAdj} ${cleanedText}`;
    setText(adjustedText);
  };

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    setAiSuggestions(null);
    try {
      const data = await apiGetAudioSuggestions(text, language);
      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
        
        // Auto-recommend settings
        const foundVoice = voicesList.find(v => 
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
    if (tagText.includes('...')) {
      const parts = tagText.split('...');
      insertion = parts[0] + (selText || '') + parts[1];
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

      // Extract parameters and strip tags from text
      let cleanedText = text;
      let extractedSpeed: string | undefined = undefined;
      let extractedVolume: string | undefined = undefined;
      let extractedPitch: string | undefined = undefined;

      const speedMatch = cleanedText.match(/\[Speed:\s*([^\]]+)\]/i);
      if (speedMatch) {
        extractedSpeed = speedMatch[1].trim();
      }

      const volumeMatch = cleanedText.match(/\[Volume:\s*([^\]]+)\]/i);
      if (volumeMatch) {
        extractedVolume = volumeMatch[1].trim();
      }

      const pitchMatch = cleanedText.match(/\[Pitch:\s*([^\]]+)\]/i);
      if (pitchMatch) {
        extractedPitch = pitchMatch[1].trim();
      } else if (pitchVal !== 0) {
        extractedPitch = `${pitchVal > 0 ? '+' : ''}${pitchVal}%`;
      }

      // Strip all formatting and instruction bracket tags before sending to TTS engine
      cleanedText = cleanedText
        .replace(/\[Speed:\s*[^\]]+\]/gi, '')
        .replace(/\[Volume:\s*[^\]]+\]/gi, '')
        .replace(/\[Pause:\s*[^\]]+\]/gi, '')
        .replace(/\[Emphasis:\s*[^\]]+\]/gi, '')
        .replace(/\[Pitch:\s*[^\]]+\]/gi, '')
        .replace(/\[\/(Speed|Volume|Emphasis|Pitch)\]/gi, '')
        .trim();
      
      const data = await apiGenerateAudio(
        targetUserId,
        cleanedText || 'नमस्ते',
        voiceIdParam,
        language === 'ne' ? 'ne-NP' : 'en-US',
        emotion,
        formatStyle,
        extractedSpeed,
        extractedVolume,
        extractedPitch,
        phoneticDict
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
          title: `Voiceover: ${(cleanedText || text).slice(0, 20)}...`,
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

  const handleExportSrt = () => {
    const formatSrtTime = (seconds: number): string => {
      const pad = (num: number, size = 2) => String(num).padStart(size, '0');
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
    };

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    let srtString = '';
    let currentTime = 0.0;
    let sequenceIndex = 1;

    lines.forEach((line) => {
      const parts: { type: 'text' | 'pause'; content: string; duration: number }[] = [];
      const regex = /\[Pause:\s*([0-9\.]+(s|ms))\]/gi;
      let lastIdx = 0;
      let match;

      while ((match = regex.exec(line)) !== null) {
        const textPart = line.substring(lastIdx, match.index).trim();
        if (textPart) {
          const duration = Math.max(1.5, textPart.length / 12);
          parts.push({ type: 'text', content: textPart, duration });
        }

        const pauseDurationStr = match[1].toLowerCase();
        let pauseDuration = 1.0;
        if (pauseDurationStr.endsWith('ms')) {
          pauseDuration = parseFloat(pauseDurationStr) / 1000;
        } else if (pauseDurationStr.endsWith('s')) {
          pauseDuration = parseFloat(pauseDurationStr);
        }
        parts.push({ type: 'pause', content: `[Pause: ${match[1]}]`, duration: pauseDuration });
        lastIdx = regex.lastIndex;
      }

      const remainingText = line.substring(lastIdx).trim();
      if (remainingText) {
        const duration = Math.max(1.5, remainingText.length / 12);
        parts.push({ type: 'text', content: remainingText, duration });
      }

      parts.forEach((part) => {
        const startTime = currentTime;
        const endTime = currentTime + part.duration;
        
        srtString += `${sequenceIndex}\n`;
        srtString += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
        srtString += `${part.content}\n\n`;
        
        currentTime = endTime;
        sequenceIndex++;
      });
    });

    const blob = new Blob([srtString], { type: 'text/srt;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nepalai_voiceover_subtitles_${Date.now()}.srt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      setBatchText(fileContent);
      parseBatchParagraphs(fileContent);
    };
    reader.readAsText(file);
  };

  const parseBatchParagraphs = (rawText: string) => {
    let paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length <= 1) {
      paragraphs = rawText.split('\n').map(p => p.trim()).filter(Boolean);
    }

    const items = paragraphs.map((p, idx) => ({
      id: `batch_item_${idx}_${Date.now()}`,
      text: p,
      title: p.slice(0, 25) + '...',
      isProcessing: false,
      isSuccess: false,
      isError: false,
      audioUrl: undefined
    }));
    setBatchItems(items);
  };

  const handleBatchItemGenerate = async (idx: number) => {
    const item = batchItems[idx];
    if (!item) return;

    setBatchItems(prev => prev.map((it, i) => i === idx ? { ...it, isProcessing: true } : it));

    try {
      const targetUserId = user?.id || 'usr_guest_' + Date.now();
      const data = await apiGenerateAudio(
        targetUserId,
        item.text,
        selectedVoice.id,
        language === 'ne' ? 'ne-NP' : 'en-US',
        emotion,
        formatStyle
      );

      if (data?.result?.url) {
        setBatchItems(prev => prev.map((it, i) => i === idx ? { 
          ...it, 
          isProcessing: false, 
          isSuccess: true, 
          audioUrl: data.result.url 
        } : it));

        const newAsset = {
          id: 'asset_batch_' + Date.now() + '_' + idx,
          title: `Batch: ${item.text.slice(0, 20)}...`,
          project: selectedProject,
          voice: selectedVoice.name,
          url: data.result.url,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSyncedAssets(prev => [newAsset, ...prev]);
      } else {
        throw new Error('No audio URL returned');
      }
    } catch (e) {
      console.error(e);
      setBatchItems(prev => prev.map((it, i) => i === idx ? { ...it, isProcessing: false, isError: true } : it));
    }
  };

  const handleProcessAllBatchItems = async () => {
    for (let i = 0; i < batchItems.length; i++) {
      await handleBatchItemGenerate(i);
    }
  };

  const startCloningRecord = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setClonedAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      setRecordingSeconds(0);
      setIsRecording(true);
      setRecordedBlob(null);
      setClonedAudioUrl(null);

      mediaRecorder.start();

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 10) {
            stopCloningRecord();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error opening microphone:', err);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopCloningRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleSaveClonedVoice = () => {
    if (!newClonedVoiceName.trim()) {
      alert('Please enter a voice name');
      return;
    }

    const customId = 'cloned_' + Date.now();
    const clonedVoice: VoiceItem = {
      id: customId,
      name: `${newClonedVoiceName.trim()} (Cloned)`,
      demographic: clonedVoiceDemographic,
      gender: clonedVoiceGender,
      language: 'Nepali',
      role: 'Primary Narrator',
      description: 'Custom voice clone created from browser microphone recording.',
      sampleText: 'नमस्ते ! यो मेरो आफ्नै आवाजको क्लोन प्रोफाइल हो।',
      pitchShift: 'Custom',
      speedShift: '1.0x'
    };

    setVoicesList(prev => [...prev, clonedVoice]);
    setSelectedVoiceId(customId);
    
    setRecordedBlob(null);
    setClonedAudioUrl(null);
    setNewClonedVoiceName('');
    setRecordingSeconds(0);
    setActiveEditorTab('single');
    alert(`Voice clone '${newClonedVoiceName}' successfully generated! You can now select it in the Voice Directory.`);
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
  const filteredVoices = voicesList.filter(voice => {
    if (activeDemographicTab !== 'all' && voice.demographic !== activeDemographicTab) return false;
    return true;
  });

  // Real-time script stats calculations
  const cleanScriptText = text
    .replace(/\[[^\]]+\]/g, '')
    .trim();
  const scriptWords = cleanScriptText.split(/\s+/).filter(w => w.trim().length > 0);
  const scriptWordCount = scriptWords.length;

  let scriptPauseSeconds = 0;
  const pauseRegex = /\[Pause:\s*([0-9\.]+(s|ms))\]/gi;
  let pauseMatch;
  while ((pauseMatch = pauseRegex.exec(text)) !== null) {
    const pauseDurStr = pauseMatch[1].toLowerCase();
    let secs = 1.0;
    if (pauseDurStr.endsWith('ms')) {
      secs = parseFloat(pauseDurStr) / 1000;
    } else if (pauseDurStr.endsWith('s')) {
      secs = parseFloat(pauseDurStr);
    }
    scriptPauseSeconds += secs;
  }

  let scriptReadingSeconds = (scriptWordCount / 2.3) + scriptPauseSeconds;
  if (scriptWordCount === 0 && cleanScriptText.length > 0) {
    scriptReadingSeconds = (cleanScriptText.length / 8) + scriptPauseSeconds;
  }
  const estimatedReadingTimeSec = Math.ceil(scriptReadingSeconds);

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
            
            {/* Mode Tab Switcher */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActiveEditorTab('single')}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 ${
                  activeEditorTab === 'single'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Single Script</span>
              </button>
              <button
                onClick={() => setActiveEditorTab('batch')}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 ${
                  activeEditorTab === 'batch'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Batch Processor</span>
              </button>
              <button
                onClick={() => setActiveEditorTab('clone')}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 ${
                  activeEditorTab === 'clone'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Cloner</span>
              </button>
            </div>

            {activeEditorTab === 'single' && (
              <div className="space-y-5">
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
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-[10px] uppercase text-indigo-500 pr-2 tracking-wider border-r border-slate-200 dark:border-slate-800 mr-1.5 flex items-center gap-1 cursor-help relative group">
                    <span>Standard Markup</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition" />
                    <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 border border-slate-800 text-white text-[10px] rounded-lg shadow-xl z-20 font-normal normal-case leading-relaxed">
                      These tags (e.g. <strong>[Speed: Slow]</strong>, <strong>[Volume: Soft]</strong>) are structural AI instructions. They will configure parameters of the SSML speech synthesis engine and will <strong>not be read aloud</strong>.
                    </span>
                  </span>
                  
                  <button
                    onClick={() => insertMarkupTag('[Pause: 1s]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium flex items-center gap-1"
                    title="Insert 1.0 second pause marker"
                  >
                    <Clock className="w-3 h-3 text-indigo-500" />
                    +1s Pause
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Pause: 500ms]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium"
                    title="Insert 0.5 second pause marker"
                  >
                    +500ms
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Pause: 2s]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium"
                    title="Insert 2.0 seconds dramatic pause marker"
                  >
                    +2s Pause
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Speed: Fast]...[/Speed]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-amber-600 dark:text-amber-400"
                    title="Accelerate pacing for highlighted text"
                  >
                    🏃 Fast
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Speed: Slow]...[/Speed]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-indigo-600 dark:text-indigo-400"
                    title="De-accelerate pacing for highlighted text"
                  >
                    🐢 Slow
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Volume: Loud]...[/Volume]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-rose-600 dark:text-rose-400"
                    title="Increase speaker volume for highlighted text"
                  >
                    🔊 Loud
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Volume: Soft]...[/Volume]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-slate-500"
                    title="Reduce speaker volume for highlighted text"
                  >
                    🔇 Soft
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Emphasis: Strong]...[/Emphasis]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-emerald-600 dark:text-emerald-400"
                    title="Emphasize speech intensity for highlighted text"
                  >
                    🎭 Emphasize
                  </button>
                  <button
                    onClick={() => insertMarkupTag('[Emphasis: Reduced]...[/Emphasis]')}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-medium text-indigo-500"
                    title="Flatten speech intensity for highlighted text"
                  >
                    📉 Flat
                  </button>

                  {/* Real-time Dynamic Stats Counter */}
                  <div className="ml-auto flex items-center gap-2 px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold border border-rose-500/20 shadow-xs select-none">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      <span>{scriptWordCount} words</span>
                    </span>
                    <span className="w-1 h-1 bg-rose-500/30 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>~{estimatedReadingTimeSec < 60 ? `${estimatedReadingTimeSec} seconds` : `${Math.floor(estimatedReadingTimeSec / 60)} min ${estimatedReadingTimeSec % 60}s`}</span>
                    </span>
                  </div>
                </div>

                {/* Neural Prosody Settings (Pitch Slider & Phonetic Dictionary) */}
                <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-[10px] uppercase text-rose-500 pr-2 tracking-wider border-r border-slate-200 dark:border-slate-800 mr-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Neural Tuning</span>
                  </span>

                  {/* Pitch Adjustment Slider */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Pitch adjustment:</span>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={5}
                      value={pitchVal}
                      onChange={e => setPitchVal(parseInt(e.target.value))}
                      className="w-20 accent-rose-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                      title="Adjust default voice pitch offset"
                    />
                    <span className="font-bold text-slate-900 dark:text-white min-w-[32px] text-center">
                      {pitchVal > 0 ? '+' : ''}{pitchVal}%
                    </span>
                    <button
                      onClick={() => insertMarkupTag(`[Pitch: ${pitchVal > 0 ? '+' : ''}${pitchVal}%]...[/Pitch]`)}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-400 transition cursor-pointer font-semibold text-[10px] text-indigo-600 dark:text-indigo-400"
                      title="Wrap selected text with dynamic pitch offset tag"
                    >
                      + Insert Pitch Tag
                    </button>
                  </div>

                  <span className="w-1 h-3 bg-slate-200 dark:bg-slate-800 hidden sm:inline" />

                  {/* Phonetic Dictionary Dropdown */}
                  <div className="flex items-center gap-2 ml-0 sm:ml-auto">
                    <span className="font-semibold">Phonetic Rules:</span>
                    <select
                      value={phoneticDict}
                      onChange={e => setPhoneticDict(e.target.value as any)}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:border-rose-500 font-semibold cursor-pointer text-[10px] text-slate-700 dark:text-slate-300"
                    >
                      <option value="ne-deva">Nepali (Devanagari)</option>
                      <option value="en-ipa">English (IPA)</option>
                    </select>
                  </div>
                </div>

                {/* Helpful note explaining that these tags are instructions and not read aloud */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-[10.5px] text-slate-500 dark:text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    <strong>AI Voice Instructions:</strong> Bracketed tags such as <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/5 px-1 py-0.2 rounded">[Speed: Slow]</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/5 px-1 py-0.2 rounded">[Volume: Soft]</code>, and <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/5 px-1 py-0.2 rounded">[Pitch: +10%]</code> configure the neural engine parameters and are automatically stripped from vocal output (they will <strong>not be read aloud</strong>).
                  </span>
                </div>
              </div>

              {/* Text Area with warning visual borders */}
              <div className="relative">
                <textarea
                  id="tts-textarea"
                  rows={6}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type script here. Insert pause and pacing tags from the bar above for premium performance..."
                  className={`w-full bg-slate-50 dark:bg-slate-950/70 border rounded-xl p-3.5 text-sm text-slate-900 dark:text-white font-['Mukta'] focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-1 resize-none font-medium leading-relaxed transition ${
                    unrecognizedTags.length > 0
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                
                {/* Length Indicator */}
                <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono select-none">
                  {text.length} Chars
                </span>
              </div>

              {/* SSML Schema Real-time Validation Warning Indicator HUD */}
              {unrecognizedTags.length > 0 && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5 animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⚠️ Unsupported SSML / Bracket Markup Detected</span>
                      <span className="px-1.5 py-0.2 bg-red-500/20 text-red-700 dark:text-red-300 rounded-full text-[9px] font-bold">
                        {unrecognizedTags.length} Error{unrecognizedTags.length > 1 ? 's' : ''}
                      </span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                      The active engine requires bracket instructions to be formatted correctly, or standard whitelisted SSML tags (<code className="font-mono font-semibold text-red-600">&lt;break/&gt;</code>, <code className="font-mono font-semibold text-red-600">&lt;prosody&gt;</code>, <code className="font-mono font-semibold text-red-600">&lt;emphasis&gt;</code>) with valid attributes. Please correct:
                    </p>
                    <ul className="list-disc list-inside text-[10.5px] space-y-1 pl-1 text-red-700 dark:text-red-300 font-medium">
                      {unrecognizedTags.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Aesthetic Emotional Descriptors Tag Cloud */}
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                  Aesthetic Emotional Descriptors Tag Cloud
                </span>
                <p className="text-[11px] text-slate-500">
                  Select a mood to automatically adapt state settings and append underlying markup cues:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DESCRIPTORS.map(desc => (
                    <button
                      key={desc.label}
                      type="button"
                      onClick={() => handleSelectDescriptor(desc)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 border ${
                        selectedDescriptor === desc.label
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                      title={desc.desc}
                    >
                      {desc.label === 'Happy' && '😊'}
                      {desc.label === 'Suspense' && '🕵️‍♂️'}
                      {desc.label === 'Calm' && '😌'}
                      {desc.label === 'Energetic' && '⚡'}
                      {desc.label === 'Sad' && '😢'}
                      {desc.label === 'Cinematic' && '🎬'}
                      {desc.label === 'Corporate' && '💼'}
                      {desc.label === 'Soft/Whisper' && '🤫'}
                      <span>{desc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live AI Tone Analyzer HUD */}
              {autoAnalysis && (
                <div className="p-3.5 bg-gradient-to-r from-rose-50/50 to-indigo-50/50 dark:from-rose-950/10 dark:to-indigo-950/15 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                        Live AI Tone Analysis: <span className="text-rose-600 dark:text-rose-400">{autoAnalysis.tone}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {autoAnalysis.description}
                    </p>
                    {autoAnalysis.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[9px] text-slate-400 mr-1 font-semibold">Matched Keywords:</span>
                        {autoAnalysis.matchedKeywords.map(k => (
                          <span key={k} className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded text-[9px] text-slate-700 dark:text-slate-300 font-mono font-bold">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="text-right hidden md:block">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Recommended Voice</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {voicesList.find(v => v.id === autoAnalysis.recommendedVoiceId)?.name || 'Sita (Nepali Natural)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoiceId(autoAnalysis.recommendedVoiceId);
                        const found = voicesList.find(v => v.id === autoAnalysis.recommendedVoiceId);
                        if (found) {
                          setLanguage(found.language === 'Nepali' ? 'ne' : 'en');
                        }
                        setFormatStyle(autoAnalysis.recommendedStyle as any);
                        setEmotion(autoAnalysis.recommendedEmotion as any);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow transition"
                    >
                      Apply Recommended Profile
                    </button>
                  </div>
                </div>
              )}
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

            {/* Custom Native Premium Audio Player with Full Playback Controls */}
            {generatedAudioUrl && (
              <div id="neural-preview-player" className="p-5 bg-slate-950 text-white rounded-xl space-y-4 border border-slate-800 shadow-xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                      <Volume2 className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Active Vocal Preview Playback</span>
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                        Workspace Project: {selectedProject}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-indigo-900 border border-indigo-700 px-2 py-0.5 rounded text-indigo-200 font-bold uppercase">
                    Synced: {selectedVoice.name}
                  </span>
                </div>

                {/* Scrubber timeline bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{new Date(playerCurrentTime * 1000).toISOString().substr(14, 5)}</span>
                    <span>{new Date(playerDuration * 1000).toISOString().substr(14, 5)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={playerDuration || 100}
                    step={0.05}
                    value={playerCurrentTime}
                    onChange={(e) => handlePlayerSeek(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* Main player controls row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  {/* Play/Pause & Mute Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayerPlay}
                      className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition shadow-md"
                      title={isPlaying ? "Pause Preview" : "Play Preview"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlayerMute}
                        className="p-2 text-slate-400 hover:text-white transition"
                        title={playerIsMuted ? "Unmute" : "Mute"}
                      >
                        {playerIsMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume1 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={playerIsMuted ? 0 : playerVolume}
                        onChange={(e) => handlePlayerVolumeChange(parseFloat(e.target.value))}
                        className="w-16 accent-rose-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  {/* Playback rate speed control */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Speed:</span>
                    {([0.75, 1.0, 1.25, 1.5] as const).map(spd => (
                      <button
                        type="button"
                        key={spd}
                        onClick={() => handlePlayerRateChange(spd)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          playerPlaybackRate === spd ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {/* Actions (Download MP3 & Export SRT) */}
                  <div className="flex items-center gap-2">
                    <a
                      href={generatedAudioUrl}
                      download={`nepalai_voiceover_${Date.now()}.mp3`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 flex items-center gap-1.5 text-[10px] font-bold"
                      title="Download MP3"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MP3</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleExportSrt}
                      className="p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 hover:text-white transition border border-indigo-800/80 flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                      title="Export script timing tags as .SRT subtitles file"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export .SRT</span>
                    </button>
                  </div>
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
            )}

            {activeEditorTab === 'batch' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-rose-500" />
                      Batch Script Processor
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Paste multiple paragraphs or upload a text file. Each block will be processed into a separate audio track.
                    </p>
                  </div>
                </div>

                {/* Upload section */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-950/40 transition relative">
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleBatchFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      Drag and drop your script .txt file here, or click to browse
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports plain text (.txt) files. Paragraphs split automatically.
                    </p>
                  </div>
                </div>

                {/* Manual input / pasted text */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Or Paste Multiple Paragraphs Below:
                  </label>
                  <textarea
                    rows={6}
                    value={batchText}
                    onChange={(e) => {
                      setBatchText(e.target.value);
                      parseBatchParagraphs(e.target.value);
                    }}
                    placeholder="Paste paragraph 1&#10;&#10;Paste paragraph 2&#10;&#10;Separate with empty lines..."
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Parsed paragraphs items count */}
                {batchItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Detected {batchItems.length} Audio Track Blocks
                      </span>
                      <button
                        onClick={handleProcessAllBatchItems}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow transition flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Synthesize All Blocks</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {batchItems.map((item, idx) => (
                        <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-bold text-indigo-500 block uppercase">Track Block #{idx + 1}</span>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                              {item.text}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {item.isProcessing && (
                              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            )}
                            {item.isSuccess && (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                  Ready
                                </span>
                                {item.audioUrl && (
                                  <audio src={item.audioUrl} controls className="h-6 w-32 scale-90" />
                                )}
                              </div>
                            )}
                            {item.isError && (
                              <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/20">
                                Failed
                              </span>
                            )}
                            {!item.isProcessing && !item.isSuccess && !item.isError && (
                              <button
                                onClick={() => handleBatchItemGenerate(idx)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 text-[10px] font-bold cursor-pointer"
                              >
                                Synthesize
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeEditorTab === 'clone' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-rose-500" />
                      Custom Neural Voice Cloner
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Record a 10-second vocal sample via browser microphone to train and generate a custom AI voice profile.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Recorder Control Unit */}
                  <div className="p-4 bg-slate-950 rounded-xl text-center space-y-4 border border-slate-800">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      Microphone Controller
                    </span>

                    {/* Timer & Visualization */}
                    <div className="relative h-24 flex items-center justify-center">
                      {isRecording ? (
                        <div className="absolute inset-0 flex items-center justify-center gap-1">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                              style={{
                                height: `${20 + Math.random() * 60}%`,
                                animationDelay: `${i * 0.15}s`,
                                animationDuration: '0.6s'
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Mic className="w-12 h-12 text-slate-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-2xl font-mono font-bold text-white block">
                        {isRecording ? `00:${recordingSeconds.toString().padStart(2, '0')}` : '00:00'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isRecording ? 'Recording active... speak clearly' : '10-second reference recording required'}
                      </span>
                    </div>

                    {/* Record Control Button */}
                    <div className="flex items-center justify-center gap-3">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startCloningRecord}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Start Recording</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopCloningRecord}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow border border-slate-700"
                        >
                          <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                          <span>Stop Recording</span>
                        </button>
                      )}
                    </div>

                    {clonedAudioUrl && (
                      <div className="space-y-2 pt-2 border-t border-slate-900 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Verify Reference Recording
                        </span>
                        <audio src={clonedAudioUrl} controls className="w-full h-8" />
                      </div>
                    )}
                  </div>

                  {/* Profile Meta Info Form */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Voice Profile Name:
                      </label>
                      <input
                        type="text"
                        value={newClonedVoiceName}
                        onChange={(e) => setNewClonedVoiceName(e.target.value)}
                        placeholder="e.g. Ramesh, Prakash, Sunita"
                        className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Demographic:
                        </label>
                        <select
                          value={clonedVoiceDemographic}
                          onChange={(e) => setClonedVoiceDemographic(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950"
                        >
                          <option value="children">Children</option>
                          <option value="teen">Teens</option>
                          <option value="young_adult">Mid-20s</option>
                          <option value="adult">30s-40s</option>
                          <option value="elderly">Senior</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Gender:
                        </label>
                        <select
                          value={clonedVoiceGender}
                          onChange={(e) => setClonedVoiceGender(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Neutral">Neutral</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveClonedVoice}
                      disabled={!recordedBlob || !newClonedVoiceName.trim()}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Cloned Profile</span>
                    </button>
                  </div>
                </div>
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
              scriptText={text}
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
          
          {/* Section 1: Demographic Voice Selection Drawer with Comparison and Phonetic Toggles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Library className="w-3.5 h-3.5 text-indigo-500" />
                  Neural Voice Directory
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {voicesList.length} Profiles Available
                </span>
              </div>
              
              {/* Dynamic Phonetics Selector */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">
                  Sample Phonetics
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSamplePhoneticLang('ne');
                      stopAllSamples();
                    }}
                    className={`text-[9px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                      samplePhoneticLang === 'ne'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 border border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    🇳🇵 नेपाली (NP)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSamplePhoneticLang('en');
                      stopAllSamples();
                    }}
                    className={`text-[9px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                      samplePhoneticLang === 'en'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 border border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    🇺🇸 English (EN)
                  </button>
                </div>
              </div>
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

            {/* Real-time Side-by-Side Comparison Desk */}
            {comparedVoiceIds.length > 0 && (
              <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚖️ Voice Comparison Desk</span>
                    <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-[9px]">
                      {comparedVoiceIds.length}/2 Selected
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setComparedVoiceIds([]);
                      stopAllSamples();
                    }}
                    className="text-[9px] font-bold text-rose-500 hover:text-rose-600 uppercase"
                  >
                    Clear Desk
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[0, 1].map(index => {
                    const voiceId = comparedVoiceIds[index];
                    const compVoice = voicesList.find(v => v.id === voiceId);

                    if (!compVoice) {
                      return (
                        <div key={index} className="h-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-400 select-none">
                          + Add model to compare
                        </div>
                      );
                    }

                    const sampleKey = `${compVoice.id}_${samplePhoneticLang}`;
                    const isCompPlaying = !!playingSampleVoiceIds[sampleKey];

                    return (
                      <div key={index} className="p-2.5 bg-white dark:bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2 flex flex-col justify-between relative overflow-hidden">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{compVoice.name}</span>
                            <button
                              type="button; button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVoiceComparison(compVoice.id);
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-rose-500"
                              title="Remove from comparison"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 capitalize">{compVoice.demographic.replace('_', ' ')} • {compVoice.gender}</p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[8px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-semibold truncate max-w-[55px]">
                            {compVoice.pitchShift} Pitch
                          </span>
                          <button
                            type="button"
                            onClick={(e) => playVoiceSample(compVoice, e)}
                            className={`p-1 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                              isCompPlaying
                                ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {isCompPlaying ? (
                              <Pause className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {comparedVoiceIds.length === 2 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const voiceA = voicesList.find(v => v.id === comparedVoiceIds[0]);
                      const voiceB = voicesList.find(v => v.id === comparedVoiceIds[1]);
                      if (voiceA && voiceB) {
                        playVoiceSample(voiceA);
                        setTimeout(() => playVoiceSample(voiceB), 50);
                      }
                    }}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9.5px] font-bold shadow-xs transition-all flex items-center justify-center gap-1"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>🔊 Dual Audition (Play Simultaneously)</span>
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Voice Cards Grid */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredVoices.map(voice => {
                const sampleKey = `${voice.id}_${samplePhoneticLang}`;
                const isSamplePlaying = !!playingSampleVoiceIds[sampleKey];
                const isComparing = comparedVoiceIds.includes(voice.id);

                return (
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

                      {/* Metadata Badges & Comparison Selector */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-[8px] font-bold text-slate-400">
                        <span className="uppercase text-indigo-500 bg-indigo-500/5 px-1 py-0.2 rounded">{voice.role}</span>
                        <span>•</span>
                        <span>Pitch: {voice.pitchShift}</span>
                        <span>•</span>
                        <span>Speed: {voice.speedShift}</span>
                      </div>
                    </div>

                    {/* Play and Compare controls */}
                    <div className="self-center shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVoiceComparison(voice.id);
                        }}
                        className={`px-1.5 py-1 rounded text-[9px] font-bold border transition-all flex items-center gap-1 select-none cursor-pointer ${
                          isComparing
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                        title="Add to Voice Comparison Desk"
                      >
                        ⚖️ {isComparing ? 'Comparing' : 'Compare'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => playVoiceSample(voice, e)}
                        className={`p-1.5 rounded-full transition-all border shadow-xs flex items-center justify-center ${
                          isSamplePlaying
                            ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105'
                        }`}
                        title={isSamplePlaying ? "Stop Sample" : "Play Voice Sample Demo"}
                      >
                        {isSamplePlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
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
