import React, { useState } from 'react';
import { 
  HelpCircle, 
  Info, 
  ShieldCheck, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Database, 
  Zap, 
  FileText, 
  Lock, 
  Cpu, 
  Globe 
} from 'lucide-react';

interface PublicPagesViewProps {
  initialTab?: 'faq' | 'about' | 'privacy' | 'contact';
}

const FAQ_ITEMS = [
  {
    q: 'How does the Daily Free Credit Quota reset work?',
    a: 'Every registered user account receives a complimentary Daily Free Quota (3 HD Images, 1 Sora Video Clip, 1 Neural Voice, 1 Video Render) every 24 hours. The quota automatically refreshes at midnight daily, providing sustainable zero-cost creation.',
  },
  {
    q: 'What is the 24-Hour Storage Retention (TTL) policy?',
    a: 'To guarantee privacy, zero permanent data hoarding, and maximum performance, all user-generated media assets (images, video renders, audio clips) carry a strict 24-Hour TTL (Time-To-Live). Generated assets auto-expire and are permanently purged after 24 hours. Please download your HD assets to local storage.',
  },
  {
    q: 'What happens when my Daily Free Quota drops below 20%?',
    a: 'When your remaining daily free items fall to 20% or lower, our system activates a Low Quota Alert in the top header navigation, giving you one-click access to purchase the Micro-Credits Pass (रू 50) via FonePay / QR code or Stripe.',
  },
  {
    q: 'Which AI models power HamroAI Studio?',
    a: 'HamroAI Studio combines world-class neural models: Azure AI Foundry OpenAI Sora-2 for video generation, Black Forest Labs FLUX.1 & DALL-E 3 for HD image synthesis, Azure Neural Speech for Devanagari TTS, and Remotion + FFmpeg for timeline compositing.',
  },
  {
    q: 'Is Nepali Devanagari Unicode fully supported?',
    a: 'Yes! HamroAI Studio natively comprehends Devanagari script (Unicode range U+0900–U+097F) as well as Romanized Nepali ("Namaste mero naam..."). You can type prompts or script captions in either script.',
  },
  {
    q: 'How do I upgrade or purchase credit packages?',
    a: 'Click the "Upgrade / Buy Credits" button or the Dual Credit Meters in the header navigation. We accept instant Nepali local payments via FonePay / eSewa QR as well as international cards via Stripe.',
  },
];

export const PublicPagesView: React.FC<PublicPagesViewProps> = ({
  initialTab = 'faq',
}) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'about' | 'privacy' | 'contact'>(initialTab);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactSuccess(null);
    setContactError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();

      if (data.success) {
        setContactSuccess(data.message);
        setContactForm({ name: '', email: '', subject: 'General Inquiry', message: '' });
      } else {
        throw new Error(data.error || 'Failed to submit contact message');
      }
    } catch (err: any) {
      setContactError(err.message || 'Error sending contact request');
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Tab Navigation Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Platform Documentation & Public Portal</h1>
            <p className="text-xs text-slate-500">
              Explore FAQs, studio architecture, privacy disclosures, or contact our engineering team.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {(['faq', 'about', 'privacy', 'contact'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'faq' && <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />}
              {tab === 'about' && <Info className="w-3.5 h-3.5 text-rose-500" />}
              {tab === 'privacy' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
              {tab === 'contact' && <Mail className="w-3.5 h-3.5 text-amber-500" />}
              <span>{tab.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: FAQ ACCORDION */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 bg-slate-50/80 hover:bg-slate-100/80 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-3 transition cursor-pointer"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ABOUT PLATFORM */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-slate-900">About HamroAI Studio Architecture</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              HamroAI Studio is an enterprise-grade AI media creation engine developed for creators, news organizations, educators, and businesses in Nepal and globally. It unifies high-precision generative AI models into a real-time, multi-track studio environment with bilingual Devanagari support.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">Neural Generative Pipelines</h3>
                <p className="text-[11px] text-slate-500">
                  Powered by Azure AI Foundry OpenAI Sora-2, Black Forest Labs FLUX.1, and Hugging Face inference endpoints.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900">Remotion & Fabric.js Compositing</h3>
                <p className="text-[11px] text-slate-500">
                  Multi-track video previewing, subtitle burning, dynamic tickers, watermarks, and Fabric.js canvas manipulation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">24h Storage Lifecycle (TTL)</h3>
                <p className="text-[11px] text-slate-500">
                  Automated S3/R2 retention policies ensuring user assets auto-expire after 24 hours with zero permanent data accumulation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVACY & DATA RETENTION */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Privacy Policy & 24-Hour Data Retention Disclosure</h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>1. Data Minimization & Google Authentication:</strong> HamroAI Studio utilizes verified Google OAuth identity assertions to protect user accounts. We store only necessary user session metadata (email, display name, profile picture) to maintain generation quotas and transaction history.
              </p>
              <p>
                <strong>2. 24-Hour Storage Time-To-Live (TTL):</strong> All generated images, audio tracks, and video project renders carry a strict 24-hour expiration policy. Storage bucket lifecycle rules automatically purge expired assets 24 hours post-creation.
              </p>
              <p>
                <strong>3. GDPR & CCPA Compliance:</strong> Users possess absolute ownership over their prompt inputs and generated outputs. Users may request full account deletion at any time by contacting our support team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT FORM */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Contact Engineering & Support Team</h2>
            </div>

            {contactSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Message Sent Successfully!</h3>
                <p className="text-xs text-emerald-700">{contactSuccess}</p>
                <button
                  type="button"
                  onClick={() => setContactSuccess(null)}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 max-w-2xl">
                {contactError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {contactError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Prakash Suvedi"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="prakash@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Subject</label>
                  <select
                    value={contactForm.subject}
                    onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Payment & Micro-Credits">Payment & Micro-Credits (FonePay / eSewa / Stripe)</option>
                    <option value="API Integration & Enterprise">API Integration & Enterprise Access</option>
                    <option value="Bug Report">Bug Report or Technical Issue</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Type your message here..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{contactSubmitting ? 'Sending Message...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
