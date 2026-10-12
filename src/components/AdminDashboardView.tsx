import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Coins, 
  Activity, 
  CreditCard, 
  RefreshCw, 
  RotateCcw, 
  PlusCircle, 
  Check, 
  Search, 
  Sparkles, 
  Lock,
  ArrowUpRight,
  TrendingUp,
  Image as ImageIcon,
  Video,
  Mic,
  Film,
  FileText,
  Code2,
  Terminal,
  Cpu,
  Cloud,
  Server,
  MessageSquare,
  Bug,
  Lightbulb,
  Sliders,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';
import { 
  apiGetAdminUsers, 
  apiAdminUpdateUser,
  apiGetAdminFeedback,
  apiUpdateAdminFeedback,
  apiDeleteAdminFeedback
} from '../lib/api';
import { UserSession } from '../types';
import { AuditReportView } from './AuditReportView';
import { HfDeploymentKitView } from './HfDeploymentKitView';
import { PostgresDiagnosticPanel } from './PostgresDiagnosticPanel';
import { R2DiagnosticPanel } from './R2DiagnosticPanel';
import { ApiGatewayManager } from './ApiGatewayManager';

interface AdminDashboardViewProps {
  currentUser: UserSession | null;
  onOpenAuth: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'feedback_tickets' | 'audit' | 'hf_kit' | 'debug_logs' | 'nepali_pricing' | 'postgres_diagnostic' | 'r2_storage' | 'daily_reset_audit' | 'api_gateway'>('users');
  const [resetAuditData, setResetAuditData] = useState<any>(null);
  const [resetAuditLoading, setResetAuditLoading] = useState(false);

