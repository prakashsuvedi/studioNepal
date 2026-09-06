import React, { useState } from 'react';
import { Scene, UserSession, UserTrialQuota } from '../types';
import { apiGenerateImage, apiTranslatePrompt } from '../lib/api';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Film, 
  Plus, 
  Languages, 
  Check, 
  AlertCircle,
  Copy,
  RefreshCw,
  Clock,
  Edit3,
  SlidersHorizontal,
  Sliders,
  ShieldCheck,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import { ImageMicroEditorModal } from './ImageMicroEditorModal';

interface ImageStudioViewProps {
  initialPrompt?: string;
  onAddSceneToVideo: (scene: Scene) => void;
  onNavigateToTimeline?: () => void;
  bypassControlledMode: boolean;
  user?: UserSession | null;
  onTriggerPaywall?: (reason: string) => void;
  onUsageUpdated?: (usage: UserTrialQuota, credits: number) => void;
  onStartGlobalLoading?: (info: { title: string; subtitle?: string; type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; progress?: number }) => void;
  onStopGlobalLoading?: () => void;
}

const SAMPLE_NEPALI_PROMPTS = [
  {
    en: "Majestic Mount Everest with glowing golden sunlight at dawn, ultra-photorealistic 8k",
    ne: "सगरमाथाको शिखरमा बिहानीको सुनौलो घाम, आकर्षक र जीवन्त दृश्य"
  },
  {
    en: "Traditional Newari house with intricately carved wooden peacock window in Bhaktapur, oil lamps in evening",
    ne: "भक्तपुरको परम्परागत नेवारी घर, मयूर झ्याल र साँझको पालाको बत्तीको प्रकाश"
  },
  {
    en: "Tranquil Phewa Lake with colorful wooden boats and Annapurna reflection, morning mist",
    ne: "फेवातालमा रंगीचंगी डुङ्गाहरू र पृष्ठभूमिमा अन्नपूर्ण हिमालको प्रतिविम्ब"
  },
  {
    en: "Nepali artisan crafting bronze singing bowl in Patan, warm workshop glow, shallow depth of field",
    ne: "पाटनको कार्यशालामा काँसको सिङ्गिङ बोल बनाउँदै गरेका नेपाली कालिगढ"
  }
];

const PROMPT_STYLE_PRESETS = [
  { label: 'Cinematic Movie', modifier: 'cinematic lighting, anamorphic lens, 8k resolution, photorealistic, octave render, highly detailed' },
  { label: 'Nepali Folk Art', modifier: 'traditional Nepali Paubha / Mithila art style, intricate patterns, rich vibrant natural dye colors, gold leaf accents' },
  { label: 'Hyperrealistic Portrait', modifier: '8k UHD, professional studio lighting, 85mm f/1.4 lens, natural skin texture, sharp focus' },
  { label: 'Anime / Fantasy', modifier: 'Makoto Shinkai style, gorgeous sky and clouds, vibrant colors, anime art, masterpiece' },
  { label: '3D Digital Render', modifier: 'Unreal Engine 5 render, ray tracing, octane render, isometric 3d model, clean lighting' },
];

