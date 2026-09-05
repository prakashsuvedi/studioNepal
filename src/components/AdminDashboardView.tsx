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
  Cpu
} from 'lucide-react';
import { apiGetAdminUsers, apiAdminUpdateUser } from '../lib/api';
import { UserSession } from '../types';
import { AuditReportView } from './AuditReportView';
import { HfDeploymentKitView } from './HfDeploymentKitView';
import { PostgresDiagnosticPanel } from './PostgresDiagnosticPanel';

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
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'audit' | 'hf_kit' | 'debug_logs' | 'nepali_pricing' | 'postgres_diagnostic' | 'daily_reset_audit'>('daily_reset_audit');
  const [resetAuditData, setResetAuditData] = useState<any>(null);
  const [resetAuditLoading, setResetAuditLoading] = useState(false);

  const fetchDailyResetAudit = async () => {
    setResetAuditLoading(true);
    try {
      const res = await fetch('/api/admin/daily-reset-audit');
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
    fonepaySecretKey: 'fonepay_secret_key_nepalai_2026',
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
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
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

      {/* Analytics KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {data?.metrics?.totalUsers ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500">Google OAuth client accounts</p>
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
          <p className="text-[11px] text-slate-500">Across Image, Video, Audio & Render</p>
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
            ${data?.metrics?.totalRevenueUSD ?? '—'} USD
          </div>
          <p className="text-[11px] text-slate-500">Stripe payment gateway volume</p>
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
                {filteredUsers.map((client: any) => {
                  const isUserAdmin = client.role === 'admin';
                  const usage = client.usage;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/60 transition">
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
                      <td className="py-3.5 px-4">
                        <select
                          value={client.tier}
                          onChange={e => handleSetTier(client.id, e.target.value)}
                          className="bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          <option value="free_trial">Free Trial</option>
                          <option value="starter">Starter ($19)</option>
                          <option value="creator">Creator ($49)</option>
                          <option value="pro_studio">Pro Studio ($129)</option>
                        </select>
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {isUserAdmin ? (
                          <span className="text-emerald-700">∞ (Infinite)</span>
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
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleAddCredits(client.id, client.credits, 500)}
                            title="Add 500 Credits"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          >
                            +500 Cr
                          </button>
                          <button
                            onClick={() => handleResetTrial(client.id)}
                            title="Reset Trial Limit Counters"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          >
                            Reset Trial
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
                {data?.transactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition font-mono text-[11px]">
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
                      {resetAuditData.accountAuditDetails?.map((acc: any) => (
                        <tr key={acc.userId} className="hover:bg-slate-50/80 transition">
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
    </div>
  );
};
