import React, { useState } from 'react';
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
  Copy
} from 'lucide-react';
import { Scene, AudioTrack, CameraMotion, TransitionType, ColorFilter, ColorAdjustments } from '../../types';

interface CapCutInspectorPanelProps {
  selectedScene: Scene | null;
  onUpdateScene: (updated: Partial<Scene>) => void;
  onDuplicateScene?: () => void;
  onDeleteScene?: () => void;
  bgmTrack?: AudioTrack;
  voTrack?: AudioTrack;
  bgmVolume: number;
  setBgmVolume: (vol: number) => void;
  voVolume: number;
  setVoVolume: (vol: number) => void;
}

type InspectorTab = 'basic' | 'speed' | 'animation' | 'color' | 'audio';

export const CapCutInspectorPanel: React.FC<CapCutInspectorPanelProps> = ({
  selectedScene,
  onUpdateScene,
  onDuplicateScene,
  onDeleteScene,
  bgmTrack,
  voTrack,
  bgmVolume,
  setBgmVolume,
  voVolume,
  setVoVolume,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('basic');

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
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="space-y-3.5">
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
