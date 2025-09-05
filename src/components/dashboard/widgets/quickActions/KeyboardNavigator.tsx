import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QuickAction } from '../../../../types';
import { announce } from '../../../../services/accessibility/screenReaderService';

interface KeyboardNavigatorProps {
  actions: QuickAction[];
  isActive: boolean;
  onActionSelect: (action: QuickAction) => void;
  onKeyPress?: (key: string) => void;
  containerRef: React.RefObject<HTMLElement>;
}

export const KeyboardNavigator: React.FC<KeyboardNavigatorProps> = ({
  actions,
  isActive,
  onActionSelect,
  onKeyPress,
  containerRef
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchBuffer, setSearchBuffer] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get number of grid columns based on container width
  const getGridColumns = useCallback((): number => {
    if (!containerRef.current) return 2;
    const width = containerRef.current.offsetWidth;
    if (width < 640) return 2; // Mobile
    if (width < 1024) return 3; // Tablet
    return 4; // Desktop
  }, [containerRef]);

  // Default keyboard shortcuts
  const keyboardShortcuts: Record<string, string> = {
    'ctrl+k': 'search',
    'alt+h': 'help',
    'ctrl+/': 'shortcuts',
    'ctrl+space': 'quick_access',
    'escape': 'close'
  };

  // Grid navigation helpers
  const navigateDown = useCallback(() => {
    const columns = getGridColumns();
    setFocusedIndex(prev => {
      const newIndex = prev + columns;
      return newIndex < actions.length ? newIndex : prev;
    });
  }, [actions.length, getGridColumns]);

  const navigateUp = useCallback(() => {
    const columns = getGridColumns();
    setFocusedIndex(prev => {
      const newIndex = prev - columns;
      return newIndex >= 0 ? newIndex : prev;
    });
  }, [getGridColumns]);

  const navigateLeft = useCallback(() => {
    setFocusedIndex(prev => {
      if (prev <= 0) return actions.length - 1;
      return prev - 1;
    });
  }, [actions.length]);

  const navigateRight = useCallback(() => {
    setFocusedIndex(prev => {
      if (prev >= actions.length - 1) return 0;
      return prev + 1;
    });
  }, [actions.length]);

  // Type-ahead search functionality
  const handleTypeAheadSearch = useCallback((char: string) => {
    const newBuffer = searchBuffer + char;
    setSearchBuffer(newBuffer);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Find matching action
    const matchingIndex = actions.findIndex(action => 
      action.label.toLowerCase().startsWith(newBuffer.toLowerCase())
    );

    if (matchingIndex !== -1 && actions[matchingIndex]) {
      setFocusedIndex(matchingIndex);
      announce(`Selected ${actions[matchingIndex].label}`);
    }

    // Reset buffer after 1 second
    searchTimeoutRef.current = setTimeout(() => {
      setSearchBuffer('');
    }, 1000);
  }, [searchBuffer, actions]);

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
        if (focusedIndex >= 0 && focusedIndex < actions.length && actions[focusedIndex]) {
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
  }, [isActive, actions, focusedIndex, onActionSelect, onKeyPress, handleTypeAheadSearch, keyboardShortcuts, navigateDown, navigateLeft, navigateRight, navigateUp]);

  // Find matching action by first letter
  const findActionByLetter = (letter: string): number => {
    const lowerLetter = letter.toLowerCase();
    return actions.findIndex(action => 
      action.label.toLowerCase().startsWith(lowerLetter)
    );
  };

  // Highlight action on focus change
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < actions.length) {
      const action = actions[focusedIndex];
      
      // Announce to screen reader
      announce(`${action?.label} action selected. ${action?.description || ''}`);
      
      // Scroll into view if needed
      const element = containerRef.current?.querySelector(`[data-action-index="${focusedIndex}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex, actions, containerRef]);

  // Add/remove keyboard listeners
  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isActive, handleKeyDown]);

  // Reset focus when actions change
  useEffect(() => {
    setFocusedIndex(-1);
    setSearchBuffer('');
  }, [actions]);

  // Export focused index for parent component
  useEffect(() => {
    // Update parent component with current focus
    const element = containerRef.current;
    if (element) {
      element.setAttribute('data-focused-index', focusedIndex.toString());
    }
  }, [focusedIndex, containerRef]);

  return null; // This is a behavior-only component
};

export default KeyboardNavigator;