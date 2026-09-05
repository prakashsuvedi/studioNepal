import React from 'react';
import { KeyboardShortcutItem } from '../types';
import { Command, X, Play, Scissors, Save, RotateCcw, LayoutTemplate, HelpCircle, Layers, Maximize2 } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const STUDIO_SHORTCUTS: KeyboardShortcutItem[] = [
  // Playback
  { key: 'Space', label: 'Play / Pause', action: 'Toggle timeline playback', category: 'Playback' },
  { key: 'K', label: 'Pause', action: 'Halt playback immediately', category: 'Playback' },
  { key: 'J', label: 'Rewind / Step Back', action: 'Jump playhead back 1s', category: 'Playback' },
  { key: 'L', label: 'Fast Play / Step Forward', action: 'Advance playhead 1s', category: 'Playback' },
  { key: 'I', label: 'Mark In / Jump to Start', action: 'Seek playhead to 00:00', category: 'Playback' },
  { key: 'O', label: 'Mark Out / Jump to End', action: 'Seek playhead to timeline end', category: 'Playback' },

  // Timeline & Editing
  { key: 'S', label: 'Split at Playhead', action: 'Slice current scene into two clips', category: 'Timeline & Editing' },
  { key: 'Delete / ⌫', label: 'Delete Scene', action: 'Remove active clip from timeline', category: 'Timeline & Editing' },
  { key: 'Ctrl + Z / ⌘Z', label: 'Undo', action: 'Revert last timeline modification', category: 'Timeline & Editing' },
  { key: 'Ctrl + ⇧ + Z / ⌘Y', label: 'Redo', action: 'Restore reverted timeline change', category: 'Timeline & Editing' },
  { key: 'T', label: 'Scene Templates', action: 'Open modular scene templates catalog', category: 'Timeline & Editing' },
  { key: 'B', label: 'Asset Library', action: 'Open watermark & branding drawer', category: 'Timeline & Editing' },

  // Project & System
  { key: 'Ctrl + S / ⌘S', label: 'Save Project', action: 'Force manual auto-save and export snapshot', category: 'Project & System' },
  { key: 'W', label: 'Workspaces', action: 'Open project workspaces & team manager', category: 'Project & System' },
  { key: '? / Ctrl + /', label: 'Shortcuts Cheatsheet', action: 'Show this keyboard guide', category: 'Project & System' },

  // Display & Navigation
  { key: '⇧ + D', label: 'Toggle Dark / Light', action: 'Switch between Premium Dark & Clean Light', category: 'Navigation' },
  { key: 'F', label: 'Fit to Window', action: 'Auto-scale timeline zoom to visible frame', category: 'Navigation' },
  { key: 'Esc', label: 'Dismiss / Close Modal', action: 'Close active modal or sidebar', category: 'Navigation' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const categories: KeyboardShortcutItem['category'][] = [
    'Playback',
    'Timeline & Editing',
    'Project & System',
    'Navigation',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Professional Keyboard Hotkeys</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">High-speed NLE shortcuts for timeline editing & studio navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List by Category */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {categories.map((cat) => {
            const catItems = STUDIO_SHORTCUTS.filter(s => s.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-1">
                  {cat}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.action}</div>
                      </div>
                      <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold shadow-2xs whitespace-nowrap ml-2">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono font-bold">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono font-bold">?</kbd> to toggle cheatsheet at any time</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
