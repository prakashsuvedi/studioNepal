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
  Globe,
  Building2,
  User,
  ExternalLink,
  Award,
  Layers,
  Code2
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
    a: 'HamroAI Studio combines world-class neural models: Azure AI Foundry OpenAI Sora-2 for video generation, Black Forest Labs FLUX.1 & GPT-Image 2.5 Flare for HD image synthesis, Azure Neural Speech for Devanagari TTS, and Remotion + FFmpeg for timeline compositing.',
  },
  {
    q: 'Is Nepali Devanagari Unicode fully supported?',
    a: 'Yes! HamroAI Studio natively comprehends Devanagari script (Unicode range U+0900–U+097F) as well as Romanized Nepali ("Namaste mero naam..."). You can type prompts or script captions in either script.',
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Platform Documentation & Public Portal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore FAQs, leadership & engineering, studio architecture, privacy disclosures, or contact our team.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['faq', 'about', 'privacy', 'contact'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 bg-slate-50/80 dark:bg-slate-950/80 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3 transition cursor-pointer"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
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

      {/* TAB 2: ABOUT PLATFORM & CREATOR */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Hero Architecture Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">About NepalAI Studio & HamroAI Suite</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise AI Media Generation & Multi-Track Studio Engine</p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Production Ready
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>NepalAI Studio</strong> (accessible at <code className="text-rose-600 dark:text-rose-400 font-mono">studio.nepalai.tech</code> and <code className="text-rose-600 dark:text-rose-400 font-mono">nepalai.tech</code>) is Nepal’s premier cinematic AI media generation engine. Engineered from the ground up to empower creators, journalists, educators, video editors, and digital agencies, it unifies state-of-the-art generative neural models into a seamless browser-based multi-track editing suite with native Devanagari Unicode intelligence.
            </p>

            {/* Founder & Engineering Credit Spotlight Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Creator Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-600 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-base">
                      PS
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Founder & Chief AI Architect</div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Prakash Suvedi</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Visionary engineer and AI researcher spearheading localized foundational models, bilingual NLP agents, and neural video synthesis architectures tailored for South Asia and international production workflows.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <a
                    href="https://prakashsuvedi.com.np"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>prakashsuvedi.com.np</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>
                  <a
                    href="https://prakashsuvedi.com.np"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>LinkedIn & Portfolio</span>
                  </a>
                </div>
              </div>

              {/* Company & Engineering House Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-rose-50/40 dark:from-slate-950 dark:to-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Design & Engineering Organization</div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">ScamSpike Solutions Pvt. Ltd.</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Platform designed, engineered, and maintained by <strong>ScamSpike Solutions Pvt. Ltd.</strong> — delivering next-generation digital defense, enterprise AI ecosystems, high-throughput cloud architectures, and creative studio platforms.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <a
                    href="https://scamspike.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>scamspike.com</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Registered Tech Enterprise
                  </span>
                </div>
              </div>
            </div>

            {/* Core Neural Capabilities */}
            <div className="pt-2 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Underlying Neural Architecture & Pillars</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Azure Sora-2 & Neural Video</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Direct integration with Azure AI Foundry OpenAI Sora-2, Black Forest Labs FLUX.1 Schnell, and GPT-Image 2.5 Flare.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <Sparkles className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Multi-Track Compositor</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    CapCut-style multi-track timeline, Devanagari subtitle burner, AI avatar news anchors, and dynamic audio mixer.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Privacy-First 24h TTL</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Zero permanent data hoarding. Storage lifecycle rules automatically purge media renders after 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVACY & DATA RETENTION */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Privacy Policy & 24-Hour Data Retention Disclosure</h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contact Engineering & Support Team</h2>
            </div>

            {contactSuccess ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">Message Sent Successfully!</h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">{contactSuccess}</p>
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
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    {contactError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="contact-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Your Name</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Prakash Suvedi"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="contact-email" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Email Address</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="prakash@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-subject" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Subject</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Payment & Micro-Credits">Payment & Micro-Credits (FonePay / eSewa / Stripe)</option>
                    <option value="API Integration & Enterprise">API Integration & Enterprise Access</option>
                    <option value="Bug Report">Bug Report or Technical Issue</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-message" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Your Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Type your message here..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
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
