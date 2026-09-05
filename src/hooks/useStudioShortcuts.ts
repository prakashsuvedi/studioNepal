import { useEffect } from 'react';

interface StudioShortcutsHandlers {
  onTogglePlay?: () => void;
  onSaveProject?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSplit?: () => void;
  onDeleteScene?: () => void;
  onStepBack?: () => void;
  onStepForward?: () => void;
  onJumpStart?: () => void;
  onJumpEnd?: () => void;
  onOpenTemplates?: () => void;
  onOpenAssets?: () => void;
  onOpenWorkspaces?: () => void;
  onOpenHelp?: () => void;
  onToggleTheme?: () => void;
  onFitToWindow?: () => void;
}

export const useStudioShortcuts = (
  handlers: StudioShortcutsHandlers,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, contenteditable, or select element
      const target = e.target as HTMLElement | null;
      const isInput = 
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        );

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      // 1. Manual Project Save (Ctrl + S / Cmd + S) -> ALWAYS prevent default browser save
      if (isModifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        handlers.onSaveProject?.();
        return;
      }

      // 2. Undo / Redo (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
      if (isModifier && e.key.toLowerCase() === 'z') {
        if (!isInput) {
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onRedo?.();
          } else {
            handlers.onUndo?.();
          }
          return;
        }
      }

      if (isModifier && e.key.toLowerCase() === 'y' && !isInput) {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // 3. Help Cheatsheet (? or Ctrl+/)
      if ((e.key === '?' || (isModifier && e.key === '/')) && !isInput) {
        e.preventDefault();
        handlers.onOpenHelp?.();
        return;
      }

      // 4. Toggle Dark / Light Theme (Shift + D)
      if (e.shiftKey && e.key.toLowerCase() === 'd' && !isInput) {
        e.preventDefault();
        handlers.onToggleTheme?.();
        return;
      }

      // If user is focused on an input, don't execute any single-key timeline actions
      if (isInput) return;

      // 5. Play / Pause (Space)
      if (e.code === 'Space') {
        e.preventDefault();
        handlers.onTogglePlay?.();
        return;
      }

      // 6. Split at Playhead (S)
      if (e.key.toLowerCase() === 's' && !isModifier) {
        e.preventDefault();
        handlers.onSplit?.();
        return;
      }

      // 7. Delete Scene (Delete or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handlers.onDeleteScene?.();
        return;
      }

      // 8. NLE Transport Controls: J, K, L
      if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handlers.onStepBack?.();
        return;
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onTogglePlay?.();
        return;
      }
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handlers.onStepForward?.();
        return;
      }

      // 9. Jump to Beginning / End: I, O
      if (e.key.toLowerCase() === 'i' && !isModifier) {
        e.preventDefault();
        handlers.onJumpStart?.();
        return;
      }
      if (e.key.toLowerCase() === 'o' && !isModifier) {
        e.preventDefault();
        handlers.onJumpEnd?.();
        return;
      }

      // 10. Open Scene Templates (T)
      if (e.key.toLowerCase() === 't' && !isModifier) {
        e.preventDefault();
        handlers.onOpenTemplates?.();
        return;
      }

      // 11. Open Brand & Watermark Assets (B)
      if (e.key.toLowerCase() === 'b' && !isModifier) {
        e.preventDefault();
        handlers.onOpenAssets?.();
        return;
      }

      // 12. Open Workspaces (W)
      if (e.key.toLowerCase() === 'w' && !isModifier) {
        e.preventDefault();
        handlers.onOpenWorkspaces?.();
        return;
      }

      // 13. Fit to window (F)
      if (e.key.toLowerCase() === 'f' && !isModifier) {
        e.preventDefault();
        handlers.onFitToWindow?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
};
