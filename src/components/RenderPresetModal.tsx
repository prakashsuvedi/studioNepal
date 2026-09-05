import React, { useState } from 'react';
import { 
  Sliders, 
  Check, 
  Film, 
  Smartphone, 
  Video, 
  Instagram, 
  Youtube, 
  Zap, 
  Settings2, 
  Gauge, 
  Layers, 
  Sparkles, 
  Download, 
  X as XIcon,
  HardDrive
} from 'lucide-react';

export interface RenderPreset {
  id: string;
  name: string;
  platform: 'TikTok' | 'YouTube' | 'Instagram' | 'X' | 'Universal';
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: string;
  width: number;
  height: number;
  fps: number;
  bitrateMbps: number;
  codec: string;
  description: string;
  colorGrade: string;
  recommendedDuration: string;
}

export const RENDER_PRESETS: RenderPreset[] = [
  {
    id: 'tiktok_916',
    name: 'TikTok 9:16 Vertical Pro',
    platform: 'TikTok',
    aspectRatio: '9:16',
    resolution: '1080 × 1920 (Full HD)',
    width: 1080,
    height: 1920,
    fps: 60,
    bitrateMbps: 12,
    codec: 'H.264 / AAC 320kbps',
    description: 'High frame-rate vertical preset tuned for TikTok feed algorithms & crisp mobile playback.',
    colorGrade: 'Vibrant Punch (Mobile OLED)',
    recommendedDuration: '< 60 seconds',
  },
  {
    id: 'youtube_169_4k',
    name: 'YouTube 16:9 4K Ultra Cinematic',
    platform: 'YouTube',
    aspectRatio: '16:9',
    resolution: '3840 × 2160 (4K UHD)',
    width: 3840,
    height: 2160,
    fps: 60,
    bitrateMbps: 35,
    codec: 'H.265 / HEVC High Tier',
    description: 'Ultra-HD widescreen master configuration with extended color gamut for desktop & TV viewing.',
    colorGrade: 'Rec.709 Cinematic Film Flat',
    recommendedDuration: '1 - 15 minutes',
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts 9:16',
    platform: 'YouTube',
    aspectRatio: '9:16',
    resolution: '1080 × 1920 (Full HD)',
    width: 1080,
    height: 1920,
    fps: 60,
    bitrateMbps: 16,
    codec: 'H.264 High Profile',
    description: 'Optimized for YouTube Shorts player with high dynamic audio normalization.',
    colorGrade: 'High Contrast Vivid',
    recommendedDuration: '< 60 seconds',
  },
  {
    id: 'instagram_reel',
    name: 'Instagram Reel 9:16 HDR',
    platform: 'Instagram',
    aspectRatio: '9:16',
    resolution: '1080 × 1920 (Full HD)',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrateMbps: 10,
    codec: 'H.264 / AAC 256kbps',
    description: 'Tailored to Instagram Reels upload engine compression guidelines to prevent artifacting.',
    colorGrade: 'Warm Portrait Tone',
    recommendedDuration: '< 90 seconds',
  },
  {
    id: 'x_video_tweet',
    name: 'X (Twitter) 16:9 HD Broadcast',
    platform: 'X',
    aspectRatio: '16:9',
    resolution: '1920 × 1080 (Full HD)',
    width: 1920,
    height: 1080,
    fps: 30,
    bitrateMbps: 8,
    codec: 'H.264 Main Profile',
    description: 'Fast-loading compressed video format built for responsive Twitter timelines.',
    colorGrade: 'Standard Neutral',
    recommendedDuration: '< 140 seconds',
  },
  {
    id: 'instagram_square_11',
    name: 'Instagram Square 1:1 Feed Master',
    platform: 'Instagram',
    aspectRatio: '1:1',
    resolution: '1080 × 1080 (Square)',
    width: 1080,
    height: 1080,
    fps: 30,
    bitrateMbps: 8,
    codec: 'H.264 / AAC 192kbps',
    description: 'Classic square aspect ratio optimized for carousel posts and grid feeds.',
    colorGrade: 'Crisp Studio Neutral',
    recommendedDuration: '< 60 seconds',
  },
];

