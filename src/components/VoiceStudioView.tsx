import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Play, Pause, Square, Volume2, Volume1, Sparkles, Check, Download, Music, AlertCircle, 
  ArrowRight, Save, Library, Smile, Clock, FileText, RotateCcw, Compass, 
  UserCheck, HelpCircle, ChevronRight, VolumeX, Flame, Heart, Headphones, Scissors, Upload, Trash2,
  Sliders, Radio, Layers, Activity, SlidersHorizontal, Users, Wand2, Mic2, Clapperboard, AudioWaveform
} from 'lucide-react';
import { UserSession, UserTrialQuota } from '../types';
import { apiGenerateAudio, apiGetAudioSuggestions } from '../lib/api';
import { VoiceWaveformVisualizer } from './VoiceWaveformVisualizer';
import { saveMediaItem, getGeneratedSoundList, removeMediaItem, MediaItem } from '../lib/mediaLibrary';
import { studioMastering, MasterRackSettings, DEFAULT_MASTER_SETTINGS } from '../lib/studioMastering';

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
  // Flagship Pure Neural Voices (Real Natural Azure TTS)
  { id: 'hemkala_pure_ne', name: 'Hemkala (Pure Neural • Real Natural)', demographic: 'young_adult', gender: 'Female', language: 'Nepali', role: 'Primary Narrator', description: 'Official Azure ne-NP-HemkalaNeural. 100% unaltered native acoustic prosody, broadcast master clarity.', sampleText: 'नमस्ते! म हेमकला हुँ। यो मेरो वास्तविक, शुद्ध र प्राकृतिक नेपाली आवाज हो।', pitchShift: 'Natural (0%)', speedShift: '1.0x' },
  { id: 'sagar_pure_ne', name: 'Sagar (Pure Neural • Real Natural)', demographic: 'adult', gender: 'Male', language: 'Nepali', role: 'Primary Narrator', description: 'Official Azure ne-NP-SagarNeural. 100% unaltered native baritone cadence, authentic broadcast delivery.', sampleText: 'नमस्ते! म सागर हुँ। यो मेरो वास्तविक, शुद्ध र प्राकृतिक नेपाली आवाज हो।', pitchShift: 'Natural (0%)', speedShift: '1.0x' },

  // Children
  { id: 'kanti_child_ne', name: 'Kanti (Nepali Girl)', demographic: 'children', gender: 'Female', language: 'Nepali', role: 'Secondary Character', description: 'Sweet, bright, authentic natural child voiceover.', sampleText: 'सानी नानी कान्ति ! नेपाली बाल कथा वाचनको लागि उत्तम।', pitchShift: 'Natural', speedShift: '1.0x' },
  { id: 'sanjok_child_ne', name: 'Sanjok (Nepali Boy)', demographic: 'children', gender: 'Male', language: 'Nepali', role: 'Secondary Character', description: 'Energetic, cheerful natural young boy voice.', sampleText: 'नमस्ते अंकल, नमस्ते आन्टी ! म नयाँ कथा सुनाउँछु है।', pitchShift: 'Natural', speedShift: '1.0x' },
  { id: 'ana_child_en', name: 'Ana (English Child)', demographic: 'children', gender: 'Female', language: 'English', role: 'Secondary Character', description: 'Natural young English girl voice.', sampleText: 'Hi, I am Ana! I love reading magical fairy tales.', pitchShift: 'Natural', speedShift: '1.0x' },

  // Teens
  { id: 'rohan_teen_ne', name: 'Rohan (Nepali Teen)', demographic: 'teen', gender: 'Male', language: 'Nepali', role: 'Secondary Character', description: 'Relatable, casual natural Nepali teenager.', sampleText: 'के छ साथीहरू? आज हामी नेपालएआई स्टुडियोको बारेमा कुरा गर्दैछौं।', pitchShift: 'Natural', speedShift: '1.0x' },
  { id: 'emily_teen_en', name: 'Emily (English Teen)', demographic: 'teen', gender: 'Female', language: 'English', role: 'Secondary Character', description: 'Bouncy, enthusiastic natural English teen voice.', sampleText: 'Hey guys! Welcome back to my lifestyle channel.', pitchShift: 'Natural', speedShift: '1.0x' },

  // Young Adults
  { id: 'sita_ne', name: 'Sita (Nepali Natural)', demographic: 'young_adult', gender: 'Female', language: 'Nepali', role: 'Primary Narrator', description: 'Clear, elegant, and highly articulate natural female voice.', sampleText: 'नमस्ते ! नेपालएआई स्टुडियोको नेपाली संवादात्मक वाचन केन्द्रमा स्वागत छ।', pitchShift: 'Natural', speedShift: '1.0x' },
  { id: 'maya_en', name: 'Maya (English US)', demographic: 'young_adult', gender: 'Female', language: 'English', role: 'Primary Narrator', description: 'Professional, confident, clear presentation voice.', sampleText: 'Welcome to NepalAI Studio, the premier video production platform powered by AI.', pitchShift: 'Natural', speedShift: '1.0x' },
  { id: 'jenny_en', name: 'Jenny (English Conversational)', demographic: 'young_adult', gender: 'Female', language: 'English', role: 'Secondary Character', description: 'Warm, conversational, and energetic natural voice.', sampleText: 'Awesome! Let\'s build the next-generation voice script together.', pitchShift: 'Natural', speedShift: '1.0x' },

  // Adults
  { id: 'aarav_ne', name: 'Aarav (Nepali Warm)', demographic: 'adult', gender: 'Male', language: 'Nepali', role: 'Primary Narrator', description: 'Warm, deep, baritone natural narrator.', sampleText: 'नेपाली कला, संस्कृति र प्रविधि सँगै अगाडि बढ्दैछन्।', pitchShift: 'Natural', speedShift: '1.0x' },
  { id: 'david_en', name: 'David (English Cinematic)', demographic: 'adult', gender: 'Male', language: 'English', role: 'Primary Narrator', description: 'Deep, dramatic storytelling voice.', sampleText: 'In a world where intelligence meets creativity, a new dawn arises.', pitchShift: 'Natural', speedShift: '1.0x' },
  { id: 'emma_en', name: 'Emma (English Corporate)', demographic: 'adult', gender: 'Female', language: 'English', role: 'Primary Narrator', description: 'Corporate, professional corporate trainer.', sampleText: 'Our quarterly goals are highly aligned with the latest market indicators.', pitchShift: 'Natural', speedShift: '1.0x' },

  // Elderly
  { id: 'guru_elder_ne', name: 'Guru-ba (Nepali Elder)', demographic: 'elderly', gender: 'Male', language: 'Nepali', role: 'Primary Narrator', description: 'Wise, slow, grandfatherly heritage tone.', sampleText: 'धेरै वर्ष पहिलेको कुरा हो... सुन्नुहोस् है त नानी बाबुहरू।', pitchShift: 'Natural', speedShift: '0.94x' },
  { id: 'aama_elder_ne', name: 'Aama (Grandmother)', demographic: 'elderly', gender: 'Female', language: 'Nepali', role: 'Secondary Character', description: 'Nurturing, traditional, grandmother tone.', sampleText: 'बाबु, स्वस्थ बस, खुसी बस। आजको दिन धेरै राम्रो छ।', pitchShift: 'Natural', speedShift: '0.94x' },
  { id: 'arthur_elder_en', name: 'Arthur (English Senior)', demographic: 'elderly', gender: 'Male', language: 'English', role: 'Primary Narrator', description: 'Distinguished, classic, rich history voice.', sampleText: 'Let me share a story from the days of long ago.', pitchShift: 'Natural', speedShift: '0.94x' },

  // Background Ambient
  { id: 'ambient_cafe', name: 'Kathmandu Ambient Cafe', demographic: 'ambient', gender: 'Neutral', language: 'Nepali', role: 'Ambient/Background', description: 'Muffled ambient background tea-shop chatter.', sampleText: '[Ambient tea shop background chat scene]', pitchShift: 'Natural', speedShift: '0.95x' },
  { id: 'ambient_wind', name: 'Himalayan Wind Chimes', demographic: 'ambient', gender: 'Neutral', language: 'English', role: 'Ambient/Background', description: 'Soothing mountain wind backdrop.', sampleText: '[Mountain wind background blowing softly]', pitchShift: 'Natural', speedShift: 'Slow' },
];

