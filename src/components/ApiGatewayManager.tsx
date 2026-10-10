import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  Key, 
  Database, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  Code2, 
  Activity, 
  Server, 
  Cpu, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const ApiGatewayManager: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'nodejs' | 'python' | 'nextjs' | 'curl'>('nodejs');
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/admin/users');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const adminKey = 'nepalai-admin-key';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio.nepalai.tech';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const executeApiTest = async () => {
    setTestLoading(true);
    setTestResponse(null);
    setTestError(null);
    setTestLatency(null);

    const startTime = performance.now();
    try {
      const savedUserId = localStorage.getItem('nepalai_user_id') || 'usr_admin_01';
      const token = localStorage.getItem('nepalai_auth_token') || '';

      const res = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'x-admin-key': adminKey,
          'x-user-id': savedUserId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const endTime = performance.now();
      setTestLatency(Math.round(endTime - startTime));

      const data = await res.json();
      setTestResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err: any) {
      setTestError(err.message || 'API request failed');
    } finally {
      setTestLoading(false);
    }
  };

  const codeSnippets = {
    nodejs: `// Integration script for nepalai.tech backend (Node.js / Express)
import axios from 'axios';

const STUDIO_BASE_URL = 'https://studio.nepalai.tech';
const ADMIN_KEY = '${adminKey}';

export async function fetchStudioMetrics() {
  try {
    const response = await axios.get(\`\${STUDIO_BASE_URL}/api/admin/users\`, {
      headers: {
        'x-admin-key': ADMIN_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Studio Metrics received:', response.data.metrics);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch studio data:', error.message);
    throw error;
  }
}`,
    python: `# Python Backend sync script for nepalai.tech
import requests

STUDIO_BASE_URL = "https://studio.nepalai.tech"
ADMIN_KEY = "${adminKey}"

def get_studio_data():
    headers = {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{STUDIO_BASE_URL}/api/admin/users", headers=headers, timeout=10)
    response.raise_for_status()
    
    data = response.json()
    print(f"Total Users: {data.get('metrics', {}).get('totalUsers')}")
    print(f"Total Revenue: \${data.get('metrics', {}).get('totalRevenueUSD')} USD")
    return data`,
    nextjs: `// Next.js App Router / Server Action (app/api/studio-sync/route.ts)
import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://studio.nepalai.tech/api/admin/users', {
    headers: {
      'x-admin-key': process.env.STUDIO_ADMIN_KEY || '${adminKey}',
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to sync with studio' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}`,
    curl: `# Run in Terminal or Server Shell
curl -X GET "https://studio.nepalai.tech/api/admin/users" \\
  -H "x-admin-key: ${adminKey}" \\
  -H "Content-Type: application/json"`
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>nepalai.tech ⇄ studio.nepalai.tech API Gateway</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  LIVE REST
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Secure real-time data sync, user metrics, daily quotas, and telemetry bridging between domains.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>x-admin-key: {adminKey}</span>
            </span>
            <button
              onClick={() => copyToClipboard(adminKey, 'admin_key')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="Copy Admin Key"
            >
              {copiedSection === 'admin_key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Available API Endpoints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {[
            {
              method: 'GET',
              path: '/api/admin/users',
              desc: 'Sync all registered users, total token usage, revenue, and active subscriptions.',
            },
            {
              method: 'POST',
              path: '/api/admin/user/:id/update',
              desc: 'Programmatically grant credits, change plan tiers, or reset daily quotas.',
            },
            {
              method: 'GET',
              path: '/api/admin/daily-reset-audit',
              desc: 'Audit the 24-hour midnight quota reset cycle and verify next reset timestamps.',
            },
            {
              method: 'GET',
              path: '/api/diagnostic/ai-credentials',
              desc: 'Live telemetry verifying Azure Foundry Sora-2, GPT-Image & HF endpoints.',
            },
            {
              method: 'GET',
              path: '/api/diagnostic',
              desc: 'High-level server heartbeat, process uptime, and memory usage metrics.',
            },
            {
              method: 'GET',
              path: '/sitemap.xml',
              desc: 'Dynamic XML sitemap listing all creator tools, routes, and SEO metadata.',
            },
          ].map((ep, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 hover:border-indigo-400/50 transition"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  ep.method === 'GET' 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                }`}>
                  {ep.method}
                </span>
                <button
                  onClick={() => {
                    setTestEndpoint(ep.path.replace(':id', 'usr_admin_01'));
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Select Test</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {ep.path}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {ep.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Live API Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Code Generator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Integration Code Generator</h3>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
              {(['nodejs', 'python', 'nextjs', 'curl'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    selectedLanguage === lang
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
              {codeSnippets[selectedLanguage]}
            </pre>
            <button
              onClick={() => copyToClipboard(codeSnippets[selectedLanguage], 'snippet')}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              {copiedSection === 'snippet' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Live Request Tester */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Endpoint Execution Tester</h3>
            </div>
            {testLatency !== null && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                ⚡ {testLatency} ms
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testEndpoint}
              onChange={e => setTestEndpoint(e.target.value)}
              placeholder="/api/admin/users"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={executeApiTest}
              disabled={testLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
              <span>{testLoading ? 'Running...' : 'Execute Test'}</span>
            </button>
          </div>

          {testError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              Error: {testError}
            </div>
          )}

          {testResponse && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">HTTP Response:</span>
                <span className={`font-bold ${testResponse.status === 200 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {testResponse.status} {testResponse.statusText}
                </span>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                {JSON.stringify(testResponse.data, null, 2)}
              </pre>
            </div>
          )}

          {!testResponse && !testError && !testLoading && (
            <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5 text-slate-400 dark:text-slate-500">
              <Activity className="w-6 h-6 mx-auto opacity-50" />
              <p className="text-xs">Click <strong>Execute Test</strong> to ping the endpoint and inspect live JSON payload.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
