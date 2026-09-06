import React, { useState, useEffect } from 'react';
import { UserSession, UserTrialQuota, StudioTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Zap, 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  TrendingUp, 
  Film, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  Flame, 
  ArrowRight,
  ExternalLink,
  Award,
  RefreshCw
} from 'lucide-react';

interface UserDashboardViewProps {
  user: UserSession;
  trialUsage: UserTrialQuota | null;
  onNavigateTab: (tab: StudioTab) => void;
  onOpenPaywall: () => void;
  onCreditEarned?: (newCreditTotal: number) => void;
  onOpenTour?: () => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  user,
  trialUsage,
  onNavigateTab,
  onOpenPaywall,
  onCreditEarned,
  onOpenTour,
}) => {
  const { language } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Persisted or stable referral code derived from user
  const referralCode = `NEPAL-${(user.id || 'CREATOR').slice(-5).toUpperCase()}`;
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  // Referral statistics (persisted in localStorage for demo realism)
  const [referralStats, setReferralStats] = useState(() => {
    const saved = localStorage.getItem(`nepalai_referral_stats_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      totalInvited: 4,
      totalCreditsEarned: 350,
      activeCreators: 3,
      currentRank: 'Silver Ambassador',
      referralHistory: [
        { email: 'a***.dev@gmail.com', date: 'Yesterday', status: 'Rendered 4K Video', credits: '+150 CR' },
        { email: 'suman.k***@outlook.com', date: '3 days ago', status: 'Signed up with Google', credits: '+50 CR' },
        { email: 'pokhara.media***@gmail.com', date: '1 week ago', status: 'Rendered Short Reel', credits: '+150 CR' },
      ],
    };
  });

  const copyToClipboard = (text: string, isCode: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Native Web Share or WhatsApp Share
  const shareReferral = (platform: 'native' | 'whatsapp' | 'viber' | 'facebook' | 'telegram') => {
    const shareText = `Join NepalAI Studio to make viral AI videos in Nepali with Sora-2, HamroAI (GPT-4o) & neural voiceover! Use my invite link to get +25 bonus credits free: ${referralLink}`;
    
    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: 'NepalAI Studio - 25 Free Credits Invite',
        text: shareText,
        url: referralLink,
      }).catch(() => {});
      return;
    }

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'viber') {
      window.open(`viber://forward?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  // Redeem Referral or Promo Code Handler
  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCodeInput.trim().toUpperCase();

    if (!cleanCode) {
      setPromoStatus({ type: 'error', message: 'Please enter a valid code' });
      return;
    }

    // Check if already redeemed
    const redeemedList = JSON.parse(localStorage.getItem(`nepalai_redeemed_${user.id}`) || '[]');
    if (redeemedList.includes(cleanCode)) {
      setPromoStatus({ type: 'error', message: 'You have already claimed this promo code!' });
      return;
    }

    if (cleanCode.startsWith('NEPAL-') || cleanCode === 'HAMRO2026' || cleanCode === 'VIRAL50' || cleanCode === 'WELCOME25') {
      const bonusCredits = cleanCode === 'VIRAL50' ? 50 : 25;
      const newTotal = (user.credits || 0) + bonusCredits;
      
      redeemedList.push(cleanCode);
      localStorage.setItem(`nepalai_redeemed_${user.id}`, JSON.stringify(redeemedList));

      if (onCreditEarned) {
        onCreditEarned(newTotal);
      }

      setPromoStatus({
        type: 'success',
        message: `Success! +${bonusCredits} generation credits added to your account wallet! 🎉`,
      });
      setPromoCodeInput('');
    } else {
      setPromoStatus({
        type: 'error',
        message: 'Invalid referral or promo code. Try VIRAL50 or ask a friend for their link!',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Card: User Info & Fast Action Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500/30 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                  {user.name.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {user.tier.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.email} • Member of NepalAI Creator Ecosystem
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {onOpenTour && (
                <button
                  onClick={onOpenTour}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Take Studio Tour</span>
                </button>
              )}

              <button
                onClick={onOpenPaywall}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Buy Credits / Upgrade</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Wallet Credits</span>
              <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>{user.credits} CR</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Referrals Made</span>
              <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
                <span>{referralStats.totalInvited} Friends</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Credits Earned</span>
              <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                <Gift className="w-5 h-5" />
                <span>+{referralStats.totalCreditsEarned} CR</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ambassador Rank</span>
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400">
                <Award className="w-5 h-5" />
                <span>{referralStats.currentRank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CORE SECTION: REFER & EARN VIRAL GROWTH ENGINE */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-black text-white rounded-3xl border border-indigo-500/30 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Viral Referral Program • साथी बोलाउनुहोस् र कमाउनुहोस्</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Invite Friends & Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">Unlimited Generation Credits</span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Give your creator friends <strong>+25 Welcome Credits</strong> when they join. You earn <strong>+50 Credits</strong> instantly upon their signup and another <strong>+150 Bonus Credits</strong> when they export their first AI video!
              </p>
            </div>

            {/* 3 Step Reward Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-2 backdrop-blur-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-base font-bold">
                  1
                </div>
                <h4 className="font-bold text-sm text-white">Share Your Link</h4>
                <p className="text-xs text-slate-400">
                  Send your personalized invite link or code to YouTubers, TikTokers & shops.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-2 backdrop-blur-xs">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-base font-bold">
                  2
                </div>
                <h4 className="font-bold text-sm text-white">They Get +25 CR</h4>
                <p className="text-xs text-slate-400">
                  Your friend joins with Google and instantly receives free creation credits.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-2 backdrop-blur-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-base font-bold">
                  3
                </div>
                <h4 className="font-bold text-sm text-white">You Get Up to +200 CR</h4>
                <p className="text-xs text-slate-400">
                  Earn +50 CR on signup + 150 CR bonus after their first video render.
                </p>
              </div>
            </div>

            {/* Link & Code Box */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 bg-black/60 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-amber-300 truncate">
                  {referralLink}
                </div>

                <button
                  onClick={() => copyToClipboard(referralLink, false)}
                  className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Referral Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Referral Code & Social Share Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Your Referral Code:</span>
                  <button
                    onClick={() => copyToClipboard(referralCode, true)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono font-bold hover:bg-indigo-900 transition flex items-center gap-1 cursor-pointer"
                    title="Click to copy code"
                  >
                    <span>{referralCode}</span>
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {/* Social Share Icons */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Share via:</span>
                  <button
                    onClick={() => shareReferral('whatsapp')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer flex items-center gap-1 text-[11px]"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => shareReferral('viber')}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition cursor-pointer flex items-center gap-1 text-[11px]"
                    title="Share on Viber"
                  >
                    <span>Viber</span>
                  </button>

                  <button
                    onClick={() => shareReferral('telegram')}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition cursor-pointer flex items-center gap-1 text-[11px]"
                    title="Share on Telegram"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram</span>
                  </button>

                  <button
                    onClick={() => shareReferral('native')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="More Share Options"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Redeem Friend's Referral Code Section */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Have a Friend's Referral or Promo Code?</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Redeem it here to instantly add bonus credits to your creation wallet.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value);
                    setPromoStatus({ type: 'idle', message: '' });
                  }}
                  placeholder="e.g. VIRAL50 or NEPAL-XXXXX"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Redeem Bonus
                </button>
              </form>

              {promoStatus.message && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  promoStatus.type === 'success' 
                    ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300' 
                    : 'bg-rose-950/80 border border-rose-700 text-rose-300'
                }`}>
                  {promoStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Flame className="w-4 h-4 shrink-0" />}
                  <span>{promoStatus.message}</span>
                </div>
              )}
            </div>

            {/* Referral History Feed */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Your Recent Referral Activity:</span>
                <span>Active Rank: <strong className="text-amber-400">{referralStats.currentRank}</strong></span>
              </div>

              <div className="divide-y divide-slate-800 rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden text-xs">
                {referralStats.referralHistory.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-mono text-slate-300 font-semibold">{item.email}</span>
                        <div className="text-[10px] text-slate-500">{item.date} • {item.status}</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      {item.credits}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Quick Studio Jumpstart Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            Launch Your Creative Workspaces
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigateTab('video_studio')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition cursor-pointer shadow-xs hover:shadow-md group space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                <Film className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Multi-Track Video Studio</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timeline editing, 4K rendering, camera motion & Devanagari subtitles.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('hamro_ai')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition cursor-pointer shadow-xs hover:shadow-md group space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">HamroAI Co-Pilot</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                GPT-4o & GPT-5-mini scriptwriting in Nepali, Hindi and English.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('sora_studio')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition cursor-pointer shadow-xs hover:shadow-md group space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sora-2 Video Generator</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Photorealistic AI video generation with prompt enhancement.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('tts_studio')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition cursor-pointer shadow-xs hover:shadow-md group space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <Crown className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Nepali Voiceover Studio</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SpeechT5 acoustic neural voice synthesis in authentic Nepali accents.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
