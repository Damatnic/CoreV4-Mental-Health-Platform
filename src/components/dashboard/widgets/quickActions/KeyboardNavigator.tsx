import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QuickAction } from '../../../../types/dashboard';

interface KeyboardNavigatorProps {
  actions: QuickAction[];
  onActionSelect: (action: QuickAction) => void;
  onKeyPress?: (key: string) => void;
  isActive: boolean;
}

export function KeyboardNavigator({
  actions,
  onActionSelect,
  onKeyPress,
  isActive
}: KeyboardNavigatorProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchBuffer, setSearchBuffer] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts map
  const keyboardShortcuts: Record<string, string> = {
    'alt+m': 'mood',
    'alt+j': 'journal',
    'alt+b': 'breathe',
    'alt+h': 'help',
    'alt+c': 'crisis',
    'alt+t': 'therapy',
    'alt+s': 'schedule',
    'alt+g': 'grounding',
    'alt+p': 'pill',
    'alt+d': 'meditation',
    'alt+v': 'voice',
    'alt+k': 'keyboard',
    'alt+?': 'shortcuts',
    'alt+/': 'search',
    'ctrl+space': 'quick_access',
    'escape': 'close'
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toLowerCase();
    const isAlt = event.altKey;
    const isCtrl = event.ctrlKey;
    const isShift = event.shiftKey;
    const isMeta = event.metaKey;

    // Construct key combination string
    let keyCombo = '';
    if (isCtrl) keyCombo += 'ctrl+';
    if (isAlt) keyCombo += 'alt+';
    if (isShift) keyCombo += 'shift+';
    if (isMeta) keyCombo += 'meta+';
    keyCombo += key;

    // Check for direct keyboard shortcuts
    if (keyboardShortcuts[keyCombo]) {
      event.preventDefault();
      onKeyPress?.(keyCombo);
      
      // Find and execute matching action
      const matchingAction = actions.find(a => 
        a.keyboard?.toLowerCase() === keyCombo ||
        a.icon === keyboardShortcuts[keyCombo]
      );
      
      if (matchingAction) {
        onActionSelect(matchingAction);
      }
      return;
    }

    // Navigation keys
    switch (key) {
      case 'arrowdown':
        event.preventDefault();
        navigateDown();
        break;
        
      case 'arrowup':
        event.preventDefault();
        navigateUp();
        break;
        
      case 'arrowleft':
        event.preventDefault();
        navigateLeft();
        break;
        
      case 'arrowright':
        event.preventDefault();
        navigateRight();
        break;
        
      case 'enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < actions.length) {
          onActionSelect(actions[focusedIndex]);
        }
        break;
        
      case 'home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
        
      case 'end':
        event.preventDefault();
        setFocusedIndex(actions.length - 1);
        break;
        
      case 'pageup':
        event.preventDefault();
        setFocusedIndex(Math.max(0, focusedIndex - 5));
        break;
        
      case 'pagedown':
        event.preventDefault();
        setFocusedIndex(Math.min(actions.length - 1, focusedIndex + 5));
        break;
        
      case 'escape':
        event.preventDefault();
        setFocusedIndex(-1);
        setSearchBuffer('');
        break;
        
      case 'tab':
        // Allow default tab behavior but track focus
        if (!event.shiftKey) {
          setFocusedIndex(prev => (prev + 1) % actions.length);
        } else {
          setFocusedIndex(prev => prev <= 0 ? actions.length - 1 : prev - 1);
        }
        break;
        
      default:
        // Type-ahead search
        if (key.length === 1 && !isCtrl && !isAlt && !isMeta) {
          handleTypeAheadSearch(key);
        }
        break;
    }
  }, [isActive, actions, focusedIndex, onActionSelect, onKeyPress]);

  // Grid navigation helpers
  const navigateDown = () => {
    const columns = getGridColumns();
    setFocusedIndex(prev => {
      const newIndex = prev + columns;
      return newIndex < actions.length ? newIndex : prev;
    });
  };

  const navigateUp = () => {
    const columns = getGridColumns();
    setFocusedIndex(prev => {
      const newIndex = prev - columns;
      return newIndex >= 0 ? newIndex : prev;
    });
  };

  const navigateLeft = () => {
    setFocusedIndex(prev => {
      if (prev <= 0) return actions.length - 1;
      return prev - 1;
    });
  };

  const navigateRight = () => {
    setFocusedIndex(prev => {
      if (prev >= actions.length - 1) return 0;
      return prev + 1;
    });
  };

  // Get number of grid columns based on container width
  const getGridColumns = (): number => {
    if (!containerRef.current) return 2;
    const width = containerRef.current.offsetWidth;
    if (width < 640) return 2; // Mobile
    if (width < 1024) return 3; // Tablet
    return 4; // Desktop
  };

  // Type-ahead search functionality
  const handleTypeAheadSearch = (char: string) => {
    const newBuffer = searchBuffer + char;
    setSearchBuffer(newBuffer);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Find matching action
    const matchIndex = actions.findIndex(action =>
      action.label.toLowerCase().startsWith(newBuffer.toLowerCase())
    );

    if (matchIndex !== -1) {
      setFocusedIndex(matchIndex);
    }

    // Reset search buffer after delay
    searchTimeoutRef.current = setTimeout(() => {
      setSearchBuffer('');
    }, 1500);
  };

  // Attach keyboard event listeners
  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }
  }, [isActive, handleKeyDown]);

  // Update focused element in DOM
  useEffect(() => {
    if (focusedIndex >= 0 && containerRef.current) {
      const buttons = containerRef.current.querySelectorAll('button[data-action-index]');
      const targetButton = buttons[focusedIndex] as HTMLElement;
      
      if (targetButton) {
        targetButton.focus();
        targetButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [focusedIndex]);

  // Announce focus changes for screen readers
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < actions.length) {
      const action = actions[focusedIndex];
      const announcement = `${action.label}. ${action.description || ''}. ${
        action.keyboard ? `Keyboard shortcut: ${action.keyboard}` : ''
      }`;
      
      // Create and announce via aria-live region
      const liveRegion = document.getElementById('keyboard-nav-announcer');
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
    }
  }, [focusedIndex, actions]);

  return (
    <>
      {/* Hidden container for tracking focus */}
      <div ref={containerRef} className="sr-only" aria-hidden="true" />
      
      {/* Live region for screen reader announcements */}
      <div
        id="keyboard-nav-announcer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Visual indicator for search buffer */}
      {searchBuffer && (
        <div className="fixed bottom-4 left-4 z-50 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg">
          <span className="text-sm">Searching: {searchBuffer}</span>
        </div>
      )}
      
      {/* Keyboard shortcuts help overlay */}
      {isActive && focusedIndex === -1 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 pointer-events-auto max-w-sm">
            <h4 className="font-semibold text-sm mb-2">Keyboard Navigation</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Arrow keys</span>
                <span className="text-gray-900">Navigate actions</span>
              </div>
              <div className="flex justify-between">
                <span>Enter/Space</span>
                <span className="text-gray-900">Select action</span>
              </div>
              <div className="flex justify-between">
                <span>Tab/Shift+Tab</span>
                <span className="text-gray-900">Move focus</span>
              </div>
              <div className="flex justify-between">
                <span>Type letters</span>
                <span className="text-gray-900">Quick search</span>
              </div>
              <div className="flex justify-between">
                <span>Alt + key</span>
                <span className="text-gray-900">Direct shortcuts</span>
              </div>
              <div className="flex justify-between">
                <span>Escape</span>
                <span className="text-gray-900">Clear focus</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}