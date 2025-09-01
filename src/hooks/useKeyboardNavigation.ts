import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description?: string;
  global?: boolean; // Whether shortcut works everywhere or only in dashboard
}

// Predefined dashboard keyboard shortcuts
const dashboardShortcuts: KeyboardShortcut[] = [
  {
    key: 'h',
    alt: true,
    action: () => window.location.href = '/crisis',
    description: 'Open Crisis Help',
    global: true,
  },
  {
    key: 'm',
    alt: true,
    action: () => window.location.href = '/wellness/mood',
    description: 'Log Mood',
  },
  {
    key: 'j',
    alt: true,
    action: () => window.location.href = '/wellness/journal',
    description: 'Open Journal',
  },
  {
    key: 'd',
    alt: true,
    action: () => window.location.href = '/wellness/meditation',
    description: 'Start Meditation',
  },
  {
    key: 's',
    alt: true,
    action: () => {
      const scheduleWidget = document.querySelector('[aria-label*="schedule"]');
      scheduleWidget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (scheduleWidget as HTMLElement)?.focus();
    },
    description: 'Focus Schedule',
  },
  {
    key: 'w',
    alt: true,
    action: () => {
      const wellnessWidget = document.querySelector('[aria-label*="wellness"]');
      wellnessWidget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (wellnessWidget as HTMLElement)?.focus();
    },
    description: 'Focus Wellness Status',
  },
  {
    key: 'c',
    alt: true,
    action: () => {
      const crisisWidget = document.querySelector('[aria-label*="crisis"]');
      crisisWidget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (crisisWidget as HTMLElement)?.focus();
    },
    description: 'Focus Crisis Panel',
  },
  {
    key: 'q',
    alt: true,
    action: () => {
      const quickActions = document.querySelector('[aria-label*="quick action"]');
      quickActions?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (quickActions as HTMLElement)?.focus();
    },
    description: 'Focus Quick Actions',
  },
  {
    key: '/',
    ctrl: true,
    action: () => {
      // Show keyboard shortcuts help
      const event = new CustomEvent('showKeyboardHelp');
      window.dispatchEvent(event);
    },
    description: 'Show Keyboard Shortcuts',
    global: true,
  },
];

export function useKeyboardNavigation(customShortcuts?: KeyboardShortcut[]) {
  const navigate = useNavigate();
  const shortcuts = useRef<KeyboardShortcut[]>([...dashboardShortcuts, ...(customShortcuts || [])]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true') {
      return;
    }

    shortcuts.current.forEach(shortcut => {
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Return shortcuts for displaying help
  return {
    shortcuts: shortcuts.current,
    addShortcut: (shortcut: KeyboardShortcut) => {
      shortcuts.current.push(shortcut);
    },
    removeShortcut: (key: string) => {
      shortcuts.current = shortcuts.current.filter(s => s.key !== key);
    },
  };
}

// Hook for focus management
export function useFocusManagement() {
  const focusableElements = useRef<HTMLElement[]>([]);
  const currentFocusIndex = useRef(0);

  useEffect(() => {
    // Find all focusable elements in the dashboard
    const updateFocusableElements = () => {
      const elements = Array.from(document.querySelectorAll(
        'button:not([disabled]), ' +
        'a[href], ' +
        'input:not([disabled]), ' +
        'select:not([disabled]), ' +
        'textarea:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];
      
      // Sort by tabindex and document position
      focusableElements.current = elements.sort((a, b) => {
        const aIndex = parseInt(a.getAttribute('tabindex') || '0');
        const bIndex = parseInt(b.getAttribute('tabindex') || '0');
        
        if (aIndex !== bIndex) {
          if (aIndex === 0) return 1;
          if (bIndex === 0) return -1;
          return aIndex - bIndex;
        }
        
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    };

    updateFocusableElements();
    
    // Update on DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex']
    });

    return () => observer.disconnect();
  }, []);

  const moveFocus = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    const elements = focusableElements.current;
    if (elements.length === 0) return;

    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = elements.indexOf(currentElement);

    let newIndex: number;
    switch (direction) {
      case 'next':
        newIndex = currentIndex >= 0 ? (currentIndex + 1) % elements.length : 0;
        break;
      case 'previous':
        newIndex = currentIndex >= 0 ? (currentIndex - 1 + elements.length) % elements.length : elements.length - 1;
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = elements.length - 1;
        break;
    }

    currentFocusIndex.current = newIndex;
    elements[newIndex]?.focus();
  }, []);

  // Tab navigation enhancement
  useEffect(() => {
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        // Let browser handle normal tab navigation
        // but track the current focus index
        setTimeout(() => {
          const currentElement = document.activeElement as HTMLElement;
          const index = focusableElements.current.indexOf(currentElement);
          if (index >= 0) {
            currentFocusIndex.current = index;
          }
        }, 0);
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, []);

  return {
    moveFocus,
    focusFirst: () => moveFocus('first'),
    focusLast: () => moveFocus('last'),
    focusNext: () => moveFocus('next'),
    focusPrevious: () => moveFocus('previous'),
  };
}

// Hook for screen reader announcements
export function useScreenReaderAnnouncement() {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a visually hidden div for screen reader announcements
    const div = document.createElement('div');
    div.setAttribute('role', 'status');
    div.setAttribute('aria-live', 'polite');
    div.setAttribute('aria-atomic', 'true');
    div.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(div);
    announcementRef.current = div;

    return () => {
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.textContent = '';
      
      // Small delay to ensure screen reader picks up the change
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return { announce };
}

// Hook for reduced motion preferences
export function useReducedMotion() {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = mediaQuery.matches;

  useEffect(() => {
    const handleChange = (event: MediaQueryListEvent) => {
      // Could trigger a state update here if needed
      console.log('Motion preference changed:', event.matches ? 'reduced' : 'normal');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Main accessibility hook that combines all features
export function useAccessibility() {
  const keyboard = useKeyboardNavigation();
  const focus = useFocusManagement();
  const screenReader = useScreenReaderAnnouncement();
  const reducedMotion = useReducedMotion();

  return {
    keyboard,
    focus,
    screenReader,
    reducedMotion,
  };
}