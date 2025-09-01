import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigation } from '../components/navigation/NavigationContext';
import toast from 'react-hot-toast';

// Enhanced keyboard shortcut interface
interface EnhancedKeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'crisis' | 'wellness' | 'accessibility' | 'search' | 'custom';
  global?: boolean;
  enabled?: boolean;
}

// Comprehensive keyboard shortcuts for mental health platform
const defaultShortcuts: EnhancedKeyboardShortcut[] = [
  // Crisis shortcuts (highest priority)
  {
    key: 'h',
    alt: true,
    action: () => window.location.href = '/crisis',
    description: 'Crisis Help (Emergency)',
    category: 'crisis',
    global: true,
  },
  {
    key: '9',
    alt: true,
    shift: true,
    action: () => window.location.href = 'tel:988',
    description: 'Call Crisis Hotline (988)',
    category: 'crisis',
    global: true,
  },
  {
    key: 't',
    alt: true,
    shift: true,
    action: () => window.location.href = 'sms:741741?body=HOME',
    description: 'Text Crisis Line',
    category: 'crisis',
    global: true,
  },
  
  // Navigation shortcuts
  {
    key: 'k',
    meta: true,
    action: () => {
      const event = new CustomEvent('openGlobalSearch');
      window.dispatchEvent(event);
    },
    description: 'Open Search',
    category: 'search',
    global: true,
  },
  {
    key: '/',
    ctrl: true,
    action: () => {
      const event = new CustomEvent('showKeyboardHelp');
      window.dispatchEvent(event);
    },
    description: 'Show Keyboard Shortcuts',
    category: 'accessibility',
    global: true,
  },
  {
    key: 'g',
    action: () => {},
    description: 'Go to... (prefix key)',
    category: 'navigation',
    global: true,
  },
  {
    key: 'd',
    action: () => window.location.href = '/dashboard',
    description: 'Go to Dashboard (g then d)',
    category: 'navigation',
  },
  {
    key: 'w',
    action: () => window.location.href = '/wellness',
    description: 'Go to Wellness (g then w)',
    category: 'navigation',
  },
  {
    key: 'c',
    action: () => window.location.href = '/community',
    description: 'Go to Community (g then c)',
    category: 'navigation',
  },
  {
    key: 'p',
    action: () => window.location.href = '/professional',
    description: 'Go to Professional Care (g then p)',
    category: 'navigation',
  },
  
  // Wellness shortcuts
  {
    key: 'm',
    alt: true,
    action: () => window.location.href = '/wellness/mood',
    description: 'Log Mood',
    category: 'wellness',
  },
  {
    key: 'j',
    alt: true,
    action: () => window.location.href = '/wellness/journal',
    description: 'Open Journal',
    category: 'wellness',
  },
  {
    key: 'b',
    alt: true,
    action: () => window.location.href = '/wellness/breathing',
    description: 'Breathing Exercise',
    category: 'wellness',
  },
  {
    key: 'd',
    alt: true,
    action: () => window.location.href = '/wellness/meditation',
    description: 'Start Meditation',
    category: 'wellness',
  },
  
  // Accessibility shortcuts
  {
    key: '0',
    alt: true,
    action: () => {
      document.body.classList.toggle('high-contrast');
      toast.success('High contrast mode toggled');
    },
    description: 'Toggle High Contrast',
    category: 'accessibility',
    global: true,
  },
  {
    key: '+',
    ctrl: true,
    action: () => {
      const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      document.documentElement.style.fontSize = `${Math.min(currentSize * 1.1, 24)}px`;
      toast.success('Text size increased');
    },
    description: 'Increase Text Size',
    category: 'accessibility',
    global: true,
  },
  {
    key: '-',
    ctrl: true,
    action: () => {
      const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      document.documentElement.style.fontSize = `${Math.max(currentSize * 0.9, 12)}px`;
      toast.success('Text size decreased');
    },
    description: 'Decrease Text Size',
    category: 'accessibility',
    global: true,
  },
  {
    key: 'Escape',
    action: () => {
      // Close any open modals or expanded panels
      const event = new CustomEvent('closeAllPanels');
      window.dispatchEvent(event);
    },
    description: 'Close/Cancel',
    category: 'navigation',
    global: true,
  },
];

// Vi-style navigation for power users
const viStyleShortcuts: EnhancedKeyboardShortcut[] = [
  {
    key: 'j',
    action: () => {
      window.scrollBy(0, 100);
    },
    description: 'Scroll down',
    category: 'navigation',
  },
  {
    key: 'k',
    action: () => {
      window.scrollBy(0, -100);
    },
    description: 'Scroll up',
    category: 'navigation',
  },
  {
    key: 'h',
    action: () => {
      history.back();
    },
    description: 'Go back',
    category: 'navigation',
  },
  {
    key: 'l',
    action: () => {
      history.forward();
    },
    description: 'Go forward',
    category: 'navigation',
  },
];

