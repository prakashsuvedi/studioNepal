import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Volume2, 
  Palette, 
  Clock, 
  Type, 
  RotateCcw, 
  Zap, 
  Eye, 
  Scissors, 
  Layers,
  ChevronDown,
  Trash2,
  Copy,
  Radio,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Film,
  Video,
  Play,
  Upload,
  Link2
} from 'lucide-react';
import { Scene, AudioTrack, CameraMotion, TransitionType, ColorFilter, ColorAdjustments, TickerConfig } from '../../types';
import { extractVideoThumbnailAndDuration } from '../../lib/mediaLibrary';

interface CapCutInspectorPanelProps {
  selectedScene: Scene | null;
  onUpdateScene: (updated: Partial<Scene>) => void;
  onDuplicateScene?: () => void;
  onDeleteScene?: () => void;
  onApplyTickerToAll?: (config?: TickerConfig) => void;
  bgmTrack?: AudioTrack;
  voTrack?: AudioTrack;
  bgmVolume: number;
  setBgmVolume: (vol: number) => void;
  voVolume: number;
  setVoVolume: (vol: number) => void;
}

type InspectorTab = 'basic' | 'ticker' | 'speed' | 'animation' | 'color' | 'audio';

export const CapCutInspectorPanel: React.FC<CapCutInspectorPanelProps> = ({
  selectedScene,
  onUpdateScene,
  onDuplicateScene,
  onDeleteScene,
  onApplyTickerToAll,
  bgmTrack,
  voTrack,
  bgmVolume,
  setBgmVolume,
  voVolume,
  setVoVolume,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('basic');
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!selectedScene) {
    return (
      <div className="w-72 md:w-80 bg-[#0e111a] border-l border-slate-800/80 p-6 flex flex-col items-center justify-center text-center text-slate-500 select-none">
        <Sliders className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-semibold text-slate-400">No clip selected</p>
        <p className="text-[11px] text-slate-600 mt-0.5">Click any scene or audio clip in the timeline to edit properties.</p>
      </div>
    );
  }

  const handleColorChange = (key: keyof ColorAdjustments, value: number) => {
    const current = selectedScene.colorAdjustments || {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      colorTemp: 0,
      tint: 0
    };
    onUpdateScene({
      colorAdjustments: {
        ...current,
        [key]: value
      }
    });
  };

  const resetColorAdjustments = () => {
    onUpdateScene({
      colorAdjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        exposure: 0,
        colorTemp: 0,
        tint: 0
      },
      filter: 'none'
    });
  };

  const isTickerEnabled = Boolean(selectedScene.tickerConfig?.enabled);

  const toggleTicker = (enabled: boolean) => {
    if (!enabled) {
      onUpdateScene({
        tickerConfig: {
          ...(selectedScene.tickerConfig || {
            text: 'NEPALAI STUDIO PRO • REALTIME PRODUCTION ENGINE',
            textNepali: 'नेपालआई स्टुडियो प्रो',
            style: 'breaking_red',
            speed: 'medium',
            position: 'bottom',
            badgeText: 'LIVE',
          }),
          enabled: false,
        }
      });
    } else {
      onUpdateScene({
        tickerConfig: {
          enabled: true,
          text: selectedScene.tickerConfig?.text || 'NEPALAI STUDIO PRO • REALTIME PRODUCTION ENGINE',
          textNepali: selectedScene.tickerConfig?.textNepali || 'नेपालआई स्टुडियो प्रो',
          style: selectedScene.tickerConfig?.style || 'breaking_red',
          speed: selectedScene.tickerConfig?.speed || 'medium',
          position: selectedScene.tickerConfig?.position || 'bottom',
          badgeText: selectedScene.tickerConfig?.badgeText || 'LIVE',
        }
      });
    }
  };

  const removeTicker = () => {
    onUpdateScene({ tickerConfig: undefined });
  };

  return (
    <div className="w-72 md:w-80 bg-[#0e111a] border-l border-slate-800/80 flex flex-col h-full select-none shrink-0 overflow-hidden">
      {/* 1. Header & Tabs (CapCut Style) */}
      <div className="border-b border-slate-800/80 bg-[#090c14]">
        <div className="p-3 pb-1 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 truncate max-w-[170px]" title={selectedScene.title}>
            {selectedScene.title}
          </span>
          <div className="flex items-center gap-1">
            {onDuplicateScene && (
              <button
                onClick={onDuplicateScene}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Duplicate Clip (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteScene && (
              <button
                onClick={onDeleteScene}
                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Delete Clip (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center px-2 overflow-x-auto no-scrollbar gap-1 text-[11px] font-semibold">
          {[
            { id: 'basic', label: 'Basic' },
            { id: 'ticker', label: 'Ticker' },
            { id: 'speed', label: 'Speed' },
            { id: 'animation', label: 'Motion' },
            { id: 'color', label: 'Color' },
            { id: 'audio', label: 'Audio' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-2.5 border-b-2 transition cursor-pointer shrink-0 ${
                activeTab === tab.id 
                  ? 'border-cyan-400 text-cyan-400 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.id === 'ticker' && isTickerEnabled && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="space-y-3.5">
            {/* Media Source & Quick Replace */}
            <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  {selectedScene.mediaType === 'video' ? (
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  Media Source
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateScene({ mediaType: 'image' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      selectedScene.mediaType !== 'video'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => onUpdateScene({ mediaType: 'video' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      selectedScene.mediaType === 'video'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Video
                  </button>
                </div>
              </div>

              {/* Current Media Thumbnail & Preview */}
              <div className="flex items-center gap-2.5 bg-black/50 p-2 rounded-lg border border-slate-800">
                <div className="w-16 h-10 rounded bg-slate-900 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                  {selectedScene.mediaUrl ? (
                    selectedScene.mediaType === 'video' ? (
                      <video src={selectedScene.mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={selectedScene.mediaUrl} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )
                  ) : (
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-200 truncate">
                    {selectedScene.title || 'Selected Scene'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">
                    {selectedScene.mediaUrl ? selectedScene.mediaUrl.split('/').pop()?.slice(0, 24) : 'No media attached'}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Replace media with local file"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                  <input
                    ref={mediaFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const newUrl = URL.createObjectURL(file);
                      const isVid = file.type.startsWith('video/');
                      const title = file.name.replace(/\.[^/.]+$/, '');
                      if (isVid) {
                        onUpdateScene({
                          mediaUrl: newUrl,
                          mediaType: 'video',
                          title,
                        });
                        extractVideoThumbnailAndDuration(file).then(({ thumbnailUrl, duration }) => {
                          onUpdateScene({
                            thumbnailUrl: thumbnailUrl || undefined,
                            duration: Math.max(1, Math.round(duration))
                          });
                        });
                      } else {
                        onUpdateScene({
                          mediaUrl: newUrl,
                          mediaType: 'image',
                          thumbnailUrl: newUrl,
                          title,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              {/* URL input field */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block">Or Paste Media URL (Image/Video):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={selectedScene.mediaUrl || ''}
                    onChange={e => {
                      const val = e.target.value.trim();
                      const isVid = val.match(/\.(mp4|webm|mov|ogg)($|\?)/i) !== null;
                      onUpdateScene({ 
                        mediaUrl: val, 
                        mediaType: isVid ? 'video' : selectedScene.mediaType || 'image',
                        thumbnailUrl: isVid ? selectedScene.thumbnailUrl : val
                      });
                      if (isVid && (val.startsWith('http://') || val.startsWith('https://'))) {
                        extractVideoThumbnailAndDuration(val).then(({ thumbnailUrl, duration }) => {
                          if (thumbnailUrl) {
                            onUpdateScene({
                              thumbnailUrl,
                              duration: Math.max(1, Math.round(duration))
                            });
                          }
                        });
                      }
                    }}
                    placeholder="https://... image or mp4 url"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500/60 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Scene Title */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Clip Title</label>
              <input
                type="text"
                value={selectedScene.title}
                onChange={e => onUpdateScene({ title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Clip Duration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Clip Duration</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedScene.duration}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={selectedScene.duration}
                onChange={e => onUpdateScene({ duration: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Subtitle / Text Overlay */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="font-semibold text-slate-300 block">Text Overlay / Subtitle</label>
              <input
                type="text"
                value={selectedScene.textOverlay || ''}
                onChange={e => onUpdateScene({ textOverlay: e.target.value, textNepali: e.target.value })}
                placeholder="English / Devanagari text overlay..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Quick Ticker Switch & Remover inside Basic */}
            <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>News Ticker Banner</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleTicker(!isTickerEnabled)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                      isTickerEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isTickerEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                  {isTickerEnabled && (
                    <button
                      onClick={removeTicker}
                      className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                      title="Remove Ticker from Clip"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <p className="text-slate-500">
                  {isTickerEnabled ? 'Custom scrolling banner is active on this clip.' : 'No ticker is attached to this clip.'}
                </p>
                <button
                  onClick={() => setActiveTab('ticker')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer"
                >
                  Configure Ticker →
                </button>
              </div>
            </div>

            {/* Typography Font */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Font Family</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'sans', label: 'Sans Bold' },
                  { id: 'serif', label: 'Serif Classic' },
                  { id: 'neon', label: 'Neon Glow' }
                ].map(font => (
                  <button
                    key={font.id}
                    onClick={() => onUpdateScene({ textFont: font.id as any })}
                    className={`py-1 rounded-lg border text-center font-medium transition cursor-pointer text-[10px] ${
                      (selectedScene.textFont || 'sans') === font.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Text Position</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'top', label: 'Top Header' },
                  { id: 'center', label: 'Center' },
                  { id: 'lower_third', label: 'Lower Third' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    onClick={() => onUpdateScene({ textPosition: pos.id as any })}
                    className={`py-1.5 rounded-lg border text-center font-medium transition cursor-pointer text-[10px] ${
                      (selectedScene.textPosition || 'lower_third') === pos.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Text Color</label>
              <div className="flex items-center gap-2">
                {[
                  { color: '#ffffff', name: 'White' },
                  { color: '#facc15', name: 'Gold' },
                  { color: '#22d3ee', name: 'Cyan' },
                  { color: '#f43f5e', name: 'Rose' },
                  { color: '#a855f7', name: 'Purple' },
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => onUpdateScene({ textColor: c.color })}
                    style={{ backgroundColor: c.color }}
                    className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                      (selectedScene.textColor || '#ffffff') === c.color ? 'border-cyan-400 scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TICKER TAB */}
        {activeTab === 'ticker' && (
          <div className="space-y-4">
            {/* Ticker Master Toggle & Remove */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-200">Scrolling News Ticker</h4>
                  <p className="text-[10px] text-slate-400">TV-style lower third ticker strip</p>
                </div>
                <button
                  onClick={() => toggleTicker(!isTickerEnabled)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    isTickerEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {isTickerEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {isTickerEnabled && (
                <div className="flex gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={removeTicker}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50 transition font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove Ticker from Clip
                  </button>
                </div>
              )}
            </div>

            {isTickerEnabled ? (
              <div className="space-y-3">
                {/* Ticker Preset Styles */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Theme Style</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'breaking_red', label: '🔴 Breaking Red' },
                      { id: 'nepal_heritage', label: '🔵 Heritage Blue' },
                      { id: 'gold_luxury', label: '🟡 Luxury Gold' },
                      { id: 'neon_cyber', label: '🟢 Cyber Neon' },
                      { id: 'glass_modern', label: '⚫ Dark Glass' },
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => onUpdateScene({
                          tickerConfig: {
                            ...(selectedScene.tickerConfig || {
                              enabled: true,
                              text: '',
                              speed: 'medium',
                              position: 'bottom',
                            }),
                            style: st.id as any,
                          }
                        })}
                        className={`p-2 rounded-lg border text-left font-medium transition cursor-pointer text-[10px] ${
                          (selectedScene.tickerConfig?.style || 'breaking_red') === st.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge Text */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Badge Tag (Left)</label>
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    {['BREAKING', 'LIVE', 'UPDATE', 'EXCLUSIVE'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => onUpdateScene({
                          tickerConfig: {
                            ...(selectedScene.tickerConfig || {
                              enabled: true,
                              text: '',
                              style: 'breaking_red',
                              speed: 'medium',
                              position: 'bottom',
                            }),
                            badgeText: tag,
                          }
                        })}
                        className={`py-1 rounded bg-slate-900 text-[10px] font-bold border transition ${
                          selectedScene.tickerConfig?.badgeText === tag ? 'border-rose-500 text-rose-400' : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={selectedScene.tickerConfig?.badgeText || ''}
                    onChange={e => onUpdateScene({
                      tickerConfig: {
                        ...(selectedScene.tickerConfig || {
                          enabled: true,
                          text: '',
                          style: 'breaking_red',
                          speed: 'medium',
                          position: 'bottom',
                        }),
                        badgeText: e.target.value,
                      }
                    })}
                    placeholder="Custom badge e.g. BREAKING"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                {/* Main Headline Text */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Main English Text</label>
                  <input
                    type="text"
                    value={selectedScene.tickerConfig?.text || ''}
                    onChange={e => onUpdateScene({
                      tickerConfig: {
                        ...(selectedScene.tickerConfig || {
                          enabled: true,
                          style: 'breaking_red',
                          speed: 'medium',
                          position: 'bottom',
                        }),
                        text: e.target.value,
                      }
                    })}
                    placeholder="E.g. KATHMANDU SUMMIT: NEW AI ACCELERATOR ANNOUNCED"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                {/* Nepali Ticker Text */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Nepali Ticker Text (Devanagari)</label>
                  <input
                    type="text"
                    value={selectedScene.tickerConfig?.textNepali || ''}
                    onChange={e => onUpdateScene({
                      tickerConfig: {
                        ...(selectedScene.tickerConfig || {
                          enabled: true,
                          style: 'breaking_red',
                          speed: 'medium',
                          position: 'bottom',
                        }),
                        textNepali: e.target.value,
                      }
                    })}
                    placeholder="ताजा समाचार: नेपालमा नयाँ प्रविधि विकास..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60 font-sans"
                  />
                </div>

                {/* Speed & Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block text-[11px]">Scroll Speed</label>
                    <select
                      value={selectedScene.tickerConfig?.speed || 'medium'}
                      onChange={e => onUpdateScene({
                        tickerConfig: {
                          ...(selectedScene.tickerConfig || {
                            enabled: true,
                            text: '',
                            style: 'breaking_red',
                            position: 'bottom',
                          }),
                          speed: e.target.value as any,
                        }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                    >
                      <option value="slow">Slow (Smooth)</option>
                      <option value="medium">Medium</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block text-[11px]">Position</label>
                    <select
                      value={selectedScene.tickerConfig?.position || 'bottom'}
                      onChange={e => onUpdateScene({
                        tickerConfig: {
                          ...(selectedScene.tickerConfig || {
                            enabled: true,
                            text: '',
                            style: 'breaking_red',
                            speed: 'medium',
                          }),
                          position: e.target.value as any,
                        }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                    >
                      <option value="bottom">Bottom Lower-Third</option>
                      <option value="top">Top Header Banner</option>
                    </select>
                  </div>
                </div>

                {/* Batch Actions */}
                {onApplyTickerToAll && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <button
                      onClick={() => onApplyTickerToAll(selectedScene.tickerConfig)}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition text-[11px]"
                    >
                      Apply This Ticker to All Scenes
                    </button>
                    <button
                      onClick={() => onApplyTickerToAll(undefined)}
                      className="w-full py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 font-semibold transition text-[11px]"
                    >
                      Remove Ticker from All Scenes
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
                <Radio className="w-8 h-8 opacity-40 mx-auto text-slate-400" />
                <p className="text-slate-300 font-medium">No Ticker on this Clip</p>
                <p className="text-[11px] text-slate-500">Enable ticker to add a customized animated breaking news or lower-third banner.</p>
                <button
                  onClick={() => toggleTicker(true)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition text-xs cursor-pointer inline-block"
                >
                  + Add Ticker Banner
                </button>
              </div>
            )}
          </div>
        )}

        {/* SPEED TAB */}
        {activeTab === 'speed' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Playback Speed</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => {
                      const newDuration = Math.max(1, Math.round((selectedScene.duration / speed) * 10) / 10);
                      onUpdateScene({ duration: newDuration });
                    }}
                    className="py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-center font-mono font-bold transition"
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANIMATION & MOTION TAB */}
        {activeTab === 'animation' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Camera Motion</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'Static (None)' },
                  { id: 'zoom_in', label: 'Slow Zoom In' },
                  { id: 'zoom_out', label: 'Slow Zoom Out' },
                  { id: 'pan_right', label: 'Pan Right' },
                  { id: 'pan_left', label: 'Pan Left' },
                  { id: 'dolly', label: 'Dolly & Float' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => onUpdateScene({ motion: m.id as CameraMotion })}
                    className={`p-2 rounded-lg border text-left font-medium transition cursor-pointer text-[11px] ${
                      selectedScene.motion === m.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Next Transition */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="font-semibold text-slate-300 block">Transition to Next Scene</label>
              <select
                value={selectedScene.transition || 'dissolve'}
                onChange={e => onUpdateScene({ transition: e.target.value as TransitionType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/60 cursor-pointer"
              >
                <option value="cut">Hard Cut</option>
                <option value="dissolve">Cross Dissolve</option>
                <option value="fade_to_black">Fade to Black</option>
                <option value="wipe_right">Wipe Right</option>
                <option value="zoom_in">Zoom In</option>
                <option value="slide_left">Slide Left</option>
              </select>
            </div>
          </div>
        )}

        {/* COLOR & FILTERS TAB */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            {/* Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Color Presets</label>
                <button
                  onClick={resetColorAdjustments}
                  className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'none', label: 'Original' },
                  { id: 'cinematic', label: 'Cinematic' },
                  { id: 'warm', label: 'Warm' },
                  { id: 'cool', label: 'Cool Blue' },
                  { id: 'vibrant', label: 'Vibrant' },
                  { id: 'bw', label: 'B & W' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateScene({ filter: f.id as ColorFilter })}
                    className={`py-1.5 rounded-lg border text-center font-medium transition cursor-pointer text-[10px] ${
                      selectedScene.filter === f.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              {[
                { key: 'brightness', label: 'Brightness', min: -50, max: 50 },
                { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                { key: 'saturation', label: 'Saturation', min: -50, max: 50 },
                { key: 'exposure', label: 'Exposure', min: -50, max: 50 },
                { key: 'colorTemp', label: 'Color Temp', min: -50, max: 50 },
              ].map(slider => {
                const val = (selectedScene.colorAdjustments as any)?.[slider.key] || 0;
                return (
                  <div key={slider.key} className="space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{slider.label}</span>
                      <span className="font-mono text-cyan-400">{val > 0 ? `+${val}` : val}</span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={val}
                      onChange={e => handleColorChange(slider.key as any, Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AUDIO TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            {/* BGM Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">BGM Soundtrack Vol</span>
                <span className="font-mono text-purple-400 font-bold">{bgmVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={bgmVolume}
                onChange={e => setBgmVolume(Number(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Voiceover Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Voiceover / Speech Vol</span>
                <span className="font-mono text-emerald-400 font-bold">{voVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voVolume}
                onChange={e => setVoVolume(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Auto-Ducking Active</span>
              </div>
              <p className="text-slate-400">Background music automatically dips by 40% when speech or voiceover occurs.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
