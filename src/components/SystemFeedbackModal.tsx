import React, { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  Bug, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle,
  FileCode,
  Tag
} from 'lucide-react';
import { apiSubmitFeedback } from '../lib/api';
import { UserSession } from '../types';

interface SystemFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserSession | null;
  defaultType?: 'feature_request' | 'error_report' | 'system_comment';
  initialErrorText?: string;
}

export const SystemFeedbackModal: React.FC<SystemFeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  defaultType = 'feature_request',
  initialErrorText = '',
}) => {
  const [activeTab, setActiveTab] = useState<'feature_request' | 'error_report' | 'system_comment'>(defaultType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('video_studio');
  const [description, setDescription] = useState('');
  const [errorCodeOrLogs, setErrorCodeOrLogs] = useState(initialErrorText);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [userName, setUserName] = useState(currentUser?.name || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please provide both a title and a detailed description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiSubmitFeedback({
        userId: currentUser?.id,
        userName: userName.trim() || currentUser?.name || 'Creator',
        userEmail: userEmail.trim() || currentUser?.email || '',
        type: activeTab,
        category,
        title: title.trim(),
        description: description.trim(),
        errorCodeOrLogs: errorCodeOrLogs.trim(),
        priority,
      });

      if (res.success && res.submission) {
        setSuccessTicketId(res.submission.id);
        // Instantly notify SuperAdmin in real-time
        try {
          window.dispatchEvent(new CustomEvent('nepalai_feedback_updated', { detail: res.submission }));
        } catch {}
      } else {
        setErrorMessage(res.message || 'Submission failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setErrorCodeOrLogs('');
    setSuccessTicketId(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Feedback & Developer Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit functions to implement, report errors to solve, or share system feedback
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successTicketId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Thank You for Your Feedback!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Your ticket has been logged directly in the Superadmin review queue. Our engineering team reviews all community submissions daily.
              </p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Ticket ID: <span className="font-bold text-rose-500">{successTicketId}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Submit Another Request
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md cursor-pointer"
              >
                Close & Return to Studio
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Category / Type Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('feature_request')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'feature_request'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Feature Request</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('error_report')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'error_report'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Bug className="w-4 h-4 text-rose-500" />
                <span>Report Error / Bug</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('system_comment')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'system_comment'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>System Comment</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {activeTab === 'feature_request' && 'Function or Feature to Implement *'}
                {activeTab === 'error_report' && 'Error Message or Bug Summary *'}
                {activeTab === 'system_comment' && 'Feedback Subject *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  activeTab === 'feature_request'
                    ? 'e.g. Add 4K 60fps ProRes export option in video studio'
                    : activeTab === 'error_report'
                    ? 'e.g. Video playback freezes when seeking on Safari iOS'
                    : 'e.g. Suggestion on timeline audio scrub responsiveness'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>

            {/* Category & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Module / Category</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:border-rose-500"
                >
                  <option value="video_studio">🎬 Video Studio & Timeline</option>
                  <option value="voice_studio">🎙️ Neural Voice & Dialogue Editor</option>
                  <option value="image_studio">🖼️ Image Studio (GPT-Image / Flux)</option>
                  <option value="avatar_studio">👤 Digital Presenter & Avatars</option>
                  <option value="hamro_ai">💬 HamroAI Multilingual Assistant</option>
                  <option value="billing">💳 Billing, Credits & FonePay QR</option>
                  <option value="general">🌐 General Platform Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Impact / Priority</span>
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:border-rose-500"
                >
                  <option value="low">🟢 Low - Nice to have</option>
                  <option value="medium">🟡 Medium - Standard request</option>
                  <option value="high">🟠 High - Important workflow blocker</option>
                  <option value="critical">🔴 Critical - Fatal error / service crash</option>
                </select>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Description & Steps *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={
                  activeTab === 'feature_request'
                    ? 'Describe what functionality you would like, how you expect it to work, and how it helps your creative workflow...'
                    : activeTab === 'error_report'
                    ? 'Describe what you were doing when the error occurred, steps to reproduce, and what happened instead of the expected result...'
                    : 'Share your feedback, ideas, or comments on how we can improve NepalAI Studio...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                required
              />
            </div>

            {/* Error Logs or Code Snippet (Optional / Relevant for errors & functions) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>Error Logs / Code Snippet / Technical Details (Optional)</span>
              </label>
              <textarea
                rows={2}
                value={errorCodeOrLogs}
                onChange={e => setErrorCodeOrLogs(e.target.value)}
                placeholder="Paste browser console errors, network status codes, or proposed code signatures here..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] placeholder-slate-400 focus:outline-hidden focus:border-rose-500 resize-none"
              />
            </div>

            {/* Author info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="e.g. Prakash Suvedi"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Contact Email (Optional - for resolution updates & bonus credits)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Engineering Team</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
