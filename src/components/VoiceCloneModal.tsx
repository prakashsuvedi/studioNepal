import React, { useState, useRef } from 'react';
import { 
  Mic, Upload, Play, Pause, Check, AlertCircle, Sparkles, X, 
  ShieldCheck, Activity, Music, AudioWaveform, Lock, Volume2, UserCheck
} from 'lucide-react';
import { CustomVoice, UserSession } from '../types';
import { apiCreateCustomVoice, apiPreviewVoiceSample } from '../lib/api';

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null | undefined;
  onVoiceCreated: (voice: CustomVoice) => void;
  onTriggerPaywall?: (reason: string) => void;
}

export const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({
  isOpen,
  onClose,
  user,
  onVoiceCreated,
  onTriggerPaywall,
}) => {
  const [voiceName, setVoiceName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'non-binary' | 'unspecified'>('female');
  const [language, setLanguage] = useState<'ne-NP' | 'en-US'>('ne-NP');
  
  // Audio state
  const [audioSourceType, setAudioSourceType] = useState<'upload' | 'record'>('upload');
  const [sampleAudioBase64, setSampleAudioBase64] = useState<string | null>(null);
  const [sampleFilename, setSampleFilename] = useState<string>('');
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Microphone recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Real-time analysis preview
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    durationSec?: number;
    pitchMeanHz?: number;
    timbreDescriptor?: string;
    detectedGender?: string;
    sampleRate?: number;
  } | null>(null);

  // Legal Consent
  const [signerFullName, setSignerFullName] = useState(user?.name || '');
  const [signerRelationship, setSignerRelationship] = useState('Direct Voice Donor / Legal Rights Holder');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|aac|webm)$/i)) {
      setErrorMessage('Please upload a valid audio file (MP3, WAV, M4A, OGG).');
      return;
    }

    setErrorMessage(null);
    setSampleFilename(file.name);
    if (!voiceName) {
      const suggestedName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setVoiceName(suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setSampleAudioBase64(base64);

      // Run real-time acoustic preview analysis
      setIsAnalyzing(true);
      try {
        const analysis = await apiPreviewVoiceSample(base64, file.name);
        setAnalysisResult(analysis);
        if (analysis.detectedGender === 'female' || analysis.detectedGender === 'male') {
          setGender(analysis.detectedGender);
        }
      } catch (err) {
        console.warn('Preview analysis notice:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setSampleAudioBase64(base64);
          setSampleFilename('microphone_recording.mp3');

          setIsAnalyzing(true);
          try {
            const analysis = await apiPreviewVoiceSample(base64, 'microphone_recording.mp3');
            setAnalysisResult(analysis);
            if (analysis.detectedGender === 'female' || analysis.detectedGender === 'male') {
              setGender(analysis.detectedGender);
            }
          } catch (err) {
            console.warn('Microphone analysis notice:', err);
          } finally {
            setIsAnalyzing(false);
          }
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Microphone access denied or not supported in this browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const toggleSamplePlayback = () => {
    if (!sampleAudioBase64) return;
    if (isPlayingSample && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingSample(false);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(sampleAudioBase64);
        audioPreviewRef.current.onended = () => setIsPlayingSample(false);
      } else {
        audioPreviewRef.current.src = sampleAudioBase64;
      }
      audioPreviewRef.current.play().then(() => setIsPlayingSample(true)).catch(() => setIsPlayingSample(false));
    }
  };

  const handleCreateVoice = async () => {
    setErrorMessage(null);

    if (!voiceName.trim()) {
      setErrorMessage('Please provide a name for your cloned voice.');
      return;
    }

    if (!sampleAudioBase64) {
      setErrorMessage('Please upload or record a reference voice sample.');
      return;
    }

    if (!consentConfirmed) {
      setErrorMessage('Explicit legal recorded consent is required before cloning a voice.');
      return;
    }

    if (!signerFullName.trim() || signerFullName.trim().length < 2) {
      setErrorMessage('Signer legal full name is required for biometric consent audit compliance.');
      return;
    }

    const userId = user?.id || 'usr_guest_demo';

    setIsSubmitting(true);
    try {
      const response = await apiCreateCustomVoice({
        userId,
        name: voiceName.trim(),
        sampleAudio: sampleAudioBase64,
        sampleFilename: sampleFilename || 'custom_voice_sample.mp3',
        gender,
        language,
        description: description.trim() || `Cloned neural acoustic model of ${voiceName.trim()}`,
        consentConfirmed: true,
        signerFullName: signerFullName.trim(),
        signerRelationship: signerRelationship.trim(),
        consentStatement: `I, ${signerFullName.trim()}, hereby confirm under penalty of perjury that I am the legal owner or authorized representative of this vocal recording, and grant explicit consent for AI synthetic voice cloning in NepalAI Studio.`,
      });

      if (response.success && response.voice) {
        onVoiceCreated(response.voice);
        onClose();
      } else {
        setErrorMessage('Failed to create cloned voice.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Voice cloning failed.';
      if (msg.includes('Insufficient credits') || msg.includes('PAYWALL')) {
        if (onTriggerPaywall) {
          onTriggerPaywall('Voice cloning requires 20 package credits. Please top up your account.');
        }
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl text-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Instant Voice Cloning Studio</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  20 Credits
                </span>
              </div>
              <p className="text-xs text-slate-400">Clone your voice from a short 5-30s audio sample with acoustic neural modeling</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Voice Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cloned Voice Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="e.g., Prakash Real Voice, Maya Podcaster"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="ne-NP">Nepali (नेपाली - ne-NP)</option>
                <option value="en-US">English (US / Global - en-US)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vocal Timbre / Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="female">Female (Alto / Soprano)</option>
                <option value="male">Male (Tenor / Baritone)</option>
                <option value="non-binary">Non-Binary / Neutral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Documentary narrator, podcast host"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Audio Input Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Voice Sample Upload or Record <span className="text-rose-400">*</span>
            </label>

            <div className="flex border-b border-slate-800 mb-3">
              <button
                type="button"
                onClick={() => setAudioSourceType('upload')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium border-b-2 transition ${
                  audioSourceType === 'upload'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Audio File</span>
              </button>
              <button
                type="button"
                onClick={() => setAudioSourceType('record')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium border-b-2 transition ${
                  audioSourceType === 'record'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Record via Mic</span>
              </button>
            </div>

            {audioSourceType === 'upload' ? (
              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-indigo-950/10 transition group">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2 transition" />
                <span className="text-xs font-medium text-slate-300">
                  {sampleFilename ? sampleFilename : 'Click to browse or drop an audio file'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Supports MP3, WAV, M4A, OGG (Recommended: 10-30 seconds clear speech)</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.webm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center">
                {isRecording ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center animate-pulse">
                      <Mic className="w-6 h-6 text-rose-400" />
                    </div>
                    <div className="text-center">
                      <span className="text-rose-400 font-mono text-sm font-bold">
                        00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">Recording clear speech into microphone...</p>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      Stop Recording
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                      <Mic className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-xs text-slate-400 text-center max-w-sm">
                      Read a natural 10-20 second sentence in your everyday speaking voice.
                    </p>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Start Recording</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Audio Preview Player & Acoustic Profile */}
            {sampleAudioBase64 && (
              <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={toggleSamplePlayback}
                    className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition shadow"
                  >
                    {isPlayingSample ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-medium text-slate-200 block truncate max-w-[240px]">
                      {sampleFilename || 'Sample Audio Ready'}
                    </span>
                    <span className="text-[10px] text-indigo-400 flex items-center space-x-1">
                      <Volume2 className="w-3 h-3 inline mr-0.5" />
                      Reference Voice Sample Loaded
                    </span>
                  </div>
                </div>

                {/* Acoustic Profile Metrics */}
                {analysisResult && (
                  <div className="flex items-center space-x-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Fundamental Pitch (f0)</span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {analysisResult.pitchMeanHz} Hz
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Timbre Profile</span>
                      <span className="text-xs font-semibold text-indigo-300">
                        {analysisResult.timbreDescriptor || 'Natural Vocal'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legal Recorded Consent Verification Card (Mandatory Prompt #6 Compliance Pattern) */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Mandatory Biometric Voice Consent & Rights Verification
              </h3>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              To prevent deepfakes and ensure ethical AI compliance, NepalAI Studio requires verified legal consent from the voice owner prior to synthetic voice profile generation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Signer Full Legal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={signerFullName}
                  onChange={(e) => setSignerFullName(e.target.value)}
                  placeholder="e.g., Prakash Suvedi"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Signer Relationship</label>
                <select
                  value={signerRelationship}
                  onChange={(e) => setSignerRelationship(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Direct Voice Donor / Legal Rights Holder">Direct Voice Donor / Legal Rights Holder</option>
                  <option value="Authorized Talent Manager / Production Agency">Authorized Talent Manager / Agency</option>
                  <option value="Parent / Legal Guardian">Parent / Legal Guardian</option>
                </select>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <span className="text-xs text-slate-300 leading-normal">
                  I hereby confirm under penalty of perjury that I am the authorized legal owner of this voice, and grant explicit consent to synthesize speech using this cloned voice profile.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreateVoice}
            disabled={isSubmitting || !sampleAudioBase64 || !voiceName.trim() || !consentConfirmed || !signerFullName.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-lg shadow-indigo-600/25"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Training & Cloning Voice...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Authorize & Clone Voice (20 Credits)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
