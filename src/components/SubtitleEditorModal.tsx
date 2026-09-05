import React, { useState } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Trash2, 
  Download, 
  Check, 
  X as XIcon, 
  Languages, 
  Clock, 
  FileText, 
  Type, 
  Copy, 
  Sliders, 
  Eye,
  ArrowRight
} from 'lucide-react';
import { Scene } from '../types';

export interface SubtitleItem {
  id: string;
  index: number;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
  devanagariText: string;
}

export interface SubtitleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  subtitles: SubtitleItem[];
  onSaveSubtitles: (subtitles: SubtitleItem[], burnInOptions: SubtitleBurnOptions) => void;
}

export interface SubtitleBurnOptions {
  burnIn: boolean;
  fontSize: 'small' | 'medium' | 'large';
  textColor: string;
  backgroundColor: string;
  position: 'bottom' | 'center' | 'top';
  bilingualDevanagari: boolean;
}

function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (num: number, size: number = 2) => String(num).padStart(size, '0');
  const padMs = (num: number) => String(num).padStart(3, '0');

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${padMs(millis)}`;
}

export const SubtitleEditorModal: React.FC<SubtitleEditorModalProps> = ({
  isOpen,
  onClose,
  scenes,
  subtitles: initialSubtitles,
  onSaveSubtitles,
}) => {
  const [subtitleList, setSubtitleList] = useState<SubtitleItem[]>(() => {
    if (initialSubtitles && initialSubtitles.length > 0) return initialSubtitles;
    
    // Auto-generate from scenes if empty
    let currentTime = 0;
    return scenes.map((sc, idx) => {
      const start = currentTime;
      const end = currentTime + sc.duration;
      currentTime = end;

      return {
        id: `sub_${sc.id}_${idx}`,
        index: idx + 1,
        startTimeSec: start,
        endTimeSec: Math.max(start + 1, end - 0.2),
        text: sc.scriptText || sc.narrationVoice || sc.title || `Scene #${idx + 1} Caption`,
        devanagariText: sc.devanagariSubtitle || `दृश्य #${idx + 1} नेपालएआई विवरण`,
      };
    });
  });

  const [burnOptions, setBurnOptions] = useState<SubtitleBurnOptions>({
    burnIn: true,
    fontSize: 'medium',
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    position: 'bottom',
    bilingualDevanagari: true,
  });

  const [copiedSrt, setCopiedSrt] = useState(false);

  if (!isOpen) return null;

  const handleAutoGenerateFromScenes = () => {
    let currentTime = 0;
    const generated = scenes.map((sc, idx) => {
      const start = currentTime;
      const end = currentTime + sc.duration;
      currentTime = end;

      return {
        id: `sub_${sc.id}_${Date.now()}_${idx}`,
        index: idx + 1,
        startTimeSec: start,
        endTimeSec: Math.max(start + 1, end - 0.2),
        text: sc.scriptText || sc.narrationVoice || sc.title || `Scene #${idx + 1} Caption`,
        devanagariText: sc.devanagariSubtitle || `दृश्य #${idx + 1} नेपालएआई क्याप्सन`,
      };
    });
    setSubtitleList(generated);
  };

  const handleAddSubtitleItem = () => {
    const last = subtitleList[subtitleList.length - 1];
    const newStart = last ? last.endTimeSec + 0.2 : 0;
    const newItem: SubtitleItem = {
      id: `sub_custom_${Date.now()}`,
      index: subtitleList.length + 1,
      startTimeSec: newStart,
      endTimeSec: newStart + 3,
      text: 'New subtitle transcription segment',
      devanagariText: 'नयाँ क्याप्सन खण्ड',
    };
    setSubtitleList(prev => [...prev, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setSubtitleList(prev => prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, index: idx + 1 })));
  };

  const handleUpdateItem = (id: string, fields: Partial<SubtitleItem>) => {
    setSubtitleList(prev => prev.map(item => item.id === id ? { ...item, ...fields } : item));
  };

  const handleShiftTimestamps = (deltaSec: number) => {
    setSubtitleList(prev => prev.map(item => ({
      ...item,
      startTimeSec: Math.max(0, Number((item.startTimeSec + deltaSec).toFixed(2))),
      endTimeSec: Math.max(0.5, Number((item.endTimeSec + deltaSec).toFixed(2))),
    })));
  };

  const generateSrtContent = (): string => {
    return subtitleList.map(item => {
      const startStr = formatSrtTimestamp(item.startTimeSec);
      const endStr = formatSrtTimestamp(item.endTimeSec);
      const body = burnOptions.bilingualDevanagari && item.devanagariText
        ? `${item.devanagariText}\n${item.text}`
        : item.text;
      return `${item.index}\n${startStr} --> ${endStr}\n${body}\n`;
    }).join('\n');
  };

  const handleDownloadSrt = () => {
    const content = generateSrtContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nepalai_subtitles.srt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySrt = () => {
    navigator.clipboard.writeText(generateSrtContent());
    setCopiedSrt(true);
    setTimeout(() => setCopiedSrt(false), 2000);
  };

  const handleSaveAndApply = () => {
    onSaveSubtitles(subtitleList, burnOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-800/80 rounded-2xl max-w-4xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>Auto-Subtitles & Visual .SRT Transcription Studio</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold">
                  Bilingual Devanagari
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Refine timing and translations, export .SRT files, or burn subtitles directly onto output video.
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

          {/* Quick Toolbar & Generator Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoGenerateFromScenes}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Sync From Voice Tracks</span>
              </button>

              <button
                onClick={handleAddSubtitleItem}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subtitle Block</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Shift All Timestamps:</span>
              <button
                onClick={() => handleShiftTimestamps(-0.5)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                -0.5s
              </button>
              <button
                onClick={() => handleShiftTimestamps(0.5)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                +0.5s
              </button>
            </div>
          </div>

          {/* Subtitle Items Line-by-line Table Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
              <span>Transcription Subtitle Blocks ({subtitleList.length})</span>
              <span>Devanagari + English Captions</span>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {subtitleList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 space-y-2 transition"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-bold">
                        #{item.index}
                      </span>

                      {/* Timestamp inputs */}
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={item.startTimeSec}
                          onChange={(e) => handleUpdateItem(item.id, { startTimeSec: Number(e.target.value) })}
                          className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-500">➜</span>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={item.endTimeSec}
                          onChange={(e) => handleUpdateItem(item.id, { endTimeSec: Number(e.target.value) })}
                          className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-500 text-[10px]">
                          ({(item.endTimeSec - item.startTimeSec).toFixed(1)}s)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 transition"
                      title="Delete Subtitle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtitle text input row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">English Caption</label>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-emerald-400 font-semibold mb-0.5 block">Devanagari Subtitle (नेपाली)</label>
                      <input
                        type="text"
                        value={item.devanagariText}
                        onChange={(e) => handleUpdateItem(item.id, { devanagariText: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-emerald-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-sans"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {subtitleList.length === 0 && (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                  No subtitle blocks present. Click "Auto-Sync From Voice Tracks" or "Add Subtitle Block".
                </div>
              )}
            </div>
          </div>

          {/* Burn-in Overlay Style Customization */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-400" />
                <span>Burn-in Subtitles On Final Video Output</span>
              </label>

              <input
                type="checkbox"
                checked={burnOptions.burnIn}
                onChange={(e) => setBurnOptions(prev => ({ ...prev, burnIn: e.target.checked }))}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {burnOptions.burnIn && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1 border-t border-slate-900">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Font Size</label>
                  <select
                    value={burnOptions.fontSize}
                    onChange={(e) => setBurnOptions(prev => ({ ...prev, fontSize: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="small">Small (18px)</option>
                    <option value="medium">Medium (24px Standard)</option>
                    <option value="large">Large (32px Bold Shorts)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Screen Position</label>
                  <select
                    value={burnOptions.position}
                    onChange={(e) => setBurnOptions(prev => ({ ...prev, position: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="bottom">Bottom Overlay (Standard)</option>
                    <option value="center">Center Highlight</option>
                    <option value="top">Top Header Overlay</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Bilingual Display</label>
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs text-white cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={burnOptions.bilingualDevanagari}
                      onChange={(e) => setBurnOptions(prev => ({ ...prev, bilingualDevanagari: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span>Include Devanagari (नेपाली)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSrt}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download .SRT File</span>
            </button>

            <button
              onClick={handleCopySrt}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedSrt ? 'Copied .SRT!' : 'Copy .SRT Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Subtitles</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