const CAMERA_ANGLES = [
  'Wide Angle Landscape Shot',
  'Macro Close-up Detail',
  'Drone Aerial Top View',
  'Low Angle Majestic View',
  'Eye-Level Cinematic Frame',
];

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({
  initialPrompt,
  onAddSceneToVideo,
  onNavigateToTimeline,
  bypassControlledMode,
  user,
  onTriggerPaywall,
  onUsageUpdated,
  onStartGlobalLoading,
  onStopGlobalLoading,
}) => {
  const [prompt, setPrompt] = useState(() => initialPrompt || SAMPLE_NEPALI_PROMPTS[0].en);
  const [canvasSubtitle, setCanvasSubtitle] = useState('');
  const [presetLang, setPresetLang] = useState<'en' | 'ne'>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  React.useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const [model, setModel] = useState<'gpt-image-1.5' | 'flux-schnell' | 'pollinations-free'>('gpt-image-1.5');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('1:1');
  const [quality, setQuality] = useState<'standard' | 'hd'>('hd');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, extra limbs, watermark, text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1280&q=80'
  );
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generationMetadata, setGenerationMetadata] = useState<{ engine?: string; resolution?: string } | null>(null);
  const [isMicroEditorOpen, setIsMicroEditorOpen] = useState(false);

  // Devanagari detection
  const hasDevanagari = /[\u0900-\u097F]/.test(prompt);

  // Translate prompt between Nepali and English
  const handleTranslatePrompt = async (target: 'en' | 'ne') => {
    if (!prompt.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const translated = await apiTranslatePrompt(prompt, target);
      if (translated && translated.trim()) {
        setPrompt(translated.trim());
      }
    } catch (err) {
      console.warn('Translate prompt failed', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Apply Prompt Modifier to the single active prompt
  const applyStylePreset = (modifier: string) => {
    if (!prompt.includes(modifier)) {
      setPrompt(prev => prev.trim() ? `${prev.trim()}, ${modifier}` : modifier);
    }
  };

  const applyCameraAngle = (angle: string) => {
    if (!prompt.includes(angle)) {
      setPrompt(prev => prev.trim() ? `${prev.trim()}, ${angle}` : angle);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Generate Image
  const handleGenerate = async () => {
    setIsGenerating(true);
    setAddedSuccess(false);
    setGenError(null);

    const modelDisplayName =
      model === 'gpt-image-1.5'
        ? 'OpenAI GPT-Image-1.5 (Azure Foundry)'
        : model === 'flux-schnell'
        ? 'FLUX.1 Schnell'
        : 'Pollinations Turbo';

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'image',
        title: 'Synthesizing Neural Art Canvas...',
        subtitle: `Generating photorealistic image with ${modelDisplayName}...`,
        progress: 25,
      });
    }

    try {
      const activeUserId = user?.id || 'usr_admin_01';
      const promptText = prompt.trim() || 'Nepal scenic Himalaya landscape';
      
      const apiModel =
        model === 'gpt-image-1.5'
          ? 'gpt-image-1.5'
          : model === 'flux-schnell'
          ? 'black-forest-labs/FLUX.1-schnell'
          : 'pollinations-free';

      const data = await apiGenerateImage(
        activeUserId,
        promptText,
        apiModel,
        quality === 'hd' ? 'hd' : 'standard'
      );
      
      if (data && data.result && data.result.url) {
        setGeneratedImageUrl(data.result.url);
        setGenerationMetadata({
          engine: data.result.engine,
          resolution: data.result.resolution || (aspectRatio === '16:9' ? '1024x576' : aspectRatio === '9:16' ? '576x1024' : aspectRatio === '4:5' ? '800x1000' : '1024x1024'),
        });
        if (onUsageUpdated && data.trialUsage) {
          onUsageUpdated(data.trialUsage, data.remainingCredits);
        }
      } else {
        throw new Error('No image returned from generation pipeline');
      }
    } catch (e: any) {
      console.error(e);
      setGenError(e.message || 'Image generation failed');
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

  // Add generated image to video studio timeline
  const handleAddToTimeline = () => {
    const newScene: Scene = {
      id: 'scene-' + Math.random().toString(36).substring(2, 9),
      title: prompt.slice(0, 24) || 'Generated Image Scene',
      duration: 4,
      prompt: prompt,
      promptNepali: hasDevanagari ? prompt : canvasSubtitle || prompt,
      mediaUrl: generatedImageUrl,
      mediaType: 'image',
      aspectRatio,
      motion: 'pan_right',
      transition: 'fade',
      textOverlay: (canvasSubtitle || prompt).slice(0, 32),
      textNepali: (hasDevanagari ? prompt : canvasSubtitle).slice(0, 32),
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'devanagari',
      filter: 'cinematic',
      volume: 80
    };
    onAddSceneToVideo(newScene);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Fabric Micro-Editor Modal */}
      <ImageMicroEditorModal
        isOpen={isMicroEditorOpen}
        onClose={() => setIsMicroEditorOpen(false)}
        imageUrl={generatedImageUrl}
        onSaveModifiedImage={(newUrl) => setGeneratedImageUrl(newUrl)}
      />

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Azure GPT-Image & FLUX Studio</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              High-Precision AI Art Studio
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate cinematic Nepal imagery via Azure AI Foundry or free Pollinations tier, with Fabric.js Micro-Editor and one-click insertion into the Video Timeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Storage Retention: 24 Hours TTL</span>
          </div>
          <code className="hidden md:inline text-xs bg-slate-100 px-2.5 py-1 rounded-md text-emerald-700 border border-slate-200 font-mono font-medium">
            /openai/v1/images/generations
          </code>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Generator Settings & Prompts */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-sm">
          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>AI Image Model Provider</span>
              {bypassControlledMode && (
                <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Admin Bypass Enabled</span>
              )}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                id="btn-model-gpt-image"
                type="button"
                onClick={() => setModel('gpt-image-1.5')}
                className={`p-3 rounded-xl border text-left transition ${
                  model === 'gpt-image-1.5'
                    ? 'bg-rose-50/60 border-rose-500 text-slate-900 ring-1 ring-rose-500/30'
                    : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-slate-900">GPT-Image-1.5</div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">AZURE</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Azure AI Foundry • 1024px Photorealistic</div>
              </button>

              <button
                id="btn-model-flux"
                type="button"
                onClick={() => setModel('flux-schnell')}
                className={`p-3 rounded-xl border text-left transition ${
                  model === 'flux-schnell'
                    ? 'bg-rose-50/60 border-rose-500 text-slate-900 ring-1 ring-rose-500/30'
                    : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">FLUX.1 Schnell</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Hugging Face • Neural Turbo</div>
              </button>

              <button
                id="btn-model-pollinations"
                type="button"
                onClick={() => setModel('pollinations-free')}
                className={`p-3 rounded-xl border text-left transition ${
                  model === 'pollinations-free'
                    ? 'bg-rose-50/60 border-rose-500 text-slate-900 ring-1 ring-rose-500/30'
                    : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">Pollinations Turbo</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Instant Rendering • Uncapped</div>
              </button>
            </div>
          </div>

          {/* Single Unified Prompt & Model Input */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Generation Prompt</span>
                    <span className="text-[11px] font-normal text-slate-500 font-['Mukta']">(प्रम्प्ट)</span>
                  </label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active AI Input
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {hasDevanagari ? (
                    <button
                      type="button"
                      onClick={() => handleTranslatePrompt('en')}
                      disabled={isTranslating}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                      title="Translate Nepali prompt into rich English for optimal diffusion model results"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>{isTranslating ? 'अनुवाद हुँदैछ...' : '🌐 Translate to English for AI'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTranslatePrompt('ne')}
                      disabled={isTranslating}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50 font-['Mukta']"
                      title="Translate English prompt to Nepali"
                    >
                      <Languages className={`w-3.5 h-3.5 text-amber-600 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>{isTranslating ? 'Translating...' : '🇳🇵 नेपालीमा अनुवाद'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 border border-slate-200"
                  >
                    {copiedPrompt ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Single Unified Prompt Textarea */}
              <textarea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your scene in English or नेपाली (e.g., Majestic Mount Everest with glowing golden sunlight at dawn, ultra-photorealistic 8k)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500 resize-none font-sans leading-relaxed"
              />

              {/* Transparent Direct Model Payload Indicator */}
              <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200/80 text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-slate-700 shrink-0">Model Payload ({model}):</span>
                  <span className="truncate italic text-slate-500">"{prompt.trim() || 'Default scene prompt'}"</span>
                </div>
                <span className="shrink-0 text-[10px] text-emerald-700 font-medium ml-2 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  100% Direct Model Input
                </span>
              </div>
            </div>

            {/* Prompt Assist & Style Presets */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Prompt Assist & Style Presets</span>
              </span>

              <div className="flex flex-wrap gap-1.5">
                {PROMPT_STYLE_PRESETS.map((pst, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyStylePreset(pst.modifier)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-semibold transition cursor-pointer"
                  >
                    + {pst.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-500 self-center">Camera Angles:</span>
                {CAMERA_ANGLES.map((ang, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCameraAngle(ang)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    {ang}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Scene Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600">Quick Scene Presets:</span>
                <div className="flex items-center text-[10px] border border-slate-200 rounded-md overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setPresetLang('en')}
                    className={`px-2 py-0.5 font-medium transition cursor-pointer ${presetLang === 'en' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetLang('ne')}
                    className={`px-2 py-0.5 font-medium font-['Mukta'] transition cursor-pointer ${presetLang === 'ne' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    नेपाली
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_NEPALI_PROMPTS.map((p, idx) => {
                  const textVal = presetLang === 'en' ? p.en : p.ne;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(textVal)}
                      className="text-[10px] p-2 text-left rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 border border-slate-200 transition cursor-pointer group"
                      title={textVal}
                    >
                      <span className="font-bold block text-slate-900 group-hover:text-indigo-700">Preset {idx + 1}</span>
                      <span className="truncate block opacity-80">{textVal.slice(0, 34)}...</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional On-Canvas Subtitle / Caption Overlay */}
            <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>On-Canvas Subtitle / Title Overlay</span>
                  <span className="text-[10px] font-normal text-slate-400">(Optional • Timeline Display)</span>
                </label>
              </div>
              <input
                type="text"
                value={canvasSubtitle}
                onChange={e => setCanvasSubtitle(e.target.value)}
                placeholder="Optional text to display on the image/video timeline (Nepali or English)..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Aspect Ratio & Quality */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Multi-Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-rose-500 focus:bg-white"
              >
                <option value="16:9">16:9 (Landscape / 1024x576)</option>
                <option value="9:16">9:16 (Vertical / 576x1024)</option>
                <option value="1:1">1:1 (Square / 1024x1024)</option>
                <option value="4:5">4:5 (Social / 800x1000)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Quality Level</label>
              <select
                value={quality}
                onChange={e => setQuality(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
              >
                <option value="hd">HD (1024x1024 / Neural Post-Process)</option>
                <option value="standard">Standard Fast Render</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Image ({aspectRatio}) via {model === 'flux-schnell' ? 'Hugging Face FLUX Pipeline' : 'Neural Pollinations'}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Image Now ({aspectRatio})</span>
              </>
            )}
          </button>
        </div>

        {/* Right 6 Columns: Image Preview & Timeline Integration */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Generated Canvas Output</span>
              {generationMetadata?.engine && (
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {generationMetadata.engine}
                </span>
              )}
            </div>
            
            {/* 24-Hour Expiration Badge */}
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Downloads Expire in 24 Hours</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{aspectRatio}</span>
            </div>
          </div>

          {/* Image Display */}
          <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[340px] flex items-center justify-center relative p-2 shadow-inner">
            {generatedImageUrl ? (
              <div className="relative group w-full flex items-center justify-center">
                <img
                  src={generatedImageUrl}
                  alt="Generated"
                  referrerPolicy="no-referrer"
                  className="rounded-lg object-contain max-h-[360px] w-full shadow-lg"
                />

                {/* Fabric Micro-Editor Trigger Overlay */}
                <button
                  type="button"
                  onClick={() => setIsMicroEditorOpen(true)}
                  className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-rose-600 backdrop-blur text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Open Fabric Micro-Editor</span>
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No image generated yet.</p>
              </div>
            )}
          </div>

          {/* Actions: Send to Video Studio or Download */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={generatedImageUrl}
                target="_blank"
                rel="noreferrer"
                download="nepalai_image.png"
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HD Asset</span>
              </a>

              <button
                type="button"
                onClick={() => setIsMicroEditorOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Canvas Overlays</span>
              </button>

              <button
                id="btn-add-to-timeline"
                onClick={handleAddToTimeline}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>+ Add to Timeline</span>
              </button>
            </div>

            {addedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">Scene inserted into Video Studio Timeline!</span>
                </div>
                {onNavigateToTimeline && (
                  <button
                    type="button"
                    onClick={onNavigateToTimeline}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>Open Timeline</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