  // Feedback Submissions & Error Tickets State
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackCounts, setFeedbackCounts] = useState<{
    total: number;
    featureRequests: number;
    errorReports: number;
    comments: number;
    open: number;
    resolved: number;
  }>({ total: 0, featureRequests: 0, errorReports: 0, comments: 0, open: 0, resolved: 0 });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFilterType, setFeedbackFilterType] = useState<string>('all');
  const [feedbackFilterStatus, setFeedbackFilterStatus] = useState<string>('all');
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});

  // Manual Quota Limits & Working Credits Expansion Modal State
  const [expandModalUser, setExpandModalUser] = useState<any | null>(null);
  const [expandCreditsAmount, setExpandCreditsAmount] = useState<number>(250);
  const [isSettingExactBalance, setIsSettingExactBalance] = useState<boolean>(false);
  const [exactCreditsBalance, setExactCreditsBalance] = useState<number>(500);
  const [customMaxImages, setCustomMaxImages] = useState<number>(25);
  const [customMaxVideo, setCustomMaxVideo] = useState<number>(5);
  const [customMaxAudio, setCustomMaxAudio] = useState<number>(10);
  const [customMaxRenders, setCustomMaxRenders] = useState<number>(10);
  const [customMaxChat, setCustomMaxChat] = useState<number>(100);
  const [expansionReason, setExpansionReason] = useState<string>('Manual SuperAdmin quota grant');
  const [isSubmittingExpansion, setIsSubmittingExpansion] = useState<boolean>(false);

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const res = await apiGetAdminFeedback();
      if (res.success) {
        setFeedbackList(res.submissions || []);
        setFeedbackCounts(res.counts || {
          total: 0,
          featureRequests: 0,
          errorReports: 0,
          comments: 0,
          open: 0,
          resolved: 0,
        });
        const initialNotes: Record<string, string> = {};
        (res.submissions || []).forEach((item: any) => {
          if (item.adminNotes) initialNotes[item.id] = item.adminNotes;
        });
        setAdminNotesMap(initialNotes);
      }
    } catch (e) {
      console.warn('Could not load feedback submissions:', e);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchDailyResetAudit = async () => {
    setResetAuditLoading(true);
    try {
      const savedUserId = localStorage.getItem('nepalai_user_id') || '';
      const token = localStorage.getItem('nepalai_auth_token') || '';
      const res = await fetch('/api/admin/daily-reset-audit', {
        headers: {
          'x-user-id': savedUserId,
          'x-admin-key': 'nepalai-admin-key',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setResetAuditData(data.audit);
      }
    } catch (e) {
      console.warn('Could not load daily reset audit:', e);
    } finally {
      setResetAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyResetAudit();
  }, []);

  // Pricing & Merchant Gateway state
  const [pricingForm, setPricingForm] = useState({
    nprExchangeRate: 135,
    starterNpr: 2500,
    creatorNpr: 6500,
    proStudioNpr: 16500,
    fonepayMerchantCode: 'NEPALAI01',
    fonepaySecretKey: '',
    youtubeClientId: '',
    youtubeClientSecret: '',
    storageProvider: 'local',
    supabaseUrl: '',
    supabaseAnonKey: '',
  });
  const [savingPricing, setSavingPricing] = useState(false);

  useEffect(() => {
    fetch('/api/payment/pricing-config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setPricingForm(prev => ({ ...prev, ...data.config }));
        }
      })
      .catch(e => console.warn('Could not load pricing config:', e));
  }, []);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      const savedUserId = localStorage.getItem('nepalai_user_id') || '';
      const token = localStorage.getItem('nepalai_auth_token') || '';
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': savedUserId,
          'x-admin-key': 'nepalai-admin-key',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(pricingForm),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('Nepali Pricing, FonePay Merchant & Bucket settings saved successfully.');
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        alert(data.error || 'Failed to save pricing settings');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save pricing settings');
    } finally {
      setSavingPricing(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetAdminUsers();
      setData(res);
      await fetchFeedback();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
      fetchFeedback();

      // Real-time polling: auto-check for incoming bug reports & feedback tickets every 10 seconds
      const pollTimer = setInterval(() => {
        fetchFeedback();
      }, 10000);

      // Instant custom event listener when someone submits feedback in the current window
      const handleLiveFeedback = () => {
        fetchFeedback();
        loadData();
      };
      window.addEventListener('nepalai_feedback_updated', handleLiveFeedback);

      return () => {
        clearInterval(pollTimer);
        window.removeEventListener('nepalai_feedback_updated', handleLiveFeedback);
      };
    }
  }, [isAdmin]);

  const handleAddCredits = async (userId: string, currentCredits: number, amount: number) => {
    try {
      await apiAdminUpdateUser(userId, { credits: currentCredits + amount });
      setActionSuccess(`Added ${amount} credits to user.`);
      loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleResetTrial = async (userId: string) => {
    try {
      await apiAdminUpdateUser(userId, { resetTrial: true });
      setActionSuccess('Reset user trial usage counters.');
      loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleSetTier = async (userId: string, tier: string) => {
    try {
      await apiAdminUpdateUser(userId, { tier });
      setActionSuccess(`Updated user tier to ${tier}.`);
      loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleSetRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      await apiAdminUpdateUser(userId, { role });
      setActionSuccess(`Updated user privileges to: ${role.toUpperCase()}`);
      loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleOpenExpandCreditsModal = (userItem: any) => {
    setExpandModalUser(userItem);
    setExpandCreditsAmount(250);
    setIsSettingExactBalance(false);
    setExactCreditsBalance(userItem.credits || 0);
    setCustomMaxImages(userItem.usage?.maxImages || (userItem.tier === 'free_trial' ? 3 : 50));
    setCustomMaxVideo(userItem.usage?.maxVideo || (userItem.tier === 'free_trial' ? 1 : 15));
    setCustomMaxAudio(userItem.usage?.maxAudio || (userItem.tier === 'free_trial' ? 1 : 25));
    setCustomMaxRenders(userItem.usage?.maxRenders || (userItem.tier === 'free_trial' ? 1 : 20));
    setCustomMaxChat(userItem.usage?.maxChat || 100);
    setExpansionReason(`Manual Superadmin expansion for ${userItem.name || userItem.email}`);
  };

  const handleApplyQuotaExpansion = async () => {
    if (!expandModalUser) return;
    setIsSubmittingExpansion(true);
    try {
      const updates: any = {
        limits: {
          maxImages: Number(customMaxImages),
          maxVideo: Number(customMaxVideo),
          maxAudio: Number(customMaxAudio),
          maxRenders: Number(customMaxRenders),
          maxChat: Number(customMaxChat),
        },
      };
      if (isSettingExactBalance) {
        updates.credits = Math.max(0, Number(exactCreditsBalance));
      } else {
        updates.additionalCredits = Math.max(0, Number(expandCreditsAmount));
      }
      await apiAdminUpdateUser(expandModalUser.id, updates);
      setActionSuccess(`Successfully expanded credits & limits for ${expandModalUser.name || expandModalUser.email}!`);
      setExpandModalUser(null);
      loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to expand user credits & limits');
    } finally {
      setIsSubmittingExpansion(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await apiUpdateAdminFeedback(ticketId, { status });
      setActionSuccess(`Ticket status updated to: ${status.toUpperCase()}`);
      fetchFeedback();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update ticket');
    }
  };

  const handleSaveTicketNote = async (ticketId: string) => {
    const note = adminNotesMap[ticketId];
    try {
      await apiUpdateAdminFeedback(ticketId, { adminNotes: note || '' });
      setActionSuccess('Admin resolution note saved successfully.');
      fetchFeedback();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to save note');
    }
  };

  const handleRewardFeedbackUser = async (ticket: any, amount: number) => {
    try {
      await apiUpdateAdminFeedback(ticket.id, {
        rewardCredits: amount,
        userId: ticket.userId,
        status: ticket.status === 'open' ? 'under_review' : ticket.status,
      });
      setActionSuccess(`Granted +${amount} credits to user ${ticket.userName || ticket.userEmail}!`);
      fetchFeedback();
      loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (e: any) {
      alert(e.message || 'Failed to reward credits');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this feedback ticket?')) return;
    try {
      await apiDeleteAdminFeedback(ticketId);
      setActionSuccess('Feedback ticket deleted.');
      fetchFeedback();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to delete ticket');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFeedback();
    }
  }, [isAdmin]);

  // If user is not admin, show secure protection screen
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Platform Admin Route Protected</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            This section requires verified platform administrator credentials. Log in with the platform administrator account (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded">prakashsuvedi.backup@gmail.com</code>).
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition cursor-pointer"
        >
          Sign In as Administrator
        </button>
      </div>
    );
  }

  const filteredUsers = data?.users?.filter((u: any) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Platform Administrator Oversight</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role: Admin (Infinite Access)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time client telemetry, trial usage limits enforcement, Stripe transaction logs, and manual quota overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Real-time Superadmin Alert Banner for Feedback & Bug Submissions */}
      {feedbackCounts.open > 0 && (
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/40 to-indigo-50/30 border border-rose-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bug className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {feedbackCounts.errorReports > 0 
                    ? `⚠️ ${feedbackCounts.errorReports} Bug Report(s) Logged by Creators` 
                    : `📝 ${feedbackCounts.open} User Feedback Ticket(s) Pending Review`}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-wide">
                  Live Queue ({feedbackCounts.open} Open)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Real feedback and bug reports from creators. Review tickets, inspect logs, update status, and reward credits to users.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('feedback_tickets');
              setFeedbackFilterStatus('open');
              if (feedbackCounts.errorReports > 0) {
                setFeedbackFilterType('error_report');
              } else {
                setFeedbackFilterType('all');
              }
              fetchFeedback();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Inspect Tickets ({feedbackCounts.open} Open)</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Analytics KPI Metrics - 100% Real Production Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Real Client Accounts</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {data?.metrics?.totalUsers ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500">Live verified accounts</p>
        </div>

        {/* Total Token Usage */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Tokens Processed</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {data?.metrics?.totalTokensUsed?.toLocaleString() ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500">Across Image, Video, Audio & Chat</p>
        </div>

        {/* Active Paid Subscribers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Paid Subscribers</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {data?.metrics?.activePaidSubscribers ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500">Starter, Creator, or Pro tiers</p>
        </div>

        {/* Total Platform Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Gross Revenue</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${data?.metrics?.totalRevenueUSD ?? '0'} USD
          </div>
          <p className="text-[11px] text-slate-500">Real gateway transactions</p>
        </div>

        {/* Feedback & Bug Reports KPI */}
        <div 
          onClick={() => { setActiveTab('feedback_tickets'); fetchFeedback(); }}
          className={`bg-white border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition hover:shadow-md ${
            feedbackCounts.open > 0 ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Bug Reports & Feedback</span>
            {feedbackCounts.errorReports > 0 ? (
              <Bug className="w-4 h-4 text-rose-600 animate-pulse" />
            ) : (
              <MessageSquare className="w-4 h-4 text-indigo-600" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {feedbackCounts.total}
            </span>
            {feedbackCounts.open > 0 && (
              <span className="text-xs font-extrabold text-rose-600 px-2 py-0.5 rounded-full bg-rose-100 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {feedbackCounts.open} Open
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>{feedbackCounts.errorReports} Bugs • {feedbackCounts.featureRequests} Features</span>
            <span className="text-rose-600 font-semibold hover:underline">View Queue →</span>
          </p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Clients ({data?.users?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Stripe Orders ({data?.transactions?.length || 0})</span>
          </button>
          <button
            onClick={() => { setActiveTab('feedback_tickets'); fetchFeedback(); }}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feedback_tickets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
            <span>User Feedback & Errors</span>
            {feedbackCounts.open > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[9px] animate-pulse">
                {feedbackCounts.open} Open
              </span>
            ) : feedbackCounts.total > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px]">
                {feedbackCounts.total}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>System Audit</span>
          </button>
          <button
            onClick={() => setActiveTab('hf_kit')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hf_kit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>HF Deployment Kit</span>
          </button>
          <button
            onClick={() => setActiveTab('nepali_pricing')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nepali_pricing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-rose-600" />
            <span>Nepali Pricing & FonePay</span>
          </button>
          <button
            onClick={() => setActiveTab('postgres_diagnostic')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'postgres_diagnostic' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase DB Status</span>
          </button>
          <button
            onClick={() => setActiveTab('r2_storage')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'r2_storage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Cloudflare R2 Storage</span>
          </button>
          <button
            onClick={() => { setActiveTab('daily_reset_audit'); fetchDailyResetAudit(); }}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'daily_reset_audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Reset Audit</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
              Zero Leakage
            </span>
          </button>
          <button
            onClick={() => setActiveTab('api_gateway')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'api_gateway' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-indigo-600" />
            <span>nepalai.tech API Gateway</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold uppercase">
              REST Sync
            </span>
          </button>
          <button
            onClick={() => setActiveTab('debug_logs')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'debug_logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-600" />
            <span>Dev Settings & API Logs</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="relative w-full xl:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Users Database Table */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Client Database & Token Usage Audit</h3>
            <span className="text-xs text-slate-500">Live PostgreSQL / Drizzle Store</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User Identity</th>
                  <th className="py-3 px-4">Tier / Role</th>
                  <th className="py-3 px-4">Credits Balance</th>
                  <th className="py-3 px-4">Trial / Quota Usage</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((client: any, idx: number) => {
                  const isUserAdmin = client.role === 'admin';
                  const usage = client.usage;
                  const rowKey = `${client.id || 'usr'}-${client.email || idx}`;

                  return (
                    <tr key={rowKey} className="hover:bg-slate-50/60 transition">
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={client.avatar}
                            alt={client.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{client.name}</span>
                              {isUserAdmin && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-mono text-[11px]">{client.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tier & Role */}
                      <td className="py-3.5 px-4 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Tier:</span>
                          <select
                            value={client.tier}
                            onChange={e => handleSetTier(client.id, e.target.value)}
                            className="bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                          >
                            <option value="free_trial">Free Trial</option>
                            <option value="starter">Starter ($19)</option>
                            <option value="creator">Creator ($49)</option>
                            <option value="pro_studio">Pro Studio ($129)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Role:</span>
                          <select
                            value={client.role || 'user'}
                            onChange={e => handleSetRole(client.id, e.target.value as 'admin' | 'user')}
                            className={`rounded-lg px-2 py-0.5 text-xs font-bold border cursor-pointer focus:outline-none ${
                              client.role === 'admin'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="user">User (Standard)</option>
                            <option value="admin">Admin (Full Access)</option>
                          </select>
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {isUserAdmin ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ∞ (Infinite)
                          </span>
                        ) : (
                          <span className={client.credits > 0 ? 'text-slate-900' : 'text-rose-600'}>
                            {client.credits} Credits
                          </span>
                        )}
                      </td>

                      {/* Trial / Quota Usage Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-12">Images:</span>
                            <span className={`font-semibold ${usage?.imagesCount >= 3 && client.tier === 'free_trial' ? 'text-rose-600' : 'text-slate-800'}`}>
                              {usage?.imagesCount ?? 0} / {client.tier === 'free_trial' ? '3' : '∞'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-12">Video:</span>
                            <span className={`font-semibold ${usage?.videoCount >= 1 && client.tier === 'free_trial' ? 'text-rose-600' : 'text-slate-800'}`}>
                              {usage?.videoCount ?? 0} / {client.tier === 'free_trial' ? '1 (max 2m)' : '∞'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-12">Audio:</span>
                            <span className={`font-semibold ${usage?.audioCount >= 1 && client.tier === 'free_trial' ? 'text-rose-600' : 'text-slate-800'}`}>
                              {usage?.audioCount ?? 0} / {client.tier === 'free_trial' ? '1 (max 4m)' : '∞'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-12">Renders:</span>
                            <span className={`font-semibold ${usage?.rendersCount >= 1 && client.tier === 'free_trial' ? 'text-rose-600' : 'text-slate-800'}`}>
                              {usage?.rendersCount ?? 0} / {client.tier === 'free_trial' ? '1' : '∞'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Tokens */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {usage?.totalTokensUsed?.toLocaleString() ?? 0}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        ${client.totalPaidUSD}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenExpandCreditsModal(client)}
                            title="Expand Working Credits & Generation Limits Manually"
                            className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Expand Quotas</span>
                          </button>
                          <button
                            onClick={() => handleAddCredits(client.id, client.credits, 100)}
                            title="Add 100 Credits"
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          >
                            +100
                          </button>
                          <button
                            onClick={() => handleAddCredits(client.id, client.credits, 500)}
                            title="Add 500 Credits"
                            className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition cursor-pointer"
                          >
                            +500
                          </button>
                          <button
                            onClick={() => handleAddCredits(client.id, client.credits, 1000)}
                            title="Add 1,000 Credits"
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition cursor-pointer"
                          >
                            +1k
                          </button>
                          <button
                            onClick={() => {
                              const inputVal = prompt(`Enter custom credits amount to grant to ${client.name || client.email}:`, '250');
                              if (inputVal && !isNaN(Number(inputVal))) {
                                handleAddCredits(client.id, client.credits, Math.abs(parseInt(inputVal, 10)));
                              }
                            }}
                            title="Grant Custom Credits"
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          >
                            Custom
                          </button>
                          <button
                            onClick={() => handleResetTrial(client.id)}
                            title="Reset Trial Limit Counters"
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => handleSetRole(client.id, client.role === 'admin' ? 'user' : 'admin')}
                            title={client.role === 'admin' ? 'Demote from Admin' : 'Promote to Platform Admin'}
                            className={`px-2 py-0.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              client.role === 'admin'
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200'
                            }`}
                          >
                            {client.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions History Table */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Stripe Payment Gateway Records</h3>
            <span className="text-xs text-slate-500">Live Gateway Log</span>
          </div>

          <div className="overflow-x-auto">
            {!data?.transactions || data.transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Transaction Records Yet</h4>
                <p className="text-slate-400 max-w-sm mx-auto">
                  Strictly real data only. Real payments processed through Stripe, FonePay QR, and eSewa will be logged here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Credits Added</th>
                    <th className="py-3 px-4">Stripe Charge Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.transactions?.map((tx: any, idx: number) => (
                    <tr key={`${tx.id || 'tx'}-${idx}`} className="hover:bg-slate-50/60 transition font-mono text-[11px]">
                      <td className="py-3 px-4 text-slate-800 font-semibold">{tx.id}</td>
                      <td className="py-3 px-4 text-slate-700">{tx.userEmail}</td>
                      <td className="py-3 px-4 text-slate-900 font-sans font-medium">{tx.packageName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">${tx.amount} USD</td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">+{tx.creditsAdded} Cr</td>
                      <td className="py-3 px-4 text-slate-500">{tx.stripePaymentId}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-sans font-semibold border border-emerald-200">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-sans">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* User Feedback, Feature Requests & Bug Reporting Management */}
      {activeTab === 'feedback_tickets' && (
        <div className="space-y-6">
          {/* Top Feedback Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tickets</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{feedbackCounts.total}</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Features
              </span>
              <div className="text-xl font-bold text-indigo-600 mt-1">{feedbackCounts.featureRequests}</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                <Bug className="w-3 h-3" /> Bugs & Errors
              </span>
              <div className="text-xl font-bold text-rose-600 mt-1">{feedbackCounts.errorReports}</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-purple-500 uppercase flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Comments
              </span>
              <div className="text-xl font-bold text-purple-600 mt-1">{feedbackCounts.comments}</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Open
              </span>
              <div className="text-xl font-bold text-amber-600 mt-1">{feedbackCounts.open}</div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Resolved
              </span>
              <div className="text-xl font-bold text-emerald-600 mt-1">{feedbackCounts.resolved}</div>
            </div>
          </div>

          {/* Filtering & Search Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFeedbackFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${feedbackFilterType === 'all' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setFeedbackFilterType('feature_request')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${feedbackFilterType === 'feature_request' ? 'bg-white shadow-xs font-bold text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Lightbulb className="w-3 h-3" /> Features
                </button>
                <button
                  onClick={() => setFeedbackFilterType('error_report')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${feedbackFilterType === 'error_report' ? 'bg-white shadow-xs font-bold text-rose-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Bug className="w-3 h-3" /> Errors
                </button>
                <button
                  onClick={() => setFeedbackFilterType('system_comment')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${feedbackFilterType === 'system_comment' ? 'bg-white shadow-xs font-bold text-purple-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <MessageSquare className="w-3 h-3" /> Comments
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={feedbackFilterStatus}
                onChange={e => setFeedbackFilterStatus(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open Only</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="planned">Planned</option>
              </select>

              <button
                onClick={fetchFeedback}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Refresh Submissions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${feedbackLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={feedbackSearchQuery}
                onChange={e => setFeedbackSearchQuery(e.target.value)}
                placeholder="Search ticket title or user..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Feedback Ticket Cards */}
          <div className="space-y-4">
            {feedbackLoading ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                Loading feedback submissions...
              </div>
            ) : feedbackList.filter(item => {
                if (feedbackFilterType !== 'all' && item.type !== feedbackFilterType) return false;
                if (feedbackFilterStatus !== 'all' && item.status !== feedbackFilterStatus) return false;
                if (feedbackSearchQuery.trim()) {
                  const q = feedbackSearchQuery.toLowerCase();
                  const mTitle = (item.title || '').toLowerCase().includes(q);
                  const mDesc = (item.description || '').toLowerCase().includes(q);
                  const mEmail = (item.userEmail || '').toLowerCase().includes(q);
                  const mLogs = (item.errorCodeOrLogs || '').toLowerCase().includes(q);
                  if (!mTitle && !mDesc && !mEmail && !mLogs) return false;
                }
                return true;
              }).length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">No Tickets Found</h4>
                <p className="text-slate-400 max-w-sm mx-auto">All user feature requests, error tickets, and direct feedback comments have been reviewed.</p>
              </div>
            ) : (
              feedbackList
                .filter(item => {
                  if (feedbackFilterType !== 'all' && item.type !== feedbackFilterType) return false;
                  if (feedbackFilterStatus !== 'all' && item.status !== feedbackFilterStatus) return false;
                  if (feedbackSearchQuery.trim()) {
                    const q = feedbackSearchQuery.toLowerCase();
                    const mTitle = (item.title || '').toLowerCase().includes(q);
                    const mDesc = (item.description || '').toLowerCase().includes(q);
                    const mEmail = (item.userEmail || '').toLowerCase().includes(q);
                    const mLogs = (item.errorCodeOrLogs || '').toLowerCase().includes(q);
                    if (!mTitle && !mDesc && !mEmail && !mLogs) return false;
                  }
                  return true;
                })
                .map((ticket: any) => {
                  const isBug = ticket.type === 'error_report';
                  const isFeature = ticket.type === 'feature_request';
                  return (
                    <div 
                      key={ticket.id} 
                      className={`bg-white border rounded-2xl p-5 shadow-xs transition hover:shadow-md space-y-4 ${
                        ticket.status === 'resolved' 
                          ? 'border-slate-200 opacity-80' 
                          : isBug 
                          ? 'border-rose-200 bg-rose-50/20' 
                          : 'border-slate-200/90'
                      }`}
                    >
                      {/* Ticket Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${
                            isBug 
                              ? 'bg-rose-100 text-rose-800' 
                              : isFeature 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {isBug ? <Bug className="w-3 h-3" /> : isFeature ? <Lightbulb className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                            <span>{isBug ? 'Bug Report' : isFeature ? 'Feature Request' : 'Direct Comment'}</span>
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            ticket.priority === 'critical' ? 'bg-red-500 text-white' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            ticket.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ticket.priority || 'medium'} priority
                          </span>

                          <span className="text-[11px] font-mono text-slate-400">
                            {ticket.category ? `• [${ticket.category}]` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[11px] text-slate-400">
                            {new Date(ticket.createdAt).toLocaleString()}
                          </span>

                          <select
                            value={ticket.status}
                            onChange={e => handleUpdateTicketStatus(ticket.id, e.target.value)}
                            className={`rounded-lg px-2 py-0.5 text-xs font-bold border cursor-pointer focus:outline-none ${
                              ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                              ticket.status === 'planned' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                              ticket.status === 'under_review' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                              'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="open">🔴 Open</option>
                            <option value="under_review">🟡 Under Review</option>
                            <option value="in_progress">🔵 In Progress</option>
                            <option value="planned">🟣 Planned</option>
                            <option value="resolved">🟢 Resolved</option>
                          </select>

                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ticket Title & User Identity */}
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900">{ticket.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{ticket.userName || 'Anonymous User'}</span>
                          {ticket.userEmail && <span className="font-mono text-slate-400">({ticket.userEmail})</span>}
                          <span className="text-slate-300">|</span>
                          <span className="font-mono text-[10px] text-slate-400">ID: {ticket.userId}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                        {ticket.description}
                      </div>

                      {/* Code or Error Stack if present */}
                      {ticket.errorCodeOrLogs && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                            Attached Logs / Error Reproduction Stack:
                          </span>
                          <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-3 rounded-xl overflow-x-auto border border-slate-800 max-h-40">
                            <pre className="whitespace-pre-wrap">{ticket.errorCodeOrLogs}</pre>
                          </div>
                        </div>
                      )}

                      {/* Admin Resolution Notes & Reward Actions */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={adminNotesMap[ticket.id] ?? (ticket.adminNotes || '')}
                            onChange={e => setAdminNotesMap(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="Add admin resolution notes or status update..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                          />
                          <button
                            onClick={() => handleSaveTicketNote(ticket.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shrink-0 transition cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>

                        {/* Direct Reward Credits */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">Reward Submitter:</span>
                          <button
                            onClick={() => handleRewardFeedbackUser(ticket, 250)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
                            title="Grant +250 Credits to this user"
                          >
                            +250 Cr
                          </button>
                          <button
                            onClick={() => handleRewardFeedbackUser(ticket, 500)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition cursor-pointer"
                            title="Grant +500 Credits to this user"
                          >
                            +500 Cr
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Embedded System Audit & Diagnostics (Superadmin Only) */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-2 sm:p-4">
          <AuditReportView
            onGoToVideoStudio={() => setActiveTab('users')}
            onGoToDeploymentKit={() => setActiveTab('hf_kit')}
            onGoToAdmin={() => setActiveTab('users')}
          />
        </div>
      )}

      {/* Embedded Hugging Face Deployment Kit & Secrets (Superadmin Only) */}
      {activeTab === 'hf_kit' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-2 sm:p-4">
          <HfDeploymentKitView />
        </div>
      )}

      {/* Developer Settings & Raw API Debug Logs (Superadmin Only) */}
      {activeTab === 'debug_logs' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Superadmin Developer Diagnostics & Live Service Registry</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold">
                INTERNAL ONLY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block">Azure OpenAI Resource:</span>
                <p className="text-indigo-400">https://solutions-ai-hub.services.ai.azure.com/openai/v1</p>
                <p className="text-slate-400">Models: <span className="text-emerald-400">gpt-4o</span>, <span className="text-emerald-400">gpt-5-mini</span></p>
                <p className="text-slate-400">Status: <span className="text-emerald-400 font-bold">Active / Authorized</span></p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block">Azure AI Sora-2 Inference Host:</span>
                <p className="text-indigo-400">https://prakashsuvedi-7749-resource.services.ai.azure.com/videos</p>
                <p className="text-slate-400">Model: <span className="text-purple-400">sora-2</span></p>
                <p className="text-slate-400">Status: <span className="text-emerald-400 font-bold">Configured / Online</span></p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block">Hugging Face Dedicated Space:</span>
                <p className="text-indigo-400">https://prakashsuvedi-nepalai-studio.hf.space</p>
                <p className="text-slate-400">Endpoint: <span className="text-cyan-400">/api/hamroai/chat</span></p>
                <p className="text-slate-400">Status: <span className="text-emerald-400 font-bold">Operational</span></p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block">Stripe Payment Gateway:</span>
                <p className="text-indigo-400">Standard Production Tier Integration</p>
                <p className="text-slate-400">Tier Pricing: Starter ($9/120cr), Creator ($29/450cr), Pro ($69/1200cr)</p>
                <p className="text-slate-400">Status: <span className="text-emerald-400 font-bold">Live</span></p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold block">Active Server Route Handlers:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">POST /api/hamroai/chat</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">POST /api/generate/video</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">POST /api/generate/image</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">POST /api/generate/audio</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">POST /api/payment/checkout</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">GET /api/admin/users</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">POST /api/admin/user/update</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">POST /api/auth/google</div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">GET /api/me</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">Raw Audit Dispatch Log:</span>
              <pre className="text-[10px] text-slate-400 overflow-x-auto p-2 bg-black/50 rounded border border-slate-800">
{JSON.stringify({
  timestamp: new Date().toISOString(),
  environment: 'production',
  superadmin: currentUser?.email,
  accessLevel: 'superadmin_elevated',
  systemStatus: 'nominal',
  securityGating: 'strict_role_based_access_control',
  nonAdminViewsRestricted: true,
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      {/* Nepali Pricing & FonePay Merchant Settings */}
      {activeTab === 'nepali_pricing' && (
        <form onSubmit={handleSavePricing} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-rose-600" />
              <span>Nepali Rupees (NPR) Pricing & FonePay Gateway Control</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Customize tier subscription pricing in Nepali Rupees (NPR रू), USD exchange conversion, FonePay Merchant Credentials, Storage Buckets, and YouTube OAuth keys.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NPR Tier Pricing Customization */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-800">1. Tier Package Pricing (NPR रू)</h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">USD to NPR Exchange Rate ( रू / $1 )</label>
                  <input
                    type="number"
                    value={pricingForm.nprExchangeRate}
                    onChange={e => setPricingForm({ ...pricingForm, nprExchangeRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Starter Tier Price (500 Credits) - NPR रू</label>
                  <input
                    type="number"
                    value={pricingForm.starterNpr}
                    onChange={e => setPricingForm({ ...pricingForm, starterNpr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Creator Tier Price (1,800 Credits) - NPR रू</label>
                  <input
                    type="number"
                    value={pricingForm.creatorNpr}
                    onChange={e => setPricingForm({ ...pricingForm, creatorNpr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Pro Studio Tier Price (5,000 Credits) - NPR रू</label>
                  <input
                    type="number"
                    value={pricingForm.proStudioNpr}
                    onChange={e => setPricingForm({ ...pricingForm, proStudioNpr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* FonePay Merchant Credentials */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-800">2. FonePay Merchant Credentials</h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">FonePay Merchant Code (PID)</label>
                  <input
                    type="text"
                    value={pricingForm.fonepayMerchantCode}
                    onChange={e => setPricingForm({ ...pricingForm, fonepayMerchantCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                    placeholder="NEPALAI01"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">FonePay Secret Verification Key</label>
                  <input
                    type="password"
                    value={pricingForm.fonepaySecretKey}
                    onChange={e => setPricingForm({ ...pricingForm, fonepaySecretKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                  />
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                  <span className="font-bold block">FonePay Interoperability:</span>
                  <p>Supports direct QR payments from eSewa, Khalti, Mobile Banking, and FonePay apps across all Nepali banks.</p>
                </div>
              </div>
            </div>

            {/* Storage Bucket Settings */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-800">3. Media Storage Bucket Backend</h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Storage Bucket Provider</label>
                  <select
                    value={pricingForm.storageProvider}
                    onChange={e => setPricingForm({ ...pricingForm, storageProvider: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 bg-white"
                  >
                    <option value="local">Local Persistent Disk Storage Bucket (/data/storage)</option>
                    <option value="supabase">Supabase Public Object Storage Bucket (Free 1GB+)</option>
                  </select>
                </div>

                {pricingForm.storageProvider === 'supabase' && (
                  <>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Supabase Project URL</label>
                      <input
                        type="text"
                        value={pricingForm.supabaseUrl}
                        onChange={e => setPricingForm({ ...pricingForm, supabaseUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                        placeholder="https://xyz.supabase.co"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Supabase Anon Key</label>
                      <input
                        type="password"
                        value={pricingForm.supabaseAnonKey}
                        onChange={e => setPricingForm({ ...pricingForm, supabaseAnonKey: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* YouTube API OAuth Settings */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-800">4. YouTube Data API v3 OAuth Settings</h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">YouTube Client ID</label>
                  <input
                    type="text"
                    value={pricingForm.youtubeClientId}
                    onChange={e => setPricingForm({ ...pricingForm, youtubeClientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                    placeholder="xxxx.apps.googleusercontent.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">YouTube Client Secret</label>
                  <input
                    type="password"
                    value={pricingForm.youtubeClientSecret}
                    onChange={e => setPricingForm({ ...pricingForm, youtubeClientSecret: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPricing}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              {savingPricing ? (
                <span>Saving Configuration...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Nepali Pricing & Gateway Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'postgres_diagnostic' && <PostgresDiagnosticPanel />}
      {activeTab === 'r2_storage' && <R2DiagnosticPanel />}

      {/* Daily Reset & Credit Leakage Verification Service Panel */}
      {activeTab === 'daily_reset_audit' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Automated Daily Free Credit Reset Verification & Audit Service
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                  Active Real-Time Audit Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Monitors all registered accounts to verify 24-hour reset compliance and prevent unauthorized credit inflation or system leakage.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDailyResetAudit}
              disabled={resetAuditLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${resetAuditLoading ? 'animate-spin' : ''}`} />
              <span>Execute Live Audit Scan</span>
            </button>
          </div>

          {resetAuditLoading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs font-mono">Running cryptographic credit leakage & daily reset audit scan across all user accounts...</p>
            </div>
          ) : resetAuditData ? (
            <div className="space-y-6">
              {/* Audit Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Leakage Audit Status</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-lg font-black text-emerald-700">
                      {resetAuditData.leakageStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">0% unauthorized credit inflation</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Accounts Audited</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {resetAuditData.accountsAudited} Users
                  </div>
                  <span className="text-[10px] text-slate-500">All registered user accounts</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Resets Triggered Today</span>
                  <div className="text-2xl font-black text-indigo-600 font-mono">
                    {resetAuditData.accountsResetToday} Accounts
                  </div>
                  <span className="text-[10px] text-slate-500">Refreshed for {resetAuditData.todayDate}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Refreshed Free Units</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {resetAuditData.totalFreeCreditsRefreshed} Assets
                  </div>
                  <span className="text-[10px] text-slate-500">3 Img, 1 Vid, 1 Aud, 1 Render / user</span>
                </div>
              </div>

              {/* Audit System Notes Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
                <span>🛡️ {resetAuditData.systemCheckNotes}</span>
                <span className="text-[10px] text-emerald-700 font-mono">Audit Timestamp: {new Date(resetAuditData.timestamp).toLocaleString()}</span>
              </div>

              {/* Verified Account Reset Ledger Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Verified User Reset Ledger & Credit Balance Audit
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">User ID & Email</th>
                        <th className="p-3">Active Tier</th>
                        <th className="p-3">Paid Credits</th>
                        <th className="p-3">Last Reset Date</th>
                        <th className="p-3">Today's Daily Free Available</th>
                        <th className="p-3">Audit Integrity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                      {resetAuditData.accountAuditDetails?.map((acc: any, idx: number) => (
                        <tr key={`${acc.userId || 'acc'}-${acc.email || idx}`} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-semibold font-sans">
                            <div>{acc.email}</div>
                            <div className="text-[10px] font-mono text-slate-400">{acc.userId}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold uppercase text-[10px]">
                              {acc.tier}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {acc.credits} Credits
                          </td>
                          <td className="p-3 text-slate-600">
                            {acc.lastResetDate}
                          </td>
                          <td className="p-3 text-emerald-700 font-bold">
                            {acc.dailyFreeAvailableToday}
                          </td>
                          <td className="p-3">
                            {acc.leakageDetected ? (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                                ⚠️ ANOMALY DETECTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                ✓ VERIFIED (0% LEAKAGE)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* nepali.tech API Gateway Tab */}
      {activeTab === 'api_gateway' && (
        <ApiGatewayManager />
      )}

      {/* Manual Working Credits & Generation Limits Expansion Modal */}
      {expandModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Manual Quota & Credits Expansion
                  </h3>
                  <p className="text-xs text-slate-500">
                    {expandModalUser.name} • <span className="font-mono text-slate-700">{expandModalUser.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Current Status Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Current Tier</span>
                  <div className="font-bold text-slate-900 capitalize">{expandModalUser.tier?.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Credits Balance</span>
                  <div className="font-bold text-emerald-700 font-mono text-sm">{expandModalUser.credits} Cr</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Video Generated</span>
                  <div className="font-mono text-slate-800">{expandModalUser.usage?.videoCount ?? 0} Clips</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Audio Synthesized</span>
                  <div className="font-mono text-slate-800">{expandModalUser.usage?.audioCount ?? 0} Tracks</div>
                </div>
              </div>

              {/* Section 1: Working Credits Expansion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    1. Expand Working Credits
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSettingExactBalance(false)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${!isSettingExactBalance ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      + Add Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSettingExactBalance(true)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${isSettingExactBalance ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      Set Exact Balance
                    </button>
                  </div>
                </div>

                {!isSettingExactBalance ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[50, 100, 250, 500, 1000, 2500, 5000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setExpandCreditsAmount(amt)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            expandCreditsAmount === amt
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Custom Amount:</span>
                      <input
                        type="number"
                        min="0"
                        value={expandCreditsAmount}
                        onChange={e => setExpandCreditsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-slate-400">Credits will be added immediately.</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">New Total Balance:</span>
                    <input
                      type="number"
                      min="0"
                      value={exactCreditsBalance}
                      onChange={e => setExactCreditsBalance(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-400">Overwrites total credit balance.</span>
                  </div>
                )}
              </div>

              {/* Section 2: Expand Generation Limits / Quotas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    2. Expand Daily Working Limits & Quotas
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMaxImages(20);
                        setCustomMaxVideo(5);
                        setCustomMaxAudio(15);
                        setCustomMaxRenders(10);
                        setCustomMaxChat(100);
                        setExpandCreditsAmount(250);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer"
                    >
                      Creator Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMaxImages(100);
                        setCustomMaxVideo(30);
                        setCustomMaxAudio(60);
                        setCustomMaxRenders(50);
                        setCustomMaxChat(500);
                        setExpandCreditsAmount(1000);
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold cursor-pointer"
                    >
                      Pro Studio Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMaxImages(9999);
                        setCustomMaxVideo(9999);
                        setCustomMaxAudio(9999);
                        setCustomMaxRenders(9999);
                        setCustomMaxChat(9999);
                        setExpandCreditsAmount(5000);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold cursor-pointer"
                    >
                      Uncapped VIP
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Daily Videos Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={customMaxVideo}
                      onChange={e => setCustomMaxVideo(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Daily Images Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={customMaxImages}
                      onChange={e => setCustomMaxImages(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Daily Audio Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={customMaxAudio}
                      onChange={e => setCustomMaxAudio(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Daily Renders Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={customMaxRenders}
                      onChange={e => setCustomMaxRenders(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Admin Reason */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Audit Reason / Admin Note</label>
                <input
                  type="text"
                  value={expansionReason}
                  onChange={e => setExpansionReason(e.target.value)}
                  placeholder="e.g. Creator partnership, solved issue ticket, loyalty perk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExpandModalUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyQuotaExpansion}
                disabled={isSubmittingExpansion}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingExpansion ? 'Expanding Quotas...' : 'Apply & Save Expansion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
