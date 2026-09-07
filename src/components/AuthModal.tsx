import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, ShieldCheck, Key, Sparkles, AlertCircle } from 'lucide-react';
import { loginWithGoogle, loginAdmin, apiGetGoogleConfig } from '../lib/api';
import { UserSession, UserTrialQuota } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement | null, options: any) => void;
          prompt: (notification?: any) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'user' | 'admin';
  onLoginSuccess: (user: UserSession, trialUsage: UserTrialQuota) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'user',
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'google' | 'admin'>(defaultMode === 'admin' ? 'admin' : 'google');
  
  // Google OAuth configuration state
  const [clientId, setClientId] = useState<string>(() => localStorage.getItem('nepalai_google_client_id') || '');
  
  // Admin form state
  const [adminEmail, setAdminEmail] = useState('prakashsuvedi.backup@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Sync defaultMode when opened
  useEffect(() => {
    if (isOpen) {
      setTab(defaultMode === 'admin' ? 'admin' : 'google');
      setError(null);
      
      // Check server Google config
      apiGetGoogleConfig().then(cfg => {
        if (cfg.clientId && cfg.clientId.length > 5) {
          setClientId(cfg.clientId);
          localStorage.setItem('nepalai_google_client_id', cfg.clientId);
        }
      });
    }
  }, [isOpen, defaultMode]);

  // Initialize official Google Identity Services button whenever clientId is present & tab is google
  useEffect(() => {
    if (!isOpen || tab !== 'google' || !clientId) return;

    const setupGoogleGsi = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          const cleanClientId = clientId.trim().replace(/^["']|["']$/g, '');
          window.google.accounts.id.initialize({
            client_id: cleanClientId,
            callback: async (response: { credential?: string }) => {
              if (response.credential) {
                await verifyAndLogin({ credential: response.credential });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render the official Google Sign-in button
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 280,
          });
        } catch (e) {
          console.error('Google GSI initialization error:', e);
        }
      }
    };

    // If script already loaded, setup immediately, else wait
    if (window.google?.accounts?.id) {
      setupGoogleGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setupGoogleGsi();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isOpen, tab, clientId]);

  if (!isOpen) return null;

  // Process verified token with backend
  const verifyAndLogin = async (tokenPayload: { credential?: string; accessToken?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginWithGoogle(tokenPayload);
      onLoginSuccess(data.user, data.trialUsage);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google account verification failed. Real Google account required.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Google OAuth 2.0 Popup
  const handleLaunchGooglePopup = () => {
    setError(null);
    if (!clientId || clientId.length < 5) {
      setError('Google Sign-In is initializing or not configured. Please try again in a moment.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError('Google Identity Services library is still loading. Please wait a moment and retry.');
      return;
    }

    try {
      setLoading(true);
      const cleanClientId = clientId.trim().replace(/^["']|["']$/g, '');
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: cleanClientId,
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (response) => {
          if (response.error) {
            setLoading(false);
            setError(`Google Sign-In failed: ${response.error}`);
            return;
          }
          if (response.access_token) {
            await verifyAndLogin({ accessToken: response.access_token });
          } else {
            setLoading(false);
            setError('Google did not return a valid authentication token.');
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to initialize Google OAuth dialog.');
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginAdmin(adminEmail.trim(), adminPassword);
      onLoginSuccess(data.user, data.trialUsage);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Sign In to NepalAI Studio</h3>
          <p className="text-xs text-slate-400">
            Real Google Identity Verification • Sign in with your verified Google account to unlock AI Video, Image Engine, and Nepali Voiceover.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('google')}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'google'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Google Client OAuth</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'admin'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Gateway</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Client Login Tab */}
        {tab === 'google' && (
          <div className="space-y-4 pt-1">
            {/* Primary Action: Official Real Google Sign In */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleLaunchGooglePopup}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-3 border border-slate-300"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{loading ? 'Verifying with Google servers...' : 'Sign in with Google'}</span>
              </button>

              {/* Official Google GSI Render Container */}
              {clientId && (
                <div className="flex justify-center items-center py-1">
                  <div ref={googleBtnRef} id="google-signin-btn-container" className="min-h-[40px]" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-2 border-t border-slate-800">
              Sign in with your Google account to access your credits, saved creations, and projects across devices.
            </p>
          </div>
        )}

        {/* Admin Gateway Tab */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Administrator Role-Based Access</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Authorized Platform Owner gateway for <span className="font-mono text-amber-300">prakashsuvedi.backup@gmail.com</span>.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin Secret Password / Key</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-950/40 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying Admin Credentials...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login as Platform Administrator</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
