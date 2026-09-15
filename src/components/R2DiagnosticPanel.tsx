import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HardDrive, 
  ShieldCheck, 
  FolderTree, 
  AlertTriangle,
  FileCode,
  WifiOff,
  Key,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { checkR2StorageConnection, verifyStorageConnection, R2DiagnosticResponse } from '../lib/storage';

export const R2DiagnosticPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<R2DiagnosticResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Disconnected' | 'Credentials Misconfigured' | 'Error'>('Disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isSignatureError, setIsSignatureError] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setIsSignatureError(false);

    try {
      // Execute the test HEAD/LIST verification function with AWS SDK v3 SigV4 debugging
      const isConnected = await verifyStorageConnection();
      const diagnosticReport = await checkR2StorageConnection();
      setReport(diagnosticReport);

      const errText = diagnosticReport.error || '';
      const isSigMismatch = diagnosticReport.errorCode === 'SignatureDoesNotMatch' 
        || diagnosticReport.statusCode === 403 
        || errText.toLowerCase().includes('signature')
        || errText.toLowerCase().includes('secret access key');

      if (isConnected && diagnosticReport.authorized) {
        setConnectionStatus('Connected');
        setIsSignatureError(false);
      } else if (isSigMismatch) {
        setConnectionStatus('Credentials Misconfigured');
        setIsSignatureError(true);
        setError(diagnosticReport.error || 'The request signature we calculated does not match the signature you provided. Check your secret access key and signing method.');
      } else if (!diagnosticReport.credentialsConfigured && !diagnosticReport.endpointConfigured) {
        setConnectionStatus('Disconnected');
        if (diagnosticReport.error) setError(diagnosticReport.error);
      } else {
        setConnectionStatus('Error');
        setError(diagnosticReport.error || 'Authorization failed: check R2 Access Key and Secret');
      }
    } catch (err: any) {
      const msg = err?.message || 'Connection test failed';
      if (msg.includes('SignatureDoesNotMatch') || msg.includes('403')) {
        setConnectionStatus('Credentials Misconfigured');
        setIsSignatureError(true);
      } else {
        setConnectionStatus('Error');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white">Cloudflare R2 Storage Diagnostic</h3>
              
              {/* Status Badge: Connected / Disconnected / Credentials Misconfigured / Error */}
              {loading ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying SigV4...
                </span>
              ) : connectionStatus === 'Connected' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : connectionStatus === 'Credentials Misconfigured' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Credentials Misconfigured
                </span>
              ) : connectionStatus === 'Disconnected' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-xs font-bold border border-slate-500/30 flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5" /> Disconnected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Error
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Bucket: <code className="text-amber-400 font-mono">nepalai</code> | Provider: <code className="text-indigo-400 font-mono">Cloudflare R2 (S3 API)</code> | Region: <code className="text-emerald-400 font-mono">{report?.region || 'auto'}</code>
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Testing SigV4 Connection...' : 'Re-trigger Check'}</span>
        </button>
      </div>

      {/* 403 / SignatureDoesNotMatch Specific Warning Panel */}
      {isSignatureError && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-300">Credentials Misconfigured (403 SignatureDoesNotMatch)</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The HMAC-SHA256 signature calculated by Cloudflare R2 does not match the signature sent in the authorization header. This occurs when <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded font-mono font-semibold">R2_SECRET_ACCESS_KEY</code> is truncated, missing characters, or does not correspond to the specified <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded font-mono font-semibold">R2_ACCESS_KEY_ID</code>.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Key className="w-4 h-4" /> Required Secrets Configuration in AI Studio
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full font-mono">
                AI Studio Settings &gt; Secrets
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Access Key ID (32 chars)</div>
                <div className="text-amber-300 font-semibold mt-0.5 break-all">R2_ACCESS_KEY_ID</div>
                <div className="text-[10px] text-slate-500 mt-1">From "Use credentials for S3 clients"</div>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Secret Access Key (64 chars)</div>
                <div className="text-emerald-300 font-semibold mt-0.5 break-all">R2_SECRET_ACCESS_KEY</div>
                <div className="text-[10px] text-slate-500 mt-1">Full 64-hex string (not the REST token)</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Navigate to the left settings panel in Google AI Studio to update these values.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* General error message for non-signature errors */}
      {error && !isSignatureError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Connection Notice: {error}</span>
          </div>
          <p className="text-[11px] text-slate-400 pl-6">
            Ensure your active Cloudflare R2 API Token with <strong className="text-white">Object Read & Write</strong> permissions is configured in the AI Studio Settings &gt; Secrets panel.
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" /> Response Latency
              </span>
              <p className="text-2xl font-black text-white">{report.latencyMs ?? 0} <span className="text-xs text-slate-400 font-normal">ms</span></p>
              <p className="text-[10px] text-amber-400 font-medium">S3 TLS Protocol</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Bucket Name
              </span>
              <p className="text-sm font-bold text-white truncate font-mono">{report.bucket}</p>
              <p className="text-[10px] text-slate-400">Cloudflare APAC</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-indigo-400" /> Stored Objects
              </span>
              <p className="text-2xl font-black text-white">{report.objectCount ?? 0}</p>
              <p className="text-[10px] text-indigo-300 font-medium">Objects in bucket</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Storage Mode
              </span>
              <p className="text-xs font-bold text-slate-200 truncate">{report.provider.toUpperCase()}</p>
              <p className="text-[10px] text-slate-400">Zero-Egress Fees</p>
            </div>
          </div>

          {/* Endpoint Details Card */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Active R2 S3 Endpoint:</span>
              <span className="font-mono text-amber-300 truncate max-w-md">{report.endpoint || 'Auto-resolved from environment'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Region Strategy:</span>
              <span className="text-emerald-400 font-mono">auto (APAC Multi-Region Auto-Routing)</span>
            </div>
            {report.sigv4Details && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 font-medium">SigV4 Access Key:</span>
                <span className="font-mono text-slate-300">{report.sigv4Details.maskedAccessKeyId}</span>
              </div>
            )}
          </div>

          {/* Stored Objects Explorer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-amber-400" />
                <span>Bucket Objects Overview ({report.objects?.length || 0})</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Auto-refreshed: {new Date(report.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {report.objects && report.objects.length > 0 ? (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Object Key</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {report.objects.map((obj, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-amber-200 flex items-center gap-1.5 truncate max-w-xs">
                          <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{obj.key}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {obj.size > 1024 * 1024
                            ? `${(obj.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${(obj.size / 1024).toFixed(1)} KB`}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {obj.lastModified ? new Date(obj.lastModified).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-xl text-center space-y-1">
                <p className="text-xs text-slate-400">
                  {report.authorized
                    ? 'Bucket "nepalai" is authorized and ready. No media objects uploaded yet.'
                    : 'Awaiting valid Cloudflare R2 token credentials to list remote bucket objects.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