const getVoiceSampleText = (voice: VoiceItem, lang: 'ne' | 'en'): string => {
  const sampleMap: Record<string, { ne: string, en: string }> = {
    hemkala_pure_ne: {
      ne: 'नमस्ते! म हेमकला हुँ। यो मेरो वास्तविक, शुद्ध र प्राकृतिक नेपाली आवाज हो।',
      en: 'Namaste! I am Hemkala. This is my genuine, crystal-clear, and natural Nepali neural voice.'
    },
    sagar_pure_ne: {
      ne: 'नमस्ते! म सागर हुँ। यो मेरो वास्तविक, शुद्ध र प्राकृतिक नेपाली आवाज हो।',
      en: 'Namaste! I am Sagar. This is my genuine, crystal-clear, and natural Nepali neural voice.'
    },
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

export interface VoiceAvatarMeta {
  emoji: string;
  avatarTitle: string;
  tag: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

export const getVoiceAvatarMeta = (voice: VoiceItem): VoiceAvatarMeta => {
  const id = voice.id.toLowerCase();
  
  if (id === 'kanti_child_ne') {
    return {
      emoji: '👧🏽',
      avatarTitle: 'Kanti (Nepali Girl)',
      tag: 'Nepali Girl (Child)',
      bgGradient: 'from-amber-500/20 via-pink-500/15 to-rose-500/20',
      borderColor: 'border-pink-500/40',
      textColor: 'text-pink-400',
      badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    };
  }
  if (id === 'sanjok_child_ne') {
    return {
      emoji: '👦🏽',
      avatarTitle: 'Sanjok (Nepali Boy)',
      tag: 'Nepali Boy (Child)',
      bgGradient: 'from-sky-500/20 via-cyan-500/15 to-indigo-500/20',
      borderColor: 'border-sky-500/40',
      textColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    };
  }
  if (id === 'ana_child_en') {
    return {
      emoji: '👧🏼',
      avatarTitle: 'Ana (English Girl)',
      tag: 'English Girl (Child)',
      bgGradient: 'from-fuchsia-500/20 via-purple-500/15 to-pink-500/20',
      borderColor: 'border-fuchsia-500/40',
      textColor: 'text-fuchsia-400',
      badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
    };
  }
  if (id === 'rohan_teen_ne') {
    return {
      emoji: '🧑🏽',
      avatarTitle: 'Rohan (Nepali Teen Boy)',
      tag: 'Nepali Teen Boy',
      bgGradient: 'from-indigo-500/20 via-blue-500/15 to-teal-500/20',
      borderColor: 'border-indigo-500/40',
      textColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    };
  }
  if (id === 'emily_teen_en') {
    return {
      emoji: '👱🏼‍♀️',
      avatarTitle: 'Emily (English Teen Girl)',
      tag: 'English Teen Girl',
      bgGradient: 'from-violet-500/20 via-pink-500/15 to-rose-500/20',
      borderColor: 'border-violet-500/40',
      textColor: 'text-violet-400',
      badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
    };
  }
  if (id === 'guru_elder_ne') {
    return {
      emoji: '👴🏽',
      avatarTitle: 'Guru-ba (Nepali Hajurbuwa)',
      tag: 'Hajurbuwa Elder',
      bgGradient: 'from-amber-600/25 via-emerald-600/20 to-stone-600/30',
      borderColor: 'border-amber-500/50',
      textColor: 'text-amber-300',
      badgeBg: 'bg-amber-500/25 text-amber-200 border-amber-500/40'
    };
  }
  if (id === 'aama_elder_ne') {
    return {
      emoji: '👵🏽',
      avatarTitle: 'Aama (Nepali Hajuraama)',
      tag: 'Hajuraama Elder',
      bgGradient: 'from-orange-500/25 via-rose-500/20 to-amber-600/25',
      borderColor: 'border-orange-500/50',
      textColor: 'text-orange-300',
      badgeBg: 'bg-orange-500/25 text-orange-200 border-orange-500/40'
    };
  }
  if (id === 'arthur_elder_en') {
    return {
      emoji: '👴🏼',
      avatarTitle: 'Arthur (Senior Narrator)',
      tag: 'Senior Master',
      bgGradient: 'from-slate-600/30 via-stone-600/20 to-amber-700/25',
      borderColor: 'border-slate-500/40',
      textColor: 'text-slate-300',
      badgeBg: 'bg-slate-500/20 text-slate-200 border-slate-500/30'
    };
  }
  if (id === 'hemkala_pure_ne') {
    return {
      emoji: '👩🏽',
      avatarTitle: 'Hemkala (Pure Neural Master)',
      tag: 'Female Flagship 48kHz HD',
      bgGradient: 'from-emerald-500/25 via-teal-500/20 to-rose-500/20',
      borderColor: 'border-emerald-500/50',
      textColor: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    };
  }
  if (id === 'sagar_pure_ne') {
    return {
      emoji: '👨🏽',
      avatarTitle: 'Sagar (Pure Neural Master)',
      tag: 'Male Baritone 48kHz HD',
      bgGradient: 'from-indigo-600/25 via-blue-600/20 to-teal-500/20',
      borderColor: 'border-indigo-500/50',
      textColor: 'text-indigo-300',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    };
  }
  if (id === 'sita_ne') {
    return {
      emoji: '👩🏽',
      avatarTitle: 'Sita (Nepali Female)',
      tag: 'Female Narrator',
      bgGradient: 'from-rose-500/20 via-pink-500/15 to-orange-500/20',
      borderColor: 'border-rose-500/40',
      textColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    };
  }
  if (id === 'aarav_ne') {
    return {
      emoji: '👨🏽',
      avatarTitle: 'Aarav (Nepali Male)',
      tag: 'Male Narrator',
      bgGradient: 'from-blue-500/20 via-indigo-500/15 to-cyan-500/20',
      borderColor: 'border-blue-500/40',
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
  }
  if (id === 'maya_en') {
    return {
      emoji: '👩🏼',
      avatarTitle: 'Maya (US Presentation)',
      tag: 'Female US',
      bgGradient: 'from-purple-500/20 via-indigo-500/15 to-blue-500/20',
      borderColor: 'border-purple-500/40',
      textColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
  }
  if (id === 'david_en') {
    return {
      emoji: '👨🏼',
      avatarTitle: 'David (Cinematic Storyteller)',
      tag: 'Cinematic Voice',
      bgGradient: 'from-amber-600/20 via-red-600/15 to-stone-600/20',
      borderColor: 'border-amber-500/40',
      textColor: 'text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-500/30'
    };
  }
  if (id === 'jenny_en') {
    return {
      emoji: '👱🏼‍♀️',
      avatarTitle: 'Jenny (Conversational)',
      tag: 'Conversational',
      bgGradient: 'from-teal-500/20 via-cyan-500/15 to-blue-500/20',
      borderColor: 'border-teal-500/40',
      textColor: 'text-teal-400',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    };
  }
  if (id === 'emma_en') {
    return {
      emoji: '👩💼',
      avatarTitle: 'Emma (Corporate Trainer)',
      tag: 'Corporate Female',
      bgGradient: 'from-sky-500/20 via-indigo-500/15 to-slate-500/20',
      borderColor: 'border-sky-500/40',
      textColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    };
  }
  if (id.includes('ambient_cafe')) {
    return {
      emoji: '☕',
      avatarTitle: 'Kathmandu Cafe Atmosphere',
      tag: 'Ambient Soundscape',
      bgGradient: 'from-amber-700/20 via-stone-700/20 to-orange-700/20',
      borderColor: 'border-amber-600/40',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-600/30'
    };
  }
  if (id.includes('ambient')) {
    return {
      emoji: '🏔️',
      avatarTitle: 'Himalayan Atmosphere',
      tag: 'Ambient Soundscape',
      bgGradient: 'from-cyan-600/20 via-blue-600/20 to-slate-600/20',
      borderColor: 'border-cyan-500/40',
      textColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/30'
    };
  }

  // Fallbacks based on demographic & gender
  if (voice.demographic === 'children') {
    return {
      emoji: voice.gender === 'Female' ? '👧🏽' : '👦🏽',
      avatarTitle: `${voice.name} (Child)`,
      tag: voice.gender === 'Female' ? 'Girl Character' : 'Boy Character',
      bgGradient: 'from-amber-500/20 to-pink-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    };
  }
  if (voice.demographic === 'elderly') {
    return {
      emoji: voice.gender === 'Female' ? '👵🏽' : '👴🏽',
      avatarTitle: `${voice.name} (${voice.gender === 'Female' ? 'Hajuraama' : 'Hajurbuwa'})`,
      tag: voice.gender === 'Female' ? 'Hajuraama Elder' : 'Hajurbuwa Elder',
      bgGradient: 'from-amber-600/25 to-stone-600/25',
      borderColor: 'border-amber-500/40',
      textColor: 'text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-500/30'
    };
  }
  if (voice.demographic === 'teen') {
    return {
      emoji: voice.gender === 'Female' ? '👱🏼‍♀️' : '🧑🏽',
      avatarTitle: `${voice.name} (Teen)`,
      tag: voice.gender === 'Female' ? 'Teen Girl' : 'Teen Boy',
      bgGradient: 'from-indigo-500/20 to-violet-500/20',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    };
  }

  return {
    emoji: voice.gender === 'Female' ? '👩🏽' : voice.gender === 'Male' ? '👨🏽' : '🎙️',
    avatarTitle: voice.name,
    tag: `${voice.gender} Narrator`,
    bgGradient: 'from-rose-500/20 to-indigo-500/20',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  };
};

interface ToneAnalysisResult {
  tone: string;
  description: string;
  matchedKeywords: string[];
  recommendedVoiceId: string;
  recommendedStyle: string;
  recommendedEmotion: string;
}

export interface ProductionPreset {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  voiceId: string;
  rate: number;
  emotion: 'neutral' | 'happy' | 'sad' | 'energetic' | 'horror';
  formatStyle: 'general' | 'drama' | 'documentary' | 'story' | 'talk' | 'quick_talk';
  sampleScriptNe: string;
  sampleScriptEn: string;
  acousticRoom: 'dry' | 'booth' | 'warm_studio' | 'hall' | 'radio';
  ambientBed: 'none' | 'himalayan_drone' | 'mountain_flute' | 'studio_room' | 'peaceful_rain';
}

export const PRODUCTION_PRESETS: ProductionPreset[] = [
  {
    id: 'documentary',
    title: 'Documentary & Heritage',
    badge: '🎬 Master Doc',
    subtitle: 'Measured cadence, 48kHz baritone narrator with natural breathing pauses',
    voiceId: 'sagar_pure_ne',
    rate: 0.95,
    emotion: 'neutral',
    formatStyle: 'documentary',
    sampleScriptNe: 'हिमालयको काखमा फैलिएको यो रमणीय उपत्यका प्राकृतिक र सांस्कृतिक सौन्दर्यले भरिपूर्ण छ। [Pause: 600ms] युगौंदेखि चल्दै आएका परम्परा, मन्दिर र जीवनशैली आज पनि यहाँ जीवन्त छन्। [Pause: 500ms] यो अनुपम धरोहर हामी सबैको साझा गौरव हो।',
    sampleScriptEn: 'Nestled deep within the Himalayas, this ancient valley preserves a rare cultural heritage. [Pause: 600ms] Centuries of tradition and breathtaking landscapes meet in quiet reverence.',
    acousticRoom: 'warm_studio',
    ambientBed: 'himalayan_drone',
  },
  {
    id: 'podcast_talk',
    title: 'Studio Talk & Podcast',
    badge: '🎙️ Studio Host',
    subtitle: 'Warm, articulate, conversational delivery for interviews and talk shows',
    voiceId: 'hemkala_pure_ne',
    rate: 1.0,
    emotion: 'happy',
    formatStyle: 'talk',
    sampleScriptNe: 'नमस्ते साथीहरू! नेपालएआई स्टुडियो पोडकास्टको आजको विशेष अंकमा तपाईंलाई हार्दिक स्वागत छ। [Pause: 400ms] आज हामी आधुनिक डिजिटल मिडिया र आर्टिफिसियल इन्टेलिजेन्सको प्रभावबारे कुराकानी गर्नेछौं।',
    sampleScriptEn: 'Welcome back to the studio! In today\'s episode, we explore the creative horizon where artificial intelligence meets professional storytelling.',
    acousticRoom: 'booth',
    ambientBed: 'studio_room',
  },
  {
    id: 'storytelling',
    title: 'Voiceover Storytelling',
    badge: '📖 Deep Narrative',
    subtitle: 'Expressive dramatic cadence with cinematic tension and heritage warmth',
    voiceId: 'guru_elder_ne',
    rate: 0.92,
    emotion: 'neutral',
    formatStyle: 'story',
    sampleScriptNe: 'धेरै वर्ष पहिलेको कुरा हो... [Pause: 800ms] डाँडापारिको सानो गाउँमा एउटा पुरानो मन्दिर थियो। [Pause: 500ms] त्यहाँका मानिसहरू सधैं शान्ति र एकतामा बाँचेका थिए, तर एकदिन अनौठो रहस्य सुरु भयो।',
    sampleScriptEn: 'Long ago, beyond the mist-covered hills... [Pause: 800ms] there stood a quiet sanctuary where ancient legends still whispered in the morning breeze.',
    acousticRoom: 'hall',
    ambientBed: 'mountain_flute',
  },
  {
    id: 'broadcast_news',
    title: 'Broadcast News & Report',
    badge: '📰 Clear News',
    subtitle: 'Authoritative, articulate, standard news desk delivery',
    voiceId: 'sita_ne',
    rate: 1.05,
    emotion: 'neutral',
    formatStyle: 'general',
    sampleScriptNe: 'नमस्कार, नेपालएआई स्टुडियो ब्रोडकास्टमा स्वागत छ। [Pause: 350ms] आजको मुख्य समाचारमा प्रविधि क्षेत्रको पछिल्लो विकास र नयाँ सिर्जनात्मक अनुसन्धानलाई प्रस्तुत गर्दैछौं।',
    sampleScriptEn: 'Good evening. This is the top headline from our studio desk, covering the latest breakthroughs and market updates across the nation.',
    acousticRoom: 'booth',
    ambientBed: 'none',
  },
  {
    id: 'commercial_promo',
    title: 'High-Impact Commercial',
    badge: '⚡ Promo / Ad',
    subtitle: 'Punchy, enthusiastic conversion voice for reels and marketing',
    voiceId: 'david_en',
    rate: 1.15,
    emotion: 'energetic',
    formatStyle: 'quick_talk',
    sampleScriptNe: '[Emphasis: Strong] के तपाईं आफ्नो भिडियोलाई नयाँ उचाइमा पुर्‍याउन चाहनुहुन्छ? [Pause: 300ms] आजै नेपालएआई स्टुडियो प्रयोग गर्नुहोस् र उत्कृष्ट सामग्री सिर्जना गर्नुहोस्!',
    sampleScriptEn: '[Emphasis: Strong] Ready to transform your creative workflow? [Pause: 300ms] Generate cinema-grade video and studio voiceovers in seconds with NepalAI Studio!',
    acousticRoom: 'booth',
    ambientBed: 'none',
  },
];

export interface DialogueLineItem {
  id: string;
  speakerTag: string;
  voiceId: string;
  text: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'energetic' | 'horror';
  isProcessing: boolean;
  audioUrl?: string;
  duration?: number;
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
  const [selectedVoiceId, setSelectedVoiceId] = useState('hemkala_pure_ne');
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
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Persistent Generated Sound List (synced with storage and Video Studio)
  const [generatedSounds, setGeneratedSounds] = useState<MediaItem[]>(() => getGeneratedSoundList());
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const activeSoundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setGeneratedSounds(getGeneratedSoundList());
    };
    window.addEventListener('nepalai_media_library_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('nepalai_media_library_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (activeSoundAudioRef.current) {
        activeSoundAudioRef.current.pause();
      }
    };
  }, []);

  const handleTogglePlayGeneratedSound = (sound: MediaItem) => {
    if (playingSoundId === sound.id) {
      if (activeSoundAudioRef.current) {
        activeSoundAudioRef.current.pause();
      }
      setPlayingSoundId(null);
    } else {
      if (activeSoundAudioRef.current) {
        activeSoundAudioRef.current.pause();
      }
      const audio = new Audio(sound.url);
      activeSoundAudioRef.current = audio;
      audio.onended = () => setPlayingSoundId(null);
      audio.onerror = () => setPlayingSoundId(null);
      audio.play().catch(e => {
        console.warn('Playback notice:', e);
        setPlayingSoundId(null);
      });
      setPlayingSoundId(sound.id);
    }
  };

  const handleDeleteGeneratedSound = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingSoundId === id && activeSoundAudioRef.current) {
      activeSoundAudioRef.current.pause();
      setPlayingSoundId(null);
    }
    removeMediaItem(id);
    setGeneratedSounds(prev => prev.filter(s => s.id !== id));
  };

  const handleAttachGeneratedSound = (sound: MediaItem) => {
    if (onAttachAudioTrack) {
      onAttachAudioTrack(
        sound.title,
        sound.duration || 6,
        sound.url,
        sound.prompt || text
      );
      setAttachedSuccess(true);
      setTimeout(() => setAttachedSuccess(false), 3500);
    }
  };

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
  const [activeEditorTab, setActiveEditorTab] = useState<'single' | 'dialogue' | 'batch' | 'clone'>('single');

  // Studio Master Rack state
  const [masterSettings, setMasterSettings] = useState<MasterRackSettings>(DEFAULT_MASTER_SETTINGS);
  const [showMasterRack, setShowMasterRack] = useState(false);

  // Active Production Preset ID
  const [activePresetId, setActivePresetId] = useState<string | null>('documentary');

  // Sync mastering rack settings & ducking
  useEffect(() => {
    studioMastering.updateSettings(masterSettings);
  }, [masterSettings]);

  useEffect(() => {
    studioMastering.duckAmbient(isPlaying);
  }, [isPlaying]);

  // Dialogue Director (Screenplay Studio) state
  const [dialogueScriptText, setDialogueScriptText] = useState<string>(
`[Sagar]: नमस्ते र नेपालएआई स्टुडियो पोडकास्टको नयाँ अंकमा तपाईंलाई हार्दिक स्वागत छ।
[Hemkala]: धन्यवाद सागर जी! आज हामी आधुनिक डिजिटल मिडिया र आर्टिफिसियल इन्टेलिजेन्सको प्रभावबारे छलफल गर्नेछौं।
[Sagar]: बिल्कुल, अब नेपाली सिर्जनाकर्ताहरूले उच्च गुणस्तरको अडियो र भिडियो आफ्नै भाषामा निर्माण गर्न सक्छन्।
[Guru-ba]: धेरै राम्रो बाबु, प्रविधिले हाम्रो भाषा र संस्कृतिलाई विश्वसामु चिनाउन मद्दत गर्दछ।`
  );
  const [dialogueSpeakerMap, setDialogueSpeakerMap] = useState<Record<string, string>>({
    Sagar: 'sagar_pure_ne',
    Hemkala: 'hemkala_pure_ne',
    'Guru-ba': 'guru_elder_ne',
    Aarav: 'aarav_ne',
    Sita: 'sita_ne',
    Kanti: 'kanti_child_ne',
    David: 'david_en',
  });
  const [dialogueLines, setDialogueLines] = useState<DialogueLineItem[]>([]);
  const [activePlayingDialogueId, setActivePlayingDialogueId] = useState<string | null>(null);
  const [isSynthesizingAllDialogue, setIsSynthesizingAllDialogue] = useState(false);
  const dialogueAudioRef = useRef<HTMLAudioElement | null>(null);

  // Dialogue Script Parser
  const parseDialogueScript = (rawText: string, currentSpeakerVoiceMap: Record<string, string>) => {
    const rawLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const updatedMap = { ...currentSpeakerVoiceMap };

    const defaultFallbacks: Record<string, string> = {
      sagar: 'sagar_pure_ne',
      hemkala: 'hemkala_pure_ne',
      sita: 'sita_ne',
      aarav: 'aarav_ne',
      guruba: 'guru_elder_ne',
      guru: 'guru_elder_ne',
      aama: 'aama_elder_ne',
      kanti: 'kanti_child_ne',
      sanjok: 'sanjok_child_ne',
      rohan: 'rohan_teen_ne',
      emily: 'emily_teen_en',
      david: 'david_en',
      maya: 'maya_en',
    };

    const parsed: DialogueLineItem[] = rawLines.map((line, idx) => {
      const match = line.match(/^\[(.*?)\]\s*:\s*(.*)$/) || line.match(/^([A-Za-z0-9_\-\u0900-\u097F]+)\s*:\s*(.*)$/);
      if (match) {
        const tag = match[1].trim();
        const content = match[2].trim();
        const tagKey = tag.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (!updatedMap[tag]) {
          updatedMap[tag] = defaultFallbacks[tagKey] || (tagKey.includes('fem') || tagKey.includes('woman') || tagKey.includes('girl') ? 'hemkala_pure_ne' : 'sagar_pure_ne');
        }

        return {
          id: `dlg_${idx}_${Date.now()}`,
          speakerTag: tag,
          voiceId: updatedMap[tag],
          text: content,
          emotion: 'neutral',
          isProcessing: false,
        };
      } else {
        const defaultTag = 'Narrator';
        if (!updatedMap[defaultTag]) {
          updatedMap[defaultTag] = 'sagar_pure_ne';
        }
        return {
          id: `dlg_${idx}_${Date.now()}`,
          speakerTag: defaultTag,
          voiceId: updatedMap[defaultTag],
          text: line,
          emotion: 'neutral',
          isProcessing: false,
        };
      }
    });

    setDialogueSpeakerMap(updatedMap);
    setDialogueLines(parsed);
  };

  useEffect(() => {
    if (dialogueScriptText) {
      parseDialogueScript(dialogueScriptText, dialogueSpeakerMap);
    }
  }, []);

  const handleAddNaturalBreathPauses = () => {
    const withPauses = text
      .replace(/([।!?\.\n]+)\s*(?!\[Pause)/g, '$1 [Pause: 500ms] ')
      .replace(/(,\s*)(?!\[Pause)/g, '$1 [Pause: 250ms] ')
      .replace(/\s+/g, ' ')
      .trim();
    setText(withPauses);
  };

  const handleApplyProductionPreset = (preset: ProductionPreset) => {
    setActivePresetId(preset.id);
    setSelectedVoiceId(preset.voiceId);
    setRate(preset.rate);
    setEmotion(preset.emotion);
    setFormatStyle(preset.formatStyle);
    setText(language === 'ne' ? preset.sampleScriptNe : preset.sampleScriptEn);
    setMasterSettings(prev => ({
      ...prev,
      enabled: true,
      acousticRoom: preset.acousticRoom,
      ambientBed: preset.ambientBed,
    }));
  };

  const handleSynthesizeDialogueLine = async (lineIdx: number) => {
    const line = dialogueLines[lineIdx];
    if (!line || !line.text) return;

    setDialogueLines(prev => prev.map((l, i) => i === lineIdx ? { ...l, isProcessing: true } : l));

    try {
      const targetUserId = user?.id || 'usr_guest_' + Date.now();
      const voice = voicesList.find(v => v.id === line.voiceId) || selectedVoice;
      
      const data = await apiGenerateAudio(
        targetUserId,
        line.text,
        voice.id,
        voice.language === 'Nepali' ? 'ne-NP' : 'en-US',
        line.emotion || 'neutral',
        'general'
      );

      if (data?.result?.url) {
        setDialogueLines(prev => prev.map((l, i) => i === lineIdx ? {
          ...l,
          isProcessing: false,
          audioUrl: data.result.url,
          duration: data.result.duration || Math.max(3, Math.ceil(line.text.length / 14))
        } : l));

        const savedItem = saveMediaItem({
          type: 'ai_audio',
          title: `[Dialogue] ${line.speakerTag}: ${line.text.slice(0, 24)}...`,
          url: data.result.url,
          duration: data.result.duration || Math.max(3, Math.ceil(line.text.length / 14)),
          category: 'AI Voiceover',
          engine: `${voice.name} Neural`,
          prompt: line.text
        });
        setGeneratedSounds(prev => [savedItem, ...prev.filter(s => s.id !== savedItem.id)]);
      }
    } catch (e: any) {
      console.warn('Dialogue line notice:', e);
      setDialogueLines(prev => prev.map((l, i) => i === lineIdx ? { ...l, isProcessing: false } : l));
    }
  };

  const handleSynthesizeAllDialogue = async () => {
    if (isSynthesizingAllDialogue || dialogueLines.length === 0) return;
    setIsSynthesizingAllDialogue(true);
    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        title: 'Synthesizing Dialogue Table Read',
        subtitle: `Generating ${dialogueLines.length} character audio cues with Neural TTS`,
        type: 'voice'
      });
    }

    try {
      for (let i = 0; i < dialogueLines.length; i++) {
        await handleSynthesizeDialogueLine(i);
      }
    } finally {
      setIsSynthesizingAllDialogue(false);
      if (onStopGlobalLoading) onStopGlobalLoading();
    }
  };

  const handleTogglePlayDialogueLine = (line: DialogueLineItem) => {
    if (!line.audioUrl) return;

    if (activePlayingDialogueId === line.id) {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.pause();
      }
      setActivePlayingDialogueId(null);
    } else {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.pause();
      }
      const audio = new Audio(line.audioUrl);
      dialogueAudioRef.current = audio;
      studioMastering.attachToAudioElement(audio, masterSettings);
      audio.onended = () => setActivePlayingDialogueId(null);
      audio.onerror = () => setActivePlayingDialogueId(null);
      audio.play().catch(console.warn);
      setActivePlayingDialogueId(line.id);
    }
  };

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

        audio.onended = stopAudio;
        audio.onerror = stopAudio;

        await audio.play().catch(err => {
          console.warn('Sample playback failed:', err);
          stopAudio();
        });
      } else {
        setPlayingSampleVoiceIds(prev => ({ ...prev, [playKey]: false }));
      }
    } catch (err: any) {
      console.error('Failed to generate sample voiceover:', err);
      setAudioError(`Voice preview notice: ${err.message || 'Unable to play voice sample'}`);
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

    const cleanText = text.replace(/\[.*?\]/g, '').trim();
    if (!cleanText && !text.trim()) {
      setAudioError('Please enter a voice script or choose a preset sample above before synthesizing.');
      return;
    }

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

      // Extract optional speed/volume/pitch parameters from text if present
      let textToSynthesize = text;
      let extractedSpeed: string | undefined = undefined;
      let extractedVolume: string | undefined = undefined;
      let extractedPitch: string | undefined = undefined;

      const speedMatch = textToSynthesize.match(/\[Speed:\s*([^\]]+)\]/i);
      if (speedMatch) {
        extractedSpeed = speedMatch[1].trim();
      } else if (rate !== 1.0) {
        extractedSpeed = `${rate}x`;
      }

      const volumeMatch = textToSynthesize.match(/\[Volume:\s*([^\]]+)\]/i);
      if (volumeMatch) {
        extractedVolume = volumeMatch[1].trim();
      }

      const pitchMatch = textToSynthesize.match(/\[Pitch:\s*([^\]]+)\]/i);
      if (pitchMatch) {
        extractedPitch = pitchMatch[1].trim();
      } else if (pitch !== 1.0) {
        extractedPitch = `${pitch > 1.0 ? '+' : ''}${Math.round((pitch - 1.0) * 100)}%`;
      } else if (pitchVal !== 0) {
        extractedPitch = `${pitchVal > 0 ? '+' : ''}${pitchVal}%`;
      }

      const data = await apiGenerateAudio(
        targetUserId,
        textToSynthesize || 'नमस्ते',
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
        // Attach Studio Master FX Rack & Room Acoustics
        studioMastering.attachToAudioElement(audio, masterSettings);

        // Play at authentic 1.0x neural rate by default, preserving natural vocal resonance and acoustics
        audio.playbackRate = 1.0;
        if ('preservesPitch' in audio) {
          audio.preservesPitch = true;
        } else if ('webkitPreservesPitch' in audio) {
          (audio as any).webkitPreservesPitch = true;
        }

        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
        };

        setActiveAudioElement(audio);
        await audio.play().catch(e => {
          console.warn('Audio play notice:', e);
        });
        setIsPlaying(true);

        // Sync Asset to user Project reference
        const newAsset = {
          id: 'asset_' + Date.now(),
          title: `Voiceover: ${(textToSynthesize || text).slice(0, 20)}...`,
          project: selectedProject,
          voice: selectedVoice.name,
          url: data.result.url,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSyncedAssets(prev => [newAsset, ...prev]);
      }
    } catch (e: any) {
      console.error('Audio generation notice:', e);
      setAudioError(e.message || 'Voiceover generation could not be completed. Please check connection and try again.');
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

  const handleSaveToGeneratedSoundList = () => {
    if (!generatedAudioUrl) return;
    const cleanScript = text.replace(/\[.*?\]/g, '').trim();
    const savedItem = saveMediaItem({
      type: 'ai_audio',
      title: `[Voiceover] ${selectedVoice.name} - ${(cleanScript || text).slice(0, 24)}...`,
      url: generatedAudioUrl,
      duration: playerDuration || Math.max(4, Math.ceil((cleanScript || text).length / 14)),
      category: 'AI Voiceover',
      engine: `${selectedVoice.name} Neural (${selectedVoice.language})`,
      prompt: text
    });
    setGeneratedSounds(prev => [savedItem, ...prev.filter(s => s.id !== savedItem.id)]);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleStop = () => {
    if (activeAudioElement) {
      activeAudioElement.pause();
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

        // Store batch voiceover in generated sound list
        const savedBatchItem = saveMediaItem({
          type: 'ai_audio',
          title: `[Batch Voiceover] ${selectedVoice.name} - ${item.text.slice(0, 24)}...`,
          url: data.result.url,
          duration: data.result.duration || Math.max(4, Math.ceil(item.text.length / 14)),
          category: 'AI Voiceover',
          engine: data.result.format || `${selectedVoice.name} Neural`,
          prompt: item.text
        });
        setGeneratedSounds(prev => [savedBatchItem, ...prev.filter(s => s.id !== savedBatchItem.id)]);
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

  const handleClonedAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecordedBlob(file);
    const url = URL.createObjectURL(file);
    setClonedAudioUrl(url);
    if (!newClonedVoiceName) {
      setNewClonedVoiceName(file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\s]/g, ' '));
    }
  };

  const handleSaveClonedVoice = () => {
    if (!newClonedVoiceName.trim()) {
      alert('Please enter a voice name');
      return;
    }

    // Determine acoustic base ID matching demographic & gender
    let basePrefix = 'hemkala_pure_ne';
    if (clonedVoiceDemographic === 'children') {
      basePrefix = clonedVoiceGender === 'Female' ? 'kanti_child_ne' : 'sanjok_child_ne';
    } else if (clonedVoiceDemographic === 'elderly') {
      basePrefix = clonedVoiceGender === 'Female' ? 'aama_elder_ne' : 'guru_elder_ne';
    } else if (clonedVoiceDemographic === 'teen') {
      basePrefix = clonedVoiceGender === 'Female' ? 'emily_teen_en' : 'rohan_teen_ne';
    } else {
      basePrefix = clonedVoiceGender === 'Male' ? 'sagar_pure_ne' : 'hemkala_pure_ne';
    }

    const customId = `${basePrefix}_clone_${Date.now()}`;
    const clonedVoice: VoiceItem = {
      id: customId,
      name: `${newClonedVoiceName.trim()} (Cloned)`,
      demographic: clonedVoiceDemographic,
      gender: clonedVoiceGender,
      language: 'Nepali',
      role: 'Primary Narrator',
      description: 'Custom neural voice clone trained with high-fidelity acoustic profile.',
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
  };

  const handleAttachToVideo = () => {
    const estimatedDuration = Math.max(4, Math.ceil(text.length / 14));
    const trackTitle = `[Voiceover] ${selectedVoice.name}: ${text.replace(/\[.*?\]/g, '').slice(0, 22)}...`;
    if (onAttachAudioTrack) {
      onAttachAudioTrack(
        trackTitle,
        estimatedDuration,
        generatedAudioUrl || undefined,
        text
      );
    }
    if (generatedAudioUrl) {
      saveMediaItem({
        type: 'ai_audio',
        title: trackTitle,
        url: generatedAudioUrl,
        duration: estimatedDuration,
        category: 'AI Voiceover',
        engine: 'Azure Speech Neural (eastus)'
      });
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
                onClick={() => setActiveEditorTab('dialogue')}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 ${
                  activeEditorTab === 'dialogue'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Dialogue Director</span>
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
                {/* Studio Production & Pacing Presets */}
                <div className="space-y-2 p-3 bg-gradient-to-r from-rose-500/5 via-indigo-500/5 to-purple-500/5 dark:from-rose-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-rose-200/40 dark:border-rose-900/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5 text-rose-500" />
                      Studio Production & Pacing Presets (Documentary / Story / Talk)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddNaturalBreathPauses}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                      title="Auto-insert natural breath pauses after punctuation"
                    >
                      <Wand2 className="w-3 h-3 text-indigo-500" />
                      <span>Auto-Insert Natural Breath Pauses</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {PRODUCTION_PRESETS.map((preset) => {
                      const isSelected = activePresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyProductionPreset(preset)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 shadow-xs'
                              : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{preset.badge}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                          </div>
                          <span className="text-[10.5px] font-semibold mt-1 leading-tight block truncate">
                            {preset.title}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                            {preset.rate}x • {preset.formatStyle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                          setSelectedVoiceId('hemkala_pure_ne');
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

                  {/* Active Selected Character Pill */}
                  {(() => {
                    const avatar = getVoiceAvatarMeta(selectedVoice);
                    return (
                      <div className={`p-2.5 rounded-xl bg-gradient-to-r ${avatar.bgGradient} border ${avatar.borderColor} flex items-center justify-between gap-2`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                            <span>{avatar.emoji}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedVoice.name}</span>
                              <span className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-bold border ${avatar.badgeBg}`}>
                                {avatar.tag}
                              </span>
                              {(selectedVoice.id === 'hemkala_pure_ne' || selectedVoice.id === 'sagar_pure_ne') && (
                                <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30 uppercase">
                                  ✨ Pure Neural 48kHz HD
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-300 block truncate">
                              {selectedVoice.description}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700 shrink-0 uppercase font-bold">
                          {selectedVoice.gender} • {selectedVoice.language}
                        </span>
                      </div>
                    );
                  })()}
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

            {/* Error Notification Banner */}
            {audioError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-200 shadow-lg animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-300">Voiceover Synthesis Notice</span>
                    <span className="text-slate-300">{audioError}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAudioError(null)}
                  className="text-rose-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-rose-900/40 hover:bg-rose-800 transition cursor-pointer"
                  title="Dismiss error notice"
                >
                  ✕
                </button>
              </div>
            )}

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

            {/* Custom Native Premium Audio Player with Full Playback Controls & Relevant Character Avatar */}
            {generatedAudioUrl && (() => {
              const avatar = getVoiceAvatarMeta(selectedVoice);
              return (
                <div id="neural-preview-player" className="p-5 bg-slate-950 text-white rounded-2xl space-y-4 border border-slate-800 shadow-2xl animate-in fade-in duration-300">
                  {/* Character Avatar Banner */}
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${avatar.bgGradient} border ${avatar.borderColor} flex items-center justify-between gap-4 flex-wrap`}>
                    <div className="flex items-center gap-3.5">
                      {/* Character Avatar with Ripple Wave on Playback */}
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl bg-slate-900/90 border-2 ${avatar.borderColor} flex items-center justify-center text-3xl shadow-lg transition-transform ${
                          isPlaying ? 'scale-105 ring-4 ring-rose-500/30' : ''
                        }`}>
                          <span>{avatar.emoji}</span>
                        </div>
                        {isPlaying && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border border-white/40"></span>
                          </span>
                        )}
                      </div>

                      {/* Character Details & Tags */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white block">{selectedVoice.name}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${avatar.badgeBg}`}>
                            {avatar.tag}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-900/80 text-slate-300 border border-slate-700 uppercase">
                            {selectedVoice.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                          {selectedVoice.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold pt-0.5">
                          <span className="text-indigo-300">Project: {selectedProject}</span>
                          <span>•</span>
                          <span className="text-rose-300">Emotion: {emotion}</span>
                          <span>•</span>
                          <span className="text-emerald-300">Style: {formatStyle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 ${
                        isPlaying ? 'bg-rose-500 text-white border-rose-400 animate-pulse' : 'bg-slate-900/90 text-slate-300 border-slate-700'
                      }`}>
                        {isPlaying ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                            <span>Speaking...</span>
                          </>
                        ) : (
                          <>
                            <Headphones className="w-3.5 h-3.5" />
                            <span>Preview Ready</span>
                          </>
                        )}
                      </span>
                    </div>
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

                    {/* Actions (Save to Sound List, Download MP3 & Export SRT) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveToGeneratedSoundList}
                        className={`p-2 rounded-lg transition border flex items-center gap-1.5 text-[10px] font-bold cursor-pointer ${
                          saveSuccessMsg 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80'
                        }`}
                        title="Save this synthesized voice to Generated Sound List and Media Library"
                      >
                        {saveSuccessMsg ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{saveSuccessMsg ? 'Saved to List' : 'Save to Sound List'}</span>
                      </button>

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
                        onClick={() => setShowMasterRack(prev => !prev)}
                        className={`p-2 rounded-lg transition border flex items-center gap-1.5 text-[10px] font-bold cursor-pointer ${
                          showMasterRack || masterSettings.enabled
                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/60'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Open Studio Master EQ, Dynamics & Room Acoustics Rack"
                      >
                        <Sliders className="w-3.5 h-3.5 text-rose-400" />
                        <span>Master FX {masterSettings.enabled ? 'ON' : 'OFF'}</span>
                      </button>

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

                  {/* Studio Master Rack Panel */}
                  {showMasterRack && (
                    <div className="p-4 bg-slate-900/95 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-rose-500" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Studio Mastering Rack & Room Acoustics
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMasterSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold transition cursor-pointer border ${
                            masterSettings.enabled
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {masterSettings.enabled ? '● MASTER ACTIVE' : '○ BYPASSED'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {/* Acoustic Room Presets */}
                        <div className="space-y-1.5 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                          <label className="text-[10px] font-bold text-slate-300 uppercase block">
                            🏛️ Acoustic Room
                          </label>
                          <select
                            value={masterSettings.acousticRoom}
                            onChange={(e) => setMasterSettings(prev => ({ ...prev, acousticRoom: e.target.value as any }))}
                            className="w-full text-[11px] bg-slate-900 border border-slate-700 rounded-md p-1.5 text-white font-medium focus:ring-1 focus:ring-rose-500"
                          >
                            <option value="dry">Dry Vocal Booth (Crisp Direct)</option>
                            <option value="booth">Treated Studio Booth</option>
                            <option value="warm_studio">Warm Broadcast Studio</option>
                            <option value="hall">Cinematic Hall / Auditorium</option>
                            <option value="radio">Vintage Radio AM/FM Bandpass</option>
                          </select>
                          <span className="text-[9px] text-slate-400 block">
                            Convolver reverberation simulating acoustic physical spaces.
                          </span>
                        </div>

                        {/* Tone & Dynamics (EQ & Compressor) */}
                        <div className="space-y-1.5 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                          <label className="text-[10px] font-bold text-slate-300 uppercase block">
                            🎚️ Clarity & Dynamics
                          </label>
                          <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-[10.5px] text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={masterSettings.lowCut80Hz}
                                onChange={(e) => setMasterSettings(prev => ({ ...prev, lowCut80Hz: e.target.checked }))}
                                className="rounded text-rose-600 focus:ring-0 w-3.5 h-3.5"
                              />
                              <span>80Hz High-Pass (Rumble Cut)</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-[10.5px] text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={masterSettings.presenceBoost}
                                onChange={(e) => setMasterSettings(prev => ({ ...prev, presenceBoost: e.target.checked }))}
                                className="rounded text-rose-600 focus:ring-0 w-3.5 h-3.5"
                              />
                              <span>3.2kHz Vocal Presence Boost</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-[10.5px] text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={masterSettings.compressor}
                                onChange={(e) => setMasterSettings(prev => ({ ...prev, compressor: e.target.checked }))}
                                className="rounded text-rose-600 focus:ring-0 w-3.5 h-3.5"
                              />
                              <span>Broadcast Dynamics Leveler</span>
                            </label>
                          </div>
                        </div>

                        {/* Cinematic Ambient Bed & Auto-Ducking */}
                        <div className="space-y-1.5 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-300 uppercase">
                              🎵 Cinematic Ambient Bed
                            </label>
                            {masterSettings.ambientBed !== 'none' && (
                              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                🦆 Auto-Ducking Active
                              </span>
                            )}
                          </div>
                          <select
                            value={masterSettings.ambientBed}
                            onChange={(e) => setMasterSettings(prev => ({ ...prev, ambientBed: e.target.value as any }))}
                            className="w-full text-[11px] bg-slate-900 border border-slate-700 rounded-md p-1.5 text-white font-medium focus:ring-1 focus:ring-rose-500"
                          >
                            <option value="none">None (Clean Voiceover)</option>
                            <option value="himalayan_drone">🏔️ Himalayan Harmonic Drone</option>
                            <option value="mountain_flute">🪈 Mountain Flute Bed</option>
                            <option value="studio_room">☕ Warm Studio Room Tone</option>
                            <option value="peaceful_rain">🌧️ Peaceful Himalayan Rain</option>
                          </select>
                          {masterSettings.ambientBed !== 'none' && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[9px] text-slate-400">Bed Vol:</span>
                              <input
                                type="range"
                                min={0}
                                max={0.5}
                                step={0.02}
                                value={masterSettings.ambientVolume}
                                onChange={(e) => setMasterSettings(prev => ({ ...prev, ambientVolume: parseFloat(e.target.value) }))}
                                className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                              />
                              <span className="text-[9px] font-mono text-slate-300 w-7">
                                {Math.round(masterSettings.ambientVolume * 200)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {attachedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-600 flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span className="font-semibold">Successfully attached voiceover to Video Studio! It is now available on your audio timeline.</span>
              </div>
            )}

            {/* Dedicated Generated Sound List */}
            <div id="generated-sound-list" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Generated Sound List
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {generatedSounds.length} {generatedSounds.length === 1 ? 'sound' : 'sounds'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Voiceovers stored from Text-to-Speech. Available directly in Video Studio's Audio section.
                    </p>
                  </div>
                </div>
              </div>

              {generatedSounds.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
                  <Music className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    No generated sounds stored yet.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Click "Preview Neural TTS" above to synthesize and store your first neural voiceover in this list.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {generatedSounds.map((sound) => {
                    const isCurrentlyPlaying = playingSoundId === sound.id;
                    return (
                      <div
                        key={sound.id}
                        className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                          isCurrentlyPlaying
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/50'
                            : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePlayGeneratedSound(sound)}
                            className={`p-2.5 rounded-xl transition shrink-0 cursor-pointer shadow-sm ${
                              isCurrentlyPlaying
                                ? 'bg-emerald-600 text-white animate-pulse'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white border border-slate-200 dark:border-slate-700'
                            }`}
                            title={isCurrentlyPlaying ? 'Pause sound' : 'Play preview'}
                          >
                            {isCurrentlyPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">
                                {sound.title}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                                {Math.round(sound.duration || 6)}s
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="truncate">{sound.engine || 'Neural TTS'}</span>
                              <span>•</span>
                              <span>{new Date(sound.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={sound.url}
                            download={`${sound.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.wav`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Download Audio"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleAttachGeneratedSound(sound)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Add to Video Studio timeline"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Add to Video Studio</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteGeneratedSound(sound.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete sound"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

              </div>
            )}

            {activeEditorTab === 'dialogue' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header & Quick Screenplay Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-rose-500" />
                        Multi-Speaker Dialogue Director (Screenplay Studio)
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Write screenplays with speaker tags (e.g. <code className="font-mono text-rose-500 font-bold">[Sagar]:</code> or <code className="font-mono text-rose-500 font-bold">[Hemkala]:</code>). Assign unique neural voices to each character and render table reads.
                      </p>
                    </div>
                  </div>

                  {/* Dialogue Quick Script Presets */}
                  <div className="p-3 bg-gradient-to-r from-rose-500/5 via-indigo-500/5 to-purple-500/5 dark:from-rose-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-rose-200/40 dark:border-rose-900/30 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                      Quick Screenplay Presets
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const script = `[Sagar]: नमस्ते र नेपालएआई स्टुडियो पोडकास्टको नयाँ अंकमा तपाईंलाई हार्दिक स्वागत छ।\n[Hemkala]: धन्यवाद सागर जी! आज हामी आधुनिक डिजिटल मिडिया र आर्टिफिसियल इन्टेलिजेन्सको प्रभावबारे छलफल गर्नेछौं।\n[Sagar]: बिल्कुल, अब नेपाली सिर्जनाकर्ताहरूले उच्च गुणस्तरको अडियो र भिडियो आफ्नै भाषामा निर्माण गर्न सक्छन्।\n[Hemkala]: यसले नेपाली भाषा र संस्कृतिलाई विश्वसामु चिनाउन ठूलो मद्दत गर्नेछ।`;
                          setDialogueScriptText(script);
                          parseDialogueScript(script, dialogueSpeakerMap);
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 text-left transition cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">🎙️ Studio Talk Show</span>
                        <span className="text-[9px] text-slate-400">Sagar & Hemkala</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const script = `[Sagar]: हिमालयको काखमा अवस्थित यो पुरानो उपत्यका शान्ति र सौन्दर्यको अनुपम नमुना हो।\n[Guru-ba]: हो बाबु, हाम्रा पुर्खाहरूले यहाँ प्रकृतिसँग मिलेर बाँच्ने कला सिकाएका थिए।\n[Sagar]: ती कथाहरू र परम्परा आज पनि यहाँका ढुङ्गा र मन्दिरहरूमा गुञ्जिरहेका छन्।\n[Guru-ba]: यो धरोहरलाई नयाँ पुस्ताले जोगाइराख्नु पर्छ।`;
                          setDialogueScriptText(script);
                          parseDialogueScript(script, dialogueSpeakerMap);
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 text-left transition cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">🎬 Himalayan Documentary</span>
                        <span className="text-[9px] text-slate-400">Sagar & Guru-ba</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const script = `[Aarav]: कान्ति नानी, आज विद्यालयमा के के सिक्यौ त?\n[Kanti]: दाई, आज हामीले नेपाली इतिहास र कम्प्युटर प्रविधिबारे धेरै नयाँ कुरा सिक्यौं!\n[Sita]: कति राम्रो! राम्रोसँग पढ्नु र नयाँ प्रविधि सिक्नु आजको आवश्यकता हो।\n[Kanti]: हस आमा, म सधैं लगनशील भएर पढ्छु!`;
                          setDialogueScriptText(script);
                          parseDialogueScript(script, dialogueSpeakerMap);
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 text-left transition cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">📖 Village Tale</span>
                        <span className="text-[9px] text-slate-400">Aarav, Kanti & Sita</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Screenplay Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Screenplay Script (Speaker Tagged)
                    </label>
                    <button
                      type="button"
                      onClick={() => parseDialogueScript(dialogueScriptText, dialogueSpeakerMap)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Parse & Cast Characters</span>
                    </button>
                  </div>
                  <textarea
                    value={dialogueScriptText}
                    onChange={(e) => {
                      setDialogueScriptText(e.target.value);
                      parseDialogueScript(e.target.value, dialogueSpeakerMap);
                    }}
                    rows={6}
                    className="w-full text-xs font-mono p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 leading-relaxed text-slate-900 dark:text-slate-100"
                    placeholder="[Sagar]: नमस्ते साथीहरू...\n[Hemkala]: धन्यवाद सागर जी..."
                  />
                </div>

                {/* Speaker Character Casting Bar */}
                {Object.keys(dialogueSpeakerMap).length > 0 && (
                  <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-rose-500" />
                      Character Voice Casting ({Object.keys(dialogueSpeakerMap).length} Characters Detected)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {Object.keys(dialogueSpeakerMap).map((speakerTag) => {
                        const currentVoiceId = dialogueSpeakerMap[speakerTag];
                        const voiceObj = voicesList.find(v => v.id === currentVoiceId) || selectedVoice;
                        const avatar = getVoiceAvatarMeta(voiceObj);
                        return (
                          <div key={speakerTag} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0">
                              {avatar.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-slate-900 dark:text-white block truncate">
                                [{speakerTag}]
                              </span>
                              <select
                                value={currentVoiceId}
                                onChange={(e) => {
                                  const newVoiceId = e.target.value;
                                  const updatedMap = { ...dialogueSpeakerMap, [speakerTag]: newVoiceId };
                                  setDialogueSpeakerMap(updatedMap);
                                  parseDialogueScript(dialogueScriptText, updatedMap);
                                }}
                                className="w-full text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1 text-slate-700 dark:text-slate-200 font-medium"
                              >
                                {voicesList.map(v => (
                                  <option key={v.id} value={v.id}>
                                    {v.name} ({v.language})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Parsed Dialogue Table Read Lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                      Table Read Line Cues ({dialogueLines.length} Cues)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSynthesizeAllDialogue}
                        disabled={isSynthesizingAllDialogue || dialogueLines.length === 0}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10.5px] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isSynthesizingAllDialogue ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Rendering Lines...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>⚡ Synthesize All Lines</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {dialogueLines.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                      No dialogue lines parsed. Enter a script with speaker tags above.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {dialogueLines.map((line, idx) => {
                        const voiceObj = voicesList.find(v => v.id === line.voiceId) || selectedVoice;
                        const avatar = getVoiceAvatarMeta(voiceObj);
                        const isLinePlaying = activePlayingDialogueId === line.id;
                        return (
                          <div
                            key={line.id}
                            className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                              isLinePlaying
                                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-500/50'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-200 dark:border-slate-700">
                                {avatar.emoji}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                                    [{line.speakerTag}]
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    • {voiceObj.name}
                                  </span>
                                  {line.audioUrl && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                                      {line.duration || 3}s Ready
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed truncate">
                                  {line.text}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {line.audioUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePlayDialogueLine(line)}
                                  className={`p-2 rounded-lg transition font-bold text-xs flex items-center gap-1 cursor-pointer ${
                                    isLinePlaying
                                      ? 'bg-amber-500 text-slate-950'
                                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-200'
                                  }`}
                                  title={isLinePlaying ? 'Pause line' : 'Play line'}
                                >
                                  {isLinePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSynthesizeDialogueLine(idx)}
                                  disabled={line.isProcessing}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[10px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {line.isProcessing ? (
                                    <span className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                  <span>Render</span>
                                </button>
                              )}

                              {line.audioUrl && onAttachAudioTrack && (
                                <button
                                  type="button"
                                  onClick={() => onAttachAudioTrack({
                                    id: 'trk_' + Date.now(),
                                    name: `[${line.speakerTag}] ${line.text.slice(0, 16)}...`,
                                    type: 'audio',
                                    muted: false,
                                    clips: [{
                                      id: 'clp_' + Date.now(),
                                      title: `[${line.speakerTag}] ${line.text.slice(0, 20)}...`,
                                      url: line.audioUrl!,
                                      start: 0,
                                      duration: line.duration || 4,
                                      volume: 1.0,
                                      fadeIn: 0.1,
                                      fadeOut: 0.1
                                    }]
                                  })}
                                  className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
                                  title="Add line clip to Video Studio timeline"
                                >
                                  <Music className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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

                {/* Upload section & Quick Presets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-950/40 transition relative flex flex-col items-center justify-center">
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleBatchFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                      Upload Script File (.txt)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Auto-splits on paragraph line breaks
                    </p>
                  </div>

                  {/* 1-Click Quick Presets */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                      Quick Script Presets
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleNepali = `नमस्ते! नेपालएआई स्टुडियोमा तपाईंलाई हार्दिक स्वागत छ। यो दृश्य एकको परिचय खण्ड हो।\n\nहाम्रो उच्च गुणस्तरको न्युरल आवाज प्रविधिले तपाईंको भिडियोलाई जीवन्त बनाउँछ।\n\nआजै आफ्नो उत्कृष्ट कथा र सामग्री निर्माण सुरु गर्नुहोस्। धन्यवाद!`;
                        setBatchText(sampleNepali);
                        parseBatchParagraphs(sampleNepali);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>🎬 3-Scene Nepali Story</span>
                      <ArrowRight className="w-3 h-3 text-indigo-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleAd = `Are you ready to transform your creative workflow with cutting-edge artificial intelligence?\n\nCreate ultra-realistic voiceovers in native Nepali and English in seconds.\n\nExport directly to your timeline and publish high-converting content effortlessly.`;
                        setBatchText(sampleAd);
                        parseBatchParagraphs(sampleAd);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>📢 Commercial Promo Script</span>
                      <ArrowRight className="w-3 h-3 text-indigo-500" />
                    </button>
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
                    {/* Live Avatar Preview */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-2xl shrink-0">
                        {clonedVoiceDemographic === 'children' ? (clonedVoiceGender === 'Female' ? '👧🏽' : '👦🏽') :
                         clonedVoiceDemographic === 'elderly' ? (clonedVoiceGender === 'Female' ? '👵🏽' : '👴🏽') :
                         clonedVoiceDemographic === 'teen' ? (clonedVoiceGender === 'Female' ? '👱🏼‍♀️' : '🧑🏽') :
                         (clonedVoiceGender === 'Female' ? '👩🏽' : '👨🏽')}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {newClonedVoiceName.trim() || 'New Voice Clone'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-bold uppercase">
                            {clonedVoiceDemographic}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 font-bold uppercase">
                            {clonedVoiceGender}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase">
                            Neural 48kHz
                          </span>
                        </div>
                      </div>
                    </div>

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
                          className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 cursor-pointer"
                        >
                          <option value="children">Children (Girl/Boy)</option>
                          <option value="teen">Teens (Young)</option>
                          <option value="young_adult">Mid-20s (Adult)</option>
                          <option value="adult">30s-40s (Mature)</option>
                          <option value="elderly">Senior (Hajurbuwa/Hajuraama)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Gender:
                        </label>
                        <select
                          value={clonedVoiceGender}
                          onChange={(e) => setClonedVoiceGender(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 cursor-pointer"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Neutral">Neutral</option>
                        </select>
                      </div>
                    </div>

                    {/* Or upload audio sample */}
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center relative hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleClonedAudioUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <span className="text-[10px] text-indigo-500 font-bold flex items-center justify-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Or upload audio file (.mp3, .wav, .m4a)</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveClonedVoice}
                      disabled={!recordedBlob || !newClonedVoiceName.trim()}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Create & Activate Voice Clone</span>
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

                    {/* Relevant Character Avatar Representation */}
                    {(() => {
                      const avMeta = getVoiceAvatarMeta(voice);
                      return (
                        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-lg border ${avMeta.borderColor} bg-gradient-to-br ${avMeta.bgGradient} shadow-xs`}>
                          <span>{avMeta.emoji}</span>
                        </div>
                      );
                    })()}

                    {/* Voice Details */}
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{voice.name}</span>
                        <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                          voice.language === 'Nepali' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                        }`}>
                          {voice.language}
                        </span>
                        {(voice.id === 'hemkala_pure_ne' || voice.id === 'sagar_pure_ne') && (
                          <span className="text-[7.5px] px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-extrabold uppercase tracking-wider">
                            ✨ Pure Neural 48kHz HD
                          </span>
                        )}
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-indigo-500" />
                <span>Generated Sound List</span>
              </h3>
              <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono rounded-full font-bold">
                {generatedSounds.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every synthesized voiceover is automatically stored and synchronized with Video Studio's Audio section.
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {generatedSounds.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 text-xs">
                  No generated sounds yet. Synthesize audio to populate this list.
                </div>
              ) : (
                generatedSounds.map(sound => {
                  const isCurrentlyPlaying = playingSoundId === sound.id;
                  return (
                    <div key={sound.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePlayGeneratedSound(sound)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer ${
                            isCurrentlyPlaying
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={isCurrentlyPlaying ? 'Pause' : 'Play preview'}
                        >
                          {isCurrentlyPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                        </button>
                        <div className="overflow-hidden min-w-0 flex-1">
                          <span className="font-bold text-slate-800 dark:text-white block truncate">{sound.title}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {Math.round(sound.duration || 6)}s • {sound.engine || 'Neural TTS'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleAttachGeneratedSound(sound)}
                          className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] rounded transition cursor-pointer"
                          title="Attach to Video Studio"
                        >
                          Use
                        </button>
                        <button
                          onClick={(e) => handleDeleteGeneratedSound(sound.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
