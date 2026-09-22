import React, { useState } from 'react';
import {
  GitCommit,
  Lock,
  Sparkles,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
  Film,
  Zap,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Camera,
  Sun,
  Box,
  Copy,
  Check
} from 'lucide-react';
import {
  DynamicCharacterIdentity,
  SequentialSceneNode,
  Gpt4oSceneContextAnalysis,
  analyzeSceneContextWithGpt4o
} from '../services/characterContinuityEngine';

interface NarrativeFlowManagerProps {
  currentPrompt: string;
  projectScenes: SequentialSceneNode[];
  projectRegistry: DynamicCharacterIdentity[];
  activeCharacterId?: string;
  onApplyPromptToScene: (sceneIndex: number, promptText: string, title?: string, duration?: '4' | '8' | '12') => void;
  onSelectScene?: (index: number) => void;
  selectedSceneIndex: number;
}

export const NarrativeFlowManager: React.FC<NarrativeFlowManagerProps> = ({
  currentPrompt,
  projectScenes,
  projectRegistry,
  activeCharacterId,
  onApplyPromptToScene,
  onSelectScene,
  selectedSceneIndex
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<Gpt4oSceneContextAnalysis | null>(null);
  const [sequentialDependencyEnforced, setSequentialDependencyEnforced] = useState<boolean>(true);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const scene1 = projectScenes[0] || null;
  const currentScene = projectScenes[selectedSceneIndex] || projectScenes[0];
  const isScene2OrHigher = selectedSceneIndex >= 1;

  // Primary locked character from Scene 1
  const primaryLockedChar = projectRegistry.find(c => c.id === activeCharacterId) || projectRegistry[0] || null;

  // Handle trigger GPT-4o Prompt Context Analysis
  const handleTriggerGpt4oAnalysis = async (targetIndex = selectedSceneIndex) => {
    setIsAnalyzing(true);
    try {
      const prevScenes = projectScenes.slice(0, targetIndex).map(s => ({
        sceneIndex: s.sceneIndex,
        title: s.title,
        prompt: s.userPrompt,
        exitLatentContext: s.exitLatentContext
      }));

      const res = await analyzeSceneContextWithGpt4o({
        currentScenePrompt: currentPrompt || currentScene?.userPrompt || '',
        sceneIndex: targetIndex + 1,
        previousScenes: prevScenes.length > 0 ? prevScenes : [
          {
            sceneIndex: 1,
            title: scene1?.title || 'Scene 1: Master Hero Establishing Shot',
            prompt: scene1?.userPrompt || currentPrompt,
            exitLatentContext: scene1?.exitLatentContext
          }
        ],
        lockedCharacters: projectRegistry,
        targetBeatType: targetIndex === 1 ? 'continuation' : 'escalation'
      });

      setAnalysisResult(res);
    } catch (err) {
      console.error('Narrative flow analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToCurrentScene = () => {
    if (!analysisResult) return;
    onApplyPromptToScene(
      selectedSceneIndex,
      analysisResult.continuityAwarePrompt,
      analysisResult.suggestedTitle,
      analysisResult.suggestedDuration
    );
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div id="narrative-flow-manager" className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 shadow-xl backdrop-blur-md transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Narrative Flow Manager</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                GPT-4o Context Analyzer
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Enforces sequential dependency so Scene 2+ locks visual parameters from Scene 1 without random drift
            </p>
          </div>
        </div>

        {/* Sequential Dependency Status Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSequentialDependencyEnforced(!sequentialDependencyEnforced)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              sequentialDependencyEnforced
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="When active, all character descriptors and environmental anchors from Scene 1 are enforced in subsequent scenes"
          >
            <Lock className={`w-3.5 h-3.5 ${sequentialDependencyEnforced ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Sequential Dependency: {sequentialDependencyEnforced ? 'Enforced' : 'Loose'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerGpt4oAnalysis(selectedSceneIndex)}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Context...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Analyze with GPT-4o</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sequential Dependency Chain Pipeline */}
      <div className="mt-3.5 pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-indigo-400" />
            Active Scene Chain &amp; Dependency Links
          </span>
          <span className="text-[10px] text-slate-400">
            Click any scene to inspect continuity locks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {projectScenes.slice(0, 6).map((scene, idx) => {
            const isSelected = selectedSceneIndex === idx;
            const isScene1Master = idx === 0;
            const hasVideo = !!scene.videoUrl;

            return (
              <button
                key={scene.id || idx}
                type="button"
                onClick={() => onSelectScene && onSelectScene(idx)}
                className={`relative p-2.5 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-400 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/50'
                    : isScene1Master
                    ? 'bg-slate-800/80 border-amber-500/40 hover:border-amber-400/70'
                    : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* Scene Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isScene1Master
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isSelected
                      ? 'bg-indigo-500/30 text-indigo-200'
                      : 'bg-slate-700/60 text-slate-300'
                  }`}>
                    Scene {idx + 1}
                  </span>
                  
                  {isScene1Master ? (
                    <span className="text-[9px] text-amber-300 font-semibold flex items-center gap-0.5" title="Master Context Source for the entire story">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Master
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5" title="Locked to Scene 1 Visual DNA">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-medium text-slate-200 truncate mb-1">
                  {scene.title || `Scene ${idx + 1}`}
                </div>

                <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {scene.userPrompt || 'Pending prompt derivation...'}
                </div>

                {hasVideo && (
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Rendered
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Locked Parameters from Scene 1 & GPT-4o Insights Box */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left: Locked Visual Descriptors from Scene 1 */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scene 1 Locked Descriptors</span>
            </div>
            <span className="text-[10px] text-emerald-400/90 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Active in Scene {selectedSceneIndex + 1}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-start gap-1.5 text-slate-300">
              <User className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Character Identity: </span>
                <span className="text-slate-200 font-semibold">{primaryLockedChar?.name || 'Main Protagonist'}</span>
                {primaryLockedChar?.visualDescription && (
                  <p className="text-[10px] text-slate-400 italic mt-0.5">
                    "{primaryLockedChar.visualDescription}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-slate-300">
              <Sun className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Lighting &amp; Grade: </span>
                <span className="text-slate-200">
                  {scene1?.lightingAtmosphere || 'Matched to Master Scene 1 lighting & chromatic tonality'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-slate-300">
              <Camera className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Cinematic Anchor: </span>
                <span className="text-slate-200">
                  {scene1?.framing || '35mm anamorphic tracking master with physical depth'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: GPT-4o Prompt Context Analysis Panel */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-indigo-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>GPT-4o Semantic Entity Extraction</span>
              </div>
              {analysisResult && (
                <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                  {analysisResult.modelUsed}
                </span>
              )}
            </div>

            {analysisResult ? (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400 font-medium">Environment: </span>
                  <span className="text-slate-200 font-medium truncate">
                    {analysisResult.extractedEntities?.environment || 'Extracted Setting'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 font-medium">Lighting: </span>
                  <span className="text-slate-200 truncate">
                    {analysisResult.extractedEntities?.lighting || 'Continuous Lighting'}
                  </span>
                </div>

                {analysisResult.extractedEntities?.keyObjects && analysisResult.extractedEntities.keyObjects.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    <span className="text-[10px] text-slate-400">Props:</span>
                    {analysisResult.extractedEntities.keyObjects.map((obj, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded border border-slate-700">
                        {obj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 flex flex-col justify-center items-center py-2 text-center">
                <span>Click "Analyze with GPT-4o" to intercept prior scenes and extract semantic entities</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          {analysisResult && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium flex items-center gap-0.5"
              >
                <Eye className="w-3 h-3" />
                View Continuity Prompt
              </button>

              <button
                type="button"
                onClick={handleApplyToCurrentScene}
                className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-sm transition-all"
              >
                <span>Apply to Scene {selectedSceneIndex + 1}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Continuity Prompt Inspector Modal */}
      {showDetailModal && analysisResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h4 className="text-base font-bold text-white">GPT-4o Continuity-Aware Prompt Analysis</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-indigo-300">Continuity-Aware Generated Prompt:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(analysisResult.continuityAwarePrompt, 'prompt')}
                    className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedField === 'prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'prompt' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px] bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  {analysisResult.continuityAwarePrompt}
                </p>
              </div>

              {analysisResult.narrativeProgressionRationale && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="font-semibold text-emerald-400 block mb-1">Director Continuity Rationale:</span>
                  <p className="text-slate-300 italic text-[11px]">
                    "{analysisResult.narrativeProgressionRationale}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Camera Language:</span>
                  <span className="text-slate-200 font-medium">{analysisResult.framing || '35mm Tracking'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Camera Movement:</span>
                  <span className="text-slate-200 font-medium">{analysisResult.cameraMovement || 'Smooth Dolly In'}</span>
                </div>
              </div>

              {analysisResult.subtitles && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">English Subtitle:</span>
                    <span className="text-slate-200">{analysisResult.subtitles.en}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Nepali Subtitle:</span>
                    <span className="text-slate-200 font-nepali">{analysisResult.subtitles.ne}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyToCurrentScene();
                  setShowDetailModal(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Scene {selectedSceneIndex + 1} &amp; Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
