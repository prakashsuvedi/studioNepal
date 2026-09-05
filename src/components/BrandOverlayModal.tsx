import React, { useState } from 'react';
import { 
  Shield, 
  Check, 
  X as XIcon, 
  Upload, 
  Image as ImageIcon, 
  Move, 
  Sliders, 
  Eye, 
  Sparkles, 
  Type,
  Layers,
  Award
} from 'lucide-react';

export interface BrandOverlayConfig {
  enabled: boolean;
  logoUrl: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  scalePercent: number; // 10 to 50
  opacityPercent: number; // 20 to 100
  marginPx: number; // 8 to 48
  brandText: string;
  showBrandText: boolean;
}

export const WATERMARK_PRESETS = [
  {
    id: 'nepalai_gold',
    name: 'NepalAI Gold Studio Emblem',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    text: 'NepalAI Studio'
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Neon Monogram',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=160&auto=format&fit=crop&q=80',
    text: 'NEPAL AI'
  },
  {
    id: 'devanagari_logo',
    name: 'Devanagari Authentic Stamp',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=160&auto=format&fit=crop&q=80',
    text: 'नेपाल एआई स्टुडियो'
  },
];

export interface BrandOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandOverlayConfig;
  onSaveBrandConfig: (config: BrandOverlayConfig) => void;
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export const BrandOverlayModal: React.FC<BrandOverlayModalProps> = ({
  isOpen,
  onClose,
  brandConfig: initialConfig,
  onSaveBrandConfig,
  aspectRatio,
}) => {
  const [config, setConfig] = useState<BrandOverlayConfig>(initialConfig);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveBrandConfig(config);
    onClose();
  };

  const getPositionStyle = () => {
    const margin = `${config.marginPx}px`;
    switch (config.position) {
      case 'top-left':
        return { top: margin, left: margin };
      case 'top-right':
        return { top: margin, right: margin };
      case 'bottom-left':
        return { bottom: margin, left: margin };
      case 'bottom-right':
      default:
        return { bottom: margin, right: margin };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-800/80 rounded-2xl max-w-3xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/30 border border-amber-500/40 text-amber-400">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>Brand Overlay & Fixed Watermark Studio</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold">
                  Copyright Protection
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Apply a high-resolution logo watermark and brand label to all exported videos automatically.
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

        {/* Modal Scroll Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-800">

          {/* Toggle Enable Watermark */}
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Enable Brand Watermark Overlay</h4>
                <p className="text-[11px] text-slate-400">Burns watermark into final video frames during export.</p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {config.enabled && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Watermark Controls */}
              <div className="space-y-4">
                
                {/* Logo Preset Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Select Logo / Monogram Preset</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {WATERMARK_PRESETS.map((preset) => {
                      const isSelected = config.logoUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setConfig(prev => ({ ...prev, logoUrl: preset.url, brandText: preset.text }))}
                          className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/50'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
                          />
                          <span className="text-[10px] text-slate-300 font-semibold truncate w-full">
                            {preset.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Image URL */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Custom Logo Image URL</label>
                  <input
                    type="text"
                    value={config.logoUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                {/* Fixed Position Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5" />
                    <span>Watermark Position</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'top-left', label: '↖ Top-Left' },
                      { id: 'top-right', label: '↗ Top-Right' },
                      { id: 'bottom-left', label: '↙ Bottom-Left' },
                      { id: 'bottom-right', label: '↘ Bottom-Right' },
                    ].map(pos => (
                      <button
                        key={pos.id}
                        onClick={() => setConfig(prev => ({ ...prev, position: pos.id as any }))}
                        className={`p-2 rounded-lg text-xs font-semibold border transition ${
                          config.position === pos.id
                            ? 'bg-amber-600 text-white border-amber-500 shadow'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders for Scale & Opacity */}
                <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-semibold">Watermark Scale</span>
                      <span className="font-mono text-amber-400">{config.scalePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      value={config.scalePercent}
                      onChange={(e) => setConfig(prev => ({ ...prev, scalePercent: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-semibold">Opacity</span>
                      <span className="font-mono text-amber-400">{config.opacityPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={config.opacityPercent}
                      onChange={(e) => setConfig(prev => ({ ...prev, opacityPercent: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-semibold">Corner Padding</span>
                      <span className="font-mono text-amber-400">{config.marginPx}px</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={48}
                      value={config.marginPx}
                      onChange={(e) => setConfig(prev => ({ ...prev, marginPx: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Brand Text Caption */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-amber-400" />
                      <span>Brand Text Sub-caption</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={config.showBrandText}
                      onChange={(e) => setConfig(prev => ({ ...prev, showBrandText: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {config.showBrandText && (
                    <input
                      type="text"
                      value={config.brandText}
                      onChange={(e) => setConfig(prev => ({ ...prev, brandText: e.target.value }))}
                      placeholder="e.g. NepalAI Studio"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Visual Stage Live Preview */}
              <div className="space-y-2 flex flex-col justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Real-time Watermark Visual Preview</span>
                </label>

                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-amber-500/40 shadow-2xl flex items-center justify-center group">
                  {/* Background Mock Video Frame */}
                  <img
                    src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80"
                    alt="Mock Video Frame"
                    className="w-full h-full object-cover opacity-60 brightness-90"
                  />

                  {/* Simulated Frame Grid Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

                  {/* Watermark Overlay Element */}
                  <div
                    className="absolute flex items-center gap-2 transition-all duration-200 pointer-events-none select-none"
                    style={{
                      ...getPositionStyle(),
                      opacity: config.opacityPercent / 100,
                      transform: `scale(${config.scalePercent / 25})`,
                    }}
                  >
                    <img
                      src={config.logoUrl}
                      alt="Watermark"
                      className="w-8 h-8 rounded-full object-cover border-2 border-amber-400 shadow-lg"
                    />
                    {config.showBrandText && config.brandText && (
                      <span className="text-[10px] font-extrabold text-white bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/40 font-mono tracking-wider shadow">
                        {config.brandText}
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-2 left-2 bg-slate-950/90 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    {aspectRatio} Frame • Scale {config.scalePercent}%
                  </span>
                </div>

                <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 text-[11px] text-amber-200/90 leading-relaxed">
                  💡 <strong>Pro Tip:</strong> The watermark is embedded vector-smooth across all scenes during server & client-side MP4 rendering without degrading performance.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            {config.enabled ? `Watermark active at ${config.position}` : 'Brand Overlay is disabled.'}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-950 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Watermark Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
