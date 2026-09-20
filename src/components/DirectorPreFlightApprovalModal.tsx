import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Camera, 
  Clock, 
  Tv, 
  SlidersHorizontal, 
  Wand2, 
  User, 
  Lock, 
  Layers, 
  ArrowRight,
  Eye,
  Zap,
  Info
} from 'lucide-react';
import { SubjectLockItem } from '../data/soraProductionPacks';

export interface DirectorApprovalPayload {
  prompt: string;
  enhancedPrompt?: string;
  sceneTitle: string;
  durationSeconds: string;
  resolution: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  characterName: string;
  characterDescription: string;
  characterAnchorToken: string;
  cameraMovement: string;
  lightingAtmosphere: string;
  sceneIndex: number;
  totalScenes: number;
}

interface DirectorPreFlightApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: DirectorApprovalPayload;
  onApprove: (approvedPayload: DirectorApprovalPayload) => void;
  availableCharacters?: SubjectLockItem[];
}

export const DirectorPreFlightApprovalModal: React.FC<DirectorPreFlightApprovalModalProps> = ({
  isOpen,
  onClose,
  payload,
  onApprove,
  availableCharacters = []
}) => {
  const [editedPayload, setEditedPayload] = useState<DirectorApprovalPayload>(payload);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'character' | 'camera'>('blueprint');
  const [isEnhancing, setIsEnhancing] = useState(false);

  React.useEffect(() => {
    setEditedPayload(payload);
  }, [payload]);

  if (!isOpen) return null;

  const handleApplyCharacter = (char: SubjectLockItem) => {
    setEditedPayload(prev => ({
      ...prev,
      characterName: char.name,
      characterDescription: char.visualDescription,
      characterAnchorToken: char.anchorToken,
      prompt: prev.prompt.includes(char.anchorToken) 
        ? prev.prompt 
        : `${char.anchorToken} ${prev.prompt}`
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">AI Director Pre-Flight Approval</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Scene {editedPayload.sceneIndex} of {editedPayload.totalScenes}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Review and approve character blueprint & visual parameters before Sora-2 generation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'blueprint'
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Shot Blueprint</span>
          </button>

          <button
            onClick={() => setActiveTab('character')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'character'
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Character Identity Anchor</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cinematics & Specs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'blueprint' && (
            <div className="space-y-3.5">
              {/* Scene Title & Prompt */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Scene Prompt & Narrative Description:</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Editable before render</span>
                </label>
                <textarea
                  value={editedPayload.prompt}
                  onChange={(e) => setEditedPayload({ ...editedPayload, prompt: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Character Continuity Summary Box */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-300">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">
                      Character Continuity Lock: {editedPayload.characterName || 'Custom Subject'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-500/40">
                      {editedPayload.characterAnchorToken || '[Anchor: Custom_Auto]'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {editedPayload.characterDescription || 'Facial geometry, clothing attire, and lighting continuity will be strictly preserved in this generation.'}
                  </p>
                </div>
              </div>

              {/* Shot Specs Summary Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Sora Duration</span>
                  <span className="text-xs font-bold text-emerald-400">{editedPayload.durationSeconds}s Continuous</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Aspect Ratio</span>
                  <span className="text-xs font-bold text-indigo-400">{editedPayload.aspectRatio === '9:16' ? '9:16 Shorts' : '16:9 Cinema'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Engine</span>
                  <span className="text-xs font-bold text-amber-400">Azure Sora-2</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'character' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Custom Character Identity / Anchor Token:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editedPayload.characterName}
                    onChange={(e) => setEditedPayload({ ...editedPayload, characterName: e.target.value })}
                    placeholder="Character Name (e.g., Maya, Pasang, Elder Monk)"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={editedPayload.characterAnchorToken}
                    onChange={(e) => setEditedPayload({ ...editedPayload, characterAnchorToken: e.target.value })}
                    placeholder="[Subject-Anchor: ...]"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Detailed Visual Description & Attire:</label>
                <textarea
                  value={editedPayload.characterDescription}
                  onChange={(e) => setEditedPayload({ ...editedPayload, characterDescription: e.target.value })}
                  rows={2}
                  placeholder="e.g. 24-year-old Nepali girl in ochre handwoven linen top, almond eyes, natural dark hair, warm Himalayan sunlight"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Select Character Registry */}
              {availableCharacters.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10.5px] font-bold text-slate-400">Or Select from Verified Production Characters:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {availableCharacters.slice(0, 6).map((char) => (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => handleApplyCharacter(char)}
                        className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center gap-2 ${
                          editedPayload.characterName === char.name
                            ? 'bg-indigo-950 border-indigo-500 text-white shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{char.avatarEmoji}</span>
                        <div className="truncate">
                          <div className="font-bold text-[11px] truncate">{char.name}</div>
                          <div className="text-[9px] text-slate-400 truncate">{char.roleOrType}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Camera Framing / Motion:</label>
                  <select
                    value={editedPayload.cameraMovement}
                    onChange={(e) => setEditedPayload({ ...editedPayload, cameraMovement: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Cinematic Wide 35mm Master">Cinematic Wide 35mm Master</option>
                    <option value="Dynamic Tracking Medium Shot">Dynamic Tracking Medium Shot</option>
                    <option value="Close Hero Profile & Orbit">Close Hero Profile & Orbit</option>
                    <option value="Low-Angle High Altitude Dolly">Low-Angle High Altitude Dolly</option>
                    <option value="FPV Drone Sweeping Ridge">FPV Drone Sweeping Ridge</option>
                    <option value="Static Tripod Broadcast Master">Static Tripod Broadcast Master</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Atmospheric Lighting:</label>
                  <select
                    value={editedPayload.lightingAtmosphere}
                    onChange={(e) => setEditedPayload({ ...editedPayload, lightingAtmosphere: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Himalayan Alpenglow Golden Hour">Himalayan Alpenglow Golden Hour</option>
                    <option value="Kathmandu Twilight Neon (Cyberpunk)">Kathmandu Twilight Neon (Cyberpunk)</option>
                    <option value="Crisp Morning Mountain Mist">Crisp Morning Mountain Mist</option>
                    <option value="Dramatic Studio High-Contrast">Dramatic Studio High-Contrast</option>
                    <option value="Warm Indoor Candlelight & Oil Lamps">Warm Indoor Candlelight & Oil Lamps</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Duration (Sora-2 Supported):</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['4', '8', '12'].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setEditedPayload({ ...editedPayload, durationSeconds: sec })}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          editedPayload.durationSeconds === sec
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Aspect Ratio:</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditedPayload({ ...editedPayload, aspectRatio: '16:9', resolution: '1280x720' })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        editedPayload.aspectRatio === '16:9'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      16:9
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditedPayload({ ...editedPayload, aspectRatio: '9:16', resolution: '720x1280' })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        editedPayload.aspectRatio === '9:16'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      9:16
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(editedPayload)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Launch Sora-2 Render</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
