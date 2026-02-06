import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts hook for doctor-first workflow
 *
 * Shortcuts:
 * - Ctrl/Cmd + K: Quick search (patients)
 * - Ctrl/Cmd + N: New patient
 * - Ctrl/Cmd + Q: Go to Queue
 * - Ctrl/Cmd + D: Go to Dashboard
 * - Ctrl/Cmd + P: New prescription
 * - Ctrl/Cmd + S: Save (when in forms)
 * - Esc: Close modals/cancel
 *
 * Usage:
 * useKeyboardShortcuts({
 *   onSave: () => handleSave(),
 *   onCancel: () => handleCancel(),
 *   disabled: false
 * });
 */
export default function useKeyboardShortcuts({
  onSave,
  onCancel,
  onSearch,
  disabled = false
} = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Ignore if user is typing in input/textarea
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        event.target.tagName
      );

      // Ctrl/Cmd + K: Quick search
      if (modifierKey && event.key === 'k') {
        event.preventDefault();
        if (onSearch) {
          onSearch();
        } else {
          navigate('/patients?action=search');
        }
        return;
      }

      // Ctrl/Cmd + N: New patient (only when not typing)
      if (modifierKey && event.key === 'n' && !isTyping) {
        event.preventDefault();
        navigate('/patients?action=new');
        return;
      }

      // Ctrl/Cmd + Q: Go to Queue (only when not typing)
      if (modifierKey && event.key === 'q' && !isTyping) {
        event.preventDefault();
        navigate('/queue');
        return;
      }

      // Ctrl/Cmd + D: Go to Dashboard (only when not typing)
      if (modifierKey && event.key === 'd' && !isTyping) {
        event.preventDefault();
        navigate('/doctor-dashboard');
        return;
      }

      // Ctrl/Cmd + P: New prescription (only when not typing)
      if (modifierKey && event.key === 'p' && !isTyping) {
        event.preventDefault();
        navigate('/patients?action=quick-rx');
        return;
      }

      // Ctrl/Cmd + S: Save
      if (modifierKey && event.key === 's') {
        event.preventDefault();
        if (onSave) {
          onSave();
        }
        return;
      }

      // Esc: Cancel/Close
      if (event.key === 'Escape') {
        if (onCancel) {
          onCancel();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, onSave, onCancel, onSearch, disabled]);

  // Return helper to show shortcut hints
  return {
    shortcuts: [
      { key: 'Ctrl/⌘ + K', description: 'Quick search' },
      { key: 'Ctrl/⌘ + N', description: 'New patient' },
      { key: 'Ctrl/⌘ + Q', description: 'Go to Queue' },
      { key: 'Ctrl/⌘ + D', description: 'Go to Dashboard' },
      { key: 'Ctrl/⌘ + P', description: 'New prescription' },
      { key: 'Ctrl/⌘ + S', description: 'Save' },
      { key: 'Esc', description: 'Cancel/Close' }
    ]
  };
}

/**
 * Keyboard shortcuts help component
 * Shows available shortcuts to user
 */
export function KeyboardShortcutsHelp() {
  const { shortcuts } = useKeyboardShortcuts({ disabled: true });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-md">
      <h3 className="font-bold text-lg mb-3 text-gray-900">
        Keyboard Shortcuts
      </h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
