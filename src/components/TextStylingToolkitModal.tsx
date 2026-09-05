import React, { useState } from 'react';
import { 
  Type, 
  Sparkles, 
  Layers, 
  Palette, 
  Sliders, 
  X, 
  Check, 
  Zap, 
  Radio, 
  Layout, 
  Eye,
  Film
} from 'lucide-react';
import { Scene, TextStylePreset, TextAnimationOption, TickerConfig, KineticTypographyConfig } from '../types';

interface TextStylingToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScene: Scene | null;
  onApplyTextToolkit: (
    sceneId: string,
    updates: {
      textStyle?: TextStylePreset;
      textAnimation?: TextAnimationOption;
      kineticConfig?: KineticTypographyConfig;
      tickerConfig?: TickerConfig;
      textOverlay?: string;
      textNepali?: string;
      textColor?: string;
    }
  ) => void;
}

export const TextStylingToolkitModal: React.FC<TextStylingToolkitModalProps> = ({
  isOpen,
  onClose,
  selectedScene,
  onApplyTextToolkit
}) => {
  if (!isOpen || !selectedScene) return null;

  const [activeTab, setActiveTab] = useState<'kinetic' | 'ticker' | 'presets'>('kinetic');

  // Text inputs
  const [textOverlay, setTextOverlay] = useState(selectedScene.textOverlay || 'KINETIC MOTION ENGINE');
  const [textNepali, setTextNepali] = useState(selectedScene.textNepali || 'नेपालआई स्टुडियो');
  const [textColor, setTextColor] = useState(selectedScene.textColor || '#ffffff');

  // Kinetic Typography State
  const [kineticPreset, setKineticPreset] = useState<KineticTypographyConfig['preset']>(
    selectedScene.kineticConfig?.preset || 'kinetic_bounce'
  );
  const [fontSize, setFontSize] = useState<number>(selectedScene.kineticConfig?.fontSize || 38);
  const [glowColor, setGlowColor] = useState<string>(selectedScene.kineticConfig?.glowColor || '#06b6d4');
  const [strokeColor, setStrokeColor] = useState<string>(selectedScene.kineticConfig?.strokeColor || '#38bdf8');
  const [layersCount, setLayersCount] = useState<number>(selectedScene.kineticConfig?.layersCount || 3);
  const [animationSpeed, setAnimationSpeed] = useState<number>(selectedScene.kineticConfig?.animationSpeed || 1.0);

  // Lower Third Ticker Generator State
  const [tickerEnabled, setTickerEnabled] = useState<boolean>(selectedScene.tickerConfig?.enabled ?? true);
  const [tickerText, setTickerText] = useState<string>(
    selectedScene.tickerConfig?.text || 'LIVE BROADCAST • NEPALAI VIDEO STUDIO • KATHMANDU HD'
  );
  const [tickerTextNepali, setTickerTextNepali] = useState<string>(
    selectedScene.tickerConfig?.textNepali || 'अत्याधुनिक डिजिटल समाचार एवं भिडियो उत्पादन'
  );
  const [tickerBadge, setTickerBadge] = useState<string>(selectedScene.tickerConfig?.badgeText || 'BREAKING NEWS');
  const [tickerStyle, setTickerStyle] = useState<NonNullable<TickerConfig['style']>>(
    selectedScene.tickerConfig?.style || 'breaking_red'
  );
  const [tickerSpeed, setTickerSpeed] = useState<NonNullable<TickerConfig['speed']>>(
    selectedScene.tickerConfig?.speed || 'medium'
  );
  const [tickerPosition, setTickerPosition] = useState<NonNullable<TickerConfig['position']>>(
    selectedScene.tickerConfig?.position || 'bottom'
  );

  // Text Style Preset State
  const [textStyle, setTextStyle] = useState<TextStylePreset>(selectedScene.textStyle || 'lower_third');

  const handleApply = () => {
    onApplyTextToolkit(selectedScene.id, {
      textOverlay,
      textNepali,
      textColor,
      textStyle,
      textAnimation: kineticPreset as TextAnimationOption,
      kineticConfig: {
        preset: kineticPreset,
        primaryText: textOverlay,
        secondaryTextNepali: textNepali,
        fontSize,
        glowColor,
        strokeColor,
        layersCount,
        animationSpeed,
      },
      tickerConfig: {
        enabled: tickerEnabled,
        text: tickerText,
        textNepali: tickerTextNepali,
        badgeText: tickerBadge,
        style: tickerStyle,
        speed: tickerSpeed,
        position: tickerPosition,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Text Styling & Lower-Third Toolkit</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                  {selectedScene.title}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Kinetic typography presets, multi-layer effects, and live ticker generator.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('kinetic')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'kinetic'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kinetic Typography</span>
          </button>

          <button
            onClick={() => setActiveTab('ticker')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'ticker'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>Lower-Third Ticker</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'presets'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-teal-400" />
            <span>Style Presets</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Common Text Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-slate-400 text-[11px] font-semibold block mb-1">Main Overlay Text (English)</label>
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="e.g. KINETIC MOTION ENGINE"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] font-semibold block mb-1">Secondary Subtitle (Nepali / Mukta)</label>
              <input
                type="text"
                value={textNepali}
                onChange={(e) => setTextNepali(e.target.value)}
                placeholder="e.g. नेपालआई स्टुडियो"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-['Mukta'] text-xs font-semibold focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* TAB 1: KINETIC TYPOGRAPHY */}
          {activeTab === 'kinetic' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Kinetic Typography Motion Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'kinetic_bounce', name: 'Bounce Wave', desc: 'Springy elastic entry with layered drop shadow' },
                    { id: 'kinetic_3d_zoom', name: '3D Zoom Reveal', desc: 'Per-letter depth zoom with metallic glow' },
                    { id: 'kinetic_glitch_split', name: 'Glitch Split', desc: 'RGB chromatic aberration distortion' },
                    { id: 'kinetic_stagger_slide', name: 'Slide Stagger', desc: 'Sequential word cascade with acceleration' },
                    { id: 'kinetic_neon_pulse', name: 'Neon Pulsar', desc: 'Cyan/Magenta glowing stroke pulse' },
                    { id: 'kinetic_typewriter', name: 'Typewriter Cursor', desc: 'Frame-exact terminal character reveal' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setKineticPreset(preset.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        kineticPreset === preset.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-indigo-300">{preset.name}</span>
                          {kineticPreset === preset.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{preset.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kinetic Fine-Tuning Sliders */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Kinetic Animation Fine-Tuning
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Font Size</span>
                      <span className="font-mono text-indigo-300">{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={72}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Animation Speed</span>
                      <span className="font-mono text-indigo-300">{animationSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Glow Color</span>
                      <span className="font-mono text-indigo-300">{glowColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={glowColor}
                        onChange={(e) => setGlowColor(e.target.value)}
                        className="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={glowColor}
                        onChange={(e) => setGlowColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Multi-Layer Depth</span>
                      <span className="font-mono text-indigo-300">{layersCount} layers</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={layersCount}
                      onChange={(e) => setLayersCount(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOWER-THIRD TICKER GENERATOR */}
          {activeTab === 'ticker' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="font-bold text-white text-xs">Enable Lower-Third Ticker</span>
                    <p className="text-[11px] text-slate-400">Display continuous scrolling marquee banner across the video.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tickerEnabled}
                  onChange={(e) => setTickerEnabled(e.target.checked)}
                  className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              {tickerEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-[11px] font-semibold block mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={tickerBadge}
                        onChange={(e) => setTickerBadge(e.target.value)}
                        placeholder="e.g. BREAKING NEWS"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-bold uppercase focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] font-semibold block mb-1">Ticker Style</label>
                      <select
                        value={tickerStyle}
                        onChange={(e) => setTickerStyle(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="breaking_red">🚨 Breaking Red Broadcast</option>
                        <option value="gold_luxury">👑 Gold Luxury Gradient</option>
                        <option value="neon_cyber">⚡ Neon Cyber Dark</option>
                        <option value="nepal_heritage">🇳🇵 Nepal Heritage Blue</option>
                        <option value="glass_modern">💎 Glassmorphism Translucent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] font-semibold block mb-1">Scrolling Marquee Text (English)</label>
                    <textarea
                      value={tickerText}
                      onChange={(e) => setTickerText(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] font-semibold block mb-1">Scrolling Marquee Text (Nepali)</label>
                    <textarea
                      value={tickerTextNepali}
                      onChange={(e) => setTickerTextNepali(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-300 font-['Mukta'] text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-[11px] font-semibold block mb-1">Scroll Speed</label>
                      <select
                        value={tickerSpeed}
                        onChange={(e) => setTickerSpeed(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="slow">Slow Pace (45 px/s)</option>
                        <option value="medium">Medium Standard (80 px/s)</option>
                        <option value="fast">Fast Express (120 px/s)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] font-semibold block mb-1">Position</label>
                      <select
                        value={tickerPosition}
                        onChange={(e) => setTickerPosition(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="bottom">Bottom Lower-Third</option>
                        <option value="top">Top Header Banner</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STYLE PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Pre-configured Subtitle & Badge Styles
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'lower_third', name: 'Lower Third Dark Box', bg: 'bg-black/80 border-slate-700 text-white' },
                  { id: 'neon_glow', name: 'Neon Cyber Glow', bg: 'bg-slate-950 border-cyan-500 text-cyan-300 shadow-cyan-500/20 shadow-lg' },
                  { id: 'gold_gradient', name: 'Gold Luxury Bar', bg: 'bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 border-amber-400 text-amber-200' },
                  { id: 'devanagari_bold', name: 'Devanagari Headline', bg: 'bg-slate-900 border-indigo-500 text-amber-300' },
                  { id: 'impact_caption', name: 'Impact Subtitle', bg: 'bg-black border-white text-yellow-400 font-extrabold' },
                  { id: 'glass_pill', name: 'Glassmorphism Capsule', bg: 'bg-white/10 backdrop-blur-md border-white/20 text-white' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setTextStyle(style.id as any)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-2 ${style.bg} ${
                      textStyle === style.id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''
                    }`}
                  >
                    <span className="font-bold text-xs">{style.name}</span>
                    <span className="text-[10px] opacity-70">Sample Caption Text</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
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
            <span>Apply Text Styling to Scene</span>
          </button>
        </div>
      </div>
    </div>
  );
};
