import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  description: string;
  category: string;
}

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for the custom event to show help
  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true);
    window.addEventListener('showKeyboardHelp', handleShowHelp);
    return () => window.removeEventListener('showKeyboardHelp', handleShowHelp);
  }, []);

  // Keyboard shortcut to close the modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      // Ctrl+/ or Cmd+/ to toggle
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const shortcuts: KeyboardShortcut[] = [
    // Crisis & Emergency
    { key: 'H', modifiers: ['Alt'], description: 'Open Crisis Help (Global)', category: 'Emergency' },
    
    // Navigation
    { key: 'C', modifiers: ['Alt'], description: 'Focus Crisis Panel', category: 'Navigation' },
    { key: 'W', modifiers: ['Alt'], description: 'Focus Wellness Status', category: 'Navigation' },
    { key: 'S', modifiers: ['Alt'], description: 'Focus Schedule', category: 'Navigation' },
    { key: 'Q', modifiers: ['Alt'], description: 'Focus Quick Actions', category: 'Navigation' },
    
    // Quick Actions
    { key: 'M', modifiers: ['Alt'], description: 'Log Mood', category: 'Quick Actions' },
    { key: 'J', modifiers: ['Alt'], description: 'Open Journal', category: 'Quick Actions' },
    { key: 'D', modifiers: ['Alt'], description: 'Start Meditation', category: 'Quick Actions' },
    
    // General
    { key: '/', modifiers: ['Ctrl'], description: 'Show/Hide This Help', category: 'General' },
    { key: 'Tab', modifiers: [], description: 'Navigate forward through elements', category: 'General' },
    { key: 'Tab', modifiers: ['Shift'], description: 'Navigate backward through elements', category: 'General' },
    { key: 'Enter', modifiers: [], description: 'Activate focused element', category: 'General' },
    { key: 'Space', modifiers: [], description: 'Activate buttons/checkboxes', category: 'General' },
    { key: 'Esc', modifiers: [], description: 'Close dialogs/Cancel actions', category: 'General' },
  ];

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category]?.push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Detect OS for proper modifier key display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierSymbols: Record<string, string> = {
    Ctrl: isMac ? '⌘' : 'Ctrl',
    Alt: isMac ? '⌥' : 'Alt',
    Shift: '⇧',
  };

  const formatModifiers = (modifiers: string[]) => {
    return modifiers.map(mod => modifierSymbols[mod] || mod).join(' + ');
  };

  return (
    <>
      {/* Floating Help Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (Ctrl+/)"
      >
        <Keyboard className="h-5 w-5" />
      </motion.button>

      {/* Help Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              aria-hidden="true"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 
                        w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcuts-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Command className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 id="shortcuts-title" className="text-xl font-bold text-gray-900">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Quick navigation and actions throughout the dashboard
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close shortcuts help"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={`${shortcut.key}-${index}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm text-gray-700">{shortcut.description}</span>
                          <div className="flex items-center space-x-1">
                            {shortcut.modifiers.length > 0 && (
                              <>
                                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
                                  {formatModifiers(shortcut.modifiers)}
                                </kbd>
                                {shortcut.key && <span className="text-gray-400">+</span>}
                              </>
                            )}
                            {shortcut.key && (
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded min-w-[28px] text-center">
                                {shortcut.key}
                              </kbd>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Additional Tips */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Accessibility Tips
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• All interactive elements are keyboard accessible</li>
                    <li>• Crisis support is always available with Alt+H</li>
                    <li>• Use Tab to navigate between widgets</li>
                    <li>• Press Enter or Space to activate buttons</li>
                    <li>• Screen reader users: Enable verbose mode for detailed descriptions</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}