export interface RenderPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAspectRatio: '16:9' | '9:16' | '1:1';
  onApplyPreset: (preset: RenderPreset) => void;
}

export const RenderPresetModal: React.FC<RenderPresetModalProps> = ({
  isOpen,
  onClose,
  currentAspectRatio,
  onApplyPreset,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    if (currentAspectRatio === '9:16') return 'tiktok_916';
    if (currentAspectRatio === '1:1') return 'instagram_square_11';
    return 'youtube_169_4k';
  });

  const [customFps, setCustomFps] = useState<number>(60);
  const [customBitrate, setCustomBitrate] = useState<number>(16);

  if (!isOpen) return null;

  const selectedPreset = RENDER_PRESETS.find(p => p.id === selectedPresetId) || RENDER_PRESETS[0];

  const handleApply = () => {
    const finalPreset: RenderPreset = {
      ...selectedPreset,
      fps: customFps || selectedPreset.fps,
      bitrateMbps: customBitrate || selectedPreset.bitrateMbps,
    };
    onApplyPreset(finalPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
              <Sliders className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>Render & Export Presets Configurator</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] uppercase font-bold">
                  Professional Output
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Select target platform encoder presets to auto-adjust frame dimensions, bitrates, and audio normalization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-800">

          {/* Preset Cards Selector Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" />
              <span>Select Platform Render Preset</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RENDER_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setCustomFps(preset.fps);
                      setCustomBitrate(preset.bitrateMbps);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-3 relative cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg bg-slate-900 border ${isSelected ? 'border-indigo-400 text-indigo-400' : 'border-slate-800 text-slate-400'}`}>
                          {preset.aspectRatio === '9:16' && <Smartphone className="w-4 h-4" />}
                          {preset.aspectRatio === '16:9' && <Video className="w-4 h-4" />}
                          {preset.aspectRatio === '1:1' && <Layers className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            {preset.name}
                          </h4>
                          <span className="text-[10px] font-mono text-indigo-300 font-semibold">
                            {preset.resolution} • {preset.fps} FPS
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="p-1 rounded-full bg-indigo-600 text-white shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {preset.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                      <span>Bitrate: {preset.bitrateMbps} Mbps</span>
                      <span>Codec: {preset.codec.split(' ')[0]}</span>
                      <span className="text-indigo-400 font-bold">{preset.aspectRatio}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Preset Technical Fine-Tuning */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                <span>Fine-Tune Active Sequence Encoding Specs</span>
              </label>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                Aspect: <strong className="text-indigo-300">{selectedPreset.aspectRatio}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              {/* Frame Rate Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Frame Rate</span>
                </label>
                <select
                  value={customFps}
                  onChange={(e) => setCustomFps(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  <option value={60}>60 FPS (Smooth Motion / Shorts)</option>
                  <option value={30}>30 FPS (Standard Broadcast)</option>
                  <option value={24}>24 FPS (Cinematic 24p Film)</option>
                </select>
              </div>

              {/* Bitrate Output Control */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Video Bitrate ({customBitrate} Mbps)</span>
                </label>
                <input
                  type="range"
                  min={4}
                  max={50}
                  step={2}
                  value={customBitrate}
                  onChange={(e) => setCustomBitrate(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>4 Mbps (Compact)</span>
                  <span>16 Mbps (HQ)</span>
                  <span>50 Mbps (Master)</span>
                </div>
              </div>

              {/* Color Profile */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Color LUT / Profile</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedPreset.colorGrade}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs text-indigo-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Target: <strong className="text-white">{selectedPreset.resolution}</strong> at <strong className="text-white">{customFps} FPS</strong> ({customBitrate} Mbps)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Preset & Adjust Sequence</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
