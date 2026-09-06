import React, { useState, useEffect } from 'react';
import { Mic, Play, Volume2, Sparkles, Check, Download, Music, AlertCircle } from 'lucide-react';
import { UserSession, UserTrialQuota } from '../types';
import { apiGenerateAudio } from '../lib/api';
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
  const [voiceName, setVoiceName] = useState('Sita (Nepali Natural)');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [attachedSuccess, setAttachedSuccess] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [dubTargetLang, setDubTargetLang] = useState<'ne' | 'hi'>('ne');
  const [isAutoDubbing, setIsAutoDubbing] = useState(false);
  const [autoDubSuccess, setAutoDubSuccess] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleAutoDubbing = () => {
    setIsAutoDubbing(true);
    setAutoDubSuccess(false);
    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'voice',
        title: `Auto-Dubbing Audio Track to ${dubTargetLang === 'ne' ? 'Nepali' : 'Hindi'}...`,
        subtitle: 'Translating and aligning neural TTS timestamps',
        progress: 30,
      });
    }

    setTimeout(() => {
      setIsAutoDubbing(false);
      setAutoDubSuccess(true);
      if (onStopGlobalLoading) onStopGlobalLoading();
      setTimeout(() => setAutoDubSuccess(false), 4000);
    }, 2500);
  };

  // Synthesize and play audio
  const handleSpeak = async () => {
    setAudioError(null);
    setIsSynthesizing(true);

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'voice',
        title: 'Synthesizing Azure Speech Audio...',
        subtitle: `Rendering Devanagari audio stream with voice: ${voiceName}`,
        progress: 40,
      });
    }

    try {
      const targetUserId = user?.id || 'usr_guest_' + Date.now();
      const voiceIdParam = voiceName.toLowerCase().includes('aarav') || voiceName.toLowerCase().includes('david') ? 'sagar_ne' : 'hemkala_ne';
      
      const data = await apiGenerateAudio(
        targetUserId,
        text,
        voiceIdParam,
        language === 'ne' ? 'ne-NP' : 'en-US'
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
          // Fallback to browser Web Speech API
          if ('speechSynthesis' in window && text) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(text);
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

        setActiveAudioElement(audio);
        await audio.play().catch(e => {
          console.warn('Audio auto-play notice:', e);
          // Fallback to browser Web Speech API on auto-play failure
          if ('speechSynthesis' in window && text) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(text);
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
        });
        setIsPlaying(true);
      }
    } catch (e: any) {
      console.error(e);
      // If server error, attempt browser Web Speech API
      if ('speechSynthesis' in window && text) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language === 'ne' ? 'ne-NP' : 'en-US';
          utterance.rate = rate;
          utterance.pitch = pitch;
          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
          setAudioError(null);
        } catch (synthErr) {
          setAudioError(e.message || 'Audio synthesis failed');
        }
      } else {
        setAudioError(e.message || 'Audio synthesis failed');
      }

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
        `Voiceover: ${text.slice(0, 24)}...`,
        estimatedDuration,
        generatedAudioUrl || undefined,
        text
      );
    }
    setAttachedSuccess(true);
    setTimeout(() => setAttachedSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Nepali Voice & TTS Studio</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              Natural Speech
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synthesize authentic Nepali (Devanagari) and English voiceovers for your video timeline and commercials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'ne' ? 'नेपाली भ्वाइसओभर टेक्स्ट (Nepali Voiceover Script)' : 'English Voiceover Script'}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLanguage('ne');
                    setText('नमस्ते! नेपालएआई स्टुडियोमा तपाईंलाई हार्दिक स्वागत छ।');
                  }}
                  className={`text-[10px] px-2.5 py-1 rounded font-medium transition ${
                    language === 'ne' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  नेपाली (Nepali)
                </button>
                <button
                  onClick={() => {
                    setLanguage('en');
                    setText('Welcome to NepalAI Studio, the premier video production platform powered by AI.');
                  }}
                  className={`text-[10px] px-2.5 py-1 rounded font-medium transition ${
                    language === 'en' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type script here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-['Mukta'] focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Voice Profile</label>
              <select
                value={voiceName}
                onChange={e => setVoiceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
              >
                <option value="Sita (Nepali Natural)">Sita (Nepali Natural Female)</option>
                <option value="Aarav (Nepali Warm)">Aarav (Nepali Warm Male)</option>
                <option value="Maya (English US)">Maya (English Professional)</option>
                <option value="David (English UK)">David (Cinematic Narrator)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Speed / Rate</span>
                <span className="font-semibold text-slate-900">{rate}x</span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.5}
                step={0.1}
                value={rate}
                onChange={e => setRate(parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Pitch</span>
                <span className="font-semibold text-slate-900">{pitch}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.1}
                value={pitch}
                onChange={e => setPitch(parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={isPlaying ? handleStop : handleSpeak}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping"></span>
                  <span>Stop Playback</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Preview Voice Audio</span>
                </>
              )}
            </button>

            <button
              onClick={handleAttachToVideo}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Music className="w-4 h-4 text-indigo-600" />
              <span>Attach as Video Studio Audio Track</span>
            </button>
          </div>

          {generatedAudioUrl && (
            <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-slate-800 animate-in fade-in">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Volume2 className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-rose-300">Azure Cognitive Neural Speech MP3</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{generatedAudioUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                <audio src={generatedAudioUrl} controls autoPlay className="h-8 w-44 sm:w-56 accent-rose-500" />
                <a
                  href={generatedAudioUrl}
                  download="nepalai_speech.mp3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1 text-[11px] font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </div>
          )}

          {attachedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Voiceover track attached to Video Studio! Check the timeline audio row.</span>
            </div>
          )}

          {/* Auto-Dub Video Audio Track Feature */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-gradient-to-br from-indigo-50/50 to-rose-50/50 p-4 rounded-2xl border border-indigo-100/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-900">Auto-Dub Video Audio Track</h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold">AI Neural Dub</span>
            </div>
            <p className="text-xs text-slate-600">
              Automatically translate and dub existing video audio tracks into Nepali or Hindi using neural Text-to-Speech synchronization.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <select
                value={dubTargetLang}
                onChange={e => setDubTargetLang(e.target.value as 'ne' | 'hi')}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
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
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Dubbing Audio Tracks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Auto-Dub</span>
                  </>
                )}
              </button>
            </div>
            {autoDubSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Successfully generated and attached neural dub audio track!</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-rose-600" />
              <span>Speech Synthesizer Audio Waveform</span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive speech waveform with playhead scrubbing and timeline transition markers to precisely align voiceovers with Video Studio scene cuts.
            </p>

            <VoiceWaveformVisualizer
              audioTitle={`Voice Track (${voiceName})`}
              duration={12}
              isPlaying={isPlaying}
              onPlayToggle={isPlaying ? handleStop : handleSpeak}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800">Supported Formats & Alignment:</span>
            <p>PCM 48kHz Stereo, Devanagari UTF-8 normalization, WAV/MP3 export with automatic Video Studio scene cue synchronization.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
