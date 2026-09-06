import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  X as XIcon, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw,
  HelpCircle,
  LogIn,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

export interface YouTubeChannelInfo {
  title: string;
  handle: string;
  avatar: string;
  subscriberCount: string;
}

interface YouTubeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (token: string, channel: YouTubeChannelInfo) => void;
  currentChannel: YouTubeChannelInfo | null;
  isConnected: boolean;
  onDisconnect: () => void;
}

export const YouTubeConnectModal: React.FC<YouTubeConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  currentChannel,
  isConnected,
  onDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'token' | 'keys' | 'demo'>('oauth');
  const [authConfig, setAuthConfig] = useState<{
    configured: boolean;
    authUrl: string;
    redirectUri: string;
    clientIdMasked?: string;
  } | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isWaitingPopup, setIsWaitingPopup] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(true);

  // Manual Token State
  const [tokenInput, setTokenInput] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  // API Credentials State
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keysSuccess, setKeysSuccess] = useState(false);

  // Fetch YouTube OAuth config from backend
  const fetchAuthConfig = async () => {
    setIsLoadingConfig(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/youtube/auth-url');
      const data = await res.json();
      if (data.success) {
        setAuthConfig({
          configured: data.configured,
          authUrl: data.authUrl,
          redirectUri: data.redirectUri,
          clientIdMasked: data.clientIdMasked,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch YouTube auth configuration:', err);
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
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const { accessToken, channel } = event.data;
        setIsWaitingPopup(false);
        setAuthError(null);
        if (accessToken) {
          onConnected(accessToken, channel || {
            title: 'My YouTube Channel',
            handle: '@YouTubeChannel',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
            subscriberCount: 'Connected',
          });
          onClose();
        }
      } else if (event.data?.type === 'YOUTUBE_AUTH_ERROR') {
        setIsWaitingPopup(false);
        setAuthError(event.data.error || 'YouTube OAuth authentication was cancelled or encountered an error.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConnected, onClose]);

  if (!isOpen) return null;

  // 1-Click Launch OAuth Popup
  const handleLaunchGoogleOAuth = () => {
    if (!authConfig?.authUrl) return;
    setAuthError(null);
    setIsWaitingPopup(true);

    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authConfig.authUrl,
      'youtube_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Watch for popup closed by user
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setIsWaitingPopup(false);
      }
    }, 1000);
  };

  // Verify and Connect via Manual Google Access Token
  const handleConnectWithToken = async () => {
    const token = tokenInput.trim();
    if (!token) return;

    setIsValidatingToken(true);
    setAuthError(null);

    try {
      // Query YouTube Channels API with the token to verify permissions and fetch channel identity
      const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Access token rejected by YouTube API (HTTP ${res.status})`);
      }

      const data = await res.json();
      let channel: YouTubeChannelInfo = {
        title: 'My YouTube Channel',
        handle: '@YouTubeCreator',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        subscriberCount: 'Active Creator',
      };

      if (data.items && data.items.length > 0) {
        const ch = data.items[0];
        channel = {
          title: ch.snippet?.title || 'YouTube Channel',
          handle: ch.snippet?.customUrl ? `@${ch.snippet.customUrl.replace(/^@/, '')}` : (ch.snippet?.title || '@YouTubeCreator'),
          avatar: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || channel.avatar,
          subscriberCount: ch.statistics?.subscriberCount ? `${Number(ch.statistics.subscriberCount).toLocaleString()} Subscribers` : 'Active Channel',
        };
      }

      onConnected(token, channel);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to validate YouTube access token');
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Save Client ID and Secret to Server
  const handleSaveCredentials = async () => {
    if (!clientIdInput.trim()) return;
    setIsSavingKeys(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/youtube/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeClientId: clientIdInput.trim(),
          youtubeClientSecret: clientSecretInput.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save credentials');

      setKeysSuccess(true);
      await fetchAuthConfig();
      setTimeout(() => {
        setKeysSuccess(false);
        setActiveTab('oauth');
      }, 1000);
    } catch (err: any) {
      setAuthError(err.message || 'Error saving credentials');
    } finally {
      setIsSavingKeys(false);
    }
  };

  // Connect Sandbox / Verified Demo Channel
  const handleConnectDemo = () => {
    const demoChannel: YouTubeChannelInfo = {
      title: 'NepalAI Creator Studio',
      handle: '@NepalAI_Official',
      avatar: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=120&auto=format&fit=crop&q=80',
      subscriberCount: '128K Subscribers',
    };
    onConnected('demo_token', demoChannel);
    onClose();
  };

  const copyCallbackUrl = () => {
    if (authConfig?.redirectUri) {
      navigator.clipboard.writeText(authConfig.redirectUri);
      setCopiedCallback(true);
      setTimeout(() => setCopiedCallback(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-red-700/80 rounded-2xl max-w-lg w-full text-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-red-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/30 border border-red-500/50 text-red-400">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>YouTube Channel Integration</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold">
                  API v3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Authorize direct video upload and YouTube Shorts publishing
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

        {/* Channel Status Banner if already connected */}
        {isConnected && currentChannel && (
          <div className="bg-emerald-950/50 border-b border-emerald-800/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentChannel.avatar ? (
                <img
                  src={currentChannel.avatar}
                  alt={currentChannel.title}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/60"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold">
                  YT
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs">{currentChannel.title}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-emerald-300/90 font-mono">
                  {currentChannel.handle} • {currentChannel.subscriberCount}
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
        <div className="flex items-center border-b border-slate-800 bg-slate-950/70 px-4 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'border-red-500 text-red-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Google 1-Click OAuth</span>
          </button>

          <button
            onClick={() => setActiveTab('token')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'token'
                ? 'border-red-500 text-red-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Direct Access Token</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'keys'
                ? 'border-red-500 text-red-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Client Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'demo'
                ? 'border-red-500 text-red-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sandbox Test</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[60vh]">
          
          {/* Error Banner */}
          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Connection Issue</span>
                <p className="text-[11px] text-red-200/90 leading-relaxed">{authError}</p>
              </div>
            </div>
          )}

          {/* TAB 1: 1-CLICK GOOGLE OAUTH */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-2">
                    <span>Google Cloud OAuth Status:</span>
                  </span>
                  {authConfig?.configured ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 text-[10px] font-bold">
                      Awaiting Client ID
                    </span>
                  )}
                </div>

                {authConfig?.configured ? (
                  <div className="text-[11px] text-slate-400">
                    Client ID:{' '}
                    <span className="font-mono text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded">
                      {authConfig.clientIdMasked || 'Google Cloud Client ID Configured'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-[11px] text-amber-200/90 leading-relaxed">
                    Google OAuth Client ID is not yet saved in server config. You can configure it in the{' '}
                    <button
                      onClick={() => setActiveTab('keys')}
                      className="text-amber-400 underline font-bold hover:text-amber-300 cursor-pointer"
                    >
                      Client Credentials
                    </button>{' '}
                    tab, use a{' '}
                    <button
                      onClick={() => setActiveTab('token')}
                      className="text-amber-400 underline font-bold hover:text-amber-300 cursor-pointer"
                    >
                      Direct Access Token
                    </button>
                    , or test with{' '}
                    <button
                      onClick={() => setActiveTab('demo')}
                      className="text-amber-400 underline font-bold hover:text-amber-300 cursor-pointer"
                    >
                      Sandbox Mode
                    </button>
                    .
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={handleLaunchGoogleOAuth}
                  disabled={isWaitingPopup || isLoadingConfig || !authConfig?.configured}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-950 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isWaitingPopup ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Waiting for Google Authorization Popup...</span>
                    </>
                  ) : (
                    <>
                      <Youtube className="w-4 h-4" />
                      <span>Sign In with Google & Authorize YouTube Upload</span>
                    </>
                  )}
                </button>
              </div>

              {/* Redirect URI Info Box */}
              {authConfig?.redirectUri && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      Authorized Redirect URI (Google Cloud Console):
                    </span>
                    <button
                      onClick={copyCallbackUrl}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCallback ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 truncate select-all">
                    {authConfig.redirectUri}
                  </div>
                </div>
              )}

              {/* Error 403 / Access Denied Guided Resolution Card */}
              <div className="p-3.5 bg-slate-950/90 rounded-xl border border-red-800/40 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                  className="w-full flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-200 text-xs group-hover:text-white transition">
                      Fixing "Error 403: access_denied" in Google Cloud
                    </span>
                  </div>
                  {showTroubleshoot ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showTroubleshoot && (
                  <div className="space-y-2.5 pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                    <p className="text-amber-200/90">
                      Google OAuth throws <strong>Error 403: access_denied</strong> when your Google Cloud OAuth app is in <em>Testing</em> mode and your Google account is not added as an authorized Test User.
                    </p>

                    <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                      <li>
                        <strong>Add Your Email to Test Users:</strong> Open{' '}
                        <a
                          href="https://console.cloud.google.com/apis/credentials/consent"
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-400 underline hover:text-red-300 inline-flex items-center gap-0.5"
                        >
                          Google Cloud OAuth Consent Screen <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                        , scroll to <em>Test users</em>, click <strong>+ ADD USERS</strong>, enter your email (e.g. your creator/backup Gmail), and click <strong>Save</strong>.
                      </li>
                      <li>
                        <strong>Enable YouTube Data API v3:</strong> In{' '}
                        <a
                          href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-400 underline hover:text-red-300 inline-flex items-center gap-0.5"
                        >
                          API Library <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                        , make sure <em>YouTube Data API v3</em> is <strong>Enabled</strong> for project <code className="text-slate-200 bg-slate-900 px-1 rounded">431029366940</code>.
                      </li>
                      <li>
                        <strong>Verify Redirect URI:</strong> In Credentials &gt; OAuth 2.0 Client IDs, verify that the URI matches exactly: <code className="text-slate-200 bg-slate-900 px-1 rounded">{authConfig?.redirectUri || 'https://.../api/youtube/callback'}</code>.
                      </li>
                    </ol>

                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-slate-400">Want to connect immediately?</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('token')}
                        className="text-red-400 font-bold hover:underline cursor-pointer"
                      >
                        Use Direct Access Token →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT ACCESS TOKEN */}
          {activeTab === 'token' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                If you have an active OAuth 2.0 Bearer Access Token, paste it below to connect immediately without waiting for Google Cloud verification.
              </p>

              {/* Quick helper for Google OAuth Playground */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                  <span>How to generate an instant access token (1 minute):</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>
                    Go to{' '}
                    <a
                      href="https://developers.google.com/oauthplayground"
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-400 underline hover:text-red-300 inline-flex items-center gap-0.5"
                    >
                      Google OAuth 2.0 Playground <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                  </li>
                  <li>In Step 1, select <strong>YouTube Data API v3</strong> and check <code className="text-slate-200 bg-slate-900 px-1 rounded">https://www.googleapis.com/auth/youtube.upload</code></li>
                  <li>Click <strong>Authorize APIs</strong> and log in with your YouTube account</li>
                  <li>In Step 2, click <strong>Exchange authorization code for tokens</strong></li>
                  <li>Copy the <strong>Access token</strong> string (<code className="text-slate-200 bg-slate-900 px-1 rounded">ya29...</code>) and paste it below</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold text-[11px]">
                  Google OAuth 2.0 Access Token (Bearer)
                </label>
                <textarea
                  rows={3}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ya29.a0AfH6SM..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={handleConnectWithToken}
                disabled={isValidatingToken || !tokenInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isValidatingToken ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Channel with YouTube API...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validate & Connect YouTube Channel</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: CLIENT CREDENTIALS */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                Enter your Google Cloud OAuth 2.0 Client credentials to enable 1-click Google sign-in for all YouTube video uploads.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">YouTube Client ID</label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">YouTube Client Secret</label>
                  <input
                    type="password"
                    value={clientSecretInput}
                    onChange={(e) => setClientSecretInput(e.target.value)}
                    placeholder="GOCSPX-xxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveCredentials}
                disabled={isSavingKeys || !clientIdInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isSavingKeys ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving OAuth Credentials...</span>
                  </>
                ) : keysSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Credentials Saved!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save YouTube API Credentials</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 4: SANDBOX / DEMO MODE */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">Sandbox & Testing Mode</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Want to test the video rendering, timeline compilation, metadata generation, and YouTube Shorts publishing pipeline without configuring Google Cloud project credentials? Connect the verified NepalAI Creator channel for instant demonstration!
                </p>
              </div>

              <button
                onClick={handleConnectDemo}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Connect Verified NepalAI Creator Channel (Sandbox)</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>Scopes: youtube.upload, youtube.readonly</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
