import React, { useState, useEffect } from 'react';
import { X, Zap, CheckCircle2, ShieldCheck, CreditCard, Sparkles, QrCode, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiCheckoutStripe } from '../lib/api';
import { UserSession, UserTrialQuota, StripeTransactionItem } from '../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  trialUsage: UserTrialQuota | null;
  triggerReason?: string;
  onPaymentSuccess: (user: UserSession, transaction: StripeTransactionItem) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  user,
  trialUsage,
  triggerReason,
  onPaymentSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio'>('sasta_50_npr');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'fonepay'>('fonepay');
  const [currency, setCurrency] = useState<'USD' | 'NPR'>('NPR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FonePay Gateway state
  const [fonepayDetails, setFonepayDetails] = useState<{
    prn: string;
    amountNpr: number;
    qrImageUrl: string;
    merchantCode: string;
  } | null>(null);
  const [verifyingFonepay, setVerifyingFonepay] = useState(false);

  useEffect(() => {
    if (isOpen && paymentMethod === 'fonepay') {
      fetchFonepayDetails();
    }
  }, [isOpen, selectedPlan, paymentMethod]);

  const fetchFonepayDetails = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/payment/fonepay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, packageId: selectedPlan }),
      });
      const data = await res.json();
      if (data.success) {
        setFonepayDetails(data.paymentDetails);
      }
    } catch (e) {
      console.warn('FonePay init failed:', e);
    }
  };

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiCheckoutStripe(user.id, selectedPlan);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      onPaymentSuccess(data.user, data.transaction);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFonepay = async () => {
    if (!user || !fonepayDetails) return;
    setVerifyingFonepay(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/fonepay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          packageId: selectedPlan,
          prn: fonepayDetails.prn,
          traceId: `fonepay_tx_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
        onPaymentSuccess(data.user, data.transaction);
        onClose();
      } else {
        setError(data.error || 'FonePay payment verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setVerifyingFonepay(false);
    }
  };

  const pricesNpr = {
    sasta_50_npr: '50',
    starter: '2,500',
    creator: '6,500',
    pro_studio: '16,500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 space-y-6 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning / Paywall Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white">Upgrade to NepalAI Studio Pro</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            {triggerReason || 'Your free trial quota has been reached. Select a package to unlock unlimited generation credits and high-priority queues.'}
          </p>

          {/* Currency Toggle */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-xs text-slate-400">Currency:</span>
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { setCurrency('NPR'); setPaymentMethod('fonepay'); }}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  currency === 'NPR' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇳🇵 NPR (रू)
              </button>
              <button
                type="button"
                onClick={() => { setCurrency('USD'); setPaymentMethod('stripe'); }}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  currency === 'USD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇺🇸 USD ($)
              </button>
            </div>
          </div>
        </div>

        {/* Current Usage Status Bar & Daily 24h Reset Banner */}
        {trialUsage && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Daily Free Allowance (Resets Every 24 Hours at Midnight)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Today's Usage Counter
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Daily Images</span>
                <span className={`font-mono font-bold ${trialUsage.imagesCount >= trialUsage.maxImages ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {trialUsage.imagesCount}/{trialUsage.maxImages}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Daily Video</span>
                <span className={`font-mono font-bold ${trialUsage.videoCount >= trialUsage.maxVideo ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {trialUsage.videoCount}/{trialUsage.maxVideo}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Daily Audio</span>
                <span className={`font-mono font-bold ${trialUsage.audioCount >= trialUsage.maxAudio ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {trialUsage.audioCount}/{trialUsage.maxAudio}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Daily Render</span>
                <span className={`font-mono font-bold ${trialUsage.rendersCount >= trialUsage.maxRenders ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {trialUsage.rendersCount}/{trialUsage.maxRenders}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              💡 <strong className="text-white">How it works:</strong> Every user receives the Daily Free Allowance above, which <strong className="text-emerald-400">resets every 24 hours</strong>. When you buy a package, your purchased credits (e.g. 500, 1,800, or 5,000) are used <strong className="text-amber-400">ONLY after</strong> today's free quota is exhausted!
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Sasta Pass (50 NPR) */}
          <button
            type="button"
            onClick={() => setSelectedPlan('sasta_50_npr')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 relative cursor-pointer ${
              selectedPlan === 'sasta_50_npr'
                ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
              Sasta Pass
            </span>
            <div>
              <span className="text-xs font-bold text-amber-400">Micro-Pack</span>
              <div className="mt-1">
                <span className="text-xl font-extrabold text-white">
                  {currency === 'NPR' ? `रू 50` : '$0.38'}
                </span>
                <span className="text-[10px] text-slate-500"> /pass</span>
              </div>
              <div className="text-emerald-400 text-xs font-bold mt-1">60 Credits</div>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li>• 📸 3 HD AI Images</li>
              <li>• 🎬 1x5-min Video</li>
              <li>• 🎙️ 1x5-min AI Voice</li>
            </ul>
          </button>
          {/* Starter */}
          <button
            type="button"
            onClick={() => setSelectedPlan('starter')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
              selectedPlan === 'starter'
                ? 'bg-slate-800/90 border-rose-500 ring-2 ring-rose-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-slate-300">Starter</span>
              <div className="mt-1">
                <span className="text-xl font-extrabold text-white">
                  {currency === 'NPR' ? `रू ${pricesNpr.starter}` : '$19'}
                </span>
                <span className="text-[10px] text-slate-500"> /mo</span>
              </div>
              <div className="text-amber-400 text-xs font-bold mt-1">500 Credits</div>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>• 🎬 20 Videos (Up to 100 Video Mins)</li>
              <li>• 📸 100 HD AI Images</li>
              <li>• 🎙️ 50 AI Voiceovers (250 Mins)</li>
            </ul>
          </button>

          {/* Creator (Recommended) */}
          <button
            type="button"
            onClick={() => setSelectedPlan('creator')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 relative cursor-pointer ${
              selectedPlan === 'creator'
                ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase">
              Popular
            </span>
            <div>
              <span className="text-xs font-bold text-rose-400">Creator</span>
              <div className="mt-1">
                <span className="text-xl font-extrabold text-white">
                  {currency === 'NPR' ? `रू ${pricesNpr.creator}` : '$49'}
                </span>
                <span className="text-[10px] text-slate-500"> /mo</span>
              </div>
              <div className="text-rose-400 text-xs font-bold mt-1">1,800 Credits</div>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li>• 🎬 72 Videos (Up to 360 Video Mins / 6 hrs)</li>
              <li>• 📸 360 HD AI Images</li>
              <li>• 🎙️ 180 AI Voiceovers (900 Mins)</li>
            </ul>
          </button>

          {/* Pro Studio / Agency */}
          <button
            type="button"
            onClick={() => setSelectedPlan('pro_studio')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
              selectedPlan === 'pro_studio'
                ? 'bg-slate-800/90 border-purple-500 ring-2 ring-purple-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-purple-300">Pro Agency</span>
              <div className="mt-1">
                <span className="text-xl font-extrabold text-white">
                  {currency === 'NPR' ? `रू ${pricesNpr.pro_studio}` : '$129'}
                </span>
                <span className="text-[10px] text-slate-500"> /mo</span>
              </div>
              <div className="text-purple-400 text-xs font-bold mt-1">5,000 Credits</div>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li>• 🎬 30 Movie Renders + 100 Video Clips (Up to 800 Total Video Mins / 13.3 hrs)</li>
              <li>• 🎙️ 160 Nepali Voiceovers (800 Mins)</li>
              <li>• ⚡ Dedicated GPU & Voice Clone</li>
            </ul>
          </button>
        </div>

        {/* Payment Gateway Selection */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span>Select Payment Gateway:</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setPaymentMethod('fonepay'); setCurrency('NPR'); }}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                paymentMethod === 'fonepay'
                  ? 'bg-rose-950/60 border-rose-500 text-white ring-2 ring-rose-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4 text-rose-400" />
              <span>FonePay / eSewa / Mobile Banking</span>
            </button>

            <button
              type="button"
              onClick={() => { setPaymentMethod('stripe'); setCurrency('USD'); }}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                paymentMethod === 'stripe'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white ring-2 ring-indigo-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>Stripe Card Gateway ($)</span>
            </button>
          </div>

          {/* FonePay QR Display & Actions */}
          {paymentMethod === 'fonepay' && fonepayDetails && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 animate-in fade-in">
              <div className="text-xs text-slate-300 font-bold">
                Scan QR Code with <span className="text-rose-400">FonePay / eSewa / Khalti / Any Mobile Banking App</span>
              </div>

              <div className="inline-block p-3 rounded-2xl bg-white shadow-xl my-1">
                <img
                  src={fonepayDetails.qrImageUrl}
                  alt="FonePay Merchant QR"
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-400">
                <div>Amount: <span className="text-rose-400 font-bold">NPR {fonepayDetails.amountNpr.toLocaleString()}</span></div>
                <div>Remarks / PRN ID: <span className="text-white font-bold">{fonepayDetails.prn}</span></div>
                <div className="text-[10px] text-slate-500">Merchant Code: {fonepayDetails.merchantCode}</div>
              </div>

              <button
                type="button"
                onClick={handleVerifyFonepay}
                disabled={verifyingFonepay}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {verifyingFonepay ? (
                  <span>Verifying Payment with FonePay...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>I Have Completed FonePay Payment — Verify Now</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Stripe Action Button */}
          {paymentMethod === 'stripe' && (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-950/50 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Connecting to Stripe Gateway...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>
                    Confirm & Pay with Stripe (
                    {selectedPlan === 'sasta_50_npr' ? '$0.38' : selectedPlan === 'starter' ? '$19' : selectedPlan === 'creator' ? '$49' : '$129'}
                    )
                  </span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-bit Encrypted Checkout</span>
            </span>
            <span>•</span>
            <span>Instant Credit Top-Up in Real-Time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

