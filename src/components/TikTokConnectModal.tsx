import React, { useState, useEffect } from 'react';
import {
  Video,
  X as XIcon,
  Key,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogIn,
  User,
  ExternalLink,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';

export interface TikTokAccountInfo {
  openId?: string;
  unionId?: string;
  handle: string;
  displayName: string;
  avatar: string;
  followerCount: string;
}

interface TikTokConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (token: string, account: TikTokAccountInfo) => void;
  currentAccount: TikTokAccountInfo | null;
  isConnected: boolean;
  onDisconnect: () => void;
}

export const TikTokConnectModal: React.FC<TikTokConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  currentAccount,
  isConnected,
  onDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'handle' | 'credentials'>('oauth');
  const [authConfig, setAuthConfig] = useState<{
    configured: boolean;
    authUrl: string;
    redirectUri: string;
    hasClientSecret?: boolean;
  } | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isWaitingPopup, setIsWaitingPopup] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  // Manual Handle / Token verification state
  const [handleInput, setHandleInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Fetch TikTok OAuth status from backend
  const fetchAuthConfig = async () => {
    setIsLoadingConfig(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/tiktok/auth-url');
      const data = await res.json();
      if (data.success) {
        setAuthConfig({
          configured: data.configured,
          authUrl: data.authUrl,
          redirectUri: data.redirectUri,
          hasClientSecret: Boolean(data.hasClientSecret),
        });
      }
    } catch (err: any) {
      console.warn('Failed to fetch TikTok auth config:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuthConfig();
    }
  }, [isOpen]);

  // Listen for OAuth Popup PostMessage Event
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        const { accessToken, account } = event.data;
        setIsWaitingPopup(false);
        setAuthError(null);
        if (accessToken && account) {
          try {
            localStorage.setItem('nepalai_tiktok_token', accessToken);
            localStorage.setItem('nepalai_tiktok_account', JSON.stringify(account));
          } catch {}
          onConnected(accessToken, account);
          onClose();
        }
      } else if (event.data?.type === 'TIKTOK_AUTH_ERROR') {
        setIsWaitingPopup(false);
        setAuthError(event.data.error || 'TikTok authentication was cancelled.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConnected, onClose]);

  if (!isOpen) return null;

  const handleLaunchTikTokOAuth = () => {
    if (!authConfig?.authUrl) return;
    setAuthError(null);
    setIsWaitingPopup(true);

    const width = 560;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authConfig.authUrl,
      'tiktok_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setIsWaitingPopup(false);
      }
    }, 1000);
  };

  const handleVerifyDirectAccount = async () => {
    const targetHandle = handleInput.trim();
    const targetToken = tokenInput.trim();
    if (!targetHandle && !targetToken) {
      setAuthError('Please enter your TikTok @username or access token');
      return;
    }

    setIsValidating(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/tiktok/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: targetHandle,
          token: targetToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not verify TikTok account credentials');
      }

      const verifiedAccount: TikTokAccountInfo = data.account || {
        handle: targetHandle.startsWith('@') ? targetHandle : `@${targetHandle}`,
        displayName: targetHandle.replace(/^@/, ''),
        avatar: '',
        followerCount: 'Connected Creator Account',
      };

      const token = targetToken || `tt_token_${Date.now()}`;
      try {
        localStorage.setItem('nepalai_tiktok_token', token);
        localStorage.setItem('nepalai_tiktok_account', JSON.stringify(verifiedAccount));
      } catch {}

      onConnected(token, verifiedAccount);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to connect TikTok account');
    } finally {
      setIsValidating(false);
    }
  };

  const copyRedirectUri = () => {
    if (authConfig?.redirectUri) {
      navigator.clipboard.writeText(authConfig.redirectUri);
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-700/80 rounded-2xl max-w-lg w-full text-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-stone-950 via-slate-900 to-cyan-950 px-6 py-4 border-b border-cyan-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>TikTok Creator Integration</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] uppercase font-bold">
                  Open API v2
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Authorize direct video upload and TikTok feed publishing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Current Account Status Banner */}
        {isConnected && currentAccount && (
          <div className="bg-emerald-950/50 border-b border-emerald-800/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentAccount.avatar ? (
                <img
                  src={currentAccount.avatar}
                  alt={currentAccount.handle}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/60"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white">
                  TT
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs">{currentAccount.displayName}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-emerald-300/90 font-mono">
                  {currentAccount.handle} • {currentAccount.followerCount}
                </div>
              </div>
            </div>

            <button
              onClick={onDisconnect}
              className="px-3 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-semibold transition cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/70 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>TikTok 1-Click OAuth</span>
          </button>

          <button
            onClick={() => setActiveTab('handle')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'handle'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Creator Profile Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>App Credentials</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[60vh]">
          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Connection Notice</span>
                <p className="text-[11px] text-red-200/90 leading-relaxed">{authError}</p>
              </div>
            </div>
          )}

          {/* TAB 1: 1-CLICK OAUTH */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">TikTok Open API App Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    authConfig?.configured
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {authConfig?.configured ? 'Configured & Ready' : 'Direct Auth Mode'}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Log in directly with your official TikTok account to grant Video Upload & Publishing permissions for NepalAI Studio.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleLaunchTikTokOAuth}
                    disabled={isWaitingPopup || isLoadingConfig}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Video className="w-4 h-4" />
                    <span>{isWaitingPopup ? 'Waiting for TikTok Popup...' : 'Launch TikTok OAuth Authorization'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATOR PROFILE AUTH / ACCESS TOKEN */}
          {activeTab === 'handle' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="text-slate-300 font-semibold block">
                  TikTok Creator Username (@handle)
                </label>
                <input
                  type="text"
                  placeholder="@your_tiktok_username"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />

                <label className="text-slate-300 font-semibold block pt-1">
                  Direct TikTok Access Token (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Paste TikTok Creator Access Token (if available)"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />

                <div className="pt-2">
                  <button
                    onClick={handleVerifyDirectAccount}
                    disabled={isValidating || (!handleInput && !tokenInput)}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isValidating ? 'Verifying Account...' : 'Connect & Verify TikTok Profile'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">OAuth Redirect URI</span>
                  <button
                    onClick={copyRedirectUri}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    {copiedRedirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRedirect ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-[10px] text-cyan-300 break-all select-all">
                  {authConfig?.redirectUri || 'https://.../api/tiktok/callback'}
                </div>

                <div className="space-y-1 text-slate-400 text-[10px] pt-1">
                  <p>In the TikTok Developer Portal (developers.tiktok.com):</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                    <li>Create an App under "TikTok Login Kit" & "Content Posting API".</li>
                    <li>Add the Redirect URI above to your TikTok App Settings.</li>
                    <li>Add <code>TIKTOK_CLIENT_KEY</code> and <code>TIKTOK_CLIENT_SECRET</code> to Secrets.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
