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
  ChevronRight,
  Info,
  ExternalLink,
  MessageSquare,
  Search,
  X,
  Cpu,
  ArrowRight,
  Mic,
  MicOff,
  Video,
  Image as ImageIcon,
  Settings,
  Paperclip,
  Wrench,
  PenTool,
  BarChart3,
  Globe,
  Code,
  Compass,
  Filter,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Sliders,
  Layers,
  Download,
  Loader2,
} from 'lucide-react';
import { UserSession, HamroAiModel, HamroAiLanguage, HamroChatMessage, StudioTab } from '../types';
import { apiSendHamroAiChat, apiGenerateImage } from '../lib/api';
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

interface AttachedFile {
  name: string;
  content: string;
  size: number;
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
  // Chat Threads State
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
  const [isUnicodeMode, setIsUnicodeMode] = useState(true);
  const [showSymbolPalette, setShowSymbolPalette] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // UI Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hamroai_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [conversationSearch, setConversationSearch] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});

  // Text to Image (GPT-Image-1.5) Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalPrompt, setImageModalPrompt] = useState('');
  const [imageModalRatio, setImageModalRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageModalError, setImageModalError] = useState<string | null>(null);
  const [generatedImageResult, setGeneratedImageResult] = useState<{
    url: string;
    model: string;
    resolution: string;
    engine: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Save layout preference
  useEffect(() => {
    try {
      localStorage.setItem('hamroai_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {}
  }, [isSidebarCollapsed]);

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

  // Voice speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage === 'ne' ? 'ne-NP' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsVoiceRecording(false);
      };

      recognition.onerror = () => {
        setIsVoiceRecording(false);
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      setErrorBanner('Speech recognition is not supported in this browser.');
      return;
    }

    if (isVoiceRecording) {
      recognitionRef.current.stop();
      setIsVoiceRecording(false);
    } else {
      try {
        recognitionRef.current.lang = selectedLanguage === 'ne' ? 'ne-NP' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
        setIsVoiceRecording(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsVoiceRecording(false);
      }
    }
  };

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
    setAttachedFiles([]);
    setIsPlusMenuOpen(false);
    textareaRef.current?.focus();
  };

  const selectThread = (threadId: string) => {
    const found = threads.find((t) => t.id === threadId);
    if (found) {
      setActiveThreadId(found.id);
      setMessages(found.messages);
      setSelectedModel(found.model || 'gpt-4o');
      setSelectedLanguage(found.language || 'ne');
      setAttachedFiles([]);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, content: content || '', size: file.size },
        ]);
      };
      reader.readAsText(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsPlusMenuOpen(false);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (customPrompt?: string) => {
    let textToSend = (customPrompt !== undefined ? customPrompt : inputPrompt).trim();
    
    // If files are attached, prepend file context
    if (attachedFiles.length > 0) {
      const fileContext = attachedFiles
        .map((f) => `--- Attached File: ${f.name} ---\n${f.content.slice(0, 3000)}`)
        .join('\n\n');
      textToSend = `${textToSend}\n\n${fileContext}`;
    }

    if (!textToSend || isLoading) return;

    // Check if user is issuing direct /image or /img command
    if (textToSend.startsWith('/image ') || textToSend.startsWith('/img ')) {
      const cleanPrompt = textToSend.replace(/^\/(image|img)\s+/i, '').trim();
      setInputPrompt('');
      setAttachedFiles([]);
      openTextToImageModal(cleanPrompt);
      return;
    }

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
    setAttachedFiles([]);
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
      .map((m) => `### ${m.role === 'user' ? '👤 तपाईं (User)' : `🤖 HamroAI (${m.model || selectedModel})`} [${m.timestamp}]\n\n${m.content}\n\n---\n`)
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

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? undefined! : type,
    }));
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    // Find last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message
      const pruned = messages.slice(0, -1);
      setMessages(pruned);
      handleSendMessage(lastUserMsg.content);
    }
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

  const openTextToImageModal = (initialPrompt?: string) => {
    const p = (initialPrompt || inputPrompt || '').trim();
    setImageModalPrompt(p);
    setImageModalError(null);
    setGeneratedImageResult(null);
    setIsImageModalOpen(true);
    setIsPlusMenuOpen(false);
  };

  const handleGenerateGptImage = async () => {
    const prompt = imageModalPrompt.trim();
    if (!prompt) {
      setImageModalError('कृपया चित्रको विवरण (prompt) प्रविष्ट गर्नुहोस्');
      return;
    }
    if (!user) {
      onOpenAuth();
      return;
    }
    setIsGeneratingImage(true);
    setImageModalError(null);
    try {
      const resp = await apiGenerateImage(user.id, prompt, 'gpt-image-1.5', 'hd', {
        aspectRatio: imageModalRatio,
      });
      if (resp && resp.result && resp.result.url) {
        setGeneratedImageResult(resp.result);
      } else {
        throw new Error('No image URL returned from Azure GPT-Image-1.5');
      }
    } catch (err: any) {
      console.error('GPT-Image-1.5 generation error:', err);
      setImageModalError(err.message || 'Image generation failed');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const insertGeneratedImageIntoChat = () => {
    if (!generatedImageResult) return;
    const assistantMsg: HamroChatMessage = {
      id: `img_${Date.now()}`,
      role: 'assistant',
      content: `यहाँ तपाईंको कलाकृति तयार छ:\n**"${imageModalPrompt}"**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
      imageUrl: generatedImageResult.url,
      imageMetadata: {
        model: generatedImageResult.model || 'gpt-image-1.5',
        resolution: generatedImageResult.resolution || '1024x1024',
        engine: generatedImageResult.engine || 'Azure AI Foundry',
      },
    };
    const updated = [...messages, assistantMsg];
    setMessages(updated);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, messages: updated } : t))
    );
    setIsImageModalOpen(false);
  };

  // Filtered threads for search
  const filteredThreads = threads.filter((t) => {
    if (!conversationSearch) return true;
    const q = conversationSearch.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  // Relative timestamp helper
  const getRelativeTimeLabel = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Just now';
    if (diffHours < 1) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

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
              <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 font-mono text-xs md:text-sm shadow-lg">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-slate-400">
                  <span className="flex items-center gap-1.5 uppercase font-semibold tracking-wide text-xs text-amber-400">
                    <Code2 className="w-3.5 h-3.5" />
                    {lang || 'code'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(code, codeId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
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
                <pre className="p-4 overflow-x-auto text-slate-100 whitespace-pre">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          return (
            <div key={index} className="whitespace-pre-wrap">
              {part.split('\n').map((line, lIdx) => {
                // Bullet points
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                  return (
                    <li key={lIdx} className="ml-4 list-disc text-slate-200">
                      {formatInlineMarkdown(line.trim().substring(2))}
                    </li>
                  );
                }
                // Numbered list
                const numMatch = line.match(/^(\d+)\.\s(.*)$/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex gap-2 ml-1 text-slate-200">
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

                return <p key={lIdx} className="text-slate-200">{formatInlineMarkdown(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });
  };

  return (
    <div id="hamroai-root-container" className="flex h-[calc(100vh-3.25rem)] w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* ─────────────────────────────────────────────────────────────
          ZONE 1: LEFT AI WORKSPACE SIDEBAR
          ───────────────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl flex-shrink-0 transition-all duration-200 ease-in-out z-20 ${
          isSidebarCollapsed ? 'w-16' : 'w-72 md:w-80'
        }`}
      >
        {/* Top Header: New Chat Button & Collapse Toggle */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
          {!isSidebarCollapsed ? (
            <>
              <button
                onClick={createNewThread}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-[0_0_16px_rgba(6,182,212,0.3)] transition active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <button
                onClick={createNewThread}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md hover:scale-105 transition"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Section 1: AI WORKSPACE Tools */}
        <div className="p-2.5 border-b border-slate-800/60 space-y-1">
          {!isSidebarCollapsed && (
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AI Workspace
            </div>
          )}

          {/* Templates */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'
            } rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer`}
            title="Templates (Prompt Library)"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                <BookOpen className="w-4 h-4" />
              </div>
              {!isSidebarCollapsed && <span className="text-xs font-medium">Templates</span>}
            </div>
            {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />}
          </button>

          {/* AI Storyboard Generator */}
          <button
            onClick={() => setIsStoryboardModalOpen(true)}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'
            } rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer`}
            title="AI Storyboard Generator (Summarize scripts to Video Studio)"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="p-1 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition">
                <Film className="w-4 h-4" />
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left truncate">
                  <div className="text-xs font-medium truncate">AI Storyboard Generator</div>
                  <div className="text-[10px] text-slate-500 truncate">Summarize scripts to Video Studio</div>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition" />}
          </button>

          {/* Image to Image */}
          <button
            onClick={() => onNavigateTab?.('image_studio')}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
            } rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer`}
            title="Image to Image Studio"
          >
            <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition">
              <ImageIcon className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <span className="text-xs font-medium">Image to Image</span>}
          </button>

          {/* Text to Image (GPT-Image-1.5) */}
          <button
            onClick={() => openTextToImageModal()}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
            } rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer`}
            title="Text to Image (GPT-Image-1.5 Azure AI Foundry)"
          >
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-medium">Text to Image</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">1.5</span>
              </div>
            )}
          </button>

          {/* Code Assistant */}
          <button
            onClick={() => handleSendMessage('कृपया मलाई निम्न समस्याको लागि सफा, सुरक्षित र अप्टिमाइज्ड कोड लेख्न मद्दत गर्नुहोस्:\n\n[समस्या वा भाषा यहाँ उल्लेख गर्नुहोस्]')}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
            } rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer`}
            title="Code Assistant"
          >
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
              <Code2 className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <span className="text-xs font-medium">Code Assistant</span>}
          </button>

          {/* Research & Analysis */}
          <button
            onClick={() => handleSendMessage('नेपाल र अन्तर्राष्ट्रिय सन्दर्भमा [विषय] को विस्तृत अनुसन्धान, तथ्यपरक विश्लेषण र मुख्य निष्कर्षहरू तयार गर्नुहोस्।')}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
            } rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer`}
            title="Research & Analysis"
          >
            <div className="p-1 rounded-md bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition">
              <Compass className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <span className="text-xs font-medium">Research & Analysis</span>}
          </button>

          {/* Translation */}
          <button
            onClick={() => handleSendMessage('तल दिइएको पाठलाई नेपाली, अङ्ग्रेजी र हिन्दी बीच शुद्ध व्याकरण र प्राकृतिक शैलीमा अनुवाद गर्नुहोस्:\n\n"[पाठ यहाँ राख्नुहोस्]"')}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
            } rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition group cursor-pointer`}
            title="Translation Studio"
          >
            <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
              <Languages className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <span className="text-xs font-medium">Translation</span>}
          </button>

          {/* More Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMoreToolsOpen(!isMoreToolsOpen)}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'
              } rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition cursor-pointer`}
              title="More AI Creation Studios"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-slate-800 text-slate-400">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                {!isSidebarCollapsed && <span className="text-xs font-medium">More Tools</span>}
              </div>
              {!isSidebarCollapsed && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreToolsOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isMoreToolsOpen && !isSidebarCollapsed && (
              <div className="mt-1 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl space-y-0.5 animate-fade-in">
                <button
                  onClick={() => { onNavigateTab?.('tts_studio'); setIsMoreToolsOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition"
                >
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  <span>Nepali Voiceover Studio</span>
                </button>
                <button
                  onClick={() => { onNavigateTab?.('sora_studio'); setIsMoreToolsOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition"
                >
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sora-2 AI Video Studio</span>
                </button>
                <button
                  onClick={() => { onNavigateTab?.('video_studio'); setIsMoreToolsOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left transition"
                >
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Video Timeline Editor</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: CONVERSATIONS List & Search */}
        {!isSidebarCollapsed ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-800/60">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                <span>Conversations</span>
                <span className="text-[9px] text-slate-500 font-normal">{filteredThreads.length} total</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
                />
                {conversationSearch && (
                  <button
                    onClick={() => setConversationSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredThreads.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  {conversationSearch ? 'No matching conversations' : 'No conversations yet'}
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => selectThread(thread.id)}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition relative ${
                        isActive
                          ? 'bg-blue-950/50 text-cyan-200 font-semibold border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : 'text-slate-300 hover:bg-slate-900/80 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2 min-w-0">
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <div className="truncate">
                          <div className="truncate text-xs font-medium">{thread.title || 'नयाँ सम्वाद'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-slate-500 group-hover:hidden">
                          {getRelativeTimeLabel(thread.createdAt)}
                        </span>
                        <button
                          onClick={(e) => deleteThread(thread.id, e)}
                          title="Delete conversation"
                          className="hidden group-hover:flex p-1 text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom: View All Conversations */}
            <div className="p-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <button
                onClick={() => setConversationSearch('')}
                className="text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 font-medium"
              >
                <span>View All Conversations</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              {threads.length > 0 && (
                <button
                  onClick={exportChatAsMarkdown}
                  title="Export active conversation"
                  className="p-1 hover:text-white text-slate-500 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 flex flex-col items-center gap-1.5">
            {threads.slice(0, 8).map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => selectThread(thread.id)}
                  title={thread.title}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    isActive
                      ? 'bg-blue-950/80 border border-cyan-500/50 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}

        {/* Azure Deployment Status Indicator */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Azure Foundry Active</span>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-mono font-semibold">gpt-4o / mini</span>
            </div>
          ) : (
            <div className="flex justify-center" title="Azure OpenAI Active">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          ZONE 2 & 3: CONVERSATION AREA & SMART FLOATING COMPOSER
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 relative">
        
        {/* Subtle Ambient Himalayan Sunrise Backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-indigo-900/10 to-transparent" />
        
        {/* Top Header: Model, Language & Quick Actions */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 z-10">
          {/* Left: Identity & Language Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 p-0.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400 font-black text-sm">
                ✦
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-extrabold text-white tracking-tight">HamroAI</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Multilingual LLM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                नेपाली (देवनागरी/रोमन) • हिंदी • English (Global)
              </p>
            </div>
          </div>

          {/* Right: Model & Language Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Model Selector Pills */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs shadow-sm">
              <button
                onClick={() => setSelectedModel('gpt-4o')}
                className={`px-3 py-1 rounded-lg transition font-semibold text-xs cursor-pointer ${
                  selectedModel === 'gpt-4o'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="GPT-4o: Multilingual, Creative, High-Quality Reasoning"
              >
                GPT-4o
              </button>
              <button
                onClick={() => setSelectedModel('gpt-5-mini')}
                className={`px-3 py-1 rounded-lg transition font-semibold text-xs cursor-pointer ${
                  selectedModel === 'gpt-5-mini'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="GPT-5-mini: Ultra Fast & Code Reasoning"
              >
                GPT-5-mini
              </button>
            </div>

            {/* Language Selector Dropdown */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-xs gap-2 shadow-sm">
              <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as HamroAiLanguage;
                  setSelectedLanguage(newLang);
                  localStorage.setItem('hamroai_preferred_language', newLang);
                }}
                className="bg-transparent text-slate-100 outline-none cursor-pointer pr-1 font-semibold text-xs"
              >
                <option value="ne" className="bg-slate-900 text-white">🇳🇵 नेपाली (Nepali)</option>
                <option value="hi" className="bg-slate-900 text-white">🇮🇳 हिंदी (Hindi)</option>
                <option value="en" className="bg-slate-900 text-white">🌐 English (Global)</option>
                <option value="auto" className="bg-slate-900 text-white">Auto-Detect</option>
              </select>

              {/* System Prompt / Settings Modal Trigger */}
              <button
                onClick={() => setShowSystemPromptModal(true)}
                className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                title="Active System Prompt & Unicode Directives"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prompt Templates Button */}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition cursor-pointer shadow-sm"
              title="Open 25+ Prompt Templates Gallery"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            {/* Markdown Export Button */}
            {messages.length > 0 && (
              <button
                onClick={exportChatAsMarkdown}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Export conversation as Markdown"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Error Banner */}
        {errorBanner && (
          <div className="px-4 py-2.5 bg-red-950/80 border-b border-red-800 text-red-200 text-xs flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button onClick={() => setErrorBanner(null)} className="p-1 text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            CONVERSATION STREAMING / MESSAGES CONTAINER
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-0">
          
          {/* EMPTY LANDING STATE (Matching hamroAI UI.png design!) */}
          {messages.length === 0 ? (
            <div className="max-w-4xl mx-auto py-6 md:py-10 flex flex-col items-center text-center animate-fade-in">
              
              {/* Glowing HamroAI Emblem Icon */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-600 to-amber-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-slate-900/90 border border-slate-700/80 p-1 flex items-center justify-center shadow-2xl">
                  <div className="w-full h-full rounded-[14px] md:rounded-[20px] bg-gradient-to-tr from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-300">
                      ✦
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Heading */}
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                नमस्ते ! म <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">HamroAI</span> हुँ।
              </h2>
              
              {/* Subtitle */}
              <p className="text-base md:text-lg font-medium text-slate-200 mb-1">
                तपाईंको बहुभाषिक AI workspace
              </p>
              
              {/* Language Capability Explanation */}
              <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto mb-6">
                नेपाली, हिन्दी र अंग्रेजीमा स्मार्ट सहायक, सिर्जनात्मक र उत्पादक कामका लागि।
              </p>

              {/* Quick Model & Language Selector Bar */}
              <div className="flex items-center gap-2 mb-8 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-lg flex-wrap justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedModel.toUpperCase()}</span>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium">
                  <span>{selectedLanguage === 'ne' ? '🇳🇵 नेपाली (Nepali)' : selectedLanguage === 'hi' ? '🇮🇳 हिंदी (Hindi)' : '🌐 English (Global)'}</span>
                </div>

                <button
                  onClick={() => setShowSystemPromptModal(true)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Settings & System Prompt"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Browse Templates"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>

              {/* 6 Category Action Cards (2 rows of 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 w-full max-w-3xl text-left mb-8">
                
                {/* 1. Write */}
                <button
                  onClick={() => handleSendMessage('कृपया [विषय] मा एक उच्च प्रभावकारी, आकर्षक र एसईओ-अनुकूल नेपाली ब्लग/कन्टेन्ट लेख्नुहोस्।')}
                  className="p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-cyan-500/50 shadow-md hover:shadow-cyan-500/10 transition duration-150 flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-blue-500/20 transition">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition">Write</div>
                    <div className="text-xs text-slate-400">Blogs, Emails, Content</div>
                  </div>
                </button>

                {/* 2. Analyze */}
                <button
                  onClick={() => handleSendMessage('तल दिइएको डेटा वा विषयको गहन विश्लेषण, मुख्य निष्कर्ष र व्यावहारिक सिफारिसहरू तयार गर्नुहोस्:\n\n[विषय वा विवरण यहाँ राख्नुहोस्]')}
                  className="p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-purple-500/50 shadow-md hover:shadow-purple-500/10 transition duration-150 flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-purple-500/20 transition">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-purple-300 transition">Analyze</div>
                    <div className="text-xs text-slate-400">Data, Reports, Insights</div>
                  </div>
                </button>

                {/* 3. Create */}
                <button
                  onClick={() => handleSendMessage('नेपालको सन्दर्भमा [विषय] को लागि ५ वटा भाइरल र रचनात्मक आइडियाहरू, भिडियो अवधारणा र दृश्य योजना बनाउनुहोस्।')}
                  className="p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-amber-500/50 shadow-md hover:shadow-amber-500/10 transition duration-150 flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-amber-500/20 transition">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-amber-300 transition">Create</div>
                    <div className="text-xs text-slate-400">Ideas, Images, Videos</div>
                  </div>
                </button>

                {/* 4. Translate */}
                <button
                  onClick={() => handleSendMessage('तलको पाठलाई नेपाली, हिन्दी र अङ्ग्रेजी बीच शुद्ध र प्राकृतिक शैलीमा अनुवाद गर्नुहोस्:\n\n"[पाठ यहाँ राख्नुहोस्]"')}
                  className="p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-emerald-500/50 shadow-md hover:shadow-emerald-500/10 transition duration-150 flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/20 transition">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition">Translate</div>
                    <div className="text-xs text-slate-400">Multi-language</div>
                  </div>
                </button>

                {/* 5. Code */}
                <button
                  onClick={() => handleSendMessage('कृपया निम्न प्रोग्रामिङ समस्या समाधान गर्न सफा र प्रभावकारी कोड लेख्नुहोस्:\n\n[समस्या वा फिचरको विवरण]')}
                  className="p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-teal-500/50 shadow-md hover:shadow-teal-500/10 transition duration-150 flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-teal-500/20 transition">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-teal-300 transition">Code</div>
                    <div className="text-xs text-slate-400">Develop, Debug, Explain</div>
                  </div>
                </button>

                {/* 6. Research */}
                <button
                  onClick={() => handleSendMessage('[विषय] बारे तथ्यपरक अनुसन्धान, ऐतिहासिक पृष्ठभूमि, वर्तमान अवस्था र भविष्यको सम्भाव्यता सम्बन्धी विस्तृत सारांश प्रस्तुत गर्नुहोस्।')}
                  className="p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-sky-500/50 shadow-md hover:shadow-sky-500/10 transition duration-150 flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-sky-500/20 transition">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-sky-300 transition">Research</div>
                    <div className="text-xs text-slate-400">Find, Summarize, Learn</div>
                  </div>
                </button>
              </div>

              {/* Quick Starters Section */}
              <div className="w-full max-w-3xl text-left">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Starters</span>
                  </div>
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>View All Templates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* Starter 1: Nepali Blog Post */}
                  <button
                    onClick={() => handleSendMessage(HAMRO_PROMPT_TEMPLATES[0].prompt)}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                        <PenTool className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white group-hover:text-blue-300 truncate">ब्लग पोष्ट लेख्नुहोस्</div>
                        <div className="text-[10px] text-slate-400 truncate">SEO friendly नेपाली लेख</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition flex-shrink-0 ml-1" />
                  </button>

                  {/* Starter 2: AI Storyboard */}
                  <button
                    onClick={() => setIsStoryboardModalOpen(true)}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition flex items-center justify-between group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition">
                        <Film className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">AI स्टोरीबोर्ड</div>
                        <div className="text-[10px] text-slate-400 truncate">Video script to storyboard</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition flex-shrink-0 ml-1" />
                  </button>

                  {/* Starter 3: Code Generation */}
                  <button
                    onClick={() => handleSendMessage('कृपया निम्न प्रोग्रामिङ समस्या समाधान गर्न सफा र प्रभावकारी कोड लेख्नुहोस्:\n\n[समस्या वा फिचरको विवरण]')}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition flex items-center justify-between group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition">
                        <Code className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white group-hover:text-teal-300 truncate">कोड लेख्नुहोस्</div>
                        <div className="text-[10px] text-slate-400 truncate">Code generation & help</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition flex-shrink-0 ml-1" />
                  </button>

                  {/* Starter 4: Translation */}
                  <button
                    onClick={() => handleSendMessage('कृपया तलको पाठलाई शुद्ध र स्वाभाविक नेपालीमा अनुवाद गर्नुहोस्:\n\n"[English text here]"')}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                        <Languages className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate">अनुवाद गर्नुहोस्</div>
                        <div className="text-[10px] text-slate-400 truncate">English ⇄ Nepali</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition flex-shrink-0 ml-1" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* CONVERSATION MESSAGES STREAM */
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400 font-black text-xs">
                          ✦
                        </div>
                      </div>
                    )}

                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%]`}>
                      {/* Message Meta Info */}
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">
                          {isUser ? (user?.name || 'तपाईं (You)') : `HamroAI (${msg.model || selectedModel})`}
                        </span>
                        <span>{msg.timestamp}</span>
                        {msg.tokens && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                            {msg.tokens} tokens
                          </span>
                        )}
                      </div>

                      {/* Message Body Card */}
                      <div
                        className={`p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-br-xs shadow-lg'
                            : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-xs shadow-md'
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          renderMessageContent(msg.content, msg.id)
                        )}

                        {/* Generated Image Attachment (GPT-Image-1.5) */}
                        {msg.imageUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/60 shadow-lg">
                            <div className="relative group max-h-[420px] flex items-center justify-center bg-black/40 overflow-hidden">
                              <img
                                src={msg.imageUrl}
                                alt="Generated Art"
                                className="w-full max-h-[420px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  GPT-IMAGE-1.5
                                </span>
                                <span className="text-[11px] text-slate-400 hidden sm:inline">Azure Photorealistic</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={msg.imageUrl}
                                  download="nepalai-art.png"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 transition"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </a>
                                <button
                                  onClick={() => transferToImageStudio(msg.content)}
                                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 transition"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Studio</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Toolbar under Assistant Message */}
                      {!isUser && (
                        <div className="flex items-center gap-2 mt-2 px-1 text-xs text-slate-400 flex-wrap">
                          {/* Copy Response */}
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px] font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy Text</span>
                              </>
                            )}
                          </button>

                          {/* Send to Video Timeline */}
                          <button
                            onClick={() => transferToVideoStudio(msg.content)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition"
                            title="Transfer script to Video Studio Timeline"
                          >
                            <Film className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[11px] font-medium">Timeline</span>
                          </button>

                          {/* Send to Voice Studio */}
                          <button
                            onClick={() => transferToVoiceStudio(msg.content)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 transition"
                            title="Synthesize Voiceover in Voice Studio"
                          >
                            <Mic className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px] font-medium">Voice Studio</span>
                          </button>

                          {/* Send to Sora Studio */}
                          <button
                            onClick={() => transferToSoraStudio(msg.content.slice(0, 300))}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 transition"
                            title="Synthesize Video in Sora-2 Studio"
                          >
                            <Video className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[11px] font-medium">Sora-2</span>
                          </button>

                          {/* Text to Image with GPT-Image-1.5 */}
                          <button
                            onClick={() => openTextToImageModal(msg.content.slice(0, 300))}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition"
                            title="Generate photorealistic artwork with GPT-Image-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] font-medium">Text to Image</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300 font-bold">1.5</span>
                          </button>

                          {/* Thumbs Up / Down Feedback */}
                          <div className="flex items-center gap-0.5 ml-1 border-l border-slate-800 pl-1">
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1 rounded-md transition ${feedbackMap[msg.id] === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                              title="Good response"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1 rounded-md transition ${feedbackMap[msg.id] === 'down' ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                              title="Poor response"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-xl object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Streaming / Loading Indicator */}
              {isLoading && (
                <div className="flex gap-3.5 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center flex-shrink-0 animate-pulse">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400 font-black text-xs">
                      ✦
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl rounded-bl-none bg-slate-900 border border-slate-800 text-slate-300 text-sm flex items-center gap-2 shadow-md">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-slate-400 ml-1.5 font-medium">
                      HamroAI ({selectedModel}) जवाफ तयार गर्दैछ...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            VIRTUAL DEVANAGARI SYMBOLS BAR (EXPANDABLE)
            ───────────────────────────────────────────────────────────── */}
        {showSymbolPalette && (
          <div className="px-4 py-2 bg-slate-900/95 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs z-10 animate-fade-in shadow-inner">
            <span className="text-[10px] font-bold text-amber-400 uppercase flex-shrink-0 mr-1.5 flex items-center gap-1">
              <span>चिह्नहरू (Symbols):</span>
            </span>
            {DEVANAGARI_SYMBOLS.map((s) => (
              <button
                key={s.label}
                onClick={() => insertSymbol(s.label)}
                title={s.name}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-mono text-xs transition flex-shrink-0 cursor-pointer font-bold"
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setShowSymbolPalette(false)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-300 ml-auto flex-shrink-0"
              title="Close symbols bar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            ZONE 3: SMART FLOATING COMPOSER (SIGNATURE ELEMENT)
            ───────────────────────────────────────────────────────────── */}
        <div className="p-3 md:p-4 z-10 w-full">
          <div className="max-w-4xl mx-auto">
            
            {/* Attached Files Preview Chips */}
            {attachedFiles.length > 0 && (
              <div className="flex items-center gap-2 mb-2 overflow-x-auto py-1">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate max-w-[140px]">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-500 hover:text-red-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* FLOATING SIGNATURE COMPOSER CAPSULE (Matching hamroAI UI.png) */}
            <div className="relative rounded-2xl md:rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 focus-within:border-cyan-500/80 shadow-[0_8px_30px_rgba(0,0,0,0.6)] focus-within:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition duration-200 p-2 md:p-3">
              
              {/* Top Row: Action Button + Auto-expanding Textarea */}
              <div className="flex items-start gap-2">
                
                {/* [ + ] Action Dropdown Trigger */}
                <div className="relative mt-1">
                  <button
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                    className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow-sm"
                    title="Quick Actions & Attachments"
                  >
                    <Plus className={`w-4 h-4 transition-transform ${isPlusMenuOpen ? 'rotate-45 text-cyan-400' : ''}`} />
                  </button>

                  {/* Popover Menu */}
                  {isPlusMenuOpen && (
                    <div className="absolute left-0 bottom-11 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-1 z-30 animate-fade-in">
                      <button
                        onClick={() => { setIsTemplateModalOpen(true); setIsPlusMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition text-left"
                      >
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="font-semibold">Browse Templates</div>
                          <div className="text-[10px] text-slate-400">25+ curated prompts</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { openTextToImageModal(inputPrompt); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition text-left"
                      >
                        <Sparkles className="w-4 h-4 text-rose-400" />
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>Text to Image</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">1.5</span>
                          </div>
                          <div className="text-[10px] text-slate-400">GPT-Image 1.5 Photorealistic</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setIsStoryboardModalOpen(true); setIsPlusMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition text-left"
                      >
                        <Film className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="font-semibold">AI Storyboard Generator</div>
                          <div className="text-[10px] text-slate-400">Convert scripts to scenes</div>
                        </div>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition text-left"
                      >
                        <Paperclip className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-semibold">Attach Text / Code Document</div>
                          <div className="text-[10px] text-slate-400">.txt, .md, .json, .csv, code</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setShowSystemPromptModal(true); setIsPlusMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition text-left"
                      >
                        <Settings className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-semibold">System Prompt & Directives</div>
                          <div className="text-[10px] text-slate-400">Unicode & Custom Persona</div>
                        </div>
                      </button>

                      <div className="border-t border-slate-800 my-1" />

                      <button
                        onClick={createNewThread}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition text-left"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Start Fresh Conversation</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Textarea Input */}
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
                  className="w-full py-2.5 px-2 bg-transparent text-slate-100 placeholder:text-slate-400 text-sm md:text-base resize-none outline-none max-h-36 overflow-y-auto leading-relaxed"
                  style={{ minHeight: '48px' }}
                />
              </div>

              {/* Bottom Controls Row inside Composer */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                
                {/* Left Controls: Unicode Toggle, Attach, Tools */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  
                  {/* Unicode Pill Toggle */}
                  <button
                    onClick={() => setIsUnicodeMode(!isUnicodeMode)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition text-xs font-semibold cursor-pointer ${
                      isUnicodeMode
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-xs'
                        : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Phonetic Roman-to-Devanagari Unicode transliteration on space"
                  >
                    <div className={`w-2 h-2 rounded-full ${isUnicodeMode ? 'bg-purple-400' : 'bg-slate-500'}`} />
                    <span>Unicode: {isUnicodeMode ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Attach Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Attach file"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach</span>
                  </button>

                  {/* Tools / Symbols Button */}
                  <button
                    onClick={() => setShowSymbolPalette(!showSymbolPalette)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                      showSymbolPalette ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Toggle Nepali Devanagari Symbols"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Tools</span>
                  </button>
                </div>

                {/* Right Controls: Mic + Send Button */}
                <div className="flex items-center gap-2">
                  
                  {/* Speech Recognition Mic */}
                  <button
                    onClick={toggleVoiceRecording}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isVoiceRecording
                        ? 'bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isVoiceRecording ? 'Listening... click to stop' : 'Speak to type (Voice Input)'}
                  >
                    {isVoiceRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={(!inputPrompt.trim() && attachedFiles.length === 0) || isLoading}
                    className={`w-9 h-9 rounded-xl font-medium transition flex items-center justify-center cursor-pointer shadow-md ${
                      (!inputPrompt.trim() && attachedFiles.length === 0) || isLoading
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95'
                    }`}
                    title="Send message (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Keyboard Hint */}
            <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] text-slate-500">
              <div>
                Shift + Enter for new line • Enter to send
              </div>
              <div>
                {user ? (
                  <span>Credits: <strong className="text-amber-400 font-semibold">{user.credits}</strong></span>
                ) : (
                  <button onClick={onOpenAuth} className="text-cyan-400 hover:underline">
                    Sign in to chat
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: PROMPT TEMPLATES GALLERY
          ───────────────────────────────────────────────────────────── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: SYSTEM PROMPT & UNICODE DIRECTIVES
          ───────────────────────────────────────────────────────────── */}
      {showSystemPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">System Prompt & Unicode Directives</h3>
                  <p className="text-xs text-slate-400">Devanagari script integrity (U+0900–U+097F) and custom AI persona.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSystemPromptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unicode Specifications Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-amber-300 block">Strict Devanagari Unicode Engine Active:</span>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                <li><strong className="text-white">Purna Viram:</strong> Enforces <code className="text-amber-400 font-mono">।</code> (U+0964) instead of western period for sentence terminations.</li>
                <li><strong className="text-white">Ligature & Matra Preservation:</strong> Preserves conjunct clusters (e.g., क्ष, त्र, ज्ञ) and avoids raw ASCII fallback.</li>
                <li><strong className="text-white">Nepali Honorifics:</strong> Natural polite register (<span className="text-amber-300">तपाईं, हजुर</span>).</li>
                <li><strong className="text-white">Transliteration Bridge:</strong> Understands Romanized Nepali (e.g., "Kasto chha?") and responds in fluent Devanagari.</li>
              </ul>
            </div>

            {/* Custom System Instruction Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Custom Instructions (Optional Persona/Style):</span>
                <span className="text-[10px] text-slate-500">Appended to model instructions</span>
              </label>
              <textarea
                value={customSystemInstruction}
                onChange={(e) => {
                  setCustomSystemInstruction(e.target.value);
                  localStorage.setItem('hamroai_custom_system_instruction', e.target.value);
                }}
                placeholder="उदा: सधैं संक्षिप्त र बुँदागत उत्तर दिनुहोस्। प्रविधिको व्याख्या गर्दा व्यावहारिक उदाहरण दिनुहोस्... (e.g. Always reply with concise bullet points and practical Nepali examples)"
                rows={4}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500/80 transition"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => {
                  setCustomSystemInstruction('');
                  localStorage.removeItem('hamroai_custom_system_instruction');
                }}
                className="text-slate-400 hover:text-red-400 text-[11px]"
              >
                Clear Custom Instructions
              </button>
              <button
                onClick={() => setShowSystemPromptModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: AI STORYBOARD GENERATOR
          ───────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: TEXT TO IMAGE (GPT-IMAGE-1.5 PHOTOREALISTIC STUDIO)
          ───────────────────────────────────────────────────────────── */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500/20 to-orange-500/20 text-rose-400 border border-rose-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Text to Image Studio</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      GPT-Image 1.5
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Azure AI Foundry Photorealistic Neural Art Generator</p>
                </div>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Prompt Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Image Description / Prompt (तस्बिरको विवरण):</span>
                  <span className="text-[10px] text-slate-500">English, Nepali, or Hindi</span>
                </label>
                <textarea
                  value={imageModalPrompt}
                  onChange={(e) => setImageModalPrompt(e.target.value)}
                  placeholder="उदा: बिहानको सूर्यको किरणमा सगरमाथाको मनमोहक दृश्य, फोटोरियलिस्टिक, ८K (e.g. Mount Everest glowing under golden morning sunrise, photorealistic 8k)..."
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 outline-none focus:border-rose-500/80 transition resize-none"
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Aspect Ratio (अनुपात):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1:1', label: 'Square (1:1)', desc: 'Instagram / Avatar' },
                    { id: '16:9', label: 'Landscape (16:9)', desc: 'YouTube / Cinema' },
                    { id: '9:16', label: 'Portrait (9:16)', desc: 'TikTok / Story / Reel' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setImageModalRatio(ratio.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        imageModalRatio === ratio.id
                          ? 'border-rose-500 bg-rose-500/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{ratio.label}</div>
                      <div className="text-[10px] text-slate-500">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {imageModalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{imageModalError}</span>
                </div>
              )}

              {/* Generated Image Result Display */}
              {generatedImageResult && (
                <div className="space-y-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 animate-fade-in">
                  <div className="relative group max-h-[360px] rounded-xl overflow-hidden bg-black/50 flex items-center justify-center">
                    <img
                      src={generatedImageResult.url}
                      alt="Generated Art"
                      className="w-full max-h-[360px] object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        Generated by GPT-Image-1.5
                      </span>
                      <span className="text-slate-400 text-[11px]">{generatedImageResult.resolution || '1024x1024'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={generatedImageResult.url}
                        download="nepalai-gpt-image.png"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Download PNG</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
              <div>
                {generatedImageResult ? (
                  <button
                    onClick={insertGeneratedImageIntoChat}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert into Chat Thread</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      transferToImageStudio(imageModalPrompt);
                      setIsImageModalOpen(false);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Full Image Studio</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
                >
                  Close
                </button>
                <button
                  onClick={handleGenerateGptImage}
                  disabled={isGeneratingImage || !imageModalPrompt.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 transition cursor-pointer ${
                    isGeneratingImage || !imageModalPrompt.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95'
                  }`}
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating with GPT-Image-1.5...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{generatedImageResult ? 'Regenerate Art' : 'Generate with GPT-Image-1.5'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
