import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Keyboard,
  Languages,
  Plus,
  Trash2,
  Share2,
  Film,
  Code2,
  ChevronDown,
  Info,
  ExternalLink,
  MessageSquare,
  Search,
  X,
  Cpu,
  ArrowRight,
  Mic,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { UserSession, HamroAiModel, HamroAiLanguage, HamroChatMessage, StudioTab } from '../types';
import { apiSendHamroAiChat } from '../lib/api';
import { HAMRO_PROMPT_TEMPLATES } from '../lib/promptTemplates';
import { transliterateDevanagari, DEVANAGARI_SYMBOLS } from '../lib/unicodeConverter';
import { PromptTemplateGallery } from './PromptTemplateGallery';
import { AiStoryboardModal } from './AiStoryboardModal';

interface HamroAiStudioProps {
  user: UserSession | null;
  onOpenAuth: () => void;
  onNavigateTab?: (tab: StudioTab) => void;
  onSendToVideoStudio?: (scriptText: string) => void;
  onSendToVoiceStudio?: (text: string) => void;
  onSendToSoraStudio?: (prompt: string) => void;
  onSendToImageStudio?: (prompt: string) => void;
  onStartGlobalLoading?: (info: { title: string; subtitle?: string; type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; progress?: number }) => void;
  onStopGlobalLoading?: () => void;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  messages: HamroChatMessage[];
  model: HamroAiModel;
  language: HamroAiLanguage;
}