export function useEnhancedKeyboardNavigation(customShortcuts?: EnhancedKeyboardShortcut[]) {
  const navigate = useNavigate();
  const location = useLocation();
  const { preferences, setSearchOpen, mode } = useNavigation();
  const [shortcuts, setShortcuts] = useState<EnhancedKeyboardShortcut[]>([]);
  const [isGMode, setIsGMode] = useState(false);
  const [viMode, setViMode] = useState(false);
  const gModeTimeout = useRef<NodeJS.Timeout>();
  const lastKeyTime = useRef<number>(0);
  const keySequence = useRef<string[]>([]);

  // Initialize shortcuts based on preferences
  useEffect(() => {
    let activeShortcuts = [...defaultShortcuts];
    
    if (customShortcuts) {
      activeShortcuts = [...activeShortcuts, ...customShortcuts];
    }
    
    if (viMode) {
      activeShortcuts = [...activeShortcuts, ...viStyleShortcuts];
    }
    
    // Filter based on user preferences
    if (!preferences.enableKeyboardShortcuts) {
      activeShortcuts = activeShortcuts.filter(s => s.category === 'crisis');
    }
    
    setShortcuts(activeShortcuts);
  }, [customShortcuts, viMode, preferences.enableKeyboardShortcuts]);

  // Konami code Easter egg for fun mental health tips
  const checkKonamiCode = useCallback(() => {
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    const sequence = keySequence.current.slice(-10);
    
    if (sequence.join(',') === konami.join(',')) {
      toast.success('🎮 You found the secret! Remember: It\'s okay to not be okay. Take breaks and be kind to yourself!', {
        duration: 5000,
        icon: '🌟',
      });
      keySequence.current = [];
    }
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true';
    
    // Track key sequence for Easter eggs
    const now = Date.now();
    if (now - lastKeyTime.current > 2000) {
      keySequence.current = [];
    }
    keySequence.current.push(event.key);
    lastKeyTime.current = now;
    checkKonamiCode();
    
    // Handle 'g' prefix mode for navigation
    if (event.key === 'g' && !isInputField && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      if (isGMode) {
        // Double 'g' goes to top
        window.scrollTo(0, 0);
        setIsGMode(false);
        clearTimeout(gModeTimeout.current);
      } else {
        setIsGMode(true);
        gModeTimeout.current = setTimeout(() => setIsGMode(false), 2000);
      }
      return;
    }
    
    // Handle shortcuts in 'g' mode
    if (isGMode && !isInputField) {
      const gModeShortcut = shortcuts.find(s => 
        s.category === 'navigation' && 
        s.key === event.key &&
        s.description.includes('(g then')
      );
      
      if (gModeShortcut) {
        event.preventDefault();
        gModeShortcut.action();
        setIsGMode(false);
        clearTimeout(gModeTimeout.current);
        return;
      }
    }
    
    // Skip if in input field for non-global shortcuts
    if (isInputField && !shortcuts.find(s => s.key === event.key && s.global)) {
      return;
    }
    
    // Process regular shortcuts
    shortcuts.forEach(shortcut => {
      if (shortcut.enabled === false) return;
      
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const metaMatch = shortcut.meta ? (event.metaKey || event.ctrlKey) : true;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      if (ctrlMatch && altMatch && shiftMatch && metaMatch && keyMatch) {
        // Skip navigation shortcuts if in input field
        if (isInputField && shortcut.category === 'navigation' && !shortcut.global) {
          return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        // Special handling for search shortcut
        if (shortcut.description === 'Open Search') {
          setSearchOpen(true);
        } else {
          shortcut.action();
        }
        
        // Announce action for screen readers
        announceAction(shortcut.description);
      }
    });
  }, [shortcuts, isGMode, setSearchOpen, checkKonamiCode]);

  // Announce action for accessibility
  const announceAction = (action: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Action: ${action}`;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  // Listen for keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    
    // Listen for custom events
    const handleOpenSearch = () => setSearchOpen(true);
    const handleShowHelp = () => {
      const event = new CustomEvent('showKeyboardHelp');
      window.dispatchEvent(event);
    };
    
    window.addEventListener('openGlobalSearch', handleOpenSearch as EventListener);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('openGlobalSearch', handleOpenSearch as EventListener);
      clearTimeout(gModeTimeout.current);
    };
  }, [handleKeyPress, setSearchOpen]);

  // Quick navigation helpers
  const quickNavigate = useCallback((path: string) => {
    navigate(path);
    announceAction(`Navigated to ${path}`);
  }, [navigate]);

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      announceAction(`Focused on ${element.getAttribute('aria-label') || selector}`);
    }
  }, []);

  // Return enhanced navigation functions
  return {
    shortcuts,
    isGMode,
    viMode,
    setViMode,
    quickNavigate,
    focusElement,
    addShortcut: (shortcut: EnhancedKeyboardShortcut) => {
      setShortcuts(prev => [...prev, shortcut]);
    },
    removeShortcut: (key: string) => {
      setShortcuts(prev => prev.filter(s => s.key !== key));
    },
    toggleShortcut: (key: string) => {
      setShortcuts(prev => prev.map(s => 
        s.key === key ? { ...s, enabled: !s.enabled } : s
      ));
    },
  };
}

// Hook for displaying keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { shortcuts } = useEnhancedKeyboardNavigation();

  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true);
    window.addEventListener('showKeyboardHelp', handleShowHelp);
    return () => window.removeEventListener('showKeyboardHelp', handleShowHelp);
  }, []);

  const categorizedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, EnhancedKeyboardShortcut[]>);

  return {
    isOpen,
    setIsOpen,
    categorizedShortcuts,
  };
}