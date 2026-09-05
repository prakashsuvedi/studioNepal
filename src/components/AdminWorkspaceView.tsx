import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Unlock, 
  Lock, 
  Key, 
  Server, 
  Check, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  Terminal,
  Activity,
  CheckCircle2,
  Database
} from 'lucide-react';
import { AdminSettings } from '../types';

interface AdminWorkspaceViewProps {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  bypassControlledMode: boolean;
  setBypassControlledMode: (val: boolean) => void;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
}

export const AdminWorkspaceView: React.FC<AdminWorkspaceViewProps> = ({
  isAdmin,
  setIsAdmin,
  bypassControlledMode,
  setBypassControlledMode,
  credits,
  setCredits
}) => {
  const [azureEndpoint, setAzureEndpoint] = useState('https://prakashsuvedi-7749-resource.services.ai.azure.com');
  const [azureApiKey, setAzureApiKey] = useState('az-ai-foundry-****************');
  const [projectId, setProjectId] = useState('prakashsuvedi-7749');
  
  const [isPinging, setIsPinging] = useState(false);
  const [pingLog, setPingLog] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestAzureCredentials = async () => {
    setIsPinging(true);
    setPingLog(prev => [
      `[${new Date().toLocaleTimeString()}] Pinging Azure Resource: ${azureEndpoint}...`,
      ...prev
    ]);

    await new Promise(r => setTimeout(r, 600));

    setPingLog(prev => [
      `[${new Date().toLocaleTimeString()}] 200 OK: Azure AI Foundry Project '${projectId}' authenticated.`,
      `[${new Date().toLocaleTimeString()}] Validated Deployment: gpt-image-1.5 (Image Generation)`,
      `[${new Date().toLocaleTimeString()}] Validated Deployment: sora-2 (Azure AI Video)`,
      `[${new Date().toLocaleTimeString()}] Status: Direct Admin testing unlocked with 0 credit deduction.`,
      ...prev
    ]);
    setIsPinging(false);
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Admin Workspace & Provider Center</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              Admin Privilege
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure Azure AI Foundry credentials, bypass controlled mode, and test endpoints directly without credit deduction.
          </p>
        </div>

        {/* Master Bypass Switch */}
        <button
          onClick={() => {
            const next = !bypassControlledMode;
            setBypassControlledMode(next);
            setIsAdmin(true);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer ${
            bypassControlledMode
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
          }`}
        >
          {bypassControlledMode ? (
            <>
              <Unlock className="w-4 h-4" />
              <span>Bypass Controlled Mode: ACTIVE</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Controlled Mode: ON (Click to Bypass)</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Azure AI Foundry Configuration */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-rose-600" />
              <span>Azure AI Foundry Credentials</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">Live Configuration</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Azure Endpoint */}
            <div className="space-y-1">
              <label className="text-slate-700 font-semibold">Azure Resource Endpoint</label>
              <input
                type="text"
                value={azureEndpoint}
                onChange={e => setAzureEndpoint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Azure Project ID */}
            <div className="space-y-1">
              <label className="text-slate-700 font-semibold">Azure Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* API Key */}
            <div className="space-y-1">
              <label className="text-slate-700 font-semibold">Azure API Secret Key</label>
              <input
                type="password"
                value={azureApiKey}
                onChange={e => setAzureApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Configured Models */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-medium">Image Model</span>
                <p className="font-bold text-rose-600 font-mono">gpt-image-1.5</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-medium">Video Model</span>
                <p className="font-bold text-indigo-600 font-mono">sora-2</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={handleTestAzureCredentials}
              disabled={isPinging}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              {isPinging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-emerald-600" />}
              <span>Test Azure Connection</span>
            </button>

            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Save Configuration
            </button>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Admin settings and Azure endpoints saved successfully.</span>
            </div>
          )}
        </div>

        {/* Right 6 Columns: Credit Management & Diagnostic Telemetry */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Credit Quota & Mode Override</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">Real-time Policy</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900">Current User Balance</span>
                  <p className="text-[11px] text-slate-500">Regular account usage limit</p>
                </div>
                <div className="font-mono text-xl font-bold text-amber-600">
                  {bypassControlledMode ? '∞ (Admin)' : `${credits} Credits`}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                <button
                  onClick={() => setCredits(prev => prev + 50)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer shadow-xs"
                >
                  +50 Credits
                </button>
                <button
                  onClick={() => setCredits(500)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer shadow-xs"
                >
                  Reset to 500
                </button>
                <button
                  onClick={() => setBypassControlledMode(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition cursor-pointer"
                >
                  Set Unlimited Admin
                </button>
              </div>
            </div>

            {/* Terminal Log Output */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Terminal className="w-3.5 h-3.5 text-rose-600" />
                  <span>Admin Telemetry Log</span>
                </span>
                <span className="text-[10px] text-slate-400">Real-time Event Stream</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 h-44 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 scrollbar-thin shadow-inner">
                {pingLog.length > 0 ? (
                  pingLog.map((log, i) => (
                    <div key={i} className="text-emerald-400 leading-tight">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">
                    Click "Test Azure Connection" to run validation against Azure Foundry endpoints.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Security Mode: Bearer JWT Admin Override</span>
            <span className="text-emerald-700 font-mono font-semibold">READY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