export const HamroAiStudio: React.FC<HamroAiStudioProps> = ({
  user,
  onOpenAuth,
  onNavigateTab,
  onSendToVideoStudio,
  onSendToVoiceStudio,
  onSendToSoraStudio,
  onSendToImageStudio,
  onStartGlobalLoading,
  onStopGlobalLoading,
}) => {
  // State
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem(`hamroai_threads_${user?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [messages, setMessages] = useState<HamroChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<HamroAiModel>('gpt-4o');
  const [selectedLanguage, setSelectedLanguage] = useState<HamroAiLanguage>(() => {
    return (localStorage.getItem('hamroai_preferred_language') as HamroAiLanguage) || 'ne';
  });
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>(() => {
    return localStorage.getItem('hamroai_custom_system_instruction') || '';
  });
  const [showSystemPromptModal, setShowSystemPromptModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isStoryboardModalOpen, setIsStoryboardModalOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [isUnicodeMode, setIsUnicodeMode] = useState(true);
  const [showSymbolPalette, setShowSymbolPalette] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or load active thread
  useEffect(() => {
    if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].id);
      setMessages(threads[0].messages);
      setSelectedModel(threads[0].model || 'gpt-4o');
      setSelectedLanguage(threads[0].language || 'ne');
    } else if (threads.length === 0 && !activeThreadId) {
      createNewThread();
    }
  }, [threads]);

  // Persist threads to local storage
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(`hamroai_threads_${user?.id || 'guest'}`, JSON.stringify(threads));
    }
  }, [threads, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const createNewThread = () => {
    const newId = `thread_${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: 'नयाँ सम्वाद (New Chat)',
      createdAt: Date.now(),
      messages: [],
      model: selectedModel,
      language: selectedLanguage,
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setMessages([]);
    setInputPrompt('');
    textareaRef.current?.focus();
  };

  const selectThread = (threadId: string) => {
    const found = threads.find((t) => t.id === threadId);
    if (found) {
      setActiveThreadId(found.id);
      setMessages(found.messages);
      setSelectedModel(found.model || 'gpt-4o');
      setSelectedLanguage(found.language || 'ne');
    }
  };

  const deleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = threads.filter((t) => t.id !== threadId);
    setThreads(filtered);
    if (activeThreadId === threadId) {
      if (filtered.length > 0) {
        selectThread(filtered[0].id);
      } else {
        createNewThread();
      }
    }
  };

  // Handle Input typing with optional phonetic Devanagari transliteration
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (isUnicodeMode && (selectedLanguage === 'ne' || selectedLanguage === 'hi')) {
      // If user typed space or punctuation, transliterate the preceding word
      if (val.endsWith(' ') || val.endsWith(',') || val.endsWith('.') || val.endsWith('?') || val.endsWith('\n')) {
        const transliterated = transliterateDevanagari(val, selectedLanguage);
        setInputPrompt(transliterated);
        return;
      }
    }
    setInputPrompt(val);
  };

  const insertSymbol = (symbol: string) => {
    setInputPrompt((prev) => prev + symbol);
    textareaRef.current?.focus();
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : inputPrompt).trim();
    if (!textToSend || isLoading) return;

    // Check Google Auth Gate
    if (!user) {
      onOpenAuth();
      return;
    }

    setErrorBanner(null);
    const userMsg: HamroChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
      language: selectedLanguage,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    // Update thread title if first message
    if (messages.length === 0) {
      const autoTitle = textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '');
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, title: autoTitle, messages: newMessages } : t))
      );
    } else {
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, messages: newMessages } : t))
      );
    }

    try {
      if (onStartGlobalLoading) {
        onStartGlobalLoading({
          type: 'hamroai',
          title: `HamroAI (${selectedModel.toUpperCase()}) Generating Response...`,
          subtitle: `Processing ${selectedLanguage === 'ne' ? 'Nepali Devanagari' : selectedLanguage === 'hi' ? 'Hindi Devanagari' : 'English'} with Unicode enforcement`,
        });
      }

      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiSendHamroAiChat({
        userId: user.id,
        messages: historyPayload,
        model: selectedModel,
        language: selectedLanguage,
        systemInstruction: customSystemInstruction || undefined,
      });

      if (onStopGlobalLoading) {
        onStopGlobalLoading();
      }

      const assistantMsg: HamroChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
        language: selectedLanguage,
        tokens: res.usage?.total_tokens,
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, messages: finalMessages } : t))
      );
    } catch (err: any) {
      console.error('HamroAI chat error:', err);
      setErrorBanner(err.message || 'कुराकानी गर्न सकिएन (Failed to receive AI response). Please try again.');
    } finally {
      setIsLoading(false);
      if (onStopGlobalLoading) {
        onStopGlobalLoading();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatAsMarkdown = () => {
    if (messages.length === 0) return;
    const content = messages
      .map((m) => `### ${m.role === 'user' ? '👤 तपाईं (User)' : `🤖 HamroAI (${m.model})`} [${m.timestamp}]\n\n${m.content}\n\n---\n`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HamroAI_Conversation_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyTemplate = (prompt: string) => {
    setInputPrompt(prompt);
    setIsTemplateModalOpen(false);
    textareaRef.current?.focus();
  };

  const transferToVideoStudio = (text: string) => {
    if (onSendToVideoStudio) {
      onSendToVideoStudio(text);
    }
    if (onNavigateTab) {
      onNavigateTab('video_studio');
    }
  };

  const transferToVoiceStudio = (text: string) => {
    if (onSendToVoiceStudio) {
      onSendToVoiceStudio(text);
    }
    if (onNavigateTab) {
      onNavigateTab('tts_studio');
    }
  };

  const transferToSoraStudio = (prompt: string) => {
    if (onSendToSoraStudio) {
      onSendToSoraStudio(prompt);
    }
    if (onNavigateTab) {
      onNavigateTab('sora_studio');
    }
  };

  const transferToImageStudio = (prompt: string) => {
    if (onSendToImageStudio) {
      onSendToImageStudio(prompt);
    }
    if (onNavigateTab) {
      onNavigateTab('image_studio');
    }
  };

  // Filter templates
  const filteredTemplates = HAMRO_PROMPT_TEMPLATES.filter((t) => {
    const matchCat = templateCategory === 'All' || t.category === templateCategory;
    const matchSearch =
      templateSearch === '' ||
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (t.titleNe && t.titleNe.includes(templateSearch)) ||
      (t.titleHi && t.titleHi.includes(templateSearch)) ||
      t.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.prompt.toLowerCase().includes(templateSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = ['All', 'Content Writing', 'Business & Marketing', 'Nepali Law & Govt', 'Creative & Scriptwriting', 'Education & Academic', 'Coding & Tech', 'Social Media', 'Translation'];

  // Helper for rendering rich Markdown formatting
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 leading-relaxed text-sm md:text-base">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const lines = part.slice(3, -3).trim().split('\n');
            const lang = lines[0].trim();
            const code = lines.slice(1).join('\n') || lines[0];
            const codeId = `${msgId}_code_${index}`;

            return (
              <div key={index} className="my-3 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 font-mono text-xs md:text-sm shadow-md">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                  <span className="flex items-center gap-1.5 uppercase font-medium tracking-wide text-xs text-amber-400">
                    <Code2 className="w-3.5 h-3.5" />
                    {lang || 'code'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(code, codeId)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                  >
                    {copiedId === codeId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-zinc-100 whitespace-pre">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // Format paragraphs with bold, italic, and bullet lists
          return (
            <div key={index} className="whitespace-pre-wrap">
              {part.split('\n').map((line, lIdx) => {
                // Bullet points
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                  return (
                    <li key={lIdx} className="ml-4 list-disc text-zinc-200">
                      {formatInlineMarkdown(line.trim().substring(2))}
                    </li>
                  );
                }
                // Numbered list
                const numMatch = line.match(/^(\d+)\.\s(.*)$/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex gap-2 ml-1 text-zinc-200">
                      <span className="font-semibold text-amber-400">{numMatch[1]}.</span>
                      <span>{formatInlineMarkdown(numMatch[2])}</span>
                    </div>
                  );
                }
                // Headings
                if (line.startsWith('### ')) {
                  return <h4 key={lIdx} className="font-bold text-base md:text-lg text-amber-300 mt-2 mb-1">{line.slice(4)}</h4>;
                }
                if (line.startsWith('## ')) {
                  return <h3 key={lIdx} className="font-bold text-lg md:text-xl text-amber-400 mt-3 mb-1">{line.slice(3)}</h3>;
                }
                if (line.startsWith('# ')) {
                  return <h2 key={lIdx} className="font-extrabold text-xl md:text-2xl text-white mt-4 mb-2">{line.slice(2)}</h2>;
                }

                if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

                return <p key={lIdx} className="text-zinc-200">{formatInlineMarkdown(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });
  };

  return (
    <div id="hamroai-root-container" className="flex h-[calc(100vh-4rem)] w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* LEFT SIDEBAR: THREADS & TEMPLATES QUICK LAUNCH */}
      <aside className="hidden lg:flex flex-col w-72 bg-zinc-900/90 border-r border-zinc-800 flex-shrink-0">
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
          <button
            onClick={createNewThread}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-medium text-xs shadow transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>नयाँ सम्वाद (New Chat)</span>
          </button>
        </div>

        {/* Templates Banner Button */}
        <div className="p-3 border-b border-zinc-800/80 space-y-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-left transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition">
                  प्रम्प्ट टेम्प्लेटहरू (Templates)
                </div>
                <div className="text-[11px] text-zinc-400">२५+ नेपाली/हिन्दी कार्य ढाँचा</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition" />
          </button>

          <button
            onClick={() => setIsStoryboardModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/60 text-left transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                  AI Storyboard Generator
                </div>
                <div className="text-[11px] text-zinc-400">Summarize scripts to Video Studio</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            सम्वाद इतिहास (Chat History)
          </div>

          {threads.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-400">
              अहिलेसम्म कुनै सम्वाद छैन।
            </div>
          ) : (
            threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  onClick={() => selectThread(thread.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition ${
                    isActive
                      ? 'bg-zinc-800 text-amber-300 font-medium border border-zinc-700'
                      : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">{thread.title || 'नयाँ सम्वाद'}</span>
                  </div>
                  <button
                    onClick={(e) => deleteThread(thread.id, e)}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Azure Deployment Badge */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Azure OpenAI Active</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            gpt-4o & gpt-5-mini deployed
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
        {/* TOP HEADER CONTROLS */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">HamroAI</h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Multilingual LLM
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                नेपाली (देवनागरी/रोमन) • हिंदी • English (Global)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Model Selector */}
            <div className="flex items-center bg-zinc-800 p-0.5 rounded-lg border border-zinc-700 text-xs">
              <button
                onClick={() => setSelectedModel('gpt-4o')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  selectedModel === 'gpt-4o'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
                title="GPT-4o: Multilingual, Creative, Omni Intelligence"
              >
                GPT-4o
              </button>
              <button
                onClick={() => setSelectedModel('gpt-5-mini')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  selectedModel === 'gpt-5-mini'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
                title="GPT-5-mini: Fast, Deep Reasoning & Code"
              >
                GPT-5-mini
              </button>
            </div>

            {/* Language Selector Dropdown (Nepali, Hindi, English, Auto-Detect) */}
            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs gap-1.5 shadow-sm">
              <Languages className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as HamroAiLanguage;
                  setSelectedLanguage(newLang);
                  localStorage.setItem('hamroai_preferred_language', newLang);
                }}
                className="bg-transparent text-white outline-none cursor-pointer pr-1 font-medium text-xs"
                title="Select language: Automatically configures system prompt for authentic Devanagari/English Unicode processing"
              >
                <option value="ne" className="bg-zinc-900 text-white">नेपाली (Nepali)</option>
                <option value="hi" className="bg-zinc-900 text-white">हिंदी (Hindi)</option>
                <option value="en" className="bg-zinc-900 text-white">English (Global)</option>
                <option value="auto" className="bg-zinc-900 text-white">Auto-Detect</option>
              </select>

              {/* View/Customize System Prompt & Unicode Directives */}
              <button
                onClick={() => setShowSystemPromptModal(true)}
                className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-zinc-700 transition"
                title="Active System Prompt & Unicode Rules"
              >
                <Cpu className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prompt Templates Gallery Trigger Button */}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-red-600/20 hover:from-amber-500/30 hover:to-red-600/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition cursor-pointer shadow-sm"
              title="Open Prompt Template Gallery (Marketing, Education, Storytelling, Legal, Tech...)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Prompt Templates</span>
            </button>

            {/* Export conversation */}
            {messages.length > 0 && (
              <button
                onClick={exportChatAsMarkdown}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                title="Export conversation as Markdown"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Error banner if present */}
        {errorBanner && (
          <div className="px-4 py-2 bg-red-950/80 border-b border-red-800/80 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button onClick={() => setErrorBanner(null)} className="p-1 text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* CHAT MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto py-8 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-red-500/20 to-zinc-900 border border-amber-500/30 text-amber-400 mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                नमस्ते! म <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">HamroAI</span> हुँ।
              </h2>
              <p className="text-zinc-300 text-sm md:text-base max-w-xl mx-auto mb-6">
                तपाईंको आफ्नै बहुभाषिक बौद्धिक साथी। नेपालीमा सोध्नुहोस्, हिन्दीमा कुराकानी गर्नुहोस् वा विश्वस्तरीय अङ्ग्रेजीमा काम गर्नुहोस्।
              </p>

              {/* Language Capability Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left max-w-2xl mx-auto mb-8">
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <div className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    🇳🇵 नेपाली (Nepali)
                  </div>
                  <p className="text-xs text-zinc-300">
                    रोमन नेपाली (e.g. <span className="text-amber-200 font-mono">mero naam...</span>) वा देवनागरी दुवै बुझ्छ र शुद्ध नेपालीमा उत्तर दिन्छ।
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <div className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5">
                    🇮🇳 हिंदी (Hindi)
                  </div>
                  <p className="text-xs text-zinc-300">
                    रोमन हिंदी (e.g. <span className="text-red-200 font-mono">namaste mera naam...</span>) टाइप गर्नुहोस्, स्वाभाविक हिंदीमा संवाद गर्छ।
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <div className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                    🌐 Global (English)
                  </div>
                  <p className="text-xs text-zinc-300">
                    Code generation, academic essays, business proposals, and translation with precision.
                  </p>
                </div>
              </div>

              {/* Quick Starter Template Cards */}
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                सुरुवात गर्न कुनै एक विषय रोज्नुहोस् (Quick Starters)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left">
                {HAMRO_PROMPT_TEMPLATES.slice(0, 4).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSendMessage(tmpl.prompt)}
                    className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 transition flex flex-col justify-between group text-left"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition">
                        {tmpl.titleNe || tmpl.title}
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-1 line-clamp-2">
                        {tmpl.description}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
                      <span>क्लिक गरेर सुरु गर्नुहोस्</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white flex-shrink-0 shadow">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-zinc-400">
                        <span className="font-semibold text-zinc-300">
                          {isUser ? (user?.name || 'तपाईं (You)') : `HamroAI (${msg.model || 'gpt-4o'})`}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed ${
                          isUser
                            ? 'bg-amber-600 text-white rounded-br-none shadow-md'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          renderMessageContent(msg.content, msg.id)
                        )}
                      </div>

                      {/* Action buttons under assistant message */}
                      {!isUser && (
                        <div className="flex items-center gap-2 mt-1.5 px-1 text-xs text-zinc-400">
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="flex items-center gap-1 hover:text-white transition py-0.5 px-1.5 rounded hover:bg-zinc-800"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">प्रतिलिपि भयो (Copied)</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy Text</span>
                              </>
                            )}
                          </button>

                          {/* Action buttons under assistant message */}
                          <button
                            onClick={() => transferToVideoStudio(msg.content)}
                            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition py-0.5 px-1.5 rounded hover:bg-zinc-800"
                            title="Transfer script to Video Studio Timeline"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Timeline</span>
                          </button>

                          <button
                            onClick={() => transferToVoiceStudio(msg.content)}
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition py-0.5 px-1.5 rounded hover:bg-zinc-800"
                            title="Synthesize Voiceover in Voice Studio"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Voice Studio</span>
                          </button>

                          <button
                            onClick={() => transferToSoraStudio(msg.content.slice(0, 300))}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition py-0.5 px-1.5 rounded hover:bg-zinc-800"
                            title="Synthesize Video in Sora-2 Studio"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Sora Studio</span>
                          </button>

                          <button
                            onClick={() => transferToImageStudio(msg.content.slice(0, 300))}
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition py-0.5 px-1.5 rounded hover:bg-zinc-800"
                            title="Synthesize Art in Image Studio"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Image Studio</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white flex-shrink-0">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex gap-3.5 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white flex-shrink-0 shadow animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-bl-none bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-zinc-400 ml-1">HamroAI ({selectedModel}) जवाफ तयार गर्दैछ...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* VIRTUAL DEVANAGARI SYMBOLS BAR (COLLAPSIBLE) */}
        {showSymbolPalette && (
          <div className="px-4 py-1.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase flex-shrink-0 mr-1">
              प्रतीकहरू (Symbols):
            </span>
            {DEVANAGARI_SYMBOLS.map((s) => (
              <button
                key={s.label}
                onClick={() => insertSymbol(s.label)}
                title={s.name}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 font-mono transition flex-shrink-0"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* INPUT PROMPT BAR */}
        <div className="p-3 md:p-4 bg-zinc-900/95 border-t border-zinc-800">
          <div className="max-w-3xl mx-auto">
            {/* Input Controls & Typing Modes */}
            <div className="flex items-center justify-between gap-2 mb-2 text-xs">
              <div className="flex items-center gap-2">
                {/* Unicode Conversion Toggle */}
                <button
                  onClick={() => setIsUnicodeMode(!isUnicodeMode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium text-xs ${
                    isUnicodeMode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                  }`}
                  title="Automatic Roman-to-Devanagari Unicode transliteration on space"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>युनिकोड टाइपिङ (Unicode): {isUnicodeMode ? 'ON' : 'OFF'}</span>
                </button>

                {/* Symbols Palette Toggle */}
                <button
                  onClick={() => setShowSymbolPalette(!showSymbolPalette)}
                  className={`px-2 py-1 rounded-md text-xs transition ${
                    showSymbolPalette ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  चिह्नहरू (Symbols)
                </button>
              </div>

              <div className="text-[11px] text-zinc-400">
                Shift + Enter नयाँ लाइनको लागि • Enter पठाउनका लागि
              </div>
            </div>

            {/* Input Form */}
            <div className="relative flex items-end rounded-2xl bg-zinc-950 border border-zinc-700 focus-within:border-amber-500 shadow-lg transition">
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  selectedLanguage === 'ne'
                    ? 'HamroAI लाई सोध्नुहोस्... (रोमन वा देवनागरी नेपालीमा लेख्नुहोस्)'
                    : selectedLanguage === 'hi'
                    ? 'HamroAI से पूछें... (रोमन या देवनागरी हिंदी में लिखें)'
                    : 'Ask HamroAI anything in English, or choose a prompt template...'
                }
                className="w-full p-3.5 pr-24 bg-transparent text-zinc-100 text-sm md:text-base resize-none outline-none max-h-36 overflow-y-auto"
                style={{ minHeight: '52px' }}
              />

              <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition"
                  title="Browse Prompt Templates"
                >
                  <BookOpen className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isLoading}
                  className={`p-2 rounded-xl font-medium transition flex items-center justify-center ${
                    !inputPrompt.trim() || isLoading
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white shadow-md'
                  }`}
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-400">
              <div>
                Active Model: <span className="text-zinc-300 font-semibold">{selectedModel}</span> on Azure OpenAI
              </div>
              <div>
                {user ? (
                  <span>क्रेडिट: <strong className="text-amber-400">{user.credits}</strong></span>
                ) : (
                  <button onClick={onOpenAuth} className="text-amber-400 hover:underline">
                    Google Sign-in Required
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PROMPT TEMPLATES GALLERY MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <PromptTemplateGallery
              onSelectPrompt={(prompt, model, lang) => {
                applyTemplate(prompt);
                if (model) setSelectedModel(model);
                if (lang) {
                  setSelectedLanguage(lang);
                  localStorage.setItem('hamroai_preferred_language', lang);
                }
                setIsTemplateModalOpen(false);
              }}
              onClose={() => setIsTemplateModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* SYSTEM PROMPT & UNICODE DIRECTIVES MODAL */}
      {showSystemPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">System Prompt & Unicode Directives</h3>
                  <p className="text-xs text-zinc-400">Devanagari script integrity (U+0900–U+097F) and custom AI persona.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSystemPromptModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unicode Specifications Card */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
              <span className="font-semibold text-amber-300 block">Strict Devanagari Unicode Engine Active:</span>
              <ul className="space-y-1 text-zinc-300 text-[11px] list-disc list-inside">
                <li><strong className="text-white">Purna Viram:</strong> Enforces <code className="text-amber-400 font-mono">।</code> (U+0964) instead of western period for sentence terminations.</li>
                <li><strong className="text-white">Ligature & Matra Preservation:</strong> Preserves conjunct clusters (e.g., क्ष, त्र, ज्ञ) and avoids raw ASCII fallback.</li>
                <li><strong className="text-white">Nepali Honorifics:</strong> Natural polite register (<span className="text-amber-300">तपाईं, हजुर</span>).</li>
                <li><strong className="text-white">Transliteration Bridge:</strong> Understands Romanized Nepali (e.g., "Kasto chha?") and responds in fluent Devanagari.</li>
              </ul>
            </div>

            {/* Custom System Instruction Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Custom Instructions (Optional Persona/Style):</span>
                <span className="text-[10px] text-zinc-500">Appended to model instructions</span>
              </label>
              <textarea
                value={customSystemInstruction}
                onChange={(e) => {
                  setCustomSystemInstruction(e.target.value);
                  localStorage.setItem('hamroai_custom_system_instruction', e.target.value);
                }}
                placeholder="उदा: सधैं संक्षिप्त र बुँदागत उत्तर दिनुहोस्। प्रविधिको व्याख्या गर्दा व्यावहारिक उदाहरण दिनुहोस्... (e.g. Always reply with concise bullet points and practical Nepali examples)"
                rows={4}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/80 transition"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
              <button
                onClick={() => {
                  setCustomSystemInstruction('');
                  localStorage.removeItem('hamroai_custom_system_instruction');
                }}
                className="text-zinc-400 hover:text-red-400 text-[11px]"
              >
                Clear Custom Instructions
              </button>
              <button
                onClick={() => setShowSystemPromptModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition shadow-sm"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Storyboard Generator Modal */}
      <AiStoryboardModal
        isOpen={isStoryboardModalOpen}
        onClose={() => setIsStoryboardModalOpen(false)}
        onApplyStoryboard={(newScenes) => {
          if (onSendToVideoStudio) {
            onSendToVideoStudio('Storyboard generated');
          }
          if (onNavigateTab) {
            onNavigateTab('video_studio');
          }
        }}
      />
    </div>
  );
};
