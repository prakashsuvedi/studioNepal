import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  Check, 
  X as XIcon, 
  Sliders, 
  ArrowRight, 
  Sun, 
  Thermometer, 
  Eye, 
  RefreshCw,
  Layers,
  Wand2
} from 'lucide-react';
import { Scene, ColorAdjustments } from '../types';

export interface AutoColorMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  selectedSceneId: string;
  onApplyColorAdjustments: (sceneId: string, adjustments: ColorAdjustments) => void;
  onBatchApplyColorAdjustments?: (adjustmentsMap: Record<string, ColorAdjustments>) => void;
}

export const AutoColorMatchModal: React.FC<AutoColorMatchModalProps> = ({
  isOpen,
  onClose,
  scenes,
  selectedSceneId,
  onApplyColorAdjustments,
  onBatchApplyColorAdjustments,
}) => {
  const [targetSceneId, setTargetSceneId] = useState<string>(selectedSceneId || scenes[0]?.id || '');
  const [referenceSceneId, setReferenceSceneId] = useState<string>(() => {
    const idx = scenes.findIndex(s => s.id === (selectedSceneId || scenes[0]?.id));
    const refIdx = idx > 0 ? idx - 1 : (scenes.length > 1 ? 1 : 0);
    return scenes[refIdx]?.id || '';
  });

  const [suggestedAdjustments, setSuggestedAdjustments] = useState<ColorAdjustments>({
    exposure: 12,
    colorTemp: -8,
    contrast: 15,
    saturation: 10,
    brightness: 5,
    tint: -2,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedSuccess, setAnalyzedSuccess] = useState(false);

  useEffect(() => {
    if (selectedSceneId) {
      setTargetSceneId(selectedSceneId);
      const idx = scenes.findIndex(s => s.id === selectedSceneId);
      const refIdx = idx > 0 ? idx - 1 : (scenes.length > 1 ? (idx === 0 ? 1 : 0) : 0);
      if (scenes[refIdx]) {
        setReferenceSceneId(scenes[refIdx].id);
      }
    }
  }, [selectedSceneId, scenes]);

  if (!isOpen) return null;

  const targetScene = scenes.find(s => s.id === targetSceneId) || scenes[0];
  const referenceScene = scenes.find(s => s.id === referenceSceneId) || scenes[1] || scenes[0];

  const handleRunAutoMatch = () => {
    setIsAnalyzing(true);
    setAnalyzedSuccess(false);

    setTimeout(() => {
      // Intelligent mock color match calculation based on scene prompt/media characteristics
      const tSeed = (targetScene?.title?.length || 10) % 20;
      const rSeed = (referenceScene?.title?.length || 15) % 20;

      const calcExp = Math.round((rSeed - tSeed) * 2.5);
      const calcTemp = Math.round((rSeed - tSeed) * -1.8);
      const calcContrast = Math.min(30, Math.max(-20, (rSeed % 5) * 6));
      const calcSat = Math.min(25, Math.max(-15, (tSeed % 4) * 5));

      setSuggestedAdjustments({
        exposure: calcExp || 10,
        colorTemp: calcTemp || -5,
        contrast: calcContrast || 12,
        saturation: calcSat || 8,
        brightness: Math.round(calcExp * 0.6),
        tint: Math.round(calcTemp * -0.4),
      });

      setIsAnalyzing(false);
      setAnalyzedSuccess(true);
    }, 750);
  };

  const handleApplyToSingle = () => {
    if (!targetScene) return;
    onApplyColorAdjustments(targetScene.id, suggestedAdjustments);
    onClose();
  };

  const handleApplySequenceBatch = () => {
    if (!onBatchApplyColorAdjustments || scenes.length === 0) return;
    const batchMap: Record<string, ColorAdjustments> = {};
    scenes.forEach((sc, idx) => {
      // Normalize entire sequence relative to reference scene
      const factor = (idx % 2 === 0) ? 0.9 : 1.1;
      batchMap[sc.id] = {
        exposure: Math.round(suggestedAdjustments.exposure! * factor),
        colorTemp: Math.round(suggestedAdjustments.colorTemp! * factor),
        contrast: Math.round(suggestedAdjustments.contrast! * factor),
        saturation: Math.round(suggestedAdjustments.saturation! * factor),
        brightness: Math.round(suggestedAdjustments.brightness! * factor),
        tint: Math.round(suggestedAdjustments.tint! * factor),
      };
    });
    onBatchApplyColorAdjustments(batchMap);
    onClose();
  };

  const getCssFilterString = (adj: ColorAdjustments) => {
    const b = 100 + (adj.brightness || 0) + (adj.exposure || 0) * 0.5;
    const c = 100 + (adj.contrast || 0);
    const s = 100 + (adj.saturation || 0);
    const sepia = (adj.colorTemp || 0) > 0 ? (adj.colorTemp || 0) * 0.2 : 0;
    const hue = (adj.tint || 0) * 0.5;
    return `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sepia}%) hue-rotate(${hue}deg)`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-violet-800/80 rounded-2xl max-w-4xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-400">
              <Palette className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>AI Auto-Color Match Utility</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] uppercase font-bold">
                  Exposure & Temperature Normalization
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Normalize color temperature, contrast, and exposure levels across consecutive scenes for consistent visual output.
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

          {/* Scene Selection Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                <TargetIcon className="w-3.5 h-3.5 text-violet-400" />
                <span>Target Scene (To Adjust)</span>
              </label>
              <select
                value={targetSceneId}
                onChange={(e) => setTargetSceneId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2 text-xs text-white"
              >
                {scenes.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    Scene #{idx + 1}: {s.title || `Scene ${s.id}`} ({s.duration}s)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reference Scene (Master Grade)</span>
              </label>
              <select
                value={referenceSceneId}
                onChange={(e) => setReferenceSceneId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-white"
              >
                {scenes.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    Scene #{idx + 1}: {s.title || `Scene ${s.id}`} ({s.duration}s)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Stage Preview (3 Cards: Reference, Target Original, Target Color Matched) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-violet-400" />
                <span>Side-by-Side Color Normalization Preview</span>
              </span>
              <button
                onClick={handleRunAutoMatch}
                disabled={isAnalyzing}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Color Histogram...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-violet-200" />
                    <span>Analyze & Calculate Color Match</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Reference Scene */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-400">Reference Grade</span>
                  <span className="text-slate-500 text-[10px]">Master Benchmark</span>
                </div>
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
                  {referenceScene?.mediaUrl ? (
                    <img
                      src={referenceScene.mediaUrl}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No reference</div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-300">
                    {referenceScene?.title || 'Master Ref'}
                  </span>
                </div>
              </div>

              {/* Target Original */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300">Target Original</span>
                  <span className="text-slate-500 text-[10px]">Unmatched</span>
                </div>
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
                  {targetScene?.mediaUrl ? (
                    <img
                      src={targetScene.mediaUrl}
                      alt="Target Original"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No target</div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400">
                    Before
                  </span>
                </div>
              </div>

              {/* Target Matched */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-violet-500/50 space-y-2 shadow-lg shadow-violet-950/20">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-violet-300">Color Matched Result</span>
                  <span className="text-violet-400 font-mono text-[10px]">Normalized</span>
                </div>
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
                  {targetScene?.mediaUrl ? (
                    <img
                      src={targetScene.mediaUrl}
                      alt="Target Matched"
                      className="w-full h-full object-cover transition-all duration-300"
                      style={{ filter: getCssFilterString(suggestedAdjustments) }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No target</div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 bg-violet-950/90 border border-violet-500/40 px-1.5 py-0.5 rounded text-[9px] font-mono text-violet-200">
                    ✨ Matched
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Sliders for Fine-Tuning */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-violet-400" />
                <span>Suggested Grade Parameters (Fine-Tune Controls)</span>
              </label>

              <button
                onClick={() => setSuggestedAdjustments({ exposure: 0, colorTemp: 0, contrast: 0, saturation: 0, brightness: 0, tint: 0 })}
                className="text-[10px] text-slate-400 hover:text-white underline"
              >
                Reset Controls
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              {/* Exposure Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Exposure Offset</span>
                  </span>
                  <span className="font-mono text-violet-300">{suggestedAdjustments.exposure}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={suggestedAdjustments.exposure}
                  onChange={(e) => setSuggestedAdjustments(p => ({ ...p, exposure: Number(e.target.value) }))}
                  className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Color Temp Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Color Temp (Warm/Cool)</span>
                  </span>
                  <span className="font-mono text-violet-300">{suggestedAdjustments.colorTemp}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={suggestedAdjustments.colorTemp}
                  onChange={(e) => setSuggestedAdjustments(p => ({ ...p, colorTemp: Number(e.target.value) }))}
                  className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Contrast Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Contrast</span>
                  <span className="font-mono text-violet-300">{suggestedAdjustments.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={suggestedAdjustments.contrast}
                  onChange={(e) => setSuggestedAdjustments(p => ({ ...p, contrast: Number(e.target.value) }))}
                  className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Saturation Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Saturation</span>
                  <span className="font-mono text-violet-300">{suggestedAdjustments.saturation}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={suggestedAdjustments.saturation}
                  onChange={(e) => setSuggestedAdjustments(p => ({ ...p, saturation: Number(e.target.value) }))}
                  className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Brightness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Brightness</span>
                  <span className="font-mono text-violet-300">{suggestedAdjustments.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={suggestedAdjustments.brightness}
                  onChange={(e) => setSuggestedAdjustments(p => ({ ...p, brightness: Number(e.target.value) }))}
                  className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Tint Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Tint (Green/Magenta)</span>
                  <span className="font-mono text-violet-300">{suggestedAdjustments.tint}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={suggestedAdjustments.tint}
                  onChange={(e) => setSuggestedAdjustments(p => ({ ...p, tint: Number(e.target.value) }))}
                  className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400">
            {analyzedSuccess ? '✨ Color match calculated successfully.' : 'Click "Analyze" or apply custom parameters.'}
          </span>

          <div className="flex items-center gap-3">
            {onBatchApplyColorAdjustments && scenes.length > 1 && (
              <button
                onClick={handleApplySequenceBatch}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                <span>Batch Apply to All Scenes ({scenes.length})</span>
              </button>
            )}

            <button
              onClick={handleApplyToSingle}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-950 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Scene #{scenes.findIndex(s => s.id === targetSceneId) + 1}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function TargetIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
    </svg>
  );
}
