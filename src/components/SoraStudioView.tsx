import React, { useState } from 'react';
import { Scene, UserSession, UserTrialQuota } from '../types';
import { apiGenerateVideo } from '../lib/api';
import { 
  Video, 
  Sparkles, 
  Film, 
  Play, 
  Check, 
  Clock, 
  RefreshCw, 
  Download, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface SoraStudioViewProps {
  onAddSceneToVideo: (scene: Scene) => void;
  bypassControlledMode: boolean;
  user?: UserSession | null;
  onTriggerPaywall?: (reason: string) => void;
  onUsageUpdated?: (usage: UserTrialQuota, credits: number) => void;
  onStartGlobalLoading?: (info: { title: string; subtitle?: string; type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; progress?: number }) => void;
  onStopGlobalLoading?: () => void;
}

export const SoraStudioView: React.FC<SoraStudioViewProps> = ({
  onAddSceneToVideo,
  bypassControlledMode,
  user,
  onTriggerPaywall,
  onUsageUpdated,
  onStartGlobalLoading,
  onStopGlobalLoading,
}) => {
  const [prompt, setPrompt] = useState(
    'A cinematic drone flight skimming over snow-dusted Himalayan pine forests at golden hour, 4k photorealistic'
  );
  const [promptNepali, setPromptNepali] = useState(
    'सुनौलो साँझमा हिउँले ढाकिएका सल्लाका रुखहरू माथि ड्रोनबाट खिचिएको मनोरम दृश्य'
  );
  const [model] = useState<'sora-2'>('sora-2');
  const [resolution, setResolution] = useState<'720x1280' | '1280x720'>('1280x720');
  const [seconds, setSeconds] = useState<'4' | '8'>('4');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [videoResultUrl, setVideoResultUrl] = useState<string>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  );
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Generate Sora Video
  const handleGenerateSora = async () => {
    setIsGenerating(true);
    setJobProgress(10);
    setAddedSuccess(false);
    setGenError(null);

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'video',
        title: 'Synthesizing Sora-2 Neural Video...',
        subtitle: `Generating ${seconds}s photorealistic video clip at ${resolution} via Azure AI Foundry`,
        progress: 15,
      });
    }

    try {
      if (user) {
        setJobProgress(30);
        if (onStartGlobalLoading) {
          onStartGlobalLoading({
            type: 'video',
            title: 'Synthesizing Sora-2 Neural Video...',
            subtitle: 'Dispatching diffusion synthesis pipeline...',
            progress: 35,
          });
        }
        const data = await apiGenerateVideo(
          user.id,
          prompt,
          parseInt(seconds) || 4,
          resolution === '720x1280' ? '720p' : '1080p'
        );
        setJobProgress(90);
        if (onStartGlobalLoading) {
          onStartGlobalLoading({
            type: 'video',
            title: 'Finalizing Video Composition...',
            subtitle: 'Encoding MP4 stream and syncing video timeline...',
            progress: 95,
          });
        }
        await new Promise(r => setTimeout(r, 400));
        if (data.result && data.result.url) {
          setVideoResultUrl(data.result.url);
        }
        setJobProgress(100);
        if (onUsageUpdated) {
          onUsageUpdated(data.trialUsage, data.remainingCredits);
        }
      } else {
        const stages = [25, 50, 75, 95, 100];
        for (const p of stages) {
          await new Promise(r => setTimeout(r, 400));
          setJobProgress(p);
          if (onStartGlobalLoading) {
            onStartGlobalLoading({
              type: 'video',
              title: 'Synthesizing Sora-2 Neural Video...',
              subtitle: `Processing frame interpolation (${p}%)...`,
              progress: p,
            });
          }
        }
        const sampleVideos = [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        ];
        setVideoResultUrl(sampleVideos[Math.floor(Math.random() * sampleVideos.length)]);
      }
    } catch (e: any) {
      console.error(e);
      setGenError(e.message || 'Video generation failed');
      if (e.message?.includes('trial') || e.message?.includes('credit') || e.message?.includes('limit')) {
        if (onTriggerPaywall) onTriggerPaywall(e.message);
      }
    } finally {
      setIsGenerating(false);
      if (onStopGlobalLoading) {
        onStopGlobalLoading();
      }
    }
  };

  // Add to Video Studio
  const handleAddToTimeline = () => {
    const newScene: Scene = {
      id: 'scene-sora-' + Math.random().toString(36).substring(2, 9),
      title: 'Sora-2: ' + prompt.slice(0, 20),
      duration: parseInt(seconds),
      prompt,
      promptNepali,
      mediaUrl: videoResultUrl,
      mediaType: videoResultUrl.includes('.mp4') || videoResultUrl.includes('.webm') || videoResultUrl.includes('video') ? 'video' : 'image',
      aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
      motion: 'zoom_in',
      transition: 'dissolve',
      textOverlay: prompt.slice(0, 32),
      textNepali: promptNepali.slice(0, 32),
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'devanagari',
      filter: 'cinematic',
      volume: 85
    };
    onAddSceneToVideo(newScene);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Azure Sora-2 Video Studio</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
              OpenAI Sora-2 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate high-temporal AI video clips using your configured Azure AI Foundry Sora endpoint.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Target Endpoint:</span>
          <code className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-emerald-700 border border-slate-200 font-mono font-medium">
            /videos (POST)
          </code>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Sora Prompt & Parameters */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-sm">
          {/* Prompt */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">English Video Prompt</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe cinematic camera motion, subject, and lighting..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Nepali Subtitle / Prompt */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-700">नेपाली विवरण (Nepali Video Description)</label>
            <textarea
              rows={2}
              value={promptNepali}
              onChange={e => setPromptNepali(e.target.value)}
              placeholder="नेपालीमा भिडियोको वर्णन लेख्नुहोस्..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-['Mukta'] text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Parameter Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Model</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-indigo-700">
                sora-2
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Resolution</label>
              <select
                value={resolution}
                onChange={e => setResolution(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="1280x720">1280x720 (16:9)</option>
                <option value="720x1280">720x1280 (9:16)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Duration</label>
              <select
                value={seconds}
                onChange={e => setSeconds(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="4">4 Seconds</option>
                <option value="8">8 Seconds</option>
              </select>
            </div>
          </div>

          {/* Developer Settings / Raw API Contract - Superadmin Only */}
          {user?.role === 'admin' && (
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 shadow-inner">
              <div className="text-amber-400 font-bold flex items-center justify-between">
                <span>Azure Request Contract (Superadmin Diagnostics):</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">ADMIN</span>
              </div>
              <div className="text-indigo-400 font-semibold truncate">
                POST https://prakashsuvedi-7749-resource.services.ai.azure.com/videos
              </div>
              <div className="text-slate-300">
                {JSON.stringify({ prompt: prompt.slice(0, 30) + '...', model: 'sora-2', size: resolution, seconds }, null, 2)}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateSora}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Sora-2 Video ({jobProgress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Sora-2 Video Clip</span>
              </>
            )}
          </button>
        </div>

        {/* Right 6 Columns: Video Stage & Timeline Sync */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900">Sora-2 Render Preview</span>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{seconds}s • {resolution}</span>
          </div>

          {/* Canvas display */}
          <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[340px] flex items-center justify-center relative p-2 shadow-inner">
            {videoResultUrl ? (
              <div className="relative w-full h-full max-h-[340px] flex items-center justify-center">
                {videoResultUrl.includes('.mp4') || videoResultUrl.includes('.webm') || videoResultUrl.includes('gtv-videos-bucket') || videoResultUrl.includes('video') ? (
                  <video
                    src={videoResultUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="rounded-lg object-contain w-full h-full max-h-[340px] shadow-lg bg-black"
                  />
                ) : (
                  <img
                    src={videoResultUrl}
                    alt="Sora Preview"
                    referrerPolicy="no-referrer"
                    className="rounded-lg object-cover w-full h-full max-h-[340px] shadow-lg"
                  />
                )}
                <div className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-md">
                  SORA-2 4K
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No Sora video rendered yet.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={videoResultUrl}
                target="_blank"
                rel="noreferrer"
                download="sora_video.mp4"
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Video</span>
              </a>

              <button
                onClick={handleAddToTimeline}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>+ Add to Video Studio Timeline</span>
              </button>
            </div>

            {addedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Sora scene inserted into Video Studio Timeline! Switch to "Video Studio" tab to inspect.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
